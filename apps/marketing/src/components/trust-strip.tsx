"use client";

import { motion } from "motion/react";

const TYPES = [
  "Hair salons",
  "Bakeries",
  "Personal trainers",
  "Boutique brands",
  "Consultants",
  "Cafés",
  "Photographers",
  "Yoga studios",
];

export function TrustStrip() {
  return (
    <section className="py-14 px-6 lg:px-8 border-t border-border">
      <div className="max-w-screen-xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center text-[10px] tracking-[0.22em] uppercase text-fg-dim font-sans mb-7"
        >
          Built for owners. Used by
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-fg-muted"
        >
          {TYPES.map((t, i) => (
            <span key={t} className="flex items-center gap-3 font-sans text-sm">
              {t}
              {i < TYPES.length - 1 && (
                <span className="hidden sm:inline size-0.5 rounded-full bg-fg-dim" />
              )}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
