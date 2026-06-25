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
const NAME_KEY = "wrks-onboarding-name";

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
    !!pathname &&
    (pathname.startsWith("/onboarding/voice") ||
      pathname.startsWith("/onboarding/personality"));
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  // The user-chosen agent name (e.g. "Bub"). Lives in localStorage
  // under NAME_KEY and is what gets shown in the transcript header
  // and used by the agent in its replies. Falls back to the voice's
  // own name if the user hasn't picked one yet.
  const [agentName, setAgentName] = useState<string | null>(null);
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [voiceState, setVoiceState] = useState<OnboardingVoiceState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // User can close the transcript panel to free the screen without
  // ending the voice session. A small restore button appears in
  // its place so they can bring it back when they want.
  // 2026-06-26: default DISMISSED so the panel doesn't pop on every
  // page load. User opens it via the icon button bottom-left when they
  // want to type or read the transcript. Auto-opens on first agent
  // message (handled in the onMessage handler).
  const [panelDismissed, setPanelDismissed] = useState(true);
  const messageIdRef = useRef(0);
  const startAttempted = useRef(false);
  // Stable conversation id for the lifetime of this provider mount —
  // each voice session within the onboarding flow shares one so all
  // turns roll up into a single voice_sessions row for Phase 8 signal
  // extraction.
  const conversationIdRef = useRef<string>(
    `wrks_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  );

  // Pick up the personality + agent name the user chose. Re-runs on
  // storage events AND on pathname changes so renaming on /name
  // immediately refreshes the panel header when they navigate on.
  useEffect(() => {
    const load = () => {
      const p = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
      if (p && PERSONALITIES.some((x) => x.id === p)) {
        setPersonalityId(p);
      }
      const name = localStorage.getItem(NAME_KEY);
      setAgentName(name?.trim() || null);
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
  // Display name preference: user's chosen agent name → voice name → "Agent".
  // The transcript header should say "Bub", not "Brad", once the user
  // has named the agent on /onboarding/name.
  const displayName = agentName ?? voice?.name ?? "Agent";

  // Re-read the agent name when pathname changes — covers the
  // /name → /intake transition where the user just typed the name.
  useEffect(() => {
    const stored = localStorage.getItem(NAME_KEY);
    setAgentName(stored?.trim() || null);
  }, [pathname]);

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
        pathname,
        agentName,
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
  }, [personality, voice, conversation, user, pathname, agentName]);

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

  // Orb tap behavior is decoupled from session lifecycle so the
  // conversation persists across closes/reopens.
  //
  //   * Idle / error → start (or restart) the session.
  //   * Otherwise   → just toggle the transcript panel. The session
  //                   keeps running so reopening doesn't re-fire the
  //                   greeting or lose context. Session only ends
  //                   when the provider unmounts (i.e. user leaves
  //                   the onboarding flow).
  const onWidgetClick = () => {
    const sessionActive =
      voiceState === "listening" ||
      voiceState === "speaking" ||
      voiceState === "connecting";
    if (sessionActive) {
      setPanelDismissed((d) => !d);
      return;
    }
    setPanelDismissed(false);
    startVoice();
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
            agentName={displayName}
            visible={!panelDismissed}
            accent={accent}
            onClose={() => setPanelDismissed(true)}
            onSendText={(text) => conversation.sendUserMessage(text)}
          />
          {panelDismissed && (
            <RestoreTranscriptButton
              count={messages.length}
              accent={accent}
              onClick={() => setPanelDismissed(false)}
            />
          )}
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
 * FloatingAgent — Siri orb pinned bottom-LEFT (moved 2026-06-26
 * per user direction). Animation speed varies with voice state
 * (faster while speaking). Doubles as the start/stop control.
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
        left: 32,
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
  onClose,
  onSendText,
}: {
  messages: OnboardingMessage[];
  agentName: string;
  visible: boolean;
  accent: string;
  onClose: () => void;
  onSendText: (text: string) => void;
}) {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSendText(text);
    setDraft("");
  };

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
            left: 32,
            width: 400,
            maxHeight: 420,
            borderRadius: 26,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.018) 50%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.11)",
            backdropFilter: "blur(36px) saturate(160%)",
            WebkitBackdropFilter: "blur(36px) saturate(160%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02), 0 32px 64px -16px rgba(0,0,0,0.7), 0 8px 24px -8px rgba(0,0,0,0.5)",
            overflow: "hidden",
            transformOrigin: "bottom left",
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
            <div className="flex items-center gap-3">
              <span
                className="text-[10.5px] tracking-[0.28em] uppercase"
                style={{
                  color: "rgba(245,240,230,0.7)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {agentName}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close transcript"
                className="grid place-items-center transition-opacity hover:opacity-100"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  opacity: 0.7,
                }}
              >
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                  aria-hidden
                  style={{ color: "rgba(245,240,230,0.85)" }}
                >
                  <path
                    d="M1 1l7 7M8 1l-7 7"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="relative flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
            style={{ minHeight: messages.length === 0 ? 80 : undefined }}
          >
            {messages.length === 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(245,240,230,0.45)",
                  letterSpacing: "-0.003em",
                  textAlign: "center",
                  paddingTop: 18,
                }}
              >
                Speak or type — {agentName} is listening.
              </p>
            )}
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

          {/* Text input row — user can type when voice isn't convenient.
              Sends via conversation.sendUserMessage so the agent treats
              the text as a voice turn. */}
          <div
            className="relative flex items-center"
            style={{
              gap: 8,
              padding: "10px 12px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={`Message ${agentName}…`}
              aria-label="Message the agent"
              className="flex-1 bg-transparent outline-none font-sans"
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.018)",
                color: "rgba(245,240,230,0.95)",
                fontSize: 13.5,
                letterSpacing: "-0.005em",
              }}
            />
            <button
              type="button"
              onClick={submit}
              disabled={draft.trim().length === 0}
              aria-label="Send"
              className="grid place-items-center transition-colors duration-150 disabled:cursor-not-allowed"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background:
                  draft.trim().length === 0
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(245,240,230,0.92)",
                color:
                  draft.trim().length === 0
                    ? "rgba(245,240,230,0.3)"
                    : "rgba(10,10,12,0.95)",
                border:
                  draft.trim().length === 0
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "1px solid rgba(245,240,230,0.92)",
                cursor: draft.trim().length === 0 ? "not-allowed" : "pointer",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
 * RestoreTranscriptButton — small icon-only chat bubble that sits
 * above the orb (bottom-LEFT, 2026-06-26) when the user has dismissed
 * the conversation panel. Click to bring the panel back. Shows the
 * unread-message count as a tiny dot badge when > 0.
 * ============================================================ */
function RestoreTranscriptButton({
  count,
  accent,
  onClick,
}: {
  count: number;
  accent: string;
  onClick: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduced ? false : { opacity: 0, y: 8, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, y: 6, scale: 0.94 }}
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
      whileHover={reduced ? undefined : { y: -1, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed z-30 grid place-items-center"
      style={{
        bottom: 116,
        left: 32,
        width: 36,
        height: 36,
        borderRadius: 999,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.018) 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 28px -10px rgba(0,0,0,0.6)",
        color: "rgba(245,240,230,0.85)",
      }}
      aria-label={
        count > 0
          ? `Open chat (${count} new message${count === 1 ? "" : "s"})`
          : "Open chat"
      }
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden
          className="absolute"
          style={{
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: accent,
            boxShadow: `0 0 8px ${accent}, 0 0 0 2px rgba(10,10,12,1)`,
          }}
        />
      )}
    </motion.button>
  );
}
