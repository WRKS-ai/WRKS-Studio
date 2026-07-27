"use client";

// Cursor-drawn page artboard.
//
// 1280×5200 blank glowing canvas — same dimensions as the final iframe
// (no size jump when the real page swaps in). A small speech-bubble
// cursor moves across the canvas in a top-to-bottom S-pattern, and at
// each target position a generic block (bar / box / tile) fades in.
// Byte count from generate.progress drives how many blocks have been
// drawn so far.
//
// No pre-fab section skeletons — this is intentional. The point is to
// show a designer at work, not to reveal a template.

import { useMemo } from "react";

type Props = {
  width?: number;
  bytes?: number | null;
  paletteHex?: string | null;
  brandName?: string | null;
};

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 5200;
const EST_TOTAL_BYTES = 65_000;

type BlockKind = "bar" | "wide-bar" | "pill" | "chip" | "square-slot" | "wide-slot" | "portrait-slot" | "text-cluster" | "big-headline";

type DrawTarget = {
  id: string;
  // Position in the 1280×5200 canvas
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BlockKind;
  tone: "dark" | "light" | "gradient";
  bytesAt: number;      // byte-count at which this block becomes drawn
  fillAlt?: string;     // alternate accent color override
};

// Hand-designed target sequence — cursor visits these in order. Spread
// top-to-bottom across the 5200px height. Positions loosely match the
// real site's section rhythm but the blocks are ABSTRACT (no fake nav,
// no fake hero). The elements are drawing-primitives.
const TARGETS: DrawTarget[] = [
  // === NAV area (y 0-90) ===
  { id: "nav-logo",    x: 60,   y: 34,   w: 120, h: 16, kind: "bar",       tone: "dark", bytesAt: 300 },
  { id: "nav-links",   x: 550,  y: 36,   w: 220, h: 12, kind: "wide-bar",  tone: "dark", bytesAt: 700 },
  { id: "nav-cta",     x: 1100, y: 26,   w: 120, h: 36, kind: "pill",      tone: "dark", bytesAt: 1200 },

  // === HERO (y 100-820) ===
  { id: "hero-eye",    x: 80,   y: 220,  w: 180, h: 16, kind: "bar",           tone: "dark", bytesAt: 2000 },
  { id: "hero-h",      x: 80,   y: 280,  w: 640, h: 180, kind: "big-headline", tone: "dark", bytesAt: 3200 },
  { id: "hero-sub",    x: 80,   y: 490,  w: 520, h: 60, kind: "text-cluster", tone: "dark", bytesAt: 5000 },
  { id: "hero-cta-1",  x: 80,   y: 580,  w: 170, h: 48, kind: "pill",         tone: "dark", bytesAt: 6200 },
  { id: "hero-cta-2",  x: 268,  y: 580,  w: 150, h: 48, kind: "pill",         tone: "dark", bytesAt: 6800 },
  { id: "hero-trust",  x: 80,   y: 660,  w: 380, h: 14, kind: "wide-bar",     tone: "dark", bytesAt: 7500 },
  { id: "hero-image",  x: 720,  y: 90,   w: 560, h: 700, kind: "portrait-slot", tone: "gradient", bytesAt: 8500 },

  // === MEGA-BENTO (y 900-1900) ===
  { id: "bento-h",     x: 80,   y: 940,  w: 460, h: 30, kind: "big-headline",  tone: "light", bytesAt: 10500 },
  { id: "bento-1",     x: 80,   y: 1020, w: 780, h: 380, kind: "wide-slot",   tone: "gradient", bytesAt: 12000 },
  { id: "bento-2",     x: 880,  y: 1020, w: 320, h: 780, kind: "portrait-slot", tone: "gradient", bytesAt: 13500 },
  { id: "bento-3",     x: 80,   y: 1420, w: 380, h: 380, kind: "square-slot", tone: "gradient", bytesAt: 15000 },
  { id: "bento-4",     x: 480,  y: 1420, w: 380, h: 380, kind: "square-slot", tone: "gradient", bytesAt: 16500 },
  { id: "bento-5",     x: 80,   y: 1820, w: 780, h: 240, kind: "wide-slot",   tone: "dark", bytesAt: 18000 },
  { id: "bento-6",     x: 880,  y: 1820, w: 320, h: 240, kind: "square-slot", tone: "gradient", bytesAt: 19500 },

  // === WATCHLIST (y 2140-2600) ===
  { id: "watch-eye",   x: 80,   y: 2200, w: 140, h: 14, kind: "bar",          tone: "light", bytesAt: 21000 },
  { id: "watch-h",     x: 80,   y: 2230, w: 440, h: 60, kind: "text-cluster", tone: "light", bytesAt: 22000 },
  { id: "watch-sub",   x: 80,   y: 2310, w: 420, h: 40, kind: "text-cluster", tone: "light", bytesAt: 22800 },
  { id: "watch-form",  x: 80,   y: 2370, w: 480, h: 180, kind: "wide-slot",   tone: "light", bytesAt: 24000 },
  { id: "watch-img",   x: 680,  y: 2140, w: 520, h: 460, kind: "square-slot", tone: "gradient", bytesAt: 25500 },

  // === COMMUNITY (y 2700-3400) ===
  { id: "comm-h",      x: 340,  y: 2760, w: 600, h: 40, kind: "text-cluster", tone: "light", bytesAt: 27000 },
  { id: "comm-lead",   x: 380,  y: 2820, w: 520, h: 20, kind: "wide-bar",     tone: "light", bytesAt: 28000 },
  { id: "comm-img",    x: 80,   y: 2880, w: 520, h: 380, kind: "wide-slot",   tone: "gradient", bytesAt: 29000 },
  { id: "comm-b1",     x: 720,  y: 2900, w: 460, h: 60, kind: "text-cluster", tone: "light", bytesAt: 30000 },
  { id: "comm-b2",     x: 720,  y: 2980, w: 460, h: 60, kind: "text-cluster", tone: "light", bytesAt: 30800 },
  { id: "comm-b3",     x: 720,  y: 3060, w: 460, h: 60, kind: "text-cluster", tone: "light", bytesAt: 31600 },
  { id: "comm-cta",    x: 720,  y: 3170, w: 160, h: 44, kind: "pill",         tone: "light", bytesAt: 32500 },

  // === HELP GRID (y 3500-3900) ===
  { id: "help-h",      x: 340,  y: 3540, w: 600, h: 30, kind: "text-cluster", tone: "light", bytesAt: 33500 },
  { id: "help-c1",     x: 180,  y: 3620, w: 280, h: 220, kind: "square-slot", tone: "light", bytesAt: 34200 },
  { id: "help-c2",     x: 500,  y: 3620, w: 280, h: 220, kind: "square-slot", tone: "light", bytesAt: 34900 },
  { id: "help-c3",     x: 820,  y: 3620, w: 280, h: 220, kind: "square-slot", tone: "light", bytesAt: 35600 },

  // === SPOTLIGHT (y 3960-4260) ===
  { id: "spot-card",   x: 80,   y: 3990, w: 1120, h: 260, kind: "wide-slot",  tone: "dark", bytesAt: 37500 },

  // === HERO SPLIT (y 4340-4800) ===
  { id: "hs-video",    x: 80,   y: 4380, w: 240, h: 400, kind: "portrait-slot", tone: "gradient", bytesAt: 39500 },
  { id: "hs-quote",    x: 340,  y: 4380, w: 260, h: 195, kind: "square-slot", tone: "gradient", bytesAt: 40800 },
  { id: "hs-photo",    x: 340,  y: 4585, w: 260, h: 195, kind: "square-slot", tone: "dark", bytesAt: 42000 },
  { id: "hs-eye",      x: 680,  y: 4460, w: 140, h: 14, kind: "bar",          tone: "light", bytesAt: 43000 },
  { id: "hs-h",        x: 680,  y: 4500, w: 500, h: 80, kind: "text-cluster", tone: "light", bytesAt: 43800 },
  { id: "hs-sub",      x: 680,  y: 4600, w: 480, h: 40, kind: "text-cluster", tone: "light", bytesAt: 44500 },
  { id: "hs-cta",      x: 680,  y: 4680, w: 170, h: 44, kind: "pill",         tone: "light", bytesAt: 45500 },

  // === FOOTER (y 4900-5200) ===
  { id: "foot-brand",  x: 80,   y: 4980, w: 200, h: 20, kind: "bar",          tone: "dark", bytesAt: 47000 },
  { id: "foot-c1",     x: 400,  y: 4980, w: 160, h: 100, kind: "text-cluster", tone: "dark", bytesAt: 47800 },
  { id: "foot-c2",     x: 640,  y: 4980, w: 160, h: 100, kind: "text-cluster", tone: "dark", bytesAt: 48600 },
  { id: "foot-c3",     x: 880,  y: 4980, w: 160, h: 100, kind: "text-cluster", tone: "dark", bytesAt: 49400 },
  { id: "foot-legal",  x: 80,   y: 5140, w: 380, h: 12, kind: "wide-bar",     tone: "dark", bytesAt: 50000 },
];

export function PageArtboardPending({
  width,
  bytes,
  paletteHex,
  brandName,
}: Props) {
  const w = width ?? CANVAS_WIDTH;
  const accent = paletteHex ?? "#7d5cff";
  const b = bytes ?? 0;

  // Index of the next-to-be-drawn target (cursor position sits here).
  const drawnCount = useMemo(() => {
    let count = 0;
    for (const t of TARGETS) if (b >= t.bytesAt) count++;
    if (b > 200 && count === 0) return 1; // prime the first draw
    return count;
  }, [b]);

  // Overall progress (0..1) for the top hairline bar
  const progress = Math.min(1, Math.max(0.02, b / EST_TOTAL_BYTES));

  // Cursor sits on the NEXT undrawn target (if any).
  const nextTarget = drawnCount < TARGETS.length ? TARGETS[drawnCount] : null;
  const cursor = nextTarget
    ? { x: nextTarget.x - 40, y: nextTarget.y - 6 }
    : { x: TARGETS[TARGETS.length - 1]!.x, y: TARGETS[TARGETS.length - 1]!.y };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Label above */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(245,240,230,0.9)",
          }}
        >
          Generating Screen…
        </span>
        <SpinnerDot />
      </div>

      {/* The artboard */}
      <div
        className="page-artboard"
        style={{
          width: w,
          height: CANVAS_HEIGHT,
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          background:
            "linear-gradient(160deg, #f4f0ff 0%, #e8f0ff 45%, #fce8f5 100%)",
          boxShadow:
            "0 40px 100px -40px rgba(120,90,255,0.35), 0 2px 6px rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}
      >
        {/* Ambient breathing glow layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse 60% 40% at 20% 15%, ${withAlpha(accent, 0.22)}, transparent 55%),
              radial-gradient(ellipse 50% 35% at 85% 30%, rgba(236,72,153,0.16), transparent 55%),
              radial-gradient(ellipse 55% 35% at 60% 60%, rgba(96,165,250,0.18), transparent 55%),
              radial-gradient(ellipse 45% 30% at 25% 85%, rgba(167,139,250,0.14), transparent 55%)
            `,
            animation: "wrks-breathe 7s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Top hairline progress bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "rgba(10,20,40,0.06)",
            zIndex: 5,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: accent,
              boxShadow: `0 0 14px ${accent}`,
              transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>

        {/* Drawn blocks */}
        {TARGETS.slice(0, drawnCount).map((t, i) => (
          <DrawnBlock
            key={t.id}
            target={t}
            accent={accent}
            justDrawn={i === drawnCount - 1}
          />
        ))}

        {/* The cursor */}
        <div
          style={{
            position: "absolute",
            left: cursor.x,
            top: cursor.y,
            zIndex: 20,
            transition: "left 900ms cubic-bezier(0.4, 0, 0.2, 1), top 900ms cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
          }}
        >
          <CursorBubble accent={accent} label={nextTarget ? labelForKind(nextTarget.kind) : ""} />
        </div>
      </div>

      {/* Tip line below */}
      <div style={{ paddingLeft: 4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "rgba(245,240,230,0.4)",
            letterSpacing: "0.02em",
          }}
        >
          {brandName ? `Drafting ${brandName}` : "Drafting…"} · {Math.round(b / 1000)}kb · {drawnCount}/{TARGETS.length} blocks
        </span>
      </div>

      <style>{`
        @keyframes wrks-breathe {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        @keyframes wrks-block-in {
          from { opacity: 0; transform: translateY(8px) scale(0.94); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes wrks-cursor-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes wrks-blink {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        @keyframes wrks-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Drawn block — a single element the cursor "drew"
// ============================================================

function DrawnBlock({
  target,
  accent,
  justDrawn,
}: {
  target: DrawTarget;
  accent: string;
  justDrawn: boolean;
}) {
  const { x, y, w, h, kind, tone } = target;
  const base: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width: w,
    height: h,
    animation: justDrawn
      ? "wrks-block-in 550ms cubic-bezier(0.34, 1.2, 0.64, 1) both"
      : undefined,
  };

  if (kind === "bar" || kind === "wide-bar") {
    return (
      <div
        style={{
          ...base,
          borderRadius: h / 2,
          background: tone === "dark" ? "rgba(255,255,255,0.75)" : "rgba(10,20,40,0.5)",
        }}
      />
    );
  }
  if (kind === "pill") {
    return (
      <div
        style={{
          ...base,
          borderRadius: 999,
          background: tone === "dark" ? accent : "#0a0a0f",
          boxShadow: tone === "dark" ? `0 4px 20px ${withAlpha(accent, 0.4)}` : undefined,
        }}
      />
    );
  }
  if (kind === "chip") {
    return (
      <div
        style={{
          ...base,
          borderRadius: 10,
          background: "rgba(10,20,40,0.55)",
        }}
      />
    );
  }
  if (kind === "big-headline") {
    // Three stacked bars of decreasing width — a real headline shape
    const barH = Math.floor(h / 3.5);
    const gap = barH * 0.35;
    return (
      <div style={{ ...base, display: "flex", flexDirection: "column", gap }}>
        <div style={{ height: barH, borderRadius: barH / 2, background: tone === "dark" ? "rgba(255,255,255,0.85)" : "rgba(10,20,40,0.85)", width: "95%" }} />
        <div style={{ height: barH, borderRadius: barH / 2, background: tone === "dark" ? "rgba(255,255,255,0.85)" : "rgba(10,20,40,0.85)", width: "78%" }} />
        <div style={{ height: barH, borderRadius: barH / 2, background: tone === "dark" ? "rgba(255,255,255,0.85)" : accent, width: "58%" }} />
      </div>
    );
  }
  if (kind === "text-cluster") {
    // 2-3 thin bars of varying widths — a paragraph shape
    return (
      <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
        <div style={{ height: 8, borderRadius: 4, background: tone === "dark" ? "rgba(255,255,255,0.35)" : "rgba(10,20,40,0.3)", width: "100%" }} />
        <div style={{ height: 8, borderRadius: 4, background: tone === "dark" ? "rgba(255,255,255,0.35)" : "rgba(10,20,40,0.3)", width: "88%" }} />
        <div style={{ height: 8, borderRadius: 4, background: tone === "dark" ? "rgba(255,255,255,0.35)" : "rgba(10,20,40,0.3)", width: "72%" }} />
      </div>
    );
  }
  if (kind === "square-slot" || kind === "wide-slot" || kind === "portrait-slot") {
    return (
      <div
        style={{
          ...base,
          borderRadius: 14,
          background:
            tone === "gradient"
              ? `linear-gradient(135deg, ${withAlpha(accent, 0.32)}, ${withAlpha(accent, 0.1)}), #0f172a`
              : tone === "dark"
              ? "#0a0a0f"
              : "linear-gradient(135deg, rgba(10,20,40,0.08), rgba(10,20,40,0.03))",
          border: tone === "gradient" ? "1.5px dashed rgba(255,255,255,0.14)" : "1px solid rgba(10,20,40,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {(tone === "gradient" || tone === "dark") && (
          <CameraIcon color="rgba(255,255,255,0.35)" />
        )}
      </div>
    );
  }
  return null;
}

// ============================================================
// Cursor bubble
// ============================================================

function CursorBubble({ accent, label }: { accent: string; label: string }) {
  return (
    <div style={{ animation: "wrks-cursor-bob 1.6s ease-in-out infinite" }}>
      {/* Bubble */}
      <div
        style={{
          padding: "6px 10px",
          borderRadius: "14px 14px 14px 3px",
          background: accent,
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: `0 8px 24px ${withAlpha(accent, 0.55)}`,
          maxWidth: 220,
        }}
      >
        {label ? (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "-0.003em",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        ) : (
          <>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "#fff", animation: "wrks-blink 1.2s ease-in-out infinite" }} />
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "#fff", animation: "wrks-blink 1.2s ease-in-out infinite 0.2s" }} />
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "#fff", animation: "wrks-blink 1.2s ease-in-out infinite 0.4s" }} />
          </>
        )}
      </div>
    </div>
  );
}

function labelForKind(kind: BlockKind): string {
  switch (kind) {
    case "bar":            return "placing text";
    case "wide-bar":       return "adding label";
    case "pill":           return "drawing button";
    case "chip":           return "adding chip";
    case "big-headline":   return "writing headline";
    case "text-cluster":   return "writing copy";
    case "square-slot":
    case "wide-slot":
    case "portrait-slot":  return "placing image";
    default:               return "drawing";
  }
}

function CameraIcon({ color = "rgba(255,255,255,0.5)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function SpinnerDot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        border: "1.5px solid rgba(245,240,230,0.35)",
        borderTopColor: "rgba(245,240,230,0.9)",
        animation: "wrks-spin 900ms linear infinite",
      }}
    />
  );
}

// ============================================================
// Utils
// ============================================================

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("rgba") || hex.startsWith("hsl")) return hex;
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return `rgba(125, 92, 255, ${alpha})`;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
