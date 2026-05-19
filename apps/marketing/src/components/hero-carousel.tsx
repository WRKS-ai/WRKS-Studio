"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HeroPreview } from "./hero-card-mockups";

type Kind = "website" | "social" | "ad" | "copy" | "blog";

type Card = {
  kind: Kind;
  image?: string;
  promptLabel: string;
  prompt: string;
  glow: string; // rgba color for active-card glow
};

const CARDS: Card[] = [
  {
    kind: "website",
    image: "/mockups/salon-interior.png",
    promptLabel: "Build my Hannah's Hair landing page",
    prompt:
      "Build a landing page for my hair salon. Booking, gallery, and pricing.",
    glow: "rgba(251, 191, 36, 0.22)", // amber
  },
  {
    kind: "social",
    image: "/mockups/stylized-portrait.png",
    promptLabel: "Friday post about the new latte menu",
    prompt: "Schedule a Friday Instagram post about our new latte menu.",
    glow: "rgba(244, 114, 182, 0.22)", // rose
  },
  {
    kind: "ad",
    image: "/mockups/hair-closeup.png",
    promptLabel: "March promo · social + banner + discount",
    prompt:
      "20% promo for March. Social post, banner on my site, discount code.",
    glow: "rgba(251, 146, 60, 0.22)", // orange
  },
  {
    kind: "copy",
    promptLabel: "Hero copy that converts",
    prompt: "Write hero copy for a returning-customers discount offer.",
    glow: "rgba(167, 139, 250, 0.22)", // violet
  },
  {
    kind: "blog",
    image: "/mockups/salon-mirror.png",
    promptLabel: "Blog post · trimming layered hair",
    prompt: "Draft an SEO blog post on how often to trim layered hair.",
    glow: "rgba(52, 211, 153, 0.22)", // emerald
  },
];

/* visual offsets per relative slot ( -2 … 2 ) */
const SLOT = [
  { rotY: 42, x: -490, z: -240, opacity: 0.22, scale: 0.78, blur: 5 }, // -2
  { rotY: 24, x: -280, z: -110, opacity: 0.65, scale: 0.9, blur: 2 }, // -1
  { rotY: 0, x: 0, z: 0, opacity: 1, scale: 1.06, blur: 0 }, // 0 center
  { rotY: -24, x: 280, z: -110, opacity: 0.65, scale: 0.9, blur: 2 }, // 1
  { rotY: -42, x: 490, z: -240, opacity: 0.22, scale: 0.78, blur: 5 }, // 2
];

const AUTO_MS = 5200;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
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

  const advance = useCallback(() => {
    setActive((a) => (a + 1) % CARDS.length);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(advance, AUTO_MS);
    return () => clearInterval(id);
  }, [advance, reduced]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    mx.set(x);
    my.set(y);
  };

  const handleMouseLeave = () => {
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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Per-card colored glow — fades between active card colors */}
      <AnimatePresence mode="sync">
        <motion.div
          key={CARDS[active]!.kind}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
          aria-hidden
        >
          <div
            className="size-[600px] sm:size-[820px] rounded-full"
            style={{
              background: `radial-gradient(circle, ${CARDS[active]!.glow}, transparent 65%)`,
              filter: "blur(110px)",
            }}
          />
        </motion.div>
      </AnimatePresence>
      {/* Inner breathing white glow */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
        aria-hidden
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="size-[320px] sm:size-[440px] rounded-full bg-white/[0.06] blur-[80px]" />
      </motion.div>

      <motion.div
        className="relative h-[440px] sm:h-[500px] lg:h-[580px] flex items-center justify-center"
        style={{
          perspective: "1800px",
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
                duration: 1.4,
                ease: [0.32, 0.72, 0, 1],
                opacity: { duration: 1.4, ease: [0.32, 0.72, 0, 1] },
                filter: { duration: 1.2, ease: [0.32, 0.72, 0, 1] },
              }}
              className="absolute w-[320px] sm:w-[360px] lg:w-[420px] aspect-[3/4] cursor-pointer select-none"
              style={{ transformStyle: "preserve-3d", zIndex: 5 - Math.abs(slot) }}
            >
              <CarouselCard card={card} featured={isCenter} />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function CarouselCard({ card, featured }: { card: Card; featured: boolean }) {
  return (
    <div
      className="relative size-full rounded-3xl border border-line-bright bg-panel overflow-hidden shadow-2xl shadow-black/70 transition-shadow duration-700"
      style={
        featured
          ? {
              boxShadow: `0 30px 80px -20px ${card.glow.replace("0.22", "0.55")}, 0 0 0 1px ${card.glow}, 0 25px 50px -12px rgba(0,0,0,0.7)`,
            }
          : undefined
      }
    >
      <CardVisual card={card} />

      {/* Top status pill — color matches card kind */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-canvas/60 backdrop-blur-md px-2.5 py-1">
        <span
          className="size-1 rounded-full animate-pulse"
          style={{ background: card.glow.replace("0.22", "1") }}
        />
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
  return <HeroPreview kind={card.kind} />;
}
