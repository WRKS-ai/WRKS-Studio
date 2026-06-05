"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DarkAvatar } from "@/components/dark-avatar";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { VoiceRow } from "@/components/voice-row";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";
import { VOICES, type VoiceId } from "@/lib/voices";

// /onboarding/voice v2 — typography-led, asymmetric.
// Top section: hero question on the left + dark avatar on the right.
// Bottom section: voice list as an editorial track listing. The bloom
// tint follows whichever voice is currently selected (or falls back to
// the personality accent) so the canvas warms as the user previews.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";

export default function VoicePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
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
  const selectedVoiceObj = VOICES.find((v) => v.id === selectedVoice) ?? null;
  const tintObj = selectedVoiceObj ?? personality;

  const onContinue = () => {
    if (!selectedVoice) return;
    localStorage.setItem(VOICE_KEY, selectedVoice);
    router.push("/onboarding/intake");
  };

  return (
    <OnboardingFrame step={3} totalSteps={7} bloomTint={tintObj.accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 pt-16 pb-20 flex flex-col items-center">
        <div className="w-full max-w-[1280px] flex flex-col flex-1">
          {/* Top hero — asymmetric question + dark avatar */}
          <div
            className="grid items-center gap-10 lg:gap-16"
            style={{
              gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
            }}
          >
            {/* LEFT — eyebrow + hero question + italic prompt */}
            <div className="relative">
              <motion.div
                initial={
                  reduced ? false : { opacity: 0, y: 8, filter: "blur(6px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                className="text-[11px] tracking-[0.28em] uppercase mb-7 flex items-center gap-3"
                style={{
                  color: "rgba(245,240,230,0.42)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span
                  className="inline-block h-px w-7"
                  style={{
                    background: tintObj.accent,
                    boxShadow: `0 0 6px ${tintObj.accent}`,
                  }}
                />
                <span>The voice · 03 of 07</span>
              </motion.div>

              <motion.h1
                initial={
                  reduced ? false : { opacity: 0, y: 14, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.7,
                  delay: 0.05,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="font-serif font-medium"
                style={{
                  fontSize: "clamp(2.75rem, 5.2vw, 4.5rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.03em",
                  color: "rgba(245,240,230,0.98)",
                }}
              >
                How does your{" "}
                <motion.span
                  animate={{ color: tintObj.accent }}
                  transition={{ duration: 0.5 }}
                  style={{ color: tintObj.accent }}
                >
                  {agentName || personality.name}
                </motion.span>
                <span style={{ color: tintObj.accent }}>.</span>
                <br />
                <span style={{ color: "rgba(245,240,230,0.98)" }}>sound?</span>
              </motion.h1>

              <motion.p
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.18,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mt-6 font-serif italic max-w-[44ch]"
                style={{
                  fontSize: "clamp(1.0625rem, 1.4vw, 1.25rem)",
                  lineHeight: 1.45,
                  color: "rgba(245,240,230,0.55)",
                }}
              >
                Tap a voice to hear them say{" "}
                <span
                  className="not-italic"
                  style={{ color: "rgba(245,240,230,0.85)" }}
                >
                  &ldquo;Hi. I&rsquo;m your WRKS agent.&rdquo;
                </span>{" "}
                Tap again to stop.
              </motion.p>
            </div>

            {/* RIGHT — dark avatar of the chosen personality */}
            <div className="relative flex items-center justify-center min-h-[280px]">
              <motion.div
                initial={
                  reduced
                    ? false
                    : { opacity: 0, scale: 0.94, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 0.8,
                  delay: 0.15,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
              >
                <DarkAvatar personality={personality} size={240} />
              </motion.div>
            </div>
          </div>

          {/* Voice rows — editorial track listing */}
          <div className="mt-10 lg:mt-12 w-full">
            {/* Top hairline to mark the list */}
            <div
              aria-hidden
              className="h-px w-full"
              style={{ background: "rgba(245,240,230,0.06)" }}
            />
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

          {/* Bottom row — Back + Continue pill */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.9,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="relative mt-10 flex items-center justify-between gap-8"
          >
            <button
              type="button"
              onClick={() => router.push("/onboarding/name")}
              className="text-[11px] tracking-[0.24em] uppercase transition-colors hover:opacity-100"
              style={{
                color: "rgba(245,240,230,0.4)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ← Back
            </button>

            <motion.button
              type="button"
              onClick={onContinue}
              disabled={!selectedVoiceObj}
              whileHover={
                reduced || !selectedVoiceObj
                  ? undefined
                  : {
                      scale: 1.03,
                      borderColor: `${selectedVoiceObj.accent}cc`,
                      backgroundColor: `${selectedVoiceObj.accent}14`,
                      boxShadow: `0 0 38px -4px ${selectedVoiceObj.accent}cc, inset 0 0 16px ${selectedVoiceObj.accent}22`,
                    }
              }
              whileTap={selectedVoiceObj ? { scale: 0.97 } : undefined}
              transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
              className="inline-flex items-center gap-3 h-12 px-6 rounded-full font-serif relative disabled:cursor-not-allowed"
              style={{
                fontSize: 16,
                background: "transparent",
                border: `1px solid ${
                  selectedVoiceObj
                    ? `${selectedVoiceObj.accent}66`
                    : "rgba(245,240,230,0.1)"
                }`,
                color: selectedVoiceObj
                  ? "rgba(245,240,230,0.96)"
                  : "rgba(245,240,230,0.3)",
                boxShadow: selectedVoiceObj
                  ? `0 0 24px -8px ${selectedVoiceObj.accent}88`
                  : "none",
                opacity: selectedVoiceObj ? 1 : 0.65,
              }}
            >
              <span>
                {selectedVoiceObj ? (
                  <>
                    Continue with{" "}
                    <span style={{ color: selectedVoiceObj.accent }}>
                      {selectedVoiceObj.name}
                    </span>
                  </>
                ) : (
                  "Pick a voice to continue"
                )}
              </span>
              {selectedVoiceObj && (
                <motion.span
                  aria-hidden
                  className="inline-block"
                  style={{ color: selectedVoiceObj.accent }}
                  animate={reduced ? undefined : { x: [0, 4, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  →
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </OnboardingFrame>
  );
}
