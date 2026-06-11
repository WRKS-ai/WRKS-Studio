// Palettes = visual + voice identity bundles. The user picks one
// palette and one theme on /onboarding/reference, and that pair drives
// EVERYTHING the agent makes for them next:
//   • Visual: bg, ink, accent, rim — applied to deliverable renders
//   • Voice: the palette's claudeBrief tells Claude how to write
//
// One choice = one identity. Simpler than the prior 12-brand picker
// AND universal (every business needs visual identity; not every
// business cares about copy style).

export type Theme = "light" | "dark";

export type ThemeRender = {
  /** Page / card background */
  bg: string;
  /** Primary text */
  ink: string;
  /** Secondary text */
  inkMuted: string;
  /** Hairline borders / dividers */
  rim: string;
};

export type Palette = {
  id: string;
  name: string;
  tagline: string;
  /** Dominant brand color — used as the selection rim in the picker */
  accent: string;
  /** 3 supporting swatches shown beneath the primary in the picker card */
  supporting: [string, string, string];
  /** Light-theme render */
  light: ThemeRender;
  /** Dark-theme render */
  dark: ThemeRender;
  /** Copy brief injected into the wow generation system prompt */
  claudeBrief: string;
};

// ============================================================
// Briefs — what TO write, what NOT to write, per palette
// ============================================================
// These intentionally reference real brands (Aesop, Linear, etc.)
// because Claude knows those brands and their voices. The USER sees
// the palette name (e.g. "Quiet cream"), not the brand.

const quietCreamBrief = `QUIET CREAM — REFINED EDITORIAL VOICE
─────────────────────────────────────

Write like Aesop. Restraint, considered phrasing, never marketing-speak.

VOICE
- Sentences are LONG but never run-on. Built with commas.
- Vocabulary is precise and slightly elevated. "Procure" not "buy."
- Present tense, declarative. Never future-promising.
- Use specifics: a number, a place, a year. Avoid abstractions.
- Speak about the work, not the customer.

STRUCTURE
- Hero headline: 8-14 words. A complete sentence. Often metaphorical.
  Ends with a period.
- Hero subhead: 2-3 sentences. Sensory, specific. Describes the
  product's properties or origins, never benefits.
- CTA: correspondence-flavored. "Visit a store.", "Read more.",
  "Subscribe."  Never "Get started" or "Sign up."
- Eyebrow: provenance + year. "Skincare. Est. 1987."

NEVER use: "Game-changing", "revolutionary", "incredible", exclamation
marks, rhetorical questions, direct address ("you'll love this").`;

const royalVioletBrief = `ROYAL VIOLET — MODERN SAAS VOICE
─────────────────────────────────

Write like Linear. Confident, technical, built for speed. Reads like a
changelog written by an engineer with taste.

VOICE
- Active voice, present tense, declarative.
- TIGHT sentences — 8-14 words. Often start with a verb.
- Specific numbers + version-like precision. "v2.4", "ships Friday."
- No corporate softening. "Ship work, not status updates" beats
  "Help your team be more productive."
- One claim per sentence. Stack them for rhythm.

STRUCTURE
- Hero headline: 4-7 words. Bold claim. Ends with period.
- Hero subhead: 1-2 sentences, ~15-25 words. Names the specific things
  it replaces. Concrete mechanism.
- CTA: verb-first, 2-3 words. "Start free.", "Get started.", "See changelog."
- Eyebrow: version pill or category. "v2.4 — out now"

NEVER use: "Empower", "innovative", "all-in-one", "platform" (just say
what it is), exclamation marks, vague benefit claims.`;

const sharpMonoBrief = `SHARP MONO — APPLE-CLEAN VOICE
───────────────────────────────

Write like Apple. Quiet confidence. The work is the marketing.

VOICE
- Sentences are SHORT. Often fragments. ("Faster. Smarter. Yours.")
- One declarative idea per sentence. Period. Then the next.
- No adjective stacking. "Beautifully designed" beats "incredibly
  beautifully designed."
- Use simple verbs. "Made" beats "engineered."
- No exclamation marks. Ever.

STRUCTURE
- Hero headline: 3-7 words. Often a single noun phrase or imperative.
  Use line breaks for rhythm.
- Hero subhead: 1-2 short sentences. Concrete, specific.
- CTA: 2-3 words. Verb-first. "Learn more.", "Buy.", "See pricing."
- Eyebrow: usually skipped or a single category word.

NEVER use: "Cutting-edge", "next-generation", "world-class",
"innovative", rhetorical questions, three-word power triplets, emoji.`;

const forestBrief = `FOREST — MISSION-DRIVEN, RUGGED VOICE
──────────────────────────────────────

Write like Patagonia. Honest. The work matters because the planet matters.
Speaks like someone who has actually been outside.

VOICE
- First-person plural ("we") and second-person ("you") allowed and warm.
- Concrete: name the river, the mountain, the year, the gear.
- Mission-led: name the cause specifically.
- Imperative voice for CTAs. "Buy used." "Repair, don't replace."
- Sentences are medium-long (15-25 words). Conversational.

STRUCTURE
- Hero headline: 6-10 words. Often a directive or principle.
- Hero subhead: 2-3 sentences. Names specifics — places, years, percentages.
- CTA: action-verb + concrete object. "Find a repair center."
- Eyebrow: category + year. "Outdoor apparel. Since 1973."

NEVER use: "Active lifestyles", "experience the outdoors", "premium gear",
vague aspiration without specifics, exclamation marks unless directly quoted.`;

const sunshineBrief = `SUNSHINE — BOLD, GRAPHIC, IRONIC VOICE
───────────────────────────────────────

Write like Off-White. Streetwear with art-school energy. Uses quotation
marks as design elements.

VOICE
- All caps allowed and often correct. Headlines IN CAPS hit harder.
- Words in "QUOTATION MARKS" used as both label and irony.
- Short, declarative, punchy. 3-6 word phrases stacked.
- Reference design, art, music. Drop names of collaborators, cities, years.
- Direct address fine and confident.

STRUCTURE
- Hero headline: 3-6 words, often ALL CAPS. Includes "quotation marks"
  on a key word for emphasis/irony.
- Hero subhead: 1-2 short sentences. Drops a year, collab, or city.
- CTA: imperative, often "SHOP", "ENTER", "GET ACCESS." All caps.
- Eyebrow: collection number + season.

NEVER use: Soft marketing language, "elevate", "amazing", "premium",
lowercase headlines, excessive description.`;

const softBlushBrief = `SOFT BLUSH — ACCESSIBLE, CONVERSATIONAL VOICE
──────────────────────────────────────────────

Write like Glossier. Soft, accessible, conversational. The reader is a
friend who shares their own routine.

VOICE
- Lowercase often correct (in headlines, in social).
- Lots of "you" and "your". Direct, warm, never preachy.
- Sentences are short and chatty. (16 words max.)
- Use sensory adjectives sparingly but well: "milky", "weightless", "dewy".
- Drop pronouns sometimes for rhythm.

STRUCTURE
- Hero headline: 4-8 words. Lowercase or sentence case. Benefit as a feeling.
- Hero subhead: 1-2 sentences. Describes the texture, the moment, the feeling.
- CTA: friendly. "Shop now.", "Try it.", "Add to bag."
- Eyebrow: category in lowercase. "skincare."

NEVER use: "Revolutionary", "premium", "luxury", hard-sell CTAs, all-caps
headlines, exclamation marks (rare exception: friendly aside).`;

const steelBlueBrief = `STEEL BLUE — PROFESSIONAL, TECHNICAL VOICE
────────────────────────────────────────────

Write like Stripe. Polished, technical, adult confidence without being cold.

VOICE
- Calm, declarative sentences. Use "we" sparingly; usually subject as noun.
- Always say what something IS, then what it DOES.
- Technical accuracy matters. Use the actual word: "API", "webhook", "checkout."
- Sentences medium-length (12-20 words). One thought each.
- Light wit allowed but never punchy.

STRUCTURE
- Hero headline: 5-9 words. States the position. Often "X is Y."
- Hero subhead: 2-3 sentences. Names categories of customers. References specifics.
- CTA: verb-first. "Start with [brand].", "Contact sales.", "Read the docs."
- Eyebrow: usually skipped or single category word.

NEVER use: Superlatives ("best", "leading", "#1"), exclamation marks,
rhetorical questions, "game-changing", "disruptive", "world-class".`;

const workwearBrief = `WORKWEAR BROWN — DURABLE, NO-FRILLS VOICE
──────────────────────────────────────────

Write like Carhartt WIP. Workwear honesty. No frills. Built to be used.

VOICE
- Direct and concrete. Name the material, the construction, the weight.
- SHORT sentences (8-14 words). Statements, not promises.
- Spec-led: "12-oz canvas. Triple-stitched. Made in Mexico."
- No purple prose. No emotional appeals. The work makes the case.
- Trade vocabulary: "duck canvas", "rivets", "selvedge", "double-knee."

STRUCTURE
- Hero headline: 3-6 words. Often product name + a spec.
- Hero subhead: 1-2 sentences listing build details + use case.
- CTA: imperative, plain. "Shop the line.", "Find a stockist."
- Eyebrow: category in caps. "WORKWEAR" / "DETROIT, MI."

NEVER use: "Legendary", "premium", "luxury", "adventurer", emotional
appeals about lifestyle, exclamation marks, adjective stacking.`;

// ============================================================
// The 8 palettes
// ============================================================

export const PALETTES: Palette[] = [
  {
    id: "quiet-cream",
    name: "Quiet cream",
    tagline: "Refined, editorial, considered.",
    accent: "#2b2018",
    supporting: ["#c4b89a", "#8a7e60", "#fbf6e8"],
    light: {
      bg: "#fbf6e8",
      ink: "#2b2018",
      inkMuted: "#6b5d4f",
      rim: "rgba(43,32,24,0.14)",
    },
    dark: {
      bg: "#0e0c08",
      ink: "#fbf6e8",
      inkMuted: "#9c8f78",
      rim: "rgba(251,246,232,0.1)",
    },
    claudeBrief: quietCreamBrief,
  },
  {
    id: "royal-violet",
    name: "Royal violet",
    tagline: "Premium SaaS. Confident.",
    accent: "#7a55ff",
    supporting: ["#a78bfa", "#5b8bff", "#c4b5fd"],
    light: {
      bg: "#fafaff",
      ink: "#1a0a3e",
      inkMuted: "#6b4d8f",
      rim: "rgba(122,85,255,0.15)",
    },
    dark: {
      bg: "#0a0a0c",
      ink: "#fafaff",
      inkMuted: "#9f8fc0",
      rim: "rgba(255,255,255,0.08)",
    },
    claudeBrief: royalVioletBrief,
  },
  {
    id: "sharp-mono",
    name: "Sharp mono",
    tagline: "Minimal, clean, intentional.",
    accent: "#1d1d1f",
    supporting: ["#86868b", "#d2d2d7", "#f5f5f7"],
    light: {
      bg: "#ffffff",
      ink: "#1d1d1f",
      inkMuted: "#86868b",
      rim: "rgba(0,0,0,0.1)",
    },
    dark: {
      bg: "#000000",
      ink: "#f5f5f7",
      inkMuted: "#86868b",
      rim: "rgba(255,255,255,0.12)",
    },
    claudeBrief: sharpMonoBrief,
  },
  {
    id: "forest",
    name: "Forest",
    tagline: "Earthy, honest, mission-led.",
    accent: "#3d6f3e",
    supporting: ["#94b894", "#d4a574", "#8b5e3c"],
    light: {
      bg: "#f7f3e8",
      ink: "#2d3d2e",
      inkMuted: "#6f7d6f",
      rim: "rgba(61,111,62,0.15)",
    },
    dark: {
      bg: "#0e1612",
      ink: "#d4dcd4",
      inkMuted: "#8a9c8a",
      rim: "rgba(148,184,148,0.12)",
    },
    claudeBrief: forestBrief,
  },
  {
    id: "sunshine",
    name: "Sunshine",
    tagline: "Bold, graphic, high-contrast.",
    accent: "#fcd757",
    supporting: ["#000000", "#fff6c4", "#9c7a00"],
    light: {
      bg: "#fffceb",
      ink: "#1a1a1a",
      inkMuted: "#5a5a5a",
      rim: "rgba(0,0,0,0.12)",
    },
    dark: {
      bg: "#0a0a05",
      ink: "#fcd757",
      inkMuted: "#9c8a47",
      rim: "rgba(252,215,87,0.18)",
    },
    claudeBrief: sunshineBrief,
  },
  {
    id: "soft-blush",
    name: "Soft blush",
    tagline: "Accessible, warm, lowercase.",
    accent: "#db5a85",
    supporting: ["#f4afa8", "#fbd5d5", "#fff0ed"],
    light: {
      bg: "#fffafa",
      ink: "#2d1a1a",
      inkMuted: "#9c6a6f",
      rim: "rgba(219,90,133,0.15)",
    },
    dark: {
      bg: "#1c0e0e",
      ink: "#fbd5d5",
      inkMuted: "#9c7878",
      rim: "rgba(251,213,213,0.12)",
    },
    claudeBrief: softBlushBrief,
  },
  {
    id: "steel-blue",
    name: "Steel blue",
    tagline: "Polished, technical, adult.",
    accent: "#635bff",
    supporting: ["#5b8bff", "#a3c4ff", "#dbe9ff"],
    light: {
      bg: "#ffffff",
      ink: "#0a2540",
      inkMuted: "#425466",
      rim: "rgba(99,91,255,0.15)",
    },
    dark: {
      bg: "#0a0e1c",
      ink: "#c4d4f0",
      inkMuted: "#8a98b8",
      rim: "rgba(99,91,255,0.18)",
    },
    claudeBrief: steelBlueBrief,
  },
  {
    id: "workwear-brown",
    name: "Workwear brown",
    tagline: "Durable, spec-led, used.",
    accent: "#b88746",
    supporting: ["#d4a574", "#f0d9b5", "#2a1c0e"],
    light: {
      bg: "#f5ecd9",
      ink: "#2a1c0e",
      inkMuted: "#7a6748",
      rim: "rgba(184,135,70,0.18)",
    },
    dark: {
      bg: "#1c1610",
      ink: "#d4c4a8",
      inkMuted: "#9c8a6c",
      rim: "rgba(184,135,70,0.18)",
    },
    claudeBrief: workwearBrief,
  },
];

export function getPalette(id: string): Palette | null {
  return PALETTES.find((p) => p.id === id) ?? null;
}

export function getRender(palette: Palette, theme: Theme): ThemeRender {
  return theme === "light" ? palette.light : palette.dark;
}

/**
 * Compose the style brief injected into the wow system prompt.
 * Includes BOTH the copy brief AND a note about the chosen visual
 * identity so the agent makes copy that fits the palette's mood.
 */
export function composeStyleBrief(
  paletteId: string | null | undefined,
  theme: Theme | null | undefined,
): string {
  if (!paletteId) return "";
  const palette = getPalette(paletteId);
  if (!palette) return "";

  const modeNote =
    theme === "dark"
      ? `The brand is rendering in DARK MODE — copy should feel premium and considered, like the lights are low and the work is in the spotlight.`
      : theme === "light"
        ? `The brand is rendering in LIGHT MODE — copy should feel clean, considered, and confident in plain daylight.`
        : "";

  return `═══════════════════════════════════════════════════
PALETTE VOICE — OVERRIDES EVERYTHING BELOW
═══════════════════════════════════════════════════

THIS BLOCK SETS THE VOICE. The next system block (the wow creative
director prompt) has concrete examples in a default Linear-SaaS tight
register ("Drop One.", "Mile 27") — those examples are about QUALITY
BAR and STRUCTURE, not voice. The actual voice for THIS user's output
comes from the brief below.

If the wow prompt's "Mile 27" example uses tight 4-word headlines but
the brief below asks for Aesop-style long restrained sentences, FOLLOW
THE BRIEF. If the wow prompt examples never use CAPS but the brief
calls for Off-White CAPS, USE CAPS. The brief wins, every time.

The user chose "${palette.name}" (${palette.tagline.toLowerCase()})
as the brand's identity. Every piece of copy you write — Hero, Subhead,
Social, Ad — must read like the brief below. Voice, sentence length,
cadence, structure, vocabulary, what to avoid.

${modeNote}

${palette.claudeBrief}

═══════════════════════════════════════════════════
SELF-CHECK BEFORE YOU RESPOND
═══════════════════════════════════════════════════

After drafting, ask yourself:
1. Does my hero headline match the structure described in the brief?
   (Length, punctuation, ending, ALL-CAPS/lowercase rule.)
2. Do I use any words on the brief's NEVER list?
3. Does my voice feel like the brand the brief references (Aesop,
   Linear, Apple, Patagonia, Off-White, Glossier, Stripe, Carhartt)?

If any answer is no, REWRITE. Don't ship generic "premium AI brand"
output — that's the failure mode this brief exists to prevent.
`;
}
