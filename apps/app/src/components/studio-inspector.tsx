"use client";

import {
  ConversationProvider,
  useConversation,
  useConversationClientTool,
} from "@elevenlabs/react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import {
  type ChatLine,
  type DeliverableKind,
  StudioContextProvider,
  type StoredWowPayload,
} from "@/lib/studio-context";
import {
  buildFirstMessage,
  buildSystemPrompt,
  readDeliverableAsText,
  resolveDeliverableKind,
  resolveNavRoute,
  type DeliverableKind as VoiceDeliverableKind,
} from "@/lib/voice-agent";
import { VOICES, type VoiceId } from "@/lib/voices";

// The right inspector: agent identity, chat history, composer, voice
// session. Lives in the studio layout so it persists across navigation.
// Owns the shared studio state and exposes it to descendants via
// StudioContextProvider.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const STUDIO_KEY = "wrks-studio-deliverables";

const SUGGESTIONS = [
  "Tighten the headline",
  "Sharper angle on the hook",
  "Make it 30% shorter",
];

export function StudioInspectorFrame({ children }: { children: React.ReactNode }) {
  // Outer wrapper — owns the bootstrap (load identity from localStorage),
  // then mounts the ConversationProvider only once identity is known.
  const router = useRouter();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  const [agentName, setAgentName] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [stored, setStored] = useState<StoredWowPayload | null>(null);
  const [bootChecked, setBootChecked] = useState(false);

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
    setVoiceId(v);
    const raw = localStorage.getItem(STUDIO_KEY);
    if (raw) {
      try {
        setStored(JSON.parse(raw) as StoredWowPayload);
      } catch {
        // ignore
      }
    }
    setBootChecked(true);
  }, [router]);

  if (!bootChecked || !personalityId || !voiceId) {
    return (
      <div
        className="fixed inset-0 grid place-items-center"
        style={{ background: "#09090b", color: "rgba(245,245,247,0.5)" }}
      >
        <div
          className="text-[13px] tracking-[0.22em] uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Loading workspace…
        </div>
      </div>
    );
  }

  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const voice = VOICES.find((v) => v.id === voiceId)!;

  return (
    <ConversationProvider>
      <StudioInspectorInner
        personality={personality}
        voice={voice}
        agentName={agentName}
        stored={stored}
        setStored={setStored}
      >
        {children}
      </StudioInspectorInner>
    </ConversationProvider>
  );
}

function StudioInspectorInner({
  personality,
  voice,
  agentName,
  stored,
  setStored,
  children,
}: {
  personality: Personality;
  voice: { id: VoiceId; name: string; elevenLabsId: string };
  agentName: string;
  stored: StoredWowPayload | null;
  setStored: (v: StoredWowPayload) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [activeId, setActiveId] = useState<DeliverableKind>("landing");
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [composing, setComposing] = useState("");
  const [thinking, setThinking] = useState(false);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Refs keep tool handlers seeing the latest state.
  const storedRef = useRef(stored);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    storedRef.current = stored;
  }, [stored]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const runRefine = useCallback(
    async (instruction: string): Promise<string> => {
      const currentStored = storedRef.current;
      const currentActive = activeIdRef.current;
      if (!currentStored) return "No deliverables loaded yet.";

      setThinking(true);
      try {
        const res = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalityId: personality.id,
            agentName,
            instruction,
            activeDeliverable: currentActive,
            stored: currentStored,
          }),
        });
        const data = (await res.json()) as
          | {
              reply: string;
              updated?: Partial<StoredWowPayload["deliverables"]>;
            }
          | { error: string };

        if ("error" in data) return data.error;

        if (data.updated) {
          const changed = new Set<string>();
          if (data.updated.landing)
            for (const k of Object.keys(data.updated.landing))
              changed.add(`landing.${k}`);
          if (data.updated.social)
            for (const k of Object.keys(data.updated.social))
              changed.add(`social.${k}`);
          if (data.updated.ad)
            for (const k of Object.keys(data.updated.ad))
              changed.add(`ad.${k}`);
          setFlashFields(changed);
          setTimeout(() => setFlashFields(new Set()), 2000);

          const merged: StoredWowPayload = {
            ...currentStored,
            deliverables: {
              ...currentStored.deliverables,
              ...data.updated,
              landing: {
                ...currentStored.deliverables.landing,
                ...data.updated.landing,
              },
              social: {
                ...currentStored.deliverables.social,
                ...data.updated.social,
              },
              ad: { ...currentStored.deliverables.ad, ...data.updated.ad },
            },
          };
          setStored(merged);
          localStorage.setItem(STUDIO_KEY, JSON.stringify(merged));
        }
        return data.reply;
      } catch (err) {
        return err instanceof Error ? err.message : "Network error";
      } finally {
        setThinking(false);
      }
    },
    [personality.id, agentName, setStored],
  );

  const onTextSubmit = useCallback(async () => {
    const message = composing.trim();
    if (!message || thinking) return;
    setChatLines((c) => [...c, { role: "user", text: message }]);
    setComposing("");
    const reply = await runRefine(message);
    setChatLines((c) => [...c, { role: "agent", text: reply }]);
    setTimeout(() => composerRef.current?.focus(), 50);
  }, [composing, thinking, runRefine]);

  /* ============================================================
   * Voice session
   * ============================================================ */
  const [voiceState, setVoiceState] = useState<
    "idle" | "connecting" | "listening" | "speaking" | "error"
  >("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[voice] connected");
      setVoiceState("listening");
      setVoiceError(null);
    },
    onDisconnect: () => {
      console.log("[voice] disconnected");
      setVoiceState("idle");
    },
    onError: (err: unknown) => {
      console.error("[voice] error", err);
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
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
      if (source === "user") {
        setChatLines((c) => [...c, { role: "user", text }]);
      } else if (source === "ai") {
        setChatLines((c) => [...c, { role: "agent", text }]);
      }
    },
    onModeChange: (event) => {
      const mode = (event as { mode?: string }).mode;
      if (mode === "speaking") setVoiceState("speaking");
      else if (mode === "listening") setVoiceState("listening");
    },
    onUnhandledClientToolCall: (call) => {
      console.warn("[voice] UNHANDLED tool call:", call);
    },
  });

  useConversationClientTool("set_active_deliverable", (params) => {
    console.log("[voice] set_active_deliverable", params);
    const kind = String(params?.kind ?? "");
    const resolved = resolveDeliverableKind(kind);
    if (!resolved) {
      return `I don't know which deliverable "${kind}" means.`;
    }
    setActiveId(resolved as DeliverableKind);
    if (typeof window !== "undefined" && window.location.pathname !== "/studio") {
      router.push("/studio");
    }
    return `Switched to ${resolved}.`;
  });
  useConversationClientTool("navigate", (params) => {
    console.log("[voice] navigate", params);
    const destination = String(params?.destination ?? "");
    const route = resolveNavRoute(destination);
    if (!route) return `I don't know how to open "${destination}".`;
    router.push(route);
    return `Opened ${destination}.`;
  });
  useConversationClientTool("refine_active", async (params) => {
    console.log("[voice] refine_active", params);
    const instruction = String(params?.instruction ?? "").trim();
    if (!instruction) return "Tell me what to change.";
    setChatLines((c) => [...c, { role: "user", text: instruction }]);
    const reply = await runRefine(instruction);
    return reply;
  });
  useConversationClientTool("read_active", () => {
    console.log("[voice] read_active");
    const s = storedRef.current;
    const a = activeIdRef.current;
    if (!s) return "No deliverables loaded yet.";
    return readDeliverableAsText({
      kind: a as VoiceDeliverableKind,
      stored: s.deliverables,
    });
  });

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

      const systemPrompt = buildSystemPrompt({
        personality,
        agentName,
        voiceName: voice.name,
        stored: storedRef.current?.deliverables ?? null,
        activeDeliverable: activeIdRef.current as VoiceDeliverableKind,
      });
      const firstMessage = buildFirstMessage({
        personality,
        agentName,
        stored: storedRef.current?.deliverables ?? null,
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
      const msg = err instanceof Error ? err.message : "Couldn't start voice";
      setVoiceError(msg);
      setVoiceState("error");
    }
  }, [personality, voice, agentName, conversation]);

  const stopVoice = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // ignore
    }
    setVoiceState("idle");
  }, [conversation]);

  const voiceActive =
    voiceState === "listening" ||
    voiceState === "speaking" ||
    voiceState === "connecting";

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatLines.length, thinking]);

  const accent = personality.accent;
  const accentDeep = personality.accentDeep;
  const glow = personality.glow;

  return (
    <StudioContextProvider
      value={{
        personality,
        voice: voice as unknown as import("@/lib/voices").Voice,
        agentName,
        stored,
        activeId,
        setActiveId,
        flashFields,
        chatLines,
        thinking,
      }}
    >
      <div className="flex-1 h-full flex min-w-0">
        {/* Main content area (children) */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">{children}</div>

        {/* Right inspector — persistent across routes */}
        <aside
          className="shrink-0 h-full flex flex-col"
          style={{
            width: 416,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.014) 0%, rgba(0,0,0,0) 80%)",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Inspector header — orb + name */}
          <div
            className="shrink-0 px-6 pt-7 pb-6 flex flex-col items-center text-center relative overflow-hidden"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${accent}14, transparent 70%)`,
              }}
            />
            <div className="relative pt-3 pb-2">
              <PersonalityIcon personality={personality} size="md" />
            </div>
            <h3
              className="relative mt-7 font-serif font-medium tracking-tight"
              style={{
                fontSize: 38,
                lineHeight: 1.05,
                color: "rgba(245,245,247,0.98)",
                letterSpacing: "-0.03em",
              }}
            >
              {agentName}
            </h3>
            <div
              className="relative mt-3.5 text-[14.5px] flex items-center gap-2.5"
              style={{
                color: "rgba(245,245,247,0.65)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <motion.span
                animate={
                  reduced || !thinking
                    ? { opacity: 0.9 }
                    : { opacity: [0.4, 1, 0.4] }
                }
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="size-1.5 rounded-full"
                style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
              />
              <span>
                {personality.name} · {voice.name} ·{" "}
                {thinking
                  ? "Refining"
                  : voiceState === "speaking"
                    ? "Speaking"
                    : voiceState === "listening"
                      ? "Listening"
                      : voiceState === "connecting"
                        ? "Connecting"
                        : "Ready"}
              </span>
            </div>
          </div>

          {/* Transcript */}
          <div
            ref={transcriptRef}
            className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-4"
            style={{ scrollbarWidth: "thin" }}
          >
            {chatLines.length === 0 ? (
              <EmptyTranscript
                personality={personality}
                suggestions={SUGGESTIONS}
                onPick={(s) => {
                  setComposing(s);
                  composerRef.current?.focus();
                }}
              />
            ) : (
              chatLines.map((line, i) => (
                <ChatBubble
                  key={i}
                  line={line}
                  personality={personality}
                  agentName={agentName}
                  reduced={!!reduced}
                />
              ))
            )}
            {thinking && <ThinkingDots accent={accent} reduced={!!reduced} />}
          </div>

          {/* Composer */}
          <div className="shrink-0 px-4 pb-5 pt-3">
            <Composer
              personality={personality}
              agentName={agentName}
              composing={composing}
              thinking={thinking}
              voiceState={voiceState}
              voiceActive={voiceActive}
              voiceError={voiceError}
              onVoiceToggle={voiceActive ? stopVoice : startVoice}
              onComposingChange={setComposing}
              onSubmit={onTextSubmit}
              composerRef={composerRef}
            />
          </div>
        </aside>
      </div>
    </StudioContextProvider>
  );
}

/* ============================================================
 * COMPOSER + atoms (mirrors what was in page.tsx)
 * ============================================================ */
function Composer({
  personality,
  agentName,
  composing,
  thinking,
  voiceState,
  voiceActive,
  voiceError,
  onVoiceToggle,
  onComposingChange,
  onSubmit,
  composerRef,
}: {
  personality: Personality;
  agentName: string;
  composing: string;
  thinking: boolean;
  voiceState: "idle" | "connecting" | "listening" | "speaking" | "error";
  voiceActive: boolean;
  voiceError: string | null;
  onVoiceToggle: () => void;
  onComposingChange: (v: string) => void;
  onSubmit: () => void;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
  const hasText = composing.trim().length > 0;
  const stateCopy =
    voiceState === "connecting"
      ? "Connecting…"
      : voiceState === "listening"
        ? "Listening — speak now"
        : voiceState === "speaking"
          ? `${agentName} is speaking`
          : voiceState === "error"
            ? voiceError || "Voice error — tap to retry"
            : `Tap to talk with ${agentName}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center">
        <VoiceOrbButton
          accent={personality.accent}
          accentDeep={personality.accentDeep}
          glow={personality.glow}
          state={voiceState}
          onToggle={onVoiceToggle}
        />
        <div
          className="mt-3 text-[13.5px] tracking-[0.06em] text-center"
          style={{
            color:
              voiceState === "error"
                ? "#fda4af"
                : voiceActive
                  ? personality.accent
                  : "rgba(245,245,247,0.6)",
          }}
        >
          {stateCopy}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <span
          className="text-[11.5px] tracking-[0.22em] uppercase"
          style={{
            color: "rgba(245,245,247,0.4)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Or type
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      </div>

      <div
        className="rounded-2xl relative"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: hasText
            ? `1px solid ${personality.accent}55`
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: hasText
            ? `0 12px 32px -10px ${personality.glow}`
            : "0 8px 24px -10px rgba(0,0,0,0.4)",
          transition: "box-shadow 0.4s ease, border 0.4s ease",
        }}
      >
        <textarea
          ref={composerRef}
          value={composing}
          onChange={(e) => onComposingChange(e.target.value)}
          onKeyDown={onKey}
          placeholder={`Tell ${agentName} what to change…`}
          disabled={thinking}
          rows={2}
          className="w-full bg-transparent border-0 outline-none resize-none px-5 pt-4 pb-1 text-[16px] leading-relaxed placeholder:text-white/40 disabled:opacity-50"
          style={{
            color: "rgba(245,245,247,1)",
            caretColor: personality.accent,
            fontFamily: "var(--font-sans)",
            minHeight: 76,
          }}
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <button
            type="button"
            className="size-10 rounded-lg grid place-items-center transition-all hover:bg-white/[0.05]"
            style={{ color: "rgba(245,245,247,0.6)" }}
            aria-label="Attach"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span
              className="text-[12px] tracking-[0.18em] uppercase"
              style={{
                color: "rgba(245,245,247,0.45)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ↵ Send
            </span>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!hasText || thinking}
              className="h-10 px-4 rounded-lg inline-flex items-center gap-2 text-[14px] font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-transform hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: hasText
                  ? `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`
                  : "rgba(255,255,255,0.07)",
                boxShadow: hasText
                  ? `0 6px 20px -6px ${personality.glow}`
                  : "none",
              }}
              aria-label="Send"
            >
              <span>Send</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 19V5M5 12l7-7 7 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceOrbButton({
  accent,
  accentDeep,
  glow,
  state,
  onToggle,
}: {
  accent: string;
  accentDeep: string;
  glow: string;
  state: "idle" | "connecting" | "listening" | "speaking" | "error";
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();
  const isActive = state === "listening" || state === "speaking";
  const isConnecting = state === "connecting";
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      className="relative rounded-full grid place-items-center transition-all"
      style={{
        width: 84,
        height: 84,
        background: isActive
          ? `radial-gradient(circle at 30% 28%, ${accent}, ${accentDeep} 70%)`
          : `radial-gradient(circle at 30% 28%, ${accent}cc, ${accentDeep}cc 70%)`,
        boxShadow: isActive
          ? `0 0 0 8px ${accent}1f, 0 0 0 18px ${accent}10, 0 12px 40px -8px ${glow}`
          : `0 8px 30px -10px ${glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
        border: "1px solid rgba(255,255,255,0.12)",
      }}
      aria-label={isActive ? "End voice session" : "Start voice session"}
    >
      {!reduced && isActive && (
        <motion.span
          className="absolute inset-[-12px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accent}50, transparent 70%)`,
            filter: "blur(8px)",
          }}
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.12, 1] }}
          transition={{
            duration: state === "speaking" ? 0.9 : 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      {isConnecting && !reduced && (
        <motion.span
          className="absolute inset-1 rounded-full border-2 pointer-events-none"
          style={{
            borderColor: "rgba(255,255,255,0.25)",
            borderTopColor: "rgba(255,255,255,0.85)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      )}
      <span className="relative" style={{ color: "white" }}>
        {state === "speaking" ? (
          <WaveformIcon />
        ) : isActive ? (
          <StopIcon />
        ) : (
          <MicIcon size={28} />
        )}
      </span>
    </motion.button>
  );
}

function ChatBubble({
  line,
  personality,
  agentName,
  reduced,
}: {
  line: ChatLine;
  personality: Personality;
  agentName: string;
  reduced: boolean;
}) {
  if (line.role === "user") {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end"
      >
        <div
          className="px-4 py-3 rounded-2xl rounded-tr-md max-w-[88%] text-[16.5px] leading-relaxed"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(245,245,247,0.96)",
          }}
        >
          {line.text}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3"
    >
      <div className="shrink-0 mt-1">
        <PersonalityIcon personality={personality} size="xs" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[12.5px] tracking-[0.2em] uppercase mb-2"
          style={{
            color: personality.accent,
            fontFamily: "var(--font-mono)",
          }}
        >
          {agentName}
        </div>
        <p
          className="font-serif text-[18px] leading-[1.45]"
          style={{ color: "rgba(245,245,247,0.94)" }}
        >
          {line.text}
        </p>
      </div>
    </motion.div>
  );
}

function ThinkingDots({
  accent,
  reduced,
}: {
  accent: string;
  reduced: boolean;
}) {
  return (
    <div className="flex items-center gap-2 pl-9">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full"
          style={{ background: accent }}
          animate={
            reduced ? { opacity: 0.6 } : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }
          }
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function EmptyTranscript({
  personality,
  suggestions,
  onPick,
}: {
  personality: Personality;
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3.5 pt-1">
      <div
        className="text-[13px] tracking-[0.18em] uppercase"
        style={{
          color: "rgba(245,245,247,0.5)",
          fontFamily: "var(--font-mono)",
        }}
      >
        Try asking
      </div>
      <div className="flex flex-col gap-2.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="text-left px-4 py-3.5 rounded-xl text-[17px] transition-all hover:bg-white/[0.04] flex items-center justify-between group"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(245,245,247,0.92)",
            }}
          >
            <span className="font-serif">{s}</span>
            <span
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[16px]"
              style={{ color: personality.accent }}
            >
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="3"
        width="6"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function StopIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
function WaveformIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 12v0">
          <animate
            attributeName="d"
            values="M4 10v4;M4 7v10;M4 10v4"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M9 8v8">
          <animate
            attributeName="d"
            values="M9 8v8;M9 4v16;M9 8v8"
            dur="0.7s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M14 6v12">
          <animate
            attributeName="d"
            values="M14 6v12;M14 10v4;M14 6v12"
            dur="0.85s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M19 10v4">
          <animate
            attributeName="d"
            values="M19 10v4;M19 6v12;M19 10v4"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </svg>
  );
}
