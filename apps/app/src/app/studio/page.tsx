"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Personality } from "@/lib/personalities";
import { useStudio, type StoredWowPayload } from "@/lib/studio-context";

// /studio — layered depth scene.
//
// Direction picked 2026-06-15 after the brand-cover composition (massive
// wordmark + 3-cell row) failed to read as stunning across multiple
// iterations. New move: a constellation of floating glass cards at
// different Z-depths, each carrying one piece of context, with mouse
// parallax so the canvas feels three-dimensional. Inspired by visionOS
// home + Apple Vision Pro launch.
//
// The cards in this composition:
//   • HERO (center, depth 1.0)      — brand identity moment
//   • PREVIEW (top-right, depth 0.7) — mini draft landing preview
//   • VOICE   (bottom-left, depth 0.55) — agent voice quote
//
// The personality accent appears only inside the cards (palette
// swatches, halos behind the brand name, preview accent) — the chrome
// surrounding them stays neutral per master plan §C.

export default function StudioWelcomePage() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const { personality, agentName, stored, voice } = useStudio();

  // Mouse position normalized to viewport center, range [-1, 1].
  // Springs add elastic ease so the cards drift rather than snap.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      rawX.set((e.clientX - cx) / cx);
      rawY.set((e.clientY - cy) / cy);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY, reduced]);

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      {/* Drifting palette aurora */}
      <AuroraLayer
        accent={personality.accent}
        accentDeep={personality.accentDeep}
        reduced={!!reduced}
      />

      {/* Film grain — analog warmth on top of the atmosphere */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none wrks-studio-grain"
        style={{ opacity: 0.3, mixBlendMode: "overlay" }}
      />

      {/* Bottom vignette anchors the composition */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 50% 100%, transparent, rgba(0,0,0,0.55))",
        }}
      />

      {/* HERO card — center, closest depth */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <ParallaxWrapper depth={1.0} mx={mx} my={my} className="pointer-events-auto">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.05, ease: [0.22, 0.72, 0.2, 1] }}
          >
            <HeroCard
              personality={personality}
              agentName={agentName}
              voice={voice}
              stored={stored}
            />
          </motion.div>
        </ParallaxWrapper>
      </div>

      {/* PREVIEW card — top-right floater, mid depth */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: -16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, delay: 0.35, ease: [0.22, 0.72, 0.2, 1] }}
        className="absolute"
        style={{
          top: "11%",
          right: "5%",
          zIndex: 6,
        }}
      >
        <ParallaxWrapper depth={0.7} mx={mx} my={my}>
          <button
            type="button"
            onClick={() => router.push("/studio/library")}
            className="block cursor-pointer text-left transition-transform duration-300 hover:-translate-y-0.5"
            aria-label="Open landing draft"
          >
            <PreviewCard personality={personality} stored={stored} />
          </button>
        </ParallaxWrapper>
      </motion.div>

      {/* VOICE card — bottom-left floater, furthest depth */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 0.72, 0.2, 1] }}
        className="absolute"
        style={{
          bottom: "13%",
          left: "4%",
          zIndex: 5,
        }}
      >
        <ParallaxWrapper depth={0.55} mx={mx} my={my}>
          <VoiceCard personality={personality} voiceName={voice?.name ?? "—"} />
        </ParallaxWrapper>
      </motion.div>

      {/* Bottom-left status line */}
      <StatusLine
        status={
          stored
            ? `Edition one · draft · not published yet`
            : `Ready · just say what you want to build`
        }
      />
    </main>
  );
}

/* ============================================================
 * ParallaxWrapper — translates its child by a small fraction of the
 * normalized mouse offset. Cards at higher `depth` translate more
 * (parallax closer = larger apparent motion).
 * ============================================================ */
function ParallaxWrapper({
  depth,
  mx,
  my,
  children,
  className = "",
}: {
  depth: number;
  mx: import("motion/react").MotionValue<number>;
  my: import("motion/react").MotionValue<number>;
  children: React.ReactNode;
  className?: string;
}) {
  const range = 36 * depth;
  const x = useTransform(mx, [-1, 1], [-range, range]);
  const y = useTransform(my, [-1, 1], [-range * 0.7, range * 0.7]);
  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

/* ============================================================
 * HeroCard — center of the constellation.
 * Brand identity in editorial typography. Carries the welcome moment.
 * ============================================================ */
function HeroCard({
  personality,
  agentName,
  voice,
  stored,
}: {
  personality: Personality;
  agentName: string;
  voice: import("@/lib/voices").Voice | null;
  stored: StoredWowPayload | null;
}) {
  const brandName = stored?.deliverables.brandName ?? "Untitled studio";
  return (
    <article
      className="wrks-crystal-border relative flex flex-col"
      style={{
        width: 460,
        maxWidth: "92vw",
        padding: "32px 36px 32px",
        borderRadius: 22,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        boxShadow:
          "0 60px 120px -40px rgba(0,0,0,0.85), 0 2px 6px -2px rgba(0,0,0,0.4)",
      }}
    >
      {/* Atmospheric halo behind the brand name (accent allowed: content) */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: "12% -16% 30% -16%",
          background: `radial-gradient(ellipse 60% 55% at 50% 50%, ${personality.accent}30, ${personality.accentDeep}10 35%, transparent 70%)`,
          filter: "blur(34px)",
          zIndex: 0,
        }}
      />

      <div className="relative z-[2] flex flex-col">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-7">
          <span
            aria-hidden
            className="block"
            style={{
              width: 18,
              height: 1,
              background: "rgba(245,245,247,0.22)",
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
            Studio · Edition one
          </span>
        </div>

        {/* Brand name */}
        <h1
          className="font-serif"
          style={{
            fontSize: "clamp(40px, 4.5vw, 60px)",
            fontWeight: 480,
            letterSpacing: "-0.034em",
            lineHeight: 0.96,
            color: "rgba(248,247,252,0.98)",
            textShadow: `0 24px 60px ${personality.accentDeep}50`,
          }}
        >
          {brandName}
        </h1>

        {/* Italic subhead */}
        <p
          className="font-serif italic"
          style={{
            fontSize: 16,
            color: "rgba(245,245,247,0.62)",
            letterSpacing: "-0.005em",
            marginTop: 14,
          }}
        >
          Drafted by {agentName?.trim() || personality.name.toLowerCase()}.
        </p>

        {/* Hairline + identity row */}
        <div
          aria-hidden
          className="h-px"
          style={{
            background: "rgba(245,245,247,0.12)",
            marginTop: 28,
            marginBottom: 22,
          }}
        />
        <div className="flex items-center justify-between">
          {/* Palette swatches */}
          <div className="flex items-center" style={{ gap: 7 }}>
            {[personality.accent, personality.accentDeep, personality.glow].map((c, i) => (
              <span
                key={i}
                aria-hidden
                className="block rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  background: c,
                  boxShadow:
                    i === 0
                      ? `0 0 0 1px rgba(255,255,255,0.18), 0 4px 12px -2px ${personality.glow}`
                      : "0 0 0 1px rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </div>
          <span
            className="uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.28em",
              color: "rgba(245,245,247,0.58)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            {personality.name} · {voice?.name ?? "—"} · Ready
          </span>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
 * PreviewCard — mini editorial render of the user's draft landing.
 * Sits top-right of the canvas. Click → opens the editor.
 * ============================================================ */
function PreviewCard({
  personality,
  stored,
}: {
  personality: Personality;
  stored: StoredWowPayload | null;
}) {
  const brandName = stored?.deliverables.brandName ?? "Your brand";
  const headline =
    stored?.deliverables.landing.headline ?? "Tell your agent what to build.";
  const cta = stored?.deliverables.landing.primaryCta ?? "Get started";
  return (
    <article
      className="wrks-crystal-border relative flex flex-col"
      style={{
        width: 296,
        padding: "16px 18px 18px",
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.032) 0%, rgba(255,255,255,0.008) 100%)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        boxShadow:
          "0 36px 80px -30px rgba(0,0,0,0.75), 0 2px 6px -2px rgba(0,0,0,0.35)",
      }}
    >
      <div className="relative z-[2] flex flex-col">
        {/* Eyebrow + chevron */}
        <div className="flex items-center justify-between mb-3.5">
          <span
            className="uppercase"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.32em",
              color: "rgba(245,245,247,0.42)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            Landing · Draft
          </span>
          <span
            aria-hidden
            style={{ color: "rgba(245,245,247,0.4)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 17L17 7M17 7H8M17 7v9"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        {/* Brand mark + name */}
        <div className="flex items-center gap-2.5 mb-3.5">
          <span
            className="wrks-crystal-border-button shrink-0 grid place-items-center"
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 100%)",
              color: "#f5f0e6",
              fontSize: 10,
              fontWeight: 600,
              lineHeight: 1,
            }}
            aria-hidden
          >
            {brandName.charAt(0).toUpperCase()}
          </span>
          <span
            className="truncate"
            style={{
              fontSize: 12.5,
              color: "rgba(245,245,247,0.78)",
              letterSpacing: "-0.005em",
              fontWeight: 500,
            }}
          >
            {brandName}
          </span>
        </div>

        {/* Headline excerpt — Fraunces */}
        <h3
          className="font-serif"
          style={{
            fontSize: 19,
            fontWeight: 480,
            letterSpacing: "-0.018em",
            lineHeight: 1.18,
            color: "rgba(245,245,247,0.95)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {headline}
        </h3>

        {/* Mini CTA */}
        <div
          className="inline-flex items-center gap-1.5 mt-4 self-start"
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            background: `${personality.accent}1a`,
            border: `1px solid ${personality.accent}33`,
            color: personality.accent,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "-0.003em",
          }}
        >
          {cta}
          <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>
            →
          </span>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
 * VoiceCard — italic Fraunces quote in the agent's voice.
 * Bottom-left floater, furthest depth.
 * ============================================================ */
function VoiceCard({
  personality,
  voiceName,
}: {
  personality: Personality;
  voiceName: string;
}) {
  return (
    <article
      className="wrks-crystal-border relative flex flex-col"
      style={{
        width: 332,
        padding: "18px 22px 20px",
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.006) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
          "0 30px 70px -28px rgba(0,0,0,0.7), 0 2px 6px -2px rgba(0,0,0,0.35)",
      }}
    >
      <div className="relative z-[2] flex flex-col">
        {/* Eyebrow */}
        <span
          className="uppercase mb-3"
          style={{
            fontSize: 9.5,
            letterSpacing: "0.32em",
            color: "rgba(245,245,247,0.42)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          Agent voice
        </span>

        {/* Italic quote */}
        <p
          className="font-serif italic"
          style={{
            fontSize: 17,
            lineHeight: 1.35,
            color: "rgba(245,245,247,0.92)",
            letterSpacing: "-0.012em",
          }}
        >
          &ldquo;{personality.sample}&rdquo;
        </p>

        {/* Attribution */}
        <div className="flex items-center gap-2 mt-4">
          <span
            aria-hidden
            className="block"
            style={{
              width: 14,
              height: 1,
              background: "rgba(245,245,247,0.28)",
            }}
          />
          <span
            className="uppercase"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.3em",
              color: "rgba(245,245,247,0.55)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            {personality.name} · {voiceName}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
 * AuroraLayer — drifting palette orbs (kept from previous iteration).
 * Two large soft-blurred ellipses translate slowly so the bg has motion.
 * ============================================================ */
function AuroraLayer({
  accent,
  accentDeep,
  reduced,
}: {
  accent: string;
  accentDeep: string;
  reduced: boolean;
}) {
  const orbBase = (color: string, opacityHex: string) =>
    `radial-gradient(ellipse 50% 50% at 50% 50%, ${color}${opacityHex}, transparent 70%)`;
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute"
        animate={
          reduced
            ? undefined
            : { x: [0, 60, -40, 0], y: [0, 40, -30, 0], scale: [1, 1.05, 0.98, 1] }
        }
        transition={{ duration: 48, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 900,
          height: 720,
          right: "-12%",
          top: "-18%",
          background: orbBase(accent, "30"),
          filter: "blur(70px)",
        }}
      />
      <motion.div
        className="absolute"
        animate={
          reduced
            ? undefined
            : { x: [0, -50, 30, 0], y: [0, -30, 20, 0], scale: [1, 1.04, 0.99, 1] }
        }
        transition={{ duration: 62, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 820,
          height: 760,
          left: "-15%",
          bottom: "-22%",
          background: orbBase(accentDeep, "28"),
          filter: "blur(80px)",
        }}
      />
      <motion.div
        className="absolute"
        animate={
          reduced
            ? undefined
            : { x: [0, 80, -60, 40, 0], y: [0, -40, 30, -20, 0] }
        }
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 560,
          height: 560,
          left: "30%",
          top: "30%",
          background: orbBase(accent, "1a"),
          filter: "blur(90px)",
        }}
      />
    </div>
  );
}

/* ============================================================
 * StatusLine — bottom-left mono caps with hairline.
 * ============================================================ */
function StatusLine({ status }: { status: string }) {
  return (
    <div
      className="absolute flex items-center gap-3 pointer-events-none"
      style={{ bottom: 26, left: 32, zIndex: 5 }}
    >
      <span
        aria-hidden
        className="block"
        style={{
          width: 22,
          height: 1,
          background: "rgba(245,245,247,0.18)",
        }}
      />
      <span
        className="uppercase"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.28em",
          color: "rgba(245,245,247,0.4)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        {status}
      </span>
    </div>
  );
}
