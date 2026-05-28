"use client";

import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { StarBorder } from "./star-border";

const TOPICS = [
  {
    title: "The WRKS frameworks we ship under",
    detail: "The proven structure behind every landing page, post, and ad",
    tag: "Frameworks",
    tone: "from-violet-400 to-fuchsia-500",
  },
  {
    title: "Build logs from real businesses",
    detail: "What we shipped this week and what we learned",
    tag: "Ship logs",
    tone: "from-sky-400 to-indigo-500",
  },
  {
    title: "Engineering the agent layer",
    detail: "Orchestration, memory, latency — how the moat is built",
    tag: "Engineering",
    tone: "from-emerald-400 to-teal-500",
  },
  {
    title: "Field stories from operators",
    detail: "How a hairdresser, a cafe, and a leather brand actually use this",
    tag: "Field",
    tone: "from-amber-400 to-orange-500",
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
            What you&rsquo;ll get
          </div>
          <div className="mt-2 font-serif text-[28px] sm:text-[32px] text-white font-medium leading-[1.1] tracking-tight max-w-[280px]">
            One short read.{" "}
            <span className="italic text-ink-muted">Every Friday.</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.22em] uppercase text-emerald-300/90 font-sans font-medium pt-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Topics */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
          The four threads
        </div>
      </div>

      <div className="space-y-1.5">
        {TOPICS.map((topic, i) => (
          <TopicRow key={topic.tag} {...topic} index={i} />
        ))}
      </div>

      <div
        className="mt-5 pt-4 flex items-center justify-between text-[9px] tracking-widest uppercase text-white/40 font-mono"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span>Issue 001 · launching soon</span>
        <span className="text-violet-300/80 flex items-center gap-1">
          <span className="size-1 rounded-full bg-violet-400" />
          Free
        </span>
      </div>
    </div>
  );
}

function TopicRow({
  title,
  detail,
  tag,
  tone,
  index,
}: {
  title: string;
  detail: string;
  tag: string;
  tone: string;
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
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className={`relative size-7 rounded-full bg-gradient-to-br ${tone} shrink-0`}
        style={{
          boxShadow:
            "inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 1.5px 3px rgba(255,255,255,0.18)",
        }}
      />
      <div className="relative flex-1 min-w-0">
        <div className="text-[12px] text-white font-sans font-semibold truncate">
          {title}
        </div>
        <div className="text-[10px] text-white/50 font-mono truncate">
          {detail}
        </div>
      </div>
      <div className="relative text-[9px] tracking-[0.18em] uppercase text-violet-200/55 font-sans shrink-0">
        {tag}
      </div>
    </motion.div>
  );
}

