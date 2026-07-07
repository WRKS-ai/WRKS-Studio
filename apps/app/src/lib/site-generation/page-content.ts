import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { BrandContext } from "./design-system";
import type { DesignSystem } from "./design-system";

// Page content generation — Pass 2 of the /studio/sites Stitch-style
// pipeline. Runs Claude Sonnet 4.6 against the brand_state + brief +
// generated design system and returns page content that matches a
// SUBSET of the Bill-Fanter template's slot shape.
//
// Schema alignment: 4 core sections (Hero, HelpGrid, About, Closing)
// map 1:1 to Bill-Fanter's HeroContent + HelpGridContent +
// AboutBillContent + ClosingContent (with fields the AI can actually
// generate without needing images we don't yet have). Sections with
// heavy image/video dependencies (MegaBento, Reviews wall,
// VideoTestimonials, YoutubeCta, Watchlist) come online after the
// image pipeline ships.

// ============================================================
// Atom slots (mirror templates/bill-fanter/src/data/content.schema.ts
// with generous string maxes — real cap is max_tokens on the API).
// ============================================================
const CtaSlot = z.object({
  label: z.string().min(1).max(120),
  href: z.string().min(1).max(400),
});

const StarTrustSlot = z.object({
  label: z.string().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  count: z.string().min(1).max(120),
});

const NamecardSlot = z.object({
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(200),
});

const IconCardSlot = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(800),
});

// ============================================================
// Section content types (Bill-Fanter shape subset)
// ============================================================
const HeroContent = z.object({
  headline: z.string().min(1).max(400),
  subhead: z.string().min(1).max(800),
  primaryCta: CtaSlot,
  secondaryCta: CtaSlot,
  trust: StarTrustSlot,
  namecard: NamecardSlot,
});

const HelpGridContent = z.object({
  heading: z.string().min(1).max(400),
  cards: z.array(IconCardSlot).min(2).max(4),
});

const AboutContent = z.object({
  eyebrow: z.string().min(1).max(200),
  heading: z.string().min(1).max(400),
  paragraphs: z.array(z.string().min(1).max(1200)).min(2).max(5),
  cta: CtaSlot,
});

const ClosingContent = z.object({
  heading: z.string().min(1).max(400),
  lead: z.string().min(1).max(800),
  trust: StarTrustSlot,
  pills: z.array(CtaSlot).min(3).max(6),
});

export const PageContentSchema = z.object({
  pageId: z.string().min(1).max(60),
  title: z.string().min(1).max(200),
  hero: HeroContent,
  helpGrid: HelpGridContent,
  about: AboutContent,
  closing: ClosingContent,
  // Agent's rationale, streamed into the left narration panel.
  narration: z.string().min(1).max(1600),
});

export type PageContent = z.infer<typeof PageContentSchema>;

export async function generatePageContent({
  brief,
  brand,
  designSystem,
  pageId,
}: {
  brief: string;
  brand: BrandContext;
  designSystem: DesignSystem;
  pageId: string;
}): Promise<PageContent> {
  const anthropic = new Anthropic();
  const result = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildUserMessage({ brief, brand, designSystem, pageId }),
      },
    ],
  });
  const block = result.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Sonnet returned no text content");
  }
  const stripped = block.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(stripped);
  const validated = PageContentSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Page content schema validation failed: ${validated.error.message}`,
    );
  }
  return validated.data;
}

function buildSystemPrompt(): string {
  return `You are the WRKS Studio page-copy agent. The user gave a brief; a design agent already picked their palette + typography. You now write the actual page copy, structured for the Bill-Fanter WRKS template.

Return ONLY a single JSON object — no prose, no markdown fences.

Schema — mirrors the Bill-Fanter template's content slots (subset that works without images):

{
  "pageId": string,             // matches the input
  "title": string,              // short page title
  "hero": {
    "headline": string,         // ONE core promise, big display type
    "subhead": string,          // one sentence supporting the headline
    "primaryCta": { "label": string, "href": string },
    "secondaryCta": { "label": string, "href": string },
    "trust": { "label": string, "rating": 5, "count": string },
    "namecard": { "name": string, "role": string }   // founder name + one credential
  },
  "helpGrid": {
    "heading": string,          // "Trade options with confidence and grow your income" style
    "cards": [{ "title": string, "body": string }, ... ]  // 3 cards (typical), max 4
  },
  "about": {
    "eyebrow": string,          // "Meet your mentor" small caps label
    "heading": string,          // "Hi, I'm {founder}. I'm excited to get to know you." style
    "paragraphs": [string, ...], // 3-5 paragraphs, founder's own words
    "cta": { "label": string, "href": string }
  },
  "closing": {
    "heading": string,          // dark closing block headline
    "lead": string,             // one sentence lead
    "trust": { "label": string, "rating": 5, "count": string },
    "pills": [{ "label": string, "href": string }, ... ]  // 4-5 glass CTAs
  },
  "narration": string           // 2-3 sentences: why THIS layout for THIS brand
}

Quality bar — WRKS taste (READ CAREFULLY):

- Sound like a REAL brand, not a "trust our AI-powered platform" template. Write copy the founder would say out loud.
- Match voice_descriptor exactly: bold = punchy short lines; warm = conversational; expert = data + specifics; quiet = restraint; playful = personality; professional = clean + precise.
- BANNED WORDS: seamlessly, unlock, revolutionary, elevate, unleash, empower, cutting-edge, leverage, next-gen, game-changer, transform (as filler), journey, ecosystem. These are AI tells.
- Headlines are ONE CLAIM. Never "The best X for Y that also does Z."
- CTAs are actions: "Book a call", "Start free", "Get the guide" — never "Learn more" alone.
- Use the brand's REAL offer + audience from the brand_state. Do NOT invent generic marketing.
- Trust rows: use the count field for the real social proof if provided ("1,600+ Students", "40+ clients served") — otherwise pick something honest and modest.
- Namecard: put the founder's name + ONE credential (former role, years experience, notable client). Not fluff.

Section-specific guidance:

- HERO — big display headline, one supporting sentence subhead, primary CTA + a lower-friction secondary. Trust row (star rating 5, count string). Namecard names the founder + role.
- HELPGRID — 3 short value cards. Each card = one concrete outcome the visitor gets. Card body 1-2 sentences MAX.
- ABOUT — long-form founder voice. Eyebrow like "Meet your mentor" / "About the founder". Heading is warm + personal ("Hi, I'm X"). 3-5 paragraphs telling the founder's story, why they built this, what they teach. Ends with a soft CTA.
- CLOSING — dark block. Headline is a call-to-action framing. Lead is one line. Trust row. Pills are 4-5 quick links (Book a call / About / Contact / etc.) that let the visitor pick their next step.

Return strictly valid JSON. No trailing commas.`;
}

function buildUserMessage({
  brief,
  brand,
  designSystem,
  pageId,
}: {
  brief: string;
  brand: BrandContext;
  designSystem: DesignSystem;
  pageId: string;
}): string {
  const lines: string[] = [
    `Page to generate: ${pageId}`,
    `Brief: ${brief}`,
  ];
  if (brand.brandName) lines.push(`Brand name: ${brand.brandName}`);
  if (brand.businessType) lines.push(`Business type: ${brand.businessType}`);
  if (brand.primaryGoal) lines.push(`Primary goal: ${brand.primaryGoal}`);
  if (brand.voiceDescriptor) lines.push(`Voice: ${brand.voiceDescriptor}`);
  if (brand.offerSummary) lines.push(`Offer: ${brand.offerSummary}`);
  if (brand.audienceDescription)
    lines.push(`Audience: ${brand.audienceDescription}`);
  if (brand.differentiator) lines.push(`Edge: ${brand.differentiator}`);
  lines.push("");
  lines.push("Design system context (already chosen):");
  lines.push(
    `Palette: primary=${designSystem.palette.primary.name} (${designSystem.palette.primary.hex}), ` +
      `secondary=${designSystem.palette.secondary.name}, ` +
      `tertiary=${designSystem.palette.tertiary.name}, ` +
      `neutral=${designSystem.palette.neutral.name}`,
  );
  lines.push(
    `Typography: display=${designSystem.type.display.family} — ${designSystem.type.display.sample}`,
  );
  lines.push(`Design rationale: ${designSystem.narration}`);
  return lines.join("\n");
}
