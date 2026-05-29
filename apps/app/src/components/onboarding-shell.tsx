"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

export function OnboardingShell({
  step,
  totalSteps,
  stepLabel,
  heading,
  subheading,
  children,
  footer,
}: {
  step: number;
  totalSteps: number;
  stepLabel: string;
  heading: string;
  subheading?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative min-h-screen flex flex-col bg-canvas overflow-hidden">
      {/* Ambient orb */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-[20%] left-1/2 -translate-x-1/2 size-[1100px] rounded-full -z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(167,139,250,0.08) 0%, rgba(56,189,248,0.04) 35%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />

      {/* Top bar */}
      <header className="relative px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="WRKS Studio"
        >
          <span
            className="relative size-2.5 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #6366f1 100%)",
              boxShadow: "0 0 8px rgba(165,180,252,0.4)",
            }}
          />
          <span className="font-serif text-[15px] tracking-tight text-ink">
            WRKS<span className="text-ink-muted"> Studio</span>
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Step pills */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const idx = i + 1;
              const isActive = idx === step;
              const isDone = idx < step;
              return (
                <div
                  key={i}
                  className="h-[3px] rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 28 : 14,
                    background: isDone
                      ? "rgba(255,255,255,0.55)"
                      : isActive
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(255,255,255,0.12)",
                  }}
                />
              );
            })}
          </div>
          <div className="text-[11px] tracking-[0.2em] uppercase text-ink-dim font-mono">
            {step} of {totalSteps}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-8 sm:py-12">
        <div className="w-full max-w-[920px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            className="mb-8 sm:mb-10"
          >
            <div className="text-[11px] tracking-[0.24em] uppercase text-ink-dim font-mono mb-3">
              {stepLabel}
            </div>
            <h1 className="font-serif font-medium tracking-tight text-[clamp(2rem,3vw,2.625rem)] leading-[1.05] text-ink">
              {heading}
            </h1>
            {subheading && (
              <p className="mt-3 max-w-2xl text-[15px] text-ink-muted leading-relaxed">
                {subheading}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </div>

      {/* Sticky footer with continue */}
      {footer && (
        <footer
          className="sticky bottom-0 px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4"
          style={{
            background:
              "linear-gradient(to top, rgba(8,8,10,0.96) 65%, rgba(8,8,10,0))",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
          }}
        >
          {footer}
        </footer>
      )}
    </main>
  );
}
