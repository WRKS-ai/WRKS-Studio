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

const HEADING = ["Meet", "your", "agent."];

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
        {/* Act label */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="text-[10px] tracking-[0.28em] uppercase text-ink-dim font-mono mb-7 sm:mb-9"
        >
          Act One
        </motion.div>

        {/* Hero heading */}
        <h1 className="font-serif font-medium tracking-tight text-[clamp(2.75rem,6vw,5rem)] leading-[0.96] text-ink">
          {HEADING.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={
                reduced
                  ? false
                  : { opacity: 0, y: 20, filter: "blur(12px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: 0.12 + i * 0.08,
                duration: 0.85,
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
          className="mt-5 max-w-md text-[15px] sm:text-base text-ink-muted leading-relaxed font-serif italic"
        >
          Four presences. Each one thinks, talks, and shows up differently. Tap to feel them.
        </motion.p>

        {/* The cast — 4 orbs, both the picker and the hero. No duplication. */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-14 sm:mt-20 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-14 sm:gap-x-10 w-full max-w-[860px]"
        >
          {PERSONALITIES.map((p, i) => {
            const isActive = active === p.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                whileHover={reduced ? undefined : { y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 22 }}
                initial={reduced ? false : { opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: isActive ? 1 : 0.55,
                  scale: isActive ? 1 : 0.88,
                }}
                aria-pressed={committed === p.id}
                aria-label={`Select ${p.name}`}
                style={{
                  // Stagger each orb's appearance for a cinematic cast reveal
                  ...(reduced
                    ? {}
                    : { transitionDelay: `${0.85 + i * 0.12}s` }),
                }}
                className="group relative flex flex-col items-center justify-end gap-5 px-2 py-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 transition-all duration-500"
              >
                <div className="relative h-[130px] w-[130px] flex items-center justify-center">
                  <PersonalityIcon personality={p} size="md" />
                </div>
                <span
                  className="font-serif tracking-tight text-[clamp(1rem,1.3vw,1.125rem)] transition-colors duration-300"
                  style={{
                    color: isActive ? "rgb(245 245 245)" : "rgba(245,245,245,0.65)",
                  }}
                >
                  {p.name}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* The active personality speaks — tagline + sample, in their voice */}
        <div className="mt-10 sm:mt-12 w-full max-w-[520px] min-h-[160px] flex items-start justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeP.id}
              initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduced ? undefined : { opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              className="text-center"
            >
              <p className="font-serif italic text-[clamp(1.0625rem,1.4vw,1.25rem)] text-ink-muted leading-snug">
                {activeP.tagline}
              </p>
              <p className="mt-5 font-serif italic text-[clamp(1rem,1.3vw,1.125rem)] text-ink/90 leading-relaxed">
                <span
                  aria-hidden
                  className="font-serif text-[1.4em] leading-none mr-0.5"
                  style={{ color: activeP.accent, opacity: 0.7 }}
                >
                  &ldquo;
                </span>
                {activeP.sample}
                <span
                  aria-hidden
                  className="font-serif text-[1.4em] leading-none ml-0.5"
                  style={{ color: activeP.accent, opacity: 0.7 }}
                >
                  &rdquo;
                </span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Inline continue — text link, not a button bar */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.45, duration: 0.6 }}
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
              Tap an orb to pick
            </p>
          )}
        </motion.div>
      </div>
    </OnboardingShell>
  );
}
