"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

// Deterministic pseudo-random so SSR + client agree
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

type Star = {
  x: number; // %
  y: number; // %
  size: number; // px
  opacity: number;
  twinkle: boolean;
  delay: number;
  duration: number;
};

const STAR_COUNT = 140;

export function StarField() {
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
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
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
              boxShadow: s.size > 1.5 ? "0 0 4px rgba(255,255,255,0.6)" : undefined,
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
              boxShadow: s.size > 1.5 ? "0 0 4px rgba(255,255,255,0.5)" : undefined,
            }}
          />
        ),
      )}
    </div>
  );
}
