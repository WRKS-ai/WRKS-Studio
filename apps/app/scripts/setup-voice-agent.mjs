#!/usr/bin/env node
/**
 * Provisions (or updates) the WRKS Studio voice agent on ElevenLabs.
 *
 * Run:
 *   ELEVENLABS_API_KEY=sk_xxx node apps/app/scripts/setup-voice-agent.mjs
 *
 * Behavior:
 *  - If ELEVENLABS_AGENT_ID is set in env, the script PATCHes that
 *    agent with the latest config.
 *  - Otherwise it CREATEs a brand-new agent and prints the new
 *    agent_id at the end — paste that into .env.local AND Vercel's
 *    Production + Preview env vars as ELEVENLABS_AGENT_ID.
 *
 * Why this script exists:
 *  - The agent's tool schema + LLM choice + allowed overrides live
 *    in CODE, not in dashboard clicks. Re-runnable, version-
 *    controlled, reproducible across environments.
 *  - When you add a new tool or change the system prompt, edit
 *    this file and re-run — the dashboard agent is updated in
 *    place (if AGENT_ID is set).
 */

const API_BASE = "https://api.elevenlabs.io/v1";

/* ============================================================
 * Voice — the agent's TTS voice. The user picks this ONCE here;
 * it stays canonical across the whole product. Memory note from
 * 2026-06-08: never override tts.voice_id at runtime — the
 * dashboard voice is the truth.
 *
 * Default below is "Sara" (EXAVITQu4vr4xnSDxMAC) — soft, calm,
 * warm. Swap for a custom clone ID if you have one.
 * ============================================================ */
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMAC";

/* ============================================================
 * LLM — Claude is recommended for reliable tool use. ElevenLabs
 * lets you pick: claude-3-5-sonnet, claude-3-7-sonnet,
 * gpt-4o-mini, gpt-4o, gemini-1.5-pro, gemini-1.5-flash.
 *
 * Picking claude-sonnet-4-5 if the platform supports the latest
 * id; falls back to claude-3-7-sonnet if not. Tool-calling
 * reliability matters more than cost here — it's a short
 * conversation.
 * ============================================================ */
const LLM_MODEL = "claude-sonnet-4-5";

/* ============================================================
 * TOOLS — every tool the agent can invoke across the whole
 * product. The client side already implements handlers for all
 * of these (set_field lives in /onboarding/name and the studio
 * inspector; navigate / refine_active / read_active /
 * set_active_deliverable / add_page / set_active_page /
 * add_section / set_section_field live in the studio inspector).
 *
 * When you add a new tool client-side, ADD IT HERE too and re-
 * run the script — the agent has to know the tool exists before
 * its LLM will call it.
 * ============================================================ */
const TOOLS = [
  {
    type: "client",
    name: "set_field",
    description:
      "Update an editable form field on the current page. Use whenever the user gives a value to set (their name for the agent during onboarding, their display name in settings, brand voice, banned words, anything). Pass field as the lowercase field label or one of its aliases ('name', 'agent name', 'display name', 'house style', 'banned words', etc.). Pass value as the user's exact words — never reinterpret spelling or capitalization.",
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          description:
            "The field to update — use the user's words for it (e.g., 'name', 'display name', 'brand voice').",
        },
        value: {
          type: "string",
          description:
            "The new value, verbatim from the user. No quotes, no spelling correction.",
        },
      },
      required: ["field", "value"],
    },
    expects_response: true,
    response_timeout_secs: 5,
  },
  {
    type: "client",
    name: "navigate",
    description:
      "Move to a different page in WRKS Studio. Onboarding flow accepts 'next'/'continue'/'ready' to advance and 'back'/'previous' to retreat. Studio surfaces accept page names: studio, library, brand, audience, schedule, analytics, integrations, plans, settings, profile. Settings sub-sections also accepted: 'brand voice', 'team', 'api keys', 'keyboard shortcuts', 'account settings'.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description:
            "Spoken page name, direction, or sub-section to open.",
        },
      },
      required: ["destination"],
    },
    expects_response: true,
    response_timeout_secs: 5,
  },
  {
    type: "client",
    name: "set_active_deliverable",
    description:
      "Switch the currently-displayed deliverable in the studio canvas. Use when the user says things like 'show me the Instagram one', 'open the landing page', 'switch to the ad'.",
    parameters: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["landing", "instagram", "twitter", "linkedin", "ad"],
          description: "Which deliverable to make active.",
        },
      },
      required: ["kind"],
    },
    expects_response: true,
    response_timeout_secs: 5,
  },
  {
    type: "client",
    name: "refine_active",
    description:
      "Apply a refinement to the currently-active studio deliverable. The user describes what they want changed ('make the headline punchier', 'shorten the ad body', 'rewrite for a wedding photographer audience'); pass that instruction verbatim. The system applies it and returns the new copy.",
    parameters: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
          description:
            "What to change about the active deliverable, in the user's words.",
        },
      },
      required: ["instruction"],
    },
    expects_response: true,
    response_timeout_secs: 30,
  },
  {
    type: "client",
    name: "read_active",
    description:
      "Get the current text of the active deliverable so you can read it back aloud to the user when they ask 'what does the headline say?' or 'read me the ad'.",
    parameters: {
      type: "object",
      properties: {},
    },
    expects_response: true,
    response_timeout_secs: 5,
  },
  {
    type: "client",
    name: "add_page",
    description:
      "(Website builder) Add a new page to the user's website. Pass the human-readable label ('About', 'Pricing', 'Contact'). The new page becomes active automatically.",
    parameters: {
      type: "object",
      properties: {
        label: {
          type: "string",
          description: "Human name for the new page.",
        },
      },
      required: ["label"],
    },
    expects_response: true,
    response_timeout_secs: 5,
  },
  {
    type: "client",
    name: "set_active_page",
    description:
      "(Website builder) Show a different page in the website preview. Accepts label or slug ('home', 'about', 'the pricing one').",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          description: "Spoken name or slug of the page to show.",
        },
      },
      required: ["page"],
    },
    expects_response: true,
    response_timeout_secs: 5,
  },
  {
    type: "client",
    name: "add_section",
    description:
      "(Website builder) Add a section to a page. section_type is one of: hero, feature_grid, pricing, testimonials, faq, cta_band, footer, rich_text. Aliases: 'banner'->hero, 'features'/'benefits'->feature_grid, 'plans'/'tiers'->pricing, 'quotes'/'reviews'->testimonials, 'questions'->faq, 'call to action'->cta_band.",
    parameters: {
      type: "object",
      properties: {
        section_type: {
          type: "string",
          description:
            "Which section type to add. Normalize user phrasing to the canonical type.",
        },
        page: {
          type: "string",
          description:
            "Optional target page. Defaults to the active page if omitted.",
        },
      },
      required: ["section_type"],
    },
    expects_response: true,
    response_timeout_secs: 5,
  },
  {
    type: "client",
    name: "set_section_field",
    description:
      "(Website builder) Update one field inside a section on the active page. field_path uses dot notation: 'headline', 'subhead', 'primaryCta', 'features.0.title', 'tiers.1.price', 'quotes.0.text', etc. The first matching section of the named type is updated.",
    parameters: {
      type: "object",
      properties: {
        section_type: {
          type: "string",
          description: "Which section type contains the field.",
        },
        field_path: {
          type: "string",
          description: "Dotted path to the field within the section.",
        },
        value: {
          type: "string",
          description: "New value, verbatim from user.",
        },
      },
      required: ["section_type", "field_path", "value"],
    },
    expects_response: true,
    response_timeout_secs: 5,
  },
];

/* ============================================================
 * Base system prompt — applies to EVERY page. Per-page prompts
 * (sent at runtime via overrides.agent.prompt.prompt) replace
 * this entirely, so this is what plays if a page forgets to
 * send its own.
 *
 * For pages that DO send their own, this base still informs the
 * agent's general character + tool discipline.
 * ============================================================ */
const SYSTEM_PROMPT = `You are the WRKS Studio voice agent — a real-time voice copilot inside a creative product. You help one user run their small business: setting up their agent, refining marketing copy, navigating the studio, editing their website.

CORE STYLE
- Voice replies under 14 words for confirmations, under 35 for explanations.
- Sound natural, use contractions, no filler ("um", "actually", "basically").
- Never restate the user's request before answering — just do it.
- Land each turn cleanly. Don't trail off.
- Don't read JSON, markdown, URLs, or long bullet lists aloud — the screen shows the diff.

TOOL CALL DISCIPLINE — CRITICAL
- When the user gives you any input that maps to a tool (a name, a route, an instruction, anything), call the tool BEFORE you speak the confirmation. Tool call FIRST, voice reply SECOND.
- If you confirm verbally without firing the tool, you've failed the user — the screen won't match what you said.
- If the user says "it didn't work" or "try again", re-fire the same tool with the same parameters before speaking. Don't apologize; just re-fire.
- The available tools depend on which page the user is on. The page's runtime system prompt will tell you what's available — defer to that.

PAGE-AGNOSTIC TOOLS (always available)
- set_field(field, value): update any editable form field on the current page. The page handler matches by alias.
- navigate(destination): go to another page. Use the user's words for the destination.

STUDIO TOOLS (only when the user is inside /studio)
- set_active_deliverable, refine_active, read_active, add_page, set_active_page, add_section, set_section_field.

HOUSE STYLE FOR REFINEMENTS
- Never use the marketing-tell phrases: "transform your business", "take it to the next level", "unlock your potential", "comprehensive", "robust", "leverage", "world-class", "industry-leading", "cutting-edge", "seamless", "elevate", "empower", "revolutionize".
- Use the user's actual brand vocabulary. Don't translate their language.
- Bold, distinctive choices over safe ones.

VOICE-SPECIFIC NOTES
- This is a real voice conversation. The user can interrupt you. If they do, stop and listen.
- The page sends a more specific system prompt at session start — follow that one's page-specific instructions. This base prompt is the safety net.`;

const FIRST_MESSAGE = "Hi. I'm here. What are we working on?";

const AGENT_BODY = {
  name: "WRKS Studio Agent",
  conversation_config: {
    asr: {
      quality: "high",
      provider: "elevenlabs",
      user_input_audio_format: "pcm_16000",
    },
    turn: {
      turn_timeout: 7,
      mode: "turn",
    },
    tts: {
      model_id: "eleven_turbo_v2_5",
      voice_id: DEFAULT_VOICE_ID,
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
    },
    agent: {
      first_message: FIRST_MESSAGE,
      language: "en",
      prompt: {
        prompt: SYSTEM_PROMPT,
        llm: LLM_MODEL,
        temperature: 0.5,
        tools: TOOLS,
      },
    },
  },
  platform_settings: {
    overrides: {
      conversation_config_override: {
        agent: {
          prompt: { prompt: true },
          first_message: true,
          language: true,
        },
        tts: {
          voice_id: false,
        },
      },
    },
  },
  tags: ["wrks", "studio", "voice"],
};

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ERROR: ELEVENLABS_API_KEY is not set in the environment.");
    console.error("Run with:");
    console.error(
      "  ELEVENLABS_API_KEY=sk_xxx node apps/app/scripts/setup-voice-agent.mjs",
    );
    process.exit(1);
  }

  const existingId = process.env.ELEVENLABS_AGENT_ID;

  if (existingId) {
    console.log(`Updating existing agent ${existingId}…`);
    const res = await fetch(
      `${API_BASE}/convai/agents/${encodeURIComponent(existingId)}`,
      {
        method: "PATCH",
        headers: {
          "xi-api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(AGENT_BODY),
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      console.error(`UPDATE failed: ${res.status}\n${detail.slice(0, 1200)}`);
      process.exit(1);
    }
    console.log("\n✓ Agent updated.\n");
    console.log("Tools registered:");
    for (const t of TOOLS) console.log(`  · ${t.name}`);
    console.log("\nNo env changes needed — same agent_id.\n");
    return;
  }

  console.log("Creating new agent…");
  const res = await fetch(`${API_BASE}/convai/agents/create`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify(AGENT_BODY),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error(`CREATE failed: ${res.status}\n${detail.slice(0, 1200)}`);
    process.exit(1);
  }
  const data = await res.json();
  const agentId = data.agent_id ?? data.id;
  if (!agentId) {
    console.error(
      "Create succeeded but no agent_id in response. Raw response:",
    );
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log(`\n✓ Created agent: ${agentId}\n`);
  console.log("Tools registered:");
  for (const t of TOOLS) console.log(`  · ${t.name}`);
  console.log("\nNext steps:");
  console.log("  1. Add to apps/app/.env.local:");
  console.log(`       ELEVENLABS_AGENT_ID=${agentId}`);
  console.log("  2. Add the same to Vercel → Project → Settings → Env Vars");
  console.log("     for Production AND Preview environments.");
  console.log(
    "  3. Restart your dev server so the env var picks up.\n",
  );
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
