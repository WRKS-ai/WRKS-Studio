// Personality dimensions per founding brief Section 2.2:
//   direct vs. encouraging · formal vs. casual · brief vs. detailed
// Four distinct combinations — the brief allows 3–6 personalities.

export type PersonalityId = "maven" | "sage" | "spark" | "echo";
export type IconType = "arrow" | "lens" | "starburst" | "pulse";

export type Personality = {
  id: PersonalityId;
  name: string;
  tagline: string;
  traits: string[]; // 3 chips — one per behavioral dimension
  sample: string; // a line in this voice
  suggestedNames: string[]; // shown as quick-pick chips on the naming step
  iconType: IconType; // distinct glyph per personality (no more "all orbs")
  accent: string; // hex string for the icon fill / accent color
  accentDeep: string; // darker shade for gradient depth
  glow: string; // rgba glow for the halo
  motion: {
    duration: number; // primary motion cycle (seconds)
    delay: number; // stagger between layers if applicable
    intensity: number; // halo opacity at peak (0-1)
    ease: number[]; // cubic-bezier
  };
};

export const PERSONALITIES: Personality[] = [
  {
    id: "maven",
    name: "Maven",
    tagline: "The operator. Builds fast, briefs hard.",
    traits: ["Direct", "Formal", "Brief"],
    sample: "Got it. Building. Eight seconds.",
    suggestedNames: ["Atlas", "Vega", "Helix", "Apex"],
    iconType: "arrow",
    accent: "#a78bfa",
    accentDeep: "#6d28d9",
    glow: "rgba(167,139,250,0.5)",
    motion: {
      duration: 1.6,
      delay: 0,
      intensity: 0.6,
      ease: [0.32, 0, 0.32, 1],
    },
  },
  {
    id: "sage",
    name: "Sage",
    tagline: "The strategist. Thinks three steps ahead.",
    traits: ["Encouraging", "Formal", "Detailed"],
    sample:
      "Before I draft this — what's the bigger play? I want to make sure it lands.",
    suggestedNames: ["Iris", "Wren", "Linden", "Lyra"],
    iconType: "lens",
    accent: "#34d399",
    accentDeep: "#047857",
    glow: "rgba(52,211,153,0.45)",
    motion: {
      duration: 5.2,
      delay: 1.4,
      intensity: 0.5,
      ease: [0.4, 0, 0.6, 1],
    },
  },
  {
    id: "spark",
    name: "Spark",
    tagline: "The friend in your corner. Warm, casual, fast.",
    traits: ["Encouraging", "Casual", "Brief"],
    sample: "Easy one. Be right back with three options.",
    suggestedNames: ["Ember", "Sunny", "Pip", "Rio"],
    iconType: "starburst",
    accent: "#f472b6",
    accentDeep: "#be185d",
    glow: "rgba(244,114,182,0.5)",
    motion: {
      duration: 2.4,
      delay: 0.6,
      intensity: 0.7,
      ease: [0.18, 1.2, 0.4, 1],
    },
  },
  {
    id: "echo",
    name: "Echo",
    tagline: "The pro. Shows you the work as it goes.",
    traits: ["Direct", "Casual", "Detailed"],
    sample:
      "Pulling your brand voice. Drafting. Cross-checking with last month's winner.",
    suggestedNames: ["Ash", "Nova", "Kai", "Onyx"],
    iconType: "pulse",
    accent: "#60a5fa",
    accentDeep: "#1e40af",
    glow: "rgba(96,165,250,0.45)",
    motion: {
      duration: 3.0,
      delay: 0.75,
      intensity: 0.5,
      ease: [0.5, 0, 0.5, 1],
    },
  },
];
