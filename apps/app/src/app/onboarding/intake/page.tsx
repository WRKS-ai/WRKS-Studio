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

// Per brief Section 2.2 each personality has a distinct tone. Same
// three dimensions (business, audience, differentiator) — different
// phrasing.
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

  useEffect(() => {
    if (personalityId && !thinking) {
      const t = setTimeout(() => textareaRef.current?.focus(), 400);
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
    <OnboardingShell tint={personality.glow}>
      <div className="w-full max-w-[760px] flex flex-col items-center text-center">
        {/* Step indicator */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="text-[10px] tracking-[0.28em] uppercase text-ink-dim font-mono mb-2"
        >
          Act Four of Four · Talk to {agentName}
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
                width: i === 3 ? 26 : 8,
                height: 3,
                background:
                  i < 3
                    ? personality.accent
                    : i === 3
                      ? "rgba(255,255,255,0.65)"
                      : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </motion.div>

        {/* Agent presence — small but alive at the top */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex flex-col items-center"
        >
          <PersonalityIcon personality={personality} size="sm" />
          <div className="mt-3 font-serif italic text-[14px] text-ink-muted">
            {agentName} <span className="text-ink-dim">·</span> {personality.name}
          </div>
        </motion.div>

        {/* History — small, dim, above the current question */}
        {turns.length > 0 && (
          <div className="mt-10 sm:mt-12 w-full max-w-[640px] flex flex-col gap-6 text-left">
            <AnimatePresence initial={false}>
              {turns.map((t, i) => (
                <motion.div
                  key={i}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                  className="space-y-1.5"
                >
                  <p className="text-[11px] tracking-[0.18em] uppercase text-ink-dim font-mono">
                    {agentName} asked
                  </p>
                  <p className="font-serif italic text-[15px] text-ink-muted leading-snug">
                    {t.question}
                  </p>
                  <p className="font-serif text-[16px] text-ink/90 leading-relaxed pt-1">
                    {t.answer}
                  </p>
                  {(i < turns.length - 1 || !thinking) && (
                    <motion.p
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                      className="font-serif italic text-[13px] pt-1"
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

        {/* Current question or closing — hero scale, blur-in */}
        <div className="mt-10 sm:mt-14 w-full">
          <AnimatePresence mode="wait">
            {thinking ? (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-2 h-[80px]"
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
                        : { opacity: [0.3, 1, 0.3], y: [0, -4, 0] }
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
                transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
                className="font-serif font-medium tracking-tight text-[clamp(1.75rem,3.4vw,2.625rem)] leading-[1.08] text-ink max-w-[20ch] mx-auto"
              >
                {currentQuestion}
              </motion.h2>
            )}
          </AnimatePresence>
        </div>

        {/* Composer — no card, no border. Just text on the stage. */}
        {!isDone && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: thinking ? 0.3 : 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-8 sm:mt-10 w-full max-w-[640px] relative"
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
              className="w-full resize-none bg-transparent border-0 outline-none text-center font-serif text-[clamp(1.0625rem,1.4vw,1.25rem)] text-ink leading-relaxed placeholder:text-ink-dim/45 placeholder:italic disabled:opacity-50 pt-2 pb-4"
              style={{ caretColor: personality.accent }}
            />
            <div
              className="h-px transition-all duration-500"
              style={{
                background: `linear-gradient(to right, transparent 0%, ${trimmedAnswer ? personality.accent : "rgba(255,255,255,0.15)"} 50%, transparent 100%)`,
                opacity: trimmedAnswer ? 0.9 : 0.4,
                transform: trimmedAnswer ? "scaleX(1)" : "scaleX(0.7)",
                transformOrigin: "center",
              }}
            />

            {/* Send hint — subtle, replaces the chunky button */}
            <div className="mt-4 flex items-center justify-center gap-4 h-6">
              {canSend ? (
                <motion.button
                  type="button"
                  onClick={() => void onSend()}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={reduced ? undefined : { x: 3 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2.5 text-[12px] tracking-[0.18em] uppercase font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md px-1.5 py-1"
                  style={{ color: personality.accent }}
                >
                  <span>Send</span>
                  <span aria-hidden>↵</span>
                </motion.button>
              ) : (
                <span className="text-[10px] tracking-[0.18em] uppercase text-ink-dim font-mono">
                  Press Enter to send · Shift + Enter for a new line
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Question count — text, not dots (act-dots already at top) */}
        {!isDone && (
          <p className="mt-10 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
            Question {Math.min(turns.length + 1, 3)} of 3
          </p>
        )}

        {/* Inline back + continue */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-10 sm:mt-12 h-12 flex items-center justify-center gap-8"
        >
          <button
            type="button"
            onClick={() => router.push("/onboarding/voice")}
            className="text-[12px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink-muted transition-colors font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md px-1.5 py-1"
          >
            ← Back
          </button>
          {isDone && (
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
                Show me what you&rsquo;ve{" "}
                <span style={{ color: personality.accent }}>made</span>
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
