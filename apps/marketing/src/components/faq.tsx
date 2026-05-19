"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

const QUESTIONS = [
  {
    q: "Is this just ChatGPT with a wrapper?",
    a: "No. ChatGPT writes generic content. WRKS runs every deliverable through a proprietary framework — the proven WRKS method for that thing — combined with everything it has learned about your specific business. The result is professional output, not generic AI text.",
  },
  {
    q: "Does it actually publish, or just draft?",
    a: "It publishes. Social posts go live on Instagram, Facebook, and LinkedIn. Website edits deploy to your live domain. Discount codes activate on Stripe. Irreversible actions always require your explicit approval first.",
  },
  {
    q: "What if I already have a website?",
    a: "Bring it in. The agent can analyze any existing site by URL and continue from there. You can also import your code, or start fresh with a WRKS-built site that deploys to your own domain.",
  },
  {
    q: "Does it read my analytics or revenue data?",
    a: "No. WRKS does not connect to your analytics, ad accounts, sales dashboards, or anything else as a reader. It learns your business by working in it with you, not by scraping integrations. Less complexity, more focus.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No annual contracts. Your business memory and asset library are preserved if you ever return.",
  },
  {
    q: "When does the trial end?",
    a: "A 14-day free trial. No credit card up front. At trial end you either subscribe and keep everything, or your outputs lock — but your profile and memory are preserved.",
  },
];

export function FAQ() {
  return (
    <section className="py-28 px-6 lg:px-8 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-[10px] tracking-[0.22em] uppercase text-fg-muted font-sans mb-5 text-center"
        >
          Questions
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-center"
        >
          The honest answers.
        </motion.h2>

        <div className="mt-14 divide-y divide-border border-y border-border">
          {QUESTIONS.map((q, i) => (
            <FaqItem key={q.q} q={q.q} a={q.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-6 py-6 text-left group"
        aria-expanded={open}
      >
        <span className="font-serif text-lg sm:text-xl text-fg leading-snug">
          {q}
        </span>
        <span
          className={`shrink-0 size-7 rounded-full border border-border flex items-center justify-center text-fg-muted group-hover:border-fg/40 group-hover:text-fg transition-all ${
            open ? "rotate-45" : "rotate-0"
          }`}
          aria-hidden
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 1v10M1 6h10" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 pr-12 text-base text-fg-muted leading-relaxed font-sans">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
