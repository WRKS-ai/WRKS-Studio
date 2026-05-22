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

/* visual offsets per relative slot ( -2 … 2 ) — desktop */
const SLOT = [
  { rotY: 42, x: -490, z: -240, opacity: 0.22, scale: 0.78, blur: 5 }, // -2
  { rotY: 24, x: -280, z: -110, opacity: 0.65, scale: 0.9, blur: 2 }, // -1
  { rotY: 0, x: 0, z: 0, opacity: 1, scale: 1.06, blur: 0 }, // 0 center
  { rotY: -24, x: 280, z: -110, opacity: 0.65, scale: 0.9, blur: 2 }, // 1
  { rotY: -42, x: 490, z: -240, opacity: 0.22, scale: 0.78, blur: 5 }, // 2
];

/* tighter offsets so adjacent cards just peek on mobile */
const SLOT_MOBILE = [
  { rotY: 36, x: -200, z: -200, opacity: 0.0, scale: 0.78, blur: 6 }, // -2 hidden
  { rotY: 22, x: -130, z: -100, opacity: 0.55, scale: 0.86, blur: 2.5 }, // -1 peek
  { rotY: 0, x: 0, z: 0, opacity: 1, scale: 1, blur: 0 }, // 0 center
  { rotY: -22, x: 130, z: -100, opacity: 0.55, scale: 0.86, blur: 2.5 }, // 1 peek
  { rotY: -36, x: 200, z: -200, opacity: 0.0, scale: 0.78, blur: 6 }, // 2 hidden
];

const AUTO_MS = 5200;

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handle = () => setM(mq.matches);
    handle();
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);
  return m;
}

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const slots = isMobile ? SLOT_MOBILE : SLOT;

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
        className="relative h-[380px] sm:h-[500px] lg:h-[580px] flex items-center justify-center"
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
          const s = slots[slot + 2]!;
          const isCenter = slot === 0;
          return (
            <motion.div
              key={card.kind}
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
                duration: 1.8,
                ease: [0.16, 1, 0.3, 1],
                opacity: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
                filter: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
              }}
              className="absolute w-[240px] sm:w-[360px] lg:w-[420px] aspect-[3/4] select-none pointer-events-none"
              style={{ transformStyle: "preserve-3d", zIndex: 5 - Math.abs(slot) }}
            >
              <CarouselCard card={card} featured={isCenter} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Pagination dots — mobile-only, communicates 5-card carousel */}
      <div className="sm:hidden mt-6 flex items-center justify-center gap-1.5">
        {CARDS.map((c, i) => (
          <button
            key={c.kind}
            type="button"
            aria-label={`Show ${c.kind} card`}
            onClick={() => setActive(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? 18 : 5,
              height: 5,
              background:
                i === active
                  ? "rgba(255,255,255,0.85)"
                  : "rgba(255,255,255,0.22)",
            }}
          />
        ))}
      </div>
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
    </div>
  );
}

function CardVisual({ card }: { card: Card }) {
  return <HeroPreview kind={card.kind} />;
}
