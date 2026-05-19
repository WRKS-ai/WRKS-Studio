"use client";

import { motion } from "motion/react";

export type HeroKind = "website" | "social" | "ad" | "copy" | "blog";

export function HeroPreview({ kind }: { kind: HeroKind }) {
  switch (kind) {
    case "website":
      return <WebsiteHero />;
    case "social":
      return <SocialHero />;
    case "ad":
      return <AdHero />;
    case "copy":
      return <CopyHero />;
    case "blog":
      return <BlogHero />;
  }
}

/* 1. WebsiteHero --------------------------------------------------------- */

function WebsiteHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 via-canvas to-canvas overflow-hidden">
      {/* Browser chrome */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="size-2 rounded-full bg-red-400/70" />
          <span className="size-2 rounded-full bg-amber-400/70" />
          <span className="size-2 rounded-full bg-emerald-400/70" />
          <span className="ml-2 flex-1 h-5 rounded-full bg-canvas border border-line flex items-center px-3 gap-1.5">
            <span className="size-1 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-mono text-ink-muted">
              hannahshair.com
            </span>
          </span>
        </div>
      </div>
      {/* Site preview — looks like a real homepage */}
      <div className="mx-4 rounded-xl overflow-hidden border border-line-bright bg-canvas">
        {/* Nav */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-line">
          <span className="h-1.5 w-12 rounded-full bg-ink/70" />
          <div className="flex gap-2">
            <span className="h-1 w-4 rounded-full bg-ink-muted/40" />
            <span className="h-1 w-4 rounded-full bg-ink-muted/40" />
            <span className="h-1 w-4 rounded-full bg-ink-muted/40" />
          </div>
        </div>
        {/* Hero */}
        <div
          className="relative aspect-[16/10]"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(56,189,248,0.18), transparent 60%), linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0a0a12 100%)",
          }}
        >
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            <div className="text-[7px] tracking-[0.22em] uppercase text-sky-300/80 font-sans mb-1">
              Hannah&apos;s Hair Studio
            </div>
            <div className="font-serif text-base leading-tight tracking-tight text-white mb-1">
              Modern cuts.
            </div>
            <div className="font-serif italic text-sm text-white/70 mb-2">
              Honest pricing.
            </div>
            <div className="flex gap-1.5">
              <span className="h-4 px-2 rounded-full bg-white text-[7px] font-sans font-medium text-canvas flex items-center">
                Book now
              </span>
              <span className="h-4 px-2 rounded-full border border-white/40 text-[7px] font-sans text-white/80 flex items-center">
                See styles
              </span>
            </div>
          </div>
        </div>
        {/* Below-fold sections */}
        <div className="p-3 space-y-2.5">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="size-1 rounded-full bg-sky-400" />
              <span className="text-[8px] font-mono text-ink-muted">
                What we do
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-md border border-line bg-panel/60 p-1.5"
                >
                  <div className="h-3 rounded bg-gradient-to-br from-sky-400/20 to-violet-400/20 mb-1" />
                  <div className="h-0.5 w-3/4 rounded-full bg-ink-muted/40" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="size-1 rounded-full bg-sky-400" />
              <span className="text-[8px] font-mono text-ink-muted">
                Book your slot
              </span>
            </div>
            <div className="rounded-md border border-line bg-panel/60 p-2 space-y-1">
              <div className="h-1.5 w-full rounded-sm bg-canvas border border-line" />
              <div className="h-1.5 w-full rounded-sm bg-canvas border border-line" />
              <div className="h-4 w-full rounded-sm bg-ink mt-1" />
            </div>
          </div>
        </div>
      </div>
      {/* Floating deploy badge */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/40 backdrop-blur-md"
      >
        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[8px] tracking-[0.18em] uppercase text-emerald-300 font-sans font-medium">
          Deployed
        </span>
      </motion.div>
    </div>
  );
}

/* 2. SocialHero ---------------------------------------------------------- */

function SocialHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-rose-900/20 via-canvas to-canvas overflow-hidden">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.18em] uppercase text-ink-muted font-sans">
              Scheduled · Fri 9:00
            </span>
          </div>
          <span className="text-[8px] font-mono text-ink-dim">3 of 12</span>
        </div>
      </div>
      {/* Single big Instagram post */}
      <div className="mx-4 rounded-xl overflow-hidden border border-line-bright bg-canvas shadow-xl shadow-black/40">
        <div className="px-2.5 py-2 flex items-center gap-2 border-b border-line">
          <div className="size-5 rounded-full bg-gradient-to-br from-rose-400 via-fuchsia-500 to-amber-400 p-[1px]">
            <div className="size-full rounded-full bg-canvas flex items-center justify-center text-[7px] font-sans font-semibold">
              h
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-sans font-semibold leading-none">
              hannahshair
            </div>
            <div className="text-[7px] font-sans text-ink-muted leading-none mt-0.5">
              Sponsored · Friday 9:00
            </div>
          </div>
          <span className="text-ink-muted text-[10px]">···</span>
        </div>
        <div
          className="aspect-square relative"
          style={{
            background:
              "radial-gradient(ellipse at 30% 30%, rgba(255,200,150,0.25), transparent 60%), linear-gradient(135deg, #f472b6 0%, #d946ef 45%, #f59e0b 100%)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 70% 70%, rgba(0,0,0,0.4), transparent 60%)",
            }}
          />
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-canvas/60 backdrop-blur-sm text-[7px] tracking-[0.18em] uppercase text-white font-sans font-medium">
            March · 20% off
          </div>
          <div className="absolute bottom-3 left-3 font-serif italic text-white text-sm leading-tight">
            New looks
            <br />
            <span className="not-italic">this season.</span>
          </div>
        </div>
        <div className="px-2.5 py-2 flex items-center gap-2.5">
          {/* Heart, comment, share icons */}
          {["heart", "comment", "share"].map((k) => (
            <svg
              key={k}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-ink"
            >
              {k === "heart" && (
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              )}
              {k === "comment" && (
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              )}
              {k === "share" && <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />}
            </svg>
          ))}
          <span className="ml-auto text-[9px] font-sans text-ink-muted">
            1,284 likes
          </span>
        </div>
      </div>
    </div>
  );
}

/* 3. AdHero -------------------------------------------------------------- */

function AdHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-canvas to-canvas overflow-hidden">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.18em] uppercase text-ink-muted font-sans">
              Winning variant
            </span>
          </div>
          <span className="text-[8px] font-mono text-emerald-300">
            7.8% CTR
          </span>
        </div>
      </div>
      <div className="mx-4 rounded-xl overflow-hidden border border-line-bright bg-canvas shadow-xl shadow-black/40">
        {/* Facebook-style sponsored header */}
        <div className="px-2.5 py-1.5 flex items-center gap-1.5 border-b border-line">
          <div className="size-4 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[8px] font-bold">
            f
          </div>
          <span className="text-[8px] font-sans text-ink-muted">
            Sponsored
          </span>
        </div>
        {/* Big ad creative */}
        <div
          className="aspect-[4/5] relative"
          style={{
            background:
              "radial-gradient(ellipse at 30% 30%, rgba(251,191,36,0.2), transparent 55%), linear-gradient(135deg, #78350f 0%, #422006 50%, #0a0a0a 100%)",
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="font-serif text-white text-2xl leading-none italic mb-1.5 drop-shadow-lg">
              Hair that
            </div>
            <div className="font-serif text-white text-2xl leading-none font-semibold mb-3 drop-shadow-lg">
              remembers you.
            </div>
            <div className="text-[8px] tracking-[0.22em] uppercase text-amber-200/90 font-sans drop-shadow">
              Book this week · 20% off
            </div>
          </div>
        </div>
        {/* Link card */}
        <div className="px-2.5 py-2 bg-panel/70">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[8px] tracking-widest uppercase text-ink-muted font-sans">
                hannahshair.com
              </div>
              <div className="text-[10px] font-sans font-semibold text-ink mt-0.5 leading-tight truncate">
                Book your March cut today
              </div>
            </div>
            <span className="h-5 px-2.5 rounded-full bg-ink text-canvas text-[8px] font-sans font-semibold flex items-center shrink-0">
              Book
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 4. CopyHero ------------------------------------------------------------ */

function CopyHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-canvas to-canvas overflow-hidden">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.18em] uppercase text-ink-muted font-sans">
              Hero copy · winner
            </span>
          </div>
          <span className="text-[8px] font-mono text-ink-dim">
            3 of 7 live
          </span>
        </div>
      </div>
      <div className="mx-4 space-y-2">
        {/* Variant A - winning */}
        <div className="rounded-xl border border-violet-400/40 bg-violet-400/[0.04] ring-1 ring-violet-400/15 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="size-5 rounded-md bg-violet-400 text-violet-950 flex items-center justify-center text-[9px] font-mono font-semibold">
                A
              </span>
              <span className="text-[8px] tracking-[0.18em] uppercase text-violet-300 font-sans font-medium">
                Winner
              </span>
            </div>
            <span className="text-[9px] font-mono font-semibold text-violet-300">
              12.4% CVR
            </span>
          </div>
          <div className="font-serif text-base leading-tight tracking-tight text-ink mb-1.5">
            The salon
            <br />
            <span className="italic text-ink-muted">that knows you</span>
          </div>
          <div className="text-[9px] font-sans text-ink-muted leading-snug">
            We remember your style, your time slots, and the exact shade.
          </div>
        </div>
        {/* Variant B */}
        <div className="rounded-xl border border-line bg-canvas/40 p-3 opacity-70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="size-5 rounded-md border border-line text-ink-muted flex items-center justify-center text-[9px] font-mono">
              B
            </span>
            <span className="text-[9px] font-mono text-ink-muted">
              7.1% CVR
            </span>
          </div>
          <div className="font-serif text-sm leading-tight tracking-tight text-ink-muted">
            Premium cuts{" "}
            <span className="italic">on your schedule</span>
          </div>
        </div>
        {/* Variant C */}
        <div className="rounded-xl border border-line bg-canvas/40 p-3 opacity-60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="size-5 rounded-md border border-line text-ink-muted flex items-center justify-center text-[9px] font-mono">
              C
            </span>
            <span className="text-[9px] font-mono text-ink-muted">
              5.8% CVR
            </span>
          </div>
          <div className="font-serif text-sm leading-tight tracking-tight text-ink-muted">
            Modern hair. <span className="italic">Honest pricing.</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-20 left-4 right-4 flex items-center justify-between text-[8px] tracking-[0.18em] uppercase text-ink-dim font-sans">
        <span>2,847 sessions</span>
        <span>·</span>
        <span className="text-violet-300 font-medium">99% confidence</span>
      </div>
    </div>
  );
}

/* 5. BlogHero ------------------------------------------------------------ */

function BlogHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-canvas to-canvas overflow-hidden">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.18em] uppercase text-ink-muted font-sans">
              Blog draft · auto-saved
            </span>
          </div>
          <span className="text-[8px] font-mono text-emerald-300">SEO 94</span>
        </div>
      </div>
      <div className="mx-4 rounded-xl overflow-hidden border border-line-bright bg-canvas shadow-xl shadow-black/40">
        {/* Article hero band */}
        <div
          className="h-12 relative"
          style={{
            background:
              "radial-gradient(ellipse at 30% 30%, rgba(16,185,129,0.18), transparent 60%), linear-gradient(135deg, #064e3b 0%, #022c22 50%, #0a0a0a 100%)",
          }}
        >
          <div className="absolute inset-0 flex items-center px-3 gap-1.5">
            <span className="text-[7px] tracking-[0.22em] uppercase text-emerald-200/90 font-sans">
              Hair care · 4 min read
            </span>
          </div>
        </div>
        {/* Article body */}
        <div className="p-3.5">
          <div className="font-serif text-[15px] leading-tight tracking-tight text-ink mb-2.5">
            How often should you trim layered hair?
          </div>
          <div className="text-[9px] font-mono text-ink-muted mb-3 flex items-center gap-2">
            <span>Mar 12, 2026</span>
            <span>·</span>
            <span>1,247 words</span>
          </div>
          {/* Body lines */}
          <div className="space-y-1.5 mb-3">
            <div className="h-1 w-full rounded-full bg-ink-muted/30" />
            <div className="h-1 w-[94%] rounded-full bg-ink-muted/30" />
            <div className="h-1 w-[88%] rounded-full bg-ink-muted/30" />
          </div>
          <div className="font-serif text-[11px] text-ink-muted mb-1.5 italic">
            The right interval for your texture
          </div>
          <div className="space-y-1.5 mb-3">
            <div className="h-1 w-full rounded-full bg-ink-muted/30" />
            <div className="h-1 w-[76%] rounded-full bg-ink-muted/30" />
          </div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {["hair-care", "layered", "salon-tips"].map((t) => (
              <span
                key={t}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-line text-ink-muted"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
