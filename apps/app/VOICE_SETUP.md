# WRKS Voice Agent — Setup

The voice agent runs on **ElevenLabs Conversational AI**. The browser opens a
real-time WebSocket session, you speak, the agent responds in your chosen voice,
and it invokes tools that update the studio (switch tabs, navigate routes,
refine copy via `/api/refine`).

## What you need (one-time)

1. **ElevenLabs account** — sign up at https://elevenlabs.io
2. **An Agent** — go to https://elevenlabs.io/app/conversational-ai/agents
   and create a new agent. Any settings — we override everything per-user at
   runtime (system prompt, voice, first message). Hit **Publish**.
3. **API key** with Conversational AI scope — Profile → API Keys → New
4. **Allow overrides** on the agent — open the agent, go to **Security** →
   **Allowed overrides**, and tick:
   - `agent.prompt.prompt`
   - `agent.first_message`
   - `agent.language`
   - `tts.voice_id`

   Without this, your runtime overrides are silently ignored.

## Env vars

Add to `.env.local`:

```
ELEVENLABS_API_KEY=sk_xxx
ELEVENLABS_AGENT_ID=agent_xxx
```

Both are server-only. The browser never sees them — the page fetches a
short-lived signed URL from `/api/voice/signed-url`.

For Vercel: add both as Production + Preview env vars.

## How a session works

1. User clicks the big orb at the bottom of the right inspector
2. Browser asks for mic permission (the click counts as a user gesture, so
   Safari/iOS are happy)
3. Client GETs `/api/voice/signed-url` — server calls ElevenLabs with our
   `ELEVENLABS_API_KEY` + `ELEVENLABS_AGENT_ID` and returns a short-lived
   signed URL
4. Client opens a WebSocket to that URL with **overrides** for:
   - Voice ID (the one the user picked in onboarding — Owen / Iris / Sara / Roger)
   - System prompt (built from the user's personality, agent name, brand voice,
     and current deliverables — see `src/lib/voice-agent.ts`)
   - First message (personality-appropriate greeting)
5. Agent greets the user, waits for them to talk
6. When the user speaks, the agent transcribes, decides what to do, and may
   invoke one of our **client tools**:
   - `set_active_deliverable(kind)` — switches the canvas tab
   - `navigate(destination)` — pushes a route (library, plans, settings, etc.)
   - `refine_active(instruction)` — calls `/api/refine` and applies the patch
   - `read_active()` — returns the current copy so the agent can read it aloud
7. UI shows real-time state: **Connecting → Listening → Speaking → Listening**
8. User clicks the orb again to end

## Voice IDs

Defaults in `src/lib/voices.ts` use ElevenLabs public voices (Adam, Matilda,
Sarah, Roger). You can swap these for your own voice clones — paste the ID
from the voice card in your ElevenLabs library.

## Things to know

- The agent's LLM is whatever you configured on the agent in the ElevenLabs
  dashboard (Claude Sonnet recommended). To use Claude with our own memory
  layer, switch the agent to "Custom LLM" and point it at a webhook in our
  app that proxies to Anthropic. (Not wired yet — Phase 2.)
- Signed URLs expire in ~15 min. Open sessions keep going. Each session start
  fetches a fresh one.
- `connectionType` is `websocket` because signed-URL sessions only support
  websocket (per the SDK). For WebRTC, switch to `agentId` instead of `signedUrl`.
