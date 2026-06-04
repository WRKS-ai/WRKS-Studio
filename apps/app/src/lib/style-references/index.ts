// Style references — the curated visual + voice treatments a user can
// pick from to anchor the wow page generation. Each reference has:
//
// • Visual identity (palette, typography hint) used to render the card
// • A Claude brief that gets injected into the wow system prompt so the
//   generated copy adopts the style's voice/structure/cadence
// • A sample Site rendered inside the card so the user sees what the
//   style actually feels like
//
// Quality bar: each reference is hand-written, not boilerplate. If we
// can't ship a reference at this bar, it stays "Coming soon" — a
// placeholder card with no Site, no Claude brief, no apply.

import type { Site } from "@/lib/site-model";
import { editorialStyle } from "./editorial";

export type StyleReference = {
  /** Stable id used in URLs, localStorage, API payloads. */
  id: string;
  /** Display name on the card (1-2 words). */
  name: string;
  /** One-line tagline under the name, sets context. */
  tagline: string;
  /** Longer description, shown when the card is selected. */
  description: string;
  /** Inspirations the design pulls from (3-5 items shown as chips). */
  influences: string[];
  /**
   * The Claude brief injected into the wow system prompt when this
   * style is selected. Should change voice, structure, and cadence —
   * not just colors.
   */
  claudeBrief: string;
  /** Accent color for the card backdrop. */
  accent: string;
  /** Surface color for the in-card preview body. */
  surface: string;
  /** A real, complete Site shown inside the card preview. */
  sampleSite: Site | null;
  /** Whether this style is shippable (false = placeholder card). */
  available: boolean;
};

export const STYLE_REFERENCES: StyleReference[] = [
  editorialStyle,
  {
    id: "boutique",
    name: "Boutique",
    tagline: "Sensory, place-specific, small-batch.",
    description:
      "For makers, restaurants, coffee roasters, and brands whose work is touched by hand. Editorial italics, beige palette, full-bleed product imagery.",
    influences: ["Aesop", "Verve Coffee", "Glossier", "Studio Olafur Eliasson"],
    claudeBrief: "",
    accent: "#a87856",
    surface: "#f5ecdc",
    sampleSite: null,
    available: false,
  },
  {
    id: "cinematic",
    name: "Cinematic",
    tagline: "Bold, image-led, dramatic spacing.",
    description:
      "For photographers, portfolios, fashion houses, and visual agencies. Full-bleed photographs, big sans-display headlines, deep black backgrounds.",
    influences: ["Apple", "Loewe", "Rimowa", "Magnum Photos"],
    claudeBrief: "",
    accent: "#3a3a3a",
    surface: "#0d0d0e",
    sampleSite: null,
    available: false,
  },
  {
    id: "modern-saas",
    name: "Modern SaaS",
    tagline: "Punchy, structured, opinionated.",
    description:
      "For software products, dev tools, and productivity apps. Inter throughout, bright accent, structured feature grids, technical specificity.",
    influences: ["Linear", "Vercel", "Cron", "Raycast"],
    claudeBrief: "",
    accent: "#5b8bff",
    surface: "#0e0f14",
    sampleSite: null,
    available: false,
  },
];

export function getStyleReference(id: string): StyleReference | null {
  return STYLE_REFERENCES.find((s) => s.id === id && s.available) ?? null;
}

/**
 * Combine the briefs of multiple selected styles into a single block
 * that gets injected into the wow system prompt. If the user picked
 * more than one, the briefs are concatenated with a clear separator
 * and Claude is told to blend them.
 */
export function composeStyleBrief(ids: string[]): string {
  const refs = ids
    .map((id) => getStyleReference(id))
    .filter((r): r is StyleReference => !!r);
  if (refs.length === 0) return "";

  if (refs.length === 1) {
    return `\n═══════════════════════════════════════════════════
STYLE REFERENCE — THE USER PICKED THIS
═══════════════════════════════════════════════════

The user chose the "${refs[0].name}" style. Read its brief below and let it shape EVERY piece of copy you write — voice, sentence length, cadence, structure, eyebrow conventions. The Hero, Features, Social, and Ad all need to read like this style.

${refs[0].claudeBrief}

If your output doesn't sound like the brief above, rewrite it.
`;
  }

  const names = refs.map((r) => `"${r.name}"`).join(" + ");
  return `\n═══════════════════════════════════════════════════
STYLE REFERENCES — THE USER PICKED MULTIPLE
═══════════════════════════════════════════════════

The user chose ${names}. Blend them — borrow the voice from the strongest brief and the structural cues from the others. Don't pick one and ignore the rest.

${refs.map((r, i) => `── REFERENCE ${i + 1}: ${r.name.toUpperCase()} ──\n${r.claudeBrief}`).join("\n\n")}

If your output doesn't carry the influence of these references, rewrite it.
`;
}
