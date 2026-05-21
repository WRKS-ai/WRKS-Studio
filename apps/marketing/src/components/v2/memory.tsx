"use client";

import { motion } from "motion/react";
import { MagicBento, type BentoCard } from "./magic-bento";

const CARDS: BentoCard[] = [
  {
    label: "Memory",
    title: "Remembers what worked",
    description:
      "Every winning ad, headline, and post stays in your brand memory. Next week she riffs on the things that converted.",
  },
  {
    label: "Personality",
    title: "Nova · Echo · Sage · Atlas",
    description:
      "Pick the voice that fits your business. Warm and witty, calm and editorial, sharp and concise — or build your own.",
  },
  {
    label: "Voice",
    title: "Tuned to how you talk",
    description:
      "She studies your writing — captions, emails, reviews you've replied to — and writes in that register, not generic AI-speak.",
  },
  {
    label: "Trust gates",
    title: "Approves before shipping",
    description:
      "Nothing goes live without your sign-off. Quick review on your phone — approve, edit, or send back with one sentence.",
  },
  {
    label: "Connections",
    title: "Plugs into your stack",
    description:
      "Social, CRM, payments, email, booking, analytics — Nova publishes and forwards to wherever your customers already live.",
  },
  {
    label: "Updates",
    title: "Smarter weekly",
    description:
      "New frameworks, better prompts, and refined memory ship continuously. Your agent gets sharper without you lifting a finger.",
  },
];

export function Memory() {
  return (
    <section
      id="memory"
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
            Built around you
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[1.02] max-w-3xl mx-auto text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            She remembers
            <br />
            <span className="italic text-ink-muted">everything.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="mt-7 text-[19px] text-ink-muted leading-[1.55] max-w-2xl mx-auto"
          >
            Memory, personality, voice, trust — Nova builds a private model of
            your business so every output sounds like you, not generic AI.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.95, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <MagicBento
            cards={CARDS}
            glowColor="167, 139, 250"
            spotlightRadius={320}
            particleCount={10}
            textAutoHide={false}
          />
        </motion.div>
      </div>
    </section>
  );
}
