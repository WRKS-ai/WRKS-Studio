"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import {
  buildFirstMessage,
  buildSystemPrompt,
  readDeliverableAsText,
  resolveDeliverableKind,
  resolveNavRoute,
  type DeliverableKind as VoiceDeliverableKind,
} from "@/lib/voice-agent";
import { VOICES, type VoiceId } from "@/lib/voices";
import {
  FacebookAdInFeed,
  InstagramMini,
  IPhoneFrame,
  LinkedInMini,
  MacBookFrame,
  XMini,
} from "@/components/wow-mockups";

// /studio v6 — full premium dashboard (Cursor / Granola / Figma tier).
// Layout owns sidebar + top bar; this page is the main canvas (left, flex)
// + the right Iris inspector (380px). Bigger fonts, real product chrome.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const STUDIO_KEY = "wrks-studio-deliverables";

type DeliverableKind = "landing" | "instagram" | "twitter" | "linkedin" | "ad";

type StoredWowPayload = {
  deliverables: {
    brandName: string;
    landing: {
      headline: string;
      subhead: string;
      primaryCta: string;
      valueBullets: string[];
    };
    social: { instagram: string; twitter: string; linkedin: string };
    ad: { headline: string; body: string; cta: string };
  };
  images: {
    heroLandscape: string;
    featured: string[];
    instagramSquare: string;
    adHero: string;
  };
  createdAt: string;
};

type ChatLine = { role: "user" | "agent"; text: string };

const DELIVERABLE_TABS: {
  id: DeliverableKind;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  meta: string;
}[] = [
  { id: "landing", label: "Website", Icon: BrowserIcon, meta: "Hero · 1440 × 900" },
  { id: "instagram", label: "Instagram", Icon: CameraIcon, meta: "Feed · 1080 × 1080" },
  { id: "twitter", label: "X", Icon: XGlyphIcon, meta: "Post · 280 chars" },
  { id: "linkedin", label: "LinkedIn", Icon: WorkIcon, meta: "Update · 700 chars" },
  { id: "ad", label: "Facebook Ad", Icon: CampaignIcon, meta: "In-feed · 1200 × 628" },
];

const SUGGESTIONS = [
  "Tighten the headline",
  "Sharper angle on the hook",
  "Make it 30% shorter",
  "Match the brand voice better",
];

export default function StudioPage() {
  // useConversation requires a ConversationProvider higher in the tree.
  return (
    <ConversationProvider>
      <StudioPageInner />
    </ConversationProvider>
  );
}

function StudioPageInner() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [stored, setStored] = useState<StoredWowPayload | null>(null);

  const [activeId, setActiveId] = useState<DeliverableKind>("landing");
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [composing, setComposing] = useState("");
  const [thinking, setThinking] = useState(false);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

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
  }, [router]);

  const personality = personalityId
    ? PERSONALITIES.find((p) => p.id === personalityId)!
    : null;
  const voice = voiceId ? VOICES.find((v) => v.id === voiceId)! : null;

  // Refs mirror state for use inside ElevenLabs client tools — the hook
  // is initialized once and the tool callbacks close over the initial
  // state otherwise, missing newer activeId / stored updates.
  const storedRef = useRef(stored);
  const activeIdRef = useRef(activeId);
  const personalityIdRef = useRef(personalityId);
  const agentNameRef = useRef(agentName);
  useEffect(() => {
    storedRef.current = stored;
  }, [stored]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    personalityIdRef.current = personalityId;
  }, [personalityId]);
  useEffect(() => {
    agentNameRef.current = agentName;
  }, [agentName]);

  // Shared refine logic — called by both the text composer and the
  // voice agent's `refine_active` tool. Returns the agent's reply
  // string so the voice agent can confirm aloud.
  const runRefine = useCallback(
    async (instruction: string): Promise<string> => {
      const currentStored = storedRef.current;
      const currentActive = activeIdRef.current;
      const currentPersonalityId = personalityIdRef.current;
      const currentAgentName = agentNameRef.current;
      if (!currentStored || !currentPersonalityId)
        return "No deliverables loaded yet.";

      setThinking(true);
      try {
        const res = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalityId: currentPersonalityId,
            agentName: currentAgentName,
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
    [],
  );

  const onSubmit = useCallback(async () => {
    const message = composing.trim();
    if (!message || thinking) return;

    setChatLines((c) => [...c, { role: "user", text: message }]);
    setComposing("");
    const reply = await runRefine(message);
    setChatLines((c) => [...c, { role: "agent", text: reply }]);
    setTimeout(() => composerRef.current?.focus(), 50);
  }, [composing, thinking, runRefine]);

  /* ============================================================
   * ELEVENLABS VOICE AGENT — useConversation + client tools
   * ============================================================ */
  const [voiceState, setVoiceState] = useState<
    "idle" | "connecting" | "listening" | "speaking" | "error"
  >("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);

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
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Voice connection error";
      setVoiceError(msg);
      setVoiceState("error");
    },
    onMessage: (event) => {
      // ElevenLabs emits both user transcripts and agent replies via
      // onMessage. Append both to the transcript so they appear next
      // to typed messages.
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
    clientTools: {
      set_active_deliverable: ({ kind }: { kind: string }) => {
        const resolved = resolveDeliverableKind(kind);
        if (!resolved) {
          return `I don't know which deliverable "${kind}" means. Try landing, instagram, twitter, linkedin, or ad.`;
        }
        setActiveId(resolved as DeliverableKind);
        return `Switched to ${resolved}.`;
      },
      navigate: ({ destination }: { destination: string }) => {
        const route = resolveNavRoute(destination);
        if (!route) return `I don't know how to open "${destination}".`;
        router.push(route);
        return `Opened ${destination}.`;
      },
      refine_active: async ({ instruction }: { instruction: string }) => {
        if (!instruction) return "Tell me what to change.";
        setChatLines((c) => [
          ...c,
          { role: "user", text: instruction },
        ]);
        const reply = await runRefine(instruction);
        return reply;
      },
      read_active: () => {
        const s = storedRef.current;
        const a = activeIdRef.current;
        if (!s) return "No deliverables loaded yet.";
        return readDeliverableAsText({
          kind: a as VoiceDeliverableKind,
          stored: s.deliverables,
        });
      },
    },
  });

  const startVoice = useCallback(async () => {
    if (!personality || !voice) return;
    setVoiceError(null);
    setVoiceState("connecting");
    try {
      // Mic permission must be requested inside the user gesture
      // (Safari/iOS). We don't keep the stream — ElevenLabs SDK opens
      // its own once startSession runs.
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const res = await fetch("/api/voice/signed-url");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `Signed-URL endpoint returned ${res.status}`);
      }
      const { signedUrl } = (await res.json()) as { signedUrl: string };

      const systemPrompt = buildSystemPrompt({
        personality,
        agentName,
        voiceName: voice.name,
        stored: stored?.deliverables ?? null,
        activeDeliverable: activeId as VoiceDeliverableKind,
      });
      const firstMessage = buildFirstMessage({
        personality,
        agentName,
        stored: stored?.deliverables ?? null,
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
  }, [personality, voice, agentName, stored, activeId, conversation]);

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

  if (!personality || !voice) return null;

  const accent = personality.accent;
  const accentDeep = personality.accentDeep;
  const glow = personality.glow;

  return (
    <div className="size-full flex">
      {/* ============================================================
          MAIN CANVAS — deliverable tabs + lightbox art object
          ============================================================ */}
      <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* Subnav: deliverable tabs */}
        <div
          className="shrink-0 px-9 pt-6 pb-5 flex items-center justify-between gap-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
            {DELIVERABLE_TABS.map((t) => {
              const isActive = activeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className="relative shrink-0 h-12 px-5 rounded-lg inline-flex items-center gap-3 transition-colors"
                  style={{
                    background: isActive
                      ? "rgba(255,255,255,0.06)"
                      : "transparent",
                    border: isActive
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid transparent",
                    color: isActive
                      ? "rgba(245,245,247,1)"
                      : "rgba(245,245,247,0.65)",
                  }}
                >
                  <span
                    style={{
                      color: isActive ? accent : "rgba(245,245,247,0.6)",
                    }}
                  >
                    <t.Icon size={18} />
                  </span>
                  <span className="text-[16px] font-medium">{t.label}</span>
                  {isActive && (
                    <span
                      className="size-2 rounded-full"
                      style={{
                        background: accent,
                        boxShadow: `0 0 8px ${accent}`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              className="h-11 px-4.5 rounded-lg text-[15px] font-medium transition-colors hover:bg-white/[0.05]"
              style={{
                color: "rgba(245,245,247,0.82)",
                border: "1px solid rgba(255,255,255,0.08)",
                paddingLeft: 18,
                paddingRight: 18,
              }}
            >
              Preview
            </button>
            <button
              type="button"
              className="h-11 px-[18px] rounded-lg text-[15px] font-medium transition-colors hover:bg-white/[0.05]"
              style={{
                color: "rgba(245,245,247,0.82)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Share
            </button>
            <button
              type="button"
              className="h-11 px-5 rounded-lg text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
                boxShadow: `0 8px 24px -8px ${glow}`,
              }}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Deliverable metadata strip */}
        <div className="shrink-0 px-9 py-5 flex items-center justify-between gap-6">
          <div className="flex items-baseline gap-4">
            <h2
              className="font-serif font-medium tracking-tight"
              style={{
                fontSize: 36,
                color: "rgba(245,245,247,0.98)",
                letterSpacing: "-0.025em",
                lineHeight: 1,
              }}
            >
              {labelFor(activeId)}
            </h2>
            <span
              className="text-[14.5px]"
              style={{
                color: "rgba(245,245,247,0.55)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {metaFor(activeId)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot
              color={thinking ? "#fbbf24" : "#10b981"}
              label={thinking ? "Refining" : "In sync"}
            />
            <span
              className="text-[14px]"
              style={{
                color: "rgba(245,245,247,0.55)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Saved · just now
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 min-h-0 relative overflow-auto">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 35%, ${accent}10, transparent 70%)`,
            }}
          />
          <div className="relative min-h-full flex items-center justify-center px-12 py-12">
            {stored ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  initial={
                    reduced
                      ? false
                      : { opacity: 0, y: 16, filter: "blur(8px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    reduced
                      ? undefined
                      : { opacity: 0, y: -10, filter: "blur(6px)" }
                  }
                  transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                  className="flex justify-center w-full"
                >
                  <ActiveDeliverable
                    kind={activeId}
                    personality={personality}
                    agentName={agentName}
                    stored={stored}
                    flashFields={flashFields}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <EmptyCanvas
                personality={personality}
                onContinue={() => router.push("/onboarding/personality")}
              />
            )}
          </div>
        </div>
      </main>

      {/* ============================================================
          RIGHT INSPECTOR — Iris orb + chat + composer
          ============================================================ */}
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
          {/* Soft accent wash behind orb */}
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
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
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
            onSubmit={onSubmit}
            composerRef={composerRef}
          />
        </div>
      </aside>
    </div>
  );
}

function labelFor(kind: DeliverableKind) {
  switch (kind) {
    case "landing":
      return "Landing page";
    case "instagram":
      return "Instagram post";
    case "twitter":
      return "X post";
    case "linkedin":
      return "LinkedIn update";
    case "ad":
      return "Facebook ad";
  }
}

function metaFor(kind: DeliverableKind) {
  return DELIVERABLE_TABS.find((t) => t.id === kind)?.meta ?? "";
}

/* ============================================================
 * COMPOSER — voice hero + text fallback
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
      {/* HERO TALK BUTTON */}
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

      {/* "Or type" divider */}
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

      {/* TEXT FALLBACK */}
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
          <ComposerIconButton title="Attach context">
            <PlusIcon />
          </ComposerIconButton>
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
              <ArrowUpIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * VOICE ORB BUTTON — the hero
 * ============================================================ */
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
      aria-label={
        isActive ? "End voice session" : "Start voice session"
      }
    >
      {/* Pulse halo when active */}
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
      {/* Connecting spinner */}
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
      {/* Icon */}
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

function ComposerIconButton({
  children,
  title,
  active,
  accent,
  glow,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  accent?: string;
  glow?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      className="size-10 rounded-lg grid place-items-center transition-all hover:bg-white/[0.05]"
      style={{
        color: active && accent ? accent : "rgba(245,245,247,0.65)",
        background: active && accent ? `${accent}1f` : "transparent",
        boxShadow: active && glow ? `0 0 0 1px ${accent}55, 0 0 12px ${glow}` : "none",
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================
 * CHAT BUBBLE
 * ============================================================ */
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
            reduced
              ? { opacity: 0.6 }
              : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }
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

/* ============================================================
 * EMPTY STATES
 * ============================================================ */
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

function EmptyCanvas({
  personality,
  onContinue,
}: {
  personality: Personality;
  onContinue: () => void;
}) {
  return (
    <div className="text-center max-w-md">
      <PersonalityIcon personality={personality} size="md" />
      <p
        className="mt-8 font-serif italic text-[clamp(1.25rem,2vw,1.5rem)]"
        style={{ color: "rgba(245,245,247,0.6)" }}
      >
        No work saved yet.
      </p>
      <button
        onClick={onContinue}
        className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13.5px] font-medium text-white transition-transform hover:scale-[1.02]"
        style={{
          background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
        }}
      >
        Back to onboarding
        <span>→</span>
      </button>
    </div>
  );
}

/* ============================================================
 * StatusDot
 * ============================================================ */
function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 h-9 rounded-md"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        className="size-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span
        className="text-[14px] font-medium"
        style={{
          color: "rgba(245,245,247,0.85)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ============================================================
 * ACTIVE DELIVERABLE
 * ============================================================ */
function ActiveDeliverable({
  kind,
  personality,
  agentName,
  stored,
  flashFields,
}: {
  kind: DeliverableKind;
  personality: Personality;
  agentName: string;
  stored: StoredWowPayload;
  flashFields: Set<string>;
}) {
  const d = stored.deliverables;
  const i = stored.images;
  const handleSlug =
    d.brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "brand";
  const isFlashing = (path: string) =>
    Array.from(flashFields).some((f) => f.startsWith(path));

  const flashStyle = (path: string, radius: string) => ({
    outline: isFlashing(path) ? `2px solid ${personality.accent}` : "none",
    outlineOffset: "12px",
    transition: "outline 0.4s ease",
    borderRadius: radius,
  });

  if (kind === "landing") {
    return (
      <div className="w-full max-w-[820px]" style={flashStyle("landing", "16px")}>
        <MacBookFrame>
          <CompactLanding
            personality={personality}
            brandName={d.brandName}
            data={d.landing}
            heroImage={i.heroLandscape}
          />
        </MacBookFrame>
      </div>
    );
  }
  if (kind === "instagram") {
    return (
      <div style={flashStyle("social.instagram", "44px")}>
        <IPhoneFrame width={340} shadowGlow={personality.glow}>
          <InstagramMini
            handle={handleSlug}
            caption={d.social.instagram}
            image={i.instagramSquare}
            accent={personality.accent}
            accentDeep={personality.accentDeep}
          />
        </IPhoneFrame>
      </div>
    );
  }
  if (kind === "twitter") {
    return (
      <div style={flashStyle("social.twitter", "44px")}>
        <IPhoneFrame width={340} shadowGlow={personality.glow}>
          <XMini
            brandName={d.brandName}
            handle={`@${handleSlug}`}
            text={d.social.twitter}
            accent={personality.accent}
            accentDeep={personality.accentDeep}
          />
        </IPhoneFrame>
      </div>
    );
  }
  if (kind === "linkedin") {
    return (
      <div style={flashStyle("social.linkedin", "44px")}>
        <IPhoneFrame width={340} shadowGlow={personality.glow}>
          <LinkedInMini
            agentName={agentName}
            brandName={d.brandName}
            text={d.social.linkedin}
            accent={personality.accent}
            accentDeep={personality.accentDeep}
          />
        </IPhoneFrame>
      </div>
    );
  }
  return (
    <div style={flashStyle("ad", "44px")}>
      <IPhoneFrame width={360} shadowGlow={personality.glow}>
        <FacebookAdInFeed
          brandName={d.brandName}
          adData={d.ad}
          adImage={i.adHero}
          accent={personality.accent}
          accentDeep={personality.accentDeep}
        />
      </IPhoneFrame>
    </div>
  );
}

function CompactLanding({
  personality,
  brandName,
  data,
  heroImage,
}: {
  personality: Personality;
  brandName: string;
  data: StoredWowPayload["deliverables"]["landing"];
  heroImage: string;
}) {
  return (
    <div className="size-full bg-[#fbf7ee] flex flex-col overflow-hidden">
      {/* Top nav bar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-black/5 shrink-0">
        <span className="font-serif text-[15px] text-[#0e0c08] flex items-center gap-2">
          <span
            className="size-1.5 rounded-full"
            style={{ background: personality.accent }}
          />
          {brandName}
        </span>
        <div className="flex gap-6 text-[11px] uppercase tracking-[0.22em] font-mono text-[#827a6e]">
          <span>Index</span>
          <span>Studio</span>
          <span>Contact</span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.22em] font-mono text-[#827a6e]">
          Vol. 01
        </span>
      </div>

      {/* Editorial 2-col body: left column has full editorial content
          (now showing label + headline + subhead + CTA + bullets stacked),
          right column is the photo plate at full height. */}
      <div
        className="grid flex-1 min-h-0"
        style={{ gridTemplateColumns: "1.2fr 0.8fr" }}
      >
        <div className="px-10 py-9 text-left flex flex-col min-h-0 overflow-hidden">
          <div
            className="text-[11px] tracking-[0.32em] uppercase font-mono mb-5 flex items-center gap-3 shrink-0"
            style={{ color: "#827a6e" }}
          >
            <span
              className="inline-block h-px w-8"
              style={{ background: personality.accent }}
            />
            <span>Now showing</span>
          </div>
          <h1
            className="font-serif font-medium text-[clamp(1.5rem,2.8vw,2.25rem)] leading-[1.02] text-[#0e0c08] max-w-[17ch] shrink-0"
            style={{ letterSpacing: "-0.025em" }}
          >
            {data.headline}
          </h1>
          <p className="mt-4 font-serif italic text-[clamp(0.875rem,1.1vw,1rem)] text-[#4a443c] max-w-[42ch] leading-relaxed shrink-0">
            {data.subhead}
          </p>
          <button
            className="mt-5 inline-flex items-center gap-2 text-[#0e0c08] font-serif border-b border-[#0e0c08] pb-1 text-[14px] self-start shrink-0"
            type="button"
          >
            <span>{data.primaryCta}</span>
            <span style={{ color: personality.accent }}>→</span>
          </button>

          {/* Bullets pinned to bottom of left column */}
          <div className="flex-1" />
          <div
            className="mt-6 pt-5 grid grid-cols-3 gap-5 shrink-0"
            style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
          >
            {data.valueBullets.slice(0, 3).map((bullet, i) => (
              <div key={i}>
                <div
                  className="text-[9.5px] tracking-[0.3em] uppercase font-mono mb-1.5"
                  style={{ color: personality.accent }}
                >
                  0{i + 1}
                </div>
                <p className="font-serif text-[#0e0c08] text-[11.5px] leading-snug">
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo plate — right column, full height */}
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Icons
 * ============================================================ */
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function StopIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M5 12l7-7 7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BrowserIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="6" cy="6.5" r="0.7" fill="currentColor" />
      <circle cx="8.5" cy="6.5" r="0.7" fill="currentColor" />
    </svg>
  );
}
function CameraIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 7l1.5-2.5h5L16 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function XGlyphIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.97 6.817H1.68l7.73-8.835L1.25 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function WorkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 13h18" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function CampaignIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h3l8 4V5l-8 4H4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M18 8a4 4 0 0 1 0 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
