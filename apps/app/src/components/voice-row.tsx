"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Voice } from "@/lib/voices";

type State = "idle" | "loading" | "playing" | "missing" | "error";

// VoiceRow v2 — editorial track listing.
// Charcoal play button with the accent appearing only as INTERIOR light
// (ring when selected, glow when playing). Name is the typographic
// element; selection signals via name color + a sliding underline at
// the bottom of the active row (shared layoutId 'voice-underline').

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
    el
      .play()
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
      whileHover={reduced ? undefined : { x: 6 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      aria-pressed={selected}
      aria-label={ariaLabel}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: selected ? 1 : 0.62, y: 0 }}
      {...(reduced
        ? {}
        : {
            transition: {
              opacity: { duration: 0.4 },
              y: {
                duration: 0.6,
                delay: 0.55 + index * 0.06,
                ease: [0.2, 0.7, 0.2, 1],
              },
            },
          })}
      className="group relative w-full flex items-center gap-6 py-6 outline-none"
    >
      {/* Play button — charcoal disc with accent ring when selected/playing */}
      <div
        aria-hidden
        className="relative shrink-0 size-12 rounded-full grid place-items-center"
        style={{
          background:
            state === "playing"
              ? `${voice.accent}1f`
              : selected
                ? `${voice.accent}12`
                : "rgba(245,240,230,0.025)",
          border: `1.5px solid ${
            selected || state === "playing"
              ? voice.accent
              : "rgba(245,240,230,0.14)"
          }`,
          boxShadow:
            state === "playing"
              ? `0 0 0 6px ${voice.accent}10, 0 0 30px -4px ${voice.glow}`
              : "none",
          transition:
            "background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
        }}
      >
        {state === "playing" ? (
          <StopIcon color={voice.accent} />
        ) : state === "loading" ? (
          <Spinner color={voice.accent} />
        ) : (
          <PlayIcon
            color={selected ? voice.accent : "rgba(245,240,230,0.78)"}
          />
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
                initial={{ scale: 1, opacity: 0.5 }}
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
        <div className="flex items-baseline gap-4">
          <motion.h3
            className="font-serif font-medium"
            style={{
              fontSize: "clamp(1.625rem, 2.4vw, 2.125rem)",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
            animate={{
              color: selected
                ? voice.accent
                : "rgba(245,240,230,0.92)",
            }}
            transition={{ duration: 0.4 }}
          >
            {voice.name}
          </motion.h3>
          <span
            className="hidden sm:inline text-[10.5px] tracking-[0.22em] uppercase shrink-0"
            style={{
              color: "rgba(245,240,230,0.3)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {voice.pairsWith}
          </span>
        </div>
        <p
          className="mt-1.5"
          style={{
            fontSize: "clamp(0.95rem, 1.2vw, 1.0625rem)",
            color: "rgba(245,240,230,0.5)",
            lineHeight: 1.4,
          }}
        >
          {voice.tagline}
        </p>
      </div>

      {/* Right side: waveform when playing, hint otherwise */}
      <div className="hidden sm:flex items-center w-[140px] h-8 justify-end shrink-0">
        {state === "playing" ? (
          <Waveform color={voice.accent} reduced={!!reduced} />
        ) : state === "missing" ? (
          <span
            className="text-[10.5px] tracking-[0.22em] uppercase"
            style={{ color: "#fbbf24", fontFamily: "var(--font-mono)" }}
          >
            Sample missing
          </span>
        ) : state === "error" ? (
          <span
            className="text-[10.5px] tracking-[0.22em] uppercase"
            style={{ color: "#fda4af", fontFamily: "var(--font-mono)" }}
          >
            Tap again
          </span>
        ) : (
          <span
            className="text-[10.5px] tracking-[0.22em] uppercase transition-colors"
            style={{
              color: selected
                ? voice.accent
                : "rgba(245,240,230,0.28)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {selected ? "Selected" : "Tap to hear"}
          </span>
        )}
      </div>

      {/* Hairline separator at the bottom of every row */}
      <div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-px"
        style={{ background: "rgba(245,240,230,0.05)" }}
      />

      {/* Selected — accent underline sliding via shared layoutId */}
      {selected && (
        <motion.span
          layoutId="voice-underline"
          className="absolute left-0 right-0 bottom-0 h-[1.5px] rounded-full"
          style={{
            background: voice.accent,
            boxShadow: `0 0 8px ${voice.accent}, 0 0 18px ${voice.accent}44`,
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
}

function PlayIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon({ color }: { color: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={color} aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
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
