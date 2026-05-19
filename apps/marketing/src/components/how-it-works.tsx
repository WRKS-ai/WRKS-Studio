"use client";

import { AnimatePresence, motion, useScroll } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const PHASES = [
  {
    n: "01",
    title: "Tell it",
    body: "Speak or type. The agent understands your business — your voice, your audience, your offers — because you've built it together over time.",
    accent: "It just listens.",
  },
  {
    n: "02",
    title: "It shows you",
    body: "Before anything goes live, the agent shows what it's about to make. You confirm, redirect, or refine — through conversation, not menus.",
    accent: "Approve or adjust.",
  },
  {
    n: "03",
    title: "It ships",
    body: "Approved work publishes immediately. Posts go live. Pages deploy. The agent remembers the decision and gets sharper for next time.",
    accent: "Real outputs. Real fast.",
  },
] as const;

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (p) => {
      // Map scroll progress through the section to active phase.
      // Heading + intro takes the first ~12% of section height; then
      // phases divide the rest in three roughly equal stretches.
      let next: number;
      if (p < 0.28) next = 0;
      else if (p < 0.62) next = 1;
      else next = 2;
      setActive((prev) => (prev === next ? prev : next));
    });
    return unsub;
  }, [scrollYProgress]);

  return (
    <section
      ref={sectionRef}
      id="how"
      className="relative border-t border-line"
    >
      <div className="max-w-screen-xl mx-auto px-6 lg:px-8 py-24">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans mb-5"
        >
          How it works
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl mb-16"
        >
          A relationship,
          <br />
          <span className="italic text-ink-muted">not a tool.</span>
        </motion.h2>

        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-start">
          {/* Left column — scrollable phase descriptions */}
          <div className="space-y-[55vh] lg:space-y-[40vh] pb-[20vh]">
            {PHASES.map((p, i) => (
              <PhaseBlock
                key={p.n}
                phase={p}
                index={i}
                active={i === active}
              />
            ))}
          </div>

          {/* Right column — sticky animated product mockup */}
          <div className="lg:sticky lg:top-20 h-fit">
            <ProductMockup state={active} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhaseBlock({
  phase,
  index,
  active,
}: {
  phase: (typeof PHASES)[number];
  index: number;
  active: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.35 }}
      animate={{ opacity: active ? 1 : 0.35 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.span
          animate={{
            background: active ? "var(--ink)" : "transparent",
            color: active ? "var(--canvas)" : "var(--ink-muted)",
            borderColor: active ? "var(--ink)" : "var(--line)",
          }}
          transition={{ duration: 0.4 }}
          className="font-mono text-xs px-2.5 py-1 rounded-full border"
        >
          {phase.n}
        </motion.span>
        <motion.span
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="text-[10px] tracking-[0.22em] uppercase text-emerald-400 font-sans font-medium flex items-center gap-1.5"
        >
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Step {index + 1} of 3
        </motion.span>
      </div>
      <h3 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight mb-5">
        {phase.title}
      </h3>
      <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-md mb-4">
        {phase.body}
      </p>
      <div className="text-sm font-sans text-ink italic">{phase.accent}</div>
    </motion.div>
  );
}

/* -------------------- Animated Product Mockup -------------------- */

function ProductMockup({ state }: { state: number }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-white/[0.04] blur-2xl" />
      <div className="relative rounded-[1.75rem] border border-line-bright bg-panel overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/[0.03]">
        {/* Window chrome */}
        <div className="h-9 px-3.5 flex items-center gap-2 border-b border-line bg-canvas/40">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <div className="ml-4 flex-1 h-5 rounded-full bg-canvas border border-line flex items-center px-3 gap-2">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-ink-muted">
              app.wrksstudio.com / Nova
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-dim">
            <span className="size-1 rounded-full bg-ink-dim" />
            online
          </div>
        </div>

        {/* Nova avatar bar */}
        <div className="px-5 py-3.5 flex items-center gap-3 border-b border-line bg-canvas/20">
          <div className="relative size-9 rounded-full bg-gradient-to-br from-white/95 via-white/40 to-white/5 flex items-center justify-center overflow-hidden">
            <span className="absolute inset-1 rounded-full bg-gradient-to-br from-white/90 to-white/10" />
            <span className="absolute size-2 rounded-full bg-white top-2 left-2 blur-[1px]" />
          </div>
          <div>
            <div className="text-[11px] font-sans font-semibold text-ink leading-none">
              Nova
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={state}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-[10px] font-sans text-ink-muted mt-1 flex items-center gap-1.5"
              >
                <span
                  className={cn(
                    "size-1 rounded-full",
                    state === 2
                      ? "bg-emerald-400"
                      : "bg-emerald-400 animate-pulse",
                  )}
                />
                {state === 0
                  ? "listening"
                  : state === 1
                    ? "thinking · 0.8s"
                    : "shipped · ready"}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="ml-auto px-2.5 py-1 rounded-full border border-line text-[9px] font-sans text-ink-muted">
            Hannah&apos;s Hair
          </div>
        </div>

        {/* Stage */}
        <div className="relative h-[420px] sm:h-[440px] lg:h-[460px] overflow-hidden">
          <AnimatePresence mode="wait">
            {state === 0 && <StageTell key="tell" />}
            {state === 1 && <StagePlan key="plan" />}
            {state === 2 && <StageShip key="ship" />}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="px-5 py-3 border-t border-line bg-canvas/30 flex items-center gap-3">
          <button className="size-7 rounded-full border border-line flex items-center justify-center text-ink-muted">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M12 2v10M9 5l3-3 3 3" />
              <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            </svg>
          </button>
          <div className="flex-1 h-9 rounded-full bg-canvas border border-line flex items-center px-4">
            <span className="text-xs font-sans text-ink-dim">
              Press space to talk · or type a command
            </span>
          </div>
          <button className="size-9 rounded-full bg-ink text-canvas flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

const FRAME_VARIANT = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
};

function StageTell() {
  return (
    <motion.div
      variants={FRAME_VARIANT}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute inset-0 overflow-hidden"
    >
      {/* Warm amber tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(251,191,36,0.07), transparent 60%)",
        }}
      />
      <div className="relative h-full p-5 sm:p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans">
            Today · 2:14 pm
          </div>
          <div className="flex items-center gap-1.5 text-[9px] tracking-[0.18em] uppercase text-amber-400 font-sans font-medium">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            Voice input
          </div>
        </div>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] p-4 ring-1 ring-amber-400/10">
          <div className="flex items-center gap-2 text-[9px] tracking-[0.18em] uppercase text-amber-300/90 font-sans mb-3">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            Listening · live
            <span className="ml-auto font-mono text-amber-300/70">0:04</span>
          </div>
          <div className="flex items-end gap-1 h-12">
            {[
              18, 32, 22, 40, 28, 50, 36, 60, 44, 52, 30, 58, 46, 64, 40, 56, 28,
              48, 36, 30, 22, 18, 14, 12, 18, 26, 38, 30,
            ].map((h, i) => (
              <motion.span
                key={i}
                animate={{ scaleY: [1, 0.55 + (i % 5) * 0.1, 1] }}
                transition={{
                  duration: 1.2 + (i % 4) * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.04,
                }}
                className="w-[3px] origin-bottom rounded-full bg-gradient-to-t from-amber-300 to-amber-100"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <TypingPrompt />
        <div className="flex items-center gap-3 mt-1 pl-1 text-[9px] tracking-[0.18em] uppercase text-ink-dim font-sans">
          <span>Phone · iPhone 15</span>
          <span>·</span>
          <span>EN-US</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-emerald-400" />
            Saved to memory
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function TypingPrompt() {
  const full =
    '"I want a 20% promo for March. Social post, banner on my site, discount code for returning customers."';
  const [text, setText] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i > full.length) return clearInterval(id);
      setText(full.slice(0, i));
    }, 28);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="rounded-2xl border border-line bg-canvas/60 p-4">
      <div className="text-[9px] tracking-[0.18em] uppercase text-ink-muted font-sans mb-2">
        Transcribed
      </div>
      <p className="font-serif italic text-ink text-sm sm:text-base leading-snug">
        {text}
        <span className="inline-block w-[2px] h-[1em] align-middle bg-ink ml-0.5 animate-pulse" />
      </p>
    </div>
  );
}

function StagePlan() {
  const items: {
    label: string;
    format: string;
    accent: "rose" | "sky" | "violet";
    image?: string;
    swatch?: string;
  }[] = [
    {
      label: "Instagram post",
      format: "1080 × 1080 · feed",
      accent: "rose",
      image: "/mockups/stylized-portrait.png",
    },
    {
      label: "Website banner",
      format: "Live deploy · hannahshair.com",
      accent: "sky",
      image: "/mockups/salon-interior.png",
    },
    {
      label: "Discount code",
      format: "HANNAH20 · 20% off · returning",
      accent: "violet",
      swatch:
        "linear-gradient(135deg, #8b5cf6 0%, #4338ca 50%, #1e1b4b 100%)",
    },
  ];
  return (
    <motion.div
      variants={FRAME_VARIANT}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute inset-0 overflow-hidden"
    >
      {/* Sky-blue tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.06), transparent 60%)",
        }}
      />
      <div className="relative h-full p-5 sm:p-6 flex flex-col gap-3">
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.04] p-4 ring-1 ring-sky-400/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[9px] tracking-[0.18em] uppercase text-sky-300 font-sans font-medium flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
              Plan ready · awaiting approval
            </div>
            <span className="text-[10px] font-mono text-sky-300/70">0.8s</span>
          </div>
          <p className="font-serif text-ink text-base leading-snug mb-1">
            Here&apos;s what I&apos;ll make.
          </p>
          <p className="text-xs font-sans text-ink-muted">
            Three deliverables. Two are reversible, one applies a discount.
          </p>
        </div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }}
              className="group rounded-xl border border-line bg-canvas/50 p-2.5 flex items-center gap-3 hover:border-sky-400/30 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative size-12 rounded-lg overflow-hidden border border-line shrink-0">
                {it.image ? (
                  <Image
                    src={it.image}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: it.swatch }}
                  />
                )}
                <div className="absolute bottom-0.5 right-0.5 size-1.5 rounded-full bg-emerald-400 ring-1 ring-canvas" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-sans font-semibold text-ink leading-tight">
                  {it.label}
                </div>
                <div className="text-[10px] font-mono text-ink-muted mt-0.5 truncate">
                  {it.format}
                </div>
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.4 + i * 0.12,
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                }}
                className={cn(
                  "size-5 rounded-md flex items-center justify-center",
                  it.accent === "rose" && "border border-rose-400/60 bg-rose-400/10",
                  it.accent === "sky" && "border border-sky-400/60 bg-sky-400/10",
                  it.accent === "violet" &&
                    "border border-violet-400/60 bg-violet-400/10",
                )}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className={cn(
                    it.accent === "rose" && "text-rose-300",
                    it.accent === "sky" && "text-sky-300",
                    it.accent === "violet" && "text-violet-300",
                  )}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.span>
            </motion.div>
          ))}
        </div>
        <div className="flex gap-2 mt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 h-10 rounded-full bg-ink text-canvas text-sm font-sans font-semibold shadow-lg shadow-sky-400/10"
          >
            Approve all
          </motion.button>
          <button className="h-10 px-4 rounded-full border border-line text-ink text-sm font-sans hover:border-ink/40 transition-colors">
            Adjust
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StageShip() {
  const outs: {
    label: string;
    status: string;
    url: string;
    metric: string;
    image?: string;
    swatch?: string;
  }[] = [
    {
      label: "Instagram",
      status: "Posted",
      url: "instagram.com/p/Czxk1Lq",
      metric: "127 reach",
      image: "/mockups/stylized-portrait.png",
    },
    {
      label: "Website banner",
      status: "Deployed",
      url: "hannahshair.com",
      metric: "live · v.42",
      image: "/mockups/salon-interior.png",
    },
    {
      label: "Discount code",
      status: "Active",
      url: "HANNAH20",
      metric: "0 redemptions",
      swatch:
        "linear-gradient(135deg, #8b5cf6 0%, #4338ca 50%, #1e1b4b 100%)",
    },
  ];
  return (
    <motion.div
      variants={FRAME_VARIANT}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute inset-0 overflow-hidden"
    >
      {/* Emerald success tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08), transparent 65%)",
        }}
      />
      <div className="relative h-full p-5 sm:p-6 flex flex-col gap-3">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4 ring-1 ring-emerald-400/10">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[9px] tracking-[0.22em] uppercase text-emerald-400 font-sans font-medium flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              All shipped
            </div>
            <span className="text-[10px] font-mono text-emerald-300/80">
              4.2s
            </span>
          </div>
          <p className="font-serif text-ink text-base leading-snug">
            Three deliverables.
            <span className="italic text-ink-muted"> Done.</span>
          </p>
        </div>
        <div className="space-y-2">
          {outs.map((o, i) => (
            <motion.div
              key={o.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.4 }}
              className="group rounded-xl border border-line bg-canvas/50 p-2.5 flex items-center gap-3 hover:border-emerald-400/30 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative size-12 rounded-lg overflow-hidden border border-line shrink-0">
                {o.image ? (
                  <Image
                    src={o.image}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-white"
                    style={{ background: o.swatch }}
                  >
                    HANNAH20
                  </div>
                )}
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.3 + i * 0.12,
                    type: "spring",
                    stiffness: 500,
                    damping: 18,
                  }}
                  className="absolute bottom-0.5 right-0.5 size-3.5 rounded-full bg-emerald-400 border border-canvas flex items-center justify-center"
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-canvas"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </motion.span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-sans font-semibold text-ink leading-none">
                    {o.label}
                  </span>
                  <span className="text-[9px] tracking-[0.18em] uppercase text-emerald-400/90 font-sans font-medium">
                    {o.status}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-ink-muted mt-1 truncate">
                  {o.url}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[9px] font-mono text-emerald-300/80">
                  {o.metric}
                </div>
                <button className="text-[10px] font-sans text-ink-muted hover:text-ink transition-colors mt-0.5">
                  View →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="rounded-xl border border-line bg-canvas/30 px-3.5 py-2.5 flex items-center gap-2.5 mt-1"
        >
          <span className="relative size-5 rounded-full bg-gradient-to-br from-white/95 via-white/40 to-white/5 flex items-center justify-center overflow-hidden shrink-0">
            <span className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/90 to-white/10" />
          </span>
          <div className="text-[10px] font-sans text-ink-muted flex-1">
            <span className="text-ink font-semibold">Memory updated</span> ·
            agent learned 3 new preferences (March promo voice · returning-
            customer discounts · banner layout)
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
