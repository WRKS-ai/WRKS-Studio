"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Tone = "violet" | "sky" | "emerald";

const PHASES: {
  num: string;
  title: string;
  body: string;
  statusLabel: string;
  statusTone: Tone;
}[] = [
  {
    num: "01",
    title: "Tell her",
    body: "Say what you need — voice, text, whatever's faster. Nova already knows your brand, your customers, your last winner. So you don't have to explain the basics every time.",
    statusLabel: "Listening",
    statusTone: "violet",
  },
  {
    num: "02",
    title: "She shows you",
    body: "Within seconds you see the page, the post, the ad — exactly how it'll look published. Tap anything to tweak before it ships. Nothing goes live without your sign-off.",
    statusLabel: "Drafting",
    statusTone: "sky",
  },
  {
    num: "03",
    title: "She ships",
    body: "Approve, and Nova publishes to your domain, your Instagram, your CRM — all the connections you've set up. Five deliverables in under five seconds.",
    statusLabel: "Shipped",
    statusTone: "emerald",
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
    if (next !== activeIndex) setActiveIndex(next);
  });

  return (
    <section
      id="how"
      className="relative"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Static centered heading — sits outside the sticky scrollytelling */}
      <div className="relative pt-32 sm:pt-40 px-6 lg:px-8">
        <div className="max-w-screen-xl mx-auto text-center">
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
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[1.02] max-w-3xl mx-auto text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            Three steps.{" "}
            <span className="italic text-ink-muted">Five seconds.</span>
          </motion.h2>
        </div>
      </div>

      {/* Sticky scrollytelling container — phase list left, mockup right */}
      <div ref={containerRef} className="relative" style={{ height: "280vh" }}>
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="w-full px-6 lg:px-8">
            <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-center">
              <LeftRail activeIndex={activeIndex} />
              <RightMockup activeIndex={activeIndex} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Left rail — sticky list of phases; active one expands its body
 * ============================================================ */

function LeftRail({ activeIndex }: { activeIndex: number }) {
  return (
    <div>
      <div className="space-y-0">
        {PHASES.map((phase, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={phase.num}
              className="border-t py-5 sm:py-6 transition-colors duration-500"
              style={{
                borderColor: isActive
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="text-[10px] tracking-[0.24em] uppercase font-mono mb-2 transition-colors duration-500"
                style={{
                  color: isActive
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.25)",
                }}
              >
                Phase {phase.num}
              </div>
              <h3
                className="font-serif font-medium tracking-tight transition-all duration-500"
                style={{
                  fontSize: isActive
                    ? "clamp(1.75rem, 2.6vw, 2.25rem)"
                    : "1.4rem",
                  color: isActive
                    ? "rgb(243 244 246)"
                    : "rgba(255,255,255,0.35)",
                  lineHeight: 1.1,
                }}
              >
                {phase.title}
              </h3>
              <motion.div
                initial={false}
                animate={
                  isActive
                    ? { opacity: 1, height: "auto", marginTop: 14 }
                    : { opacity: 0, height: 0, marginTop: 0 }
                }
                transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="font-sans text-ink-muted text-[clamp(0.95rem,1.3vw,1.05rem)] leading-[1.6] max-w-md">
                  {phase.body}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * Right mockup — cross-fades between phase mockups on activeIndex change
 * ============================================================ */

function RightMockup({ activeIndex }: { activeIndex: number }) {
  const active = PHASES[activeIndex] ?? PHASES[0]!;
  const view =
    activeIndex === 0 ? <ListeningView /> : activeIndex === 1 ? <DraftingView /> : <ShippedView />;

  return (
    <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: "4 / 3" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.985 }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="absolute inset-0"
        >
          <AppFrame statusLabel={active.statusLabel} statusTone={active.statusTone}>
            {view}
          </AppFrame>
        </motion.div>
      </AnimatePresence>
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
  const promptWords =
    "Build a Black Friday landing page with three social posts and a discount code.".split(
      " ",
    );

  return (
    <div className="relative size-full flex flex-col">
      {/* Conversation */}
      <div className="space-y-3 mb-auto">
        {/* Nova greeting — fades in first */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-start gap-2"
        >
          <div className="size-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[8px] font-mono font-bold text-white shrink-0">
            N
          </div>
          <div className="text-[10px] font-sans text-white/55 leading-snug pt-0.5">
            Hey Hannah — what are we building today?
          </div>
        </motion.div>

        {/* User prompt — word-by-word reveal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.2 }}
          className="flex items-start gap-2 justify-end"
        >
          <div className="text-[10px] font-serif italic text-white/85 leading-snug pt-0.5 max-w-[78%] text-right">
            <span>&ldquo;</span>
            {promptWords.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: 0.7 + i * 0.07,
                  ease: "easeOut",
                }}
                className="inline-block"
              >
                {word}
                {i < promptWords.length - 1 ? " " : ""}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 + promptWords.length * 0.07 + 0.1 }}
            >
              &rdquo;
            </motion.span>
          </div>
          <div
            className="size-5 rounded-full bg-emerald-400/15 flex items-center justify-center text-[8px] font-mono font-bold text-emerald-200 shrink-0"
            style={{ border: "1px solid rgba(52,211,153,0.4)" }}
          >
            H
          </div>
        </motion.div>
      </div>

      {/* Voice input bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
        className="mt-3 rounded-xl p-2.5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(167,139,250,0.25)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            className="size-7 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #a78bfa, #6366f1)",
            }}
            animate={{
              boxShadow: [
                "0 0 12px rgba(167,139,250,0.45)",
                "0 0 24px rgba(167,139,250,0.65)",
                "0 0 12px rgba(167,139,250,0.45)",
              ],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
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
          </motion.div>
          <span className="text-[10px] font-mono text-violet-200/85">
            Listening
            <BlinkingDots />
          </span>
          <TickingTimer className="ml-auto text-[9px] font-mono text-white/35" />
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
      </motion.div>
    </div>
  );
}

function BlinkingDots() {
  return (
    <span className="inline-flex ml-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

function TickingTimer({ className }: { className?: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s + 0.1 > 5.9 ? 0 : s + 0.1));
    }, 100);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={className}>
      0:{seconds.toFixed(1).padStart(3, "0")}
    </span>
  );
}

/* ============================================================
 * Phase 02 — Drafting: deliverable previews tiled
 * ============================================================ */

function DraftingView() {
  const tiles = [
    {
      tone: "rose" as const,
      label: "Instagram",
      status: "Drafted",
      gradient: "linear-gradient(135deg, #f472b6 0%, #d946ef 45%, #f59e0b 100%)",
    },
    {
      tone: "sky" as const,
      label: "Website",
      status: "Ready",
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    },
    {
      tone: "violet" as const,
      label: "Discount",
      status: "Approved",
      code: "HANNAH20",
    },
    {
      tone: "amber" as const,
      label: "Ad creative",
      status: "A/B",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    },
  ];

  return (
    <div className="relative size-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <DraftingCounter />
        <div className="flex items-center gap-1 text-[8px] font-mono text-sky-300/80">
          <span className="size-1 rounded-full bg-sky-400 animate-pulse" />
          live
        </div>
      </div>
      {/* 4-tile grid — staggered entrance */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.55,
              delay: 0.2 + i * 0.18,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="relative"
          >
            <DraftTile {...tile} entranceDelay={0.2 + i * 0.18} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DraftingCounter() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    let elapsed = 0;
    const id = setInterval(() => {
      elapsed += 0.1;
      if (elapsed > 2.1) {
        clearInterval(id);
        setSeconds(2.1);
        return;
      }
      setSeconds(elapsed);
    }, 100);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-[9px] font-mono text-white/55">
      Drafting 4 deliverables · {seconds.toFixed(1)}s
    </div>
  );
}

function DraftTile({
  tone,
  label,
  status,
  gradient,
  code,
  entranceDelay = 0,
}: {
  tone: "rose" | "sky" | "violet" | "amber";
  label: string;
  status: string;
  gradient?: string;
  code?: string;
  entranceDelay?: number;
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
      className="relative rounded-lg overflow-hidden bg-black/40 p-2 flex flex-col h-full"
      style={{ border: `1px solid ${ringClass}` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[7px] tracking-[0.22em] uppercase ${labelToneClass} font-sans font-medium`}>
          {label}
        </span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: entranceDelay + 0.45, duration: 0.3 }}
          className="text-[7px] tracking-[0.18em] uppercase text-emerald-300/85 font-sans flex items-center gap-0.5"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: entranceDelay + 0.45, type: "spring", stiffness: 400, damping: 18 }}
            className="size-1 rounded-full bg-emerald-400 inline-block"
          />
          {status}
        </motion.span>
      </div>
      {code ? (
        <div
          className="font-mono font-bold text-white text-[15px] tracking-[0.18em] py-2 rounded-md flex-1 flex items-center justify-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #a78bfa, #6366f1)",
            textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          {/* Shimmer sweep */}
          <motion.span
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
            }}
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              duration: 1.4,
              delay: entranceDelay + 0.3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 2.5,
            }}
          />
          {/* Typed code */}
          <span className="relative">
            {code.split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: entranceDelay + 0.15 + i * 0.04 }}
                className="inline-block"
              >
                {ch}
              </motion.span>
            ))}
          </span>
        </div>
      ) : (
        <div
          className="flex-1 rounded-md relative overflow-hidden"
          style={{ background: gradient }}
        >
          {/* Subtle scan-line shimmer */}
          <motion.span
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
            }}
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              duration: 1.6,
              delay: entranceDelay + 0.3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 2.8,
            }}
          />
        </div>
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
          Shipped to <ShippedChannelCounter total={6} /> channels in 3.2s
        </div>
        <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-300/85">
          <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
          all live
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 flex-1">
        {channels.map((c, i) => (
          <ChannelRow key={c.name} channel={c} delay={0.15 + i * 0.13} />
        ))}
      </div>
    </div>
  );
}

function ShippedChannelCounter({ total }: { total: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v += 1;
      if (v >= total) {
        clearInterval(id);
        setCount(total);
        return;
      }
      setCount(v);
    }, 180);
    return () => clearInterval(id);
  }, [total]);
  return <span className="font-mono not-italic text-emerald-300/90">{count}</span>;
}

function ChannelRow({
  channel,
  delay = 0,
}: {
  channel: { name: string; out: string; tone: "rose" | "sky" | "violet" | "amber" | "emerald" };
  delay?: number;
}) {
  const dotClass = {
    rose: "bg-rose-400",
    sky: "bg-sky-400",
    violet: "bg-violet-400",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
  }[channel.tone];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className="rounded-md px-2.5 py-2 bg-white/[0.02] flex items-center gap-2 relative overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Brief emerald "just landed" pulse */}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(52,211,153,0.18)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.7, delay: delay + 0.3, ease: "easeOut" }}
      />
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay, type: "spring", stiffness: 380, damping: 20 }}
        className={`size-2 rounded-full ${dotClass} relative`}
      />
      <div className="flex-1 min-w-0 relative">
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
        className="relative"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: delay + 0.25, ease: [0.2, 0.7, 0.2, 1] }}
        />
      </svg>
    </motion.div>
  );
}
