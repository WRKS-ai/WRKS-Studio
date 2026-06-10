"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type React from "react";
import { ContinueButton } from "@/components/continue-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { useOnboardingAgent } from "@/lib/onboarding-agent";
import { PALETTES, type Palette, type Theme } from "@/lib/palettes";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { VOICES, type VoiceId } from "@/lib/voices";

// Act Four — The Look.
//
// Premium restraint. Three principles:
//
//   1. NO HARD ACCENT BORDERS. Selection is felt, not outlined.
//      A soft outer halo + a small mono "SELECTED" eyebrow + a
//      subtle accent wash through the card's surface.
//
//   2. THE ORB IS THE HERO. Right side is atmospheric — a single
//      huge central orb, 3 satellites drifting at varied depths and
//      speeds (no shared orbit ring), big italic serif name below.
//      Navigation is editorial typography at the bottom, not buttons.
//
//   3. NEGATIVE SPACE. Both cards breathe. Hairline rims only.
//      No specular slabs. No dashed rings. The composition carries
//      the design.

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
  const [paletteIndex, setPaletteIndex] = useState<number | null>(null);
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
    if (storedPalette) {
      const i = PALETTES.findIndex((x) => x.id === storedPalette);
      if (i >= 0) setPaletteIndex(i);
    }
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setPaletteIndex((i) =>
          i === null ? 0 : (i - 1 + PALETTES.length) % PALETTES.length,
        );
      } else if (e.key === "ArrowRight") {
        setPaletteIndex((i) =>
          i === null ? 0 : (i + 1) % PALETTES.length,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!personality) return null;

  const palette = paletteIndex !== null ? PALETTES[paletteIndex] : null;
  const paletteId = palette?.id ?? null;
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
    <OnboardingFrame
      step={4}
      totalSteps={5}
      bloomTint={palette?.accent ?? agentAccent}
    >
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

        <div
          className="mt-12 grid gap-x-12 lg:gap-x-16 gap-y-8 items-end"
          style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}
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

        {/* Two-column body */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-12 grid gap-6 lg:gap-10"
          style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.3fr)" }}
        >
          {/* LEFT — Theme stack */}
          <div className="flex flex-col gap-5">
            <QuietSectionLabel>01 — Mode</QuietSectionLabel>
            <div className="flex flex-col gap-4 flex-1">
              <ThemeCard
                mode="light"
                palette={palette}
                selected={theme === "light"}
                onSelect={() => setTheme("light")}
                reduced={!!reduced}
                index={0}
              />
              <ThemeCard
                mode="dark"
                palette={palette}
                selected={theme === "dark"}
                onSelect={() => setTheme("dark")}
                reduced={!!reduced}
                index={1}
              />
            </div>
          </div>

          {/* RIGHT — Palette stage (no card; atmospheric composition) */}
          <div className="flex flex-col gap-5">
            <QuietSectionLabel>02 — Palette</QuietSectionLabel>
            <PaletteStage
              palettes={PALETTES}
              index={paletteIndex}
              setIndex={setPaletteIndex}
              reduced={!!reduced}
            />
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="mt-10 flex flex-col items-center gap-5"
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
          transition={{ duration: 0.6, delay: 0.95 }}
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
 * StaggeredHeadline
 * ============================================================ */
function StaggeredHeadline({
  text,
  reduced,
}: {
  text: string;
  reduced: boolean;
}) {
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
      {text.split("").map((ch, i) => (
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
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </h1>
  );
}

function QuietSectionLabel({ children }: { children: React.ReactNode }) {
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
 * ThemeCard — minimal glass, NO hard accent border on selection.
 * Selection is felt: subtle outer halo + soft inner accent wash +
 * tiny "SELECTED" eyebrow in top-right. Hairline rim, that's it.
 * ============================================================ */
function ThemeCard({
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

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={reduced ? false : { opacity: 0, x: -16, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.55,
        delay: 0.55 + index * 0.08,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={{ scale: 0.995 }}
      className="relative text-left rounded-3xl overflow-hidden cursor-pointer flex-1 min-h-[180px]"
      style={{
        // Selected = soft outer halo only. NO hard border swap.
        boxShadow: selected
          ? `0 0 80px -10px ${accent}66, 0 22px 50px -20px rgba(0,0,0,0.55)`
          : "0 22px 50px -22px rgba(0,0,0,0.55)",
        transition: "box-shadow 0.5s ease",
      }}
    >
      {/* Layer 1 — theme bg */}
      <div className="absolute inset-0" style={{ background: render.bg }} />

      {/* Layer 2 — accent inner wash when selected (very subtle) */}
      <motion.div
        aria-hidden
        animate={{ opacity: selected ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 100%, ${accent}33, transparent 75%)`,
        }}
      />

      {/* Layer 3 — corner accent bleed (always present at low opacity) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 50% at 100% 100%, ${accent}1a, transparent 70%)`,
        }}
      />

      {/* Layer 4 — top specular */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-20 pointer-events-none"
        style={{
          background:
            mode === "dark"
              ? "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.07), transparent 70%)"
              : "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.45), transparent 70%)",
        }}
      />

      {/* Layer 5 — hairline rim (constant, very quiet) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          border:
            mode === "dark"
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(0,0,0,0.06)",
        }}
      />

      {/* Content */}
      <div
        className="relative h-full flex flex-col justify-between"
        style={{ padding: "26px 28px 24px" }}
      >
        {/* Top — eyebrow + tiny "SELECTED" badge */}
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
          <AnimatePresence>
            {selected && (
              <motion.div
                key="selected-badge"
                initial={reduced ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0, x: 8 }}
                transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
                className="flex items-center gap-1.5"
              >
                <span
                  className="block size-1 rounded-full"
                  style={{
                    background: accent,
                    boxShadow: `0 0 8px ${accent}`,
                  }}
                />
                <span
                  className="text-[9.5px] tracking-[0.32em] uppercase"
                  style={{
                    color: render.ink,
                    fontFamily: "var(--font-mono)",
                    opacity: 0.85,
                  }}
                >
                  Selected
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Big serif label + tagline */}
        <div>
          <h3
            className="font-serif"
            style={{
              fontSize: 52,
              fontWeight: 500,
              letterSpacing: "-0.035em",
              lineHeight: 0.95,
              color: render.ink,
              margin: 0,
            }}
          >
            {mode === "light" ? "Light." : "Dark."}
          </h3>
          <p
            className="mt-2 font-serif italic"
            style={{
              fontSize: 13,
              lineHeight: 1.4,
              color: render.inkMuted,
              margin: 0,
              maxWidth: "28ch",
            }}
          >
            {mode === "light"
              ? "Cream canvas. Ink headlines. Plain daylight."
              : "Near-black canvas. Luminous accents. Premium gradient."}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * PaletteStage — completely rebuilt for premium feel.
 *
 * Approach: drop the satellite-orbit dust entirely. Replace with:
 *   • One big focal glass orb (260px) with proper glass treatment
 *   • Atmospheric starfield — subtle palette-accent particles
 *     scattered, twinkling, no orbital mechanics
 *   • All 8 palettes shown as a chip rail at the bottom — every
 *     palette is reachable in one click, current one is highlighted
 *   • No prev/next + counter + dots ladder of redundant nav
 *   • Big italic serif name + tagline overlaid on the stage
 *
 * The orb is the design. Everything else is restraint.
 * ============================================================ */
function PaletteStage({
  palettes,
  index,
  setIndex,
  reduced,
}: {
  palettes: Palette[];
  index: number | null;
  setIndex: (i: number) => void;
  reduced: boolean;
}) {
  const displayIndex = index ?? 0;
  const palette = palettes[displayIndex];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.65, delay: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative flex-1 rounded-3xl overflow-hidden"
      style={{ minHeight: 640 }}
    >
      {/* Layer 1 — deep canvas */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, #0c0a14 0%, #06060a 100%)",
        }}
      />

      {/* Layer 2 — atmospheric accent bloom (top) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 65% 50% at 50% 30%, ${palette.accent}22, transparent 75%)`,
        }}
      />

      {/* Layer 3 — atmospheric accent bloom (bottom soft) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 30% at 50% 95%, ${palette.accent}1a, transparent 70%)`,
        }}
      />

      {/* Layer 4 — twinkling starfield (palette accent particles) */}
      <Starfield accent={palette.accent} reduced={reduced} />

      {/* Layer 5 — hairline ghost edge */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{ border: "1px solid rgba(255,255,255,0.05)" }}
      />

      {/* Composition */}
      <div
        className="relative h-full flex flex-col"
        style={{ padding: "48px 40px 32px" }}
      >
        {/* Orb stage — single focal element, no satellites,
            generous breathing room above and below */}
        <div className="relative flex items-center justify-center" style={{ height: 360 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={palette.id}
              initial={
                reduced
                  ? false
                  : { opacity: 0, scale: 0.78, filter: "blur(12px)" }
              }
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={
                reduced
                  ? undefined
                  : { opacity: 0, scale: 1.12, filter: "blur(10px)" }
              }
              transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
              className="relative"
            >
              <PremiumOrb color={palette.accent} reduced={reduced} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Name + tagline — generous space above */}
        <div className="relative text-center mt-10 min-h-[92px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={palette.id}
              initial={
                reduced ? false : { opacity: 0, y: 12, filter: "blur(5px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <h3
                className="font-serif italic"
                style={{
                  fontSize: 46,
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.02,
                  color: "rgba(245,240,230,0.97)",
                  margin: 0,
                }}
              >
                {palette.name}
              </h3>
              <p
                className="mt-2.5 font-serif italic"
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.45,
                  color: "rgba(245,240,230,0.5)",
                  margin: 0,
                }}
              >
                {palette.tagline}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Palette rail — all 8 palettes as clickable chips. This
            replaces prev/next/counter/dots with a single elegant
            row. Each chip is a small glass orb in that palette's
            primary accent. The current one is wider with an
            accent glow underneath. */}
        <div className="relative mt-auto pt-10">
          <div className="flex items-center justify-center gap-3">
            {palettes.map((p, i) => {
              const isCurrent = i === displayIndex;
              return (
                <PaletteChip
                  key={p.id}
                  color={p.accent}
                  isCurrent={isCurrent}
                  onClick={() => setIndex(i)}
                  label={p.name}
                />
              );
            })}
          </div>
          {/* Tiny position label beneath the rail */}
          <div className="mt-4 text-center">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(245,240,230,0.32)",
              }}
            >
              {String(displayIndex + 1).padStart(2, "0")} of {String(palettes.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
 * Starfield — atmospheric accent particles. Static positions,
 * subtle individual twinkle. Looks like accent-colored stardust.
 * ============================================================ */
const STAR_POSITIONS = [
  { x: 12, y: 18, size: 2.5, delay: 0 },
  { x: 88, y: 12, size: 3, delay: 0.8 },
  { x: 22, y: 65, size: 2, delay: 1.6 },
  { x: 78, y: 72, size: 2.5, delay: 0.4 },
  { x: 6, y: 42, size: 2, delay: 2.2 },
  { x: 94, y: 48, size: 3, delay: 1.2 },
  { x: 30, y: 8, size: 2, delay: 1.8 },
  { x: 68, y: 88, size: 2, delay: 0.6 },
  { x: 45, y: 6, size: 2, delay: 2.5 },
  { x: 55, y: 92, size: 2.5, delay: 1.0 },
];

function Starfield({
  accent,
  reduced,
}: {
  accent: string;
  reduced: boolean;
}) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {STAR_POSITIONS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          animate={
            reduced
              ? { opacity: 0.5 }
              : { opacity: [0.25, 0.75, 0.25] }
          }
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: accent,
            boxShadow: `0 0 ${s.size * 3}px ${accent}aa, 0 0 ${s.size * 6}px ${accent}55`,
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
 * PaletteChip — small clickable glass orb in palette accent.
 * Current one is bigger + has a glow underline.
 * ============================================================ */
function PaletteChip({
  color,
  isCurrent,
  onClick,
  label,
}: {
  color: string;
  isCurrent: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative grid place-items-center transition-all duration-300"
      style={{
        height: 36,
        width: isCurrent ? 36 : 18,
      }}
    >
      <span
        className="block rounded-full transition-all duration-300"
        style={{
          width: isCurrent ? 30 : 14,
          height: isCurrent ? 30 : 14,
          background: `
            radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 32%),
            radial-gradient(circle at 70% 76%, rgba(0,0,0,0.4), transparent 38%),
            ${color}
          `,
          boxShadow: isCurrent
            ? `0 8px 22px -4px ${color}cc, 0 0 0 1px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.25)`
            : `0 4px 12px -3px ${color}66, 0 0 0 1px rgba(255,255,255,0.06)`,
        }}
      />
      {/* Glow underline for current */}
      {isCurrent && (
        <span
          aria-hidden
          className="absolute"
          style={{
            bottom: -8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 28,
            height: 2,
            borderRadius: 1,
            background: color,
            boxShadow: `0 0 10px ${color}, 0 0 18px ${color}88`,
          }}
        />
      )}
    </button>
  );
}

/* ============================================================
 * PremiumOrb — the singular focal element of the stage.
 *
 * Premium treatment for a believable glass sphere:
 *   • Outer ambient halo (large soft glow that breathes)
 *   • Inner halo (sharper bloom hugging the sphere)
 *   • Rim light glow (subtle bright ring tracing the silhouette)
 *   • Ground shadow (elliptical blur beneath, suggests a surface)
 *   • Body: layered radial gradients for specular + body + shadow
 *   • Top specular: bright tight highlight at ~30% 26%
 *   • Secondary specular: smaller, softer just below
 *   • Internal slow rotation of a subtle highlight (liquid feel)
 *   • Bottom inset shadow (gravity)
 *   • Inset top highlight (rim of glass at top)
 * ============================================================ */
function PremiumOrb({ color, reduced }: { color: string; reduced: boolean }) {
  return (
    <div className="relative" style={{ width: 260, height: 260 }}>
      {/* Ground shadow — elliptical blur beneath, gives weight */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          bottom: -28,
          transform: "translateX(-50%)",
          width: 200,
          height: 36,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)`,
          filter: "blur(14px)",
        }}
      />

      {/* Outer atmospheric halo — breathes */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        animate={
          reduced
            ? { opacity: 0.55 }
            : { opacity: [0.45, 0.7, 0.45], scale: [1, 1.1, 1] }
        }
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          inset: -60,
          background: `radial-gradient(circle, ${color}55, transparent 65%)`,
          filter: "blur(36px)",
        }}
      />

      {/* Inner halo — sharper, sits closer to the orb */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -18,
          background: `radial-gradient(circle, ${color}60, transparent 68%)`,
          filter: "blur(14px)",
        }}
      />

      {/* The orb body — premium glass via stacked radial gradients */}
      <motion.div
        aria-hidden
        animate={reduced ? undefined : { scale: [1, 1.025, 1] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 30% 26%, rgba(255,255,255,0.6), transparent 28%),
            radial-gradient(circle at 25% 22%, rgba(255,255,255,0.95), transparent 8%),
            radial-gradient(circle at 72% 78%, rgba(0,0,0,0.5), transparent 36%),
            radial-gradient(circle at 50% 50%, ${color} 0%, ${color} 65%, rgba(0,0,0,0.15) 100%)
          `,
          boxShadow: `
            0 36px 80px -16px ${color}d0,
            0 0 0 1px rgba(255,255,255,0.12),
            inset 0 -12px 28px rgba(0,0,0,0.35),
            inset 0 8px 16px rgba(255,255,255,0.18),
            inset 0 0 0 1px rgba(255,255,255,0.06)
          `,
        }}
      />

      {/* Slow rotating liquid highlight — gives the orb internal
          motion so it doesn't look like a static flat circle */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div
          className="absolute"
          style={{
            inset: 0,
            background: `radial-gradient(ellipse 70% 40% at 60% 40%, rgba(255,255,255,0.13), transparent 60%)`,
            mixBlendMode: "screen",
          }}
        />
      </motion.div>

      {/* Rim light — a faint bright ring around the perimeter */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 0 18px ${color}aa`,
        }}
      />

      {/* Top specular bright spot — the smallest, brightest highlight */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "16%",
          left: "30%",
          width: 36,
          height: 22,
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.85), transparent 70%)",
          filter: "blur(4px)",
        }}
      />
    </div>
  );
}

/* ============================================================
 * Icons
 * ============================================================ */
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
