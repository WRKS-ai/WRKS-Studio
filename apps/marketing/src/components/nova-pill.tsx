"use client";

import { motion, useScroll, useTransform } from "motion/react";

export function NovaPill() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.04, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 0.04], [20, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="fixed bottom-6 right-6 z-50 hidden sm:block"
    >
      <a
        href="#waitlist"
        className="group flex items-center gap-2.5 rounded-full border border-line bg-panel/80 backdrop-blur-md pl-2 pr-4 py-1.5 shadow-2xl shadow-black/40 hover:border-ink/30 hover:bg-panel transition-all"
      >
        <span className="relative size-7 rounded-full bg-gradient-to-br from-white/95 via-white/40 to-white/5 flex items-center justify-center overflow-hidden">
          <span className="absolute inset-1 rounded-full bg-gradient-to-br from-white/90 to-white/10" />
          <span className="absolute size-2 rounded-full bg-white/95 top-1.5 left-1.5 blur-[1px]" />
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-sans font-semibold text-ink">
            Nova
          </span>
          <span className="text-[9px] font-sans text-ink-muted mt-0.5 flex items-center gap-1">
            <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
            online · ready
          </span>
        </div>
        <span className="text-ink-muted group-hover:text-ink transition-colors text-[10px] font-sans">
          →
        </span>
      </a>
    </motion.div>
  );
}
