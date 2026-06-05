"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";
import { SAMPLE_SCRIPT, VOICES } from "@/lib/voices";

// Act Two — The Name. Asymmetric editorial spread, mirroring Act
// One's grammar but flipping the stage: the agent (glass orb) holds
// stage-left this time — it's introducing itself, so it owns the
// floor — and the user's reply (huge serif question + input + name
// suggestions) takes the right column at editorial scale.
//
// The orb auto-plays the paired voice greeting on mount, with a
// graceful fallback if the browser blocks autoplay (orb stays the
// obvious tap target). A spoken caption reveals word-by-word in
// sync with audio currentTime so the reading tracks the voice.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const MAX_LEN = 24;

type PlayState = "idle" | "loading" | "playing" | "error";

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

  const personality = personalityId
    ? PERSONALITIES.find((p) => p.id === personalityId)!
    : null;
  const pairedVoice = personality
    ? VOICES.find((v) => v.id === personality.voiceId)!
    : null;

  /* ── Audio playback ── */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const autoPlayAttempted = useRef(false);

  const stopAudio = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    audioRef.current = null;
    setPlayState("idle");
    setCurrentTime(0);
  }, []);

  const playSample = useCallback(() => {
    if (!pairedVoice) return;
    stopAudio();
    setPlayState("loading");
    setCurrentTime(0);
    const el = new Audio(pairedVoice.sample);
    audioRef.current = el;
    el.addEventListener("loadedmetadata", () => {
      setDuration(el.duration || 0);
    });
    el.addEventListener("timeupdate", () => {
      setCurrentTime(el.currentTime);
    });
    el.addEventListener("ended", () => {
      setPlayState("idle");
      setCurrentTime(0);
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
        setPlayState("idle");
        audioRef.current = null;
      });
  }, [pairedVoice, stopAudio]);

  const toggleListen = useCallback(() => {
    if (playState === "playing" || playState === "loading") stopAudio();
    else playSample();
  }, [playState, playSample, stopAudio]);

  useEffect(() => {
    if (!pairedVoice || autoPlayAttempted.current) return;
    autoPlayAttempted.current = true;
    const t = setTimeout(playSample, 600);
    return () => clearTimeout(t);
  }, [pairedVoice, playSample]);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  useEffect(() => {
    if (!personalityId) return;
    const t = setTimeout(() => inputRef.current?.focus(), 1600);
    return () => clearTimeout(t);
  }, [personalityId]);

  if (!personality || !pairedVoice) return null;

  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && trimmed.length <= MAX_LEN;
  const accent = personality.accent;
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const audioActive = playState === "playing" || playState === "loading";

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
        <div className="w-full max-w-[1440px] flex flex-col gap-14 lg:gap-20">
          {/* Act header — matches Act One anchor */}
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

          {/* Hero — asymmetric. Orb on the LEFT (the agent has the
              floor; it just introduced itself by voice), question +
              input on the RIGHT (the user replies). Mirrors Act One
              composition with the columns flipped. */}
          <div
            className="grid items-center gap-12 lg:gap-20"
            style={{
              gridTemplateColumns: "minmax(0, 0.82fr) minmax(0, 1.18fr)",
            }}
          >
            {/* LEFT — glass orb + voice attribution + spoken caption */}
            <div className="relative flex flex-col items-center gap-6">
              <GlassVoiceOrb
                state={playState}
                progressRatio={progressRatio}
                accent={accent}
                onToggle={toggleListen}
              />

              {/* Voice attribution */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="text-[11px] tracking-[0.32em] uppercase"
                style={{
                  color: "rgba(245,240,230,0.4)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {personality.name} · spoken by {pairedVoice.name}
              </motion.div>

              {/* Spoken caption — reserved-height container so the
                  page doesn't reflow when the line appears */}
              <div className="min-h-[88px] w-full flex items-start justify-center pt-2">
                <SpokenCaption
                  text={SAMPLE_SCRIPT}
                  visible={audioActive}
                  progress={progressRatio}
                  accent={accent}
                />
              </div>
            </div>

            {/* RIGHT — scene number, question, input, chips, continue */}
            <div className="relative flex flex-col items-start">
              {/* Scene marker (mirrors Act One's "Agent No. 0X") */}
              <div className="mb-8 flex flex-col gap-2">
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
                  className="inline-block h-px w-12"
                  style={{ background: "rgba(245,240,230,0.16)" }}
                />
              </div>

              {/* Hero question — editorial scale, accent period */}
              <motion.h1
                initial={
                  reduced
                    ? false
                    : { opacity: 0, y: 14, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="font-serif font-medium"
                style={{
                  fontSize: "clamp(4rem, 8.4vw, 8rem)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.035em",
                  color: "rgba(245,240,230,0.98)",
                }}
              >
                Name me
                <span style={{ color: accent, opacity: 0.85 }}>.</span>
              </motion.h1>

              {/* Sub-prompt */}
              <motion.p
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mt-7 font-serif italic max-w-[34ch]"
                style={{
                  fontSize: "clamp(1.125rem, 1.5vw, 1.375rem)",
                  lineHeight: 1.4,
                  color: "rgba(245,240,230,0.55)",
                }}
              >
                Whatever feels right out loud.
              </motion.p>

              {/* Input — editorial scale, no border, accent underline */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.65,
                  delay: 0.5,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mt-12 w-full max-w-[600px] relative"
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
                  className="w-full bg-transparent border-0 outline-none text-left font-serif font-medium pb-3 placeholder:opacity-30"
                  style={{
                    fontSize: "clamp(2.75rem, 5vw, 4.5rem)",
                    lineHeight: 1,
                    letterSpacing: "-0.025em",
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
                  delay: 0.7,
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
                        delay: 0.75 + i * 0.05,
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

              {/* Continue — matches personality page treatment */}
              <motion.button
                type="button"
                onClick={onContinue}
                disabled={!canContinue}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.95,
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
                          exit={reduced ? undefined : { opacity: 0, y: -4 }}
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
            transition={{ duration: 0.6, delay: 1.15 }}
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
 * GlassVoiceOrb — center-of-left-column glass disc. Same design
 * language as the personality-page play button (atmospheric halo,
 * specular highlight, accent reflection, pulse rings while playing).
 * Sized to match the personality-page hero orb so the visual rhythm
 * carries between acts.
 * ============================================================ */
function GlassVoiceOrb({
  state,
  progressRatio,
  accent,
  onToggle,
}: {
  state: PlayState;
  progressRatio: number;
  accent: string;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const isPlaying = state === "playing";
  const isLoading = state === "loading";
  const isError = state === "error";
  const size = 300;
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      disabled={isError}
      initial={
        reduced
          ? false
          : { opacity: 0, scale: 0.86, filter: "blur(12px)" }
      }
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
      whileHover={
        reduced || isError ? undefined : { scale: 1.035, y: -3 }
      }
      whileTap={isError ? undefined : { scale: 0.97 }}
      className="relative grid place-items-center disabled:cursor-not-allowed"
      style={{ width: size, height: size }}
      aria-label={isPlaying ? "Stop greeting" : "Play greeting"}
    >
      {/* Atmospheric glow halo */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -80,
          background: `radial-gradient(circle, ${accent}30 0%, ${accent}08 35%, transparent 65%)`,
          filter: "blur(30px)",
        }}
        animate={{
          opacity: hovered
            ? 1
            : isPlaying
              ? [0.7, 1, 0.7]
              : reduced
                ? 0.5
                : [0.45, 0.65, 0.45],
          scale: hovered ? 1.15 : 1,
        }}
        transition={
          hovered
            ? {
                opacity: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] },
                scale: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] },
              }
            : {
                duration: isPlaying ? 1.6 : 4,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />

      {/* "Tap to hear" invitation ring — appears only when idle, so
          autoplay-blocked browsers still surface a clear affordance */}
      {!reduced && !isPlaying && !isLoading && (
        <motion.div
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -10,
            border: `1px solid ${accent}55`,
          }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.96, 1.08, 1.18] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeOut",
            repeatDelay: 0.4,
          }}
        />
      )}

      {/* Pulse rings while playing */}
      {isPlaying && !reduced && (
        <>
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: 0,
                border: `1px solid ${accent}66`,
              }}
              animate={{ scale: [1, 1.18, 1.32], opacity: [0.55, 0.18, 0] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Glass body */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${accent}12 100%)`,
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
        animate={{
          boxShadow: hovered
            ? [
                "inset 0 1px 0 rgba(255,255,255,0.32)",
                `inset 0 -2px 22px ${accent}55`,
                "0 30px 90px -12px rgba(0,0,0,0.7)",
                `0 0 120px -8px ${accent}aa`,
              ].join(", ")
            : [
                "inset 0 1px 0 rgba(255,255,255,0.22)",
                `inset 0 -2px 16px ${accent}33`,
                "0 24px 70px -12px rgba(0,0,0,0.6)",
                `0 0 90px -12px ${accent}66`,
              ].join(", "),
        }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        initial={false}
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ border: "1px solid rgba(255,255,255,0.14)" }}
      />

      {/* Specular highlight */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "8%",
          left: "12%",
          width: "52%",
          height: "32%",
          borderRadius: "50%",
          filter: "blur(10px)",
        }}
        animate={{
          background: hovered
            ? "radial-gradient(ellipse, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 70%)"
            : "radial-gradient(ellipse, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)",
        }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      />

      {/* Accent reflection */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: "8%",
          left: "20%",
          width: "60%",
          height: "30%",
          borderRadius: "50%",
          filter: "blur(14px)",
        }}
        animate={{
          background: hovered
            ? `radial-gradient(ellipse, ${accent}55 0%, transparent 70%)`
            : `radial-gradient(ellipse, ${accent}30 0%, transparent 70%)`,
        }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      />

      {/* Progress arc */}
      {(isPlaying || isLoading) && (
        <svg
          aria-hidden
          className="absolute inset-0 -rotate-90 pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`${accent}1f`}
            strokeWidth="1.5"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference * (1 - progressRatio),
            }}
            transition={{ duration: 0.12, ease: "linear" }}
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
          />
        </svg>
      )}

      {/* Center glyph */}
      <motion.div
        className="relative"
        animate={{
          opacity: hovered ? 1 : 0.82,
          scale: hovered ? 1.06 : 1,
        }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {isLoading ? (
          <Spinner size={48} accent={accent} />
        ) : isPlaying ? (
          <StopIcon size={36} accent={accent} />
        ) : (
          <PlayIcon size={52} accent={accent} />
        )}
      </motion.div>
    </motion.button>
  );
}

/* ============================================================
 * SpokenCaption — word-by-word reveal synced to audio progress.
 * The visible-word count tracks currentTime / duration so the
 * caption stays in step with the voice even if the user replays.
 * ============================================================ */
function SpokenCaption({
  text,
  visible,
  progress,
  accent,
}: {
  text: string;
  visible: boolean;
  progress: number;
  accent: string;
}) {
  const words = text.split(/\s+/);
  const visibleCount = Math.max(
    1,
    Math.ceil(progress * words.length + 0.001),
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          className="font-serif italic max-w-[34ch] text-center"
          style={{
            fontSize: "clamp(0.9375rem, 1.05vw, 1.0625rem)",
            lineHeight: 1.55,
            color: "rgba(245,240,230,0.62)",
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          aria-live="polite"
        >
          <span aria-hidden style={{ color: accent, opacity: 0.65 }}>
            &ldquo;
          </span>
          {words.map((word, i) => {
            const shown = i < visibleCount;
            return (
              <motion.span
                key={`${word}-${i}`}
                animate={{
                  opacity: shown ? 1 : 0.16,
                  y: shown ? 0 : 2,
                }}
                transition={{
                  duration: 0.32,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                style={{ display: "inline-block", marginRight: "0.28em" }}
              >
                {word}
              </motion.span>
            );
          })}
          <span aria-hidden style={{ color: accent, opacity: 0.65 }}>
            &rdquo;
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function PlayIcon({ size, accent }: { size: number; accent: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="rgba(245,240,230,0.92)"
      aria-hidden
      style={{
        filter: `drop-shadow(0 0 12px ${accent}66) drop-shadow(0 2px 6px rgba(0,0,0,0.5))`,
        marginLeft: 3,
      }}
    >
      <path d="M8.2 5.4c0-1 1.1-1.7 2-1.1l9.2 6.5c.8.5.8 1.7 0 2.3l-9.2 6.5c-.9.6-2-.1-2-1.1V5.4z" />
    </svg>
  );
}

function StopIcon({ size, accent }: { size: number; accent: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="rgba(245,240,230,0.92)"
      aria-hidden
      style={{
        filter: `drop-shadow(0 0 12px ${accent}66) drop-shadow(0 2px 6px rgba(0,0,0,0.5))`,
      }}
    >
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </svg>
  );
}

function Spinner({ size, accent }: { size: number; accent: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
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
  );
}
