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

// Act Two — The Name. The live ElevenLabs Conversational AI agent
// takes over here. On mount we (try to) open a WebSocket session
// with the agent overridden to use the user's chosen voice +
// personality. The agent greets the user, listens for a name, and
// fills the input via the set_agent_name client tool. The user can
// also continue by voice ("let's go") via continue_onboarding.
//
// Composition is a script page from a play: LEFT speaks (the agent),
// RIGHT replies (the user's typed/spoken name + Continue). Both
// columns are anchored by glass speaker pills whose accent rim
// lights up when that speaker has the floor.

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
  const [agentLine, setAgentLine] = useState("");
  const [userLine, setUserLine] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const startAttempted = useRef(false);
  const continuing = useRef(false);

  // Hydrate previously-typed name
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
      if (source === "user") setUserLine(text);
      else if (source === "ai") setAgentLine(text);
    },
    onModeChange: (event) => {
      const mode = (event as { mode?: string }).mode;
      if (mode === "speaking") setVoiceState("speaking");
      else if (mode === "listening") setVoiceState("listening");
    },
  });

  /* ── Client tools the agent calls ── */
  useConversationClientTool("set_agent_name", (params) => {
    const value = String(params?.name ?? "").trim();
    if (!value) return "I didn't catch a name. Say it again?";
    const trimmed = value.slice(0, MAX_LEN);
    setName(trimmed);
    setTimeout(() => inputRef.current?.focus(), 0);
    return `Filled the name field with ${trimmed}.`;
  });

  useConversationClientTool("continue_onboarding", () => {
    const final = name.trim();
    if (!final) {
      return "There's no name in the field yet. Pick one first.";
    }
    if (continuing.current) return "Already going.";
    continuing.current = true;
    localStorage.setItem(NAME_KEY, final);
    // Small delay so the agent's voice confirmation lands before
    // the route changes
    setTimeout(() => {
      try {
      conversation.endSession();
    } catch {
      /* ignore */
    }
      router.push("/onboarding/intake");
    }, 900);
    return `Continuing as ${final}.`;
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

      await conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        overrides: {
          agent: {
            prompt: { prompt: systemPrompt },
            firstMessage,
            language: "en",
          },
          tts: { voiceId: voice.elevenLabsId },
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
      // ignore
    }
    setVoiceState("idle");
  }, [conversation]);

  // Try to auto-start once on mount. Browsers may block the mic
  // permission without a fresh user gesture on THIS page — in that
  // case startVoice() rejects and we fall back to "tap to start"
  // mode (mic icon stays the explicit tap target).
  useEffect(() => {
    if (startAttempted.current) return;
    startAttempted.current = true;
    const t = setTimeout(() => {
      startVoice();
    }, 600);
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

  // Focus the input shortly after mount so manual typing is also
  // possible from the start
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 1600);
    return () => clearTimeout(t);
  }, []);

  const onMicClick = () => {
    if (voiceState === "listening" || voiceState === "speaking") {
      stopVoice();
    } else {
      startVoice();
    }
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

  // Speaker-pill copy reflects the live session state. Falls back
  // to a neutral "ready" line when voice is unavailable.
  const agentStatusLabel =
    voiceState === "connecting"
      ? "Connecting"
      : voiceState === "speaking"
        ? "Speaking"
        : voiceState === "listening"
          ? "Listening"
          : voiceState === "error"
            ? "Tap to retry"
            : "Tap to talk";

  return (
    <OnboardingFrame step={2} totalSteps={5} bloomTint={accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 py-10 flex flex-col items-center justify-center">
        {/* Ambient accent bloom — pulses while the agent has the floor */}
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "5%",
            top: "20%",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}16 0%, ${accent}06 35%, transparent 65%)`,
            filter: "blur(60px)",
          }}
          animate={
            reduced
              ? { opacity: 0.7 }
              : agentActive
                ? { opacity: [0.55, 0.95, 0.55], scale: [1, 1.06, 1] }
                : { opacity: 0.45, scale: 1 }
          }
          transition={
            agentActive && !reduced
              ? { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }
          }
        />

        <div className="relative w-full max-w-[1440px] flex flex-col gap-14 lg:gap-20">
          {/* Act header */}
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

          {/* Script-page composition */}
          <div
            className="grid items-start gap-12 lg:gap-20"
            style={{
              gridTemplateColumns: "minmax(0, 1.08fr) minmax(0, 1fr)",
            }}
          >
            {/* LEFT — the agent speaks */}
            <div className="relative flex flex-col gap-8">
              {/* Speaker row: live mic + glass label pill with status */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                className="flex items-center gap-3"
              >
                <SpeakingIcon
                  voiceState={voiceState}
                  accent={accent}
                  onClick={onMicClick}
                />
                <SpeakerPill accent={accent} active={agentActive}>
                  <span
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.86)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {personality.name}
                  </span>
                  <span
                    style={{
                      color: "rgba(245,240,230,0.28)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    ·
                  </span>
                  <span
                    className="text-[11px] tracking-[0.28em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.55)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {voice.name}
                  </span>
                  <span
                    style={{
                      color: "rgba(245,240,230,0.28)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    ·
                  </span>
                  <motion.span
                    key={agentStatusLabel}
                    initial={
                      reduced ? false : { opacity: 0, y: 2 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[11px] tracking-[0.28em] uppercase"
                    style={{
                      color: agentActive
                        ? accent
                        : voiceState === "error"
                          ? "rgba(255,150,150,0.7)"
                          : "rgba(245,240,230,0.4)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {agentStatusLabel}
                  </motion.span>
                </SpeakerPill>
              </motion.div>

              {/* Hero opener — editorial quote */}
              <div className="relative">
                <motion.span
                  aria-hidden
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="absolute select-none pointer-events-none font-serif"
                  style={{
                    left: "-0.55em",
                    top: "-0.42em",
                    fontSize: "clamp(7rem, 14vw, 13rem)",
                    lineHeight: 1,
                    color: accent,
                    opacity: 0.22,
                  }}
                >
                  &ldquo;
                </motion.span>
                <motion.h1
                  initial={
                    reduced
                      ? false
                      : { opacity: 0, y: 14, filter: "blur(6px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.8,
                    delay: 0.35,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="relative font-serif font-medium"
                  style={{
                    fontSize: "clamp(3.5rem, 7vw, 6.5rem)",
                    lineHeight: 0.96,
                    letterSpacing: "-0.035em",
                    color: "rgba(245,240,230,0.98)",
                  }}
                >
                  Hey, you
                  <span style={{ color: accent, opacity: 0.85 }}>.</span>
                </motion.h1>
              </div>

              {/* Live agent transcript — swaps in when the agent
                  is speaking. Falls back to a static prompt line
                  while connecting / idle. */}
              <div
                className="relative font-serif italic"
                style={{
                  fontSize: "clamp(1.1875rem, 1.65vw, 1.5rem)",
                  lineHeight: 1.5,
                  color: "rgba(245,240,230,0.66)",
                  maxWidth: "38ch",
                  minHeight: "5.4em",
                }}
              >
                <AnimatePresence mode="wait">
                  {agentLine ? (
                    <motion.p
                      key={agentLine}
                      initial={
                        reduced ? false : { opacity: 0, y: 6, filter: "blur(4px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={
                        reduced
                          ? undefined
                          : { opacity: 0, y: -4, filter: "blur(4px)" }
                      }
                      transition={{
                        duration: 0.5,
                        ease: [0.2, 0.7, 0.2, 1],
                      }}
                    >
                      {agentLine}
                    </motion.p>
                  ) : voiceState === "error" ? (
                    <motion.p
                      key="error"
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ color: "rgba(255,170,170,0.7)" }}
                    >
                      Voice didn&rsquo;t start —{" "}
                      <button
                        type="button"
                        onClick={startVoice}
                        className="underline underline-offset-4"
                        style={{ color: "rgba(255,200,200,0.85)" }}
                      >
                        retry
                      </button>{" "}
                      or just type a name on the right.
                      {voiceError && (
                        <span
                          className="block mt-2 text-[11px] tracking-[0.18em] uppercase"
                          style={{
                            color: "rgba(255,170,170,0.45)",
                            fontFamily: "var(--font-mono)",
                            fontStyle: "normal",
                          }}
                        >
                          {voiceError}
                        </span>
                      )}
                    </motion.p>
                  ) : voiceState === "connecting" ? (
                    <motion.p
                      key="connecting"
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      Opening a line…
                    </motion.p>
                  ) : (
                    <motion.p
                      key="ready"
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      Glad you picked me. From here on, I&rsquo;ll guide
                      you through every brief, every reply, every line.
                      But first — name me.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT — the user replies */}
            <div className="relative flex flex-col items-start pt-1">
              {/* Speaker pill mirrors the LEFT label */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.5,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mb-9"
              >
                <SpeakerPill
                  accent={accent}
                  active={inputFocused || voiceState === "listening"}
                >
                  <span
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.55)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Scene 02
                  </span>
                  <span
                    style={{
                      color: "rgba(245,240,230,0.28)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    ·
                  </span>
                  <span
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{
                      color: "rgba(245,240,230,0.86)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    You
                  </span>
                </SpeakerPill>
              </motion.div>

              {/* Input — editorial scale, fills when agent calls set_agent_name */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.7,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="w-full max-w-[640px] relative"
              >
                {/* Warm accent bloom under input — fades in as name fills */}
                <motion.div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    left: "-8%",
                    right: "-8%",
                    bottom: "-30%",
                    top: "-10%",
                    background: `radial-gradient(ellipse at center, ${accent}12 0%, ${accent}04 40%, transparent 70%)`,
                    filter: "blur(28px)",
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
                    initial={
                      reduced ? false : { opacity: 0.6, y: 6 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.2, 0.7, 0.2, 1],
                    }}
                    className="relative w-full bg-transparent border-0 outline-none text-left font-serif font-medium pb-4 placeholder:opacity-25"
                    style={{
                      fontSize: "clamp(3rem, 5.4vw, 5rem)",
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      color: "rgba(245,240,230,0.98)",
                      caretColor: accent,
                    }}
                  />
                </AnimatePresence>
                <motion.div
                  className="relative h-px origin-left"
                  style={{
                    background: accent,
                    boxShadow: `0 0 8px ${accent}`,
                  }}
                  animate={{
                    scaleX: trimmed ? 1 : inputFocused ? 0.32 : 0.18,
                    opacity: trimmed ? 0.92 : inputFocused ? 0.6 : 0.4,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                />

                {/* User transcript — what the agent heard you say */}
                <AnimatePresence>
                  {userLine && (
                    <motion.div
                      key={userLine}
                      initial={
                        reduced ? false : { opacity: 0, y: 4 }
                      }
                      animate={{ opacity: 0.65, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute -bottom-7 left-0 text-[11px] tracking-[0.22em] uppercase"
                      style={{
                        color: "rgba(245,240,230,0.45)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Heard: &ldquo;{userLine}&rdquo;
                    </motion.div>
                  )}
                </AnimatePresence>

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
                  delay: 0.95,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="mt-12 flex items-center flex-wrap gap-x-7 gap-y-3"
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
                        delay: 1.0 + i * 0.05,
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
                  delay: 1.2,
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
                className="mt-12 inline-flex items-center gap-3 h-12 px-6 rounded-full font-serif relative disabled:cursor-not-allowed"
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
            </div>
          </div>

          {/* Back link */}
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="relative"
          >
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
              className="text-[11px] tracking-[0.24em] uppercase transition-opacity hover:opacity-80"
              style={{
                color: "rgba(245,240,230,0.32)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ← Back
            </button>
          </motion.div>
        </div>
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * SpeakerPill — frosted glass capsule that wraps the speaker label
 * row on both sides. Accent rim lights up when that speaker has
 * the floor (agent speaking on left, input focused on right).
 * ============================================================ */
function SpeakerPill({
  children,
  accent,
  active,
}: {
  children: React.ReactNode;
  accent: string;
  active: boolean;
}) {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-3.5 h-9 rounded-full relative"
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.045) 0%, ${accent}0a 100%)`,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
      animate={{
        boxShadow: active
          ? `0 0 22px -4px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.18)`
          : "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px -6px rgba(0,0,0,0.4)",
      }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      initial={false}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          borderColor: active ? `${accent}88` : "rgba(255,255,255,0.14)",
        }}
        transition={{ duration: 0.5 }}
        style={{
          borderWidth: 1,
          borderStyle: "solid",
        }}
      />
      {children}
    </motion.div>
  );
}

/* ============================================================
 * SpeakingIcon — glass disc with audio-wave bars. Behaves as the
 * live agent state indicator AND the tap-to-start/stop control.
 * Bars animate while listening or speaking; spinner while
 * connecting; quiet bars while idle.
 * ============================================================ */
function SpeakingIcon({
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
  const active = voiceState === "listening" || voiceState === "speaking";
  const errored = voiceState === "error";

  const bars = [
    { phase: 0, peak: 0.95 },
    { phase: 0.18, peak: 1 },
    { phase: 0.36, peak: 0.7 },
  ];

  const ringColor = errored
    ? "rgba(255,150,150,0.7)"
    : active || hovered
      ? `${accent}aa`
      : "rgba(255,255,255,0.18)";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.92 }}
      whileHover={reduced ? undefined : { scale: 1.06, y: -1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="relative grid place-items-center rounded-full"
      style={{
        width: 50,
        height: 50,
        background: `linear-gradient(180deg, rgba(255,255,255,0.07) 0%, ${accent}14 100%)`,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: `1px solid ${ringColor}`,
        boxShadow:
          active || hovered
            ? `0 0 28px -4px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.24)`
            : "inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 22px -8px rgba(0,0,0,0.55)",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
      }}
      aria-label={
        voiceState === "speaking" || voiceState === "listening"
          ? "Stop the conversation"
          : "Start the conversation"
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
            "radial-gradient(ellipse, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 70%)",
          filter: "blur(8px)",
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
          background: `radial-gradient(ellipse, ${accent}38 0%, transparent 70%)`,
          filter: "blur(10px)",
        }}
      />

      {/* "Tap to talk" invitation ring while idle */}
      {!reduced && voiceState === "idle" && (
        <motion.div
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{ inset: -8, border: `1px solid ${accent}44` }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.94, 1.06, 1.18] }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeOut",
            repeatDelay: 0.6,
          }}
        />
      )}

      {/* Speaking pulse ring */}
      {active && !reduced && (
        <motion.div
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{ inset: 0, border: `1px solid ${accent}66` }}
          animate={{ scale: [1, 1.18, 1.32], opacity: [0.55, 0.18, 0] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}

      {isConnecting ? (
        <svg
          width={20}
          height={20}
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
        <div className="relative flex items-center gap-[3px]" aria-hidden>
          {bars.map((bar, i) => (
            <motion.span
              key={i}
              style={{
                display: "inline-block",
                width: 2.5,
                borderRadius: 2,
                background: errored ? "rgba(255,150,150,0.7)" : accent,
                boxShadow: active ? `0 0 6px ${accent}` : "none",
                transformOrigin: "center",
              }}
              animate={
                reduced
                  ? { height: 4 }
                  : active
                    ? {
                        height: [4, 18 * bar.peak, 4, 13 * bar.peak, 4],
                      }
                    : { height: 4 }
              }
              transition={
                reduced
                  ? { duration: 0.2 }
                  : active
                    ? {
                        duration: 0.9,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: bar.phase,
                      }
                    : { duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }
              }
            />
          ))}
        </div>
      )}
    </motion.button>
  );
}
