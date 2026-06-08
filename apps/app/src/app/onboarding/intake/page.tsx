"use client";

import { useConversationClientTool } from "@elevenlabs/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ContinueButton } from "@/components/continue-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { useOnboardingAgent } from "@/lib/onboarding-agent";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";

// Act Three — Intake. Three short questions to seed the wow
// deliverables: what the business is, who it's for, what the edge is.
//
// The agent (running in the layout) ASKS each question by voice and
// the user can either:
//   - speak the answer → agent calls set_field("business" | "audience"
//     | "differentiator", <answer>) and the on-screen card updates
//   - type into the field directly
//
// Either path fills the same fields. When all three are answered the
// Continue button enables; tapping it (or saying "go") routes to
// /onboarding/reference.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const INTAKE_KEY = "wrks-onboarding-intake";

type FieldKey = "business" | "audience" | "differentiator";

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

const QUESTIONS: Record<FieldKey, string> = {
  business: "What's your business?",
  audience: "Who's it for?",
  differentiator: "What's your edge?",
};

const FIELD_ORDER: FieldKey[] = ["business", "audience", "differentiator"];

const NEXT_WORDS = ["next", "continue", "reference", "forward", "go", "ready"];
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
  const { accent } = useOnboardingAgent();

  const [agentName, setAgentName] = useState<string>("");
  const [fields, setFields] = useState<Record<FieldKey, string>>({
    business: "",
    audience: "",
    differentiator: "",
  });
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
  const continuing = useRef(false);

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
    // Hydrate any saved intake data
    const saved = localStorage.getItem(INTAKE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          business?: string;
          audience?: string;
          differentiator?: string;
        };
        setFields({
          business: parsed.business ?? "",
          audience: parsed.audience ?? "",
          differentiator: parsed.differentiator ?? "",
        });
      } catch {
        /* ignore */
      }
    }
  }, [router]);

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(INTAKE_KEY, JSON.stringify(fields));
  }, [fields]);

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
    const target = resolveFieldKey(fieldName);
    if (!target) {
      return `I don't recognize the field "${fieldName}". Try "business", "audience", or "differentiator".`;
    }
    setFields((f) => ({ ...f, [target]: value }));
    return `Set ${target} to "${value.slice(0, 80)}${value.length > 80 ? "…" : ""}".`;
  });

  useConversationClientTool("navigate", (params) => {
    console.log("[onboarding/intake] navigate called with:", params);
    const destination = String(params?.destination ?? "")
      .trim()
      .toLowerCase();
    if (!destination) return "Where to?";

    if (
      NEXT_WORDS.some((w) => destination === w || destination.includes(w))
    ) {
      const allFilled = FIELD_ORDER.every((k) => fields[k].trim().length > 0);
      if (!allFilled) {
        return "Still need answers for the remaining questions before we move on.";
      }
      if (continuing.current) return "Already going.";
      continuing.current = true;
      localStorage.setItem(INTAKE_KEY, JSON.stringify(fields));
      setTimeout(() => router.push("/onboarding/reference"), 700);
      return "Continuing.";
    }

    if (
      BACK_WORDS.some((w) => destination === w || destination.includes(w))
    ) {
      setTimeout(() => router.push("/onboarding/name"), 500);
      return "Going back.";
    }

    return `From this page I can only go "next" or "back".`;
  });

  const allFilled = FIELD_ORDER.every((k) => fields[k].trim().length > 0);
  const filledCount = FIELD_ORDER.filter(
    (k) => fields[k].trim().length > 0,
  ).length;

  const onContinue = () => {
    if (!allFilled) return;
    localStorage.setItem(INTAKE_KEY, JSON.stringify(fields));
    router.push("/onboarding/reference");
  };

  return (
    <OnboardingFrame step={3} totalSteps={5} bloomTint={accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 py-10">
        {/* Eyebrow */}
        <motion.div
          initial={
            reduced ? false : { opacity: 0, y: 8, filter: "blur(6px)" }
          }
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex items-center gap-4"
        >
          <span
            className="inline-block h-px w-10"
            style={{ background: "rgba(245,240,230,0.2)" }}
          />
          <span
            className="text-[11px] tracking-[0.32em] uppercase"
            style={{
              color: "rgba(245,240,230,0.4)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Act Three — The Brief
          </span>
        </motion.div>

        {/* Center-stage glass card */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-260px)]">
          <motion.div
            initial={
              reduced
                ? false
                : { opacity: 0, y: 16, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="relative w-full max-w-[760px] mx-auto"
            style={{
              borderRadius: 32,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.07), 0 32px 80px -24px rgba(0,0,0,0.7)",
              padding: "44px 52px 40px",
              zIndex: 1,
            }}
          >
            {/* Header — agent name + progress */}
            <div className="flex items-center justify-between mb-7">
              <p
                className="font-sans"
                style={{
                  fontSize: 13,
                  letterSpacing: "0.02em",
                  color: "rgba(245,240,230,0.5)",
                }}
              >
                Three things {agentName || "your agent"} needs to know
              </p>
              <div className="flex items-center gap-1.5">
                {FIELD_ORDER.map((k, i) => {
                  const filled = fields[k].trim().length > 0;
                  return (
                    <span
                      key={k}
                      className="block rounded-full transition-all duration-500"
                      style={{
                        width: filled ? 18 : 6,
                        height: 3,
                        background: filled
                          ? accent
                          : "rgba(255,255,255,0.16)",
                        boxShadow: filled
                          ? `0 0 8px ${accent}aa`
                          : undefined,
                      }}
                      aria-label={`Step ${i + 1} ${filled ? "complete" : "pending"}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Field cards — one per question, with voice-fill UX */}
            <div className="flex flex-col gap-4">
              {FIELD_ORDER.map((key, i) => (
                <IntakeField
                  key={key}
                  index={i}
                  fieldKey={key}
                  question={QUESTIONS[key]}
                  value={fields[key]}
                  onChange={(v) =>
                    setFields((prev) => ({ ...prev, [key]: v }))
                  }
                  accent={accent}
                  focused={focusedField === key}
                  onFocus={() => setFocusedField(key)}
                  onBlur={() => setFocusedField(null)}
                  reduced={!!reduced}
                />
              ))}
            </div>

            {/* Continue */}
            <div className="mt-9 flex justify-center min-h-[56px]">
              <AnimatePresence>
                {allFilled && (
                  <motion.div
                    key="continue"
                    initial={
                      reduced
                        ? false
                        : { opacity: 0, y: 10, filter: "blur(4px)" }
                    }
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={reduced ? undefined : { opacity: 0, y: -4 }}
                    transition={{
                      duration: 0.45,
                      ease: [0.2, 0.7, 0.2, 1],
                    }}
                  >
                    <ContinueButton onClick={onContinue}>
                      Continue
                      <span aria-hidden style={{ marginLeft: "0.7em" }}>
                        →
                      </span>
                    </ContinueButton>
                  </motion.div>
                )}
              </AnimatePresence>
              {!allFilled && (
                <p
                  className="font-sans self-center"
                  style={{
                    fontSize: 12,
                    color: "rgba(245,240,230,0.32)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {filledCount} of 3 done — speak or type the rest
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Back link */}
        <motion.button
          type="button"
          onClick={() => router.push("/onboarding/name")}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute bottom-10 left-10 sm:left-14 text-[10.5px] tracking-[0.32em] uppercase transition-opacity hover:opacity-80"
          style={{
            color: "rgba(245,240,230,0.3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ← Back
        </motion.button>
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * IntakeField — one of three glass-card fields. Shows the question
 * at the top, the answer (typed or voice-filled) below. Accent
 * border lights up when focused or filled.
 * ============================================================ */
function IntakeField({
  index,
  fieldKey,
  question,
  value,
  onChange,
  accent,
  focused,
  onFocus,
  onBlur,
  reduced,
}: {
  index: number;
  fieldKey: FieldKey;
  question: string;
  value: string;
  onChange: (v: string) => void;
  accent: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  reduced: boolean;
}) {
  const filled = value.trim().length > 0;
  const ringTint = filled
    ? `${accent}55`
    : focused
      ? `${accent}66`
      : "rgba(255,255,255,0.08)";

  return (
    <motion.div
      initial={
        reduced ? false : { opacity: 0, y: 12, filter: "blur(4px)" }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.5,
        delay: 0.3 + index * 0.08,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className="relative"
      style={{
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)",
        border: `1px solid ${ringTint}`,
        boxShadow: filled
          ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 20px -8px ${accent}66`
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
        padding: "16px 20px",
      }}
    >
      <div className="flex items-baseline gap-3 mb-2">
        <span
          className="font-sans tabular-nums"
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            color: filled ? accent : "rgba(245,240,230,0.4)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
          }}
        >
          0{index + 1}
        </span>
        <p
          className="font-sans"
          style={{
            fontSize: 14,
            letterSpacing: "-0.01em",
            color: "rgba(245,240,230,0.85)",
            fontWeight: 500,
          }}
        >
          {question}
        </p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Speak or type your answer…"
        rows={2}
        aria-label={fieldKey}
        className="w-full bg-transparent border-0 outline-none resize-none font-sans"
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          letterSpacing: "-0.005em",
          color: "rgba(245,240,230,0.96)",
          caretColor: accent,
          minHeight: 44,
        }}
      />
    </motion.div>
  );
}
