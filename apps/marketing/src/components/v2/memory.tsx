"use client";

import { motion } from "motion/react";
import { MagicBento, type BentoCard } from "./magic-bento";

const CARDS: BentoCard[] = [
  {
    label: "Memory",
    title: "Remembers what worked",
    description:
      "Every winner stays in your brand memory. Next week she riffs on it.",
    visual: <MemoryVisual />,
  },
  {
    label: "Personality",
    title: "Nova · Echo · Sage · Atlas",
    description:
      "Pick the voice that fits — warm, calm, sharp — or build your own.",
    visual: <PersonalityVisual />,
  },
  {
    label: "Voice",
    title: "Tuned to how you talk",
    description:
      "She studies your writing — captions, emails, reviews — and writes in that register. Not generic AI-speak.",
    visual: <VoiceVisual />,
  },
  {
    label: "Trust gates",
    title: "Approves before shipping",
    description:
      "Nothing goes live without your sign-off. One-tap approve, edit, or send back on your phone.",
    visual: <TrustVisual />,
  },
  {
    label: "Connections",
    title: "Plugs into your stack",
    description:
      "Social, CRM, payments, email — publishes wherever your customers live.",
    visual: <ConnectionsVisual />,
  },
  {
    label: "Updates",
    title: "Smarter weekly",
    description:
      "New frameworks and refined memory ship continuously. Your agent sharpens itself.",
    visual: <UpdatesVisual />,
  },
];

export function Memory() {
  return (
    <section
      id="memory"
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
            textAutoHide={true}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
 * Tile visuals — one per card, fills the dead middle space
 * ============================================================ */

function MemoryVisual() {
  const entries = [
    { tone: "bg-violet-400", text: "12.4% CVR · variant A" },
    { tone: "bg-sky-400", text: "Black Friday · drafted" },
    { tone: "bg-emerald-400", text: "Voice · warm, witty" },
  ];
  return (
    <div className="w-full space-y-1.5">
      {entries.map((e, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span className={`size-1 rounded-full ${e.tone} shrink-0`} />
          <span className="text-[9px] font-mono text-white/70 truncate">
            {e.text}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function PersonalityVisual() {
  const personas = [
    {
      name: "Nova",
      bg: "linear-gradient(135deg, #a78bfa, #6366f1)",
      active: true,
    },
    { name: "Echo", bg: "linear-gradient(135deg, #f472b6, #d946ef)" },
    { name: "Sage", bg: "linear-gradient(135deg, #34d399, #14b8a6)" },
    { name: "Atlas", bg: "linear-gradient(135deg, #fbbf24, #f59e0b)" },
  ];
  return (
    <div className="flex items-center justify-center gap-3 w-full">
      {personas.map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{
            delay: 0.1 + i * 0.08,
            type: "spring",
            stiffness: 350,
            damping: 18,
          }}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className="relative size-9 rounded-full"
            style={{
              background: p.bg,
              boxShadow: p.active
                ? "0 0 18px rgba(167,139,250,0.6), inset 0 -4px 8px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.2)"
                : "inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.18)",
              opacity: p.active ? 1 : 0.55,
            }}
          >
            {p.active && (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: "1.5px solid rgba(255,255,255,0.45)" }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
          <span
            className={`text-[7px] tracking-[0.22em] uppercase font-sans font-medium ${
              p.active ? "text-white/85" : "text-white/40"
            }`}
          >
            {p.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function VoiceVisual() {
  return (
    <div className="w-full flex items-end justify-center gap-[2px] h-12">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span
          key={i}
          className="block w-[2px] rounded-full"
          style={{
            background: "linear-gradient(to top, #a78bfa, #38bdf8)",
          }}
          animate={{ height: ["20%", "85%", "30%", "65%", "20%"] }}
          transition={{
            duration: 1.4 + (i % 5) * 0.12,
            repeat: Infinity,
            delay: (i % 9) * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function TrustVisual() {
  return (
    <div
      className="w-full rounded-lg p-2.5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div
          className="size-4 rounded flex items-center justify-center text-[8px]"
          style={{
            background: "rgba(251,191,36,0.15)",
            border: "1px solid rgba(251,191,36,0.35)",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="rgb(251 191 36)">
            <path d="M12 2L2 22h20L12 2zm0 7v6m0 3v1" stroke="rgb(251 191 36)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-[8px] font-mono text-white/60 truncate">
          Awaiting approval
        </span>
      </div>
      <div className="text-[9px] font-serif italic text-white/80 mb-2 leading-snug truncate">
        &ldquo;March promo · Instagram post&rdquo;
      </div>
      <div className="flex gap-1.5">
        <motion.button
          whileHover={{ scale: 1.04 }}
          className="flex-1 h-5 rounded text-[8px] font-sans font-semibold flex items-center justify-center gap-0.5"
          style={{
            background: "rgba(52,211,153,0.18)",
            color: "rgb(110 231 183)",
            border: "1px solid rgba(52,211,153,0.4)",
          }}
        >
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
          Approve
        </motion.button>
        <button
          className="flex-1 h-5 rounded text-[8px] font-sans text-white/55"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function ConnectionsVisual() {
  const channels = [
    { label: "IG", bg: "linear-gradient(135deg, #f472b6, #d946ef)" },
    { label: "Web", bg: "linear-gradient(135deg, #38bdf8, #6366f1)" },
    { label: "Stripe", bg: "linear-gradient(135deg, #a78bfa, #6366f1)" },
    { label: "Email", bg: "linear-gradient(135deg, #fbbf24, #f59e0b)" },
    { label: "CRM", bg: "linear-gradient(135deg, #34d399, #14b8a6)" },
    { label: "Cal", bg: "linear-gradient(135deg, #f472b6, #ec4899)" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[180px] mx-auto">
      {channels.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{
            delay: 0.1 + i * 0.06,
            type: "spring",
            stiffness: 380,
            damping: 20,
          }}
          className="aspect-square rounded-md flex items-center justify-center text-[7px] tracking-[0.18em] uppercase font-sans font-bold text-white/95"
          style={{
            background: c.bg,
            boxShadow:
              "0 4px 12px -4px rgba(0,0,0,0.45), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          {c.label}
        </motion.div>
      ))}
    </div>
  );
}

function UpdatesVisual() {
  const entries = [
    { v: "v2.3", date: "Today", note: "Better hooks", current: true },
    { v: "v2.2", date: "Mar 14", note: "Voice tuning" },
    { v: "v2.1", date: "Mar 7", note: "Memory v2" },
  ];
  return (
    <div className="w-full space-y-1.5 relative">
      {/* Vertical line */}
      <div
        className="absolute left-[3px] top-1.5 bottom-1.5 w-[1px]"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      {entries.map((e, i) => (
        <motion.div
          key={e.v}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          className="flex items-center gap-2 pl-1.5 relative"
        >
          <span
            className={`size-1.5 rounded-full shrink-0 ${
              e.current ? "bg-emerald-400 animate-pulse" : "bg-white/35"
            } relative z-10`}
          />
          <span className="text-[8px] font-mono text-white/45 shrink-0">
            {e.v}
          </span>
          <span className="text-[8px] text-white/65 truncate">{e.note}</span>
          <span className="ml-auto text-[7px] font-mono text-white/30 shrink-0">
            {e.date}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
