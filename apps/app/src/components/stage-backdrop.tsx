"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

// Ambient backdrop that matches the marketing hero's language: drifting
// soft blobs, a dot grid, and a starfield. Used across every onboarding
// page so the energy doesn't drop the moment the user signs in.

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

type Star = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkle: boolean;
  delay: number;
  duration: number;
};

const STAR_COUNT = 110;

function StarField() {
  const stars = useMemo<Star[]>(() => {
    const rand = seeded(42);
    return Array.from({ length: STAR_COUNT }, () => {
      const r = rand();
      const size = r < 0.6 ? 1 : r < 0.92 ? 1.5 : 2.5;
      return {
        x: rand() * 100,
        y: rand() * 100,
        size,
        opacity: 0.18 + rand() * 0.55,
        twinkle: rand() > 0.55,
        delay: rand() * 6,
        duration: 2.5 + rand() * 3,
      };
    });
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
      style={{
        maskImage:
          "radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.95), rgba(0,0,0,0.25) 60%, transparent 85%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.95), rgba(0,0,0,0.25) 60%, transparent 85%)",
      }}
    >
      {stars.map((s, i) =>
        s.twinkle ? (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              boxShadow:
                s.size > 1.5 ? "0 0 4px rgba(255,255,255,0.6)" : undefined,
            }}
            animate={{ opacity: [s.opacity * 0.35, s.opacity, s.opacity * 0.35] }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ) : (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              boxShadow:
                s.size > 1.5 ? "0 0 4px rgba(255,255,255,0.5)" : undefined,
            }}
          />
        ),
      )}
    </div>
  );
}

function MeshGradient({ tint }: { tint?: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 820,
          height: 820,
          left: "8%",
          top: "-15%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.08), transparent 60%)",
          filter: "blur(90px)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, 20, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 620,
          height: 620,
          right: "-8%",
          top: "18%",
          background: `radial-gradient(circle, ${tint ?? "rgba(180,200,255,0.07)"}, transparent 60%)`,
          filter: "blur(100px)",
        }}
        animate={{ x: [0, -30, 20, 0], y: [0, 30, -10, 0] }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 540,
          height: 540,
          left: "28%",
          top: "55%",
          background:
            "radial-gradient(circle, rgba(255,210,180,0.04), transparent 60%)",
          filter: "blur(110px)",
        }}
        animate={{ x: [0, 50, -40, 0], y: [0, -30, 20, 0] }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.65), transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.65), transparent 75%)",
        }}
      />
    </div>
  );
}

// `tint` lets each step paint its halo in the personality's accent color
// without redrawing the whole field — so as the user progresses, the
// ambient warms or cools to match who they're talking to.
export function StageBackdrop({ tint }: { tint?: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <StarField />
      <MeshGradient tint={tint} />
    </div>
  );
}
