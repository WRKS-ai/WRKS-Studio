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
// Single editorial column. No card wrapper. Three tiers:
//   1. APPEARANCE — two literal mini-window tiles (Light / Dark).
//      Each tile is a real mockup rendered in the active palette,
//      not an abstract toggle. Apple System Settings pattern.
//   2. PALETTE — a vertical LIST of 8 named rows. Each row:
//      glass-sphere dot + Fraunces name + one-line voice fingerprint.
//      Linear / Raycast / linear.style pattern. Never a swatch grid.
//   3. PREVIEW — full-width artifact reskinning live in the chosen
//      palette + mode. Shows the consequence of the choice.
//
// Hairline dividers between tiers. Generous negative space.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const INTAKE_KEY = "wrks-onboarding-intake";
const THEME_KEY = "wrks-onboarding-theme";
const PALETTE_KEY = "wrks-onboarding-palette";

const DEFAULT_PALETTE_INDEX = 1; // Royal violet — brand default

// Short voice fingerprints — one line per palette. Reference real
// brands the user can mentally hear.
const VOICE_FINGERPRINT: Record<string, string> = {
  "quiet-cream": "Aesop restraint. Long sentences, never run-on.",
  "royal-violet": "Linear tight. Declarative. Built for speed.",
  "sharp-mono": "Apple clean. Short fragments. Quiet confidence.",
  forest: "Patagonia honest. Mission-led. Names the river.",
  sunshine: "Off-White bold. CAPS allowed. Streetwear-ironic.",
  "soft-blush": "Glossier warm. Lowercase. Sensory and friendly.",
  "steel-blue": "Stripe calm. Technical. Adult confidence.",
  "workwear-brown": "Carhartt direct. Spec-led. No purple prose.",
};

export default function ReferencePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { accent: agentAccent } = useOnboardingAgent();

  const [personality, setPersonality] = useState<Personality | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [paletteIndex, setPaletteIndex] = useState<number>(
    DEFAULT_PALETTE_INDEX,
  );
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
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        setPaletteIndex((i) => (i + 1) % PALETTES.length);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        setPaletteIndex((i) => (i - 1 + PALETTES.length) % PALETTES.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!personality) return null;

  const palette = PALETTES[paletteIndex];
  const paletteId = palette.id;

  const onContinue = async (skipped: boolean) => {
    if (submitting) return;
    setSubmitting(true);

    if (skipped) {
      localStorage.removeItem(THEME_KEY);
      localStorage.removeItem(PALETTE_KEY);
    } else {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem(PALETTE_KEY, paletteId);
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
      bloomTint={palette.accent ?? agentAccent}
    >
      {/* Single editorial column, max 720px, generous top space */}
      <div
        className="relative mx-auto flex flex-col px-8 sm:px-10 py-12"
        style={{
          maxWidth: 720,
          minHeight: "calc(100vh - 120px)",
        }}
      >
        {/* === Eyebrow === */}
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

        {/* === Hero — left-aligned headline + intro === */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-10"
        >
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)",
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.038em",
              color: "rgba(245,240,230,0.97)",
              margin: 0,
            }}
          >
            Set the look<span style={{ color: palette.accent }}>.</span>
          </h1>
          <p
            className="font-sans"
            style={{
              fontSize: 15.5,
              lineHeight: 1.6,
              color: "rgba(245,240,230,0.6)",
              maxWidth: "56ch",
              margin: "28px 0 0",
            }}
          >
            Each palette is a complete identity — color, tone, sentence
            rhythm, and writing voice — that your agent uses for
            everything it makes next.
          </p>
        </motion.div>

        {/* === Tier 1: APPEARANCE === */}
        <TierDivider delay={0.42} />
        <motion.section
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <TierLabel>Appearance</TierLabel>
          <div
            className="mt-8 grid gap-5"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
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
        </motion.section>

        {/* === Tier 2: PALETTE === */}
        <TierDivider delay={0.6} />
        <motion.section
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.65, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <TierLabel>Palette</TierLabel>
          <div className="mt-8 flex flex-col">
            {PALETTES.map((p, i) => (
              <PaletteRow
                key={p.id}
                palette={p}
                fingerprint={VOICE_FINGERPRINT[p.id] ?? p.tagline}
                selected={i === paletteIndex}
                onSelect={() => setPaletteIndex(i)}
                reduced={!!reduced}
                index={i}
              />
            ))}
          </div>
        </motion.section>

        {/* === Tier 3: LIVE PREVIEW === */}
        <TierDivider delay={0.78} />
        <motion.section
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <TierLabel>Preview</TierLabel>
          <div className="mt-8">
            <LivePreview palette={palette} theme={theme} reduced={!!reduced} />
          </div>
        </motion.section>

        {/* === Actions === */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-16 flex items-center justify-between gap-6"
        >
          <button
            type="button"
            onClick={() => router.push("/onboarding/intake")}
            className="text-[10.5px] tracking-[0.32em] uppercase transition-opacity hover:opacity-80"
            style={{
              color: "rgba(245,240,230,0.42)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ← Back
          </button>

          <div className="flex flex-col items-end gap-3">
            <ContinueButton
              onClick={() => onContinue(false)}
              disabled={submitting}
            >
              Continue
              <span aria-hidden style={{ marginLeft: "0.7em" }}>
                →
              </span>
            </ContinueButton>
            <button
              type="button"
              onClick={() => onContinue(true)}
              disabled={submitting}
              className="text-[10.5px] tracking-[0.28em] uppercase transition-opacity hover:opacity-80 disabled:opacity-30"
              style={{
                color: "rgba(245,240,230,0.42)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Skip — use default
            </button>
          </div>
        </motion.div>
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * Small parts
 * ============================================================ */

function TierLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-block h-px w-6"
        style={{ background: "rgba(245,240,230,0.18)" }}
      />
      <span
        className="text-[10.5px] tracking-[0.36em] uppercase"
        style={{
          color: "rgba(245,240,230,0.46)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function TierDivider({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}
      style={{
        height: 1,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.08) 10%, rgba(255,255,255,0.08) 90%, rgba(255,255,255,0.0) 100%)",
        margin: "56px 0",
        transformOrigin: "left center",
      }}
    />
  );
}

/* ============================================================
 * ModeTile — literal mini-window mockup in the chosen palette.
 *
 * The whole tile renders in the active palette's actual colors so
 * the user sees the literal outcome of the mode choice. Active tile
 * gets a hairline ring + soft accent shadow.
 * ============================================================ */
function ModeTile({
  mode,
  palette,
  selected,
  onSelect,
  reduced,
}: {
  mode: Theme;
  palette: Palette;
  selected: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  const render = mode === "light" ? palette.light : palette.dark;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="relative rounded-2xl overflow-hidden text-left"
      style={{
        height: 168,
        background: render.bg,
        border: `1px solid ${
          selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)"
        }`,
        boxShadow: selected
          ? `0 0 0 1px rgba(255,255,255,0.06), 0 18px 40px -14px ${palette.accent}55, 0 8px 20px -8px rgba(0,0,0,0.5)`
          : "0 12px 28px -16px rgba(0,0,0,0.45)",
        transition: "border-color 0.3s ease, box-shadow 0.4s ease",
      }}
    >
      {/* Soft accent wash from bottom-right inside the tile */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 50% at 100% 100%, ${palette.accent}1f, transparent 70%)`,
        }}
      />

      {/* Tile chrome — mini browser bar */}
      <div
        className="relative flex items-center gap-1.5"
        style={{
          padding: "12px 14px",
          borderBottom: `1px solid ${render.rim}`,
        }}
      >
        <span
          aria-hidden
          className="inline-block rounded-full"
          style={{
            width: 7,
            height: 7,
            background:
              mode === "light"
                ? "rgba(0,0,0,0.16)"
                : "rgba(255,255,255,0.18)",
          }}
        />
        <span
          aria-hidden
          className="inline-block rounded-full"
          style={{
            width: 7,
            height: 7,
            background:
              mode === "light"
                ? "rgba(0,0,0,0.16)"
                : "rgba(255,255,255,0.18)",
          }}
        />
        <span
          aria-hidden
          className="inline-block rounded-full"
          style={{
            width: 7,
            height: 7,
            background:
              mode === "light"
                ? "rgba(0,0,0,0.16)"
                : "rgba(255,255,255,0.18)",
          }}
        />
        <span
          className="ml-auto"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: render.inkMuted,
          }}
        >
          {mode}
        </span>
      </div>

      {/* Tile body — sample content rendered in palette colors */}
      <div className="relative" style={{ padding: "18px 16px" }}>
        {/* Hero word */}
        <div
          className="font-serif"
          style={{
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            color: render.ink,
          }}
        >
          Maven<span style={{ color: palette.accent }}>.</span>
        </div>
        {/* Body lines — drawn as sample bars so the text doesn't
            compete with the section's real content */}
        <div className="mt-3 flex flex-col gap-1.5">
          <span
            aria-hidden
            className="block rounded-full"
            style={{
              height: 4,
              width: "82%",
              background: render.inkMuted,
              opacity: 0.32,
            }}
          />
          <span
            aria-hidden
            className="block rounded-full"
            style={{
              height: 4,
              width: "62%",
              background: render.inkMuted,
              opacity: 0.32,
            }}
          />
        </div>
        {/* Accent rule */}
        <span
          aria-hidden
          className="block rounded-full mt-4"
          style={{
            height: 2,
            width: 26,
            background: palette.accent,
          }}
        />
      </div>

      {/* Floating tag — name + selected ring */}
      <div
        className="absolute left-0 right-0 bottom-0 flex items-center justify-between"
        style={{ padding: "0 14px 12px" }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: render.inkMuted,
          }}
        >
          {mode === "light" ? "Daylight" : "After dark"}
        </span>
        {/* Selection ring */}
        <motion.span
          animate={{
            opacity: selected ? 1 : 0,
            scale: selected ? 1 : 0.7,
          }}
          transition={{ duration: 0.25 }}
          className="grid place-items-center rounded-full"
          style={{
            width: 16,
            height: 16,
            border: `1.5px solid ${palette.accent}`,
            boxShadow: `0 0 10px ${palette.accent}66`,
          }}
        >
          <span
            aria-hidden
            className="rounded-full"
            style={{
              width: 7,
              height: 7,
              background: palette.accent,
            }}
          />
        </motion.span>
      </div>
    </motion.button>
  );
}

/* ============================================================
 * PaletteRow — single row in the vertical palette list.
 *
 * Layout: [glass-sphere dot] [name + voice fingerprint stacked]
 * No fill / no checkmark when selected — instead a hairline ring
 * around the row + a subtle accent halo. Linear/Raycast pattern.
 * ============================================================ */
function PaletteRow({
  palette,
  fingerprint,
  selected,
  onSelect,
  reduced,
  index,
}: {
  palette: Palette;
  fingerprint: string;
  selected: boolean;
  onSelect: () => void;
  reduced: boolean;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={reduced ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.7 + index * 0.04,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className="relative w-full text-left rounded-2xl group"
      style={{
        padding: "18px 20px",
        background: selected
          ? "rgba(255,255,255,0.025)"
          : "rgba(255,255,255,0)",
        border: `1px solid ${
          selected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0)"
        }`,
        boxShadow: selected
          ? `0 12px 28px -16px ${palette.accent}88`
          : "none",
        transition:
          "background 0.3s ease, border-color 0.3s ease, box-shadow 0.4s ease",
      }}
    >
      <div className="flex items-center gap-5">
        {/* Glass sphere dot */}
        <motion.span
          aria-hidden
          animate={{ scale: selected ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="block rounded-full shrink-0"
          style={{
            width: 32,
            height: 32,
            background: `
              radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 32%),
              radial-gradient(circle at 70% 78%, rgba(0,0,0,0.42), transparent 38%),
              ${palette.accent}
            `,
            boxShadow: selected
              ? `0 0 22px ${palette.accent}aa, 0 6px 14px -4px ${palette.accent}cc, inset 0 -2px 4px rgba(0,0,0,0.3)`
              : `0 4px 12px -4px ${palette.accent}77, inset 0 -2px 4px rgba(0,0,0,0.25)`,
          }}
        />

        {/* Name + fingerprint */}
        <div className="min-w-0 flex-1">
          <div
            className="font-serif"
            style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.022em",
              lineHeight: 1.05,
              color: selected
                ? "rgba(245,240,230,0.97)"
                : "rgba(245,240,230,0.78)",
              transition: "color 0.25s ease",
            }}
          >
            {palette.name}
          </div>
          <p
            className="font-sans"
            style={{
              fontSize: 13.5,
              lineHeight: 1.45,
              color: selected
                ? "rgba(245,240,230,0.6)"
                : "rgba(245,240,230,0.42)",
              margin: "8px 0 0",
              transition: "color 0.25s ease",
            }}
          >
            {fingerprint}
          </p>
        </div>

        {/* Trailing — accent rule, only visible when selected */}
        <motion.span
          aria-hidden
          animate={{
            opacity: selected ? 1 : 0,
            width: selected ? 22 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="block rounded-full shrink-0"
          style={{
            height: 2,
            background: palette.accent,
            boxShadow: `0 0 8px ${palette.accent}99`,
          }}
        />
      </div>
    </motion.button>
  );
}

/* ============================================================
 * LivePreview — full-width editorial artifact reskinning live in
 * the chosen palette + mode. Shows the consequence of the choice:
 * a hero word, two lines of voice-brief-flavored sample copy, an
 * accent rule, and an accent CTA. Crossfades on every change.
 * ============================================================ */
function LivePreview({
  palette,
  theme,
  reduced,
}: {
  palette: Palette;
  theme: Theme;
  reduced: boolean;
}) {
  const render = theme === "light" ? palette.light : palette.dark;
  const tileKey = `${palette.id}-${theme}`;
  const sample = SAMPLES[palette.id];

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        height: 280,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 24px 60px -24px rgba(0,0,0,0.6)",
      }}
    >
      <AnimatePresence>
        <motion.div
          key={tileKey}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.42 }}
          className="absolute inset-0"
          style={{ background: render.bg }}
        >
          {/* Accent wash from bottom-right */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 55% 55% at 100% 100%, ${palette.accent}28, transparent 75%)`,
            }}
          />

          {/* Editorial content */}
          <div
            className="relative h-full flex flex-col justify-between"
            style={{ padding: "32px 36px" }}
          >
            {/* Top — eyebrow */}
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="inline-block rounded-full"
                style={{
                  width: 7,
                  height: 7,
                  background: palette.accent,
                  boxShadow: `0 0 8px ${palette.accent}99`,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: render.inkMuted,
                }}
              >
                {sample.eyebrow}
              </span>
            </div>

            {/* Middle — headline + body */}
            <div>
              <h4
                className="font-serif"
                style={{
                  fontSize: 36,
                  fontWeight: 500,
                  letterSpacing: "-0.028em",
                  lineHeight: 1.05,
                  color: render.ink,
                  margin: 0,
                }}
              >
                {sample.headline}
                <span style={{ color: palette.accent }}>.</span>
              </h4>
              <p
                className="font-sans"
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: render.inkMuted,
                  margin: "16px 0 0",
                  maxWidth: "52ch",
                }}
              >
                {sample.body}
              </p>
            </div>

            {/* Bottom — accent rule + CTA */}
            <div className="flex items-end justify-between gap-4">
              <span
                aria-hidden
                className="inline-block"
                style={{
                  width: 32,
                  height: 2,
                  background: palette.accent,
                  borderRadius: 1,
                  marginBottom: 8,
                }}
              />
              <span
                className="inline-flex items-center gap-2 rounded-full"
                style={{
                  padding: "10px 20px",
                  background: palette.accent,
                  color: render.bg,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  boxShadow: `0 6px 16px -4px ${palette.accent}88`,
                }}
              >
                {sample.cta} →
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Live preview copy samples — one per palette, written in that
// palette's voice. Demonstrates the consequence of the pick.
const SAMPLES: Record<
  string,
  { eyebrow: string; headline: string; body: string; cta: string }
> = {
  "quiet-cream": {
    eyebrow: "Skincare · Est. 1987",
    headline: "Considered, since the start",
    body: "Plants gathered at low tide on the coast of Tasmania, distilled the same week, bottled in dark glass. Each batch named for the month it was made.",
    cta: "Visit a store",
  },
  "royal-violet": {
    eyebrow: "v2.4 — out now",
    headline: "Ship work, not status",
    body: "Threads, drafts, and review in one place. Built by engineers who got tired of the meeting after the meeting. No new tabs.",
    cta: "Start free",
  },
  "sharp-mono": {
    eyebrow: "Studio",
    headline: "Made with care",
    body: "Aluminum unibody. Forty-eight grams. Two ports. Built once. Used every day.",
    cta: "Learn more",
  },
  forest: {
    eyebrow: "Outdoor apparel · Since 1973",
    headline: "Built to last, made to be repaired",
    body: "We've been patching, mending, and refurbishing gear since 1973. Bring your jacket to a repair center this season — most jobs run under thirty dollars.",
    cta: "Find a repair center",
  },
  sunshine: {
    eyebrow: "Collection 04 · Spring",
    headline: 'THIS IS "WORK"',
    body: 'Drop 04. Silkscreen on heavyweight cotton. Designed in Milan, made in Portugal. Quotation marks intentional.',
    cta: "Shop the drop",
  },
  "soft-blush": {
    eyebrow: "skincare",
    headline: "the everyday glow you'll want",
    body: "weightless, slightly dewy, and made for the in-between days. one pump, three minutes, you're out the door.",
    cta: "shop now",
  },
  "steel-blue": {
    eyebrow: "Payments",
    headline: "Payments infrastructure, built for scale",
    body: "Used by Shopify, Slack, and over a million businesses. One API for cards, wallets, and bank transfers across 47 countries.",
    cta: "Read the docs",
  },
  "workwear-brown": {
    eyebrow: "Detroit, MI",
    headline: "Double-knee duck",
    body: "12-oz cotton duck. Triple-stitched seams. Brass rivets at stress points. Made for jobsites and the people who run them.",
    cta: "Shop the line",
  },
};
