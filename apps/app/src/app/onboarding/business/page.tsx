"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OnboardingFrame } from "@/components/onboarding-frame";
import BrandVoiceCard from "./_cards/brand-voice";
import BusinessTypeCard from "./_cards/business-type";
import PrimaryGoalCard from "./_cards/primary-goal";
import TrafficSourcesCard from "./_cards/traffic-sources";
import UrlIngestCard from "./_cards/url-ingest";
import UseCaseCard from "./_cards/use-case";

// /onboarding/business — single-page stepper with 6 picker cards.
//
// 2026-06-26 layout redesign per user feedback ("redo the whole page
// with completely new and stunning design"):
// - Wraps in OnboardingFrame so the top chrome (mono step counter +
//   WRKS Studio wordmark + 1px hairline progress bar) matches the
//   voice + name pages exactly — consistent across the whole flow.
// - The step counter spans all 8 total onboarding steps (voice=1,
//   name=2, business cards = 3-8) so the OnboardingFrame progress bar
//   advances smoothly as the user moves through the business cards.
//   No separate sub-stepper — the top chrome IS the progress.
// - Left sidebar rail removed entirely. The active card is centered
//   in the page with generous top breathing room.
// - URL hash `#step=N` keeps position deep-linkable (1-6 internally).

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

const TOTAL_SUB_STEPS = 6;
// Voice (1) + Name (2) + Business cards (3-8) = 8 total.
const STEP_OFFSET = 2;
const TOTAL_ONBOARDING_STEPS = STEP_OFFSET + TOTAL_SUB_STEPS;

// Card titles used inline in the small "where am I" eyebrow strip just
// above the card content (NOT an eyebrow above a headline — this is
// nav chrome / breadcrumb context per the eyebrow rule).
const CARD_LABEL: Record<number, string> = {
  1: "Your site",
  2: "Business type",
  3: "Main goal",
  4: "Traffic",
  5: "Brand voice",
  6: "What WRKS does",
};

export default function BusinessPage() {
  const router = useRouter();
  const [subStep, setSubStep] = useState<number>(1);
  const [brandState, setBrandState] = useState<BrandStateSnapshot>(EMPTY_STATE);

  // Sync `subStep` with the URL hash on mount + when user navigates back/forward.
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

  // Reflect step changes back to the hash so refresh / share keeps position.
  useEffect(() => {
    const expected = `#step=${subStep}`;
    if (window.location.hash !== expected) {
      history.replaceState(null, "", expected);
    }
  }, [subStep]);

  // Hydrate brand state from the server on mount.
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
  const globalStep = STEP_OFFSET + subStep;

  return (
    <OnboardingFrame step={globalStep} totalSteps={TOTAL_ONBOARDING_STEPS}>
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 760,
          padding: "72px 32px 80px",
        }}
      >
        {/* Sub-step context — small mono breadcrumb just above the card
            content. Tells the user "Step 1 of 6 — Your site" without
            needing a whole sidebar. Click prev steps to navigate back. */}
        <nav
          aria-label="Step within business discovery"
          className="flex items-center mb-9"
          style={{ gap: 10 }}
        >
          <span
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(245,240,230,0.4)",
            }}
          >
            {String(subStep).padStart(2, "0")} / {String(TOTAL_SUB_STEPS).padStart(2, "0")}
          </span>
          <span
            aria-hidden
            style={{
              width: 22,
              height: 1,
              background: "rgba(245,240,230,0.18)",
            }}
          />
          <span
            style={{
              fontSize: 12.5,
              color: "rgba(245,240,230,0.62)",
              letterSpacing: "-0.003em",
            }}
          >
            {CARD_LABEL[subStep]}
          </span>
        </nav>

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
    </OnboardingFrame>
  );
}
