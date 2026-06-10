"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import { ContinueButton } from "@/components/continue-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { useOnboardingAgent } from "@/lib/onboarding-agent";
import {
  getPalette,
  PALETTES,
  type Palette,
  type Theme,
} from "@/lib/palettes";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { VOICES, type VoiceId } from "@/lib/voices";

// Act Four — The Look.
//
// Two decisions, one screen, fully animated:
//   1. Mode (light vs dark) — two big glass tiles. Each renders the
//      theme literally; the chosen palette's accent bleeds through.
//   2. Palette — 8 glass cards. Each shows a 3D breathing orb in the
//      primary color + 3 supporting swatches + name + tagline.
//
// Stunning components used:
//   • Letter-stagger headline reveal
//   • Glass cards with backdrop-filter + specular highlights
//   • 3D breathing orbs (radial gradients + ambient glow)
//   • Cursor-tracking spotlight inside every card
//   • Magnetic 3D tilt on hover
//   • Selection burst ring animation
//   • Cascade entry animations with stagger

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const INTAKE_KEY = "wrks-onboarding-intake";
const THEME_KEY = "wrks-onboarding-theme";
const PALETTE_KEY = "wrks-onboarding-palette";

const HEADLINE = "Set the look.";

export default function ReferencePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { accent: agentAccent } = useOnboardingAgent();

  const [personality, setPersonality] = useState<Personality | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [paletteId, setPaletteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
    if (!p || !PERSONALITIES.some((x) => x.id === p)) {
      router.replace("/onboarding/personality");
      return;
    }
    if (!localStorage.getItem(NAME_KEY)) {
      router.replace("/onboarding/name");
      return;
    }
    const v = localStorage.getItem(VOICE_KEY) as VoiceId | null;
    if (!v || !VOICES.some((x) => x.id === v)) {
      router.replace("/onboarding/personality");
      return;
    }
    if (!localStorage.getItem(INTAKE_KEY)) {
      router.replace("/onboarding/intake");
      return;
    }
    setPersonality(PERSONALITIES.find((x) => x.id === p)!);

    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
    const storedPalette = localStorage.getItem(PALETTE_KEY);
    if (storedPalette && PALETTES.some((p) => p.id === storedPalette)) {
      setPaletteId(storedPalette);
    }
  }, [router]);

  if (!personality) return null;

  const palette = paletteId ? getPalette(paletteId) : null;
  const canContinue = !!theme && !!paletteId;

  const onContinue = async (skipped: boolean) => {
    if (submitting) return;
    setSubmitting(true);

    if (skipped) {
      localStorage.removeItem(THEME_KEY);
      localStorage.removeItem(PALETTE_KEY);
    } else {
      if (theme) localStorage.setItem(THEME_KEY, theme);
      if (paletteId) localStorage.setItem(PALETTE_KEY, paletteId);
    }

    try {
      const res = await fetch("/api/onboarding/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          skipped ? { theme: null, paletteId: null } : { theme, paletteId },
        ),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        console.error(
          "[onboarding/reference] submit failed:",
          body?.error ?? res.status,
        );
      }
    } catch (err) {
      console.error("[onboarding/reference] network error:", err);
    }
    router.push("/onboarding/wow");
  };

  return (
    <OnboardingFrame step={4} totalSteps={5} bloomTint={palette?.accent ?? agentAccent}>
      <div className="relative mx-auto flex flex-col max-w-[1440px] min-h-[calc(100vh-120px)] px-10 sm:px-14 py-12">
        {/* Eyebrow */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex items-center gap-4"
        >
          <span
            className="inline-block h-px w-10"
            style={{ background: "rgba(245,240,230,0.22)" }}
          />
          <span
            className="text-[11px] tracking-[0.32em] uppercase"
            style={{
              color: "rgba(245,240,230,0.42)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Act Four — The Look
          </span>
        </motion.div>

        {/* Header — letter-stagger hero + intro */}
        <div
          className="mt-12 grid gap-x-12 lg:gap-x-16 gap-y-8 items-end"
          style={{
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          }}
        >
          <StaggeredHeadline text={HEADLINE} reduced={!!reduced} />
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45 }}
            className="font-sans"
            style={{
              fontSize: 15,
              lineHeight: 1.55,
              letterSpacing: "0.005em",
              color: "rgba(245,240,230,0.62)",
              maxWidth: "44ch",
              margin: 0,
            }}
          >
            Pick a mode and a palette. Your agent uses both to set the
            visual identity AND the writing voice of everything it makes
            for you next.
          </motion.p>
        </div>

        {/* MODE TILES */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-14"
        >
          <SectionLabel>01 — Mode</SectionLabel>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            <ModeTile
              mode="light"
              palette={palette}
              selected={theme === "light"}
              onSelect={() => setTheme("light")}
              reduced={!!reduced}
              index={0}
            />
            <ModeTile
              mode="dark"
              palette={palette}
              selected={theme === "dark"}
              onSelect={() => setTheme("dark")}
              reduced={!!reduced}
              index={1}
            />
          </div>
        </motion.div>

        {/* PALETTE GRID */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-14"
        >
          <SectionLabel>02 — Palette</SectionLabel>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {PALETTES.map((p, i) => (
              <PaletteCard
                key={p.id}
                palette={p}
                theme={theme}
                index={i}
                selected={paletteId === p.id}
                onSelect={() => setPaletteId(p.id)}
                reduced={!!reduced}
              />
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 flex flex-col items-center gap-5"
        >
          <AnimatePresence mode="wait" initial={false}>
            {canContinue ? (
              <motion.div
                key="continue"
                initial={
                  reduced ? false : { opacity: 0, y: 6, filter: "blur(3px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduced ? undefined : { opacity: 0, y: -3 }}
                transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <ContinueButton
                  onClick={() => onContinue(false)}
                  disabled={submitting}
                >
                  Continue
                  <span aria-hidden style={{ marginLeft: "0.7em" }}>
                    →
                  </span>
                </ContinueButton>
              </motion.div>
            ) : (
              <motion.p
                key="cta-hint"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="font-sans"
                style={{
                  fontSize: 12.5,
                  color: "rgba(245,240,230,0.34)",
                  letterSpacing: "0.02em",
                  margin: 0,
                }}
              >
                {!theme && !paletteId
                  ? "Pick a mode and a palette to continue."
                  : !theme
                    ? "Pick a mode."
                    : "Pick a palette."}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => onContinue(true)}
            disabled={submitting}
            className="text-[11px] tracking-[0.28em] uppercase transition-opacity hover:opacity-80 disabled:opacity-30"
            style={{
              color: "rgba(245,240,230,0.42)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Skip — use the default
          </button>
        </motion.div>

        {/* Back link */}
        <motion.button
          type="button"
          onClick={() => router.push("/onboarding/intake")}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-auto self-start pt-16 text-[10.5px] tracking-[0.32em] uppercase transition-opacity hover:opacity-80"
          style={{
            color: "rgba(245,240,230,0.34)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ← Back
        </motion.button>
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * StaggeredHeadline — letter-by-letter reveal with blur + lift.
 * ============================================================ */
function StaggeredHeadline({ text, reduced }: { text: string; reduced: boolean }) {
  const chars = text.split("");
  return (
    <h1
      className="font-serif"
      style={{
        fontSize: "clamp(3rem, 5.4vw, 5.25rem)",
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: "-0.035em",
        color: "rgba(245,240,230,0.97)",
        margin: 0,
        display: "flex",
        flexWrap: "wrap",
      }}
    >
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          initial={
            reduced ? false : { opacity: 0, y: 24, filter: "blur(10px)" }
          }
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.55,
            delay: 0.08 + i * 0.035,
            ease: [0.2, 0.7, 0.2, 1],
          }}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </h1>
  );
}

/* ============================================================
 * SectionLabel — small mono header for the two sections.
 * ============================================================ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-block h-px w-6"
        style={{ background: "rgba(245,240,230,0.2)" }}
      />
      <span
        className="text-[10.5px] tracking-[0.32em] uppercase"
        style={{
          color: "rgba(245,240,230,0.5)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

/* ============================================================
 * useCardInteractions — shared hook for cursor spotlight + tilt.
 * ============================================================ */
function useCardInteractions(reduced: boolean) {
  const ref = useRef<HTMLButtonElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const [isHovered, setIsHovered] = useState(false);

  // Smoothed values for tilt
  const springConfig = { stiffness: 140, damping: 18 };
  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], reduced ? [0, 0] : [4, -4]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], reduced ? [0, 0] : [-4, 4]),
    springConfig,
  );

  // Spotlight position in pixels for the radial gradient
  const spotlightX = useMotionValue("50%");
  const spotlightY = useMotionValue("50%");

  const onMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    mouseX.set(Math.max(0, Math.min(1, nx)));
    mouseY.set(Math.max(0, Math.min(1, ny)));
    spotlightX.set(`${nx * 100}%`);
    spotlightY.set(`${ny * 100}%`);
  };
  const onMouseEnter = () => setIsHovered(true);
  const onMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return {
    ref,
    rotateX,
    rotateY,
    spotlightX,
    spotlightY,
    isHovered,
    handlers: { onMouseMove, onMouseEnter, onMouseLeave },
  };
}

/* ============================================================
 * ModeTile — glass card rendered IN its theme. Big serif label,
 * sample preview (mini hero), accent bleed from the chosen palette.
 * ============================================================ */
function ModeTile({
  mode,
  palette,
  selected,
  onSelect,
  reduced,
  index,
}: {
  mode: Theme;
  palette: Palette | null;
  selected: boolean;
  onSelect: () => void;
  reduced: boolean;
  index: number;
}) {
  const render = palette
    ? mode === "light"
      ? palette.light
      : palette.dark
    : mode === "light"
      ? {
          bg: "#fbf6e8",
          ink: "#2b2018",
          inkMuted: "#6b5d4f",
          rim: "rgba(43,32,24,0.14)",
        }
      : {
          bg: "#0a0a0c",
          ink: "#f5f0e6",
          inkMuted: "#9c8f78",
          rim: "rgba(245,240,230,0.1)",
        };

  const accent = palette?.accent ?? (mode === "light" ? "#2b2018" : "#a78bfa");

  const {
    ref,
    rotateX,
    rotateY,
    spotlightX,
    spotlightY,
    isHovered,
    handlers,
  } = useCardInteractions(reduced);

  const spotlightBg = useTransform(
    () =>
      `radial-gradient(circle 280px at ${spotlightX.get()} ${spotlightY.get()}, ${accent}22, transparent 70%)`,
  );

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onSelect}
      onMouseMove={handlers.onMouseMove}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.55,
        delay: 0.55 + index * 0.08,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      whileTap={{ scale: 0.995 }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      }}
      className="relative text-left rounded-3xl overflow-hidden cursor-pointer group"
    >
      {/* Layer 1 — palette bg (the actual theme color) */}
      <div className="absolute inset-0" style={{ background: render.bg }} />

      {/* Layer 2 — accent bleed from selected palette (subtle gradient) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 90% 100%, ${accent}33, transparent 70%)`,
        }}
      />

      {/* Layer 3 — specular top highlight (glass feel) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{
          background:
            mode === "dark"
              ? "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)"
              : "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.5), transparent 70%)",
        }}
      />

      {/* Layer 4 — cursor spotlight (only visible on hover) */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: spotlightBg,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Layer 5 — selection burst ring */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="burst"
            initial={{ opacity: 1, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              border: `2px solid ${accent}`,
              boxShadow: `0 0 80px ${accent}88, inset 0 0 40px ${accent}33`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        className="relative"
        style={{
          padding: "32px 32px 28px",
          minHeight: 260,
          transform: "translateZ(20px)",
        }}
      >
        {/* Eyebrow + sun/moon symbol + check */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {mode === "light" ? (
              <SunIcon color={render.ink} />
            ) : (
              <MoonIcon color={accent} />
            )}
            <span
              className="text-[10px] tracking-[0.32em] uppercase"
              style={{
                color: render.inkMuted,
                fontFamily: "var(--font-mono)",
              }}
            >
              {mode === "light" ? "Daylight" : "After dark"}
            </span>
          </div>
          <motion.div
            animate={{ scale: selected ? 1 : 0.92 }}
            transition={{ duration: 0.22 }}
            className="size-7 rounded-full grid place-items-center"
            style={{
              background: selected ? accent : "transparent",
              border: selected
                ? "1px solid rgba(255,255,255,0.55)"
                : `1px solid ${render.rim}`,
              boxShadow: selected
                ? `0 4px 12px -2px ${accent}88`
                : undefined,
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
          >
            {selected && <CheckIcon />}
          </motion.div>
        </div>

        {/* Big serif headline */}
        <h3
          className="mt-6 font-serif"
          style={{
            fontSize: 68,
            fontWeight: 500,
            letterSpacing: "-0.035em",
            lineHeight: 0.95,
            color: render.ink,
            margin: 0,
          }}
        >
          {mode === "light" ? "Light." : "Dark."}
        </h3>

        {/* Tagline */}
        <p
          className="mt-3 font-serif italic"
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: render.inkMuted,
            margin: 0,
            maxWidth: "30ch",
          }}
        >
          {mode === "light"
            ? "Cream canvas. Ink headlines. Plain daylight."
            : "Near-black canvas. Luminous accents. Premium gradient."}
        </p>

        {/* Mini sample preview — a tiny "hero card" rendered IN the
            chosen palette/theme so the user sees what the look feels like. */}
        <div
          className="mt-6 rounded-xl px-4 py-3 flex items-center justify-between"
          style={{
            background:
              mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${render.rim}`,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div className="flex flex-col gap-1">
            <span
              className="font-serif"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: render.ink,
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              Sample headline.
            </span>
            <span
              className="text-[9.5px] tracking-[0.18em] uppercase"
              style={{
                color: render.inkMuted,
                fontFamily: "var(--font-mono)",
              }}
            >
              {mode}
            </span>
          </div>
          <span
            className="px-3 py-1 rounded-full text-[10.5px] font-medium"
            style={{
              background: accent,
              color: mode === "dark" ? "#0a0a0c" : "#ffffff",
              boxShadow: `0 4px 14px -2px ${accent}aa`,
              letterSpacing: "0.01em",
            }}
          >
            Continue →
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * PaletteCard — glass card with 3D breathing orb + supporting
 * swatches + cursor spotlight + selection burst.
 * ============================================================ */
function PaletteCard({
  palette,
  theme,
  index,
  selected,
  onSelect,
  reduced,
}: {
  palette: Palette;
  theme: Theme | null;
  index: number;
  selected: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  const render = theme
    ? theme === "light"
      ? palette.light
      : palette.dark
    : palette.dark;
  const isLight = theme === "light";

  const {
    ref,
    rotateX,
    rotateY,
    spotlightX,
    spotlightY,
    isHovered,
    handlers,
  } = useCardInteractions(reduced);

  const spotlightBg = useTransform(
    () =>
      `radial-gradient(circle 200px at ${spotlightX.get()} ${spotlightY.get()}, ${palette.accent}33, transparent 65%)`,
  );

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onSelect}
      onMouseMove={handlers.onMouseMove}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.5,
        delay: 0.65 + index * 0.05,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      whileTap={{ scale: 0.985 }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      }}
      className="relative text-left rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Layer 1 — theme bg */}
      <div className="absolute inset-0" style={{ background: render.bg }} />

      {/* Layer 2 — accent bleed gradient bg */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 30% 0%, ${palette.accent}22, transparent 70%)`,
        }}
      />

      {/* Layer 3 — specular top highlight */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-16 pointer-events-none"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.5), transparent 70%)"
            : "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.06), transparent 70%)",
        }}
      />

      {/* Layer 4 — cursor spotlight */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: spotlightBg,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Layer 5 — border (changes with selection) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          border: selected
            ? `2px solid ${palette.accent}`
            : `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: selected
            ? `0 0 0 5px ${palette.accent}22, 0 28px 60px -18px ${palette.accent}66, 0 18px 36px -18px rgba(0,0,0,0.55)`
            : "0 18px 36px -22px rgba(0,0,0,0.55)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      />

      {/* Layer 6 — selection burst */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="burst"
            initial={{ opacity: 0.9, scale: 0.96 }}
            animate={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              border: `2px solid ${palette.accent}`,
              boxShadow: `0 0 60px ${palette.accent}88`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Selection chip */}
      <div className="absolute top-3 right-3 z-10">
        <motion.div
          animate={{ scale: selected ? 1 : 0.92 }}
          transition={{ duration: 0.22 }}
          className="size-7 rounded-full grid place-items-center"
          style={{
            background: selected ? palette.accent : "transparent",
            border: selected
              ? "1px solid rgba(255,255,255,0.55)"
              : `1px solid ${render.rim}`,
            boxShadow: selected
              ? `0 4px 12px -2px ${palette.accent}aa`
              : undefined,
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}
        >
          {selected && <CheckIcon />}
        </motion.div>
      </div>

      {/* Content */}
      <div
        className="relative"
        style={{
          padding: "22px 22px 20px",
          minHeight: 250,
          transform: "translateZ(15px)",
        }}
      >
        {/* Hero row — 3D breathing orb + supporting swatches stack */}
        <div className="flex items-end gap-3">
          <BreathingOrb color={palette.accent} reduced={reduced} />
          <div className="flex flex-col gap-1.5 pb-1">
            {palette.supporting.map((c, i) => (
              <motion.span
                key={i}
                initial={
                  reduced ? false : { opacity: 0, x: -4 }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.85 + i * 0.08,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                whileHover={reduced ? undefined : { scale: 1.18 }}
                className="block rounded-full"
                style={{
                  width: 16,
                  height: 16,
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), transparent 35%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.25), transparent 40%), ${c}`,
                  boxShadow: `0 4px 10px -2px ${c}77, inset 0 -1px 2px rgba(0,0,0,0.2)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Name + tagline */}
        <div className="mt-6">
          <h3
            className="font-serif"
            style={{
              fontSize: 21,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: render.ink,
              margin: 0,
            }}
          >
            {palette.name}
          </h3>
          <p
            className="mt-1.5 font-serif italic"
            style={{
              fontSize: 12,
              lineHeight: 1.45,
              color: render.inkMuted,
              margin: 0,
            }}
          >
            {palette.tagline}
          </p>
        </div>

        {/* Bottom hairline + number */}
        <div className="mt-5 flex items-center gap-2">
          <span
            className="block h-px flex-1"
            style={{ background: render.rim }}
          />
          <span
            className="text-[9px] tracking-[0.28em] uppercase tabular-nums"
            style={{
              color: render.inkMuted,
              fontFamily: "var(--font-mono)",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * BreathingOrb — the 3D-feeling primary swatch. Radial gradient
 * for specular + shadow + ambient glow ring + slow scale breath.
 * ============================================================ */
function BreathingOrb({ color, reduced }: { color: string; reduced: boolean }) {
  return (
    <div className="relative">
      {/* Ambient outer glow that pulses with the breath */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        animate={
          reduced
            ? { opacity: 0.6 }
            : { opacity: [0.4, 0.65, 0.4], scale: [1, 1.15, 1] }
        }
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          inset: -10,
          background: `radial-gradient(circle, ${color}66, transparent 70%)`,
          filter: "blur(8px)",
        }}
      />
      {/* The orb itself — 3D from layered radial gradients */}
      <motion.div
        aria-hidden
        animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative rounded-full"
        style={{
          width: 66,
          height: 66,
          background: `
            radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 30%),
            radial-gradient(circle at 70% 75%, rgba(0,0,0,0.35), transparent 35%),
            ${color}
          `,
          boxShadow: `0 12px 28px -6px ${color}99, 0 0 0 1px rgba(255,255,255,0.08), inset 0 -3px 6px rgba(0,0,0,0.2)`,
        }}
      />
    </div>
  );
}

/* ============================================================
 * Icons
 * ============================================================ */
function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ color: "white" }}
    >
      <path
        d="m4 12 5 5L20 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ color }}
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 17.66l1.41 1.41" />
        <path d="M4.93 19.07l1.41-1.41" />
        <path d="M17.66 6.34l1.41-1.41" />
      </g>
    </svg>
  );
}

function MoonIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ color }}
    >
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"
        fill="currentColor"
      />
    </svg>
  );
}
