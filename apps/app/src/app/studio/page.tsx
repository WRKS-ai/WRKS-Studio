"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { StageBackdrop } from "@/components/stage-backdrop";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { VOICES, type VoiceId } from "@/lib/voices";

// /studio — the talk-to-your-agent home, per Google Stitch reference.
// Sidebar lists the user's work (the deliverables they just generated
// in /onboarding/wow plus future work). Main area is a massive prompt
// input with personality-accent glow — the entire product loop runs
// through this input.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const STUDIO_KEY = "wrks-studio-deliverables";

type DeliverableKind =
  | "landing"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "ad";

type StudioDeliverable = {
  id: DeliverableKind;
  title: string;
  subtitle: string;
  thumbnail: string;
  thumbnailIsImage: boolean;
  body: string;
};

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

const SUGGESTION_PROMPTS = [
  "Tighten the landing headline",
  "Make the Instagram post 30% shorter",
  "Try a different angle for the ad",
  "Write three more X posts in this voice",
  "Draft a launch email",
];

export default function StudioPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  const [agentName, setAgentName] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [stored, setStored] = useState<StoredWowPayload | null>(null);

  const [tab, setTab] = useState<"work" | "library">("work");
  const [search, setSearch] = useState("");
  const [activeDeliverable, setActiveDeliverable] =
    useState<DeliverableKind | null>(null);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transcript, setTranscript] = useState<
    { role: "user" | "agent"; text: string; at: string }[]
  >([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate everything from localStorage
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
        // ignore malformed
      }
    }
  }, [router]);

  const personality = personalityId
    ? PERSONALITIES.find((p) => p.id === personalityId)!
    : null;
  const voice = voiceId ? VOICES.find((v) => v.id === voiceId)! : null;

  // Convert the stored wow payload into the sidebar deliverables list
  const deliverables = useMemo<StudioDeliverable[]>(() => {
    if (!stored) return [];
    const { deliverables: d, images: i } = stored;
    return [
      {
        id: "landing",
        title: "Landing page",
        subtitle: d.landing.headline,
        thumbnail: i.heroLandscape,
        thumbnailIsImage: true,
        body: `${d.landing.headline}\n\n${d.landing.subhead}\n\nCTA: ${d.landing.primaryCta}\n\n• ${d.landing.valueBullets.join("\n• ")}`,
      },
      {
        id: "instagram",
        title: "Instagram post",
        subtitle: "Sponsored · Today",
        thumbnail: i.instagramSquare,
        thumbnailIsImage: true,
        body: d.social.instagram,
      },
      {
        id: "twitter",
        title: "X / Twitter post",
        subtitle: "@" + (d.brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "brand"),
        thumbnail: "",
        thumbnailIsImage: false,
        body: d.social.twitter,
      },
      {
        id: "linkedin",
        title: "LinkedIn post",
        subtitle: "From your founder profile",
        thumbnail: "",
        thumbnailIsImage: false,
        body: d.social.linkedin,
      },
      {
        id: "ad",
        title: "Ad creative",
        subtitle: d.ad.headline,
        thumbnail: i.adHero,
        thumbnailIsImage: true,
        body: `${d.ad.headline}\n\n${d.ad.body}\n\nCTA: ${d.ad.cta}`,
      },
    ];
  }, [stored]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deliverables;
    return deliverables.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q) ||
        d.body.toLowerCase().includes(q),
    );
  }, [deliverables, search]);

  if (!personality || !voice) return null;

  const onSubmit = async () => {
    const message = input.trim();
    if (!message || submitting) return;

    setSubmitting(true);
    setTranscript((t) => [
      ...t,
      { role: "user", text: message, at: new Date().toISOString() },
    ]);
    setInput("");

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalityId,
          agentName,
          instruction: message,
          activeDeliverable,
          stored,
        }),
      });
      const data = (await res.json()) as
        | { reply: string; updated?: Partial<StoredWowPayload["deliverables"]> }
        | { error: string };

      if ("error" in data) {
        setTranscript((t) => [
          ...t,
          {
            role: "agent",
            text: `Couldn't do that — ${data.error}`,
            at: new Date().toISOString(),
          },
        ]);
      } else {
        setTranscript((t) => [
          ...t,
          { role: "agent", text: data.reply, at: new Date().toISOString() },
        ]);
        // If the agent returned updated deliverables, merge + persist
        if (data.updated && stored) {
          const merged: StoredWowPayload = {
            ...stored,
            deliverables: {
              ...stored.deliverables,
              ...data.updated,
            },
          };
          setStored(merged);
          localStorage.setItem(STUDIO_KEY, JSON.stringify(merged));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setTranscript((t) => [
        ...t,
        {
          role: "agent",
          text: `Couldn't do that — ${msg}`,
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSubmitting(false);
      // Refocus the input for fast follow-up
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSubmit();
    }
  };

  const onSuggestion = (s: string) => {
    setInput(s);
    inputRef.current?.focus();
  };

  return (
    <main className="relative min-h-screen flex bg-canvas overflow-hidden">
      <StageBackdrop tint={personality.glow} />

      {/* ============== SIDEBAR ============== */}
      <Sidebar
        personality={personality}
        agentName={agentName}
        voiceName={voice.name}
        tab={tab}
        onTabChange={setTab}
        search={search}
        onSearchChange={setSearch}
        deliverables={filtered}
        activeDeliverable={activeDeliverable}
        onSelectDeliverable={(id) =>
          setActiveDeliverable(activeDeliverable === id ? null : id)
        }
        reduced={!!reduced}
      />

      {/* ============== MAIN ============== */}
      <section className="relative flex-1 flex flex-col">
        {/* Top bar */}
        <TopBar agentName={agentName} personality={personality} />

        <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-8 sm:py-12 overflow-y-auto">
          <div className="w-full max-w-[820px] flex flex-col items-center">
            {/* Welcome heading */}
            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
              className="font-serif font-medium tracking-tight leading-[0.96] text-[clamp(2.25rem,4.5vw,4rem)] text-ink text-center mb-2"
            >
              Welcome back.
            </motion.h1>
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
              className="font-serif italic text-[clamp(1.125rem,1.5vw,1.5rem)] text-ink-muted text-center mb-12"
            >
              What should we work on, {agentName}?
            </motion.p>

            {/* Transcript */}
            {transcript.length > 0 && (
              <div className="w-full mb-8 flex flex-col gap-4 max-h-[280px] overflow-y-auto pr-1">
                {transcript.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={reduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`flex gap-3 ${
                      line.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {line.role === "agent" && (
                      <div className="shrink-0 mt-0.5">
                        <PersonalityIcon personality={personality} size="xs" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] text-[14px] leading-relaxed font-serif ${
                        line.role === "user"
                          ? "text-right text-ink"
                          : "italic text-ink-muted"
                      }`}
                    >
                      {line.text}
                    </div>
                  </motion.div>
                ))}
                {submitting && (
                  <div className="flex gap-3 items-center">
                    <PersonalityIcon personality={personality} size="xs" />
                    <div className="flex items-center gap-1.5">
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
            )}

            {/* PROMPT INPUT — the hero element */}
            <PromptInput
              personality={personality}
              agentName={agentName}
              voiceName={voice.name}
              value={input}
              onChange={setInput}
              onKeyDown={onKeyDown}
              onSubmit={() => void onSubmit()}
              submitting={submitting}
              inputRef={inputRef}
              activeDeliverable={
                activeDeliverable
                  ? deliverables.find((d) => d.id === activeDeliverable) ?? null
                  : null
              }
              reduced={!!reduced}
            />

            {/* Suggestion pills */}
            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-6 flex items-center flex-wrap justify-center gap-2.5 max-w-[680px]"
            >
              {SUGGESTION_PROMPTS.map((s, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => onSuggestion(s)}
                  whileHover={reduced ? undefined : { y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-3.5 py-1.5 rounded-full text-[12.5px] font-sans text-ink-muted hover:text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {s}
                </motion.button>
              ))}
            </motion.div>

            {/* "Need inspiration" — meta */}
            {deliverables.length === 0 && (
              <p className="mt-12 text-[12px] tracking-[0.2em] uppercase text-ink-dim font-mono text-center">
                No saved work yet — head back to{" "}
                <button
                  onClick={() => router.push("/onboarding/personality")}
                  className="underline hover:text-ink-muted transition-colors"
                >
                  onboarding
                </button>{" "}
                to draft your first deliverables
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
 * Sidebar (Stitch-style)
 * ============================================================ */
function Sidebar({
  personality,
  agentName,
  voiceName,
  tab,
  onTabChange,
  search,
  onSearchChange,
  deliverables,
  activeDeliverable,
  onSelectDeliverable,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  voiceName: string;
  tab: "work" | "library";
  onTabChange: (t: "work" | "library") => void;
  search: string;
  onSearchChange: (v: string) => void;
  deliverables: StudioDeliverable[];
  activeDeliverable: DeliverableKind | null;
  onSelectDeliverable: (id: DeliverableKind) => void;
  reduced: boolean;
}) {
  return (
    <aside
      className="relative shrink-0 w-[280px] flex flex-col gap-5 p-5 sm:p-6 hidden md:flex"
      style={{
        background: "rgba(0,0,0,0.25)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Top — agent + brand */}
      <div className="flex items-center gap-2.5">
        <PersonalityIcon personality={personality} size="xs" />
        <div className="min-w-0 flex-1">
          <div className="font-serif text-[15px] tracking-tight text-ink leading-tight">
            {agentName}
          </div>
          <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono mt-0.5">
            {personality.name} · {voiceName}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="grid grid-cols-2 gap-1 p-1 rounded-full"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        {(["work", "library"] as const).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
              className="relative h-8 rounded-full text-[12px] font-sans font-medium transition-colors"
              style={{
                color: isActive ? "rgb(245 245 245)" : "rgba(245,245,245,0.55)",
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="studio-tab-bg"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
              )}
              <span className="relative">
                {t === "work" ? "My work" : "Library"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-full"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="rgba(245,245,245,0.4)" strokeWidth="1.8" />
          <path d="M20 20l-3-3" stroke="rgba(245,245,245,0.4)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search your work"
          className="flex-1 bg-transparent border-0 outline-none text-[13px] text-ink placeholder:text-ink-dim/60 font-sans"
        />
      </div>

      {/* Section header */}
      <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono mt-2">
        {tab === "work" ? "Drafts · Today" : "Templates"}
      </div>

      {/* Deliverable list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-1.5 px-1.5">
        <AnimatePresence initial={false}>
          {tab === "work" && deliverables.length === 0 && (
            <p className="text-[12px] text-ink-dim font-sans">
              No work yet. Use the prompt to draft something.
            </p>
          )}
          {tab === "library" && (
            <p className="text-[12px] text-ink-dim font-sans">
              WRKS templates · coming soon
            </p>
          )}
          {tab === "work" &&
            deliverables.map((d, i) => {
              const isActive = activeDeliverable === d.id;
              return (
                <motion.button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDeliverable(d.id)}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.05 * i,
                    duration: 0.4,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  whileHover={reduced ? undefined : { x: 2 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
                  style={{
                    background: isActive
                      ? "rgba(255,255,255,0.045)"
                      : "transparent",
                    border: isActive
                      ? `1px solid ${personality.accent}66`
                      : "1px solid transparent",
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="shrink-0 size-9 rounded-md overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${personality.accent}33, ${personality.accentDeep}44)`,
                    }}
                  >
                    {d.thumbnailIsImage && d.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.thumbnail}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="size-full flex items-center justify-center font-serif italic text-[11px]"
                        style={{ color: personality.accent }}
                      >
                        {d.title[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[12.5px] font-sans font-medium leading-tight truncate"
                      style={{ color: "rgb(245 245 245)" }}
                    >
                      {d.title}
                    </div>
                    <div className="text-[11px] text-ink-dim font-sans truncate mt-0.5">
                      {d.subtitle}
                    </div>
                  </div>
                </motion.button>
              );
            })}
        </AnimatePresence>
      </div>
    </aside>
  );
}

/* ============================================================
 * Top bar
 * ============================================================ */
function TopBar({
  agentName,
  personality,
}: {
  agentName: string;
  personality: Personality;
}) {
  return (
    <header
      className="relative flex items-center justify-between px-6 sm:px-10 py-4 shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="relative size-2.5 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #6366f1 100%)",
            boxShadow: "0 0 10px rgba(165,180,252,0.5)",
          }}
        />
        <span className="font-serif text-[15px] tracking-tight text-ink">
          WRKS<span className="text-ink-muted"> Studio</span>
        </span>
        <span
          className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] tracking-[0.18em] uppercase font-mono"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "rgba(245,245,245,0.55)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          Beta
        </span>
      </div>
      <div className="flex items-center gap-3 text-ink-muted">
        <button
          type="button"
          className="text-[12px] font-sans hover:text-ink transition-colors"
        >
          Docs
        </button>
        <button
          type="button"
          className="text-[12px] font-sans hover:text-ink transition-colors"
        >
          Connect
        </button>
        <div
          className="size-8 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          }}
          aria-label={`${agentName} avatar`}
        />
      </div>
    </header>
  );
}

/* ============================================================
 * Prompt input — the hero element
 * ============================================================ */
function PromptInput({
  personality,
  agentName,
  voiceName,
  value,
  onChange,
  onKeyDown,
  onSubmit,
  submitting,
  inputRef,
  activeDeliverable,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  voiceName: string;
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  submitting: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  activeDeliverable: StudioDeliverable | null;
  reduced: boolean;
}) {
  const placeholder = activeDeliverable
    ? `Refine your ${activeDeliverable.title.toLowerCase()}…`
    : `Ask ${agentName} to make or change anything…`;

  const canSubmit = value.trim().length > 0 && !submitting;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative w-full"
    >
      {/* Glow border */}
      <div
        aria-hidden
        className="absolute -inset-px rounded-[20px] pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${personality.accent}55 0%, ${personality.accentDeep}33 60%, transparent 100%)`,
          filter: "blur(12px)",
          opacity: 0.6,
        }}
      />
      <div
        className="relative rounded-[20px] backdrop-blur-sm"
        style={{
          background: "rgba(20,20,26,0.7)",
          border: `1px solid ${personality.accent}33`,
        }}
      >
        {/* Active deliverable chip */}
        {activeDeliverable && (
          <div
            className="flex items-center gap-2 px-4 pt-3 pb-1 text-[11px] tracking-[0.18em] uppercase font-mono"
            style={{ color: personality.accent }}
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: personality.accent }}
              aria-hidden
            />
            <span>Refining · {activeDeliverable.title}</span>
          </div>
        )}

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={3}
          disabled={submitting}
          aria-label="Talk to your agent"
          className="w-full bg-transparent border-0 outline-none resize-none px-5 pt-4 pb-2 text-[15px] sm:text-base text-ink font-sans placeholder:text-ink-dim/55 leading-relaxed disabled:opacity-50"
          style={{ caretColor: personality.accent }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1.5">
            <ToolbarButton title="Add context">
              <PlusIcon />
            </ToolbarButton>
            <ToolbarButton title="Voice input (coming soon)" disabled>
              <MicIcon />
            </ToolbarButton>
            <div
              className="ml-1 px-3 h-8 rounded-full inline-flex items-center gap-2 text-[12px] font-sans"
              style={{
                background: "rgba(255,255,255,0.03)",
                color: "rgba(245,245,245,0.7)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: personality.accent }}
                aria-hidden
              />
              {voiceName} <span className="text-ink-dim">·</span>{" "}
              {personality.name}
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-label="Send"
            className="size-9 rounded-full inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
            style={{
              background: canSubmit
                ? `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`
                : "rgba(255,255,255,0.06)",
              boxShadow: canSubmit ? `0 6px 16px -6px ${personality.glow}` : "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 19V5M5 12l7-7 7 7"
                stroke={canSubmit ? "white" : "rgba(255,255,255,0.5)"}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ToolbarButton({
  children,
  title,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      className="size-8 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white/[0.04] transition-colors disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
