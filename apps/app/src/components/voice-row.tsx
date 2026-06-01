"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Voice } from "@/lib/voices";

type State = "idle" | "loading" | "playing" | "missing" | "error";

// A voice represented as a row, not a box. The row is the entire click
// target: tapping anywhere plays the sample (or stops it if already
// playing), and selects this voice. Selected = accent underline + name
// brightens. Playing = waveform animates inline.

export function VoiceRow({
  voice,
  index,
  selected,
  isPlaying,
  onSelect,
  onPlayChange,
}: {
  voice: Voice;
  index: number;
  selected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlayChange: (s: { playing: boolean; voiceId: Voice["id"] }) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    if (!isPlaying && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
    }
  }, [isPlaying]);

  const ensureAudio = () => {
    if (audioRef.current) return audioRef.current;
    const el = new Audio(voice.sample);
    el.addEventListener("ended", () => {
      setState("idle");
      onPlayChange({ playing: false, voiceId: voice.id });
    });
    el.addEventListener("error", () => {
      setState("missing");
      onPlayChange({ playing: false, voiceId: voice.id });
    });
    audioRef.current = el;
    return el;
  };

  const play = () => {
    const el = ensureAudio();
    el.currentTime = 0;
    setState("loading");
    onPlayChange({ playing: true, voiceId: voice.id });
    el.play()
      .then(() => setState("playing"))
      .catch((err) => {
        if (el.error?.code === 4) setState("missing");
        else setState("error");
        onPlayChange({ playing: false, voiceId: voice.id });
        console.warn(`Voice "${voice.id}" sample failed:`, err);
      });
  };

  const stop = () => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setState("idle");
    onPlayChange({ playing: false, voiceId: voice.id });
  };

  const handleClick = () => {
    onSelect();
    if (state === "playing" || state === "loading") stop();
    else play();
  };

  const ariaLabel =
    state === "playing"
      ? `Stop ${voice.name} sample`
      : `Play ${voice.name} sample — ${voice.tagline}`;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={reduced ? undefined : { x: 4 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      aria-pressed={selected}
      aria-label={ariaLabel}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: selected ? 1 : 0.7, y: 0 }}
      // Stagger entry — row 0 enters first, then 1, 2, 3
      {...(reduced
        ? {}
        : {
            transition: {
              opacity: { duration: 0.4 },
              y: { duration: 0.6, delay: 0.85 + index * 0.08, ease: [0.2, 0.7, 0.2, 1] },
            },
          })}
      className="group relative w-full flex items-center gap-5 sm:gap-6 py-5 sm:py-6 outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md transition-opacity"
    >
      {/* Play indicator — small filled circle, scales with state */}
      <div
        aria-hidden
        className="relative shrink-0 size-10 sm:size-11 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${voice.accent} 0%, ${voice.accentDeep} 100%)`,
          boxShadow:
            state === "playing"
              ? `0 0 0 2px ${voice.accent}, 0 0 28px 4px ${voice.glow}`
              : `0 4px 12px -4px rgba(0,0,0,0.55), inset 0 -2px 4px rgba(0,0,0,0.2)`,
        }}
      >
        {state === "playing" ? (
          <StopIcon />
        ) : state === "loading" ? (
          <Spinner />
        ) : (
          <PlayIcon />
        )}
        {/* Pulse rings while playing */}
        {state === "playing" && !reduced && (
          <>
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ border: `1px solid ${voice.accent}` }}
                initial={{ scale: 1, opacity: 0.55 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Name + tagline */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-baseline gap-3">
          <h3
            className="font-serif font-medium tracking-tight text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.05] transition-colors"
            style={{
              color: selected ? voice.accent : "rgb(245 245 245)",
            }}
          >
            {voice.name}
          </h3>
          <span className="hidden sm:inline text-[10px] tracking-[0.2em] uppercase text-ink-dim font-mono shrink-0">
            {voice.pairsWith}
          </span>
        </div>
        <p className="mt-1 font-serif italic text-[clamp(0.9rem,1.1vw,1rem)] text-ink-muted leading-snug">
          {voice.tagline}
        </p>
      </div>

      {/* Waveform — only when playing */}
      <div className="hidden sm:flex items-center w-[140px] h-8 justify-end">
        {state === "playing" ? (
          <Waveform color={voice.accent} reduced={!!reduced} />
        ) : state === "missing" ? (
          <span className="text-[11px] text-amber-300/80 font-sans tracking-tight">
            Sample missing
          </span>
        ) : state === "error" ? (
          <span className="text-[11px] text-rose-300/80 font-sans tracking-tight">
            Tap again
          </span>
        ) : (
          <span className="text-[10px] tracking-[0.18em] uppercase text-ink-dim font-mono">
            Tap to hear
          </span>
        )}
      </div>

      {/* Bottom underline — the row's only "border", appears on selection */}
      <span
        aria-hidden
        className="absolute left-0 right-0 -bottom-px h-px transition-all duration-500"
        style={{
          background: `linear-gradient(to right, transparent 0%, ${
            selected ? voice.accent : "rgba(255,255,255,0.08)"
          } 50%, transparent 100%)`,
          opacity: selected ? 0.95 : 0.4,
          transform: selected ? "scaleX(1)" : "scaleX(0.85)",
          transformOrigin: "center",
        }}
      />
    </motion.button>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="white" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="white" strokeOpacity="0.3" strokeWidth="2.5" />
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

function Waveform({ color, reduced }: { color: string; reduced: boolean }) {
  const heights = [40, 75, 55, 95, 65, 80, 50, 90, 60, 75, 45, 85];
  return (
    <div className="flex items-center gap-[3px] h-full" aria-hidden>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: color }}
          animate={
            reduced
              ? { height: `${h * 0.5}%` }
              : { height: [`${h * 0.3}%`, `${h}%`, `${h * 0.3}%`] }
          }
          transition={{
            duration: 0.6 + (i % 4) * 0.18,
            repeat: Infinity,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
