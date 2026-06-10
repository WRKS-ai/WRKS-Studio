"use client";

import { useUser } from "@clerk/nextjs";
import {
  ConversationProvider,
  useConversation,
} from "@elevenlabs/react";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LiquidAurora } from "@/components/liquid-aurora";
import { orbColorsFromAccent, SiriOrb } from "@/components/siri-orb";
import { PERSONALITIES, type PersonalityId } from "@/lib/personalities";
import {
  buildOnboardingFirstMessage,
  buildOnboardingSystemPrompt,
} from "@/lib/voice-agent";
import { VOICES } from "@/lib/voices";

// Shared agent infrastructure for the entire /onboarding/* flow.
//
// One ConversationProvider + one useConversation session lives at the
// onboarding LAYOUT level. The session persists across child page
// navigations (Next.js layout instance stays mounted; only children
// remount). That means:
//
//   - The Siri orb is always visible bottom-right.
//   - The ConversationPanel shows the running transcript across all
//     onboarding pages — the user's exchange on /onboarding/name
//     continues into /onboarding/intake without losing history.
//   - Mic permission, audio context, and the WebSocket are paid for
//     once, not per page.
//
// Each page can register its own client-tool handlers via
// useConversationClientTool (from @elevenlabs/react) — when the page
// mounts the handler is active, when it unmounts the handler clears,
// so /onboarding/name and /onboarding/intake can both override
// set_field with their own field aliases.

const PERSONALITY_KEY = "wrks-onboarding-personality";

export type OnboardingVoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

export type OnboardingMessage = {
  id: number;
  role: "agent" | "user";
  text: string;
};

type OnboardingAgentContextValue = {
  messages: OnboardingMessage[];
  voiceState: OnboardingVoiceState;
  voiceError: string | null;
  accent: string;
  accentDeep: string;
  personality: (typeof PERSONALITIES)[number] | null;
  voice: (typeof VOICES)[number] | null;
  startVoice: () => Promise<void>;
  stopVoice: () => Promise<void>;
};

const Ctx = createContext<OnboardingAgentContextValue | null>(null);

export function useOnboardingAgent(): OnboardingAgentContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useOnboardingAgent must be used inside <OnboardingAgentProvider>",
    );
  }
  return ctx;
}

/**
 * Top-level wrapper. Use in the onboarding layout. Children get the
 * shared context, the floating Siri orb, and the conversation panel
 * for free.
 */
export function OnboardingAgentProvider({ children }: { children: ReactNode }) {
  return (
    <ConversationProvider>
      <AgentHost>{children}</AgentHost>
    </ConversationProvider>
  );
}

function AgentHost({ children }: { children: ReactNode }) {
  const { user } = useUser();
  // Pathname gates both auto-start (don't start on the voice-picker
  // page) and floating-orb visibility. Provider stays mounted across
  // navigations so session state survives the page swap.
  const pathname = usePathname();
  const isOnboardingEntryPage =
    !!pathname && pathname.startsWith("/onboarding/personality");
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [voiceState, setVoiceState] = useState<OnboardingVoiceState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const messageIdRef = useRef(0);
  const startAttempted = useRef(false);
  // Stable conversation id for the lifetime of this provider mount —
  // each voice session within the onboarding flow shares one so all
  // turns roll up into a single voice_sessions row for Phase 8 signal
  // extraction.
  const conversationIdRef = useRef<string>(
    `wrks_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  );

  // Pick up the personality the user chose on /onboarding/personality.
  // Re-run if storage changes (e.g. user navigates back and re-picks).
  useEffect(() => {
    const load = () => {
      const p = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
      if (p && PERSONALITIES.some((x) => x.id === p)) {
        setPersonalityId(p);
      }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const personality = personalityId
    ? (PERSONALITIES.find((p) => p.id === personalityId) ?? null)
    : null;
  const voice = personality
    ? (VOICES.find((v) => v.id === personality.voiceId) ?? null)
    : null;
  const accent = personality?.accent ?? "#a78bfa";
  const accentDeep = personality?.accentDeep ?? "#6d28d9";

  const conversation = useConversation({
    onConnect: () => {
      console.log("[onboarding/agent] connected");
      setVoiceState("listening");
      setVoiceError(null);
    },
    onDisconnect: () => {
      console.log("[onboarding/agent] disconnected");
      setVoiceState("idle");
    },
    onError: (err: unknown) => {
      console.error("[onboarding/agent] error:", err);
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
      const role =
        source === "user" ? "user" : source === "ai" ? "agent" : null;
      if (!role) return;
      const id = ++messageIdRef.current;
      setMessages((m) => [...m, { id, role, text }]);
    },
    onModeChange: (event) => {
      const mode = (event as { mode?: string }).mode;
      if (mode === "speaking") setVoiceState("speaking");
      else if (mode === "listening") setVoiceState("listening");
    },
  });

  const startVoice = useCallback(async () => {
    if (!personality || !voice) return;
    console.log("[onboarding/agent] startVoice begin");
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

      // The custom-LLM-routed agent receives this as
      // `elevenlabs_extra_body` in every LLM request and uses it to
      // look up the user's profile + memory before calling Claude.
      // Without these, /api/agent/converse returns 400.
      const customLlmExtraBody = user
        ? {
            user_id: user.id,
            wrks_surface: "onboarding" as const,
            conversation_id: conversationIdRef.current,
          }
        : undefined;

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
        // @elevenlabs/client BaseConnection.customLlmExtraBody — gets
        // forwarded to our /api/agent/converse on every turn.
        customLlmExtraBody,
      });
      console.log("[onboarding/agent] session started", {
        conversationId: conversationIdRef.current,
        userId: user?.id,
      });
    } catch (err) {
      console.error("[onboarding/agent] startVoice failed:", err);
      const msg = err instanceof Error ? err.message : "voice failed";
      setVoiceError(msg);
      setVoiceState("error");
    }
  }, [personality, voice, conversation, user]);

  const stopVoice = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      /* ignore */
    }
    setVoiceState("idle");
  }, [conversation]);

  // Auto-start once personality + voice + Clerk user are all loaded
  // AND the user has left the voice-picker. We hold off on
  // /onboarding/personality so the user isn't surprised by audio while
  // they're still choosing which voice they want.
  //
  // Only fires once per provider mount — startAttempted guards against
  // re-firing when the user navigates between later pages.
  useEffect(() => {
    if (isOnboardingEntryPage) return;
    if (!personality || !voice || !user) return;
    if (startAttempted.current) return;
    startAttempted.current = true;
    console.log("[onboarding/agent] auto-start firing");
    startVoice();
  }, [personality, voice, user, isOnboardingEntryPage, startVoice]);

  // End the session when the user leaves /onboarding/* entirely.
  // (Within onboarding the session persists.)
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

  const value: OnboardingAgentContextValue = {
    messages,
    voiceState,
    voiceError,
    accent,
    accentDeep,
    personality,
    voice,
    startVoice,
    stopVoice,
  };

  const onWidgetClick = () => {
    if (voiceState === "listening" || voiceState === "speaking") stopVoice();
    else startVoice();
  };

  const showFloatingAgent = !!pathname && !isOnboardingEntryPage;

  return (
    <Ctx.Provider value={value}>
      <LiquidAurora accent={accent} accentDeep={accentDeep} />
      {children}
      {showFloatingAgent && (
        <>
          <ConversationPanel
            messages={messages}
            agentName={voice?.name ?? "Agent"}
            visible={messages.length > 0}
            accent={accent}
          />
          <FloatingAgent
            voiceState={voiceState}
            accent={accent}
            onClick={onWidgetClick}
          />
        </>
      )}
    </Ctx.Provider>
  );
}

/* ============================================================
 * FloatingAgent — Siri orb pinned bottom-right. Animation speed
 * varies with voice state (faster while speaking). Doubles as
 * the start/stop control.
 * ============================================================ */
function FloatingAgent({
  voiceState,
  accent,
  onClick,
}: {
  voiceState: OnboardingVoiceState;
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

/* ============================================================
 * ConversationPanel — premium glass card with role-based bubbles.
 * Opens above the floating orb when there are messages. Persists
 * messages across page navigations within /onboarding/*.
 * ============================================================ */
function ConversationPanel({
  messages,
  agentName,
  visible,
  accent,
}: {
  messages: OnboardingMessage[];
  agentName: string;
  visible: boolean;
  accent: string;
}) {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="convo-panel"
          initial={
            reduced
              ? false
              : { opacity: 0, y: 16, scale: 0.95, filter: "blur(8px)" }
          }
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={
            reduced
              ? undefined
              : { opacity: 0, y: 12, scale: 0.96, filter: "blur(6px)" }
          }
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          className="fixed z-30 flex flex-col"
          style={{
            bottom: 112,
            right: 32,
            width: 400,
            maxHeight: 360,
            borderRadius: 26,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.018) 50%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.11)",
            backdropFilter: "blur(36px) saturate(160%)",
            WebkitBackdropFilter: "blur(36px) saturate(160%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02), 0 32px 64px -16px rgba(0,0,0,0.7), 0 8px 24px -8px rgba(0,0,0,0.5)",
            overflow: "hidden",
            transformOrigin: "bottom right",
          }}
        >
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: 60,
              background:
                "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.06), transparent 70%)",
            }}
          />
          <div
            className="relative flex items-center justify-between px-5 pt-4 pb-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <motion.span
                  aria-hidden
                  className="inline-block rounded-full"
                  style={{
                    width: 7,
                    height: 7,
                    background: accent,
                    boxShadow: `0 0 10px ${accent}, 0 0 4px ${accent}`,
                  }}
                  animate={
                    reduced ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }
                  }
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {!reduced && (
                  <motion.span
                    aria-hidden
                    className="absolute inline-block rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      border: `1px solid ${accent}`,
                    }}
                    animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
              </div>
              <span
                className="text-[10px] tracking-[0.32em] uppercase"
                style={{
                  color: "rgba(245,240,230,0.55)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Live
              </span>
            </div>
            <span
              className="text-[10.5px] tracking-[0.28em] uppercase"
              style={{
                color: "rgba(245,240,230,0.7)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {agentName}
            </span>
          </div>
          <div
            ref={scrollRef}
            className="relative flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
          >
            {messages.map((msg) => {
              const isAgent = msg.role === "agent";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className="max-w-[85%] flex flex-col gap-1.5"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 16,
                      background: isAgent
                        ? "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)"
                        : `linear-gradient(180deg, ${accent}22 0%, ${accent}10 100%)`,
                      border: isAgent
                        ? "1px solid rgba(255,255,255,0.06)"
                        : `1px solid ${accent}33`,
                      boxShadow: isAgent
                        ? "inset 0 1px 0 rgba(255,255,255,0.04)"
                        : `inset 0 1px 0 ${accent}1f`,
                    }}
                  >
                    <span
                      className="text-[9px] tracking-[0.28em] uppercase"
                      style={{
                        color: isAgent
                          ? "rgba(245,240,230,0.38)"
                          : `${accent}cc`,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {isAgent ? agentName : "You"}
                    </span>
                    <p
                      className="font-sans"
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        letterSpacing: "-0.005em",
                        color: isAgent
                          ? "rgba(245,240,230,0.94)"
                          : "rgba(245,240,230,0.92)",
                      }}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
