"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { useStudio } from "@/lib/studio-context";
import { orbColorsFromAccent, SiriOrb } from "@/components/siri-orb";

// /studio — voice-first welcome canvas.
//
// Per the master plan, /studio is the heart of the product. We rejected
// the Lovable-style composer-on-pedestal pattern: WRKS is voice-first,
// the agent is the input. The welcome canvas is a meditation — empty,
// premium, the orb is the focal point.
//
// Layout:
//   • Dotted grid background tinted #101012, ~22px spacing
//   • Mouse-tracked spotlight (radial brightness following the cursor)
//   • Top-left: small brand chip (mark + name + agent · personality)
//   • Center: Fraunces headline → big breathing SiriOrb (~260px) → hint
//   • Bottom-left: hairline + mono caps status line
//
// The orb IS the voice control. Tapping toggles the session. Spacebar
// also toggles. No text composer on this surface — that lives in the
// editor (/studio/library). Right inspector is hidden on this route by
// StudioInspectorFrame.

export default function StudioWelcomePage() {
  const reduced = useReducedMotion();
  const {
    personality,
    agentName,
    stored,
    voiceState,
    voiceActive,
    voiceError,
    startVoice,
    stopVoice,
  } = useStudio();
  const bgRef = useRef<HTMLDivElement>(null);

  // Mouse spotlight via CSS variables on the bg element (no React rerenders).
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--sy", `${e.clientY - rect.top}px`);
      });
    };
    const onLeave = () => {
      el.style.setProperty("--sx", `50%`);
      el.style.setProperty("--sy", `42%`);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    onLeave();
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Spacebar = toggle the voice session. Only fires when nothing else
  // (input/textarea) has focus, so it never hijacks typing elsewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      e.preventDefault();
      voiceActive ? stopVoice() : startVoice();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [voiceActive, startVoice, stopVoice]);

  const greeting = (() => {
    const name = agentName?.trim() || "there";
    if (!stored) return `Let's start, ${name}`;
    return `What's next, ${name}?`;
  })();

  const hint = (() => {
    if (voiceError) return voiceError.toUpperCase();
    switch (voiceState) {
      case "connecting":
        return "Connecting…";
      case "listening":
        return "I'm listening — go ahead";
      case "speaking":
        return `${agentName || "Agent"} is talking`;
      case "error":
        return "Couldn't reach the agent · tap to retry";
      default:
        return "Tap the orb · or press space";
    }
  })();

  const status = stored
    ? `Draft · ${stored.deliverables.brandName} · not published yet`
    : "Ready · just say what you want to build";

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#101012" }}
    >
      {/* Dotted grid + spotlight — one ref-element with CSS var driving the spotlight. */}
      <div
        ref={bgRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle 520px at var(--sx, 50%) var(--sy, 42%), rgba(255,255,255,0.07), transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Soft bottom vignette so the dots fade into deeper black. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, transparent, rgba(0,0,0,0.4))",
        }}
      />

      {/* Top-left brand chip — quiet, no panel, just text. The brand
          mark uses the personality accent (this card is on the
          master-plan accent-allowed list). */}
      <BrandChip
        personality={personality}
        agentName={agentName}
        brandName={stored?.deliverables.brandName ?? "Your brand"}
        reduced={!!reduced}
      />

      {/* Centered hero column */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-8 z-10">
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.78, ease: [0.22, 0.72, 0.2, 1] }}
          className="font-serif text-center"
          style={{
            fontSize: "clamp(36px, 4.8vw, 60px)",
            fontWeight: 480,
            letterSpacing: "-0.028em",
            color: "rgba(245,245,247,0.97)",
            lineHeight: 1.04,
          }}
        >
          {greeting}
        </motion.h1>

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 0.72, 0.2, 1] }}
          className="relative grid place-items-center"
          style={{ marginTop: 56, marginBottom: 36 }}
        >
          <HeroOrb
            personality={personality}
            voiceState={voiceState}
            voiceActive={voiceActive}
            onClick={voiceActive ? stopVoice : startVoice}
            reduced={!!reduced}
          />
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
          className="uppercase text-center"
          style={{
            fontSize: 11.5,
            letterSpacing: "0.28em",
            color:
              voiceState === "error"
                ? "rgba(253,164,175,0.85)"
                : voiceActive
                  ? "rgba(245,240,230,0.85)"
                  : "rgba(245,245,247,0.5)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            transition: "color 240ms ease-out",
          }}
        >
          {hint}
        </motion.div>
      </div>

      {/* Bottom-left status line */}
      <StatusLine status={status} />
    </main>
  );
}

/* ============================================================
 * HeroOrb — large clickable SiriOrb that drives the voice session.
 * Rings + pulses pick up from the orb to communicate state. The
 * personality accent is allowed here per master-plan §C (this IS
 * the agent embodied — the same exception the floating Siri orb
 * gets on other studio routes).
 * ============================================================ */
function HeroOrb({
  personality,
  voiceState,
  voiceActive,
  onClick,
  reduced,
}: {
  personality: import("@/lib/personalities").Personality;
  voiceState: import("@/lib/studio-context").VoiceState;
  voiceActive: boolean;
  onClick: () => void;
  reduced: boolean;
}) {
  const accent = personality.accent;
  const orbColors = orbColorsFromAccent(accent);
  const speaking = voiceState === "speaking";
  const listening = voiceState === "listening";
  const connecting = voiceState === "connecting";
  const orbSeconds = speaking ? 5 : listening ? 14 : connecting ? 10 : 28;

  // Concentric breathing rings — visible only in idle so the orb reads
  // as clickable. Hidden while active (rings would compete with the
  // orb's own animation).
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={reduced ? undefined : { scale: 1.035 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="relative grid place-items-center rounded-full"
      style={{
        width: 280,
        height: 280,
        background: `radial-gradient(circle at 50% 45%, rgba(255,255,255,0.04), rgba(255,255,255,0.012) 70%)`,
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        boxShadow: voiceActive
          ? `0 0 120px -20px ${accent}aa, 0 30px 90px -30px rgba(0,0,0,0.7)`
          : `0 0 90px -30px ${accent}80, 0 28px 80px -30px rgba(0,0,0,0.6)`,
        border: `1px solid ${voiceActive ? `${accent}55` : "rgba(255,255,255,0.08)"}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
      }}
      aria-label={voiceActive ? "Stop the agent" : "Start the agent"}
    >
      {/* Idle breathing rings */}
      {!reduced && voiceState === "idle" && (
        <>
          {[0, 0.8, 1.6].map((delay, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{ inset: -10, border: `1px solid ${accent}33` }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: [0, 0.45, 0], scale: [0.98, 1.15, 1.3] }}
              transition={{
                duration: 3.4,
                repeat: Infinity,
                delay,
                ease: "easeOut",
                repeatDelay: 0.4,
              }}
            />
          ))}
        </>
      )}

      {/* Speaking expanding rings */}
      {!reduced && speaking && (
        <>
          {[0, 0.55, 1.1].map((delay, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{ inset: 0, border: `1px solid ${accent}66` }}
              animate={{
                scale: [1, 1.18, 1.4],
                opacity: [0.6, 0.25, 0],
              }}
              transition={{
                duration: 1.9,
                repeat: Infinity,
                delay,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Connecting ring — slow rotating dashed */}
      {!reduced && connecting && (
        <motion.span
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -6,
            border: `1px dashed ${accent}88`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      <SiriOrb
        size="220px"
        colors={orbColors}
        animationDuration={orbSeconds}
        className="relative"
      />
    </motion.button>
  );
}

/* ============================================================
 * BrandChip — tiny top-left identity. Brand mark uses personality
 * accent (allowed: master plan §C "brand-system card").
 * ============================================================ */
function BrandChip({
  personality,
  agentName,
  brandName,
  reduced,
}: {
  personality: import("@/lib/personalities").Personality;
  agentName: string;
  brandName: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.65, delay: 0.3, ease: [0.22, 0.72, 0.2, 1] }}
      className="absolute inline-flex items-center gap-3"
      style={{
        top: 28,
        left: 32,
        zIndex: 5,
      }}
    >
      <span
        className="shrink-0 grid place-items-center"
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          color: "white",
          fontSize: 13,
          fontWeight: 700,
          boxShadow: `0 8px 20px -10px ${personality.glow}`,
        }}
        aria-hidden
      >
        {brandName.charAt(0).toUpperCase()}
      </span>
      <div className="flex flex-col" style={{ lineHeight: 1.15 }}>
        <span
          className="truncate"
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: "rgba(245,245,247,0.96)",
            letterSpacing: "-0.005em",
          }}
        >
          {brandName}
        </span>
        <span
          className="uppercase"
          style={{
            fontSize: 9.5,
            letterSpacing: "0.26em",
            color: "rgba(245,245,247,0.42)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            marginTop: 3,
          }}
        >
          {(agentName?.trim() || "Agent")} · {personality.name}
        </span>
      </div>
    </motion.div>
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
