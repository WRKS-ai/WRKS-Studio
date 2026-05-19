"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const PROMPT =
  "I want a 20% promo for March. Social post, banner on my website, discount code for returning customers.";

const OUTPUTS = [
  { label: "Instagram post", status: "Published", delay: 3.2 },
  { label: "Website banner", status: "Live on site", delay: 3.6 },
  { label: "Discount code", status: "Active for returning users", delay: 4.0 },
];

const TIMER_TARGET = 4.4;

export function LiveDemo() {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i <= PROMPT.length) {
        setTyped(PROMPT.slice(0, i));
      } else {
        setDone(true);
        clearInterval(id);
      }
    }, 22);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!done) return;
    const start = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - start) / 1000;
      if (t >= TIMER_TARGET - PROMPT.length * 0.022) {
        setElapsed(TIMER_TARGET);
        clearInterval(id);
      } else {
        setElapsed(t + PROMPT.length * 0.022);
      }
    }, 60);
    return () => clearInterval(id);
  }, [done]);

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border border-border rounded-2xl bg-bg-elev/80 backdrop-blur-sm p-5 shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] tracking-[0.18em] uppercase text-fg-muted font-sans">
            You said
          </span>
          <span className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-fg-muted font-sans">
            <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            Live
          </span>
        </div>
        <p className="font-serif text-base sm:text-lg leading-snug italic text-fg">
          &ldquo;{typed}
          <span
            className={cn(
              "inline-block w-[1px] ml-0.5 align-middle bg-fg",
              done ? "animate-none opacity-0" : "animate-pulse",
            )}
            style={{ height: "1em" }}
          />
          &rdquo;
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="mt-4 flex items-center gap-3 text-[10px] tracking-[0.18em] uppercase text-fg-muted font-sans"
      >
        <span className="size-1.5 rounded-full bg-fg-muted animate-pulse" />
        Agent is making 3 things
        <span className="flex-1 h-px bg-border" />
        <span className="font-mono text-fg-muted">
          {elapsed.toFixed(1)}s
        </span>
      </motion.div>

      <div className="mt-3 space-y-2">
        {OUTPUTS.map((o, i) => (
          <motion.div
            key={o.label}
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              delay: o.delay,
              duration: 0.55,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="group border border-border rounded-xl bg-bg-elev p-4 flex items-center justify-between hover:border-fg/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: o.delay + 0.15,
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                }}
                className="size-7 rounded-full bg-fg text-bg flex items-center justify-center text-[11px] font-sans font-semibold"
              >
                {i + 1}
              </motion.div>
              <span className="text-sm font-sans font-medium">{o.label}</span>
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: o.delay + 0.3, duration: 0.4 }}
              className="text-[10px] tracking-[0.18em] uppercase text-emerald-400/90 font-sans font-medium"
            >
              {o.status}
            </motion.span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ delay: 4.5, duration: 0.5 }}
        className="mt-4 text-center text-xs font-sans text-fg-dim"
      >
        Three deliverables. One sentence. Zero tools opened.
      </motion.div>
    </div>
  );
}
