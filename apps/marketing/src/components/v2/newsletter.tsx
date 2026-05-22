"use client";

import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { StarBorder } from "./star-border";

const SUBSCRIBER_COUNT = 1247;

const RECENT_ISSUES = [
  {
    number: "012",
    title: "How Nova learns your brand voice in 3 prompts",
    date: "May 18, 2026",
    readTime: "4 min",
    tag: "Inside the agent",
    tone: "from-violet-400 to-fuchsia-500",
    isNew: true,
  },
  {
    number: "011",
    title: "Why we ship five deliverables, not one",
    date: "May 11, 2026",
    readTime: "6 min",
    tag: "Product thinking",
    tone: "from-sky-400 to-indigo-500",
  },
  {
    number: "010",
    title: "Building a multi-tenant agent from scratch",
    date: "May 4, 2026",
    readTime: "9 min",
    tag: "Engineering",
    tone: "from-emerald-400 to-teal-500",
  },
  {
    number: "009",
    title: "The framework we use for every landing page",
    date: "Apr 27, 2026",
    readTime: "7 min",
    tag: "Frameworks",
    tone: "from-amber-400 to-orange-500",
  },
  {
    number: "008",
    title: "What a phone-first business OS actually means",
    date: "Apr 20, 2026",
    readTime: "5 min",
    tag: "Vision",
    tone: "from-rose-400 to-pink-500",
  },
];

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section
      id="newsletter"
      className="relative py-[60px] sm:py-[140px] px-6 lg:px-8 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Closing-moment ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.16), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.10), transparent 60%)",
        }}
      />

      <div className="relative max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-12 lg:gap-20 items-center">
        {/* LEFT — newsletter pitch */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-6"
          >
            <span className="size-1.5 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />
            Field notes · weekly
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.95, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[0.98] text-[clamp(2.5rem,5.5vw,4.5rem)]"
          >
            The build log.
            <br />
            <span className="italic text-ink-muted">In your inbox.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.15, duration: 0.65 }}
            className="mt-6 text-[17px] sm:text-[18px] text-ink-muted leading-[1.55] max-w-md"
          >
            Frameworks, ship logs, the wins and the misses. Get one short
            essay each week on building a voice-first business OS — straight
            from the team.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.3, duration: 0.65 }}
            onSubmit={onSubmit}
            className="mt-9 flex flex-col sm:flex-row items-center gap-3 max-w-lg"
          >
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-violet-400/80 animate-pulse pointer-events-none" />
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
                  Subscribed
                </>
              ) : (
                <>
                  Subscribe
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
              Weekly
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-sky-400" />
              No spam
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-emerald-400" />
              Unsubscribe anytime
            </span>
          </motion.div>
        </div>

        {/* RIGHT — newsletter dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 }}
        >
          <NewsletterDashboard />
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
 * Newsletter dashboard — subscriber count + recent issues feed
 * ============================================================ */

function NewsletterDashboard() {
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
            Subscribers · live
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-serif text-[44px] sm:text-[52px] text-white font-medium leading-none tabular-nums">
              <CountUp to={SUBSCRIBER_COUNT} />
            </span>
            <span className="font-mono text-white/45 text-base">readers</span>
          </div>
          <div className="text-[11px] text-white/55 mt-1">
            +84 in the last 30 days
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.22em] uppercase text-emerald-300/90 font-sans font-medium pt-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Growing
        </div>
      </div>

      {/* Recent issues */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
          Recent issues
        </div>
        <span className="text-[9px] font-mono text-white/40">
          read the archive →
        </span>
      </div>

      <div className="space-y-1.5">
        {RECENT_ISSUES.map((issue, i) => (
          <IssueRow key={issue.number} {...issue} index={i} />
        ))}
      </div>

      <div
        className="mt-5 pt-4 flex items-center justify-between text-[9px] tracking-widest uppercase text-white/40 font-mono"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span>Next issue · Friday 9am</span>
        <span className="text-violet-300/80 flex items-center gap-1">
          <span className="size-1 rounded-full bg-violet-400" />
          Issue #013
        </span>
      </div>
    </div>
  );
}

function IssueRow({
  number,
  title,
  date,
  readTime,
  tag,
  tone,
  isNew,
  index,
}: {
  number: string;
  title: string;
  date: string;
  readTime: string;
  tag: string;
  tone: string;
  isNew?: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: 0.5 + index * 0.08,
        duration: 0.45,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 overflow-hidden"
      style={{
        background: isNew ? "rgba(167,139,250,0.04)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${
          isNew ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.05)"
        }`,
      }}
    >
      {isNew && (
        <motion.span
          className="absolute inset-0 pointer-events-none"
          style={{ background: "rgba(167,139,250,0.10)" }}
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
        className={`relative size-7 rounded-full bg-gradient-to-br ${tone} shrink-0 flex items-center justify-center`}
        style={{
          boxShadow:
            "inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 1.5px 3px rgba(255,255,255,0.18)",
        }}
      >
        <span className="text-[9px] font-mono font-bold text-white/95">
          {number}
        </span>
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-white font-sans font-semibold truncate">
            {title}
          </span>
          {isNew && (
            <span className="text-[7px] tracking-[0.22em] uppercase text-violet-300 font-sans font-bold shrink-0">
              new
            </span>
          )}
        </div>
        <div className="text-[10px] text-white/50 font-mono truncate">
          {tag} · {date}
        </div>
      </div>
      <div className="relative text-[9px] font-mono text-white/35 shrink-0 tabular-nums">
        {readTime}
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
        const duration = 1400;
        const steps = 60;
        const stepMs = duration / steps;
        const increment = Math.ceil(to / steps);
        let v = 0;
        const id = setInterval(() => {
          v += increment;
          if (v >= to) {
            setValue(to);
            clearInterval(id);
            return;
          }
          setValue(v);
        }, stepMs);
      }}
      viewport={{ once: true }}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

