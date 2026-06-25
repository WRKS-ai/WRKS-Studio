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

// Card 2 — business type. Single-select. Drives template selection in
// the future Sites builder. Auto-picked from URL ingest when available.

type BusinessType =
  | "service"
  | "ecommerce"
  | "saas"
  | "agency"
  | "personal_brand"
  | "other";

const OPTIONS: ReadonlyArray<PickerOption<BusinessType>> = [
  { value: "service", label: "Service business" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "saas", label: "SaaS / software" },
  { value: "agency", label: "Agency" },
  { value: "personal_brand", label: "Personal brand / creator" },
  { value: "other", label: "Other" },
];

type Props = {
  brandState: BrandStateSnapshot;
  advance: (patch: Partial<BrandStateSnapshot>) => Promise<void>;
  goBack: () => void;
};

export default function BusinessTypeCard({ brandState, advance, goBack }: Props) {
  const [value, setValue] = useState<BusinessType | null>(
    (brandState.business_type as BusinessType | null) ?? null,
  );
  const [busy, setBusy] = useState(false);

  const onNext = async () => {
    if (!value) return;
    setBusy(true);
    try {
      await advance({ business_type: value });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CardShell
      headline="What kind of business?"
      subhead="Picks which templates the agent reaches for when building your site."
      actions={
        <>
          <SecondaryButton onClick={goBack} label="Back" disabled={busy} />
          <NextButton
            onClick={onNext}
            disabled={!value}
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
