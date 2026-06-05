"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DarkAvatar } from "@/components/dark-avatar";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";

// /onboarding/name v2 — typography-first, asymmetric.
// Question is the hero; the input picks up the same editorial scale
// directly below it. Suggested names sit as quiet serif italic chips
// further down. Dark avatar of the chosen personality floats on the
// right to remind the user who they're naming.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const MAX_LEN = 24;

export default function NamePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
    if (!saved || !PERSONALITIES.some((p) => p.id === saved)) {
      router.replace("/onboarding/personality");
      return;
    }
    setPersonalityId(saved);
    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) setName(savedName);
  }, [router]);

  useEffect(() => {
    if (personalityId && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 700);
      return () => clearTimeout(t);
    }
  }, [personalityId]);

  if (!personalityId) return null;

  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && trimmed.length <= MAX_LEN;
  const accent = personality.accent;

  const onContinue = () => {
    if (!canContinue) return;
    localStorage.setItem(NAME_KEY, trimmed);
    router.push("/onboarding/intake");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canContinue) {
      e.preventDefault();
      onContinue();
    }
  };

  return (
    <OnboardingFrame step={2} totalSteps={5} bloomTint={accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 pt-16 pb-20 flex flex-col items-center">
        <div className="w-full max-w-[1280px] flex flex-col flex-1">
          {/* Hero composition */}
          <div
            className="grid items-center gap-10 lg:gap-16 flex-1"
            style={{
              gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
            }}
          >
            {/* LEFT — eyebrow + question + input + suggestions */}
            <div className="relative min-h-[460px] flex flex-col justify-center">
              {/* Eyebrow */}
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
                    background: accent,
                    boxShadow: `0 0 6px ${accent}`,
                  }}
                />
                <span>The name · 02 of 05</span>
              </motion.div>

              {/* Question — hero scale */}
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
                  fontSize: "clamp(3rem, 5.6vw, 4.75rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.03em",
                  color: "rgba(245,240,230,0.98)",
                }}
              >
                Name your{" "}
                <span style={{ color: accent }}>
                  {personality.name}
                  <span style={{ color: accent }}>.</span>
                </span>
              </motion.h1>

              {/* Italic prompt below */}
              <motion.p
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.18,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mt-5 font-serif italic max-w-[40ch]"
                style={{
                  fontSize: "clamp(1.0625rem, 1.4vw, 1.25rem)",
                  lineHeight: 1.45,
                  color: "rgba(245,240,230,0.55)",
                }}
              >
                They&rsquo;ll answer to anything. Pick something you&rsquo;d
                love to say out loud.
              </motion.p>

              {/* INPUT — editorial scale, no border, animated underline */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.65,
                  delay: 0.3,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mt-12 max-w-[600px] relative"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, MAX_LEN))}
                  onKeyDown={onKeyDown}
                  placeholder={personality.suggestedNames[0]}
                  maxLength={MAX_LEN}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Agent name"
                  className="w-full bg-transparent border-0 outline-none text-left font-serif font-medium pb-3"
                  style={{
                    fontSize: "clamp(2.5rem, 4.6vw, 4rem)",
                    lineHeight: 1,
                    letterSpacing: "-0.025em",
                    color: "rgba(245,240,230,0.98)",
                    caretColor: accent,
                  }}
                />
                {/* Underline — left-aligned, grows on focus/value */}
                <motion.div
                  className="h-px origin-left"
                  style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                  animate={{
                    scaleX: trimmed ? 1 : 0.18,
                    opacity: trimmed ? 0.9 : 0.4,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                />
                {/* Char counter — quiet, only when close to limit */}
                {trimmed.length > MAX_LEN - 4 && (
                  <div
                    className="absolute right-0 top-2 text-[10.5px] tracking-[0.22em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.42)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {trimmed.length} / {MAX_LEN}
                  </div>
                )}
              </motion.div>

              {/* Suggested names */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.5,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mt-8 flex items-center flex-wrap gap-x-7 gap-y-3"
              >
                <span
                  className="text-[10.5px] tracking-[0.28em] uppercase"
                  style={{
                    color: "rgba(245,240,230,0.32)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Or try
                </span>
                {personality.suggestedNames.map((suggested, i) => {
                  const isCurrent =
                    trimmed.length > 0 &&
                    trimmed.toLowerCase() === suggested.toLowerCase();
                  return (
                    <motion.button
                      key={suggested}
                      type="button"
                      onClick={() => {
                        setName(suggested);
                        inputRef.current?.focus();
                      }}
                      initial={reduced ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.55 + i * 0.05,
                        duration: 0.4,
                        ease: [0.2, 0.7, 0.2, 1],
                      }}
                      whileHover={reduced ? undefined : { y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="font-serif italic relative"
                      style={{
                        fontSize: "clamp(1rem, 1.3vw, 1.125rem)",
                        color: isCurrent
                          ? "rgba(245,240,230,0.96)"
                          : "rgba(245,240,230,0.55)",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {suggested}
                      {isCurrent && (
                        <motion.span
                          layoutId="suggested-underline"
                          className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full"
                          style={{
                            background: accent,
                            boxShadow: `0 0 6px ${accent}`,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                            mass: 0.9,
                          }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {/* RIGHT — dark avatar of the chosen personality */}
            <div className="relative h-full min-h-[420px] flex items-center justify-center">
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
                className="relative"
              >
                <DarkAvatar personality={personality} size={300} />
              </motion.div>
            </div>
          </div>

          {/* Bottom row — Back link + Continue pill */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.6,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="relative mt-12 flex items-center justify-between gap-8"
          >
            {/* Left — back link */}
            <button
              type="button"
              onClick={() => router.push("/onboarding/personality")}
              className="text-[11px] tracking-[0.24em] uppercase transition-colors hover:opacity-100"
              style={{
                color: "rgba(245,240,230,0.4)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ← Back
            </button>

            {/* Right — Continue pill (matches personality page) */}
            <motion.button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              whileHover={
                reduced || !canContinue
                  ? undefined
                  : {
                      scale: 1.03,
                      borderColor: `${accent}cc`,
                      backgroundColor: `${accent}14`,
                      boxShadow: `0 0 38px -4px ${accent}cc, inset 0 0 16px ${accent}22`,
                    }
              }
              whileTap={canContinue ? { scale: 0.97 } : undefined}
              transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
              className="inline-flex items-center gap-3 h-12 px-6 rounded-full font-serif relative disabled:cursor-not-allowed"
              style={{
                fontSize: 16,
                background: "transparent",
                border: `1px solid ${
                  canContinue ? `${accent}66` : "rgba(245,240,230,0.1)"
                }`,
                color: canContinue
                  ? "rgba(245,240,230,0.96)"
                  : "rgba(245,240,230,0.3)",
                boxShadow: canContinue
                  ? `0 0 24px -8px ${accent}88`
                  : "none",
                opacity: canContinue ? 1 : 0.65,
              }}
            >
              <span>
                {canContinue ? (
                  <>
                    Continue as{" "}
                    <span style={{ color: accent }}>{trimmed}</span>
                  </>
                ) : (
                  "Type a name to continue"
                )}
              </span>
              {canContinue && (
                <motion.span
                  aria-hidden
                  className="inline-block"
                  style={{ color: accent }}
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
