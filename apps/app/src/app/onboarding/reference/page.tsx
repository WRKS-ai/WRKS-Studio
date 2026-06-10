"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
// Two decisions, one screen:
//   1. Theme (light vs dark) — two big tiles, each rendered IN the
//      theme they represent so the choice is visually literal.
//   2. Palette — 8 curated palettes shown as stacked color studies
//      (primary swatch + 3 supporting + name + tagline).
//
// The combination drives the visual identity of every deliverable the
// agent makes from this point on. Each palette also carries a copy
// brief, so picking a palette tells Claude HOW to write — not just
// HOW it should look.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const INTAKE_KEY = "wrks-onboarding-intake";
const THEME_KEY = "wrks-onboarding-theme";
const PALETTE_KEY = "wrks-onboarding-palette";

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

    // Hydrate draft picks if user came back to this page
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
    <OnboardingFrame step={4} totalSteps={5} bloomTint={agentAccent}>
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

        {/* Header — hero + intro */}
        <div
          className="mt-12 grid gap-x-12 lg:gap-x-16 gap-y-8 items-end"
          style={{
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          }}
        >
          <motion.h1
            initial={
              reduced ? false : { opacity: 0, y: 14, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif"
            style={{
              fontSize: "clamp(3rem, 5.4vw, 5.25rem)",
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.035em",
              color: "rgba(245,240,230,0.97)",
              margin: 0,
            }}
          >
            Set the look.
          </motion.h1>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
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

        {/* MODE TILES — light vs dark, each rendered IN that theme */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
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
            />
            <ModeTile
              mode="dark"
              palette={palette}
              selected={theme === "dark"}
              onSelect={() => setTheme("dark")}
              reduced={!!reduced}
            />
          </div>
        </motion.div>

        {/* PALETTE GRID — 8 curated palettes */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
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
          transition={{ duration: 0.5, delay: 0.6 }}
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
          transition={{ duration: 0.6, delay: 0.7 }}
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
 * Small section label (01 — Mode, 02 — Palette)
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
 * ModeTile — big tile rendered IN the mode it represents.
 * Light tile actually looks like the light theme; dark tile actually
 * looks like the dark theme. Click to select.
 * If a palette is also picked, the tile uses that palette's colors.
 * ============================================================ */
function ModeTile({
  mode,
  palette,
  selected,
  onSelect,
  reduced,
}: {
  mode: Theme;
  palette: Palette | null;
  selected: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  // Use the picked palette's render if available, otherwise a sensible
  // neutral default so the tile previews convincingly even before the
  // user picks a palette.
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
      initial={reduced ? false : { opacity: 0, y: 14, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      whileHover={reduced ? undefined : { y: -3 }}
      whileTap={{ scale: 0.99 }}
      className="relative text-left rounded-3xl overflow-hidden cursor-pointer"
      style={{
        background: render.bg,
        border: selected ? `2px solid ${accent}` : "1px solid rgba(255,255,255,0.08)",
        boxShadow: selected
          ? `0 0 0 5px ${accent}22, 0 26px 60px -20px ${accent}55, 0 22px 50px -18px rgba(0,0,0,0.55)`
          : "0 22px 50px -22px rgba(0,0,0,0.55)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        padding: "32px 32px 28px",
        minHeight: 230,
      }}
    >
      {/* Eyebrow + selection indicator */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] tracking-[0.32em] uppercase"
          style={{
            color: render.inkMuted,
            fontFamily: "var(--font-mono)",
          }}
        >
          {mode === "light" ? "Daylight" : "After dark"}
        </span>
        <div
          className="size-7 rounded-full grid place-items-center"
          style={{
            background: selected ? accent : "transparent",
            border: selected ? "1px solid rgba(255,255,255,0.5)" : `1px solid ${render.rim}`,
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}
        >
          {selected && <CheckIcon />}
        </div>
      </div>

      {/* Big serif label */}
      <h3
        className="mt-6 font-serif"
        style={{
          fontSize: 64,
          fontWeight: 500,
          letterSpacing: "-0.035em",
          lineHeight: 0.95,
          color: render.ink,
          margin: 0,
        }}
      >
        {mode === "light" ? "Light." : "Dark."}
      </h3>

      {/* Tagline + sample accent line */}
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

      {/* Accent dot row — shows the accent color preview */}
      <div className="mt-6 flex items-center gap-2">
        <span
          className="block size-2.5 rounded-full"
          style={{ background: accent }}
        />
        <span
          className="block h-px flex-1"
          style={{ background: render.rim }}
        />
        <span
          className="text-[10px] tracking-[0.28em] uppercase"
          style={{
            color: render.inkMuted,
            fontFamily: "var(--font-mono)",
          }}
        >
          {mode}
        </span>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * PaletteCard — the picker tile for one palette. Shows the
 * primary accent as a large orb, 3 supporting swatches beneath,
 * name + tagline. Selected state glows in the palette's accent.
 * If a theme is picked, the card preview reflects that theme.
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
  // Card surface adapts to theme choice if there is one; otherwise
  // we use a neutral dark surface (matches the rest of the onboarding
  // chrome).
  const render = theme
    ? theme === "light"
      ? palette.light
      : palette.dark
    : palette.dark;
  const isLight = theme === "light";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={reduced ? false : { opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.45,
        delay: 0.45 + index * 0.04,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      whileHover={reduced ? undefined : { y: -3 }}
      whileTap={{ scale: 0.99 }}
      className="relative text-left rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: render.bg,
        border: selected
          ? `2px solid ${palette.accent}`
          : `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
        boxShadow: selected
          ? `0 0 0 5px ${palette.accent}22, 0 22px 50px -18px ${palette.accent}55, 0 18px 36px -18px rgba(0,0,0,0.55)`
          : "0 18px 36px -22px rgba(0,0,0,0.55)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        padding: "22px 22px 20px",
        minHeight: 240,
      }}
    >
      {/* Selection chip */}
      <div className="absolute top-3 right-3">
        <motion.div
          animate={{ scale: selected ? 1 : 0.92 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
          className="size-7 rounded-full grid place-items-center"
          style={{
            background: selected ? palette.accent : "transparent",
            border: selected
              ? "1px solid rgba(255,255,255,0.5)"
              : `1px solid ${render.rim}`,
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}
        >
          {selected && <CheckIcon />}
        </motion.div>
      </div>

      {/* Primary swatch — large orb */}
      <div className="flex items-end gap-3">
        <span
          className="block rounded-full shrink-0"
          style={{
            width: 64,
            height: 64,
            background: palette.accent,
            boxShadow: `0 8px 24px -8px ${palette.accent}aa, inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.25)`,
          }}
        />
        {/* 3 supporting swatches stacked vertically */}
        <div className="flex flex-col gap-1.5 pb-1">
          {palette.supporting.map((c, i) => (
            <span
              key={i}
              className="block rounded-full"
              style={{
                width: 16,
                height: 16,
                background: c,
                boxShadow: `inset 0 -1px 2px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.2)`,
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

      {/* Tiny accent line at bottom */}
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
    </motion.button>
  );
}

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
