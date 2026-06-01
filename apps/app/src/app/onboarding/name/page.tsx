"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type PersonalityId,
} from "@/lib/personalities";

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const MAX_LEN = 24;

export default function NamePage() {
  const router = useRouter();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Read prior steps from localStorage
  useEffect(() => {
    const savedPersonality = localStorage.getItem(
      PERSONALITY_KEY,
    ) as PersonalityId | null;
    if (
      !savedPersonality ||
      !PERSONALITIES.some((p) => p.id === savedPersonality)
    ) {
      // Skipped step 1 — bounce back
      router.replace("/onboarding/personality");
      return;
    }
    setPersonalityId(savedPersonality);
    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) setName(savedName);
  }, [router]);

  // Focus the input once personality loads
  useEffect(() => {
    if (personalityId && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, [personalityId]);

  if (!personalityId) {
    return null; // wait for redirect or load
  }

  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && trimmed.length <= MAX_LEN;

  const pickSuggestion = (n: string) => {
    setName(n);
    inputRef.current?.focus();
  };

  const onContinue = () => {
    if (!canContinue) return;
    localStorage.setItem(NAME_KEY, trimmed);
    router.push("/onboarding/voice");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canContinue) {
      e.preventDefault();
      onContinue();
    }
  };

  const introLine = `Hey — I'd answer to anything.`;

  return (
    <OnboardingShell
      step={2}
      totalSteps={4}
      stepLabel={`Step 2 · ${personality.name}'s name`}
      heading={`What should they answer to?`}
      subheading={`Your agent's name shows up in every conversation. Pick something you'd love to say out loud — or type your own.`}
      footer={
        <>
          <button
            type="button"
            onClick={() => router.push("/onboarding/personality")}
            className="text-[12px] text-ink-dim hover:text-ink-muted transition-colors font-sans"
          >
            ← Back
          </button>
          <motion.button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            whileHover={canContinue ? { x: 2 } : undefined}
            whileTap={canContinue ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="h-11 px-5 rounded-[10px] bg-ink text-canvas text-[14px] font-sans font-semibold inline-flex items-center gap-2 transition-all hover:bg-white disabled:bg-white/[0.08] disabled:text-ink-dim disabled:cursor-not-allowed"
          >
            {canContinue ? `Continue as ${trimmed}` : "Continue"}
            <span aria-hidden>→</span>
          </motion.button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center min-h-[420px] sm:min-h-[500px]">
        {/* Small orb with personality's motion */}
        <PersonalityIcon personality={personality} size="md" />

        {/* Agent introduces itself */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-6 max-w-[440px]"
        >
          <p className="font-serif italic text-[15px] text-ink-muted">
            <span
              aria-hidden
              className="text-[18px] mr-1"
              style={{ color: personality.accent, opacity: 0.7 }}
            >
              &ldquo;
            </span>
            {introLine}
            <span
              aria-hidden
              className="text-[18px] ml-1"
              style={{ color: personality.accent, opacity: 0.7 }}
            >
              &rdquo;
            </span>
          </p>
        </motion.div>

        {/* Name input */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-9 w-full max-w-[440px]"
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={onKeyDown}
              placeholder={personality.suggestedNames[0]}
              maxLength={MAX_LEN}
              autoComplete="off"
              spellCheck={false}
              aria-label="Agent name"
              className="w-full bg-transparent border-0 outline-none text-center font-serif font-medium tracking-tight text-[clamp(2.25rem,3.5vw,3rem)] leading-[1.05] text-ink placeholder:text-ink-dim/40 transition-colors pt-2 pb-3"
              style={{ caretColor: personality.accent }}
            />
            {/* Underline that brightens with focus + content */}
            <div
              className="h-px transition-all duration-300"
              style={{
                background: `linear-gradient(to right, transparent 0%, ${trimmed ? personality.accent : "rgba(255,255,255,0.12)"} 50%, transparent 100%)`,
                opacity: trimmed ? 0.85 : 0.5,
              }}
            />
          </div>

          {/* Tiny meta — character count when getting long */}
          <div className="h-4 mt-2 flex items-center justify-center text-[10px] tracking-[0.2em] uppercase text-ink-dim font-mono">
            {trimmed.length > MAX_LEN - 4
              ? `${trimmed.length} / ${MAX_LEN}`
              : ""}
          </div>
        </motion.div>

        {/* Suggested names */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-8 w-full max-w-[440px]"
        >
          <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono mb-3">
            Or try
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <AnimatePresence>
              {personality.suggestedNames.map((suggested, i) => {
                const isPicked =
                  trimmed.toLowerCase() === suggested.toLowerCase();
                return (
                  <motion.button
                    key={suggested}
                    type="button"
                    onClick={() => pickSuggestion(suggested)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.6 + i * 0.05,
                      ease: [0.2, 0.7, 0.2, 1],
                    }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative px-3.5 py-1.5 rounded-full text-[13px] font-sans transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
                    style={{
                      background: isPicked
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.02)",
                      border: `1px solid ${
                        isPicked
                          ? personality.accent
                          : "rgba(255,255,255,0.08)"
                      }`,
                      color: isPicked
                        ? "rgb(243 244 246)"
                        : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {suggested}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </OnboardingShell>
  );
}
