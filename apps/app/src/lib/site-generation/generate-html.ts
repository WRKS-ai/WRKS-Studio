import Anthropic from "@anthropic-ai/sdk";
import type { BrandContext } from "./design-system";
import type { IngestedBrand } from "./brand-ingest";
import type { ImagePack } from "./image-curator";
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
  imagePack: ImagePack;                       // pre-curated Pexels photos for hero + tiles
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

# SECTION SPACING — CRITICAL

EVERY \`<section>\` gets top+bottom padding to separate it from its neighbours. Zero exceptions.

- Standard content sections (Nav, Hero excepted): \`padding: 100px 0;\` on the section, with an inner \`.container\` at \`max-width: 1180px; margin: 0 auto; padding: 0 40px;\`.
- Sections that contain a full-bleed CARD (Spotlight, YoutubeCta): the OUTER section STILL gets \`padding: 100px 24px;\` — the card sits INSIDE that padding, it does NOT replace it. Result: 100px space above the card + card + 100px space below.
- On mobile (≤767px): reduce section padding to \`padding: 64px 0;\` (or \`64px 20px\` for full-bleed containers).
- NEVER emit \`padding-top: 0\` or \`padding: 0\` on a section. If you're tempted to "collapse padding" between sections to avoid doubled gaps, DON'T — 200px between sections is intentional, that's the editorial rhythm.
- Sections should visually breathe. Two consecutive sections touching is a rendering bug.

# FOOTER — CRITICAL

- Emit exactly ONE \`<footer>\` after the last section, before \`</main>\`'s close (or as a sibling to \`</main>\`).
- Footer padding: \`padding: 64px 40px 40px;\` (top 64, bottom 40 for the copyright row).
- Do NOT emit ANY content after the footer closes. No hidden divs, no scripts with visible height, no extra sections.
- The document ends at \`</footer></main></body></html>\` (or \`</main></footer></body></html>\` — either order fine). Absolutely no trailing empty space, no phantom \`<div>\`s with min-height.

# NAV — SPECIFIC INSTRUCTIONS (this is where past generations underdelivered)

The nav.md spec describes an interactive CardNav with hover-dropdown colored cards. That interactive pattern needs React state; you're emitting static HTML, so DO THIS INSTEAD:

- Fixed 72px bar, overlays hero, white bg (or dark bg if hero is light).
- Brand LEFT: logo image (from brand.logo.src) OR brand name as 18px bold Geist wordmark.
- 3-4 nav links CENTER: font-size 15px, weight 500, gap 24px, color inherited from bar (dark on white, white on dark). NO dropdowns — flat links only. Sample: "Work with me", "Coaching", "About", "Reviews".
- Right end: optional "Log in" text link + primary CTA pill button matching hero primary CTA copy.
- Add a subtle backdrop-blur if you want depth: \`background: rgba(255,255,255,0.72); backdrop-filter: blur(20px);\` — reads premium without needing JS.
- NO hamburger menu (mobile treatment is fine but not required for the desktop preview).

# HERO — SPECIFIC INSTRUCTIONS

The hero is 50/50 split: COPY on the left (60%), REAL PHOTO on the right (40%).

Layout:
- Dark bg \`#0a0a0f\`, white text.
- Total height: 640-720px. Padding-top: 200px (clears the 72px nav + 128px breathing). Padding-bottom: 100px.
- LEFT column: eyebrow (optional, small mono-caps if brand needs it) + headline + subhead + 2 CTA buttons + trust row. Everything left-aligned, max-width 640px.
- RIGHT column: the PHOTO from imagePack.hero. Full-height, edge-to-bleed on the right, absolute-positioned. Use \`left: 52%; right: 0; top: 0; bottom: 0; object-fit: cover; object-position: center;\`. Add a subtle left-side gradient overlay: \`background: linear-gradient(90deg, rgba(10,10,15,0.9) 0%, rgba(10,10,15,0.35) 30%, transparent 60%);\` on top of the image so the copy remains legible if it wraps into the right column.
- Namecard bubble at the bottom-right of the photo area (per hero.md §7): 12px 18px padding, radius 12, white/92% bg, dark ink, brand name + one-line role.

TYPOGRAPHY (smaller than before — user asked for cleaner scale):
- Headline: 44-56px on desktop (clamp(36px, 4.5vw, 56px)). Weight 500. Letter-spacing -0.028em. Line-height 1.05. Max-width 640px. Wrap to 2-3 lines. NEVER larger than 60px.
- Subhead: 17-18px. Weight 400. Line-height 1.55. Muted white (rgba(255,255,255,0.78)). Max-width 520px. Margin-top 20px.
- CTAs: 14px semibold, padding 12px 22px, radius 999px. Primary = solid white bg + dark ink. Secondary = transparent + 1px white border. Margin-top 28px.
- Trust row: 13px, rgba(255,255,255,0.7), 5 star SVGs + count. Margin-top 24px.

IMAGE SOURCE:
- Always use imagePack.hero (a real editorial photo, either from the ingested site or curated Pexels). NEVER emit typography watermarks (huge numbers, initials, wordmarks) in place of a photo. NEVER emit a plain colored blob or gradient blob in the right column.
- If the imagePack.hero URL is a background pattern (rare), still use it — apply the left-side scrim heavily so it reads as an atmospheric backdrop.

# MEGA-BENTO — SPECIFIC INSTRUCTIONS (this is where past generations underdelivered)

The 6-tile grid keeps rendering as narrow columns because past generations used
\`.span2\`/\`.span4\` utility classes without defining them in CSS. To eliminate the
class you must remember, USE INLINE STYLES for grid-column and grid-row spans.

Grid CSS (put in the \`<style>\` block):

    .mb-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      grid-template-rows: repeat(3, 340px);
      gap: 16px;
    }
    @media (max-width: 900px) { .mb-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: none; grid-auto-rows: 280px; } }
    @media (max-width: 560px) { .mb-grid { grid-template-columns: 1fr; grid-auto-rows: minmax(240px, auto); } }

Tile layout (exact 6-tile plan — DO NOT deviate):

    Tile 1 (Row 1, LEFT)   -> style="grid-column: span 4"                          HERO tile: imagePack.supporting[0] photo bg + top service
    Tile 2 (Row 1, RIGHT)  -> style="grid-column: span 2; grid-row: span 2"        TALL tile: imagePack.supporting[1] photo bg + secondary service
    Tile 3 (Row 2, LEFT-a) -> style="grid-column: span 2"                          imagePack.supporting[2] photo bg + service
    Tile 4 (Row 2, LEFT-b) -> style="grid-column: span 2"                          imagePack.supporting[3] photo bg + service
    Tile 5 (Row 3, LEFT)   -> style="grid-column: span 4"                          REVIEWS tile: dark bg, one testimonial from ingest.testimonials[0]
    Tile 6 (Row 3, RIGHT)  -> style="grid-column: span 2"                          imagePack.supporting[4] photo bg + last service

CRITICAL: EVERY tile uses inline grid-column/grid-row via the \`style="…"\` attribute.
NEVER emit \`.span4\` \`.span2\` classes because they always end up undefined.

Each tile:
- Has a real photo as background (imagePack.supporting[i], or the reviews-tile has solid \`#0a0a0f\`).
- Photo: absolute inset:0 z-index:0, object-fit:cover.
- Scrim: absolute inset:0 z-index:1 with \`linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.85) 100%)\`.
- Title bottom-left: z-index:2, 20px semibold white.
- Arrow chip top-right: 38px pill with 16% white bg, arrow icon.

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
  const { brief, brand, ingest, imagePack } = input;

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
    // Pre-curated real photos for hero + tile backgrounds + founder shot.
    // Opus MUST use these URLs directly in <img src=…> — never emit
    // typography watermarks or gradient blobs where a photo goes.
    imagePack: {
      hero: imagePack.hero,
      supporting: imagePack.supporting,
      founder: imagePack.founder,
      _provider: imagePack.attribution.provider,
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
