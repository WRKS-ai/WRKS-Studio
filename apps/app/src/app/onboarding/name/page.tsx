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
const NEXT_WORDS = ["next", "continue", "intake", "business", "forward", "go", "ready"];
const BACK_WORDS = ["back", "previous", "voice", "personality"];

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
      router.replace("/onboarding/voice");
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
        // Same-tab localStorage writes don't fire `storage` events,
        // so the AgentHost wouldn't otherwise know to refresh the
        // transcript header. Dispatch a custom event it listens for.
        window.dispatchEvent(
          new CustomEvent("wrks:agent-name-changed", { detail: next }),
        );
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
      setTimeout(() => router.push("/onboarding/business"), 200);
      return `Continuing as ${final}.`;
    }

    if (
      BACK_WORDS.some((w) => destination === w || destination.includes(w))
    ) {
      setTimeout(() => router.push("/onboarding/voice"), 200);
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
    router.push("/onboarding/business");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canContinue) {
      e.preventDefault();
      onContinue();
    }
  };

  return (
    <OnboardingFrame step={2} totalSteps={8} bloomTint={accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 py-10 flex flex-col items-center justify-center overflow-hidden">
        {/* Asymmetric editorial spread — prompt on left, typed-name display
            on right. Echoes the /onboarding/voice grammar (type LEFT / hero
            object RIGHT) so the two pages read as the same composition rhythm.
            Eyebrow + glass card wrapper + redundant "Select a name" label all
            removed 2026-06-24 per the new design rules. */}
        <div className="relative w-full max-w-[1440px]">
          <div
            className="grid items-center gap-12 lg:gap-16"
            style={{
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr)",
            }}
          >
            {/* LEFT — prompt copy + Continue (mirrors voice page Continue
                column). Continue fades in once a valid name is entered. */}
            <div className="relative flex flex-col items-start">
              <motion.div
                initial={
                  reduced
                    ? false
                    : { opacity: 0, y: 14, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
                className="w-full"
              >
                <h1
                  style={{
                    // 2026-06-26: product-UI hero scale (max 52px) per
                    // `feedback_hero_scale_max_60px.md`. Restraint = premium.
                    fontSize: "clamp(1.875rem, 3.5vw, 3.25rem)",
                    fontWeight: 600,
                    lineHeight: 1.0,
                    letterSpacing: "-0.03em",
                    color: "rgba(245,240,230,0.98)",
                  }}
                >
                  What should we call them?
                </h1>
                <p
                  className="mt-5"
                  style={{
                    fontSize: "clamp(1rem, 1.35vw, 1.1875rem)",
                    lineHeight: 1.45,
                    letterSpacing: "-0.005em",
                    color: "rgba(245,240,230,0.55)",
                  }}
                >
                  Your agent will use this across every output.
                </p>
              </motion.div>

              <div className="mt-10 min-h-[56px]">
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
            </div>

            {/* RIGHT — typed-name display at hero scale, clickable to focus
                the hidden input. No glass card wrapper — name floats directly
                on the canvas, matching the editorial restraint of the voice page.
                Container height = display text height (no minHeight) so the
                absolutely-positioned input below aligns its caret with the
                visible text instead of centering in a taller empty box. */}
            <div
              className="relative cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              <div
                aria-hidden
                className="font-sans select-none pointer-events-none text-center"
                style={{
                  fontSize: "clamp(2rem, 4vw, 4rem)",
                  fontWeight: 500,
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
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
                className="absolute inset-0 w-full h-full bg-transparent border-0 outline-none p-0 font-sans text-center"
                style={{
                  fontSize: "clamp(2rem, 4vw, 4rem)",
                  fontWeight: 500,
                  // Match the display layer line-height EXACTLY so the
                  // input's caret sits on the same baseline as the visible
                  // typed name (otherwise the caret appears below the text).
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  color: "transparent",
                  caretColor: accent,
                }}
              />
            </div>
          </div>
        </div>

        {/* Back link — bottom-left chrome (matches voice page placement). */}
        <motion.button
          type="button"
          onClick={() => router.push("/onboarding/voice")}
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
