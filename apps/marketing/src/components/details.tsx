"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export function Details() {
  return (
    <section className="py-32 px-6 lg:px-8 border-t border-line relative overflow-hidden">
      <div className="max-w-screen-xl mx-auto relative">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans mb-5"
        >
          The details
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight max-w-4xl"
        >
          The beauty
          <br />
          <span className="italic text-ink-muted">
            is in the details.
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mt-7 text-base sm:text-lg text-ink-muted max-w-xl leading-relaxed"
        >
          Three small things that quietly make WRKS feel like a colleague —
          not a tool.
        </motion.p>

        <div className="mt-20 grid md:grid-cols-3 gap-5">
          <DetailCard
            index={0}
            label="Memory"
            title="It remembers everything"
            body="Every decision you approve refines the agent's understanding of your business — voice, audience, what works."
            visual={<MemoryViz />}
            accent="amber"
          />
          <DetailCard
            index={1}
            label="Personality"
            title="Pick its voice"
            body="Five distinct personalities, real voices. The agent adapts to how you talk and gets sharper over time."
            visual={<VoiceViz />}
            accent="rose"
          />
          <DetailCard
            index={2}
            label="Trust gates"
            title="It asks first"
            body="Anything irreversible — live publishing, CRM forwards, payments — waits for your explicit yes. Always."
            visual={<ApprovalViz />}
            accent="emerald"
          />
        </div>
      </div>
    </section>
  );
}

const ACCENT_RING = {
  amber: "ring-amber-400/15",
  rose: "ring-rose-400/15",
  emerald: "ring-emerald-400/15",
} as const;

function DetailCard({
  index,
  label,
  title,
  body,
  visual,
  accent,
}: {
  index: number;
  label: string;
  title: string;
  body: string;
  visual: React.ReactNode;
  accent: keyof typeof ACCENT_RING;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className={cn(
        "group relative border border-line rounded-3xl bg-panel/40 hover:bg-panel hover:border-line-bright transition-all duration-500 overflow-hidden ring-1",
        ACCENT_RING[accent],
      )}
    >
      <div className="aspect-[5/4] relative overflow-hidden border-b border-line bg-canvas/40">
        {visual}
      </div>
      <div className="p-6 sm:p-7">
        <div className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans mb-3">
          {label}
        </div>
        <h3 className="font-serif text-2xl leading-tight tracking-tight mb-3">
          {title}
        </h3>
        <p className="text-sm text-ink-muted leading-relaxed max-w-[34ch]">
          {body}
        </p>
      </div>
    </motion.div>
  );
}

/* -------------------- Visual: Memory -------------------- */

function MemoryViz() {
  const entries = [
    { date: "Mar 14", text: "Hero copy · variant A · 12.4% CVR", state: "kept" },
    { date: "Mar 12", text: "Friday latte post · scheduled", state: "kept" },
    { date: "Mar 08", text: "Black Friday banner · adjusted", state: "edit" },
    { date: "Feb 28", text: "Brand voice · less formal", state: "kept" },
  ];
  return (
    <div className="absolute inset-0 p-5 flex flex-col">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.06), transparent 60%)",
        }}
      />
      <div className="relative flex items-center justify-between mb-3">
        <div className="text-[9px] tracking-[0.22em] uppercase text-amber-300 font-sans font-medium flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          Memory · live
        </div>
        <span className="text-[9px] font-mono text-amber-300/70">
          47 entries
        </span>
      </div>
      <div className="relative flex-1 space-y-1.5 overflow-hidden">
        {entries.map((e, i) => (
          <motion.div
            key={e.date}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.2 + i * 0.08,
              duration: 0.45,
              ease: "easeOut",
            }}
            className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas/60 px-2.5 py-1.5"
          >
            <span className="text-[9px] font-mono text-ink-dim w-12 shrink-0">
              {e.date}
            </span>
            <span className="text-[10px] font-sans text-ink flex-1 truncate">
              {e.text}
            </span>
            <span
              className={cn(
                "text-[8px] tracking-[0.18em] uppercase font-sans font-medium",
                e.state === "kept" ? "text-emerald-400/90" : "text-amber-400/90",
              )}
            >
              {e.state === "kept" ? "Kept" : "Edited"}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="relative mt-3 flex items-center gap-2 text-[9px] tracking-[0.18em] uppercase text-ink-dim font-sans">
        <span className="flex-1 h-px bg-line" />
        <span>Updating · just now</span>
        <span className="flex-1 h-px bg-line" />
      </div>
    </div>
  );
}

/* -------------------- Visual: Voice / Personality -------------------- */

function VoiceViz() {
  const personas = [
    { name: "Nova", tone: "Calm · direct", active: true },
    { name: "Echo", tone: "Warm · curious" },
    { name: "Sage", tone: "Editorial · slow" },
    { name: "Atlas", tone: "Bold · decisive" },
  ];
  return (
    <div className="absolute inset-0 p-5">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(244,114,182,0.07), transparent 60%)",
        }}
      />
      <div className="relative flex items-center justify-between mb-4">
        <div className="text-[9px] tracking-[0.22em] uppercase text-rose-300 font-sans font-medium flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
          Choose your agent
        </div>
        <span className="text-[9px] font-mono text-rose-300/70">5 voices</span>
      </div>
      <div className="relative grid grid-cols-2 gap-2">
        {personas.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.2 + i * 0.08,
              duration: 0.45,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className={cn(
              "rounded-xl p-2.5 flex items-center gap-2 border transition-colors",
              p.active
                ? "border-rose-400/50 bg-rose-400/[0.07]"
                : "border-line bg-canvas/60",
            )}
          >
            <span className="relative size-7 rounded-full bg-gradient-to-br from-white/95 via-white/40 to-white/5 flex items-center justify-center overflow-hidden shrink-0">
              <span className="absolute inset-1 rounded-full bg-gradient-to-br from-white/90 to-white/10" />
              <span className="absolute size-1.5 rounded-full bg-white top-1.5 left-1.5 blur-[1px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-sans font-semibold text-ink leading-none">
                {p.name}
              </div>
              <div className="text-[8px] font-sans text-ink-muted mt-0.5 truncate">
                {p.tone}
              </div>
            </div>
            {p.active ? (
              <span className="size-2.5 rounded-full bg-rose-400 ring-2 ring-rose-400/30 shrink-0" />
            ) : (
              <span className="size-2.5 rounded-full border border-line shrink-0" />
            )}
          </motion.div>
        ))}
      </div>
      {/* Waveform mini */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative mt-4 rounded-xl border border-line bg-canvas/60 px-3 py-2 flex items-center gap-2"
      >
        <span className="text-[9px] font-sans text-ink-muted shrink-0">
          Nova
        </span>
        <div className="flex items-end gap-[2px] h-4 flex-1">
          {[6, 10, 7, 13, 9, 14, 8, 11, 6, 12, 9, 7, 10, 8, 6].map((h, i) => (
            <motion.span
              key={i}
              animate={{ scaleY: [1, 0.55 + (i % 4) * 0.12, 1] }}
              transition={{
                duration: 1 + (i % 3) * 0.25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.05,
              }}
              className="w-[2px] origin-bottom rounded-full bg-gradient-to-t from-rose-400 to-rose-200"
              style={{ height: `${h * 6}%` }}
            />
          ))}
        </div>
        <span className="text-[9px] font-mono text-rose-300/70 shrink-0">
          0:02
        </span>
      </motion.div>
    </div>
  );
}

/* -------------------- Visual: Approval gate -------------------- */

function ApprovalViz() {
  return (
    <div className="absolute inset-0 p-5">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06), transparent 60%)",
        }}
      />
      <div className="relative flex items-center justify-between mb-3">
        <div className="text-[9px] tracking-[0.22em] uppercase text-emerald-300 font-sans font-medium flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          About to publish
        </div>
        <span className="text-[9px] font-mono text-emerald-300/70">
          Irreversible
        </span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative rounded-xl border border-emerald-400/30 bg-emerald-400/[0.04] p-3 mb-3"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div className="size-9 rounded-lg bg-gradient-to-br from-rose-400 via-fuchsia-400 to-amber-300 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-sans font-semibold text-ink leading-tight">
              Instagram post · @hannahshair
            </div>
            <div className="text-[9px] font-mono text-ink-muted mt-0.5">
              hannahshair.com / pubs/3
            </div>
          </div>
        </div>
        <p className="text-[10px] font-serif italic text-ink-muted leading-snug">
          &ldquo;New looks this season. 20% off through March.&rdquo;
        </p>
      </motion.div>
      <div className="relative flex gap-2">
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          className="flex-1 h-9 rounded-full bg-emerald-400 text-emerald-950 text-[11px] font-sans font-semibold flex items-center justify-center gap-1.5"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
          Approve & publish
        </motion.button>
        <motion.button
          initial={{ opacity: 0, x: 8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="h-9 px-3 rounded-full border border-line text-ink text-[11px] font-sans"
        >
          Adjust
        </motion.button>
      </div>
      <div className="relative mt-3 flex items-center justify-between text-[9px] tracking-[0.18em] uppercase text-ink-dim font-sans">
        <span>No auto-publish</span>
        <span>·</span>
        <span>You decide</span>
      </div>
    </div>
  );
}
