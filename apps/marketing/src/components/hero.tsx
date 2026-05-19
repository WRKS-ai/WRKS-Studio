"use client";

import { motion } from "motion/react";
import { HeroCarousel } from "./hero-carousel";
import { MeshGradient } from "./mesh-gradient";

const LINE_ONE = ["Tell", "it."];
const LINE_TWO = ["It", "WRKS."];

const wordVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function Hero() {
  return (
    <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 px-6 lg:px-8 overflow-hidden">
      <MeshGradient />

      <div className="max-w-screen-xl mx-auto relative flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 backdrop-blur-sm px-3 py-1 mb-7"
        >
          <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
          <span className="text-[10px] tracking-[0.18em] uppercase text-ink-muted font-sans">
            The Connected Business Nervous System
          </span>
        </motion.div>

        <h1 className="font-serif text-5xl sm:text-6xl lg:text-[5.75rem] leading-[0.96] tracking-tight">
          <span className="block">
            {LINE_ONE.map((word, i) => (
              <motion.span
                key={word + i}
                variants={wordVariants}
                initial="hidden"
                animate="visible"
                transition={{
                  delay: 0.15 + i * 0.08,
                  duration: 0.7,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
            <span className="inline-block italic text-ink-muted">
              {LINE_TWO.map((word, i) => (
                <motion.span
                  key={word + i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    delay: 0.4 + i * 0.08,
                    duration: 0.7,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="inline-block mr-3"
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.7, ease: "easeOut" }}
          className="mt-7 text-base sm:text-lg text-ink-muted max-w-2xl leading-relaxed"
        >
          A personalized AI agent that runs your business. Say what you need —
          it builds, publishes, and remembers. Websites, ads, content, copy,
          SEO. Live from your phone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
          className="mt-8 flex flex-col sm:flex-row gap-3"
        >
          <motion.a
            href="#waitlist"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-ink text-canvas font-sans font-medium shadow-lg shadow-ink/10 hover:shadow-ink/25 transition-shadow"
          >
            Join the waitlist
            <span className="ml-2" aria-hidden>
              →
            </span>
          </motion.a>
          <motion.a
            href="#how"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-line text-ink font-sans hover:bg-panel hover:border-ink/30 transition-colors"
          >
            See how it works
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.6 }}
          className="mt-10 sm:mt-14 w-full"
        >
          <HeroCarousel />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mt-8 flex items-center gap-6 text-[10px] tracking-[0.18em] uppercase text-ink-dim font-sans"
        >
          <span className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-ink-dim" />
            No credit card
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-ink-dim" />
            Founding cohort
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-ink-dim" />
            Phone-first
          </span>
        </motion.div>
      </div>
    </section>
  );
}
