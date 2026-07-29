"use client";

// AnalogPanel — the editorial-analog left-rail panel that replaces
// the old ChatCard + JobStatusPill + AgentLogFooter stack.
//
// Every animation references a physical/analog thing (not digital
// glow). Seven signature motions:
//
//   1. SVG pen-stroke border draws itself in on mount (900ms)
//   2. Live status verb uses split-flap character animation (like an
//      airport departure board)
//   3. Wet-ink SVG progress bar with turbulence-filter organic edge
//   4. Typewriter reveal for the agent copy with wet-ink cursor
//   5. Flip-clock digit rotation on step numbers
//   6. Subtle printed-paper grain overlay (slow drift)
//   7. Candle-breath warm shadow underneath (8s cycle)
//   + Bonus: dust motes drifting across the panel
//
// No rotating gradient borders. No purple/pink halos. No mono-caps
// AGENT/YOU chips. Editorial magazine restraint.

import { useEffect, useMemo, useRef, useState } from "react";

type Step = {
  id: string;
  label: string;
  state: "pending" | "active" | "done";
};

type Props = {
  projectTitle: string;
  userPrompt: string;
  agentReply: string;
  liveVerb: string | null;
  bytes: number;
  estRemainingMs: number | null;
  elapsedMs: number;
  isDone: boolean;
  steps: Step[];
  accent: string;
  error: string | null;
};

const CARD_WIDTH = 340;
const IVORY = "rgba(245,240,230,0.14)";
const IVORY_STRONG = "rgba(245,240,230,0.9)";
const IVORY_MUTED = "rgba(245,240,230,0.5)";
const IVORY_DIM = "rgba(245,240,230,0.35)";

export function AnalogPanel({
  projectTitle,
  userPrompt,
  agentReply,
  liveVerb,
  bytes,
  estRemainingMs,
  elapsedMs,
  isDone,
  steps,
  accent,
  error,
}: Props) {
  return (
    <div
      style={{
        position: "relative",
        width: CARD_WIDTH,
      }}
    >
      {/* Candle-breath shadow — sits behind the card, breathes on 8s */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -6,
          borderRadius: 20,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(160,120,80,0.14), transparent 70%)",
          filter: "blur(20px)",
          animation: "wrks-candle 8s ease-in-out infinite",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          background: "rgba(15,14,18,0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow:
            "0 30px 60px -30px rgba(120,90,60,0.28), 0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        {/* Paper grain overlay — slowly drifts */}
        <PaperGrain />

        {/* Dust motes */}
        <DustMotes />

        {/* SVG pen-stroke border — draws itself in on mount, then static */}
        <PenStrokeBorder />

        {/* Panel body */}
        <div
          style={{
            position: "relative",
            zIndex: 3,
            padding: "16px 18px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* HEADER — brand mark + menu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.22em",
                color: IVORY_MUTED,
                textTransform: "lowercase",
              }}
            >
              wrks
            </span>
            <button
              type="button"
              aria-label="Menu"
              style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                color: IVORY_MUTED,
                cursor: "pointer",
                padding: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          </div>

          <HairlineRule />

          {/* DATELINE — project + elapsed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: IVORY_MUTED,
              }}
            >
              {projectTitle}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: IVORY_DIM,
                letterSpacing: "-0.003em",
              }}
            >
              {isDone ? "Draft · complete" : "Draft"} · {formatElapsed(elapsedMs)} elapsed
            </span>
          </div>

          {/* USER BRIEF — quote block with hairline left rule */}
          <div
            style={{
              position: "relative",
              paddingLeft: 12,
              borderLeft: `1.5px solid ${accent}`,
              opacity: 0,
              animation: "wrks-fade-up 500ms ease-out 200ms both",
            }}
          >
            <span
              style={{
                fontSize: 13.5,
                color: IVORY_STRONG,
                letterSpacing: "-0.003em",
                lineHeight: 1.5,
              }}
            >
              {userPrompt}
            </span>
          </div>

          {/* AGENT BODY — typewriter reveal */}
          <div
            style={{
              opacity: 0,
              animation: "wrks-fade-up 500ms ease-out 500ms both",
              maxHeight: 300,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            <TypewriterText
              text={agentReply}
              speedMs={35}
              style={{
                fontSize: 14.5,
                lineHeight: 1.65,
                letterSpacing: "-0.003em",
                color: IVORY_STRONG,
                fontFamily: "var(--font-sans)",
              }}
              cursorColor={accent}
              paused={agentReply.length === 0}
            />
          </div>

          <HairlineRule />

          {/* STEPS — flip-clock digits */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: IVORY_MUTED,
                marginBottom: 6,
              }}
            >
              Steps
            </span>
            {steps.map((step, i) => (
              <StepRow key={step.id} step={step} index={i + 1} accent={accent} />
            ))}
          </div>

          <HairlineRule />

          {/* WET-INK PROGRESS BAR */}
          <InkProgressBar
            bytes={bytes}
            isDone={isDone}
            accent={accent}
          />

          {/* MICRO STATUS + SPLIT-FLAP LIVE VERB */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              minHeight: 16,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.08em",
                color: IVORY_DIM,
              }}
            >
              {bytes > 0 ? `${Math.round(bytes / 1000)} KB` : "0 KB"}
              {estRemainingMs != null && !isDone && (
                <span> · ~{formatShortTime(estRemainingMs)} left</span>
              )}
              {isDone && <span> · complete</span>}
            </span>
            {!isDone && liveVerb && (
              <SplitFlapText
                value={liveVerb}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.06em",
                  color: accent,
                }}
              />
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: 6,
                padding: "8px 10px",
                borderRadius: 6,
                background: "rgba(255,120,110,0.08)",
                border: "1px solid rgba(255,120,110,0.16)",
                fontSize: 12,
                color: "#ff9d98",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Global keyframes for this component */}
      <style>{`
        @keyframes wrks-draw-border {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes wrks-fade-up {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wrks-candle {
          0%, 100% { opacity: 0.75; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(1px) scale(1.02); }
        }
        @keyframes wrks-grain-drift {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-6px, 4px); }
          50%  { transform: translate(4px, -3px); }
          75%  { transform: translate(-3px, -5px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes wrks-cursor-blink {
          0%, 55% { opacity: 1; }
          56%, 100% { opacity: 0; }
        }
        @keyframes wrks-flip {
          0%   { transform: rotateX(0deg); }
          50%  { transform: rotateX(90deg); }
          100% { transform: rotateX(0deg); }
        }
        @keyframes wrks-mote-a {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { transform: translate(340px, -40px); opacity: 0; }
        }
        @keyframes wrks-mote-b {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.4; }
          100% { transform: translate(-320px, 60px); opacity: 0; }
        }
        @keyframes wrks-mote-c {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 0.35; }
          90%  { opacity: 0.35; }
          100% { transform: translate(310px, 30px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Signature 1: SVG pen-stroke border
// ============================================================
function PenStrokeBorder() {
  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <rect
        x="1"
        y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx="17"
        fill="none"
        stroke={IVORY}
        strokeWidth="1"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: "wrks-draw-border 900ms cubic-bezier(0.65, 0, 0.35, 1) forwards",
        }}
      />
    </svg>
  );
}

// ============================================================
// Signature 6: Paper grain overlay
// ============================================================
function PaperGrain() {
  const grainSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='240' height='240' filter='url(%23n)' opacity='0.7'/></svg>`;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: -20,
        opacity: 0.05,
        pointerEvents: "none",
        backgroundImage: `url("${grainSvg}")`,
        backgroundRepeat: "repeat",
        animation: "wrks-grain-drift 40s ease-in-out infinite",
        mixBlendMode: "screen",
        zIndex: 1,
      }}
    />
  );
}

// ============================================================
// Bonus: Dust motes
// ============================================================
function DustMotes() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {[
        { top: "22%", left: -6, anim: "wrks-mote-a 62s linear infinite", delay: "-4s" },
        { top: "58%", left: "100%", anim: "wrks-mote-b 74s linear infinite", delay: "-22s" },
        { top: "78%", left: -6, anim: "wrks-mote-c 88s linear infinite", delay: "-50s" },
      ].map((m, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: m.top,
            left: m.left,
            width: 2,
            height: 2,
            borderRadius: "50%",
            background: "rgba(245,240,230,0.45)",
            animation: m.anim,
            animationDelay: m.delay,
            boxShadow: "0 0 3px rgba(245,240,230,0.3)",
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Signature 2: Split-flap character animation
// ============================================================
const FLAP_GLYPHS = "abcdefghijklmnopqrstuvwxyz▓▒░";

function SplitFlapText({
  value,
  style,
}: {
  value: string;
  style?: React.CSSProperties;
}) {
  const [displayed, setDisplayed] = useState(value);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(value);

  useEffect(() => {
    targetRef.current = value;
    // If already showing the target, skip
    if (displayed === value) return;

    const start = displayed;
    const target = value;
    const maxLen = Math.max(start.length, target.length);
    let tick = 0;
    const flipsPerChar = 6;
    const stepMs = 40;
    let lastTick = performance.now();

    const step = (now: number) => {
      if (now - lastTick < stepMs) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      lastTick = now;
      tick++;

      const chars: string[] = [];
      for (let i = 0; i < maxLen; i++) {
        const targetChar = target[i] ?? "";
        const settleAt = flipsPerChar + i * 2;
        if (tick >= settleAt) {
          chars.push(targetChar);
        } else {
          chars.push(FLAP_GLYPHS[Math.floor(Math.random() * FLAP_GLYPHS.length)]!);
        }
      }
      setDisplayed(chars.join(""));

      if (tick >= flipsPerChar + maxLen * 2) {
        setDisplayed(target);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span
      style={{
        display: "inline-block",
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {displayed}
    </span>
  );
}

// ============================================================
// Signature 3: Wet-ink SVG progress bar
// ============================================================
function InkProgressBar({
  bytes,
  isDone,
  accent,
}: {
  bytes: number;
  isDone: boolean;
  accent: string;
}) {
  const EST_TOTAL_BYTES = 65_000;
  const progress = isDone ? 1 : Math.min(0.98, Math.max(0.02, bytes / EST_TOTAL_BYTES));
  const filterId = "wrks-ink-bleed";

  return (
    <div style={{ position: "relative", height: 4 }}>
      <svg
        width="100%"
        height="4"
        style={{ display: "block" }}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id={filterId} x="-4%" y="-100%" width="108%" height="300%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9 1.4"
              numOctaves="2"
              seed="7"
              result="turb"
            />
            <feDisplacementMap in="SourceGraphic" in2="turb" scale="1.8" />
          </filter>
        </defs>
        {/* Track */}
        <rect x="0" y="1.5" width="100%" height="1" rx="0.5" fill="rgba(245,240,230,0.08)" />
        {/* Ink fill */}
        <rect
          x="0"
          y="0"
          height="4"
          fill={accent}
          filter={`url(#${filterId})`}
          style={{
            width: `${progress * 100}%`,
            transition: "width 900ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
    </div>
  );
}

// ============================================================
// Signature 4: Typewriter reveal
// ============================================================
function TypewriterText({
  text,
  speedMs,
  style,
  cursorColor,
  paused,
}: {
  text: string;
  speedMs: number;
  style?: React.CSSProperties;
  cursorColor: string;
  paused: boolean;
}) {
  const [visible, setVisible] = useState(0);
  const targetRef = useRef(text);

  // Reset when text changes drastically (agentReply completely swapped)
  useEffect(() => {
    if (text.startsWith(targetRef.current) === false) {
      setVisible(0);
    }
    targetRef.current = text;
  }, [text]);

  useEffect(() => {
    if (paused) return;
    if (visible >= text.length) return;
    const jitter = Math.random() * 25;
    const t = setTimeout(() => setVisible((v) => v + 1), speedMs + jitter);
    return () => clearTimeout(t);
  }, [visible, text, speedMs, paused]);

  const done = visible >= text.length;
  const rendered = text.slice(0, visible);

  return (
    <span style={style}>
      {rendered}
      {!done && (
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: "1em",
            marginLeft: 1,
            marginBottom: -2,
            verticalAlign: "text-bottom",
            background: cursorColor,
            animation: "wrks-cursor-blink 1.1s steps(1) infinite",
            borderRadius: 1,
          }}
        />
      )}
    </span>
  );
}

// ============================================================
// Signature 5: Flip-clock digit + step row
// ============================================================
function StepRow({
  step,
  index,
  accent,
}: {
  step: Step;
  index: number;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "24px 1fr auto",
        alignItems: "center",
        gap: 10,
        padding: "6px 0",
      }}
    >
      <FlipDigit
        value={index}
        active={step.state === "active"}
        done={step.state === "done"}
        accent={accent}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: step.state === "active" ? 500 : 400,
          color:
            step.state === "done"
              ? IVORY_DIM
              : step.state === "active"
              ? IVORY_STRONG
              : IVORY_MUTED,
          letterSpacing: "-0.005em",
          transition: "color 200ms",
        }}
      >
        {step.label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color:
            step.state === "active"
              ? accent
              : step.state === "done"
              ? IVORY_DIM
              : "rgba(245,240,230,0.2)",
        }}
      >
        {step.state === "done" ? "done" : step.state === "active" ? "now" : "—"}
      </span>
    </div>
  );
}

function FlipDigit({
  value,
  active,
  done,
  accent,
}: {
  value: number;
  active: boolean;
  done: boolean;
  accent: string;
}) {
  const [current, setCurrent] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value === current) return;
    setFlipping(true);
    const t = setTimeout(() => {
      setCurrent(value);
      setFlipping(false);
    }, 200);
    return () => clearTimeout(t);
  }, [value, current]);

  const color = active ? accent : done ? IVORY_MUTED : "rgba(245,240,230,0.25)";
  const borderColor = active
    ? accent
    : done
    ? IVORY
    : "rgba(245,240,230,0.08)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 4,
        border: `1px solid ${borderColor}`,
        background: active ? `${withAlpha(accent, 0.08)}` : "transparent",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        color,
        perspective: "80px",
        boxShadow: active ? `0 0 12px ${withAlpha(accent, 0.35)}` : "none",
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: flipping ? "rotateX(90deg)" : "rotateX(0deg)",
          transition: "transform 200ms cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      >
        {String(current).padStart(1, "0")}
      </span>
    </span>
  );
}

// ============================================================
// Utils
// ============================================================
function HairlineRule() {
  return (
    <div
      style={{
        height: 1,
        background: "rgba(245,240,230,0.06)",
      }}
    />
  );
}

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("rgba") || hex.startsWith("hsl")) return hex;
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return `rgba(125, 92, 255, ${alpha})`;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatShortTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m < 3 && s > 0) return `${m}m ${s}s`;
  return `${m}m`;
}

// Suppress unused-import via useMemo re-export (keeps hooks graph stable)
export const _keepAlive = { useMemo };
