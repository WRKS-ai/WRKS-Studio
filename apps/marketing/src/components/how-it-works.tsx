"use client";

import { motion } from "motion/react";

const STEPS = [
  {
    n: "01",
    title: "Tell it",
    body: "Speak or type. The agent understands your business — your voice, your audience, your offers — because you've built it together over time.",
    mock: <MockTell />,
  },
  {
    n: "02",
    title: "It shows you",
    body: "Before anything goes live, the agent shows what it's about to make. You confirm, redirect, or refine — through conversation, not menus.",
    mock: <MockShow />,
  },
  {
    n: "03",
    title: "It ships",
    body: "Approved work publishes immediately. Posts go live. Pages deploy. The agent remembers the decision and gets sharper for next time.",
    mock: <MockShip />,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-28 px-6 lg:px-8 border-t border-line">
      <div className="max-w-screen-xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans mb-5"
        >
          How it works
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl"
        >
          A relationship,
          <br />
          <span className="italic text-ink-muted">not a tool.</span>
        </motion.h2>

        <div className="mt-20 grid md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.7,
                delay: i * 0.12,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="group relative border border-line rounded-3xl bg-panel/40 hover:bg-panel/70 hover:border-ink/20 transition-all duration-300 p-6 sm:p-7 overflow-hidden"
            >
              <div className="font-mono text-xs text-ink-dim mb-6">{s.n}</div>
              <h3 className="font-serif text-2xl sm:text-3xl mb-3">
                {s.title}
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-7 max-w-[28ch]">
                {s.body}
              </p>
              <div className="mt-auto pt-2">{s.mock}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MockTell() {
  return (
    <div className="border border-line rounded-xl bg-canvas p-4">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.18em] uppercase text-ink-dim font-sans mb-2">
        <span className="size-1 rounded-full bg-emerald-400/80" />
        Voice
      </div>
      <p className="font-serif italic text-sm text-ink leading-snug">
        &ldquo;Schedule a Friday post about the new latte menu.&rdquo;
      </p>
      <div className="mt-3 flex items-center gap-1">
        {[12, 18, 22, 16, 24, 14, 20, 10, 16, 22, 18, 14].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-ink/40"
            style={{ height: `${h}px` }}
          />
        ))}
        <span className="ml-auto text-[10px] font-mono text-ink-dim">0:04</span>
      </div>
    </div>
  );
}

function MockShow() {
  return (
    <div className="border border-line rounded-xl bg-canvas p-4">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.18em] uppercase text-ink-dim font-sans mb-3">
        <span className="size-1 rounded-full bg-amber-400/80" />
        Plan
      </div>
      <div className="space-y-2">
        {["Instagram post · 1080×1080", "Story tile · 1080×1920"].map((t) => (
          <div
            key={t}
            className="flex items-center gap-2 text-xs text-ink-muted font-sans"
          >
            <span className="size-3 rounded-sm border border-ink-muted/40 flex items-center justify-center">
              <span className="size-1.5 rounded-sm bg-ink-muted/40" />
            </span>
            {t}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-ink text-canvas">
          Confirm
        </span>
        <span className="text-[10px] font-sans px-2 py-0.5 rounded-full border border-line text-ink-muted">
          Adjust
        </span>
      </div>
    </div>
  );
}

function MockShip() {
  return (
    <div className="border border-line rounded-xl bg-canvas p-4 space-y-2">
      {[
        { l: "Instagram", s: "Posted" },
        { l: "Site banner", s: "Deployed" },
        { l: "Memory", s: "Updated" },
      ].map((r) => (
        <div key={r.l} className="flex items-center justify-between">
          <span className="text-xs text-ink-muted font-sans">{r.l}</span>
          <span className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-emerald-400/90 font-sans font-medium">
            <span className="size-1 rounded-full bg-emerald-400" />
            {r.s}
          </span>
        </div>
      ))}
    </div>
  );
}
