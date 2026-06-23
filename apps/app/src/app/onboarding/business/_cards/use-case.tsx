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

// Card 6 — use case. Final card. Picks which pillars WRKS is active
// for at launch: Sites, Copy, or Both. Writes active_pillars[] which
// the dashboard reads to gate mode tabs (composer Site / Post toggle).
// On Next: also sets onboarding_completed_at and redirects to /studio
// (handled by the parent page when step === TOTAL_STEPS).

type UseCase = "sites" | "copy" | "both";

const OPTIONS: ReadonlyArray<PickerOption<UseCase>> = [
  { value: "sites", label: "Sites — landing pages, funnels, full websites" },
  { value: "copy", label: "Copy — emails, ads, posts, voice-written content" },
  { value: "both", label: "Both — the full agent" },
];

type Props = {
  brandState: BrandStateSnapshot;
  advance: (patch: Partial<BrandStateSnapshot>) => Promise<void>;
  goBack: () => void;
};

export default function UseCaseCard({ brandState, advance, goBack }: Props) {
  // Map current active_pillars back to the single-select value.
  const initial: UseCase | null = (() => {
    const pillars = brandState.active_pillars ?? [];
    if (pillars.length === 2 && pillars.includes("sites") && pillars.includes("copy")) {
      return "both";
    }
    if (pillars.length === 1 && pillars[0] === "sites") return "sites";
    if (pillars.length === 1 && pillars[0] === "copy") return "copy";
    return null;
  })();
  const [value, setValue] = useState<UseCase | null>(initial);
  const [busy, setBusy] = useState(false);

  const onNext = async () => {
    if (!value) return;
    setBusy(true);
    try {
      const active_pillars: string[] =
        value === "both" ? ["sites", "copy"] : [value];
      await advance({ active_pillars });
      // Parent advance() handles onboarding_completed_at + /studio redirect
      // because this is the last step (step === TOTAL_STEPS).
    } finally {
      setBusy(false);
    }
  };

  return (
    <CardShell
      headline="What's WRKS for?"
      subhead="Pick the pillar (or both) you want active right now. You can flip the other on later from inside the studio."
      actions={
        <>
          <SecondaryButton onClick={goBack} label="Back" disabled={busy} />
          <NextButton
            onClick={onNext}
            disabled={!value}
            label="Open the studio"
            busy={busy}
          />
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
