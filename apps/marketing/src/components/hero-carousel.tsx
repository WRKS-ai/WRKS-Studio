"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Card = {
  kind: "website" | "social" | "ad" | "copy" | "blog";
  image?: string;
  promptLabel: string;
  prompt: string;
};

const CARDS: Card[] = [
  {
    kind: "website",
    image: "/mockups/salon-interior.png",
    promptLabel: "Build my Hannah's Hair landing page",
    prompt:
      "Build a landing page for my hair salon. Booking, gallery, and pricing.",
  },
  {
    kind: "social",
    image: "/mockups/stylized-portrait.png",
    promptLabel: "Friday post about the new latte menu",
    prompt: "Schedule a Friday Instagram post about our new latte menu.",
  },
  {
    kind: "ad",
    image: "/mockups/hair-closeup.png",
    promptLabel: "March promo · social + banner + discount",
    prompt:
      "20% promo for March. Social post, banner on my site, discount code.",
  },
  {
    kind: "copy",
    promptLabel: "Hero copy that converts",
    prompt: "Write hero copy for a returning-customers discount offer.",
  },
  {
    kind: "blog",
    image: "/mockups/salon-mirror.png",
    promptLabel: "Blog post · trimming layered hair",
    prompt: "Draft an SEO blog post on how often to trim layered hair.",
  },
];

/* visual offsets per relative slot ( -2 … 2 ) */
const SLOT = [
  { rotY: 38, x: -380, z: -200, opacity: 0.28, scale: 0.82, blur: 4 }, // -2
  { rotY: 22, x: -210, z: -90, opacity: 0.7, scale: 0.92, blur: 2 }, // -1
  { rotY: 0, x: 0, z: 0, opacity: 1, scale: 1.05, blur: 0 }, // 0 center
  { rotY: -22, x: 210, z: -90, opacity: 0.7, scale: 0.92, blur: 2 }, // 1
  { rotY: -38, x: 380, z: -200, opacity: 0.28, scale: 0.82, blur: 4 }, // 2
];

const AUTO_MS = 4200;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltY = useSpring(useTransform(mx, [-1, 1], [-6, 6]), {
    stiffness: 80,
    damping: 22,
  });
  const tiltX = useSpring(useTransform(my, [-1, 1], [4, -4]), {
    stiffness: 80,
    damping: 22,
  });

  const advance = useCallback((dir: 1 | -1) => {
    setActive((a) => (a + dir + CARDS.length) % CARDS.length);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(() => advance(1), AUTO_MS);
    return () => clearInterval(id);
  }, [advance, paused, reduced]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    mx.set(x);
    my.set(y);
  };

  const handleMouseLeave = () => {
    setPaused(false);
    mx.set(0);
    my.set(0);
  };

  const slotFor = (i: number) => {
    let diff = i - active;
    if (diff < -2) diff += CARDS.length;
    if (diff > 2) diff -= CARDS.length;
    return diff;
  };

  return (
    <div
      ref={ref}
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Center spotlight glow behind the featured card */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
        aria-hidden
      >
        <div className="size-[520px] sm:size-[720px] rounded-full bg-gradient-to-br from-white/[0.10] via-amber-200/[0.04] to-transparent blur-[140px]" />
      </div>
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
        aria-hidden
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="size-[280px] sm:size-[380px] rounded-full bg-white/[0.08] blur-[80px]" />
      </motion.div>

      <motion.div
        className="relative h-[400px] sm:h-[460px] lg:h-[520px] flex items-center justify-center"
        style={{
          perspective: "1600px",
          rotateY: tiltY,
          rotateX: tiltX,
          transformStyle: "preserve-3d",
        }}
      >
        {CARDS.map((card, i) => {
          const slot = slotFor(i);
          if (Math.abs(slot) > 2) return null;
          const s = SLOT[slot + 2]!;
          const isCenter = slot === 0;
          return (
            <motion.div
              key={card.kind}
              role="button"
              tabIndex={isCenter ? 0 : -1}
              onClick={() => setActive(i)}
              initial={false}
              animate={{
                x: s.x,
                rotateY: s.rotY,
                z: s.z,
                opacity: s.opacity,
                scale: s.scale,
                filter: `blur(${s.blur}px)`,
              }}
              transition={{
                type: "spring",
                stiffness: 140,
                damping: 22,
                mass: 0.9,
              }}
              className="absolute w-[260px] sm:w-[300px] lg:w-[340px] aspect-[3/4] cursor-pointer select-none"
              style={{ transformStyle: "preserve-3d", zIndex: 5 - Math.abs(slot) }}
            >
              <CarouselCard card={card} featured={isCenter} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-center gap-4">
        <CtrlButton onClick={() => advance(-1)} ariaLabel="Previous">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </CtrlButton>
        <div className="flex items-center gap-1.5">
          {CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show ${CARDS[i]!.kind}`}
              className={cn(
                "h-[3px] rounded-full transition-all duration-500",
                i === active ? "w-8 bg-ink" : "w-2 bg-ink-dim hover:bg-ink-muted",
              )}
            />
          ))}
        </div>
        <CtrlButton onClick={() => advance(1)} ariaLabel="Next">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </CtrlButton>
      </div>
    </div>
  );
}

function CtrlButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="size-9 rounded-full border border-line bg-panel/60 backdrop-blur-md text-ink-muted hover:text-ink hover:border-ink/30 hover:bg-panel transition-all flex items-center justify-center"
    >
      {children}
    </button>
  );
}

function CarouselCard({ card, featured }: { card: Card; featured: boolean }) {
  return (
    <div className="relative size-full rounded-3xl border border-line-bright bg-panel overflow-hidden shadow-2xl shadow-black/70">
      <CardVisual card={card} />

      {/* Top status pill */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-canvas/60 backdrop-blur-md px-2.5 py-1">
        <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] tracking-[0.18em] uppercase text-white/90 font-sans font-medium">
          {kindLabel(card.kind)}
        </span>
      </div>

      {/* Featured overlay */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
          className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-canvas via-canvas/90 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[9px] tracking-[0.22em] uppercase text-ink-muted font-sans flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
              You said
            </div>
            <span className="text-[9px] tracking-[0.18em] uppercase text-emerald-300/90 font-mono">
              4.2s
            </span>
          </div>
          <p className="font-serif italic text-ink text-[15px] leading-snug mb-3.5 line-clamp-2">
            &ldquo;{card.prompt}&rdquo;
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] tracking-[0.18em] uppercase text-emerald-400/90 font-sans font-medium flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Shipped
            </span>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-ink text-canvas text-[11px] font-sans font-semibold hover:opacity-90 transition-opacity"
            >
              Watch it build
              <span aria-hidden>→</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function kindLabel(k: Card["kind"]) {
  switch (k) {
    case "website":
      return "Website";
    case "social":
      return "Instagram";
    case "ad":
      return "Ad creative";
    case "copy":
      return "Copy variant";
    case "blog":
      return "Blog post";
  }
}

function CardVisual({ card }: { card: Card }) {
  if (card.image) {
    return (
      <>
        <Image
          src={card.image}
          alt={card.promptLabel}
          fill
          sizes="340px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas/70" />
      </>
    );
  }
  // Copy card — no image, render variant stack
  return (
    <div className="size-full bg-gradient-to-br from-panel via-panel to-canvas p-5 flex flex-col gap-3 justify-center">
      <div className="border border-line rounded-2xl bg-canvas p-4">
        <div className="text-[8px] tracking-[0.22em] uppercase text-ink-dim font-sans mb-1.5">
          Variant A
        </div>
        <div className="font-serif text-base leading-tight tracking-tight text-ink">
          The salon
          <br />
          <span className="italic text-ink-muted">that knows you</span>
        </div>
        <div className="mt-2 text-[9px] font-mono text-emerald-400/90 flex items-center gap-1">
          <span className="size-1 rounded-full bg-emerald-400" />
          12.4% CVR
        </div>
      </div>
      <div className="border border-line rounded-2xl bg-canvas/60 p-4 opacity-60">
        <div className="text-[8px] tracking-[0.22em] uppercase text-ink-dim font-sans mb-1.5">
          Variant B
        </div>
        <div className="font-serif text-base leading-tight tracking-tight text-ink-muted">
          Premium cuts
          <br />
          <span className="italic">on your schedule</span>
        </div>
        <div className="mt-2 text-[9px] font-mono text-ink-dim flex items-center gap-1">
          <span className="size-1 rounded-full bg-ink-dim" />
          7.1% CVR
        </div>
      </div>
    </div>
  );
}
