"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Personality } from "@/lib/personalities";
import {
  useStudio,
  type DeliverableKind,
  type StoredWowPayload,
} from "@/lib/studio-context";

// /studio — asymmetric editorial bento.
//
// User flagged 2026-06-17: "Looks fucked up, no proper layout, no proper
// spacing." The orbital scene from the previous commit had cards at organic
// angles that overlapped, clipped on the top strip, and read as chaos.
//
// Pivoted to a structured bento that keeps every win we shipped:
//   * Real images from stored.images (heroLandscape, instagramSquare,
//     adHero, featured[0..1])
//   * Palette-sibling crystal-light comets per card
//   * Editorial typography
//   * No greeting headline / no chrome accent / no AmbientAura
//   * Bottom-right floating Siri orb (layout handles it)
//
// Composition:
//   [Top strip: brand wordmark + edition + agent status]
//   ┌──────────────┬─────────┬─────────┐
//   │              │ Insta-  │ Meta    │
//   │              │ gram    │ ad      │
//   │  Landing     ├─────────┼─────────┤
//   │  (spans 2    │ X       │ Linked- │
//   │   rows)      │         │ In      │
//   └──────────────┴─────────┴─────────┘
//   [Activity ticker — inline, single italic line]

/* ============================================================
 * Color helpers
 * ============================================================ */

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function shiftHueRgb(hex: string, degrees: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const lit = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = lit > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue /= 6;
  }
  hue = (hue + degrees / 360) % 1;
  if (hue < 0) hue += 1;
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r2: number;
  let g2: number;
  let b2: number;
  if (sat === 0) {
    r2 = g2 = b2 = lit;
  } else {
    const q = lit < 0.5 ? lit * (1 + sat) : lit + sat - lit * sat;
    const p = 2 * lit - q;
    r2 = hue2rgb(p, q, hue + 1 / 3);
    g2 = hue2rgb(p, q, hue);
    b2 = hue2rgb(p, q, hue - 1 / 3);
  }
  return `${Math.round(r2 * 255)}, ${Math.round(g2 * 255)}, ${Math.round(b2 * 255)}`;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "");
}

/* ============================================================
 * Page
 * ============================================================ */

type SocialKind = "instagram" | "twitter" | "linkedin" | "ad";

const SOCIAL_DELIVERABLES: {
  kind: SocialKind;
  label: string;
  hueShift: number;
  delay: number;
}[] = [
  { kind: "instagram", label: "Instagram", hueShift: -10, delay: 0.14 },
  { kind: "ad", label: "Meta ad", hueShift: -20, delay: 0.18 },
  { kind: "twitter", label: "X · Twitter", hueShift: 8, delay: 0.22 },
  { kind: "linkedin", label: "LinkedIn", hueShift: 20, delay: 0.26 },
];

export default function StudioBentoPage() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const { personality, agentName, voice, stored, setActiveId } = useStudio();

  const [hovered, setHovered] = useState<"landing" | SocialKind | null>(null);

  const brandName = stored?.deliverables.brandName ?? "Your brand";
  const accent = personality.accent;
  const accentRgb = hexToRgbTriplet(accent);

  const onPickWork = (id: DeliverableKind) => {
    setActiveId(id);
    router.push("/studio/library");
  };

  return (
    <main
      className="relative size-full overflow-auto"
      style={{ background: "#0a0a0c" }}
    >
      {/* Ambient palette halos */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 50% at 92% -5%, ${accent}1d, transparent 65%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 50% at 8% 108%, ${personality.accentDeep}1a, transparent 65%)`,
        }}
      />

      <div
        className="relative z-10 mx-auto flex flex-col"
        style={{
          maxWidth: 1340,
          padding: "28px 36px 32px",
          minHeight: "100%",
        }}
      >
        {/* TOP STRIP */}
        <TopStrip
          brandName={brandName}
          agentName={agentName}
          voiceName={voice?.name}
          personality={personality}
          reduced={!!reduced}
        />

        {/* BENTO */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 0.72, 0.2, 1] }}
          className="grid flex-1"
          style={{
            marginTop: 22,
            gap: 14,
            gridTemplateColumns:
              "minmax(0, 1.7fr) minmax(0, 1fr) minmax(0, 1fr)",
            gridTemplateRows: "minmax(280px, 1fr) minmax(280px, 1fr)",
            minHeight: 600,
          }}
        >
          {/* LANDING — column 1, both rows */}
          <BigLandingCell
            personality={personality}
            stored={stored}
            brandName={brandName}
            accentRgb={accentRgb}
            isHovered={hovered === "landing"}
            onHoverStart={() => setHovered("landing")}
            onHoverEnd={() => setHovered(null)}
            onClick={() => onPickWork("landing")}
            reduced={!!reduced}
          />

          {/* 4 small cards */}
          {SOCIAL_DELIVERABLES.map((d) => (
            <SmallCell
              key={d.kind}
              kind={d.kind}
              label={d.label}
              personality={personality}
              stored={stored}
              brandName={brandName}
              accentRgb={shiftHueRgb(accent, d.hueShift)}
              isHovered={hovered === d.kind}
              onHoverStart={() => setHovered(d.kind)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => onPickWork(d.kind)}
              reduced={!!reduced}
              delay={d.delay}
            />
          ))}
        </motion.div>

        {/* ACTIVITY TICKER — inline below the bento */}
        <ActivityTicker
          agentName={agentName}
          personality={personality}
          hasStored={!!stored}
        />
      </div>
    </main>
  );
}

/* ============================================================
 * TopStrip — inline (no absolute), so it stays in flow + can't clip
 * ============================================================ */

function TopStrip({
  brandName,
  agentName,
  voiceName,
  personality,
  reduced,
}: {
  brandName: string;
  agentName: string;
  voiceName: string | undefined;
  personality: Personality;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 0.72, 0.2, 1] }}
      className="flex items-center justify-between gap-6 shrink-0"
      style={{ height: 36 }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="font-serif truncate"
          style={{
            fontSize: 24,
            fontWeight: 480,
            letterSpacing: "-0.022em",
            color: "rgba(248,247,252,0.96)",
            lineHeight: 1,
          }}
        >
          {brandName}
        </span>
        <span
          aria-hidden
          className="block"
          style={{
            width: 1,
            height: 20,
            background: "rgba(245,245,247,0.14)",
          }}
        />
        <span
          className="uppercase"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.32em",
            color: "rgba(245,245,247,0.5)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          Edition v1
        </span>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <motion.span
          aria-hidden
          animate={
            reduced
              ? { opacity: 0.85 }
              : { opacity: [0.55, 1, 0.55] }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="block rounded-full"
          style={{
            width: 6,
            height: 6,
            background: personality.accent,
            boxShadow: `0 0 8px ${personality.accent}aa`,
          }}
        />
        <span
          className="uppercase"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.28em",
            color: "rgba(245,245,247,0.7)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          {(agentName?.trim() || personality.name)} stands ready
          {voiceName ? ` · ${voiceName}` : ""}
        </span>
      </div>
    </motion.div>
  );
}

/* ============================================================
 * BigLandingCell — the hero (col 1, spans 2 rows). Split layout:
 * text left, real hero photo right. Browser-chrome frame.
 * ============================================================ */

function BigLandingCell({
  personality,
  stored,
  brandName,
  accentRgb,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
  reduced,
}: {
  personality: Personality;
  stored: StoredWowPayload | null;
  brandName: string;
  accentRgb: string;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
  reduced: boolean;
}) {
  const headline =
    stored?.deliverables.landing.headline ?? "Tell your agent what to build.";
  const subhead =
    stored?.deliverables.landing.subhead ?? "We're drafting your edition.";
  const cta = stored?.deliverables.landing.primaryCta ?? "Get started";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      initial={reduced ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.72, 0.2, 1] }}
      className="wrks-crystal-border relative block text-left cursor-pointer"
      style={
        {
          gridRow: "1 / 3",
          gridColumn: "1 / 2",
          padding: 18,
          borderRadius: 20,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 100%)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          boxShadow: isHovered
            ? `0 60px 140px -40px rgba(0,0,0,0.9), 0 0 60px -10px rgba(${accentRgb}, 0.45), inset 0 1px 0 rgba(255,255,255,0.06)`
            : `0 50px 110px -40px rgba(0,0,0,0.8), 0 0 40px -10px rgba(${accentRgb}, 0.28), inset 0 1px 0 rgba(255,255,255,0.05)`,
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          transition:
            "transform 320ms cubic-bezier(0.22, 0.72, 0.2, 1), box-shadow 320ms ease",
          "--wrks-crystal-rgb": accentRgb,
        } as React.CSSProperties
      }
    >
      <div className="relative z-[2] h-full flex flex-col">
        {/* Top eyebrow */}
        <div className="flex items-center justify-between shrink-0" style={{ marginBottom: 12 }}>
          <span
            className="uppercase"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.32em",
              color: "rgba(245,245,247,0.5)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            Landing page · 1440 × 900
          </span>
          <span
            className="inline-flex items-center gap-1.5 uppercase"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.28em",
              color: "rgba(245,245,247,0.65)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            <span
              aria-hidden
              className="block rounded-full"
              style={{
                width: 5,
                height: 5,
                background: `rgba(${accentRgb}, 1)`,
                boxShadow: `0 0 8px rgba(${accentRgb}, 0.65)`,
              }}
            />
            Draft
          </span>
        </div>

        {/* Render frame: browser chrome + page */}
        <div
          className="relative flex-1 overflow-hidden flex flex-col min-h-0"
          style={{
            borderRadius: 12,
            background: `linear-gradient(180deg, rgba(${accentRgb}, 0.05) 0%, ${personality.accentDeep}22 100%), #0e0e12`,
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow:
              "0 22px 50px -22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Browser top */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            style={{
              padding: "11px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span
              aria-hidden
              className="block rounded-full"
              style={{ width: 8, height: 8, background: "rgba(255,255,255,0.16)" }}
            />
            <span
              aria-hidden
              className="block rounded-full"
              style={{ width: 8, height: 8, background: "rgba(255,255,255,0.16)" }}
            />
            <span
              aria-hidden
              className="block rounded-full"
              style={{ width: 8, height: 8, background: "rgba(255,255,255,0.16)" }}
            />
            <span
              className="ml-3 truncate uppercase"
              style={{
                fontSize: 9.5,
                letterSpacing: "0.24em",
                color: "rgba(245,245,247,0.42)",
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}
            >
              {slugify(brandName)}.wrks.studio
            </span>
          </div>

          {/* Page body */}
          <div className="flex flex-col flex-1 min-h-0" style={{ padding: "20px 24px 22px" }}>
            {/* Brand nav */}
            <div className="flex items-center justify-between shrink-0" style={{ marginBottom: 18 }}>
              <div className="flex items-center gap-2">
                <span
                  className="shrink-0 grid place-items-center"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                  aria-hidden
                >
                  {brandName.charAt(0).toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "rgba(245,245,247,0.92)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {brandName}
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <span style={{ fontSize: 10.5, color: "rgba(245,245,247,0.42)" }}>About</span>
                <span style={{ fontSize: 10.5, color: "rgba(245,245,247,0.42)" }}>Work</span>
                <span style={{ fontSize: 10.5, color: `rgba(${accentRgb}, 1)`, fontWeight: 500 }}>{cta}</span>
              </div>
            </div>

            {/* Split: text LEFT, real hero photo RIGHT */}
            <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: "1.1fr 1fr", gap: 18 }}>
              {/* Text column */}
              <div className="flex flex-col min-w-0">
                <h2
                  className="font-serif"
                  style={{
                    fontSize: "clamp(22px, 2.2vw, 32px)",
                    fontWeight: 480,
                    lineHeight: 1.04,
                    letterSpacing: "-0.03em",
                    color: "rgba(248,247,252,0.98)",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {headline}
                </h2>
                <p
                  className="font-serif italic"
                  style={{
                    fontSize: 13,
                    color: "rgba(245,245,247,0.62)",
                    marginTop: 14,
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {subhead}
                </p>
                <div className="mt-auto pt-4">
                  <div
                    className="inline-flex items-center gap-1.5"
                    style={{
                      padding: "6px 14px",
                      borderRadius: 7,
                      background: `rgba(${accentRgb}, 0.18)`,
                      border: `1px solid rgba(${accentRgb}, 0.38)`,
                      color: `rgba(${accentRgb}, 1)`,
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: "-0.003em",
                    }}
                  >
                    {cta}
                    <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>→</span>
                  </div>
                </div>
              </div>

              {/* Image column — real heroLandscape from onboarding */}
              <div
                className="relative overflow-hidden"
                style={{
                  borderRadius: 9,
                  background: `linear-gradient(180deg, rgba(${accentRgb}, 0.18) 0%, ${personality.accentDeep}55 100%)`,
                  border: `1px solid rgba(${accentRgb}, 0.18)`,
                  minHeight: 0,
                }}
              >
                {stored?.images.heroLandscape ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stored.images.heroLandscape}
                    alt=""
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(ellipse 60% 50% at 30% 30%, rgba(255,255,255,0.18), transparent 70%)`,
                    }}
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: "40%",
                    background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.45))",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * SmallCell — one of the 4 platform cells in the bento.
 * ============================================================ */

function SmallCell({
  kind,
  label,
  personality,
  stored,
  brandName,
  accentRgb,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
  reduced,
  delay,
}: {
  kind: SocialKind;
  label: string;
  personality: Personality;
  stored: StoredWowPayload | null;
  brandName: string;
  accentRgb: string;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
  reduced: boolean;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      initial={reduced ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 0.72, 0.2, 1] }}
      className="wrks-crystal-border relative block text-left cursor-pointer overflow-hidden"
      style={
        {
          padding: 14,
          borderRadius: 14,
          background: `linear-gradient(180deg, rgba(${accentRgb}, 0.07) 0%, rgba(255,255,255,0.012) 100%)`,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: isHovered
            ? `0 40px 80px -32px rgba(0,0,0,0.9), 0 0 40px -8px rgba(${accentRgb}, 0.45), inset 0 1px 0 rgba(255,255,255,0.05)`
            : `0 28px 60px -32px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.04)`,
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          transition:
            "transform 280ms cubic-bezier(0.22, 0.72, 0.2, 1), box-shadow 280ms ease",
          "--wrks-crystal-rgb": accentRgb,
        } as React.CSSProperties
      }
    >
      <div className="relative z-[2] h-full flex flex-col">
        {/* Top: label + status dot */}
        <div className="flex items-center justify-between shrink-0" style={{ marginBottom: 10 }}>
          <span
            className="uppercase"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.32em",
              color: "rgba(245,245,247,0.52)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            {label}
          </span>
          <span
            aria-hidden
            className="block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: stored ? `rgba(${accentRgb}, 1)` : "rgba(245,245,247,0.22)",
              boxShadow: stored ? `0 0 8px rgba(${accentRgb}, 0.62)` : "none",
            }}
          />
        </div>

        {/* Inner frame — render the platform layout */}
        <div
          className="relative flex-1 overflow-hidden flex flex-col min-h-0"
          style={{
            borderRadius: 9,
            background: `linear-gradient(180deg, rgba(${accentRgb}, 0.04) 0%, #0d0d10 100%)`,
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "10px 12px 11px",
          }}
        >
          {kind === "instagram" && (
            <MiniInstagram
              brandName={brandName}
              handle={slugify(brandName)}
              caption={stored?.deliverables.social.instagram ?? "Tell your agent what to post on Instagram."}
              image={stored?.images.instagramSquare}
              accentRgb={accentRgb}
              personality={personality}
            />
          )}
          {kind === "twitter" && (
            <MiniX
              brandName={brandName}
              handle={slugify(brandName)}
              text={stored?.deliverables.social.twitter ?? "Tell your agent what to tweet."}
              image={stored?.images.featured?.[0]}
              accentRgb={accentRgb}
            />
          )}
          {kind === "linkedin" && (
            <MiniLinkedIn
              brandName={brandName}
              text={stored?.deliverables.social.linkedin ?? "Tell your agent what to post on LinkedIn."}
              image={stored?.images.featured?.[1]}
              accentRgb={accentRgb}
            />
          )}
          {kind === "ad" && (
            <MiniAd
              brandName={brandName}
              text={stored?.deliverables.ad.headline ?? "Tell your agent what to advertise."}
              cta={stored?.deliverables.ad.cta ?? "Learn more"}
              image={stored?.images.adHero}
              accentRgb={accentRgb}
              personality={personality}
            />
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * BrandMark — small palette-tinted brand-initial tile used in
 * the social mini-renders.
 * ============================================================ */

function BrandMark({ brandName, personality, size = 18 }: { brandName: string; personality: Personality; size?: number }) {
  return (
    <span
      className="shrink-0 grid place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(3, size * 0.22),
        background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
        color: "white",
        fontSize: Math.round(size * 0.5),
        fontWeight: 700,
        lineHeight: 1,
      }}
      aria-hidden
    >
      {brandName.charAt(0).toUpperCase()}
    </span>
  );
}

/* ============================================================
 * Mini-renders — each laid out like the actual platform.
 * Cards are now larger (~330×270 inner frame) than in the
 * orbital scene, so font sizes and spacing have room.
 * ============================================================ */

function MiniInstagram({ brandName, handle, caption, image, accentRgb, personality }: { brandName: string; handle: string; caption: string; image: string | undefined; accentRgb: string; personality: Personality }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 shrink-0" style={{ marginBottom: 8 }}>
        <BrandMark brandName={brandName} personality={personality} size={22} />
        <div className="flex flex-col min-w-0" style={{ lineHeight: 1.08 }}>
          <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "rgba(245,245,247,0.95)" }}>
            {brandName}
          </span>
          <span className="truncate" style={{ fontSize: 10, color: "rgba(245,245,247,0.45)" }}>
            @{handle}
          </span>
        </div>
      </div>
      <div
        className="flex-1 rounded-md relative overflow-hidden min-h-0"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb}, 0.3) 0%, ${personality.accentDeep}77 100%)`,
          border: `1px solid rgba(${accentRgb}, 0.18)`,
        }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse 65% 55% at 30% 25%, rgba(255,255,255,0.18), transparent 70%)` }}
          />
        )}
      </div>
      <p
        className="shrink-0"
        style={{
          fontSize: 11,
          color: "rgba(245,245,247,0.84)",
          lineHeight: 1.36,
          letterSpacing: "-0.003em",
          marginTop: 8,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {caption}
      </p>
    </div>
  );
}

function MiniX({ brandName, handle, text, image, accentRgb }: { brandName: string; handle: string; text: string; image: string | undefined; accentRgb: string }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 shrink-0" style={{ marginBottom: 6 }}>
        <span
          className="shrink-0 grid place-items-center"
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: `rgba(${accentRgb}, 0.4)`,
            color: "white",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
          }}
          aria-hidden
        >
          {brandName.charAt(0).toUpperCase()}
        </span>
        <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "rgba(245,245,247,0.95)" }}>
          {brandName}
        </span>
        <span className="truncate" style={{ fontSize: 10.5, color: "rgba(245,245,247,0.45)" }}>
          @{handle}
        </span>
      </div>
      <p
        style={{
          fontSize: 11.5,
          color: "rgba(245,245,247,0.88)",
          lineHeight: 1.4,
          letterSpacing: "-0.003em",
          display: "-webkit-box",
          WebkitLineClamp: image ? 3 : 6,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text}
      </p>
      {image && (
        <div
          className="relative overflow-hidden rounded-md"
          style={{
            marginTop: 8,
            height: 72,
            border: `1px solid rgba(${accentRgb}, 0.18)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}
      <div className="flex items-center gap-4 mt-auto pt-2 shrink-0" style={{ color: "rgba(245,245,247,0.45)", fontSize: 12 }}>
        <span>♡</span>
        <span>↻</span>
        <span>↗</span>
      </div>
    </div>
  );
}

function MiniLinkedIn({ brandName, text, image, accentRgb }: { brandName: string; text: string; image: string | undefined; accentRgb: string }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 shrink-0" style={{ marginBottom: 6 }}>
        <span
          className="shrink-0 grid place-items-center"
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            background: `rgba(${accentRgb}, 0.4)`,
            color: "white",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
          }}
          aria-hidden
        >
          {brandName.charAt(0).toUpperCase()}
        </span>
        <div className="flex flex-col min-w-0" style={{ lineHeight: 1.05 }}>
          <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "rgba(245,245,247,0.95)" }}>
            {brandName}
          </span>
          <span className="truncate" style={{ fontSize: 9.5, color: "rgba(245,245,247,0.45)" }}>
            Counsel · Just now
          </span>
        </div>
      </div>
      <p
        style={{
          fontSize: 11.5,
          color: "rgba(245,245,247,0.88)",
          lineHeight: 1.4,
          letterSpacing: "-0.003em",
          display: "-webkit-box",
          WebkitLineClamp: image ? 3 : 6,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text}
      </p>
      {image && (
        <div
          className="relative overflow-hidden rounded-md"
          style={{
            marginTop: 8,
            height: 72,
            border: `1px solid rgba(${accentRgb}, 0.18)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}
      <div className="flex items-center gap-2 mt-auto pt-2 shrink-0" style={{ color: "rgba(245,245,247,0.45)", fontSize: 10.5 }}>
        <span>👍 24</span>
        <span>·</span>
        <span>3 comments</span>
      </div>
    </div>
  );
}

function MiniAd({ brandName, text, image, accentRgb, cta, personality }: { brandName: string; text: string; image: string | undefined; accentRgb: string; cta: string; personality: Personality }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between shrink-0" style={{ marginBottom: 8 }}>
        <div className="flex items-center gap-2">
          <BrandMark brandName={brandName} personality={personality} size={20} />
          <span className="truncate" style={{ fontSize: 12, fontWeight: 600, color: "rgba(245,245,247,0.95)" }}>
            {brandName}
          </span>
        </div>
        <span
          className="uppercase"
          style={{
            fontSize: 8.5,
            letterSpacing: "0.24em",
            color: "rgba(245,245,247,0.42)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          Sponsored
        </span>
      </div>
      <div
        className="flex-1 rounded-md relative overflow-hidden min-h-0"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb}, 0.34) 0%, ${personality.accentDeep}88 100%)`,
          border: `1px solid rgba(${accentRgb}, 0.18)`,
        }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse 70% 60% at 70% 20%, rgba(255,255,255,0.18), transparent 70%)` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 shrink-0" style={{ marginTop: 8 }}>
        <p
          style={{
            fontSize: 11,
            color: "rgba(245,245,247,0.9)",
            lineHeight: 1.3,
            letterSpacing: "-0.003em",
            fontWeight: 500,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flex: 1,
            minWidth: 0,
          }}
        >
          {text}
        </p>
        <span
          className="shrink-0 inline-flex items-center"
          style={{
            padding: "5px 10px",
            borderRadius: 5,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "rgba(245,245,247,0.95)",
            fontSize: 10.5,
            fontWeight: 500,
          }}
        >
          {cta}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
 * ActivityTicker — inline single italic line under the bento
 * ============================================================ */

function ActivityTicker({
  agentName,
  personality,
  hasStored,
}: {
  agentName: string;
  personality: Personality;
  hasStored: boolean;
}) {
  const agent = agentName?.trim() || personality.name;
  const text = hasStored
    ? `${agent} refined the landing headline`
    : `${agent} stands ready · just say what you want to build`;
  const meta = hasStored ? "2 min ago" : "";
  return (
    <div
      className="flex items-center gap-3 shrink-0"
      style={{ marginTop: 16, minHeight: 24 }}
    >
      <span
        aria-hidden
        className="block rounded-full"
        style={{
          width: 5,
          height: 5,
          background: hasStored ? personality.accent : "rgba(245,245,247,0.4)",
          boxShadow: hasStored ? `0 0 7px ${personality.accent}aa` : "none",
        }}
      />
      <span
        className="font-serif italic"
        style={{
          fontSize: 13.5,
          color: "rgba(245,245,247,0.6)",
          letterSpacing: "-0.005em",
        }}
      >
        {text}
        {meta && (
          <span
            className="uppercase"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.24em",
              color: "rgba(245,245,247,0.36)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              marginLeft: 10,
              fontStyle: "normal",
            }}
          >
            · {meta}
          </span>
        )}
      </span>
    </div>
  );
}
