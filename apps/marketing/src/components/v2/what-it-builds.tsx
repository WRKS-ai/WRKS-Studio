"use client";

import { motion } from "motion/react";
import { HeroCarousel } from "@/components/hero-carousel";

export function WhatItBuilds() {
  return (
    <section
      id="builds"
      className="relative py-32 sm:py-40 px-6 lg:px-8 overflow-hidden"
    >
      {/* Subtle violet → sky wash, picking up the hero ring tones */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.12), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.08), transparent 60%)",
        }}
      />

      <div className="relative max-w-screen-xl mx-auto">
        {/* Eyebrow + headline block */}
        <div className="text-center mb-20 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-6"
          >
            <span className="size-1 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />
            What it builds
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[1.02] max-w-3xl mx-auto text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            Five things.
            <br />
            <span className="italic text-ink-muted">Every time.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="mt-7 text-[19px] text-ink-muted leading-[1.55] max-w-2xl mx-auto"
          >
            Every prompt produces all five — your website, your social, your
            ads, your copy, and your SEO. From one sentence.
          </motion.p>
        </div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.95, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative"
        >
          <HeroCarousel />
        </motion.div>
      </div>
    </section>
  );
}
