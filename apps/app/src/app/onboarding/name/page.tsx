"use client";

import { useConversationClientTool } from "@elevenlabs/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ContinueButton } from "@/components/continue-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { useOnboardingAgent } from "@/lib/onboarding-agent";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";

// Act Two — The Name. The agent + Siri orb + conversation panel live
// in the onboarding layout now (apps/app/src/lib/onboarding-agent.tsx)
// and persist across pages. This page contributes:
//   - a glass card with the typed name display + Continue
//   - client-tool handlers for set_field("name", ...) and
//     navigate("next" / "back")
//
// The agent auto-greets on entry (handled by the layout's AgentHost).

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const MAX_LEN = 24;

const NAME_ALIASES = [
  "name",
  "my name",
  "your name",
  "agent name",
  "the name",
];
const NEXT_WORDS = ["next", "continue", "intake", "forward", "go", "ready"];
const BACK_WORDS = ["back", "previous", "personality"];

export default function NamePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { accent } = useOnboardingAgent();

  const [name, setName] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const continuing = useRef(false);

  // Bounce out if the user landed here without picking a personality.
  useEffect(() => {
    const saved = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
    if (!saved || !PERSONALITIES.some((p) => p.id === saved)) {
      router.replace("/onboarding/personality");
    }
  }, [router]);

  // Hydrate previously-typed name
  useEffect(() => {
    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) setName(savedName);
  }, []);

  /* ── Tool handlers — set_field for name, navigate for next/back ── */
  useConversationClientTool("set_field", (params) => {
    console.log("[onboarding/name] set_field called with:", params);
    const fieldName = String(params?.field ?? "").trim().toLowerCase();
    const rawValue = String(
      params?.value ??
        (params as { name?: unknown })?.name ??
        (params as { new_value?: unknown })?.new_value ??
        (params as { text?: unknown })?.text ??
        "",
    ).trim();
    if (!rawValue) return "Tell me what to set it to.";
    const matchesName = NAME_ALIASES.some(
      (a) => fieldName === a || fieldName.includes(a) || a.includes(fieldName),
    );
    if (matchesName || !fieldName) {
      const next = rawValue.slice(0, MAX_LEN);
      setName(next);
      try {
        localStorage.setItem(NAME_KEY, next);
      } catch {
        /* ignore */
      }
      setTimeout(() => inputRef.current?.focus(), 0);
      return `Set the agent name to "${next}".`;
    }
    return `The only field editable here is the agent's name. I don't see "${fieldName}".`;
  });

  useConversationClientTool("navigate", (params) => {
    console.log("[onboarding/name] navigate called with:", params);
    const destination = String(params?.destination ?? "")
      .trim()
      .toLowerCase();
    if (!destination) return "Where to?";

    if (
      NEXT_WORDS.some((w) => destination === w || destination.includes(w))
    ) {
      const final = name.trim();
      if (!final) return "There's no name in the field yet. Pick one first.";
      if (continuing.current) return "Already going.";
      continuing.current = true;
      localStorage.setItem(NAME_KEY, final);
      // Tiny delay so the agent's confirmation can play. 200ms is
      // imperceptible vs. the prior 900ms which felt sluggish.
      setTimeout(() => router.push("/onboarding/intake"), 200);
      return `Continuing as ${final}.`;
    }

    if (
      BACK_WORDS.some((w) => destination === w || destination.includes(w))
    ) {
      setTimeout(() => router.push("/onboarding/personality"), 200);
      return "Going back.";
    }

    return `From this page I can only go "next" or "back".`;
  });

  // Focus input after a beat
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 1100);
    return () => clearTimeout(t);
  }, []);

  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && trimmed.length <= MAX_LEN;

  const onContinue = () => {
    if (!canContinue) return;
    localStorage.setItem(NAME_KEY, trimmed);
    router.push("/onboarding/intake");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canContinue) {
      e.preventDefault();
      onContinue();
    }
  };

  return (
    <OnboardingFrame step={2} totalSteps={5} bloomTint={accent}>
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
            Act Two — The Name
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
            className="relative w-full max-w-[720px] mx-auto"
            style={{
              borderRadius: 32,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.07), 0 32px 80px -24px rgba(0,0,0,0.7)",
              padding: "56px 64px 52px",
              zIndex: 1,
            }}
          >
            <p
              className="font-sans text-center"
              style={{
                fontSize: 13,
                letterSpacing: "0.02em",
                color: "rgba(245,240,230,0.42)",
                marginBottom: 28,
              }}
            >
              Select a name for your agent
            </p>

            <div
              className="relative cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              <div
                aria-hidden
                className="font-sans select-none pointer-events-none text-center"
                style={{
                  fontSize: "clamp(2.75rem, 5.6vw, 5rem)",
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  color: "rgba(245,240,230,0.98)",
                }}
              >
                <AnimatePresence mode="wait">
                  {trimmed ? (
                    <motion.span
                      key={trimmed}
                      initial={
                        reduced
                          ? false
                          : { opacity: 0, y: 10, filter: "blur(4px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={
                        reduced
                          ? undefined
                          : { opacity: 0, y: -6, filter: "blur(4px)" }
                      }
                      transition={{
                        duration: 0.4,
                        ease: [0.2, 0.7, 0.2, 1],
                      }}
                      style={{ display: "inline-block" }}
                    >
                      {trimmed}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="prompt"
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: inputFocused ? 0.2 : 1 }}
                      exit={reduced ? undefined : { opacity: 0, y: 6 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: "inline-block",
                        color: "rgba(245,240,230,0.32)",
                      }}
                    >
                      Type a name
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, MAX_LEN))}
                onKeyDown={onKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder=""
                maxLength={MAX_LEN}
                autoComplete="off"
                spellCheck={false}
                aria-label="Agent name"
                className="absolute inset-0 w-full h-full bg-transparent border-0 outline-none font-sans text-center"
                style={{
                  fontSize: "clamp(2.75rem, 5.6vw, 5rem)",
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  color: "transparent",
                  caretColor: accent,
                }}
              />
            </div>

            <div className="mt-10 flex justify-center min-h-[56px]">
              <AnimatePresence>
                {canContinue && (
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
            </div>
          </motion.div>
        </div>

        {/* Back link */}
        <motion.button
          type="button"
          onClick={() => router.push("/onboarding/personality")}
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
