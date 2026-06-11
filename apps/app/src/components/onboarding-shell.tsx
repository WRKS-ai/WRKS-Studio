"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShinyText } from "./shiny-text";
import { StageBackdrop } from "./stage-backdrop";

// Onboarding is a four-act stage, not a wizard. The shell provides:
//   - A continuous ambient backdrop (matches the marketing hero)
//   - A minimal top bar (logo + skip)
//   - Full-bleed children — no sticky footer, no step pills
// Progress is encoded by the content of each page (the orb grows, the
// language shifts), not by a chrome strip.

export function OnboardingShell({
  tint,
  children,
}: {
  /** Optional personality accent (rgba) to tint the ambient backdrop. */
  tint?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <main className="relative min-h-screen flex flex-col bg-canvas overflow-x-hidden">
      <StageBackdrop tint={tint} />

      {/* Top bar — logo only. No step pills. The journey is the stage. */}
      <motion.header
        initial={reduced ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between"
      >
        <Link
          href="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md -m-1 p-1"
          aria-label="WRKS Studio"
        >
          <span className="font-serif text-[15px] tracking-tight">
            <ShinyText
              text="WRKS Studio"
              color="#857c92"
              shineColor="#f5f0e6"
              speed={3.5}
              spread={120}
              delay={1.2}
            />
          </span>
        </Link>
      </motion.header>

      {/* Stage — full-bleed, lets the page own its own composition */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-10 sm:py-16">
        {children}
      </div>
    </main>
  );
}
