"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DarkVeil from "@/components/dark-veil";

// /studio — daily-driver dashboard.
//
// 2026-06-30 redesign per user direction + dashboard UX research:
// progressive disclosure (state at a glance, action affordances on
// demand), F-pattern reading (priority top-left), AI-native shape
// (the dashboard tells you what's happening, doesn't ask you to
// build it). Three vertical zones:
//
//   1. Hero header — "What's next, {agentName}?" + one-line status
//      pulled from brand_state + deliverable counts.
//   2. Recent work feed — last 10 deliverables (drafts + published)
//      ordered by updated_at. Empty state for first-time users says
//      brand setup is complete and points at the pillar cards.
//   3. Pillar cards — Sites + Copywriting, ALWAYS both visible
//      (per user 2026-06-30: "the user will see both options no
//      matter if they choose 1 or two"). active_pillars only adds
//      a subtle crystal-light comet on the preferred card; both
//      remain clickable + equal weight.
//
// PixelBlast bg stays (approved WRKS canon per
// `feedback_studio_bg_progression_rejected.md`).

type DeliverableRow = {
  id: string;
  kind: string;
  content: Record<string, unknown> | null;
  status: string;
  framework: string | null;
  created_at: string;
  updated_at: string;
};

type StudioHome = {
  profile: {
    id: string;
    brand_name: string | null;
    agent_name: string | null;
    business_type: string | null;
    primary_goal: string | null;
    active_pillars: string[] | null;
    voice_descriptor: string | null;
    offer_summary: string | null;
    audience_description: string | null;
    differentiator: string | null;
    existing_site_url: string | null;
    onboarding_completed_at: string | null;
  } | null;
  deliverables: DeliverableRow[];
  counts: { sites: number; copy: number };
};

export default function StudioPage() {
  const router = useRouter();
  const [state, setState] = useState<StudioHome | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/studio/home", {
          method: "GET",
          headers: { "content-type": "application/json" },
        });
        if (!res.ok) {
          if (!cancelled) setLoaded(true);
          return;
        }
        const json = (await res.json()) as StudioHome;
        if (cancelled) return;
        setState(json);
        setLoaded(true);
        // If the user hasn't completed onboarding, send them back to it.
        if (!json.profile) router.replace("/onboarding/voice");
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const agentName = state?.profile?.agent_name?.trim() || "there";
  const brandName = state?.profile?.brand_name?.trim() || null;
  const activePillars = state?.profile?.active_pillars ?? [];
  const sitesPreferred = activePillars.includes("sites");
  const copyPreferred = activePillars.includes("copy");
  const siteCount = state?.counts.sites ?? 0;
  const copyCount = state?.counts.copy ?? 0;
  const lastTouched = state?.deliverables[0]?.updated_at ?? null;

  const statusLine = useMemo(() => {
    if (!loaded) return "Loading your workspace…";
    if (!state?.profile) return "";
    const parts: string[] = [];
    if (brandName) parts.push(brandName);
    parts.push(`${siteCount} site${siteCount === 1 ? "" : "s"}`);
    parts.push(`${copyCount} draft${copyCount === 1 ? "" : "s"}`);
    if (lastTouched) parts.push(`last edit ${formatRelative(lastTouched)}`);
    else if (state.profile.onboarding_completed_at)
      parts.push("brand ready, nothing built yet");
    return parts.join(" · ");
  }, [
    loaded,
    state?.profile,
    brandName,
    siteCount,
    copyCount,
    lastTouched,
    state?.profile?.onboarding_completed_at,
  ]);

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      {/* DarkVeil — React Bits CPPN-noise WebGL bg. Slow speed + zero
          scanline/noise/warp = quiet ambient sweep. */}
      <div className="absolute inset-0">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.4}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>

      {/* Soft dark vignette so dashboard text reads cleanly over the
          bg without losing the atmospheric color bleed. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,10,12,0.25) 0%, rgba(10,10,12,0.65) 70%, rgba(10,10,12,0.85) 100%)",
        }}
      />

      <div className="relative z-10 size-full overflow-y-auto">
        <div
          className="mx-auto"
          style={{
            maxWidth: 1100,
            padding: "72px 40px 96px",
          }}
        >
          {/* Zone 1 — Hero header (centered per user 2026-06-30). */}
          <header
            className="flex flex-col items-center text-center"
            style={{ gap: 10 }}
          >
            <h1
              style={{
                fontSize: "clamp(1.875rem, 3.5vw, 3.25rem)",
                fontWeight: 600,
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                color: "rgba(248,247,252,0.97)",
                margin: 0,
              }}
            >
              What&apos;s next, {agentName}?
            </h1>
            {statusLine && (
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(245,240,230,0.5)",
                  letterSpacing: "-0.003em",
                  margin: 0,
                }}
              >
                {statusLine}
              </p>
            )}
          </header>

          {/* Zone 2 — Recent work feed */}
          <section style={{ marginTop: 48 }}>
            <RecentWorkFeed
              deliverables={state?.deliverables ?? []}
              loaded={loaded}
              hasProfile={!!state?.profile}
              onboardingCompletedAt={
                state?.profile?.onboarding_completed_at ?? null
              }
            />
          </section>

          {/* Zone 3 — Pillar cards (both always visible) */}
          <section
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: 18, marginTop: 36 }}
          >
            <PillarCard
              pillar="sites"
              count={siteCount}
              preferred={sitesPreferred}
              lastTouchedAt={
                state?.deliverables.find((d) =>
                  d.kind?.startsWith("site"),
                )?.updated_at ?? null
              }
            />
            <PillarCard
              pillar="copy"
              count={copyCount}
              preferred={copyPreferred}
              lastTouchedAt={
                state?.deliverables.find((d) =>
                  d.kind?.startsWith("copy"),
                )?.updated_at ?? null
              }
            />
          </section>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// RecentWorkFeed — Linear-style chronological list of recent
// drafts + agent activity. Empty state for first-time users
// acknowledges the brand setup + points to the pillar cards below.
// ============================================================
function RecentWorkFeed({
  deliverables,
  loaded,
  hasProfile,
  onboardingCompletedAt,
}: {
  deliverables: DeliverableRow[];
  loaded: boolean;
  hasProfile: boolean;
  onboardingCompletedAt: string | null;
}) {
  if (!loaded) {
    return (
      <p
        style={{
          fontSize: 13,
          color: "rgba(245,240,230,0.4)",
          letterSpacing: "-0.003em",
        }}
      >
        Loading…
      </p>
    );
  }

  if (deliverables.length === 0) {
    return (
      <div
        className="flex flex-col items-center text-center"
        style={{
          gap: 10,
          padding: "22px 22px 20px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.012)",
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: "rgba(245,240,230,0.85)",
            letterSpacing: "-0.003em",
            margin: 0,
          }}
        >
          {hasProfile
            ? "Your brand is set up. Pick a pillar below to start your first piece."
            : "Welcome — finish onboarding to start building."}
        </p>
        {onboardingCompletedAt && (
          <p
            style={{
              fontSize: 12.5,
              color: "rgba(245,240,230,0.4)",
              margin: 0,
            }}
          >
            Brand setup completed {formatRelative(onboardingCompletedAt)}.
          </p>
        )}
      </div>
    );
  }

  return (
    <ul
      className="flex flex-col"
      style={{
        gap: 1,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.012)",
        overflow: "hidden",
      }}
    >
      {deliverables.map((d, i) => {
        const isSite = d.kind?.startsWith("site");
        const pillar = isSite ? "Sites" : "Copy";
        const title = extractTitle(d.content) ?? d.kind;
        return (
          <li
            key={d.id}
            style={{
              padding: "14px 22px",
              borderTop:
                i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center" style={{ gap: 14 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(245,240,230,0.42)",
                  minWidth: 44,
                }}
              >
                {pillar}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: "rgba(245,240,230,0.92)",
                  letterSpacing: "-0.005em",
                }}
              >
                {title}
              </span>
            </div>
            <span
              style={{
                fontSize: 12.5,
                color: "rgba(245,240,230,0.42)",
                letterSpacing: "-0.003em",
              }}
            >
              {formatRelative(d.updated_at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ============================================================
// PillarCard — Sites or Copy entry point. Always visible. Preferred
// pillar gets a wrks-crystal-border-button rim (subtle comet) but
// both are equally clickable + equally weighted in the grid.
// ============================================================
function PillarCard({
  pillar,
  count,
  preferred,
  lastTouchedAt,
}: {
  pillar: "sites" | "copy";
  count: number;
  preferred: boolean;
  lastTouchedAt: string | null;
}) {
  const config =
    pillar === "sites"
      ? {
          name: "Sites",
          descriptor: "Landing pages, funnels, full websites — in your voice.",
          href: "/studio/sites",
          newHref: "/studio/sites?new=1",
          icon: SiteIcon,
          unit: count === 1 ? "site" : "sites",
        }
      : {
          name: "Copywriting",
          descriptor:
            "Emails, ads, social posts, page copy — written in your voice.",
          href: "/studio/copy",
          newHref: "/studio/copy?new=1",
          icon: CopyIcon,
          unit: count === 1 ? "draft" : "drafts",
        };

  const Icon = config.icon;

  return (
    <div
      className={`relative flex flex-col items-center text-center ${
        preferred ? "wrks-crystal-border-button" : ""
      }`}
      style={{
        gap: 16,
        padding: "26px 24px 24px",
        borderRadius: 16,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
        border: preferred ? "none" : "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <span
        aria-hidden
        className="grid place-items-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          color: "rgba(245,240,230,0.82)",
        }}
      >
        <Icon />
      </span>
      <div className="flex flex-col items-center" style={{ gap: 4 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "rgba(245,240,230,0.96)",
            margin: 0,
          }}
        >
          {config.name}
        </h2>
        <span
          style={{
            fontSize: 12.5,
            color: "rgba(245,240,230,0.5)",
            letterSpacing: "-0.003em",
          }}
        >
          {count} {config.unit}
          {lastTouchedAt && (
            <span style={{ color: "rgba(245,240,230,0.35)" }}>
              {" · "}
              {formatRelative(lastTouchedAt)}
            </span>
          )}
        </span>
      </div>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: "rgba(245,240,230,0.62)",
          letterSpacing: "-0.003em",
          maxWidth: "36ch",
          margin: 0,
        }}
      >
        {config.descriptor}
      </p>
      <div
        className="flex flex-wrap items-center justify-center"
        style={{ gap: 10, marginTop: 4 }}
      >
        <Link
          href={config.href}
          className="inline-flex items-center transition-colors duration-150"
          style={{
            padding: "9px 14px",
            gap: 8,
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "-0.003em",
            background: "rgba(245,240,230,0.92)",
            color: "rgba(10,10,12,0.95)",
            border: "1px solid rgba(245,240,230,0.92)",
          }}
        >
          Open workspace
          <span aria-hidden>→</span>
        </Link>
        <Link
          href={config.newHref}
          className="inline-flex items-center transition-colors duration-150"
          style={{
            padding: "9px 14px",
            gap: 6,
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "-0.003em",
            background: "transparent",
            color: "rgba(245,240,230,0.78)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>
            +
          </span>
          New {pillar === "sites" ? "site" : "draft"}
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// helpers
// ============================================================

function extractTitle(content: Record<string, unknown> | null): string | null {
  if (!content) return null;
  const c = content;
  const candidates = ["headline", "title", "name", "subject"];
  for (const key of candidates) {
    const v = c[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const text = c.text;
  if (typeof text === "string" && text.trim()) {
    return text.trim().slice(0, 80);
  }
  return null;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < 60_000) return "just now";
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function SiteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h14" />
      <path d="M4 12h14" />
      <path d="M4 18h9" />
    </svg>
  );
}
