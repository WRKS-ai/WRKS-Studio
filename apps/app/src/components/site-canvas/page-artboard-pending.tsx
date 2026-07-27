"use client";

// Cursor-drawn page artboard.
//
// Reference: Google Stitch. Starts as a blank glowing gradient panel,
// then a small speech-bubble cursor enters, moves top-to-bottom, and
// each section fades in as the cursor passes through it. Nothing
// materializes all at once.
//
// Byte-count from generate.progress drives section reveal — as bytes
// climb, more sections become "revealed" and the cursor animates to
// the next one.

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  width?: number;
  bytes?: number | null;
  paletteHex?: string | null;
  brandName?: string | null;
};

const ARTBOARD_WIDTH = 420;      // Mobile-shape artboard (Stitch reference)
const ARTBOARD_HEIGHT = 720;

// Section reveal thresholds. Each section reveals once bytes pass its
// threshold. Total estimated: 65KB. 12 sections mapped to byte range.
const SECTIONS: Array<{
  id: string;
  label: string;
  height: number;      // in the mobile artboard
  bytesFrom: number;
}> = [
  { id: "nav",        label: "Nav",         height: 56,  bytesFrom: 0 },
  { id: "hero",       label: "Hero",        height: 340, bytesFrom: 4_000 },
  { id: "megabento",  label: "Mega bento",  height: 540, bytesFrom: 12_000 },
  { id: "watchlist",  label: "Watchlist",   height: 300, bytesFrom: 22_000 },
  { id: "community",  label: "Community",   height: 320, bytesFrom: 28_000 },
  { id: "helpgrid",   label: "Help grid",   height: 240, bytesFrom: 34_000 },
  { id: "spotlight",  label: "Spotlight",   height: 200, bytesFrom: 40_000 },
  { id: "herosplit",  label: "Hero split",  height: 340, bytesFrom: 46_000 },
  { id: "reviews",    label: "Reviews",     height: 400, bytesFrom: 52_000 },
  { id: "youtube",    label: "Social CTA",  height: 240, bytesFrom: 56_000 },
  { id: "about",      label: "About",       height: 340, bytesFrom: 60_000 },
  { id: "footer",     label: "Footer",      height: 180, bytesFrom: 63_000 },
];

export function PageArtboardPending({
  width,
  bytes,
  paletteHex,
  brandName,
}: Props) {
  const w = width ?? ARTBOARD_WIDTH;
  const accent = paletteHex ?? "#7d5cff";
  const scrollRef = useRef<HTMLDivElement>(null);

  // How many sections should be revealed at this byte count?
  const revealedCount = useMemo(() => {
    const b = bytes ?? 0;
    let count = 0;
    for (const s of SECTIONS) if (b >= s.bytesFrom) count++;
    // While there's ANY progress at all, show at least 1 section
    // to prime the animation.
    if (b > 200 && count === 0) return 1;
    return count;
  }, [bytes]);

  // Cursor Y position — sits above the next-to-be-revealed section.
  const cursorY = useMemo(() => {
    let y = 0;
    for (let i = 0; i < revealedCount; i++) y += SECTIONS[i]!.height + 8;
    return y;
  }, [revealedCount]);

  // Auto-scroll the artboard interior so the active section is always
  // visible if content exceeds the viewport.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: Math.max(0, cursorY - 200),
      behavior: "smooth",
    });
  }, [cursorY]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Label above the artboard */}
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

      {/* The artboard itself */}
      <div
        style={{
          width: w,
          height: ARTBOARD_HEIGHT,
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
        {/* Ambient glow layer (breathes) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse 80% 40% at 30% 20%, rgba(180,140,255,0.25), transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(255,180,220,0.2), transparent 60%)
            `,
            animation: "wrks-breathe 6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Section stack — this is what the cursor is "drawing" */}
        <div
          ref={scrollRef}
          style={{
            position: "absolute",
            inset: 0,
            padding: "16px 16px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            overflow: "hidden",
          }}
        >
          {SECTIONS.map((s, i) => (
            <SectionSlot
              key={s.id}
              height={s.height}
              revealed={i < revealedCount}
              justRevealed={i === revealedCount - 1}
              accent={accent}
              kind={s.id}
            />
          ))}
        </div>

        {/* Cursor — sits above the next-to-be-drawn section */}
        {revealedCount < SECTIONS.length && (
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 16 + cursorY,
              zIndex: 10,
              transition: "top 900ms cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: "none",
            }}
          >
            <CursorBubble accent={accent} />
          </div>
        )}
      </div>

      {/* Tip line below */}
      <div style={{ paddingLeft: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "rgba(245,240,230,0.4)",
            letterSpacing: "0.02em",
          }}
        >
          {brandName ? `Drafting for ${brandName}` : "Drafting…"} · {Math.round(((bytes ?? 0) / 1000))}kb
        </span>
      </div>

      <style>{`
        @keyframes wrks-breathe {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        @keyframes wrks-fadeup {
          from { opacity: 0; transform: translateY(6px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes wrks-cursor-bob {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-3px) rotate(-4deg); }
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
// Section slot — sized skeleton content
// ============================================================

function SectionSlot({
  height,
  revealed,
  justRevealed,
  accent,
  kind,
}: {
  height: number;
  revealed: boolean;
  justRevealed: boolean;
  accent: string;
  kind: string;
}) {
  return (
    <div
      style={{
        height,
        flexShrink: 0,
        borderRadius: 12,
        overflow: "hidden",
        opacity: revealed ? 1 : 0,
        animation: justRevealed
          ? "wrks-fadeup 600ms cubic-bezier(0.34, 1.2, 0.64, 1) both"
          : undefined,
      }}
    >
      {revealed && renderSection(kind, accent, height)}
    </div>
  );
}

function renderSection(kind: string, accent: string, height: number): React.ReactNode {
  switch (kind) {
    case "nav":
      return (
        <div style={{ height, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: "rgba(255,255,255,0.5)", borderRadius: 12 }}>
          <div style={{ width: 60, height: 8, borderRadius: 4, background: "rgba(10,20,40,0.35)" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(10,20,40,0.15)" }} />
          </div>
        </div>
      );
    case "hero":
      return (
        <div style={{ height, padding: 24, display: "flex", flexDirection: "column", gap: 12, background: "rgba(255,255,255,0.5)", borderRadius: 12, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: 90, height: 10, borderRadius: 999, background: withAlpha(accent, 0.24) }} />
          <div style={{ height: 12 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <div style={{ width: "88%", height: 16, borderRadius: 6, background: "rgba(10,20,40,0.45)" }} />
            <div style={{ width: "78%", height: 16, borderRadius: 6, background: "rgba(10,20,40,0.45)" }} />
            <div style={{ width: "50%", height: 16, borderRadius: 6, background: withAlpha(accent, 0.7) }} />
          </div>
          <div style={{ height: 8 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
            <div style={{ width: "84%", height: 6, borderRadius: 3, background: "rgba(10,20,40,0.2)" }} />
            <div style={{ width: "72%", height: 6, borderRadius: 3, background: "rgba(10,20,40,0.2)" }} />
            <div style={{ width: "78%", height: 6, borderRadius: 3, background: "rgba(10,20,40,0.2)" }} />
          </div>
          <div style={{ height: 8 }} />
          <div style={{ width: 160, height: 32, borderRadius: 999, background: accent }} />
          <div style={{ width: 120, height: 20, borderRadius: 999, background: "transparent", border: "1px solid rgba(10,20,40,0.2)" }} />
        </div>
      );
    case "megabento":
      return (
        <div style={{ height, padding: 12, background: "#fff", borderRadius: 12, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                borderRadius: 10,
                gridColumn: i === 0 ? "span 2" : "span 1",
                minHeight: i === 0 ? 130 : 84,
                background:
                  i % 3 === 0
                    ? `linear-gradient(135deg, ${withAlpha(accent, 0.6)}, ${withAlpha(accent, 0.2)})`
                    : "linear-gradient(135deg, rgba(10,30,80,0.14), rgba(10,30,80,0.06))",
                display: "flex",
                alignItems: "flex-end",
                padding: 10,
              }}
            >
              <div style={{ width: "60%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.7)" }} />
            </div>
          ))}
        </div>
      );
    case "watchlist":
      return (
        <div style={{ height, padding: 16, background: "#fff", borderRadius: 12, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ width: 90, height: 8, borderRadius: 4, background: withAlpha(accent, 0.7) }} />
            <div style={{ width: "80%", height: 14, borderRadius: 6, background: "rgba(10,20,40,0.4)" }} />
            <div style={{ width: "60%", height: 14, borderRadius: 6, background: "rgba(10,20,40,0.4)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 30, borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0" }} />
            <div style={{ height: 30, borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0" }} />
            <div style={{ height: 32, borderRadius: 999, background: "#0f172a" }} />
          </div>
        </div>
      );
    case "community":
      return (
        <div style={{ height, padding: 16, background: "#fff", borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", textAlign: "center" }}>
            <div style={{ width: "70%", height: 14, borderRadius: 6, background: "rgba(10,20,40,0.4)" }} />
            <div style={{ width: "50%", height: 10, borderRadius: 5, background: "rgba(10,20,40,0.2)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10 }}>0{i + 1}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ width: "60%", height: 8, borderRadius: 4, background: "rgba(10,20,40,0.4)" }} />
                  <div style={{ width: "85%", height: 6, borderRadius: 3, background: "rgba(10,20,40,0.2)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "helpgrid":
      return (
        <div style={{ height, padding: 12, background: "#fff", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ width: "70%", height: 12, borderRadius: 6, background: "rgba(10,20,40,0.4)", margin: "0 auto" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 4 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(10,20,40,0.1)", background: "#fff", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#0f172a" }} />
                <div style={{ height: 6, borderRadius: 3, background: "rgba(10,20,40,0.35)" }} />
                <div style={{ height: 4, borderRadius: 2, background: "rgba(10,20,40,0.15)" }} />
                <div style={{ height: 4, borderRadius: 2, background: "rgba(10,20,40,0.15)", width: "70%" }} />
              </div>
            ))}
          </div>
        </div>
      );
    case "spotlight":
      return (
        <div style={{ height, padding: 8, background: "transparent", borderRadius: 12 }}>
          <div style={{ height: "100%", padding: 20, borderRadius: 12, background: `linear-gradient(135deg, #0a0a0f 0%, ${withAlpha(accent, 0.35)} 100%)`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            <div style={{ width: "78%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.7)" }} />
            <div style={{ width: "60%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.7)" }} />
            <div style={{ width: 100, height: 24, borderRadius: 999, background: "#fff", marginTop: 8 }} />
          </div>
        </div>
      );
    case "herosplit":
      return (
        <div style={{ height, padding: 12, background: "#fff", borderRadius: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateRows: "1.4fr 1fr", gap: 6 }}>
            <div style={{ borderRadius: 8, background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,0.94)" }} />
            </div>
            <div style={{ borderRadius: 8, background: `linear-gradient(135deg, ${withAlpha(accent, 0.5)}, ${withAlpha(accent, 0.15)})` }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
            <div style={{ width: 60, height: 8, borderRadius: 4, background: withAlpha(accent, 0.7) }} />
            <div style={{ height: 10, borderRadius: 5, background: "rgba(10,20,40,0.4)" }} />
            <div style={{ height: 10, borderRadius: 5, background: "rgba(10,20,40,0.4)", width: "80%" }} />
            <div style={{ height: 6, borderRadius: 3, background: "rgba(10,20,40,0.2)" }} />
            <div style={{ height: 6, borderRadius: 3, background: "rgba(10,20,40,0.2)", width: "70%" }} />
            <div style={{ width: 96, height: 22, borderRadius: 999, background: "#0f172a", marginTop: 6 }} />
          </div>
        </div>
      );
    case "reviews":
      return (
        <div style={{ height, padding: 12, background: "#f1f5fb", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", textAlign: "center" }}>
            <div style={{ width: "40%", height: 6, borderRadius: 3, background: "rgba(10,20,40,0.3)" }} />
            <div style={{ width: "80%", height: 12, borderRadius: 6, background: "rgba(10,20,40,0.4)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ aspectRatio: "16 / 9", borderRadius: 8, background: `linear-gradient(135deg, ${withAlpha(accent, 0.32)}, ${withAlpha(accent, 0.1)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 24, height: 24, borderRadius: 999, background: "rgba(255,255,255,0.94)" }} />
              </div>
            ))}
          </div>
          <div style={{ columnCount: 2, columnGap: 6, marginTop: 4 }}>
            {[80, 100, 60, 90].map((h, i) => (
              <div key={i} style={{ marginBottom: 6, height: h, borderRadius: 6, background: "#fff", breakInside: "avoid" }} />
            ))}
          </div>
        </div>
      );
    case "youtube":
      return (
        <div style={{ height, padding: 12, background: "transparent", borderRadius: 12 }}>
          <div style={{ height: "100%", padding: 20, borderRadius: 16, background: "#0a0a0f", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.7)" }} />
              <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.7)", width: "80%" }} />
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.3)" }} />
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.3)", width: "70%" }} />
              <div style={{ width: 90, height: 22, borderRadius: 999, background: "#fff", marginTop: 4 }} />
            </div>
            <div style={{ aspectRatio: "1 / 1", borderRadius: 8, background: `linear-gradient(135deg, ${withAlpha(accent, 0.55)}, ${withAlpha(accent, 0.2)})`, position: "relative" }}>
              <div style={{ position: "absolute", top: "10%", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "58%", background: "rgba(0,0,0,0.4)", borderRadius: "6px 6px 0 0" }} />
            </div>
          </div>
        </div>
      );
    case "about":
      return (
        <div style={{ height, padding: 12, background: "#fff", borderRadius: 12, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 12, alignItems: "center" }}>
          <div style={{ height: "88%", borderRadius: 10, background: `linear-gradient(135deg, ${withAlpha(accent, 0.28)}, ${withAlpha(accent, 0.08)}), #0f172a`, border: "1.5px dashed rgba(255,255,255,0.14)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ width: 60, height: 6, borderRadius: 3, background: withAlpha(accent, 0.7) }} />
            <div style={{ height: 10, borderRadius: 5, background: "rgba(10,20,40,0.4)" }} />
            <div style={{ height: 10, borderRadius: 5, background: "rgba(10,20,40,0.4)", width: "80%" }} />
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(10,20,40,0.2)" }} />
                <div style={{ height: 4, borderRadius: 2, background: "rgba(10,20,40,0.2)" }} />
                <div style={{ height: 4, borderRadius: 2, background: "rgba(10,20,40,0.2)", width: "60%" }} />
              </div>
            ))}
          </div>
        </div>
      );
    case "footer":
      return (
        <div style={{ height, padding: 16, background: "#0a0a0f", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ width: 90, height: 10, borderRadius: 4, background: "rgba(255,255,255,0.7)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[0, 1, 2].map((c) => (
              <div key={c} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.35)", width: "80%" }} />
                <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
                <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
                <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.15)", width: "70%" }} />
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6, marginTop: 4 }}>
            <div style={{ width: "50%", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
          </div>
        </div>
      );
    default:
      return <div style={{ height, background: "rgba(255,255,255,0.5)", borderRadius: 12 }} />;
  }
}

// ============================================================
// Cursor + spinner
// ============================================================

function CursorBubble({ accent }: { accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        animation: "wrks-cursor-bob 1.6s ease-in-out infinite",
      }}
    >
      {/* Speech bubble */}
      <div
        style={{
          padding: "6px 10px",
          borderRadius: "14px 14px 14px 4px",
          background: accent,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 4,
          boxShadow: `0 6px 20px ${withAlpha(accent, 0.5)}`,
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: 999, background: "#fff", animation: "wrks-blink 1.2s ease-in-out infinite" }} />
        <span style={{ width: 5, height: 5, borderRadius: 999, background: "#fff", animation: "wrks-blink 1.2s ease-in-out infinite 0.2s" }} />
        <span style={{ width: 5, height: 5, borderRadius: 999, background: "#fff", animation: "wrks-blink 1.2s ease-in-out infinite 0.4s" }} />
      </div>
      <style>{`
        @keyframes wrks-blink {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
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
