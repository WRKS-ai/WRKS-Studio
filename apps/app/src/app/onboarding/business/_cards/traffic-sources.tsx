"use client";

import { useState } from "react";
import type { BrandStateSnapshot } from "../page";
import CardShell, {
  NextButton,
  SecondaryButton,
} from "../_components/card-shell";
import PickerGrid, {
  type PickerOption,
} from "../_components/picker-grid";

// Card 4 — traffic sources. MULTI-SELECT. Routes copy temperature
// (cold ad traffic gets hook-led; warm SEO gets depth-led).
// Pre-filled from URL ingest signals (e.g. pixel detected → paid_ads).

type TrafficSource =
  | "paid_ads"
  | "seo"
  | "social"
  | "email"
  | "referrals"
  | "cold_outreach"
  | "press";

const OPTIONS: ReadonlyArray<PickerOption<TrafficSource>> = [
  { value: "paid_ads", label: "Paid ads (Meta / Google)" },
  { value: "seo", label: "Organic SEO" },
  { value: "social", label: "Social media" },
  { value: "email", label: "Email list" },
  { value: "referrals", label: "Referrals / word of mouth" },
  { value: "cold_outreach", label: "Cold outreach / DMs" },
  { value: "press", label: "Press / podcasts" },
];

type Props = {
  brandState: BrandStateSnapshot;
  advance: (patch: Partial<BrandStateSnapshot>) => Promise<void>;
  goBack: () => void;
};

export default function TrafficSourcesCard({ brandState, advance, goBack }: Props) {
  const [value, setValue] = useState<TrafficSource[]>(
    (brandState.traffic_sources as TrafficSource[] | null) ?? [],
  );
  const [busy, setBusy] = useState(false);

  const onNext = async () => {
    if (value.length === 0) return;
    setBusy(true);
    try {
      await advance({ traffic_sources: value });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CardShell
      headline="How do customers find you?"
      subhead="Pick everything that drives real traffic today. Multi-select — cold paid ads and warm SEO need very different copy."
      actions={
        <>
          <SecondaryButton onClick={goBack} label="Back" disabled={busy} />
          <NextButton onClick={onNext} disabled={value.length === 0} busy={busy} />
        </>
      }
    >
      <PickerGrid
        mode="multi"
        options={OPTIONS}
        value={value}
        onChange={(next) => setValue(next)}
      />
    </CardShell>
  );
}
