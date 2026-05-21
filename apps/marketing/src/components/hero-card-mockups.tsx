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

const WEBSITE_PHOTO =
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=85&auto=format&fit=crop";

function WebsiteHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky-950/30 via-canvas to-canvas overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.2em] uppercase text-ink-muted font-sans">
              Website · Live
            </span>
          </div>
          <span className="text-[8px] font-mono text-emerald-300/90 tracking-wider">
            hannahshair.com
          </span>
        </div>
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d12] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
        {/* Browser chrome */}
        <div className="px-3 py-2.5 flex items-center gap-1.5 border-b border-white/[0.06]">
          <span className="size-2 rounded-full bg-rose-400/70" />
          <span className="size-2 rounded-full bg-amber-400/70" />
          <span className="size-2 rounded-full bg-emerald-400/70" />
          <div className="ml-2 flex-1 h-5 rounded-md bg-white/[0.04] border border-white/[0.05] flex items-center gap-1.5 px-2">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgb(52 211 153)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[9px] font-mono text-white/65">hannahshair.com</span>
          </div>
        </div>

        {/* Site hero with real photo */}
        <div className="relative aspect-[5/4] overflow-hidden">
          <img
            src={WEBSITE_PHOTO}
            alt="Salon interior"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.85) 100%)",
            }}
          />

          {/* Top nav over photo */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
            <span className="font-serif text-white text-[12px] tracking-tight">
              Hannah&apos;s
            </span>
            <div className="flex gap-3 text-[8px] font-sans text-white/80 uppercase tracking-[0.18em]">
              <span>Services</span>
              <span>Book</span>
              <span>Contact</span>
            </div>
          </div>

          {/* Hero copy at bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-[8px] tracking-[0.22em] uppercase text-sky-200/85 font-sans mb-2">
              Toronto · since 2018
            </div>
            <div className="font-serif text-white text-[22px] leading-[0.95] tracking-tight">
              Modern cuts.
              <br />
              <span className="italic text-white/80">Honest pricing.</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[9px] font-sans font-semibold text-canvas">
                Book now
                <span aria-hidden>→</span>
              </span>
              <span className="px-2.5 py-1 rounded-full border border-white/30 text-[9px] font-sans text-white/90">
                See styles
              </span>
            </div>
          </div>
        </div>

        {/* Footer strip — testimonial + status */}
        <div className="px-3 py-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="text-[9px] font-serif italic text-white/70 truncate">
            &ldquo;Best cut in Toronto.&rdquo; — Sara J.
          </div>
          <span className="text-[8px] tracking-[0.22em] uppercase text-emerald-300/90 font-sans font-medium flex items-center gap-1 shrink-0">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Deployed
          </span>
        </div>
      </div>
    </div>
  );
}

/* 2. SocialHero ---------------------------------------------------------- */

const SOCIAL_PHOTO =
  "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=900&q=85&auto=format&fit=crop";
const SOCIAL_AVATAR =
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=120&q=85&auto=format&fit=crop";

function SocialHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-rose-950/30 via-canvas to-canvas overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.2em] uppercase text-ink-muted font-sans">
              Scheduled · Fri 9:00
            </span>
          </div>
          <span className="text-[8px] font-mono text-ink-dim tracking-wider">
            +3 of 12 this week
          </span>
        </div>
      </div>

      {/* Single Instagram post — photo-led */}
      <div className="mx-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d12] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
        {/* IG header */}
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <div className="relative size-7 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500">
            <img
              src={SOCIAL_AVATAR}
              alt=""
              className="size-full rounded-full object-cover border border-[#0d0d12]"
            />
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-[11px] font-sans font-semibold text-white">
              hannahshair
            </div>
            <div className="text-[9px] font-sans text-white/55">Toronto, ON</div>
          </div>
          <span className="text-white/70 text-[12px] tracking-widest">⋯</span>
        </div>

        {/* Photo */}
        <div className="aspect-square relative overflow-hidden">
          <img
            src={SOCIAL_PHOTO}
            alt="Fresh haircut"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          {/* Subtle vignette to make overlays legible */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.2) 100%)",
            }}
          />
          {/* Promo pill */}
          <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-md text-[8px] tracking-[0.22em] uppercase text-white font-sans font-medium">
            <span className="size-1 rounded-full bg-rose-400" />
            March · 20% off
          </div>
        </div>

        {/* Actions */}
        <div className="px-3 pt-2.5 pb-1 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        {/* Likes + caption + comment preview */}
        <div className="px-3 pb-3 text-[11px] leading-snug">
          <div className="text-white font-sans font-semibold mb-1">
            Liked by <span>sara.j</span> and <span>1,283 others</span>
          </div>
          <p className="text-white/85">
            <span className="font-semibold">hannahshair</span>{" "}
            <span className="font-serif italic text-white/75">
              March looks, this season.
            </span>{" "}
            <span className="text-sky-300/90">#hairtransformation</span>{" "}
            <span className="text-sky-300/90">#balayage</span>
          </p>
          <div className="mt-1.5 text-white/45 text-[10px]">
            View all 47 comments
          </div>
          <div className="mt-1 text-white/80 text-[10px]">
            <span className="font-semibold">mara.k</span>{" "}
            <span className="italic">obsessed 🔥 booking now</span>
          </div>
          <div className="mt-2 text-white/35 text-[9px] tracking-wider uppercase">
            2 hours ago
          </div>
        </div>
      </div>
    </div>
  );
}

/* 3. AdHero -------------------------------------------------------------- */

const AD_PHOTO =
  "https://images.unsplash.com/photo-1635814442700-446512be496a?w=900&q=85&auto=format&fit=crop";

function AdHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-canvas to-canvas overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.2em] uppercase text-ink-muted font-sans">
              Ad creative · Live
            </span>
          </div>
          <span className="text-[8px] font-mono text-emerald-300/90 tracking-wider">
            7.8% CTR · 2,847 reach
          </span>
        </div>
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d12] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
        {/* Facebook page header */}
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <div className="size-7 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-500 p-[1.5px]">
            <div className="size-full rounded-full bg-[#0d0d12] flex items-center justify-center text-[11px] font-serif text-white">
              H
            </div>
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-[11px] font-sans font-semibold text-white">
              Hannah&apos;s Hair Studio
            </div>
            <div className="text-[8px] font-sans text-white/55 flex items-center gap-1">
              Sponsored · 4h · <span className="opacity-70">🌐</span>
            </div>
          </div>
          <span className="text-white/70 text-[12px] tracking-widest">⋯</span>
        </div>

        {/* Body caption */}
        <div className="px-3 pb-2.5 text-[10px] text-white/85 leading-snug">
          Spring is for transformations 🌸 Book this week and save 20%.
        </div>

        {/* Ad image with overlay */}
        <div className="aspect-[5/4] relative overflow-hidden">
          <img
            src={AD_PHOTO}
            alt="Beauty portrait"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.75) 100%)",
            }}
          />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="font-serif italic text-white text-[20px] leading-[0.95] tracking-tight">
              Hair that
              <br />
              <span className="not-italic">remembers you.</span>
            </div>
            <div className="text-[8px] tracking-[0.24em] uppercase text-amber-200/90 font-sans mt-2">
              Book this week · 20% off
            </div>
          </div>
        </div>

        {/* Link preview card */}
        <div className="px-3 py-2.5 bg-white/[0.025] border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="leading-tight min-w-0">
            <div className="text-[7px] tracking-[0.22em] uppercase text-white/45 font-sans">
              hannahshair.com
            </div>
            <div className="text-[10px] text-white font-sans font-semibold mt-0.5 truncate">
              Book your March cut today
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-[10px] font-sans font-semibold text-canvas">
            Book
            <span aria-hidden>→</span>
          </span>
        </div>

        {/* Engagement strip */}
        <div className="px-3 py-2 border-t border-white/[0.04] flex items-center gap-3 text-[10px] text-white/70 font-sans">
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="rgb(96 165 250)" stroke="none">
              <path d="M2 9.5a3.5 3.5 0 0 1 6.7-1.5l3.3 1 .5-3.5a2.5 2.5 0 0 1 5 .5v5h3a2 2 0 0 1 2 2v2l-2 6h-12a2 2 0 0 1-2-2V9.5z"/>
            </svg>
            127
          </span>
          <span className="flex items-center gap-1">💬 23</span>
          <span className="flex items-center gap-1">↗ 8</span>
        </div>
      </div>
    </div>
  );
}

/* 4. CopyHero ------------------------------------------------------------ */

const COPY_PHOTO =
  "https://images.unsplash.com/photo-1595475884562-073c30d45670?w=900&q=85&auto=format&fit=crop";

function CopyHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-canvas to-canvas overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.2em] uppercase text-ink-muted font-sans">
              Hero copy · Live
            </span>
          </div>
          <span className="text-[8px] font-mono text-violet-300/90 tracking-wider">
            A/B/C tested · 12.4% CVR
          </span>
        </div>
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d12] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
        {/* Hero rendered on landing page */}
        <div className="aspect-[5/4] relative overflow-hidden">
          <img
            src={COPY_PHOTO}
            alt="Hero rendering"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.85) 100%)",
            }}
          />

          {/* Page nav chrome */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
            <span className="font-serif text-white text-[11px] tracking-tight">
              Hannah&apos;s
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/30 backdrop-blur-md border border-violet-400/50 text-[8px] tracking-[0.22em] uppercase text-violet-100 font-sans font-medium">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              Variant A
            </span>
          </div>

          {/* Hero copy rendered */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-[8px] tracking-[0.24em] uppercase text-violet-200/85 font-sans mb-2">
              Hero headline · winner
            </div>
            <div className="font-serif text-white text-[22px] leading-[0.95] tracking-tight">
              The salon
              <br />
              <span className="italic text-white/80">that knows you.</span>
            </div>
            <div className="mt-2 text-[10px] text-white/75 leading-snug max-w-[92%]">
              We remember your style, your time slots, and the exact shade.
            </div>
          </div>
        </div>

        {/* Compact A/B/C variant strip */}
        <div className="px-3 py-2.5 space-y-1.5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] tracking-[0.22em] uppercase text-white/45 font-sans font-medium">
              3 variants · 7 days
            </span>
            <span className="text-[8px] font-mono text-emerald-300/90 flex items-center gap-1">
              <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
              live
            </span>
          </div>
          {[
            { label: "A", text: "The salon that knows you.", cvr: "12.4%", winner: true },
            { label: "B", text: "Premium cuts on your schedule", cvr: "7.1%", winner: false },
            { label: "C", text: "Modern hair. Honest pricing.", cvr: "5.8%", winner: false },
          ].map((v) => (
            <div
              key={v.label}
              className={`flex items-center gap-2 text-[10px] ${v.winner ? "" : "opacity-50"}`}
            >
              <span
                className={`size-4 rounded text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${
                  v.winner
                    ? "bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white"
                    : "bg-white/[0.08] text-white/70"
                }`}
              >
                {v.label}
              </span>
              <span
                className={`flex-1 truncate ${
                  v.winner
                    ? "text-white font-serif italic"
                    : "text-white/65 font-sans"
                }`}
              >
                {v.text}
              </span>
              <span
                className={`font-mono font-semibold tabular-nums shrink-0 text-[9px] ${
                  v.winner ? "text-emerald-300" : "text-white/40"
                }`}
              >
                {v.cvr}
              </span>
            </div>
          ))}
        </div>

        {/* Confidence footer */}
        <div className="px-3 py-2 border-t border-white/[0.04] flex items-center justify-between text-[8px] tracking-[0.22em] uppercase text-white/45 font-sans">
          <span>2,847 sessions</span>
          <span className="text-violet-300/80 font-medium">99% confidence</span>
        </div>
      </div>
    </div>
  );
}

/* 5. BlogHero ------------------------------------------------------------ */

const BLOG_PHOTO =
  "https://images.unsplash.com/photo-1633681138600-295fcd688876?w=900&q=85&auto=format&fit=crop";

function BlogHero() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-canvas to-canvas overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.2em] uppercase text-ink-muted font-sans">
              Blog · Published
            </span>
          </div>
          <span className="text-[8px] font-mono text-emerald-300/90 tracking-wider">
            SEO 94 · 1,247 words
          </span>
        </div>
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d12] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
        {/* Cover photo */}
        <div className="aspect-[3/2] relative overflow-hidden">
          <img
            src={BLOG_PHOTO}
            alt="Styling close-up"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          {/* Category pill */}
          <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-md text-[8px] tracking-[0.22em] uppercase text-emerald-200/90 font-sans">
            <span className="size-1 rounded-full bg-emerald-400" />
            Styling
          </div>
        </div>

        {/* Article body */}
        <div className="px-4 py-3">
          <div className="font-serif text-white text-[17px] leading-[1.08] tracking-tight">
            How often should you trim
            <br />
            <span className="italic text-white/80">layered hair?</span>
          </div>

          {/* Byline */}
          <div className="mt-2 flex items-center gap-1.5 text-[9px] font-sans text-white/55">
            <span className="size-3.5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
            <span className="font-medium text-white/75">Hannah Park</span>
            <span>·</span>
            <span>Mar 14, 2026</span>
            <span>·</span>
            <span>5 min read</span>
          </div>

          {/* Article excerpt */}
          <div className="mt-3 text-[10px] text-white/75 leading-[1.5]">
            Layered hair is high-maintenance for a reason. The way each layer
            falls depends on the weight of the layers below it — and as your
            hair grows, that balance shifts faster than people expect.
          </div>
          <div className="mt-2 text-[10px] text-white/55 leading-[1.5]">
            The rule of thumb most stylists agree on:{" "}
            <em className="italic text-white/85 not-italic font-medium">
              every 6 to 8 weeks
            </em>
            , depending on density.
          </div>
          <div className="mt-2 text-[9px] text-white/35 italic">
            …continued
          </div>
        </div>

        {/* SEO strip */}
        <div className="px-3 py-2 border-t border-white/[0.06] bg-white/[0.015] flex items-center gap-2 text-[8px] font-mono text-white/45 overflow-hidden">
          <span className="size-1 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">
            seo: layered hair · trim frequency · hair maintenance · texture
          </span>
        </div>
      </div>
    </div>
  );
}
