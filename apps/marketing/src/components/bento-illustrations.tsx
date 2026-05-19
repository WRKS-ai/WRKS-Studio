"use client";

import { motion } from "motion/react";

/* ============================================================
 * Shared atoms
 * ============================================================ */

function MeshBg({
  colors,
}: {
  colors: { x: number; y: number; color: string }[];
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {colors.map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 360,
            height: 360,
            left: `${c.x}%`,
            top: `${c.y}%`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${c.color}, transparent 65%)`,
            filter: "blur(60px)",
            opacity: 0.85,
          }}
          animate={{
            x: [0, 14, -10, 0],
            y: [0, -8, 12, 0],
          }}
          transition={{
            duration: 14 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5,
          }}
        />
      ))}
      {/* Subtle noise / grain */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(8,8,10,0.7) 100%)",
        }}
      />
    </div>
  );
}

function FloatingChip({
  children,
  className,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.6 + delay, duration: 0.5, ease: "easeOut" }}
      className={`absolute backdrop-blur-md border rounded-full px-2.5 py-1 flex items-center gap-1.5 text-[9px] tracking-[0.18em] uppercase font-sans font-medium shadow-xl ${className ?? ""}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
 * 1. WebsitesBento — glossy laptop with site preview
 * ============================================================ */

export function WebsiteFunnel() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-canvas">
      <MeshBg
        colors={[
          { x: 25, y: 30, color: "rgba(56,189,248,0.55)" },
          { x: 75, y: 70, color: "rgba(99,102,241,0.45)" },
          { x: 50, y: 50, color: "rgba(14,165,233,0.25)" },
        ]}
      />
      {/* Laptop */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 20 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 12 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%] w-[72%]"
        style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      >
        {/* Screen */}
        <div
          className="relative rounded-t-xl border border-white/15 bg-canvas/90 overflow-hidden"
          style={{
            aspectRatio: "16/10",
            boxShadow:
              "0 30px 60px -20px rgba(56,189,248,0.45), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Site mockup inside */}
          <div className="absolute inset-1.5 rounded-md overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5">
            {/* Site nav */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5">
              <span className="h-1 w-6 rounded-full bg-white/80" />
              <div className="flex gap-1">
                <span className="h-0.5 w-3 rounded-full bg-white/30" />
                <span className="h-0.5 w-3 rounded-full bg-white/30" />
              </div>
            </div>
            {/* Hero band */}
            <div
              className="relative px-2.5 py-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(56,189,248,0.15) 0%, transparent 50%, rgba(168,85,247,0.1) 100%)",
              }}
            >
              <div className="text-[7px] tracking-[0.22em] uppercase text-sky-300/80 font-sans mb-1">
                hannahshair
              </div>
              <div className="font-serif text-[10px] leading-tight text-white">
                Modern cuts.
              </div>
              <div className="font-serif italic text-[10px] leading-tight text-white/70 mb-1.5">
                Honest pricing.
              </div>
              <span className="inline-block h-3 px-1.5 rounded-full bg-white text-[6px] font-sans font-medium text-slate-900 leading-3">
                Book now
              </span>
            </div>
            {/* Grid */}
            <div className="grid grid-cols-3 gap-1 p-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded bg-gradient-to-br from-sky-400/10 to-violet-500/15 border border-white/5"
                />
              ))}
            </div>
          </div>
        </div>
        {/* Base */}
        <div
          className="mx-auto h-1.5 bg-gradient-to-b from-white/20 to-white/5 rounded-b-lg"
          style={{ width: "108%", marginLeft: "-4%" }}
        />
        {/* Reflection */}
        <div
          className="mx-auto h-6 -mt-1 rounded-full blur-md"
          style={{
            width: "80%",
            background:
              "radial-gradient(ellipse, rgba(56,189,248,0.35), transparent 60%)",
          }}
        />
      </motion.div>
      {/* Floating chips */}
      <FloatingChip
        delay={0}
        className="border-sky-400/40 bg-sky-400/10 text-sky-200"
        style={{ top: "16%", right: "8%" }}
      >
        <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
        hannahshair.com
      </FloatingChip>
      <FloatingChip
        delay={0.2}
        className="border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
        style={{ bottom: "12%", left: "8%" }}
      >
        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Deployed · v.42
      </FloatingChip>
    </div>
  );
}

/* ============================================================
 * 2. SocialBento — phone with IG post
 * ============================================================ */

export function SocialRadar() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-canvas">
      <MeshBg
        colors={[
          { x: 30, y: 30, color: "rgba(244,114,182,0.6)" },
          { x: 70, y: 70, color: "rgba(251,146,60,0.5)" },
          { x: 50, y: 50, color: "rgba(217,70,239,0.3)" },
        ]}
      />
      {/* Phone */}
      <motion.div
        initial={{ opacity: 0, y: 24, rotateY: 25 }}
        whileInView={{ opacity: 1, y: 0, rotateY: 14 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[52%] w-[34%]"
        style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      >
        <div
          className="relative rounded-[18px] border border-white/15 bg-canvas/95 overflow-hidden"
          style={{
            aspectRatio: "9/19",
            boxShadow:
              "0 30px 60px -20px rgba(244,114,182,0.55), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* notch */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-black/70" />
          {/* IG header */}
          <div className="absolute top-4 left-1 right-1 flex items-center gap-1 px-1.5">
            <div className="size-3 rounded-full bg-gradient-to-br from-rose-400 via-fuchsia-500 to-amber-400 p-[1px]">
              <div className="size-full rounded-full bg-canvas" />
            </div>
            <span className="text-[5px] font-sans font-semibold text-white">
              hannahshair
            </span>
          </div>
          {/* Image */}
          <div
            className="absolute top-7 left-1 right-1 aspect-square rounded overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #f472b6 0%, #d946ef 50%, #f59e0b 100%)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.3), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.45), transparent 60%)",
              }}
            />
            <div className="absolute bottom-1 left-1 font-serif italic text-[5px] leading-tight text-white">
              New looks
              <br />
              this season.
            </div>
            <div className="absolute top-1 right-1 px-1 py-px rounded-full bg-canvas/60 text-[4px] tracking-widest uppercase text-white font-sans">
              20% off
            </div>
          </div>
          {/* Icons row */}
          <div className="absolute bottom-1.5 left-1 right-1 flex items-center gap-1">
            <span className="size-1.5 rounded-sm bg-white/80" />
            <span className="size-1.5 rounded-sm bg-white/80" />
            <span className="size-1.5 rounded-sm bg-white/80" />
            <span className="ml-auto text-[4px] font-mono text-white/60">
              1.2k
            </span>
          </div>
        </div>
      </motion.div>
      {/* Floating notification chips */}
      <FloatingChip
        delay={0.2}
        className="border-rose-400/40 bg-rose-400/10 text-rose-200"
        style={{ top: "14%", left: "8%" }}
      >
        <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
        Posting Friday 9:00
      </FloatingChip>
      <FloatingChip
        delay={0.4}
        className="border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
        style={{ top: "32%", right: "7%" }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Approved
      </FloatingChip>
      <FloatingChip
        delay={0.6}
        className="border-amber-400/40 bg-amber-400/10 text-amber-200"
        style={{ bottom: "16%", right: "10%" }}
      >
        +3 platforms
      </FloatingChip>
    </div>
  );
}

/* ============================================================
 * 3. AdsBento — floating ad creative with metric chips
 * ============================================================ */

export function AdTarget() {
  const variants = [
    { id: "A", ctr: "4.2%", x: 12, y: 25 },
    { id: "C", ctr: "2.1%", x: 78, y: 70 },
  ];
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-canvas">
      <MeshBg
        colors={[
          { x: 50, y: 50, color: "rgba(251,191,36,0.55)" },
          { x: 80, y: 30, color: "rgba(251,146,60,0.4)" },
          { x: 20, y: 70, color: "rgba(217,119,6,0.3)" },
        ]}
      />
      {/* Loser variant cards in back */}
      {variants.map((v, i) => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, scale: 0.85, rotate: i === 0 ? -10 : 8 }}
          whileInView={{
            opacity: 0.55,
            scale: 0.65,
            rotate: i === 0 ? -10 : 8,
          }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
          className="absolute rounded-xl border border-white/10 bg-canvas/70 backdrop-blur-sm overflow-hidden"
          style={{
            left: `${v.x}%`,
            top: `${v.y}%`,
            width: "28%",
            aspectRatio: "4/5",
          }}
        >
          <div
            className="size-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(120,53,15,0.6) 0%, rgba(20,15,5,0.9) 100%)",
            }}
          />
          <div className="absolute top-1.5 left-1.5 text-[6px] font-mono text-amber-200/80">
            {v.id}
          </div>
          <div className="absolute bottom-1.5 right-1.5 text-[7px] font-mono text-amber-200/70">
            {v.ctr}
          </div>
        </motion.div>
      ))}
      {/* Winner — front and center */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%]"
        style={{ aspectRatio: "4/5" }}
      >
        <div
          className="relative size-full rounded-xl border border-amber-300/40 overflow-hidden"
          style={{
            boxShadow:
              "0 25px 50px -15px rgba(251,191,36,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 25%, rgba(254,243,199,0.4), transparent 50%), linear-gradient(135deg, #92400e 0%, #422006 50%, #1c0a02 100%)",
            }}
          />
          {/* Sponsored top */}
          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
            <span className="text-[5px] font-mono text-amber-200/70 tracking-widest">
              Sponsored
            </span>
            <span className="text-[5px] font-mono text-amber-200/70">B</span>
          </div>
          {/* Headline */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
            <div className="font-serif italic text-white text-sm leading-none drop-shadow">
              Hair that
            </div>
            <div className="font-serif text-white text-sm leading-none font-semibold mt-0.5 drop-shadow">
              remembers you.
            </div>
            <div className="mt-1.5 text-[5px] tracking-[0.22em] uppercase text-amber-200/90 font-sans">
              20% off this week
            </div>
          </div>
          {/* Bottom CTA */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <div className="h-3 rounded-full bg-white/95 flex items-center justify-center text-[6px] font-sans font-semibold text-slate-900">
              Book now
            </div>
          </div>
        </div>
      </motion.div>
      {/* Floating chips */}
      <FloatingChip
        delay={0.5}
        className="border-amber-300/50 bg-amber-400/15 text-amber-100"
        style={{ top: "14%", right: "8%" }}
      >
        <span className="size-1.5 rounded-full bg-amber-300 animate-pulse" />
        Winner · B
      </FloatingChip>
      <FloatingChip
        delay={0.7}
        className="border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
        style={{ bottom: "14%", left: "10%" }}
      >
        7.8% CTR ↑
      </FloatingChip>
    </div>
  );
}

/* ============================================================
 * 4. CopyBento — fanned stack of typography cards
 * ============================================================ */

export function CopyLadder() {
  const variants = [
    { rotate: -10, x: -28, scale: 0.92, opacity: 0.55, depth: 0 },
    { rotate: 8, x: 22, scale: 0.96, opacity: 0.75, depth: 1 },
    { rotate: -2, x: 0, scale: 1, opacity: 1, depth: 2 },
  ];
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-canvas">
      <MeshBg
        colors={[
          { x: 30, y: 35, color: "rgba(167,139,250,0.55)" },
          { x: 75, y: 70, color: "rgba(129,140,248,0.45)" },
          { x: 55, y: 55, color: "rgba(139,92,246,0.3)" },
        ]}
      />
      {/* Stacked cards */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[52%]">
        {variants.map((v, i) => {
          const isWinner = v.depth === 2;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, rotate: v.rotate }}
              whileInView={{
                opacity: v.opacity,
                y: 0,
                rotate: v.rotate,
                x: v.x,
                scale: v.scale,
              }}
              viewport={{ once: true }}
              transition={{
                delay: 0.2 + i * 0.15,
                duration: 0.7,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border overflow-hidden"
              style={{
                width: 170,
                aspectRatio: "5/3",
                zIndex: v.depth,
                background: isWinner
                  ? "linear-gradient(135deg, rgba(45,30,75,0.95) 0%, rgba(20,15,40,0.95) 100%)"
                  : "rgba(20,15,30,0.85)",
                borderColor: isWinner
                  ? "rgba(167,139,250,0.6)"
                  : "rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                boxShadow: isWinner
                  ? "0 25px 50px -15px rgba(167,139,250,0.55), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)"
                  : "0 15px 30px -10px rgba(0,0,0,0.6)",
              }}
            >
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[7px] font-mono ${
                      isWinner ? "text-violet-200" : "text-ink-dim"
                    }`}
                  >
                    Variant {i === 0 ? "C" : i === 1 ? "B" : "A"}
                  </span>
                  {isWinner && (
                    <span className="text-[7px] tracking-[0.18em] uppercase font-sans font-semibold text-violet-200">
                      Winner
                    </span>
                  )}
                </div>
                <div>
                  {i === 0 && (
                    <div className="font-serif text-[11px] leading-tight text-white/70">
                      Modern hair.{" "}
                      <span className="italic">Honest pricing.</span>
                    </div>
                  )}
                  {i === 1 && (
                    <div className="font-serif text-[11px] leading-tight text-white/80">
                      Premium cuts{" "}
                      <span className="italic">on your schedule</span>
                    </div>
                  )}
                  {i === 2 && (
                    <>
                      <div className="font-serif text-[14px] leading-tight text-white">
                        The salon
                      </div>
                      <div className="font-serif italic text-[14px] leading-tight text-white/85">
                        that knows you
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between text-[7px] font-mono">
                  <span
                    className={
                      isWinner ? "text-violet-200" : "text-ink-dim"
                    }
                  >
                    {i === 0 ? "5.8%" : i === 1 ? "7.1%" : "12.4%"} CVR
                  </span>
                  {isWinner && (
                    <span className="text-violet-300">+2.1× draft 1</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* Floating chip */}
      <FloatingChip
        delay={0.7}
        className="border-violet-400/50 bg-violet-400/15 text-violet-100"
        style={{ bottom: "12%", left: "50%", transform: "translateX(-50%)" }}
      >
        <span className="size-1.5 rounded-full bg-violet-300 animate-pulse" />
        Draft 3 of 7 won
      </FloatingChip>
    </div>
  );
}

/* ============================================================
 * 5. BlogBento — open magazine spread floating
 * ============================================================ */

export function BlogSpread() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-canvas">
      <MeshBg
        colors={[
          { x: 30, y: 30, color: "rgba(52,211,153,0.55)" },
          { x: 75, y: 70, color: "rgba(20,184,166,0.4)" },
          { x: 55, y: 55, color: "rgba(16,185,129,0.25)" },
        ]}
      />
      {/* Open spread */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 18 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 8 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] w-[78%]"
        style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      >
        <div
          className="relative grid grid-cols-2 rounded-lg border border-white/15 overflow-hidden"
          style={{
            aspectRatio: "16/10",
            boxShadow:
              "0 30px 60px -20px rgba(16,185,129,0.45), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, #f7f3e8 0%, #ede5d3 100%)",
          }}
        >
          {/* Center spine shadow */}
          <div
            className="absolute top-0 bottom-0 left-1/2 w-1.5 -translate-x-1/2 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)",
            }}
          />
          {/* Left page */}
          <div className="relative p-3 text-slate-900">
            <div className="text-[5px] tracking-[0.22em] uppercase text-emerald-700/80 font-mono mb-1.5">
              Hair care · No. 12
            </div>
            <div className="flex items-start gap-1">
              <div className="font-serif text-[36px] leading-none text-emerald-800 -mt-1">
                H
              </div>
              <div className="font-serif text-[10px] leading-tight pt-1.5">
                ow often should
                <br />
                you trim layered hair?
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {[100, 92, 86, 78, 92, 70].map((w, i) => (
                <div
                  key={i}
                  className="h-[3px] rounded-full bg-slate-900/15"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
          {/* Right page */}
          <div className="relative p-3 text-slate-900">
            <div className="aspect-[16/9] rounded mb-2 relative overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 30%, rgba(52,211,153,0.5), transparent 60%), linear-gradient(135deg, #047857 0%, #064e3b 50%, #022c22 100%)",
              }}
            >
              <div className="absolute bottom-1 left-1.5 text-[5px] font-mono text-emerald-100/80 tracking-widest">
                Mar 12, 2026
              </div>
            </div>
            <div className="space-y-1">
              {[100, 92, 86, 78, 92].map((w, i) => (
                <div
                  key={i}
                  className="h-[3px] rounded-full bg-slate-900/15"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-[5px] font-mono text-slate-900/50 tracking-widest">
              <span>page 1 of 3</span>
              <span>1,247 words</span>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Floating chips */}
      <FloatingChip
        delay={0.4}
        className="border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
        style={{ top: "14%", right: "8%" }}
      >
        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
        SEO 94
      </FloatingChip>
      <FloatingChip
        delay={0.6}
        className="border-white/20 bg-white/5 text-ink-muted"
        style={{ bottom: "14%", left: "10%" }}
      >
        4 min read
      </FloatingChip>
    </div>
  );
}
