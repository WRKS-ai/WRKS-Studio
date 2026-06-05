"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

// Onboarding chrome — the quietest possible version.
//
// Visual language pulled from late-2025/early-2026 references (Linear,
// Notion Calendar, Raycast, Apple Intelligence):
// • Canvas is #0a0a0c — near-black with the slightest warm cast. Pure
//   #000 reads as 2018; pure cream reads as marketing site.
// • A 1px hairline progress bar at the very top, filling left-to-right
//   as the user advances. No dashes, no dots, no rail of pills.
// • A single mono "01 / 04" in the top-left corner. No step name.
// • Brand mark top-right. No skip link.
// • Edge bloom in the top-right corner pulls in the active personality
//   accent (Apple Intelligence's color-bleed) — 1.6s breath cycle.
// • No grain, no noise. The atmosphere is the bloom alone.

export type OnboardingFrameProps = {
  step: number;
  totalSteps: number;
  /** Hex used by the breathing edge bloom. Personality accent or null. */
  bloomTint?: string;
  children: ReactNode;
};

export function OnboardingFrame({
  step,
  totalSteps,
  bloomTint,
  children,
}: OnboardingFrameProps) {
  const reduced = useReducedMotion();
  const progressPct = Math.min(100, (step / totalSteps) * 100);

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: "#0a0a0c",
        color: "#f5f0e6",
      }}
    >
      {/* 1px hairline progress bar at the very top */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px z-30"
        style={{ background: "rgba(245,240,230,0.06)" }}
      >
        <motion.div
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          className="h-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(245,240,230,0.85), rgba(245,240,230,0.55))",
          }}
        />
      </div>

      {/* Edge bloom — atmospheric light in the top-right corner.
          Breathing animation matches Apple Intelligence's Siri cadence. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 w-[70vw] h-[70vh]"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${
            bloomTint ?? "#ffffff"
          }22, ${bloomTint ?? "#ffffff"}05 35%, transparent 65%)`,
          filter: "blur(20px)",
        }}
        animate={reduced ? undefined : { opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary diffuse glow — lower-left, very quiet */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 w-[60vw] h-[55vh]"
        style={{
          background:
            "radial-gradient(circle at 25% 80%, rgba(255,225,170,0.04), transparent 55%)",
          filter: "blur(40px)",
        }}
      />

      {/* Top chrome — mono step number left, brand right */}
      <header className="relative z-20 px-10 sm:px-14 pt-9 flex items-center justify-between">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex items-baseline gap-1.5 tabular-nums leading-none"
        >
          <span
            className="text-[12px] tracking-[0.18em]"
            style={{
              color: "rgba(245,240,230,0.85)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {String(step).padStart(2, "0")}
          </span>
          <span
            className="text-[12px] tracking-[0.18em]"
            style={{
              color: "rgba(245,240,230,0.28)",
              fontFamily: "var(--font-mono)",
            }}
          >
            /
          </span>
          <span
            className="text-[12px] tracking-[0.18em]"
            style={{
              color: "rgba(245,240,230,0.4)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {String(totalSteps).padStart(2, "0")}
          </span>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.05,
            ease: [0.2, 0.7, 0.2, 1],
          }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 group"
            aria-label="WRKS Studio home"
          >
            <span
              className="size-1.5 rounded-full transition-transform group-hover:scale-110"
              style={{
                background:
                  "linear-gradient(135deg, #ffffff 0%, #d9c79c 60%, #927b3f 100%)",
                boxShadow: "0 0 8px rgba(217,199,156,0.5)",
              }}
            />
            <span
              className="text-[12px] tracking-[0.18em]"
              style={{
                color: "rgba(245,240,230,0.6)",
                fontFamily: "var(--font-mono)",
              }}
            >
              WRKS · STUDIO
            </span>
          </Link>
        </motion.div>
      </header>

      {/* Children fill the rest */}
      <section className="relative z-10">{children}</section>
    </main>
  );
}
