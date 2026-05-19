"use client";

import { motion } from "motion/react";

const LAYERS = [
  {
    label: "Interface",
    note: "What the user touches — web, mobile, voice",
    tone: "fg",
  },
  {
    label: "Orchestrator agent",
    note: "Parses intent, picks frameworks, manages memory",
    tone: "muted",
  },
  {
    label: "Staging environments",
    note: "Five live preview surfaces, one per deliverable",
    tone: "muted",
  },
  {
    label: "Frameworks & execution",
    note: "WRKS proprietary IP × business memory = output",
    tone: "muted",
  },
  {
    label: "Connections",
    note: "Social publish · CRM webhook · Stripe embed",
    tone: "fg",
  },
];

export function Architecture() {
  return (
    <section className="py-28 px-6 lg:px-8 border-t border-border">
      <div className="max-w-screen-xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-[10px] tracking-[0.22em] uppercase text-fg-muted font-sans mb-5"
          >
            The system
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight"
          >
            One agent.
            <br />
            <span className="italic text-fg-muted">Five layers deep.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
            className="mt-7 text-base sm:text-lg text-fg-muted leading-relaxed max-w-lg"
          >
            Under the conversation sits a real engineering stack: an
            orchestrator, framework execution, isolated business memory, and
            tight connections to the outside world. The user never sees it.
            They see a colleague.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] tracking-[0.22em] uppercase font-sans text-fg-dim"
          >
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-fg-dim" />
              No live data reads
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-fg-dim" />
              Per-business isolation
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-fg-dim" />
              Explicit approval gates
            </span>
          </motion.div>
        </div>

        <div className="space-y-2.5">
          {LAYERS.map((l, i) => (
            <motion.div
              key={l.label}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className={`border rounded-2xl p-5 sm:p-6 ${
                l.tone === "fg"
                  ? "border-fg/30 bg-fg/[0.04]"
                  : "border-border bg-bg-elev/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-sans font-semibold text-sm sm:text-base">
                  {l.label}
                </span>
                <span className="text-[10px] font-mono text-fg-dim">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-fg-muted font-sans">
                {l.note}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
