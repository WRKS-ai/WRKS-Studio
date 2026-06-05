"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DarkAvatar } from "@/components/dark-avatar";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";
import { VOICES } from "@/lib/voices";

const STORAGE_KEY = "wrks-onboarding-personality";
const VOICE_KEY = "wrks-onboarding-voice";

// Casting program — Act One. Each personality is a complete agent
// (personality + voice + visual mark). The page reads like a small
// theatre programme: act label, agent number, name set at scale, a
// quoted line, an inline listen control, and a sculptural form on
// the right with a curatorial caption.
//
// Visual notes:
// • No pulsing AI energy bloom (the OnboardingFrame keeps a single
//   static warm light instead).
// • Voice playback is an inline text control with a thin progress
//   line — not a giant button.
// • Picking commits BOTH the personality and its paired voice in a
//   single keystroke / click — the /onboarding/voice page is gone.

const FORM_NAMES: Record<PersonalityId, string> = {
  maven: "Monolith",
  sage: "Lens",
  spark: "Crescent",
  echo: "Rings",
};

type PlayState = "idle" | "loading" | "playing" | "error";

export default function PersonalityPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [index, setIndex] = useState<number>(0);
  const [committed, setCommitted] = useState<PersonalityId | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as PersonalityId | null;
    if (saved && PERSONALITIES.some((p) => p.id === saved)) {
      setCommitted(saved);
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

  // Stop playback when index changes
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
    setCommitted(previewed.id);
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
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 pt-14 pb-20 flex flex-col items-center">
        <div className="w-full max-w-[1280px] flex flex-col flex-1">
          {/* Act header — small editorial detail at the very top */}
          <motion.div
            initial={
              reduced ? false : { opacity: 0, y: 8, filter: "blur(6px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            className="flex items-center gap-4 mb-12"
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

          {/* Hero */}
          <div
            className="grid items-center gap-10 lg:gap-16 flex-1"
            style={{
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
            }}
          >
            {/* LEFT — name, traits, line, listen control */}
            <div className="relative min-h-[460px] flex flex-col justify-center">
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
                  {/* Agent number — small caps with a thin rule below */}
                  <div className="mb-6 flex flex-col gap-2">
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

                  {/* NAME — typographic hero */}
                  <h1
                    className="font-serif font-medium"
                    style={{
                      fontSize: "clamp(5rem, 11vw, 9.5rem)",
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
                    className="mt-7 font-serif italic max-w-[28ch]"
                    style={{
                      fontSize: "clamp(1.25rem, 1.9vw, 1.625rem)",
                      lineHeight: 1.25,
                      color: "rgba(245,240,230,0.6)",
                    }}
                  >
                    {previewed.tagline}
                  </p>

                  {/* Traits — middot-separated mono small caps */}
                  <div
                    className="mt-6 text-[11.5px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.4)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {previewed.traits.join("  ·  ")}
                  </div>

                  {/* Sample line — editorial blockquote */}
                  <div
                    className="mt-11 max-w-[44ch] pl-5"
                    style={{
                      borderLeft: `1px solid ${accent}66`,
                    }}
                  >
                    <p
                      className="font-serif italic"
                      style={{
                        fontSize: "clamp(1.0625rem, 1.4vw, 1.1875rem)",
                        lineHeight: 1.55,
                        color: "rgba(245,240,230,0.82)",
                      }}
                    >
                      &ldquo;{previewed.sample}&rdquo;
                    </p>
                    {/* Inline voice listen control */}
                    <ListenControl
                      state={playState}
                      currentTime={currentTime}
                      duration={duration}
                      voiceName={pairedVoice.name}
                      progressRatio={progressRatio}
                      accent={accent}
                      onToggle={toggleListen}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* RIGHT — sculptural mark, art-object treatment */}
            <div className="relative h-full min-h-[420px] flex flex-col items-center justify-center gap-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={previewed.id}
                  initial={
                    reduced
                      ? false
                      : { opacity: 0, scale: 0.94, filter: "blur(10px)" }
                  }
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={
                    reduced
                      ? undefined
                      : { opacity: 0, scale: 0.95, filter: "blur(8px)" }
                  }
                  transition={{
                    duration: 0.7,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="relative"
                >
                  <DarkAvatar personality={previewed} size={300} />
                </motion.div>
              </AnimatePresence>

              {/* Curatorial caption — like a museum plaque */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={previewed.id + "-caption"}
                  initial={reduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.1,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="text-center flex flex-col items-center gap-1.5"
                >
                  <span
                    className="text-[10px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.32)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Plate 0{index + 1}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.22em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.45)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Form · {FORM_NAMES[previewed.id]}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom row — Cast nav + Continue pill */}
          <div className="relative mt-12 flex items-center justify-between gap-8">
            {/* Cast nav */}
            <nav className="flex items-center gap-8">
              {PERSONALITIES.map((p, i) => {
                const isCurrent = i === index;
                const isCommittedHere = committed === p.id;
                const nameColor = isCurrent
                  ? "rgba(245,240,230,0.96)"
                  : isCommittedHere
                    ? p.accent
                    : "rgba(245,240,230,0.32)";
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
                        color: nameColor,
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
                          background: isCommittedHere
                            ? p.accent
                            : "rgba(245,240,230,0.85)",
                          boxShadow: isCommittedHere
                            ? `0 0 8px ${p.accent}, 0 0 18px ${p.accent}55`
                            : "none",
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

            {/* Continue */}
            <div className="flex items-center gap-7">
              <span
                className="text-[10.5px] tracking-[0.24em] uppercase hidden md:inline-block"
                style={{
                  color: "rgba(245,240,230,0.32)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                ← → browse · space listen
              </span>

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
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * ListenControl — inline editorial play link with a thin progress
 * line that grows beneath as audio plays. No big button.
 * ============================================================ */
function ListenControl({
  state,
  currentTime,
  duration,
  voiceName,
  progressRatio,
  accent,
  onToggle,
}: {
  state: PlayState;
  currentTime: number;
  duration: number;
  voiceName: string;
  progressRatio: number;
  accent: string;
  onToggle: () => void;
}) {
  const isPlaying = state === "playing";
  const isLoading = state === "loading";
  const isError = state === "error";

  const label = isError
    ? "Sample unavailable"
    : isLoading
      ? "Loading…"
      : isPlaying
        ? `Stop · ${formatTime(currentTime)} / ${formatTime(duration)}`
        : `Listen — ${voiceName}${duration > 0 ? ` · ${formatTime(duration)}` : ""}`;

  return (
    <div className="mt-5 flex flex-col gap-2 max-w-[40ch]">
      <button
        type="button"
        onClick={onToggle}
        disabled={isError}
        className="group inline-flex items-center gap-2.5 self-start transition-colors"
        style={{
          fontSize: 13,
          color: isPlaying
            ? "rgba(245,240,230,0.85)"
            : "rgba(245,240,230,0.62)",
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
        }}
      >
        <span
          aria-hidden
          className="inline-flex shrink-0"
          style={{ color: accent }}
        >
          {isPlaying ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill={accent}>
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill={accent}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
        <span>{label}</span>
      </button>

      {/* Thin progress line — only when playing or loading */}
      {(isPlaying || isLoading) && (
        <div
          className="h-px w-full overflow-hidden"
          style={{ background: "rgba(245,240,230,0.08)" }}
        >
          <motion.div
            className="h-full"
            style={{ background: accent }}
            animate={{ width: `${progressRatio * 100}%` }}
            transition={{ duration: 0.15, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}
