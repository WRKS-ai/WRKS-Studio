"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OnboardingFrame } from "@/components/onboarding-frame";
import BrandVoiceCard from "./_cards/brand-voice";
import BusinessTypeCard from "./_cards/business-type";
import PrimaryGoalCard from "./_cards/primary-goal";
import TrafficSourcesCard from "./_cards/traffic-sources";
import UrlIngestCard from "./_cards/url-ingest";
import UseCaseCard from "./_cards/use-case";
import StepperRail from "./_components/stepper-rail";

// /onboarding/business — single-page stepper with 6 picker cards.
//
// 2026-06-26 v5 layout:
// - Wraps in OnboardingFrame so the top chrome (mono "03 / 03" counter
//   + WRKS Studio wordmark + 1px hairline progress bar) matches the
//   voice + name pages exactly.
// - Below the chrome: LEFT vertical rail (the 6 internal cards) + RIGHT
//   centered card content. Rail spans most of the available page height
//   with 70px gap between steps and a connecting hairline running through
//   the icon circles — generous Vibiz-style composition.
// - URL hash `#step=N` keeps position deep-linkable (1-6).

export type BrandStateSnapshot = {
  id: string | null;
  brand_name: string | null;
  existing_site_url: string | null;
  business_type: string | null;
  primary_goal: string | null;
  traffic_sources: string[] | null;
  voice_descriptor: string | null;
  active_pillars: string[] | null;
  offer_summary: string | null;
  audience_description: string | null;
  differentiator: string | null;
  competitor_urls: string[] | null;
  voice_origin: string | null;
  onboarding_completed_at: string | null;
};

const EMPTY_STATE: BrandStateSnapshot = {
  id: null,
  brand_name: null,
  existing_site_url: null,
  business_type: null,
  primary_goal: null,
  traffic_sources: null,
  voice_descriptor: null,
  active_pillars: null,
  offer_summary: null,
  audience_description: null,
  differentiator: null,
  competitor_urls: null,
  voice_origin: null,
  onboarding_completed_at: null,
};

// Lucide-style inline SVG icons for each step indicator. Stroke-based,
// 1.6 weight, 16x16 in a 36px circle. Kept inline (no external icon
// dep) so the rail stays self-contained.
const Icon = {
  Site: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  ),
  Business: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M10 21v-6h4v6" />
    </svg>
  ),
  Goal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  Traffic: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="15 7 21 7 21 13" />
    </svg>
  ),
  Voice: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18V6a2 2 0 0 1 2-2h10l4 4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <line x1="7" y1="10" x2="15" y2="10" />
      <line x1="7" y1="14" x2="13" y2="14" />
    </svg>
  ),
  UseCase: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12.5 11 15.5 16 9.5" />
    </svg>
  ),
} as const;

const STEPS = [
  { id: 1, label: "Your site", icon: Icon.Site },
  { id: 2, label: "Business type", icon: Icon.Business },
  { id: 3, label: "Main goal", icon: Icon.Goal },
  { id: 4, label: "Traffic", icon: Icon.Traffic },
  { id: 5, label: "Brand voice", icon: Icon.Voice },
  { id: 6, label: "What WRKS does", icon: Icon.UseCase },
] as const;

const TOTAL_SUB_STEPS = STEPS.length;

export default function BusinessPage() {
  const router = useRouter();
  const [subStep, setSubStep] = useState<number>(1);
  const [brandState, setBrandState] = useState<BrandStateSnapshot>(EMPTY_STATE);

  useEffect(() => {
    const readHash = () => {
      const m = /[#&]step=(\d+)/.exec(window.location.hash);
      const parsed = m ? parseInt(m[1]!, 10) : NaN;
      if (
        Number.isFinite(parsed) &&
        parsed >= 1 &&
        parsed <= TOTAL_SUB_STEPS
      ) {
        setSubStep(parsed);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    const expected = `#step=${subStep}`;
    if (window.location.hash !== expected) {
      history.replaceState(null, "", expected);
    }
  }, [subStep]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/save", {
          method: "GET",
          headers: { "content-type": "application/json" },
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          profile: BrandStateSnapshot | null;
        };
        if (cancelled) return;
        if (json.profile) {
          setBrandState({ ...EMPTY_STATE, ...json.profile });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completed = useMemo(() => {
    return {
      1: !!brandState.existing_site_url,
      2: !!brandState.business_type,
      3: !!brandState.primary_goal,
      4: !!brandState.traffic_sources && brandState.traffic_sources.length > 0,
      5: !!brandState.voice_descriptor,
      6: !!brandState.active_pillars && brandState.active_pillars.length > 0,
    } as Record<number, boolean>;
  }, [brandState]);

  const persist = useCallback(
    async (patch: Partial<BrandStateSnapshot>) => {
      setBrandState((prev) => ({ ...prev, ...patch }));
      const res = await fetch("/api/onboarding/save", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Save failed (${res.status}): ${detail}`);
      }
    },
    [],
  );

  const advance = useCallback(
    async (patch: Partial<BrandStateSnapshot>) => {
      if (Object.keys(patch).length > 0) await persist(patch);
      if (subStep < TOTAL_SUB_STEPS) {
        setSubStep((s) => s + 1);
      } else {
        await persist({ onboarding_completed_at: new Date().toISOString() });
        router.push("/studio");
      }
    },
    [persist, subStep, router],
  );

  const goBack = useCallback(() => {
    if (subStep > 1) setSubStep((s) => s - 1);
  }, [subStep]);

  const skip = useCallback(() => {
    if (subStep < TOTAL_SUB_STEPS) setSubStep((s) => s + 1);
  }, [subStep]);

  const cardProps = { brandState, advance, goBack, loaded: true };

  return (
    <OnboardingFrame step={3} totalSteps={3}>
      <div
        className="relative flex flex-col lg:grid lg:grid-cols-[minmax(280px,340px)_1fr]"
        style={{ minHeight: "calc(100vh - 80px)" }}
      >
        {/* Left rail — hidden on mobile (OnboardingFrame chrome's top
            progress bar carries the global progress signal there).
            On lg+: full height, generous spacing, connecting hairlines. */}
        <aside
          className="hidden lg:block relative"
          style={{
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <StepperRail
            steps={STEPS}
            currentStep={subStep}
            completed={completed}
            onSelect={(id) => setSubStep(id)}
          />
        </aside>

        {/* Mobile-only inline sub-step indicator — small "04 / 06 · Traffic"
            row at the top of the right pane so users on mobile still know
            where they are inside the business flow. Hidden on lg+ where the
            sidebar rail carries the same info. */}
        <div className="lg:hidden flex items-center px-6 pt-6" style={{ gap: 10 }}>
          <span
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(245,240,230,0.42)",
            }}
          >
            {String(subStep).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </span>
          <span
            aria-hidden
            style={{
              width: 20,
              height: 1,
              background: "rgba(245,240,230,0.16)",
            }}
          />
          <span
            style={{
              fontSize: 12.5,
              color: "rgba(245,240,230,0.6)",
            }}
          >
            {STEPS[subStep - 1]?.label}
          </span>
        </div>

        {/* Right pane (or only pane on mobile) — centered card with proper
            breathing room. Padding tightens on mobile so cards aren't cramped. */}
        <section className="relative flex items-center justify-center px-6 sm:px-10 lg:px-14 py-10 lg:py-16">
          <div className="w-full max-w-[680px]">
            {subStep === 1 && (
              <UrlIngestCard
                {...cardProps}
                onSkip={skip}
                setBrandState={setBrandState}
              />
            )}
            {subStep === 2 && <BusinessTypeCard {...cardProps} />}
            {subStep === 3 && <PrimaryGoalCard {...cardProps} />}
            {subStep === 4 && <TrafficSourcesCard {...cardProps} />}
            {subStep === 5 && <BrandVoiceCard {...cardProps} />}
            {subStep === 6 && <UseCaseCard {...cardProps} />}
          </div>
        </section>
      </div>
    </OnboardingFrame>
  );
}
