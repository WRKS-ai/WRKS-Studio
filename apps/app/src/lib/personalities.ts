// Personality dimensions per founding brief Section 2.2:
//   direct vs. encouraging · formal vs. casual · brief vs. detailed
// Four distinct combinations — the brief allows 3–6 personalities.

export type PersonalityId = "maven" | "sage" | "spark" | "echo";

export type Personality = {
  id: PersonalityId;
  name: string;
  tagline: string;
  traits: string[]; // 3 chips — one per behavioral dimension
  sample: string; // a line in this voice
  suggestedNames: string[]; // shown as quick-pick chips on the naming step
  gradient: string; // CSS gradient for the avatar mark
  ring: string; // rgba border color when selected
  glow: string; // rgba glow for the halo
  motion: {
    duration: number; // outer ring pulse duration (seconds)
    delay: number; // stagger between rings
    rings: number; // number of concentric rings
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
    gradient:
      "radial-gradient(circle at 32% 28%, #ffffff 0%, #ddd6fe 22%, #a78bfa 55%, #7c3aed 78%, #4c1d95 100%)",
    ring: "rgba(167,139,250,0.55)",
    glow: "rgba(167,139,250,0.5)",
    motion: {
      duration: 1.6,
      delay: 0,
      rings: 1,
      intensity: 0.6,
      ease: [0.32, 0, 0.32, 1], // snappy
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
    gradient:
      "radial-gradient(circle at 32% 28%, #ffffff 0%, #d1fae5 22%, #6ee7b7 50%, #10b981 78%, #064e3b 100%)",
    ring: "rgba(52,211,153,0.55)",
    glow: "rgba(52,211,153,0.45)",
    motion: {
      duration: 5.2,
      delay: 1.4,
      rings: 3,
      intensity: 0.5,
      ease: [0.4, 0, 0.6, 1], // smooth ease-in-out
    },
  },
  {
    id: "spark",
    name: "Spark",
    tagline: "The friend in your corner. Warm, casual, fast.",
    traits: ["Encouraging", "Casual", "Brief"],
    sample: "Easy one. Be right back with three options.",
    suggestedNames: ["Ember", "Sunny", "Pip", "Rio"],
    gradient:
      "radial-gradient(circle at 32% 28%, #ffffff 0%, #fce7f3 22%, #f472b6 55%, #db2777 78%, #831843 100%)",
    ring: "rgba(244,114,182,0.55)",
    glow: "rgba(244,114,182,0.5)",
    motion: {
      duration: 2.4,
      delay: 0.6,
      rings: 2,
      intensity: 0.7,
      ease: [0.18, 1.2, 0.4, 1], // bouncy
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
    gradient:
      "radial-gradient(circle at 32% 28%, #ffffff 0%, #dbeafe 22%, #60a5fa 50%, #2563eb 78%, #1e3a8a 100%)",
    ring: "rgba(56,189,248,0.55)",
    glow: "rgba(56,189,248,0.45)",
    motion: {
      duration: 3.0,
      delay: 0.75,
      rings: 4,
      intensity: 0.5,
      ease: [0.5, 0, 0.5, 1], // even rhythmic
    },
  },
];
