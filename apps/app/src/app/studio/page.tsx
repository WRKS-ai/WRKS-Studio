"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StageBackdrop } from "@/components/stage-backdrop";
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

// /studio — the talk-to-build voice-first surface.
// Per design research (Pi.ai, ChatGPT 2025, Hume, Apple Siri):
// - Deliverable owns the canvas (artifact-first)
// - Agent is ambient: small breathing orb bottom-right + bottom-edge bloom
// - Voice/talk is the input (hold space, or click & hold the mic)
// - Live transcript as subtitle overlay, not chat panel
// - Apple palette + edge-bloom only during agent-active moments

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

type StripeItem = {
  id: DeliverableKind;
  title: string;
  thumbnail: string;
  isImage: boolean;
};

type ChatLine = {
  role: "user" | "agent";
  text: string;
};

export default function StudioPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [stored, setStored] = useState<StoredWowPayload | null>(null);

  const [activeId, setActiveId] = useState<DeliverableKind>("landing");
  const [talking, setTalking] = useState(false); // hold-to-talk is active
  const [composing, setComposing] = useState(""); // current typed/transcribed text
  const [thinking, setThinking] = useState(false); // waiting on /api/refine
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());

  const composingRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage on mount
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

  const stripe = useMemo<StripeItem[]>(() => {
    if (!stored) return [];
    const { deliverables: d, images: i } = stored;
    return [
      {
        id: "landing",
        title: "Landing page",
        thumbnail: i.heroLandscape,
        isImage: true,
      },
      {
        id: "instagram",
        title: "Instagram",
        thumbnail: i.instagramSquare,
        isImage: true,
      },
      {
        id: "twitter",
        title: "X / Twitter",
        thumbnail: "",
        isImage: false,
      },
      {
        id: "linkedin",
        title: "LinkedIn",
        thumbnail: "",
        isImage: false,
      },
      {
        id: "ad",
        title: "Paid ad",
        thumbnail: i.adHero,
        isImage: true,
      },
    ];
  }, [stored]);

  // Submit the composed message
  const onSubmit = useCallback(async () => {
    const message = composing.trim();
    if (!message || thinking) return;

    setChatLines((c) => [...c.slice(-3), { role: "user", text: message }]);
    setComposing("");
    setTalking(false);
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
        setChatLines((c) => [
          ...c.slice(-3),
          { role: "agent", text: data.error },
        ]);
      } else {
        setChatLines((c) => [
          ...c.slice(-3),
          { role: "agent", text: data.reply },
        ]);
        if (data.updated && stored) {
          // Track which fields changed for the visual flash
          const changed = new Set<string>();
          if (data.updated.landing) {
            for (const k of Object.keys(data.updated.landing)) {
              changed.add(`landing.${k}`);
            }
          }
          if (data.updated.social) {
            for (const k of Object.keys(data.updated.social)) {
              changed.add(`social.${k}`);
            }
          }
          if (data.updated.ad) {
            for (const k of Object.keys(data.updated.ad)) {
              changed.add(`ad.${k}`);
            }
          }
          setFlashFields(changed);
          // Clear the flash after 2 seconds
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
              social: {
                ...stored.deliverables.social,
                ...data.updated.social,
              },
              ad: { ...stored.deliverables.ad, ...data.updated.ad },
            },
          };
          setStored(merged);
          localStorage.setItem(STUDIO_KEY, JSON.stringify(merged));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setChatLines((c) => [...c.slice(-3), { role: "agent", text: msg }]);
    } finally {
      setThinking(false);
    }
  }, [composing, thinking, personalityId, agentName, activeId, stored]);

  // Keyboard: hold space to talk (anywhere on page, except typing in inputs)
  useEffect(() => {
    const isEditable = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isEditable(e.target) && !e.repeat) {
        e.preventDefault();
        setTalking(true);
        setTimeout(() => composingRef.current?.focus(), 50);
      }
      if (e.code === "Escape") {
        setTalking(false);
        setComposing("");
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isEditable(e.target)) {
        e.preventDefault();
        if (composing.trim()) {
          void onSubmit();
        } else {
          setTalking(false);
        }
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [composing, onSubmit]);

  if (!personality || !voice) return null;

  const agentActive = talking || thinking;
  const dimmed = agentActive;
  const activeDeliverableData = stored
    ? activeDeliverableContent(activeId, stored)
    : null;

  return (
    <main className="relative min-h-screen bg-canvas overflow-hidden">
      <StageBackdrop tint={personality.glow} />

      {/* ============== TOP BAR (dims when voice active) ============== */}
      <motion.header
        animate={{ opacity: dimmed ? 0.35 : 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-4"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="size-2.5 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #6366f1 100%)",
              boxShadow: "0 0 10px rgba(165,180,252,0.5)",
            }}
            aria-hidden
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
        <div className="flex items-center gap-4 text-[12px] font-sans text-ink-muted">
          <button className="hover:text-ink transition-colors">Connect</button>
          <button className="hover:text-ink transition-colors">Docs</button>
          <div
            className="size-8 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
            }}
            aria-label={`${agentName} avatar`}
          />
        </div>
      </motion.header>

      {/* ============== MAIN STAGE ============== */}
      <div className="relative flex">
        {/* Left thumbnail strip */}
        <DeliverableStripe
          items={stripe}
          activeId={activeId}
          accent={personality.accent}
          accentDeep={personality.accentDeep}
          dimmed={dimmed}
          onSelect={(id) => setActiveId(id)}
          reduced={!!reduced}
        />

        {/* Center stage — the active deliverable */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 sm:py-12 min-h-[calc(100vh-72px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduced ? undefined : { opacity: 0, y: -6, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              className="w-full flex items-center justify-center"
            >
              {activeDeliverableData ? (
                <ActiveDeliverable
                  kind={activeId}
                  personality={personality}
                  agentName={agentName}
                  stored={stored!}
                  flashFields={flashFields}
                />
              ) : (
                <EmptyState onContinue={() => router.push("/onboarding/personality")} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ============== AMBIENT ORB (bottom-right, breathing) ============== */}
      <AmbientOrb personality={personality} active={agentActive} reduced={!!reduced} />

      {/* ============== BOTTOM-EDGE BLOOM (Apple-style) ============== */}
      <EdgeBloom active={agentActive} reduced={!!reduced} />

      {/* ============== SUBTITLE BAR (bottom-center, voice input) ============== */}
      <SubtitleBar
        personality={personality}
        agentName={agentName}
        voiceName={voice.name}
        talking={talking}
        thinking={thinking}
        composing={composing}
        chatLines={chatLines}
        onComposingChange={setComposing}
        onStart={() => {
          setTalking(true);
          setTimeout(() => composingRef.current?.focus(), 50);
        }}
        onCancel={() => {
          setTalking(false);
          setComposing("");
        }}
        onSubmit={() => void onSubmit()}
        composingRef={composingRef}
        activeTitle={
          stripe.find((s) => s.id === activeId)?.title ?? "deliverable"
        }
        reduced={!!reduced}
      />
    </main>
  );
}

/* ============================================================
 * Active deliverable rendering
 * ============================================================ */
function activeDeliverableContent(
  kind: DeliverableKind,
  stored: StoredWowPayload,
): string {
  switch (kind) {
    case "landing":
      return stored.deliverables.landing.headline;
    case "instagram":
      return stored.deliverables.social.instagram;
    case "twitter":
      return stored.deliverables.social.twitter;
    case "linkedin":
      return stored.deliverables.social.linkedin;
    case "ad":
      return stored.deliverables.ad.headline;
  }
}

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

  if (kind === "landing") {
    return (
      <div
        className="w-full max-w-[920px]"
        style={{
          outline: isFlashing("landing")
            ? `2px solid ${personality.accent}`
            : "none",
          outlineOffset: "8px",
          transition: "outline 0.4s ease",
        }}
      >
        <MacBookFrame>
          <CompactLanding
            personality={personality}
            brandName={d.brandName}
            data={d.landing}
            heroImage={i.heroLandscape}
            featuredImages={i.featured}
          />
        </MacBookFrame>
      </div>
    );
  }

  if (kind === "instagram") {
    return (
      <div
        style={{
          outline: isFlashing("social.instagram")
            ? `2px solid ${personality.accent}`
            : "none",
          outlineOffset: "12px",
          transition: "outline 0.4s ease",
          borderRadius: "44px",
        }}
      >
        <IPhoneFrame width={320} shadowGlow={personality.glow}>
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
      <div
        style={{
          outline: isFlashing("social.twitter")
            ? `2px solid ${personality.accent}`
            : "none",
          outlineOffset: "12px",
          transition: "outline 0.4s ease",
          borderRadius: "44px",
        }}
      >
        <IPhoneFrame width={320} shadowGlow={personality.glow}>
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
      <div
        style={{
          outline: isFlashing("social.linkedin")
            ? `2px solid ${personality.accent}`
            : "none",
          outlineOffset: "12px",
          transition: "outline 0.4s ease",
          borderRadius: "44px",
        }}
      >
        <IPhoneFrame width={320} shadowGlow={personality.glow}>
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

  // ad
  return (
    <div
      style={{
        outline: isFlashing("ad")
          ? `2px solid ${personality.accent}`
          : "none",
        outlineOffset: "12px",
        transition: "outline 0.4s ease",
        borderRadius: "44px",
      }}
    >
      <IPhoneFrame width={340} shadowGlow={personality.glow}>
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

// Compact version of LandingPreview to fit inside MacBook
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
  featuredImages: string[];
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
        <div className="flex gap-5 text-[11px] uppercase tracking-[0.22em] font-mono text-[#827a6e]">
          <span>Index</span>
          <span>Studio</span>
          <span>Contact</span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.22em] font-mono text-[#827a6e]">
          Vol. 01
        </span>
      </div>

      <div className="px-12 py-16 text-left flex-1">
        <div className="text-[10px] tracking-[0.32em] uppercase font-mono text-[#827a6e] mb-8 flex items-center gap-3">
          <span
            className="inline-block h-px w-8"
            style={{ background: personality.accent }}
          />
          <span>Now showing</span>
        </div>
        <h1
          className="font-serif font-medium text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] text-[#0e0c08] max-w-[16ch]"
          style={{ letterSpacing: "-0.025em" }}
        >
          {data.headline}
        </h1>
        <p className="mt-8 font-serif italic text-[clamp(0.9375rem,1.3vw,1.125rem)] text-[#4a443c] max-w-[40ch]">
          {data.subhead}
        </p>
        <button
          className="mt-8 inline-flex items-center gap-2 text-[#0e0c08] font-serif border-b border-[#0e0c08] pb-1 text-[15px]"
          type="button"
        >
          <span>{data.primaryCta}</span>
          <span style={{ color: personality.accent }}>→</span>
        </button>
      </div>

      <div className="px-12 pb-12 grid grid-cols-3 gap-6">
        {data.valueBullets.slice(0, 3).map((bullet, i) => (
          <div key={i}>
            <div
              className="text-[10px] tracking-[0.32em] uppercase font-mono mb-2"
              style={{ color: personality.accent }}
            >
              0{i + 1}
            </div>
            <p className="font-serif text-[#0e0c08] text-[14px] leading-snug">
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

function EmptyState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="text-center max-w-md">
      <p className="font-serif text-[clamp(1.25rem,2vw,1.5rem)] text-ink-muted italic mb-4">
        No work saved yet.
      </p>
      <button
        onClick={onContinue}
        className="text-[12px] tracking-[0.22em] uppercase font-mono text-ink-dim hover:text-ink transition-colors underline"
      >
        Head back to onboarding →
      </button>
    </div>
  );
}

/* ============================================================
 * Left thumbnail strip — slim, ambient
 * ============================================================ */
function DeliverableStripe({
  items,
  activeId,
  accent,
  accentDeep,
  dimmed,
  onSelect,
  reduced,
}: {
  items: StripeItem[];
  activeId: DeliverableKind;
  accent: string;
  accentDeep: string;
  dimmed: boolean;
  onSelect: (id: DeliverableKind) => void;
  reduced: boolean;
}) {
  return (
    <motion.aside
      animate={{ opacity: dimmed ? 0.3 : 1 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 shrink-0 w-[88px] flex flex-col items-center gap-3 py-6"
    >
      {items.map((item, i) => {
        const isActive = activeId === item.id;
        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            whileHover={reduced ? undefined : { scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={item.title}
            className="relative group size-14 rounded-2xl overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
            style={{
              border: isActive
                ? `1.5px solid ${accent}`
                : "1px solid rgba(255,255,255,0.06)",
              boxShadow: isActive
                ? `0 8px 24px -8px ${accent}99, 0 0 0 4px ${accent}22`
                : undefined,
            }}
          >
            {item.isImage && item.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbnail}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="size-full flex items-center justify-center font-serif italic text-[18px]"
                style={{
                  background: `linear-gradient(135deg, ${accent}33, ${accentDeep}44)`,
                  color: accent,
                }}
              >
                {item.title[0]}
              </div>
            )}
            {/* Active indicator dot */}
            {isActive && (
              <span
                className="absolute -right-1 top-1/2 -translate-y-1/2 size-1.5 rounded-full"
                style={{ background: accent }}
                aria-hidden
              />
            )}
            {/* Tooltip */}
            <span
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] tracking-[0.18em] uppercase font-mono text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            >
              {item.title}
            </span>
          </motion.button>
        );
      })}
    </motion.aside>
  );
}

/* ============================================================
 * Ambient orb — bottom-right, breathing
 * ============================================================ */
function AmbientOrb({
  personality,
  active,
  reduced,
}: {
  personality: Personality;
  active: boolean;
  reduced: boolean;
}) {
  return (
    <motion.div
      animate={
        reduced
          ? undefined
          : active
            ? { scale: [1, 1.08, 1], opacity: 1 }
            : { scale: [1, 1.03, 1], opacity: 0.85 }
      }
      transition={{
        duration: active ? 1.6 : 3.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="fixed bottom-8 right-8 z-30 pointer-events-none"
    >
      <PersonalityIcon personality={personality} size="sm" />
    </motion.div>
  );
}

/* ============================================================
 * Apple-style edge bloom — bottom of screen when voice is active
 * ============================================================ */
function EdgeBloom({ active, reduced }: { active: boolean; reduced: boolean }) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.6 }}
      className="pointer-events-none fixed inset-0 z-10"
    >
      {/* Sharper inner glow */}
      <motion.div
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
        style={{
          background:
            "conic-gradient(from 0deg, #BC82F3, #F5B9EA, #8D9FFF, #AA6EEE, #FF6778, #FFBA71, #C686FF, #BC82F3)",
          filter: "blur(40px)",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 35%)",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 35%)",
          opacity: 0.6,
        }}
      />
      {/* Softer outer */}
      <motion.div
        animate={reduced ? undefined : { rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
        style={{
          background:
            "conic-gradient(from 180deg, #F5B9EA, #8D9FFF, #BC82F3, #FFBA71, #FF6778, #C686FF, #F5B9EA)",
          filter: "blur(80px)",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
          opacity: 0.5,
        }}
      />
    </motion.div>
  );
}

/* ============================================================
 * Subtitle bar — bottom-center, voice transcript + chat lines
 * ============================================================ */
function SubtitleBar({
  personality,
  agentName,
  voiceName,
  talking,
  thinking,
  composing,
  chatLines,
  onComposingChange,
  onStart,
  onCancel,
  onSubmit,
  composingRef,
  activeTitle,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  voiceName: string;
  talking: boolean;
  thinking: boolean;
  composing: string;
  chatLines: ChatLine[];
  onComposingChange: (v: string) => void;
  onStart: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  composingRef: React.RefObject<HTMLInputElement | null>;
  activeTitle: string;
  reduced: boolean;
}) {
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const latestAgent = chatLines
    .slice()
    .reverse()
    .find((l) => l.role === "agent");

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none flex flex-col items-center pb-8 gap-3">
      {/* Recent agent reply — fades in/out as subtitle */}
      <AnimatePresence>
        {latestAgent && !talking && (
          <motion.div
            key={latestAgent.text}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.5 }}
            className="max-w-[560px] text-center px-6"
          >
            <p className="font-serif italic text-[15px] text-ink-muted leading-snug">
              <span style={{ color: personality.accent }}>{agentName}:</span>{" "}
              {latestAgent.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The input bar — pill */}
      <motion.div
        layout
        className="pointer-events-auto"
        animate={{
          width: talking ? 720 : 280,
        }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        style={{ maxWidth: "calc(100vw - 32px)" }}
      >
        <div
          className="relative rounded-full backdrop-blur-md flex items-center"
          style={{
            background: "rgba(20,20,26,0.65)",
            border: `1px solid ${
              talking ? personality.accent : "rgba(255,255,255,0.08)"
            }`,
            boxShadow: talking
              ? `0 30px 60px -20px ${personality.glow}, 0 0 0 4px ${personality.accent}15`
              : "0 16px 32px -16px rgba(0,0,0,0.6)",
            padding: "8px",
            transition: "box-shadow 0.4s, border-color 0.4s",
          }}
        >
          {/* Left status label */}
          {!talking ? (
            <button
              type="button"
              onClick={onStart}
              className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] tracking-[0.18em] uppercase font-mono text-ink-muted hover:text-ink transition-colors flex-1 text-left"
            >
              <MicGlyph color={personality.accent} />
              <span>Hold to talk · or press space</span>
            </button>
          ) : (
            <>
              <span
                className="ml-3 mr-3 inline-flex items-center gap-1.5 shrink-0 text-[10px] tracking-[0.22em] uppercase font-mono"
                style={{ color: personality.accent }}
              >
                <PulseDot color={personality.accent} reduced={reduced} />
                {thinking ? "Thinking" : `Refining · ${activeTitle}`}
              </span>
              <input
                ref={composingRef}
                type="text"
                value={composing}
                onChange={(e) => onComposingChange(e.target.value)}
                onKeyDown={onKey}
                placeholder={`Tell ${agentName} what to change…`}
                aria-label="Talk to your agent"
                disabled={thinking}
                className="flex-1 bg-transparent border-0 outline-none text-[15px] text-ink font-sans placeholder:text-ink-dim/60 px-1 py-1.5 disabled:opacity-50"
                style={{ caretColor: personality.accent }}
                autoFocus
              />
              <button
                type="button"
                onClick={onCancel}
                aria-label="Cancel"
                className="shrink-0 size-8 rounded-full inline-flex items-center justify-center text-ink-dim hover:text-ink transition-colors"
              >
                <CloseGlyph />
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!composing.trim() || thinking}
                aria-label="Send"
                className="shrink-0 size-9 rounded-full inline-flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                style={{
                  background: composing.trim()
                    ? `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`
                    : "rgba(255,255,255,0.06)",
                  boxShadow: composing.trim()
                    ? `0 6px 16px -4px ${personality.glow}`
                    : undefined,
                }}
              >
                <ArrowUpGlyph
                  color={composing.trim() ? "white" : "rgba(255,255,255,0.4)"}
                />
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Tiny voice/personality hint when idle */}
      {!talking && (
        <p className="text-[10px] tracking-[0.22em] uppercase font-mono text-ink-dim">
          {voiceName} · {personality.name}
        </p>
      )}
    </div>
  );
}

function MicGlyph({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" stroke={color} strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function PulseDot({ color, reduced }: { color: string; reduced: boolean }) {
  return (
    <motion.span
      animate={reduced ? undefined : { opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      className="size-1.5 rounded-full"
      style={{ background: color }}
    />
  );
}
function ArrowUpGlyph({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M5 12l7-7 7 7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CloseGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M6 18L18 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
