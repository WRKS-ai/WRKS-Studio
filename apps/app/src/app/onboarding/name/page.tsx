"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";
import { SAMPLE_SCRIPT, VOICES } from "@/lib/voices";

// Act Two — The Name. Composed as a script page from a play.
// LEFT speaks (small glass mic icon + script-style word-by-word
// quote). RIGHT replies (editorial-scale input + chips + continue).
//
// The voice was chosen in Act One — no big orb here. Instead the
// voice manifests as language (italic serif word reveal) and as a
// small glass speaking icon whose audio-wave bars pulse while the
// agent is "speaking". Audio auto-plays on mount where the browser
// allows; mic icon is the tap-to-replay control either way.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const MAX_LEN = 24;
const WORD_STEP = 0.13; // seconds between word reveals

type PlayState = "idle" | "loading" | "playing" | "error";

export default function NamePage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  const [name, setName] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
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

  const personality = personalityId
    ? PERSONALITIES.find((p) => p.id === personalityId)!
    : null;
  const pairedVoice = personality
    ? VOICES.find((v) => v.id === personality.voiceId)!
    : null;

  /* ── Audio ── */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const autoPlayAttempted = useRef(false);

  const stopAudio = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    audioRef.current = null;
    setPlayState("idle");
  }, []);

  const playSample = useCallback(() => {
    if (!pairedVoice) return;
    stopAudio();
    setPlayState("loading");
    const el = new Audio(pairedVoice.sample);
    audioRef.current = el;
    el.addEventListener("ended", () => {
      setPlayState("idle");
      audioRef.current = null;
    });
    el.addEventListener("error", () => {
      setPlayState("error");
      audioRef.current = null;
    });
    el
      .play()
      .then(() => setPlayState("playing"))
      .catch(() => {
        // Browser blocked autoplay — mic icon stays tappable.
        setPlayState("idle");
        audioRef.current = null;
      });
  }, [pairedVoice, stopAudio]);

  const toggleListen = useCallback(() => {
    if (playState === "playing" || playState === "loading") stopAudio();
    else playSample();
  }, [playState, playSample, stopAudio]);

  // Auto-greet on mount
  useEffect(() => {
    if (!pairedVoice || autoPlayAttempted.current) return;
    autoPlayAttempted.current = true;
    const t = setTimeout(playSample, 650);
    return () => clearTimeout(t);
  }, [pairedVoice, playSample]);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  // Focus the input once the opener has revealed
  useEffect(() => {
    if (!personalityId) return;
    const t = setTimeout(() => inputRef.current?.focus(), 1500);
    return () => clearTimeout(t);
  }, [personalityId]);

  // Split SAMPLE_SCRIPT into the hero opener (first short sentence,
  // typically "Hey, you.") and the supporting passage.
  const firstStop = SAMPLE_SCRIPT.indexOf(". ");
  const heroLine =
    firstStop >= 0 ? SAMPLE_SCRIPT.slice(0, firstStop + 1) : SAMPLE_SCRIPT;
  const passageText =
    firstStop >= 0 ? SAMPLE_SCRIPT.slice(firstStop + 2) : "";
  const heroWords = heroLine.split(/\s+/);
  const passageWords = passageText.split(/\s+/).filter(Boolean);
  const heroDelayBase = 0.35;
  const passageDelayBase =
    heroDelayBase + heroWords.length * WORD_STEP + 0.25;
  const totalRevealSec =
    passageDelayBase + passageWords.length * WORD_STEP + 0.4;

  // The mic icon's bars are active while EITHER the audio is playing
  // OR the on-page reveal is still running.
  const [revealing, setRevealing] = useState(true);
  useEffect(() => {
    const t = setTimeout(
      () => setRevealing(false),
      totalRevealSec * 1000,
    );
    return () => clearTimeout(t);
  }, [totalRevealSec]);

  if (!personality || !pairedVoice) return null;

  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && trimmed.length <= MAX_LEN;
  const accent = personality.accent;
  const speaking = revealing || playState === "playing" || playState === "loading";

  const onContinue = () => {
    if (!canContinue) return;
    stopAudio();
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
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 py-10 flex flex-col items-center justify-center">
        {/* Ambient accent bloom on the LEFT side — gives the speaking
            agent a soft "stage light" without resorting to a card */}
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "5%",
            top: "20%",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}16 0%, ${accent}06 35%, transparent 65%)`,
            filter: "blur(60px)",
          }}
          animate={
            reduced
              ? { opacity: 0.7 }
              : speaking
                ? { opacity: [0.55, 0.95, 0.55], scale: [1, 1.06, 1] }
                : { opacity: 0.45, scale: 1 }
          }
          transition={
            speaking && !reduced
              ? { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }
          }
        />

        <div className="relative w-full max-w-[1440px] flex flex-col gap-14 lg:gap-20">
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

          {/* Script-page composition */}
          <div
            className="grid items-start gap-12 lg:gap-20"
            style={{
              gridTemplateColumns: "minmax(0, 1.08fr) minmax(0, 1fr)",
            }}
          >
            {/* LEFT — the agent speaks */}
            <div className="relative flex flex-col gap-8">
              {/* Speaker row: glass speaking icon + glass label pill */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                className="flex items-center gap-3"
              >
                <SpeakingIcon
                  active={speaking}
                  state={playState}
                  accent={accent}
                  onClick={toggleListen}
                />
                <SpeakerPill accent={accent} active={speaking}>
                  <span
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.86)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {personality.name}
                  </span>
                  <span
                    style={{
                      color: "rgba(245,240,230,0.28)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    ·
                  </span>
                  <span
                    className="text-[11px] tracking-[0.28em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.55)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {pairedVoice.name} speaking
                  </span>
                </SpeakerPill>
              </motion.div>

              {/* Hero opener — editorial scale with a soft open-quote
                  glyph anchoring it as a spoken line */}
              <div className="relative">
                <motion.span
                  aria-hidden
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="absolute select-none pointer-events-none font-serif"
                  style={{
                    left: "-0.55em",
                    top: "-0.42em",
                    fontSize: "clamp(7rem, 14vw, 13rem)",
                    lineHeight: 1,
                    color: accent,
                    opacity: 0.22,
                  }}
                >
                  &ldquo;
                </motion.span>
                <h1
                  className="relative font-serif font-medium"
                  style={{
                    fontSize: "clamp(3.5rem, 7vw, 6.5rem)",
                    lineHeight: 0.96,
                    letterSpacing: "-0.035em",
                    color: "rgba(245,240,230,0.98)",
                  }}
                >
                  {heroWords.map((word, i) => {
                    const isLast = i === heroWords.length - 1;
                    return (
                      <motion.span
                        key={i}
                        initial={
                          reduced
                            ? false
                            : { opacity: 0, y: 12, filter: "blur(4px)" }
                        }
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                          duration: 0.65,
                          delay: heroDelayBase + i * WORD_STEP,
                          ease: [0.2, 0.7, 0.2, 1],
                        }}
                        style={{
                          display: "inline-block",
                          marginRight: "0.22em",
                        }}
                      >
                        {isLast ? (
                          <>
                            {word.replace(/\.$/, "")}
                            <span
                              style={{ color: accent, opacity: 0.85 }}
                            >
                              .
                            </span>
                          </>
                        ) : (
                          word
                        )}
                      </motion.span>
                    );
                  })}
                </h1>
              </div>

              {/* Supporting passage — italic serif body */}
              <div
                className="font-serif italic"
                style={{
                  fontSize: "clamp(1.1875rem, 1.65vw, 1.5rem)",
                  lineHeight: 1.5,
                  color: "rgba(245,240,230,0.66)",
                  maxWidth: "38ch",
                }}
              >
                <p>
                  {passageWords.map((word, i) => (
                    <motion.span
                      key={i}
                      initial={
                        reduced ? false : { opacity: 0, y: 4 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: passageDelayBase + i * WORD_STEP,
                        ease: [0.2, 0.7, 0.2, 1],
                      }}
                      style={{
                        display: "inline-block",
                        marginRight: "0.28em",
                      }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </p>
              </div>
            </div>

            {/* RIGHT — the user replies */}
            <div className="relative flex flex-col items-start pt-1">
              {/* Speaker pill mirrors the LEFT label */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.5,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mb-9"
              >
                <SpeakerPill accent={accent} active={inputFocused}>
                  <span
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.55)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Scene 02
                  </span>
                  <span
                    style={{
                      color: "rgba(245,240,230,0.28)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    ·
                  </span>
                  <span
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.86)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    You
                  </span>
                </SpeakerPill>
              </motion.div>

              {/* Input — editorial scale, accent underline + soft
                  accent backdrop that warms up as you type */}
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
                {/* Soft accent bloom under the input — fades in once
                    there's a typed name. Adds warmth without a frame. */}
                <motion.div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    left: "-8%",
                    right: "-8%",
                    bottom: "-30%",
                    top: "-10%",
                    background: `radial-gradient(ellipse at center, ${accent}12 0%, ${accent}04 40%, transparent 70%)`,
                    filter: "blur(28px)",
                  }}
                  animate={{
                    opacity: trimmed ? 1 : inputFocused ? 0.55 : 0,
                  }}
                  transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.slice(0, MAX_LEN))
                  }
                  onKeyDown={onKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={personality.suggestedNames[0]}
                  maxLength={MAX_LEN}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Agent name"
                  className="relative w-full bg-transparent border-0 outline-none text-left font-serif font-medium pb-4 placeholder:opacity-25"
                  style={{
                    fontSize: "clamp(3rem, 5.4vw, 5rem)",
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    color: "rgba(245,240,230,0.98)",
                    caretColor: accent,
                  }}
                />
                <motion.div
                  className="relative h-px origin-left"
                  style={{
                    background: accent,
                    boxShadow: `0 0 8px ${accent}`,
                  }}
                  animate={{
                    scaleX: trimmed ? 1 : inputFocused ? 0.32 : 0.18,
                    opacity: trimmed ? 0.92 : inputFocused ? 0.6 : 0.4,
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

              {/* Continue */}
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
              onClick={() => {
                stopAudio();
                router.push("/onboarding/personality");
              }}
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
 * SpeakerPill — frosted glass capsule that wraps the speaker label
 * row on both sides. Subtle accent rim when "active" (agent
 * speaking on the left, input focused on the right) so the page
 * reads as a script with two speakers exchanging the floor.
 * ============================================================ */
function SpeakerPill({
  children,
  accent,
  active,
}: {
  children: React.ReactNode;
  accent: string;
  active: boolean;
}) {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-3.5 h-9 rounded-full relative"
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.045) 0%, ${accent}0a 100%)`,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
      animate={{
        borderColor: active ? `${accent}88` : "rgba(255,255,255,0.14)",
        boxShadow: active
          ? `0 0 22px -4px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.18)`
          : "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px -6px rgba(0,0,0,0.4)",
      }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      initial={false}
    >
      {/* Border layer */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          borderColor: active ? `${accent}88` : "rgba(255,255,255,0.14)",
        }}
        transition={{ duration: 0.5 }}
        style={{
          borderWidth: 1,
          borderStyle: "solid",
        }}
      />
      {children}
    </motion.div>
  );
}

/* ============================================================
 * SpeakingIcon — glass disc that contains three audio-wave bars.
 * Doubles as the play/stop control: tap it to replay the voice
 * greeting (or stop a playing one). Bars animate while `active`
 * (audio playing OR on-page reveal still running).
 * ============================================================ */
function SpeakingIcon({
  active,
  state,
  accent,
  onClick,
}: {
  active: boolean;
  state: PlayState;
  accent: string;
  onClick: () => void;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const isLoading = state === "loading";

  const bars = [
    { phase: 0, peak: 0.95 },
    { phase: 0.18, peak: 1 },
    { phase: 0.36, peak: 0.7 },
  ];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.92 }}
      whileHover={reduced ? undefined : { scale: 1.06, y: -1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="relative grid place-items-center rounded-full"
      style={{
        width: 50,
        height: 50,
        background: `linear-gradient(180deg, rgba(255,255,255,0.07) 0%, ${accent}14 100%)`,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: `1px solid ${active || hovered ? `${accent}aa` : "rgba(255,255,255,0.18)"}`,
        boxShadow:
          active || hovered
            ? `0 0 28px -4px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.24)`
            : "inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 22px -8px rgba(0,0,0,0.55)",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
      }}
      aria-label={
        state === "playing" ? "Stop greeting" : "Replay greeting"
      }
    >
      {/* Specular highlight */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "8%",
          left: "12%",
          width: "52%",
          height: "32%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Accent reflection bottom */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: "8%",
          left: "20%",
          width: "60%",
          height: "30%",
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${accent}38 0%, transparent 70%)`,
          filter: "blur(10px)",
        }}
      />

      {/* "Tap to hear" invitation ring when idle */}
      {!reduced && !active && (
        <motion.div
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -8,
            border: `1px solid ${accent}44`,
          }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.94, 1.06, 1.18] }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeOut",
            repeatDelay: 0.6,
          }}
        />
      )}

      {/* Loading spinner */}
      {isLoading ? (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="relative"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke={accent}
            strokeOpacity="0.3"
            strokeWidth="2.5"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      ) : (
        <div className="relative flex items-center gap-[3px]" aria-hidden>
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
                        height: [4, 18 * bar.peak, 4, 13 * bar.peak, 4],
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
      )}
    </motion.button>
  );
}
