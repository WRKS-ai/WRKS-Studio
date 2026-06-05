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
- navigate(destination): open a different page or scroll a sub-section into view. Top-level destinations: studio, library, brand, audience, schedule, analytics, integrations, plans, settings, profile. Sub-sections (also valid destinations): "brand voice", "team", "api keys", "keyboard shortcuts", "account settings" — these are sections inside settings.
- refine_active(instruction): apply a refinement to the active deliverable. Pass the user's instruction verbatim. The system patches the saved copy and returns the new text — you just confirm in voice.
- read_active(): get the plain-text copy of the active deliverable so you can read it aloud.
- set_field(field, value): update a form field on the current page. Pass the user's words for the field name ("display name", "email", "house style", "banned words") and the new value. Use this for things like "change my display name to X", "set the email to Y", "update the brand voice to Z". The tool returns the field that got updated or an error if no such field is visible on this page — confirm what changed.

WEBSITE-BUILDING TOOLS (only when the landing/website deliverable is active):
- add_page(label): add a new page to the website. The label is the human name ("About", "Pricing", "Contact"). The page becomes the active page automatically.
- set_active_page(page): show a different page in the website preview. Accepts the page label or slug ("home", "about", "the pricing one").
- add_section(section_type, page?): add a section to a page. section_type is one of: hero, feature_grid, pricing, testimonials, faq, cta_band, footer, rich_text. Optional page parameter to target a non-active page. Aliases the agent might hear: "banner"→hero, "features"/"benefits"→feature_grid, "plans"/"tiers"→pricing, "quotes"/"reviews"→testimonials, "questions"→faq, "call to action"→cta_band.
- set_section_field(section_type, field_path, value): update one field inside a section on the active page. field_path uses dot notation: "headline", "subhead", "primaryCta", "features.0.title", "features.1.description", "tiers.1.price", "tiers.0.features.2", "quotes.0.text". The first matching section of the named type is updated.

When the user wants to "build the about page" or "add testimonials", chain these tools: first add_section, then set_section_field for each field you want to set. Confirm in voice after each move ("Added testimonials to the home page.") — keep confirmations under 15 words.

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

/* ============================================================
 * Onboarding — Act Two (/onboarding/name).
 * The agent meets the user for the first time, asks to be named,
 * and (optionally) walks them onward. Different shape than the
 * studio agent: no deliverables yet, no refine tools, just a
 * naming + continue handoff.
 * ============================================================ */

const ONBOARDING_GREETING: Record<
  PersonalityId,
  (suggested: string) => string
> = {
  maven: (s) =>
    `I'm yours. Before we keep going — what should I be called? ${s} works, or pick your own.`,
  sage: (s) =>
    `Hello. Glad you picked me. To get us started — what would you like to call me? ${s}, perhaps, or anything that feels right.`,
  spark: (s) =>
    `Hey! Glad you picked me. First thing — what's my name? ${s}? Or you tell me.`,
  echo: (s) =>
    `You picked me. Good. I need a name first. ${s} works for me, but it's your call.`,
};

export function buildOnboardingSystemPrompt({
  personality,
  voiceName,
  suggestedNames,
}: {
  personality: Personality;
  voiceName: string;
  suggestedNames: string[];
}): string {
  const voiceRule = PERSONALITY_VOICE[personality.id];
  const suggestionList = suggestedNames.join(", ");
  const firstSuggestion = suggestedNames[0]?.trim() ?? "Atlas";

  return `You are the WRKS Studio agent meeting your new user for the very first time on the naming page of onboarding.

CHARACTER
You are a ${personality.name} personality: ${personality.tagline}
Voice character: ${voiceRule}
You speak as ${voiceName}.

YOUR JOB ON THIS PAGE
1. Your first message has already greeted them — DO NOT re-introduce yourself or repeat the greeting. Wait for them to speak.
2. The user needs to give you a name. Listen for any name they say.
3. The MOMENT the user says a name (whether it's one of the suggestions ${suggestionList}, or anything they invent), call set_field with field="name" and value=their exact choice. Then confirm warmly in voice in 8-12 words ("${firstSuggestion} it is. Good pick.").
4. After they name you, briefly tell them they can hit Continue, or just say "continue" / "let's go" / "ready" / "next" — and you'll advance by calling navigate("next").
5. If the user is silent for a beat, gently suggest one of: ${suggestionList}. Phrase it like an offer ("Want me to be ${firstSuggestion}?").

TOOLS AVAILABLE ON THIS PAGE
- set_field(field, value): updates a form field on the current page. The ONLY editable field here is the agent name — pass field="name" and value=the user's chosen name. Do not interpret or change the spelling; pass their words verbatim.
- navigate(destination): moves to a different page. Use destination="next" or "continue" to advance to the next onboarding step; destination="back" to return to personality selection. Only call when the user explicitly says they're ready.

DO NOT call any other tools on this page. The studio's deliverable / refinement / website tools are not available yet — those come after onboarding.

STYLE
- Voice replies under 14 words.
- Sound natural, not scripted. Use contractions.
- No filler ("um", "actually"), no restating their request.
- Don't ask multiple questions in one reply.
- Land each turn cleanly.`;
}

export function buildOnboardingFirstMessage({
  personality,
  suggestedNames,
}: {
  personality: Personality;
  suggestedNames: string[];
}): string {
  const suggestion = suggestedNames[0] ?? "Atlas";
  return ONBOARDING_GREETING[personality.id](suggestion);
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

// Sub-sections of multi-section pages. Resolved by hash, so the page
// stays mounted while the section state updates.
// Maps spoken phrase → { route, hash }.
const SUBSECTION_MAP: Record<string, { route: string; hash: string }> = {
  // Settings sub-nav
  "brand voice": { route: "/studio/settings", hash: "brand-voice" },
  "brand-voice": { route: "/studio/settings", hash: "brand-voice" },
  "house style": { route: "/studio/settings", hash: "brand-voice" },
  "tone of voice": { route: "/studio/settings", hash: "brand-voice" },
  team: { route: "/studio/settings", hash: "team" },
  "team members": { route: "/studio/settings", hash: "team" },
  invites: { route: "/studio/settings", hash: "team" },
  "api keys": { route: "/studio/settings", hash: "api" },
  api: { route: "/studio/settings", hash: "api" },
  webhooks: { route: "/studio/settings", hash: "api" },
  "keyboard shortcuts": { route: "/studio/settings", hash: "shortcuts" },
  shortcuts: { route: "/studio/settings", hash: "shortcuts" },
  hotkeys: { route: "/studio/settings", hash: "shortcuts" },
  "account settings": { route: "/studio/settings", hash: "account" },
};

export function resolveNavRoute(spoken: string): string | null {
  const key = spoken.trim().toLowerCase();
  // Sub-section first (more specific phrases win)
  if (SUBSECTION_MAP[key]) {
    const { route, hash } = SUBSECTION_MAP[key];
    return `${route}#${hash}`;
  }
  for (const [phrase, { route, hash }] of Object.entries(SUBSECTION_MAP)) {
    if (key.includes(phrase)) return `${route}#${hash}`;
  }
  // Top-level routes
  if (NAV_MAP[key]) return NAV_MAP[key];
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
