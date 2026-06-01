# Voice samples — drop your ElevenLabs MP3s here

The voice picker at `/onboarding/voice` loads four sample MP3s from this
folder. Until they exist, each voice card shows "Sample missing — see
/voices/README.md."

## 5-minute setup

1. Sign in at [elevenlabs.io](https://elevenlabs.io) (free tier covers
   ~10,000 characters/month — more than enough for these samples).
2. Open **Speech Synthesis** in their dashboard.
3. For each of the four voices below, generate one MP3 by speaking the
   **exact same script** (so users compare voices, not words):

   ```
   Hi. I'm your WRKS agent. Tell me what to build, and I'll get to work.
   ```

4. Pick voices that match the vibe — these are suggestions, swap freely:

   | Filename | Suggested ElevenLabs voice | Vibe |
   |----------|----------------------------|---------------------------------|
   | `atlas.mp3` | Adam / Brian / Drew | Confident, deep — pairs with Maven |
   | `iris.mp3` | Charlotte / Lily / Serena | Warm, measured — pairs with Sage |
   | `rio.mp3` | Alice / Domi / Freya | Bright, casual — pairs with Spark |
   | `nova.mp3` | Jessica / George / River | Clear, neutral — pairs with Echo |

5. Download each as MP3 and save into this directory using the filenames
   above. Final structure:

   ```
   apps/app/public/voices/
     ├── README.md  (this file)
     ├── atlas.mp3
     ├── iris.mp3
     ├── rio.mp3
     └── nova.mp3
   ```

6. After dropping the files in, hard-refresh `/onboarding/voice`. The play
   buttons should now work and the waveform animates when audio is
   playing.

## Voice IDs (for production runtime TTS)

When we wire the live agent in Q3, we'll call the ElevenLabs API at
runtime using each voice's ID. Update `apps/app/src/lib/voices.ts` so the
`elevenLabsId` field of each voice matches the ID shown in your ElevenLabs
dashboard (next to the voice name).

## Why ElevenLabs

Section 2.2 of the founding brief: voice = ElevenLabs Conversational AI.
Section 11: ElevenLabs is the Q2 partnership target.

## Sample script — keep it identical

If you change the line, change it for **all four** voices. Comparison
breaks when the words differ.
