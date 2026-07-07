"use client";

import type { DesignSystem } from "@/lib/site-generation/design-system";
import type { PageContent } from "@/lib/site-generation/page-content";

// Page artboard — renders the generated PageContent styled to visually
// mirror the Bill-Fanter WRKS template (dark hero + dot-grid + trust row
// + namecard, HelpGrid 3-column with icons, dark About block, dark
// Closing with pills), with the design system applied via CSS variables.
//
// Portrait / photo slots use gradient placeholders keyed off the
// generated palette until the image pipeline ships.

type Props = {
  page: PageContent;
  designSystem: DesignSystem;
};

const STAR_PATH = "M12 2l3 7 7 .8-5 5 1.5 7-6.5-3.5L5 22l1.5-7-5-5L8.5 9z";

export function PageArtboard({ page, designSystem }: Props) {
  const p = designSystem.palette;
  const neutralDark = p.neutral.scale[4] ?? "#0a0a0c";
  const neutralLight = p.neutral.scale[0] ?? "#ffffff";
  const display = designSystem.type.display.family;
  const body = designSystem.type.body.family;

  const cssVars = {
    "--wrks-primary": p.primary.hex,
    "--wrks-secondary": p.secondary.hex,
    "--wrks-tertiary": p.tertiary.hex,
    "--wrks-neutral-0": p.neutral.scale[0],
    "--wrks-neutral-1": p.neutral.scale[1],
    "--wrks-neutral-2": p.neutral.scale[2],
    "--wrks-neutral-3": p.neutral.scale[3],
    "--wrks-neutral-4": p.neutral.scale[4],
    "--wrks-display": `"${display}", ui-serif, Georgia, serif`,
    "--wrks-body": `"${body}", ui-sans-serif, system-ui, sans-serif`,
    background: neutralLight,
    color: neutralDark,
    fontFamily: "var(--wrks-body)",
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
      <BrowserChrome pageId={page.pageId} designSystem={designSystem} />

      {/* Nav strip on light bg (visually below the chrome, above the
          dark hero — matches Bill-Fanter's CardNav layout). */}
      <Nav page={page} designSystem={designSystem} />

      {/* Sections in Bill-Fanter order */}
      <Hero data={page.hero} designSystem={designSystem} />
      <HelpGrid data={page.helpGrid} designSystem={designSystem} />
      <About data={page.about} designSystem={designSystem} />
      <Closing data={page.closing} designSystem={designSystem} />
    </div>
  );
}

// ============================================================
// Browser chrome
// ============================================================
function BrowserChrome({
  pageId,
  designSystem,
}: {
  pageId: string;
  designSystem: DesignSystem;
}) {
  const p = designSystem.palette;
  const neutralLight = p.neutral.scale[0] ?? "#ffffff";
  const neutralDark = p.neutral.scale[4] ?? "#0a0a0c";
  return (
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
        your-brand.wrks.studio · {pageId}
      </span>
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
// Nav (light, overlaid on top of the dark hero visually)
// ============================================================
function Nav({
  page,
  designSystem,
}: {
  page: PageContent;
  designSystem: DesignSystem;
}) {
  const neutralDark = designSystem.palette.neutral.scale[4] ?? "#0a0a0c";
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "18px 40px",
        background: "#0a0a0c",
        color: "#f5f0e6",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--wrks-display)",
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          color: "#f5f0e6",
        }}
      >
        {page.title}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "rgba(245,240,230,0.65)",
          fontFamily: "var(--wrks-body)",
        }}
      >
        Home · About · Work · Contact
      </span>
      <span
        style={{
          padding: "8px 16px",
          borderRadius: 999,
          background: designSystem.palette.primary.hex,
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        {page.hero.primaryCta.label}
      </span>
      {/* Reserve neutralDark just to keep the color reference honest. */}
      <span style={{ display: "none", color: neutralDark }} />
    </div>
  );
}

// ============================================================
// HERO — dark stage, dot-grid, trust row, namecard, portrait placeholder
// ============================================================
function Hero({
  data,
  designSystem,
}: {
  data: PageContent["hero"];
  designSystem: DesignSystem;
}) {
  const primary = designSystem.palette.primary.hex;
  const tertiary = designSystem.palette.tertiary.hex;
  return (
    <div
      style={{
        position: "relative",
        padding: "88px 40px 96px",
        background: "#0a0a0a",
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Dot-grid overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at center, rgba(69,69,69,0.66) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
          opacity: 0.66,
          zIndex: 0,
        }}
      />

      {/* Right-anchored portrait placeholder — Bill-Fanter has a real
          image here. Until we ship the image pipeline, a gradient block
          keyed to the palette. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "58%",
          right: 0,
          zIndex: 1,
          background: `linear-gradient(135deg, ${primary} 0%, ${tertiary} 100%)`,
          opacity: 0.62,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "58%",
          right: 0,
          zIndex: 2,
          background:
            "linear-gradient(90deg, #0a0a0a 0%, transparent 30%, transparent 100%)",
        }}
      />

      {/* Copy rail */}
      <div style={{ position: "relative", zIndex: 3, maxWidth: 720 }}>
        <h1
          style={{
            fontFamily: "var(--wrks-display)",
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            margin: 0,
          }}
        >
          {data.headline}
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.55,
            color: "#ffffff",
            maxWidth: "56ch",
            margin: "24px 0 0",
          }}
        >
          {data.subhead}
        </p>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "14px 26px",
              borderRadius: 999,
              background: "#ffffff",
              color: "#0a0a0a",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {data.primaryCta.label}
          </span>
          <span
            style={{
              padding: "14px 26px",
              borderRadius: 999,
              background: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.4)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {data.secondaryCta.label}
          </span>
        </div>

        {/* Trust row */}
        <div
          style={{
            marginTop: 26,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            color: "#ffffff",
          }}
        >
          <span>{data.trust.label}</span>
          <span
            aria-hidden
            style={{ display: "inline-flex", gap: 2 }}
          >
            {Array.from({ length: data.trust.rating }).map((_, i) => (
              <svg
                key={i}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#ffc14d"
              >
                <path d={STAR_PATH} />
              </svg>
            ))}
          </span>
          <span style={{ fontWeight: 400 }}>{data.trust.count}</span>
        </div>
      </div>

      {/* Namecard bubble on the portrait */}
      <div
        style={{
          position: "absolute",
          left: "60%",
          bottom: 26,
          zIndex: 4,
          padding: "12px 18px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#0a0a0a",
            fontFamily: "var(--wrks-display)",
          }}
        >
          {data.namecard.name}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(10,10,10,0.6)",
          }}
        >
          {data.namecard.role}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// HELPGRID — 3-column icon cards on light bg (Bill-Fanter parity)
// ============================================================
function HelpGrid({
  data,
  designSystem,
}: {
  data: PageContent["helpGrid"];
  designSystem: DesignSystem;
}) {
  const p = designSystem.palette;
  const neutralDark = p.neutral.scale[4] ?? "#0a0a0c";
  const primary = p.primary.hex;
  return (
    <div
      style={{
        padding: "88px 40px 96px",
        background: p.neutral.scale[0],
        color: neutralDark,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--wrks-display)",
          fontSize: 38,
          fontWeight: 600,
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
          textAlign: "center",
          maxWidth: "24ch",
          margin: "0 auto 48px",
        }}
      >
        {data.heading}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(data.cards.length, 3)}, 1fr)`,
          gap: 24,
          maxWidth: 1040,
          margin: "0 auto",
        }}
      >
        {data.cards.map((c, i) => (
          <div
            key={i}
            style={{
              padding: "28px 26px 30px",
              borderRadius: 14,
              background: p.neutral.scale[0],
              border: `1px solid ${p.neutral.scale[2]}44`,
            }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${primary}18`,
                color: primary,
                marginBottom: 18,
              }}
            >
              <IconGlyph index={i} />
            </span>
            <h3
              style={{
                fontFamily: "var(--wrks-display)",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                margin: "0 0 8px",
              }}
            >
              {c.title}
            </h3>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: `${neutralDark}b3`,
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

function IconGlyph({ index }: { index: number }) {
  const paths = [
    "M12 3v18M3 12h18",
    "M4 12l6 6 10-14",
    "M4 6h16M4 12h16M4 18h10",
    "M12 3l3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z",
  ];
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[index % paths.length]} />
    </svg>
  );
}

// ============================================================
// ABOUT — light bg, split (photo placeholder + long-form copy)
// ============================================================
function About({
  data,
  designSystem,
}: {
  data: PageContent["about"];
  designSystem: DesignSystem;
}) {
  const p = designSystem.palette;
  const neutralDark = p.neutral.scale[4] ?? "#0a0a0c";
  const primary = p.primary.hex;
  const secondary = p.secondary.hex;
  return (
    <div
      style={{
        padding: "88px 40px 96px",
        background: p.neutral.scale[1],
        color: neutralDark,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          gap: 60,
          alignItems: "start",
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        {/* Photo placeholder */}
        <div
          aria-hidden
          style={{
            aspectRatio: "3 / 4",
            borderRadius: 14,
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)",
            }}
          />
        </div>

        <div>
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: `${neutralDark}88`,
              marginBottom: 14,
            }}
          >
            {data.eyebrow}
          </div>
          <h2
            style={{
              fontFamily: "var(--wrks-display)",
              fontSize: 40,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              maxWidth: "22ch",
              margin: "0 0 24px",
            }}
          >
            {data.heading}
          </h2>
          {data.paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: 15.5,
                lineHeight: 1.65,
                color: `${neutralDark}cc`,
                margin: "0 0 14px",
              }}
            >
              {para}
            </p>
          ))}
          <span
            style={{
              display: "inline-block",
              marginTop: 14,
              padding: "13px 22px",
              borderRadius: 10,
              background: neutralDark,
              color: p.neutral.scale[0] ?? "#ffffff",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {data.cta.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CLOSING — dark stage, headline + lead + trust + pill row
// ============================================================
function Closing({
  data,
  designSystem: _ds,
}: {
  data: PageContent["closing"];
  designSystem: DesignSystem;
}) {
  return (
    <div
      style={{
        padding: "88px 40px 96px",
        background: "#0a0a0a",
        color: "#ffffff",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--wrks-display)",
          fontSize: 42,
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          maxWidth: "24ch",
          margin: "0 auto 14px",
        }}
      >
        {data.heading}
      </h2>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.7)",
          maxWidth: "56ch",
          margin: "0 auto 28px",
        }}
      >
        {data.lead}
      </p>

      {/* Trust row */}
      <div
        style={{
          marginBottom: 30,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          fontSize: 14,
          color: "#ffffff",
        }}
      >
        <span style={{ fontWeight: 600 }}>{data.trust.label}</span>
        <span aria-hidden style={{ display: "inline-flex", gap: 2 }}>
          {Array.from({ length: data.trust.rating }).map((_, i) => (
            <svg
              key={i}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="#ffc14d"
            >
              <path d={STAR_PATH} />
            </svg>
          ))}
        </span>
        <span>{data.trust.count}</span>
      </div>

      {/* Pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
          maxWidth: 780,
          margin: "0 auto",
        }}
      >
        {data.pills.map((pill, i) => (
          <span
            key={i}
            style={{
              padding: "12px 22px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.42)",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {pill.label}
          </span>
        ))}
      </div>
    </div>
  );
}
