"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  AdTarget,
  BlogSpread,
  CopyLadder,
  SocialRadar,
  WebsiteFunnel,
} from "./bento-illustrations";

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
    mock: <WebsiteFunnel />,
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    title: "Social content",
    body: "Posts, captions, visuals — each platform's format rules baked into the framework.",
    icon: <IconSocial />,
    mock: <SocialRadar />,
  },
  {
    title: "Ad creatives",
    body: "Headlines, body copy, image direction. Built to a proven ad framework.",
    icon: <IconAd />,
    mock: <AdTarget />,
  },
  {
    title: "Copywriting",
    body: "Page copy, CTAs, brand voice writing — to a proven conversion framework.",
    icon: <IconCopy />,
    mock: <CopyLadder />,
  },
  {
    title: "SEO & blog",
    body: "Long-form posts, metadata, internal linking. Structured for search.",
    icon: <IconSeo />,
    mock: <BlogSpread />,
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
              className={`group relative border border-line rounded-3xl bg-panel/60 hover:bg-panel hover:border-line-bright transition-[background-color,border-color] duration-500 overflow-hidden flex flex-col ${it.span ?? ""}`}
            >
              {/* Graphic — hero, fills available height */}
              <div className="relative z-10 flex-1 min-h-[260px] flex">{it.mock}</div>
              {/* Text content — fixed at the bottom */}
              <div className="relative z-10 p-6 sm:p-7 shrink-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="size-7 rounded-lg border border-line bg-canvas/80 flex items-center justify-center text-ink-muted group-hover:text-ink group-hover:border-ink/30 transition-colors">
                    {it.icon}
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl tracking-tight">
                    {it.title}
                  </h3>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed max-w-[36ch]">
                  {it.body}
                </p>
              </div>
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
