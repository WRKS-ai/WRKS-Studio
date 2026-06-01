"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Personality } from "@/lib/personalities";

type Size = "lg" | "md" | "sm";

const SIZES: Record<Size, { container: string; svg: number; halo: string; haloBlur: string }> = {
  lg: { container: "size-[220px] sm:size-[260px]", svg: 220, halo: "size-[400px] sm:size-[480px]", haloBlur: "blur(50px)" },
  md: { container: "size-[140px] sm:size-[160px]", svg: 140, halo: "size-[280px] sm:size-[320px]", haloBlur: "blur(36px)" },
  sm: { container: "size-12 sm:size-14", svg: 56, halo: "size-20 sm:size-24", haloBlur: "blur(14px)" },
};

/* Big hero glyph. Crossfades when the active personality changes. */
export function PersonalityIcon({
  personality,
  size = "lg",
}: {
  personality: Personality;
  size?: Size;
}) {
  const reduced = useReducedMotion();
  const s = SIZES[size];

  return (
    <div
      className={`relative ${s.container} flex items-center justify-center`}
    >
      {/* Soft halo */}
      <motion.div
        key={`${personality.id}-halo`}
        aria-hidden
        className={`absolute ${s.halo} rounded-full pointer-events-none`}
        style={{
          background: `radial-gradient(circle, ${personality.glow} 0%, ${personality.glow.replace(/[\d.]+\)$/, "0.08)")} 35%, transparent 65%)`,
          filter: s.haloBlur,
        }}
        initial={{ opacity: 0 }}
        animate={
          reduced
            ? { opacity: personality.motion.intensity * 0.8 }
            : {
                opacity: [
                  personality.motion.intensity * 0.6,
                  personality.motion.intensity,
                  personality.motion.intensity * 0.6,
                ],
                scale: [0.95, 1.04, 0.95],
              }
        }
        exit={{ opacity: 0 }}
        transition={{
          duration: personality.motion.duration * 1.6,
          repeat: reduced ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      {/* The glyph itself — cross-fade between personalities */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${personality.id}-glyph`}
          initial={reduced ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative"
        >
          <Glyph personality={personality} svgSize={s.svg} reduced={!!reduced} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Glyph({
  personality,
  svgSize,
  reduced,
}: {
  personality: Personality;
  svgSize: number;
  reduced: boolean;
}) {
  switch (personality.iconType) {
    case "arrow":
      return <ArrowGlyph personality={personality} svgSize={svgSize} reduced={reduced} />;
    case "lens":
      return <LensGlyph personality={personality} svgSize={svgSize} reduced={reduced} />;
    case "starburst":
      return <StarburstGlyph personality={personality} svgSize={svgSize} reduced={reduced} />;
    case "pulse":
      return <PulseGlyph personality={personality} svgSize={svgSize} reduced={reduced} />;
  }
}

/* ============================================================
 * MAVEN — Arrow / Peak
 * Sharp upward kinetic. Quick rhythmic bounce.
 * ============================================================ */
function ArrowGlyph({
  personality,
  svgSize,
  reduced,
}: {
  personality: Personality;
  svgSize: number;
  reduced: boolean;
}) {
  return (
    <motion.svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 100 100"
      aria-label={`${personality.name} avatar — arrow`}
      role="img"
      animate={reduced ? undefined : { y: [0, -3, 0] }}
      transition={{
        duration: personality.motion.duration,
        repeat: Infinity,
        ease: personality.motion.ease as [number, number, number, number],
      }}
    >
      <defs>
        <linearGradient id={`mv-grad-${personality.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={personality.accent} stopOpacity="1" />
          <stop offset="100%" stopColor={personality.accentDeep} stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Subtle shadow puck */}
      <ellipse cx="50" cy="92" rx="22" ry="2.5" fill={personality.accentDeep} opacity="0.35" />
      {/* Arrow body — peak with thick stem */}
      <path
        d="M50 8 L82 50 L66 50 L66 86 L34 86 L34 50 L18 50 Z"
        fill={`url(#mv-grad-${personality.id})`}
      />
      {/* Specular highlight */}
      <path
        d="M50 14 L70 40 L62 40 L62 78 L52 78 L52 40 L46 40 Z"
        fill="white"
        opacity="0.18"
      />
    </motion.svg>
  );
}

/* ============================================================
 * SAGE — Lens / Open eye
 * Patient observer. Slow blink.
 * ============================================================ */
function LensGlyph({
  personality,
  svgSize,
  reduced,
}: {
  personality: Personality;
  svgSize: number;
  reduced: boolean;
}) {
  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 100 100"
      aria-label={`${personality.name} avatar — lens`}
      role="img"
    >
      <defs>
        <radialGradient id={`sg-grad-${personality.id}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="55%" stopColor={personality.accent} stopOpacity="1" />
          <stop offset="100%" stopColor={personality.accentDeep} stopOpacity="1" />
        </radialGradient>
      </defs>
      {/* Outer lens almond — stroke */}
      <path
        d="M8 50 Q50 12, 92 50 Q50 88, 8 50 Z"
        fill="none"
        stroke={personality.accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Inner iris */}
      <motion.circle
        cx="50"
        cy="50"
        r="22"
        fill={`url(#sg-grad-${personality.id})`}
        animate={
          reduced
            ? undefined
            : { scaleY: [1, 1, 0.05, 1, 1] }
        }
        style={{ transformOrigin: "50px 50px" }}
        transition={{
          duration: personality.motion.duration,
          repeat: Infinity,
          times: [0, 0.85, 0.92, 0.97, 1],
          ease: "easeInOut",
        }}
      />
      {/* Highlight */}
      <circle cx="44" cy="44" r="5" fill="white" opacity="0.55" />
    </svg>
  );
}

/* ============================================================
 * SPARK — Starburst
 * Energetic 8-point burst. Gentle rotation + twinkle.
 * ============================================================ */
function StarburstGlyph({
  personality,
  svgSize,
  reduced,
}: {
  personality: Personality;
  svgSize: number;
  reduced: boolean;
}) {
  return (
    <motion.svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 100 100"
      aria-label={`${personality.name} avatar — starburst`}
      role="img"
      animate={reduced ? undefined : { rotate: [0, 8, 0, -8, 0] }}
      transition={{
        duration: personality.motion.duration * 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <defs>
        <radialGradient id={`sp-grad-${personality.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="40%" stopColor={personality.accent} stopOpacity="1" />
          <stop offset="100%" stopColor={personality.accentDeep} stopOpacity="1" />
        </radialGradient>
      </defs>
      <g fill={personality.accent}>
        {/* 4 long main rays (cardinal directions) */}
        <path d="M50 5 L54 46 L46 46 Z" />
        <path d="M50 95 L46 54 L54 54 Z" />
        <path d="M5 50 L46 46 L46 54 Z" />
        <path d="M95 50 L54 54 L54 46 Z" />
        {/* 4 shorter diagonal rays */}
        <path d="M22 22 L46 44 L44 46 Z" opacity="0.85" />
        <path d="M78 22 L56 44 L54 46 Z" opacity="0.85" />
        <path d="M22 78 L46 56 L44 54 Z" opacity="0.85" />
        <path d="M78 78 L54 54 L56 56 Z" opacity="0.85" />
      </g>
      {/* Center bulb */}
      <motion.circle
        cx="50"
        cy="50"
        r="14"
        fill={`url(#sp-grad-${personality.id})`}
        animate={reduced ? undefined : { scale: [1, 1.12, 1] }}
        style={{ transformOrigin: "50px 50px" }}
        transition={{
          duration: personality.motion.duration,
          repeat: Infinity,
          ease: personality.motion.ease as [number, number, number, number],
        }}
      />
    </motion.svg>
  );
}

/* ============================================================
 * ECHO — Concentric pulses
 * Layered rhythmic resonance.
 * ============================================================ */
function PulseGlyph({
  personality,
  svgSize,
  reduced,
}: {
  personality: Personality;
  svgSize: number;
  reduced: boolean;
}) {
  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 100 100"
      aria-label={`${personality.name} avatar — pulse`}
      role="img"
    >
      <defs>
        <radialGradient id={`ec-grad-${personality.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="50%" stopColor={personality.accent} stopOpacity="1" />
          <stop offset="100%" stopColor={personality.accentDeep} stopOpacity="1" />
        </radialGradient>
      </defs>
      {/* Outer 3 pulse rings — emanating */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="50"
          cy="50"
          r="14"
          fill="none"
          stroke={personality.accent}
          strokeWidth="2"
          initial={{ opacity: 0, scale: 1 }}
          animate={reduced ? { opacity: 0.45 } : { opacity: [0.7, 0, 0.7], scale: [1, 3.2, 1] }}
          style={{ transformOrigin: "50px 50px" }}
          transition={{
            duration: personality.motion.duration,
            repeat: Infinity,
            delay: i * personality.motion.delay,
            ease: "easeOut",
          }}
        />
      ))}
      {/* Central solid orb */}
      <circle cx="50" cy="50" r="14" fill={`url(#ec-grad-${personality.id})`} />
      {/* Specular highlight */}
      <circle cx="46" cy="46" r="3" fill="white" opacity="0.7" />
    </svg>
  );
}

/* ============================================================
 * Chip — mini selector with the same icon, smaller
 * ============================================================ */
export function PersonalityChip({
  personality,
  selected,
  onSelect,
}: {
  personality: Personality;
  selected: boolean;
  onSelect: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className="group relative flex flex-col items-center gap-2.5 px-3 py-3 sm:px-4 sm:py-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 transition-colors"
      style={{
        background: selected ? "rgba(255,255,255,0.04)" : "transparent",
        border: `1px solid ${selected ? personality.accent : "transparent"}`,
      }}
      aria-pressed={selected}
      aria-label={`Select ${personality.name}`}
    >
      <div className="relative">
        <PersonalityIcon personality={personality} size="sm" />
      </div>
      <span
        className="font-sans text-[12px] tracking-[0.04em] transition-colors duration-200"
        style={{
          color: selected ? "rgb(243 244 246)" : "rgba(255,255,255,0.45)",
          fontWeight: selected ? 600 : 500,
        }}
      >
        {personality.name}
      </span>
    </motion.button>
  );
}
