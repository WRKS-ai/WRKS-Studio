"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type PersonalityId,
} from "@/lib/personalities";

const STORAGE_KEY = "wrks-onboarding-personality";

// Personality picker as a 4-page sub-flow: each personality gets its
// own cinematic stage at hero scale. User browses with prev/next or
// arrow keys, and can pick any orb at any time.

export default function PersonalityPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  // Currently-previewed personality (index into PERSONALITIES)
  const [index, setIndex] = useState<number>(0);
  // Committed pick (id) — independent of preview, so user can browse
  // after picking
  const [committed, setCommitted] = useState<PersonalityId | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as PersonalityId | null;
    if (saved && PERSONALITIES.some((p) => p.id === saved)) {
      setCommitted(saved);
      // Start the preview on the personality they last committed to
      const i = PERSONALITIES.findIndex((p) => p.id === saved);
      if (i >= 0) setIndex(i);
    }
  }, []);

  const previewed = PERSONALITIES[index]!;
  const total = PERSONALITIES.length;

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const pick = useCallback(() => {
    setCommitted(previewed.id);
  }, [previewed.id]);

  // Arrow-key navigation — feels like a slideshow
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  const onContinue = () => {
    if (!committed) return;
    localStorage.setItem(STORAGE_KEY, committed);
    router.push("/onboarding/name");
  };

  const committedP = committed
    ? PERSONALITIES.find((p) => p.id === committed)!
    : null;
  const isPickedThis = committed === previewed.id;

  return (
    <OnboardingShell tint={previewed.glow}>
      <div className="w-full max-w-[920px] flex flex-col items-center text-center">
        {/* Step indicator row — Act + Personality position */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex items-center gap-3 text-[10px] tracking-[0.28em] uppercase text-ink-dim font-mono mb-2"
        >
          <span>Act One of Four</span>
          <span className="text-ink-dim/40">·</span>
          <span>
            Meeting {index + 1} of {total}
          </span>
        </motion.div>

        {/* Page count dots — quick visual of where you are */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-2 mt-3 mb-8 sm:mb-10"
        >
          {PERSONALITIES.map((p, i) => {
            const isCurrent = i === index;
            const isCommittedDot = committed === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Preview ${p.name}`}
                aria-current={isCurrent ? "true" : undefined}
                className="h-3 flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-full"
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: isCurrent ? 26 : 8,
                    height: 3,
                    background: isCommittedDot
                      ? p.accent
                      : isCurrent
                        ? "rgba(255,255,255,0.65)"
                        : "rgba(255,255,255,0.18)",
                  }}
                />
              </button>
            );
          })}
        </motion.div>

        {/* The hero stage — single orb crossfading between personalities */}
        <div className="relative w-full flex items-center justify-center min-h-[300px] sm:min-h-[360px]">
          {/* Side arrows — desktop */}
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous personality"
            className="hidden sm:flex absolute left-0 sm:left-4 size-12 rounded-full items-center justify-center text-ink-muted hover:text-ink hover:bg-white/[0.04] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 z-10"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next personality"
            className="hidden sm:flex absolute right-0 sm:right-4 size-12 rounded-full items-center justify-center text-ink-muted hover:text-ink hover:bg-white/[0.04] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 z-10"
          >
            <ChevronRight />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={previewed.id}
              initial={
                reduced ? false : { opacity: 0, scale: 0.88, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={
                reduced
                  ? undefined
                  : { opacity: 0, scale: 0.92, filter: "blur(6px)" }
              }
              transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <PersonalityIcon personality={previewed} size="xl" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Name + tagline + sample quote */}
        <div className="mt-10 sm:mt-12 w-full max-w-[600px] min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${previewed.id}-info`}
              initial={
                reduced ? false : { opacity: 0, y: 12, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reduced ? undefined : { opacity: 0, y: -6, filter: "blur(4px)" }
              }
              transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <h2 className="font-serif font-medium tracking-tight text-[clamp(2.75rem,5vw,4rem)] leading-[0.96] text-ink">
                {previewed.name}
              </h2>
              <p className="mt-3 font-serif italic text-[clamp(1.0625rem,1.4vw,1.25rem)] text-ink-muted leading-snug">
                {previewed.tagline}
              </p>
              <p className="mt-6 font-serif italic text-[clamp(1rem,1.3vw,1.125rem)] text-ink/90 leading-relaxed max-w-[480px] mx-auto">
                <span
                  aria-hidden
                  className="font-serif text-[1.4em] leading-none mr-0.5"
                  style={{ color: previewed.accent, opacity: 0.7 }}
                >
                  &ldquo;
                </span>
                {previewed.sample}
                <span
                  aria-hidden
                  className="font-serif text-[1.4em] leading-none ml-0.5"
                  style={{ color: previewed.accent, opacity: 0.7 }}
                >
                  &rdquo;
                </span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile navigation — prev / pick / next as a row */}
        <div className="mt-10 sm:mt-12 flex items-center justify-center gap-4 sm:gap-8 sm:hidden">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous personality"
            className="size-11 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white/[0.04] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
          >
            <ChevronLeft />
          </button>
          <PickButton
            isPickedThis={isPickedThis}
            previewed={previewed}
            onPick={pick}
          />
          <button
            type="button"
            onClick={goNext}
            aria-label="Next personality"
            className="size-11 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white/[0.04] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Desktop — single centered Pick button */}
        <div className="mt-10 sm:mt-12 hidden sm:flex">
          <PickButton
            isPickedThis={isPickedThis}
            previewed={previewed}
            onPick={pick}
          />
        </div>

        {/* Continue link — only when committed */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: committedP ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 sm:mt-10 h-12 flex items-center justify-center"
        >
          {committedP && (
            <motion.button
              type="button"
              onClick={onContinue}
              whileHover={reduced ? undefined : { x: 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="group inline-flex items-center gap-3 font-serif text-[clamp(1.125rem,1.6vw,1.375rem)] text-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md px-2 py-1"
            >
              <span>
                Continue as{" "}
                <span style={{ color: committedP.accent }}>{committedP.name}</span>
              </span>
              <motion.span
                aria-hidden
                animate={reduced ? undefined : { x: [0, 3, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                →
              </motion.span>
            </motion.button>
          )}
        </motion.div>

        {/* Hint — small, only when no commitment yet */}
        {!committed && (
          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono"
          >
            Use ← → to browse · Pick to commit
          </motion.p>
        )}
      </div>
    </OnboardingShell>
  );
}

/* ============================================================
 * Pick button — inline serif "Pick X" call to action.
 * Becomes a check-state once that personality is committed.
 * ============================================================ */
function PickButton({
  isPickedThis,
  previewed,
  onPick,
}: {
  isPickedThis: boolean;
  previewed: ReturnType<typeof PERSONALITIES.find>;
  onPick: () => void;
}) {
  const reduced = useReducedMotion();
  if (!previewed) return null;
  return (
    <motion.button
      type="button"
      onClick={onPick}
      disabled={isPickedThis}
      whileHover={isPickedThis || reduced ? undefined : { y: -1 }}
      whileTap={isPickedThis ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="inline-flex items-center gap-2.5 h-11 px-5 sm:px-6 rounded-full font-serif text-[15px] sm:text-base text-ink transition-all outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 disabled:cursor-default"
      style={{
        background: isPickedThis ? "rgba(255,255,255,0.06)" : "transparent",
        border: `1px solid ${
          isPickedThis ? previewed.accent : "rgba(255,255,255,0.12)"
        }`,
        boxShadow: isPickedThis
          ? `0 0 0 1px ${previewed.accent}, 0 0 28px -8px ${previewed.glow}`
          : "none",
      }}
    >
      {isPickedThis ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 13l4 4L19 7"
              stroke={previewed.accent}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ color: previewed.accent }}>{previewed.name} chosen</span>
        </>
      ) : (
        <span>Pick {previewed.name}</span>
      )}
    </motion.button>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
