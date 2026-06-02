"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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

// /studio v5 — ported from Google Stitch design (2026-06-03).
// One Iris orb top-right with last agent line in italic Fraunces. Lightbox
// canvas dominates the screen with the active deliverable as an art object.
// Gallery bar bottom + iconic HOLD-TO-TALK pill floating above it.
// Composer slides up modally; voice (ElevenLabs) wires in later.

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

const DELIVERABLE_TABS: {
  id: DeliverableKind;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
}[] = [
  { id: "landing", label: "Website", Icon: BrowserIcon },
  { id: "instagram", label: "Instagram", Icon: CameraIcon },
  { id: "twitter", label: "X", Icon: XIcon },
  { id: "linkedin", label: "LinkedIn", Icon: WorkIcon },
  { id: "ad", label: "Ad", Icon: CampaignIcon },
];

const SUGGESTIONS = [
  "Tighten the headline",
  "Sharper angle",
  "Make it 30% shorter",
];

export default function StudioPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [stored, setStored] = useState<StoredWowPayload | null>(null);

  const [activeId, setActiveId] = useState<DeliverableKind>("landing");
  const [agentMessage, setAgentMessage] = useState<string>("");
  const [composing, setComposing] = useState("");
  const [thinking, setThinking] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());

  const composerRef = useRef<HTMLTextAreaElement>(null);

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

  // Open composer on "/" key from anywhere; close on Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !composerOpen) {
        e.preventDefault();
        setComposerOpen(true);
        setTimeout(() => composerRef.current?.focus(), 30);
      } else if (e.key === "Escape" && composerOpen) {
        setComposerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composerOpen]);

  const personality = personalityId
    ? PERSONALITIES.find((p) => p.id === personalityId)!
    : null;
  const voice = voiceId ? VOICES.find((v) => v.id === voiceId)! : null;
  const brandName = stored?.deliverables.brandName ?? "Untitled";

  const onSubmit = useCallback(async () => {
    const message = composing.trim();
    if (!message || thinking) return;

    setComposing("");
    setComposerOpen(false);
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
        setAgentMessage(data.error);
      } else {
        setAgentMessage(data.reply);
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
      setAgentMessage(msg);
    } finally {
      setThinking(false);
    }
  }, [composing, thinking, personalityId, agentName, activeId, stored]);

  if (!personality || !voice) return null;

  const accent = personality.accent;
  const accentDeep = personality.accentDeep;
  const glow = personality.glow;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: "#09090b",
        color: "rgba(245,245,247,1)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ============================================================
          AMBIENT BACKGROUND — warm room-tone wash
          ============================================================ */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% 30%, ${accent}08, transparent 70%),
            radial-gradient(ellipse 50% 40% at 90% 20%, ${accent}12, transparent 60%)
          `,
        }}
      />

      {/* ============================================================
          BLOOM OVERLAY — voice-active edge glow (Apple Intelligence)
          ============================================================ */}
      <AnimatePresence>
        {(listening || thinking) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none z-10"
            aria-hidden
          >
            {/* Apple-bloom conic ring — full perimeter when speaking,
                bottom-edge mask when listening. Palette per brief. */}
            <div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(
                  from 0deg at 50% 50%,
                  #BC82F3 0%,
                  #F5B9EA 14%,
                  #8D9FFF 28%,
                  #FF6778 42%,
                  #FFBA71 56%,
                  #BC82F3 70%,
                  #F5B9EA 84%,
                  #8D9FFF 100%
                )`,
                opacity: 0.35,
                filter: "blur(80px)",
                mask: listening
                  ? "linear-gradient(to top, black 0%, transparent 35%)"
                  : "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 60%, black 95%)",
                WebkitMask: listening
                  ? "linear-gradient(to top, black 0%, transparent 35%)"
                  : "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 60%, black 95%)",
                animation: reduced
                  ? undefined
                  : "bloomSpin 18s linear infinite",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          TOP BAR — brand + project id + utilities
          ============================================================ */}
      <header
        className="absolute top-0 inset-x-0 z-40 px-10 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <h1
          className="text-[15px] font-semibold tracking-[0.08em] uppercase"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          WRKS<span style={{ color: "rgba(245,245,247,0.5)" }}> Studio</span>
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end leading-none">
            <span
              className="text-[11px] tracking-[0.15em] font-medium"
              style={{
                color: accent,
                fontFamily: "var(--font-mono)",
              }}
            >
              v.1.04 / ACTIVE
            </span>
            <span
              className="text-[9.5px] tracking-[0.22em] uppercase mt-1"
              style={{
                color: "rgba(245,245,247,0.35)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Project · {brandName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UtilButton title="History">
              <HistoryIcon />
            </UtilButton>
            <UtilButton title="Account">
              <AccountIcon />
            </UtilButton>
          </div>
        </div>
      </header>

      {/* ============================================================
          IRIS — agent presence (top-right, prominent)
          ============================================================ */}
      <div className="absolute top-24 right-10 z-30 max-w-sm flex flex-col items-end gap-5">
        {/* Orb */}
        <div className="relative w-[88px] h-[88px]">
          {/* Glow halo */}
          <motion.div
            aria-hidden
            className="absolute inset-[-30%] rounded-full"
            style={{
              background: `radial-gradient(circle at center, ${accent} 0%, ${accentDeep} 40%, transparent 70%)`,
              filter: "blur(20px)",
            }}
            animate={
              reduced
                ? { opacity: 0.7 }
                : thinking
                  ? { opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }
                  : { opacity: [0.55, 0.85, 0.55], scale: [1, 1.08, 1] }
            }
            transition={{
              duration: thinking ? 1.6 : 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Orb core — use PersonalityIcon at md for fidelity */}
          <div className="relative size-full grid place-items-center">
            <PersonalityIcon personality={personality} size="md" />
          </div>
        </div>

        {/* Agent line */}
        <AnimatePresence mode="wait">
          {agentMessage ? (
            <motion.div
              key={agentMessage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4 }}
              className="text-right"
            >
              <div
                className="text-[10px] tracking-[0.22em] uppercase mb-2"
                style={{
                  color: "rgba(245,245,247,0.45)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {agentName} ·{" "}
                <span style={{ color: accent }}>{personality.name}</span>
              </div>
              <p
                className="font-serif italic text-[17px] leading-[1.45] max-w-[34ch] ml-auto"
                style={{ color: `${accent}e6` }}
              >
                &ldquo;{agentMessage}&rdquo;
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-right"
            >
              <div
                className="text-[10px] tracking-[0.22em] uppercase mb-2"
                style={{
                  color: "rgba(245,245,247,0.4)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {agentName} ·{" "}
                <span style={{ color: accent }}>Listening</span>
              </div>
              <p
                className="font-serif italic text-[15px] leading-relaxed max-w-[28ch] ml-auto"
                style={{ color: "rgba(245,245,247,0.45)" }}
              >
                Press <kbd
                  className="px-1.5 py-0.5 rounded text-[11px] not-italic align-middle"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(245,245,247,0.7)",
                    fontFamily: "var(--font-mono)",
                  }}
                >/</kbd> to talk, or hold the button below.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================================
          LIGHTBOX CANVAS — the active deliverable as art object
          ============================================================ */}
      <main
        className="absolute inset-0 z-20 flex items-center justify-center px-12 pt-32 pb-48"
        style={{ pointerEvents: "none" }}
      >
        {stored ? (
          <div
            className="relative w-full max-w-[1180px] mx-auto rounded-2xl"
            style={{
              background:
                "linear-gradient(180deg, rgba(28,27,29,0.6) 0%, rgba(20,19,22,0.5) 100%)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 60px rgba(255,255,255,0.02), 0 40px 120px rgba(0,0,0,0.7)",
              padding: "56px 48px",
              pointerEvents: "auto",
            }}
          >
            {/* Top hairline catching "ceiling light" */}
            <div
              aria-hidden
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)",
              }}
            />
            {/* Bottom emerald reflection */}
            <div
              aria-hidden
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{
                background: `linear-gradient(to right, transparent, ${accent}33, transparent)`,
              }}
            />

            {/* Small status pill above the deliverable */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex">
              <div
                className="px-3 py-1 rounded-full text-[9.5px] tracking-[0.22em] uppercase backdrop-blur-md flex items-center gap-2"
                style={{
                  background: "rgba(9,9,11,0.85)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(245,245,247,0.55)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: accent,
                    boxShadow: `0 0 8px ${accent}`,
                  }}
                />
                <span>Now showing · {labelFor(activeId)}</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={
                  reduced ? false : { opacity: 0, y: 12, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduced
                    ? undefined
                    : { opacity: 0, y: -8, filter: "blur(6px)" }
                }
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                className="flex justify-center"
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
          </div>
        ) : (
          <div style={{ pointerEvents: "auto" }}>
            <EmptyCanvas
              personality={personality}
              onContinue={() => router.push("/onboarding/personality")}
            />
          </div>
        )}
      </main>

      {/* ============================================================
          BOTTOM SHELL — Talk pill + gallery bar
          ============================================================ */}
      <div className="absolute inset-x-0 bottom-0 z-40">
        {/* Talk pill — floats above the gallery bar */}
        <div className="absolute bottom-[124px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-auto">
          {/* Suggestion chips appear above the talk pill before first message */}
          {!agentMessage && !thinking && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center gap-2 mb-1"
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setComposing(s);
                    setComposerOpen(true);
                    setTimeout(() => composerRef.current?.focus(), 30);
                  }}
                  className="h-8 px-3.5 rounded-full text-[12px] transition-all hover:bg-white/[0.05]"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(245,245,247,0.7)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}

          <TalkPill
            accent={accent}
            glow={glow}
            thinking={thinking}
            listening={listening}
            onPressStart={() => setListening(true)}
            onPressEnd={() => {
              setListening(false);
              setComposerOpen(true);
              setTimeout(() => composerRef.current?.focus(), 30);
            }}
            reduced={!!reduced}
          />
          <div
            className="text-[10px] tracking-[0.22em] uppercase"
            style={{
              color: "rgba(245,245,247,0.35)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {thinking
              ? "Refining"
              : listening
                ? "Listening"
                : "Or press / to type"}
          </div>
        </div>

        {/* Gallery bar — 5 deliverables */}
        <nav
          className="relative flex justify-around items-center h-[104px] px-10 mx-auto"
          style={{
            maxWidth: "1440px",
            background:
              "linear-gradient(180deg, rgba(20,19,22,0.4) 0%, rgba(9,9,11,0.85) 100%)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            boxShadow: `0 -20px 50px ${accent}1f`,
            pointerEvents: "auto",
          }}
        >
          {DELIVERABLE_TABS.map((t) => {
            const isActive = activeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className="relative flex flex-col items-center justify-center gap-1.5 group transition-all duration-300"
                style={{
                  color: isActive ? accent : "rgba(245,245,247,0.45)",
                  filter: isActive
                    ? `drop-shadow(0 0 10px ${accent}aa)`
                    : "none",
                }}
              >
                <t.Icon size={22} />
                <span
                  className="text-[10px] tracking-[0.22em] uppercase font-medium"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {t.label}
                </span>
                <div
                  className="size-1 rounded-full transition-all"
                  style={{
                    background: isActive ? accent : "transparent",
                    boxShadow: isActive ? `0 0 6px ${accent}` : "none",
                  }}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* ============================================================
          COMPOSER OVERLAY — slides up when user clicks pill or types /
          ============================================================ */}
      <AnimatePresence>
        {composerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setComposerOpen(false)}
              className="absolute inset-0 z-50"
              style={{ background: "rgba(9,9,11,0.5)", backdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={reduced ? false : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduced ? undefined : { y: 40, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
              className="absolute bottom-[140px] left-1/2 -translate-x-1/2 z-50 w-[min(680px,calc(100%-48px))]"
            >
              <ComposerCard
                personality={personality}
                agentName={agentName}
                composing={composing}
                thinking={thinking}
                onComposingChange={setComposing}
                onSubmit={onSubmit}
                onClose={() => setComposerOpen(false)}
                composerRef={composerRef}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Local CSS for bloom spin animation */}
      <style jsx>{`
        @keyframes bloomSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function labelFor(kind: DeliverableKind) {
  switch (kind) {
    case "landing":
      return "Website";
    case "instagram":
      return "Instagram";
    case "twitter":
      return "X";
    case "linkedin":
      return "LinkedIn";
    case "ad":
      return "Facebook Ad";
  }
}

/* ============================================================
 * TALK PILL — hold-to-talk hero
 * ============================================================ */
function TalkPill({
  accent,
  glow,
  thinking,
  listening,
  onPressStart,
  onPressEnd,
  reduced,
}: {
  accent: string;
  glow: string;
  thinking: boolean;
  listening: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  reduced: boolean;
}) {
  const hot = listening || thinking;
  return (
    <motion.button
      type="button"
      onMouseDown={onPressStart}
      onMouseUp={onPressEnd}
      onMouseLeave={listening ? onPressEnd : undefined}
      onTouchStart={(e) => {
        e.preventDefault();
        onPressStart();
      }}
      onTouchEnd={onPressEnd}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      className="relative rounded-full inline-flex items-center justify-center gap-4 transition-all"
      style={{
        width: 268,
        height: 64,
        background:
          "linear-gradient(180deg, rgba(35,34,37,0.85) 0%, rgba(22,21,24,0.85) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: hot
          ? `1px solid ${accent}80`
          : "1px solid rgba(255,255,255,0.1)",
        boxShadow: hot
          ? `0 0 0 6px ${accent}1f, 0 16px 50px -8px ${glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 14px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <motion.span
        className="size-2.5 rounded-full"
        style={{
          background: accent,
          boxShadow: `0 0 12px ${accent}`,
        }}
        animate={
          reduced || !hot
            ? { opacity: 1 }
            : { opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }
        }
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <span
        className="text-[12px] tracking-[0.24em] uppercase font-medium"
        style={{
          color: hot ? accent : "rgba(245,245,247,0.85)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {thinking ? "Refining" : listening ? "Listening" : "Hold to Talk"}
      </span>
      <span
        style={{ color: hot ? accent : "rgba(245,245,247,0.6)" }}
        aria-hidden
      >
        <MicIcon />
      </span>
    </motion.button>
  );
}

/* ============================================================
 * COMPOSER CARD (modal overlay)
 * ============================================================ */
function ComposerCard({
  personality,
  agentName,
  composing,
  thinking,
  onComposingChange,
  onSubmit,
  onClose,
  composerRef,
}: {
  personality: Personality;
  agentName: string;
  composing: string;
  thinking: boolean;
  onComposingChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
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
      className="rounded-3xl relative"
      style={{
        background:
          "linear-gradient(180deg, rgba(35,34,37,0.95) 0%, rgba(22,21,24,0.95) 100%)",
        border: hasText
          ? `1px solid ${personality.accent}55`
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: hasText
          ? `0 24px 60px -12px ${personality.glow}, 0 0 0 1px ${personality.accent}22`
          : "0 24px 60px -12px rgba(0,0,0,0.7)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 size-7 rounded-full grid place-items-center hover:bg-white/[0.06] transition-colors"
        style={{ color: "rgba(245,245,247,0.5)" }}
        aria-label="Close"
      >
        <CloseIcon />
      </button>
      <textarea
        ref={composerRef}
        value={composing}
        onChange={(e) => onComposingChange(e.target.value)}
        onKeyDown={onKey}
        placeholder={`Tell ${agentName} what to change…`}
        disabled={thinking}
        rows={3}
        autoFocus
        className="w-full bg-transparent border-0 outline-none resize-none px-6 pt-6 pb-2 text-[16px] leading-relaxed placeholder:text-white/35 disabled:opacity-50"
        style={{
          color: "rgba(245,245,247,1)",
          caretColor: personality.accent,
          fontFamily: "var(--font-sans)",
          minHeight: "92px",
        }}
      />
      <div className="flex items-center justify-between px-4 pb-4">
        <span
          className="text-[10px] tracking-[0.22em] uppercase"
          style={{
            color: "rgba(245,245,247,0.4)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ↵ Send · Esc to close
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!hasText || thinking}
          className="h-10 px-5 rounded-full inline-flex items-center gap-2 text-[13px] font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-transform hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: hasText
              ? `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`
              : "rgba(255,255,255,0.06)",
            boxShadow: hasText
              ? `0 8px 24px -8px ${personality.glow}`
              : "none",
          }}
          aria-label="Send"
        >
          <span>Send</span>
          <ArrowUpIcon />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * EMPTY CANVAS
 * ============================================================ */
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
 * ACTIVE DELIVERABLE — picks the right device mockup
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
      <div className="w-full max-w-[900px]" style={flashStyle("landing", "16px")}>
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
 * Utility button (top-right cluster)
 * ============================================================ */
function UtilButton({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className="size-9 rounded-full grid place-items-center transition-all hover:bg-white/[0.06] hover:scale-95 active:scale-90"
      style={{ color: "rgba(245,245,247,0.5)" }}
    >
      {children}
    </button>
  );
}

/* ============================================================
 * Icons
 * ============================================================ */
function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function AccountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
function BrowserIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="6.5" r="0.7" fill="currentColor" />
      <circle cx="8.5" cy="6.5" r="0.7" fill="currentColor" />
    </svg>
  );
}
function CameraIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 7l1.5-2.5h5L16 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function XIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.97 6.817H1.68l7.73-8.835L1.25 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function WorkIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3 13h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function CampaignIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h3l8 4V5l-8 4H4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18 8a4 4 0 0 1 0 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
