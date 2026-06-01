"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import type { Personality, PersonalityId } from "@/lib/personalities";

// Atmospheric orbs, not flat icons. Each personality is rendered as a
// dimensional living sphere — multi-stop radial gradient, internal
// highlight, halo glow, and motion signature that matches the agent's
// character. The orb is the agent's presence.

export type OrbSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<OrbSize, number> = {
  xs: 44,
  sm: 72,
  md: 130,
  lg: 220,
  xl: 300,
};

const HALO_RATIO = 2.3;

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Router — picks the right orb per personality.
export function PersonalityIcon({
  personality,
  size = "lg",
}: {
  personality: Personality;
  size?: OrbSize;
}) {
  const px = SIZE_PX[size];
  switch (personality.id) {
    case "maven":
      return <MavenOrb px={px} size={size} />;
    case "sage":
      return <SageOrb px={px} size={size} />;
    case "spark":
      return <SparkOrb px={px} size={size} />;
    case "echo":
      return <EchoOrb px={px} size={size} />;
  }
}

// `personality.id`-keyed convenience so consumers don't need the full obj
export function PersonalityOrbById({
  id,
  size = "lg",
}: {
  id: PersonalityId;
  size?: OrbSize;
}) {
  // We pass a stub Personality because the orbs only use id; but this
  // signature would only be used internally. Skipping for now.
  void id;
  void size;
  return null;
}

/* ============================================================
 * MAVEN — Cobalt-violet sphere. Sharp pulse. Upward sparks.
 * Direct/Formal/Brief — quick rhythmic beat, focused light.
 * ============================================================ */
function MavenOrb({ px, size }: { px: number; size: OrbSize }) {
  const reduced = useReducedMotion();
  const showParticles = size !== "xs" && size !== "sm";
  const particleCount = size === "xl" ? 9 : size === "lg" ? 7 : 5;
  const particles = useMemo(() => {
    const rand = seeded(101);
    return Array.from({ length: particleCount }, (_, i) => ({
      delay: i * 0.18 + rand() * 0.3,
      offsetX: -25 + rand() * 50,
      drift: px * 0.85 + rand() * px * 0.35,
      duration: 1.4 + rand() * 0.6,
    }));
  }, [px, particleCount]);

  return (
    <div
      className="relative inline-block"
      style={{ width: px, height: px }}
      aria-label="Maven"
      role="img"
    >
      {/* Halo — sharp, focused */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px * HALO_RATIO,
          height: px * HALO_RATIO,
          left: (-px * (HALO_RATIO - 1)) / 2,
          top: (-px * (HALO_RATIO - 1)) / 2,
          background:
            "radial-gradient(circle, rgba(167,139,250,0.55) 0%, rgba(109,40,217,0.18) 32%, transparent 62%)",
          filter: `blur(${Math.max(20, px * 0.16)}px)`,
        }}
        animate={
          reduced
            ? { opacity: 0.55 }
            : { opacity: [0.4, 0.72, 0.4], scale: [0.96, 1.05, 0.96] }
        }
        transition={{
          duration: 1.7,
          repeat: Infinity,
          ease: [0.32, 0, 0.32, 1],
        }}
      />

      {/* Sphere — radial gradient with offset highlight light source */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #e7daff 0%, #c4a8ff 12%, #a78bfa 32%, #6d28d9 72%, #2e1065 100%)",
          boxShadow: [
            "inset -8px -16px 32px rgba(46,16,101,0.65)",
            "inset 5px 6px 18px rgba(231,218,255,0.22)",
            `0 0 ${Math.max(20, px * 0.22)}px rgba(167,139,250,0.4)`,
          ].join(", "),
        }}
        animate={reduced ? undefined : { scale: [1, 1.03, 1] }}
        transition={{
          duration: 1.7,
          repeat: Infinity,
          ease: [0.32, 0, 0.32, 1],
        }}
      />

      {/* Highlight — top-left specular */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px * 0.4,
          height: px * 0.3,
          left: px * 0.18,
          top: px * 0.14,
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 40%, transparent 75%)",
          filter: `blur(${Math.max(4, px * 0.04)}px)`,
        }}
      />

      {/* Upward sparks */}
      {showParticles &&
        !reduced &&
        particles.map((p, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 2,
              height: 2,
              left: `calc(50% + ${p.offsetX}px)`,
              top: "60%",
              background: "rgba(216,196,255,1)",
              boxShadow: "0 0 6px rgba(167,139,250,0.9)",
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -p.drift, opacity: [0, 1, 0] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
    </div>
  );
}

/* ============================================================
 * SAGE — Emerald nebula. Slow breath. Drifting motes.
 * Encouraging/Formal/Detailed — patient observer.
 * ============================================================ */
function SageOrb({ px, size }: { px: number; size: OrbSize }) {
  const reduced = useReducedMotion();
  const showParticles = size !== "xs" && size !== "sm";
  const particleCount = size === "xl" ? 22 : size === "lg" ? 16 : 10;
  const particles = useMemo(() => {
    const rand = seeded(202);
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const radius = px * 0.55 + rand() * px * 0.5;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 1 + rand() * 1.4,
        duration: 5 + rand() * 4,
        delay: i * 0.3 + rand() * 1,
        opacity: 0.4 + rand() * 0.4,
      };
    });
  }, [px, particleCount]);

  return (
    <div
      className="relative inline-block"
      style={{ width: px, height: px }}
      aria-label="Sage"
      role="img"
    >
      {/* Halo — soft, wide */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px * HALO_RATIO,
          height: px * HALO_RATIO,
          left: (-px * (HALO_RATIO - 1)) / 2,
          top: (-px * (HALO_RATIO - 1)) / 2,
          background:
            "radial-gradient(circle, rgba(52,211,153,0.45) 0%, rgba(4,120,87,0.18) 35%, transparent 65%)",
          filter: `blur(${Math.max(28, px * 0.22)}px)`,
        }}
        animate={
          reduced
            ? { opacity: 0.5 }
            : { opacity: [0.4, 0.6, 0.4], scale: [0.97, 1.03, 0.97] }
        }
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sphere — soft emerald */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 36% 30%, #c8f7e3 0%, #6ee7b7 14%, #34d399 35%, #047857 75%, #022c22 100%)",
          boxShadow: [
            "inset -8px -16px 32px rgba(2,44,34,0.55)",
            "inset 6px 7px 22px rgba(200,247,227,0.22)",
            `0 0 ${Math.max(22, px * 0.24)}px rgba(52,211,153,0.35)`,
          ].join(", "),
        }}
        animate={reduced ? undefined : { scale: [1, 1.018, 1] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Inner iris — slow chromatic shift, like an attentive eye */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px * 0.32,
          height: px * 0.32,
          left: px * 0.34,
          top: px * 0.34,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(110,231,183,0.5) 40%, transparent 80%)",
          filter: `blur(${Math.max(3, px * 0.025)}px)`,
        }}
        animate={
          reduced
            ? undefined
            : { x: [0, px * 0.04, -px * 0.04, 0], y: [0, -px * 0.02, px * 0.02, 0] }
        }
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Highlight */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px * 0.45,
          height: px * 0.35,
          left: px * 0.16,
          top: px * 0.12,
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 45%, transparent 75%)",
          filter: `blur(${Math.max(5, px * 0.05)}px)`,
        }}
      />

      {/* Drifting motes — many, slow, ambient */}
      {showParticles &&
        !reduced &&
        particles.map((p, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y}px)`,
              background: "rgba(167,243,208,0.85)",
              boxShadow: "0 0 4px rgba(52,211,153,0.6)",
            }}
            animate={{
              opacity: [0, p.opacity, 0],
              x: [0, 6, -3, 0],
              y: [0, -6, 3, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
    </div>
  );
}

/* ============================================================
 * SPARK — Rose corona. Warm flicker. Outward bursts.
 * Encouraging/Casual/Brief — friendly, energetic, flame-like.
 * ============================================================ */
function SparkOrb({ px, size }: { px: number; size: OrbSize }) {
  const reduced = useReducedMotion();
  const showParticles = size !== "xs" && size !== "sm";
  const particleCount = size === "xl" ? 14 : size === "lg" ? 10 : 7;
  const particles = useMemo(() => {
    const rand = seeded(303);
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + rand() * 0.4;
      const distance = px * 0.7 + rand() * px * 0.4;
      return {
        angle,
        distance,
        size: 1.5 + rand() * 1.2,
        delay: i * 0.15 + rand() * 0.3,
        duration: 1.8 + rand() * 0.6,
      };
    });
  }, [px, particleCount]);

  return (
    <div
      className="relative inline-block"
      style={{ width: px, height: px }}
      aria-label="Spark"
      role="img"
    >
      {/* Halo — warm, irregular flicker */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px * HALO_RATIO,
          height: px * HALO_RATIO,
          left: (-px * (HALO_RATIO - 1)) / 2,
          top: (-px * (HALO_RATIO - 1)) / 2,
          background:
            "radial-gradient(circle, rgba(244,114,182,0.55) 0%, rgba(190,24,93,0.2) 35%, transparent 64%)",
          filter: `blur(${Math.max(24, px * 0.2)}px)`,
        }}
        animate={
          reduced
            ? { opacity: 0.65 }
            : { opacity: [0.5, 0.85, 0.55, 0.75, 0.5], scale: [0.97, 1.06, 0.99, 1.04, 0.97] }
        }
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sphere — warm rose with bright core */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 38% 32%, #ffe4f1 0%, #fbcfe8 12%, #f472b6 32%, #be185d 72%, #500724 100%)",
          boxShadow: [
            "inset -8px -16px 32px rgba(80,7,36,0.55)",
            "inset 6px 7px 22px rgba(255,228,241,0.3)",
            `0 0 ${Math.max(22, px * 0.24)}px rgba(244,114,182,0.45)`,
          ].join(", "),
        }}
        animate={
          reduced
            ? undefined
            : { scale: [1, 1.045, 0.985, 1.025, 1] }
        }
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Highlight — bright, sparky */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px * 0.38,
          height: px * 0.3,
          left: px * 0.2,
          top: px * 0.14,
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, rgba(255,228,241,0.25) 40%, transparent 75%)",
          filter: `blur(${Math.max(4, px * 0.04)}px)`,
        }}
      />

      {/* Outward bursts — radial sparks */}
      {showParticles &&
        !reduced &&
        particles.map((p, i) => {
          const x = Math.cos(p.angle) * p.distance;
          const y = Math.sin(p.angle) * p.distance;
          return (
            <motion.span
              key={i}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                left: "50%",
                top: "50%",
                background: "rgba(255,228,241,0.95)",
                boxShadow: "0 0 6px rgba(244,114,182,0.9)",
              }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: [0, x], y: [0, y], opacity: [0, 1, 0] }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          );
        })}
    </div>
  );
}

/* ============================================================
 * ECHO — Cobalt sonar. Steady ripples. Layered resonance.
 * Direct/Casual/Detailed — shows the work as it goes.
 * ============================================================ */
function EchoOrb({ px, size }: { px: number; size: OrbSize }) {
  const reduced = useReducedMotion();
  const showRings = size !== "xs";
  const ringCount = 3;

  return (
    <div
      className="relative inline-block"
      style={{ width: px, height: px }}
      aria-label="Echo"
      role="img"
    >
      {/* Halo — deep cobalt glow */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px * HALO_RATIO,
          height: px * HALO_RATIO,
          left: (-px * (HALO_RATIO - 1)) / 2,
          top: (-px * (HALO_RATIO - 1)) / 2,
          background:
            "radial-gradient(circle, rgba(96,165,250,0.4) 0%, rgba(30,64,175,0.18) 35%, transparent 62%)",
          filter: `blur(${Math.max(28, px * 0.22)}px)`,
        }}
        animate={
          reduced
            ? { opacity: 0.5 }
            : { opacity: [0.4, 0.6, 0.4] }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Concentric sonar rings — the personality's signature */}
      {showRings &&
        !reduced &&
        Array.from({ length: ringCount }).map((_, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              width: px,
              height: px,
              marginLeft: -px / 2,
              marginTop: -px / 2,
              border: "1.5px solid rgba(96,165,250,0.6)",
            }}
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: [1, 1.85], opacity: [0.75, 0] }}
            transition={{
              duration: 3,
              delay: i * 1,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}

      {/* Sphere — deep, steady */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 36% 30%, #dbeafe 0%, #93c5fd 14%, #60a5fa 34%, #1e40af 75%, #0c1f4d 100%)",
          boxShadow: [
            "inset -8px -16px 32px rgba(12,31,77,0.6)",
            "inset 6px 7px 22px rgba(219,234,254,0.22)",
            `0 0 ${Math.max(20, px * 0.2)}px rgba(96,165,250,0.4)`,
          ].join(", "),
        }}
        animate={reduced ? undefined : { scale: [1, 1.025, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Highlight */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px * 0.42,
          height: px * 0.32,
          left: px * 0.18,
          top: px * 0.14,
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, rgba(219,234,254,0.18) 42%, transparent 75%)",
          filter: `blur(${Math.max(5, px * 0.045)}px)`,
        }}
      />

      {/* Center dot — a small brighter core */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: Math.max(3, px * 0.06),
          height: Math.max(3, px * 0.06),
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(219,234,254,0.85)",
          boxShadow: "0 0 8px rgba(96,165,250,0.9)",
        }}
      />
    </div>
  );
}
