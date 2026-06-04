"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useStudio, type DeliverableKind } from "@/lib/studio-context";
import { PersonalityIcon } from "@/components/personality-icon";
import type { Personality } from "@/lib/personalities";
import type { StoredWowPayload } from "@/lib/studio-context";
import {
  addPage,
  setActivePage,
  type Site,
} from "@/lib/site-model";
import { SiteCanvas } from "@/components/site-canvas";
import {
  FacebookAdInFeed,
  InstagramMini,
  IPhoneFrame,
  LinkedInMini,
  XMini,
} from "@/components/wow-mockups";

// The /studio main page is now just the deliverable canvas. The right
// inspector (orb, chat, composer, voice session) lives in the layout
// so it persists across all /studio/* routes. All shared state (active
// deliverable, stored payload, flash flags) comes via useStudio().

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

export default function StudioPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const {
    personality,
    agentName,
    stored,
    activeId,
    setActiveId,
    flashFields,
    thinking,
    site,
    setSite,
  } = useStudio();

  const accent = personality.accent;
  const accentDeep = personality.accentDeep;
  const glow = personality.glow;

  return (
    <main className="size-full flex flex-col overflow-hidden">
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
                  background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                  border: isActive
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid transparent",
                  color: isActive
                    ? "rgba(245,245,247,1)"
                    : "rgba(245,245,247,0.65)",
                }}
              >
                <span
                  style={{ color: isActive ? accent : "rgba(245,245,247,0.6)" }}
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
            className="h-11 px-[18px] rounded-lg text-[15px] font-medium transition-colors hover:bg-white/[0.05]"
            style={{
              color: "rgba(245,245,247,0.82)",
              border: "1px solid rgba(255,255,255,0.08)",
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

      {/* Title strip */}
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
        <div className="relative min-h-full flex items-center justify-center px-4 py-8">
          {stored ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={
                  reduced ? false : { opacity: 0, y: 16, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduced ? undefined : { opacity: 0, y: -10, filter: "blur(6px)" }
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
                  site={site}
                  setSite={setSite}
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

function ActiveDeliverable({
  kind,
  personality,
  agentName,
  stored,
  flashFields,
  site,
  setSite,
}: {
  kind: DeliverableKind;
  personality: Personality;
  agentName: string;
  stored: StoredWowPayload;
  flashFields: Set<string>;
  site: Site | null;
  setSite: (s: Site) => void;
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
    if (!site) {
      return (
        <div
          className="text-[13px] tracking-[0.22em] uppercase"
          style={{
            color: "rgba(245,245,247,0.4)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Building site…
        </div>
      );
    }
    return (
      <div style={flashStyle("landing", "16px")}>
        <SiteCanvas
          site={site}
          personality={personality}
          onPickPage={(pageId) => setSite(setActivePage(site, pageId))}
          onAddPage={() => {
            const label = `Page ${site.pages.length + 1}`;
            setSite(addPage(site, label));
          }}
        />
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
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
