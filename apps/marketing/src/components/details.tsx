"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
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
          <span className="italic text-ink-muted">is in the details.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mt-7 text-base sm:text-lg text-ink-muted max-w-xl leading-relaxed"
        >
          Three small things that quietly make WRKS feel like a colleague — not
          a tool.
        </motion.p>

        <div className="mt-20 grid md:grid-cols-3 gap-5">
          <DetailCard
            index={0}
            label="Memory"
            title="It remembers everything"
            body="Every approved decision becomes a memory. Filter, edit, watch the agent's understanding compound over time."
            visual={<MemoryScene />}
            accent="amber"
          />
          <DetailCard
            index={1}
            label="Personality"
            title="Pick its voice"
            body="Five distinct personalities, each with their own voice and rhythm. Choose one. Live with it."
            visual={<PersonalityScene />}
            accent="rose"
          />
          <DetailCard
            index={2}
            label="Trust gates"
            title="It asks first"
            body="Anything irreversible — live publishing, CRM forwards, payments — waits for your explicit yes."
            visual={<TrustScene />}
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

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ============================================================
 * 1. Memory — dashboard with rows being added live
 * ============================================================ */

type MStep = "idle" | "row-add" | "to-row" | "filter-applied";

const ALL_MEMORIES = [
  { date: "Mar 14", text: "Hero copy · variant A · 12.4% CVR", tag: "won", tone: "emerald" as const },
  { date: "Mar 12", text: "Friday latte post · scheduled", tag: "kept", tone: "ink" as const },
  { date: "Mar 08", text: "Black Friday banner · adjusted", tag: "edited", tone: "amber" as const },
  { date: "Feb 28", text: "Brand voice · less formal", tag: "kept", tone: "ink" as const },
  { date: "Feb 22", text: "Hairstyle taxonomy · 18 terms", tag: "added", tone: "amber" as const },
];

export function MemoryScene() {
  const [step, setStep] = useState<MStep>("idle");
  const [count, setCount] = useState(2);
  const [activeRow, setActiveRow] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        setStep("idle"); setCount(2); setActiveRow(null);
        await wait(700);
        if (cancelled) return;
        // Fill rows one by one
        setStep("row-add");
        for (let n = 3; n <= ALL_MEMORIES.length; n++) {
          if (cancelled) return;
          setCount(n);
          await wait(420);
        }
        await wait(400);
        if (cancelled) return;
        // Highlight a row
        setStep("to-row");
        setActiveRow(0);
        await wait(900);
        if (cancelled) return;
        // Apply a filter
        setStep("filter-applied");
        await wait(2200);
        setActiveRow(null);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  const cursor = (() => {
    switch (step) {
      case "idle": return { left: "85%", top: "85%" };
      case "row-add": return { left: "50%", top: "55%" };
      case "to-row": return { left: "70%", top: "32%" };
      case "filter-applied": return { left: "22%", top: "20%" };
    }
  })();

  return (
    <div className="relative size-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 30% 30%, rgba(251,191,36,0.16), transparent 60%)",
      }}/>
      {/* Top toolbar */}
      <div className="absolute top-0 left-0 right-0 h-7 border-b border-line bg-canvas/70 backdrop-blur-md flex items-center px-3 gap-2 z-10">
        <span className="text-[9px] font-mono text-amber-300/80">Memory · @hannahshair</span>
        <span className="ml-auto text-[9px] font-mono text-ink-muted tabular-nums">{count} entries</span>
      </div>
      {/* Filter row */}
      <div className="absolute top-7 left-0 right-0 h-7 border-b border-line bg-panel/40 flex items-center px-3 gap-1.5">
        {[
          { label: "All", on: step !== "filter-applied" },
          { label: "Won", on: step === "filter-applied" },
          { label: "Edited", on: false },
          { label: "Voice", on: false },
        ].map((f, i) => (
          <div key={i} className="relative">
            {step === "filter-applied" && i === 1 && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="pointer-events-none absolute -inset-1 rounded-full border border-dashed border-amber-400/60"/>
            )}
            <span className={`text-[8px] tracking-widest uppercase font-sans h-4 px-1.5 rounded-full flex items-center ${
              f.on ? "bg-amber-400/20 text-amber-200 border border-amber-400/40" : "border border-line text-ink-muted"
            }`}>
              {f.label}
            </span>
          </div>
        ))}
      </div>
      {/* Rows */}
      <div className="absolute top-14 bottom-9 left-0 right-0 overflow-hidden p-2 space-y-1.5">
        {ALL_MEMORIES.map((m, i) => {
          const visible = i < count;
          const isFiltered = step === "filter-applied" && m.tag !== "won";
          const isActive = activeRow === i;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                opacity: !visible ? 0 : isFiltered ? 0.25 : 1,
                x: visible ? 0 : -12,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn(
                "relative flex items-center gap-2 rounded-md border bg-canvas/60 px-2 py-1.5",
                isActive ? "border-amber-400/60 ring-1 ring-amber-400/20 bg-amber-400/[0.04]" : "border-line",
              )}
            >
              <span className="text-[8px] font-mono text-ink-dim w-10 shrink-0 tabular-nums">{m.date}</span>
              <span className="text-[9px] font-sans text-ink flex-1 truncate">{m.text}</span>
              <span className={cn(
                "text-[7px] tracking-[0.18em] uppercase font-sans font-medium px-1 py-0.5 rounded",
                m.tone === "emerald" && "text-emerald-300 bg-emerald-400/10",
                m.tone === "amber" && "text-amber-300 bg-amber-400/10",
                m.tone === "ink" && "text-ink-muted bg-line/40",
              )}>{m.tag}</span>
            </motion.div>
          );
        })}
      </div>
      {/* Bottom updating indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-7 border-t border-line bg-canvas/70 flex items-center justify-center gap-1.5">
        <span className="size-1 rounded-full bg-amber-400 animate-pulse"/>
        <span className="text-[8px] tracking-[0.22em] uppercase text-amber-300/80 font-sans">Updating · just now</span>
      </div>
      {/* Nova cursor */}
      <motion.div
        initial={false}
        animate={cursor}
        transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1] }}
        className="absolute pointer-events-none z-30 flex items-start gap-1"
        style={{ transform: "translate(-2px, -2px)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-amber-400 drop-shadow">
          <path d="M5 3l14 8-7 1-3 7L5 3z" fill="currentColor" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
        </svg>
        <span className="px-1.5 py-px rounded-md bg-amber-500 text-white text-[8px] font-sans font-semibold leading-3 shadow-md">Nova</span>
      </motion.div>
    </div>
  );
}

/* ============================================================
 * 2. Personality — agent picker with cursor cycling, voice plays
 * ============================================================ */

const PERSONAS = [
  { name: "Nova", tone: "Calm · direct", from: "#f9a8d4", to: "#a855f7" },
  { name: "Echo", tone: "Warm · curious", from: "#fde68a", to: "#f97316" },
  { name: "Sage", tone: "Editorial · slow", from: "#bef264", to: "#16a34a" },
  { name: "Atlas", tone: "Bold · decisive", from: "#7dd3fc", to: "#0284c7" },
];

export function PersonalityScene() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        for (let i = 0; i < PERSONAS.length; i++) {
          if (cancelled) return;
          setActive(i);
          setPlaying(false);
          await wait(600);
          if (cancelled) return;
          setPlaying(true);
          await wait(1600);
        }
        if (cancelled) return;
        setActive(0);
        setPlaying(true);
        await wait(2400);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  // Cursor target: hover the active persona
  const cursorTarget = (() => {
    const positions = [
      { left: "28%", top: "32%" }, // Nova top-left
      { left: "72%", top: "32%" }, // Echo top-right
      { left: "28%", top: "70%" }, // Sage bottom-left
      { left: "72%", top: "70%" }, // Atlas bottom-right
    ];
    return positions[active] ?? positions[0];
  })();

  const cur = PERSONAS[active]!;

  return (
    <div className="relative size-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 40%, rgba(244,114,182,0.16), transparent 60%)",
      }}/>
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 h-7 border-b border-line bg-canvas/70 backdrop-blur-md flex items-center px-3 gap-2 z-10">
        <span className="text-[9px] font-mono text-rose-300/80">Agent · Choose voice</span>
        <span className="ml-auto text-[9px] font-mono text-ink-muted">5 personalities</span>
      </div>
      {/* 2x2 grid of personas */}
      <div className="absolute inset-x-3 top-9 bottom-12 grid grid-cols-2 grid-rows-2 gap-2">
        {PERSONAS.map((p, i) => {
          const isActive = i === active;
          return (
            <motion.div
              key={p.name}
              animate={{
                scale: isActive ? 1.02 : 1,
                opacity: isActive ? 1 : 0.6,
              }}
              transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
              className={cn(
                "relative rounded-xl border flex flex-col items-center justify-center gap-1",
                isActive ? "border-rose-400/50 bg-rose-400/[0.05] ring-1 ring-rose-400/20" : "border-line bg-canvas/40",
              )}
            >
              {/* Orb */}
              <div className="relative">
                {isActive && (
                  <motion.div
                    className="absolute -inset-3 rounded-full"
                    style={{ background: `radial-gradient(circle, ${p.from}40, transparent 70%)` }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <div
                  className="relative size-9 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 32% 30%, ${p.from}, ${p.to} 70%, rgba(0,0,0,0.5) 100%)`,
                    boxShadow: isActive
                      ? `0 6px 20px -6px ${p.from}cc`
                      : "0 4px 12px -4px rgba(0,0,0,0.6)",
                  }}
                >
                  <span className="absolute size-1.5 rounded-full bg-white/80 top-1.5 left-1.5" style={{ filter: "blur(1px)" }}/>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-[9px] font-sans font-semibold leading-none ${isActive ? "text-white" : "text-ink-muted"}`}>{p.name}</div>
                <div className={`text-[7px] font-mono mt-0.5 ${isActive ? "text-rose-300" : "text-ink-dim"}`}>{p.tone}</div>
              </div>
              {/* Selection ring */}
              {isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 size-3 rounded-full bg-rose-400 ring-2 ring-rose-400/30 flex items-center justify-center"
                >
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-canvas">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
      {/* Voice waveform footer (live for active persona) */}
      <div className="absolute bottom-0 left-0 right-0 h-11 border-t border-line bg-panel/40 flex items-center px-3 gap-2">
        <div className="size-5 rounded-full" style={{ background: `radial-gradient(circle at 32% 30%, ${cur.from}, ${cur.to})` }}/>
        <span className="text-[9px] font-sans font-semibold text-ink">{cur.name}</span>
        <div className="flex-1 h-5 flex items-end gap-[2px] px-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.span
              key={i}
              animate={playing ? { scaleY: [1, 0.4 + (i % 5) * 0.12, 1] } : { scaleY: 0.3 }}
              transition={{
                duration: 1.2 + (i % 3) * 0.2,
                repeat: playing ? Infinity : 0,
                ease: "easeInOut",
                delay: i * 0.04,
              }}
              className="w-[2px] origin-bottom rounded-full bg-gradient-to-t from-rose-400 to-rose-200"
              style={{ height: `${30 + (i * 7) % 70}%` }}
            />
          ))}
        </div>
        <span className="text-[8px] font-mono text-rose-300/80 tabular-nums w-8 text-right">0:0{(active + 1) % 9}</span>
      </div>
      {/* Nova cursor */}
      <motion.div
        initial={false}
        animate={cursorTarget}
        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        className="absolute pointer-events-none z-30 flex items-start gap-1"
        style={{ transform: "translate(-2px, -2px)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-rose-400 drop-shadow">
          <path d="M5 3l14 8-7 1-3 7L5 3z" fill="currentColor" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
        </svg>
        <span className="px-1.5 py-px rounded-md bg-rose-500 text-white text-[8px] font-sans font-semibold leading-3 shadow-md">You</span>
      </motion.div>
    </div>
  );
}

/* ============================================================
 * 3. Trust gates — approval modal, user clicks Approve, action ships
 * ============================================================ */

type TStep = "idle" | "modal-open" | "reviewing" | "to-approve" | "approved" | "shipped";

export function TrustScene() {
  const [step, setStep] = useState<TStep>("idle");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        setStep("idle"); await wait(700);
        if (cancelled) return;
        setStep("modal-open"); await wait(800);
        if (cancelled) return;
        setStep("reviewing"); await wait(900);
        if (cancelled) return;
        setStep("to-approve"); await wait(700);
        if (cancelled) return;
        setStep("approved"); await wait(900);
        if (cancelled) return;
        setStep("shipped"); await wait(2400);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  const modalOn = step !== "idle";
  const approvedNow = step === "approved" || step === "shipped";
  const shipped = step === "shipped";
  const approveHover = step === "to-approve";

  const cursor = (() => {
    switch (step) {
      case "idle": return { left: "85%", top: "82%" };
      case "modal-open":
      case "reviewing": return { left: "30%", top: "50%" };
      case "to-approve":
      case "approved": return { left: "38%", top: "78%" };
      case "shipped": return { left: "55%", top: "30%" };
    }
  })();

  return (
    <div className="relative size-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.12), transparent 65%)",
      }}/>
      {/* Backdrop card showing the agent's plan */}
      <div className="absolute inset-3 rounded-md border border-line bg-panel/30 p-3 flex flex-col gap-2 opacity-70">
        <div className="text-[8px] tracking-[0.22em] uppercase text-ink-dim font-sans">Pending action</div>
        <div className="text-[10px] font-sans text-ink-muted leading-snug">
          Instagram post · @hannahshair · Friday 9:00
        </div>
        <div className="h-px bg-line"/>
        <div className="flex-1"/>
      </div>
      {/* Approval modal */}
      <AnimatePresence>
        {modalOn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute inset-x-3 top-6 bottom-6 rounded-xl border border-emerald-400/40 bg-canvas/95 backdrop-blur shadow-2xl shadow-emerald-400/10 flex flex-col overflow-hidden"
          >
            {/* Modal header */}
            <div className="h-7 border-b border-line bg-panel/60 flex items-center px-3">
              <span className="text-[8px] tracking-[0.22em] uppercase text-emerald-300 font-sans font-medium flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                Approve to publish
              </span>
              <span className="ml-auto text-ink-muted text-[10px]">×</span>
            </div>
            {/* Body */}
            <div className="flex-1 p-3 flex flex-col gap-2">
              <div className="text-[8px] tracking-[0.18em] uppercase text-ink-muted font-sans">Going live</div>
              <div className="flex items-center gap-2 rounded-md border border-line bg-canvas/60 p-2">
                <div className="size-9 rounded shrink-0" style={{
                  background: "linear-gradient(135deg, #f472b6 0%, #d946ef 50%, #f59e0b 100%)",
                }}/>
                <div className="min-w-0">
                  <div className="text-[10px] font-sans font-semibold text-ink leading-tight">Instagram · @hannahshair</div>
                  <div className="text-[8px] font-serif italic text-ink-muted leading-tight mt-0.5 truncate">
                    &ldquo;New looks this season.&rdquo;
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] tracking-[0.18em] uppercase font-sans">
                <span className="text-emerald-300 flex items-center gap-1">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                  Reversible
                </span>
                <span className="text-ink-dim">·</span>
                <span className="text-ink-muted">Fri · 9:00 am</span>
              </div>
            </div>
            {/* CTAs */}
            <div className="border-t border-line p-2 flex items-center gap-1.5">
              <div className="relative flex-1">
                <motion.div initial={false} animate={{ opacity: approveHover && !approvedNow ? 1 : 0 }} transition={{ duration: 0.2 }}
                  className="pointer-events-none absolute -inset-1 rounded-full border border-dashed border-emerald-300/60"/>
                <motion.div
                  animate={{
                    scale: approveHover && !approvedNow ? 1.03 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "h-7 rounded-full text-[10px] font-sans font-semibold flex items-center justify-center gap-1.5 transition-colors",
                    approvedNow ? "bg-emerald-300 text-emerald-950" : "bg-emerald-400 text-emerald-950",
                  )}
                >
                  {approvedNow ? (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                      Approved
                    </motion.span>
                  ) : (
                    "Approve & publish"
                  )}
                </motion.div>
              </div>
              <span className="h-7 px-2.5 rounded-full border border-line text-[9px] font-sans text-ink-muted flex items-center">Adjust</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Shipped chip rises */}
      <AnimatePresence>
        {shipped && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/50 backdrop-blur-md text-[9px] tracking-[0.18em] uppercase text-emerald-200 font-sans font-medium shadow-xl"
          >
            <span className="size-1.5 rounded-full bg-emerald-400"/>
            Posted · 9:00 am
          </motion.div>
        )}
      </AnimatePresence>
      {/* Nova cursor */}
      <motion.div
        initial={false}
        animate={cursor}
        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        className="absolute pointer-events-none z-30 flex items-start gap-1"
        style={{ transform: "translate(-2px, -2px)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-emerald-400 drop-shadow">
          <path d="M5 3l14 8-7 1-3 7L5 3z" fill="currentColor" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
        </svg>
        <span className="px-1.5 py-px rounded-md bg-emerald-500 text-white text-[8px] font-sans font-semibold leading-3 shadow-md">You</span>
      </motion.div>
    </div>
  );
}
