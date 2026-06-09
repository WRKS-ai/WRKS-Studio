"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ContinueButton } from "@/components/continue-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { useOnboardingAgent } from "@/lib/onboarding-agent";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { STYLE_REFERENCES, type StyleReference } from "@/lib/style-references";
import { VOICES, type VoiceId } from "@/lib/voices";

// Act Four — The Vibe.
//
// User multi-selects up to 3 style references. Picks are saved to
// localStorage and the wow API injects their Claude briefs into the
// generation prompt so the deliverables adopt the chosen voice and
// visual feel. Skipping is allowed — wow falls back to its default
// voice in that case.
//
// Chrome matches the rest of the flow: OnboardingFrame + the shared
// LiquidAurora backdrop (lifted to the provider). Layout is the
// onboarding grammar — hairline eyebrow, asymmetric 2-col header
// (hero left, intro right), then a 2x2 grid of glass cards using the
// same glass treatment as the /name card.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const INTAKE_KEY = "wrks-onboarding-intake";
const STYLE_REFS_KEY = "wrks-onboarding-style-refs";
const MAX_PICKS = 3;

export default function ReferencePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { accent } = useOnboardingAgent();

  const [personality, setPersonality] = useState<Personality | null>(null);
  const [picks, setPicks] = useState<string[]>([]);

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

    const existing = localStorage.getItem(STYLE_REFS_KEY);
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as string[];
        if (Array.isArray(parsed)) setPicks(parsed);
      } catch {
        // ignore
      }
    }
  }, [router]);

  if (!personality) return null;

  const togglePick = (id: string) => {
    setPicks((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX_PICKS) return cur;
      return [...cur, id];
    });
  };

  const onContinue = (skipped: boolean) => {
    if (!skipped) {
      localStorage.setItem(STYLE_REFS_KEY, JSON.stringify(picks));
    } else {
      localStorage.removeItem(STYLE_REFS_KEY);
    }
    router.push("/onboarding/wow");
  };

  const canContinue = picks.length > 0;
  const ctaLabel = canContinue
    ? `Continue with ${picks.length} ${picks.length === 1 ? "reference" : "references"}`
    : "Pick at least one to continue";

  return (
    <OnboardingFrame step={4} totalSteps={5} bloomTint={accent}>
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
            Act Four — The Vibe
          </span>
        </motion.div>

        {/* Asymmetric header — hero left, paragraph right */}
        <div
          className="mt-16 grid gap-x-12 lg:gap-x-16 gap-y-8 items-end"
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
            Pick the vibe.
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
            Pick up to three references. Your agent will use them to set
            the voice, cadence, and visual feel of the deliverables
            you&rsquo;re about to see. Skip if you trust the default.
          </motion.p>
        </div>

        {/* 2×2 glass card grid */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8"
        >
          {STYLE_REFERENCES.map((ref, idx) => (
            <StyleGlassCard
              key={ref.id}
              styleRef={ref}
              index={idx}
              selected={picks.includes(ref.id)}
              disabled={
                picks.length >= MAX_PICKS && !picks.includes(ref.id)
              }
              accent={accent}
              onToggle={() => togglePick(ref.id)}
              reduced={!!reduced}
            />
          ))}
        </motion.div>

        {/* Picks readout + actions */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex flex-col items-center gap-5"
        >
          <PickCounter count={picks.length} max={MAX_PICKS} accent={accent} />

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
                <ContinueButton onClick={() => onContinue(false)}>
                  {ctaLabel}
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
                {ctaLabel}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => onContinue(true)}
            className="text-[11px] tracking-[0.28em] uppercase transition-opacity hover:opacity-80"
            style={{
              color: "rgba(245,240,230,0.42)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Skip — use the default
          </button>
        </motion.div>

        {/* Back link — flex-pushed-bottom like /intake */}
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
 * StyleGlassCard — one card per style reference. Premium glass
 * treatment matching the /name card (frosted bg, hairline rim,
 * specular highlight, deep ambient shadow). Selected state lights
 * the rim with the active accent and adds an outer glow.
 * ============================================================ */
function StyleGlassCard({
  styleRef,
  index,
  selected,
  disabled,
  accent,
  onToggle,
  reduced,
}: {
  styleRef: StyleReference;
  index: number;
  selected: boolean;
  disabled: boolean;
  accent: string;
  onToggle: () => void;
  reduced: boolean;
}) {
  const Preview = styleRef.Preview;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.55,
        delay: 0.32 + index * 0.07,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      whileHover={reduced || disabled ? undefined : { y: -4 }}
      whileTap={disabled ? undefined : { scale: 0.992 }}
      className="relative text-left rounded-[28px] overflow-hidden flex flex-col group cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.014) 100%)",
        border: selected
          ? `1px solid ${accent}80`
          : "1px solid rgba(255,255,255,0.085)",
        backdropFilter: "blur(28px) saturate(160%)",
        WebkitBackdropFilter: "blur(28px) saturate(160%)",
        boxShadow: selected
          ? `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 6px ${accent}1a, 0 24px 60px -20px ${accent}66, 0 32px 80px -24px rgba(0,0,0,0.7)`
          : "inset 0 1px 0 rgba(255,255,255,0.07), 0 32px 80px -24px rgba(0,0,0,0.7)",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      {/* Specular highlight at the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.07), transparent 70%)",
        }}
      />

      {/* Preview pane — hand-designed per style */}
      <div className="relative aspect-[5/3] overflow-hidden rounded-t-[28px]">
        <Preview />
        {/* Bottom-fade so the preview blends into the card body */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(10,10,12,0.55) 100%)",
          }}
        />
        {/* Selection chip — glass pill in the top-right */}
        <div className="absolute top-4 right-4 z-10">
          <motion.div
            animate={{
              scale: selected ? 1 : 0.95,
            }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="size-9 rounded-full grid place-items-center"
            style={{
              background: selected
                ? `linear-gradient(180deg, ${accent} 0%, ${accent}dd 100%)`
                : "rgba(13,13,14,0.55)",
              border: selected
                ? "1px solid rgba(255,255,255,0.55)"
                : "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: selected
                ? `0 8px 22px -6px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.25)`
                : "inset 0 1px 0 rgba(255,255,255,0.06)",
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
          >
            {selected ? (
              <CheckIcon />
            ) : (
              <span
                className="text-[16px] leading-none font-sans"
                style={{ color: "rgba(255,255,255,0.78)" }}
              >
                +
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Meta */}
      <div className="px-7 pt-5 pb-6 flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className="font-serif"
            style={{
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: "rgba(245,240,230,0.96)",
              margin: 0,
            }}
          >
            {styleRef.name}
          </h3>
          <span
            className="text-[10px] tracking-[0.28em] uppercase tabular-nums shrink-0"
            style={{
              color: "rgba(245,240,230,0.4)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <p
          className="font-serif italic"
          style={{
            fontSize: 14.5,
            lineHeight: 1.55,
            letterSpacing: "0.005em",
            color: "rgba(245,240,230,0.62)",
            margin: 0,
          }}
        >
          {styleRef.tagline}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {styleRef.influences.slice(0, 3).map((inf) => (
            <span
              key={inf}
              className="px-2.5 py-1 rounded-md text-[10.5px] tracking-[0.04em]"
              style={{
                background: "rgba(255,255,255,0.035)",
                color: "rgba(245,240,230,0.58)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {inf}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  );
}

function PickCounter({
  count,
  max,
  accent,
}: {
  count: number;
  max: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < count;
        return (
          <span
            key={i}
            className="block rounded-full transition-all duration-500"
            style={{
              width: filled ? 22 : 6,
              height: 3,
              background: filled ? accent : "rgba(255,255,255,0.16)",
              boxShadow: filled ? `0 0 10px ${accent}aa` : undefined,
            }}
            aria-label={`Pick ${i + 1} ${filled ? "selected" : "empty"}`}
          />
        );
      })}
      <span
        className="ml-2 text-[10px] tracking-[0.28em] uppercase tabular-nums"
        style={{
          color: "rgba(245,240,230,0.45)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {count} / {max}
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
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
