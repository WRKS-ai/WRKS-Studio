"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { StarBorder } from "./star-border";

const CLAIMED = 23;
const TOTAL = 100;

const RECENT_CLAIMS = [
  {
    handle: "@hannahshair",
    location: "Toronto · Hair salon",
    timestamp: "2 min ago",
    tone: "from-rose-400 to-fuchsia-500",
    isNew: true,
  },
  {
    handle: "@meadow.cafe",
    location: "Portland · Coffee shop",
    timestamp: "14 min ago",
    tone: "from-amber-400 to-orange-500",
  },
  {
    handle: "@nextleather.co",
    location: "NYC · Leather goods",
    timestamp: "1 hr ago",
    tone: "from-emerald-400 to-teal-500",
  },
  {
    handle: "@studio.olive",
    location: "Austin · Skincare",
    timestamp: "3 hr ago",
    tone: "from-violet-400 to-indigo-500",
  },
  {
    handle: "@northbarber",
    location: "Chicago · Barber",
    timestamp: "5 hr ago",
    tone: "from-sky-400 to-cyan-500",
  },
];

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section
      id="waitlist"
      className="relative py-32 sm:py-40 px-6 lg:px-8 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Strong closing-moment gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.18), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.12), transparent 60%)",
        }}
      />

      <div className="relative max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-12 lg:gap-20 items-center">
        {/* LEFT — closing CTA */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-6"
          >
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Founding cohort · early 2026
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.95, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[0.98] text-[clamp(2.5rem,5.5vw,4.5rem)]"
          >
            Be among
            <br />
            <span className="italic text-ink-muted">the first 100.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.15, duration: 0.65 }}
            className="mt-6 text-[17px] sm:text-[18px] text-ink-muted leading-[1.55] max-w-md"
          >
            Hand-onboarded. Personalized to your brand. We&rsquo;re only taking
            100 founding businesses this cohort — and onboarding by hand.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.3, duration: 0.65 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSubmitted(true);
            }}
            className="mt-9 flex flex-col sm:flex-row items-center gap-3 max-w-lg"
          >
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-emerald-400/80 animate-pulse pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitted}
                placeholder="you@yourshop.com"
                className="w-full h-12 pl-9 pr-4 rounded-2xl bg-canvas/60 border border-white/[0.1] text-ink placeholder:text-ink-dim text-[15px] font-sans focus:outline-none focus:border-white/[0.3] focus:ring-2 focus:ring-violet-400/20 transition-all disabled:opacity-60 backdrop-blur-sm"
              />
            </div>
            <StarBorder
              as="button"
              type="submit"
              color="#a78bfa"
              speed="6s"
              disabled={submitted}
              className="cursor-pointer disabled:cursor-default disabled:opacity-70"
            >
              {submitted ? (
                <>
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  On the list
                </>
              ) : (
                <>
                  Claim your spot
                  <span aria-hidden>→</span>
                </>
              )}
            </StarBorder>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 flex items-center gap-6 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-sans"
          >
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-violet-400" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-sky-400" />
              Hand-onboarded
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-emerald-400" />
              Phone-first
            </span>
          </motion.div>
        </div>

        {/* RIGHT — cohort dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 }}
        >
          <CohortDashboard />
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
 * Cohort dashboard — live progress + recent claims feed
 * ============================================================ */

function CohortDashboard() {
  const percent = (CLAIMED / TOTAL) * 100;

  return (
    <div
      className="relative rounded-2xl p-6 sm:p-7"
      style={{
        background:
          "linear-gradient(180deg, rgba(13,13,18,0.92) 0%, rgba(13,13,18,0.88) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 30px 80px -20px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
            Cohort status · live
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <motion.span
              className="font-serif text-[44px] sm:text-[52px] text-white font-medium leading-none"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <CountUp to={CLAIMED} />
            </motion.span>
            <span className="font-mono text-white/45 text-base">
              / {TOTAL}
            </span>
          </div>
          <div className="text-[11px] text-white/55 mt-1">spots claimed</div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.22em] uppercase text-emerald-300/90 font-sans font-medium pt-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Filling now
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-1">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #a78bfa 0%, #38bdf8 100%)",
            boxShadow: "0 0 12px rgba(167,139,250,0.6)",
          }}
          initial={{ width: 0 }}
          whileInView={{ width: `${percent}%` }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.5, ease: [0.2, 0.7, 0.2, 1], delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between text-[8px] tracking-widest uppercase text-white/35 font-mono mb-6">
        <span>0</span>
        <span className="text-violet-300/80">you</span>
        <span>{TOTAL}</span>
      </div>

      {/* Recent claims feed */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
          Recently claimed
        </div>
        <span className="text-[9px] font-mono text-white/40">avg. 4hr response</span>
      </div>

      <div className="space-y-1.5">
        {RECENT_CLAIMS.map((c, i) => (
          <ClaimRow key={c.handle} {...c} index={i} />
        ))}
      </div>

      <div
        className="mt-5 pt-4 flex items-center justify-between text-[9px] tracking-widest uppercase text-white/40 font-mono"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span>Next cohort · Apr 2026</span>
        <span className="text-emerald-300/80 flex items-center gap-1">
          <span className="size-1 rounded-full bg-emerald-400" />
          {TOTAL - CLAIMED} spots left
        </span>
      </div>
    </div>
  );
}

function ClaimRow({
  handle,
  location,
  timestamp,
  tone,
  isNew,
  index,
}: {
  handle: string;
  location: string;
  timestamp: string;
  tone: string;
  isNew?: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: 0.5 + index * 0.08, duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 overflow-hidden"
      style={{
        background: isNew ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${isNew ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)"}`,
      }}
    >
      {/* Just-joined emerald flash for the newest */}
      {isNew && (
        <motion.span
          className="absolute inset-0 pointer-events-none"
          style={{ background: "rgba(52,211,153,0.12)" }}
          animate={{ opacity: [0.6, 0, 0.6, 0] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: 0.8,
            ease: "easeInOut",
          }}
        />
      )}
      <div
        className={`relative size-7 rounded-full bg-gradient-to-br ${tone} shrink-0`}
        style={{
          boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 1.5px 3px rgba(255,255,255,0.18)",
        }}
      />
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-white font-sans font-semibold truncate">
            {handle}
          </span>
          {isNew && (
            <span className="text-[7px] tracking-[0.22em] uppercase text-emerald-300 font-sans font-bold">
              new
            </span>
          )}
        </div>
        <div className="text-[10px] text-white/50 font-mono truncate">
          {location}
        </div>
      </div>
      <div className="relative text-[9px] font-mono text-white/35 shrink-0 tabular-nums">
        {timestamp}
      </div>
    </motion.div>
  );
}

function CountUp({ to }: { to: number }) {
  const [value, setValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <motion.span
      onViewportEnter={() => {
        if (hasStarted) return;
        setHasStarted(true);
        let v = 0;
        const id = setInterval(() => {
          v += 1;
          if (v >= to) {
            setValue(to);
            clearInterval(id);
            return;
          }
          setValue(v);
        }, 35);
      }}
      viewport={{ once: true }}
    >
      {value}
    </motion.span>
  );
}
