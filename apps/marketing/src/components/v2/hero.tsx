"use client";

import { motion } from "motion/react";
import { HeroCarousel } from "@/components/hero-carousel";
import { Button } from "./button";

export function Hero() {
  return (
    <section className="relative pt-36 sm:pt-40 pb-24 sm:pb-32 px-6 lg:px-8 overflow-hidden">
      <div className="max-w-screen-xl mx-auto relative flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm px-3 py-1 mb-9"
        >
          <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
          <span className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans">
            Founding cohort · early 2026
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.1, duration: 0.95, ease: [0.2, 0.7, 0.2, 1] }}
          className="font-serif font-medium tracking-tight leading-[0.95] max-w-5xl text-[clamp(3.5rem,8.6vw,7rem)]"
        >
          Tell it.
          <br />
          <span className="italic text-ink-muted">It WRKS.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-8 text-lg sm:text-[20px] text-ink-muted max-w-2xl leading-[1.55]"
        >
          A personalized AI agent that builds your business outputs —
          websites, ads, social, copy, SEO. Just say what you need, from
          your phone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3"
        >
          <Button variant="primary" size="lg" withArrow href="#waitlist">
            Join the waitlist
          </Button>
          <Button variant="ghost" size="lg" href="#nova">
            Talk to Nova
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.95, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-16 sm:mt-20 w-full"
        >
          <div
            className="relative"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 7%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 7%, black 100%)",
            }}
          >
            <HeroCarousel />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
