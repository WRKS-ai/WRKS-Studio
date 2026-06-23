import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase";
import type { TablesInsert } from "@/lib/supabase";

type BusinessProfileInsert = TablesInsert<"business_profiles">;

// POST /api/ingest/site
//
// Called by /onboarding/business card 1 when the user pastes their
// website URL. Fetches the page, strips HTML, sends the visible text
// to Claude Haiku for structured extraction, returns hints to pre-fill
// the rest of the onboarding cards + writes them straight to brand_state
// so the agent prompt picks them up on next turn.
//
// The fields we extract here directly map to the picker options on
// cards 2-5 (business_type / primary_goal / traffic_sources /
// voice_descriptor) plus narrative fields the agent prompt uses
// (offer_summary / audience_description / differentiator /
// competitor_urls). All extraction is best-effort — if Claude is
// uncertain about a picker value, the field returns null and the user
// picks it manually on the card.

export const runtime = "nodejs";
// 30s budget: fetch (5s typical) + Haiku extraction (10-15s) + write
// (1s). Vercel free tier caps at 60s on Node runtime so this is safe.
export const maxDuration = 30;

const Body = z.object({
  url: z.string().trim().min(1).max(2000),
});

const BUSINESS_TYPES = [
  "service",
  "ecommerce",
  "saas",
  "agency",
  "personal_brand",
  "other",
] as const;
const PRIMARY_GOALS = [
  "book_calls",
  "sell_products",
  "capture_leads",
  "build_audience",
  "launch_new",
  "fix_conversions",
] as const;
const TRAFFIC_SOURCES = [
  "paid_ads",
  "seo",
  "social",
  "email",
  "referrals",
  "cold_outreach",
  "press",
] as const;
const VOICE_DESCRIPTORS = [
  "professional",
  "bold",
  "warm",
  "expert",
  "playful",
  "quiet",
] as const;

// Picker-aligned extraction shape — what the cards expect to read back.
// All fields nullable: Claude only fills what's clearly inferable.
type ExtractedBrand = {
  business_type: (typeof BUSINESS_TYPES)[number] | null;
  primary_goal: (typeof PRIMARY_GOALS)[number] | null;
  traffic_sources: (typeof TRAFFIC_SOURCES)[number][] | null;
  voice_descriptor: (typeof VOICE_DESCRIPTORS)[number] | null;
  brand_name: string | null;
  offer_summary: string | null;
  audience_description: string | null;
  differentiator: string | null;
  competitor_urls: string[] | null;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Invalid body";
    return NextResponse.json(
      { error: "Invalid ingest payload", detail },
      { status: 400 },
    );
  }

  // Normalize the URL — accept "wrksonline.com", "https://x.com", etc.
  let target: URL;
  try {
    const raw = body.url.startsWith("http") ? body.url : `https://${body.url}`;
    target = new URL(raw);
  } catch {
    return NextResponse.json(
      { error: "URL doesn't parse as a valid web address" },
      { status: 400 },
    );
  }

  // Fetch the page with a 5s timeout. Custom UA so well-behaved sites
  // don't bot-block us, but no aggressive impersonation.
  let html = "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "WRKS-Studio-Ingest/1.0 (+https://app.slightwrks.com) Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Site returned ${res.status} when we tried to read it` },
        { status: 422 },
      );
    }
    html = await res.text();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Couldn't reach that URL", detail },
      { status: 422 },
    );
  }

  // Strip HTML → readable text. Crude but effective for extraction
  // purposes (Claude reads through residual tags fine, but trimming
  // saves tokens).
  const text = stripHtml(html).slice(0, 12_000);
  const title = extractTitle(html);
  const ogDescription = extractMetaContent(html, "og:description");
  const metaDescription = extractMetaContent(html, "description");

  // Run Claude Haiku to extract. Haiku is the right call here — fast,
  // cheap, plenty smart for structured extraction.
  const anthropic = new Anthropic();

  let extracted: ExtractedBrand;
  try {
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: buildExtractionSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildExtractionUserMessage({
            url: target.toString(),
            title,
            ogDescription,
            metaDescription,
            text,
          }),
        },
      ],
    });
    const block = result.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Claude returned no text content");
    }
    extracted = parseClaudeJson(block.text);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Extraction failed", detail },
      { status: 502 },
    );
  }

  // Persist the extraction directly to brand_state so the agent prompt
  // picks it up on the next turn — and so subsequent onboarding cards
  // open pre-filled. Upsert by user_id; if a profile already exists,
  // PATCH the new fields without clobbering anything the user typed.
  const supabase = createServiceSupabaseClient();
  const { data: existing } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const updateFields: Partial<BusinessProfileInsert> = {
    existing_site_url: target.toString(),
    voice_origin: "extracted_from_url",
  };
  if (extracted.brand_name) updateFields.brand_name = extracted.brand_name;
  if (extracted.business_type) updateFields.business_type = extracted.business_type;
  if (extracted.primary_goal) updateFields.primary_goal = extracted.primary_goal;
  if (extracted.traffic_sources && extracted.traffic_sources.length > 0) {
    updateFields.traffic_sources = extracted.traffic_sources;
  }
  if (extracted.voice_descriptor) {
    updateFields.voice_descriptor = extracted.voice_descriptor;
  }
  if (extracted.offer_summary) updateFields.offer_summary = extracted.offer_summary;
  if (extracted.audience_description) {
    updateFields.audience_description = extracted.audience_description;
  }
  if (extracted.differentiator) {
    updateFields.differentiator = extracted.differentiator;
  }
  if (extracted.competitor_urls && extracted.competitor_urls.length > 0) {
    updateFields.competitor_urls = extracted.competitor_urls;
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from("business_profiles")
      .update(updateFields)
      .eq("id", existing.id);
    if (updateErr) {
      console.error("[api/ingest/site] update failed:", updateErr);
      return NextResponse.json(
        { error: "Couldn't save extracted brand state", detail: updateErr.message },
        { status: 500 },
      );
    }
  } else {
    const insertRow: BusinessProfileInsert = {
      user_id: userId,
      ...updateFields,
    };
    const { error: insertErr } = await supabase
      .from("business_profiles")
      .insert(insertRow);
    if (insertErr) {
      console.error("[api/ingest/site] insert failed:", insertErr);
      return NextResponse.json(
        { error: "Couldn't save extracted brand state", detail: insertErr.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    url: target.toString(),
    extracted,
    persisted: true,
  });
}

// ============================================================
// HTML helpers — crude regex extraction, sufficient for our purposes.
// Production would use a real parser; for first-pass extraction this
// is fine and avoids dragging in cheerio.
// ============================================================

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | null {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m && m[1] ? m[1].trim() : null;
}

function extractMetaContent(html: string, key: string): string | null {
  // og:description, description, etc. — both name= and property= variants.
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key.replace(":", "[:]")}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = re.exec(html);
  return m && m[1] ? m[1].trim() : null;
}

function parseClaudeJson(text: string): ExtractedBrand {
  // Claude may wrap JSON in a code fence. Strip fence then parse.
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(stripped) as Record<string, unknown>;

  const pickEnum = <T extends readonly string[]>(
    value: unknown,
    canon: T,
  ): T[number] | null => {
    if (typeof value !== "string") return null;
    return (canon as readonly string[]).includes(value)
      ? (value as T[number])
      : null;
  };
  const pickStringArray = (value: unknown): string[] | null => {
    if (!Array.isArray(value)) return null;
    const cleaned = value
      .filter((v): v is string => typeof v === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned : null;
  };
  const pickEnumArray = <T extends readonly string[]>(
    value: unknown,
    canon: T,
  ): T[number][] | null => {
    const arr = pickStringArray(value);
    if (!arr) return null;
    const filtered = arr.filter((s): s is T[number] =>
      (canon as readonly string[]).includes(s),
    );
    return filtered.length > 0 ? filtered : null;
  };
  const pickString = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  return {
    business_type: pickEnum(parsed.business_type, BUSINESS_TYPES),
    primary_goal: pickEnum(parsed.primary_goal, PRIMARY_GOALS),
    traffic_sources: pickEnumArray(parsed.traffic_sources, TRAFFIC_SOURCES),
    voice_descriptor: pickEnum(parsed.voice_descriptor, VOICE_DESCRIPTORS),
    brand_name: pickString(parsed.brand_name),
    offer_summary: pickString(parsed.offer_summary),
    audience_description: pickString(parsed.audience_description),
    differentiator: pickString(parsed.differentiator),
    competitor_urls: pickStringArray(parsed.competitor_urls),
  };
}

// ============================================================
// Claude prompts
// ============================================================

function buildExtractionSystemPrompt(): string {
  return `You are a brand-extraction agent for WRKS Studio. The user pasted their website URL; you read the page and return a strict JSON object that pre-fills their onboarding cards.

Return ONLY a single JSON object — no prose, no markdown fences, no commentary. Every field is nullable; emit null when the page doesn't give you enough signal to be confident. Don't guess.

Schema:
{
  "brand_name": string | null,           // The business name as it appears on the page (not the domain).
  "business_type": "service" | "ecommerce" | "saas" | "agency" | "personal_brand" | "other" | null,
  "primary_goal": "book_calls" | "sell_products" | "capture_leads" | "build_audience" | "launch_new" | "fix_conversions" | null,
  "traffic_sources": Array<"paid_ads" | "seo" | "social" | "email" | "referrals" | "cold_outreach" | "press"> | null,  // What the site actively pursues; e.g. visible Meta Pixel + ad copy → "paid_ads"; visible newsletter signup → "email"; visible "as seen in" press logos → "press".
  "voice_descriptor": "professional" | "bold" | "warm" | "expert" | "playful" | "quiet" | null,  // Tone of the copy.
  "offer_summary": string | null,         // ONE sentence: what they sell, to whom, with what benefit. Lift the user's own words when possible.
  "audience_description": string | null,  // ONE sentence: who their typical customer is. Lift from any "who it's for" copy.
  "differentiator": string | null,        // ONE sentence: what makes them different (the wedge). Lift from any "why us" copy.
  "competitor_urls": string[] | null      // Any URLs the page mentions as competitors / "vs" pages. Often empty.
}

Map carefully:
- "book_calls" = consultation, discovery call, demo request, sales call as the primary CTA.
- "sell_products" = direct e-commerce checkout / add to cart.
- "capture_leads" = lead magnet, free guide, opt-in form as primary CTA.
- "build_audience" = newsletter / followers / community as primary CTA.
- "launch_new" = pre-launch, waitlist, coming-soon page.
- "fix_conversions" = NEVER infer from the public site — only the user knows. Always null here.

Map voice carefully:
- "professional" = Stripe / McKinsey vibe (clean, neutral, precise).
- "bold" = Liquid Death / contrarian, punchy.
- "warm" = Mailchimp / Trader Joe's, conversational, friendly.
- "expert" = Bloomberg / a16z, data-driven, analytical.
- "playful" = Notion / Duolingo, creative, illustrated.
- "quiet" = Aesop / Apple, minimalist, restrained.

If a field is uncertain, return null. Never invent.`;
}

function buildExtractionUserMessage(args: {
  url: string;
  title: string | null;
  ogDescription: string | null;
  metaDescription: string | null;
  text: string;
}): string {
  return [
    `URL: ${args.url}`,
    args.title ? `Page title: ${args.title}` : null,
    args.ogDescription ? `OG description: ${args.ogDescription}` : null,
    args.metaDescription ? `Meta description: ${args.metaDescription}` : null,
    "",
    "Page text (HTML stripped, truncated to 12k chars):",
    args.text,
  ]
    .filter(Boolean)
    .join("\n");
}
