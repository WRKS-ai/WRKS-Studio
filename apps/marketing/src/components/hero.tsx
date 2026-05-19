"use client";

import { motion } from "motion/react";
import { LiveDemo } from "./live-demo";

const LINE_ONE = ["Tell", "it."];
const LINE_TWO = ["It", "WRKS."];

const wordVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-6 lg:px-8 overflow-hidden">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 size-[640px] rounded-full bg-white/[0.04] blur-[140px]" />
        <div className="absolute top-40 right-[-10%] size-[480px] rounded-full bg-fg/[0.03] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse at center top, rgba(0,0,0,0.6), transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center top, rgba(0,0,0,0.6), transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-screen-xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        {/* Left column */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elev/60 backdrop-blur-sm px-3 py-1 mb-7"
          >
            <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            <span className="text-[10px] tracking-[0.18em] uppercase text-fg-muted font-sans">
              The Connected Business Nervous System
            </span>
          </motion.div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-[5.5rem] leading-[0.98] tracking-tight">
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
            </span>
            <span className="block italic text-fg-muted">
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
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7, ease: "easeOut" }}
            className="mt-8 text-lg sm:text-xl text-fg-muted max-w-xl leading-relaxed"
          >
            A personalized AI agent that runs your business. Say what you need
            — it builds, publishes, and remembers. Websites, ads, content,
            copy, SEO. Live from your phone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
            className="mt-10 flex flex-col sm:flex-row gap-3"
          >
            <motion.a
              href="#waitlist"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-fg text-bg font-sans font-medium shadow-lg shadow-fg/10 hover:shadow-fg/20 transition-shadow"
            >
              Join the waitlist
              <span className="ml-2 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </motion.a>
            <motion.a
              href="#how"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-border text-fg font-sans hover:bg-bg-elev hover:border-fg/30 transition-colors"
            >
              See how it works
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-12 flex items-center gap-6 text-[10px] tracking-[0.18em] uppercase text-fg-dim font-sans"
          >
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-fg-dim" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-fg-dim" />
              Founding cohort
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-fg-dim" />
              Phone-first
            </span>
          </motion.div>
        </div>

        {/* Right column — Live demo */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        >
          <LiveDemo />
        </motion.div>
      </div>
    </section>
  );
}
