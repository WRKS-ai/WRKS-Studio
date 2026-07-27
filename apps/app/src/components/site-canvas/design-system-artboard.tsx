"use client";

// DesignSystemArtboard — the first artboard that appears on the
// generation canvas, showing the extracted brand system in a Figma-
// style grid (palette scales + type samples + buttons + inputs + icons).
//
// Reference: Google Stitch's "Velocity Professional" design-system card.
// Signals "we understood your brand" before the page draft appears.

type PaletteColor = {
  hex: string;
  role: string;
};

export type DesignSystemArtboardData = {
  systemName: string;              // "Advocacy Aces Professional"
  palette: PaletteColor[];         // primary + secondary + tertiary + neutral
  typefaces: {
    display: string | null;
    body: string | null;
  } | null;
};

const ARTBOARD_WIDTH = 720;
const ARTBOARD_HEIGHT = 620;

export function DesignSystemArtboard({
  systemName,
  palette,
  typefaces,
}: DesignSystemArtboardData) {
  // Pull the primary hex for the accent color used across button samples.
  const primary =
    palette.find((c) => c.role === "primary")?.hex ??
    palette[0]?.hex ??
    "#0052ff";
  const secondary =
    palette.find((c) => c.role === "secondary")?.hex ??
    palette[1]?.hex ??
    "#0a192f";
  const tertiary =
    palette.find((c) => c.role === "tertiary")?.hex ??
    palette[2]?.hex ??
    "#f8fafc";
  const neutral =
    palette.find((c) => c.role === "neutral-dark")?.hex ??
    palette.find((c) => c.role === "neutral-warm")?.hex ??
    palette[3]?.hex ??
    "#64748b";

  const displayFont = typefaces?.display ?? "Geist";
  const bodyFont = typefaces?.body ?? displayFont;

  return (
    <div
      className="ds-artboard"
      style={{
        width: ARTBOARD_WIDTH,
        minHeight: ARTBOARD_HEIGHT,
        borderRadius: 20,
        background: "#eff2f7",
        padding: 20,
        boxShadow:
          "0 40px 100px -40px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header — system name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 4 }}>
        <PaletteIcon />
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#0f172a",
          }}
        >
          {systemName}
        </span>
      </div>

      {/* Row 1: 4 palette cards (2×2 grid on the LEFT) + type sample + button sample + search sample */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1.4fr 1.2fr 1.4fr",
          gridTemplateRows: "auto auto auto",
          gap: 12,
        }}
      >
        {/* Palette cards stack (spans 3 rows on the left) */}
        <div
          style={{
            gridRow: "span 3",
            display: "grid",
            gridTemplateRows: "repeat(4, 1fr)",
            gap: 10,
          }}
        >
          <PaletteCard label="Primary" hex={primary} tone="dark-text" />
          <PaletteCard label="Secondary" hex={secondary} tone="dark-text" />
          <PaletteCard label="Tertiary" hex={tertiary} tone="dark-text" />
          <PaletteCard label="Neutral" hex={neutral} tone="light-text" />
        </div>

        {/* Row 1 col 2: Headline type sample (spans 2 cols in width visually) */}
        <TypeSample size="display" family={displayFont} label="Headline" />

        {/* Row 1 col 3-4: Buttons + Search */}
        <ButtonsCard primary={primary} />
        <InputCard type="search" />

        {/* Row 2: Body type sample, then two full-width cards */}
        <TypeSample size="body" family={bodyFont} label="Body" />
        <BodyBarsCard primary={primary} />
        <IconChipsCard primary={primary} />

        {/* Row 3: Label type sample, then icon-btn card, then circles card */}
        <TypeSample size="label" family={bodyFont} label="Label" />
        <SmallButtonCard primary={primary} />
        <CircleButtonsCard primary={primary} />
      </div>
    </div>
  );
}

// ============================================================
// Card primitives
// ============================================================

function PaletteCard({
  label,
  hex,
  tone,
}: {
  label: string;
  hex: string;
  tone: "dark-text" | "light-text";
}) {
  const scale = generateScale(hex);
  const textColor = tone === "dark-text" ? "#fff" : "#fff";
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        background: hex,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 96,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 600,
            color: textColor,
            opacity: 0.95,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: textColor,
            opacity: 0.75,
            letterSpacing: 0.5,
          }}
        >
          {hex.toUpperCase()}
        </span>
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
        {scale.map((stop, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 14,
              background: stop,
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TypeSample({
  size,
  family,
  label,
}: {
  size: "display" | "body" | "label";
  family: string;
  label: string;
}) {
  const fontSize = size === "display" ? 96 : size === "body" ? 68 : 48;
  return (
    <div
      style={{
        borderRadius: 12,
        background: "#fff",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 120,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 500,
            color: "#94a3b8",
            letterSpacing: 0.3,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "#cbd5e1",
          }}
        >
          {family}
        </span>
      </div>
      <div
        style={{
          fontFamily: family,
          fontSize,
          lineHeight: 1,
          fontWeight: size === "display" ? 700 : 600,
          color: "#0f172a",
          letterSpacing: "-0.03em",
        }}
      >
        Aa
      </div>
    </div>
  );
}

function ButtonsCard({ primary }: { primary: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "#fff",
        padding: 14,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        alignContent: "center",
        minHeight: 120,
      }}
    >
      <SampleButton label="Primary" bg={primary} color="#fff" />
      <SampleButton label="Secondary" bg="transparent" color={primary} border={primary} />
      <SampleButton label="Inverted" bg="#0f172a" color="#fff" />
      <SampleButton label="Outlined" bg="transparent" color="#0f172a" border="#cbd5e1" />
    </div>
  );
}

function SampleButton({
  label,
  bg,
  color,
  border,
}: {
  label: string;
  bg: string;
  color: string;
  border?: string;
}) {
  return (
    <div
      style={{
        padding: "7px 12px",
        borderRadius: 8,
        background: bg,
        color,
        border: border ? `1px solid ${border}` : "1px solid transparent",
        fontFamily: "var(--font-sans)",
        fontSize: 11,
        fontWeight: 600,
        textAlign: "center",
        letterSpacing: "-0.005em",
      }}
    >
      {label}
    </div>
  );
}

function InputCard({ type: _type }: { type: "search" }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "#fff",
        padding: 14,
        display: "flex",
        alignItems: "center",
        minHeight: 120,
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 8,
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          color: "#94a3b8",
        }}
      >
        <SearchIcon />
        Search
      </div>
    </div>
  );
}

function BodyBarsCard({ primary }: { primary: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "#fff",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        justifyContent: "center",
        minHeight: 100,
      }}
    >
      <div style={{ height: 8, borderRadius: 4, background: primary, width: "60%" }} />
      <div style={{ height: 6, borderRadius: 3, background: "#e2e8f0", width: "85%" }} />
      <div style={{ height: 6, borderRadius: 3, background: "#e2e8f0", width: "75%" }} />
    </div>
  );
}

function IconChipsCard({ primary }: { primary: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "#fff",
        padding: 14,
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 100,
      }}
    >
      <IconChip color={primary}>
        <HomeIcon color="#fff" />
      </IconChip>
      <IconChip color="transparent" border="#cbd5e1">
        <SearchIconSmall color="#64748b" />
      </IconChip>
      <IconChip color="transparent" border="#cbd5e1">
        <UserIcon color="#64748b" />
      </IconChip>
    </div>
  );
}

function IconChip({
  color,
  border,
  children,
}: {
  color: string;
  border?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: color,
        border: border ? `1px solid ${border}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

function SmallButtonCard({ primary: _p }: { primary: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "#fff",
        padding: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 100,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "1px solid #cbd5e1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PenIcon />
      </div>
    </div>
  );
}

function CircleButtonsCard({ primary }: { primary: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "#fff",
        padding: 14,
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 100,
      }}
    >
      <ActionCircle bg={primary}>
        <WrenchIcon />
      </ActionCircle>
      <ActionCircle bg="#64748b">
        <DownloadIcon />
      </ActionCircle>
      <ActionCircle bg="#64748b">
        <TagIcon />
      </ActionCircle>
      <ActionCircle bg="#dc2626">
        <TrashIcon />
      </ActionCircle>
    </div>
  );
}

function ActionCircle({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// Icons
// ============================================================

const svgProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function PaletteIcon() {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        background: "#0052ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" {...svgProps}>
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.5 0 1-.4 1-1 0-.4-.2-.7-.4-.9-.2-.2-.4-.5-.4-.9 0-.8.7-1.5 1.5-1.5H15c3.5 0 6-2.5 6-6 0-5-4-9-9-9z" />
      </svg>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...svgProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function SearchIconSmall({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...svgProps} stroke={color}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function HomeIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...svgProps} stroke={color}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...svgProps} stroke={color}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" {...svgProps} stroke="#0f172a">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" {...svgProps}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" {...svgProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" {...svgProps}>
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" {...svgProps}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// ============================================================
// Utils
// ============================================================

// Given a base hex, produce a 6-stop scale from light to dark for the
// palette ramp shown at the bottom of each color card.
function generateScale(hex: string): string[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [hex, hex, hex, hex, hex, hex];
  return [0.85, 0.6, 0.3, 0, -0.25, -0.5].map((amt) => shiftRgb(rgb, amt));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return null;
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

function shiftRgb(
  rgb: { r: number; g: number; b: number },
  amt: number,
): string {
  const shift = (v: number) => {
    if (amt >= 0) return Math.round(v + (255 - v) * amt);
    return Math.round(v * (1 + amt));
  };
  const r = shift(rgb.r).toString(16).padStart(2, "0");
  const g = shift(rgb.g).toString(16).padStart(2, "0");
  const b = shift(rgb.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}
