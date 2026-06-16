"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import type { Personality } from "@/lib/personalities";
import {
  useStudio,
  type DeliverableKind,
  type StoredWowPayload,
} from "@/lib/studio-context";

// /studio — Trading Desk dashboard (direction picked 2026-06-16).
//
// Replaces the previous "big card + 4 small cards with italic excerpts"
// composition, which the user called cheap because it was text describing
// text instead of showing the actual work. Trading Desk is the shape
// Linear, Mercury, and Vercel converged on:
//
//   ROW 1 (96px) — Status strip. Brand wordmark, KPI pills, agent status.
//                  No greeting headline.
//   ROW 2 (380px) — Asymmetric bento, 2-3-2 columns.
//                   LEFT (2): big Landing card with a real mini-render
//                             of the drafted landing page (in a forward-
//                             tilted glass frame with palette accent halo).
//                   CENTER (3): 2×2 grid of mini-renders for IG, X,
//                               LinkedIn, and Meta ad — each laid out
//                               like the actual platform, not text.
//                   RIGHT (2): vertical activity feed.
//   ROW 3 (auto) — "Up next" action pill row.
//
// The user's palette accent shows up only inside the content surfaces
// (the rendered previews) and the brand-system pieces — chrome stays
// neutral per master plan §C.

/* ============================================================
 * Color helpers (same as before)
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
  const rr = Math.round(r2 * 255);
  const gg = Math.round(g2 * 255);
  const bb = Math.round(b2 * 255);
  return `${rr}, ${gg}, ${bb}`;
}

/* ============================================================
 * Page
 * ============================================================ */

export default function StudioTradingDesk() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const { personality, agentName, voice, stored, setActiveId } = useStudio();

  const brandName = stored?.deliverables.brandName ?? "Your brand";
  const accentRgb = hexToRgbTriplet(personality.accent);
  const accentDeepRgb = hexToRgbTriplet(personality.accentDeep);

  const onPickWork = (id: DeliverableKind) => {
    setActiveId(id);
    router.push("/studio/library");
  };

  return (
    <main
      className="relative size-full overflow-auto"
      style={{ background: "#0a0a0c" }}
    >
      {/* Ambient palette halos — top-right (accent) + bottom-left (accentDeep) */}
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
          background: `radial-gradient(ellipse 55% 50% at 8% 105%, ${personality.accentDeep}1c, transparent 60%)`,
        }}
      />

      <div
        className="relative z-10 mx-auto flex flex-col"
        style={{
          maxWidth: 1320,
          padding: "32px 40px 56px",
          gap: 16,
        }}
      >
        {/* ROW 1 — STATUS STRIP */}
        <StatusStrip
          brandName={brandName}
          personality={personality}
          voice={voice}
          agentName={agentName}
          hasStored={!!stored}
          reduced={!!reduced}
        />

        {/* ROW 2 — ASYMMETRIC BENTO (2-3-2) */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 0.72, 0.2, 1] }}
          className="grid"
          style={{
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr) minmax(0, 2fr)",
            gap: 16,
            minHeight: 420,
          }}
        >
          {/* LEFT — Landing hero with real mini-render */}
          <LandingHero
            personality={personality}
            stored={stored}
            accentRgb={accentRgb}
            accentDeepRgb={accentDeepRgb}
            onPick={() => onPickWork("landing")}
            reduced={!!reduced}
          />

          {/* CENTER — 2×2 mini-renders of IG / X / LinkedIn / Ad */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gridTemplateRows: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <SocialTile kind="instagram" personality={personality} stored={stored} brandName={brandName} accentRgb={shiftHueRgb(personality.accent, -10)} onPick={() => onPickWork("instagram")} reduced={!!reduced} delay={0.18} />
            <SocialTile kind="twitter" personality={personality} stored={stored} brandName={brandName} accentRgb={shiftHueRgb(personality.accent, 8)} onPick={() => onPickWork("twitter")} reduced={!!reduced} delay={0.22} />
            <SocialTile kind="linkedin" personality={personality} stored={stored} brandName={brandName} accentRgb={shiftHueRgb(personality.accent, 20)} onPick={() => onPickWork("linkedin")} reduced={!!reduced} delay={0.26} />
            <SocialTile kind="ad" personality={personality} stored={stored} brandName={brandName} accentRgb={shiftHueRgb(personality.accent, -20)} onPick={() => onPickWork("ad")} reduced={!!reduced} delay={0.3} />
          </div>

          {/* RIGHT — Activity feed */}
          <ActivityPanel
            brandName={brandName}
            agentName={agentName}
            personality={personality}
            hasStored={!!stored}
            reduced={!!reduced}
          />
        </motion.div>

        {/* ROW 3 — UP NEXT */}
        <UpNextRow accentRgb={accentRgb} reduced={!!reduced} />
      </div>
    </main>
  );
}

/* ============================================================
 * Row 1 — Status strip
 * ============================================================ */

function StatusStrip({
  brandName,
  personality,
  voice,
  agentName,
  hasStored,
  reduced,
}: {
  brandName: string;
  personality: Personality;
  voice: { name: string } | null;
  agentName: string;
  hasStored: boolean;
  reduced: boolean;
}) {
  const lastEdit = "14:32";
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 0.72, 0.2, 1] }}
      className="flex items-center justify-between gap-6"
      style={{
        height: 76,
        padding: "0 6px",
      }}
    >
      {/* Left — brand wordmark */}
      <div className="flex items-center gap-4 min-w-0">
        <span
          className="font-serif truncate"
          style={{
            fontSize: 30,
            fontWeight: 480,
            letterSpacing: "-0.024em",
            color: "rgba(248,247,252,0.97)",
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
            height: 22,
            background: "rgba(245,245,247,0.12)",
          }}
        />
        <span
          className="uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "rgba(245,245,247,0.5)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          Edition v1
        </span>
      </div>

      {/* Center — KPI pills */}
      <div className="flex items-center gap-2">
        <KpiPill label="Drafted" value={hasStored ? "5/5" : "0/5"} />
        <KpiPill label="Published" value="0" />
        <KpiPill label="Last edit" value={hasStored ? lastEdit : "—"} />
      </div>

      {/* Right — agent status */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="block rounded-full"
          style={{
            width: 7,
            height: 7,
            background: `${personality.accent}`,
            boxShadow: `0 0 10px ${personality.accent}aa`,
          }}
        />
        <span
          className="uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.24em",
            color: "rgba(245,245,247,0.78)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          {(agentName?.trim() || personality.name)} is idle · {voice?.name ?? "—"}
        </span>
      </div>
    </motion.div>
  );
}

function KpiPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="inline-flex items-center gap-2"
      style={{
        height: 30,
        padding: "0 12px",
        borderRadius: 8,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        className="uppercase"
        style={{
          fontSize: 9.5,
          letterSpacing: "0.3em",
          color: "rgba(245,245,247,0.45)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12.5,
          color: "rgba(245,245,247,0.95)",
          letterSpacing: "-0.005em",
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================
 * Row 2 LEFT — Landing hero with mini-render of the landing page
 * ============================================================ */

function LandingHero({
  personality,
  stored,
  accentRgb,
  accentDeepRgb,
  onPick,
  reduced,
}: {
  personality: Personality;
  stored: StoredWowPayload | null;
  accentRgb: string;
  accentDeepRgb: string;
  onPick: () => void;
  reduced: boolean;
}) {
  const headline =
    stored?.deliverables.landing.headline ?? "Tell your agent what to build.";
  const subhead =
    stored?.deliverables.landing.subhead ?? "We're drafting your edition.";
  const cta = stored?.deliverables.landing.primaryCta ?? "Get started";
  const brandName = stored?.deliverables.brandName ?? "Your brand";

  return (
    <motion.button
      type="button"
      onClick={onPick}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 0.72, 0.2, 1] }}
      className="wrks-crystal-border group relative block text-left transition-transform duration-300 hover:-translate-y-0.5"
      style={
        {
          padding: 20,
          borderRadius: 18,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow:
            "0 50px 110px -40px rgba(0,0,0,0.78), inset 0 1px 0 rgba(255,255,255,0.05)",
          "--wrks-crystal-rgb": accentRgb,
        } as React.CSSProperties
      }
    >
      {/* Top eyebrow strip */}
      <div className="flex items-center justify-between mb-3.5">
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
              boxShadow: `0 0 8px rgba(${accentRgb}, 0.7)`,
            }}
          />
          Draft
        </span>
      </div>

      {/* The render frame — atmospheric halo behind it, glass frame around */}
      <div className="relative" style={{ height: 320 }}>
        {/* Halo */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            inset: "-10% -8% 0 -8%",
            background: `radial-gradient(ellipse 55% 50% at 50% 60%, rgba(${accentRgb}, 0.22), transparent 70%)`,
            filter: "blur(40px)",
            zIndex: 0,
          }}
        />

        {/* The render itself */}
        <div
          className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: 12,
            background: `linear-gradient(180deg, rgba(${accentRgb}, 0.05) 0%, rgba(${accentDeepRgb}, 0.02) 100%), #0e0e12`,
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow:
              "0 22px 50px -22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Mini browser top */}
          <div
            className="flex items-center gap-1.5"
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span
              aria-hidden
              className="block rounded-full"
              style={{ width: 7, height: 7, background: "rgba(255,255,255,0.14)" }}
            />
            <span
              aria-hidden
              className="block rounded-full"
              style={{ width: 7, height: 7, background: "rgba(255,255,255,0.14)" }}
            />
            <span
              aria-hidden
              className="block rounded-full"
              style={{ width: 7, height: 7, background: "rgba(255,255,255,0.14)" }}
            />
            <span
              className="ml-3 truncate uppercase"
              style={{
                fontSize: 9,
                letterSpacing: "0.24em",
                color: "rgba(245,245,247,0.4)",
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}
            >
              {brandName.toLowerCase().replace(/\s+/g, "")}.wrks.studio
            </span>
          </div>

          {/* The page hero */}
          <div
            style={{
              padding: "22px 26px 24px",
              display: "flex",
              flexDirection: "column",
              height: "calc(100% - 32px)",
            }}
          >
            {/* Brand nav */}
            <div className="flex items-center justify-between" style={{ marginBottom: 22 }}>
              <div className="flex items-center gap-2">
                <span
                  className="shrink-0 grid place-items-center"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
                    color: "white",
                    fontSize: 9,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                  aria-hidden
                >
                  {brandName.charAt(0).toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "rgba(245,245,247,0.85)",
                  }}
                >
                  {brandName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 9, color: "rgba(245,245,247,0.42)" }}>About</span>
                <span style={{ fontSize: 9, color: "rgba(245,245,247,0.42)" }}>Work</span>
                <span style={{ fontSize: 9, color: `rgba(${accentRgb}, 0.95)` }}>{cta}</span>
              </div>
            </div>

            {/* Editorial headline */}
            <h3
              className="font-serif"
              style={{
                fontSize: "clamp(22px, 2.4vw, 30px)",
                fontWeight: 480,
                lineHeight: 1.02,
                letterSpacing: "-0.028em",
                color: "rgba(248,247,252,0.96)",
                maxWidth: "16ch",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {headline}
            </h3>

            {/* Subhead */}
            <p
              className="font-serif italic"
              style={{
                fontSize: 12,
                color: "rgba(245,245,247,0.55)",
                marginTop: 12,
                lineHeight: 1.45,
                maxWidth: "40ch",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {subhead}
            </p>

            <div className="mt-auto pt-3">
              {/* CTA pill */}
              <div
                className="inline-flex items-center gap-1.5"
                style={{
                  padding: "5px 11px",
                  borderRadius: 6,
                  background: `rgba(${accentRgb}, 0.16)`,
                  border: `1px solid rgba(${accentRgb}, 0.34)`,
                  color: `rgba(${accentRgb}, 1)`,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "-0.003em",
                }}
              >
                {cta}
                <span aria-hidden style={{ fontSize: 11, lineHeight: 1 }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * Row 2 CENTER — SocialTile — mini-renders of each social/ad piece
 * ============================================================ */

function SocialTile({
  kind,
  personality,
  stored,
  brandName,
  accentRgb,
  onPick,
  reduced,
  delay,
}: {
  kind: "instagram" | "twitter" | "linkedin" | "ad";
  personality: Personality;
  stored: StoredWowPayload | null;
  brandName: string;
  accentRgb: string;
  onPick: () => void;
  reduced: boolean;
  delay: number;
}) {
  const meta = SOCIAL_META[kind];
  const text = stored ? meta.getText(stored) : meta.placeholder;
  const handle = brandName.toLowerCase().replace(/\s+/g, "");

  return (
    <motion.button
      type="button"
      onClick={onPick}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 0.72, 0.2, 1] }}
      className="wrks-crystal-border group relative block text-left transition-transform duration-300 hover:-translate-y-0.5 overflow-hidden"
      style={
        {
          padding: 14,
          borderRadius: 14,
          background: `linear-gradient(180deg, rgba(${accentRgb}, 0.06) 0%, rgba(255,255,255,0.008) 100%)`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow:
            "0 22px 50px -28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          "--wrks-crystal-rgb": accentRgb,
          "--wrks-crystal-delay": `${-1.75 * (delay - 0.18) * 10}s`,
        } as React.CSSProperties
      }
    >
      <div className="relative z-[2] h-full flex flex-col">
        {/* Eyebrow */}
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 10 }}
        >
          <span
            className="uppercase"
            style={{
              fontSize: 8.5,
              letterSpacing: "0.32em",
              color: "rgba(245,245,247,0.48)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            {meta.label}
          </span>
          <span
            aria-hidden
            className="block rounded-full"
            style={{
              width: 5,
              height: 5,
              background: stored ? `rgba(${accentRgb}, 1)` : "rgba(245,245,247,0.22)",
              boxShadow: stored ? `0 0 7px rgba(${accentRgb}, 0.6)` : "none",
            }}
          />
        </div>

        {/* Mini-render canvas */}
        <div
          className="relative flex-1 overflow-hidden"
          style={{
            borderRadius: 8,
            background: `linear-gradient(180deg, rgba(${accentRgb}, 0.05) 0%, #0d0d10 100%)`,
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "10px 12px 11px",
          }}
        >
          {kind === "instagram" && (
            <MiniInstagram brandName={brandName} handle={handle} caption={text} accentRgb={accentRgb} personality={personality} />
          )}
          {kind === "twitter" && (
            <MiniX brandName={brandName} handle={handle} text={text} accentRgb={accentRgb} />
          )}
          {kind === "linkedin" && (
            <MiniLinkedIn brandName={brandName} text={text} accentRgb={accentRgb} />
          )}
          {kind === "ad" && (
            <MiniAd brandName={brandName} text={text} accentRgb={accentRgb} cta={stored?.deliverables.ad.cta ?? "Learn more"} personality={personality} />
          )}
        </div>
      </div>
    </motion.button>
  );
}

const SOCIAL_META = {
  instagram: {
    label: "Instagram",
    placeholder: "Tell your agent what to post on Instagram.",
    getText: (s: StoredWowPayload) => s.deliverables.social.instagram,
  },
  twitter: {
    label: "X · Twitter",
    placeholder: "Tell your agent what to tweet.",
    getText: (s: StoredWowPayload) => s.deliverables.social.twitter,
  },
  linkedin: {
    label: "LinkedIn",
    placeholder: "Tell your agent what to post on LinkedIn.",
    getText: (s: StoredWowPayload) => s.deliverables.social.linkedin,
  },
  ad: {
    label: "Meta ad",
    placeholder: "Tell your agent what to advertise.",
    getText: (s: StoredWowPayload) => s.deliverables.ad.headline,
  },
} as const;

/* ============================================================
 * Mini-renders — each laid out like the actual platform
 * ============================================================ */

function MiniBrandRow({
  brandName,
  subline,
  personality,
}: {
  brandName: string;
  subline: string;
  personality: Personality;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="shrink-0 grid place-items-center"
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          color: "white",
          fontSize: 9,
          fontWeight: 700,
          lineHeight: 1,
        }}
        aria-hidden
      >
        {brandName.charAt(0).toUpperCase()}
      </span>
      <div className="flex flex-col min-w-0" style={{ lineHeight: 1.1 }}>
        <span
          className="truncate"
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(245,245,247,0.95)",
            letterSpacing: "-0.005em",
          }}
        >
          {brandName}
        </span>
        <span
          className="truncate"
          style={{
            fontSize: 8.5,
            color: "rgba(245,245,247,0.42)",
            marginTop: 1,
          }}
        >
          {subline}
        </span>
      </div>
    </div>
  );
}

function MiniInstagram({ brandName, handle, caption, accentRgb, personality }: { brandName: string; handle: string; caption: string; accentRgb: string; personality: Personality }) {
  return (
    <div className="flex flex-col h-full">
      <MiniBrandRow brandName={brandName} subline={`@${handle}`} personality={personality} />
      <div
        className="flex-1 my-2 rounded relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb}, 0.28) 0%, ${personality.accentDeep}66 100%)`,
          minHeight: 32,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 30% 25%, rgba(255,255,255,0.18), transparent 70%)`,
          }}
        />
        <span
          className="absolute font-serif italic"
          style={{
            bottom: 4,
            left: 5,
            right: 5,
            fontSize: 9,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.15,
            letterSpacing: "-0.008em",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}
        >
          {brandName}
        </span>
      </div>
      <p
        style={{
          fontSize: 8.5,
          color: "rgba(245,245,247,0.78)",
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

function MiniX({ brandName, handle, text, accentRgb }: { brandName: string; handle: string; text: string; accentRgb: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5" style={{ marginBottom: 5 }}>
        <span
          className="shrink-0 grid place-items-center"
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: `rgba(${accentRgb}, 0.4)`,
            color: "white",
            fontSize: 8,
            fontWeight: 700,
            lineHeight: 1,
          }}
          aria-hidden
        >
          {brandName.charAt(0).toUpperCase()}
        </span>
        <span
          className="truncate"
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: "rgba(245,245,247,0.95)",
          }}
        >
          {brandName}
        </span>
        <span
          className="truncate"
          style={{
            fontSize: 8.5,
            color: "rgba(245,245,247,0.42)",
          }}
        >
          @{handle}
        </span>
      </div>
      <p
        style={{
          fontSize: 9.5,
          color: "rgba(245,245,247,0.86)",
          lineHeight: 1.32,
          letterSpacing: "-0.003em",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          flex: 1,
        }}
      >
        {text}
      </p>
      <div className="flex items-center gap-3" style={{ marginTop: 5, color: "rgba(245,245,247,0.4)", fontSize: 9 }}>
        <span>♡</span>
        <span>↻</span>
        <span>↗</span>
      </div>
    </div>
  );
}

function MiniLinkedIn({ brandName, text, accentRgb }: { brandName: string; text: string; accentRgb: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5" style={{ marginBottom: 5 }}>
        <span
          className="shrink-0 grid place-items-center"
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            background: `rgba(${accentRgb}, 0.4)`,
            color: "white",
            fontSize: 8,
            fontWeight: 700,
            lineHeight: 1,
          }}
          aria-hidden
        >
          {brandName.charAt(0).toUpperCase()}
        </span>
        <div className="flex flex-col min-w-0" style={{ lineHeight: 1.05 }}>
          <span
            className="truncate"
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: "rgba(245,245,247,0.95)",
            }}
          >
            {brandName}
          </span>
          <span
            className="truncate"
            style={{
              fontSize: 7.5,
              color: "rgba(245,245,247,0.42)",
            }}
          >
            Counsel · Just now
          </span>
        </div>
      </div>
      <p
        style={{
          fontSize: 9.5,
          color: "rgba(245,245,247,0.86)",
          lineHeight: 1.34,
          letterSpacing: "-0.003em",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          flex: 1,
        }}
      >
        {text}
      </p>
      <div className="flex items-center gap-2" style={{ marginTop: 5, color: "rgba(245,245,247,0.4)", fontSize: 8.5 }}>
        <span>👍 24</span>
        <span>·</span>
        <span>3 comments</span>
      </div>
    </div>
  );
}

function MiniAd({ brandName, text, accentRgb, cta, personality }: { brandName: string; text: string; accentRgb: string; cta: string; personality: Personality }) {
  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 5 }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="shrink-0 grid place-items-center"
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
              color: "white",
              fontSize: 7.5,
              fontWeight: 700,
              lineHeight: 1,
            }}
            aria-hidden
          >
            {brandName.charAt(0).toUpperCase()}
          </span>
          <span
            className="truncate"
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: "rgba(245,245,247,0.95)",
            }}
          >
            {brandName}
          </span>
        </div>
        <span
          className="uppercase"
          style={{
            fontSize: 7,
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
        className="flex-1 my-1.5 rounded relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb}, 0.3) 0%, ${personality.accentDeep}88 100%)`,
          minHeight: 24,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 70% 20%, rgba(255,255,255,0.18), transparent 70%)`,
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p
          style={{
            fontSize: 9,
            color: "rgba(245,245,247,0.88)",
            lineHeight: 1.2,
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
            padding: "3px 7px",
            borderRadius: 3,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(245,245,247,0.95)",
            fontSize: 8.5,
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
 * Row 2 RIGHT — Activity feed
 * ============================================================ */

type ActivityEntry = { who: "agent" | "user"; text: string; time: string };

function ActivityPanel({
  brandName,
  agentName,
  personality,
  hasStored,
  reduced,
}: {
  brandName: string;
  agentName: string;
  personality: Personality;
  hasStored: boolean;
  reduced: boolean;
}) {
  const agent = agentName?.trim() || personality.name;
  const entries: ActivityEntry[] = hasStored
    ? [
        { who: "agent", text: `Refined the landing headline.`, time: "2m" },
        { who: "agent", text: `Drafted an Instagram caption for ${brandName}.`, time: "1h" },
        { who: "user", text: "You asked to add a pricing section.", time: "Yest" },
        { who: "agent", text: `Tuned voice for ${brandName}.`, time: "2d" },
      ]
    : [];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.34, ease: [0.22, 0.72, 0.2, 1] }}
      className="relative flex flex-col"
      style={{
        padding: "18px 18px 18px",
        borderRadius: 16,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <span
          className="uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.32em",
            color: "rgba(245,245,247,0.48)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          Activity
        </span>
        <span
          className="uppercase"
          style={{
            fontSize: 9.5,
            letterSpacing: "0.24em",
            color: "rgba(245,245,247,0.4)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {agent}
        </span>
      </div>

      {entries.length === 0 ? (
        <div
          className="font-serif italic"
          style={{
            fontSize: 13.5,
            color: "rgba(245,245,247,0.5)",
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          Nothing yet. Tell {agent} what to build.
        </div>
      ) : (
        <ul className="flex flex-col">
          {entries.map((e, i) => (
            <li
              key={i}
              className="flex items-start gap-3"
              style={{
                padding: "10px 0",
                borderBottom:
                  i === entries.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.045)",
              }}
            >
              <span
                aria-hidden
                className="block rounded-full shrink-0"
                style={{
                  marginTop: 6,
                  width: 5,
                  height: 5,
                  background:
                    e.who === "agent"
                      ? `${personality.accent}`
                      : "rgba(245,245,247,0.4)",
                  boxShadow:
                    e.who === "agent" ? `0 0 7px ${personality.accent}aa` : "none",
                }}
              />
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontSize: 12.5,
                    color: "rgba(245,245,247,0.88)",
                    letterSpacing: "-0.005em",
                    lineHeight: 1.4,
                  }}
                >
                  {e.text}
                </div>
                <div
                  className="uppercase"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.22em",
                    color: "rgba(245,245,247,0.4)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                    marginTop: 3,
                  }}
                >
                  {e.who === "agent" ? "agent" : "you"} · {e.time}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

/* ============================================================
 * Row 3 — Up next action pills
 * ============================================================ */

function UpNextRow({ accentRgb, reduced }: { accentRgb: string; reduced: boolean }) {
  const actions = [
    { label: "Publish edition" },
    { label: "Schedule the run" },
    { label: "Swap palette" },
    { label: "Brief next edition" },
  ];
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.42, ease: [0.22, 0.72, 0.2, 1] }}
      className="flex items-center justify-between gap-4"
      style={{ marginTop: 4 }}
    >
      <span
        className="uppercase shrink-0"
        style={{
          fontSize: 10,
          letterSpacing: "0.32em",
          color: "rgba(245,245,247,0.46)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        Up next
      </span>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className="wrks-crystal-border-button inline-flex items-center gap-2 transition-transform duration-200 hover:-translate-y-0.5"
            style={
              {
                height: 34,
                padding: "0 14px",
                borderRadius: 10,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 100%)",
                color: "rgba(245,245,247,0.95)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
                "--wrks-crystal-rgb": accentRgb,
              } as React.CSSProperties
            }
          >
            {a.label}
            <span
              aria-hidden
              style={{ color: "rgba(245,245,247,0.5)", fontSize: 12 }}
            >
              →
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
