"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShinyText } from "./shiny-text";

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
        // Transparent so the shared LiquidAurora (rendered by the
        // onboarding agent provider) bleeds through. Body bg
        // (--canvas, #08080a) provides the dark canvas underneath.
        background: "transparent",
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

      {/* Single static warm light source from the top-right — like an
          oil lamp resting just out of frame. No pulse. No accent rainbow.
          The bloomTint subtly warms when a personality is active but the
          intensity is so low it never reads as "AI energy." */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 w-[55vw] h-[55vh]"
        style={{
          background: `radial-gradient(circle at 85% 15%, ${
            bloomTint ? `${bloomTint}10` : "rgba(255,236,200,0.07)"
          }, transparent 60%)`,
          filter: "blur(36px)",
        }}
      />

      {/* Secondary diffuse glow — lower-left, very quiet */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 w-[55vw] h-[45vh]"
        style={{
          background:
            "radial-gradient(circle at 25% 85%, rgba(255,225,170,0.025), transparent 55%)",
          filter: "blur(48px)",
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
            className="inline-flex items-center group"
            aria-label="WRKS Studio home"
          >
            <span
              className="leading-none transition-transform group-hover:scale-[1.02]"
              style={{
                fontSize: 19,
                lineHeight: 1,
              }}
            >
              <ShinyText
                text="WRKS Studio"
                speed={7}
                delay={0.5}
                yoyo
                color="#857c92"
                shineColor="#f5f0e6"
                spread={100}
                direction="left"
                className="font-serif font-medium tracking-[-0.025em]"
              />
            </span>
          </Link>
        </motion.div>
      </header>

      {/* Children fill the rest */}
      <section className="relative z-10">{children}</section>
    </main>
  );
}
