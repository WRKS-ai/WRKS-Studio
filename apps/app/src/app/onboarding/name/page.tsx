"use client";

import { motion, useReducedMotion } from "motion/react";
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

const HEADING = ["What", "should", "they", "answer", "to?"];

export default function NamePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(null);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
    if (!saved || !PERSONALITIES.some((p) => p.id === saved)) {
      router.replace("/onboarding/personality");
      return;
    }
    setPersonalityId(saved);
    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) setName(savedName);
  }, [router]);

  useEffect(() => {
    if (personalityId && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 600);
      return () => clearTimeout(t);
    }
  }, [personalityId]);

  if (!personalityId) return null;

  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && trimmed.length <= MAX_LEN;

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

  return (
    <OnboardingShell tint={personality.glow}>
      <div className="w-full max-w-[900px] flex flex-col items-center text-center">
        {/* Step indicator — same pattern across all 4 acts */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="text-[10px] tracking-[0.28em] uppercase text-ink-dim font-mono mb-2"
        >
          Act Two of Four · Name them
        </motion.div>

        {/* Progress dots */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-2 mt-3 mb-8 sm:mb-10"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === 1 ? 26 : 8,
                height: 3,
                background:
                  i < 1
                    ? personality.accent
                    : i === 1
                      ? "rgba(255,255,255,0.65)"
                      : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </motion.div>

        {/* Hero heading */}
        <h1 className="font-serif font-medium tracking-tight text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.98] text-ink max-w-[18ch]">
          {HEADING.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(10px)" }}
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

        {/* Subheading — the agent introduces itself */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
          className="mt-5 max-w-md text-[15px] sm:text-base text-ink-muted leading-relaxed font-serif italic"
        >
          They&rsquo;ll answer to anything. Pick something you&rsquo;d love to say out loud.
        </motion.p>

        {/* Personality orb — the agent waiting to be named */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-12 sm:mt-16"
        >
          <PersonalityIcon personality={personality} size="lg" />
        </motion.div>

        {/* Hero-scale name input — no card, no border, just an underline */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-10 sm:mt-12 w-full max-w-[600px] relative"
        >
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
            className="w-full bg-transparent border-0 outline-none text-center font-serif font-medium tracking-tight text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.0] text-ink placeholder:text-ink-dim/30 pt-2 pb-3"
            style={{ caretColor: personality.accent }}
          />
          <div
            className="h-px transition-all duration-500"
            style={{
              background: `linear-gradient(to right, transparent 0%, ${trimmed ? personality.accent : "rgba(255,255,255,0.15)"} 50%, transparent 100%)`,
              opacity: trimmed ? 0.9 : 0.5,
              transform: trimmed ? "scaleX(1)" : "scaleX(0.6)",
              transformOrigin: "center",
            }}
          />
          {trimmed.length > MAX_LEN - 4 && (
            <div className="mt-2 text-[10px] tracking-[0.2em] uppercase text-ink-dim font-mono">
              {trimmed.length} / {MAX_LEN}
            </div>
          )}
        </motion.div>

        {/* Suggested names — serif italic inline, no pill chrome */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-8 sm:mt-10 flex items-center justify-center gap-3 sm:gap-5 flex-wrap"
        >
          <span className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
            Or try
          </span>
          {personality.suggestedNames.map((suggested, i) => {
            const picked = trimmed.toLowerCase() === suggested.toLowerCase();
            return (
              <motion.button
                key={suggested}
                type="button"
                onClick={() => {
                  setName(suggested);
                  inputRef.current?.focus();
                }}
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 1.25 + i * 0.05,
                  duration: 0.4,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                whileHover={reduced ? undefined : { y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="font-serif italic text-[clamp(0.95rem,1.2vw,1.0625rem)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md px-1.5 py-0.5"
                style={{
                  color: picked ? personality.accent : "rgb(163 163 163)",
                  textDecoration: picked ? "underline" : "none",
                  textUnderlineOffset: "4px",
                }}
              >
                {suggested}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Inline continue + back */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.45, duration: 0.6 }}
          className="mt-12 sm:mt-14 h-12 flex items-center justify-center gap-8"
        >
          <button
            type="button"
            onClick={() => router.push("/onboarding/personality")}
            className="text-[12px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink-muted transition-colors font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md px-1.5 py-1"
          >
            ← Back
          </button>
          {canContinue && (
            <motion.button
              type="button"
              onClick={onContinue}
              initial={reduced ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              whileHover={reduced ? undefined : { x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-3 font-serif text-[clamp(1.125rem,1.6vw,1.375rem)] text-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md px-2 py-1"
            >
              <span>
                Continue as{" "}
                <span style={{ color: personality.accent }}>{trimmed}</span>
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
      </div>
    </OnboardingShell>
  );
}
