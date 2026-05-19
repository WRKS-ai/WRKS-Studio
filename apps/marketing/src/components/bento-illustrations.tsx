"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/* ============================================================
 * WebsitesBento — live Framer-canvas-style scene
 *
 * Animation choreography (loops every ~9s):
 *   t=0.0  Cursor sits idle bottom-right
 *   t=0.8  Cursor glides to "Hero" layer in sidebar → selects it
 *   t=1.6  Selection ring snaps to Hero in canvas, pink spec indicators fade in
 *   t=2.4  Cursor glides to headline text area inside canvas
 *   t=3.0  Text types out: "Modern cuts."
 *   t=4.0  Cursor glides to "Book now" button
 *   t=4.5  Button hover state, "Deployed v.42" chip rises
 *   t=6.5  Hold
 *   t=7.5  Fade everything → restart
 * ============================================================ */

type Step =
  | "idle"
  | "select-hero"
  | "show-spec"
  | "to-headline"
  | "typing"
  | "to-button"
  | "deployed";

const HEADLINE = "Modern cuts.";
const TYPING_MS = 70;

export function WebsiteFunnel() {
  const [step, setStep] = useState<Step>("idle");
  const [typed, setTyped] = useState("");

  // Choreography loop
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        setStep("idle");
        setTyped("");
        await wait(900);
        if (cancelled) return;

        setStep("select-hero");
        await wait(900);
        if (cancelled) return;

        setStep("show-spec");
        await wait(1000);
        if (cancelled) return;

        setStep("to-headline");
        await wait(700);
        if (cancelled) return;

        setStep("typing");
        for (let i = 0; i <= HEADLINE.length; i++) {
          if (cancelled) return;
          setTyped(HEADLINE.slice(0, i));
          await wait(TYPING_MS);
        }
        await wait(400);
        if (cancelled) return;

        setStep("to-button");
        await wait(900);
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
  const specOn =
    step === "show-spec" ||
    step === "to-headline" ||
    step === "typing" ||
    step === "to-button" ||
    step === "deployed";
  const headlineHover = step === "to-headline" || step === "typing";
  const buttonHover = step === "to-button" || step === "deployed";
  const deployed = step === "deployed";

  const cursorTarget = (() => {
    switch (step) {
      case "idle":
        return { left: "82%", top: "78%" };
      case "select-hero":
        return { left: "22%", top: "44%" };
      case "show-spec":
        return { left: "22%", top: "44%" };
      case "to-headline":
        return { left: "55%", top: "38%" };
      case "typing":
        return { left: "55%", top: "38%" };
      case "to-button":
        return { left: "60%", top: "62%" };
      case "deployed":
        return { left: "60%", top: "62%" };
    }
  })();

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-bright bg-canvas">
      {/* Subtle gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.12), transparent 60%)",
        }}
      />

      {/* Top toolbar — Desktop · 1200 / Breakpoint  */}
      <div className="absolute top-0 left-0 right-0 h-8 border-b border-line bg-canvas/70 backdrop-blur-md flex items-center px-3 gap-2">
        <span className="size-2 rounded-full bg-red-400/70" />
        <span className="size-2 rounded-full bg-amber-400/70" />
        <span className="size-2 rounded-full bg-emerald-400/70" />
        <span className="ml-3 flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400">
            <rect x="3" y="5" width="18" height="12" rx="1" />
          </svg>
          <span className="text-[9px] font-mono text-ink-muted">
            Desktop · 1200
          </span>
        </span>
        <span className="ml-auto text-[9px] font-mono text-sky-300/80 flex items-center gap-1">
          Breakpoint
          <span className="size-3.5 rounded border border-sky-400/40 flex items-center justify-center text-[10px] leading-none">
            +
          </span>
        </span>
      </div>

      {/* Layers sidebar */}
      <div className="absolute top-8 bottom-0 left-0 w-[32%] border-r border-line bg-panel/30 p-2">
        <div className="text-[8px] tracking-[0.2em] uppercase text-ink-dim font-sans mb-1.5 px-1">
          Layers
        </div>
        {[
          { label: "Navigation", active: false },
          { label: "Hero", active: true },
          { label: "Headline", indent: 1, active: false },
          { label: "Subtitle", indent: 1, active: false },
          { label: "Button", indent: 1, active: false },
          { label: "Booking form", active: false },
          { label: "Footer", active: false },
        ].map((l, i) => {
          const isSelected = l.active && selectionOn;
          return (
            <div
              key={i}
              className={`relative flex items-center gap-1.5 px-1.5 py-1 rounded text-[9px] font-mono transition-colors ${
                isSelected
                  ? "bg-sky-400/15 text-sky-200 ring-1 ring-sky-400/40"
                  : "text-ink-muted"
              }`}
              style={{ paddingLeft: `${6 + (l.indent ?? 0) * 10}px` }}
            >
              <span
                className={`size-1 rounded-full shrink-0 ${
                  isSelected ? "bg-sky-300" : "bg-ink-muted/40"
                }`}
              />
              <span>{l.label}</span>
            </div>
          );
        })}
      </div>

      {/* Canvas (right of sidebar) */}
      <div className="absolute top-8 bottom-0 left-[32%] right-0 p-3">
        {/* Page wireframe */}
        <div className="relative h-full rounded-md bg-canvas border border-line p-2.5 flex flex-col gap-2 overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between">
            <span className="h-1 w-8 rounded-full bg-white/70" />
            <div className="flex gap-1">
              <span className="h-1 w-3.5 rounded-full bg-white/30" />
              <span className="h-1 w-3.5 rounded-full bg-white/30" />
              <span className="h-1 w-3.5 rounded-full bg-white/30" />
            </div>
          </div>
          <div className="h-px bg-line" />

          {/* Hero — gets the selection ring */}
          <div className="relative grid grid-cols-[1fr_38%] gap-2 flex-1 -mx-0.5 px-0.5 py-0.5">
            {/* Selection ring around the hero */}
            <motion.div
              initial={false}
              animate={{
                opacity: selectionOn ? 1 : 0,
                scale: selectionOn ? 1 : 1.02,
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="pointer-events-none absolute -inset-1 rounded border-2 border-dashed border-sky-400/80"
              style={{
                boxShadow: "0 0 0 4px rgba(56,189,248,0.08)",
              }}
            />

            {/* Selection corner handles */}
            {selectionOn && (
              <>
                {[
                  { top: -3, left: -3 },
                  { top: -3, right: -3 },
                  { bottom: -3, left: -3 },
                  { bottom: -3, right: -3 },
                ].map((pos, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.04, duration: 0.2 }}
                    className="absolute size-1.5 rounded-sm bg-sky-400 ring-1 ring-canvas pointer-events-none"
                    style={pos as React.CSSProperties}
                  />
                ))}
              </>
            )}

            {/* Hero text column */}
            <div className="flex flex-col justify-center gap-1.5">
              {/* Headline with hover ring + typing */}
              <div className="relative">
                <motion.div
                  initial={false}
                  animate={{
                    opacity: headlineHover ? 1 : 0,
                  }}
                  transition={{ duration: 0.25 }}
                  className="pointer-events-none absolute -inset-1 rounded border border-dashed border-sky-300/60"
                />
                <div className="font-serif text-[13px] leading-none tracking-tight text-white min-h-[14px]">
                  {step === "typing" || step === "to-button" || step === "deployed" ? (
                    <>
                      {typed || HEADLINE}
                      {step === "typing" && (
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{
                            duration: 0.7,
                            repeat: Infinity,
                          }}
                          className="inline-block w-[1.5px] h-[12px] bg-sky-300 align-middle ml-0.5"
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-white/30">⌶</span>
                  )}
                </div>
              </div>

              <div className="h-2 w-3/4 rounded-full bg-white/25" />
              <div className="h-1 w-full rounded-full bg-white/15" />
              <div className="h-1 w-5/6 rounded-full bg-white/15" />

              <div className="flex gap-1.5 mt-1.5">
                {/* Book now — hover ring */}
                <div className="relative">
                  <motion.div
                    initial={false}
                    animate={{ opacity: buttonHover ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="pointer-events-none absolute -inset-1 rounded-full border border-dashed border-sky-300/70"
                  />
                  <span
                    className={`block h-3.5 px-2 rounded-full text-[8px] font-sans font-medium flex items-center transition-colors ${
                      buttonHover
                        ? "bg-white/80 text-canvas"
                        : "bg-white text-canvas"
                    }`}
                  >
                    Book now
                  </span>
                </div>
                <span className="h-3.5 px-2 rounded-full border border-line text-[8px] font-sans text-ink-muted flex items-center">
                  See styles
                </span>
              </div>
            </div>

            {/* Hero image area */}
            <div className="rounded bg-gradient-to-br from-panel to-canvas border border-line flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink-dim">
                <rect x="3" y="5" width="18" height="14" rx="1" />
                <circle cx="9" cy="11" r="2" />
                <path d="M21 17l-5-5-9 9" />
              </svg>
            </div>

            {/* Pink spec indicators — animate in on show-spec */}
            <AnimatePresence>
              {specOn && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="pointer-events-none absolute left-[58%] top-[30%] flex items-center gap-0.5"
                  >
                    <span className="h-px w-3 bg-pink-400" />
                    <span className="px-1 rounded-[2px] bg-pink-400 text-[7px] font-mono text-canvas leading-3">
                      24
                    </span>
                    <span className="h-px w-3 bg-pink-400" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="pointer-events-none absolute left-3 -top-1 flex items-center gap-0.5 flex-col"
                  >
                    <span className="w-px h-2 bg-pink-400" />
                    <span className="px-1 rounded-[2px] bg-pink-400 text-[7px] font-mono text-canvas leading-3">
                      16
                    </span>
                    <span className="w-px h-2 bg-pink-400" />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Below sections (placeholder) */}
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-[2/1] rounded-sm border border-line bg-canvas/60"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Nova cursor */}
      <motion.div
        initial={false}
        animate={cursorTarget}
        transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1] }}
        className="absolute pointer-events-none z-30 flex items-start gap-1"
        style={{ transform: "translate(-2px, -2px)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-sky-400 drop-shadow">
          <path
            d="M5 3l14 8-7 1-3 7L5 3z"
            fill="currentColor"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
        <span className="px-1.5 py-px rounded-md bg-sky-500 text-white text-[8px] font-sans font-semibold leading-3 shadow-md">
          Nova
        </span>
      </motion.div>

      {/* Deployed chip — appears after publish step */}
      <AnimatePresence>
        {deployed && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/40 backdrop-blur-md shadow-xl"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300">
              <path d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[9px] tracking-[0.18em] uppercase text-emerald-200 font-sans font-medium">
              Deployed v.42
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ============================================================
 * Placeholder exports — will rebuild after Websites is approved
 * ============================================================ */

export function SocialRadar() {
  return <Placeholder label="Social — coming next" />;
}

export function AdTarget() {
  return <Placeholder label="Ads — coming next" />;
}

export function CopyLadder() {
  return <Placeholder label="Copy — coming next" />;
}

export function BlogSpread() {
  return <Placeholder label="Blog — coming next" />;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-dashed border-line bg-canvas/40 flex items-center justify-center">
      <span className="text-[10px] tracking-[0.2em] uppercase text-ink-dim font-sans">
        {label}
      </span>
    </div>
  );
}
