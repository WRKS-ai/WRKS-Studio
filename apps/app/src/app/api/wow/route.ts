import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  WOW_SYSTEM_PROMPT,
  WowDeliverablesSchema,
  type WowDeliverables,
} from "@/lib/wow-prompt";
import { pexelsSearch, pexelsSearchN } from "@/lib/pexels";
import { composeStyleBrief } from "@/lib/style-references";
import {
  MEMORY_KIND,
  MEMORY_SOURCE,
  createServiceSupabaseClient,
  writeMemoryEntries,
} from "@/lib/supabase";
import type { Json, TablesInsert } from "@/lib/supabase/types";

// POST /api/wow
// Takes a user's intake answers (personality, name, business, audience,
// differentiator) and returns four first-session outputs: a brand name,
// landing page hero block, three social posts (Instagram / X / LinkedIn),
// and one paid ad. Powered by Claude Sonnet 4.6 — Haiku produced safe,
// generic output for thin inputs; Sonnet gives the creative-director
// quality the brief's wow moment needs.
//
// Caching: the system prompt is the same across all users, marked
// `cache_control: ephemeral` so the prefix caches once Sonnet 4.6's
// 2048-token minimum is hit. The per-user payload (the intake answers)
// lives in the user message — invalidates nothing.

const BodySchema = z.object({
  personalityId: z.enum(["maven", "sage", "spark", "echo"]),
  agentName: z.string().min(1).max(60),
  business: z.string().min(1).max(2000),
  audience: z.string().min(1).max(2000),
  differentiator: z.string().min(1).max(2000),
  styleRefs: z.array(z.string()).max(3).optional(),
});

const client = new Anthropic();

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const userPrompt = [
    `AGENT PERSONALITY: ${body.personalityId}`,
    `AGENT NAME: ${body.agentName}`,
    ``,
    `BUSINESS: ${body.business}`,
    ``,
    `AUDIENCE: ${body.audience}`,
    ``,
    `DIFFERENTIATOR: ${body.differentiator}`,
  ].join("\n");

  // Style references are appended AFTER the cached base prompt so the
  // 2048-token cache prefix stays stable across users with different
  // style picks. Style brief content is small, ~600-1200 tokens.
  const styleBrief = composeStyleBrief(body.styleRefs ?? []);

  try {
    const response = await client.messages.parse({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: WOW_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
        ...(styleBrief
          ? [{ type: "text" as const, text: styleBrief }]
          : []),
      ],
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: zodOutputFormat(WowDeliverablesSchema),
      },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        {
          error:
            "Couldn't generate your deliverables. Try again in a moment.",
        },
        { status: 502 },
      );
    }

    const deliv = response.parsed_output;
    const brandSlug =
      deliv.brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "studio";

    // Four parallel Pexels calls — split because the hero is now a
    // full-bleed 16:9 landscape and the featured tiles below are 3:4
    // portraits. Different orientations need different searches; same
    // brand+query in different orientations rarely returns overlapping
    // photos so de-dupe is natural.
    const [[heroLandscape], featured, [instagramSquare], [adHero]] = await Promise.all([
      pexelsSearchN(
        deliv.heroImageQuery,
        "landscape",
        1,
        `${brandSlug}-hero`,
        { w: 1200, h: 675 },
      ),
      pexelsSearchN(
        deliv.heroImageQuery,
        "portrait",
        3,
        `${brandSlug}-feat`,
        { w: 600, h: 800 },
      ),
      pexelsSearchN(
        deliv.instagramImageQuery,
        "square",
        1,
        `${brandSlug}-ig`,
        { w: 800, h: 800 },
      ),
      pexelsSearchN(
        deliv.adImageQuery,
        "landscape",
        1,
        `${brandSlug}-ad`,
        { w: 1200, h: 675 },
      ),
    ]);

    // Silence unused-var lint for the convenience wrapper
    void pexelsSearch;

    // Persist the generated deliverables to the memory layer so the
    // orchestrator can recall them on future turns ("what's been built
    // for me?"). Best-effort: a Supabase hiccup here doesn't block the
    // wow page render — the user still gets their deliverables on the
    // screen, we just lose the recall hook for that session.
    void persistWowToMemory({ userId, deliv }).catch((err) => {
      console.error("[api/wow] persist failed (non-fatal):", err);
    });

    return NextResponse.json({
      deliverables: deliv,
      images: {
        heroLandscape: heroLandscape!,
        featured,
        instagramSquare: instagramSquare!,
        adHero: adHero!,
      },
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cacheRead: response.usage.cache_read_input_tokens,
        cacheCreate: response.usage.cache_creation_input_tokens,
      },
    });
  } catch (err) {
    // TEMP: surface error detail in prod too so we can debug the
    // first-ship wow page failures. Revert once stable.
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited. Try again in a moment." },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      console.error(
        `[api/wow] Anthropic ${err.status} ${err.type}: ${err.message}`,
      );
      return NextResponse.json(
        {
          error: `Anthropic ${err.status} ${err.type}: ${err.message}`,
          type: err.type,
          status: err.status,
        },
        { status: 502 },
      );
    }
    console.error("[api/wow] unexpected error:", err);
    return NextResponse.json(
      {
        error: `Unexpected: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    );
  }
}

// ============================================================
// Memory persistence
// ============================================================
// After the wow generation lands, we want the deliverables in two places:
//   1. The `deliverables` table — these are the agent's first concrete
//      outputs for this business. They land as status='staging' so the
//      brief §3.2 approval flow can promote them to 'approved' later.
//   2. The `memory_entries` table as kind='sample_output' — gets pulled
//      into the agent's prompt on future turns so it can remember what
//      it made (brief §5.3: "What has been built: every page, funnel,
//      post, and creative produced and approved").
//
// Idempotent: re-running wow (user redoes onboarding) replaces prior
// wow-generated staging deliverables and their memory entries. Anything
// the user has approved survives.
//
// We tag wow-generated rows via deliverables.framework = "wow_template"
// so we know to clear only those, not orchestrator-generated work.

const WOW_FRAMEWORK_TAG = "wow_template";

async function persistWowToMemory(args: {
  userId: string;
  deliv: WowDeliverables;
}): Promise<void> {
  const supabase = createServiceSupabaseClient();

  // Find the user's active profile. If they got to /wow without
  // completing intake, there won't be one — skip persistence (the
  // deliverables still render; we just can't tie them to a memory).
  const { data: profile, error: profileErr } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", args.userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (profileErr) throw profileErr;
  if (!profile) {
    console.warn(
      "[api/wow] no active profile for user — skipping memory persistence",
    );
    return;
  }

  const profileId = profile.id;

  // Brand name lands on the profile so the orchestrator can refer to
  // it on every future turn without a join. Always overwrite — wow
  // generation is canonical for the brand name at this point.
  const { error: brandErr } = await supabase
    .from("business_profiles")
    .update({ brand_name: args.deliv.brandName })
    .eq("id", profileId);
  if (brandErr) {
    console.error("[api/wow] brand_name update failed:", brandErr);
  }

  // Clear prior wow-generated staging deliverables + their memory
  // entries. Anything approved or rejected survives.
  await Promise.all([
    supabase
      .from("deliverables")
      .delete()
      .eq("business_profile_id", profileId)
      .eq("framework", WOW_FRAMEWORK_TAG)
      .eq("status", "staging"),
    supabase
      .from("memory_entries")
      .delete()
      .eq("business_profile_id", profileId)
      .eq("source", MEMORY_SOURCE.wowGeneration),
  ]);

  // Insert the five deliverables. Content shapes are deliberately
  // permissive (Json) — different kinds have different schemas; we
  // unify on retrieval via summarizeDeliverable() in compose.ts.
  const deliverableRows: TablesInsert<"deliverables">[] = [
    {
      business_profile_id: profileId,
      framework: WOW_FRAMEWORK_TAG,
      kind: "landing",
      status: "staging",
      content: args.deliv.landing as unknown as Json,
    },
    {
      business_profile_id: profileId,
      framework: WOW_FRAMEWORK_TAG,
      kind: "social_ig",
      status: "staging",
      content: { text: args.deliv.social.instagram } as Json,
    },
    {
      business_profile_id: profileId,
      framework: WOW_FRAMEWORK_TAG,
      kind: "social_x",
      status: "staging",
      content: { text: args.deliv.social.twitter } as Json,
    },
    {
      business_profile_id: profileId,
      framework: WOW_FRAMEWORK_TAG,
      kind: "social_li",
      status: "staging",
      content: { text: args.deliv.social.linkedin } as Json,
    },
    {
      business_profile_id: profileId,
      framework: WOW_FRAMEWORK_TAG,
      kind: "ad",
      status: "staging",
      content: args.deliv.ad as unknown as Json,
    },
  ];

  const { error: delivErr } = await supabase
    .from("deliverables")
    .insert(deliverableRows);
  if (delivErr) {
    console.error("[api/wow] deliverables insert failed:", delivErr);
    throw delivErr;
  }

  // Sample-output memory entries — one per deliverable, with a tight
  // summary so the compose pipeline can show them in the prompt
  // without bloating the token budget. Weight 0.8 — below canonical
  // intake facts (1.5) and reference picks (1.2) but in the same
  // retrieval scope.
  await writeMemoryEntries(
    supabase,
    [
      {
        kind: "landing",
        summary: `Headline: "${args.deliv.landing.headline}" / CTA: ${args.deliv.landing.primaryCta}`,
      },
      {
        kind: "social_ig",
        summary: args.deliv.social.instagram.slice(0, 240),
      },
      {
        kind: "social_x",
        summary: args.deliv.social.twitter.slice(0, 240),
      },
      {
        kind: "social_li",
        summary: args.deliv.social.linkedin.slice(0, 240),
      },
      {
        kind: "ad",
        summary: `${args.deliv.ad.headline} / ${args.deliv.ad.body} / CTA: ${args.deliv.ad.cta}`,
      },
    ].map((d) => ({
      businessProfileId: profileId,
      kind: MEMORY_KIND.sampleOutput,
      content: { kind: d.kind, summary: d.summary } as Json,
      source: MEMORY_SOURCE.wowGeneration,
      weight: 0.8,
    })),
  );

}
