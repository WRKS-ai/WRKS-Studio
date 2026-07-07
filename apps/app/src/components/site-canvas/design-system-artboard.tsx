"use client";

import type { DesignSystem } from "@/lib/site-generation/design-system";

// Design system artboard — the FIRST artboard rendered on the tldraw
// canvas. Displays the palette, typography, buttons, and icons in a
// Stitch-style grid layout. Purely presentational — data comes from
// the /api/sites/generate SSE stream.

type Props = {
  designSystem: DesignSystem;
  title: string;
};

export function DesignSystemArtboard({ designSystem, title }: Props) {
  return (
    <div
      className="ds-artboard"
      style={{
        width: 720,
        borderRadius: 14,
        overflow: "hidden",
        background: "#fbfbfa",
        color: "#0a0a0c",
        fontFamily: "var(--font-sans)",
        boxShadow:
          "0 30px 80px -30px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.2)",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {/* Artboard title bar */}
      <div
        className="flex items-center"
        style={{
          padding: "12px 18px",
          gap: 10,
          background: "#f2f0eb",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          fontSize: 12.5,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
          color: "rgba(10,10,12,0.72)",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: 3,
            background: designSystem.palette.primary.hex,
          }}
        />
        <span>{title}</span>
      </div>

      {/* Body grid */}
      <div
        style={{
          padding: 22,
          display: "grid",
          gridTemplateColumns: "180px 1fr 1fr",
          gap: 14,
        }}
      >
        {/* Left column — palette */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          {(
            ["primary", "secondary", "tertiary", "neutral"] as const
          ).map((key) => (
            <PaletteRow
              key={key}
              label={cap(key)}
              row={designSystem.palette[key]}
            />
          ))}
        </div>

        {/* Middle column — typography */}
        <div className="flex flex-col" style={{ gap: 14 }}>
          <TypeSample
            label="Headline"
            family={designSystem.type.display.family}
            sizePx={44}
            weight={600}
            preview="Aa"
          />
          <TypeSample
            label="Body"
            family={designSystem.type.body.family}
            sizePx={16}
            weight={400}
            preview="The quick brown fox jumps over the lazy dog"
            lines
          />
          <TypeSample
            label="Label"
            family={designSystem.type.mono.family}
            sizePx={12}
            weight={500}
            mono
            preview="ABC 123 · label"
          />
        </div>

        {/* Right column — buttons + search + icons */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          <ButtonsPreview designSystem={designSystem} />
          <SearchPreview designSystem={designSystem} />
          <IconsPreview iconStyle={designSystem.iconStyle} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Palette row
// ============================================================
function PaletteRow({
  label,
  row,
}: {
  label: string;
  row: DesignSystem["palette"]["primary"];
}) {
  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      <div
        className="flex items-center justify-between"
        style={{
          fontSize: 10.5,
          fontFamily: "var(--font-mono)",
          color: "rgba(10,10,12,0.5)",
          letterSpacing: "0.05em",
        }}
      >
        <span>{label}</span>
        <span>{row.hex.toUpperCase()}</span>
      </div>
      <div
        className="flex"
        style={{
          height: 34,
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        {row.scale.map((hex, i) => (
          <div
            key={i}
            style={{ background: hex, flex: 1 }}
            title={hex}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: 10.5,
          color: "rgba(10,10,12,0.42)",
          letterSpacing: "0.01em",
        }}
      >
        {row.name}
      </span>
    </div>
  );
}

// ============================================================
// Typography sample
// ============================================================
function TypeSample({
  label,
  family,
  sizePx,
  weight,
  preview,
  mono,
  lines,
}: {
  label: string;
  family: string;
  sizePx: number;
  weight: number;
  preview: string;
  mono?: boolean;
  lines?: boolean;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 8,
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          fontSize: 10.5,
          fontFamily: "var(--font-mono)",
          color: "rgba(10,10,12,0.42)",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        <span>{label}</span>
        <span>{family}</span>
      </div>
      <div
        style={{
          fontFamily: mono
            ? "var(--font-mono)"
            : `"${family}", var(--font-sans)`,
          fontSize: sizePx,
          fontWeight: weight,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "#0a0a0c",
        }}
      >
        {preview}
      </div>
      {lines && (
        <div className="flex flex-col" style={{ gap: 4, marginTop: 10 }}>
          <span
            style={{
              display: "block",
              height: 6,
              width: "84%",
              borderRadius: 999,
              background: "rgba(10,10,12,0.9)",
            }}
          />
          <span
            style={{
              display: "block",
              height: 6,
              width: "62%",
              borderRadius: 999,
              background: "rgba(10,10,12,0.4)",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Buttons preview
// ============================================================
function ButtonsPreview({ designSystem }: { designSystem: DesignSystem }) {
  const primaryHex = designSystem.palette.primary.hex;
  const neutralDark = designSystem.palette.neutral.scale[4] ?? "#0a0a0c";
  const neutralLight = designSystem.palette.neutral.scale[0] ?? "#ffffff";
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 8,
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}
    >
      <button
        type="button"
        style={{
          padding: "8px 14px",
          borderRadius: 6,
          background: neutralDark,
          color: neutralLight,
          fontSize: 12,
          fontWeight: 500,
          border: "none",
          cursor: "default",
        }}
      >
        Primary
      </button>
      <button
        type="button"
        style={{
          padding: "8px 14px",
          borderRadius: 6,
          background: "transparent",
          color: neutralDark,
          fontSize: 12,
          fontWeight: 500,
          border: `1px solid ${neutralDark}`,
          cursor: "default",
        }}
      >
        Secondary
      </button>
      <button
        type="button"
        style={{
          padding: "8px 14px",
          borderRadius: 6,
          background: primaryHex,
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 500,
          border: "none",
          cursor: "default",
        }}
      >
        Inverted
      </button>
      <button
        type="button"
        style={{
          padding: "8px 14px",
          borderRadius: 6,
          background: "transparent",
          color: primaryHex,
          fontSize: 12,
          fontWeight: 500,
          border: `1px solid ${primaryHex}`,
          cursor: "default",
        }}
      >
        Outlined
      </button>
    </div>
  );
}

// ============================================================
// Search input preview
// ============================================================
function SearchPreview({ designSystem: _ds }: { designSystem: DesignSystem }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.12)",
        fontSize: 12,
        color: "rgba(10,10,12,0.45)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      Search
    </div>
  );
}

// ============================================================
// Icons preview
// ============================================================
function IconsPreview({
  iconStyle,
}: {
  iconStyle: DesignSystem["iconStyle"];
}) {
  const strokeWidth = iconStyle === "fill" ? 0 : 1.8;
  const fill = iconStyle === "fill" ? "currentColor" : "none";
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        background: "#0a0a0c",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "#ffffff",
      }}
    >
      {(["home", "search", "user", "wand", "tag", "trash"] as const).map(
        (name) => (
          <IconGlyph
            key={name}
            name={name}
            fill={fill}
            strokeWidth={strokeWidth}
          />
        ),
      )}
    </div>
  );
}

function IconGlyph({
  name,
  fill,
  strokeWidth,
}: {
  name: "home" | "search" | "user" | "wand" | "tag" | "trash";
  fill: string;
  strokeWidth: number;
}) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill,
    stroke: "currentColor",
    strokeWidth: `${strokeWidth}`,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 12 12 4l9 8" />
          <path d="M5 10v10h5v-6h4v6h5V10" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.5-3.4 4.6-5 8-5s6.5 1.6 8 5" />
        </svg>
      );
    case "wand":
      return (
        <svg {...common}>
          <path d="m4 20 12-12" />
          <path d="M18 6h2M17 3v2M20 8v2M15 5v2" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M20 4v8l-9 9-8-8 9-9z" />
          <circle cx="8" cy="8" r="1.5" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
          <path d="M9 7V4h6v3" />
        </svg>
      );
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
