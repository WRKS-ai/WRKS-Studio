"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  heading,
  subheading,
  altCtaText,
  altCtaHref,
  altCtaLabel,
  trustLine,
  footer,
  children,
}: {
  heading: string;
  subheading?: string;
  altCtaText: string;
  altCtaHref: string;
  altCtaLabel: string;
  trustLine?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen flex flex-col bg-canvas overflow-hidden">
      {/* Ambient — single soft orb, off-center, far in the background */}
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

        <div className="text-[12px] text-ink-muted font-sans flex items-center gap-2">
          <span className="hidden sm:inline">{altCtaText}</span>
          <Link
            href={altCtaHref}
            className="text-ink hover:text-white transition-colors"
          >
            {altCtaLabel}
          </Link>
        </div>
      </header>

      {/* Centered card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="font-serif font-medium tracking-tight text-[clamp(1.75rem,2.4vw,2.125rem)] leading-[1.1] text-ink mb-2.5">
              {heading}
            </h1>
            {subheading && (
              <p className="text-[14px] text-ink-muted leading-relaxed">
                {subheading}
              </p>
            )}
          </div>

          {/* Form content */}
          {children}

          {/* Footer (TOS notice etc.) */}
          {footer && (
            <div className="mt-6 text-center text-[11.5px] text-ink-dim font-sans leading-relaxed">
              {footer}
            </div>
          )}
        </motion.div>

        {/* Trust line — subtle, single quote/stat under the card */}
        {trustLine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 flex items-center gap-2 text-[11.5px] text-ink-dim font-sans"
          >
            <span className="size-1 rounded-full bg-emerald-400/70 animate-pulse" />
            {trustLine}
          </motion.div>
        )}
      </div>

      {/* Bottom legal */}
      <footer className="relative px-6 sm:px-8 py-5 flex items-center justify-between text-[11px] text-ink-dim font-mono tracking-[0.04em]">
        <span>© 2026 SlightWrks</span>
        <div className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="hover:text-ink-muted transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-ink-muted transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/security"
            className="hover:text-ink-muted transition-colors"
          >
            Security
          </Link>
        </div>
      </footer>
    </main>
  );
}
