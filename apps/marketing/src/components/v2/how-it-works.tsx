"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const PHASES = [
  {
    num: "01",
    title: "Tell her",
    body: "Say what you need — voice, text, whatever's faster. Nova already knows your brand, your customers, your last winner. So you don't have to explain the basics every time.",
    statusLabel: "Listening",
  },
  {
    num: "02",
    title: "She shows you",
    body: "Within seconds you see the page, the post, the ad — exactly how it'll look published. Tap anything to tweak before it ships. Nothing goes live without your sign-off.",
    statusLabel: "Drafting",
  },
  {
    num: "03",
    title: "She ships",
    body: "Approve, and Nova publishes to your domain, your Instagram, your CRM — all the connections you've set up. Five deliverables in under five seconds.",
    statusLabel: "Shipped",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative py-32 sm:py-40 px-6 lg:px-8"
    >
      <div className="relative max-w-screen-xl mx-auto">
        <div className="mb-20 sm:mb-28 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-6"
          >
            <span className="size-1 rounded-full bg-white/40" />
            How it works
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[1.02] text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            Three steps. Five seconds.
          </motion.h2>
        </div>

        <div className="space-y-24 sm:space-y-32">
          {PHASES.map((phase, i) => (
            <PhaseRow key={phase.num} phase={phase} index={i} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Phase row — Framer-style: restrained text left, product UI right
 * ============================================================ */

function PhaseRow({
  phase,
  index,
  reverse,
}: {
  phase: (typeof PHASES)[number];
  index: number;
  reverse: boolean;
}) {
  const visual =
    phase.num === "01" ? (
      <AppFrame statusLabel={phase.statusLabel} statusTone="violet">
        <ListeningView />
      </AppFrame>
    ) : phase.num === "02" ? (
      <AppFrame statusLabel={phase.statusLabel} statusTone="sky">
        <DraftingView />
      </AppFrame>
    ) : (
      <AppFrame statusLabel={phase.statusLabel} statusTone="emerald">
        <ShippedView />
      </AppFrame>
    );

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-[0.85fr_1.4fr] gap-12 lg:gap-20 items-center ${
        reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      {/* Text */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.24em] uppercase text-ink-dim font-mono mb-5"
        >
          Phase {phase.num}
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.2, 0.7, 0.2, 1] }}
          className="font-serif font-medium tracking-tight leading-[1.05] text-[clamp(2rem,3.6vw,2.75rem)] mb-5"
        >
          {phase.title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="font-sans text-ink-muted text-[clamp(1rem,1.5vw,1.15rem)] leading-[1.6] max-w-md"
        >
          {phase.body}
        </motion.p>
      </div>

      {/* Visual */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.95, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 }}
      >
        {visual}
      </motion.div>
    </div>
  );
}

/* ============================================================
 * AppFrame — shared product-UI shell used by all three phases
 * ============================================================ */

function AppFrame({
  children,
  statusLabel,
  statusTone,
}: {
  children: ReactNode;
  statusLabel: string;
  statusTone: "violet" | "sky" | "emerald";
}) {
  const toneClass =
    statusTone === "violet"
      ? "bg-violet-400 text-violet-200"
      : statusTone === "sky"
        ? "bg-sky-400 text-sky-200"
        : "bg-emerald-400 text-emerald-200";

  return (
    <div
      className="relative aspect-[4/3] rounded-2xl overflow-hidden"
      style={{
        background: "#0a0a12",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow:
          "0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-9 flex items-center px-3 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="size-2 rounded-full bg-rose-400/60" />
        <span className="size-2 rounded-full bg-amber-400/60" />
        <span className="size-2 rounded-full bg-emerald-400/60" />
        <div className="ml-3 text-[10px] font-mono text-white/45 truncate">
          nova / hannahs-hair
        </div>
        <div className={`ml-auto text-[9px] tracking-[0.22em] uppercase ${toneClass.split(" ")[1]} font-sans font-medium flex items-center gap-1.5`}>
          <span className={`size-1 rounded-full ${toneClass.split(" ")[0]} animate-pulse`} />
          {statusLabel}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main canvas */}
      <div className="absolute top-9 left-[26%] sm:left-[22%] right-0 bottom-0 p-4 sm:p-5">{children}</div>
    </div>
  );
}

function Sidebar() {
  const projects = [
    { name: "Hannah's Hair", active: true },
    { name: "Black Friday push", active: false },
    { name: "Spring promo", active: false },
    { name: "Weekly post", active: false },
  ];
  return (
    <div
      className="absolute top-9 left-0 bottom-0 w-[26%] sm:w-[22%] p-2.5"
      style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="text-[8px] tracking-[0.24em] uppercase text-white/35 mb-2.5 px-1.5 font-mono">
        Projects
      </div>
      <div className="space-y-1">
        {projects.map((p) => (
          <div
            key={p.name}
            className={`px-2 py-1.5 rounded-md text-[9px] truncate font-sans ${
              p.active
                ? "bg-violet-500/12 text-white"
                : "text-white/45 hover:text-white/65"
            }`}
            style={
              p.active
                ? { border: "1px solid rgba(167,139,250,0.25)" }
                : undefined
            }
          >
            <span className={`inline-block size-1.5 rounded-full mr-1.5 align-middle ${p.active ? "bg-violet-400" : "bg-white/20"}`} />
            {p.name}
          </div>
        ))}
      </div>
      <div className="mt-5 text-[8px] tracking-[0.24em] uppercase text-white/35 mb-2.5 px-1.5 font-mono">
        Brand memory
      </div>
      <div className="space-y-1 px-1.5">
        {["Voice · warm/witty", "Audience · Toronto", "Last winner · 12.4%"].map(
          (m) => (
            <div key={m} className="text-[8px] text-white/40 truncate font-mono">
              · {m}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Phase 01 — Listening: prompt + voice input
 * ============================================================ */

function ListeningView() {
  return (
    <div className="relative size-full flex flex-col">
      {/* Conversation */}
      <div className="space-y-3 mb-auto">
        <div className="flex items-start gap-2">
          <div className="size-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[8px] font-mono font-bold text-white shrink-0">
            N
          </div>
          <div className="text-[10px] font-sans text-white/55 leading-snug pt-0.5">
            Hey Hannah — what are we building today?
          </div>
        </div>
        <div className="flex items-start gap-2 justify-end">
          <div className="text-[10px] font-serif italic text-white/85 leading-snug pt-0.5 max-w-[78%] text-right">
            &ldquo;Build a Black Friday landing page with three social posts and
            a discount code.&rdquo;
          </div>
          <div className="size-5 rounded-full bg-emerald-400/15 flex items-center justify-center text-[8px] font-mono font-bold text-emerald-200 shrink-0" style={{ border: "1px solid rgba(52,211,153,0.4)" }}>
            H
          </div>
        </div>
      </div>

      {/* Voice input bar */}
      <div
        className="mt-3 rounded-xl p-2.5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(167,139,250,0.25)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="size-7 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #a78bfa, #6366f1)",
              boxShadow: "0 0 16px rgba(167,139,250,0.45)",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="3" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <path d="M12 18v3" />
            </svg>
          </div>
          <span className="text-[10px] font-mono text-violet-200/85">
            Listening…
          </span>
          <span className="ml-auto text-[9px] font-mono text-white/35">0:02</span>
        </div>
        {/* Waveform */}
        <div className="flex items-end justify-center gap-[2px] h-6">
          {Array.from({ length: 36 }).map((_, i) => (
            <motion.span
              key={i}
              className="block w-[2px] rounded-full"
              style={{
                background: "linear-gradient(to top, #a78bfa, #38bdf8)",
              }}
              animate={{ height: ["18%", "85%", "30%", "65%", "20%"] }}
              transition={{
                duration: 1.4 + (i % 5) * 0.1,
                repeat: Infinity,
                delay: (i % 9) * 0.05,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Phase 02 — Drafting: deliverable previews tiled
 * ============================================================ */

function DraftingView() {
  return (
    <div className="relative size-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[9px] font-mono text-white/55">
          Drafting 4 deliverables · 2.1s
        </div>
        <div className="flex items-center gap-1 text-[8px] font-mono text-sky-300/80">
          <span className="size-1 rounded-full bg-sky-400 animate-pulse" />
          live
        </div>
      </div>
      {/* 4-tile grid */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        <DraftTile
          tone="rose"
          label="Instagram"
          status="Drafted"
          gradient="linear-gradient(135deg, #f472b6 0%, #d946ef 45%, #f59e0b 100%)"
        />
        <DraftTile
          tone="sky"
          label="Website"
          status="Ready"
          gradient="linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)"
        />
        <DraftTile
          tone="violet"
          label="Discount"
          status="Approved"
          code="HANNAH20"
        />
        <DraftTile
          tone="amber"
          label="Ad creative"
          status="A/B"
          gradient="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
        />
      </div>
    </div>
  );
}

function DraftTile({
  tone,
  label,
  status,
  gradient,
  code,
}: {
  tone: "rose" | "sky" | "violet" | "amber";
  label: string;
  status: string;
  gradient?: string;
  code?: string;
}) {
  const ringClass =
    tone === "rose"
      ? "rgba(244,114,182,0.35)"
      : tone === "sky"
        ? "rgba(56,189,248,0.35)"
        : tone === "violet"
          ? "rgba(167,139,250,0.35)"
          : "rgba(252,211,77,0.35)";

  const labelToneClass =
    tone === "rose"
      ? "text-rose-200"
      : tone === "sky"
        ? "text-sky-200"
        : tone === "violet"
          ? "text-violet-200"
          : "text-amber-200";

  return (
    <div
      className="relative rounded-lg overflow-hidden bg-black/40 p-2 flex flex-col"
      style={{ border: `1px solid ${ringClass}` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[7px] tracking-[0.22em] uppercase ${labelToneClass} font-sans font-medium`}>
          {label}
        </span>
        <span className="text-[7px] tracking-[0.18em] uppercase text-emerald-300/85 font-sans">
          {status}
        </span>
      </div>
      {code ? (
        <div
          className="font-mono font-bold text-white text-[15px] tracking-[0.18em] text-center py-2 rounded-md flex-1 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #a78bfa, #6366f1)",
            textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          {code}
        </div>
      ) : (
        <div
          className="flex-1 rounded-md"
          style={{ background: gradient }}
        />
      )}
    </div>
  );
}

/* ============================================================
 * Phase 03 — Shipped: deployment dashboard
 * ============================================================ */

function ShippedView() {
  const channels = [
    { name: "Instagram", out: "hannahshair", tone: "rose" as const },
    { name: "Website", out: "hannahshair.com", tone: "sky" as const },
    { name: "Stripe", out: "HANNAH20", tone: "violet" as const },
    { name: "Email list", out: "1,247 subscribers", tone: "amber" as const },
    { name: "CRM", out: "HubSpot", tone: "emerald" as const },
    { name: "Booking", out: "Cal.com", tone: "rose" as const },
  ];

  return (
    <div className="relative size-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="font-serif italic text-white/85 text-[12px] leading-snug">
          Shipped to 6 channels in 3.2s
        </div>
        <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-300/85">
          <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
          all live
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 flex-1">
        {channels.map((c) => (
          <ChannelRow key={c.name} channel={c} />
        ))}
      </div>
    </div>
  );
}

function ChannelRow({
  channel,
}: {
  channel: { name: string; out: string; tone: "rose" | "sky" | "violet" | "amber" | "emerald" };
}) {
  const dotClass = {
    rose: "bg-rose-400",
    sky: "bg-sky-400",
    violet: "bg-violet-400",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
  }[channel.tone];

  return (
    <div
      className="rounded-md px-2.5 py-2 bg-white/[0.02] flex items-center gap-2"
      style={{ border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <span className={`size-2 rounded-full ${dotClass}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-sans font-semibold text-white truncate">
          {channel.name}
        </div>
        <div className="text-[8px] font-mono text-white/45 truncate">
          {channel.out}
        </div>
      </div>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgb(52 211 153)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}
