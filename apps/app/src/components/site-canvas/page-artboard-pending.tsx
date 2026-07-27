"use client";

// Full-artboard skeleton shown while the site is generating.
//
// Design principle (from research on v0 / Bolt / Cursor / Framer AI /
// Mercury / Linear): "the artifact IS the progress." Instead of a
// generic loader in an empty box, we render the actual 10-section
// layout as neutral bars using the real type scale + real grid. When
// generation completes, the iframe replaces the skeleton with zero
// reflow (heights match).
//
// Motion vocabulary — three moves only:
//   1. Hairline top progress bar (byte count → 0-100%), brand accent
//   2. Section left-rail glow on the currently-writing section
//   3. Blur-in reveal happens at swap time (handled by parent)
//
// No shimmer, no orbs, no gradient parties. Editorial restraint.

type Props = {
  width?: number;
  height?: number;
  bytes?: number | null;
  phase?: string | null;
  paletteHex?: string | null;
  brandName?: string | null;
};

// Match the artboard height PagePreviewFrame starts at, so the swap
// from skeleton → real HTML doesn't cause a layout jump.
const SKELETON_HEIGHT = 5200;
const SKELETON_WIDTH = 1280;
// Estimated final HTML size (bytes) — used to compute the top progress
// bar. Real generations land 55-75KB.
const EST_TOTAL_BYTES = 65_000;

const NEUTRAL = "#1a1a20";
const NEUTRAL_LIGHT = "#e8ebf0";
const INK_MUTED = "rgba(255,255,255,0.14)";
const INK_MUTED_LIGHT = "rgba(10,10,20,0.06)";

export function PageArtboardPending({
  width,
  height,
  bytes,
  phase,
  paletteHex,
  brandName,
}: Props) {
  const w = width ?? SKELETON_WIDTH;
  const h = height ?? SKELETON_HEIGHT;
  const accent = paletteHex ?? "#75B5FF";
  const progress = Math.min(1, Math.max(0.02, (bytes ?? 0) / EST_TOTAL_BYTES));

  return (
    <div
      className="page-artboard"
      style={{
        width: w,
        height: h,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.1)",
        boxShadow:
          "0 40px 100px -40px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.2)",
        background: "#ffffff",
        position: "relative",
      }}
    >
      {/* Hairline top progress bar — brand accent, byte-driven */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "rgba(0,0,0,0.04)",
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
            transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* NAV — dark bar 72px */}
      <div
        style={{
          height: 72,
          background: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          position: "relative",
        }}
      >
        <Bar w={110} h={14} tone="dark" />
        <div style={{ display: "flex", gap: 24 }}>
          <Bar w={60} h={10} tone="dark" />
          <Bar w={70} h={10} tone="dark" />
          <Bar w={54} h={10} tone="dark" />
          <Bar w={66} h={10} tone="dark" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Bar w={50} h={10} tone="dark" />
          <Pill w={90} h={36} tone="dark-inv" />
        </div>
      </div>

      {/* HERO — dark 720 */}
      <SectionShell tone="dark" height={720}>
        {/* Left copy column (60%) */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 224,
            maxWidth: 640,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <Bar w={160} h={12} tone="dark-eyebrow" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Bar w={560} h={40} tone="dark" />
            <Bar w={480} h={40} tone="dark" />
            <Bar w={340} h={40} tone="dark" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <Bar w={500} h={14} tone="dark-muted" />
            <Bar w={420} h={14} tone="dark-muted" />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <Pill w={148} h={46} tone="dark-inv" />
            <Pill w={132} h={46} tone="dark-outline" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <Bar w={100} h={12} tone="dark-muted" />
            <StarBar />
            <Bar w={140} h={12} tone="dark-muted" />
          </div>
        </div>
        {/* Right image slot */}
        <ImageSlot
          style={{
            position: "absolute",
            left: `52%`,
            right: 0,
            top: 0,
            bottom: 0,
          }}
          accent={accent}
          label="HERO PHOTO"
          size="hero"
        />
      </SectionShell>

      {/* MEGA BENTO — light 1160 */}
      <SectionShell tone="light" height={1160} padding={100}>
        <div style={{ maxWidth: 640, marginLeft: 40, marginBottom: 40 }}>
          <Bar w={520} h={30} tone="light" />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gridTemplateRows: "repeat(3, 320px)",
            gap: 16,
            margin: "0 40px",
          }}
        >
          <TileSlot style={{ gridColumn: "span 4" }} accent={accent} label="FEATURED PHOTO" />
          <TileSlot style={{ gridColumn: "span 2", gridRow: "span 2" }} accent={accent} label="TALL PHOTO" />
          <TileSlot style={{ gridColumn: "span 2" }} accent={accent} label="TILE PHOTO" />
          <TileSlot style={{ gridColumn: "span 2" }} accent={accent} label="TILE PHOTO" />
          <TileSlot style={{ gridColumn: "span 4" }} accent={accent} label="REVIEWS" tone="review" />
          <TileSlot style={{ gridColumn: "span 2" }} accent={accent} label="TILE PHOTO" />
        </div>
      </SectionShell>

      {/* WATCHLIST — light 560 */}
      <SectionShell tone="light" height={560} padding={100}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
            alignItems: "center",
            margin: "0 40px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Bar w={140} h={11} tone="light-eyebrow" accent={accent} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Bar w={420} h={28} tone="light" />
              <Bar w={340} h={28} tone="light" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Bar w={440} h={12} tone="light-muted" />
              <Bar w={400} h={12} tone="light-muted" />
              <Bar w={280} h={12} tone="light-muted" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <FormInput />
              <FormInput />
              <Pill w={480} h={52} tone="light-inv" />
            </div>
          </div>
          <ImageSlot accent={accent} label="PREVIEW IMAGE" size="square" style={{ height: 480 }} />
        </div>
      </SectionShell>

      {/* COMMUNITY — light 640 */}
      <SectionShell tone="light" height={640} padding={100}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Bar w={380} h={26} tone="light" />
            <Bar w={340} h={14} tone="light-muted" />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
            margin: "0 40px",
          }}
        >
          <ImageSlot accent={accent} label="SCREENSHOT" size="landscape" style={{ height: 320 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingLeft: 48 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 16, alignItems: "start", paddingTop: i === 0 ? 0 : 16, borderTop: i === 0 ? "none" : `1px solid ${INK_MUTED_LIGHT}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Bar w={220} h={16} tone="light" />
                  <Bar w={340} h={12} tone="light-muted" />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <Pill w={160} h={40} tone="light-inv" />
            </div>
          </div>
        </div>
      </SectionShell>

      {/* HELP GRID — light 480 */}
      <SectionShell tone="light" height={480} padding={100}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Bar w={520} h={26} tone="light" style={{ margin: "0 auto" }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            maxWidth: 1040,
            margin: "0 auto",
            padding: "0 40px",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                minHeight: 240,
                padding: 36,
                borderRadius: 12,
                border: `1px solid ${INK_MUTED_LIGHT}`,
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#0a0a0f" }} />
              <Bar w={160} h={14} tone="light" />
              <Bar w={200} h={11} tone="light-muted" />
              <Bar w={170} h={11} tone="light-muted" />
            </div>
          ))}
        </div>
      </SectionShell>

      {/* SPOTLIGHT — full-bleed dark card 16:5 */}
      <SectionShell tone="light" height={440} padding={40}>
        <div
          style={{
            margin: "0 40px",
            height: 360,
            borderRadius: 12,
            background: "#0a0a0f",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            padding: "0 64px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Bar w={480} h={30} tone="dark" />
              <Bar w={420} h={30} tone="dark" />
            </div>
            <Bar w={440} h={12} tone="dark-muted" />
            <Pill w={190} h={46} tone="dark-inv" />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 55% 100% at 100% 50%, ${withAlpha(accent, 0.28)} 0%, transparent 60%)`,
              zIndex: 1,
            }}
          />
        </div>
      </SectionShell>

      {/* HERO SPLIT — light 620 */}
      <SectionShell tone="light" height={620} padding={40}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
            margin: "0 40px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 8,
              height: 520,
            }}
          >
            <ImageSlot accent={accent} label="VIDEO" size="pillar" style={{ gridRow: "span 2", aspectRatio: "9/16" }} />
            <div style={{ borderRadius: 12, background: `linear-gradient(135deg, ${withAlpha(accent, 0.4)}, ${withAlpha(accent, 0.16)})`, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Bar w={180} h={12} tone="dark-muted" />
                <Bar w={200} h={12} tone="dark-muted" />
                <Bar w={160} h={12} tone="dark-muted" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Bar w={100} h={11} tone="dark" />
                <Bar w={130} h={10} tone="dark-muted" />
              </div>
            </div>
            <ImageSlot accent={accent} label="PHOTO" size="tile" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingLeft: 48 }}>
            <Bar w={140} h={11} tone="light-eyebrow" accent={accent} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Bar w={440} h={26} tone="light" />
              <Bar w={360} h={26} tone="light" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Bar w={420} h={12} tone="light-muted" />
              <Bar w={380} h={12} tone="light-muted" />
              <Bar w={280} h={12} tone="light-muted" />
            </div>
            <Pill w={170} h={44} tone="light-inv" />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Bar w={100} h={11} tone="light-muted" />
              <StarBar accent={accent} />
              <Bar w={130} h={11} tone="light-muted" />
            </div>
          </div>
        </div>
      </SectionShell>

      {/* REVIEWS — light-grey 900 */}
      <SectionShell tone="grey" height={900} padding={100}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Bar w={120} h={11} tone="light-muted" />
            <Bar w={520} h={26} tone="light" />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            padding: "0 40px",
            marginBottom: 40,
          }}
        >
          {[0, 1, 2].map((i) => (
            <VideoPoster key={i} accent={accent} />
          ))}
        </div>
        <div
          style={{
            columnCount: 2,
            columnGap: 20,
            padding: "0 40px",
          }}
        >
          {[220, 170, 190, 240, 200, 160].map((h, i) => (
            <div key={i} style={{ marginBottom: 20, breakInside: "avoid", background: "#fff", height: h, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
          ))}
        </div>
      </SectionShell>

      {/* YOUTUBE CTA — dark card 500 */}
      <SectionShell tone="light" height={500} padding={40}>
        <div
          style={{
            margin: "0 40px",
            padding: 48,
            background: "#0a0a0f",
            borderRadius: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
            minHeight: 380,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Bar w={440} h={26} tone="dark" />
              <Bar w={360} h={26} tone="dark" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Bar w={440} h={12} tone="dark-muted" />
              <Bar w={380} h={12} tone="dark-muted" />
            </div>
            <Pill w={200} h={46} tone="dark-inv" />
          </div>
          <div
            style={{
              aspectRatio: "1/1",
              maxWidth: 380,
              marginLeft: "auto",
              borderRadius: 12,
              background: `linear-gradient(135deg, ${withAlpha(accent, 0.5)}, ${withAlpha(accent, 0.2)})`,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12%",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "58%",
                background: "rgba(0,0,0,0.35)",
                borderRadius: "8px 8px 0 0",
              }}
            />
          </div>
        </div>
      </SectionShell>

      {/* ABOUT FOUNDER — light 640 */}
      <SectionShell tone="light" height={640} padding={100}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
            margin: "0 40px",
          }}
        >
          <ImageSlot accent={accent} label="FOUNDER PHOTO" size="portrait" style={{ height: 480 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingLeft: 48, maxWidth: 588 }}>
            <Bar w={140} h={11} tone="light-eyebrow" accent={accent} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Bar w={480} h={26} tone="light" />
              <Bar w={400} h={26} tone="light" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Bar w={520} h={11} tone="light-muted" />
                <Bar w={500} h={11} tone="light-muted" />
                <Bar w={i === 3 ? 320 : 440} h={11} tone="light-muted" />
              </div>
            ))}
            <Pill w={120} h={44} tone="light-inv" />
          </div>
        </div>
      </SectionShell>

      {/* FOOTER — dark */}
      <div
        style={{
          background: "#0a0a0f",
          padding: "64px 40px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 48,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Bar w={140} h={16} tone="dark" />
            <Bar w={260} h={11} tone="dark-muted" />
            <Bar w={220} h={11} tone="dark-muted" />
          </div>
          {[0, 1, 2].map((c) => (
            <div key={c} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Bar w={80} h={10} tone="dark-eyebrow" />
              {[0, 1, 2, 3].map((r) => (
                <Bar key={r} w={100 + ((r * 17) % 40)} h={11} tone="dark-muted" />
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: 24, display: "flex", justifyContent: "space-between" }}>
          <Bar w={220} h={11} tone="dark-muted" />
          <Bar w={140} h={11} tone="dark-eyebrow" />
        </div>
      </div>

      {/* Watermark: bottom-right pill with brand name + phase, editorial restraint */}
      {(brandName || phase) && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            zIndex: 90,
            padding: "10px 16px",
            borderRadius: 999,
            background: "rgba(10,10,15,0.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "rgba(255,255,255,0.8)",
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 8px ${accent}`,
              animation: "wrks-pulse 1.6s ease-in-out infinite",
            }}
          />
          {brandName ? `${brandName} · drafting` : "drafting"}
        </div>
      )}

      <style>{`
        @keyframes wrks-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

// ================================================================
// Primitives
// ================================================================

type BarTone =
  | "light"
  | "light-muted"
  | "light-eyebrow"
  | "dark"
  | "dark-muted"
  | "dark-eyebrow";

function Bar({
  w,
  h,
  tone,
  accent,
  style,
}: {
  w: number;
  h: number;
  tone: BarTone;
  accent?: string;
  style?: React.CSSProperties;
}) {
  const bg =
    tone === "light" ? "rgba(10,10,20,0.14)" :
    tone === "light-muted" ? "rgba(10,10,20,0.08)" :
    tone === "light-eyebrow" ? withAlpha(accent ?? NEUTRAL_LIGHT, 0.7) :
    tone === "dark" ? "rgba(255,255,255,0.14)" :
    tone === "dark-muted" ? "rgba(255,255,255,0.08)" :
    tone === "dark-eyebrow" ? "rgba(255,255,255,0.35)" :
    NEUTRAL;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        background: bg,
        ...style,
      }}
    />
  );
}

type PillTone = "light-inv" | "dark-inv" | "dark-outline" | "light-outline";

function Pill({
  w,
  h,
  tone,
}: {
  w: number;
  h: number;
  tone: PillTone;
}) {
  const style: React.CSSProperties = {
    width: w,
    height: h,
    borderRadius: 999,
  };
  if (tone === "light-inv") style.background = "#0a0a0f";
  if (tone === "dark-inv") style.background = "#ffffff";
  if (tone === "dark-outline") style.border = "1px solid rgba(255,255,255,0.3)";
  if (tone === "light-outline") style.border = "1px solid rgba(10,10,20,0.15)";
  return <div style={style} />;
}

function StarBar({ accent }: { accent?: string } = {}) {
  const color = accent ?? "#FFC14D";
  return (
    <div style={{ display: "inline-flex", gap: 3 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={color} style={{ opacity: 0.85 }}>
          <path d="M12 2l3 7 7 .8-5 5 1.5 7-6.5-3.5L5 22l1.5-7-5-5L8.5 9z" />
        </svg>
      ))}
    </div>
  );
}

function SectionShell({
  tone,
  height,
  padding,
  children,
}: {
  tone: "dark" | "light" | "grey";
  height: number;
  padding?: number;
  children: React.ReactNode;
}) {
  const bg = tone === "dark" ? "#0a0a0f" : tone === "grey" ? "#f1f5fb" : "#ffffff";
  return (
    <div
      style={{
        background: bg,
        position: "relative",
        minHeight: height,
        paddingTop: padding,
        paddingBottom: padding,
      }}
    >
      {children}
    </div>
  );
}

function CameraIcon({ color = "rgba(255,255,255,0.5)" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );
}

function ImageSlot({
  accent,
  label,
  size,
  style,
}: {
  accent: string;
  label: string;
  size: "hero" | "square" | "portrait" | "landscape" | "pillar" | "tile";
  style?: React.CSSProperties;
}) {
  const dims =
    size === "hero" ? "1200 × 1600" :
    size === "portrait" ? "800 × 1000" :
    size === "landscape" ? "1200 × 900" :
    size === "square" ? "1000 × 1000" :
    size === "pillar" ? "9:16" :
    "1200 × 900";
  return (
    <div
      style={{
        borderRadius: 12,
        background: `linear-gradient(135deg, ${withAlpha(accent, 0.14)}, ${withAlpha(accent, 0.06)}), #0f172a`,
        border: `1.5px dashed rgba(255,255,255,0.14)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        ...style,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CameraIcon />
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "rgba(255,255,255,0.32)",
        }}
      >
        {dims}
      </div>
    </div>
  );
}

function TileSlot({
  accent,
  label,
  style,
  tone,
}: {
  accent: string;
  label: string;
  style?: React.CSSProperties;
  tone?: "review";
}) {
  if (tone === "review") {
    return (
      <div
        style={{
          borderRadius: 12,
          background: "#0a0a0f",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          ...style,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Bar w={340} h={16} tone="dark" />
          <Bar w={280} h={16} tone="dark" />
          <Bar w={320} h={16} tone="dark-muted" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.14)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Bar w={100} h={11} tone="dark" />
              <Bar w={130} h={10} tone="dark-muted" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: 999, background: i === 0 ? "#fff" : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return <ImageSlot accent={accent} label={label} size="tile" style={style} />;
}

function VideoPoster({ accent }: { accent: string }) {
  return (
    <div
      style={{
        aspectRatio: "16 / 9",
        borderRadius: 12,
        background: `linear-gradient(135deg, ${withAlpha(accent, 0.24)}, ${withAlpha(accent, 0.08)}), #0a0a0f`,
        border: `1.5px dashed rgba(255,255,255,0.12)`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.94)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
        }}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" style={{ marginLeft: 3 }}>
          <path d="M8 5v14l11-7z" fill="#0a0a0f" />
        </svg>
      </div>
    </div>
  );
}

function FormInput() {
  return (
    <div
      style={{
        height: 52,
        background: "#fff",
        border: "1px solid rgba(10,10,20,0.12)",
        borderRadius: 12,
      }}
    />
  );
}

// ================================================================
// Utils
// ================================================================

function withAlpha(hex: string, alpha: number): string {
  // Handle rgba/hsl passthrough
  if (hex.startsWith("rgba") || hex.startsWith("hsl")) return hex;
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return `rgba(117, 181, 255, ${alpha})`;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
