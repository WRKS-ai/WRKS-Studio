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
 * PaletteStage — boundary-less atmospheric composition. The orb
 * is the hero; satellites drift at varied depths and speeds; the
 * name floats below in italic serif; navigation is editorial
 * typography at the bottom.
 *
 * No card border. No dashed orbit ring. No glass arrow buttons.
 * Just composition + typography.
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

  const onPrev = () =>
    setIndex((displayIndex - 1 + palettes.length) % palettes.length);
  const onNext = () => setIndex((displayIndex + 1) % palettes.length);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.65, delay: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative flex-1"
      style={{ minHeight: 460 }}
    >
      {/* The stage — atmospheric backdrop, no hard boundary. A
          radial vignette that traces the orb gives it spatial
          weight without being a box. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 42%, ${palette.accent}1f, transparent 75%)`,
        }}
      />
      {/* Hairline ghost edge — barely visible, gives the section a
          subtle frame without reading as a "card". */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      />

      {/* Composition layer */}
      <div
        className="relative h-full flex flex-col"
        style={{ padding: "32px 32px 28px" }}
      >
        {/* Orb stage */}
        <div className="relative flex-1 flex items-center justify-center">
          {/* Independent satellites — each drifts on its own orbit,
              radius, and phase. Not on a shared ring. */}
          {palette.supporting.map((c, i) => (
            <DriftingSatellite
              key={`${palette.id}-${i}`}
              color={c}
              index={i}
              reduced={reduced}
            />
          ))}

          {/* Central primary orb */}
          <AnimatePresence mode="wait">
            <motion.div
              key={palette.id}
              initial={
                reduced
                  ? false
                  : { opacity: 0, scale: 0.7, filter: "blur(10px)" }
              }
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={
                reduced
                  ? undefined
                  : { opacity: 0, scale: 1.2, filter: "blur(12px)" }
              }
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              className="relative"
            >
              <CentralOrb color={palette.accent} reduced={reduced} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Palette name — italic serif, editorial */}
        <div className="relative text-center min-h-[88px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={palette.id}
              initial={
                reduced
                  ? false
                  : { opacity: 0, y: 12, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <h3
                className="font-serif italic"
                style={{
                  fontSize: 40,
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
                className="mt-2 font-serif italic"
                style={{
                  fontSize: 14,
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

        {/* Editorial navigation row — ghost typography arrows + position */}
        <div className="relative mt-6 grid grid-cols-3 items-center">
          <EditorialNavLink direction="prev" onClick={onPrev}>
            Previous
          </EditorialNavLink>

          <PositionCounter
            current={displayIndex + 1}
            total={palettes.length}
            accent={palette.accent}
          />

          <EditorialNavLink direction="next" onClick={onNext}>
            Next
          </EditorialNavLink>
        </div>

        {/* Position dots — very small, very quiet */}
        <div className="relative mt-4 flex items-center justify-center gap-1.5">
          {palettes.map((p, i) => {
            const isCurrent = i === displayIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                className="block transition-all duration-300"
                style={{
                  width: isCurrent ? 18 : 4,
                  height: 4,
                  borderRadius: 2,
                  background: isCurrent
                    ? palette.accent
                    : "rgba(255,255,255,0.16)",
                  boxShadow: isCurrent
                    ? `0 0 10px ${palette.accent}aa`
                    : undefined,
                }}
                aria-label={`Palette ${i + 1} of ${palettes.length}: ${p.name}`}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
 * DriftingSatellite — small swatch floating at its own orbital
 * radius, angle, and speed. NOT on a shared ring. Each is
 * configured slightly differently so the composition feels alive.
 * ============================================================ */
const SATELLITE_CONFIGS = [
  // [base angle deg, radius px, size px, duration s]
  { angle: -42, radius: 165, size: 22, duration: 18 },
  { angle: 38, radius: 195, size: 16, duration: 24 },
  { angle: 175, radius: 175, size: 18, duration: 21 },
];

function DriftingSatellite({
  color,
  index,
  reduced,
}: {
  color: string;
  index: number;
  reduced: boolean;
}) {
  const cfg = SATELLITE_CONFIGS[index] ?? SATELLITE_CONFIGS[0];

  // Each satellite slowly rotates around the center on its own loop.
  // We use a wrapper that rotates, with the satellite positioned at
  // the configured radius. Then a small inner drift adds organic motion.
  return (
    <motion.div
      aria-hidden
      className="absolute"
      style={{
        top: "50%",
        left: "50%",
        width: 0,
        height: 0,
      }}
      animate={
        reduced
          ? undefined
          : { rotate: [cfg.angle, cfg.angle + 360] }
      }
      transition={{
        duration: cfg.duration,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: cfg.radius,
          top: 0,
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          animate={
            reduced
              ? undefined
              : {
                  scale: [1, 1.18, 1],
                  y: [0, -3, 0],
                }
          }
          transition={{
            duration: 3.4 + index * 0.6,
            repeat: Infinity,
            delay: index * 0.9,
            ease: "easeInOut",
          }}
          className="rounded-full"
          style={{
            width: cfg.size,
            height: cfg.size,
            background: `
              radial-gradient(circle at 30% 28%, rgba(255,255,255,0.6), transparent 32%),
              radial-gradient(circle at 70% 75%, rgba(0,0,0,0.35), transparent 40%),
              ${color}
            `,
            boxShadow: `0 8px 20px -4px ${color}aa, 0 0 0 1px rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.25)`,
          }}
        />
      </div>
    </motion.div>
  );
}

/* ============================================================
 * CentralOrb — bigger now (200px) with stronger atmospheric halo.
 * ============================================================ */
function CentralOrb({
  color,
  reduced,
}: {
  color: string;
  reduced: boolean;
}) {
  return (
    <div className="relative">
      {/* Outer atmospheric glow */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        animate={
          reduced
            ? { opacity: 0.6 }
            : { opacity: [0.5, 0.75, 0.5], scale: [1, 1.12, 1] }
        }
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          inset: -48,
          background: `radial-gradient(circle, ${color}66, transparent 65%)`,
          filter: "blur(28px)",
        }}
      />
      {/* Inner halo */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -16,
          background: `radial-gradient(circle, ${color}55, transparent 70%)`,
          filter: "blur(10px)",
        }}
      />
      {/* The orb */}
      <motion.div
        aria-hidden
        animate={reduced ? undefined : { scale: [1, 1.035, 1] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-full"
        style={{
          width: 200,
          height: 200,
          background: `
            radial-gradient(circle at 30% 26%, rgba(255,255,255,0.55), transparent 32%),
            radial-gradient(circle at 70% 76%, rgba(0,0,0,0.42), transparent 38%),
            ${color}
          `,
          boxShadow: `
            0 30px 70px -16px ${color}cc,
            0 0 0 1px rgba(255,255,255,0.1),
            inset 0 -8px 18px rgba(0,0,0,0.3),
            inset 0 6px 12px rgba(255,255,255,0.2)
          `,
        }}
      />
    </div>
  );
}

/* ============================================================
 * EditorialNavLink — ghost text arrow. Hover: subtle lift +
 * accent shimmer. No buttons-y treatment. Reads as editorial copy.
 * ============================================================ */
function EditorialNavLink({
  direction,
  onClick,
  children,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2.5 transition-all duration-300"
      style={{
        justifySelf: isPrev ? "start" : "end",
        color: "rgba(245,240,230,0.42)",
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
      }}
      aria-label={`${children} palette`}
    >
      {isPrev && <ArrowGlyph direction="left" />}
      <span className="transition-colors group-hover:text-[rgba(245,240,230,0.85)]">
        {children}
      </span>
      {!isPrev && <ArrowGlyph direction="right" />}
    </button>
  );
}

function ArrowGlyph({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="10"
      viewBox="0 0 24 12"
      fill="none"
      aria-hidden
      style={{
        color: "currentColor",
        transform: direction === "right" ? undefined : "scaleX(-1)",
      }}
      className="transition-transform duration-300 group-hover:translate-x-0.5"
    >
      <path
        d="M2 6h20m0 0l-5-5m5 5l-5 5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PositionCounter({
  current,
  total,
  accent,
}: {
  current: number;
  total: number;
  accent: string;
}) {
  return (
    <div
      className="text-center"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ color: accent, opacity: 0.9 }}>
        {String(current).padStart(2, "0")}
      </span>
      <span style={{ color: "rgba(245,240,230,0.22)", margin: "0 8px" }}>
        /
      </span>
      <span style={{ color: "rgba(245,240,230,0.42)" }}>
        {String(total).padStart(2, "0")}
      </span>
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
