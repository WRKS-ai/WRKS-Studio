"use client";

import { motion, useReducedMotion } from "motion/react";

// LiquidAurora — slow morphing accent-color clouds that drift across
// the page as a backdrop. Five large radial gradients, each translating
// + scaling on its own long-period loop, blended with mix-blend-mode:
// screen so they mingle into the dark canvas rather than stacking
// opaquely. Keyed to the active personality accent so the atmosphere
// shifts as you move between agents.
//
// Position is fixed inset-0 so it fills the entire viewport behind the
// OnboardingFrame chrome (header, footer chrome), not just the page
// content area — avoids the "black bands top and bottom" artifact.
//
// The blobs sit behind content (z-index 0) and behind the orb's own
// bloom — heavy blur + low opacity means it reads as ambient lighting,
// never competing with the orb's foreground glow.

export function LiquidAurora({
  accent,
  accentDeep,
}: {
  accent: string;
  accentDeep: string;
}) {
  const reduced = useReducedMotion();

  // Five blobs with hand-tuned positions, sizes, durations, and color
  // stops. Mismatched durations (24/29/35/19/41 seconds) mean the
  // configuration never repeats — the page feels alive.
  const blobs = [
    {
      x: "8%",
      y: "10%",
      size: 820,
      color: `${accent}55`,
      duration: 24,
      path: {
        x: [0, 80, -40, 0],
        y: [0, 60, 120, 0],
        scale: [1, 1.1, 0.95, 1],
      },
    },
    {
      x: "70%",
      y: "5%",
      size: 720,
      color: `${accentDeep}5e`,
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
      size: 900,
      color: `${accent}3e`,
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
      size: 800,
      color: `${accent}48`,
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
      size: 640,
      color: `${accentDeep}50`,
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
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0, mixBlendMode: "screen" }}
    >
      {/* Soft always-on ambient wash — lifts the canvas from near-
          black so the dark feels backlit instead of dead. Centered
          high so the eye is drawn into the page. Breathes very
          slowly (12s) for a barely-there premium pulse. */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: "50%",
          top: "30%",
          width: 1400,
          height: 1000,
          marginLeft: -700,
          marginTop: -500,
          background: `radial-gradient(ellipse, ${accent}18 0%, ${accent}08 35%, transparent 70%)`,
          filter: "blur(60px)",
        }}
        animate={
          reduced
            ? { opacity: 0.7 }
            : { opacity: [0.55, 0.85, 0.55], scale: [1, 1.04, 1] }
        }
        transition={
          reduced
            ? { duration: 0.5 }
            : {
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />
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
