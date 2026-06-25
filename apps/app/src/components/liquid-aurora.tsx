"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

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
  // On mobile (and inside reduced-motion) the blob animations + 5 large
  // backdrop-blurred + mix-blend-mode elements cause major scroll jank
  // on iOS Safari. Disable the animation loops on viewports < 768px —
  // blobs still render statically as ambient color, just no infinite
  // keyframe animation eating frame budget.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const staticMode = reduced || isMobile;

  // Five blobs with hand-tuned positions, sizes, durations, and color
  // stops. Mismatched durations (24/29/35/19/41 seconds) mean the
  // configuration never repeats — the page feels alive.
  const blobs = [
    {
      x: "8%",
      y: "10%",
      size: 720,
      color: `${accent}33`,
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
      size: 620,
      color: `${accentDeep}40`,
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
      size: 800,
      color: `${accent}22`,
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
      size: 700,
      color: `${accent}2a`,
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
      size: 540,
      color: `${accentDeep}33`,
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
      // Mobile dims the aurora to ~45% — each blob is 600-800px wide so on
      // a 375px viewport they otherwise fill the entire screen and read
      // as a heavy purple wash. Desktop has room for the blobs to breathe
      // around content. Threshold at sm: (640px) so tablets get full.
      className="fixed inset-0 pointer-events-none overflow-hidden opacity-45 sm:opacity-100"
      style={{ zIndex: 0, mixBlendMode: "screen" }}
    >
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
            staticMode
              ? { opacity: 0.55 }
              : {
                  x: blob.path.x,
                  y: blob.path.y,
                  scale: blob.path.scale,
                }
          }
          transition={
            staticMode
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
