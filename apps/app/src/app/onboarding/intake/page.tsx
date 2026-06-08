"use client";

import { useConversationClientTool } from "@elevenlabs/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ContinueButton } from "@/components/continue-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { useOnboardingAgent } from "@/lib/onboarding-agent";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";

// Act Three — The Brief.
//
// Editorial single-question canvas. One huge Fraunces question on the
// left, a sparse step ledger on the right, inline answer below the
// question. No card chrome anywhere — the page itself carries the
// design.
//
// The voice agent can:
//   - set_field("business" | "audience" | "differentiator", <answer>)
//   - navigate("next" | "back")
// Typing into the inline field works too; Enter advances.
//
// Neutral chrome: this page intentionally avoids the personality
// accent. Cream/white only — the accent (and the glass-card pattern)
// were reading as a chatbot box. The breath bloom on OnboardingFrame
// is set to undefined so the warm cream default applies.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const INTAKE_KEY = "wrks-onboarding-intake";

type FieldKey = "business" | "audience" | "differentiator";

const FIELD_ORDER: FieldKey[] = ["business", "audience", "differentiator"];

const FIELD_ALIASES: Record<FieldKey, string[]> = {
  business: [
    "business",
    "what i do",
    "what you do",
    "company",
    "what's your business",
    "the business",
  ],
  audience: [
    "audience",
    "who",
    "who it's for",
    "who for",
    "customer",
    "customers",
    "target",
  ],
  differentiator: [
    "differentiator",
    "edge",
    "different",
    "unique",
    "what makes",
    "your edge",
    "what makes you",
  ],
};

const QUESTIONS: Record<FieldKey, { hero: string; label: string; hint: string }> = {
  business: {
    hero: "What you do.",
    label: "Business",
    hint: "One or two sentences on what the business is.",
  },
  audience: {
    hero: "Who it's for.",
    label: "Audience",
    hint: "The people you're trying to reach.",
  },
  differentiator: {
    hero: "Your edge.",
    label: "Edge",
    hint: "Why someone picks you over the alternatives.",
  },
};

const NEXT_WORDS = ["next", "continue", "reference", "forward", "go", "ready", "done"];
const BACK_WORDS = ["back", "previous", "name"];

function resolveFieldKey(spoken: string): FieldKey | null {
  const key = spoken.trim().toLowerCase();
  if (!key) return null;
  for (const field of FIELD_ORDER) {
    for (const alias of FIELD_ALIASES[field]) {
      if (key === alias || key.includes(alias) || alias.includes(key)) {
        return field;
      }
    }
  }
  return null;
}

export default function IntakePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { voice, voiceState } = useOnboardingAgent();

  const [agentName, setAgentName] = useState<string>("");
  const [fields, setFields] = useState<Record<FieldKey, string>>({
    business: "",
    audience: "",
    differentiator: "",
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const continuing = useRef(false);

  const currentKey = FIELD_ORDER[currentIdx];
  const currentValue = fields[currentKey];
  const currentMeta = QUESTIONS[currentKey];
  const allFilled = FIELD_ORDER.every((k) => fields[k].trim().length > 0);
  const isLast = currentIdx === FIELD_ORDER.length - 1;
  const currentFilled = currentValue.trim().length > 0;

  // Bounce out if upstream isn't done
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
    setAgentName(n);
    const saved = localStorage.getItem(INTAKE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<Record<FieldKey, string>>;
        const next: Record<FieldKey, string> = {
          business: parsed.business ?? "",
          audience: parsed.audience ?? "",
          differentiator: parsed.differentiator ?? "",
        };
        setFields(next);
        // Land the user on the first unfilled question
        const firstEmpty = FIELD_ORDER.findIndex(
          (k) => next[k].trim().length === 0,
        );
        if (firstEmpty >= 0) setCurrentIdx(firstEmpty);
      } catch {
        /* ignore */
      }
    }
  }, [router]);

  useEffect(() => {
    localStorage.setItem(INTAKE_KEY, JSON.stringify(fields));
  }, [fields]);

  // Re-focus the textarea whenever the active question changes.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [currentIdx]);

  // Auto-size the textarea to its content. Keeps the spacing tight
  // when the answer is a single line and lets the field grow cleanly
  // for longer answers — without leaving a dead zone above the CTA.
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(72, ta.scrollHeight)}px`;
  }, [currentIdx, fields]);

  const advance = () => {
    if (!currentFilled) return;
    if (!isLast) {
      setCurrentIdx((i) => Math.min(i + 1, FIELD_ORDER.length - 1));
      return;
    }
    if (!allFilled || continuing.current) return;
    continuing.current = true;
    localStorage.setItem(INTAKE_KEY, JSON.stringify(fields));
    router.push("/onboarding/reference");
  };

  const regress = () => {
    if (currentIdx === 0) {
      router.push("/onboarding/name");
      return;
    }
    setCurrentIdx((i) => Math.max(i - 1, 0));
  };

  /* ── Tool handlers ── */
  useConversationClientTool("set_field", (params) => {
    console.log("[onboarding/intake] set_field called with:", params);
    const fieldName = String(params?.field ?? "").trim().toLowerCase();
    const value = String(
      params?.value ??
        (params as { text?: unknown })?.text ??
        (params as { new_value?: unknown })?.new_value ??
        "",
    ).trim();
    if (!value) return "Tell me what to set it to.";
    // If no field name was supplied, fill the currently active question.
    const target = fieldName ? resolveFieldKey(fieldName) : currentKey;
    if (!target) {
      return `I don't recognize the field "${fieldName}". Try business, audience, or edge.`;
    }
    setFields((f) => ({ ...f, [target]: value }));
    // If the agent answered the current question, auto-advance after a beat
    // so the next serif headline swaps in cleanly.
    if (target === currentKey && !isLast) {
      setTimeout(() => setCurrentIdx((i) => Math.min(i + 1, FIELD_ORDER.length - 1)), 600);
    } else if (target !== currentKey) {
      // The agent jumped to a different field. Jump the focus to match.
      setTimeout(
        () => setCurrentIdx(FIELD_ORDER.indexOf(target)),
        300,
      );
    }
    return `Set ${target} to "${value.slice(0, 80)}${value.length > 80 ? "…" : ""}".`;
  });

  useConversationClientTool("navigate", (params) => {
    console.log("[onboarding/intake] navigate called with:", params);
    const destination = String(params?.destination ?? "")
      .trim()
      .toLowerCase();
    if (!destination) return "Where to?";

    if (NEXT_WORDS.some((w) => destination === w || destination.includes(w))) {
      if (!currentFilled) {
        return `Still need an answer for ${currentMeta.label.toLowerCase()} first.`;
      }
      if (!isLast) {
        setCurrentIdx((i) => Math.min(i + 1, FIELD_ORDER.length - 1));
        return `On to ${QUESTIONS[FIELD_ORDER[currentIdx + 1]].label.toLowerCase()}.`;
      }
      if (!allFilled) {
        return "Still missing one of the answers.";
      }
      if (continuing.current) return "Already going.";
      continuing.current = true;
      localStorage.setItem(INTAKE_KEY, JSON.stringify(fields));
      setTimeout(() => router.push("/onboarding/reference"), 700);
      return "Continuing.";
    }

    if (BACK_WORDS.some((w) => destination === w || destination.includes(w))) {
      if (currentIdx === 0) {
        setTimeout(() => router.push("/onboarding/name"), 500);
        return "Going back to the name step.";
      }
      setCurrentIdx((i) => Math.max(i - 1, 0));
      return `Back to ${QUESTIONS[FIELD_ORDER[currentIdx - 1]].label.toLowerCase()}.`;
    }

    return `From this page I can only go "next" or "back".`;
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      advance();
    }
  };

  const filledCount = FIELD_ORDER.filter(
    (k) => fields[k].trim().length > 0,
  ).length;
  const ctaLabel = isLast && allFilled ? "Continue" : "Next";

  return (
    <OnboardingFrame step={3} totalSteps={5} bloomTint={undefined}>
      <div className="relative mx-auto max-w-[1440px] min-h-[calc(100vh-120px)] px-10 sm:px-14 py-12">
        {/* Eyebrow */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex items-center gap-4"
        >
          <span
            className="inline-block h-px w-10"
            style={{ background: "rgba(245,240,230,0.22)" }}
          />
          <span
            className="text-[11px] tracking-[0.32em] uppercase"
            style={{
              color: "rgba(245,240,230,0.42)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Act Three — The Brief
          </span>
        </motion.div>

        {/* Body — asymmetric grid. Outer wrapper caps at 1440px to
            match /personality; the grid fills that width with a 1.55:1
            asymmetric proportion. Left col holds the focal headline +
            answer (answer section itself stays at 720px max for visual
            consistency with /name's card); right col is the ledger. */}
        <div
          className="mt-20 grid gap-x-12 lg:gap-x-16 gap-y-10"
          style={{
            gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)",
          }}
        >
          {/* Left — hero question + inline answer.
              Hero phrasing is parallel and always 1 line, so the wrapper
              takes its natural height with no minHeight reservation.
              popLayout mode keeps the exiting headline out of the layout
              while the new one mounts, so there's no collapse-then-grow
              gap that pushes the labels below up and down. */}
          <div className="flex flex-col">
            <AnimatePresence mode="popLayout">
              <motion.h1
                key={currentKey}
                initial={
                  reduced
                    ? false
                    : { opacity: 0, y: 14, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduced
                    ? undefined
                    : { opacity: 0, y: -10, filter: "blur(6px)" }
                }
                transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                className="font-serif"
                style={{
                  fontSize: "clamp(3.25rem, 6.4vw, 5.75rem)",
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: "-0.035em",
                  color: "rgba(245,240,230,0.97)",
                  margin: 0,
                }}
              >
                {currentMeta.hero}
              </motion.h1>
            </AnimatePresence>

            {/* Listening line + answer — persistent. Voice-state changes
                drive a subtle crossfade on the label; question changes
                just swap the hint text without remounting anything.
                Section width matches the /name card (720px) for
                cross-step visual consistency. */}
            <div className="mt-12 max-w-[720px]">
              <div className="flex items-center gap-3">
                <ListeningDot
                  active={
                    voiceState === "listening" || voiceState === "speaking"
                  }
                  reduced={!!reduced}
                />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={voiceState}
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-[11px] tracking-[0.28em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.46)",
                      fontFamily: "var(--font-mono)",
                      margin: 0,
                    }}
                  >
                    {voiceState === "speaking"
                      ? `${voice?.name ?? "Agent"} speaking`
                      : voiceState === "listening"
                        ? `${voice?.name ?? "Agent"} listening — speak or type`
                        : "Speak or type your answer"}
                  </motion.p>
                </AnimatePresence>
              </div>

              <p
                key={`${currentKey}-hint-text`}
                className="mt-3 font-sans"
                style={{
                  fontSize: 13,
                  letterSpacing: "0.005em",
                  color: "rgba(245,240,230,0.36)",
                  minHeight: 20,
                }}
              >
                {currentMeta.hint}
              </p>

              <div className="mt-6 relative">
                {/* Hairline above answer line — quiet anchor */}
                <span
                  aria-hidden
                  className="absolute -top-2 left-0 right-0 h-px"
                  style={{ background: "rgba(245,240,230,0.09)" }}
                />
                <textarea
                  ref={inputRef}
                  value={currentValue}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, [currentKey]: e.target.value }))
                  }
                  onKeyDown={onKeyDown}
                  placeholder="Your answer…"
                  rows={2}
                  aria-label={currentMeta.label}
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full bg-transparent border-0 outline-none resize-none font-sans overflow-hidden"
                  style={{
                    fontSize: "clamp(1.25rem, 1.9vw, 1.625rem)",
                    lineHeight: 1.45,
                    letterSpacing: "-0.012em",
                    color: "rgba(245,240,230,0.96)",
                    caretColor: "rgba(245,240,230,0.96)",
                    padding: "8px 0 4px",
                    minHeight: 72,
                  }}
                />
              </div>

              {/* Next / Continue — single mount; visibility animates on
                  currentFilled only. Button does NOT remount per question,
                  so it never glitches sideways across the transition. */}
              <div
                className="mt-7 flex items-center"
                style={{ minHeight: 56 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {currentFilled ? (
                    <motion.div
                      key="cta"
                      initial={
                        reduced
                          ? false
                          : { opacity: 0, y: 6, filter: "blur(3px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={reduced ? undefined : { opacity: 0, y: -3 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.2, 0.7, 0.2, 1],
                      }}
                    >
                      <ContinueButton
                        onClick={advance}
                        disabled={isLast && !allFilled}
                      >
                        {ctaLabel}
                        <span aria-hidden style={{ marginLeft: "0.7em" }}>
                          →
                        </span>
                      </ContinueButton>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="cta-hint"
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduced ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="font-sans"
                      style={{
                        fontSize: 12,
                        color: "rgba(245,240,230,0.32)",
                        letterSpacing: "0.02em",
                        margin: 0,
                      }}
                    >
                      {filledCount === 0
                        ? `${agentName || "Your agent"} is ready. Start with this one.`
                        : `${filledCount} of ${FIELD_ORDER.length} answered — one more${
                            isLast ? "" : " of three"
                          } to go.`}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right — sparse step ledger */}
          <div className="hidden md:flex flex-col gap-5 pt-3">
              {FIELD_ORDER.map((key, i) => {
                const isCurrent = i === currentIdx;
                const isDone = fields[key].trim().length > 0;
                const isFuture = i > currentIdx && !isDone;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setCurrentIdx(i)}
                    className="group text-left flex items-baseline gap-4 transition-opacity"
                    style={{
                      opacity: isCurrent ? 1 : isFuture ? 0.32 : 0.62,
                      cursor: "pointer",
                    }}
                  >
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.18em",
                        color: "rgba(245,240,230,0.6)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className="font-serif"
                          style={{
                            fontSize: 19,
                            letterSpacing: "-0.015em",
                            color: "rgba(245,240,230,0.94)",
                            fontWeight: 500,
                          }}
                        >
                          {QUESTIONS[key].label}
                        </span>
                        {isDone && !isCurrent && (
                          <span
                            aria-hidden
                            style={{
                              fontSize: 11,
                              color: "rgba(245,240,230,0.55)",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      {isDone && (
                        <p
                          className="font-sans truncate"
                          style={{
                            fontSize: 12.5,
                            lineHeight: 1.45,
                            letterSpacing: "0.005em",
                            color: "rgba(245,240,230,0.5)",
                            maxWidth: "32ch",
                          }}
                          title={fields[key]}
                        >
                          {fields[key]}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Back link */}
        <motion.button
          type="button"
          onClick={regress}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute bottom-10 left-10 sm:left-14 text-[10.5px] tracking-[0.32em] uppercase transition-opacity hover:opacity-80"
          style={{
            color: "rgba(245,240,230,0.34)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ← {currentIdx === 0 ? "Back" : "Previous"}
        </motion.button>
      </div>
    </OnboardingFrame>
  );
}

function ListeningDot({
  active,
  reduced,
}: {
  active: boolean;
  reduced: boolean;
}) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <motion.span
        aria-hidden
        className="inline-block rounded-full"
        style={{
          width: 6,
          height: 6,
          background: active
            ? "rgba(245,240,230,0.92)"
            : "rgba(245,240,230,0.32)",
          boxShadow: active
            ? "0 0 8px rgba(245,240,230,0.6)"
            : undefined,
        }}
        animate={
          reduced || !active
            ? { opacity: active ? 1 : 0.7 }
            : { opacity: [0.5, 1, 0.5] }
        }
        transition={
          reduced || !active
            ? { duration: 0.3 }
            : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
        }
      />
    </span>
  );
}
