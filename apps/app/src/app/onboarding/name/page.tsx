"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";
import { VOICES } from "@/lib/voices";

// Act Two — The Name. Composed like a script page from a play.
// LEFT column: the agent speaks (small glass mic icon + a
// word-by-word italic serif quote that animates in as if being
// said aloud). RIGHT column: the user replies (editorial-scale
// input at the same visual weight as "Maven." in Act One, with
// suggested names and Continue).
//
// The big glass orb that owned Act One isn't repeated here. The
// voice was chosen in Act One; on this page the voice manifests
// as language — typography is doing the talking now.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const MAX_LEN = 24;
// Per-word reveal pace (seconds). ~95ms keeps the quote alive for
// roughly 4 seconds — long enough to feel spoken, short enough that
// the user can act before it finishes.
const WORD_STEP = 0.095;

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
    if (!personalityId) return;
    const t = setTimeout(() => inputRef.current?.focus(), 1400);
    return () => clearTimeout(t);
  }, [personalityId]);

  if (!personalityId) return null;

  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const pairedVoice = VOICES.find((v) => v.id === personality.voiceId)!;
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

  // The agent's greeting — italic serif, revealed word-by-word.
  // First sentence is the hero opener at hero scale; the rest is
  // supporting italic at body scale. Split into two passages so
  // the typography hierarchy reads at a glance.
  const heroLine = "Hey, you.";
  const supportLines = [
    "Glad you picked me.",
    "From here on, I'll guide you through everything — every brief, every reply, every line.",
    "But first — name me, would you?",
  ];

  // Total words across both passages → for stagger budget.
  const heroWords = heroLine.split(/\s+/);
  const passageWords = supportLines.flatMap((l) => l.split(/\s+/));
  const heroDelayBase = 0.35;
  const passageDelayBase =
    heroDelayBase + heroWords.length * WORD_STEP + 0.25;

  return (
    <OnboardingFrame step={2} totalSteps={5} bloomTint={accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 py-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-[1440px] flex flex-col gap-14 lg:gap-20">
          {/* Act header */}
          <motion.div
            initial={
              reduced ? false : { opacity: 0, y: 8, filter: "blur(6px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            className="flex items-center gap-4"
          >
            <span
              className="inline-block h-px w-10"
              style={{ background: "rgba(245,240,230,0.2)" }}
            />
            <span
              className="text-[11px] tracking-[0.32em] uppercase"
              style={{
                color: "rgba(245,240,230,0.4)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Act Two — The Name
            </span>
          </motion.div>

          {/* Script-page composition. LEFT speaks, RIGHT replies. */}
          <div
            className="grid items-start gap-12 lg:gap-20"
            style={{
              gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
            }}
          >
            {/* LEFT — speaker label + animated mic + spoken quote */}
            <div className="relative flex flex-col gap-7">
              {/* Speaker row — mic icon + attribution */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                className="flex items-center gap-3"
              >
                <SpeakingIcon
                  speaking
                  accent={accent}
                  durationSec={
                    passageDelayBase +
                    passageWords.length * WORD_STEP +
                    0.4
                  }
                />
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.7)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {personality.name}
                  </span>
                  <span
                    style={{
                      color: "rgba(245,240,230,0.25)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    ·
                  </span>
                  <span
                    className="text-[11px] tracking-[0.28em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.42)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {pairedVoice.name} speaking
                  </span>
                </div>
              </motion.div>

              {/* Hero opener — large serif, accent period */}
              <h1
                className="font-serif font-medium"
                style={{
                  fontSize: "clamp(3.5rem, 7vw, 6.5rem)",
                  lineHeight: 0.96,
                  letterSpacing: "-0.035em",
                  color: "rgba(245,240,230,0.98)",
                }}
              >
                {heroWords.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={
                      reduced ? false : { opacity: 0, y: 12, filter: "blur(4px)" }
                    }
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.6,
                      delay: heroDelayBase + i * WORD_STEP,
                      ease: [0.2, 0.7, 0.2, 1],
                    }}
                    style={{
                      display: "inline-block",
                      marginRight: "0.22em",
                    }}
                  >
                    {i === heroWords.length - 1 ? (
                      <>
                        {word.replace(/\.$/, "")}
                        <span style={{ color: accent, opacity: 0.85 }}>.</span>
                      </>
                    ) : (
                      word
                    )}
                  </motion.span>
                ))}
              </h1>

              {/* Supporting italic passage — word-by-word */}
              <div
                className="font-serif italic"
                style={{
                  fontSize: "clamp(1.125rem, 1.55vw, 1.4375rem)",
                  lineHeight: 1.5,
                  color: "rgba(245,240,230,0.62)",
                  maxWidth: "38ch",
                }}
              >
                {(() => {
                  let runningIdx = 0;
                  return supportLines.map((line, lineIdx) => {
                    const words = line.split(/\s+/);
                    return (
                      <p
                        key={lineIdx}
                        className={lineIdx > 0 ? "mt-3" : undefined}
                      >
                        {words.map((word, w) => {
                          const delay =
                            passageDelayBase + runningIdx * WORD_STEP;
                          runningIdx += 1;
                          return (
                            <motion.span
                              key={`${lineIdx}-${w}`}
                              initial={
                                reduced
                                  ? false
                                  : { opacity: 0, y: 4 }
                              }
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.45,
                                delay,
                                ease: [0.2, 0.7, 0.2, 1],
                              }}
                              style={{
                                display: "inline-block",
                                marginRight: "0.28em",
                              }}
                            >
                              {word}
                            </motion.span>
                          );
                        })}
                      </p>
                    );
                  });
                })()}
              </div>
            </div>

            {/* RIGHT — your reply: scene marker, input, chips, continue */}
            <div className="relative flex flex-col items-start">
              {/* Scene + speaker (mirrors the LEFT speaker row, but
                  for the user — "YOU"). The visual rhyme makes the
                  page read as a script. */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.5,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mb-8 flex flex-col gap-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.4)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Scene 02
                  </span>
                  <span
                    style={{
                      color: "rgba(245,240,230,0.25)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    ·
                  </span>
                  <span
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.7)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    You
                  </span>
                </div>
                <span
                  className="inline-block h-px w-16"
                  style={{ background: "rgba(245,240,230,0.16)" }}
                />
              </motion.div>

              {/* Input — editorial scale, matches Act One name treatment */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.7,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="w-full max-w-[640px] relative"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.slice(0, MAX_LEN))
                  }
                  onKeyDown={onKeyDown}
                  placeholder={personality.suggestedNames[0]}
                  maxLength={MAX_LEN}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Agent name"
                  className="w-full bg-transparent border-0 outline-none text-left font-serif font-medium pb-4 placeholder:opacity-25"
                  style={{
                    fontSize: "clamp(3rem, 5.4vw, 5rem)",
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    color: "rgba(245,240,230,0.98)",
                    caretColor: accent,
                  }}
                />
                <motion.div
                  className="h-px origin-left"
                  style={{
                    background: accent,
                    boxShadow: `0 0 8px ${accent}`,
                  }}
                  animate={{
                    scaleX: trimmed ? 1 : 0.18,
                    opacity: trimmed ? 0.9 : 0.4,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                />
                {trimmed.length > MAX_LEN - 4 && (
                  <div
                    className="absolute right-0 top-1 text-[10.5px] tracking-[0.22em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.42)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {trimmed.length} / {MAX_LEN}
                  </div>
                )}
              </motion.div>

              {/* Suggested chips */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.95,
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
                        delay: 1.0 + i * 0.05,
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

              {/* Continue — same treatment as personality page */}
              <motion.button
                type="button"
                onClick={onContinue}
                disabled={!canContinue}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 1.2,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                whileHover={
                  reduced || !canContinue
                    ? undefined
                    : {
                        scale: 1.03,
                        backgroundColor: `${accent}14`,
                        boxShadow: `0 0 38px -4px ${accent}cc, inset 0 0 16px ${accent}22`,
                      }
                }
                whileTap={canContinue ? { scale: 0.97 } : undefined}
                className="mt-12 inline-flex items-center gap-3 h-12 px-6 rounded-full font-serif relative disabled:cursor-not-allowed"
                style={{
                  fontSize: 16,
                  background: "transparent",
                  border: `1.5px solid ${
                    canContinue ? `${accent}cc` : "rgba(245,240,230,0.12)"
                  }`,
                  color: canContinue
                    ? "rgba(245,240,230,0.96)"
                    : "rgba(245,240,230,0.3)",
                  boxShadow: canContinue
                    ? `0 0 26px -6px ${accent}aa`
                    : "none",
                }}
              >
                <span>
                  {canContinue ? (
                    <>
                      Continue as{" "}
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={trimmed}
                          initial={
                            reduced ? false : { opacity: 0, y: 4 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            reduced ? undefined : { opacity: 0, y: -4 }
                          }
                          transition={{
                            duration: 0.3,
                            ease: [0.2, 0.7, 0.2, 1],
                          }}
                          style={{
                            color: accent,
                            display: "inline-block",
                          }}
                        >
                          {trimmed}
                        </motion.span>
                      </AnimatePresence>
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
            </div>
          </div>

          {/* Back link */}
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="relative"
          >
            <button
              type="button"
              onClick={() => router.push("/onboarding/personality")}
              className="text-[11px] tracking-[0.24em] uppercase transition-opacity hover:opacity-80"
              style={{
                color: "rgba(245,240,230,0.32)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ← Back
            </button>
          </motion.div>
        </div>
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * SpeakingIcon — small floating glass disc with three audio-wave
 * bars. While `speaking` is true, the bars animate at staggered
 * phases as if responding to a voice signal; after `durationSec`
 * elapses, they settle to a quiet idle state. Same glass language
 * as the nav arrows on the personality page (frosted body, accent
 * rim, subtle hover lift) at a quieter scale.
 * ============================================================ */
function SpeakingIcon({
  speaking,
  accent,
  durationSec,
}: {
  speaking: boolean;
  accent: string;
  durationSec: number;
}) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(speaking);

  useEffect(() => {
    if (!speaking) {
      setActive(false);
      return;
    }
    setActive(true);
    const t = setTimeout(() => setActive(false), durationSec * 1000);
    return () => clearTimeout(t);
  }, [speaking, durationSec]);

  const bars = [
    { phase: 0, peak: 0.95 },
    { phase: 0.18, peak: 1 },
    { phase: 0.36, peak: 0.7 },
  ];

  return (
    <motion.div
      className="relative grid place-items-center rounded-full"
      style={{
        width: 46,
        height: 46,
        background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${accent}10 100%)`,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: `1px solid ${active ? `${accent}aa` : "rgba(255,255,255,0.16)"}`,
        boxShadow: active
          ? `0 0 24px -4px ${accent}99, inset 0 1px 0 rgba(255,255,255,0.22)`
          : "inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 20px -8px rgba(0,0,0,0.45)",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
      }}
      aria-hidden
    >
      {/* Specular highlight */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%",
          left: "12%",
          width: "48%",
          height: "30%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 70%)",
          filter: "blur(6px)",
        }}
      />

      {/* Wave bars */}
      <div className="flex items-center gap-[3px]" aria-hidden>
        {bars.map((bar, i) => (
          <motion.span
            key={i}
            style={{
              display: "inline-block",
              width: 2.5,
              borderRadius: 2,
              background: accent,
              boxShadow: active ? `0 0 6px ${accent}` : "none",
              transformOrigin: "center",
            }}
            animate={
              reduced
                ? { height: 4 }
                : active
                  ? {
                      height: [4, 16 * bar.peak, 4, 12 * bar.peak, 4],
                    }
                  : { height: 4 }
            }
            transition={
              reduced
                ? { duration: 0.2 }
                : active
                  ? {
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: bar.phase,
                    }
                  : { duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }
            }
          />
        ))}
      </div>
    </motion.div>
  );
}
