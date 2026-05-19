"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const ITEMS: {
  title: string;
  body: string;
  icon: ReactNode;
  span?: string;
  featured?: boolean;
}[] = [
  {
    title: "Websites & funnels",
    body: "Pages that convert, with forms forwarded to your CRM and Stripe payments built in.",
    icon: <IconBrowser />,
    span: "md:col-span-2 lg:col-span-2",
    featured: true,
  },
  {
    title: "Social content",
    body: "Posts, captions, and visuals formatted per platform — Instagram, Facebook, LinkedIn.",
    icon: <IconSocial />,
  },
  {
    title: "Ad creatives",
    body: "Headlines, body copy, image direction. Built to a proven ad framework.",
    icon: <IconAd />,
  },
  {
    title: "Copywriting",
    body: "Page copy, CTAs, offer descriptions, brand voice writing.",
    icon: <IconCopy />,
  },
  {
    title: "SEO & blog",
    body: "Long-form posts structured for search. Metadata, internal linking.",
    icon: <IconSeo />,
  },
];

export function WhatItBuilds() {
  return (
    <section className="py-28 px-6 lg:px-8 border-t border-border">
      <div className="max-w-screen-xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-[10px] tracking-[0.22em] uppercase text-fg-muted font-sans mb-5"
        >
          What it builds
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl"
        >
          Five deliverables.
          <br />
          <span className="italic text-fg-muted">Done right, every time.</span>
        </motion.h2>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ITEMS.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className={`group relative border border-border rounded-3xl bg-bg-elev/40 hover:bg-bg-elev hover:border-fg/20 transition-all duration-300 p-7 ${it.span ?? ""}`}
            >
              <div className="size-10 rounded-xl border border-border bg-bg flex items-center justify-center text-fg-muted group-hover:text-fg group-hover:border-fg/30 transition-colors mb-6">
                {it.icon}
              </div>
              <h3 className="font-serif text-2xl mb-2">{it.title}</h3>
              <p className="text-sm text-fg-muted leading-relaxed max-w-[36ch]">
                {it.body}
              </p>
              {it.featured && (
                <div className="mt-7 hidden md:block">
                  <FakeBrowser />
                </div>
              )}
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.6,
              delay: ITEMS.length * 0.08,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="relative border border-dashed border-border rounded-3xl bg-transparent p-7"
          >
            <div className="text-[10px] tracking-[0.22em] uppercase text-fg-dim font-sans mb-3">
              Coming later
            </div>
            <p className="text-sm text-fg-muted leading-relaxed max-w-[36ch]">
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

function FakeBrowser() {
  return (
    <div className="rounded-2xl border border-border bg-bg overflow-hidden">
      <div className="h-7 flex items-center gap-1.5 px-3 border-b border-border bg-bg-elev/40">
        <span className="size-2 rounded-full bg-fg-dim/40" />
        <span className="size-2 rounded-full bg-fg-dim/40" />
        <span className="size-2 rounded-full bg-fg-dim/40" />
        <span className="ml-3 text-[10px] font-mono text-fg-dim">
          hannahshair.com
        </span>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4 items-center">
        <div>
          <div className="h-2 w-20 rounded-full bg-fg/50 mb-2" />
          <div className="h-3 w-32 rounded-full bg-fg/80 mb-3" />
          <div className="h-1.5 w-28 rounded-full bg-fg-muted/40 mb-1" />
          <div className="h-1.5 w-24 rounded-full bg-fg-muted/40 mb-3" />
          <div className="h-5 w-16 rounded-full bg-fg" />
        </div>
        <div className="h-20 rounded-lg bg-bg-elev border border-border" />
      </div>
    </div>
  );
}

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
