import Anthropic from "@anthropic-ai/sdk";
import type { BrandContext } from "./design-system";
import type { IngestedBrand } from "./brand-ingest";
import { loadBlueprints } from "./blueprint-loader";

// The v3 pipeline: Opus 4.7 reads the blueprint MDs + ingested brand
// data + user brief, and returns ONE complete HTML5 document.
//
// Design choice: single-pass full-document generation rather than
// per-section calls. Reasons:
//   - Opus 4.7 with 1M context handles the full blueprint bundle
//     (~11K MD lines) plus brand data in one prompt comfortably.
//   - One call means the model sees the full page and can maintain
//     copy consistency across sections (headline, trust, CTAs, etc.).
//   - Per-section calls would require assembly logic + risk copy
//     drift between sections.
//
// The trade-off: single long call (~90-180s expected). This is why
// the SSE route heartbeats every 10s to keep the connection alive.

export const GENERATION_MODEL = "claude-opus-4-7";
// A full 10-section HTML doc empirically lands around 45-70K chars
// (~15-22K tokens). Opus 4.7 supports 32K output; using the ceiling
// so we never truncate mid-section. Cost is billed per output token,
// so the max only matters if the model actually needs it.
const MAX_OUTPUT_TOKENS = 32_000;

export type GenerateInput = {
  brief: string;                              // user's one-liner
  brand: BrandContext;                        // from business_profiles
  ingest: IngestedBrand | null;               // deep-ingested facts, or null if no URL
};

export type GenerateResult = {
  html: string;                               // the complete <!DOCTYPE html>… document
  modelUsage: {
    inputTokens: number;
    outputTokens: number;
  };
};

export type StreamProgress = (event: {
  kind: "delta";
  text: string;
  totalChars: number;
}) => void;

export async function generateHtmlDocument(
  input: GenerateInput,
  onProgress?: StreamProgress,
): Promise<GenerateResult> {
  const bundle = loadBlueprints();
  const anthropic = new Anthropic();

  const system = buildSystemPrompt();
  const user = buildUserPrompt(input, bundle);

  // The SDK requires streaming for any call that MAY exceed 10 minutes.
  // Opus at 32K output tokens crosses that threshold. Streaming here is
  // also useful because it lets the SSE route emit progress ticks to
  // the canvas without a giant single-message wait.
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const stream = anthropic.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system,
    messages: [{ role: "user", content: user }],
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      fullText += chunk.delta.text;
      onProgress?.({
        kind: "delta",
        text: chunk.delta.text,
        totalChars: fullText.length,
      });
    } else if (chunk.type === "message_start" && chunk.message.usage) {
      inputTokens = chunk.message.usage.input_tokens;
    } else if (chunk.type === "message_delta" && chunk.usage) {
      outputTokens = chunk.usage.output_tokens;
    }
  }

  const html = extractHtml(fullText);

  return {
    html,
    modelUsage: {
      inputTokens,
      outputTokens,
    },
  };
}

// ============================================================
// Prompt assembly
// ============================================================

function buildSystemPrompt(): string {
  return `You are the site-generation model for WRKS Studio. You receive:
  1. A DESIGN.md file — the global taste system + non-negotiable bans + tokens.
  2. A page composition file — which sections render, in what order, with what page-level rules.
  3. A set of section specification files — each one is a self-contained spec for one section (wrapper dimensions, per-element CSS, copy writing rules, content-slot schema, fallbacks, assembled HTML reference, responsive behavior, accessibility, rationale, and don'ts).
  4. The user's brief — one sentence about what this site is for.
  5. The user's brand data — pulled from onboarding + (optionally) deep-ingested from their existing URL: palette, typefaces, logo, hero image, existing headline, testimonials, verticals detected.

Your job: emit ONE complete, self-contained HTML5 document that renders the entire homepage — ALL 10 sections. Never stop early.

RULES (non-negotiable):

- Emit ONLY the HTML document. Wrap the entire output in a single \`\`\`html fenced code block. No explanations before or after.
- Start with \`<!DOCTYPE html>\`.
- Include ONE \`<head>\` with: meta charset + viewport, title, meta description, OG tags (title, description, image, type), favicon, preconnect + Google Fonts stylesheet link, Tailwind CDN script (\`https://cdn.tailwindcss.com\`), and ONE inline \`<style>\` block. Put ALL section styles in the \`<style>\` block using semantic class names (\`.hero\`, \`.mega-tile\`, etc.) — DO NOT inline every element's styles. Inline styles are ONLY for CSS variables (\`:root\`) and for brand-token overrides that can't be classes.
- Prefer Tailwind utility classes for spacing/layout/typography where reasonable; use custom classes in the \`<style>\` block for complex per-section CSS (grids, animations, gradients).
- Every section from the composition file MUST render, in the exact order specified, unless the fallback matrix says to drop it. Sections: Nav → Hero → MegaBento → Watchlist → Community → HelpGrid → Spotlight → HeroSplit → Reviews → YoutubeCta → AboutFounder.
- Follow each section's SEMANTIC structure and layout rules — but you may abbreviate the inline styles from the "assembled HTML reference" (that reference is verbose for documentation clarity). Same layout, tighter markup.
- Copy MUST follow each section's copy writing rules (character counts, word counts, voice). Never emit banned copy words from DESIGN.md.
- Palette MUST be hard-constrained to the user's brand_palette when supplied. If ingested colors are provided, use them; otherwise derive from voice_descriptor per DESIGN.md.
- Typography: use Geist + Geist Mono unless brand ingest indicates otherwise.
- Every editable element gets \`data-edit-id="section.slot"\`.
- Every image gets meaningful \`alt\` (or empty for decorative).
- Emit semantic HTML5: \`<header>\`, \`<main>\`, \`<section>\`, \`<nav>\`, \`<footer>\`.
- If data is missing (no testimonials, no video, no hero image), apply the fallback rules from that section's MD.
- NEVER use italics. NEVER use uppercase in body copy. NEVER use exclamation marks.
- Do not include any external JS bundle. Do not include analytics tags.
- CRITICAL: your output MUST include the closing \`</body></html>\` — if you feel you are running long, tighten inline styles, don't drop sections.

Length target: 40,000–60,000 characters of compact HTML for all 10 sections. Return the full document; never truncate.`;
}

function buildUserPrompt(input: GenerateInput, bundle: ReturnType<typeof loadBlueprints>): string {
  const { brief, brand, ingest } = input;

  // Compose the brand-data JSON that Opus will use as the source of truth
  const brandData = {
    onboarding: {
      brandName: brand.brandName,
      businessType: brand.businessType,
      primaryGoal: brand.primaryGoal,
      voiceDescriptor: brand.voiceDescriptor,
      offerSummary: brand.offerSummary,
      audienceDescription: brand.audienceDescription,
      differentiator: brand.differentiator,
      existingSiteUrl: brand.existingSiteUrl,
    },
    ingest: ingest
      ? {
          url: ingest.url,
          existingHeadline: ingest.existingHeadline,
          existingSubhead: ingest.existingSubhead,
          logo: ingest.logo,
          heroImage: ingest.heroImage,
          favicon: ingest.favicon,
          palette: ingest.palette.colors,
          typefaces: ingest.typefaces,
          testimonials: ingest.testimonials,
          socialLinks: ingest.socialLinks,
          detectedVerticals: ingest.detectedVerticals,
        }
      : null,
  };

  return [
    "# 1. DESIGN.md (global taste system)",
    "",
    bundle.design,
    "",
    "---",
    "",
    "# 2. Composition file — page-level plan",
    "",
    bundle.composition,
    "",
    "---",
    "",
    "# 3. Section specifications",
    "",
    "## Section 0 — Nav",
    bundle.sections.nav,
    "",
    "## Section 1 — Hero",
    bundle.sections.hero,
    "",
    "## Section 2 — MegaBento",
    bundle.sections.megaBento,
    "",
    "## Section 3 — Watchlist",
    bundle.sections.watchlist,
    "",
    "## Section 4 — Community",
    bundle.sections.community,
    "",
    "## Section 5 — HelpGrid",
    bundle.sections.helpGrid,
    "",
    "## Section 6 — Spotlight",
    bundle.sections.spotlight,
    "",
    "## Section 7 — HeroSplit",
    bundle.sections.heroSplit,
    "",
    "## Section 8 — Reviews",
    bundle.sections.reviews,
    "",
    "## Section 9 — YoutubeCta",
    bundle.sections.youtubeCta,
    "",
    "## Section 10 — AboutFounder",
    bundle.sections.aboutFounder,
    "",
    "---",
    "",
    "# 4. User brief",
    "",
    `> ${brief}`,
    "",
    "---",
    "",
    "# 5. Brand data (source of truth for palette, typography, copy hints, testimonials)",
    "",
    "```json",
    JSON.stringify(brandData, null, 2),
    "```",
    "",
    "---",
    "",
    "# Task",
    "",
    "Generate the complete HTML5 document for this brand's homepage. Return ONLY the fenced code block starting with ```html and ending with ```. Nothing before, nothing after.",
  ].join("\n");
}

// ============================================================
// Response parsing
// ============================================================

function extractHtml(text: string): string {
  // Opus typically wraps the doc in ```html … ``` per the system prompt.
  // Be tolerant of leading/trailing prose and code-fence variations.
  const fenced = /```html\s*([\s\S]*?)```/i.exec(text);
  if (fenced && fenced[1]) return fenced[1].trim();

  // If no fence but starts with doctype, take from doctype onward
  const doctypeIdx = text.toLowerCase().indexOf("<!doctype html");
  if (doctypeIdx >= 0) return text.slice(doctypeIdx).trim();

  // Last resort: return raw text — may render as text/plain but at least
  // the caller sees what came back.
  return text.trim();
}
