"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { AgentOrb } from "./agent-orb";
import { LiveDemo } from "./live-demo";
import { MeshGradient } from "./mesh-gradient";

const LINE_ONE = ["Tell", "it."];
const LINE_TWO = ["It", "WRKS."];

const wordVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 18 });
  const orbX = useTransform(springX, [-1, 1], [-12, 12]);
  const orbY = useTransform(springY, [-1, 1], [-8, 8]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  return (
    <section className="relative pt-32 pb-28 px-6 lg:px-8 overflow-hidden min-h-[88vh]">
      <MeshGradient />

      <div className="max-w-screen-xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center relative">
        {/* Left column */}
        <div className="relative">
          {/* Agent orb behind/beside the headline */}
          <motion.div
            style={{ x: orbX, y: orbY }}
            className="absolute -top-10 -left-12 sm:-top-12 sm:-left-20 opacity-50 pointer-events-none hidden lg:block"
          >
            <AgentOrb size={180} speaking={speaking} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 backdrop-blur-sm px-3 py-1 mb-7"
          >
            <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            <span className="text-[10px] tracking-[0.18em] uppercase text-ink-muted font-sans">
              The Connected Business Nervous System
            </span>
          </motion.div>

          <h1 className="relative font-serif text-5xl sm:text-6xl lg:text-[5.5rem] leading-[0.98] tracking-tight">
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
            <span className="block italic text-ink-muted">
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
            className="relative mt-8 text-lg sm:text-xl text-ink-muted max-w-xl leading-relaxed"
          >
            A personalized AI agent that runs your business. Say what you need
            — it builds, publishes, and remembers. Websites, ads, content,
            copy, SEO. Live from your phone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
            className="relative mt-10 flex flex-col sm:flex-row gap-3"
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
            transition={{ delay: 1.2, duration: 0.6 }}
            className="relative mt-12 flex items-center gap-6 text-[10px] tracking-[0.18em] uppercase text-ink-dim font-sans"
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

        {/* Right column — Live demo with orb above on mobile */}
        <div className="relative">
          <motion.div
            style={{ x: orbX, y: orbY }}
            className="absolute -top-20 -right-10 opacity-30 pointer-events-none hidden md:block"
          >
            <AgentOrb size={160} speaking={speaking} />
          </motion.div>
          <LiveDemo onSpeakingChange={setSpeaking} />
        </div>
      </div>
    </section>
  );
}
