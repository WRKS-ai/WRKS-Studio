"use client";

import { motion } from "motion/react";
import { GlassIcons, type GlassIconItem } from "./glass-icons";

/* Palette-restrained gradients (violet/sky thread + complementary tones) */
const ITEMS: GlassIconItem[] = [
  {
    label: "Social",
    color: "linear-gradient(135deg, hsl(310, 80%, 55%), hsl(280, 80%, 50%))",
    icon: (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "CRM",
    color: "linear-gradient(135deg, hsl(258, 80%, 60%), hsl(238, 80%, 55%))",
    icon: (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
        <path d="M3 21v-2a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v2" />
      </svg>
    ),
  },
  {
    label: "Payments",
    color: "linear-gradient(135deg, hsl(218, 88%, 60%), hsl(198, 88%, 55%))",
    icon: (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
        <path d="M2.5 11h19" />
        <path d="M7 16h3" />
      </svg>
    ),
  },
  {
    label: "Email",
    color: "linear-gradient(135deg, hsl(178, 75%, 50%), hsl(195, 80%, 50%))",
    icon: (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <path d="m3 7 9 6.5L21 7" />
      </svg>
    ),
  },
  {
    label: "Booking",
    color: "linear-gradient(135deg, hsl(155, 65%, 50%), hsl(180, 65%, 45%))",
    icon: (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
        <circle cx="12" cy="15" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    color: "linear-gradient(135deg, hsl(343, 80%, 60%), hsl(325, 80%, 55%))",
    icon: (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15l3.5-4 3 3 5-6" />
      </svg>
    ),
  },
];

export function Connections() {
  return (
    <section
      id="connections"
      className="relative py-32 sm:py-40 px-6 lg:px-8"
    >
      <div className="relative max-w-screen-xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-6"
          >
            <span className="size-1 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />
            Connections
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[1.02] max-w-3xl mx-auto text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            Plugs into
            <br />
            <span className="italic text-ink-muted">your stack.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="mt-7 text-[19px] text-ink-muted leading-[1.55] max-w-2xl mx-auto"
          >
            Six tools, one prompt away. Nova publishes, forwards, and embeds —
            you stay in control of where everything lands.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          className="max-w-3xl mx-auto"
        >
          <GlassIcons items={ITEMS} />
        </motion.div>
      </div>
    </section>
  );
}
