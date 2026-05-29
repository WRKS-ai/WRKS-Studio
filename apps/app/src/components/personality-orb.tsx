"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Personality } from "@/lib/personalities";

/* The hero orb — big, alive, breathing in the personality's own motion signature. */
export function PersonalityOrb({
  personality,
  size = "lg",
}: {
  personality: Personality;
  size?: "md" | "lg";
}) {
  const m = personality.motion;
  const isMd = size === "md";
  const orbSize = isMd ? "size-[140px] sm:size-[160px]" : "size-[240px] sm:size-[280px]";
  const ringSize = isMd ? "size-[120px] sm:size-[140px]" : "size-[200px] sm:size-[240px]";
  const haloSize = isMd ? "size-[300px] sm:size-[360px]" : "size-[440px] sm:size-[520px]";
  const haloBlur = isMd ? "blur(30px)" : "blur(40px)";
  const orbInnerSize = isMd ? "size-[120px] sm:size-[140px]" : "size-[200px] sm:size-[240px]";
  const specWidth = isMd ? 22 : 36;
  const specHeight = isMd ? 22 : 36;
  const specTop = isMd ? 18 : 26;
  const specLeft = isMd ? 22 : 32;
  return (
    <div
      className={`relative ${orbSize} flex items-center justify-center`}
    >
      {/* Ambient halo — pulses with personality intensity */}
      <motion.div
        key={`${personality.id}-halo`}
        className={`absolute ${haloSize} rounded-full pointer-events-none`}
        style={{
          background: `radial-gradient(circle, ${personality.glow} 0%, ${personality.glow.replace(/[\d.]+\)$/, "0.10)")} 35%, transparent 65%)`,
          filter: haloBlur,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [m.intensity * 0.6, m.intensity, m.intensity * 0.6],
          scale: [0.95, 1.05, 0.95],
        }}
        exit={{ opacity: 0 }}
        transition={{
          duration: m.duration * 1.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Concentric pulse rings — count + ease + delay vary per personality */}
      {Array.from({ length: m.rings }).map((_, i) => (
        <motion.span
          key={`${personality.id}-ring-${i}`}
          className={`absolute ${ringSize} rounded-full pointer-events-none`}
          style={{ border: `1px solid ${personality.ring}` }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{
            scale: [0.95, 1.85, 0.95],
            opacity: [0.55, 0, 0.55],
          }}
          transition={{
            duration: m.duration,
            repeat: Infinity,
            delay: i * m.delay,
            ease: m.ease as [number, number, number, number],
          }}
        />
      ))}

      {/* Soft float on the orb itself */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${personality.id}-orb`}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`relative ${orbInnerSize} rounded-full`}
            style={{
              background: personality.gradient,
              boxShadow: `0 0 100px 12px ${personality.glow}, 0 0 180px 40px ${personality.glow.replace(/[\d.]+\)$/, "0.15)")}, inset 0 -36px 64px rgba(0,0,0,0.45)`,
            }}
          >
            {/* Inner hairline */}
            <span
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
            />
            {/* Top-left specular highlight */}
            <span
              className="absolute rounded-full bg-white pointer-events-none"
              style={{
                width: specWidth,
                height: specHeight,
                top: specTop,
                left: specLeft,
                filter: "blur(4px)",
                opacity: 0.78,
              }}
            />
            {/* Secondary smaller specular */}
            <span
              className="absolute rounded-full bg-white pointer-events-none"
              style={{
                width: isMd ? 8 : 14,
                height: isMd ? 8 : 14,
                top: isMd ? 24 : 38,
                left: isMd ? 32 : 50,
                filter: "blur(1.5px)",
                opacity: 0.92,
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* The mini selector chip — small orb + name. Used in the picker row below the hero. */
export function PersonalityChip({
  personality,
  selected,
  onSelect,
}: {
  personality: Personality;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className="group relative flex flex-col items-center gap-2.5 px-3 py-3 sm:px-4 sm:py-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 transition-colors"
      style={{
        background: selected ? "rgba(255,255,255,0.04)" : "transparent",
        border: `1px solid ${
          selected ? personality.ring : "transparent"
        }`,
      }}
      aria-pressed={selected}
      aria-label={`Select ${personality.name}`}
    >
      <div className="relative size-12 sm:size-14 flex items-center justify-center">
        {/* Mini ring pulse when selected */}
        {selected && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid ${personality.ring}` }}
            animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
            transition={{
              duration: personality.motion.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        <div
          className="relative size-10 sm:size-12 rounded-full transition-all duration-300"
          style={{
            background: personality.gradient,
            boxShadow: selected
              ? `0 0 32px 6px ${personality.glow}, inset 0 -6px 12px rgba(0,0,0,0.4)`
              : `0 4px 12px -2px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(0,0,0,0.3)`,
            opacity: selected ? 1 : 0.78,
          }}
        >
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
          />
          <span
            className="absolute rounded-full bg-white pointer-events-none"
            style={{
              width: 6,
              height: 6,
              top: 7,
              left: 9,
              filter: "blur(1px)",
              opacity: 0.85,
            }}
          />
        </div>
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
