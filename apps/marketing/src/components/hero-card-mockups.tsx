"use client";

import type { ReactNode } from "react";

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

/* ---------- Shared skeleton — every card has this exact shape ---------- */

type Tone = "rose" | "sky" | "violet" | "amber" | "emerald";

const TONE_WASH: Record<Tone, string> = {
  rose: "from-rose-950/30",
  sky: "from-sky-950/30",
  violet: "from-violet-950/30",
  amber: "from-amber-950/30",
  emerald: "from-emerald-950/30",
};

const TONE_DOT: Record<Tone, string> = {
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
};

const TONE_TEXT: Record<Tone, string> = {
  rose: "text-rose-200",
  sky: "text-sky-200",
  violet: "text-violet-200",
  amber: "text-amber-200",
  emerald: "text-emerald-200",
};

function MockupCard({
  tone,
  statusLabel,
  statusDetail,
  photo,
  photoAlt,
  pillLabel,
  captionTitle,
  captionMeta,
}: {
  tone: Tone;
  statusLabel: string;
  statusDetail: string;
  photo: string;
  photoAlt: string;
  pillLabel: ReactNode;
  captionTitle: string;
  captionMeta: string;
}) {
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-b ${TONE_WASH[tone]} via-canvas to-canvas overflow-hidden`}
    >
      {/* Status strip — outside the inner card */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${TONE_DOT[tone]} animate-pulse`} />
          <span className="text-[9px] tracking-[0.22em] uppercase text-ink-muted font-sans">
            {statusLabel}
          </span>
        </div>
        <span className="text-[8px] font-mono text-ink-dim tracking-wider">
          {statusDetail}
        </span>
      </div>

      {/* Inner card */}
      <div className="mx-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d12] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
        {/* Photo — clean except for one small pill */}
        <div className="aspect-square relative overflow-hidden">
          <img
            src={photo}
            alt={photoAlt}
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          <div
            className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-md text-[8px] tracking-[0.22em] uppercase ${TONE_TEXT[tone]} font-sans font-medium`}
          >
            <span className={`size-1 rounded-full ${TONE_DOT[tone]}`} />
            {pillLabel}
          </div>
        </div>

        {/* Caption — exactly two lines, every card */}
        <div className="px-4 py-3.5">
          <div className="font-serif italic text-white text-[15px] leading-tight">
            {captionTitle}
          </div>
          <div className="mt-1.5 text-[9px] font-mono text-white/45 tracking-[0.14em] uppercase truncate">
            {captionMeta}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 1. Website ---------- */

const WEBSITE_PHOTO =
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=90&auto=format&fit=crop";

function WebsiteHero() {
  return (
    <MockupCard
      tone="sky"
      statusLabel="Website · Live"
      statusDetail="4.2s · hannahshair.com"
      photo={WEBSITE_PHOTO}
      photoAlt="Salon interior"
      pillLabel="hannahshair.com"
      captionTitle="Modern cuts. Honest pricing."
      captionMeta="Hannah's Hair Studio · Toronto"
    />
  );
}

/* ---------- 2. Social ---------- */

const SOCIAL_PHOTO =
  "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=1600&q=90&auto=format&fit=crop";

function SocialHero() {
  return (
    <MockupCard
      tone="rose"
      statusLabel="Instagram · Fri 9:00"
      statusDetail="Scheduled · 2.8s"
      photo={SOCIAL_PHOTO}
      photoAlt="Fresh haircut"
      pillLabel="March · 20% off"
      captionTitle="March looks, this season."
      captionMeta="@hannahshair · #hairtransformation"
    />
  );
}

/* ---------- 3. Ad ---------- */

const AD_PHOTO =
  "https://images.unsplash.com/photo-1635814442700-446512be496a?w=1600&q=90&auto=format&fit=crop";

function AdHero() {
  return (
    <MockupCard
      tone="amber"
      statusLabel="Ad creative · Live"
      statusDetail="7.8% CTR · 2,847 reach"
      photo={AD_PHOTO}
      photoAlt="Beauty portrait"
      pillLabel="Sponsored"
      captionTitle="Hair that remembers you."
      captionMeta="Hannah's Hair Studio · Meta"
    />
  );
}

/* ---------- 4. Copy ---------- */

const COPY_PHOTO =
  "https://images.unsplash.com/photo-1595475884562-073c30d45670?w=1600&q=90&auto=format&fit=crop";

function CopyHero() {
  return (
    <MockupCard
      tone="violet"
      statusLabel="Hero copy · Live"
      statusDetail="12.4% CVR · 99% conf"
      photo={COPY_PHOTO}
      photoAlt="Styling tools"
      pillLabel="Variant A · Winner"
      captionTitle="The salon that knows you."
      captionMeta="A 12.4 · B 7.1 · C 5.8"
    />
  );
}

/* ---------- 5. Blog ---------- */

const BLOG_PHOTO =
  "https://images.unsplash.com/photo-1633681138600-295fcd688876?w=1600&q=90&auto=format&fit=crop";

function BlogHero() {
  return (
    <MockupCard
      tone="emerald"
      statusLabel="Blog · Published"
      statusDetail="5 min read · SEO 94"
      photo={BLOG_PHOTO}
      photoAlt="Salon mirrors"
      pillLabel="Styling"
      captionTitle="How often to trim layered hair?"
      captionMeta="Hannah Park · Mar 14, 2026"
    />
  );
}
