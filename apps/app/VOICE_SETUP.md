# WRKS Voice Agent — Setup

The voice agent runs on **ElevenLabs Conversational AI**. The browser opens a
real-time WebSocket session, the user speaks, the agent responds in the
configured voice, and it invokes client tools that update the studio (fill
fields, navigate routes, refine copy, edit the website).

## What you need (one-time)

1. **ElevenLabs account** — sign up at https://elevenlabs.io
2. **API key** with Conversational AI scope — Profile → API Keys → New

That's it. The agent itself is created and configured by a script in this
repo — no dashboard clicks required.

## Creating the agent

The agent's tool schema, system prompt, allowed overrides, voice, and LLM
all live in `apps/app/scripts/setup-voice-agent.mjs`. Edit that file when
behavior needs to change, then re-run.

**First run** (creates a brand-new agent):

```sh
ELEVENLABS_API_KEY=sk_xxx node apps/app/scripts/setup-voice-agent.mjs
```

Script prints the new `agent_id` at the end. Add it to your envs:

```
# apps/app/.env.local
ELEVENLABS_API_KEY=sk_xxx
ELEVENLABS_AGENT_ID=agent_xxx   # from the script output
```

Add the same two vars to Vercel → Project → Settings → Env Vars for
Production AND Preview.

**Subsequent runs** (updates the existing agent in place):

```sh
ELEVENLABS_API_KEY=sk_xxx \
ELEVENLABS_AGENT_ID=agent_xxx \
node apps/app/scripts/setup-voice-agent.mjs
```

When the script sees `ELEVENLABS_AGENT_ID` in env, it PATCHes that agent
with the latest config instead of creating a new one. Tools added,
system prompt updated, voice swapped — all hot-reloaded.

## What the script registers

- **Tools** (the LLM only calls tools that exist on the agent):
  - `set_field(field, value)` — universal form-field updater (onboarding name, settings display name, brand voice, anything)
  - `navigate(destination)` — page routing
  - `set_active_deliverable(kind)` — studio canvas tab switch
  - `refine_active(instruction)` — calls `/api/refine` and patches the active deliverable
  - `read_active()` — returns the current copy so the agent can read it aloud
  - `add_page`, `set_active_page`, `add_section`, `set_section_field` — website builder
- **Base system prompt** — character + style + tool-call discipline. Per-page system prompts (sent at runtime via overrides) replace this; this is the safety net.
- **First message** — "Hi. I'm here. What are we working on?" Per-page first messages override.
- **Voice** — Sara (`EXAVITQu4vr4xnSDxMAC`) by default. One voice across the whole product; we do **not** override `tts.voice_id` per session (the dashboard voice is canonical).
- **LLM** — `claude-sonnet-4-5` for reliable tool use.
- **Allowed overrides** — `agent.prompt.prompt`, `agent.first_message`, `agent.language` are overridable per session. `tts.voice_id` is **not** (intentional).

When you add a new client-side tool handler (e.g. via `useConversationClientTool("foo", …)`), add the matching tool definition to `TOOLS` in the script and re-run. The agent's LLM won't call a tool it doesn't know exists.

## How a session works

1. User lands on a page that needs voice (e.g. `/onboarding/name`)
2. Client GETs `/api/voice/signed-url` — server calls ElevenLabs with our `ELEVENLABS_API_KEY` + `ELEVENLABS_AGENT_ID` and returns a short-lived signed URL
3. Client opens a WebSocket to that URL with **overrides** for:
   - System prompt (page-specific — built by `src/lib/voice-agent.ts`)
   - First message (page-specific greeting)
   - Language (always `en` currently)
   - NOT voice (canonical)
4. Agent greets the user, listens, decides what to do, and may invoke any of the registered client tools
5. UI shows real-time state: **Connecting → Listening → Speaking → Listening**
6. Session ends when the user navigates away or explicitly stops

## Things to know

- Mic permission is one-time per origin. The onboarding flow pre-grants it on the personality-page `Continue` click so the next page can auto-start.
- Signed URLs expire in ~15 min. Open sessions keep going. Each session start fetches a fresh one.
- `connectionType` is `websocket` because signed-URL sessions only support websocket (per the SDK). For WebRTC, switch to `agentId` instead of `signedUrl`.
- If you need per-personality voices (Owen for Maven, Iris for Sage, etc.) at some point, that requires either (a) creating 4 agents and routing to the right one OR (b) re-enabling `tts.voice_id` override and trusting the per-session voice. Today we go with one voice for simplicity + consistency.
