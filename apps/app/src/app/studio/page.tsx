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

// /studio — three-column AI studio shell (Linear × Cursor × v0 × Lovable).
// LEFT 240px: workspace + deliverables nav.
// CENTER flex: metadata strip + tab strip + dotted-grid canvas + versions filmstrip.
// RIGHT 360px: agent chat with sticky composer (voice + text).
// FOOTER 28px: brand + saved state + agent status + ⌘K hint.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const STUDIO_KEY = "wrks-studio-deliverables";

// Stepped grey scale — never raw white, always alpha.
const BG_1 = "#08090A";
const BG_2 = "#0F1012";
const BG_3 = "#17181C";
const BG_4 = "#1E1F24";
const BORDER_1 = "rgba(255,255,255,0.04)";
const BORDER_2 = "rgba(255,255,255,0.06)";
const BORDER_3 = "rgba(255,255,255,0.08)";
const TEXT_1 = "rgba(245,245,245,1)";
const TEXT_2 = "rgba(245,245,245,0.7)";
const TEXT_3 = "rgba(245,245,245,0.55)";
const TEXT_4 = "rgba(245,245,245,0.4)";
const TEXT_5 = "rgba(245,245,245,0.28)";

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

type DeliverableMeta = {
  id: DeliverableKind;
  title: string;
  shortTitle: string;
  type: "Page" | "Post" | "Ad";
  status: "Draft";
  thumbnail: string;
  isImage: boolean;
};

type ChatLine = { role: "user" | "agent"; text: string; at: string };

const SUGGESTION_PROMPTS = [
  "Tighten the headline",
  "Make 30% shorter",
  "Try a sharper angle",
  "Write a launch email",
];

const TAB_KEYS = ["Preview", "Versions", "Brief", "Export"] as const;
type Tab = (typeof TAB_KEYS)[number];

export default function StudioPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [stored, setStored] = useState<StoredWowPayload | null>(null);

  const [activeId, setActiveId] = useState<DeliverableKind>("landing");
  const [tab, setTab] = useState<Tab>("Preview");
  const [composing, setComposing] = useState("");
  const [thinking, setThinking] = useState(false);
  const [talking, setTalking] = useState(false);
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const [savedAgo, setSavedAgo] = useState<string>("Just now");

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage
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

  const deliverableMetas = useMemo<DeliverableMeta[]>(() => {
    if (!stored) return [];
    const { deliverables: d, images: i } = stored;
    return [
      {
        id: "landing",
        title: "Landing page",
        shortTitle: "Landing",
        type: "Page",
        status: "Draft",
        thumbnail: i.heroLandscape,
        isImage: true,
      },
      {
        id: "instagram",
        title: "Instagram post",
        shortTitle: "Instagram",
        type: "Post",
        status: "Draft",
        thumbnail: i.instagramSquare,
        isImage: true,
      },
      {
        id: "twitter",
        title: "X / Twitter post",
        shortTitle: "Twitter",
        type: "Post",
        status: "Draft",
        thumbnail: "",
        isImage: false,
      },
      {
        id: "linkedin",
        title: "LinkedIn post",
        shortTitle: "LinkedIn",
        type: "Post",
        status: "Draft",
        thumbnail: "",
        isImage: false,
      },
      {
        id: "ad",
        title: "Paid ad",
        shortTitle: "Ad",
        type: "Ad",
        status: "Draft",
        thumbnail: i.adHero,
        isImage: true,
      },
    ];
  }, [stored]);

  const activeMeta = deliverableMetas.find((d) => d.id === activeId);
  const brandName = stored?.deliverables.brandName ?? "Untitled brand";

  // Submit refinement
  const onSubmit = useCallback(async () => {
    const message = composing.trim();
    if (!message || thinking) return;

    setChatLines((c) => [
      ...c,
      { role: "user", text: message, at: new Date().toISOString() },
    ]);
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
          ...c,
          { role: "agent", text: data.error, at: new Date().toISOString() },
        ]);
      } else {
        setChatLines((c) => [
          ...c,
          { role: "agent", text: data.reply, at: new Date().toISOString() },
        ]);
        if (data.updated && stored) {
          const changed = new Set<string>();
          if (data.updated.landing)
            for (const k of Object.keys(data.updated.landing))
              changed.add(`landing.${k}`);
          if (data.updated.social)
            for (const k of Object.keys(data.updated.social))
              changed.add(`social.${k}`);
          if (data.updated.ad)
            for (const k of Object.keys(data.updated.ad)) changed.add(`ad.${k}`);
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
          setSavedAgo("Just now");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setChatLines((c) => [
        ...c,
        { role: "agent", text: msg, at: new Date().toISOString() },
      ]);
    } finally {
      setThinking(false);
      setTimeout(() => composerRef.current?.focus(), 50);
    }
  }, [composing, thinking, personalityId, agentName, activeId, stored]);

  // Hold-space-to-talk (anywhere except inputs)
  useEffect(() => {
    const isEditable = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable);
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isEditable(e.target) && !e.repeat) {
        e.preventDefault();
        setTalking(true);
        setTimeout(() => composerRef.current?.focus(), 30);
      }
      if (e.code === "Escape" && talking) {
        setTalking(false);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isEditable(e.target)) {
        e.preventDefault();
        setTalking(false);
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [talking]);

  // Auto-scroll chat
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatLines.length, thinking]);

  // Saved-ago ticker
  useEffect(() => {
    if (!stored) return;
    const id = setInterval(() => {
      const ms = Date.now() - new Date(stored.createdAt).getTime();
      const s = Math.floor(ms / 1000);
      if (s < 60) setSavedAgo(`${s}s ago`);
      else if (s < 3600) setSavedAgo(`${Math.floor(s / 60)}m ago`);
      else setSavedAgo(`${Math.floor(s / 3600)}h ago`);
    }, 1000);
    return () => clearInterval(id);
  }, [stored]);

  if (!personality || !voice) return null;

  const agentActive = talking || thinking;

  return (
    <div
      className="fixed inset-0 grid"
      style={{
        background: BG_1,
        color: TEXT_1,
        gridTemplateColumns: "240px 1fr 360px",
        gridTemplateRows: "48px 1fr 28px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ========================================================
          TOP BAR (spans all 3 columns)
          ======================================================== */}
      <TopBar
        agentName={agentName}
        brandName={brandName}
        activeTitle={activeMeta?.title ?? "—"}
        personality={personality}
      />

      {/* ========================================================
          LEFT SIDEBAR
          ======================================================== */}
      <LeftSidebar
        personality={personality}
        brandName={brandName}
        deliverables={deliverableMetas}
        activeId={activeId}
        onSelect={(id) => setActiveId(id)}
      />

      {/* ========================================================
          CENTER STAGE
          ======================================================== */}
      <CenterStage
        personality={personality}
        agentName={agentName}
        activeMeta={activeMeta ?? null}
        stored={stored}
        flashFields={flashFields}
        tab={tab}
        onTabChange={setTab}
        reduced={!!reduced}
      />

      {/* ========================================================
          RIGHT AGENT PANEL
          ======================================================== */}
      <AgentPanel
        personality={personality}
        agentName={agentName}
        voiceName={voice.name}
        composing={composing}
        thinking={thinking}
        talking={talking}
        chatLines={chatLines}
        onComposingChange={setComposing}
        onSubmit={() => void onSubmit()}
        onStartTalk={() => {
          setTalking(true);
          setTimeout(() => composerRef.current?.focus(), 30);
        }}
        onCancelTalk={() => setTalking(false)}
        composerRef={composerRef}
        transcriptRef={transcriptRef}
        suggestions={SUGGESTION_PROMPTS}
        onSuggestion={(s) => {
          setComposing(s);
          composerRef.current?.focus();
        }}
        reduced={!!reduced}
      />

      {/* ========================================================
          BOTTOM STATUS BAR
          ======================================================== */}
      <StatusBar
        brandName={brandName}
        savedAgo={savedAgo}
        agentName={agentName}
        agentActive={agentActive}
        personality={personality}
      />

      {/* Apple-style bottom-edge bloom — voice active state */}
      <EdgeBloom active={agentActive} reduced={!!reduced} />
    </div>
  );
}

/* ============================================================
 * TOP BAR
 * ============================================================ */
function TopBar({
  agentName,
  brandName,
  activeTitle,
  personality,
}: {
  agentName: string;
  brandName: string;
  activeTitle: string;
  personality: Personality;
}) {
  return (
    <header
      className="col-span-3 row-start-1 flex items-center justify-between px-5"
      style={{
        background: BG_2,
        borderBottom: `1px solid ${BORDER_2}`,
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #6366f1 100%)",
              boxShadow: "0 0 8px rgba(165,180,252,0.5)",
            }}
            aria-hidden
          />
          <span
            className="font-serif text-[14px] tracking-tight"
            style={{ color: TEXT_1 }}
          >
            WRKS
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-[0.18em]"
            style={{
              background: BG_4,
              color: TEXT_4,
              fontFamily: "var(--font-mono)",
            }}
          >
            Beta
          </span>
        </div>
        <ChevronRightIcon color={TEXT_5} />
        <span
          className="text-[12.5px] truncate"
          style={{ color: TEXT_3 }}
        >
          {brandName}
        </span>
        <ChevronRightIcon color={TEXT_5} />
        <span
          className="text-[12.5px] truncate font-medium"
          style={{ color: TEXT_1 }}
        >
          {activeTitle}
        </span>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5">
        <TopAction label="Share">
          <ShareIcon />
        </TopAction>
        <TopAction label="Versions">
          <ClockIcon />
        </TopAction>
        <TopAction label="Export">
          <DownloadIcon />
        </TopAction>
        <div className="w-px h-5 mx-1.5" style={{ background: BORDER_2 }} />
        <button
          type="button"
          className="h-7 px-2 rounded inline-flex items-center gap-1 text-[11px] hover:bg-white/[0.04] transition-colors"
          style={{ color: TEXT_3, fontFamily: "var(--font-mono)" }}
        >
          <span className="opacity-60">⌘</span>K
        </button>
        <button
          type="button"
          className="ml-1 h-7 px-3 rounded text-[12px] font-medium text-white transition-transform hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
            boxShadow: `0 4px 12px -4px ${personality.glow}`,
          }}
        >
          Publish
        </button>
        <div className="ml-2 size-7 rounded-full" aria-label={`${agentName} avatar`}
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          }}
        />
      </div>
    </header>
  );
}

function TopAction({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      className="size-7 rounded inline-flex items-center justify-center hover:bg-white/[0.04] transition-colors"
      style={{ color: TEXT_3 }}
    >
      {children}
    </button>
  );
}

/* ============================================================
 * LEFT SIDEBAR
 * ============================================================ */
function LeftSidebar({
  personality,
  brandName,
  deliverables,
  activeId,
  onSelect,
}: {
  personality: Personality;
  brandName: string;
  deliverables: DeliverableMeta[];
  activeId: DeliverableKind;
  onSelect: (id: DeliverableKind) => void;
}) {
  return (
    <aside
      className="row-start-2 col-start-1 flex flex-col overflow-hidden"
      style={{
        background: BG_2,
        borderRight: `1px solid ${BORDER_2}`,
      }}
    >
      {/* Brand picker / workspace header */}
      <div
        className="h-12 px-4 flex items-center gap-2.5 shrink-0"
        style={{ borderBottom: `1px solid ${BORDER_2}` }}
      >
        <div
          className="size-7 rounded-md shrink-0"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div
            className="text-[12.5px] font-medium leading-tight truncate"
            style={{ color: TEXT_1 }}
          >
            {brandName}
          </div>
          <div
            className="text-[10px] tracking-[0.18em] uppercase mt-0.5"
            style={{ color: TEXT_4, fontFamily: "var(--font-mono)" }}
          >
            Workspace
          </div>
        </div>
        <ChevronDownIcon color={TEXT_4} />
      </div>

      {/* Section header */}
      <PanelHeader label="Deliverables" count={deliverables.length} />

      {/* Items */}
      <div className="flex-1 overflow-y-auto py-1">
        {deliverables.map((d) => {
          const isActive = activeId === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              className="w-full px-2 group flex items-center gap-2.5 h-9 transition-colors"
              style={{
                background: isActive ? BG_4 : "transparent",
              }}
            >
              {/* Status dot */}
              <span
                className="size-1.5 rounded-full shrink-0 ml-1"
                style={{ background: personality.accent, opacity: isActive ? 1 : 0.5 }}
                aria-hidden
              />
              {/* Type icon (mini-thumbnail) */}
              <div
                className="size-5 rounded shrink-0 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${personality.accent}22, ${personality.accentDeep}33)`,
                }}
              >
                {d.isImage && d.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.thumbnail}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="size-full flex items-center justify-center text-[10px] font-serif italic"
                    style={{ color: personality.accent }}
                  >
                    {d.shortTitle[0]}
                  </div>
                )}
              </div>
              <span
                className="text-[12.5px] font-medium truncate flex-1 text-left"
                style={{ color: isActive ? TEXT_1 : TEXT_2 }}
              >
                {d.title}
              </span>
              <span
                className="text-[10px] tracking-[0.16em] uppercase shrink-0 pr-2"
                style={{ color: TEXT_5, fontFamily: "var(--font-mono)" }}
              >
                {d.type}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer (account row) */}
      <div
        className="h-12 px-3 flex items-center gap-2.5 shrink-0"
        style={{ borderTop: `1px solid ${BORDER_2}` }}
      >
        <div
          className="size-7 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium truncate" style={{ color: TEXT_1 }}>
            Your account
          </div>
          <div
            className="text-[10px] uppercase tracking-[0.18em] mt-0.5"
            style={{ color: TEXT_4, fontFamily: "var(--font-mono)" }}
          >
            Trial · 11d left
          </div>
        </div>
        <button
          type="button"
          className="size-6 rounded inline-flex items-center justify-center hover:bg-white/[0.04] transition-colors"
          style={{ color: TEXT_4 }}
          title="Settings"
        >
          <SettingsIcon />
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
 * CENTER STAGE
 * ============================================================ */
function CenterStage({
  personality,
  agentName,
  activeMeta,
  stored,
  flashFields,
  tab,
  onTabChange,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  activeMeta: DeliverableMeta | null;
  stored: StoredWowPayload | null;
  flashFields: Set<string>;
  tab: Tab;
  onTabChange: (t: Tab) => void;
  reduced: boolean;
}) {
  return (
    <section
      className="row-start-2 col-start-2 flex flex-col overflow-hidden relative"
      style={{ background: BG_1 }}
    >
      {/* Metadata strip */}
      {activeMeta && stored ? (
        <MetadataStrip
          activeMeta={activeMeta}
          personality={personality}
        />
      ) : (
        <div className="h-12 flex items-center px-4" style={{ borderBottom: `1px solid ${BORDER_2}` }}>
          <span className="text-[12px]" style={{ color: TEXT_4 }}>
            No deliverable selected
          </span>
        </div>
      )}

      {/* Tab strip */}
      <TabStrip tab={tab} onChange={onTabChange} personality={personality} />

      {/* Canvas with dotted grid */}
      <div
        className="flex-1 overflow-auto relative"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.045) 1px, transparent 0)`,
          backgroundSize: "16px 16px",
        }}
      >
        {/* Soft accent vignette */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 50% at center, ${personality.accent}11, transparent 70%)`,
          }}
        />
        <div className="relative min-h-full flex items-center justify-center p-8 pb-20">
          {activeMeta && stored ? (
            <AnimatePresence mode="wait">
              {tab === "Preview" && (
                <motion.div
                  key={activeMeta.id}
                  initial={reduced ? false : { opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduced ? undefined : { opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                  className="w-full max-w-[920px] flex justify-center"
                >
                  <ActiveDeliverable
                    kind={activeMeta.id}
                    personality={personality}
                    agentName={agentName}
                    stored={stored}
                    flashFields={flashFields}
                  />
                </motion.div>
              )}
              {tab === "Versions" && (
                <PlaceholderTab
                  key="versions"
                  title="Version history"
                  body="Every refinement saves a version. Browse, compare, and roll back as you go."
                  reduced={reduced}
                />
              )}
              {tab === "Brief" && stored && (
                <PlaceholderTab
                  key="brief"
                  title="Original brief"
                  body={`From intake — business, audience, differentiator that ${agentName} drafted from.`}
                  reduced={reduced}
                />
              )}
              {tab === "Export" && (
                <PlaceholderTab
                  key="export"
                  title="Export"
                  body="Download as image, copy as HTML, or push to your connected platforms."
                  reduced={reduced}
                />
              )}
            </AnimatePresence>
          ) : null}
        </div>

        {/* Versions filmstrip */}
        {activeMeta && stored && tab === "Preview" && (
          <VersionsStrip personality={personality} reduced={reduced} />
        )}
      </div>
    </section>
  );
}

function MetadataStrip({
  activeMeta,
  personality,
}: {
  activeMeta: DeliverableMeta;
  personality: Personality;
}) {
  return (
    <div
      className="h-12 px-4 flex items-center gap-3 shrink-0"
      style={{
        background: BG_2,
        borderBottom: `1px solid ${BORDER_2}`,
      }}
    >
      <span
        className="text-[13px] font-medium tracking-tight"
        style={{ color: TEXT_1 }}
      >
        {activeMeta.title}
      </span>
      <span
        className="px-2 py-0.5 rounded text-[10px] tracking-[0.18em] uppercase inline-flex items-center gap-1.5"
        style={{
          background: BG_4,
          color: TEXT_3,
          fontFamily: "var(--font-mono)",
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ background: personality.accent }}
        />
        {activeMeta.status}
      </span>
      <span
        className="text-[11px]"
        style={{ color: TEXT_4, fontFamily: "var(--font-mono)" }}
      >
        {activeMeta.type}
      </span>
      <span className="ml-auto flex items-center gap-3">
        <span
          className="text-[11px]"
          style={{ color: TEXT_4, fontFamily: "var(--font-mono)" }}
        >
          Last edited 2m ago
        </span>
      </span>
    </div>
  );
}

function TabStrip({
  tab,
  onChange,
  personality,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  personality: Personality;
}) {
  return (
    <div
      className="h-10 px-3 flex items-center gap-1 shrink-0"
      style={{
        background: BG_1,
        borderBottom: `1px solid ${BORDER_2}`,
      }}
    >
      {TAB_KEYS.map((k) => {
        const isActive = tab === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className="relative h-9 px-3.5 text-[12px] font-medium transition-colors"
            style={{
              color: isActive ? TEXT_1 : TEXT_3,
            }}
          >
            {k}
            {isActive && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
                style={{ background: personality.accent }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function VersionsStrip({
  personality,
  reduced,
}: {
  personality: Personality;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="absolute left-4 right-4 bottom-4 flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md"
      style={{
        background: `${BG_2}cc`,
        border: `1px solid ${BORDER_2}`,
      }}
    >
      <span
        className="text-[10px] tracking-[0.22em] uppercase shrink-0 mr-1"
        style={{ color: TEXT_4, fontFamily: "var(--font-mono)" }}
      >
        Versions
      </span>
      <div className="flex items-center gap-2 overflow-x-auto">
        <VersionPip personality={personality} label="v1" active />
        <span className="text-[10px]" style={{ color: TEXT_5 }}>
          ·
        </span>
        <span
          className="text-[10px] tracking-[0.18em] uppercase"
          style={{ color: TEXT_5, fontFamily: "var(--font-mono)" }}
        >
          New versions save automatically as you refine
        </span>
      </div>
    </motion.div>
  );
}

function VersionPip({
  personality,
  label,
  active,
}: {
  personality: Personality;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className="h-6 px-2 rounded inline-flex items-center gap-1.5 text-[11px]"
      style={{
        background: active ? BG_4 : BG_3,
        border: active
          ? `1px solid ${personality.accent}66`
          : `1px solid ${BORDER_2}`,
        color: TEXT_2,
        fontFamily: "var(--font-mono)",
      }}
    >
      <span
        className="size-1 rounded-full"
        style={{ background: active ? personality.accent : TEXT_5 }}
      />
      {label}
    </button>
  );
}

function PlaceholderTab({
  title,
  body,
  reduced,
}: {
  title: string;
  body: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="text-center max-w-md"
    >
      <div
        className="text-[10px] tracking-[0.28em] uppercase mb-3"
        style={{ color: TEXT_5, fontFamily: "var(--font-mono)" }}
      >
        Coming soon
      </div>
      <h2
        className="font-serif text-[clamp(1.5rem,2.4vw,2rem)] leading-tight mb-3"
        style={{ color: TEXT_1 }}
      >
        {title}
      </h2>
      <p className="font-serif italic text-[14px] leading-relaxed" style={{ color: TEXT_3 }}>
        {body}
      </p>
    </motion.div>
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

  const flashWrap = (path: string, child: React.ReactNode) => (
    <div
      style={{
        outline: isFlashing(path) ? `2px solid ${personality.accent}` : "none",
        outlineOffset: "10px",
        transition: "outline 0.4s ease",
        borderRadius: kind === "landing" ? "20px" : "44px",
      }}
    >
      {child}
    </div>
  );

  if (kind === "landing") {
    return flashWrap(
      "landing",
      <div className="w-full max-w-[920px]">
        <MacBookFrame>
          <CompactLanding
            personality={personality}
            brandName={d.brandName}
            data={d.landing}
            heroImage={i.heroLandscape}
          />
        </MacBookFrame>
      </div>,
    );
  }
  if (kind === "instagram") {
    return flashWrap(
      "social.instagram",
      <IPhoneFrame width={300} shadowGlow={personality.glow}>
        <InstagramMini
          handle={handleSlug}
          caption={d.social.instagram}
          image={i.instagramSquare}
          accent={personality.accent}
          accentDeep={personality.accentDeep}
        />
      </IPhoneFrame>,
    );
  }
  if (kind === "twitter") {
    return flashWrap(
      "social.twitter",
      <IPhoneFrame width={300} shadowGlow={personality.glow}>
        <XMini
          brandName={d.brandName}
          handle={`@${handleSlug}`}
          text={d.social.twitter}
          accent={personality.accent}
          accentDeep={personality.accentDeep}
        />
      </IPhoneFrame>,
    );
  }
  if (kind === "linkedin") {
    return flashWrap(
      "social.linkedin",
      <IPhoneFrame width={300} shadowGlow={personality.glow}>
        <LinkedInMini
          agentName={agentName}
          brandName={d.brandName}
          text={d.social.linkedin}
          accent={personality.accent}
          accentDeep={personality.accentDeep}
        />
      </IPhoneFrame>,
    );
  }
  return flashWrap(
    "ad",
    <IPhoneFrame width={320} shadowGlow={personality.glow}>
      <FacebookAdInFeed
        brandName={d.brandName}
        adData={d.ad}
        adImage={i.adHero}
        accent={personality.accent}
        accentDeep={personality.accentDeep}
      />
    </IPhoneFrame>,
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
        <img src={heroImage} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
    </div>
  );
}

/* ============================================================
 * RIGHT AGENT PANEL
 * ============================================================ */
function AgentPanel({
  personality,
  agentName,
  voiceName,
  composing,
  thinking,
  talking,
  chatLines,
  onComposingChange,
  onSubmit,
  onStartTalk,
  onCancelTalk,
  composerRef,
  transcriptRef,
  suggestions,
  onSuggestion,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  voiceName: string;
  composing: string;
  thinking: boolean;
  talking: boolean;
  chatLines: ChatLine[];
  onComposingChange: (v: string) => void;
  onSubmit: () => void;
  onStartTalk: () => void;
  onCancelTalk: () => void;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  transcriptRef: React.RefObject<HTMLDivElement | null>;
  suggestions: string[];
  onSuggestion: (s: string) => void;
  reduced: boolean;
}) {
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancelTalk();
    }
  };

  return (
    <aside
      className="row-start-2 col-start-3 grid overflow-hidden"
      style={{
        background: BG_2,
        borderLeft: `1px solid ${BORDER_2}`,
        gridTemplateRows: "auto 1fr auto",
      }}
    >
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${BORDER_2}` }}>
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={
              reduced
                ? undefined
                : { scale: [1, talking || thinking ? 1.08 : 1.03, 1] }
            }
            transition={{
              duration: talking || thinking ? 1.6 : 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <PersonalityIcon personality={personality} size="xs" />
          </motion.div>
          <div className="min-w-0">
            <div
              className="text-[12.5px] font-medium leading-tight truncate"
              style={{ color: TEXT_1 }}
            >
              {agentName}
            </div>
            <div
              className="text-[10px] tracking-[0.18em] uppercase mt-0.5"
              style={{ color: TEXT_4, fontFamily: "var(--font-mono)" }}
            >
              {personality.name} · {voiceName}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="size-7 rounded inline-flex items-center justify-center hover:bg-white/[0.04] transition-colors"
          style={{ color: TEXT_3 }}
          title="New thread"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Transcript */}
      <div
        ref={transcriptRef}
        className="overflow-y-auto px-4 py-4 flex flex-col gap-4"
      >
        {chatLines.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-12">
            <PersonalityIcon personality={personality} size="sm" />
            <p
              className="mt-5 font-serif italic text-[clamp(1rem,1.2vw,1.125rem)] max-w-[24ch]"
              style={{ color: TEXT_3 }}
            >
              Tell {agentName} what to make or change.
            </p>
            <p
              className="mt-2 text-[10px] tracking-[0.22em] uppercase"
              style={{ color: TEXT_5, fontFamily: "var(--font-mono)" }}
            >
              Hold space to talk · type to write
            </p>
          </div>
        ) : (
          chatLines.map((line, i) => (
            <motion.div
              key={i}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`flex gap-2.5 ${line.role === "user" ? "" : "items-start"}`}
            >
              {line.role === "agent" && (
                <div className="shrink-0 mt-0.5">
                  <PersonalityIcon personality={personality} size="xs" />
                </div>
              )}
              <div
                className={`text-[13px] leading-relaxed ${line.role === "user" ? "ml-auto px-3 py-1.5 rounded-xl max-w-[80%]" : "flex-1"}`}
                style={
                  line.role === "user"
                    ? {
                        background: BG_4,
                        color: TEXT_1,
                      }
                    : {
                        color: TEXT_2,
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                      }
                }
              >
                {line.text}
              </div>
            </motion.div>
          ))
        )}
        {thinking && (
          <div className="flex items-center gap-2.5">
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

      {/* Composer */}
      <div
        className="shrink-0 p-3 flex flex-col gap-2"
        style={{ borderTop: `1px solid ${BORDER_2}`, background: BG_2 }}
      >
        {/* Suggestion pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestion(s)}
              className="shrink-0 h-7 px-3 rounded-full text-[11.5px] transition-colors hover:bg-white/[0.04]"
              style={{
                border: `1px solid ${BORDER_2}`,
                color: TEXT_3,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            background: BG_3,
            border: `1px solid ${talking ? personality.accent : BORDER_2}`,
            boxShadow: talking ? `0 0 0 3px ${personality.accent}22` : undefined,
            transition: "all 0.3s ease",
          }}
        >
          {talking && (
            <div
              className="px-3 pt-2 pb-1 text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5"
              style={{ color: personality.accent, fontFamily: "var(--font-mono)" }}
            >
              <PulseDot color={personality.accent} reduced={reduced} />
              <span>Talking</span>
            </div>
          )}
          <textarea
            ref={composerRef}
            value={composing}
            onChange={(e) => onComposingChange(e.target.value)}
            onKeyDown={onKey}
            onFocus={onStartTalk}
            placeholder={`Ask ${agentName} anything…`}
            rows={2}
            disabled={thinking}
            className="w-full bg-transparent border-0 outline-none resize-none px-3 pt-3 pb-2 text-[13.5px] leading-relaxed disabled:opacity-50"
            style={{
              color: TEXT_1,
              caretColor: personality.accent,
              fontFamily: "var(--font-sans)",
            }}
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-0.5">
              <ComposerIconButton title="Attach">
                <PlusIcon />
              </ComposerIconButton>
              <ComposerIconButton title="Voice (hold space)">
                <MicIcon />
              </ComposerIconButton>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] tracking-[0.18em] uppercase"
                style={{ color: TEXT_5, fontFamily: "var(--font-mono)" }}
              >
                ↵ to send
              </span>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!composing.trim() || thinking}
                aria-label="Send"
                className="size-7 rounded-md inline-flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: composing.trim()
                    ? `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`
                    : BG_4,
                }}
              >
                <ArrowUpIcon
                  color={composing.trim() ? "white" : TEXT_4}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PanelHeader({
  label,
  count,
  action,
}: {
  label: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="h-9 px-3 flex items-center justify-between shrink-0"
      style={{
        background: BG_2,
        borderBottom: `1px solid ${BORDER_2}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] tracking-[0.22em] uppercase"
          style={{ color: TEXT_4, fontFamily: "var(--font-mono)" }}
        >
          {label}
        </span>
        {typeof count === "number" && (
          <span
            className="text-[10px] tabular-nums"
            style={{ color: TEXT_5, fontFamily: "var(--font-mono)" }}
          >
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

function ComposerIconButton({
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
      className="size-7 rounded inline-flex items-center justify-center hover:bg-white/[0.05] transition-colors"
      style={{ color: TEXT_4 }}
    >
      {children}
    </button>
  );
}

/* ============================================================
 * BOTTOM STATUS BAR
 * ============================================================ */
function StatusBar({
  brandName,
  savedAgo,
  agentName,
  agentActive,
  personality,
}: {
  brandName: string;
  savedAgo: string;
  agentName: string;
  agentActive: boolean;
  personality: Personality;
}) {
  return (
    <footer
      className="col-span-3 row-start-3 flex items-center justify-between px-4 text-[10.5px]"
      style={{
        background: BG_2,
        borderTop: `1px solid ${BORDER_2}`,
        color: TEXT_4,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full"
            style={{ background: personality.accent }}
          />
          <span style={{ color: TEXT_3 }}>{brandName}</span>
        </span>
        <span style={{ color: TEXT_5 }}>·</span>
        <span>Saved {savedAgo}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <motion.span
            animate={
              agentActive
                ? { opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }
                : { opacity: 0.6 }
            }
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="size-1.5 rounded-full"
            style={{ background: agentActive ? personality.accent : TEXT_4 }}
          />
          <span>{agentActive ? "Agent active" : "Idle"}</span>
        </span>
        <span style={{ color: TEXT_5 }}>·</span>
        <span>{agentName}</span>
        <span style={{ color: TEXT_5 }}>·</span>
        <span className="inline-flex items-center gap-1">
          <span style={{ opacity: 0.6 }}>⌘</span>K
          <span className="ml-0.5">Command</span>
        </span>
      </div>
    </footer>
  );
}

/* ============================================================
 * BLOOM
 * ============================================================ */
function EdgeBloom({ active, reduced }: { active: boolean; reduced: boolean }) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 0.8 : 0 }}
      transition={{ duration: 0.6 }}
      className="pointer-events-none fixed inset-0 z-50"
    >
      <motion.div
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
        style={{
          background:
            "conic-gradient(from 0deg, #BC82F3, #F5B9EA, #8D9FFF, #AA6EEE, #FF6778, #FFBA71, #C686FF, #BC82F3)",
          filter: "blur(60px)",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 28%)",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 28%)",
          opacity: 0.55,
        }}
      />
    </motion.div>
  );
}

/* ============================================================
 * Inline icons
 * ============================================================ */
function ChevronRightIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronDownIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v13M6 11l6 6 6-6M5 21h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19 12a7 7 0 0 0-.07-1l2.04-1.6a1 1 0 0 0 .25-1.27l-1.95-3.38a1 1 0 0 0-1.22-.45L15.65 5a7.21 7.21 0 0 0-1.74-1L13.5 1.6a1 1 0 0 0-1-.85h-3a1 1 0 0 0-1 .85L8.09 4a7.21 7.21 0 0 0-1.74 1L3.95 4.3a1 1 0 0 0-1.22.45L.78 8.13a1 1 0 0 0 .25 1.27L3.07 11a7 7 0 0 0 0 2L1.03 14.6a1 1 0 0 0-.25 1.27l1.95 3.38a1 1 0 0 0 1.22.45L6.35 19a7.21 7.21 0 0 0 1.74 1l.41 2.4a1 1 0 0 0 1 .85h3a1 1 0 0 0 1-.85L13.91 20a7.21 7.21 0 0 0 1.74-1l2.4.7a1 1 0 0 0 1.22-.45l1.95-3.38a1 1 0 0 0-.25-1.27L18.93 13c.05-.33.07-.66.07-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ArrowUpIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
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
function PulseDot({ color, reduced }: { color: string; reduced: boolean }) {
  return (
    <motion.span
      animate={
        reduced ? undefined : { opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }
      }
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      className="size-1.5 rounded-full inline-block"
      style={{ background: color }}
    />
  );
}
