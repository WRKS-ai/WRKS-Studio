"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DarkAvatar } from "@/components/dark-avatar";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";
import { VOICES, type VoiceId } from "@/lib/voices";

// /onboarding/voice v3 — one voice at a time (matches personality
// page identity). Hero is the voice NAME at typographic scale; a big
// inline play button is the hero interaction. The 4 voice names sit
// at the bottom with a sliding accent underline (same shared layoutId
// pattern as the personality nav). Big sample line in a side-bordered
// blockquote echoes the personality page's sample-quote treatment.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";

const SAMPLE_LINE = "Hi. I'm your WRKS agent. Tell me what to build.";

type PlayState = "idle" | "loading" | "playing" | "missing" | "error";

export default function VoicePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  const [agentName, setAgentName] = useState<string>("");
  const [index, setIndex] = useState<number>(0);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    if (v) {
      const i = VOICES.findIndex((x) => x.id === v);
      if (i >= 0) setIndex(i);
    }
  }, [router]);

  const stopAudio = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    audioRef.current = null;
    setPlayState("idle");
  }, []);

  // Stop on index change — previewing a new voice should kill the old
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const goPrev = useCallback(() => {
    stopAudio();
    setIndex((i) => (i - 1 + VOICES.length) % VOICES.length);
  }, [stopAudio]);

  const goNext = useCallback(() => {
    stopAudio();
    setIndex((i) => (i + 1) % VOICES.length);
  }, [stopAudio]);

  const pickIndex = useCallback(
    (i: number) => {
      stopAudio();
      setIndex(i);
    },
    [stopAudio],
  );

  const previewed = VOICES[index]!;
  const accent = previewed.accent;

  const playSample = useCallback(() => {
    stopAudio();
    setPlayState("loading");
    const el = new Audio(previewed.sample);
    audioRef.current = el;
    el.addEventListener("ended", () => {
      setPlayState("idle");
      audioRef.current = null;
    });
    el.addEventListener("error", () => {
      setPlayState("missing");
      audioRef.current = null;
    });
    el
      .play()
      .then(() => setPlayState("playing"))
      .catch((err) => {
        if (el.error?.code === 4) setPlayState("missing");
        else setPlayState("error");
        audioRef.current = null;
        console.warn(`Voice "${previewed.id}" sample failed:`, err);
      });
  }, [previewed, stopAudio]);

  const togglePlay = useCallback(() => {
    if (playState === "playing" || playState === "loading") stopAudio();
    else playSample();
  }, [playState, stopAudio, playSample]);

  const onContinue = useCallback(() => {
    stopAudio();
    localStorage.setItem(VOICE_KEY, previewed.id);
    router.push("/onboarding/intake");
  }, [previewed.id, router, stopAudio]);

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
        togglePlay();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, togglePlay, onContinue]);

  if (!personalityId) return null;
  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;

  return (
    <OnboardingFrame step={3} totalSteps={7} bloomTint={accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 pt-16 pb-20 flex flex-col items-center">
        <div className="w-full max-w-[1280px] flex flex-col flex-1">
          <div
            className="grid items-center gap-10 lg:gap-16 flex-1"
            style={{
              gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
            }}
          >
            {/* LEFT — eyebrow + voice name + tagline + sample + play */}
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
                  {/* Eyebrow */}
                  <div
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
                    <span>
                      Voice for{" "}
                      <span style={{ color: "rgba(245,240,230,0.7)" }}>
                        {agentName || personality.name}
                      </span>{" "}
                      · 0{index + 1} of 0{VOICES.length}
                    </span>
                  </div>

                  {/* Hero — voice name */}
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
                    <span style={{ color: accent }}>.</span>
                  </h1>

                  {/* Tagline */}
                  <p
                    className="mt-7 font-serif italic max-w-[28ch]"
                    style={{
                      fontSize: "clamp(1.25rem, 1.85vw, 1.625rem)",
                      lineHeight: 1.25,
                      color: "rgba(245,240,230,0.62)",
                    }}
                  >
                    {previewed.tagline}
                  </p>

                  {/* Sample quote */}
                  <div
                    className="mt-10 max-w-[44ch] pl-5"
                    style={{ borderLeft: `1px solid ${accent}88` }}
                  >
                    <p
                      className="font-serif italic"
                      style={{
                        fontSize: "clamp(1.0625rem, 1.4vw, 1.1875rem)",
                        lineHeight: 1.55,
                        color: "rgba(245,240,230,0.78)",
                      }}
                    >
                      &ldquo;{SAMPLE_LINE}&rdquo;
                    </p>
                  </div>

                  {/* Big play button — the hero interaction */}
                  <div className="mt-9">
                    <PlayPill
                      state={playState}
                      voiceName={previewed.name}
                      accent={accent}
                      glow={previewed.glow}
                      onClick={togglePlay}
                      reduced={!!reduced}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* RIGHT — chosen personality's avatar (constant, not the voice's) */}
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
              >
                <DarkAvatar personality={personality} size={300} />
              </motion.div>
            </div>
          </div>

          {/* Bottom row — voice name nav + Continue pill */}
          <div className="relative mt-12 flex items-center justify-between gap-8">
            {/* Voice name nav — same sliding underline pattern as persona nav */}
            <nav className="flex items-center gap-8">
              {VOICES.map((v, i) => {
                const isCurrent = i === index;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => pickIndex(i)}
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
                      {v.name}
                    </motion.span>
                    {isCurrent && (
                      <motion.span
                        layoutId="voice-nav-underline"
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

            {/* Right — Continue pill */}
            <div className="flex items-center gap-7">
              <span
                className="text-[10.5px] tracking-[0.24em] uppercase hidden md:inline-block"
                style={{
                  color: "rgba(245,240,230,0.32)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                ← → to browse · space to play
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
                  Continue with{" "}
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

          {/* Floating ← Back link in bottom-left corner */}
          <button
            type="button"
            onClick={() => router.push("/onboarding/name")}
            className="absolute bottom-0 left-10 sm:left-14 text-[11px] tracking-[0.24em] uppercase transition-colors hover:opacity-100"
            style={{
              color: "rgba(245,240,230,0.4)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * PlayPill — large inline play button. Idle = ▷ Hear sample.
 * Playing = ◼ Stop + waveform. Loading = spinner.
 * ============================================================ */
function PlayPill({
  state,
  voiceName,
  accent,
  glow,
  onClick,
  reduced,
}: {
  state: PlayState;
  voiceName: string;
  accent: string;
  glow: string;
  onClick: () => void;
  reduced: boolean;
}) {
  const isPlaying = state === "playing";
  const isLoading = state === "loading";
  const isError = state === "missing" || state === "error";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={
        reduced
          ? undefined
          : {
              scale: 1.02,
              borderColor: `${accent}cc`,
              backgroundColor: isPlaying ? `${accent}28` : `${accent}1a`,
              boxShadow: `0 0 38px -4px ${accent}cc, inset 0 0 16px ${accent}22`,
            }
      }
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
      className="inline-flex items-center gap-4 h-14 px-7 rounded-full font-serif"
      style={{
        fontSize: 17,
        background: isPlaying ? `${accent}1a` : "transparent",
        border: `1.5px solid ${accent}88`,
        color: "rgba(245,240,230,0.96)",
        boxShadow: `0 0 30px -8px ${glow}`,
      }}
    >
      <span
        className="size-7 rounded-full grid place-items-center shrink-0"
        style={{
          background: `${accent}25`,
          border: `1px solid ${accent}`,
        }}
      >
        {isLoading ? (
          <Spinner color={accent} />
        ) : isPlaying ? (
          <StopIcon color={accent} />
        ) : (
          <PlayIcon color={accent} />
        )}
      </span>
      <span>
        {isError
          ? "Sample missing"
          : isPlaying
            ? `${voiceName} speaking…`
            : isLoading
              ? "Loading…"
              : `Hear ${voiceName}`}
      </span>
      {isPlaying && !reduced && (
        <MiniWaveform color={accent} />
      )}
    </motion.button>
  );
}

function PlayIcon({ color }: { color: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function StopIcon({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill={color} aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}
function Spinner({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke={color}
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
function MiniWaveform({ color }: { color: string }) {
  const heights = [40, 75, 55, 95, 65, 80, 50];
  return (
    <div className="flex items-center gap-[3px] h-5" aria-hidden>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[2.5px] rounded-full"
          style={{ background: color }}
          animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.3}%`] }}
          transition={{
            duration: 0.6 + (i % 3) * 0.18,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
