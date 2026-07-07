"use client";

import type { DesignSystem } from "@/lib/site-generation/design-system";
import type { PageContent, PageSectionData } from "@/lib/site-generation/page-content";

// Page artboard — renders the generated PageContent WITH the design
// system applied via CSS variables. Bill-Fanter-derived section
// components will land in Ship 3 to replace these Stitch-mockup
// section renderers; for now these are structurally-honest
// representations of the sections at ~1280px width.

type Props = {
  page: PageContent;
  designSystem: DesignSystem;
};

export function PageArtboard({ page, designSystem }: Props) {
  const p = designSystem.palette;
  const primary = p.primary.hex;
  const secondary = p.secondary.hex;
  const neutralLight = p.neutral.scale[0] ?? "#ffffff";
  const neutralDark = p.neutral.scale[4] ?? "#0a0a0c";
  const neutralMid = p.neutral.scale[2] ?? "#6b7280";
  const display = designSystem.type.display.family;
  const body = designSystem.type.body.family;

  const cssVars = {
    "--wrks-primary": primary,
    "--wrks-secondary": secondary,
    "--wrks-neutral-0": p.neutral.scale[0],
    "--wrks-neutral-1": p.neutral.scale[1],
    "--wrks-neutral-2": p.neutral.scale[2],
    "--wrks-neutral-3": p.neutral.scale[3],
    "--wrks-neutral-4": p.neutral.scale[4],
    "--wrks-tertiary": p.tertiary.hex,
    "--wrks-display": `"${display}", ui-serif, Georgia, serif`,
    "--wrks-body": `"${body}", ui-sans-serif, system-ui, sans-serif`,
    background: neutralLight,
    color: neutralDark,
    fontFamily: `var(--wrks-body)`,
  } as React.CSSProperties;

  return (
    <div
      className="page-artboard"
      style={{
        width: 1280,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.1)",
        boxShadow:
          "0 40px 100px -40px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.2)",
        ...cssVars,
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center"
        style={{
          padding: "10px 16px",
          gap: 12,
          background: p.neutral.scale[1],
          borderBottom: `1px solid ${p.neutral.scale[2]}44`,
          fontSize: 13,
          color: `${neutralDark}b0`,
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
        }}
      >
        <span aria-hidden style={{ display: "inline-flex", gap: 5 }}>
          <span style={dotStyle("#ff5f56")} />
          <span style={dotStyle("#ffbd2e")} />
          <span style={dotStyle("#27c93f")} />
        </span>
        <span
          style={{
            flex: 1,
            padding: "5px 12px",
            borderRadius: 6,
            background: neutralLight,
            border: `1px solid ${p.neutral.scale[2]}55`,
          }}
        >
          your-brand.wrks.studio · {page.pageId}
        </span>
      </div>

      {/* Nav strip */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "18px 40px",
          borderBottom: `1px solid ${p.neutral.scale[2]}33`,
        }}
      >
        <span
          style={{
            fontFamily: `var(--wrks-display)`,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.015em",
          }}
        >
          {page.title}
        </span>
        <span
          style={{
            fontSize: 13,
            color: neutralMid,
            fontFamily: `var(--wrks-body)`,
          }}
        >
          Home · About · Work · Contact
        </span>
      </div>

      {/* Sections */}
      {page.sections.map((s, i) => (
        <SectionRenderer
          key={`${s.kind}-${i}`}
          section={s}
          designSystem={designSystem}
        />
      ))}
    </div>
  );
}

function dotStyle(color: string): React.CSSProperties {
  return {
    display: "inline-block",
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: color,
  };
}

// ============================================================
// Section renderers — one per kind. Read from the shared CSS
// variables so they update if the design system changes.
// ============================================================
function SectionRenderer({
  section,
  designSystem,
}: {
  section: PageSectionData;
  designSystem: DesignSystem;
}) {
  if (section.kind === "hero") return <Hero s={section} ds={designSystem} />;
  if (section.kind === "valueGrid")
    return <ValueGrid s={section} ds={designSystem} />;
  if (section.kind === "about") return <About s={section} ds={designSystem} />;
  return <Cta s={section} ds={designSystem} />;
}

function Hero({
  s,
  ds,
}: {
  s: Extract<PageSectionData, { kind: "hero" }>;
  ds: DesignSystem;
}) {
  const neutralDark = ds.palette.neutral.scale[4] ?? "#0a0a0c";
  const neutralLight = ds.palette.neutral.scale[0] ?? "#ffffff";
  return (
    <div
      style={{
        padding: "84px 40px 88px",
        textAlign: "left",
      }}
    >
      {s.eyebrow && (
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: `${neutralDark}88`,
            marginBottom: 14,
          }}
        >
          {s.eyebrow}
        </div>
      )}
      <h1
        style={{
          fontFamily: `var(--wrks-display)`,
          fontSize: 60,
          fontWeight: 600,
          lineHeight: 1.04,
          letterSpacing: "-0.028em",
          maxWidth: "22ch",
          margin: 0,
        }}
      >
        {s.headline}
      </h1>
      <p
        style={{
          fontSize: 19,
          lineHeight: 1.55,
          color: `${neutralDark}b3`,
          maxWidth: "58ch",
          margin: "22px 0 0",
        }}
      >
        {s.subhead}
      </p>
      <div
        style={{
          marginTop: 30,
          display: "flex",
          gap: 12,
        }}
      >
        <a
          style={{
            display: "inline-block",
            padding: "13px 22px",
            borderRadius: 10,
            background: neutralDark,
            color: neutralLight,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {s.primaryCta.label}
        </a>
        {s.secondaryCta && (
          <a
            style={{
              display: "inline-block",
              padding: "13px 22px",
              borderRadius: 10,
              background: "transparent",
              color: neutralDark,
              fontSize: 14,
              fontWeight: 500,
              border: `1px solid ${neutralDark}`,
              textDecoration: "none",
            }}
          >
            {s.secondaryCta.label}
          </a>
        )}
      </div>
    </div>
  );
}

function ValueGrid({
  s,
  ds,
}: {
  s: Extract<PageSectionData, { kind: "valueGrid" }>;
  ds: DesignSystem;
}) {
  const neutralDark = ds.palette.neutral.scale[4] ?? "#0a0a0c";
  const neutralPanel = ds.palette.neutral.scale[1] ?? "#f5f5f5";
  return (
    <div
      style={{
        padding: "72px 40px 76px",
        background: neutralPanel,
      }}
    >
      <h2
        style={{
          fontFamily: `var(--wrks-display)`,
          fontSize: 34,
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          maxWidth: "22ch",
          margin: "0 0 40px",
        }}
      >
        {s.heading}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(s.cards.length, 3)}, 1fr)`,
          gap: 20,
        }}
      >
        {s.cards.map((c, i) => (
          <div
            key={i}
            style={{
              padding: "22px 22px 26px",
              borderRadius: 12,
              background: ds.palette.neutral.scale[0],
              border: `1px solid ${ds.palette.neutral.scale[2]}44`,
            }}
          >
            <h3
              style={{
                fontFamily: `var(--wrks-display)`,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                margin: "0 0 8px",
              }}
            >
              {c.title}
            </h3>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: `${neutralDark}b0`,
                margin: 0,
              }}
            >
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function About({
  s,
  ds,
}: {
  s: Extract<PageSectionData, { kind: "about" }>;
  ds: DesignSystem;
}) {
  const neutralDark = ds.palette.neutral.scale[4] ?? "#0a0a0c";
  const neutralLight = ds.palette.neutral.scale[0] ?? "#ffffff";
  return (
    <div style={{ padding: "72px 40px 78px" }}>
      <div style={{ maxWidth: 720 }}>
        {s.eyebrow && (
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: `${neutralDark}88`,
              marginBottom: 14,
            }}
          >
            {s.eyebrow}
          </div>
        )}
        <h2
          style={{
            fontFamily: `var(--wrks-display)`,
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            margin: "0 0 22px",
            maxWidth: "24ch",
          }}
        >
          {s.heading}
        </h2>
        {s.paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 15.5,
              lineHeight: 1.65,
              color: `${neutralDark}c8`,
              margin: "0 0 16px",
            }}
          >
            {para}
          </p>
        ))}
        {s.cta && (
          <a
            style={{
              display: "inline-block",
              marginTop: 12,
              padding: "12px 20px",
              borderRadius: 10,
              background: neutralDark,
              color: neutralLight,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {s.cta.label}
          </a>
        )}
      </div>
    </div>
  );
}

function Cta({
  s,
  ds,
}: {
  s: Extract<PageSectionData, { kind: "cta" }>;
  ds: DesignSystem;
}) {
  const primary = ds.palette.primary.hex;
  return (
    <div
      style={{
        padding: "68px 40px 74px",
        background: ds.palette.neutral.scale[4] ?? "#0a0a0c",
        color: ds.palette.neutral.scale[0] ?? "#ffffff",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontFamily: `var(--wrks-display)`,
          fontSize: 36,
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          margin: "0 auto",
          maxWidth: "26ch",
        }}
      >
        {s.heading}
      </h2>
      {s.subhead && (
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.55,
            opacity: 0.72,
            maxWidth: "48ch",
            margin: "16px auto 0",
          }}
        >
          {s.subhead}
        </p>
      )}
      <a
        style={{
          display: "inline-block",
          marginTop: 28,
          padding: "14px 26px",
          borderRadius: 10,
          background: primary,
          color: "#ffffff",
          fontSize: 15,
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        {s.cta.label}
      </a>
    </div>
  );
}
