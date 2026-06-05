"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES } from "@/lib/personalities";
import type { PersonalityId } from "@/lib/personalities";
import { VOICES } from "@/lib/voices";

const STORAGE_KEY = "wrks-onboarding-personality";
const VOICE_KEY = "wrks-onboarding-voice";

// Casting program — Act One. Stripped down to: agent name, one
// tagline, and a big premium glass play button that IS the voice.
//
// The play button is the hero element on the right — backdrop-blurred
// glass, accent rim glow, progress arc tracing the circumference while
// playing. No "Listen — Owen" text, no traits chips, no sample quote.
// The voice plays directly when you press the glass.

type PlayState = "idle" | "loading" | "playing" | "error";

export default function PersonalityPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as PersonalityId | null;
    if (saved && PERSONALITIES.some((p) => p.id === saved)) {
      const i = PERSONALITIES.findIndex((p) => p.id === saved);
      if (i >= 0) setIndex(i);
    }
  }, []);

  const previewed = PERSONALITIES[index]!;
  const total = PERSONALITIES.length;
  const accent = previewed.accent;
  const pairedVoice = VOICES.find((v) => v.id === previewed.voiceId)!;

  /* ── Audio playback ── */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

  useEffect(() => {
    stopAudio();
    return () => {
      stopAudio();
    };
  }, [index, stopAudio]);

  const playSample = useCallback(() => {
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
        setPlayState("error");
        audioRef.current = null;
      });
  }, [pairedVoice.sample, stopAudio]);

  const toggleListen = useCallback(() => {
    if (playState === "playing" || playState === "loading") stopAudio();
    else playSample();
  }, [playState, playSample, stopAudio]);

  /* ── Navigation ── */
  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const onContinue = useCallback(() => {
    stopAudio();
    localStorage.setItem(STORAGE_KEY, previewed.id);
    localStorage.setItem(VOICE_KEY, previewed.voiceId);
    router.push("/onboarding/name");
  }, [previewed.id, previewed.voiceId, router, stopAudio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === " ") {
        e.preventDefault();
        toggleListen();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, toggleListen, onContinue]);

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <OnboardingFrame step={1} totalSteps={5} bloomTint={accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 pt-10 pb-14 flex flex-col items-center">
        <div className="w-full max-w-[1100px] flex flex-col flex-1">
          {/* Act header — top-left anchor */}
          <motion.div
            initial={
              reduced ? false : { opacity: 0, y: 8, filter: "blur(6px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            className="flex items-center gap-4 mb-10"
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
              Act One — The Cast
            </span>
          </motion.div>

          {/* Hero — asymmetric editorial spread.
              Text dominates (60%); glass play button is the focal
              counterweight on the right. Tight gap so they read as
              one composition. */}
          <div
            className="grid items-center gap-10 lg:gap-12 flex-1"
            style={{
              gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 0.65fr)",
            }}
          >
            {/* LEFT — agent no, name, tagline */}
            <div className="relative min-h-[380px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={previewed.id}
                  initial={
                    reduced
                      ? false
                      : { opacity: 0, y: 14, filter: "blur(8px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    reduced
                      ? undefined
                      : { opacity: 0, y: -8, filter: "blur(6px)" }
                  }
                  transition={{
                    duration: 0.55,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                >
                  {/* Agent number */}
                  <div className="mb-7 flex flex-col gap-2">
                    <span
                      className="text-[11px] tracking-[0.32em] uppercase"
                      style={{
                        color: "rgba(245,240,230,0.4)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Agent No. 0{index + 1}
                    </span>
                    <span
                      className="inline-block h-px w-12"
                      style={{ background: "rgba(245,240,230,0.16)" }}
                    />
                  </div>

                  {/* Name */}
                  <h1
                    className="font-serif font-medium"
                    style={{
                      fontSize: "clamp(4.5rem, 10vw, 8.5rem)",
                      lineHeight: 0.94,
                      letterSpacing: "-0.035em",
                      color: "rgba(245,240,230,0.98)",
                    }}
                  >
                    {previewed.name}
                    <span style={{ color: accent, opacity: 0.85 }}>.</span>
                  </h1>

                  {/* Tagline */}
                  <p
                    className="mt-7 font-serif italic max-w-[30ch]"
                    style={{
                      fontSize: "clamp(1.125rem, 1.6vw, 1.4375rem)",
                      lineHeight: 1.3,
                      color: "rgba(245,240,230,0.6)",
                    }}
                  >
                    {previewed.tagline}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* RIGHT — premium glass play button */}
            <div className="relative h-full min-h-[380px] flex items-center justify-center">
              <GlassPlayButton
                state={playState}
                progressRatio={progressRatio}
                accent={accent}
                onToggle={toggleListen}
              />
            </div>
          </div>

          {/* Bottom row — cast nav left, Continue pill right */}
          <div className="relative mt-10 flex items-center justify-between gap-8">
            <nav className="flex items-center gap-8">
              {PERSONALITIES.map((p, i) => {
                const isCurrent = i === index;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className="relative px-1 pt-1 pb-2"
                  >
                    <motion.span
                      className="font-serif inline-block"
                      style={{
                        fontSize: 18,
                        letterSpacing: "-0.01em",
                      }}
                      animate={{
                        color: isCurrent
                          ? "rgba(245,240,230,0.96)"
                          : "rgba(245,240,230,0.32)",
                        y: isCurrent ? -1 : 0,
                      }}
                      transition={{
                        duration: 0.45,
                        ease: [0.2, 0.7, 0.2, 1],
                      }}
                    >
                      {p.name}
                    </motion.span>

                    {isCurrent && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                        style={{
                          background: accent,
                          boxShadow: `0 0 8px ${accent}, 0 0 18px ${accent}55`,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                          mass: 0.9,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <motion.button
              type="button"
              onClick={onContinue}
              whileHover={
                reduced
                  ? undefined
                  : {
                      scale: 1.03,
                      borderColor: `${accent}cc`,
                      backgroundColor: `${accent}14`,
                      boxShadow: `0 0 38px -4px ${accent}cc, inset 0 0 16px ${accent}22`,
                    }
              }
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
              className="inline-flex items-center gap-3 h-12 px-6 rounded-full font-serif relative"
              style={{
                fontSize: 16,
                background: "transparent",
                border: `1px solid ${accent}66`,
                color: "rgba(245,240,230,0.96)",
                boxShadow: `0 0 24px -8px ${accent}88`,
              }}
            >
              <span>
                Continue as{" "}
                <span style={{ color: accent }}>{previewed.name}</span>
              </span>
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
            </motion.button>
          </div>
        </div>
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * GlassPlayButton — premium frosted-glass disc that is the voice
 * interaction. Press to hear. While playing, a thin accent arc
 * traces the circumference as a progress indicator.
 * ============================================================ */
function GlassPlayButton({
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
  const size = 240;
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      disabled={isError}
      whileHover={
        reduced || isError
          ? undefined
          : {
              scale: 1.035,
              y: -3,
            }
      }
      whileTap={isError ? undefined : { scale: 0.97, y: 0 }}
      transition={{
        scale: { type: "spring", stiffness: 240, damping: 22, mass: 0.9 },
        y: { type: "spring", stiffness: 240, damping: 22, mass: 0.9 },
      }}
      className="relative grid place-items-center group disabled:cursor-not-allowed"
      style={{ width: size, height: size }}
      aria-label={isPlaying ? "Stop voice sample" : "Play voice sample"}
    >
      {/* Outer atmospheric glow halo — grows on hover */}
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

      {/* Idle breathing ring — appears only on hover */}
      {!reduced && hovered && !isPlaying && (
        <motion.div
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -8,
            border: `1px solid ${accent}55`,
          }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: [0, 0.7, 0], scale: [0.96, 1.08, 1.16] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Pulse ring when playing */}
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
          borderColor: hovered
            ? "rgba(255,255,255,0.28)"
            : "rgba(255,255,255,0.14)",
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
        style={{
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      />

      {/* Specular highlight — top-left soft glint, brightens on hover */}
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

      {/* Bottom accent reflection — color bleeding up from below,
          intensifies on hover */}
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

      {/* Progress arc — traces circumference while playing */}
      {(isPlaying || isLoading) && (
        <svg
          aria-hidden
          className="absolute inset-0 -rotate-90 pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`${accent}1f`}
            strokeWidth="1.5"
          />
          {/* Progress */}
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

      {/* Center icon — refined geometry, accent glow */}
      <motion.div
        className="relative"
        animate={{
          opacity: hovered ? 1 : 0.78,
          scale: hovered ? 1.06 : 1,
        }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {isLoading ? (
          <Spinner size={42} accent={accent} />
        ) : isPlaying ? (
          <StopIcon size={32} accent={accent} />
        ) : (
          <PlayIcon size={44} accent={accent} />
        )}
      </motion.div>
    </motion.button>
  );
}

// Refined play triangle — thin outlined glyph (rounded vertices)
// rather than a solid white slab. Soft accent drop-shadow gives it
// depth without screaming "playback button".
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
      <path
        d="M8.2 5.4c0-1 1.1-1.7 2-1.1l9.2 6.5c.8.5.8 1.7 0 2.3l-9.2 6.5c-.9.6-2-.1-2-1.1V5.4z"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
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
