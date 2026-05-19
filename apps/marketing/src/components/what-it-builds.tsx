"use client";

import { motion } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";

const ITEMS: {
  title: string;
  body: string;
  icon: ReactNode;
  mock: ReactNode;
  span?: string;
}[] = [
  {
    title: "Websites & funnels",
    body: "Conversion pages that publish to your own domain. Forms forward to your CRM. Stripe payments built in.",
    icon: <IconBrowser />,
    mock: <WebsiteMock />,
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    title: "Social content",
    body: "Posts, captions, visuals — each platform's format rules baked into the framework.",
    icon: <IconSocial />,
    mock: <InstagramMock />,
  },
  {
    title: "Ad creatives",
    body: "Headlines, body copy, image direction. Built to a proven ad framework.",
    icon: <IconAd />,
    mock: <AdMock />,
  },
  {
    title: "Copywriting",
    body: "Page copy, CTAs, brand voice writing — to a proven conversion framework.",
    icon: <IconCopy />,
    mock: <CopyMock />,
  },
  {
    title: "SEO & blog",
    body: "Long-form posts, metadata, internal linking. Structured for search.",
    icon: <IconSeo />,
    mock: <BlogMock />,
  },
];

export function WhatItBuilds() {
  return (
    <section className="py-32 px-6 lg:px-8 border-t border-line relative overflow-hidden">
      <div className="max-w-screen-xl mx-auto relative">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans mb-5"
        >
          What it builds
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-3xl"
        >
          Five deliverables.
          <br />
          <span className="italic text-ink-muted">Done right, every time.</span>
        </motion.h2>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ITEMS.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.65,
                delay: i * 0.07,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              whileHover={{ y: -4 }}
              className={`group relative border border-line rounded-3xl bg-panel/60 hover:bg-panel hover:border-line-bright transition-[background-color,border-color] duration-500 p-7 overflow-hidden ${it.span ?? ""}`}
            >
              <div className="relative z-10 flex items-start justify-between mb-5">
                <div className="size-10 rounded-xl border border-line bg-canvas/80 flex items-center justify-center text-ink-muted group-hover:text-ink group-hover:border-ink/30 transition-colors">
                  {it.icon}
                </div>
              </div>
              <h3 className="relative z-10 font-serif text-2xl mb-2">
                {it.title}
              </h3>
              <p className="relative z-10 text-sm text-ink-muted leading-relaxed max-w-[34ch] mb-7">
                {it.body}
              </p>
              <div className="relative z-10 mt-auto">{it.mock}</div>
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02]" />
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.65,
              delay: ITEMS.length * 0.07,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="relative md:col-span-2 lg:col-span-2 border border-dashed border-line rounded-3xl p-7 flex flex-col justify-center"
          >
            <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-sans mb-3">
              Coming later
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Email automation, sales sequences, and CRM build are deliberately
              out of scope for v1. We&apos;re building the core five
              exceptionally first.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- MOCKS -------------------- */

function WebsiteMock() {
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-2xl shadow-black/50">
      <div className="h-7 flex items-center gap-1.5 px-3 border-b border-line bg-panel/80">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-4 flex-1 h-4 rounded-full bg-canvas border border-line flex items-center px-3">
          <span className="text-[9px] font-mono text-ink-dim">
            hannahshair.com
          </span>
        </span>
      </div>
      <div className="relative aspect-[16/9] grid grid-cols-2">
        <div
          className="relative p-6 flex flex-col justify-center"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 50%), linear-gradient(to bottom right, #1a1a22, #08080a)",
          }}
        >
          <div className="text-[8px] tracking-[0.22em] uppercase text-ink-muted font-sans mb-3">
            Hannah&apos;s Hair Studio
          </div>
          <div className="font-serif text-2xl leading-[1.05] tracking-tight text-ink mb-3">
            Modern cuts.
            <br />
            <span className="italic text-ink-muted">Honest pricing.</span>
          </div>
          <div className="space-y-1.5 mb-4">
            <div className="h-1 w-32 rounded-full bg-ink-muted/30" />
            <div className="h-1 w-24 rounded-full bg-ink-muted/30" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 px-3 rounded-full bg-ink text-canvas text-[9px] font-sans font-medium flex items-center">
              Book now
            </div>
            <div className="h-6 px-3 rounded-full border border-line text-ink-muted text-[9px] font-sans flex items-center">
              See styles
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <Image
            src="/mockups/salon-interior.png"
            alt="Hair salon interior"
            fill
            sizes="(min-width: 1024px) 400px, 50vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-canvas/40 via-transparent to-transparent" />
          <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/70 bg-canvas/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            01 / 04
          </div>
        </div>
      </div>
    </div>
  );
}

function InstagramMock() {
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-xl shadow-black/40">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-line">
        <div className="size-6 rounded-full bg-gradient-to-br from-rose-400 via-fuchsia-500 to-amber-400 p-[1.5px]">
          <div className="size-full rounded-full bg-canvas flex items-center justify-center text-[8px] font-sans font-semibold">
            h
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-sans font-semibold leading-none">
            hannahshair
          </div>
          <div className="text-[8px] font-sans text-ink-muted leading-none mt-0.5">
            Sponsored · 2h
          </div>
        </div>
        <span className="text-ink-muted text-xs">···</span>
      </div>
      <div className="aspect-square relative overflow-hidden">
        <Image
          src="/mockups/stylized-portrait.png"
          alt="Stylized hair portrait"
          fill
          sizes="(min-width: 1024px) 320px, 50vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-canvas/60 backdrop-blur-sm text-[8px] tracking-widest uppercase text-white font-sans font-medium">
          March · 20% off
        </div>
        <div className="absolute bottom-3 left-3 font-serif text-white text-base tracking-tight italic">
          New looks
          <br />
          this season.
        </div>
      </div>
      <div className="px-3 py-2 flex items-center gap-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-ink"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-ink"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-ink"
        >
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
        <span className="ml-auto text-[10px] font-sans text-ink-muted">
          1,284 likes
        </span>
      </div>
    </div>
  );
}

function AdMock() {
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-xl shadow-black/40">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-line">
        <div className="size-5 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[9px] font-bold">
          f
        </div>
        <span className="text-[9px] font-sans text-ink-muted">Sponsored</span>
      </div>
      <div className="aspect-[4/3] relative overflow-hidden flex items-center justify-center">
        <Image
          src="/mockups/hair-closeup.png"
          alt="Styled hair close-up"
          fill
          sizes="(min-width: 1024px) 320px, 50vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas/80 via-canvas/20 to-transparent" />
        <div className="relative text-center px-4 z-10">
          <div className="font-serif text-white text-xl leading-tight italic drop-shadow-lg">
            Hair that
            <br />
            <span className="not-italic font-semibold">remembers you.</span>
          </div>
          <div className="mt-2 text-[9px] tracking-widest uppercase text-amber-200/90 font-sans drop-shadow">
            Book this week · 20% off
          </div>
        </div>
      </div>
      <div className="p-3 bg-panel">
        <div className="text-[9px] uppercase tracking-wider text-ink-muted font-sans">
          hannahshair.com
        </div>
        <div className="text-[11px] font-sans font-semibold text-ink mt-0.5 leading-tight">
          Book your March cut today
        </div>
      </div>
    </div>
  );
}

function CopyMock() {
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-xl shadow-black/40">
      {/* Variant A — current */}
      <div className="p-5 border-b border-line">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[8px] tracking-[0.22em] uppercase text-ink-dim font-sans">
            Hero · variant A
          </div>
          <div className="text-[8px] font-mono text-emerald-400/90 flex items-center gap-1">
            <span className="size-1 rounded-full bg-emerald-400" />
            12.4% CVR
          </div>
        </div>
        <div className="font-serif text-base leading-tight tracking-tight text-ink mb-2">
          The salon
          <br />
          <span className="italic text-ink-muted">that knows you</span>
        </div>
        <div className="text-[10px] text-ink-muted font-sans leading-snug mb-3">
          We remember your style, your time slots, and the exact shade.
        </div>
        <div className="h-5 px-2.5 rounded-full bg-ink text-canvas text-[8px] font-sans font-medium inline-flex items-center">
          Book in 30s
        </div>
      </div>
      {/* Variant B — losing */}
      <div className="p-5 opacity-60">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[8px] tracking-[0.22em] uppercase text-ink-dim font-sans">
            Hero · variant B
          </div>
          <div className="text-[8px] font-mono text-ink-dim flex items-center gap-1">
            <span className="size-1 rounded-full bg-ink-dim" />
            7.1% CVR
          </div>
        </div>
        <div className="font-serif text-base leading-tight tracking-tight text-ink-muted mb-2">
          Premium cuts
          <br />
          <span className="italic">on your schedule</span>
        </div>
        <div className="text-[10px] text-ink-dim font-sans leading-snug">
          Modern styling, vintage craftsmanship, walk-in friendly.
        </div>
      </div>
    </div>
  );
}

function BlogMock() {
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-xl shadow-black/40">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src="/mockups/salon-mirror.png"
          alt="Hair salon"
          fill
          sizes="(min-width: 1024px) 320px, 50vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/30 via-transparent to-canvas/80" />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="text-[8px] tracking-[0.22em] uppercase text-white/80 font-sans bg-canvas/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
            Mar 12 · 4 min
          </span>
          <span className="text-[8px] tracking-[0.22em] uppercase text-emerald-300 font-sans bg-canvas/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
            SEO 94
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="font-serif text-[15px] leading-tight tracking-tight text-ink mb-2.5">
          How often should you trim layered hair?
        </div>
        <div className="space-y-1.5 mb-3">
          <div className="h-1 w-full rounded-full bg-ink-muted/25" />
          <div className="h-1 w-[92%] rounded-full bg-ink-muted/25" />
          <div className="h-1 w-[78%] rounded-full bg-ink-muted/25" />
          <div className="h-1 w-[58%] rounded-full bg-ink-muted/25" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["hair-care", "layered-cut", "salon-tips"].map((t) => (
            <span
              key={t}
              className="text-[8px] font-mono px-2 py-0.5 rounded-full border border-line text-ink-muted"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------- ICONS -------------------- */

function IconBrowser() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18" />
      <circle cx="6.5" cy="7" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7" r="0.5" fill="currentColor" />
    </svg>
  );
}

function IconSocial() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="3.5" />
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" />
    </svg>
  );
}

function IconAd() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 10v4l11 5V5L4 10Z" />
      <path d="M15 9a3 3 0 0 1 0 6" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 5h9l4 4v10H6z" />
      <path d="M15 5v4h4" />
      <path d="M9 13h6M9 16h4" />
    </svg>
  );
}

function IconSeo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </svg>
  );
}
