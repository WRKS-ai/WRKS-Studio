"use client";

import { motion } from "motion/react";
import { ScrollReveal } from "./scroll-reveal";

const PHASES = [
  {
    num: "01",
    title: "Tell her",
    body: "Say what you need — voice, text, whatever's faster. Nova already knows your brand, your customers, your last winner. So you don't have to explain the basics every time.",
  },
  {
    num: "02",
    title: "She shows you",
    body: "Within seconds you see the page, the post, the ad — exactly how it'll look published. Tap anything to tweak before it ships. Nothing goes live without your sign-off.",
  },
  {
    num: "03",
    title: "She ships",
    body: "Approve, and Nova publishes to your domain, your Instagram, your CRM — all the connections you've set up. Five deliverables in under five seconds.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative py-32 sm:py-40 px-6 lg:px-8 overflow-hidden"
    >
      {/* Subtle violet → sky ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 30% 0%, rgba(167,139,250,0.08), transparent 55%), radial-gradient(ellipse at 70% 100%, rgba(56,189,248,0.06), transparent 60%)",
        }}
      />

      <div className="relative max-w-screen-xl mx-auto">
        {/* Eyebrow + heading */}
        <div className="text-center mb-24 sm:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-6"
          >
            <span className="size-1 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />
            How it works
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[1.02] max-w-3xl mx-auto text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            Three steps.
            <br />
            <span className="italic text-ink-muted">Five seconds.</span>
          </motion.h2>
        </div>

        {/* Phases */}
        <div className="space-y-24 sm:space-y-32 max-w-5xl mx-auto">
          {PHASES.map((phase, i) => (
            <div
              key={phase.num}
              className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-6 sm:gap-12 lg:gap-20 items-start"
            >
              {/* Massive serif numeral */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
                className="relative"
              >
                <span
                  className="font-serif italic font-medium leading-[0.85] tabular-nums select-none block"
                  style={{
                    fontSize: "clamp(5rem, 12vw, 10rem)",
                    background:
                      "linear-gradient(135deg, rgba(167,139,250,0.95) 0%, rgba(56,189,248,0.85) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {phase.num}
                </span>
              </motion.div>

              {/* Title + ScrollReveal body */}
              <div>
                <motion.h3
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 0.7,
                    delay: 0.1,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="font-serif font-medium tracking-tight leading-[1.05] text-[clamp(2rem,4vw,3rem)] mb-6"
                >
                  {phase.title}
                </motion.h3>

                <ScrollReveal
                  baseOpacity={0.12}
                  baseRotation={i % 2 === 0 ? 2 : -2}
                  blurStrength={5}
                  enableBlur
                  textClassName="font-sans text-ink-muted text-[clamp(1.05rem,1.6vw,1.35rem)] leading-[1.55]"
                >
                  {phase.body}
                </ScrollReveal>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
