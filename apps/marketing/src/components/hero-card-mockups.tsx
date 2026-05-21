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
        <div className="px-3 py-2.5 flex items-center gap-1.5">
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
        <div className="relative aspect-square overflow-hidden">
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
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.85) 100%)",
            }}
          />

          {/* Hero copy at bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="font-serif text-white text-[22px] leading-[0.95] tracking-tight">
              Modern cuts.
              <br />
              <span className="italic text-white/80">Honest pricing.</span>
            </div>
          </div>
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
            <div className="text-[8px] font-sans text-white/55">
              Sponsored · 4h
            </div>
          </div>
          <span className="text-white/70 text-[12px] tracking-widest">⋯</span>
        </div>

        {/* Ad image with overlay */}
        <div className="aspect-square relative overflow-hidden">
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
                "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 35%, rgba(0,0,0,0.8) 100%)",
            }}
          />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="font-serif italic text-white text-[22px] leading-[0.95] tracking-tight">
              Hair that
              <br />
              <span className="not-italic">remembers you.</span>
            </div>
            <div className="text-[8px] tracking-[0.24em] uppercase text-amber-200/90 font-sans mt-2">
              Book this week · 20% off
            </div>
          </div>
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
        <div className="aspect-square relative overflow-hidden">
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
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.85) 100%)",
            }}
          />

          {/* Hero copy rendered */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="font-serif text-white text-[22px] leading-[0.95] tracking-tight">
              The salon
              <br />
              <span className="italic text-white/80">that knows you.</span>
            </div>
          </div>
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
        {/* Cover photo with overlay title */}
        <div className="aspect-square relative overflow-hidden">
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
                "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, rgba(0,0,0,0.85) 100%)",
            }}
          />
          {/* Category pill */}
          <div className="absolute top-3 left-4 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-md text-[8px] tracking-[0.22em] uppercase text-emerald-200/90 font-sans">
            <span className="size-1 rounded-full bg-emerald-400" />
            Styling
          </div>

          {/* Title + byline at bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="font-serif text-white text-[22px] leading-[0.95] tracking-tight">
              How often to trim
              <br />
              <span className="italic text-white/80">layered hair?</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[9px] font-sans text-white/65">
              <span className="size-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
              <span className="font-medium text-white/80">Hannah Park</span>
              <span>·</span>
              <span>5 min read</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
