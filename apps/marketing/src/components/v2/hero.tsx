"use client";

import { motion } from "motion/react";
import { MagicRings } from "./magic-rings";
import { Button } from "./button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 overflow-hidden">
      {/* Magic rings — full-bleed centerpiece backdrop (canvas = section) */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 80%, transparent 100%)",
        }}
      >
        <MagicRings
          color="#a78bfa"
          colorTwo="#38bdf8"
          ringCount={7}
          speed={0.6}
          attenuation={9}
          lineThickness={2}
          baseRadius={0.55}
          radiusStep={0.1}
          scaleRate={0.08}
          opacity={0.75}
          blur={0.4}
          noiseAmount={0.04}
          rotation={0}
          ringGap={1.5}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse
          mouseInfluence={0.12}
          hoverScale={1.05}
          parallax={0.03}
        />
      </div>

      {/* Foreground content */}
      <div className="relative max-w-screen-xl mx-auto flex flex-col items-center text-center z-10 pt-24 sm:pt-28 pb-16 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-black/30 backdrop-blur-md px-3 py-1 mb-9"
        >
          <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
          <span className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans">
            Founding cohort · early 2026
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.15, duration: 1.0, ease: [0.2, 0.7, 0.2, 1] }}
          className="font-serif font-medium tracking-tight leading-[0.95] max-w-5xl text-[clamp(3.75rem,9vw,7.5rem)]"
          style={{
            textShadow:
              "0 2px 24px rgba(10,10,20,0.45), 0 0 60px rgba(10,10,20,0.35)",
          }}
        >
          Tell it.
          <br />
          <span className="italic text-ink-muted">It WRKS.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-8 text-lg sm:text-[20px] text-ink-muted max-w-2xl leading-[1.55]"
          style={{ textShadow: "0 2px 14px rgba(10,10,20,0.5)" }}
        >
          A personalized AI agent that builds your business outputs —
          websites, ads, social, copy, SEO. Just say what you need, from
          your phone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3"
        >
          <Button variant="primary" size="lg" withArrow href="#waitlist">
            Join the waitlist
          </Button>
          <Button variant="ghost" size="lg" href="#nova">
            Talk to Nova
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
