// Style references — visual + voice treatments the user picks during
// onboarding to anchor wow page generation AND the in-studio templates.
//
// Architecture:
// • Each style ships with a hand-designed Preview component (NOT a
//   scaled-down site renderer — those looked microscopic). The preview
//   is what the user sees in the picker card.
// • Each style has a Claude brief injected into the wow system prompt
//   so the generated copy adopts its voice.
// • Each style has a sampleSite used later by the in-studio empty-state
//   template carousel.

import type { ReactElement } from "react";
import type { Site } from "@/lib/site-model";
import { editorialStyle } from "./editorial";
import { boutiqueStyle } from "./boutique";
import { cinematicStyle } from "./cinematic";
import { modernSaasStyle } from "./modern-saas";

export type StyleReference = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  influences: string[];
  /** Claude brief injected into the wow system prompt. */
  claudeBrief: string;
  /** Hex used as the card's atmospheric backdrop. */
  accent: string;
  /** Hex used as the card preview's surface color. */
  surface: string;
  /** Hand-designed mini composition shown in the picker card. */
  Preview: () => ReactElement;
  /** Full Site object used by the in-studio empty-state template carousel. */
  sampleSite: Site;
};

export const STYLE_REFERENCES: StyleReference[] = [
  editorialStyle,
  boutiqueStyle,
  cinematicStyle,
  modernSaasStyle,
];

export function getStyleReference(id: string): StyleReference | null {
  return STYLE_REFERENCES.find((s) => s.id === id) ?? null;
}

/**
 * Combine the briefs of selected styles into a single injection block
 * appended to the wow system prompt.
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
