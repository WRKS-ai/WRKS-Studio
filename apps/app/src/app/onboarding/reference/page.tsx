"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { SectionRenderer } from "@/components/site-sections";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { STYLE_REFERENCES, type StyleReference } from "@/lib/style-references";
import { VOICES, type VoiceId } from "@/lib/voices";

// Reference-style picker — sits between /onboarding/intake and
// /onboarding/wow. The user multi-selects up to 3 visual references
// they like; their picks are saved to localStorage and the wow API
// injects their Claude briefs into the generation prompt so the output
// adopts the chosen style's voice and structure.
//
// Skipping is allowed — wow falls back to its default voice in that
// case. Coming-soon cards are visible but not selectable so the
// product roadmap is legible.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const INTAKE_KEY = "wrks-onboarding-intake";
const STYLE_REFS_KEY = "wrks-onboarding-style-refs";
const MAX_PICKS = 3;

export default function ReferencePage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [personality, setPersonality] = useState<Personality | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      router.replace("/onboarding/voice");
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

  const togglePick = (id: string, available: boolean) => {
    if (!available) return;
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

  return (
    <OnboardingShell tint={personality.glow}>
      <div className="w-full max-w-[1180px] flex flex-col items-center text-center">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="text-[10px] tracking-[0.28em] uppercase text-ink-dim font-mono mb-3"
        >
          One last thing
        </motion.div>

        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.2, 0.7, 0.2, 1] }}
          className="font-serif font-medium text-[clamp(1.875rem,3.2vw,2.625rem)] leading-[1.04] tracking-tight text-ink"
          style={{ letterSpacing: "-0.025em" }}
        >
          Pick the vibe.
        </motion.h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-4 font-serif italic text-[17px] max-w-[58ch] text-ink-muted leading-relaxed"
        >
          Pick up to three references. Your agent will use them to set the
          voice, cadence, and visual feel of the deliverables you&rsquo;re
          about to see. Skip if you trust the default.
        </motion.p>

        {/* Card grid */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full"
        >
          {STYLE_REFERENCES.map((ref, idx) => (
            <StyleCard
              key={ref.id}
              ref={ref}
              index={idx}
              selected={picks.includes(ref.id)}
              expanded={expandedId === ref.id}
              accent={personality.accent}
              onToggle={() => togglePick(ref.id, ref.available)}
              onExpand={() =>
                setExpandedId(expandedId === ref.id ? null : ref.id)
              }
            />
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <button
            type="button"
            onClick={() => onContinue(false)}
            disabled={picks.length === 0}
            className="h-12 px-7 rounded-full inline-flex items-center gap-2.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
              boxShadow:
                picks.length > 0
                  ? `0 12px 32px -8px ${personality.glow}`
                  : "none",
            }}
          >
            <span>
              {picks.length === 0
                ? "Pick at least one"
                : `Continue with ${picks.length} ${picks.length === 1 ? "reference" : "references"}`}
            </span>
            <span>→</span>
          </button>
          <button
            type="button"
            onClick={() => onContinue(true)}
            className="text-[13.5px] tracking-[0.06em] hover:underline transition-colors"
            style={{ color: "rgba(245,245,247,0.5)" }}
          >
            Skip — use the default voice
          </button>
        </motion.div>
      </div>
    </OnboardingShell>
  );
}

/* ============================================================
 * StyleCard — one card per reference. The hero of this page.
 * ============================================================ */
function StyleCard({
  ref: styleRef,
  index,
  selected,
  expanded,
  accent,
  onToggle,
  onExpand,
}: {
  ref: StyleReference;
  index: number;
  selected: boolean;
  expanded: boolean;
  accent: string;
  onToggle: () => void;
  onExpand: () => void;
}) {
  const reduced = useReducedMotion();
  const available = styleRef.available;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={!available}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.18 + index * 0.06,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      whileHover={reduced || !available ? undefined : { y: -3 }}
      className="relative text-left rounded-2xl overflow-hidden flex flex-col group transition-shadow"
      style={{
        background: available
          ? `linear-gradient(180deg, ${styleRef.accent}30 0%, rgba(0,0,0,0) 65%), rgba(255,255,255,0.02)`
          : "rgba(255,255,255,0.02)",
        border: selected
          ? `1.5px solid ${accent}`
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: selected
          ? `0 18px 40px -16px ${accent}66`
          : "0 12px 32px -16px rgba(0,0,0,0.4)",
        opacity: available ? 1 : 0.55,
        cursor: available ? "pointer" : "not-allowed",
      }}
    >
      {/* Preview pane */}
      <div className="relative h-[220px] overflow-hidden">
        {available && styleRef.sampleSite ? (
          <StylePreview styleRef={styleRef} />
        ) : (
          <ComingSoonBackdrop styleRef={styleRef} />
        )}
        {/* Top-right selection indicator */}
        {available && (
          <div className="absolute top-3 right-3 z-10">
            <div
              className="size-7 rounded-full grid place-items-center transition-all"
              style={{
                background: selected
                  ? accent
                  : "rgba(0,0,0,0.5)",
                border: selected
                  ? "1px solid white"
                  : "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(8px)",
              }}
            >
              {selected ? (
                <CheckIcon />
              ) : (
                <span
                  className="text-[12px] font-mono"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  +
                </span>
              )}
            </div>
          </div>
        )}
        {!available && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className="px-2 py-1 rounded-md text-[10px] tracking-[0.18em] uppercase font-mono"
              style={{
                background: "rgba(0,0,0,0.6)",
                color: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
              }}
            >
              Soon
            </span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-5 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className="font-serif text-[18px] tracking-tight text-ink leading-none"
            style={{ letterSpacing: "-0.015em" }}
          >
            {styleRef.name}
          </h3>
          <span
            className="text-[10px] tracking-[0.22em] uppercase shrink-0"
            style={{
              color: "rgba(245,245,247,0.4)",
              fontFamily: "var(--font-mono)",
            }}
          >
            0{index + 1}
          </span>
        </div>
        <p
          className="text-[13px] font-serif italic"
          style={{ color: "rgba(245,245,247,0.6)" }}
        >
          {styleRef.tagline}
        </p>
        {/* Influences chips */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {styleRef.influences.slice(0, 3).map((inf) => (
            <span
              key={inf}
              className="px-2 py-0.5 rounded text-[10.5px] tracking-[0.04em]"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(245,245,247,0.55)",
                border: "1px solid rgba(255,255,255,0.05)",
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

function StylePreview({ styleRef }: { styleRef: StyleReference }) {
  // Render the sample Site's first 2 sections at full size inside a
  // scaled container so the typography reads correctly. CSS transform
  // gives us a faithful miniature without breaking the design.
  const site = styleRef.sampleSite!;
  const page = site.pages.find((p) => p.id === site.activePageId) ?? site.pages[0];
  const sections = page?.sections.slice(0, 2) ?? [];

  return (
    <div
      className="absolute inset-0"
      style={{ background: styleRef.surface }}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: "880px",
          transformOrigin: "top left",
          transform: "scale(0.42)",
        }}
      >
        {sections.map((s) => (
          <NonInteractiveSection
            key={s.id}
            section={s}
            accent={styleRef.accent}
            brandName={site.brandName}
          />
        ))}
      </div>
      {/* Gradient fade at the bottom so the cut-off content reads as
          intentional rather than truncated. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${styleRef.surface} 100%)`,
        }}
      />
    </div>
  );
}

function NonInteractiveSection({
  section,
  accent,
  brandName,
}: {
  section: Parameters<typeof SectionRenderer>[0]["section"];
  accent: string;
  brandName: string;
}) {
  // Wrap the renderer in a div that blocks pointer events so the user
  // can't accidentally focus an EditableText inside the card preview.
  return (
    <div className="pointer-events-none select-none">
      <SectionRenderer
        section={section}
        tokens={{ accent, brandName }}
        onEdit={() => {
          /* preview is read-only */
        }}
      />
    </div>
  );
}

function ComingSoonBackdrop({ styleRef }: { styleRef: StyleReference }) {
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{
        background: `radial-gradient(ellipse 90% 70% at 50% 30%, ${styleRef.accent}66, ${styleRef.surface} 75%)`,
      }}
    >
      <div
        className="font-serif italic text-[18px] text-center"
        style={{
          color:
            styleRef.surface === "#0d0d0e"
              ? "rgba(255,255,255,0.55)"
              : "rgba(14,12,8,0.55)",
        }}
      >
        {styleRef.influences[0]} × {styleRef.influences[1]}
      </div>
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
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
