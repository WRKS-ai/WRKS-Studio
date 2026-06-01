// Voice options per founding brief Section 2.2:
//   "User names the agent and selects a voice (ElevenLabs Conversational AI)"
//
// We map four ElevenLabs voices, each suited to one of our four
// personalities. Samples live as static MP3s in /public/voices/.
// Real-time TTS will use the same voice IDs via the ElevenLabs API
// once the agent ships (Q3 per the brief).

export type VoiceId = "atlas" | "iris" | "rio" | "nova";

export type Voice = {
  id: VoiceId;
  name: string;
  tagline: string;
  pairsWith: string; // "Pairs well with Maven"
  // ElevenLabs voice ID — used by the runtime TTS in production.
  // Replace these with the actual IDs from your ElevenLabs library after
  // you've picked the four voices that match each tagline.
  elevenLabsId: string;
  // Path to the pre-generated MP3 sample. If absent at runtime, the UI
  // shows an "Add this voice" empty state with a link to the guide.
  sample: string;
  // Display gradient for the play button + waveform tint.
  accent: string;
  accentDeep: string;
  glow: string;
};

export const VOICES: Voice[] = [
  {
    id: "atlas",
    name: "Atlas",
    tagline: "Confident, deep, decisive.",
    pairsWith: "Pairs well with Maven",
    elevenLabsId: "REPLACE_WITH_ELEVENLABS_ID",
    sample: "/voices/atlas.mp3",
    accent: "#a78bfa",
    accentDeep: "#6d28d9",
    glow: "rgba(167,139,250,0.45)",
  },
  {
    id: "iris",
    name: "Iris",
    tagline: "Warm, measured, patient.",
    pairsWith: "Pairs well with Sage",
    elevenLabsId: "REPLACE_WITH_ELEVENLABS_ID",
    sample: "/voices/iris.mp3",
    accent: "#34d399",
    accentDeep: "#047857",
    glow: "rgba(52,211,153,0.4)",
  },
  {
    id: "rio",
    name: "Rio",
    tagline: "Bright, casual, friendly.",
    pairsWith: "Pairs well with Spark",
    elevenLabsId: "REPLACE_WITH_ELEVENLABS_ID",
    sample: "/voices/rio.mp3",
    accent: "#f472b6",
    accentDeep: "#be185d",
    glow: "rgba(244,114,182,0.45)",
  },
  {
    id: "nova",
    name: "Nova",
    tagline: "Clear, professional, neutral.",
    pairsWith: "Pairs well with Echo",
    elevenLabsId: "REPLACE_WITH_ELEVENLABS_ID",
    sample: "/voices/nova.mp3",
    accent: "#60a5fa",
    accentDeep: "#1e40af",
    glow: "rgba(96,165,250,0.4)",
  },
];

// The script every voice sample should speak — keeps comparisons fair.
export const SAMPLE_SCRIPT =
  "Hi. I'm your WRKS agent. Tell me what to build, and I'll get to work.";
