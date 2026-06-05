"use client";

import {
  ConversationProvider,
  useConversation,
  useConversationClientTool,
} from "@elevenlabs/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";
import {
  buildOnboardingFirstMessage,
  buildOnboardingSystemPrompt,
} from "@/lib/voice-agent";
import { VOICES } from "@/lib/voices";

// Act Two — The Name. The page is a focused naming form
// (hero + input + chips + continue) center-stage. The live agent
// runs as a small floating glass widget pinned to the bottom-right
// corner — it auto-greets on mount, talks naturally, fills the input
// via the set_field tool, and advances via the navigate tool. The
// user can ignore the widget and type if they prefer.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const MAX_LEN = 24;

type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

export default function NamePage() {
  const router = useRouter();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );

  useEffect(() => {
    const saved = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
    if (!saved || !PERSONALITIES.some((p) => p.id === saved)) {
      router.replace("/onboarding/personality");
      return;
    }
    setPersonalityId(saved);
  }, [router]);

  if (!personalityId) return null;

  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const voice = VOICES.find((v) => v.id === personality.voiceId)!;

  return (
    <ConversationProvider>
      <NamePageInner personality={personality} voice={voice} />
    </ConversationProvider>
  );
}

function NamePageInner({
  personality,
  voice,
}: {
  personality: (typeof PERSONALITIES)[number];
  voice: (typeof VOICES)[number];
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const accent = personality.accent;

  const [name, setName] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startAttempted = useRef(false);
  const continuing = useRef(false);

  useEffect(() => {
    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) setName(savedName);
  }, []);

  /* ── ElevenLabs conversation ── */
  const conversation = useConversation({
    onConnect: () => {
      setVoiceState("listening");
      setVoiceError(null);
    },
    onDisconnect: () => {
      setVoiceState("idle");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Voice connection error";
      setVoiceError(msg);
      setVoiceState("error");
    },
    onModeChange: (event) => {
      const mode = (event as { mode?: string }).mode;
      if (mode === "speaking") setVoiceState("speaking");
      else if (mode === "listening") setVoiceState("listening");
    },
  });

  /* ── Client tools (reuse dashboard tools: set_field + navigate) ── */
  const NAME_ALIASES = [
    "name",
    "my name",
    "your name",
    "agent name",
    "the name",
  ];
  const NEXT_WORDS = ["next", "continue", "intake", "forward", "go", "ready"];
  const BACK_WORDS = ["back", "previous", "personality"];

  useConversationClientTool("set_field", (params) => {
    const fieldName = String(params?.field ?? "")
      .trim()
      .toLowerCase();
    const value = String(params?.value ?? "").trim();
    if (!value) return "Tell me what to set it to.";

    const matchesName = NAME_ALIASES.some(
      (a) => fieldName === a || fieldName.includes(a) || a.includes(fieldName),
    );
    if (matchesName) {
      const next = value.slice(0, MAX_LEN);
      setName(next);
      setTimeout(() => inputRef.current?.focus(), 0);
      return `Set the name to "${next}".`;
    }
    return `The only field editable here is the agent's name. I don't see "${fieldName}".`;
  });

  useConversationClientTool("navigate", (params) => {
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
      setTimeout(() => {
        try {
          conversation.endSession();
        } catch {
          /* ignore */
        }
        router.push("/onboarding/intake");
      }, 900);
      return `Continuing as ${final}.`;
    }

    if (
      BACK_WORDS.some((w) => destination === w || destination.includes(w))
    ) {
      setTimeout(() => {
        try {
          conversation.endSession();
        } catch {
          /* ignore */
        }
        router.push("/onboarding/personality");
      }, 600);
      return "Going back.";
    }

    return `From this page I can only go "next" or "back".`;
  });

  /* ── Start / stop session ── */
  const startVoice = useCallback(async () => {
    setVoiceError(null);
    setVoiceState("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch("/api/voice/signed-url");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          body?.error ?? `Signed-URL endpoint returned ${res.status}`,
        );
      }
      const { signedUrl } = (await res.json()) as { signedUrl: string };

      const systemPrompt = buildOnboardingSystemPrompt({
        personality,
        voiceName: voice.name,
        suggestedNames: personality.suggestedNames,
      });
      const firstMessage = buildOnboardingFirstMessage({
        personality,
        suggestedNames: personality.suggestedNames,
      });

      // Not overriding tts.voiceId — the dashboard agent's voice is
      // canonical. See memory: feedback_no_tts_voice_override.
      await conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        overrides: {
          agent: {
            prompt: { prompt: systemPrompt },
            firstMessage,
            language: "en",
          },
        },
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Couldn't start voice";
      setVoiceError(msg);
      setVoiceState("error");
    }
  }, [personality, voice, conversation]);

  const stopVoice = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      /* ignore */
    }
    setVoiceState("idle");
  }, [conversation]);

  // Auto-start on mount. If the browser blocks mic permission without
  // a fresh gesture, startVoice errors and the widget shows a retry.
  useEffect(() => {
    if (startAttempted.current) return;
    startAttempted.current = true;
    const t = setTimeout(() => {
      startVoice();
    }, 500);
    return () => clearTimeout(t);
  }, [startVoice]);

  useEffect(() => {
    return () => {
      try {
        conversation.endSession();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 1400);
    return () => clearTimeout(t);
  }, []);

  const onWidgetClick = () => {
    if (voiceState === "listening" || voiceState === "speaking") stopVoice();
    else startVoice();
  };

  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && trimmed.length <= MAX_LEN;
  const agentSpeaking = voiceState === "speaking";

  const onContinue = () => {
    if (!canContinue) return;
    localStorage.setItem(NAME_KEY, trimmed);
    try {
      conversation.endSession();
    } catch {
      /* ignore */
    }
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
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 py-10 flex flex-col">
        {/* Eyebrow anchored top-left */}
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

        {/* Subtle accent bloom drifting from the corner toward the
            widget, gives the page atmosphere without a card */}
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            right: "-6%",
            bottom: "-6%",
            width: 720,
            height: 720,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}1a 0%, ${accent}08 35%, transparent 65%)`,
            filter: "blur(80px)",
          }}
          animate={
            reduced
              ? { opacity: 0.6 }
              : agentSpeaking
                ? { opacity: [0.55, 0.95, 0.55] }
                : { opacity: 0.55 }
          }
          transition={
            agentSpeaking && !reduced
              ? { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.8 }
          }
        />

        {/* Center stage */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-[760px] flex flex-col items-center text-center">
            {/* Hero */}
            <motion.h1
              initial={
                reduced
                  ? false
                  : { opacity: 0, y: 14, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.8,
                delay: 0.15,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="font-serif font-medium"
              style={{
                fontSize: "clamp(4rem, 9vw, 8rem)",
                lineHeight: 0.94,
                letterSpacing: "-0.04em",
                color: "rgba(245,240,230,0.98)",
              }}
            >
              name me
              <span style={{ color: accent, opacity: 0.9 }}>.</span>
            </motion.h1>

            {/* Sub-prompt */}
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.35,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="mt-6 font-serif italic max-w-[36ch]"
              style={{
                fontSize: "clamp(1.0625rem, 1.4vw, 1.25rem)",
                lineHeight: 1.45,
                color: "rgba(245,240,230,0.55)",
              }}
            >
              Speak it, or type one below.
            </motion.p>

            {/* Input */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.55,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="mt-14 w-full max-w-[560px] relative"
            >
              {/* Warm accent bloom under the input */}
              <motion.div
                aria-hidden
                className="absolute pointer-events-none"
                style={{
                  left: "-10%",
                  right: "-10%",
                  bottom: "-40%",
                  top: "-15%",
                  background: `radial-gradient(ellipse at center, ${accent}14 0%, ${accent}05 40%, transparent 70%)`,
                  filter: "blur(32px)",
                }}
                animate={{
                  opacity: trimmed ? 1 : inputFocused ? 0.55 : 0,
                }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              />
              <AnimatePresence mode="popLayout">
                <motion.input
                  key={name || "empty"}
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.slice(0, MAX_LEN))
                  }
                  onKeyDown={onKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={personality.suggestedNames[0]}
                  maxLength={MAX_LEN}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Agent name"
                  initial={reduced ? false : { opacity: 0.6, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="relative w-full bg-transparent border-0 outline-none text-center font-serif font-medium pb-4 placeholder:opacity-25"
                  style={{
                    fontSize: "clamp(2.75rem, 5vw, 4.5rem)",
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    color: "rgba(245,240,230,0.98)",
                    caretColor: accent,
                  }}
                />
              </AnimatePresence>
              <motion.div
                className="relative h-px mx-auto"
                style={{
                  background: accent,
                  boxShadow: `0 0 8px ${accent}`,
                  transformOrigin: "center",
                  maxWidth: 420,
                }}
                animate={{
                  scaleX: trimmed ? 1 : inputFocused ? 0.4 : 0.2,
                  opacity: trimmed ? 0.92 : inputFocused ? 0.6 : 0.45,
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
              />
              {trimmed.length > MAX_LEN - 4 && (
                <div
                  className="absolute right-0 top-1 text-[10.5px] tracking-[0.22em] uppercase"
                  style={{
                    color: "rgba(245,240,230,0.42)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {trimmed.length} / {MAX_LEN}
                </div>
              )}
            </motion.div>

            {/* Suggested chips */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.85,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="mt-10 flex items-center justify-center flex-wrap gap-x-7 gap-y-3"
            >
              <span
                className="text-[10.5px] tracking-[0.28em] uppercase"
                style={{
                  color: "rgba(245,240,230,0.32)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Or try
              </span>
              {personality.suggestedNames.map((suggested, i) => {
                const isCurrent =
                  trimmed.length > 0 &&
                  trimmed.toLowerCase() === suggested.toLowerCase();
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
                      delay: 0.9 + i * 0.05,
                      duration: 0.4,
                      ease: [0.2, 0.7, 0.2, 1],
                    }}
                    whileHover={reduced ? undefined : { y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="font-serif italic relative"
                    style={{
                      fontSize: "clamp(1rem, 1.3vw, 1.125rem)",
                      color: isCurrent
                        ? "rgba(245,240,230,0.96)"
                        : "rgba(245,240,230,0.55)",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {suggested}
                    {isCurrent && (
                      <motion.span
                        layoutId="suggested-underline"
                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full"
                        style={{
                          background: accent,
                          boxShadow: `0 0 6px ${accent}`,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                          mass: 0.9,
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Continue */}
            <motion.button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 1.1,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              whileHover={
                reduced || !canContinue
                  ? undefined
                  : {
                      scale: 1.03,
                      backgroundColor: `${accent}14`,
                      boxShadow: `0 0 38px -4px ${accent}cc, inset 0 0 16px ${accent}22`,
                    }
              }
              whileTap={canContinue ? { scale: 0.97 } : undefined}
              className="mt-14 inline-flex items-center gap-3 h-12 px-7 rounded-full font-serif relative disabled:cursor-not-allowed"
              style={{
                fontSize: 16,
                background: "transparent",
                border: `1.5px solid ${
                  canContinue ? `${accent}cc` : "rgba(245,240,230,0.12)"
                }`,
                color: canContinue
                  ? "rgba(245,240,230,0.96)"
                  : "rgba(245,240,230,0.3)",
                boxShadow: canContinue
                  ? `0 0 26px -6px ${accent}aa`
                  : "none",
              }}
            >
              <span>
                {canContinue ? (
                  <>
                    Continue as{" "}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={trimmed}
                        initial={
                          reduced ? false : { opacity: 0, y: 4 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                          reduced ? undefined : { opacity: 0, y: -4 }
                        }
                        transition={{
                          duration: 0.3,
                          ease: [0.2, 0.7, 0.2, 1],
                        }}
                        style={{
                          color: accent,
                          display: "inline-block",
                        }}
                      >
                        {trimmed}
                      </motion.span>
                    </AnimatePresence>
                  </>
                ) : (
                  "Say a name, or type one"
                )}
              </span>
              {canContinue && (
                <motion.span
                  aria-hidden
                  className="inline-block"
                  style={{ color: accent }}
                  animate={reduced ? undefined : { x: [0, 4, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  →
                </motion.span>
              )}
            </motion.button>

            {/* Back */}
            <motion.button
              type="button"
              onClick={() => {
                try {
                  conversation.endSession();
                } catch {
                  /* ignore */
                }
                router.push("/onboarding/personality");
              }}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="mt-8 text-[11px] tracking-[0.24em] uppercase transition-opacity hover:opacity-80"
              style={{
                color: "rgba(245,240,230,0.32)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ← Back
            </motion.button>
          </div>
        </div>

        {/* Floating live agent — bottom right */}
        <FloatingAgent
          voiceState={voiceState}
          accent={accent}
          onClick={onWidgetClick}
          voiceError={voiceError}
          retry={startVoice}
        />
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * FloatingAgent — pinned bottom-right. Glass disc with audio
 * wave bars that pulse while the agent is speaking. Doubles as
 * the start/stop control. Status label slides out to the left
 * while connected so the user always knows what the agent is
 * doing without it occupying the page composition.
 * ============================================================ */
function FloatingAgent({
  voiceState,
  accent,
  onClick,
  voiceError,
  retry,
}: {
  voiceState: VoiceState;
  accent: string;
  onClick: () => void;
  voiceError: string | null;
  retry: () => void;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const isConnecting = voiceState === "connecting";
  const speaking = voiceState === "speaking";
  const listening = voiceState === "listening";
  const active = speaking || listening;
  const errored = voiceState === "error";

  const statusLabel =
    voiceState === "connecting"
      ? "Connecting"
      : voiceState === "speaking"
        ? "Speaking"
        : voiceState === "listening"
          ? "Listening"
          : voiceState === "error"
            ? "Tap to retry"
            : "Tap to talk";

  const ringColor = errored
    ? "rgba(255,150,150,0.7)"
    : active || hovered
      ? `${accent}aa`
      : "rgba(255,255,255,0.18)";

  return (
    <div
      className="fixed z-40 flex items-center gap-3"
      style={{ bottom: 40, right: 40 }}
    >
      {/* Status label — fades in alongside the widget */}
      <AnimatePresence>
        {(active || isConnecting || errored || hovered) && (
          <motion.div
            initial={
              reduced ? false : { opacity: 0, x: 8, filter: "blur(4px)" }
            }
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={
              reduced
                ? undefined
                : { opacity: 0, x: 8, filter: "blur(4px)" }
            }
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="relative inline-flex items-center h-9 px-3.5 rounded-full"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, ${accent}0a 100%)`,
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: `1px solid ${active ? `${accent}66` : "rgba(255,255,255,0.14)"}`,
              boxShadow: active
                ? `0 0 22px -4px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.18)`
                : "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px -6px rgba(0,0,0,0.4)",
            }}
          >
            <span
              className="text-[11px] tracking-[0.28em] uppercase"
              style={{
                color: errored
                  ? "rgba(255,170,170,0.85)"
                  : active
                    ? accent
                    : "rgba(245,240,230,0.62)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {statusLabel}
            </span>
            {errored && voiceError && (
              <button
                type="button"
                onClick={retry}
                className="ml-3 text-[10.5px] tracking-[0.22em] uppercase underline underline-offset-4"
                style={{
                  color: "rgba(255,200,200,0.8)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Retry
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget */}
      <motion.button
        type="button"
        onClick={onClick}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileTap={{ scale: 0.92 }}
        whileHover={reduced ? undefined : { scale: 1.06, y: -2 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="relative grid place-items-center rounded-full"
        style={{
          width: 64,
          height: 64,
          background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, ${accent}1a 100%)`,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: `1px solid ${ringColor}`,
          boxShadow: active
            ? `0 0 44px -4px ${accent}aa, 0 14px 36px -10px rgba(0,0,0,0.7)`
            : `0 0 30px -10px ${accent}88, 0 12px 28px -10px rgba(0,0,0,0.6)`,
          transition: "border-color 0.4s ease, box-shadow 0.4s ease",
        }}
        aria-label={
          active ? "Stop the agent" : "Start the agent"
        }
      >
        {/* Specular highlight */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "8%",
            left: "12%",
            width: "52%",
            height: "32%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 70%)",
            filter: "blur(10px)",
          }}
        />

        {/* Accent reflection bottom */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: "8%",
            left: "20%",
            width: "60%",
            height: "30%",
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${accent}40 0%, transparent 70%)`,
            filter: "blur(12px)",
          }}
        />

        {/* Idle invitation ring */}
        {!reduced && voiceState === "idle" && (
          <motion.div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{ inset: -8, border: `1px solid ${accent}44` }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: [0, 0.55, 0], scale: [0.94, 1.08, 1.2] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeOut",
              repeatDelay: 0.6,
            }}
          />
        )}

        {/* Speaking ripple */}
        {speaking && !reduced && (
          <>
            {[0, 0.6].map((delay, i) => (
              <motion.div
                key={i}
                aria-hidden
                className="absolute rounded-full pointer-events-none"
                style={{ inset: 0, border: `1px solid ${accent}66` }}
                animate={{
                  scale: [1, 1.32, 1.6],
                  opacity: [0.55, 0.18, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}

        {/* Glyph */}
        {isConnecting ? (
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="relative"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke={accent}
              strokeOpacity="0.3"
              strokeWidth="2.5"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        ) : (
          <AudioBars
            active={active}
            speaking={speaking}
            accent={accent}
            errored={errored}
          />
        )}
      </motion.button>
    </div>
  );
}

function AudioBars({
  active,
  speaking,
  accent,
  errored,
}: {
  active: boolean;
  speaking: boolean;
  accent: string;
  errored: boolean;
}) {
  const reduced = useReducedMotion();
  // 4 bars with staggered phases. Speaking peaks tall and animated;
  // listening idles short with a gentle breath; idle/errored stay
  // flat short.
  const bars = [
    { phase: 0, peak: 1 },
    { phase: 0.15, peak: 0.85 },
    { phase: 0.3, peak: 1 },
    { phase: 0.45, peak: 0.7 },
  ];

  return (
    <div className="relative flex items-center gap-[3px]" aria-hidden>
      {bars.map((bar, i) => (
        <motion.span
          key={i}
          style={{
            display: "inline-block",
            width: 3,
            borderRadius: 2,
            background: errored ? "rgba(255,150,150,0.7)" : accent,
            boxShadow: active ? `0 0 8px ${accent}` : "none",
            transformOrigin: "center",
          }}
          animate={
            reduced
              ? { height: 5 }
              : speaking
                ? {
                    height: [5, 24 * bar.peak, 5, 16 * bar.peak, 5],
                  }
                : active
                  ? { height: [5, 9, 5, 7, 5] }
                  : { height: 5 }
          }
          transition={
            reduced
              ? { duration: 0.2 }
              : speaking
                ? {
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: bar.phase,
                  }
                : active
                  ? {
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: bar.phase,
                    }
                  : { duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }
          }
        />
      ))}
    </div>
  );
}
