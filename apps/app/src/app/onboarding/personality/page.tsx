"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import {
  PersonalityChip,
  PersonalityIcon,
} from "@/components/personality-icon";
import {
  PERSONALITIES,
  type PersonalityId,
} from "@/lib/personalities";

const STORAGE_KEY = "wrks-onboarding-personality";
const DEFAULT_ID: PersonalityId = "sage";

export default function PersonalityPage() {
  const router = useRouter();
  // What's currently on stage (always shows a personality — defaults to one)
  const [active, setActive] = useState<PersonalityId>(DEFAULT_ID);
  // Whether the user has actually committed to a pick (vs just previewing)
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
  const isCommitted = committed === active;

  return (
    <OnboardingShell
      step={1}
      totalSteps={4}
      stepLabel="Step 1 · Meet your agent"
      heading="Pick the one that feels right."
      subheading="Each personality talks, decides, and shows up differently. Your agent will adapt to how you actually work — but this is who they are at heart."
      footer={
        <>
          <div className="text-[12px] text-ink-dim font-sans">
            {committed ? (
              <span>
                Going with{" "}
                <span className="text-ink">
                  {
                    PERSONALITIES.find((p) => p.id === committed)?.name
                  }
                </span>
              </span>
            ) : (
              <span>Tap one to meet them</span>
            )}
          </div>
          <motion.button
            type="button"
            onClick={onContinue}
            disabled={!committed}
            whileHover={committed ? { x: 2 } : undefined}
            whileTap={committed ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="h-11 px-5 rounded-[10px] bg-ink text-canvas text-[14px] font-sans font-semibold inline-flex items-center gap-2 transition-all hover:bg-white disabled:bg-white/[0.08] disabled:text-ink-dim disabled:cursor-not-allowed"
          >
            Continue
            <span aria-hidden>→</span>
          </motion.button>
        </>
      }
    >
      {/* Stage — big orb + name + tagline + sample quote */}
      <div className="flex flex-col items-center text-center min-h-[480px] sm:min-h-[560px]">
        <PersonalityIcon personality={activeP} size="lg" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeP.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-4 max-w-[440px]"
          >
            <h2 className="font-serif font-medium tracking-tight text-[clamp(2.25rem,3vw,2.75rem)] leading-[1.02] text-ink">
              {activeP.name}
            </h2>
            <p className="mt-2 text-[15px] text-ink-muted leading-relaxed">
              {activeP.tagline}
            </p>

            <div className="mt-5 flex items-center justify-center gap-1.5 flex-wrap">
              {activeP.traits.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 rounded-full text-[10px] tracking-[0.16em] uppercase font-sans font-medium text-ink-muted"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Sample quote */}
            <div className="mt-7 relative">
              <span
                aria-hidden
                className="absolute -left-3 -top-2 font-serif text-[36px] leading-none select-none"
                style={{ color: activeP.accent, opacity: 0.6 }}
              >
                &ldquo;
              </span>
              <p className="font-serif italic text-[clamp(1rem,1.4vw,1.125rem)] text-ink/90 leading-snug px-4">
                {activeP.sample}
              </p>
              <span
                aria-hidden
                className="absolute -right-3 -bottom-3 font-serif text-[36px] leading-none select-none"
                style={{ color: activeP.accent, opacity: 0.6 }}
              >
                &rdquo;
              </span>
            </div>

            {/* Commit hint when previewing without committing */}
            {!isCommitted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mt-6 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono"
              >
                Tap their name below to pick {activeP.name}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Selector chips — bottom row */}
      <div className="mt-10 sm:mt-12 grid grid-cols-4 gap-2 sm:gap-3 max-w-[480px] mx-auto">
        {PERSONALITIES.map((p) => (
          <PersonalityChip
            key={p.id}
            personality={p}
            selected={committed === p.id}
            onSelect={() => onSelect(p.id)}
          />
        ))}
      </div>
    </OnboardingShell>
  );
}
