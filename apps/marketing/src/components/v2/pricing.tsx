"use client";

import { motion } from "motion/react";
import { SIGN_UP_URL } from "@/lib/urls";
import { Button } from "./button";

type Tier = {
  name: string;
  price: string;
  billing: string;
  blurb: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$97",
    billing: "per month",
    blurb: "One business. Founding cohort pricing locked in.",
    features: [
      "1 business profile",
      "5 deliverable types",
      "All 6 channels",
      "Brand memory & voice",
      "Email support",
    ],
    cta: "Start with Starter",
  },
  {
    name: "Growth",
    price: "$197",
    billing: "per month",
    blurb: "For owners running two brands or side projects.",
    features: [
      "2 business profiles",
      "Everything in Starter",
      "Priority queue",
      "Higher media quotas",
      "Connection support",
    ],
    cta: "Pick Growth",
  },
  {
    name: "Pro",
    price: "$497",
    billing: "per month",
    blurb: "The sweet spot. Most founding cohort lands here.",
    features: [
      "5 business profiles",
      "Everything in Growth",
      "Custom brand framework tuning",
      "Faster previews",
      "Priority human support",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$997",
    billing: "per month",
    blurb: "For agencies and operators running client roosters.",
    features: [
      "15 business profiles",
      "Everything in Pro",
      "White-label staging links",
      "Team seats",
      "Dedicated onboarding",
    ],
    cta: "Talk to us",
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative py-[60px] sm:py-[140px] px-6 lg:px-8"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="relative max-w-screen-xl mx-auto">
        <div className="text-center mb-20 sm:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-6"
          >
            <span className="size-1 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />
            Pricing
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[1.02] max-w-3xl mx-auto text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            One price.{" "}
            <span className="italic text-ink-muted">No credits.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 max-w-xl mx-auto text-ink-muted text-[clamp(0.95rem,1.3vw,1.05rem)] leading-[1.6]"
          >
            Pick the tier by how many businesses you run — not by how
            much you use Nova. Founding cohort rates are locked in for
            life.
          </motion.p>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {TIERS.map((tier, i) => (
            <TierCard key={tier.name} tier={tier} delay={i * 0.08} />
          ))}
        </div>

        {/* Enterprise row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 }}
          className="mt-6 rounded-2xl px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] tracking-[0.24em] uppercase text-ink-dim font-mono">
                Enterprise
              </span>
              <span className="text-[10px] tracking-[0.18em] uppercase text-emerald-300/85 font-sans">
                · custom
              </span>
            </div>
            <h3 className="font-serif font-medium text-ink text-[clamp(1.5rem,2.4vw,1.875rem)] tracking-tight leading-tight">
              For 16+ businesses or your own deployment.
            </h3>
            <p className="mt-1.5 text-ink-muted text-[14px] max-w-xl">
              Dedicated infrastructure, custom frameworks, SSO, audit
              logs, and a real human you can call.
            </p>
          </div>
          <Button variant="primary" href="mailto:contact@slightwrks.com">
            Talk to founders
          </Button>
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 text-center text-[12px] text-ink-dim font-mono tracking-[0.06em]"
        >
          All tiers · unlimited usage · no rate limits · 14-day refund.
        </motion.div>
      </div>
    </section>
  );
}

function TierCard({ tier, delay }: { tier: Tier; delay: number }) {
  const isHighlighted = !!tier.highlighted;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay }}
      className="relative rounded-2xl p-6 lg:p-7 flex flex-col h-full"
      style={{
        background: isHighlighted
          ? "linear-gradient(180deg, rgba(167,139,250,0.10) 0%, rgba(56,189,248,0.04) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)",
        border: isHighlighted
          ? "1px solid rgba(167,139,250,0.35)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isHighlighted
          ? "0 0 0 1px rgba(167,139,250,0.15), 0 20px 60px -30px rgba(167,139,250,0.45)"
          : "none",
      }}
    >
      {/* Recommended ribbon */}
      {isHighlighted && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <div
            className="px-2.5 py-1 rounded-full text-[9px] tracking-[0.24em] uppercase font-mono font-medium text-white"
            style={{
              background:
                "linear-gradient(90deg, #a78bfa 0%, #38bdf8 100%)",
              boxShadow: "0 4px 14px rgba(167,139,250,0.4)",
            }}
          >
            Recommended
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div className="text-[10px] tracking-[0.26em] uppercase text-ink-dim font-mono mb-3">
          {tier.name}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-serif font-medium tracking-tight text-[clamp(2rem,3vw,2.5rem)]"
            style={{
              color: isHighlighted ? "rgb(245 247 255)" : "rgb(229 231 235)",
            }}
          >
            {tier.price}
          </span>
          <span className="text-ink-dim text-[11px] tracking-tight">
            {tier.billing}
          </span>
        </div>
        <p className="mt-3 text-ink-muted text-[13px] leading-snug min-h-[2.6em]">
          {tier.blurb}
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {tier.features.map((feat) => (
          <li
            key={feat}
            className="flex items-start gap-2 text-[13px] text-ink-muted font-sans leading-snug"
          >
            <Check highlighted={isHighlighted} />
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={SIGN_UP_URL}
        className="block w-full text-center rounded-lg py-2.5 text-[13px] font-sans font-medium tracking-tight transition-all duration-200"
        style={
          isHighlighted
            ? {
                background:
                  "linear-gradient(90deg, #a78bfa 0%, #38bdf8 100%)",
                color: "white",
                boxShadow: "0 8px 24px -10px rgba(167,139,250,0.55)",
              }
            : {
                background: "rgba(255,255,255,0.05)",
                color: "rgb(229 231 235)",
                border: "1px solid rgba(255,255,255,0.08)",
              }
        }
      >
        {tier.cta}
      </a>
    </motion.div>
  );
}

function Check({ highlighted }: { highlighted: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 mt-[3px]"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={highlighted ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.04)"}
      />
      <path
        d="M8 12.5l2.5 2.5L16 9"
        stroke={highlighted ? "#c4b5fd" : "rgba(255,255,255,0.5)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
