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

// Card 3 — primary goal. Single-select. Drives CTA framing + funnel
// structure in the future Sites builder + copy generation. Auto-picked
// from URL ingest when the agent can confidently read it from the site.

type PrimaryGoal =
  | "book_calls"
  | "sell_products"
  | "capture_leads"
  | "build_audience"
  | "launch_new"
  | "fix_conversions";

const OPTIONS: ReadonlyArray<PickerOption<PrimaryGoal>> = [
  { value: "book_calls", label: "Book calls / consultations" },
  { value: "sell_products", label: "Sell products online" },
  { value: "capture_leads", label: "Capture leads" },
  { value: "build_audience", label: "Build an audience" },
  { value: "launch_new", label: "Launch something new" },
  { value: "fix_conversions", label: "Fix conversions on my existing site" },
];

type Props = {
  brandState: BrandStateSnapshot;
  advance: (patch: Partial<BrandStateSnapshot>) => Promise<void>;
  goBack: () => void;
};

export default function PrimaryGoalCard({ brandState, advance, goBack }: Props) {
  const [value, setValue] = useState<PrimaryGoal | null>(
    (brandState.primary_goal as PrimaryGoal | null) ?? null,
  );
  const [busy, setBusy] = useState(false);

  const onNext = async () => {
    if (!value) return;
    setBusy(true);
    try {
      await advance({ primary_goal: value });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CardShell
      headline="What's your main goal?"
      subhead="Shapes the CTA and funnel structure of whatever we build for you."
      actions={
        <>
          <SecondaryButton onClick={goBack} label="Back" disabled={busy} />
          <NextButton onClick={onNext} disabled={!value} busy={busy} />
        </>
      }
    >
      <PickerGrid
        mode="single"
        options={OPTIONS}
        value={value}
        onChange={(v) => setValue(v)}
      />
    </CardShell>
  );
}
