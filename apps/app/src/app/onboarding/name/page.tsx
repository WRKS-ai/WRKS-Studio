"use client";

import {
  ConversationProvider,
  useConversation,
  useConversationClientTool,
} from "@elevenlabs/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiquidAurora } from "@/components/liquid-aurora";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { orbColorsFromAccent, SiriOrb } from "@/components/siri-orb";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";
import {
  buildOnboardingFirstMessage,
  buildOnboardingSystemPrompt,
} from "@/lib/voice-agent";
import { VOICES } from "@/lib/voices";

// Act Two — The Name. Mirrors the personality page's editorial
// asymmetric grammar: top-left eyebrow → grid with text-left /
// agent-right → balanced 40-24-40 rhythm in the text column. The
// LEFT column shows "name me." (or the typed name when filled) as a
// huge serif focal element. The RIGHT column carries the agent's
// live transcript so the voice has on-page presence. A Siri orb
// floats bottom-right as the start/stop control.

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
  const accentDeep = personality.accentDeep;

  const [name, setName] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [agentLine, setAgentLine] = useState("");
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
    onMessage: (event) => {
      const source = (event as { source?: string }).source;
      const text =
        (event as { message?: string }).message ??
        (event as { text?: string }).text ??
        "";
      if (!text) return;
      if (source === "ai") setAgentLine(text);
    },
    onModeChange: (event) => {
      const mode = (event as { mode?: string }).mode;
      if (mode === "speaking") setVoiceState("speaking");
      else if (mode === "listening") setVoiceState("listening");
    },
  });

  /* ── Client tools — reuse the dashboard agent's tools ── */
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
    console.log("[onboarding/name] set_field called with:", params);
    const fieldName = String(params?.field ?? "").trim().toLowerCase();
    const value = String(params?.value ?? "").trim();
    if (!value) return "Tell me what to set it to.";
    const matchesName = NAME_ALIASES.some(
      (a) => fieldName === a || fieldName.includes(a) || a.includes(fieldName),
    );
    if (matchesName || !fieldName) {
      const next = value.slice(0, MAX_LEN);
      console.log("[onboarding/name] setting name to:", next);
      setName(next);
      setTimeout(() => inputRef.current?.focus(), 0);
      return `Set the name to "${next}".`;
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

  /* ── Session control ── */
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
      const msg = err instanceof Error ? err.message : "Couldn't start voice";
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

  useEffect(() => {
    if (startAttempted.current) return;
    startAttempted.current = true;
    const t = setTimeout(() => {
      startVoice();
    }, 400);
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
    const t = setTimeout(() => inputRef.current?.focus(), 1100);
    return () => clearTimeout(t);
  }, []);

  const onWidgetClick = () => {
    if (voiceState === "listening" || voiceState === "speaking") stopVoice();
    else startVoice();
  };

  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && trimmed.length <= MAX_LEN;
  const agentActive =
    voiceState === "speaking" ||
    voiceState === "listening" ||
    voiceState === "connecting";

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
      {/* Liquid aurora — shared component, same as the personality
          page. Fixed inset-0 so it covers the full viewport, not
          just the page content area. */}
      <LiquidAurora accent={accent} accentDeep={accentDeep} />

      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 py-10 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-[1440px] flex flex-col gap-10">
          {/* Act header — top-left anchor, mirrors personality page */}
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

          {/* Asymmetric hero — text on the left, agent transcript
              on the right. Same grid proportions as the personality
              page (1fr / 1.05fr, items-center). */}
          <div
            className="grid items-center gap-12 lg:gap-16"
            style={{
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr)",
            }}
          >
            {/* LEFT — naming surface */}
            <div className="relative flex flex-col items-start">
              {/* Display — when empty shows "name me.", when typed
                  shows the name itself. Click anywhere on it focuses
                  the hidden input. Same scale + tracking as the
                  personality page name. */}
              <div
                className="relative w-full cursor-text"
                onClick={() => inputRef.current?.focus()}
              >
                <div
                  aria-hidden
                  className="font-serif select-none pointer-events-none"
                  style={{
                    fontSize: "clamp(3.75rem, 8vw, 7.5rem)",
                    fontWeight: 400,
                    lineHeight: 0.92,
                    letterSpacing: trimmed ? "-0.03em" : "-0.055em",
                    color: "rgba(245,240,230,0.98)",
                    transition:
                      "letter-spacing 0.55s cubic-bezier(0.2,0.7,0.2,1)",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {trimmed ? (
                      <motion.span
                        key={trimmed}
                        initial={
                          reduced
                            ? false
                            : { opacity: 0, y: 12, filter: "blur(6px)" }
                        }
                        animate={{
                          opacity: 1,
                          y: 0,
                          filter: "blur(0px)",
                        }}
                        exit={
                          reduced
                            ? undefined
                            : { opacity: 0, y: -6, filter: "blur(6px)" }
                        }
                        transition={{
                          duration: 0.5,
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
                        animate={{ opacity: 1 }}
                        exit={
                          reduced ? undefined : { opacity: 0, y: 6 }
                        }
                        transition={{ duration: 0.4 }}
                        style={{
                          display: "inline-block",
                          color: "rgba(245,240,230,0.45)",
                        }}
                      >
                        name me
                        <span
                          style={{
                            color: accent,
                            opacity: 0.72,
                            fontSize: "0.7em",
                            verticalAlign: "0.04em",
                            marginLeft: "0.04em",
                          }}
                        >
                          .
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.slice(0, MAX_LEN))
                  }
                  onKeyDown={onKeyDown}
                  placeholder=""
                  maxLength={MAX_LEN}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Agent name"
                  className="absolute inset-0 w-full h-full bg-transparent border-0 outline-none font-serif opacity-0"
                  style={{
                    fontSize: "clamp(3.75rem, 8vw, 7.5rem)",
                    lineHeight: 0.92,
                    caretColor: "transparent",
                  }}
                />
              </div>

              {/* Suggested names — inline italic list with magnetic
                  underline on the current pick. Same pattern as the
                  rest of the system, no chip pills. */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.4,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mt-6 flex items-baseline flex-wrap gap-x-5 gap-y-2.5"
              >
                <span
                  className="text-[10px] tracking-[0.32em] uppercase"
                  style={{
                    color: "rgba(245,240,230,0.32)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Or also
                </span>
                {personality.suggestedNames.map((suggested) => {
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
                      whileHover={reduced ? undefined : { y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="relative font-serif italic"
                      style={{
                        fontSize: "clamp(0.95rem, 1.2vw, 1.0625rem)",
                        color: isCurrent
                          ? "rgba(245,240,230,0.95)"
                          : "rgba(245,240,230,0.5)",
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
                            boxShadow: `0 0 8px ${accent}`,
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

              {/* Continue — same treatment as personality page */}
              <motion.button
                type="button"
                onClick={onContinue}
                disabled={!canContinue}
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
                transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
                className="mt-10 inline-flex items-center gap-3 h-12 px-6 rounded-full font-serif relative disabled:cursor-not-allowed"
                style={{
                  fontSize: 16,
                  background: "transparent",
                  border: `1.5px solid ${
                    canContinue ? `${accent}cc` : "rgba(245,240,230,0.12)"
                  }`,
                  color: canContinue
                    ? "rgba(245,240,230,0.96)"
                    : "rgba(245,240,230,0.32)",
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
                    "Say a name to continue"
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

              {/* Back link */}
              <button
                type="button"
                onClick={() => {
                  try {
                    conversation.endSession();
                  } catch {
                    /* ignore */
                  }
                  router.push("/onboarding/personality");
                }}
                className="mt-6 text-[10.5px] tracking-[0.32em] uppercase transition-opacity hover:opacity-80"
                style={{
                  color: "rgba(245,240,230,0.3)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                ← Back
              </button>
            </div>

            {/* RIGHT — live agent transcript + quiet voice attribution.
                When the agent is speaking, its current line appears
                as italic Fraunces at a calm scale. When silent, just
                the personality + voice attribution. */}
            <div className="relative flex flex-col items-start justify-center min-h-[320px]">
              <AnimatePresence mode="wait">
                {agentActive && agentLine ? (
                  <motion.div
                    key={agentLine}
                    initial={
                      reduced
                        ? false
                        : { opacity: 0, y: 8, filter: "blur(6px)" }
                    }
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={
                      reduced
                        ? undefined
                        : { opacity: 0, y: -4, filter: "blur(4px)" }
                    }
                    transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                    className="max-w-[42ch]"
                  >
                    <p
                      className="font-serif italic"
                      style={{
                        fontSize: "clamp(1.25rem, 1.85vw, 1.625rem)",
                        lineHeight: 1.5,
                        letterSpacing: "-0.01em",
                        color: "rgba(245,240,230,0.88)",
                      }}
                    >
                      {agentLine}
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <span
                        className="inline-block h-px w-7"
                        style={{
                          background: `linear-gradient(90deg, ${accent}aa, transparent)`,
                        }}
                      />
                      <span
                        className="text-[10.5px] tracking-[0.32em] uppercase"
                        style={{
                          color: "rgba(245,240,230,0.5)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {personality.name}, in {voice.name}&rsquo;s voice
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="quiet"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-[42ch]"
                  >
                    <p
                      className="font-serif italic"
                      style={{
                        fontSize: "clamp(1.125rem, 1.55vw, 1.4375rem)",
                        lineHeight: 1.5,
                        letterSpacing: "-0.005em",
                        color: "rgba(245,240,230,0.5)",
                      }}
                    >
                      {voiceState === "error"
                        ? voiceError ?? "Voice didn't start. Tap the orb to retry — or just type a name."
                        : voiceState === "connecting"
                          ? "Opening a line…"
                          : "Listening. Speak the name, or type it."}
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <span
                        className="inline-block h-px w-7"
                        style={{
                          background: `linear-gradient(90deg, ${accent}66, transparent)`,
                        }}
                      />
                      <span
                        className="text-[10.5px] tracking-[0.32em] uppercase"
                        style={{
                          color: "rgba(245,240,230,0.4)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {personality.name} · {voice.name}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Floating live agent — Siri orb bottom-right */}
        <FloatingAgent
          voiceState={voiceState}
          accent={accent}
          onClick={onWidgetClick}
        />
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * FloatingAgent — Siri orb pinned bottom-right. Animation speed
 * varies with voice state (faster while speaking). Doubles as the
 * start/stop control.
 * ============================================================ */
function FloatingAgent({
  voiceState,
  accent,
  onClick,
}: {
  voiceState: VoiceState;
  accent: string;
  onClick: () => void;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const isConnecting = voiceState === "connecting";
  const speaking = voiceState === "speaking";
  const listening = voiceState === "listening";
  const active = speaking || listening;
  const errored = voiceState === "error";

  const ringColor = errored
    ? "rgba(255,150,150,0.7)"
    : active || hovered
      ? `${accent}aa`
      : "rgba(255,255,255,0.18)";

  const orbColors = orbColorsFromAccent(accent);
  const orbDuration = speaking ? 5 : listening ? 16 : isConnecting ? 12 : 30;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.92 }}
      whileHover={reduced ? undefined : { scale: 1.06, y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="fixed grid place-items-center rounded-full z-40"
      style={{
        bottom: 32,
        right: 32,
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
      aria-label={active ? "Stop the agent" : "Start the agent"}
    >
      {/* Speaking pulse ring */}
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

      <SiriOrb
        size="50px"
        colors={orbColors}
        animationDuration={orbDuration}
        className="relative"
      />

      {/* Errored tint */}
      {errored && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,140,140,0.25), transparent 70%)",
          }}
        />
      )}

      {/* Connecting spinner overlay */}
      {isConnecting && (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="absolute"
          style={{ filter: `drop-shadow(0 0 6px ${accent}88)` }}
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="white"
            strokeOpacity="0.4"
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
      )}
    </motion.button>
  );
}
