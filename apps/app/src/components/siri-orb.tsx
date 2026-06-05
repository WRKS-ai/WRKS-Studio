"use client";

// Siri-style orb adapted from 21st.dev/Magic. Rotating layered
// conic-gradients blurred into an organic moving blob. The agent
// uses this as its presence on the page: speed up while speaking,
// slow down while listening, near-stationary while idle.
//
// Pass `colors` derived from the personality accent so the orb
// reflects whoever the user picked in Act One.

import { useId } from "react";

export interface SiriOrbProps {
  size?: string;
  className?: string;
  colors?: {
    bg?: string;
    c1?: string;
    c2?: string;
    c3?: string;
  };
  /** Seconds per full rotation. Lower = faster. */
  animationDuration?: number;
}

export function SiriOrb({
  size = "64px",
  className,
  colors,
  animationDuration = 20,
}: SiriOrbProps) {
  const id = useId().replace(/:/g, "");

  const defaultColors = {
    bg: "transparent",
    c1: "oklch(75% 0.15 350)",
    c2: "oklch(80% 0.12 200)",
    c3: "oklch(78% 0.14 280)",
  };
  const finalColors = { ...defaultColors, ...colors };

  const sizeValue = parseInt(size.replace("px", ""), 10) || 64;
  const blurAmount = Math.max(sizeValue * 0.08, 6);
  const contrastAmount = Math.max(sizeValue * 0.003, 1.6);

  return (
    <div
      data-siri-orb={id}
      className={className}
      style={
        {
          width: size,
          height: size,
          display: "grid",
          gridTemplateAreas: "stack",
          overflow: "hidden",
          borderRadius: "50%",
          position: "relative",
          background: `radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, transparent 70%)`,
          "--c1": finalColors.c1,
          "--c2": finalColors.c2,
          "--c3": finalColors.c3,
          "--animation-duration": `${animationDuration}s`,
          "--blur-amount": `${blurAmount}px`,
          "--contrast-amount": contrastAmount,
        } as React.CSSProperties
      }
    >
      <style>{`
        @property --angle-${id} {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        [data-siri-orb="${id}"]::before {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background:
            conic-gradient(
              from calc(var(--angle-${id}) * 1.2) at 30% 65%,
              var(--c3) 0deg,
              transparent 45deg 315deg,
              var(--c3) 360deg
            ),
            conic-gradient(
              from calc(var(--angle-${id}) * 0.8) at 70% 35%,
              var(--c2) 0deg,
              transparent 60deg 300deg,
              var(--c2) 360deg
            ),
            conic-gradient(
              from calc(var(--angle-${id}) * -1.5) at 65% 75%,
              var(--c1) 0deg,
              transparent 90deg 270deg,
              var(--c1) 360deg
            ),
            conic-gradient(
              from calc(var(--angle-${id}) * 2.1) at 25% 25%,
              var(--c2) 0deg,
              transparent 30deg 330deg,
              var(--c2) 360deg
            ),
            conic-gradient(
              from calc(var(--angle-${id}) * -0.7) at 80% 80%,
              var(--c1) 0deg,
              transparent 45deg 315deg,
              var(--c1) 360deg
            ),
            radial-gradient(
              ellipse 120% 80% at 40% 60%,
              var(--c3) 0%,
              transparent 50%
            );
          filter: blur(var(--blur-amount)) contrast(var(--contrast-amount)) saturate(1.25);
          animation: rotate-${id} var(--animation-duration) linear infinite;
          transform: translateZ(0);
          will-change: transform;
        }
        [data-siri-orb="${id}"]::after {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 45% 55%,
            rgba(255, 255, 255, 0.12) 0%,
            rgba(255, 255, 255, 0.05) 30%,
            transparent 60%
          );
          mix-blend-mode: overlay;
        }
        @keyframes rotate-${id} {
          from { --angle-${id}: 0deg; }
          to { --angle-${id}: 360deg; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-siri-orb="${id}"]::before { animation: none; }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
 * Helper: derive a triadic orb-color palette from a single hex
 * accent so the orb feels keyed to the personality without us
 * hand-picking 3 colors per agent. Uses oklch so the shifted
 * variants stay perceptually balanced.
 *
 * Each personality's hex gets converted to an OKLCH base hue,
 * and we return c1 / c2 / c3 with hue offsets (±25° / ±50°) that
 * read as "the same color family, lit from three sides".
 * ============================================================ */
export function orbColorsFromAccent(hex: string): {
  c1: string;
  c2: string;
  c3: string;
} {
  const { l, c, h } = hexToOklch(hex);
  return {
    c1: `oklch(${l}% ${c} ${h})`,
    c2: `oklch(${Math.min(l + 8, 92)}% ${c} ${(h + 28) % 360})`,
    c3: `oklch(${Math.max(l - 6, 40)}% ${c} ${(h + 340) % 360})`,
  };
}

function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  // sRGB -> linear
  const lin = (v: number) =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const rl = lin(r);
  const gl = lin(g);
  const bl = lin(b);
  // linear sRGB -> OKLab (Björn Ottosson)
  const l_ = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m_ = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s_ = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return {
    l: Math.round(L * 100),
    c: +C.toFixed(3),
    h: Math.round(H),
  };
}
