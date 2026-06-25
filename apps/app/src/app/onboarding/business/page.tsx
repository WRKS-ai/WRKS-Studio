"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import BrandVoiceCard from "./_cards/brand-voice";
import BusinessTypeCard from "./_cards/business-type";
import PrimaryGoalCard from "./_cards/primary-goal";
import TrafficSourcesCard from "./_cards/traffic-sources";
import UrlIngestCard from "./_cards/url-ingest";
import UseCaseCard from "./_cards/use-case";
import StepperRail from "./_components/stepper-rail";

// /onboarding/business — single-page stepper with 6 picker cards.
// The user picks one card's answer, clicks Next, the card writes to
// brand_state via PATCH /api/onboarding/save, then the stepper advances.
// URL hash `#step=N` keeps the position deep-linkable + survives refresh.
//
// Layout: left rail with 6 step indicators (hairline circles + labels)
// + right pane with the active card centered vertically. Dark canvas,
// Geist typography. NO eyebrows, NO orbs, NO purple accent on chrome
// per the universal design rules.
//
// On mount: fetches the current user's brand_state row to hydrate the
// cards with anything URL ingest already extracted (so cards 2-5 open
// pre-filled when URL was pasted on card 1).
//
// Final card writes onboarding_completed_at + redirects to /studio.

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

const TOTAL_STEPS = STEPS.length;

export default function BusinessPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [brandState, setBrandState] = useState<BrandStateSnapshot>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);

  // Sync `step` with the URL hash on mount + when user navigates back/forward.
  useEffect(() => {
    const readHash = () => {
      const m = /[#&]step=(\d+)/.exec(window.location.hash);
      const parsed = m ? parseInt(m[1]!, 10) : NaN;
      if (Number.isFinite(parsed) && parsed >= 1 && parsed <= TOTAL_STEPS) {
        setStep(parsed);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  // Reflect step changes back to the hash so refresh / share keeps position.
  useEffect(() => {
    const expected = `#step=${step}`;
    if (window.location.hash !== expected) {
      history.replaceState(null, "", expected);
    }
  }, [step]);

  // Hydrate brand state from the server on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/save", {
          method: "GET",
          headers: { "content-type": "application/json" },
        });
        if (!res.ok) {
          if (!cancelled) setLoaded(true);
          return;
        }
        const json = (await res.json()) as {
          profile: BrandStateSnapshot | null;
        };
        if (cancelled) return;
        if (json.profile) {
          setBrandState({ ...EMPTY_STATE, ...json.profile });
        }
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completed = useMemo(() => {
    // Which steps the user has answered (drives stepper-rail check marks).
    return {
      1: !!brandState.existing_site_url,
      2: !!brandState.business_type,
      3: !!brandState.primary_goal,
      4: !!brandState.traffic_sources && brandState.traffic_sources.length > 0,
      5: !!brandState.voice_descriptor,
      6: !!brandState.active_pillars && brandState.active_pillars.length > 0,
    } as Record<number, boolean>;
  }, [brandState]);

  // Persist a card's answer + optimistically update the local cache so
  // subsequent cards open with the new value.
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
      if (step < TOTAL_STEPS) {
        setStep((s) => s + 1);
      } else {
        // Final card — mark onboarding complete + redirect.
        await persist({ onboarding_completed_at: new Date().toISOString() });
        router.push("/studio");
      }
    },
    [persist, step, router],
  );

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const skip = useCallback(() => {
    // Used by the URL ingest card — user has no site to share, just advance.
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [step]);

  const cardProps = { brandState, advance, goBack, loaded };

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "#0a0a0c", color: "#f5f0e6" }}
    >
      <div
        className="relative grid min-h-screen"
        style={{
          gridTemplateColumns: "minmax(260px, 300px) 1fr",
        }}
      >
        {/* Left rail — typographic, no background tint, blends with canvas.
            Single hairline border on the right edge separates it from the
            card pane without making it feel like a "panel". */}
        <aside
          className="relative"
          style={{
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <StepperRail
            steps={STEPS}
            currentStep={step}
            completed={completed}
            onSelect={(id) => setStep(id)}
          />
        </aside>

        {/* Right pane */}
        <section className="relative flex items-center justify-center px-10 sm:px-14 py-10">
          <div className="w-full max-w-[760px]">
            {step === 1 && <UrlIngestCard {...cardProps} onSkip={skip} setBrandState={setBrandState} />}
            {step === 2 && <BusinessTypeCard {...cardProps} />}
            {step === 3 && <PrimaryGoalCard {...cardProps} />}
            {step === 4 && <TrafficSourcesCard {...cardProps} />}
            {step === 5 && <BrandVoiceCard {...cardProps} />}
            {step === 6 && <UseCaseCard {...cardProps} />}
          </div>
        </section>
      </div>
    </main>
  );
}
