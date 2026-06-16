"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Personality } from "@/lib/personalities";
import {
  useStudio,
  type DeliverableKind,
  type StoredWowPayload,
} from "@/lib/studio-context";

// /studio — orbital constellation.
//
// Direction picked 2026-06-16 after the Trading Desk read as "too much
// information bombarded" and the user asked for something that wows.
//
// The user's drafted landing page renders editorially at the center of
// the canvas. Their four social deliverables (Instagram, X, LinkedIn,
// Meta ad) slowly revolve around it on elliptical orbits with slightly
// different periods so the constellation drifts organically and never
// locks into a clockwork. Hover any orbiter → the whole system gently
// pauses, that card scales up + comes forward, others dim. Click → opens
// that piece in the editor.
//
// Visual taste:
//   * No greeting headline ("Your edition is drafted" was rejected as
//     SaaS hello cliché).
//   * No personality.accent on chrome anywhere — accent lives only
//     inside the rendered content (landing render, orbiter mini-renders).
//   * WRKS Studio shining wordmark stays in the sidebar; bottom-right
//     floating Siri orb stays via the inspector layout.
//   * Slow orbit so it's cinematic, not "fidget spinner".

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

/* ============================================================
 * useOrbitAngle — drives a MotionValue<number> angle that revolves
 * around the center. Spring-smoothed acceleration so hover-pause
 * decelerates over ~600ms and resumes over ~1200ms (premium reference:
 * Framer Orbit Cards, Notion AI ambient motion). Linear keyframe
 * rotation reads as a loading spinner; sine-driven position (which
 * the call site does via cos/sin of the angle) reads as ambient drift.
 * ============================================================ */

function useOrbitAngle({
  baseAngleDeg,
  period,
  paused,
}: {
  baseAngleDeg: number;
  period: number;
  paused: boolean;
}) {
  const angle = useMotionValue(baseAngleDeg);
  // factor goes 1 → 0 on pause (snappy, 600ms) and 0 → 1 on resume
  // (slower, 1200ms) — slower resume than pause is the premium tell.
  const factor = useSpring(paused ? 0 : 1, {
    stiffness: paused ? 240 : 110,
    damping: 30,
  });

  useAnimationFrame((_now, dt) => {
    if (period === Infinity) return;
    const f = factor.get();
    if (f < 0.001) return;
    const omegaDegPerMs = (360 / period) * f;
    angle.set(angle.get() + omegaDegPerMs * dt);
  });

  return angle;
}

/* ============================================================
 * Page
 * ============================================================ */

type OrbitalKind = "instagram" | "twitter" | "linkedin" | "ad";

const ORBITERS: {
  kind: OrbitalKind;
  baseAngleDeg: number;
  rx: number;
  ry: number;
  period: number;
  hueShift: number;
  label: string;
}[] = [
  // Periods 95/108/117/124s — mutually prime-ish so the constellation
  // never re-syncs ("wandering constellation," not "clockwork"). Radii
  // follow ~1.6 : 1 aspect (ry ≈ rx × 0.6) which the research called the
  // composed/golden-ratio ellipse vs the "classroom solar system" circle.
  // Radii bumped a touch so the orbiters clear the bigger 620×460 center.
  { kind: "instagram", baseAngleDeg: -100, rx: 490, ry: 295, period: 95_000, hueShift: -10, label: "Instagram" },
  { kind: "twitter", baseAngleDeg: -10, rx: 560, ry: 335, period: 108_000, hueShift: 8, label: "X · Twitter" },
  { kind: "linkedin", baseAngleDeg: 80, rx: 480, ry: 290, period: 117_000, hueShift: 20, label: "LinkedIn" },
  { kind: "ad", baseAngleDeg: 170, rx: 540, ry: 320, period: 124_000, hueShift: -20, label: "Meta ad" },
];

export default function StudioOrbitalPage() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const { personality, agentName, voice, stored, setActiveId } = useStudio();

  const [hovered, setHovered] = useState<OrbitalKind | "landing" | null>(null);

  const brandName = stored?.deliverables.brandName ?? "Your brand";
  const accent = personality.accent;
  const accentRgb = hexToRgbTriplet(accent);

  const onPickWork = (id: DeliverableKind) => {
    setActiveId(id);
    router.push("/studio/library");
  };

  const paused = hovered !== null;

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      {/* Ambient palette halos — top-right (accent) + bottom-left (deep) */}
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

      {/* Top strip — minimal: brand wordmark + edition + agent status */}
      <TopStrip
        brandName={brandName}
        agentName={agentName}
        voiceName={voice?.name}
        personality={personality}
        reduced={!!reduced}
      />

      {/* Orbital canvas */}
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          top: 72,
          bottom: 56,
        }}
      >
        {/* Center landing render */}
        <div
          className="absolute"
          style={{ left: "50%", top: "50%" }}
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.94 }}
            animate={{
              opacity: hovered && hovered !== "landing" ? 0.55 : 1,
              scale: hovered === "landing" ? 1.02 : 1,
            }}
            transition={{ duration: 0.6, ease: [0.22, 0.72, 0.2, 1] }}
            onMouseEnter={() => setHovered("landing")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onPickWork("landing")}
            className="cursor-pointer"
            style={{
              width: 620,
              height: 460,
              marginLeft: -310,
              marginTop: -230,
              willChange: "transform, opacity",
            }}
          >
            <CenterLanding
              personality={personality}
              stored={stored}
              brandName={brandName}
              accentRgb={accentRgb}
            />
          </motion.div>
        </div>

        {/* 4 orbiters */}
        {ORBITERS.map((o) => (
          <OrbitingCard
            key={o.kind}
            kind={o.kind}
            label={o.label}
            baseAngleDeg={o.baseAngleDeg}
            rx={o.rx}
            ry={o.ry}
            period={reduced ? Infinity : o.period}
            personality={personality}
            stored={stored}
            brandName={brandName}
            accentRgb={shiftHueRgb(accent, o.hueShift)}
            paused={paused}
            isHovered={hovered === o.kind}
            anyHoveredButMe={hovered !== null && hovered !== o.kind}
            onHoverStart={() => setHovered(o.kind)}
            onHoverEnd={() => setHovered(null)}
            onClick={() => onPickWork(o.kind)}
          />
        ))}
      </div>

      {/* Bottom-left activity ticker — single italic line, low presence */}
      <ActivityTicker
        agentName={agentName}
        personality={personality}
        hasStored={!!stored}
      />
    </main>
  );
}

/* ============================================================
 * TopStrip — thin, minimal
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
      transition={{ duration: 0.6, ease: [0.22, 0.72, 0.2, 1] }}
      className="absolute flex items-center justify-between gap-6"
      style={{
        left: 40,
        right: 40,
        top: 24,
        height: 32,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="font-serif truncate"
          style={{
            fontSize: 22,
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
            height: 18,
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

      <div className="flex items-center gap-2.5">
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
 * OrbitingCard — wraps a platform mini-render in a glass card and
 * orbits it around the canvas center with smooth pause-on-hover.
 * ============================================================ */

function OrbitingCard({
  kind,
  label,
  baseAngleDeg,
  rx,
  ry,
  period,
  personality,
  stored,
  brandName,
  accentRgb,
  paused,
  isHovered,
  anyHoveredButMe,
  onHoverStart,
  onHoverEnd,
  onClick,
}: {
  kind: OrbitalKind;
  label: string;
  baseAngleDeg: number;
  rx: number;
  ry: number;
  period: number;
  personality: Personality;
  stored: StoredWowPayload | null;
  brandName: string;
  accentRgb: string;
  paused: boolean;
  isHovered: boolean;
  anyHoveredButMe: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
}) {
  const angle = useOrbitAngle({
    baseAngleDeg,
    period,
    paused: paused || period === Infinity,
  });
  // Spring-smooth the x/y so the orbit doesn't ever feel jerky.
  const rawX = useTransform(angle, (a) => Math.cos((a * Math.PI) / 180) * rx);
  const rawY = useTransform(angle, (a) => Math.sin((a * Math.PI) / 180) * ry);
  const x = useSpring(rawX, { stiffness: 80, damping: 22, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 80, damping: 22, mass: 0.5 });
  // Subtle near-far depth scale — orbiter is "closer to the viewer"
  // (1.03×) at the bottom of the ellipse and "farther" (0.97×) at the
  // top. sin(angle) gives us exactly the right [-1, 1] axis.
  const depthScale = useTransform(angle, (a) =>
    1 + 0.03 * Math.sin((a * Math.PI) / 180),
  );

  const cardW = 260;
  const cardH = 196;

  return (
    <motion.div
      className="absolute"
      style={{
        left: "50%",
        top: "50%",
        x,
        y,
        willChange: "transform",
      }}
    >
      <motion.div style={{ scale: depthScale }}>
      <motion.button
        type="button"
        onClick={onClick}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        animate={{
          opacity: anyHoveredButMe ? 0.35 : 1,
          scale: isHovered ? 1.12 : 1,
        }}
        transition={{ duration: 0.5, ease: [0.22, 0.72, 0.2, 1] }}
        className="wrks-crystal-border group relative block text-left cursor-pointer overflow-hidden"
        style={
          {
            width: cardW,
            height: cardH,
            marginLeft: -cardW / 2,
            marginTop: -cardH / 2,
            borderRadius: 14,
            background: `linear-gradient(180deg, rgba(${accentRgb}, 0.07) 0%, rgba(255,255,255,0.012) 100%)`,
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            boxShadow: isHovered
              ? `0 40px 80px -28px rgba(0,0,0,0.85), 0 0 40px -8px rgba(${accentRgb}, 0.45), inset 0 1px 0 rgba(255,255,255,0.05)`
              : `0 24px 60px -32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)`,
            "--wrks-crystal-rgb": accentRgb,
            zIndex: isHovered ? 30 : 10,
          } as React.CSSProperties
        }
      >
        <div className="relative z-[2] h-full flex flex-col" style={{ padding: 12 }}>
          {/* Top: label + status dot */}
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span
              className="uppercase"
              style={{
                fontSize: 8.5,
                letterSpacing: "0.32em",
                color: "rgba(245,245,247,0.5)",
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
                width: 5,
                height: 5,
                background: stored
                  ? `rgba(${accentRgb}, 1)`
                  : "rgba(245,245,247,0.22)",
                boxShadow: stored ? `0 0 7px rgba(${accentRgb}, 0.6)` : "none",
              }}
            />
          </div>

          {/* Mini-render frame */}
          <div
            className="relative flex-1 overflow-hidden"
            style={{
              borderRadius: 8,
              background: `linear-gradient(180deg, rgba(${accentRgb}, 0.04) 0%, #0d0d10 100%)`,
              border: "1px solid rgba(255,255,255,0.05)",
              padding: "9px 11px 10px",
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
      </motion.div>
    </motion.div>
  );
}

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "");
}

/* ============================================================
 * CenterLanding — bigger mini-render of the drafted landing page
 * at canvas center. The protagonist.
 * ============================================================ */

function CenterLanding({
  personality,
  stored,
  brandName,
  accentRgb,
}: {
  personality: Personality;
  stored: StoredWowPayload | null;
  brandName: string;
  accentRgb: string;
}) {
  const headline =
    stored?.deliverables.landing.headline ?? "Tell your agent what to build.";
  const subhead =
    stored?.deliverables.landing.subhead ?? "We're drafting your edition.";
  const cta = stored?.deliverables.landing.primaryCta ?? "Get started";

  return (
    <div
      className="wrks-crystal-border relative h-full w-full"
      style={
        {
          padding: 16,
          borderRadius: 20,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.014) 100%)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          boxShadow: `0 60px 140px -40px rgba(0,0,0,0.85), 0 0 60px -10px rgba(${accentRgb}, 0.45), inset 0 1px 0 rgba(255,255,255,0.06)`,
          "--wrks-crystal-rgb": accentRgb,
        } as React.CSSProperties
      }
    >
      {/* Atmospheric halo behind the render */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: "-12% -10% 0 -10%",
          background: `radial-gradient(ellipse 55% 50% at 50% 60%, rgba(${accentRgb}, 0.25), transparent 70%)`,
          filter: "blur(50px)",
          zIndex: 0,
        }}
      />

      <div className="relative z-[2] flex flex-col" style={{ height: "100%" }}>
        {/* Top eyebrow */}
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
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
              color: "rgba(245,245,247,0.62)",
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

        {/* Render frame */}
        <div
          className="relative flex-1 overflow-hidden"
          style={{
            borderRadius: 12,
            background: `linear-gradient(180deg, rgba(${accentRgb}, 0.05) 0%, ${personality.accentDeep}22 100%), #0e0e12`,
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow:
              "0 22px 50px -22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Mini browser top */}
          <div
            className="flex items-center gap-1.5"
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

          {/* Page hero — split layout: text left, real hero image right */}
          <div
            className="flex flex-col"
            style={{
              padding: "22px 24px 24px",
              height: "calc(100% - 36px)",
            }}
          >
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

            {/* Split: text column LEFT, image column RIGHT */}
            <div className="flex-1 grid" style={{ gridTemplateColumns: "1.05fr 1fr", gap: 18, minHeight: 0 }}>
              {/* TEXT COLUMN */}
              <div className="flex flex-col min-w-0">
                <h2
                  className="font-serif"
                  style={{
                    fontSize: "clamp(22px, 2.2vw, 30px)",
                    fontWeight: 480,
                    lineHeight: 1.02,
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
                    fontSize: 12.5,
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
                <div className="mt-auto pt-3">
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

              {/* IMAGE COLUMN — real heroLandscape from onboarding */}
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
                {/* Soft bottom gradient for premium feel */}
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
    </div>
  );
}

/* ============================================================
 * Mini-renders for each platform — laid out like the actual UI,
 * not as labels
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

function MiniInstagram({ brandName, handle, caption, image, accentRgb, personality }: { brandName: string; handle: string; caption: string; image: string | undefined; accentRgb: string; personality: Personality }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
        <BrandMark brandName={brandName} personality={personality} size={18} />
        <div className="flex flex-col min-w-0" style={{ lineHeight: 1.05 }}>
          <span className="truncate" style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(245,245,247,0.95)" }}>
            {brandName}
          </span>
          <span className="truncate" style={{ fontSize: 8.5, color: "rgba(245,245,247,0.42)" }}>
            @{handle}
          </span>
        </div>
      </div>
      <div
        className="flex-1 my-1.5 rounded-md relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb}, 0.3) 0%, ${personality.accentDeep}77 100%)`,
          minHeight: 36,
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
        style={{
          fontSize: 9.5,
          color: "rgba(245,245,247,0.82)",
          lineHeight: 1.32,
          letterSpacing: "-0.003em",
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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
        <span
          className="shrink-0 grid place-items-center"
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: `rgba(${accentRgb}, 0.4)`,
            color: "white",
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1,
          }}
          aria-hidden
        >
          {brandName.charAt(0).toUpperCase()}
        </span>
        <span className="truncate" style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(245,245,247,0.94)" }}>
          {brandName}
        </span>
        <span className="truncate" style={{ fontSize: 9, color: "rgba(245,245,247,0.42)" }}>
          @{handle}
        </span>
      </div>
      <p
        style={{
          fontSize: 10,
          color: "rgba(245,245,247,0.88)",
          lineHeight: 1.34,
          letterSpacing: "-0.003em",
          display: "-webkit-box",
          WebkitLineClamp: image ? 3 : 5,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text}
      </p>
      {image && (
        <div
          className="my-1.5 rounded-md relative overflow-hidden"
          style={{
            height: 48,
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
      <div className="flex items-center gap-3 mt-auto pt-1" style={{ color: "rgba(245,245,247,0.42)", fontSize: 10 }}>
        <span>♡</span>
        <span>↻</span>
        <span>↗</span>
      </div>
    </div>
  );
}

function MiniLinkedIn({ brandName, text, image, accentRgb }: { brandName: string; text: string; image: string | undefined; accentRgb: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
        <span
          className="shrink-0 grid place-items-center"
          style={{
            width: 18,
            height: 18,
            borderRadius: 3,
            background: `rgba(${accentRgb}, 0.4)`,
            color: "white",
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1,
          }}
          aria-hidden
        >
          {brandName.charAt(0).toUpperCase()}
        </span>
        <div className="flex flex-col min-w-0" style={{ lineHeight: 1.05 }}>
          <span className="truncate" style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(245,245,247,0.94)" }}>
            {brandName}
          </span>
          <span className="truncate" style={{ fontSize: 8.5, color: "rgba(245,245,247,0.42)" }}>
            Counsel · Just now
          </span>
        </div>
      </div>
      <p
        style={{
          fontSize: 10,
          color: "rgba(245,245,247,0.88)",
          lineHeight: 1.34,
          letterSpacing: "-0.003em",
          display: "-webkit-box",
          WebkitLineClamp: image ? 3 : 5,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text}
      </p>
      {image && (
        <div
          className="my-1.5 rounded-md relative overflow-hidden"
          style={{
            height: 48,
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
      <div className="flex items-center gap-2 mt-auto pt-1" style={{ color: "rgba(245,245,247,0.42)", fontSize: 9.5 }}>
        <span>👍 24</span>
        <span>·</span>
        <span>3 comments</span>
      </div>
    </div>
  );
}

function MiniAd({ brandName, text, image, accentRgb, cta, personality }: { brandName: string; text: string; image: string | undefined; accentRgb: string; cta: string; personality: Personality }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <div className="flex items-center gap-1.5">
          <BrandMark brandName={brandName} personality={personality} size={16} />
          <span className="truncate" style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(245,245,247,0.94)" }}>
            {brandName}
          </span>
        </div>
        <span
          className="uppercase"
          style={{
            fontSize: 7.5,
            letterSpacing: "0.24em",
            color: "rgba(245,245,247,0.4)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          Sponsored
        </span>
      </div>
      <div
        className="flex-1 my-1.5 rounded-md relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb}, 0.34) 0%, ${personality.accentDeep}88 100%)`,
          minHeight: 36,
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
      <div className="flex items-center justify-between gap-2">
        <p
          style={{
            fontSize: 10,
            color: "rgba(245,245,247,0.9)",
            lineHeight: 1.22,
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
            padding: "4px 8px",
            borderRadius: 4,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "rgba(245,245,247,0.95)",
            fontSize: 9.5,
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
 * ActivityTicker — single italic line bottom-left
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
      className="absolute flex items-center gap-3 pointer-events-none"
      style={{ bottom: 22, left: 40, maxWidth: "60vw" }}
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
        className="truncate font-serif italic"
        style={{
          fontSize: 14,
          color: "rgba(245,245,247,0.6)",
          letterSpacing: "-0.005em",
        }}
      >
        {text}
        {meta && (
          <span
            className="uppercase"
            style={{
              fontSize: 10,
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
