"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const LAYERS = [
  { label: "Interface", note: "Web · Mobile · Voice — Nova greets you" },
  { label: "Orchestrator agent", note: "Parses your intent, picks frameworks" },
  { label: "Staging environments", note: "Live preview surfaces per deliverable" },
  { label: "Frameworks & execution", note: "WRKS IP × your business memory" },
  { label: "Connections", note: "Social publish · CRM webhook · Stripe embed" },
];

const REQUESTS = [
  { from: "You", text: "Post the March promo" },
  { from: "You", text: "Update the booking page" },
  { from: "You", text: "Draft a blog about layered hair" },
];

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function Architecture() {
  const [activeLayer, setActiveLayer] = useState<number>(-1);
  const [requestIdx, setRequestIdx] = useState(0);
  const [particleKey, setParticleKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        // Choose a request
        setActiveLayer(-1);
        await wait(700);
        if (cancelled) return;
        setParticleKey((k) => k + 1);
        // Step through layers 0..4 with a delay each
        for (let i = 0; i < LAYERS.length; i++) {
          if (cancelled) return;
          setActiveLayer(i);
          await wait(700);
        }
        await wait(900);
        if (cancelled) return;
        setActiveLayer(-1);
        await wait(500);
        setRequestIdx((r) => (r + 1) % REQUESTS.length);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  const currentRequest = REQUESTS[requestIdx]!;

  return (
    <section className="py-32 px-6 lg:px-8 border-t border-line">
      <div className="max-w-screen-xl mx-auto grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-20 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans mb-5"
          >
            The system
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight"
          >
            One agent.
            <br />
            <span className="italic text-ink-muted">Five layers deep.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
            className="mt-7 text-base sm:text-lg text-ink-muted leading-relaxed max-w-lg"
          >
            Watch a request travel through the stack. Interface receives it,
            the orchestrator picks a framework, staging shows you the work,
            and connections ship it. You see a colleague. The system runs
            five layers underneath.
          </motion.p>
        </div>

        {/* Live stack visualization */}
        <div className="relative aspect-[4/5] rounded-2xl border border-line-bright bg-canvas overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.12), transparent 70%)",
          }}/>
          {/* Top: current request */}
          <div className="absolute top-3 left-3 right-3 z-20 rounded-md border border-line bg-canvas/80 backdrop-blur-md px-3 py-2 flex items-center gap-2">
            <span className="size-5 rounded-full bg-gradient-to-br from-white/95 to-white/40 shrink-0"/>
            <div className="min-w-0">
              <div className="text-[8px] tracking-[0.18em] uppercase text-ink-dim font-sans">Request</div>
              <motion.div
                key={requestIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-[10px] font-serif italic text-ink leading-tight"
              >
                &ldquo;{currentRequest.text}&rdquo;
              </motion.div>
            </div>
            <span className="ml-auto text-[8px] tracking-widest uppercase text-emerald-300/80 font-sans flex items-center gap-1">
              <span className="size-1 rounded-full bg-emerald-400 animate-pulse"/>
              live
            </span>
          </div>

          {/* 5 stacked layers */}
          <div className="absolute top-[20%] bottom-[6%] left-0 right-0 flex flex-col justify-around px-4">
            {LAYERS.map((layer, i) => {
              const isActive = i === activeLayer;
              const isPast = activeLayer >= 0 && i < activeLayer;
              const accentColor = i === 0 ? "sky" : i === 1 ? "violet" : i === 2 ? "amber" : i === 3 ? "rose" : "emerald";
              return (
                <motion.div
                  key={i}
                  animate={{
                    scale: isActive ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "relative rounded-lg border px-3 py-2.5 flex items-center gap-2.5 transition-all duration-400",
                    isActive
                      ? "border-white/60 bg-white/[0.04] ring-2 ring-white/15"
                      : isPast
                        ? "border-line bg-canvas/40 opacity-90"
                        : "border-line bg-canvas/30 opacity-60",
                  )}
                  style={{
                    boxShadow: isActive ? `0 12px 30px -10px rgba(255,255,255,0.18)` : undefined,
                  }}
                >
                  {/* Layer number */}
                  <span className={cn(
                    "size-7 rounded-md flex items-center justify-center text-[10px] font-mono font-semibold shrink-0",
                    isActive ? "bg-white text-canvas" : "border border-line text-ink-muted",
                  )}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={cn(
                      "text-[11px] font-sans font-semibold leading-tight",
                      isActive ? "text-white" : "text-ink",
                    )}>{layer.label}</div>
                    <div className="text-[9px] font-mono text-ink-muted leading-tight mt-0.5 truncate">{layer.note}</div>
                  </div>
                  {/* Status */}
                  <div className="text-right shrink-0">
                    {isActive ? (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[8px] tracking-[0.18em] uppercase text-white font-sans font-medium flex items-center gap-1"
                      >
                        <span className="size-1.5 rounded-full bg-white animate-pulse"/>
                        Processing
                      </motion.span>
                    ) : isPast ? (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[8px] tracking-[0.18em] uppercase text-emerald-300 font-sans font-medium flex items-center gap-1"
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                        Done
                      </motion.span>
                    ) : (
                      <span className="text-[8px] tracking-[0.18em] uppercase text-ink-dim font-sans">Idle</span>
                    )}
                  </div>
                  {/* Particle indicator at left edge when active */}
                  {isActive && (
                    <motion.span
                      key={`particle-${particleKey}-${i}`}
                      initial={{ left: -10, opacity: 0 }}
                      animate={{ left: 0, opacity: 1 }}
                      className="absolute top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Bottom completion bar */}
          <motion.div
            initial={false}
            animate={{
              width: activeLayer < 0 ? "0%" : `${((activeLayer + 1) / LAYERS.length) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-400 via-violet-400 via-amber-400 via-rose-400 to-emerald-400"
          />
        </div>
      </div>
    </section>
  );
}
