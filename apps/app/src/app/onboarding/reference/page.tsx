"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
// Two-column layout:
//   LEFT  — vertical stack of 2 minimal premium glass cards (Light, Dark)
//   RIGHT — orbital palette picker: big central primary orb, 3 supporting
//           swatches orbiting around it, glass left/right arrows to cycle,
//           position dots at the bottom.
//
// The orbit is the wow component — continuous slow rotation + each
// swatch has its own subtle floating motion + the central orb breathes.
// Glass arrow buttons feel tactile. Dot indicators show position in
// the 8-palette cycle.

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

  // Keyboard nav for the palette carousel
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

        {/* Two-column body: theme stack on left, palette orbital on right */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-12 grid gap-6 lg:gap-8"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.25fr)",
          }}
        >
          {/* LEFT — Theme stack */}
          <div className="flex flex-col gap-5">
            <SectionLabel>01 — Mode</SectionLabel>
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

          {/* RIGHT — Palette orbital picker */}
          <div className="flex flex-col gap-5">
            <SectionLabel>02 — Palette</SectionLabel>
            <PaletteOrbital
              palettes={PALETTES}
              index={paletteIndex}
              setIndex={setPaletteIndex}
              theme={theme}
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
 * StaggeredHeadline — letter-by-letter reveal with blur + lift.
 * ============================================================ */
function StaggeredHeadline({
  text,
  reduced,
}: {
  text: string;
  reduced: boolean;
}) {
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
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </h1>
  );
}

/* ============================================================
 * SectionLabel
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
 * ThemeCard — premium minimal glass card. Stacked vertically.
 * Renders the theme with a glass + accent-bleed treatment so it
 * literally looks like the mode it represents.
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
    >
      {/* Layer 1 — theme bg */}
      <div className="absolute inset-0" style={{ background: render.bg }} />

      {/* Layer 2 — accent bleed gradient */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 100% 100%, ${accent}33, transparent 70%)`,
        }}
      />

      {/* Layer 3 — specular top highlight */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-20 pointer-events-none"
        style={{
          background:
            mode === "dark"
              ? "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)"
              : "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.5), transparent 70%)",
        }}
      />

      {/* Layer 4 — border */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          border: selected
            ? `2px solid ${accent}`
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: selected
            ? `0 0 0 5px ${accent}22, 0 26px 50px -20px ${accent}66, 0 18px 40px -18px rgba(0,0,0,0.55)`
            : "0 18px 40px -22px rgba(0,0,0,0.55)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      />

      {/* Layer 5 — selection burst */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="burst"
            initial={{ opacity: 0.9, scale: 0.96 }}
            animate={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              border: `2px solid ${accent}`,
              boxShadow: `0 0 60px ${accent}aa`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        className="relative h-full flex flex-col justify-between"
        style={{ padding: "26px 28px 24px" }}
      >
        {/* Top row — eyebrow + check */}
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
              boxShadow: selected ? `0 4px 12px -2px ${accent}88` : undefined,
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
          >
            {selected && <CheckIcon />}
          </motion.div>
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
 * PaletteOrbital — the wow component. Big central primary orb
 * + 3 supporting swatches orbiting around it + glass left/right
 * arrow buttons + 8-position dot indicator.
 *
 * Continuous slow rotation (24s/revolution) with each swatch also
 * gently floating in/out on its own sin cycle for an organic feel.
 * The central orb breathes (4.5s pulse).
 * ============================================================ */
function PaletteOrbital({
  palettes,
  index,
  setIndex,
  theme,
  reduced,
}: {
  palettes: Palette[];
  index: number | null;
  setIndex: (i: number) => void;
  theme: Theme | null;
  reduced: boolean;
}) {
  // Default to first palette if nothing picked yet — but treat that as
  // "not selected" until the user actually interacts. Once the user
  // touches an arrow or clicks "Pick this", we treat it as selected.
  const displayIndex = index ?? 0;
  const palette = palettes[displayIndex];
  const render = theme
    ? theme === "light"
      ? palette.light
      : palette.dark
    : palette.dark;
  const isLight = theme === "light";

  const onPrev = () =>
    setIndex((displayIndex - 1 + palettes.length) % palettes.length);
  const onNext = () => setIndex((displayIndex + 1) % palettes.length);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.65,
        delay: 0.7,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className="relative rounded-3xl overflow-hidden flex-1"
      style={{ minHeight: 420 }}
    >
      {/* Layer 1 — theme bg */}
      <div className="absolute inset-0" style={{ background: render.bg }} />

      {/* Layer 2 — accent ambient bleed */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 40%, ${palette.accent}33, transparent 70%)`,
        }}
      />

      {/* Layer 3 — specular top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.5), transparent 70%)"
            : "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)",
        }}
      />

      {/* Layer 4 — border (selected state when user has picked a palette) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          border:
            index !== null
              ? `2px solid ${palette.accent}`
              : `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
          boxShadow:
            index !== null
              ? `0 0 0 5px ${palette.accent}22, 0 30px 60px -20px ${palette.accent}66, 0 22px 50px -18px rgba(0,0,0,0.55)`
              : "0 22px 50px -22px rgba(0,0,0,0.55)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col" style={{ padding: 28 }}>
        {/* Orbit stage */}
        <div className="relative flex-1 flex items-center justify-center">
          {/* Faint orbit ring */}
          <div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 280,
              height: 280,
              border: `1px dashed ${render.rim}`,
              opacity: 0.45,
            }}
          />

          {/* Orbiting group — rotates continuously */}
          <motion.div
            className="absolute"
            style={{ width: 280, height: 280 }}
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {palette.supporting.map((c, i) => {
              const angle = (i / palette.supporting.length) * 360;
              return (
                <OrbitingSwatch
                  key={`${palette.id}-${i}`}
                  color={c}
                  angle={angle}
                  index={i}
                  reduced={reduced}
                />
              );
            })}
          </motion.div>

          {/* Central primary orb — animates color on palette change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={palette.id}
              initial={
                reduced
                  ? false
                  : { opacity: 0, scale: 0.6, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={
                reduced
                  ? undefined
                  : { opacity: 0, scale: 1.15, filter: "blur(10px)" }
              }
              transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
              className="relative"
            >
              <CentralOrb color={palette.accent} reduced={reduced} />
            </motion.div>
          </AnimatePresence>

          {/* LEFT arrow — glass pill */}
          <GlassArrowButton
            direction="left"
            onClick={onPrev}
            isLight={isLight}
            inkMuted={render.inkMuted}
            rim={render.rim}
          />
          {/* RIGHT arrow — glass pill */}
          <GlassArrowButton
            direction="right"
            onClick={onNext}
            isLight={isLight}
            inkMuted={render.inkMuted}
            rim={render.rim}
          />
        </div>

        {/* Palette name + tagline (animates on palette change) */}
        <div className="relative text-center min-h-[68px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={palette.id}
              initial={
                reduced ? false : { opacity: 0, y: 8, filter: "blur(4px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <h3
                className="font-serif"
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                  color: render.ink,
                  margin: 0,
                }}
              >
                {palette.name}
              </h3>
              <p
                className="mt-1 font-serif italic"
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.45,
                  color: render.inkMuted,
                  margin: 0,
                }}
              >
                {palette.tagline}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Position dots */}
        <div className="relative mt-5 flex items-center justify-center gap-1.5">
          {palettes.map((p, i) => {
            const isCurrent = i === displayIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                className="block transition-all duration-300"
                style={{
                  width: isCurrent ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: isCurrent
                    ? palette.accent
                    : isLight
                      ? "rgba(0,0,0,0.18)"
                      : "rgba(255,255,255,0.18)",
                  boxShadow: isCurrent ? `0 0 10px ${palette.accent}aa` : undefined,
                }}
                aria-label={`Palette ${i + 1} of ${palettes.length}: ${p.name}`}
              />
            );
          })}
        </div>

        {/* Position counter (small) */}
        <div className="relative mt-3 text-center">
          <span
            className="text-[9.5px] tracking-[0.32em] uppercase tabular-nums"
            style={{
              color: render.inkMuted,
              fontFamily: "var(--font-mono)",
            }}
          >
            {String(displayIndex + 1).padStart(2, "0")} / {String(palettes.length).padStart(2, "0")} · use ← →
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
 * OrbitingSwatch — one of the 3 supporting colors. Positioned at
 * a fixed angle on the orbit ring; the parent rotates the whole
 * group. Each swatch also floats subtly in/out on its own.
 * ============================================================ */
function OrbitingSwatch({
  color,
  angle,
  index,
  reduced,
}: {
  color: string;
  angle: number;
  index: number;
  reduced: boolean;
}) {
  // Offsets so the 3 swatches don't all breathe in sync
  const phaseDelay = index * 1.4;
  return (
    <div
      className="absolute"
      style={{
        top: "50%",
        left: "50%",
        // Place at angle on a 280px-diameter orbit ring (radius 140)
        transform: `rotate(${angle}deg) translate(140px) rotate(-${angle}deg) translate(-50%, -50%)`,
      }}
    >
      <motion.div
        animate={
          reduced
            ? undefined
            : { scale: [1, 1.18, 1], y: [0, -4, 0] }
        }
        transition={{
          duration: 3.6,
          repeat: Infinity,
          delay: phaseDelay,
          ease: "easeInOut",
        }}
        className="rounded-full"
        style={{
          width: 28,
          height: 28,
          background: `
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), transparent 35%),
            radial-gradient(circle at 70% 75%, rgba(0,0,0,0.3), transparent 40%),
            ${color}
          `,
          boxShadow: `0 8px 18px -4px ${color}aa, 0 0 0 1px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.2)`,
        }}
      />
    </div>
  );
}

/* ============================================================
 * CentralOrb — the big focal primary swatch. 3D radial gradients
 * + ambient pulse + breathing scale.
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
      {/* Outer ambient glow */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        animate={
          reduced
            ? { opacity: 0.6 }
            : { opacity: [0.45, 0.7, 0.45], scale: [1, 1.15, 1] }
        }
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          inset: -32,
          background: `radial-gradient(circle, ${color}77, transparent 65%)`,
          filter: "blur(18px)",
        }}
      />
      {/* Middle soft halo */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -10,
          background: `radial-gradient(circle, ${color}55, transparent 70%)`,
          filter: "blur(6px)",
        }}
      />
      {/* The orb */}
      <motion.div
        aria-hidden
        animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-full"
        style={{
          width: 140,
          height: 140,
          background: `
            radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 32%),
            radial-gradient(circle at 70% 75%, rgba(0,0,0,0.4), transparent 38%),
            ${color}
          `,
          boxShadow: `0 22px 50px -12px ${color}cc, 0 0 0 1px rgba(255,255,255,0.1), inset 0 -6px 12px rgba(0,0,0,0.25), inset 0 4px 8px rgba(255,255,255,0.18)`,
        }}
      />
    </div>
  );
}

/* ============================================================
 * GlassArrowButton — premium glass left/right navigation pill.
 * ============================================================ */
function GlassArrowButton({
  direction,
  onClick,
  isLight,
  inkMuted,
  rim,
}: {
  direction: "left" | "right";
  onClick: () => void;
  isLight: boolean;
  inkMuted: string;
  rim: string;
}) {
  const hoverX = useMotionValue(0);
  const x = useSpring(hoverX, { stiffness: 200, damping: 18 });

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => hoverX.set(direction === "right" ? 4 : -4)}
      onMouseLeave={() => hoverX.set(0)}
      whileTap={{ scale: 0.92 }}
      style={{
        x,
        position: "absolute",
        top: "50%",
        [direction]: 8,
        transform: "translateY(-50%)",
      }}
      className="grid place-items-center"
      aria-label={direction === "left" ? "Previous palette" : "Next palette"}
    >
      <div
        className="grid place-items-center rounded-full"
        style={{
          width: 48,
          height: 48,
          background: isLight
            ? "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
          border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.18)"}`,
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          boxShadow: isLight
            ? "0 8px 20px -6px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6)"
            : "0 8px 24px -6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          style={{
            color: inkMuted,
            transform: direction === "right" ? "scaleX(-1)" : undefined,
          }}
        >
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.button>
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
