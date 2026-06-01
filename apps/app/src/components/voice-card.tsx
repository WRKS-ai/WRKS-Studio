"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Voice } from "@/lib/voices";

type State = "idle" | "loading" | "playing" | "missing" | "error";

export function VoiceCard({
  voice,
  selected,
  isPlaying,
  onSelect,
  onPlayChange,
}: {
  voice: Voice;
  selected: boolean;
  isPlaying: boolean; // true when THIS card is the one currently playing
  onSelect: () => void;
  onPlayChange: (state: { playing: boolean; voiceId: Voice["id"] }) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState<State>("idle");
  const [duration, setDuration] = useState<number | null>(null);

  // Tear down the audio if this card loses the "playing" position to another.
  useEffect(() => {
    if (!isPlaying && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
    }
  }, [isPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(voice.sample);
      audioRef.current.addEventListener("ended", () => {
        setState("idle");
        onPlayChange({ playing: false, voiceId: voice.id });
      });
      audioRef.current.addEventListener("error", () => {
        setState("missing");
        onPlayChange({ playing: false, voiceId: voice.id });
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration ?? null);
      });
    }

    if (!audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
      onPlayChange({ playing: false, voiceId: voice.id });
      return;
    }

    setState("loading");
    onPlayChange({ playing: true, voiceId: voice.id });
    audioRef.current
      .play()
      .then(() => setState("playing"))
      .catch((err) => {
        // Most likely: file 404 (sample not generated yet) or autoplay block
        if (audioRef.current?.error?.code === 4) setState("missing");
        else setState("error");
        onPlayChange({ playing: false, voiceId: voice.id });
        console.warn(`Voice "${voice.id}" sample failed:`, err);
      });
  };

  const cardSelected = selected;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      aria-pressed={cardSelected}
      aria-label={`${voice.name} — ${voice.tagline}`}
      className="group relative rounded-2xl p-5 sm:p-6 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 transition-colors"
      style={{
        background: cardSelected
          ? "rgba(255,255,255,0.035)"
          : "rgba(255,255,255,0.015)",
        border: `1px solid ${
          cardSelected ? voice.accent : "rgba(255,255,255,0.06)"
        }`,
        boxShadow: cardSelected
          ? `0 0 0 1px ${voice.accent}, 0 24px 64px -20px ${voice.glow}`
          : "none",
      }}
    >
      {/* Selected check pin */}
      {cardSelected && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 460, damping: 22 }}
          className="absolute top-4 right-4 size-5 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${voice.accent} 0%, ${voice.accentDeep} 100%)`,
          }}
          aria-hidden
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}

      <div className="flex items-start gap-4">
        {/* Play button */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={state === "playing" ? `Stop ${voice.name}` : `Play ${voice.name} sample`}
          className="relative shrink-0 size-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
          style={{
            background: `linear-gradient(135deg, ${voice.accent} 0%, ${voice.accentDeep} 100%)`,
            boxShadow:
              state === "playing"
                ? `0 0 0 2px ${voice.accent}, 0 0 32px 8px ${voice.glow}`
                : `0 6px 18px -6px rgba(0,0,0,0.6), inset 0 -3px 6px rgba(0,0,0,0.25)`,
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
                  animate={{ scale: 1.8, opacity: 0 }}
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
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif font-medium text-[clamp(1.25rem,1.7vw,1.5rem)] tracking-tight text-ink leading-none">
              {voice.name}
            </h3>
            <span className="text-[10px] tracking-[0.18em] uppercase text-ink-dim font-sans font-medium shrink-0">
              {voice.pairsWith}
            </span>
          </div>
          <p className="mt-1.5 text-[14px] text-ink-muted leading-snug">
            {voice.tagline}
          </p>

          {/* Waveform when playing */}
          <div className="mt-3 h-8 flex items-center">
            {state === "playing" ? (
              <Waveform color={voice.accent} reduced={!!reduced} />
            ) : state === "missing" ? (
              <span className="text-[11px] text-amber-300/85 font-sans tracking-tight">
                Sample missing — see <code className="font-mono">/voices/README.md</code>
              </span>
            ) : state === "error" ? (
              <span className="text-[11px] text-rose-300/85 font-sans tracking-tight">
                Couldn&rsquo;t play. Tap again.
              </span>
            ) : (
              <span className="text-[10px] tracking-[0.16em] uppercase text-ink-dim font-sans">
                Tap to hear
                {duration ? ` · ${Math.round(duration)}s` : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" aria-hidden>
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
  // 14 bars at varied baseline heights — gives a "real voice" feel
  // rather than a perfectly symmetrical animation.
  const heights = [40, 75, 55, 95, 65, 80, 50, 90, 60, 75, 45, 85, 55, 40];
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
