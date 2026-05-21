"use client";

import { motion } from "motion/react";
import { ScrollReveal } from "./scroll-reveal";

const PHASES = [
  {
    num: "01",
    title: "Tell her",
    body: "Say what you need — voice, text, whatever's faster. Nova already knows your brand, your customers, your last winner. So you don't have to explain the basics every time.",
  },
  {
    num: "02",
    title: "She shows you",
    body: "Within seconds you see the page, the post, the ad — exactly how it'll look published. Tap anything to tweak before it ships. Nothing goes live without your sign-off.",
  },
  {
    num: "03",
    title: "She ships",
    body: "Approve, and Nova publishes to your domain, your Instagram, your CRM — all the connections you've set up. Five deliverables in under five seconds.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative py-32 sm:py-40 px-6 lg:px-8 overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 30% 0%, rgba(167,139,250,0.08), transparent 55%), radial-gradient(ellipse at 70% 100%, rgba(56,189,248,0.06), transparent 60%)",
        }}
      />

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
            How it works
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[1.02] max-w-3xl mx-auto text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            Three steps.
            <br />
            <span className="italic text-ink-muted">Five seconds.</span>
          </motion.h2>
        </div>

        <div className="space-y-32 sm:space-y-44 max-w-6xl mx-auto">
          {PHASES.map((phase, i) => (
            <PhaseRow key={phase.num} phase={phase} index={i} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * One phase row — split layout, alternates sides
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
  const Visual =
    phase.num === "01" ? TellHerMockup : phase.num === "02" ? ShowYouMockup : ShipsMockup;

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
        reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      {/* Text block */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <span
            className="font-serif italic font-medium leading-[0.85] tabular-nums select-none block mb-4"
            style={{
              fontSize: "clamp(4.5rem, 9vw, 7.5rem)",
              background:
                "linear-gradient(135deg, rgba(167,139,250,0.95) 0%, rgba(56,189,248,0.85) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {phase.num}
          </span>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
          className="font-serif font-medium tracking-tight leading-[1.05] text-[clamp(2rem,3.6vw,2.75rem)] mb-5"
        >
          {phase.title}
        </motion.h3>

        <ScrollReveal
          baseOpacity={0.12}
          baseRotation={index % 2 === 0 ? 1 : -1}
          blurStrength={4}
          enableBlur
          textClassName="font-sans text-ink-muted text-[clamp(1rem,1.5vw,1.2rem)] leading-[1.6]"
        >
          {phase.body}
        </ScrollReveal>
      </div>

      {/* Visual block */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.95, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 }}
      >
        <Visual />
      </motion.div>
    </div>
  );
}

/* ============================================================
 * Mockup 01 — Tell her: voice input phone scene
 * ============================================================ */

function TellHerMockup() {
  return (
    <div className="relative aspect-[3/4] max-w-sm mx-auto">
      <div
        className="absolute inset-0 rounded-[2.5rem] bg-[#0a0a12] overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 30px 80px -20px rgba(99,102,241,0.25), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-black z-20" />

        {/* Ambient radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(167,139,250,0.25), transparent 60%)",
          }}
        />

        {/* Top status meta */}
        <div className="absolute top-9 left-0 right-0 flex items-center justify-between px-7">
          <span className="text-[10px] tracking-[0.2em] uppercase text-emerald-300/90 font-sans font-medium flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
            Listening
          </span>
          <span className="text-[10px] font-mono text-white/40">0:02</span>
        </div>

        {/* Voice orb at center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-20">
          <div className="relative size-36 flex items-center justify-center">
            {/* Pulsing concentric rings */}
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full"
                style={{ border: "1px solid rgba(167,139,250,0.35)" }}
                animate={{ scale: [0.7, 1.9, 0.7], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.7, ease: "easeInOut" }}
              />
            ))}

            {/* Central orb */}
            <div
              className="relative size-24 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 32% 28%, #ffffff 0%, #e0e7ff 35%, #a78bfa 70%, #6366f1 100%)",
                boxShadow:
                  "0 0 48px 6px rgba(167,139,250,0.5), inset 0 -10px 22px rgba(50,30,80,0.4)",
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.4))" }}>
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
              </svg>
            </div>
          </div>

          {/* Transcript */}
          <div className="mt-10 text-center px-8">
            <div className="text-[9px] tracking-[0.22em] uppercase text-violet-300/70 font-sans mb-2.5">
              You said
            </div>
            <div className="font-serif italic text-white text-[15px] leading-snug">
              &ldquo;Build a Black Friday
              <br />
              landing page&rdquo;
            </div>
          </div>
        </div>

        {/* Waveform at the bottom */}
        <div className="absolute bottom-7 left-7 right-7 flex items-center justify-center gap-[3px] h-10">
          {Array.from({ length: 22 }).map((_, i) => (
            <motion.span
              key={i}
              className="block w-[2px] rounded-full"
              style={{
                background: "linear-gradient(to top, #a78bfa, #38bdf8)",
              }}
              animate={{ height: ["20%", "85%", "30%", "70%", "20%"] }}
              transition={{
                duration: 1.6 + (i % 5) * 0.15,
                repeat: Infinity,
                delay: (i % 7) * 0.08,
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
 * Mockup 02 — She shows you: floating preview tiles
 * ============================================================ */

function ShowYouMockup() {
  return (
    <div
      className="relative aspect-[5/4] max-w-md mx-auto"
      style={{ perspective: "1400px" }}
    >
      {/* Ambient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.18), transparent 65%)",
          filter: "blur(20px)",
        }}
      />

      {/* IG card */}
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-2 left-2 w-[55%] z-30"
        style={{ transform: "rotateY(-18deg) rotateX(8deg)", transformStyle: "preserve-3d" }}
      >
        <div className="rounded-2xl overflow-hidden bg-[#0d0d12] shadow-2xl"
          style={{
            border: "1px solid rgba(244,114,182,0.35)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 32px -8px rgba(244,114,182,0.4)",
          }}
        >
          <div className="px-3 py-2 flex items-center gap-1.5">
            <div className="size-5 rounded-full p-[1px] bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500">
              <div className="size-full rounded-full bg-[#0d0d12]" />
            </div>
            <div className="flex-1">
              <div className="text-[8px] font-sans font-semibold text-white">hannahshair</div>
            </div>
            <span className="text-white/60 text-[10px]">⋯</span>
          </div>
          <div
            className="aspect-square"
            style={{
              background:
                "linear-gradient(135deg, #f472b6 0%, #d946ef 45%, #f59e0b 100%)",
            }}
          >
            <div className="absolute top-12 left-3 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[7px] tracking-[0.22em] uppercase text-white font-sans">
              Black Friday
            </div>
          </div>
          <div className="px-3 py-2 flex items-center gap-2">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span className="ml-auto text-[7px] tracking-widest uppercase text-emerald-300/80">Drafted</span>
          </div>
        </div>
      </motion.div>

      {/* Website card */}
      <motion.div
        animate={{ y: [5, -5, 5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        className="absolute top-12 right-0 w-[60%] z-20"
        style={{ transform: "rotateY(16deg) rotateX(-6deg)", transformStyle: "preserve-3d" }}
      >
        <div className="rounded-2xl overflow-hidden bg-[#0d0d12]"
          style={{
            border: "1px solid rgba(56,189,248,0.35)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 32px -8px rgba(56,189,248,0.4)",
          }}
        >
          <div className="px-3 py-2 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-rose-400/70" />
            <span className="size-1.5 rounded-full bg-amber-400/70" />
            <span className="size-1.5 rounded-full bg-emerald-400/70" />
            <div className="ml-1.5 flex-1 h-3.5 rounded-md bg-white/[0.05] px-1.5 flex items-center">
              <span className="text-[7px] font-mono text-white/60">hannahshair.com</span>
            </div>
          </div>
          <div className="aspect-[5/4] relative bg-gradient-to-br from-sky-950 via-indigo-900 to-canvas p-3 flex flex-col justify-end">
            <div className="font-serif text-white text-base leading-[0.95] tracking-tight">
              Modern cuts.
              <div className="italic text-white/75">Honest pricing.</div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-[7px] font-sans font-semibold px-1.5 py-0.5 rounded-full bg-white text-canvas">
                Book →
              </span>
            </div>
          </div>
          <div className="px-3 py-1.5 text-right">
            <span className="text-[7px] tracking-widest uppercase text-emerald-300/80">Ready</span>
          </div>
        </div>
      </motion.div>

      {/* Discount card */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.3 }}
        className="absolute bottom-2 left-[18%] w-[48%] z-40"
        style={{ transform: "rotateY(-8deg) rotateX(12deg)", transformStyle: "preserve-3d" }}
      >
        <div
          className="rounded-2xl bg-[#0d0d12] p-3.5"
          style={{
            border: "1px solid rgba(167,139,250,0.4)",
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 32px -8px rgba(167,139,250,0.4)",
          }}
        >
          <div className="text-[7px] tracking-[0.22em] uppercase text-violet-200/70 font-sans mb-1.5">
            Promo code
          </div>
          <div
            className="font-mono font-bold text-white text-[18px] tracking-[0.18em] text-center py-1.5 rounded-md"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            HANNAH20
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="font-serif italic text-[9px] text-white/65">20% off</span>
            <span className="text-[7px] tracking-widest uppercase text-emerald-300/80">Approved</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================================
 * Mockup 03 — She ships: deployment radiation
 * ============================================================ */

function ShipsMockup() {
  const channels = [
    {
      label: "IG",
      angle: -90,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
        </svg>
      ),
      tone: "from-rose-400 to-fuchsia-500",
    },
    {
      label: "Web",
      angle: -30,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18" />
        </svg>
      ),
      tone: "from-sky-400 to-cyan-500",
    },
    {
      label: "Stripe",
      angle: 30,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
          <path d="M2.5 11h19" />
        </svg>
      ),
      tone: "from-violet-400 to-indigo-500",
    },
    {
      label: "Email",
      angle: 90,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="2.5" y="5" width="19" height="14" rx="2" />
          <path d="m3 7 9 6.5L21 7" />
        </svg>
      ),
      tone: "from-amber-400 to-orange-500",
    },
    {
      label: "CRM",
      angle: 150,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
          <path d="M3 21v-2a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v2" />
        </svg>
      ),
      tone: "from-emerald-400 to-teal-500",
    },
    {
      label: "Booking",
      angle: 210,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      ),
      tone: "from-pink-400 to-rose-500",
    },
  ];

  const radius = 130;

  return (
    <div className="relative aspect-square max-w-md mx-auto">
      {/* Ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(52,211,153,0.18), transparent 60%)",
          filter: "blur(10px)",
        }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 400 400">
        {channels.map((c, i) => {
          const angleRad = (c.angle * Math.PI) / 180;
          const x = 200 + Math.cos(angleRad) * radius;
          const y = 200 + Math.sin(angleRad) * radius;
          return (
            <motion.line
              key={c.label}
              x1="200"
              y1="200"
              x2={x}
              y2={y}
              stroke="rgba(52,211,153,0.3)"
              strokeWidth="1"
              strokeDasharray="3 4"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.08, ease: "easeOut" }}
            />
          );
        })}
      </svg>

      {/* Center node */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full"
              style={{ border: "1.5px solid rgba(52,211,153,0.4)" }}
              animate={{ scale: [1, 2.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
            />
          ))}
          <div
            className="relative size-24 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #34d399 0%, #14b8a6 60%, #0ea5e9 100%)",
              boxShadow:
                "0 0 48px 8px rgba(52,211,153,0.55), inset 0 -10px 22px rgba(0,30,30,0.4)",
            }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {/* Label below center node */}
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
            <div className="text-[9px] tracking-[0.24em] uppercase text-emerald-300/90 font-sans font-medium flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
              Shipped 3.2s
            </div>
          </div>
        </div>
      </div>

      {/* Channel icons */}
      {channels.map((c, i) => {
        const angleRad = (c.angle * Math.PI) / 180;
        const xPercent = 50 + (Math.cos(angleRad) * radius) / 4;
        const yPercent = 50 + (Math.sin(angleRad) * radius) / 4;
        return (
          <motion.div
            key={c.label}
            className="absolute z-10"
            style={{
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.1, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              className="relative"
            >
              <div
                className={`relative size-14 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${c.tone}`}
                style={{
                  boxShadow:
                    "0 12px 28px -8px rgba(0,0,0,0.5), inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                {c.icon}
              </div>
              {/* Check overlay */}
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-emerald-400 flex items-center justify-center text-[10px] font-bold text-canvas shadow-lg">
                ✓
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
