"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DarkAvatar } from "@/components/dark-avatar";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";

const STORAGE_KEY = "wrks-onboarding-personality";

// /onboarding/personality v2 — typography-first, ONE persona per frame.
//
// The name is the hero (Fraunces at 9-12rem). The orb is the only color
// hit on the page. Personality details are an editorial column on the
// left; the orb floats on the right. Navigation between personalities is
// quiet — keyboard ←→, a row of name labels at the bottom, no chevron
// pills, no dot rail.
//
// The selected personality's accent bleeds into the canvas edges via
// the OnboardingFrame's edge bloom — that's the only signal that a
// selection is live.

export default function PersonalityPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [index, setIndex] = useState<number>(0);
  const [committed, setCommitted] = useState<PersonalityId | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as PersonalityId | null;
    if (saved && PERSONALITIES.some((p) => p.id === saved)) {
      setCommitted(saved);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Enter") {
        if (committed) {
          localStorage.setItem(STORAGE_KEY, committed);
          router.push("/onboarding/name");
        } else {
          pick();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, pick, committed, router]);

  const onContinue = () => {
    if (!committed) return;
    localStorage.setItem(STORAGE_KEY, committed);
    router.push("/onboarding/name");
  };

  const isPickedThis = committed === previewed.id;
  const accent = previewed.accent;

  return (
    <OnboardingFrame step={1} totalSteps={7} bloomTint={accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 pt-16 pb-20 flex flex-col items-center">
        <div className="w-full max-w-[1280px] flex flex-col flex-1">
        {/* Hero — typography-led editorial composition. */}
        <div
          className="grid items-center gap-10 lg:gap-16 flex-1"
          style={{ gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)" }}
        >
          {/* LEFT — name + tagline + sample line */}
          <div className="relative min-h-[420px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={previewed.id}
                initial={
                  reduced
                    ? false
                    : { opacity: 0, y: 14, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduced
                    ? undefined
                    : { opacity: 0, y: -8, filter: "blur(6px)" }
                }
                transition={{
                  duration: 0.55,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
              >
                {/* Eyebrow — quiet, mono */}
                <div
                  className="text-[11px] tracking-[0.28em] uppercase mb-7 flex items-center gap-3"
                  style={{
                    color: "rgba(245,240,230,0.42)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <span
                    className="inline-block h-px w-7"
                    style={{
                      background: accent,
                      boxShadow: `0 0 6px ${accent}`,
                    }}
                  />
                  <span>The agent · 0{index + 1} of 0{total}</span>
                </div>

                {/* THE HERO — the personality name at scale */}
                <h1
                  className="font-serif font-medium"
                  style={{
                    fontSize: "clamp(5rem, 11vw, 9.5rem)",
                    lineHeight: 0.94,
                    letterSpacing: "-0.035em",
                    color: "rgba(245,240,230,0.98)",
                  }}
                >
                  {previewed.name}
                  <span style={{ color: accent }}>.</span>
                </h1>

                {/* Tagline — italic editorial */}
                <p
                  className="mt-7 font-serif italic max-w-[28ch]"
                  style={{
                    fontSize: "clamp(1.25rem, 1.85vw, 1.625rem)",
                    lineHeight: 1.25,
                    color: "rgba(245,240,230,0.62)",
                  }}
                >
                  {previewed.tagline}
                </p>

                {/* Traits — quiet chips */}
                <div className="mt-7 flex items-center flex-wrap gap-x-5 gap-y-2">
                  {previewed.traits.map((t) => (
                    <span
                      key={t}
                      className="text-[11.5px] tracking-[0.2em] uppercase"
                      style={{
                        color: "rgba(245,240,230,0.4)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Sample voice — italic quote */}
                <div
                  className="mt-12 max-w-[44ch] pl-5"
                  style={{
                    borderLeft: `1px solid ${accent}88`,
                  }}
                >
                  <p
                    className="font-serif italic"
                    style={{
                      fontSize: "clamp(1.0625rem, 1.4vw, 1.1875rem)",
                      lineHeight: 1.55,
                      color: "rgba(245,240,230,0.78)",
                    }}
                  >
                    {previewed.sample}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT — the orb (the only colorful thing on the page) */}
          <div className="relative h-full min-h-[420px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={previewed.id}
                initial={
                  reduced
                    ? false
                    : { opacity: 0, scale: 0.92, filter: "blur(10px)" }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={
                  reduced
                    ? undefined
                    : { opacity: 0, scale: 0.95, filter: "blur(8px)" }
                }
                transition={{
                  duration: 0.7,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="relative"
              >
                <DarkAvatar personality={previewed} size={300} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom row — name nav + pick button */}
        <div className="relative mt-12 flex items-center justify-between gap-8">
          {/* Left — personality name nav (acts as compact paginator).
              Uses two independent shared-layout underlines so the
              "current" (white) and "committed" (accent) markers slide
              smoothly between positions with spring physics. */}
          <nav className="flex items-center gap-8">
            {PERSONALITIES.map((p, i) => {
              const isCurrent = i === index;
              const isCommittedHere = committed === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className="relative px-1 pt-1 pb-2"
                >
                  <motion.span
                    className="font-serif inline-block"
                    style={{
                      fontSize: 18,
                      letterSpacing: "-0.01em",
                    }}
                    animate={{
                      color: isCurrent
                        ? "rgba(245,240,230,0.96)"
                        : isCommittedHere
                          ? "rgba(245,240,230,0.78)"
                          : "rgba(245,240,230,0.32)",
                      y: isCurrent ? -1 : 0,
                    }}
                    transition={{
                      duration: 0.45,
                      ease: [0.2, 0.7, 0.2, 1],
                    }}
                  >
                    {p.name}
                  </motion.span>

                  {/* Current — white underline that slides between names */}
                  {isCurrent && (
                    <motion.span
                      layoutId="nav-current-underline"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                      style={{ background: "rgba(245,240,230,0.85)" }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                        mass: 0.9,
                      }}
                    />
                  )}

                  {/* Committed — accent underline with glow that slides
                      to whichever name is picked. Independent from the
                      current marker so both can coexist (e.g. picked
                      Maven while previewing Sage). */}
                  {isCommittedHere && (
                    <motion.span
                      layoutId="nav-committed-underline"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                      style={{
                        background: p.accent,
                        boxShadow: `0 0 8px ${p.accent}, 0 0 18px ${p.accent}55`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                        mass: 0.9,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right — pick / continue */}
          <div className="flex items-center gap-7">
            {!isPickedThis && !committed && (
              <span
                className="text-[10.5px] tracking-[0.24em] uppercase hidden md:inline-block"
                style={{
                  color: "rgba(245,240,230,0.32)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                ← → to browse
              </span>
            )}

            {isPickedThis ? (
              <motion.button
                type="button"
                onClick={onContinue}
                initial={reduced ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={reduced ? undefined : { x: 4 }}
                className="group inline-flex items-center gap-3 font-serif px-1"
                style={{
                  fontSize: "clamp(1.0625rem, 1.4vw, 1.25rem)",
                  color: "rgba(245,240,230,0.98)",
                }}
              >
                <span>
                  Continue as{" "}
                  <span style={{ color: accent }}>{previewed.name}</span>
                </span>
                <motion.span
                  aria-hidden
                  animate={reduced ? undefined : { x: [0, 4, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ color: accent }}
                >
                  →
                </motion.span>
              </motion.button>
            ) : (
              <button
                type="button"
                onClick={pick}
                className="inline-flex items-center gap-2.5 h-12 px-6 rounded-full font-serif group"
                style={{
                  fontSize: 16,
                  background: "transparent",
                  border: `1px solid ${committed ? "rgba(245,240,230,0.18)" : `${accent}66`}`,
                  color: committed
                    ? "rgba(245,240,230,0.7)"
                    : "rgba(245,240,230,0.96)",
                  transition:
                    "border-color 0.4s ease, box-shadow 0.4s ease, color 0.4s ease",
                  boxShadow: committed ? "none" : `0 0 24px -8px ${accent}88`,
                }}
              >
                <span>Choose {previewed.name}</span>
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </OnboardingFrame>
  );
}
