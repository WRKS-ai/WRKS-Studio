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
  1. DESIGN.md — global taste + bans + tokens.
  2. A page composition file — which sections render + page-level rules.
  3. Section specification files — one per section, with wrapper dims, per-element CSS, copy rules, content schema, fallbacks, assembled HTML reference.
  4. The user's brief.
  5. The user's brand data — onboarding + optional deep-ingest from their URL: palette, typefaces, logo, hero image, existing headline, testimonials, verticals.

Your job: emit ONE complete HTML5 document rendering the full homepage.

# OUTPUT FORMAT

- ONLY the HTML doc, wrapped in a single \`\`\`html fenced block. No prose before or after.
- Start with \`<!DOCTYPE html>\`.
- ONE \`<head>\` with: meta charset + viewport, title, meta description, OG tags, favicon, preconnect + Google Fonts, Tailwind CDN (\`https://cdn.tailwindcss.com\`), ONE inline \`<style>\` block for section CSS + CSS variables.
- Prefer Tailwind utilities for common spacing/layout; put complex/reused CSS in the \`<style>\` block with semantic class names (\`.hero\`, \`.mega-tile\`). DO NOT inline every element's styles — verbose markup wastes tokens and clips sections.

# SECTION ORDER (all required unless fallback drops)

Nav → Hero → MegaBento → Watchlist → Community → HelpGrid → Spotlight → HeroSplit → Reviews → YoutubeCta → AboutFounder → Footer.

# NAV — SPECIFIC INSTRUCTIONS (this is where past generations underdelivered)

The nav.md spec describes an interactive CardNav with hover-dropdown colored cards. That interactive pattern needs React state; you're emitting static HTML, so DO THIS INSTEAD:

- Fixed 72px bar, overlays hero, white bg (or dark bg if hero is light).
- Brand LEFT: logo image (from brand.logo.src) OR brand name as 18px bold Geist wordmark.
- 3-4 nav links CENTER: font-size 15px, weight 500, gap 24px, color inherited from bar (dark on white, white on dark). NO dropdowns — flat links only. Sample: "Work with me", "Coaching", "About", "Reviews".
- Right end: optional "Log in" text link + primary CTA pill button matching hero primary CTA copy.
- Add a subtle backdrop-blur if you want depth: \`background: rgba(255,255,255,0.72); backdrop-filter: blur(20px);\` — reads premium without needing JS.
- NO hamburger menu (mobile treatment is fine but not required for the desktop preview).

# HERO — SPECIFIC INSTRUCTIONS (this is where past generations underdelivered)

- Use the hero-dark-portrait-split structure from hero.md.
- If brand.ingest.heroImage OR a founder photo URL is available: use it as the portrait, absolute-positioned on the right column at \`left: min(65vw, calc((100vw - 1440px) / 2 + 937px))\`.
- If NO portrait image is available: DO NOT use a palette-gradient blob. Instead render the portrait area as a subtle textured surface:
    * Layer 1: dark base \`#141418\`
    * Layer 2: radial gradient at 40% 60% \`rgba(255,255,255,0.06)\` → transparent (soft light spot)
    * Layer 3: subtle noise via CSS: \`background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.05'/></svg>")\`
    * Layer 4: the founder's INITIALS in Geist Mono, 200-300px, weight 500, positioned bottom-right at 12% opacity — abstract branding cue, not a lame monogram.
    * Layer 5: the namecard bubble at bottom-left of the portrait area (per hero.md §7) — anchor with the founder name + role.
- The above no-photo treatment reads as EDITORIAL, not TEMPLATE. Never emit a plain colored blob.

# STYLE RULES (non-negotiable)

- Copy follows each section's rules (char counts, voice, structure). Never emit banned words from DESIGN.md.
- Palette hard-constrained to brand_palette when supplied. Otherwise derive from voice_descriptor.
- Typography: Geist + Geist Mono unless brand ingest strongly indicates otherwise.
- Every editable element: \`data-edit-id="section.slot"\`.
- Every image: meaningful \`alt\` (or empty for decorative).
- Semantic HTML5: \`<header>\`, \`<main>\`, \`<section>\`, \`<nav>\`, \`<footer>\`.
- Apply section-MD fallback rules when data is missing.
- NEVER italics. NEVER uppercase in body copy. NEVER exclamation marks.
- No external JS bundle. No analytics.
- CRITICAL: output MUST include closing \`</main>\`, \`<footer>...</footer>\`, \`</body></html>\`. Every homepage needs a footer — emit one with: brand mark, 3 nav columns (Company, Learn, Legal), and a © line. Compact styles.

# LENGTH

Target 40,000–60,000 chars of compact HTML for all sections + footer. If you feel you're running long, TIGHTEN INLINE STYLES (move to \`<style>\` block), don't drop sections. Never truncate.`;
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
