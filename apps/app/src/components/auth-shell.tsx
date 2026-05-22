"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandPanel } from "./brand-panel";

export function AuthShell({
  eyebrow,
  heading,
  subheading,
  altCtaText,
  altCtaHref,
  altCtaLabel,
  brandQuote,
  brandAttribution,
  brandLocation,
  footer,
  children,
}: {
  eyebrow: string;
  heading: string;
  subheading?: string;
  altCtaText: string;
  altCtaHref: string;
  altCtaLabel: string;
  brandQuote: string;
  brandAttribution: string;
  brandLocation: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen flex flex-col lg:flex-row bg-canvas">
      {/* LEFT — brand panel (desktop only) */}
      <aside className="hidden lg:block relative lg:w-[55%] xl:w-[52%] border-r border-white/[0.06]">
        <BrandPanel
          quote={brandQuote}
          attribution={brandAttribution}
          location={brandLocation}
        />
      </aside>

      {/* RIGHT — form panel */}
      <section className="relative flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="relative px-6 lg:px-12 xl:px-14 py-5 lg:py-8 flex items-center justify-between shrink-0">
          <Logo />
          <AltLink text={altCtaText} href={altCtaHref} label={altCtaLabel} />
        </header>

        {/* Form — vertically centered in the remaining space, max-height cap */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 xl:px-14 py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            className="w-full max-w-[420px]"
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-1.5 text-[11px] tracking-[0.24em] uppercase text-ink-dim font-sans font-medium mb-4">
              <span className="size-1 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />
              {eyebrow}
            </div>

            {/* Heading */}
            <h1 className="font-serif font-medium tracking-tight text-[clamp(1.875rem,2.6vw,2.25rem)] leading-[1.05] mb-2 text-ink">
              {heading}
            </h1>
            {subheading && (
              <p className="text-[14.5px] text-ink-muted leading-relaxed mb-7">
                {subheading}
              </p>
            )}

            <div className={subheading ? "" : "mt-7"}>{children}</div>

            {footer && (
              <div className="mt-7 text-[11.5px] text-ink-dim font-sans leading-relaxed">
                {footer}
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom legal strip */}
        <footer className="relative px-6 lg:px-12 xl:px-14 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-dim font-mono tracking-[0.04em] border-t border-white/[0.04] shrink-0">
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
      </section>
    </main>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 group"
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
  );
}

function AltLink({
  text,
  href,
  label,
}: {
  text: string;
  href: string;
  label: string;
}) {
  return (
    <div className="text-[12px] text-ink-muted font-sans flex items-center gap-2">
      <span className="hidden sm:inline">{text}</span>
      <Link
        href={href}
        className="text-ink hover:text-white transition-colors underline-offset-4 hover:underline"
      >
        {label}
        <span aria-hidden className="ml-1">
          →
        </span>
      </Link>
    </div>
  );
}
