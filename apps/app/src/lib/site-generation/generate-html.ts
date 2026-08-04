import Anthropic from "@anthropic-ai/sdk";
import type { BrandContext } from "./design-system";
import type { IngestedBrand } from "./brand-ingest";
import type { ImagePack } from "./image-curator";
import { loadBlueprints } from "./blueprint-loader";
import {
  pickReferences,
  type CorpusPick,
  type PaletteHint,
  type RouterInput,
} from "./corpus-router";
import type { PagePlan, PageType } from "./page-planner";

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
  siteIntent?: "has_site" | "no_site" | null; // for router — routes labels/language
  pageType?: PageType;                        // "home" default; other types for multi-page
  pagePlan?: PagePlan[];                      // full site plan — needed for cross-page nav
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
  // 1. Route: pick 1-2 references from the corpus based on brand context.
  const routerInput: RouterInput = {
    voiceDescriptor: input.brand.voiceDescriptor,
    businessType: input.brand.businessType,
    primaryGoal: input.brand.primaryGoal,
    siteIntent: input.siteIntent ?? null,
    paletteHint: inferPaletteHint(input.ingest),
  };
  const pick = pickReferences(routerInput);
  console.log(`[generate-html] corpus pick — ${pick.reasoning}`);

  const anthropic = new Anthropic();

  const pageType: PageType = input.pageType ?? "home";
  const system = buildSystemPrompt(pick, pageType, input.pagePlan);
  const user = buildUserPrompt(input, pick, pageType);

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

function buildSystemPrompt(
  pick: CorpusPick,
  pageType: PageType,
  pagePlan: PagePlan[] | undefined,
): string {
  const hasSecondary = pick.secondary !== null;
  const referenceLine = hasSecondary
    ? `TWO reference bundles: **${pick.primary.id}** (primary, weight ${pick.primary.weight}) and **${pick.secondary!.id}** (secondary, weight ${pick.secondary!.weight})`
    : `ONE reference bundle: **${pick.primary.id}** (primary)`;

  // Multi-page context block. Home pages still generate a full homepage
  // per reference's sections.md; non-home pages generate a specific page
  // using the corresponding page-type MD. Either way, the nav must link
  // to every page in the plan.
  const multiPageBlock = pagePlan && pagePlan.length > 1 ? buildMultiPageBlock(pageType, pagePlan) : "";

  return `You are the site-generation model for WRKS Studio.

# YOUR JOB

Emit ONE complete HTML5 document — a full homepage for the user's brand.

You are given:
1. **DESIGN.md** — the constitution. Its bans are law, its tokens are non-negotiable.
2. **${referenceLine}** — inspiration for section inventory, structural rhythm, and visual character. NOT a template to copy verbatim.
3. **The user's brand data** — palette, typography, offer, audience, voice, testimonials from onboarding + optional deep-ingest of their existing URL.
4. **The user's brief** — one sentence about their business.
${pageType !== "home" ? `5. **The page-type spec** — a composition file describing THIS page (${pageType}). Use it as the structural blueprint; keep the reference's vibe.` : ""}

Your task is to REMIX the reference bundle(s) into ${pageType === "home" ? "a homepage" : `the ${pageType} page`} that fits THIS brand, obeying DESIGN.md's constitutional law absolutely.
${multiPageBlock}

# THE REMIX PRINCIPLE

- **Reference bundles suggest.** DESIGN.md decides. When they conflict, DESIGN.md wins.
- **Section inventory** in each reference's \`sections.md\` is the starting point — not a fixed sequence. Adapt: drop sections that don't fit the user's business, reorder based on what serves this specific brand's conversion flow.
- **Character** in each reference's \`character.md\` describes the vibe you're inspired by — not literal moves to copy. If the reference uses italics as accents but DESIGN.md bans italics, use weight-contrast instead.
- **When two references are picked**, primary drives the overall shape (~65%); secondary contributes signature moves (~35%). Draw structural spine from primary, borrow one or two visual signatures from secondary.

# OUTPUT FORMAT

- ONLY the HTML doc, wrapped in a single \`\`\`html fenced block. No prose before or after.
- Start with \`<!DOCTYPE html>\`.
- ONE \`<head>\` with: meta charset + viewport, title, meta description, OG tags, favicon, preconnect + Google Fonts, Tailwind CDN (\`https://cdn.tailwindcss.com\`), ONE inline \`<style>\` block for section CSS + CSS variables.
- Prefer Tailwind utilities for common spacing/layout; put complex/reused CSS in the \`<style>\` block with semantic class names (\`.hero\`, \`.section-x\`). DO NOT inline every element's styles — verbose markup wastes tokens and clips sections.

# SECTION SELECTION

${pageType === "home"
  ? `Pick **8-14 sections** based on the reference's \`sections.md\` inventory, adapted for the user:

- ALWAYS include: nav, hero, at least one proof/trust section, at least one offer/services section, at least one about/founder section, one final CTA, footer.
- Include OR skip based on user context: testimonials (skip if none in ingest data), pricing tiers (skip if no explicit pricing), team grid (skip for solo founders), video reels (skip if no social links), lead magnet form (skip unless brief signals lead-gen intent).
- Follow the reference's "Adaptation rules" block in sections.md — those tell you what to skip for smaller/adjacent business types.
- Alternate light and dark sections for editorial rhythm. Long runs of same-tone sections lose the eye.
- Never emit the AI-wireframe default sequence (hero → 3-cards → testimonials → logo bar → CTA) — that's a DESIGN.md ban.`
  : `Follow the page-type spec provided in the user prompt (${pageType}.md) — it dictates:
- Section count for this page type
- Section order + adaptation rules per business_type
- Copy voice notes + bans specific to this page

Do NOT pull the reference's home-page section inventory here. The reference contributes VIBE (character.md) only — palette, typography choices, motion character, section rhythm. The page-type spec contributes STRUCTURE.

Never emit the AI-wireframe default sequence — that's a DESIGN.md ban.`}

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

# NAV RENDERING (static-HTML output)

The reference bundles may describe interactive card-based navs — those need JS state we don't emit. Render a STATIC nav that captures the reference's visual intent:

- Fixed bar, height ~72px, sticky at top.
- Background: match the section-below tone. Dark hero → dark nav (or white bar with dark hero peeking below). Light hero → white nav. Optional \`backdrop-filter: blur(20px)\` for premium depth without JS.
- Brand LEFT: logo (from brand.logo.src or ingest) OR brand name as ~18px semibold wordmark.
- 3-5 links CENTER: 14-15px, weight 500, gap 24px, color from bar tone. Flat links only — NO dropdowns (would need JS). Link labels reflect THIS business (not the generic "Product / Features / Pricing / Blog / Login / Get Started" — that's a DESIGN.md ban).
- Right end: primary CTA pill (matching hero primary), optional "Log in" text link if the site has auth.
- NO hamburger menu required for the desktop preview.

# HERO RENDERING

Draw the hero SHAPE from the primary reference's \`character.md\` — that describes whether it's a portrait-split, a centered-editorial, a video-fullbleed, or a nature-carousel. Use the actual variant that fits the user's voice.

Universal engineering rules for whatever hero variant you pick:

- **Height**: 640-720px min. Padding-top 200px (clears floating nav). Padding-bottom 100px.
- **Headline typography**: 44-60px on desktop. **NEVER larger than 60px** — bigger reads as AI-tell. Use \`clamp(36px, 4.5vw, 60px)\`, weight 500-600, letter-spacing -0.028em, line-height 1.05, max-width 640px, wrap 2-3 lines max.
- **Subhead**: 17-18px, weight 400, line-height 1.55, muted color (foreground at 75-80% opacity), max-width 520px, margin-top 20px.
- **CTAs**: 14px semibold, padding 12px 22px, radius per DESIGN.md (site-consistent). Primary solid, secondary outlined. Margin-top 28px. **Never repeat the same CTA text more than twice on the page.**
- **Trust row** (if brand has social proof to show): 13px muted, star SVGs + count, margin-top 24px. Skip entirely if user has no ratings/reviews.

**Hero image**:
- If \`imagePack.hero.kind === 'real'\` and \`.url\` is set → use it, positioned per your hero variant (edge-bleed for portrait-split, background-cover for fullbleed, sub-region for centered).
- If \`imagePack.hero.kind === 'placeholder'\` → render the IMAGE PLACEHOLDER (recipe below). Never emit a stock URL you invent.

# IMAGE PLACEHOLDER RECIPE (use for EVERY placeholder slot)

Every placeholder is a designed empty state that clearly signals "click to add your image." It should look INTENTIONAL, not broken.

Layers (inside a container that fills the intended photo area):
1. Base: soft palette gradient using the brand's own colors, low saturation:
   \`background: linear-gradient(135deg, {brand.palette.primary at 8% opacity mixed with #0f172a} 0%, {brand.palette.tertiary at 6% opacity mixed with #0f172a} 100%);\`
   Or simpler: \`background: linear-gradient(135deg, rgba(30,58,138,0.12), rgba(59,130,246,0.06)); background-color: #0f172a;\`
2. Dashed border: \`border: 1.5px dashed rgba(255,255,255,0.14); border-radius: [inherit from slot];\`
3. Subtle inner noise: \`background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.03'/></svg>");\`
4. CENTER content group (flex column, gap 12, centered):
   - Circular icon chip: 48px round, rgba(255,255,255,0.06) bg, 1px rgba(255,255,255,0.14) border, camera SVG inside (16×16, stroke 1.8, currentColor at rgba(255,255,255,0.5)).
   - Small text label: 12px, weight 500, letter-spacing 0.08em, uppercase, color rgba(255,255,255,0.55). Text = the slot's label ("ADD HERO PHOTO", "ADD TILE IMAGE", "ADD FOUNDER PHOTO").
   - Sub-hint: 11.5px, color rgba(255,255,255,0.35), text "1440 × 900 recommended" (or portrait dims for hero: "1200 × 1600").

Wrapper attributes:
- \`data-image-slot="{slotId}"\` — from imagePack.hero.slotId / supporting[i].slotId / founder.slotId. This lets the future inline editor target it.
- \`role="button"\` and \`tabindex="0"\` — hint at click-to-upload affordance.
- \`aria-label="Add image: {label}"\`
- Cursor: pointer.
- Hover state: brighten the base gradient by 4% and the border to rgba(255,255,255,0.22). Transition 200ms.

The placeholder must fill the SAME dimensions as the real image would have (hero right column, mega-bento tile bg, founder portrait). Never shrink.

Camera icon SVG (use verbatim):
\`\`\`
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
  <circle cx="12" cy="13" r="4"></circle>
</svg>
\`\`\`

# GRID / BENTO LAYOUTS — CRITICAL ENGINEERING RULE

When emitting bento or asymmetric grid sections, USE INLINE STYLES for grid-column and grid-row spans. Past generations emitted \`.span2\` / \`.span4\` classes that were never defined in CSS, resulting in tiles collapsing to single columns. To prevent this:

Base grid CSS (in your \`<style>\` block):

    .grid-bento {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      grid-auto-rows: 340px;
      gap: 16px;
    }
    @media (max-width: 900px) { .grid-bento { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 280px; } }
    @media (max-width: 560px) { .grid-bento { grid-template-columns: 1fr; grid-auto-rows: minmax(240px, auto); } }

Every tile uses inline style for its span:

    <div style="grid-column: span 4">…</div>
    <div style="grid-column: span 2; grid-row: span 2">…</div>

NEVER emit \`.span4\` / \`.span2\` classes. INLINE STYLES ONLY for grid positioning.

Image tiles in a bento apply the IMAGE PLACEHOLDER RECIPE at full-tile scale, with title overlay bottom-left (20px semibold, z-index:3) and optional arrow chip top-right.

For OTHER grids (feature grids, service grids, blog grids), use Tailwind grid utilities (\`grid-cols-3\`, \`grid-cols-4\`) — the inline-style requirement is specific to asymmetric bento layouts.

# STYLE RULES (non-negotiable)

- **DESIGN.md is law.** Never emit any of its banned patterns (typography, layout, motion, copy, meta, icons). When in doubt, check the ban list.
- **Palette hard-constrained** to \`brand_palette\` when supplied. Otherwise derive from voice_descriptor per DESIGN.md's voice-mapping table.
- **Typography**: use the typefaces DESIGN.md recommends for this voice_descriptor. Never use Poppins. Never use Inter+Geist+the-same for all three roles.
- **Motion**: apply the appropriate Tier from DESIGN.md's motion-vocabulary based on voice_descriptor. Tier 1 always on. Tier 2 only for bold/expert/playful. Tier 3 (one signature moment) only for bold/playful. Never blanket \`fade-up-on-scroll\` on every element.
- **Copy voice**: match the reference's tone character AND the user's voice_descriptor. No verb-cluster words (Elevate/Unlock/Empower/Seamless/etc.). No em-dash confetti. No "it's not X, it's Y" formulations. No three-benefit triads with periods.
- **Icons**: stroke-only 16/20/24px sizes, varied per hierarchy. Never sparkles/robots/lightbulbs/rockets as "AI/smart/launch" signals. No duotone icons in rounded-square feature cards.
- Every editable element: \`data-edit-id="section.slot"\`.
- Every image: meaningful \`alt\` (or empty for decorative).
- Semantic HTML5: \`<header>\`, \`<main>\`, \`<section>\`, \`<nav>\`, \`<footer>\`.
- NEVER italics. NEVER uppercase in body copy. NEVER exclamation marks.
- No external JS bundle. No analytics. No orbs, no rotating gradient borders, no aurora backgrounds.
- **Copyright year**: use ${new Date().getFullYear()} — never a hardcoded past year (training-cutoff leak is a top AI-tell).
- CRITICAL: output MUST include closing \`</main>\`, \`<footer>...</footer>\`, \`</body></html>\`. Every homepage needs a footer — emit one with: brand mark, 3 nav columns adapted to this business (never generic "Company/Learn/Legal" if the business has different content), and a © ${new Date().getFullYear()} line.

# LENGTH

Target 40,000–60,000 chars of compact HTML for all sections + footer. If you feel you're running long, TIGHTEN INLINE STYLES (move to \`<style>\` block), don't drop sections. Never truncate.`;
}

function buildMultiPageBlock(pageType: PageType, pagePlan: PagePlan[]): string {
  const currentPage = pagePlan.find((p) => matchesType(p, pageType));
  const pagesList = pagePlan
    .map((p) => `- \`${p.path}\` — ${p.navLabel}${p === currentPage ? " (current)" : ""}`)
    .join("\n");

  return `
# MULTI-PAGE CONTEXT

This is a MULTI-PAGE site. You're generating the **${pageType === "home" ? "HOME" : pageType.toUpperCase()}** page${currentPage ? ` at \`${currentPage.path}\`` : ""}.

**All pages in this site:**
${pagesList}

**NAV REQUIREMENT** — non-negotiable:
- The nav on this page MUST link to ALL pages in the plan above, in the order listed. Use the exact paths (\`/\`, \`/about\`, etc.) and the exact nav labels.
- These are REAL routes, not \`#anchors\`. Use \`<a href="/about">\` — never \`<a href="#about">\`.
- Mark the current page's link with a subtle current-state indicator (thin underline in the accent color OR slightly bolder weight). NEVER a background pill on the current link — that reads like a button.

**FOOTER REQUIREMENT** — non-negotiable:
- Footer must include a nav column that repeats the same page links (all paths, all labels).
- Footer must repeat brand mark + copyright with the current year (${new Date().getFullYear()}).

**CROSS-PAGE CONSISTENCY** — this page will render alongside sibling pages generated in the same session. To feel like ONE site:
- Same palette across all pages (from brand data).
- Same typefaces + type scale.
- Same nav structure (per above).
- Same footer structure (per above).
- Same CTA vocabulary (primary CTA repeats with contextual variation across pages).
`;
}

function matchesType(page: PagePlan, pageType: PageType): boolean {
  return page.pageType === pageType;
}

function buildUserPrompt(input: GenerateInput, pick: CorpusPick, pageType: PageType): string {
  const { brief, brand, ingest, imagePack } = input;

  // Load DESIGN.md (constitution) from the same blueprint loader.
  const bundle = loadBlueprints();

  // When primary is personal-brand AND this is the home page, ALSO
  // include the deep composition spec so we preserve the proven
  // Bill-Fanter quality for that vertical. Non-home pages use the
  // universal page-type MD regardless of reference.
  const includeDeepSpec = pageType === "home" && pick.primary.id === "personal-brand";

  // For non-home pages, load the appropriate page-type MD as the
  // structural spec (character stays from the reference).
  const pageSpec = pageType === "home" ? null : pageSpecFor(pageType, bundle);

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
      siteIntent: input.siteIntent ?? null,
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

  const parts: string[] = [
    "# 1. DESIGN.md — CONSTITUTION (law, non-negotiable)",
    "",
    bundle.design,
    "",
    "---",
    "",
    `# 2. Primary reference — ${pick.primary.id} (weight ${pick.primary.weight})`,
    "",
    pageType === "home"
      ? "Use this reference's character, section inventory, and voice-map to shape the homepage."
      : "Use this reference's CHARACTER only (palette, typography, motion tier, section rhythm). The page-type spec below dictates STRUCTURE.",
    "",
    "## Character",
    pick.primary.character,
    "",
  ];

  if (pageType === "home") {
    parts.push(
      "## Section inventory",
      pick.primary.sections,
      "",
      "## Voice fit",
      pick.primary.voiceMap,
      "",
    );
  }

  if (pick.secondary) {
    parts.push(
      "---",
      "",
      `# 3. Secondary reference — ${pick.secondary.id} (weight ${pick.secondary.weight})`,
      "",
      "Draw 1-2 signature moves from this reference to layer over the primary spine. Do not adopt its full structure.",
      "",
      "## Character",
      pick.secondary.character,
      "",
    );
    if (pageType === "home") {
      parts.push(
        "## Section inventory",
        pick.secondary.sections,
        "",
        "## Voice fit",
        pick.secondary.voiceMap,
        "",
      );
    }
  }

  // Non-home pages get the universal page-type spec as their structural
  // blueprint. Reference bundles above only contribute vibe.
  if (pageSpec) {
    parts.push(
      "---",
      "",
      `# 4. Page-type spec — ${pageType} page structure (BINDING for section choice)`,
      "",
      pageSpec,
      "",
    );
  }

  if (includeDeepSpec) {
    parts.push(
      "---",
      "",
      "# 4. Deep composition spec (personal-brand vertical — for maximum fidelity)",
      "",
      "This is the proven Bill-Fanter composition + per-section specs. Follow it closely for structural rhythm; DESIGN.md's bans still override any spec that conflicts.",
      "",
      "## Composition (page-level plan)",
      bundle.composition,
      "",
      "## Section specs (per-family)",
      "",
      "### Nav",
      bundle.sections.nav,
      "",
      "### Hero",
      bundle.sections.hero,
      "",
      "### MegaBento",
      bundle.sections.megaBento,
      "",
      "### Watchlist",
      bundle.sections.watchlist,
      "",
      "### Community",
      bundle.sections.community,
      "",
      "### HelpGrid",
      bundle.sections.helpGrid,
      "",
      "### Spotlight",
      bundle.sections.spotlight,
      "",
      "### HeroSplit",
      bundle.sections.heroSplit,
      "",
      "### Reviews",
      bundle.sections.reviews,
      "",
      "### YoutubeCta",
      bundle.sections.youtubeCta,
      "",
      "### AboutFounder",
      bundle.sections.aboutFounder,
      "",
    );
  }

  parts.push(
    "---",
    "",
    "# User brief",
    "",
    `> ${brief}`,
    "",
    "---",
    "",
    "# Brand data (source of truth for palette, typography, copy hints, testimonials, images)",
    "",
    "```json",
    JSON.stringify(brandData, null, 2),
    "```",
    "",
    "---",
    "",
    "# Task",
    "",
    taskInstruction(pageType, pick),
  );

  return parts.join("\n");
}

// Maps page type to the corresponding page-spec MD from the blueprint bundle.
function pageSpecFor(
  pageType: PageType,
  bundle: ReturnType<typeof loadBlueprints>,
): string {
  switch (pageType) {
    case "about":
      return bundle.pages.about;
    case "services":
      return bundle.pages.services;
    case "contact":
      return bundle.pages.contact;
    case "lead-magnet":
      return bundle.pages.leadMagnet;
    case "home":
    default:
      return "";
  }
}

// Final task line adapted per page type.
function taskInstruction(pageType: PageType, pick: CorpusPick): string {
  const remixTarget = pick.secondary ? "two references" : "reference";
  if (pageType === "home") {
    return `Generate the complete HTML5 document for this brand's homepage. Remix the ${remixTarget} above under DESIGN.md's constitutional law. Adapt section selection to THIS brand's business_type + voice_descriptor + brief — do not slavishly copy the reference sequence. Return ONLY the fenced code block starting with \`\`\`html and ending with \`\`\`. Nothing before, nothing after.`;
  }
  return `Generate the complete HTML5 document for this brand's **${pageType}** page. Follow the page-type spec above for structure. Draw visual character from the ${remixTarget} above (palette, typography, motion, rhythm). Obey DESIGN.md's constitutional law absolutely. Include the shared nav + footer linking to all pages in the site (see MULTI-PAGE CONTEXT in the system prompt). Return ONLY the fenced code block starting with \`\`\`html and ending with \`\`\`. Nothing before, nothing after.`;
}

// Rough palette-hint inference from ingested brand colors.
// Feeds the corpus router when we have brand ingest data.
function inferPaletteHint(ingest: IngestedBrand | null): PaletteHint | null {
  if (!ingest || !ingest.palette?.colors?.length) return null;

  // Average luminance across the first 3 palette colors (which are
  // typically primary + secondary + tertiary — the ones that carry
  // most visual weight).
  const sample = ingest.palette.colors.slice(0, 3);
  let totalL = 0;
  let count = 0;
  for (const c of sample) {
    const l = hexLuminance(c.hex);
    if (l !== null) {
      totalL += l;
      count++;
    }
  }
  if (count === 0) return null;
  const avgL = totalL / count;

  // Thresholds tuned so dark editorial palettes (Bill-Fanter, WRKS
  // Online) land in "dark", warm cream palettes (Tomorrow's Sunrise)
  // land in "light-warm", clean corporate palettes (Claxton) land in
  // "light-clean". These are heuristic and only used as a tiebreaker
  // in the router.
  if (avgL < 0.35) return "dark";

  // For light palettes, use warmth (r > b) as the deciding signal.
  let totalR = 0;
  let totalB = 0;
  for (const c of sample) {
    const rgb = hexToRgb(c.hex);
    if (rgb) {
      totalR += rgb.r;
      totalB += rgb.b;
    }
  }
  return totalR > totalB * 1.05 ? "light-warm" : "light-clean";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function hexLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  // Perceptual luminance (Rec. 601)
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
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
