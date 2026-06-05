"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import type { Personality } from "@/lib/personalities";

// Dark avatars — replacement for the bright PersonalityIcon orbs on the
// onboarding personality page. Each personality has its own sculptural
// form, not a sphere. Body is charcoal / obsidian. The accent appears
// only as INTERIOR LIGHT — a seam, an iris, embers, a caught beam.
//
// Forms:
// • Maven    — vertical monolith with a violet seam down the center
// • Sage     — horizontal lens with an emerald iris at its core
// • Spark    — asymmetric crescent / arc with pink embers
// • Echo     — three concentric metal rings with blue light caught between

export function DarkAvatar({
  personality,
  size = 280,
}: {
  personality: Personality;
  size?: number;
}) {
  switch (personality.id) {
    case "maven":
      return <MavenAvatar size={size} />;
    case "sage":
      return <SageAvatar size={size} />;
    case "spark":
      return <SparkAvatar size={size} />;
    case "echo":
      return <EchoAvatar size={size} />;
  }
}

/* ============================================================
 * Shared atmospheric halo
 * ============================================================ */
function Halo({ size, color, scale = 1.6 }: { size: number; color: string; scale?: number }) {
  return (
    <div
      aria-hidden
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size * scale,
        height: size * scale,
        left: (-size * (scale - 1)) / 2,
        top: (-size * (scale - 1)) / 2,
        background: `radial-gradient(circle, ${color}28 0%, ${color}10 30%, transparent 60%)`,
        filter: `blur(${size * 0.12}px)`,
      }}
    />
  );
}

/* ============================================================
 * Maven — vertical monolith with a violet seam
 * ============================================================ */
function MavenAvatar({ size }: { size: number }) {
  const reduced = useReducedMotion();
  // Sparks drifting up from the top edge
  const sparks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        offset: -10 + i * 4 + Math.sin(i * 1.3) * 3,
        delay: i * 0.35,
        duration: 1.8 + (i % 3) * 0.4,
      })),
    [],
  );

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      aria-label="Maven"
      role="img"
    >
      <Halo size={size} color="#a78bfa" />

      {/* Body — sharp vertical monolith */}
      <motion.div
        className="absolute"
        style={{
          width: size * 0.34,
          height: size * 0.78,
          left: size * 0.33,
          top: size * 0.11,
          borderRadius: 4,
          background:
            "linear-gradient(180deg, #1a181f 0%, #0c0a10 45%, #050405 100%)",
          boxShadow: [
            "0 30px 60px -20px rgba(0,0,0,0.9)",
            "inset 0 1px 0 rgba(255,255,255,0.18)",
            "inset 0 -2px 8px rgba(167,139,250,0.12)",
          ].join(", "),
          overflow: "hidden",
        }}
        animate={reduced ? undefined : { y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Vertical seam light — the soul */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: "12%",
            bottom: "12%",
            width: 2,
            background:
              "linear-gradient(180deg, transparent 0%, #c4b5fd 30%, #a78bfa 50%, #c4b5fd 70%, transparent 100%)",
            boxShadow: "0 0 16px #a78bfa, 0 0 4px #c4b5fd",
          }}
          animate={reduced ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Faint inner side gradient — adds dimensional roundness */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(167,139,250,0.06), transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(270deg, rgba(0,0,0,0.4), transparent)",
          }}
        />
      </motion.div>

      {/* Sparks drifting up */}
      {!reduced &&
        sparks.map((s, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 2,
              height: 2,
              left: `calc(50% + ${s.offset}px)`,
              top: size * 0.1,
              background: "#d8c4ff",
              boxShadow: "0 0 6px #a78bfa",
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -size * 0.4, opacity: [0, 1, 0] }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
    </div>
  );
}

/* ============================================================
 * Sage — horizontal lens with an emerald iris
 * ============================================================ */
function SageAvatar({ size }: { size: number }) {
  const reduced = useReducedMotion();
  // Soft motes drifting around the lens
  const motes = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const angle = (i / 9) * Math.PI * 2;
        const r = size * 0.45 + (i % 3) * 8;
        return {
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r * 0.7,
          duration: 6 + (i % 3) * 2,
          delay: i * 0.4,
        };
      }),
    [size],
  );

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      aria-label="Sage"
      role="img"
    >
      <Halo size={size} color="#34d399" scale={1.7} />

      {/* Body — horizontal lens / almond */}
      <motion.div
        className="absolute"
        style={{
          width: size * 0.88,
          height: size * 0.46,
          left: size * 0.06,
          top: size * 0.27,
          borderRadius: "50% / 50%",
          background:
            "radial-gradient(ellipse at 50% 50%, #2a2a2e 0%, #15151a 55%, #0a0a0d 100%)",
          boxShadow: [
            "0 30px 60px -20px rgba(0,0,0,0.85)",
            "inset 0 1px 0 rgba(255,255,255,0.12)",
            "inset 0 -3px 16px rgba(52,211,153,0.16)",
          ].join(", "),
          overflow: "hidden",
        }}
        animate={reduced ? undefined : { scaleY: [1, 1.02, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Iris — emerald core */}
        <motion.div
          className="absolute"
          style={{
            width: size * 0.18,
            height: size * 0.18,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 40% 40%, #d1fae5 0%, #6ee7b7 25%, #34d399 55%, #047857 90%)",
            boxShadow: [
              "0 0 30px rgba(52,211,153,0.65)",
              "0 0 80px rgba(52,211,153,0.25)",
              "inset 0 -2px 6px rgba(2,44,34,0.5)",
            ].join(", "),
          }}
          animate={reduced ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Iris bloom — soft surrounding emerald */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(52,211,153,0.15) 0%, transparent 45%)",
          }}
        />

        {/* Top-edge highlight */}
        <div
          className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.07), transparent)",
          }}
        />
      </motion.div>

      {/* Motes orbiting */}
      {!reduced &&
        motes.map((m, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 1.5,
              height: 1.5,
              left: `calc(50% + ${m.x}px)`,
              top: `calc(50% + ${m.y}px)`,
              background: "#6ee7b7",
              boxShadow: "0 0 4px #34d399",
            }}
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{
              duration: m.duration,
              delay: m.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
    </div>
  );
}

/* ============================================================
 * Spark — asymmetric crescent with embers
 * ============================================================ */
function SparkAvatar({ size }: { size: number }) {
  const reduced = useReducedMotion();
  // Embers shooting up along the inner arc
  const embers = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        angle: -100 + i * 14, // along the inner curve
        delay: i * 0.22,
        duration: 1.6 + (i % 4) * 0.3,
        size: 1.5 + (i % 3) * 0.6,
      })),
    [],
  );

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      aria-label="Spark"
      role="img"
    >
      <Halo size={size} color="#f472b6" scale={1.7} />

      {/* Crescent — built from a solid disc minus an offset disc */}
      <svg
        className="absolute inset-0"
        viewBox="0 0 280 280"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <defs>
          <radialGradient id="sparkBody" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#26181f" />
            <stop offset="55%" stopColor="#120a10" />
            <stop offset="100%" stopColor="#050306" />
          </radialGradient>
          <radialGradient id="sparkInnerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#be185d" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#be185d" stopOpacity="0" />
          </radialGradient>
          <mask id="crescentMask">
            <rect width="280" height="280" fill="black" />
            <circle cx="140" cy="140" r="100" fill="white" />
            <circle cx="180" cy="120" r="92" fill="black" />
          </mask>
        </defs>

        {/* Body */}
        <g mask="url(#crescentMask)">
          <circle cx="140" cy="140" r="100" fill="url(#sparkBody)" />
          <circle cx="140" cy="140" r="100" fill="url(#sparkInnerGlow)" />
          {/* Top edge highlight */}
          <path
            d="M70 80 A100 100 0 0 1 160 50"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.5"
            fill="none"
          />
        </g>

        {/* Inner curve ember edge — thin glowing line where the moon's "inside" sits */}
        <motion.path
          d="M180 120 A92 92 0 0 0 178 192"
          stroke="#f9a8d4"
          strokeWidth="1.5"
          fill="none"
          opacity={0.85}
          filter="blur(0.4px)"
          animate={reduced ? undefined : { opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* Embers along the inner arc */}
      {!reduced &&
        embers.map((e, i) => {
          const rad = (e.angle * Math.PI) / 180;
          const cx = size * 0.5 + Math.cos(rad) * size * 0.18;
          const cy = size * 0.5 + Math.sin(rad) * size * 0.18;
          return (
            <motion.span
              key={i}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                width: e.size,
                height: e.size,
                left: cx,
                top: cy,
                background: "#fce7f3",
                boxShadow: "0 0 6px #f472b6",
              }}
              initial={{ opacity: 0, scale: 1 }}
              animate={{
                opacity: [0, 1, 0],
                x: 16 + i * 2,
                y: -28 - (i % 3) * 4,
                scale: [1, 0.6],
              }}
              transition={{
                duration: e.duration,
                delay: e.delay,
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
 * Echo — three concentric metal rings with light between
 * ============================================================ */
function EchoAvatar({ size }: { size: number }) {
  const reduced = useReducedMotion();
  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      aria-label="Echo"
      role="img"
    >
      <Halo size={size} color="#60a5fa" scale={1.65} />

      <svg
        className="absolute inset-0"
        viewBox="0 0 280 280"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <defs>
          <radialGradient id="echoBlueGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#60a5fa" stopOpacity="0.7" />
            <stop offset="80%" stopColor="#1e40af" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="echoRingMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2a2c33" />
            <stop offset="50%" stopColor="#0d0e12" />
            <stop offset="100%" stopColor="#1a1c22" />
          </linearGradient>
        </defs>

        {/* Outermost ring */}
        <motion.circle
          cx="140"
          cy="140"
          r="120"
          fill="none"
          stroke="url(#echoRingMetal)"
          strokeWidth="3"
          opacity="0.85"
          animate={reduced ? undefined : { rotate: 360 }}
          style={{ transformOrigin: "140px 140px" }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        />
        <motion.circle
          cx="140"
          cy="140"
          r="120"
          fill="none"
          stroke="rgba(96,165,250,0.4)"
          strokeWidth="0.5"
          animate={reduced ? undefined : { opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Middle ring */}
        <motion.circle
          cx="140"
          cy="140"
          r="88"
          fill="none"
          stroke="url(#echoRingMetal)"
          strokeWidth="4"
          opacity="0.9"
          animate={reduced ? undefined : { rotate: -360 }}
          style={{ transformOrigin: "140px 140px" }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        />
        <motion.circle
          cx="140"
          cy="140"
          r="88"
          fill="none"
          stroke="rgba(96,165,250,0.6)"
          strokeWidth="0.5"
          animate={reduced ? undefined : { opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />

        {/* Inner ring */}
        <motion.circle
          cx="140"
          cy="140"
          r="58"
          fill="none"
          stroke="url(#echoRingMetal)"
          strokeWidth="3.5"
          opacity="0.95"
          animate={reduced ? undefined : { rotate: 360 }}
          style={{ transformOrigin: "140px 140px" }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner blue light core */}
        <circle cx="140" cy="140" r="48" fill="url(#echoBlueGlow)" />
        <motion.circle
          cx="140"
          cy="140"
          r="36"
          fill="rgba(191,219,254,0.4)"
          animate={reduced ? undefined : { r: [34, 40, 34], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Top highlights on each ring */}
        <path
          d="M140 20 A120 120 0 0 1 230 70"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M140 52 A88 88 0 0 1 200 90"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M140 82 A58 58 0 0 1 182 110"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </div>
  );
}
