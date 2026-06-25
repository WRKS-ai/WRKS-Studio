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
  setSectionField,
  slugify,
  type Site,
} from "@/lib/site-model";
import { SiteCanvas } from "@/components/site-canvas";
import { CrystalButton } from "@/components/crystal-button";
import {
  FacebookAdInFeed,
  InstagramMini,
  IPhoneFrame,
  LinkedInMini,
  XMini,
} from "@/components/wow-mockups";

// /studio/library — the deliverable editor.
//
// Phase 1 moved this view here from /studio (which became the welcome
// canvas). Same components, same data, just a different route. Phase 5
// will fold this into the site-canvas/page-editor flow per master-plan §G.
//
// LAYOUT (left to right):
//   • Deliverable rail (208px) — vertical list of 5 deliverables, each a
//     first-class object with platform glyph + name + sync status dot.
//   • Canvas region — Mercury-style typographic header (eyebrow +
//     display title + thin meta line + inline status), then the
//     borderless canvas panel hosting the preview.

type DeliverableMeta = {
  id: DeliverableKind;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  dims: string;
};

const DELIVERABLES: DeliverableMeta[] = [
  { id: "landing", label: "Website", Icon: BrowserIcon, dims: "Hero · 1440 × 900" },
  { id: "instagram", label: "Instagram", Icon: CameraIcon, dims: "Feed · 1080 × 1080" },
  { id: "twitter", label: "X", Icon: XGlyphIcon, dims: "Post · 280 chars" },
  { id: "linkedin", label: "LinkedIn", Icon: WorkIcon, dims: "Update · 700 chars" },
  { id: "ad", label: "Facebook Ad", Icon: CampaignIcon, dims: "In-feed · 1200 × 628" },
];

export default function StudioLibraryPage() {
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

  return (
    <main className="size-full flex overflow-hidden">
      {/* ============================================================
          DELIVERABLE RAIL — vertical, inside the canvas region.
          ============================================================ */}
      <DeliverableRail
        items={DELIVERABLES}
        activeId={activeId}
        onPick={setActiveId}
      />

      {/* ============================================================
          CANVAS REGION
          ============================================================ */}
      <div
        className="flex-1 min-w-0 h-full flex flex-col"
        style={{ borderLeft: "1px solid rgba(255,255,255,0.04)" }}
      >
        {/* Mercury-style canvas header: eyebrow + display title + meta */}
        <CanvasHeader kind={activeId} thinking={thinking} />

        {/* Canvas panel — neutral chrome halo. The user's palette
            accent stays inside their actual site preview, not on the
            framing around it. */}
        <div className="flex-1 min-h-0 relative overflow-auto">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 55% 45% at 50% 32%, rgba(245,240,230,0.04), transparent 70%)",
            }}
          />
          <div className="relative min-h-full flex items-center justify-center px-6 sm:px-10 py-10">
            {stored ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  initial={
                    reduced ? false : { opacity: 0, y: 14, filter: "blur(8px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    reduced
                      ? undefined
                      : { opacity: 0, y: -8, filter: "blur(6px)" }
                  }
                  transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
                  className="w-full flex justify-center"
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
      </div>
    </main>
  );
}

/* ============================================================
 * DeliverableRail — vertical list of deliverables as first-class
 * objects. Each row: platform glyph + name + status dot. Active
 * row uses the same 1.5px accent left-rule as the sidebar nav,
 * so the rail reads as a continuation of the same navigation system.
 * ============================================================ */
function DeliverableRail({
  items,
  activeId,
  onPick,
}: {
  items: DeliverableMeta[];
  activeId: DeliverableKind;
  onPick: (id: DeliverableKind) => void;
}) {
  return (
    <aside
      className="shrink-0 h-full flex flex-col"
      style={{ width: 208, background: "#0d0d10" }}
    >
      {/* Section label */}
      <div
        className="px-4 pt-6 pb-3 uppercase"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.28em",
          color: "rgba(245,245,247,0.38)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        Deliverables
      </div>
      <nav className="flex flex-col">
        {items.map((it) => {
          const isActive = activeId === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onPick(it.id)}
              className="relative flex items-center gap-3 transition-colors text-left"
              style={{
                padding: "10px 16px",
                color: isActive
                  ? "rgba(245,245,247,1)"
                  : "rgba(245,245,247,0.66)",
              }}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0"
                  style={{
                    width: 1.5,
                    background: "rgba(245,240,230,0.7)",
                  }}
                />
              )}
              <span
                className="shrink-0"
                style={{
                  color: isActive
                    ? "rgba(245,245,247,0.94)"
                    : "rgba(245,245,247,0.5)",
                  transition: "color 180ms ease-out",
                }}
              >
                <it.Icon size={16} />
              </span>
              <span
                className="flex-1 truncate"
                style={{
                  fontSize: 13.5,
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: "-0.005em",
                  transition: "color 180ms ease-out",
                }}
              >
                {it.label}
              </span>
              {/* Status dot — quiet warm-cream when active, otherwise
                  the same near-white hairline as inactive icons. The
                  personality accent never appears in the nav chrome. */}
              <span
                aria-hidden
                className="block rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: isActive
                    ? "#f5f0e6"
                    : "rgba(245,245,247,0.18)",
                  boxShadow: isActive
                    ? "0 0 6px rgba(245,240,230,0.55)"
                    : "none",
                  transition:
                    "background 180ms ease-out, box-shadow 180ms ease-out",
                }}
              />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ============================================================
 * CanvasHeader — Mercury-style typographic block.
 *
 * Eyebrow (mono caps) + display title (Fraunces 28-34px weight 480)
 * + thin meta line (dims + inline sync state with tiny dot). The
 * action cluster (Preview / Share / Publish) sits on the right.
 * No tinted backgrounds, no chip pills, no border at the bottom —
 * the canvas panel's shadow does the separation.
 * ============================================================ */
function CanvasHeader({
  kind,
  thinking,
}: {
  kind: DeliverableKind;
  thinking: boolean;
}) {
  const meta = DELIVERABLES.find((d) => d.id === kind);
  return (
    <header
      className="shrink-0 flex items-end justify-between gap-8"
      style={{
        padding: "28px 32px 24px",
      }}
    >
      {/* Title block */}
      <div className="min-w-0">
        <div
          className="uppercase mb-2.5"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.28em",
            fontFamily: "var(--font-mono)",
            color: "rgba(245,245,247,0.38)",
            fontWeight: 500,
          }}
        >
          Now editing
        </div>
        <h2
          className="font-serif truncate"
          style={{
            fontSize: 30,
            fontWeight: 480,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            color: "rgba(245,245,247,0.97)",
          }}
        >
          {labelFor(kind)}
        </h2>
        <div
          className="mt-2 flex items-center gap-2.5"
          style={{
            fontSize: 12.5,
            color: "rgba(245,245,247,0.5)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em",
          }}
        >
          <span>{meta?.dims}</span>
          <span style={{ color: "rgba(245,245,247,0.22)" }}>·</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="block rounded-full"
              style={{
                width: 5,
                height: 5,
                background: thinking ? "#fbbf24" : "#f5f0e6",
                boxShadow: thinking
                  ? "0 0 6px #fbbf24"
                  : "0 0 6px rgba(245,240,230,0.55)",
              }}
            />
            {thinking ? "Refining" : "In sync"}
          </span>
          <span style={{ color: "rgba(245,245,247,0.22)" }}>·</span>
          <span>Saved · just now</span>
        </div>
      </div>

      {/* Actions — every button speaks the same crystal-light dark-glass
          language. No solid-color filled Publish. */}
      <div className="flex items-center gap-1.5 shrink-0">
        <CanvasAction label="Preview" />
        <CanvasAction label="Share" />
        <CrystalButton size="md" style={{ marginLeft: 6 }}>
          Publish
        </CrystalButton>
      </div>
    </header>
  );
}

function CanvasAction({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="transition-colors hover:bg-white/[0.04]"
      style={{
        padding: "0 14px",
        height: 36,
        borderRadius: 8,
        color: "rgba(245,245,247,0.75)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "-0.005em",
      }}
    >
      {label}
    </button>
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
        className="mt-8"
        style={{
          fontSize: "clamp(1.25rem,2vw,1.5rem)",
          color: "rgba(245,245,247,0.6)",
          letterSpacing: "-0.012em",
        }}
      >
        No work saved yet.
      </p>
      <div className="mt-6 inline-flex">
        <CrystalButton size="md" onClick={onContinue}>
          Back to onboarding
          <span aria-hidden>→</span>
        </CrystalButton>
      </div>
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
          className="uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.28em",
            color: "rgba(245,245,247,0.4)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Building site…
        </div>
      );
    }
    return (
      <div className="w-full" style={flashStyle("landing", "20px")}>
        <SiteCanvas
          site={site}
          personality={personality}
          onPickPage={(pageId) => setSite(setActivePage(site, pageId))}
          onAddPage={() => {
            const label = `Page ${site.pages.length + 1}`;
            setSite(addPage(site, label));
          }}
          onEditBrandName={(next) => setSite({ ...site, brandName: next })}
          onEditPageLabel={(pageId, label) => {
            const pages = site.pages.map((p) =>
              p.id === pageId ? { ...p, label, slug: slugify(label) } : p,
            );
            setSite({ ...site, pages });
          }}
          onEditSectionField={(pageId, sectionId, fieldPath, value) => {
            const result = setSectionField(
              site,
              pageId,
              sectionId,
              fieldPath,
              value,
            );
            if (result.ok) setSite(result.site);
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

/* ============================================================
 * Icons — kept inline so the page is self-contained.
 * ============================================================ */
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
