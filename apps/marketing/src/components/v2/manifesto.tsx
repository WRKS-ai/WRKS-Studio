"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const LINES = [
  "One voice.",
  "One agent.",
  "Five deliverables, on brand.",
  "Six channels, live.",
  "Done before your coffee cools.",
];

export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.4"],
  });

  return (
    <section
      className="relative py-[60px] sm:py-[140px]"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-12 sm:mb-16"
        >
          <span className="size-1 rounded-full bg-white/40" />
          The shape of it
        </motion.div>

        <div ref={ref} className="space-y-8 sm:space-y-10">
          {LINES.map((line, i) => (
            <ManifestoLine
              key={line}
              text={line}
              index={i}
              total={LINES.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ManifestoLine({
  text,
  index,
  total,
  progress,
}: {
  text: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  // Each line owns a slice of the scroll range, with overlap so they cascade
  const start = (index / total) * 0.85;
  const end = start + 0.22;

  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const blur = useTransform(progress, [start, end], [8, 0]);
  const y = useTransform(progress, [start, end], [16, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <motion.div
      style={{ opacity, y, filter }}
      className="font-serif font-medium tracking-tight leading-[1.05] text-[clamp(2.5rem,6vw,5.5rem)] text-ink"
    >
      {text}
    </motion.div>
  );
}
