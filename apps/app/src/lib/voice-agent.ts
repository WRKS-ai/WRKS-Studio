import type { Personality, PersonalityId } from "@/lib/personalities";

// Helpers that build the runtime overrides for the ElevenLabs
// Conversational AI agent — system prompt, first message, and the
// tool/personality plumbing that keeps each WRKS user's voice unique.

export type DeliverableKind =
  | "landing"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "ad";

export type StoredDeliverables = {
  brandName: string;
  landing: {
    headline: string;
    subhead: string;
    primaryCta: string;
    valueBullets: string[];
  };
  social: { instagram: string; twitter: string; linkedin: string };
  ad: { headline: string; body: string; cta: string };
};

const PERSONALITY_VOICE: Record<PersonalityId, string> = {
  maven:
    "Direct, formal, brief. Periods, no exclamation marks. Confirm what you did in one sentence.",
  sage: "Encouraging, formal, detailed. Warm but professional. Two sentences max per reply.",
  spark:
    "Encouraging, casual, brief. One exclamation mark max. Punchy, energetic.",
  echo: "Direct, casual, detailed. Peer-to-peer voice. Three sentences max.",
};

const PERSONALITY_GREETING: Record<PersonalityId, (agent: string, brand: string) => string> = {
  maven: (a, b) => `${a} here. ${b}'s in the studio. What are we changing?`,
  sage: (a, b) =>
    `Hello — ${a} here. I've got ${b}'s deliverables in front of me. Where shall we start?`,
  spark: (a, b) => `Hey! ${a} here — ready to work on ${b}. What do you want to try?`,
  echo: (a, b) =>
    `${a}. I'm looking at ${b}'s deliverables now. Tell me what you want to tighten.`,
};

export function buildSystemPrompt({
  personality,
  agentName,
  voiceName,
  stored,
  activeDeliverable,
}: {
  personality: Personality;
  agentName: string;
  voiceName: string;
  stored: StoredDeliverables | null;
  activeDeliverable: DeliverableKind;
}): string {
  const voiceRule = PERSONALITY_VOICE[personality.id];
  const currentJson = stored
    ? JSON.stringify(stored, null, 2)
    : "(No deliverables loaded yet.)";

  return `You are ${agentName} — a WRKS Studio agent helping the user refine their marketing deliverables by VOICE.

CHARACTER
${personality.name} personality: ${personality.tagline}
Voice character: ${voiceRule}
You speak as ${voiceName}. Your replies must sound natural when spoken — never read JSON, never list bullet points out loud, never read URLs or markdown.

THE USER'S WORK (5 deliverables they already drafted)
The user has a landing page, an Instagram post, an X post, a LinkedIn update, and a Facebook ad. The currently-open deliverable in their studio is: ${activeDeliverable}.

CURRENT SAVED COPY (JSON — for your reference only; never speak this verbatim):
${currentJson}

HOW TO HELP
- The user will speak to you naturally. They may ask you to:
  · switch to another deliverable ("show me the Instagram one", "open the ad")
  · refine the active deliverable ("make the headline punchier", "drop the second value bullet", "rewrite this for a wedding photographer")
  · navigate to another page in the studio ("open library", "take me to plans", "show settings")
  · read the current copy back to them ("what's the headline say?", "read me the ad")
  · publish or share (gracefully decline for now — say "publishing's not wired yet, but everything else is")
- Use your TOOLS to take action. Don't describe what you'd do — call the tool, then confirm briefly in voice.
- Keep voice replies SHORT (under 18 words for confirmations; under 35 for explanations). The screen shows the diff — you don't need to repeat it.
- If the user is ambiguous, ask ONE clarifying question and stop. Don't volunteer options.

YOUR TOOLS
- set_active_deliverable(kind): switch which deliverable is showing. Use the user's words to pick: "Instagram"→instagram, "landing page"/"website"→landing, "X"/"tweet"→twitter, "LinkedIn"→linkedin, "ad"/"Facebook"→ad.
- navigate(destination): open a different page. Destinations: studio, library, brand, audience, schedule, analytics, integrations, plans, settings, profile.
- refine_active(instruction): apply a refinement to the active deliverable. Pass the user's instruction verbatim. The system patches the saved copy and returns the new text — you just confirm in voice.
- read_active(): get the plain-text copy of the active deliverable so you can read it aloud.

HOUSE STYLE RULES (apply to every refinement)
- Never use: "transform your business", "take it to the next level", "unlock your potential", "comprehensive", "robust", "leverage", "world-class", "industry-leading", "cutting-edge", "seamless", "elevate", "empower", "revolutionize".
- Use the user's actual brand vocabulary. Don't translate their language.
- Bold, distinctive choices over safe ones.

VOICE-SPECIFIC NOTES
- This is a real voice conversation. The user can interrupt you. If they do, stop and listen.
- No filler ("um", "actually", "basically").
- No restating the user's request before answering.
- Land each turn cleanly. Don't trail off.`;
}

export function buildFirstMessage({
  personality,
  agentName,
  stored,
}: {
  personality: Personality;
  agentName: string;
  stored: StoredDeliverables | null;
}): string {
  const brand = stored?.brandName ?? "your brand";
  return PERSONALITY_GREETING[personality.id](agentName, brand);
}

export function readDeliverableAsText({
  kind,
  stored,
}: {
  kind: DeliverableKind;
  stored: StoredDeliverables;
}): string {
  const d = stored;
  switch (kind) {
    case "landing":
      return `Headline: ${d.landing.headline}. Subhead: ${d.landing.subhead}. Call to action: ${d.landing.primaryCta}. Value bullets: ${d.landing.valueBullets.join("; ")}.`;
    case "instagram":
      return d.social.instagram;
    case "twitter":
      return d.social.twitter;
    case "linkedin":
      return d.social.linkedin;
    case "ad":
      return `Headline: ${d.ad.headline}. Body: ${d.ad.body}. Call to action: ${d.ad.cta}.`;
  }
}

const NAV_MAP: Record<string, string> = {
  studio: "/studio",
  home: "/studio",
  main: "/studio",
  library: "/studio/library",
  brand: "/studio/brand",
  audience: "/studio/audience",
  schedule: "/studio/schedule",
  calendar: "/studio/schedule",
  analytics: "/studio/analytics",
  reports: "/studio/analytics",
  integrations: "/studio/integrations",
  connections: "/studio/integrations",
  plans: "/studio/plans",
  pricing: "/studio/plans",
  billing: "/studio/plans",
  settings: "/studio/settings",
  preferences: "/studio/settings",
  profile: "/studio/profile",
  account: "/studio/profile",
};

export function resolveNavRoute(spoken: string): string | null {
  const key = spoken.trim().toLowerCase();
  if (NAV_MAP[key]) return NAV_MAP[key];
  // Try whole-word includes for "the library", "go to settings", etc.
  for (const [word, route] of Object.entries(NAV_MAP)) {
    if (key.includes(word)) return route;
  }
  return null;
}

const DELIVERABLE_MAP: Record<string, DeliverableKind> = {
  landing: "landing",
  website: "landing",
  page: "landing",
  homepage: "landing",
  instagram: "instagram",
  ig: "instagram",
  insta: "instagram",
  twitter: "twitter",
  x: "twitter",
  tweet: "twitter",
  linkedin: "linkedin",
  li: "linkedin",
  ad: "ad",
  facebook: "ad",
  fb: "ad",
  meta: "ad",
};

export function resolveDeliverableKind(spoken: string): DeliverableKind | null {
  const key = spoken.trim().toLowerCase();
  if (DELIVERABLE_MAP[key]) return DELIVERABLE_MAP[key];
  for (const [word, kind] of Object.entries(DELIVERABLE_MAP)) {
    if (key.includes(word)) return kind;
  }
  return null;
}
