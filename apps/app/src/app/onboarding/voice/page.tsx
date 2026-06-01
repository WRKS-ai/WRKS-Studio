"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PersonalityIcon } from "@/components/personality-icon";
import { VoiceRow } from "@/components/voice-row";
import {
  PERSONALITIES,
  type PersonalityId,
} from "@/lib/personalities";
import { VOICES, type VoiceId } from "@/lib/voices";

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";

const HEADING = ["How", "do", "they", "sound?"];

export default function VoicePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<VoiceId | null>(null);
  const [playingVoice, setPlayingVoice] = useState<VoiceId | null>(null);

  useEffect(() => {
    const p = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
    if (!p || !PERSONALITIES.some((x) => x.id === p)) {
      router.replace("/onboarding/personality");
      return;
    }
    const n = localStorage.getItem(NAME_KEY);
    if (!n) {
      router.replace("/onboarding/name");
      return;
    }
    setPersonalityId(p);
    setAgentName(n);
    const v = localStorage.getItem(VOICE_KEY) as VoiceId | null;
    if (v && VOICES.some((x) => x.id === v)) {
      setSelectedVoice(v);
    }
  }, [router]);

  if (!personalityId) return null;
  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const selectedVoiceObj = VOICES.find((v) => v.id === selectedVoice);

  const onContinue = () => {
    if (!selectedVoice) return;
    localStorage.setItem(VOICE_KEY, selectedVoice);
    router.push("/onboarding/intake");
  };

  return (
    <OnboardingShell tint={(selectedVoiceObj ?? personality).glow}>
      <div className="w-full max-w-[820px] flex flex-col items-center text-center">
        {/* Step indicator */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="text-[10px] tracking-[0.28em] uppercase text-ink-dim font-mono mb-2"
        >
          Act Three of Four · Give {agentName} a voice
        </motion.div>

        {/* Progress dots */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-2 mt-3 mb-8 sm:mb-10"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === 2 ? 26 : 8,
                height: 3,
                background:
                  i < 2
                    ? personality.accent
                    : i === 2
                      ? "rgba(255,255,255,0.65)"
                      : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </motion.div>

        {/* Hero heading */}
        <h1 className="font-serif font-medium tracking-tight text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.98] text-ink max-w-[16ch]">
          {HEADING.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: 0.1 + i * 0.06,
                duration: 0.8,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subheading */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
          className="mt-5 max-w-xl text-[15px] sm:text-base text-ink-muted leading-relaxed font-serif italic"
        >
          Tap each one to hear them say <span className="text-ink">&ldquo;Hi. I&rsquo;m your WRKS agent.&rdquo;</span>
        </motion.p>

        {/* Personality reminder */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-10 sm:mt-12 flex flex-col items-center"
        >
          <PersonalityIcon personality={personality} size="sm" />
          <div className="mt-3 font-serif italic text-[14px] text-ink-muted">
            {agentName} <span className="text-ink-dim">·</span> {personality.name}
          </div>
        </motion.div>

        {/* Voice rows — track listing, not card grid */}
        <div className="mt-12 sm:mt-14 w-full flex flex-col">
          {VOICES.map((voice, i) => (
            <VoiceRow
              key={voice.id}
              voice={voice}
              index={i}
              selected={selectedVoice === voice.id}
              isPlaying={playingVoice === voice.id}
              onSelect={() => setSelectedVoice(voice.id)}
              onPlayChange={({ playing, voiceId }) =>
                setPlayingVoice(playing ? voiceId : null)
              }
            />
          ))}
        </div>

        {/* Footer line */}
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-10 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono"
        >
          Powered by ElevenLabs · Same voice across calls + the app + your phone
        </motion.p>

        {/* Inline continue + back */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mt-10 sm:mt-12 h-12 flex items-center justify-center gap-8"
        >
          <button
            type="button"
            onClick={() => router.push("/onboarding/name")}
            className="text-[12px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink-muted transition-colors font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md px-1.5 py-1"
          >
            ← Back
          </button>
          {selectedVoiceObj && (
            <motion.button
              type="button"
              onClick={onContinue}
              initial={reduced ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              whileHover={reduced ? undefined : { x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-3 font-serif text-[clamp(1.125rem,1.6vw,1.375rem)] text-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md px-2 py-1"
            >
              <span>
                Continue with{" "}
                <span style={{ color: selectedVoiceObj.accent }}>
                  {selectedVoiceObj.name}
                </span>
              </span>
              <motion.span
                aria-hidden
                animate={reduced ? undefined : { x: [0, 3, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                →
              </motion.span>
            </motion.button>
          )}
        </motion.div>
      </div>
    </OnboardingShell>
  );
}
