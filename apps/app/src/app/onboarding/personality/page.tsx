"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type PersonalityId,
} from "@/lib/personalities";

const STORAGE_KEY = "wrks-onboarding-personality";
const DEFAULT_ID: PersonalityId = "sage";

const HEADING = ["Pick", "the", "one", "that", "feels", "right."];

export default function PersonalityPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [active, setActive] = useState<PersonalityId>(DEFAULT_ID);
  const [committed, setCommitted] = useState<PersonalityId | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as PersonalityId | null;
    if (saved && PERSONALITIES.some((p) => p.id === saved)) {
      setActive(saved);
      setCommitted(saved);
    }
  }, []);

  const onSelect = (id: PersonalityId) => {
    setActive(id);
    setCommitted(id);
  };

  const onContinue = () => {
    if (!committed) return;
    localStorage.setItem(STORAGE_KEY, committed);
    router.push("/onboarding/name");
  };

  const activeP = PERSONALITIES.find((p) => p.id === active)!;

  return (
    <OnboardingShell tint={activeP.glow}>
      <div className="w-full max-w-[1100px] flex flex-col items-center text-center">
        {/* Act label — tiny, ambient, not a progress bar */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="text-[10px] tracking-[0.28em] uppercase text-ink-dim font-mono mb-6 sm:mb-8"
        >
          Act One · Meet your agent
        </motion.div>

        {/* Hero heading — blur-in, word by word, matches marketing hero */}
        <h1 className="font-serif font-medium tracking-tight text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.98] text-ink max-w-[14ch]">
          {HEADING.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={
                reduced
                  ? false
                  : { opacity: 0, y: 18, filter: "blur(10px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: 0.1 + i * 0.06,
                duration: 0.8,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subheading */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease: "easeOut" }}
          className="mt-5 max-w-xl text-[15px] sm:text-base text-ink-muted leading-relaxed"
        >
          Each one talks, decides, and shows up differently. Tap to meet them.
        </motion.p>

        {/* Active glyph + identity — the stage */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-10 sm:mt-14 flex flex-col items-center"
        >
          <PersonalityIcon personality={activeP} size="md" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeP.id}
              initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduced ? undefined : { opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              className="mt-6 max-w-[480px]"
            >
              <h2 className="font-serif font-medium tracking-tight text-[clamp(1.875rem,3vw,2.5rem)] leading-[1.02] text-ink">
                {activeP.name}
              </h2>
              <p className="mt-2 font-serif italic text-[clamp(1.05rem,1.4vw,1.25rem)] text-ink-muted leading-snug">
                {activeP.tagline}
              </p>

              {/* Sample quote, in the agent's voice */}
              <p className="mt-6 font-serif italic text-[clamp(0.95rem,1.2vw,1.0625rem)] text-ink/85 leading-relaxed">
                <span
                  aria-hidden
                  className="font-serif text-[1.25em]"
                  style={{ color: activeP.accent, opacity: 0.7 }}
                >
                  &ldquo;
                </span>
                {activeP.sample}
                <span
                  aria-hidden
                  className="font-serif text-[1.25em]"
                  style={{ color: activeP.accent, opacity: 0.7 }}
                >
                  &rdquo;
                </span>
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* The cast — 4 interactive glyphs */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-12 sm:mt-14 grid grid-cols-4 gap-1 sm:gap-3 w-full max-w-[560px]"
        >
          {PERSONALITIES.map((p) => {
            const isActive = active === p.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                whileHover={reduced ? undefined : { y: -3 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
                aria-pressed={committed === p.id}
                aria-label={`Select ${p.name}`}
                className="group relative flex flex-col items-center gap-2.5 py-3 px-1 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 transition-opacity"
                style={{ opacity: isActive ? 1 : 0.45 }}
              >
                <PersonalityIcon personality={p} size="sm" />
                <span
                  className="font-serif tracking-tight text-[15px] sm:text-base transition-colors duration-200"
                  style={{ color: isActive ? "rgb(245 245 245)" : "rgba(245,245,245,0.7)" }}
                >
                  {p.name}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Inline continue — text link, not a button bar */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.25, duration: 0.6 }}
          className="mt-12 sm:mt-14 h-12 flex items-center justify-center"
        >
          {committed ? (
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
                <span style={{ color: activeP.accent }}>{activeP.name}</span>
              </span>
              <motion.span
                aria-hidden
                animate={reduced ? undefined : { x: [0, 3, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="text-[1em]"
              >
                →
              </motion.span>
            </motion.button>
          ) : (
            <p className="text-[12px] tracking-[0.22em] uppercase text-ink-dim font-mono">
              Tap a name to choose
            </p>
          )}
        </motion.div>
      </div>
    </OnboardingShell>
  );
}
