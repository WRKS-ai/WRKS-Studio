"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
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
            body="Every approved decision becomes a node. The agent's understanding of your business compounds quietly in the background."
            visual={<MemoryViz />}
            accent="amber"
          />
          <DetailCard
            index={1}
            label="Personality"
            title="Pick its voice"
            body="Five distinct personalities, each with their own voice and rhythm. Choose one. Live with it. It adapts to how you speak."
            visual={<PersonalityViz />}
            accent="rose"
          />
          <DetailCard
            index={2}
            label="Trust gates"
            title="It asks first"
            body="Anything irreversible — live publishing, CRM forwards, payments — waits for your explicit yes. The gate is the agent's manners."
            visual={<TrustViz />}
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

/* -------------------- Visual: Memory — constellation -------------------- */

type Node = {
  id: string;
  x: number; // 0–100 (percent)
  y: number;
  size: number;
  label?: string;
  recent?: boolean;
};

function MemoryViz() {
  const nodes: Node[] = useMemo(
    () => [
      { id: "core", x: 50, y: 50, size: 14 },
      { id: "n1", x: 22, y: 28, size: 4, label: "voice", recent: true },
      { id: "n2", x: 78, y: 22, size: 5, label: "promo · Mar", recent: true },
      { id: "n3", x: 16, y: 60, size: 4, label: "offers" },
      { id: "n4", x: 85, y: 55, size: 4.5, label: "audience" },
      { id: "n5", x: 32, y: 78, size: 3.5 },
      { id: "n6", x: 68, y: 80, size: 4, label: "brand · less formal" },
      { id: "n7", x: 12, y: 38, size: 3 },
      { id: "n8", x: 90, y: 35, size: 3, recent: true },
      { id: "n9", x: 40, y: 18, size: 3.5 },
      { id: "n10", x: 60, y: 14, size: 3 },
      { id: "n11", x: 50, y: 88, size: 3 },
      { id: "n12", x: 28, y: 52, size: 2.8 },
      { id: "n13", x: 72, y: 48, size: 2.8 },
    ],
    [],
  );

  const links: [string, string][] = [
    ["core", "n1"],
    ["core", "n2"],
    ["core", "n3"],
    ["core", "n4"],
    ["core", "n5"],
    ["core", "n6"],
    ["n1", "n7"],
    ["n2", "n8"],
    ["n2", "n9"],
    ["n1", "n9"],
    ["n4", "n13"],
    ["n3", "n12"],
    ["n6", "n11"],
    ["core", "n12"],
    ["core", "n13"],
  ];

  const get = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.10), transparent 60%)",
        }}
      />
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
      >
        {/* Links */}
        {links.map(([a, b], i) => {
          const A = get(a);
          const B = get(b);
          return (
            <motion.line
              key={`l-${i}`}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              stroke="rgba(251,191,36,0.25)"
              strokeWidth="0.18"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 0.15 + i * 0.04 }}
            />
          );
        })}
        {/* Pulsing nodes */}
        {nodes.map((n, i) => (
          <g key={n.id}>
            {n.id === "core" && (
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={n.size + 4}
                fill="rgba(251,191,36,0.1)"
                animate={{ r: [n.size + 2, n.size + 6, n.size + 2] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={n.size / 4}
              fill={n.id === "core" ? "#fde68a" : "rgba(251,191,36,0.85)"}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.3 + i * 0.06,
                type: "spring",
                stiffness: 200,
              }}
            />
            {n.recent && (
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={n.size / 2}
                fill="none"
                stroke="rgba(251,191,36,0.6)"
                strokeWidth="0.2"
                animate={{
                  r: [n.size / 4, n.size, n.size / 4],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.3,
                }}
              />
            )}
          </g>
        ))}
      </svg>
      {/* Floating labels */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingLabel x="78%" y="14%" delay={0.5}>
          March promo
        </FloatingLabel>
        <FloatingLabel x="6%" y="56%" delay={0.7}>
          Brand voice
        </FloatingLabel>
        <FloatingLabel x="62%" y="86%" delay={0.9}>
          Less formal
        </FloatingLabel>
      </div>
      {/* Footer counter */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-canvas/70 backdrop-blur border border-amber-400/30"
      >
        <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[9px] font-mono text-amber-200">
          47 connections · growing
        </span>
      </motion.div>
    </div>
  );
}

function FloatingLabel({
  x,
  y,
  delay,
  children,
}: {
  x: string;
  y: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="absolute text-[8px] tracking-[0.18em] uppercase text-amber-200/80 font-sans whitespace-nowrap"
      style={{ left: x, top: y, transform: "translate(-50%, 0)" }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------- Visual: Personality — character orbs -------------- */

function PersonalityViz() {
  const personas = [
    {
      name: "Nova",
      tone: "Calm · direct",
      from: "#f9a8d4",
      to: "#a855f7",
      active: true,
    },
    {
      name: "Echo",
      tone: "Warm · curious",
      from: "#fde68a",
      to: "#f97316",
    },
    {
      name: "Sage",
      tone: "Editorial · slow",
      from: "#bef264",
      to: "#16a34a",
    },
    {
      name: "Atlas",
      tone: "Bold · decisive",
      from: "#7dd3fc",
      to: "#0284c7",
    },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(244,114,182,0.10), transparent 65%)",
        }}
      />
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-3 p-5">
        {personas.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.15 + i * 0.1,
              duration: 0.55,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="relative flex flex-col items-center justify-center"
          >
            {/* Orb */}
            <div className="relative">
              {p.active && (
                <motion.div
                  className="absolute -inset-3 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${p.from}33, transparent 70%)`,
                  }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
              <motion.div
                className={cn(
                  "relative size-[58px] rounded-full shadow-2xl",
                  p.active && "ring-2 ring-rose-400/60 ring-offset-2 ring-offset-canvas",
                )}
                style={{
                  background: `radial-gradient(circle at 32% 30%, ${p.from}, ${p.to} 70%, rgba(0,0,0,0.5) 100%)`,
                  boxShadow: p.active
                    ? `0 10px 30px -10px ${p.from}aa`
                    : "0 6px 20px -8px rgba(0,0,0,0.6)",
                }}
                animate={
                  p.active
                    ? { y: [0, -2, 0] }
                    : undefined
                }
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* highlight */}
                <span
                  className="absolute size-2.5 rounded-full bg-white/80 top-2.5 left-2.5"
                  style={{ filter: "blur(1.5px)" }}
                />
              </motion.div>
            </div>
            <div className="mt-2 text-center">
              <div
                className={cn(
                  "text-[11px] font-sans font-semibold leading-none",
                  p.active ? "text-ink" : "text-ink-muted",
                )}
              >
                {p.name}
              </div>
              <div
                className={cn(
                  "text-[8px] font-mono mt-1",
                  p.active ? "text-rose-300/90" : "text-ink-dim",
                )}
              >
                {p.tone}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* "Selected" pill bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-canvas/70 backdrop-blur border border-rose-400/30"
      >
        <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
        <span className="text-[9px] font-mono text-rose-200">
          Nova · selected
        </span>
      </motion.div>
    </div>
  );
}

/* -------------------- Visual: Trust gates — approval flow -------------- */

function TrustViz() {
  const steps = [
    {
      label: "You said",
      sublabel: "Schedule a March promo post",
      tone: "neutral",
    },
    {
      label: "Plan ready",
      sublabel: "3 deliverables · 1 irreversible",
      tone: "neutral",
    },
    {
      label: "Awaiting you",
      sublabel: "Approve or adjust",
      tone: "amber",
    },
    {
      label: "Shipped",
      sublabel: "Posted at 9:00",
      tone: "emerald",
    },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.08), transparent 65%)",
        }}
      />
      <div className="absolute inset-0 p-5 flex">
        {/* Vertical track */}
        <div className="relative w-1.5 mr-4 ml-2 my-2">
          <div className="absolute inset-0 rounded-full bg-line" />
          <motion.div
            className="absolute top-0 left-0 right-0 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-emerald-400"
            initial={{ height: "0%" }}
            whileInView={{ height: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
          />
        </div>
        {/* Steps */}
        <div className="flex-1 flex flex-col justify-between py-1.5">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.18, duration: 0.5 }}
              className="relative flex items-start gap-3"
            >
              {/* Marker */}
              <div className="-ml-[34px] mt-0.5 relative">
                <span
                  className={cn(
                    "size-3 rounded-full border-2 flex items-center justify-center",
                    s.tone === "amber"
                      ? "border-amber-400 bg-amber-400/20"
                      : s.tone === "emerald"
                        ? "border-emerald-400 bg-emerald-400"
                        : "border-line-bright bg-canvas",
                  )}
                >
                  {s.tone === "emerald" && (
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-canvas"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {s.tone === "amber" && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-amber-400"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-[10px] tracking-[0.18em] uppercase font-sans font-medium",
                    s.tone === "amber"
                      ? "text-amber-300"
                      : s.tone === "emerald"
                        ? "text-emerald-300"
                        : "text-ink-muted",
                  )}
                >
                  {s.label}
                </div>
                <div className="text-[10px] font-sans text-ink mt-0.5 leading-tight">
                  {s.sublabel}
                </div>
                {s.tone === "amber" && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.4, duration: 0.4 }}
                    className="mt-1.5 flex gap-1.5"
                  >
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      className="h-5 px-2 rounded-full bg-emerald-400 text-emerald-950 text-[9px] font-sans font-semibold flex items-center gap-1"
                    >
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </motion.button>
                    <button className="h-5 px-2 rounded-full border border-line text-[9px] font-sans text-ink-muted">
                      Adjust
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-canvas/70 backdrop-blur border border-emerald-400/30 whitespace-nowrap"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" />
        <span className="text-[9px] font-mono text-emerald-200">
          Nothing ships without you
        </span>
      </motion.div>
    </div>
  );
}
