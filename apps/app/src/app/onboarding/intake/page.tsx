"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type PersonalityId,
} from "@/lib/personalities";
import { VOICES, type VoiceId } from "@/lib/voices";

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const INTAKE_KEY = "wrks-onboarding-intake";

type Turn = { question: string; answer: string };

// Per brief Section 2.2 each personality has a distinct tone. Same three
// dimensions (business, audience, differentiator) — different phrasing.
const PROMPTS: Record<
  PersonalityId,
  { questions: [string, string, string]; acks: [string, string, string]; closing: string }
> = {
  maven: {
    questions: [
      "Your business — what is it?",
      "Who do you serve?",
      "Why you, not the rest?",
    ],
    acks: ["Logged.", "Got it.", "Noted."],
    closing: "Enough. Building your first deliverables now.",
  },
  sage: {
    questions: [
      "Tell me about your business — what do you do, and what drew you to it?",
      "Who are you doing this for? Who do you want to help?",
      "What makes your approach genuinely different from others in this space?",
    ],
    acks: [
      "That's a good place to start.",
      "Makes sense — keep going.",
      "I can feel where this is headed.",
    ],
    closing: "I have what I need. Let me show you what we can build.",
  },
  spark: {
    questions: [
      "Okay! Tell me about your thing — what do you do?",
      "Who's it for?",
      "What makes it yours?",
    ],
    acks: ["Love it.", "Got it!", "Yes — that's the magic."],
    closing: "Yes! Wait til you see what I've got cooking.",
  },
  echo: {
    questions: [
      "Walk me through what you do.",
      "Who buys it? Who do you serve?",
      "What's your edge — what makes you the pick over anyone else?",
    ],
    acks: [
      "Tracking with you.",
      "Got it — I'm seeing it.",
      "Solid. That's the angle.",
    ],
    closing: "Alright. Drafting your first deliverables — give me a sec.",
  },
};

export default function IntakePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [composing, setComposing] = useState("");
  const [thinking, setThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate from previous steps — bounce back if any are missing.
  useEffect(() => {
    const p = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
    if (!p || !PERSONALITIES.some((x) => x.id === p)) {
      router.replace("/onboarding/personality");
      return;
    }
    const n = localStorage.getItem(NAME_KEY);
    if (!n) {
      router.replace("/onboarding/name");
      return;
    }
    const v = localStorage.getItem(VOICE_KEY) as VoiceId | null;
    if (!v || !VOICES.some((x) => x.id === v)) {
      router.replace("/onboarding/voice");
      return;
    }
    setPersonalityId(p);
    setAgentName(n);
  }, [router]);

  // Refocus composer after each agent "thinking" pause.
  useEffect(() => {
    if (personalityId && !thinking) {
      const t = setTimeout(() => textareaRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, [personalityId, turns.length, thinking]);

  if (!personalityId) return null;

  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const prompts = PROMPTS[personalityId];
  const currentIndex = turns.length;
  const isDone = turns.length >= 3;
  const currentQuestion = !isDone ? prompts.questions[currentIndex] : prompts.closing;

  const trimmedAnswer = composing.trim();
  const canSend = !isDone && !thinking && trimmedAnswer.length > 0;

  const onSend = async () => {
    if (!canSend) return;
    const newTurn: Turn = {
      question: prompts.questions[currentIndex],
      answer: trimmedAnswer,
    };
    setTurns((prev) => [...prev, newTurn]);
    setComposing("");
    setThinking(true);
    await new Promise((r) => setTimeout(r, 900));
    setThinking(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  };

  const onContinue = () => {
    if (!isDone) return;
    const payload = {
      business: turns[0]?.answer ?? "",
      audience: turns[1]?.answer ?? "",
      differentiator: turns[2]?.answer ?? "",
      turns,
    };
    localStorage.setItem(INTAKE_KEY, JSON.stringify(payload));
    router.push("/onboarding/wow");
  };

  return (
    <OnboardingShell
      step={4}
      totalSteps={4}
      stepLabel={`Step 4 · Talk to ${agentName}`}
      heading={`Talk to ${agentName}.`}
      subheading={`Three questions in your own words. By the end you'll see what ${agentName} can make for your business.`}
      footer={
        <>
          <button
            type="button"
            onClick={() => router.push("/onboarding/voice")}
            className="text-[12px] text-ink-dim hover:text-ink-muted transition-colors font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-[6px] px-1 py-0.5 -mx-1"
          >
            ← Back
          </button>
          <motion.button
            type="button"
            onClick={onContinue}
            disabled={!isDone}
            whileHover={isDone ? { x: 2 } : undefined}
            whileTap={isDone ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="h-11 px-5 rounded-[10px] bg-ink text-canvas text-[14px] font-sans font-semibold inline-flex items-center gap-2 transition-all hover:bg-white disabled:bg-white/[0.08] disabled:text-ink-dim disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
          >
            {isDone ? "Show me what you've made" : `${turns.length} of 3 answered`}
            <span aria-hidden>→</span>
          </motion.button>
        </>
      }
    >
      {/* Agent presence — matches the voice step's anchor */}
      <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
        <PersonalityIcon personality={personality} size="sm" />
        <div className="mt-3 text-[11px] tracking-[0.22em] uppercase text-ink-dim font-mono">
          {personality.name} · {agentName}
        </div>
      </div>

      {/* History — small, dim, scrollable as it grows */}
      {turns.length > 0 && (
        <div className="mb-8 sm:mb-10 max-w-[640px] mx-auto flex flex-col gap-5">
          <AnimatePresence initial={false}>
            {turns.map((t, i) => (
              <motion.div
                key={i}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                className="space-y-2"
              >
                <p className="text-[12px] text-ink-dim font-sans italic">
                  {t.question}
                </p>
                <p className="text-[14px] text-ink-muted font-serif leading-relaxed">
                  {t.answer}
                </p>
                {/* Acknowledgement appears once the agent has "thought" */}
                {(i < turns.length - 1 || (i === turns.length - 1 && !thinking)) && (
                  <motion.p
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="text-[12px] font-sans italic"
                    style={{ color: personality.accent }}
                  >
                    {prompts.acks[i]}
                  </motion.p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Current question — or thinking dots — or closing line */}
      <div className="max-w-[640px] mx-auto">
        <AnimatePresence mode="wait">
          {thinking ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 h-[60px]"
              aria-live="polite"
              aria-label={`${agentName} is thinking`}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-2 rounded-full"
                  style={{ background: personality.accent }}
                  animate={
                    reduced
                      ? { opacity: 0.6 }
                      : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }
                  }
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.h2
              key={`q-${currentIndex}`}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              className="font-serif font-medium tracking-tight text-[clamp(1.4rem,2.2vw,1.85rem)] leading-snug text-ink"
            >
              {currentQuestion}
            </motion.h2>
          )}
        </AnimatePresence>

        {/* Composer — hidden once intake is complete */}
        {!isDone && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: thinking ? 0.4 : 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-6 relative"
          >
            <textarea
              ref={textareaRef}
              value={composing}
              onChange={(e) => setComposing(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={thinking}
              rows={3}
              placeholder="Type as much or as little as you like…"
              aria-label="Your answer"
              className="w-full resize-none rounded-2xl px-4 py-3.5 pr-14 bg-white/[0.03] border border-white/[0.07] text-ink text-[15px] font-sans leading-relaxed placeholder:text-ink-dim/60 outline-none transition-colors focus:border-white/15 focus:bg-white/[0.04] disabled:opacity-50"
              style={{ caretColor: personality.accent }}
            />
            <button
              type="button"
              onClick={() => void onSend()}
              disabled={!canSend}
              aria-label="Send answer"
              className="absolute right-3 bottom-3 size-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
              style={{
                background: canSend
                  ? `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`
                  : "rgba(255,255,255,0.06)",
                boxShadow: canSend
                  ? `0 6px 16px -6px ${personality.glow}`
                  : "none",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 12l14 0M13 6l6 6-6 6"
                  stroke={canSend ? "white" : "rgba(255,255,255,0.5)"}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Progress dots */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => {
            const done = i < turns.length;
            const active = i === turns.length && !isDone;
            return (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: active ? 24 : 8,
                  background: done
                    ? personality.accent
                    : active
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(255,255,255,0.1)",
                }}
              />
            );
          })}
        </div>

        {/* Hint, only at the very start */}
        {turns.length === 0 && !thinking && (
          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-5 text-center text-[11px] tracking-[0.18em] uppercase text-ink-dim font-mono"
          >
            Press Enter to send · Shift + Enter for a new line
          </motion.p>
        )}
      </div>
    </OnboardingShell>
  );
}
