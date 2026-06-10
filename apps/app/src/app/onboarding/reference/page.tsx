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
// One premium "Style Studio" card centered on the page.
// Inside, four sections separated by hairline rules with REAL
// breathing room (36px gaps): Mode toggle, Live preview tile,
// Palette grid, Meta. The preview tile is the wow — it reskins
// live in the chosen palette/mode as the user steers.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const INTAKE_KEY = "wrks-onboarding-intake";
const THEME_KEY = "wrks-onboarding-theme";
const PALETTE_KEY = "wrks-onboarding-palette";

const DEFAULT_PALETTE_INDEX = 1; // royal violet — brand default

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
      if (e.key === "ArrowLeft") {
        setPaletteIndex((i) => (i - 1 + PALETTES.length) % PALETTES.length);
      } else if (e.key === "ArrowRight") {
        setPaletteIndex((i) => (i + 1) % PALETTES.length);
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
      <div className="relative mx-auto flex flex-col items-center max-w-[1200px] min-h-[calc(100vh-120px)] px-10 sm:px-14 py-12">
        {/* Top eyebrow */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="self-start flex items-center gap-4"
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

        {/* Headline + intro — centered, generous spacing above the card */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          className="text-center mt-12 mb-12"
        >
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(2.5rem, 4.5vw, 4rem)",
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.035em",
              color: "rgba(245,240,230,0.97)",
              margin: 0,
            }}
          >
            Set the look.
          </h1>
          <p
            className="font-sans"
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: "rgba(245,240,230,0.6)",
              maxWidth: "52ch",
              margin: "28px auto 0",
            }}
          >
            Pick a mode and a palette. Your agent uses both to set the
            visual identity AND the writing voice of everything it
            makes for you next.
          </p>
        </motion.div>

        {/* The Studio Card — page hero */}
        <StyleStudio
          theme={theme}
          setTheme={setTheme}
          palette={palette}
          paletteIndex={paletteIndex}
          setPaletteIndex={setPaletteIndex}
          reduced={!!reduced}
        />

        {/* Actions */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="mt-14 flex flex-col items-center gap-6"
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
 * StyleStudio — the premium picker card
 * ============================================================ */
function StyleStudio({
  theme,
  setTheme,
  palette,
  paletteIndex,
  setPaletteIndex,
  reduced,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  palette: Palette;
  paletteIndex: number;
  setPaletteIndex: (i: number) => void;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative rounded-[28px] overflow-hidden"
      style={{
        width: "min(680px, 100%)",
        boxShadow: `0 60px 120px -40px rgba(0,0,0,0.7), 0 0 80px -20px ${palette.accent}33`,
        transition: "box-shadow 0.6s ease",
      }}
    >
      {/* Layer 1 — frosted glass body over the page canvas */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%), #0a0a0e",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
        }}
      />

      {/* Layer 2 — soft accent wash from bottom-right */}
      <motion.div
        aria-hidden
        animate={{
          background: `radial-gradient(ellipse 70% 60% at 100% 100%, ${palette.accent}1f, transparent 70%)`,
        }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Layer 3 — top specular highlight (glass rim of light) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-16 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)",
        }}
      />

      {/* Layer 4 — hairline rim */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-[28px]"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      />

      {/* Content */}
      <div className="relative" style={{ padding: "40px 44px" }}>
        {/* === Mode toggle === */}
        <SectionLabel>01 — Mode</SectionLabel>
        <div className="mt-6">
          <ModeToggle
            theme={theme}
            setTheme={setTheme}
            accent={palette.accent}
          />
        </div>

        <Divider />

        {/* === Live preview tile === */}
        <SectionLabel>Live preview</SectionLabel>
        <div className="mt-6">
          <LivePreviewTile palette={palette} theme={theme} reduced={reduced} />
        </div>

        <Divider />

        {/* === Palette grid === */}
        <SectionLabel>02 — Palette</SectionLabel>
        <div className="mt-7">
          <PaletteGrid
            palettes={PALETTES}
            index={paletteIndex}
            setIndex={setPaletteIndex}
          />
        </div>

        {/* === Meta footer === */}
        <div className="mt-10 flex items-end justify-between gap-6">
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={palette.id}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <h3
                  className="font-serif italic"
                  style={{
                    fontSize: 26,
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    color: "rgba(245,240,230,0.96)",
                    margin: 0,
                  }}
                >
                  {palette.name}
                </h3>
                <p
                  className="font-serif italic"
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.45,
                    color: "rgba(245,240,230,0.52)",
                    margin: "12px 0 0",
                  }}
                >
                  {palette.tagline}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Hex chip */}
          <div
            className="flex items-center gap-2.5 rounded-full"
            style={{
              padding: "8px 14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <motion.span
              animate={{ background: palette.accent }}
              transition={{ duration: 0.4 }}
              className="block rounded-full"
              style={{
                width: 12,
                height: 12,
                boxShadow: `0 0 10px ${palette.accent}88, inset 0 1px 0 rgba(255,255,255,0.35)`,
              }}
            />
            <span
              className="uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.18em",
                color: "rgba(245,240,230,0.7)",
              }}
            >
              {palette.accent}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-block h-px w-6"
        style={{ background: "rgba(245,240,230,0.18)" }}
      />
      <span
        className="text-[10.5px] tracking-[0.32em] uppercase"
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

function Divider() {
  return (
    <div
      aria-hidden
      style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "36px 0" }}
    />
  );
}

/* ============================================================
 * ModeToggle — segmented control with sliding selector pill
 * ============================================================ */
function ModeToggle({
  theme,
  setTheme,
  accent,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  accent: string;
}) {
  return (
    <div
      className="relative grid gap-1.5 rounded-[14px]"
      style={{
        gridTemplateColumns: "1fr 1fr",
        padding: 6,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {(["light", "dark"] as Theme[]).map((mode) => {
        const active = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            className="relative grid place-items-center rounded-[10px] z-10"
            style={{ height: 48 }}
          >
            {active && (
              <motion.span
                layoutId="mode-pill"
                aria-hidden
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: `0 6px 18px -4px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.1)`,
                }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span
              className="relative flex items-center gap-2.5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12.5,
                letterSpacing: "0.04em",
                color: active
                  ? "rgba(245,240,230,0.95)"
                  : "rgba(245,240,230,0.5)",
                transition: "color 0.25s ease",
              }}
            >
              {mode === "light" ? (
                <SunIcon color={active ? accent : "rgba(245,240,230,0.5)"} />
              ) : (
                <MoonIcon color={active ? accent : "rgba(245,240,230,0.5)"} />
              )}
              {mode === "light" ? "Light" : "Dark"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
 * LivePreviewTile — a mini styled brand artifact that reskins
 * live in the chosen palette + mode. This is the wow.
 * ============================================================ */
function LivePreviewTile({
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

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        height: 270,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: `0 18px 40px -16px rgba(0,0,0,0.55)`,
      }}
    >
      <AnimatePresence>
        <motion.div
          key={tileKey}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.38 }}
          className="absolute inset-0"
          style={{ background: render.bg }}
        >
          {/* Soft accent wash from bottom-right */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 100% 100%, ${palette.accent}22, transparent 75%)`,
            }}
          />

          {/* Content — three vertical zones with proper breathing */}
          <div
            className="relative h-full flex flex-col justify-between"
            style={{ padding: "26px 28px" }}
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
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: render.inkMuted,
                }}
              >
                Studio · 2026
              </span>
            </div>

            {/* Middle — headline + body */}
            <div>
              <h4
                className="font-serif"
                style={{
                  fontSize: 30,
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                  color: render.ink,
                  margin: 0,
                }}
              >
                Made with care
                <span style={{ color: palette.accent }}>.</span>
              </h4>
              <p
                className="font-sans"
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: render.inkMuted,
                  margin: "14px 0 0",
                  maxWidth: "46ch",
                }}
              >
                Built in 1987. Refined every year since. The palette you
                choose now sets the look of every page your agent makes
                next.
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
                  padding: "9px 18px",
                  background: palette.accent,
                  color: render.bg,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  boxShadow: `0 6px 16px -4px ${palette.accent}88`,
                }}
              >
                Learn more →
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
 * PaletteGrid — 4×2 grid of palette swatch tiles
 * ============================================================ */
function PaletteGrid({
  palettes,
  index,
  setIndex,
}: {
  palettes: Palette[];
  index: number;
  setIndex: (i: number) => void;
}) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
    >
      {palettes.map((p, i) => (
        <PaletteSwatch
          key={p.id}
          palette={p}
          isActive={i === index}
          onClick={() => setIndex(i)}
        />
      ))}
    </div>
  );
}

function PaletteSwatch({
  palette,
  isActive,
  onClick,
}: {
  palette: Palette;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={palette.name}
      aria-pressed={isActive}
      className="group relative flex flex-col items-center rounded-2xl"
      style={{
        padding: "16px 8px 14px",
        background: isActive
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.015)",
        border: `1px solid ${
          isActive ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.04)"
        }`,
        boxShadow: isActive
          ? `0 10px 28px -10px ${palette.accent}88, inset 0 1px 0 rgba(255,255,255,0.05)`
          : "none",
        transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.35s ease",
      }}
    >
      {/* Sphere */}
      <motion.span
        aria-hidden
        animate={{ scale: isActive ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="block rounded-full"
        style={{
          width: 36,
          height: 36,
          background: `
            radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 32%),
            radial-gradient(circle at 70% 78%, rgba(0,0,0,0.4), transparent 38%),
            ${palette.accent}
          `,
          boxShadow: isActive
            ? `0 0 24px ${palette.accent}aa, 0 8px 18px -4px ${palette.accent}cc, inset 0 -3px 6px rgba(0,0,0,0.3)`
            : `0 5px 14px -4px ${palette.accent}66, inset 0 -2px 4px rgba(0,0,0,0.25)`,
        }}
      />

      {/* Label — generous gap above */}
      <span
        className="font-sans"
        style={{
          fontSize: 10.5,
          color: isActive
            ? "rgba(245,240,230,0.86)"
            : "rgba(245,240,230,0.42)",
          letterSpacing: "0.005em",
          fontWeight: isActive ? 500 : 400,
          textAlign: "center",
          lineHeight: 1.2,
          marginTop: 12,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          transition: "color 0.25s ease",
        }}
      >
        {palette.name}
      </span>
    </button>
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
