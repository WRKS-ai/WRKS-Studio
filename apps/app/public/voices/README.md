# Voice samples — ElevenLabs MP3s

The voice picker at `/onboarding/voice` loads these four samples. Each
file pairs with one of the four agent personalities.

## Current samples

| File | ElevenLabs voice | Tagline | Pairs with |
|------|-----------------|----------------------------------|------------|
| `owen.mp3` | Owen | Engaging, clear storyteller | Maven (violet) |
| `iris.mp3` | Iris | Enticing, mysterious, warm | Sage (emerald) |
| `sara.mp3` | Sara | Soft, calm, gentle | Spark (rose) |
| `roger.mp3` | Roger | Laid-back, casual, resonant | Echo (sky) |

## Script every sample speaks

```
Hi. I'm your WRKS agent. Tell me what to build, and I'll get to work.
```

If you regenerate, keep this line identical for all four — the picker
lets users compare voices, not words.

## How to regenerate / replace

1. Sign in at [elevenlabs.io](https://elevenlabs.io)
2. Open **Speech Synthesis**, paste the script above
3. Pick the voice from the dropdown, generate, download as MP3
4. Save into this folder using the **lowercase filename** in the table
   above. Linux / Vercel is case-sensitive — `Owen.mp3` will 404, only
   `owen.mp3` works.

## Voice IDs (for runtime TTS — Q3)

When we wire the live agent (real-time ElevenLabs API calls, not
pre-recorded samples), update `apps/app/src/lib/voices.ts` so the
`elevenLabsId` field matches the ID shown in the ElevenLabs dashboard
next to each voice (it's a 20-character alphanumeric string under
"Voice ID").

Currently all four are placeholders (`REPLACE_WITH_ELEVENLABS_ID`).

## Picking different voices

The four current picks were chosen to match each personality's vibe:
- Maven (direct/formal/brief) → needs clarity → Owen
- Sage (encouraging/formal/detailed) → needs warmth → Iris
- Spark (encouraging/casual/brief) → needs friendliness → Sara
- Echo (direct/casual/detailed) → needs calm professionalism → Roger

Swap any voice by regenerating the corresponding MP3 — keep the filename
the same and the picker will pick up the new audio automatically on
next deploy.

## Why ElevenLabs

Brief Section 2.2: voice = ElevenLabs Conversational AI.
Brief Section 11: ElevenLabs is the Q2 partnership target.
