"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/* ============================================================
 * Shared atoms
 * ============================================================ */

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function Toolbar({
  filename,
  right,
  rightColor = "sky",
}: {
  filename: string;
  right?: React.ReactNode;
  rightColor?: "sky" | "rose" | "amber" | "violet" | "emerald";
}) {
  const tone = {
    sky: "text-sky-300/80 border-sky-400/40",
    rose: "text-rose-300/80 border-rose-400/40",
    amber: "text-amber-300/80 border-amber-400/40",
    violet: "text-violet-300/80 border-violet-400/40",
    emerald: "text-emerald-300/80 border-emerald-400/40",
  }[rightColor];
  return (
    <div className="absolute top-0 left-0 right-0 h-8 border-b border-line bg-canvas/70 backdrop-blur-md flex items-center px-3 gap-2 z-10">
      <span className="size-2 rounded-full bg-red-400/70" />
      <span className="size-2 rounded-full bg-amber-400/70" />
      <span className="size-2 rounded-full bg-emerald-400/70" />
      <span className="ml-3 text-[9px] font-mono text-ink-muted truncate">
        {filename}
      </span>
      {right && (
        <span className={`ml-auto text-[9px] font-mono flex items-center gap-1 ${tone}`}>
          {right}
        </span>
      )}
    </div>
  );
}

function NovaCursor({
  to,
  color = "sky",
  show = true,
}: {
  to: { left: string; top: string };
  color?: "sky" | "rose" | "amber" | "violet" | "emerald";
  show?: boolean;
}) {
  const palette = {
    sky: { fill: "text-sky-400", bg: "bg-sky-500" },
    rose: { fill: "text-rose-400", bg: "bg-rose-500" },
    amber: { fill: "text-amber-400", bg: "bg-amber-500" },
    violet: { fill: "text-violet-400", bg: "bg-violet-500" },
    emerald: { fill: "text-emerald-400", bg: "bg-emerald-500" },
  }[color];
  return (
    <motion.div
      initial={false}
      animate={{ ...to, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1] }}
      className="absolute pointer-events-none z-30 flex items-start gap-1"
      style={{ transform: "translate(-2px, -2px)" }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" className={`${palette.fill} drop-shadow`}>
        <path
          d="M5 3l14 8-7 1-3 7L5 3z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`px-1.5 py-px rounded-md ${palette.bg} text-white text-[8px] font-sans font-semibold leading-3 shadow-md`}>
        Nova
      </span>
    </motion.div>
  );
}

function StatusChip({
  children,
  show,
  tone = "emerald",
  position,
}: {
  children: React.ReactNode;
  show: boolean;
  tone?: "emerald" | "sky" | "rose" | "amber" | "violet";
  position: React.CSSProperties;
}) {
  const palette = {
    emerald: "bg-emerald-400/15 border-emerald-400/40 text-emerald-200",
    sky: "bg-sky-400/15 border-sky-400/40 text-sky-200",
    rose: "bg-rose-400/15 border-rose-400/40 text-rose-200",
    amber: "bg-amber-400/15 border-amber-400/40 text-amber-200",
    violet: "bg-violet-400/15 border-violet-400/40 text-violet-200",
  }[tone];
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.92 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`absolute z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border shadow-xl text-[9px] tracking-[0.18em] uppercase font-sans font-medium ${palette}`}
          style={position}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
 * 1. Websites — Nova editing a hannahshair page
 * ============================================================ */

type WStep =
  | "idle"
  | "select-hero"
  | "show-spec"
  | "to-headline"
  | "typing"
  | "to-button"
  | "deployed";

const W_HEADLINE = "Modern cuts.";

export function WebsiteFunnel() {
  const [step, setStep] = useState<WStep>("idle");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        setStep("idle");
        setTyped("");
        await wait(800);
        if (cancelled) return;
        setStep("select-hero");
        await wait(800);
        if (cancelled) return;
        setStep("show-spec");
        await wait(900);
        if (cancelled) return;
        setStep("to-headline");
        await wait(600);
        if (cancelled) return;
        setStep("typing");
        for (let i = 0; i <= W_HEADLINE.length; i++) {
          if (cancelled) return;
          setTyped(W_HEADLINE.slice(0, i));
          await wait(70);
        }
        await wait(400);
        if (cancelled) return;
        setStep("to-button");
        await wait(800);
        if (cancelled) return;
        setStep("deployed");
        await wait(2400);
        if (cancelled) return;
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectionOn = step !== "idle";
  const specOn = ["show-spec", "to-headline", "typing", "to-button", "deployed"].includes(step);
  const headlineHover = step === "to-headline" || step === "typing";
  const buttonHover = step === "to-button" || step === "deployed";
  const deployed = step === "deployed";

  const cursor = (() => {
    switch (step) {
      case "idle": return { left: "82%", top: "78%" };
      case "select-hero":
      case "show-spec": return { left: "22%", top: "44%" };
      case "to-headline":
      case "typing": return { left: "55%", top: "38%" };
      case "to-button":
      case "deployed": return { left: "60%", top: "62%" };
    }
  })();

  return (
    <div className="relative w-full h-full min-h-[260px] overflow-hidden bg-canvas border-b border-line">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 30% 30%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.12), transparent 60%)",
      }}/>
      <Toolbar
        filename="hannahshair / Hero"
        rightColor="sky"
        right={<>Breakpoint <span className="size-3.5 rounded border border-sky-400/40 flex items-center justify-center text-[10px] leading-none">+</span></>}
      />
      <div className="absolute top-8 bottom-0 left-0 w-[32%] border-r border-line bg-panel/30 p-2">
        <div className="text-[8px] tracking-[0.2em] uppercase text-ink-dim font-sans mb-1.5 px-1">Layers</div>
        {[
          { label: "Navigation" },
          { label: "Hero", active: true },
          { label: "Headline", indent: 1 },
          { label: "Subtitle", indent: 1 },
          { label: "Button", indent: 1 },
          { label: "Footer" },
        ].map((l, i) => {
          const isSel = l.active && selectionOn;
          return (
            <div key={i}
              className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[9px] font-mono ${isSel ? "bg-sky-400/15 text-sky-200 ring-1 ring-sky-400/40" : "text-ink-muted"}`}
              style={{ paddingLeft: `${6 + (l.indent ?? 0) * 10}px` }}
            >
              <span className={`size-1 rounded-full ${isSel ? "bg-sky-300" : "bg-ink-muted/40"}`}/>
              <span>{l.label}</span>
            </div>
          );
        })}
      </div>
      <div className="absolute top-8 bottom-0 left-[32%] right-0 p-3">
        <div className="relative h-full rounded-md bg-canvas border border-line p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="h-1 w-8 rounded-full bg-white/70"/>
            <div className="flex gap-1">{[0,1,2].map(i=><span key={i} className="h-1 w-3.5 rounded-full bg-white/30"/>)}</div>
          </div>
          <div className="h-px bg-line"/>
          <div className="relative grid grid-cols-[1fr_38%] gap-2 flex-1 -mx-0.5 px-0.5 py-0.5">
            <motion.div initial={false} animate={{ opacity: selectionOn ? 1 : 0 }} transition={{ duration: 0.3 }}
              className="pointer-events-none absolute -inset-1 rounded border-2 border-dashed border-sky-400/80"
              style={{ boxShadow: "0 0 0 4px rgba(56,189,248,0.08)" }}/>
            {selectionOn && [
              { top: -3, left: -3 }, { top: -3, right: -3 }, { bottom: -3, left: -3 }, { bottom: -3, right: -3 },
            ].map((pos, i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 + i*0.04, duration: 0.2 }}
                className="absolute size-1.5 rounded-sm bg-sky-400 ring-1 ring-canvas pointer-events-none"
                style={pos as React.CSSProperties}/>
            ))}
            <div className="flex flex-col justify-center gap-1.5">
              <div className="relative">
                <motion.div initial={false} animate={{ opacity: headlineHover ? 1 : 0 }} transition={{ duration: 0.25 }}
                  className="pointer-events-none absolute -inset-1 rounded border border-dashed border-sky-300/60"/>
                <div className="font-serif text-[13px] leading-none tracking-tight text-white min-h-[14px]">
                  {step === "typing" || step === "to-button" || step === "deployed" ? (
                    <>{typed || W_HEADLINE}{step === "typing" && (
                      <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 0.7, repeat: Infinity }}
                        className="inline-block w-[1.5px] h-[12px] bg-sky-300 align-middle ml-0.5"/>)}</>
                  ) : <span className="text-white/30">⌶</span>}
                </div>
              </div>
              <div className="h-2 w-3/4 rounded-full bg-white/25"/>
              <div className="h-1 w-full rounded-full bg-white/15"/>
              <div className="h-1 w-5/6 rounded-full bg-white/15"/>
              <div className="flex gap-1.5 mt-1.5">
                <div className="relative">
                  <motion.div initial={false} animate={{ opacity: buttonHover ? 1 : 0 }} transition={{ duration: 0.25 }}
                    className="pointer-events-none absolute -inset-1 rounded-full border border-dashed border-sky-300/70"/>
                  <span className="block h-3.5 px-2 rounded-full bg-white text-canvas text-[8px] font-sans font-medium flex items-center">Book now</span>
                </div>
                <span className="h-3.5 px-2 rounded-full border border-line text-[8px] font-sans text-ink-muted flex items-center">See styles</span>
              </div>
            </div>
            <div className="rounded bg-gradient-to-br from-panel to-canvas border border-line flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink-dim">
                <rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-9 9"/>
              </svg>
            </div>
            <AnimatePresence>
              {specOn && (
                <>
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="pointer-events-none absolute left-[58%] top-[30%] flex items-center gap-0.5">
                    <span className="h-px w-3 bg-pink-400"/>
                    <span className="px-1 rounded-[2px] bg-pink-400 text-[7px] font-mono text-canvas leading-3">24</span>
                    <span className="h-px w-3 bg-pink-400"/>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-3 gap-1">{[0,1,2].map(i=><div key={i} className="aspect-[2/1] rounded-sm border border-line bg-canvas/60"/>)}</div>
        </div>
      </div>
      <NovaCursor to={cursor} color="sky"/>
      <StatusChip show={deployed} tone="emerald" position={{ bottom: "12px", right: "12px" }}>
        <span className="size-1.5 rounded-full bg-emerald-400"/>Deployed v.42
      </StatusChip>
    </div>
  );
}

/* ============================================================
 * 2. Social — Nova composing a post
 * ============================================================ */

type SStep = "idle" | "to-caption" | "typing" | "to-publish" | "scheduled";

const S_CAPTION = "New looks this season.";

export function SocialRadar() {
  const [step, setStep] = useState<SStep>("idle");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        setStep("idle"); setTyped(""); await wait(800);
        if (cancelled) return;
        setStep("to-caption"); await wait(700);
        if (cancelled) return;
        setStep("typing");
        for (let i = 0; i <= S_CAPTION.length; i++) {
          if (cancelled) return;
          setTyped(S_CAPTION.slice(0, i));
          await wait(55);
        }
        await wait(500);
        if (cancelled) return;
        setStep("to-publish"); await wait(700);
        if (cancelled) return;
        setStep("scheduled"); await wait(2400);
        if (cancelled) return;
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  const captionHover = step === "to-caption" || step === "typing";
  const publishHover = step === "to-publish";
  const scheduled = step === "scheduled";
  const hasText = step === "typing" || step === "to-publish" || step === "scheduled";

  const cursor = (() => {
    switch (step) {
      case "idle": return { left: "82%", top: "84%" };
      case "to-caption":
      case "typing": return { left: "42%", top: "62%" };
      case "to-publish":
      case "scheduled": return { left: "70%", top: "82%" };
    }
  })();

  return (
    <div className="relative w-full h-full min-h-[260px] overflow-hidden bg-canvas border-b border-line">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 30% 30%, rgba(244,114,182,0.18), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(251,146,60,0.12), transparent 60%)",
      }}/>
      <Toolbar
        filename="Compose / Instagram"
        rightColor="rose"
        right={<>Fri · 9:00 am</>}
      />
      {/* Single centered Instagram post mockup */}
      <div className="absolute inset-x-0 top-8 bottom-0 flex items-center justify-center p-4">
        <div className="flex gap-3 items-stretch w-full max-w-md">
          {/* Phone-shape post card */}
          <div className="relative w-[58%] rounded-xl border border-line-bright bg-canvas overflow-hidden shadow-xl shadow-rose-500/10">
            {/* Post header */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-line">
              <div className="size-5 rounded-full bg-gradient-to-br from-rose-400 via-fuchsia-500 to-amber-400 p-[1px]">
                <div className="size-full rounded-full bg-canvas flex items-center justify-center text-[7px] font-sans font-semibold text-white">h</div>
              </div>
              <span className="text-[9px] font-sans font-semibold text-white">@hannahshair</span>
              <span className="ml-auto text-ink-muted text-[9px]">···</span>
            </div>
            {/* Image */}
            <div className="relative aspect-square" style={{
              background: "radial-gradient(ellipse at 70% 30%, rgba(255,200,150,0.35), transparent 55%), linear-gradient(135deg, #f472b6 0%, #d946ef 45%, #f59e0b 100%)",
            }}>
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 80%, rgba(0,0,0,0.35), transparent 60%)" }}/>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-canvas/60 backdrop-blur text-[7px] tracking-widest uppercase text-white font-sans font-medium">
                20% off
              </div>
              <div className="absolute bottom-2 left-2.5 font-serif italic text-white text-[11px] leading-tight drop-shadow">
                New looks
                <br />
                this season.
              </div>
            </div>
            {/* Icons row */}
            <div className="px-2 py-1.5 flex items-center gap-2 border-t border-line">
              {["heart","comment","share"].map((k) => (
                <svg key={k} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-white/85">
                  {k === "heart" && <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>}
                  {k === "comment" && <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>}
                  {k === "share" && <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>}
                </svg>
              ))}
              <span className="ml-auto text-[8px] font-mono text-ink-dim">1,284 likes</span>
            </div>
          </div>
          {/* Right column: caption editor + publish */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="text-[8px] tracking-[0.2em] uppercase text-ink-dim font-sans">Caption</div>
            <div className="relative flex-1">
              <motion.div
                initial={false}
                animate={{ opacity: captionHover ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                className="pointer-events-none absolute -inset-1 rounded-md border-2 border-dashed border-rose-400/70"
                style={{ boxShadow: "0 0 0 3px rgba(244,114,182,0.08)" }}
              />
              <div className="size-full rounded-md bg-panel/40 border border-line p-2 text-[10px] font-serif italic text-white leading-snug overflow-hidden">
                {hasText ? (
                  <>
                    &ldquo;{typed || S_CAPTION}&rdquo;
                    {step === "typing" && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.7, repeat: Infinity }}
                        className="inline-block w-[1.5px] h-[10px] bg-rose-300 align-middle ml-0.5"
                      />
                    )}
                  </>
                ) : (
                  <span className="text-ink-dim not-italic">Write a caption…</span>
                )}
              </div>
            </div>
            {/* Publish button */}
            <div className="relative">
              <motion.div
                initial={false}
                animate={{ opacity: publishHover ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                className="pointer-events-none absolute -inset-1 rounded-full border border-dashed border-rose-300/70"
              />
              <motion.div
                animate={{ scale: publishHover ? 1.03 : 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "h-7 rounded-full flex items-center justify-center gap-1 text-[9px] font-sans font-semibold transition-colors",
                  scheduled ? "bg-emerald-400 text-emerald-950" : "bg-rose-400 text-rose-950",
                )}
              >
                {scheduled ? (
                  <>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                    Scheduled
                  </>
                ) : (
                  "Schedule"
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <NovaCursor to={cursor} color="rose"/>
      <StatusChip show={scheduled} tone="rose" position={{ bottom: "12px", left: "12px" }}>
        <span className="size-1.5 rounded-full bg-rose-400"/>Posting Friday 9:00 am
      </StatusChip>
    </div>
  );
}

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ============================================================
 * 3. Ads — Nova running an A/B/C test
 * ============================================================ */

type AStep = "idle" | "running" | "winner-rising" | "promoted";

export function AdTarget() {
  const [step, setStep] = useState<AStep>("idle");
  const [ctrA, setCtrA] = useState(2.1);
  const [ctrB, setCtrB] = useState(3.4);
  const [ctrC, setCtrC] = useState(1.6);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    const run = async () => {
      while (!cancelled) {
        setStep("idle");
        setCtrA(2.1); setCtrB(3.4); setCtrC(1.6);
        await wait(800);
        if (cancelled) return;
        setStep("running");
        // Tick CTRs upward, B grows fastest
        interval = setInterval(() => {
          setCtrA((v) => +(v + 0.18).toFixed(1));
          setCtrB((v) => +(v + 0.55).toFixed(1));
          setCtrC((v) => +(v + 0.08).toFixed(1));
        }, 220);
        await wait(2600);
        if (interval) { clearInterval(interval); interval = null; }
        setCtrA(4.2); setCtrB(7.8); setCtrC(2.1);
        if (cancelled) return;
        setStep("winner-rising");
        await wait(1100);
        if (cancelled) return;
        setStep("promoted");
        await wait(2000);
      }
    };
    void run();
    return () => { cancelled = true; if (interval) clearInterval(interval); };
  }, []);

  const running = step !== "idle";
  const winner = step === "winner-rising" || step === "promoted";

  const cursor = (() => {
    switch (step) {
      case "idle": return { left: "85%", top: "78%" };
      case "running": return { left: "50%", top: "52%" };
      case "winner-rising":
      case "promoted": return { left: "50%", top: "32%" };
    }
  })();

  const variants = [
    { id: "A", ctr: ctrA, win: false },
    { id: "B", ctr: ctrB, win: winner },
    { id: "C", ctr: ctrC, win: false },
  ];

  return (
    <div className="relative w-full h-full min-h-[260px] overflow-hidden bg-canvas border-b border-line">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 30% 30%, rgba(251,191,36,0.18), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(251,146,60,0.12), transparent 60%)",
      }}/>
      <Toolbar
        filename="Campaign · March promo"
        rightColor="amber"
        right={<>A/B/C · live<span className="size-1.5 rounded-full bg-amber-400 animate-pulse ml-1"/></>}
      />
      {/* 3 variant frames */}
      <div className="absolute top-12 left-3 right-3 grid grid-cols-3 gap-2.5">
        {variants.map((v, i) => (
          <motion.div key={v.id}
            initial={false}
            animate={{
              scale: v.win && step === "winner-rising" ? [1, 1.05, 1.04] : v.win && step === "promoted" ? 1.04 : 1,
              y: 0,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`relative rounded-lg overflow-hidden border ${v.win ? "border-amber-300/70" : "border-line"} ${step === "promoted" && !v.win ? "opacity-50" : "opacity-100"}`}
            style={{
              aspectRatio: "4/5",
              boxShadow: v.win ? "0 20px 40px -12px rgba(251,191,36,0.45)" : "none",
              transition: "opacity 0.5s ease, box-shadow 0.5s ease",
            }}
          >
            <div className="size-full" style={{
              background: i === 0
                ? "linear-gradient(135deg, #422006 0%, #1c0a02 100%)"
                : i === 1
                  ? "radial-gradient(ellipse at 30% 25%, rgba(254,243,199,0.45), transparent 50%), linear-gradient(135deg, #92400e 0%, #422006 50%, #1c0a02 100%)"
                  : "linear-gradient(135deg, #1f1a16 0%, #0a0a0a 100%)",
            }}>
              <div className="absolute top-1.5 left-1.5 text-[7px] font-mono text-amber-200/70 tracking-widest">Variant {v.id}</div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                <div className={`font-serif italic text-[9px] leading-tight ${v.win ? "text-white" : "text-white/60"}`}>Hair that</div>
                <div className={`font-serif text-[9px] leading-tight font-semibold ${v.win ? "text-white" : "text-white/60"}`}>remembers you.</div>
              </div>
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-baseline justify-between">
                <span className={`text-[7px] font-mono ${v.win ? "text-amber-200" : "text-ink-muted"}`}>CTR</span>
                <span className={`text-[10px] font-mono font-semibold tabular-nums ${v.win ? "text-amber-200" : "text-ink"}`}>{v.ctr.toFixed(1)}%</span>
              </div>
              {/* Live progress bar */}
              {running && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-canvas/40">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min(v.ctr * 12, 100)}%` }}
                    transition={{ duration: 0.3 }}
                    className={v.win ? "h-full bg-amber-300" : "h-full bg-ink-muted/60"}
                  />
                </div>
              )}
            </div>
            {/* Winner ribbon */}
            <AnimatePresence>
              {v.win && winner && (
                <motion.div
                  initial={{ opacity: 0, y: -8, rotate: -8 }}
                  animate={{ opacity: 1, y: 0, rotate: -8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                  className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded bg-amber-300 text-amber-950 text-[7px] font-sans font-bold tracking-widest uppercase shadow-lg"
                >
                  ★ Winner
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <NovaCursor to={cursor} color="amber"/>
      <StatusChip show={step === "promoted"} tone="amber" position={{ bottom: "12px", right: "12px" }}>
        <span className="size-1.5 rounded-full bg-amber-400"/>Auto-promoted · B
      </StatusChip>
    </div>
  );
}

/* ============================================================
 * 4. Copy — Nova switching variants, typography morphs
 * ============================================================ */

type CStep = "idle" | "to-A" | "show-A" | "to-B" | "show-B" | "to-C" | "show-C" | "to-A-final" | "show-A-final";

const COPY_VARIANTS = [
  { id: "A", head: "The salon", italic: "that knows you", cvr: 12.4, best: true },
  { id: "B", head: "Premium cuts", italic: "on your schedule", cvr: 7.1, best: false },
  { id: "C", head: "Modern hair.", italic: "Honest pricing.", cvr: 5.8, best: false },
];

export function CopyLadder() {
  const [step, setStep] = useState<CStep>("idle");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        const flow: CStep[] = [
          "idle", "to-A", "show-A", "to-B", "show-B", "to-C", "show-C", "to-A-final", "show-A-final",
        ];
        for (const s of flow) {
          if (cancelled) return;
          setStep(s);
          await wait(s.startsWith("show-A-final") ? 2200 : s.startsWith("show") ? 1100 : 600);
        }
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  const active = ((): typeof COPY_VARIANTS[number] => {
    if (step.includes("B")) return COPY_VARIANTS[1]!;
    if (step.includes("C")) return COPY_VARIANTS[2]!;
    return COPY_VARIANTS[0]!;
  })();

  const tabCursorIdx = ((): number => {
    if (step === "to-B" || step === "show-B") return 1;
    if (step === "to-C" || step === "show-C") return 2;
    return 0;
  })();

  const cursor = (() => {
    if (step === "idle") return { left: "80%", top: "82%" };
    if (step === "to-A" || step === "show-A" || step === "to-A-final" || step === "show-A-final") return { left: "20%", top: "80%" };
    if (step === "to-B" || step === "show-B") return { left: "40%", top: "80%" };
    return { left: "60%", top: "80%" };
  })();

  const promoted = step === "show-A-final";

  return (
    <div className="relative w-full h-full min-h-[260px] overflow-hidden bg-canvas border-b border-line">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 30% 30%, rgba(167,139,250,0.18), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(129,140,248,0.12), transparent 60%)",
      }}/>
      <Toolbar
        filename="Hero copy · variant test"
        rightColor="violet"
        right={<>3 of 7 live</>}
      />
      {/* Big typography preview */}
      <div className="absolute top-10 left-4 right-4 bottom-16 rounded-lg border border-line bg-panel/30 flex items-center justify-center overflow-hidden">
        <div className="text-center px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <div className="font-serif text-3xl leading-none tracking-tight text-white">{active.head}</div>
              <div className="font-serif italic text-3xl leading-none tracking-tight text-white/70 mt-1">{active.italic}</div>
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-mono">
                <span className="text-ink-muted">CVR</span>
                <span className={`font-semibold tabular-nums ${active.best ? "text-violet-300" : "text-ink"}`}>{active.cvr.toFixed(1)}%</span>
                {active.best && (
                  <span className="text-[8px] tracking-[0.18em] uppercase text-violet-300 font-sans font-medium ml-1">Winner</span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* Variant tabs at bottom */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center gap-1.5">
        {COPY_VARIANTS.map((v, i) => {
          const isHovered = i === tabCursorIdx && step !== "idle";
          const isActive = (i === 0 && (step === "show-A" || step === "show-A-final")) ||
                           (i === 1 && step === "show-B") ||
                           (i === 2 && step === "show-C");
          return (
            <div key={v.id} className="relative flex-1">
              <motion.div initial={false} animate={{ opacity: isHovered ? 1 : 0 }} transition={{ duration: 0.2 }}
                className="pointer-events-none absolute -inset-1 rounded-lg border border-dashed border-violet-300/60"/>
              <div className={`h-9 rounded-lg flex items-center justify-between px-2 text-[9px] font-mono transition-colors ${
                isActive ? "bg-violet-400/15 border border-violet-400/50 ring-1 ring-violet-400/20 text-violet-200" : "border border-line text-ink-muted"
              }`}>
                <span className="flex items-center gap-1">
                  <span className={`size-3.5 rounded flex items-center justify-center text-[7px] font-semibold ${isActive ? "bg-violet-400 text-violet-950" : "border border-line"}`}>{v.id}</span>
                  <span className="truncate hidden sm:inline">{v.head}</span>
                </span>
                <span className={`tabular-nums ${isActive ? "text-violet-200" : "text-ink-dim"}`}>{v.cvr.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <NovaCursor to={cursor} color="violet"/>
      <StatusChip show={promoted} tone="violet" position={{ top: "44px", right: "16px" }}>
        <span className="size-1.5 rounded-full bg-violet-400"/>A promoted · +2.1× vs C
      </StatusChip>
    </div>
  );
}

/* ============================================================
 * 5. Blog — Nova writing an article, SEO score climbs
 * ============================================================ */

type BStep = "idle" | "outline-fill" | "to-body" | "typing" | "score-climbing" | "published";

const B_TYPING = "The right interval depends on your texture. Fine hair…";

export function BlogSpread() {
  const [step, setStep] = useState<BStep>("idle");
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(58);
  const [outlineFilled, setOutlineFilled] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    const run = async () => {
      while (!cancelled) {
        setStep("idle"); setTyped(""); setScore(58); setOutlineFilled(0);
        await wait(700);
        if (cancelled) return;
        setStep("outline-fill");
        for (let i = 1; i <= 5; i++) {
          setOutlineFilled(i);
          await wait(280);
          if (cancelled) return;
        }
        await wait(400);
        if (cancelled) return;
        setStep("to-body"); await wait(700);
        if (cancelled) return;
        setStep("typing");
        for (let i = 0; i <= B_TYPING.length; i++) {
          if (cancelled) return;
          setTyped(B_TYPING.slice(0, i));
          await wait(28);
        }
        if (cancelled) return;
        setStep("score-climbing");
        interval = setInterval(() => {
          setScore((s) => Math.min(s + 2, 94));
        }, 60);
        await wait(1400);
        if (interval) { clearInterval(interval); interval = null; }
        setScore(94);
        if (cancelled) return;
        setStep("published"); await wait(2200);
      }
    };
    void run();
    return () => { cancelled = true; if (interval) clearInterval(interval); };
  }, []);

  const cursor = (() => {
    switch (step) {
      case "idle": return { left: "80%", top: "78%" };
      case "outline-fill": return { left: "22%", top: "48%" };
      case "to-body":
      case "typing":
      case "score-climbing":
      case "published": return { left: "60%", top: "55%" };
    }
  })();

  const headings = [
    "How often should you trim layered hair?",
    "Why layered hair grows differently",
    "The right interval for your texture",
    "Fine hair · 4–6 weeks",
    "Coarse hair · 8–10 weeks",
  ];

  return (
    <div className="relative w-full h-full min-h-[260px] overflow-hidden bg-canvas border-b border-line">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 25% 25%, rgba(52,211,153,0.18), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(20,184,166,0.12), transparent 60%)",
      }}/>
      <Toolbar
        filename="layered-cuts.md"
        rightColor="emerald"
        right={<>Auto-saved <span className="size-1.5 rounded-full bg-emerald-400"/></>}
      />
      {/* Outline panel */}
      <div className="absolute top-8 bottom-0 left-0 w-[40%] border-r border-line bg-panel/30 p-2">
        <div className="text-[8px] tracking-[0.2em] uppercase text-ink-dim font-sans mb-1.5 px-1">Outline</div>
        {headings.map((h, i) => {
          const filled = i < outlineFilled || step !== "idle" && step !== "outline-fill";
          const justFilled = step === "outline-fill" && i === outlineFilled - 1;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: filled ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-1.5 px-1 py-1 rounded text-[8px] ${
                justFilled ? "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/30" : "text-ink-muted"
              }`}
              style={{ paddingLeft: `${4 + Math.min(i, 3) * 8}px` }}
            >
              <span className="font-mono shrink-0 text-emerald-400/70">H{i < 1 ? 1 : i < 3 ? 2 : 3}</span>
              <span className="leading-tight">{h}</span>
            </motion.div>
          );
        })}
      </div>
      {/* Editor */}
      <div className="absolute top-8 bottom-0 left-[40%] right-0 p-3 flex flex-col">
        <div className="font-serif text-[14px] leading-tight tracking-tight text-white mb-2">
          The right interval for your texture
        </div>
        <div className="relative flex-1">
          {(step === "to-body" || step === "typing" || step === "score-climbing" || step === "published") && (
            <motion.div initial={false} animate={{ opacity: step === "to-body" || step === "typing" ? 1 : 0 }} transition={{ duration: 0.25 }}
              className="pointer-events-none absolute -inset-1 rounded border border-dashed border-emerald-400/60"/>
          )}
          <div className="font-sans text-[10px] leading-relaxed text-white/85 min-h-[40px]">
            {(step === "typing" || step === "score-climbing" || step === "published") ? (
              <>{typed}{step === "typing" && (
                <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 0.7, repeat: Infinity }}
                  className="inline-block w-[1.5px] h-[10px] bg-emerald-300 align-middle ml-0.5"/>
              )}</>
            ) : (
              <span className="text-ink-dim">Start writing…</span>
            )}
          </div>
        </div>
        {/* SEO score panel */}
        <div className="mt-2 rounded-md border border-line bg-canvas/60 p-2 grid grid-cols-3 gap-2">
          <div>
            <div className="text-[7px] tracking-[0.18em] uppercase text-ink-dim font-sans">SEO Score</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-[14px] font-mono font-semibold tabular-nums ${score >= 90 ? "text-emerald-300" : score >= 70 ? "text-amber-300" : "text-ink"}`}>{score}</span>
              <span className="text-[8px] font-mono text-ink-dim">/100</span>
            </div>
            {/* Bar */}
            <div className="mt-1 h-1 rounded-full bg-line overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`h-full ${score >= 90 ? "bg-emerald-400" : score >= 70 ? "bg-amber-400" : "bg-ink-muted"}`}
              />
            </div>
          </div>
          <div>
            <div className="text-[7px] tracking-[0.18em] uppercase text-ink-dim font-sans">Readability</div>
            <div className="text-[12px] font-mono font-semibold text-emerald-300 mt-0.5">A2</div>
          </div>
          <div>
            <div className="text-[7px] tracking-[0.18em] uppercase text-ink-dim font-sans">Words</div>
            <div className="text-[12px] font-mono font-semibold text-white mt-0.5 tabular-nums">1,247</div>
          </div>
        </div>
      </div>
      <NovaCursor to={cursor} color="emerald"/>
      <StatusChip show={step === "published"} tone="emerald" position={{ bottom: "12px", right: "12px" }}>
        <span className="size-1.5 rounded-full bg-emerald-400"/>Published · SEO 94
      </StatusChip>
    </div>
  );
}
