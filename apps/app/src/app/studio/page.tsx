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

  const landingHeadline = stored?.deliverables.landing.headline;

  const onPickWork = (id: DeliverableKind) => {
    setActiveId(id);
    router.push("/studio/library");
  };

  // The Landing card is special — separated out as the hero piece.
  const landing = DELIVERABLES[0];
  const rest = DELIVERABLES.slice(1);

  return (
    <main
      className="relative size-full overflow-auto"
      style={{ background: "#0a0a0c" }}
    >
      {/* One subtle accent halo top-right, the only ambient flourish */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 90% 0%, ${personality.accent}1a, transparent 65%)`,
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

          <div style={{ width: "100%", maxWidth: 880, marginTop: 22 }}>
            {/* BIG Landing card */}
            <BigLandingCard
              label={landing.label}
              dims={landing.dims}
              Icon={landing.Icon}
              hasDraft={!!stored}
              accentRgb={hexToRgbTriplet(personality.accent)}
              headlineExcerpt={landingHeadline}
              onPick={() => onPickWork(landing.id)}
              reduced={!!reduced}
            />

            {/* Four small cards under it */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 12,
                marginTop: 12,
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
 * BigLandingCard — the hero piece. Full content width, taller, shows
 * an excerpt of the drafted headline so the user sees their work
 * inline. Click → opens the editor.
 * ============================================================ */
function BigLandingCard({
  label,
  dims,
  Icon,
  hasDraft,
  accentRgb,
  headlineExcerpt,
  onPick,
  reduced,
}: {
  label: string;
  dims: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  hasDraft: boolean;
  accentRgb: string;
  headlineExcerpt: string | undefined;
  onPick: () => void;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 0.72, 0.2, 1] }}
      className="wrks-crystal-border group relative block w-full text-left transition-transform duration-200 hover:-translate-y-0.5"
      style={
        {
          padding: "26px 30px 28px",
          minHeight: 200,
          borderRadius: 18,
          background: `linear-gradient(180deg, rgba(${accentRgb}, 0.05) 0%, rgba(255,255,255,0.008) 100%)`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          "--wrks-crystal-rgb": accentRgb,
        } as React.CSSProperties
      }
    >
      <div className="relative z-[2] h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <span
              className="grid place-items-center shrink-0"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: `rgba(${accentRgb}, 0.1)`,
                border: `1px solid rgba(${accentRgb}, 0.22)`,
                color: `rgba(${accentRgb}, 0.95)`,
              }}
            >
              <Icon size={18} />
            </span>
            <div className="flex flex-col" style={{ lineHeight: 1.1 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "rgba(245,245,247,0.96)",
                  letterSpacing: "-0.005em",
                }}
              >
                {label}
              </span>
              <span
                className="uppercase"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.2em",
                  color: "rgba(245,245,247,0.48)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                  marginTop: 6,
                }}
              >
                {hasDraft ? "Draft" : "Not started"} · {dims}
              </span>
            </div>
          </div>

          <span
            aria-hidden
            className="block rounded-full"
            style={{
              width: 8,
              height: 8,
              background: hasDraft
                ? `rgba(${accentRgb}, 1)`
                : "rgba(245,245,247,0.22)",
              boxShadow: hasDraft ? `0 0 12px rgba(${accentRgb}, 0.55)` : "none",
            }}
          />
        </div>

        {/* Excerpt — pulled from stored.deliverables.landing.headline */}
        {headlineExcerpt ? (
          <p
            className="font-serif"
            style={{
              fontSize: "clamp(20px, 2vw, 26px)",
              fontWeight: 480,
              lineHeight: 1.22,
              letterSpacing: "-0.018em",
              color: "rgba(245,245,247,0.94)",
              marginTop: 32,
              maxWidth: "32ch",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {`“${headlineExcerpt}”`}
          </p>
        ) : (
          <p
            className="font-serif italic"
            style={{
              fontSize: 17,
              color: "rgba(245,245,247,0.55)",
              marginTop: 32,
              letterSpacing: "-0.005em",
            }}
          >
            Ask the agent to draft your headline.
          </p>
        )}
      </div>
    </motion.button>
  );
}

/* ============================================================
 * SmallWorkCard — under the hero. Compact icon + label + status.
 * ============================================================ */
function SmallWorkCard({
  label,
  dims,
  Icon,
  hasDraft,
  accentRgb,
  onPick,
  index,
  reduced,
}: {
  label: string;
  dims: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  hasDraft: boolean;
  accentRgb: string;
  onPick: () => void;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.24 + index * 0.04,
        ease: [0.22, 0.72, 0.2, 1],
      }}
      className="wrks-crystal-border group relative block text-left transition-transform duration-200 hover:-translate-y-0.5"
      style={
        {
          height: 142,
          padding: "16px 16px 16px",
          borderRadius: 14,
          background: `linear-gradient(180deg, rgba(${accentRgb}, 0.045) 0%, rgba(255,255,255,0.006) 100%)`,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
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
        <div className="flex items-start justify-between">
          <span
            className="grid place-items-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `rgba(${accentRgb}, 0.1)`,
              border: `1px solid rgba(${accentRgb}, 0.2)`,
              color: `rgba(${accentRgb}, 0.92)`,
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
                ? `rgba(${accentRgb}, 0.92)`
                : "rgba(245,245,247,0.22)",
              boxShadow: hasDraft
                ? `0 0 8px rgba(${accentRgb}, 0.5)`
                : "none",
            }}
          />
        </div>
        <div className="mt-auto">
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "rgba(245,245,247,0.95)",
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
              letterSpacing: "0.18em",
              color: "rgba(245,245,247,0.42)",
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
