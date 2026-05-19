"use client";

import { motion } from "motion/react";

const TIERS = [
  {
    name: "Starter",
    price: "$97",
    profiles: "1 business profile",
    bullets: ["All five deliverables", "Social + CRM + Stripe", "Full agent"],
    featured: false,
  },
  {
    name: "Growth",
    price: "$197",
    profiles: "Up to 3 profiles",
    bullets: ["Everything in Starter", "Multi-business memory", "Priority queue"],
    featured: true,
  },
  {
    name: "Pro",
    price: "$497",
    profiles: "Up to 8 profiles",
    bullets: ["Everything in Growth", "Custom agent personality", "Direct support"],
    featured: false,
  },
  {
    name: "Agency",
    price: "$997",
    profiles: "Unlimited",
    bullets: ["Everything in Pro", "White-label options", "Dedicated success"],
    featured: false,
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="py-32 px-6 lg:px-8 border-t border-line"
    >
      <div className="max-w-screen-xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans mb-5"
        >
          Pricing
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-3xl"
        >
          Flat per business.
          <br />
          <span className="italic text-ink-muted">
            No rate limits. No credits.
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-6 text-base text-ink-muted max-w-xl"
        >
          Pricing is gated only by how many active business profiles you run.
          Use the agent as much as you want — that&apos;s the point.
        </motion.p>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className={`relative border rounded-3xl p-7 transition-all duration-300 ${
                t.featured
                  ? "border-ink/40 bg-ink/[0.05] hover:bg-ink/[0.08]"
                  : "border-line bg-panel/40 hover:bg-panel/70 hover:border-ink/20"
              }`}
            >
              {t.featured && (
                <span className="absolute -top-2.5 left-7 text-[9px] tracking-[0.22em] uppercase font-sans bg-ink text-canvas px-2.5 py-1 rounded-full">
                  Most chosen
                </span>
              )}
              <div className="font-sans font-semibold text-sm mb-1">
                {t.name}
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-serif text-4xl tracking-tight">
                  {t.price}
                </span>
                <span className="text-xs text-ink-muted font-sans">/ month</span>
              </div>
              <div className="text-xs text-ink-muted font-sans mb-6">
                {t.profiles}
              </div>
              <ul className="space-y-2.5 text-sm">
                {t.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-ink-muted font-sans"
                  >
                    <span className="mt-1.5 size-1 rounded-full bg-ink-muted/80 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 text-center text-xs text-ink-dim font-sans"
        >
          Enterprise pricing available for custom profile limits + dedicated
          infrastructure.
        </motion.p>
      </div>
    </section>
  );
}
