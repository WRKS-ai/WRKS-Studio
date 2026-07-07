import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { BrandContext } from "./design-system";
import type { DesignSystem } from "./design-system";

// Page content generation — Pass 2 of the /studio/sites Stitch-style
// pipeline. Runs Claude Sonnet 4.6 against the brand_state + brief +
// generated design system and returns a strict JSON page composition
// (hero + value cards + CTA + closer).
//
// v2 (2026-06-30, Ship 2): single-page generation. Multi-page baton
// pattern lands in Ship 3 when we have real cross-page context.

const HeroSection = z.object({
  kind: z.literal("hero"),
  eyebrow: z.string().max(120).nullable().optional(),
  headline: z.string().min(1).max(240),
  subhead: z.string().min(1).max(400),
  primaryCta: z.object({
    label: z.string().min(1).max(60),
    href: z.string().min(1).max(200),
  }),
  secondaryCta: z
    .object({
      label: z.string().min(1).max(60),
      href: z.string().min(1).max(200),
    })
    .nullable()
    .optional(),
});

const ValueGridSection = z.object({
  kind: z.literal("valueGrid"),
  heading: z.string().min(1).max(240),
  cards: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(400),
      }),
    )
    .min(2)
    .max(4),
});

const AboutSection = z.object({
  kind: z.literal("about"),
  eyebrow: z.string().max(120).nullable().optional(),
  heading: z.string().min(1).max(240),
  paragraphs: z.array(z.string().min(1).max(600)).min(1).max(4),
  cta: z
    .object({
      label: z.string().min(1).max(60),
      href: z.string().min(1).max(200),
    })
    .nullable()
    .optional(),
});

const CtaSection = z.object({
  kind: z.literal("cta"),
  heading: z.string().min(1).max(240),
  subhead: z.string().min(1).max(400).nullable().optional(),
  cta: z.object({
    label: z.string().min(1).max(60),
    href: z.string().min(1).max(200),
  }),
});

const PageSection = z.discriminatedUnion("kind", [
  HeroSection,
  ValueGridSection,
  AboutSection,
  CtaSection,
]);

export const PageContentSchema = z.object({
  pageId: z.string().min(1).max(60),
  title: z.string().min(1).max(120),
  sections: z.array(PageSection).min(2).max(6),
  // Voice used by the agent when narrating this page in the left panel.
  narration: z.string().min(1).max(600),
});

export type PageContent = z.infer<typeof PageContentSchema>;
export type PageSectionData = z.infer<typeof PageSection>;

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
  return `You are the WRKS Studio page-copy agent. The user gave a brief; a design-system agent already picked their palette + typography. You now write the actual page copy that will render in the design system.

Return ONLY a single JSON object — no prose, no markdown fences.

Schema:
{
  "pageId": string,                  // matches the input
  "title": string,                   // short page title, shown in nav + browser
  "sections": Section[],             // 2 to 6 sections in the order they should render
  "narration": string                // one-paragraph agent voice explaining the page composition + why it fits this brand
}

Section is one of:

1. Hero (usually first):
{
  "kind": "hero",
  "eyebrow": string | null,          // optional small caps label above headline
  "headline": string,                // the site's core promise, one sentence
  "subhead": string,                 // one sentence supporting the headline
  "primaryCta": { "label": string, "href": string },
  "secondaryCta": { "label": string, "href": string } | null
}

2. Value grid (features / benefits):
{
  "kind": "valueGrid",
  "heading": string,                 // section headline
  "cards": [{ "title": string, "body": string }, ...]  // 2 to 4 cards
}

3. About (long-form founder / brand story):
{
  "kind": "about",
  "eyebrow": string | null,
  "heading": string,
  "paragraphs": [string, ...],       // 1 to 4 paragraphs
  "cta": { "label": string, "href": string } | null
}

4. CTA (closing call to action):
{
  "kind": "cta",
  "heading": string,
  "subhead": string | null,
  "cta": { "label": string, "href": string }
}

Quality bar — WRKS taste:
- Sound like a REAL brand, not a "trust our AI-powered platform" template. Write copy the founder would say out loud.
- Match the voice_descriptor exactly: bold = punchy short lines; warm = conversational; expert = data + specifics; quiet = restraint; playful = personality; professional = clean + precise.
- NEVER use the words: "seamlessly", "unlock", "revolutionary", "elevate", "unleash", "empower", "cutting-edge", "leverage", "next-gen", "game-changer". These are AI tells.
- Headlines are ONE CLAIM. Not "The best X for Y that also does Z."
- CTAs are actions: "Book a call", "Start free", "Get the guide" — not "Learn more".
- Use the brand's real offer + audience from the brand_state — do NOT invent generic marketing.

Section selection heuristic:
- If primary_goal is book_calls: Hero → Value grid → About → CTA
- If sell_products: Hero → Value grid → Value grid (features) → CTA
- If capture_leads: Hero → Value grid → CTA
- If build_audience: Hero → About → CTA
- Adapt within the 2-6 section budget.

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
  lines.push("Design system context (already chosen by the design agent):");
  lines.push(
    `Palette: primary=${designSystem.palette.primary.name} (${designSystem.palette.primary.hex}), ` +
      `secondary=${designSystem.palette.secondary.name}, ` +
      `tertiary=${designSystem.palette.tertiary.name}, ` +
      `neutral=${designSystem.palette.neutral.name}`,
  );
  lines.push(
    `Typography: display=${designSystem.type.display.family} ` +
      `(${designSystem.type.display.sample}); body=${designSystem.type.body.family}`,
  );
  lines.push(`Design rationale: ${designSystem.narration}`);
  return lines.join("\n");
}
