"use client";

import { motion } from "motion/react";

type Stat = { value: string; label: string };

const STATS: Stat[] = [
  { value: "1,247", label: "Operators" },
  { value: "4.2s", label: "Avg build" },
  { value: "6", label: "Channels" },
];

type ShippedItem = {
  tone: string;
  kind: string;
  detail: string;
  time: string;
};

const SHIPPED_TODAY: ShippedItem[] = [
  {
    tone: "from-rose-400 to-fuchsia-500",
    kind: "Instagram post",
    detail: "@hannahshair · March promo",
    time: "2m ago",
  },
  {
    tone: "from-sky-400 to-indigo-500",
    kind: "Landing page",
    detail: "meadowcafe.co/black-friday",
    time: "8m ago",
  },
  {
    tone: "from-emerald-400 to-teal-500",
    kind: "Email blast",
    detail: "studio.olive · Spring drop",
    time: "14m ago",
  },
];

export function BrandPanel({
  quote,
  attribution,
  location,
}: {
  quote: string;
  attribution: string;
  location: string;
}) {
  return (
    <div className="relative h-full overflow-hidden">
      {/* Ambient gradient + grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-1/3 size-[720px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(167,139,250,0.18) 0%, rgba(56,189,248,0.10) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at 30% 50%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 30% 50%, black 0%, transparent 75%)",
        }}
      />

      {/* Anchored content block — vertically aligned with form on the right */}
      <div className="relative flex h-full items-center px-10 lg:px-14 xl:px-16 py-12">
        <div className="w-full max-w-[520px] space-y-10">
          {/* Eyebrow + live feed */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center justify-between mb-4"
            >
              <div className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.24em] uppercase text-ink-dim font-sans font-medium">
                <span className="size-1 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />
                Shipped today
              </div>
              <div className="text-[10px] font-mono text-ink-dim tracking-wider flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                live
              </div>
            </motion.div>

            <div className="space-y-1.5">
              {SHIPPED_TODAY.map((s, i) => (
                <ShippedRow key={s.detail} {...s} index={i} />
              ))}
            </div>
          </div>

          {/* Testimonial quote */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="pt-2"
          >
            <blockquote className="font-serif tracking-tight leading-[1.12] text-[clamp(1.5rem,2vw,1.875rem)] text-ink">
              <span className="text-ink-muted">&ldquo;</span>
              {quote}
              <span className="text-ink-muted">&rdquo;</span>
            </blockquote>

            <div className="mt-4 flex items-center gap-2.5">
              <div
                className="size-7 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500"
                style={{
                  boxShadow:
                    "inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 1.5px 3px rgba(255,255,255,0.18)",
                }}
              />
              <div className="leading-tight">
                <div className="text-[13px] font-sans font-semibold text-ink">
                  {attribution}
                </div>
                <div className="text-[11px] font-mono text-ink-dim mt-0.5">
                  {location}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-3 gap-6 pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24 }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={i === 0 ? "" : "pl-6"}
                style={
                  i === 0
                    ? {}
                    : { borderLeft: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                <div className="font-serif text-[clamp(1.25rem,1.8vw,1.5rem)] text-ink leading-none tracking-tight">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-sans">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ShippedRow({
  tone,
  kind,
  detail,
  time,
  index,
}: ShippedItem & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.2 + index * 0.08,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
      style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className={`size-6 rounded-full bg-gradient-to-br ${tone} shrink-0`}
        style={{
          boxShadow:
            "inset 0 -2px 5px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.18)",
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] text-ink font-sans font-semibold truncate">
          {kind}
        </div>
        <div className="text-[10.5px] font-mono text-ink-dim truncate">
          {detail}
        </div>
      </div>
      <div className="text-[10px] font-mono text-ink-dim shrink-0 tabular-nums">
        {time}
      </div>
    </motion.div>
  );
}
