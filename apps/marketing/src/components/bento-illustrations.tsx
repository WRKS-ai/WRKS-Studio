"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

/* 1. Websites & funnels — literal funnel of visitors converting ----------- */

export function WebsiteFunnel() {
  const visitors = useMemo(
    () => Array.from({ length: 24 }, (_, i) => i),
    [],
  );
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-gradient-to-b from-sky-950/30 to-canvas">
      <svg
        viewBox="0 0 200 130"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
      >
        {/* Funnel walls */}
        <motion.path
          d="M 20 14 L 180 14 L 130 116 L 70 116 Z"
          fill="rgba(56,189,248,0.03)"
          stroke="rgba(56,189,248,0.45)"
          strokeWidth="0.4"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        {/* Stage dividers */}
        <line
          x1="32"
          y1="46"
          x2="168"
          y2="46"
          stroke="rgba(56,189,248,0.2)"
          strokeWidth="0.3"
          strokeDasharray="1 1.6"
        />
        <line
          x1="48"
          y1="78"
          x2="152"
          y2="78"
          stroke="rgba(56,189,248,0.2)"
          strokeWidth="0.3"
          strokeDasharray="1 1.6"
        />
      </svg>
      {/* Stage labels — left side */}
      <div className="absolute inset-0 flex flex-col">
        <Row y={9} count="1,284" label="Visits" tone="muted" />
        <Row y={31} count="612" label="Engaged" tone="muted" />
        <Row y={57} count="148" label="Booked" tone="emerald" />
      </div>
      {/* Flowing visitor dots */}
      <div className="absolute inset-0 pointer-events-none">
        {visitors.map((i) => (
          <Dot key={i} index={i} />
        ))}
      </div>
      {/* Conversion bottom pill */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/40 backdrop-blur"
      >
        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] tracking-[0.18em] uppercase text-emerald-300 font-sans font-medium">
          11.5% conversion
        </span>
      </motion.div>
    </div>
  );
}

function Row({
  y,
  count,
  label,
  tone,
}: {
  y: number;
  count: string;
  label: string;
  tone: "muted" | "emerald";
}) {
  return (
    <div
      className="absolute left-4 right-4 flex items-baseline justify-between"
      style={{ top: `${y}%` }}
    >
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-[14px] font-mono font-semibold ${
            tone === "emerald" ? "text-emerald-300" : "text-ink"
          }`}
        >
          {count}
        </span>
        <span className="text-[9px] tracking-[0.18em] uppercase text-ink-muted font-sans">
          {label}
        </span>
      </div>
    </div>
  );
}

function Dot({ index }: { index: number }) {
  const lane = index % 6;
  const startX = 30 + lane * 14;
  const delay = (index * 0.25) % 5;
  return (
    <motion.span
      className="absolute size-1.5 rounded-full bg-sky-300"
      style={{ left: `${startX}%`, top: "12%" }}
      animate={{
        y: ["0%", "660%"],
        x: [`0%`, `${(lane - 2.5) * -4}%`],
        opacity: [0, 1, 1, 0.4, 0],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

/* 2. Social — content radiating from a hub --------------------------------- */

export function SocialRadar() {
  const platforms = [
    { name: "INSTAGRAM", angle: -50, color: "#f472b6" },
    { name: "FACEBOOK", angle: 35, color: "#60a5fa" },
    { name: "LINKEDIN", angle: 145, color: "#34d399" },
  ];
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-gradient-to-br from-rose-950/30 via-canvas to-canvas">
      <svg
        viewBox="0 0 200 130"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
      >
        {/* Concentric rings */}
        {[20, 36, 52].map((r, i) => (
          <motion.circle
            key={r}
            cx={100}
            cy={65}
            r={r}
            fill="none"
            stroke="rgba(244,114,182,0.18)"
            strokeWidth="0.3"
            strokeDasharray="0.8 1.5"
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.6 }}
            style={{ transformOrigin: "100px 65px" }}
          />
        ))}
        {/* Spokes */}
        {platforms.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const x = 100 + Math.cos(rad) * 56;
          const y = 65 + Math.sin(rad) * 56;
          return (
            <motion.line
              key={p.name}
              x1={100}
              y1={65}
              x2={x}
              y2={y}
              stroke={p.color}
              strokeWidth="0.4"
              strokeOpacity={0.4}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4 }}
            />
          );
        })}
      </svg>

      {/* Animated post particles traveling outward */}
      {platforms.map((p, i) =>
        Array.from({ length: 3 }).map((_, j) => (
          <Particle key={`${p.name}-${j}`} angle={p.angle} color={p.color} delay={j * 0.6 + i * 0.2} />
        )),
      )}

      {/* Platform end nodes + labels */}
      {platforms.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = 100 + Math.cos(rad) * 56;
        const y = 65 + Math.sin(rad) * 56;
        return (
          <PlatformNode
            key={p.name}
            xPct={(x / 200) * 100}
            yPct={(y / 130) * 100}
            label={p.name}
            color={p.color}
          />
        );
      })}

      {/* Central hub */}
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 18 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
      >
        <div className="relative size-12 rounded-full bg-gradient-to-br from-white/95 via-white/40 to-white/5 shadow-2xl shadow-rose-400/30 flex items-center justify-center overflow-hidden">
          <span className="absolute inset-1 rounded-full bg-gradient-to-br from-white/90 to-white/10" />
          <span className="absolute size-2 rounded-full bg-white top-2 left-2 blur-[1px]" />
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-canvas/70 backdrop-blur border border-rose-400/30"
      >
        <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
        <span className="text-[9px] tracking-[0.18em] uppercase text-rose-200 font-sans font-medium">
          One post · 3 platforms
        </span>
      </motion.div>
    </div>
  );
}

function PlatformNode({
  xPct,
  yPct,
  label,
  color,
}: {
  xPct: number;
  yPct: number;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
    >
      <span
        className="size-2.5 rounded-full border-2"
        style={{ borderColor: color, background: `${color}33` }}
      />
      <span
        className="text-[7px] font-mono tracking-[0.18em]"
        style={{ color: `${color}` }}
      >
        {label}
      </span>
    </motion.div>
  );
}

function Particle({
  angle,
  color,
  delay,
}: {
  angle: number;
  color: string;
  delay: number;
}) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * 110;
  const ty = Math.sin(rad) * 110;
  return (
    <motion.span
      className="absolute left-1/2 top-1/2 size-1 rounded-full"
      style={{ backgroundColor: color }}
      animate={{
        x: [0, tx],
        y: [0, ty],
        opacity: [0, 1, 0.6, 0],
        scale: [0.6, 1, 1, 0.6],
      }}
      transition={{
        duration: 2.4,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

/* 3. Ads — target with three arrows --------------------------------------- */

export function AdTarget() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-gradient-to-br from-amber-950/40 via-canvas to-canvas">
      <svg
        viewBox="0 0 200 130"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="targetGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(251,191,36,0.25)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </radialGradient>
        </defs>
        {/* Bullseye rings */}
        <circle cx={100} cy={65} r={58} fill="url(#targetGrad)" />
        {[58, 44, 30, 16, 6].map((r, i) => (
          <motion.circle
            key={r}
            cx={100}
            cy={65}
            r={r}
            fill="none"
            stroke={
              i === 4
                ? "rgba(251,191,36,0.95)"
                : `rgba(251,191,36,${0.45 - i * 0.07})`
            }
            strokeWidth={i === 4 ? 0.6 : 0.4}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.15 + i * 0.08,
              duration: 0.5,
              ease: "easeOut",
            }}
            style={{ transformOrigin: "100px 65px" }}
          />
        ))}
        {/* Crosshair */}
        <line x1="100" y1="0" x2="100" y2="130" stroke="rgba(251,191,36,0.12)" strokeWidth="0.2" />
        <line x1="0" y1="65" x2="200" y2="65" stroke="rgba(251,191,36,0.12)" strokeWidth="0.2" />

        {/* Arrows */}
        <Arrow x={100} y={65} delay={0.7} color="#fde68a" rotate={-30} />
        <Arrow x={94} y={70} delay={0.9} color="#fbbf24" rotate={20} />
        <Arrow x={110} y={58} delay={1.1} color="#f59e0b" rotate={-15} />
      </svg>
      {/* Labels */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="absolute top-4 left-4 text-[8px] tracking-[0.18em] uppercase text-amber-200/80 font-mono"
      >
        Variant B
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-12 right-6 text-[8px] tracking-[0.18em] uppercase text-amber-300 font-mono font-semibold"
      >
        7.8% CTR ↑
      </motion.div>
      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-canvas/70 backdrop-blur border border-amber-400/30"
      >
        <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[9px] tracking-[0.18em] uppercase text-amber-200 font-sans font-medium">
          Winner found · auto-promoted
        </span>
      </motion.div>
    </div>
  );
}

function Arrow({
  x,
  y,
  delay,
  color,
  rotate,
}: {
  x: number;
  y: number;
  delay: number;
  color: string;
  rotate: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, x: -60, y: -60 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
        <line x1="0" y1="0" x2="-22" y2="-22" stroke={color} strokeWidth="0.6" />
        <polygon points="0,0 -2,-4 -4,-2" fill={color} />
        <line x1="-22" y1="-22" x2="-26" y2="-19" stroke={color} strokeWidth="0.5" />
        <line x1="-22" y1="-22" x2="-19" y2="-26" stroke={color} strokeWidth="0.5" />
      </g>
    </motion.g>
  );
}

/* 4. Copy — typographic ladder (variants evolving) ------------------------- */

export function CopyLadder() {
  const drafts = [
    {
      heading: "Modern hair.",
      italic: "Honest pricing.",
      cvr: "5.8%",
      best: false,
    },
    {
      heading: "Premium cuts",
      italic: "on your schedule",
      cvr: "7.1%",
      best: false,
    },
    {
      heading: "The salon",
      italic: "that knows you",
      cvr: "12.4%",
      best: true,
    },
  ];
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-gradient-to-br from-violet-950/30 via-canvas to-canvas p-5">
      {/* Vertical timeline rail */}
      <div className="absolute left-7 top-7 bottom-12 w-px bg-gradient-to-b from-violet-500/40 via-violet-400/30 to-violet-400" />
      <div className="relative flex flex-col gap-3 mt-1">
        {drafts.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.18, duration: 0.5 }}
            className="relative pl-5"
          >
            <span
              className={`absolute left-0 top-2 size-2 rounded-full ${
                d.best ? "bg-violet-300 ring-2 ring-violet-300/30" : "bg-violet-500/50"
              }`}
            />
            <div className="flex items-baseline justify-between gap-3">
              <div
                className={`font-serif leading-tight tracking-tight ${
                  d.best
                    ? "text-xl text-ink"
                    : "text-sm text-ink-muted/70 line-through decoration-violet-400/30 decoration-1"
                }`}
              >
                {d.heading}{" "}
                <span className="italic">{d.italic}</span>
              </div>
              <div
                className={`shrink-0 text-[10px] font-mono font-semibold ${
                  d.best ? "text-violet-200" : "text-ink-dim"
                }`}
              >
                {d.cvr}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Footer pill */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-canvas/70 backdrop-blur border border-violet-400/30 whitespace-nowrap"
      >
        <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
        <span className="text-[9px] tracking-[0.18em] uppercase text-violet-200 font-sans font-medium">
          Draft 3 won · +2.1× vs draft 1
        </span>
      </motion.div>
    </div>
  );
}

/* 5. Blog — magazine spread typography ------------------------------------- */

export function BlogSpread() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-gradient-to-br from-emerald-950/25 via-canvas to-canvas">
      {/* Page edge */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400/30 to-transparent" />

      <div className="absolute inset-0 p-5 flex flex-col">
        {/* Top meta */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[8px] tracking-[0.22em] uppercase text-emerald-300/80 font-mono">
            Hair care · No. 12
          </span>
          <span className="text-[8px] tracking-[0.18em] uppercase text-ink-dim font-mono">
            Mar 12, 2026
          </span>
        </div>

        {/* Headline w/ drop cap */}
        <div className="flex gap-2 items-start">
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="font-serif text-[56px] leading-none tracking-tight text-emerald-200 -mt-1"
          >
            H
          </motion.span>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-serif text-lg leading-tight tracking-tight text-ink"
          >
            ow often should you trim
            <br />
            <span className="italic text-ink-muted">layered hair?</span>
          </motion.div>
        </div>

        {/* Two-column body */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-3 grid grid-cols-2 gap-3"
        >
          {[0, 1].map((col) => (
            <div key={col} className="space-y-1.5">
              {Array.from({
                length: col === 0 ? 5 : 4,
              }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full bg-ink-muted/30"
                  style={{ width: `${80 + Math.sin(i + col) * 16}%` }}
                />
              ))}
            </div>
          ))}
        </motion.div>

        {/* Bottom inline meta */}
        <div className="mt-auto flex items-center gap-3 text-[8px] tracking-[0.18em] uppercase font-mono">
          <span className="text-emerald-300/90">SEO 94</span>
          <span className="text-ink-dim">·</span>
          <span className="text-ink-muted">1,247 words</span>
          <span className="text-ink-dim">·</span>
          <span className="text-ink-muted">4 min</span>
          <span className="ml-auto text-ink-dim">— page 1 of 3</span>
        </div>
      </div>
    </div>
  );
}
