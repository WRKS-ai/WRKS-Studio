"use client";

import { useConversationClientTool } from "@elevenlabs/react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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

// Voice-tool dispatch — fuzzy matches the agent's free-form
// description ("violet", "the green one", "pink") to a curated
// palette id. Ordering matters: earlier entries win, so list
// brand-name aliases first (Aesop, Linear, Apple) before falling
// through to color words.
const PALETTE_ALIASES: { match: RegExp; id: string }[] = [
  { match: /quiet|cream|aesop|editorial/i, id: "quiet-cream" },
  { match: /royal|violet|purple|linear/i, id: "royal-violet" },
  { match: /sharp|mono|black|white|apple|grey|gray|monochrome/i, id: "sharp-mono" },
  { match: /forest|green|patagonia|olive/i, id: "forest" },
  { match: /sunshine|yellow|gold|off.?white|streetwear/i, id: "sunshine" },
  { match: /blush|pink|glossier|rose|magenta/i, id: "soft-blush" },
  { match: /steel|blue|stripe|navy|indigo/i, id: "steel-blue" },
  { match: /workwear|brown|carhartt|tan|beige|khaki/i, id: "workwear-brown" },
];

const NEXT_WORDS = ["next", "continue", "ready", "go", "forward", "wow"];
const BACK_WORDS = ["back", "previous", "intake"];

function resolvePaletteFromText(text: string): Palette | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  // Try id match first
  const direct = PALETTES.find((p) => p.id === t || p.name.toLowerCase() === t);
  if (direct) return direct;
  for (const alias of PALETTE_ALIASES) {
    if (alias.match.test(t)) return PALETTES.find((p) => p.id === alias.id) ?? null;
  }
  return null;
}

// Act Four — The Look.
//
// Left-right editorial spread. No scroll.
//
//   LEFT  — eyebrow, big headline (accent period live-updates in
//           the picked color), short intro, a "Voice: X" panel
//           that reflects the nearest curated palette + its short
//           voice fingerprint, Continue + skip.
//
//   RIGHT — the picker card. Real HSV color picker:
//             * Mode toggle (Light/Dark) at the top
//             * Hue slider with a reset icon
//             * Big SV square (drag to pick)
//             * Current swatch + 8 preset palette dots
//             * Live hex display + nearest-palette pill
//
// On Continue we submit the NEAREST curated palette id (by RGB
// distance) so the voice brief is preserved. The picked hex is
// stored locally too, in case we wire a custom-accent path later.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const INTAKE_KEY = "wrks-onboarding-intake";
const THEME_KEY = "wrks-onboarding-theme";
const PALETTE_KEY = "wrks-onboarding-palette";
const ACCENT_KEY = "wrks-onboarding-accent";

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

const DEFAULT_HEX = "#7a55ff"; // royal violet — brand default

/* ============================================================
 * Color math
 * ============================================================ */
type HSV = { h: number; s: number; v: number };

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function hexToHsv(hex: string): HSV {
  const { r, g, b } = hexToRgb(hex);
  const rN = r / 255,
    gN = g / 255,
    bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rN) h = ((gN - bN) / d) % 6;
    else if (max === gN) h = (bN - rN) / d + 2;
    else h = (rN - gN) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function findNearestPalette(hex: string): Palette {
  const target = hexToRgb(hex);
  let nearest = PALETTES[0];
  let minDist = Infinity;
  for (const p of PALETTES) {
    const c = hexToRgb(p.accent);
    const d =
      (target.r - c.r) ** 2 + (target.g - c.g) ** 2 + (target.b - c.b) ** 2;
    if (d < minDist) {
      minDist = d;
      nearest = p;
    }
  }
  return nearest;
}

/* ============================================================
 * Page
 * ============================================================ */
export default function ReferencePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { accent: agentAccent } = useOnboardingAgent();

  const [personality, setPersonality] = useState<Personality | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(DEFAULT_HEX));
  const [submitting, setSubmitting] = useState(false);

  const hex = useMemo(
    () => hsvToHex(hsv.h, hsv.s, hsv.v),
    [hsv.h, hsv.s, hsv.v],
  );
  const nearestPalette = useMemo(() => findNearestPalette(hex), [hex]);
  const fingerprint = VOICE_FINGERPRINT[nearestPalette.id] ?? nearestPalette.tagline;

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

    const storedAccent = localStorage.getItem(ACCENT_KEY);
    if (storedAccent && /^#[0-9a-fA-F]{6}$/.test(storedAccent)) {
      setHsv(hexToHsv(storedAccent));
    } else {
      const storedPalette = localStorage.getItem(PALETTE_KEY);
      if (storedPalette) {
        const p = PALETTES.find((x) => x.id === storedPalette);
        if (p) setHsv(hexToHsv(p.accent));
      }
    }
  }, [router]);

  // Voice tool handlers — registered unconditionally before any
  // early return so React's rules-of-hooks isn't violated. The
  // submitting ref lets the navigate handler bail if a submission
  // is already in flight without coupling to React state timing.
  const submittingRef = useRef(false);
  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useConversationClientTool("set_field", (params) => {
    console.log("[onboarding/reference] set_field called with:", params);
    const fieldName = String(params?.field ?? "").trim().toLowerCase();
    const value = String(
      params?.value ??
        (params as { text?: unknown })?.text ??
        (params as { new_value?: unknown })?.new_value ??
        "",
    ).trim();
    if (!value) return "Tell me what to set it to.";

    // Theme / mode toggle
    if (
      fieldName === "theme" ||
      fieldName === "mode" ||
      fieldName === "appearance"
    ) {
      const v = value.toLowerCase();
      if (v.includes("light") || v.includes("day")) {
        setTheme("light");
        return "Light mode it is.";
      }
      if (v.includes("dark") || v.includes("night")) {
        setTheme("dark");
        return "Dark mode it is.";
      }
      return `Light or dark? Got "${value}" — not sure which.`;
    }

    // Palette / color — handles named palettes ("violet", "the pink one",
    // "Linear style"), brand references ("Aesop", "Stripe"), or a hex
    // string. Hex wins if present; otherwise fuzzy alias match.
    if (
      fieldName === "palette" ||
      fieldName === "color" ||
      fieldName === "accent" ||
      fieldName === "look"
    ) {
      const hexMatch = value.match(/#?([0-9a-fA-F]{6})/);
      if (hexMatch) {
        const cleanHex = `#${hexMatch[1].toLowerCase()}`;
        setHsv(hexToHsv(cleanHex));
        return `Color set to ${cleanHex}.`;
      }
      const match = resolvePaletteFromText(value);
      if (match) {
        setHsv(hexToHsv(match.accent));
        return `${match.name} it is.`;
      }
      return `I don't recognize "${value}". Try violet, green, pink, blue, brown, yellow, cream, or mono.`;
    }

    return `I can set theme or palette here. Got field "${fieldName}".`;
  });

  useConversationClientTool("navigate", (params) => {
    console.log("[onboarding/reference] navigate called with:", params);
    const destination = String(params?.destination ?? "")
      .trim()
      .toLowerCase();
    if (!destination) return "Where to?";

    if (NEXT_WORDS.some((w) => destination === w || destination.includes(w))) {
      if (submittingRef.current) return "Already going.";
      submittingRef.current = true;
      void (async () => {
        setSubmitting(true);
        localStorage.setItem(THEME_KEY, theme);
        localStorage.setItem(PALETTE_KEY, nearestPalette.id);
        localStorage.setItem(ACCENT_KEY, hex);
        try {
          await fetch("/api/onboarding/references", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme, paletteId: nearestPalette.id }),
          });
        } catch (err) {
          console.error("[onboarding/reference] voice submit failed:", err);
        }
        router.push("/onboarding/wow");
      })();
      return "Continuing.";
    }

    if (BACK_WORDS.some((w) => destination === w || destination.includes(w))) {
      setTimeout(() => router.push("/onboarding/intake"), 150);
      return "Heading back to intake.";
    }

    return `From this page I can go "next" or "back".`;
  });

  if (!personality) return null;

  const onContinue = async (skipped: boolean) => {
    if (submitting) return;
    setSubmitting(true);

    if (skipped) {
      localStorage.removeItem(THEME_KEY);
      localStorage.removeItem(PALETTE_KEY);
      localStorage.removeItem(ACCENT_KEY);
    } else {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem(PALETTE_KEY, nearestPalette.id);
      localStorage.setItem(ACCENT_KEY, hex);
    }

    try {
      const res = await fetch("/api/onboarding/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          skipped
            ? { theme: null, paletteId: null }
            : { theme, paletteId: nearestPalette.id },
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
      bloomTint={hex ?? agentAccent}
    >
      <div
        className="relative mx-auto px-10 sm:px-14 py-10"
        style={{ maxWidth: 1440 }}
      >
        <div
          className="grid items-center gap-16 lg:gap-24"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 520px)",
            minHeight: "calc(100vh - 160px)",
          }}
        >
          {/* === LEFT — editorial column === */}
          <div className="flex flex-col">
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

            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.15,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="font-serif mt-10"
              style={{
                fontSize: "clamp(2.75rem, 5.4vw, 4.75rem)",
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "-0.038em",
                color: "rgba(245,240,230,0.97)",
                margin: 0,
              }}
            >
              Set the look
              <motion.span
                animate={{ color: hex }}
                transition={{ duration: 0.18 }}
                style={{ display: "inline-block" }}
              >
                .
              </motion.span>
            </motion.h1>

            {/* Voice panel — live nearest-palette indicator */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35 }}
              className="mt-14 max-w-[28rem]"
            >
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
                  Voice
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={nearestPalette.id}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="mt-5"
                >
                  <div className="flex items-center gap-3">
                    <motion.span
                      aria-hidden
                      animate={{ background: nearestPalette.accent }}
                      transition={{ duration: 0.25 }}
                      className="block rounded-full"
                      style={{
                        width: 14,
                        height: 14,
                        boxShadow: `0 0 14px ${nearestPalette.accent}aa, inset 0 1px 0 rgba(255,255,255,0.35)`,
                      }}
                    />
                    <h3
                      className="font-serif italic"
                      style={{
                        fontSize: 30,
                        fontWeight: 500,
                        letterSpacing: "-0.022em",
                        lineHeight: 1.05,
                        color: "rgba(245,240,230,0.96)",
                        margin: 0,
                      }}
                    >
                      {nearestPalette.name}
                    </h3>
                  </div>
                  <p
                    className="font-sans"
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      color: "rgba(245,240,230,0.5)",
                      margin: "16px 0 0",
                      maxWidth: "40ch",
                    }}
                  >
                    {fingerprint}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-14 flex items-center gap-6"
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
                className="text-[10.5px] tracking-[0.28em] uppercase transition-opacity hover:opacity-80 disabled:opacity-30"
                style={{
                  color: "rgba(245,240,230,0.42)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Skip — use default
              </button>
            </motion.div>

            <motion.button
              type="button"
              onClick={() => router.push("/onboarding/intake")}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="self-start mt-16 text-[10.5px] tracking-[0.32em] uppercase transition-opacity hover:opacity-80"
              style={{
                color: "rgba(245,240,230,0.34)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ← Back
            </motion.button>
          </div>

          {/* === RIGHT — picker card === */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            className="justify-self-end w-full"
            style={{ maxWidth: 520 }}
          >
            <PickerCard
              theme={theme}
              setTheme={setTheme}
              hsv={hsv}
              setHsv={setHsv}
              hex={hex}
              nearestPalette={nearestPalette}
              reduced={!!reduced}
            />
          </motion.div>
        </div>
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * PickerCard — the real HSV color picker
 * ============================================================ */
function PickerCard({
  theme,
  setTheme,
  hsv,
  setHsv,
  hex,
  nearestPalette,
  reduced,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  hsv: HSV;
  setHsv: (next: HSV) => void;
  hex: string;
  nearestPalette: Palette;
  reduced: boolean;
}) {
  return (
    <div
      className="relative rounded-[28px] overflow-hidden"
      style={{
        boxShadow: `0 60px 120px -40px rgba(0,0,0,0.7), 0 0 80px -20px ${hex}33`,
        transition: "box-shadow 0.6s ease",
      }}
    >
      {/* Glass body */}
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
      {/* Accent wash */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 100% 100%, ${hex}1c, transparent 70%)`,
          transition: "background 0.2s ease",
        }}
      />
      {/* Top specular */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-16 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)",
        }}
      />
      {/* Hairline rim */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-[28px]"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      />

      {/* Content */}
      <div className="relative" style={{ padding: 28 }}>
        {/* Mode toggle */}
        <ModeToggle theme={theme} setTheme={setTheme} accent={hex} />

        {/* Hue slider */}
        <div className="mt-6">
          <HueSlider
            h={hsv.h}
            onChange={(h) => setHsv({ ...hsv, h })}
            onReset={() => setHsv(hexToHsv(nearestPalette.accent))}
            accent={hex}
          />
        </div>

        {/* SV square */}
        <div className="mt-5">
          <SVSquare
            hsv={hsv}
            onChange={(s, v) => setHsv({ ...hsv, s, v })}
          />
        </div>

        {/* Preset strip — current swatch + 8 palette presets */}
        <div className="mt-5 flex items-center gap-3">
          {/* Current swatch */}
          <motion.span
            aria-hidden
            animate={{ background: hex }}
            transition={{ duration: 0.15 }}
            className="block rounded-[10px] shrink-0"
            style={{
              width: 44,
              height: 44,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.3), 0 4px 12px -3px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          {/* Preset palette dots */}
          <div
            className="flex-1 grid gap-2"
            style={{ gridTemplateColumns: "repeat(8, 1fr)" }}
          >
            {PALETTES.map((p) => {
              const isMatch = p.id === nearestPalette.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setHsv(hexToHsv(p.accent))}
                  aria-label={p.name}
                  className="relative grid place-items-center"
                  style={{ height: 44 }}
                >
                  <motion.span
                    aria-hidden
                    animate={{ scale: isMatch ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="block rounded-full"
                    style={{
                      width: 22,
                      height: 22,
                      background: `
                        radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 32%),
                        ${p.accent}
                      `,
                      boxShadow: isMatch
                        ? `0 0 18px ${p.accent}cc, inset 0 -2px 4px rgba(0,0,0,0.3), 0 0 0 1.5px rgba(255,255,255,0.4)`
                        : `0 3px 8px -2px ${p.accent}66, inset 0 -2px 4px rgba(0,0,0,0.25)`,
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Hex + match row */}
        <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Hex chip */}
          <HexChip hex={hex} onChange={(h) => setHsv(hexToHsv(h))} />
          {/* Match chip */}
          <div
            className="flex items-center justify-center rounded-[12px]"
            style={{
              height: 44,
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span
              className="uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.24em",
                color: "rgba(245,240,230,0.5)",
              }}
            >
              Matches
            </span>
            <span
              className="ml-2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                letterSpacing: "0.04em",
                color: "rgba(245,240,230,0.85)",
              }}
            >
              {nearestPalette.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * ModeToggle — segmented Light / Dark with sliding pill
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
            style={{ height: 42 }}
          >
            {active && (
              <motion.span
                layoutId="picker-mode-pill"
                aria-hidden
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
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
                fontSize: 12,
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
 * HueSlider — drag to set hue + reset icon
 * ============================================================ */
function HueSlider({
  h,
  onChange,
  onReset,
  accent,
}: {
  h: number;
  onChange: (h: number) => void;
  onReset: () => void;
  accent: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(x * 360);
  };

  return (
    <div className="flex items-center gap-3">
      <div
        ref={trackRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handleMove(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) handleMove(e.clientX);
        }}
        className="relative flex-1 rounded-full cursor-pointer"
        style={{
          height: 10,
          background:
            "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
          touchAction: "none",
        }}
      >
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            left: `${(h / 360) * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 18,
            height: 18,
            background: `hsl(${h}, 100%, 50%)`,
            border: "2px solid rgba(255,255,255,0.95)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        />
      </div>
      <button
        type="button"
        onClick={onReset}
        className="grid place-items-center rounded-full"
        aria-label="Reset to nearest preset"
        style={{
          width: 32,
          height: 32,
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.07)",
          color: accent,
          transition: "color 0.2s ease",
        }}
      >
        <ResetIcon />
      </button>
    </div>
  );
}

/* ============================================================
 * SVSquare — drag to set saturation × value
 * ============================================================ */
function SVSquare({
  hsv,
  onChange,
}: {
  hsv: HSV;
  onChange: (s: number, v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number, clientY: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    onChange(x, 1 - y);
  };

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handleMove(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) handleMove(e.clientX, e.clientY);
      }}
      className="relative w-full rounded-2xl overflow-hidden cursor-crosshair"
      style={{
        height: 240,
        background: `
          linear-gradient(to top, #000 0%, transparent 100%),
          linear-gradient(to right, #fff 0%, hsl(${hsv.h}, 100%, 50%) 100%)
        `,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        touchAction: "none",
      }}
    >
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: `${hsv.s * 100}%`,
          top: `${(1 - hsv.v) * 100}%`,
          transform: "translate(-50%, -50%)",
          width: 18,
          height: 18,
          background: hsvToHex(hsv.h, hsv.s, hsv.v),
          border: "2.5px solid rgba(255,255,255,0.95)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/* ============================================================
 * HexChip — editable hex display
 * ============================================================ */
function HexChip({
  hex,
  onChange,
}: {
  hex: string;
  onChange: (h: string) => void;
}) {
  const [draft, setDraft] = useState(hex);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(hex);
  }, [hex, focused]);

  return (
    <label
      className="relative flex items-center gap-2 rounded-[12px] cursor-text"
      style={{
        height: 44,
        padding: "0 14px",
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <span
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.28em",
          color: "rgba(245,240,230,0.4)",
        }}
      >
        Hex
      </span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          const next = e.target.value.trim();
          if (/^#?[0-9a-fA-F]{6}$/.test(next)) {
            const clean = next.startsWith("#") ? next : `#${next}`;
            onChange(clean);
          } else {
            setDraft(hex);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        spellCheck={false}
        className="flex-1 bg-transparent outline-none uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.04em",
          color: "rgba(245,240,230,0.92)",
          minWidth: 0,
        }}
      />
    </label>
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

function ResetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 12a9 9 0 1 0 3-6.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 4v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
