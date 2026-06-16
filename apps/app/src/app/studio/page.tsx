"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useStudio, type DeliverableKind } from "@/lib/studio-context";

// /studio — practical professional dashboard, centered composition.
//
// Layout:
//   • Centered header (eyebrow + Fraunces "Your edition is drafted." +
//     mono caps status meta)
//   • "Your work" eyebrow, centered
//   • ONE big Landing card at the top (full width of content) carrying
//     the brand's drafted hero headline as an excerpt
//   • Four smaller cards under it (Instagram / X / LinkedIn / Meta ad)
//
// Each card's revolving crystal-light comet is tinted by a sibling
// shade of the user's palette accent — same hue family, distinct feel
// per card. The shades come from small HSL hue rotations off the
// accent so it always coheres as a palette.
//
// The personality accent (and its siblings) appears here because the
// cards represent the user's content (master plan §C). All other
// chrome stays neutral white.

/* ============================================================
 * Color helpers
 * ============================================================ */

// Convert "#rrggbb" → "r, g, b" (the format the --wrks-crystal-rgb
// custom property + an rgba() bg tint both need).
function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// Rotate the hue of a hex color by N degrees and return the resulting
// "r, g, b" tuple. Used to derive sibling shades of the accent — same
// palette family, different feel per card.
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
  const rr = Math.round(r2 * 255);
  const gg = Math.round(g2 * 255);
  const bb = Math.round(b2 * 255);
  return `${rr}, ${gg}, ${bb}`;
}

/* ============================================================
 * Deliverable inventory
 * ============================================================ */

const DELIVERABLES: {
  id: DeliverableKind;
  label: string;
  dims: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  hueShift: number; // degrees relative to accent — kept tight so the
  // four siblings read as one palette family, not four different colors
}[] = [
  { id: "landing", label: "Landing page", dims: "1440 × 900", Icon: BrowserIcon, hueShift: 0 },
  { id: "instagram", label: "Instagram post", dims: "1080 × 1080", Icon: CameraIcon, hueShift: -10 },
  { id: "twitter", label: "X post", dims: "280 chars", Icon: XGlyphIcon, hueShift: 8 },
  { id: "linkedin", label: "LinkedIn update", dims: "700 chars", Icon: WorkIcon, hueShift: 20 },
  { id: "ad", label: "Meta ad", dims: "1200 × 628", Icon: CampaignIcon, hueShift: -20 },
];

export default function StudioWelcomePage() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const { personality, stored, setActiveId } = useStudio();

  const brandName = stored?.deliverables.brandName ?? "Your brand";

  const headline = stored
    ? "Your edition is drafted."
    : "Let's draft your first edition.";

  const status = stored
    ? `5 deliverables · draft · not published yet`
    : `Nothing drafted yet · just say what you want to build`;

  const onPickWork = (id: DeliverableKind) => {
    setActiveId(id);
    router.push("/studio/library");
  };

  // Pull content excerpts from the stored work so each card carries the
  // user's actual voice — the dashboard becomes a contact sheet of
  // their brand in motion rather than a row of labeled buttons.
  const excerptForKind = (id: DeliverableKind): string | undefined => {
    if (!stored) return undefined;
    const d = stored.deliverables;
    switch (id) {
      case "instagram":
        return d.social.instagram;
      case "twitter":
        return d.social.twitter;
      case "linkedin":
        return d.social.linkedin;
      case "ad":
        return d.ad.headline;
      default:
        return undefined;
    }
  };

  // The Landing card is special — separated out as the hero piece.
  const landing = DELIVERABLES[0];
  const rest = DELIVERABLES.slice(1);

  return (
    <main
      className="relative size-full overflow-auto"
      style={{ background: "#0a0a0c" }}
    >
      {/* Two subtle palette halos for atmospheric depth — top-right
          (accent) and bottom-left (accentDeep), both very low opacity
          so they read as ambient light, not decoration. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 45% at 92% -5%, ${personality.accent}22, transparent 60%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 50% at 8% 105%, ${personality.accentDeep}1e, transparent 60%)`,
        }}
      />

      <div
        className="relative z-10 mx-auto flex flex-col items-center text-center"
        style={{
          maxWidth: 1180,
          padding: "56px 56px 80px",
        }}
      >
        {/* HEADER */}
        <motion.header
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 0.72, 0.2, 1] }}
          className="flex flex-col items-center"
        >
          <CenteredEyebrow>{brandName} · Studio</CenteredEyebrow>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(32px, 3.4vw, 44px)",
              fontWeight: 480,
              letterSpacing: "-0.024em",
              lineHeight: 1.1,
              color: "rgba(245,245,247,0.97)",
              marginTop: 22,
            }}
          >
            {headline}
          </h1>
          <p
            className="uppercase"
            style={{
              fontSize: 11.5,
              letterSpacing: "0.18em",
              color: "rgba(245,245,247,0.5)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              marginTop: 14,
            }}
          >
            {status}
          </p>
        </motion.header>

        {/* YOUR WORK */}
        <motion.section
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 0.72, 0.2, 1] }}
          style={{ marginTop: 64, width: "100%" }}
          className="flex flex-col items-center"
        >
          <CenteredEyebrow>Your work</CenteredEyebrow>

          <div style={{ width: "100%", maxWidth: 920, marginTop: 28 }}>
            {/* BIG Landing card — editorial brand cover */}
            <BigLandingCard
              dims={landing.dims}
              hasDraft={!!stored}
              accentRgb={hexToRgbTriplet(personality.accent)}
              brandName={brandName}
              landingHeadline={stored?.deliverables.landing.headline}
              landingSubhead={stored?.deliverables.landing.subhead}
              landingCta={stored?.deliverables.landing.primaryCta}
              onPick={() => onPickWork(landing.id)}
              reduced={!!reduced}
            />

            {/* Four small cards under it */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 14,
                marginTop: 14,
              }}
            >
              {rest.map((d, i) => (
                <SmallWorkCard
                  key={d.id}
                  index={i}
                  label={d.label}
                  dims={d.dims}
                  Icon={d.Icon}
                  hasDraft={!!stored}
                  accentRgb={shiftHueRgb(personality.accent, d.hueShift)}
                  excerpt={excerptForKind(d.id)}
                  onPick={() => onPickWork(d.id)}
                  reduced={!!reduced}
                />
              ))}
            </div>
          </div>
        </motion.section>
      </div>

      {/* Bottom-left status line removed — its info ("draft · not
          published yet") is redundant with the centered status meta in
          the header, AND it was colliding with the work cards in the
          screenshot the user flagged. */}
    </main>
  );
}

/* ============================================================
 * Atoms
 * ============================================================ */

function CenteredEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        aria-hidden
        className="block"
        style={{
          width: 28,
          height: 1,
          background: "rgba(245,245,247,0.2)",
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
        {children}
      </span>
      <span
        aria-hidden
        className="block"
        style={{
          width: 28,
          height: 1,
          background: "rgba(245,245,247,0.2)",
        }}
      />
    </div>
  );
}

/* ============================================================
 * BigLandingCard — the hero piece. Renders an editorial brand cover
 * INSIDE the card: brand identity strip on top, big Fraunces headline
 * as the typographic centerpiece, italic subhead, palette-accented
 * CTA hint, and a mono caps footer with status + dims + dot.
 *
 * Click → opens the editor.
 * ============================================================ */
function BigLandingCard({
  dims,
  hasDraft,
  accentRgb,
  brandName,
  landingHeadline,
  landingSubhead,
  landingCta,
  onPick,
  reduced,
}: {
  dims: string;
  hasDraft: boolean;
  accentRgb: string;
  brandName: string;
  landingHeadline: string | undefined;
  landingSubhead: string | undefined;
  landingCta: string | undefined;
  onPick: () => void;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 0.72, 0.2, 1] }}
      className="wrks-crystal-border group relative block w-full text-left transition-transform duration-300 hover:-translate-y-0.5"
      style={
        {
          padding: "44px 52px 30px",
          minHeight: 360,
          borderRadius: 22,
          background: `linear-gradient(180deg, rgba(${accentRgb}, 0.07) 0%, rgba(${accentRgb}, 0.015) 55%, rgba(255,255,255,0.008) 100%)`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: `0 40px 100px -40px rgba(0,0,0,0.7), 0 1px 2px -1px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
          "--wrks-crystal-rgb": accentRgb,
        } as React.CSSProperties
      }
    >
      {/* Atmospheric halo behind the headline (palette-accent content) */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: "8% -8% 30% -8%",
          background: `radial-gradient(ellipse 55% 50% at 50% 60%, rgba(${accentRgb}, 0.16), transparent 70%)`,
          filter: "blur(36px)",
          zIndex: 0,
        }}
      />

      <div className="relative z-[2] h-full flex flex-col">
        {/* Brand identity strip */}
        <div className="flex items-center gap-3">
          <span
            className="shrink-0 grid place-items-center"
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: `rgba(${accentRgb}, 0.16)`,
              border: `1px solid rgba(${accentRgb}, 0.32)`,
              color: `rgba(${accentRgb}, 1)`,
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
            }}
            aria-hidden
          >
            {brandName.charAt(0).toUpperCase()}
          </span>
          <span
            className="uppercase truncate"
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              color: "rgba(245,245,247,0.78)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            {brandName}
          </span>
          <span
            aria-hidden
            className="block flex-1"
            style={{
              height: 1,
              background: "rgba(245,245,247,0.1)",
              marginLeft: 4,
            }}
          />
        </div>

        {/* Editorial headline — the hero typographic moment */}
        {landingHeadline ? (
          <h2
            className="font-serif"
            style={{
              fontSize: "clamp(34px, 4vw, 54px)",
              fontWeight: 480,
              lineHeight: 1.02,
              letterSpacing: "-0.034em",
              color: "rgba(248,247,252,0.98)",
              marginTop: 36,
              maxWidth: "18ch",
              textShadow: `0 24px 60px rgba(${accentRgb}, 0.35)`,
            }}
          >
            {landingHeadline}
          </h2>
        ) : (
          <h2
            className="font-serif italic"
            style={{
              fontSize: "clamp(28px, 3.2vw, 40px)",
              fontWeight: 480,
              lineHeight: 1.1,
              letterSpacing: "-0.024em",
              color: "rgba(245,245,247,0.5)",
              marginTop: 36,
              maxWidth: "22ch",
            }}
          >
            Ask the agent to draft your headline.
          </h2>
        )}

        {/* Italic subhead */}
        {landingSubhead && (
          <p
            className="font-serif italic"
            style={{
              fontSize: "clamp(15px, 1.4vw, 18px)",
              color: "rgba(245,245,247,0.62)",
              letterSpacing: "-0.005em",
              marginTop: 18,
              maxWidth: "44ch",
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {landingSubhead}
          </p>
        )}

        {/* CTA hint */}
        {landingCta && (
          <div
            className="flex items-center gap-2.5"
            style={{ marginTop: 22 }}
          >
            <span
              aria-hidden
              className="block"
              style={{
                width: 22,
                height: 1,
                background: `rgba(${accentRgb}, 0.85)`,
              }}
            />
            <span
              className="uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                color: `rgba(${accentRgb}, 0.92)`,
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}
            >
              {landingCta}
            </span>
          </div>
        )}

        {/* Footer status strip */}
        <div
          className="flex items-center justify-between"
          style={{
            marginTop: "auto",
            paddingTop: 32,
          }}
        >
          <span
            className="uppercase"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.28em",
              color: "rgba(245,245,247,0.5)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            Landing · {dims} · {hasDraft ? "Draft" : "Not started"}
          </span>
          <span
            aria-hidden
            className="block rounded-full"
            style={{
              width: 8,
              height: 8,
              background: hasDraft
                ? `rgba(${accentRgb}, 1)`
                : "rgba(245,245,247,0.22)",
              boxShadow: hasDraft ? `0 0 14px rgba(${accentRgb}, 0.6)` : "none",
            }}
          />
        </div>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * SmallWorkCard — under the hero. Shows a real italic Fraunces excerpt
 * of THIS deliverable's content (the IG caption, the tweet, the
 * LinkedIn post, the ad headline) so the dashboard reads as a contact
 * sheet of the user's brand voice in motion, not a row of labels.
 * ============================================================ */
function SmallWorkCard({
  label,
  dims,
  Icon,
  hasDraft,
  accentRgb,
  excerpt,
  onPick,
  index,
  reduced,
}: {
  label: string;
  dims: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  hasDraft: boolean;
  accentRgb: string;
  excerpt: string | undefined;
  onPick: () => void;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: 0.26 + index * 0.05,
        ease: [0.22, 0.72, 0.2, 1],
      }}
      className="wrks-crystal-border group relative block text-left transition-transform duration-300 hover:-translate-y-0.5"
      style={
        {
          height: 196,
          padding: "18px 18px 18px",
          borderRadius: 16,
          background: `linear-gradient(180deg, rgba(${accentRgb}, 0.05) 0%, rgba(${accentRgb}, 0.012) 60%, rgba(255,255,255,0.006) 100%)`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: `0 26px 60px -30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)`,
          "--wrks-crystal-rgb": accentRgb,
          // Stagger each card's comet by ~1.7s of the 7s loop so the
          // bright peak isn't on every card simultaneously — kills the
          // "synchronized bright stripe" effect that made the row look
          // chaotic.
          "--wrks-crystal-delay": `${-1.7 * index}s`,
        } as React.CSSProperties
      }
    >
      <div className="relative z-[2] h-full flex flex-col">
        {/* Top: icon + status dot */}
        <div className="flex items-start justify-between">
          <span
            className="grid place-items-center"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: `rgba(${accentRgb}, 0.14)`,
              border: `1px solid rgba(${accentRgb}, 0.28)`,
              color: `rgba(${accentRgb}, 0.98)`,
            }}
          >
            <Icon size={14} />
          </span>
          <span
            aria-hidden
            className="block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: hasDraft
                ? `rgba(${accentRgb}, 0.95)`
                : "rgba(245,245,247,0.22)",
              boxShadow: hasDraft
                ? `0 0 10px rgba(${accentRgb}, 0.6)`
                : "none",
            }}
          />
        </div>

        {/* Italic Fraunces excerpt — the actual voice for this deliverable */}
        {excerpt ? (
          <p
            className="font-serif italic"
            style={{
              fontSize: 14,
              lineHeight: 1.32,
              color: "rgba(245,245,247,0.82)",
              letterSpacing: "-0.008em",
              marginTop: 14,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {`“${excerpt}”`}
          </p>
        ) : (
          <p
            className="font-serif italic"
            style={{
              fontSize: 13,
              lineHeight: 1.4,
              color: "rgba(245,245,247,0.4)",
              marginTop: 14,
            }}
          >
            Nothing drafted yet.
          </p>
        )}

        {/* Bottom: label + dims */}
        <div className="mt-auto">
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "rgba(245,245,247,0.94)",
              letterSpacing: "-0.005em",
              lineHeight: 1.2,
            }}
          >
            {label}
          </div>
          <div
            className="uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "rgba(245,245,247,0.4)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              marginTop: 4,
            }}
          >
            {hasDraft ? "Draft" : "Not started"} · {dims}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * Icons — stroke only, consistent 1.7 weight
 * ============================================================ */
function BrowserIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="6" cy="6.5" r="0.7" fill="currentColor" />
      <circle cx="8.5" cy="6.5" r="0.7" fill="currentColor" />
    </svg>
  );
}
function CameraIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 7l1.5-2.5h5L16 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function XGlyphIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.97 6.817H1.68l7.73-8.835L1.25 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function WorkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 13h18" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function CampaignIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h3l8 4V5l-8 4H4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M18 8a4 4 0 0 1 0 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
