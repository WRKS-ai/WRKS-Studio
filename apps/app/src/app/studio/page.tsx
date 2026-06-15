"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { useStudio } from "@/lib/studio-context";

// /studio — brand cover welcome.
//
// Per the user's latest review: the centered meditation orb was too
// sparse, and the floating Siri orb belongs bottom-right (consistent
// with the onboarding pages). The agent presence is handled by
// StudioInspectorFrame's <StudioFloatingAgent> — we don't render an
// orb on this page at all.
//
// The welcome is now a brand cover. The user opens /studio and sees
// their brand presented like a Stripe Press cover: their brand name as
// a massive Fraunces wordmark with an atmospheric palette halo behind
// it, an italic subhead, a single hairline, then a 3-cell editorial
// brand-system row (palette · display · voice). The personality accent
// appears only inside the halo + the palette swatches — both content.
//
// Reference: Stripe Press, Aesop's identity pages, Anthropic essay
// covers. NOT a Lovable composer pedestal. NOT a dashboard.

export default function StudioWelcomePage() {
  const reduced = useReducedMotion();
  const { personality, agentName, stored, voice } = useStudio();
  const bgRef = useRef<HTMLDivElement>(null);

  // Cursor-tracked spotlight via CSS vars + rAF (no React rerenders).
  // Listener lives on window because the bg has pointer-events:none.
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${pendingX - rect.left}px`);
        el.style.setProperty("--sy", `${pendingY - rect.top}px`);
      });
    };
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${rect.width / 2}px`);
    el.style.setProperty("--sy", `${rect.height * 0.42}px`);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const brandName = stored?.deliverables.brandName ?? "Untitled studio";
  const subhead = `Drafted by ${agentName?.trim() || personality.name} · ${personality.name.toLowerCase()} stands ready`;
  const status = stored
    ? `Edition one · draft · not published yet`
    : `Ready · just say what you want to build`;

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      {/* Premium atmosphere — 3 layers from back to front:
          1) Drifting palette aurora orbs (slow, organic translation)
          2) Hairline dotted grid (very subtle, fades into the aurora)
          3) Cursor-tracked spotlight (bright white head + palette halo) */}
      <AuroraLayer accent={personality.accent} accentDeep={personality.accentDeep} reduced={!!reduced} />

      <div
        ref={bgRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle 380px at var(--sx, 50%) var(--sy, 42%), rgba(255,255,255,0.14), rgba(255,255,255,0.04) 35%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle 640px at var(--sx, 50%) var(--sy, 42%), ${personality.accent}1c, transparent 70%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Film grain — analog warmth on top of the atmosphere */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none wrks-studio-grain"
        style={{ opacity: 0.32, mixBlendMode: "overlay" }}
      />

      {/* Bottom vignette so the atmosphere settles into deeper black. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 50% 100%, transparent, rgba(0,0,0,0.55))",
        }}
      />

      {/* Centered brand cover column */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-8">
        {/* Atmospheric accent halo behind the wordmark (palette accent
            allowed here: this is content, not chrome). Slow breathing
            so the cover feels alive without animation flair. */}
        <div className="relative flex flex-col items-center" style={{ width: "min(960px, 92vw)" }}>
          <motion.div
            aria-hidden
            animate={
              reduced
                ? { opacity: 0.55 }
                : { opacity: [0.4, 0.62, 0.4], scale: [0.98, 1.02, 0.98] }
            }
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute pointer-events-none"
            style={{
              inset: "-40% -10% -20% -10%",
              background: `radial-gradient(ellipse 60% 55% at 50% 45%, ${personality.accent}30, ${personality.accentDeep}10 35%, transparent 70%)`,
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />

          {/* Top eyebrow */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 0.72, 0.2, 1] }}
            className="relative flex items-center gap-3 z-10"
            style={{ marginBottom: 48 }}
          >
            <span
              aria-hidden
              className="block"
              style={{
                width: 22,
                height: 1,
                background: "rgba(245,245,247,0.22)",
              }}
            />
            <span
              className="uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.32em",
                color: "rgba(245,245,247,0.5)",
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}
            >
              Studio · Edition one
            </span>
            <span
              aria-hidden
              className="block"
              style={{
                width: 22,
                height: 1,
                background: "rgba(245,245,247,0.22)",
              }}
            />
          </motion.div>

          {/* Hero brand wordmark */}
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 22, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.95, delay: 0.12, ease: [0.22, 0.72, 0.2, 1] }}
            className="relative font-serif text-center z-10"
            style={{
              fontSize: "clamp(64px, 10.8vw, 156px)",
              fontWeight: 480,
              letterSpacing: "-0.04em",
              lineHeight: 0.92,
              color: "rgba(248,247,252,0.98)",
              textShadow: `0 30px 80px ${personality.accentDeep}55`,
            }}
          >
            {brandName}
          </motion.h1>

          {/* Italic Fraunces subhead */}
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: [0.22, 0.72, 0.2, 1] }}
            className="relative font-serif italic text-center z-10"
            style={{
              fontSize: "clamp(17px, 1.6vw, 20px)",
              color: "rgba(245,245,247,0.6)",
              letterSpacing: "-0.005em",
              marginTop: 36,
              maxWidth: "44ch",
            }}
          >
            {subhead}
          </motion.p>

          {/* Hairline separator */}
          <motion.div
            aria-hidden
            initial={reduced ? false : { opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 0.72, 0.2, 1] }}
            className="relative z-10"
            style={{
              width: 64,
              height: 1,
              background: "rgba(245,245,247,0.18)",
              marginTop: 64,
              marginBottom: 44,
            }}
          />

          {/* Brand system label */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.58, ease: [0.22, 0.72, 0.2, 1] }}
            className="relative uppercase z-10"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.34em",
              marginBottom: 32,
              color: "rgba(245,245,247,0.38)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            Brand system
          </motion.div>

          {/* 3-cell editorial brand-system row */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.78, delay: 0.66, ease: [0.22, 0.72, 0.2, 1] }}
            className="relative grid grid-cols-3 z-10"
            style={{ gap: 18, width: "min(740px, 94vw)" }}
          >
            <PaletteCell personality={personality} />
            <DisplayCell />
            <VoiceCell voiceName={voice?.name ?? "—"} />
          </motion.div>
        </div>
      </div>

      {/* Bottom-left status line */}
      <StatusLine status={status} />
    </main>
  );
}

/* ============================================================
 * AuroraLayer — drifting palette orbs that give the canvas premium
 * atmospheric depth. Two large soft-blurred ellipses in the user's
 * accent + accentDeep, translating slowly on offset cycles so the
 * background never feels static. Sits behind the dotted grid + grain.
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
      {/* Orb A — accent, drifts top-right ↔ center */}
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
      {/* Orb B — accentDeep, drifts bottom-left ↔ center */}
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
      {/* Orb C — accent (smaller), wanders through center */}
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
 * Brand system cells — small editorial moments framed by the
 * revolving crystal-light comet (no purple chrome).
 * ============================================================ */
function CellFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      className="wrks-crystal-border relative flex flex-col"
      style={{
        height: 172,
        padding: "20px 22px 22px",
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.008) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
          "0 28px 70px -28px rgba(0,0,0,0.7), 0 2px 6px -2px rgba(0,0,0,0.4)",
      }}
    >
      <div className="relative z-[2] flex flex-col h-full">
        <div
          className="uppercase shrink-0"
          style={{
            fontSize: 9.5,
            letterSpacing: "0.34em",
            color: "rgba(245,245,247,0.4)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          {label}
        </div>
        <div className="flex-1 grid place-items-center w-full">{children}</div>
      </div>
    </div>
  );
}

function PaletteCell({
  personality,
}: {
  personality: import("@/lib/personalities").Personality;
}) {
  const swatches = [personality.accent, personality.accentDeep, personality.glow];
  return (
    <CellFrame label="Palette">
      <div className="flex flex-col items-center" style={{ gap: 12 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          {swatches.map((c, i) => (
            <span
              key={i}
              aria-hidden
              className="block rounded-full"
              style={{
                width: 22,
                height: 22,
                background: c,
                boxShadow:
                  i === 0
                    ? `0 0 0 1px rgba(255,255,255,0.18), 0 8px 18px -4px ${personality.glow}`
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
            color: "rgba(245,245,247,0.6)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          {personality.name}
        </span>
      </div>
    </CellFrame>
  );
}

function DisplayCell() {
  return (
    <CellFrame label="Display">
      <div className="flex flex-col items-center" style={{ gap: 6 }}>
        <span
          className="font-serif"
          style={{
            fontSize: 56,
            fontWeight: 480,
            letterSpacing: "-0.028em",
            color: "rgba(245,245,247,0.96)",
            lineHeight: 0.95,
          }}
        >
          Aa
        </span>
        <span
          className="uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.28em",
            color: "rgba(245,245,247,0.6)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          Fraunces
        </span>
      </div>
    </CellFrame>
  );
}

function VoiceCell({ voiceName }: { voiceName: string }) {
  // 7 bars of varying base heights — animate to mimic a quiet waveform.
  const bars = [10, 18, 26, 34, 26, 18, 10];
  return (
    <CellFrame label="Voice">
      <div className="flex flex-col items-center" style={{ gap: 10 }}>
        <div className="flex items-end" style={{ gap: 4, height: 36 }}>
          {bars.map((h, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="block rounded-full"
              animate={{
                height: [h, h * 1.6, h * 0.7, h],
              }}
              transition={{
                duration: 1.6 + i * 0.07,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.06,
              }}
              style={{
                width: 3,
                background: "rgba(245,240,230,0.7)",
              }}
            />
          ))}
        </div>
        <span
          className="uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.28em",
            color: "rgba(245,245,247,0.6)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          {voiceName}
        </span>
      </div>
    </CellFrame>
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
