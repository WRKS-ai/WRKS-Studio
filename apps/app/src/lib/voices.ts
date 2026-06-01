// Voice options per founding brief Section 2.2:
//   "User names the agent and selects a voice (ElevenLabs Conversational AI)"
//
// Each voice is an ElevenLabs voice. Samples live as static MP3s in
// /public/voices/. The same voice IDs power real-time TTS at runtime
// once the agent ships (Q3 per the brief).

export type VoiceId = "owen" | "iris" | "sara" | "roger";

export type Voice = {
  id: VoiceId;
  name: string;
  tagline: string;
  pairsWith: string; // "Pairs well with Maven"
  // ElevenLabs voice ID — paste each from the dashboard → voice card.
  // Used by the runtime TTS in production.
  elevenLabsId: string;
  // Path to the pre-generated MP3 sample.
  sample: string;
  // Display gradient for the play button + waveform tint, mirrors the
  // paired personality's accent so the visual tie reads on the page.
  accent: string;
  accentDeep: string;
  glow: string;
};

export const VOICES: Voice[] = [
  {
    id: "owen",
    name: "Owen",
    tagline: "Engaging, clear storyteller.",
    pairsWith: "Pairs well with Maven",
    elevenLabsId: "REPLACE_WITH_ELEVENLABS_ID",
    sample: "/voices/owen.mp3",
    accent: "#a78bfa",
    accentDeep: "#6d28d9",
    glow: "rgba(167,139,250,0.45)",
  },
  {
    id: "iris",
    name: "Iris",
    tagline: "Enticing, mysterious, warm.",
    pairsWith: "Pairs well with Sage",
    elevenLabsId: "REPLACE_WITH_ELEVENLABS_ID",
    sample: "/voices/iris.mp3",
    accent: "#34d399",
    accentDeep: "#047857",
    glow: "rgba(52,211,153,0.4)",
  },
  {
    id: "sara",
    name: "Sara",
    tagline: "Soft, calm, gentle.",
    pairsWith: "Pairs well with Spark",
    elevenLabsId: "REPLACE_WITH_ELEVENLABS_ID",
    sample: "/voices/sara.mp3",
    accent: "#f472b6",
    accentDeep: "#be185d",
    glow: "rgba(244,114,182,0.45)",
  },
  {
    id: "roger",
    name: "Roger",
    tagline: "Laid-back, casual, resonant.",
    pairsWith: "Pairs well with Echo",
    elevenLabsId: "REPLACE_WITH_ELEVENLABS_ID",
    sample: "/voices/roger.mp3",
    accent: "#60a5fa",
    accentDeep: "#1e40af",
    glow: "rgba(96,165,250,0.4)",
  },
];

// The script every voice sample should speak — keeps comparisons fair.
export const SAMPLE_SCRIPT =
  "Hi. I'm your WRKS agent. Tell me what to build, and I'll get to work.";
