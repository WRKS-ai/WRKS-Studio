"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { VOICES, type VoiceId } from "@/lib/voices";
import {
  FacebookAdInFeed,
  InstagramMini,
  IPhoneFrame,
  LinkedInMini,
  MacBookFrame,
  XMini,
} from "@/components/wow-mockups";

// /studio v4 — modern AI creative platform (Lovable / v0 / Granola energy).
// Two big breathing zones: chat panel left (480px), work canvas right (flex).
// Generous spacing throughout, ONE prominent personality orb (chat header),
// big composer, large fonts. NOT a dense data dashboard.

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

const DELIVERABLE_TABS: { id: DeliverableKind; label: string }[] = [
  { id: "landing", label: "Website" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "ad", label: "Ad" },
];

const SUGGESTIONS = [
  "Tighten the headline",
  "Try a sharper angle",
  "Make it 30% shorter",
  "Match the brand voice better",
  "Draft a launch email",
];

export default function StudioPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [stored, setStored] = useState<StoredWowPayload | null>(null);

  const [activeId, setActiveId] = useState<DeliverableKind>("landing");
  const [composing, setComposing] = useState("");
  const [thinking, setThinking] = useState(false);
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
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
  const brandName = stored?.deliverables.brandName ?? "Untitled";

  const onSubmit = useCallback(async () => {
    const message = composing.trim();
    if (!message || thinking) return;

    setChatLines((c) => [...c, { role: "user", text: message }]);
    setComposing("");
    setThinking(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalityId,
          agentName,
          instruction: message,
          activeDeliverable: activeId,
          stored,
        }),
      });
      const data = (await res.json()) as
        | { reply: string; updated?: Partial<StoredWowPayload["deliverables"]> }
        | { error: string };

      if ("error" in data) {
        setChatLines((c) => [...c, { role: "agent", text: data.error }]);
      } else {
        setChatLines((c) => [...c, { role: "agent", text: data.reply }]);
        if (data.updated && stored) {
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
            ...stored,
            deliverables: {
              ...stored.deliverables,
              ...data.updated,
              landing: {
                ...stored.deliverables.landing,
                ...data.updated.landing,
              },
              social: { ...stored.deliverables.social, ...data.updated.social },
              ad: { ...stored.deliverables.ad, ...data.updated.ad },
            },
          };
          setStored(merged);
          localStorage.setItem(STUDIO_KEY, JSON.stringify(merged));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setChatLines((c) => [...c, { role: "agent", text: msg }]);
    } finally {
      setThinking(false);
      setTimeout(() => composerRef.current?.focus(), 50);
    }
  }, [composing, thinking, personalityId, agentName, activeId, stored]);

  // Auto-scroll
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatLines.length, thinking]);

  if (!personality || !voice) return null;

  return (
    <div
      className="fixed inset-0 grid"
      style={{
        background: "#09090b",
        color: "rgba(245,245,247,1)",
        gridTemplateColumns: "minmax(420px, 480px) 1fr",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ============================================================
          CHAT PANEL (LEFT) — agent identity + transcript + composer
          ============================================================ */}
      <aside
        className="flex flex-col h-full overflow-hidden relative"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(0,0,0,0) 50%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Top brand row */}
        <div className="px-8 pt-7 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="size-2 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #6366f1 100%)",
                boxShadow: "0 0 10px rgba(165,180,252,0.5)",
              }}
              aria-hidden
            />
            <span className="font-serif text-[16px] tracking-tight">
              WRKS<span className="text-white/45"> Studio</span>
            </span>
          </div>
          <span
            className="px-2 py-1 rounded-md text-[10px] tracking-[0.2em] uppercase"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Beta
          </span>
        </div>

        {/* AGENT HEADER — large, centered, the heart of the chat */}
        <div className="px-8 pt-8 pb-8 flex flex-col items-center text-center">
          <motion.div
            animate={
              reduced ? undefined : { scale: thinking ? [1, 1.04, 1] : [1, 1.02, 1] }
            }
            transition={{
              duration: thinking ? 1.4 : 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <PersonalityIcon personality={personality} size="md" />
          </motion.div>
          <h1
            className="mt-6 font-serif font-medium tracking-tight text-[clamp(1.625rem,2vw,2rem)] leading-tight"
            style={{ letterSpacing: "-0.01em" }}
          >
            {agentName}
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-[12px]">
            <span style={{ color: personality.accent }}>●</span>
            <span style={{ color: "rgba(245,245,247,0.6)" }}>
              {personality.name} · {voice.name}
            </span>
          </div>
          <p
            className="mt-5 font-serif italic max-w-[28ch] text-[14.5px] leading-relaxed"
            style={{ color: "rgba(245,245,247,0.55)" }}
          >
            Tell me what to make or change. I&rsquo;ll show the diff in the
            workspace.
          </p>
        </div>

        {/* TRANSCRIPT */}
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto px-8 py-2 flex flex-col gap-5"
          style={{ scrollbarWidth: "thin" }}
        >
          {chatLines.length === 0 ? (
            <EmptyChatPrompt
              personality={personality}
              suggestions={SUGGESTIONS.slice(0, 3)}
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
          {thinking && (
            <div className="flex items-center gap-3">
              <PersonalityIcon personality={personality} size="xs" />
              <div className="flex items-center gap-1.5 pt-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1.5 rounded-full"
                    style={{ background: personality.accent }}
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
            </div>
          )}
        </div>

        {/* SUGGESTION PILLS */}
        {chatLines.length > 0 && (
          <div className="px-8 pt-3 pb-3 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-min">
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setComposing(s);
                    composerRef.current?.focus();
                  }}
                  className="shrink-0 h-9 px-4 rounded-full text-[13px] transition-all hover:bg-white/[0.06]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(245,245,247,0.75)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BIG COMPOSER */}
        <div className="px-6 pb-6 pt-2">
          <Composer
            personality={personality}
            agentName={agentName}
            composing={composing}
            thinking={thinking}
            onComposingChange={setComposing}
            onSubmit={onSubmit}
            composerRef={composerRef}
            reduced={!!reduced}
          />
        </div>
      </aside>

      {/* ============================================================
          WORK CANVAS (RIGHT) — deliverable preview + tabs + actions
          ============================================================ */}
      <main className="flex flex-col h-full overflow-hidden relative">
        {/* TOP BAR — tabs + actions */}
        <header
          className="px-8 py-5 flex items-center justify-between gap-6 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Tab pills */}
          <nav className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
            {DELIVERABLE_TABS.map((t) => {
              const isActive = activeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className="relative shrink-0 h-10 px-4 rounded-full text-[13.5px] font-medium transition-colors"
                  style={{
                    color: isActive
                      ? "rgba(245,245,247,1)"
                      : "rgba(245,245,247,0.55)",
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-tab-bg"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                  )}
                  <span className="relative inline-flex items-center gap-2">
                    {isActive && (
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: personality.accent }}
                      />
                    )}
                    {t.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Action cluster */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="h-10 px-4 rounded-full text-[13.5px] font-medium transition-colors hover:bg-white/[0.04]"
              style={{
                color: "rgba(245,245,247,0.7)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Share
            </button>
            <button
              type="button"
              className="h-10 px-5 rounded-full text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
                boxShadow: `0 8px 24px -8px ${personality.glow}`,
              }}
            >
              Publish
            </button>
          </div>
        </header>

        {/* CANVAS */}
        <div className="flex-1 overflow-auto relative">
          {/* Soft accent glow behind the deliverable */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${personality.accent}10, transparent 70%)`,
            }}
          />
          <div className="relative min-h-full flex items-center justify-center px-12 py-16">
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
                  transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
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
    </div>
  );
}

/* ============================================================
 * COMPOSER (big, inviting, with mic button)
 * ============================================================ */
function Composer({
  personality,
  agentName,
  composing,
  thinking,
  onComposingChange,
  onSubmit,
  composerRef,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  composing: string;
  thinking: boolean;
  onComposingChange: (v: string) => void;
  onSubmit: () => void;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  reduced: boolean;
}) {
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
  const hasText = composing.trim().length > 0;

  return (
    <div
      className="relative rounded-3xl"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: hasText
          ? `0 8px 32px -8px ${personality.glow}, 0 0 0 1px ${personality.accent}33`
          : "0 8px 24px -8px rgba(0,0,0,0.4)",
        transition: "box-shadow 0.4s ease",
      }}
    >
      <textarea
        ref={composerRef}
        value={composing}
        onChange={(e) => onComposingChange(e.target.value)}
        onKeyDown={onKey}
        placeholder={`Ask ${agentName} to make or change anything…`}
        disabled={thinking}
        rows={3}
        className="w-full bg-transparent border-0 outline-none resize-none px-5 pt-5 pb-2 text-[15px] leading-relaxed placeholder:text-white/35 disabled:opacity-50"
        style={{
          color: "rgba(245,245,247,1)",
          caretColor: personality.accent,
          fontFamily: "var(--font-sans)",
          minHeight: "92px",
        }}
      />
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-1">
          <ComposerButton title="Attach context">
            <PlusIcon />
          </ComposerButton>
          <ComposerButton title="Voice (hold)" accent={personality.accent}>
            <MicIcon />
          </ComposerButton>
        </div>
        <div className="flex items-center gap-3">
          <motion.span
            animate={
              hasText && !reduced
                ? { opacity: [0.5, 1, 0.5] }
                : { opacity: 0.4 }
            }
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="text-[11px] tracking-[0.18em] uppercase"
            style={{
              color: "rgba(245,245,247,0.5)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ↵ Send
          </motion.span>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!hasText || thinking}
            className="h-10 px-5 rounded-full inline-flex items-center gap-2 text-[13.5px] font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-transform hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: hasText
                ? `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`
                : "rgba(255,255,255,0.06)",
              boxShadow: hasText ? `0 8px 24px -8px ${personality.glow}` : "none",
            }}
            aria-label="Send"
          >
            <span>Send</span>
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function ComposerButton({
  children,
  title,
  accent,
}: {
  children: React.ReactNode;
  title: string;
  accent?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      className="size-9 rounded-full inline-flex items-center justify-center hover:bg-white/[0.05] transition-colors"
      style={{ color: accent ?? "rgba(245,245,247,0.55)" }}
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
        transition={{ duration: 0.35 }}
        className="flex justify-end"
      >
        <div
          className="px-4 py-3 rounded-2xl rounded-tr-md max-w-[88%] text-[14.5px] leading-relaxed"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(245,245,247,0.95)",
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
      transition={{ duration: 0.35 }}
      className="flex items-start gap-3"
    >
      <div className="shrink-0 mt-1">
        <PersonalityIcon personality={personality} size="xs" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[11px] tracking-[0.2em] uppercase mb-1.5"
          style={{
            color: personality.accent,
            fontFamily: "var(--font-mono)",
          }}
        >
          {agentName}
        </div>
        <p
          className="font-serif text-[15px] leading-relaxed"
          style={{ color: "rgba(245,245,247,0.85)" }}
        >
          {line.text}
        </p>
      </div>
    </motion.div>
  );
}

/* ============================================================
 * EMPTY STATES
 * ============================================================ */
function EmptyChatPrompt({
  personality,
  suggestions,
  onPick,
}: {
  personality: Personality;
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <div
        className="text-[11px] tracking-[0.22em] uppercase"
        style={{
          color: "rgba(245,245,247,0.4)",
          fontFamily: "var(--font-mono)",
        }}
      >
        Try asking
      </div>
      <div className="flex flex-col gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="text-left px-4 py-3 rounded-2xl text-[14.5px] transition-all hover:bg-white/[0.04] flex items-center justify-between group"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(245,245,247,0.85)",
            }}
          >
            <span className="font-serif">{s}</span>
            <span
              className="opacity-0 group-hover:opacity-100 transition-opacity"
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
      <div className="w-full max-w-[960px]" style={flashStyle("landing", "20px")}>
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
    <div className="size-full bg-[#fbf7ee] flex flex-col">
      <div className="flex items-center justify-between px-8 py-3 border-b border-black/5">
        <span className="font-serif text-[14px] text-[#0e0c08] flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full"
            style={{ background: personality.accent }}
          />
          {brandName}
        </span>
        <div className="flex gap-5 text-[10px] uppercase tracking-[0.22em] font-mono text-[#827a6e]">
          <span>Index</span>
          <span>Studio</span>
          <span>Contact</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.22em] font-mono text-[#827a6e]">
          Vol. 01
        </span>
      </div>
      <div className="px-12 py-12 text-left flex-1">
        <div
          className="text-[10px] tracking-[0.32em] uppercase font-mono mb-6 flex items-center gap-3"
          style={{ color: "#827a6e" }}
        >
          <span
            className="inline-block h-px w-8"
            style={{ background: personality.accent }}
          />
          <span>Now showing</span>
        </div>
        <h1
          className="font-serif font-medium text-[clamp(1.875rem,4vw,3rem)] leading-[0.95] text-[#0e0c08] max-w-[16ch]"
          style={{ letterSpacing: "-0.025em" }}
        >
          {data.headline}
        </h1>
        <p className="mt-6 font-serif italic text-[clamp(0.9375rem,1.3vw,1.0625rem)] text-[#4a443c] max-w-[40ch]">
          {data.subhead}
        </p>
        <button
          className="mt-7 inline-flex items-center gap-2 text-[#0e0c08] font-serif border-b border-[#0e0c08] pb-1 text-[14px]"
          type="button"
        >
          <span>{data.primaryCta}</span>
          <span style={{ color: personality.accent }}>→</span>
        </button>
      </div>
      <div className="px-12 pb-10 grid grid-cols-3 gap-5">
        {data.valueBullets.slice(0, 3).map((bullet, i) => (
          <div key={i}>
            <div
              className="text-[10px] tracking-[0.32em] uppercase font-mono mb-2"
              style={{ color: personality.accent }}
            >
              0{i + 1}
            </div>
            <p className="font-serif text-[#0e0c08] text-[13px] leading-snug">
              {bullet}
            </p>
          </div>
        ))}
      </div>
      <div className="aspect-[16/9] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
}

/* ============================================================
 * Icons
 * ============================================================ */
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
