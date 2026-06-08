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

  const onContinue = useCallback(async () => {
    stopAudio();
    localStorage.setItem(STORAGE_KEY, previewed.id);
    localStorage.setItem(VOICE_KEY, previewed.voiceId);
    // Pre-grant mic permission while we still have a fresh user
    // gesture. /onboarding/name auto-starts the live agent on mount;
    // without this the browser blocks the mic request and the agent
    // can't speak until the user taps the floating widget.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // User denied or browser blocked — the next page will fall back
      // to its tap-to-start affordance.
    }
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
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 py-10 flex flex-col items-center justify-center overflow-hidden">
        {/* Liquid aurora — slow morphing color clouds. Five layered
            radial gradients translating + scaling on independent
            long-period loops. mix-blend-mode: screen lets the
            colors mingle organically. The whole thing is keyed to
            the active personality accent so the atmosphere shifts
            as you cycle through agents. */}
        <LiquidAurora accent={accent} accentDeep={previewed.accentDeep} />

        <div className="relative w-full max-w-[1440px] flex flex-col gap-14 lg:gap-20">
          {/* Act header — top-left anchor */}
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
              Act One — The Cast
            </span>
          </motion.div>

          {/* Hero — asymmetric editorial spread.
              Text on the left, carousel on the right. Grid columns
              tuned so the right column is wide enough to hold the
              full carousel (center + flanking ghosts) without
              clipping. */}
          <div
            className="grid items-center gap-12 lg:gap-16"
            style={{
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr)",
            }}
          >
            {/* LEFT — agent no, name, tagline, continue.
                The Continue button sits under the tagline, anchored
                to the text column rather than centered on the page. */}
            <div className="relative flex flex-col items-start">
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
                  className="w-full"
                >
                  {/* Editorial meta — full plate above the name.
                      Reads as a magazine masthead rather than a
                      casual "Agent No. 03" label. */}
                  <div className="mb-7 flex items-center gap-3">
                    <span
                      className="text-[10.5px] tracking-[0.42em] uppercase"
                      style={{
                        color: "rgba(245,240,230,0.5)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Agent N° {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="inline-block h-px w-6"
                      style={{ background: "rgba(245,240,230,0.2)" }}
                    />
                    <span
                      className="text-[10.5px] tracking-[0.42em] uppercase"
                      style={{
                        color: "rgba(245,240,230,0.32)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Est. 2026
                    </span>
                  </div>

                  {/* Name — editorial refined.
                      Smaller scale (was up to 10rem, now 7.5rem),
                      much tighter tracking (-0.055em), lighter
                      weight (400). Reads as Stripe Press / Aesop,
                      not a cartoon. */}
                  <h1
                    className="font-serif"
                    style={{
                      fontSize: "clamp(3.75rem, 8vw, 7.5rem)",
                      fontWeight: 400,
                      lineHeight: 0.92,
                      letterSpacing: "-0.055em",
                      color: "rgba(245,240,230,0.98)",
                    }}
                  >
                    {previewed.name}
                    <span
                      style={{
                        color: accent,
                        opacity: 0.72,
                        fontSize: "0.7em",
                        verticalAlign: "0.04em",
                        marginLeft: "0.04em",
                      }}
                    >
                      .
                    </span>
                  </h1>

                  {/* Editorial divider between name and tagline */}
                  <div className="mt-6 mb-5 flex items-center gap-3">
                    <span
                      className="inline-block h-px w-10"
                      style={{
                        background: `linear-gradient(90deg, ${accent}aa, transparent)`,
                      }}
                    />
                    <span
                      className="text-[9.5px] tracking-[0.5em] uppercase"
                      style={{
                        color: "rgba(245,240,230,0.32)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      The Brief
                    </span>
                  </div>

                  {/* Tagline — refined italic, calmer scale, tighter
                      line-height. Reads as a pull-quote, not a chat
                      message. */}
                  <p
                    className="font-serif italic max-w-[30ch]"
                    style={{
                      fontSize: "clamp(1rem, 1.35vw, 1.1875rem)",
                      lineHeight: 1.45,
                      letterSpacing: "-0.005em",
                      color: "rgba(245,240,230,0.62)",
                    }}
                  >
                    {previewed.tagline}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Continue — anchored under the text column.
                  Border uses the personality accent at 80% alpha so
                  the color reads cleanly (was 40% which looked muddy
                  / reddish against the dark canvas). */}
              <motion.button
                type="button"
                onClick={onContinue}
                whileHover={
                  reduced
                    ? undefined
                    : {
                        scale: 1.03,
                        backgroundColor: `${accent}14`,
                        boxShadow: `0 0 38px -4px ${accent}cc, inset 0 0 16px ${accent}22`,
                      }
                }
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
                className="mt-12 inline-flex items-center gap-3 h-12 px-6 rounded-full font-serif relative"
                style={{
                  fontSize: 16,
                  background: "transparent",
                  border: `1.5px solid ${accent}cc`,
                  color: "rgba(245,240,230,0.96)",
                  boxShadow: `0 0 26px -6px ${accent}aa`,
                }}
              >
                <span>
                  Continue as{" "}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={previewed.id}
                      initial={reduced ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -4 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.2, 0.7, 0.2, 1],
                      }}
                      style={{ color: accent, display: "inline-block" }}
                    >
                      {previewed.name}
                    </motion.span>
                  </AnimatePresence>
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

            {/* RIGHT — orb carousel with glass nav arrows.
                Prev / current / next visible at once; side orbs are
                blurred + scaled-down ghosts in their own accent.
                Clicking a side orb OR an arrow navigates between
                agents. Wrapper allows overflow so arrows can sit
                just outside the side orbs without clipping. */}
            <div className="relative flex items-center justify-center overflow-visible">
              <div
                className="relative flex items-center justify-center"
                style={{ width: 660, height: 320 }}
              >
                <GlassNavArrow
                  direction="left"
                  accent={accent}
                  onClick={goPrev}
                  style={{ position: "absolute", left: -28, zIndex: 20 }}
                />
                <OrbCarousel
                  currentIndex={index}
                  setIndex={setIndex}
                  playState={playState}
                  progressRatio={progressRatio}
                  onTogglePlay={toggleListen}
                />
                <GlassNavArrow
                  direction="right"
                  accent={accent}
                  onClick={goNext}
                  style={{ position: "absolute", right: -28, zIndex: 20 }}
                />
              </div>
            </div>
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
  interactive = true,
}: {
  state: PlayState;
  progressRatio: number;
  accent: string;
  onToggle: () => void;
  /** When false, the button renders as a quiet glass orb (no play
   *  icon, no progress arc, no pulse rings). Used for side orbs in
   *  the carousel which act as navigation targets only. */
  interactive?: boolean;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const isPlaying = interactive && state === "playing";
  const isLoading = interactive && state === "loading";
  const isError = interactive && state === "error";
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

      {/* Center icon — refined geometry, accent glow.
          Hidden when the orb is a non-interactive side preview. */}
      {interactive && (
        <motion.div
          className="relative"
          animate={{
            opacity: hovered ? 1 : 0.78,
            scale: hovered ? 1.06 : 1,
          }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {isLoading ? (
            <Spinner size={52} accent={accent} />
          ) : isPlaying ? (
            <StopIcon size={40} accent={accent} />
          ) : (
            <PlayIcon size={54} accent={accent} />
          )}
        </motion.div>
      )}
    </motion.button>
  );
}

/* ============================================================
 * OrbCarousel — prev / current / next glass orbs visible at once.
 * Smooth spring transitions between positions; side orbs are
 * blurred + reduced-opacity ghosts in their own personality's
 * accent color. Clicking a side orb navigates to that agent;
 * clicking the current orb plays / stops its sample.
 * ============================================================ */
function OrbCarousel({
  currentIndex,
  setIndex,
  playState,
  progressRatio,
  onTogglePlay,
}: {
  currentIndex: number;
  setIndex: (i: number) => void;
  playState: PlayState;
  progressRatio: number;
  onTogglePlay: () => void;
}) {
  const total = PERSONALITIES.length;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 660, height: 320 }}
    >
      {PERSONALITIES.map((p, i) => {
        const diff = ((i - currentIndex) % total + total) % total;
        const isCurrent = diff === 0;
        const isNext = diff === 1;
        const isPrev = diff === total - 1;

        let x = 0;
        let scale = 1;
        let opacity = 1;
        let blur = 0;
        let z = 3;

        if (!isCurrent) {
          if (isNext) {
            x = 215;
            scale = 0.62;
            opacity = 0.55;
            blur = 3;
            z = 2;
          } else if (isPrev) {
            x = -215;
            scale = 0.62;
            opacity = 0.55;
            blur = 3;
            z = 2;
          } else {
            // far / opposite — hidden behind
            x = 0;
            scale = 0.4;
            opacity = 0;
            blur = 16;
            z = 1;
          }
        }

        return (
          <motion.div
            key={p.id}
            className="absolute"
            animate={{ x, scale, opacity, filter: `blur(${blur}px)` }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 28,
              mass: 1.1,
            }}
            style={{ zIndex: z }}
          >
            <GlassPlayButton
              state={isCurrent ? playState : "idle"}
              progressRatio={isCurrent ? progressRatio : 0}
              accent={p.accent}
              interactive={isCurrent}
              onToggle={() => {
                if (isCurrent) onTogglePlay();
                else setIndex(i);
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================
 * GlassNavArrow — small frosted-glass disc flanking the carousel.
 * Mirrors the language of the main glass play button (linear
 * gradient + backdrop blur + accent rim) at a quieter scale so it
 * reads as supplementary navigation, not a competing CTA.
 * ============================================================ */
function GlassNavArrow({
  direction,
  accent,
  onClick,
  style,
}: {
  direction: "left" | "right";
  accent: string;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.92 }}
      whileHover={reduced ? undefined : { scale: 1.08, y: -1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="grid place-items-center rounded-full"
      style={{
        width: 46,
        height: 46,
        background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${accent}10 100%)`,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: hovered
          ? `1px solid ${accent}aa`
          : "1px solid rgba(255,255,255,0.16)",
        boxShadow: hovered
          ? `0 0 26px -4px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.22)`
          : "inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 24px -8px rgba(0,0,0,0.5)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        ...style,
      }}
      aria-label={direction === "left" ? "Previous agent" : "Next agent"}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        style={{
          color: "rgba(245,240,230,0.85)",
          transform: direction === "left" ? "rotate(180deg)" : "none",
          filter: hovered ? `drop-shadow(0 0 6px ${accent}aa)` : "none",
          transition: "filter 0.3s ease",
        }}
      >
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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

/* ============================================================
 * LiquidAurora — slow morphing accent-color clouds that drift
 * across the page as a backdrop. Five large radial gradients,
 * each translating + scaling on its own long-period loop, blended
 * with mix-blend-mode: screen so they mingle into the dark canvas
 * rather than stacking opaquely. Keyed to the active personality
 * accent so the atmosphere shifts with the carousel.
 *
 * The blobs sit BEHIND content (z-0 of the inner container) and
 * BEHIND the orb carousel's own bloom — heavy blur + low base
 * opacity means it reads as ambient lighting, never competing
 * with the orb's foreground glow.
 * ============================================================ */
function LiquidAurora({
  accent,
  accentDeep,
}: {
  accent: string;
  accentDeep: string;
}) {
  const reduced = useReducedMotion();

  // Five blobs with hand-tuned starting positions, sizes, durations,
  // and color stops. Mismatched durations (24/29/35/19/41 seconds)
  // mean the configuration never repeats — the page feels alive.
  const blobs = [
    {
      x: "8%",
      y: "10%",
      size: 720,
      color: `${accent}33`,
      duration: 24,
      path: { x: [0, 80, -40, 0], y: [0, 60, 120, 0], scale: [1, 1.1, 0.95, 1] },
    },
    {
      x: "70%",
      y: "5%",
      size: 620,
      color: `${accentDeep}40`,
      duration: 29,
      path: {
        x: [0, -60, 40, 0],
        y: [0, 50, -30, 0],
        scale: [1, 0.92, 1.08, 1],
      },
    },
    {
      x: "20%",
      y: "60%",
      size: 800,
      color: `${accent}22`,
      duration: 35,
      path: {
        x: [0, 90, 30, 0],
        y: [0, -40, -90, 0],
        scale: [1, 1.05, 0.9, 1],
      },
    },
    {
      x: "75%",
      y: "55%",
      size: 700,
      color: `${accent}2a`,
      duration: 19,
      path: {
        x: [0, -50, -20, 0],
        y: [0, 70, -50, 0],
        scale: [1, 1.12, 0.88, 1],
      },
    },
    {
      x: "45%",
      y: "30%",
      size: 540,
      color: `${accentDeep}33`,
      duration: 41,
      path: {
        x: [0, 40, -60, 0],
        y: [0, -80, 40, 0],
        scale: [1, 0.95, 1.15, 1],
      },
    },
  ];

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0, mixBlendMode: "screen" }}
    >
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: blob.x,
            top: blob.y,
            width: blob.size,
            height: blob.size,
            marginLeft: -blob.size / 2,
            marginTop: -blob.size / 2,
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 65%)`,
            filter: "blur(90px)",
          }}
          animate={
            reduced
              ? { opacity: 0.55 }
              : {
                  x: blob.path.x,
                  y: blob.path.y,
                  scale: blob.path.scale,
                }
          }
          transition={
            reduced
              ? { duration: 0.5 }
              : {
                  duration: blob.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.33, 0.67, 1],
                }
          }
        />
      ))}
    </div>
  );
}
