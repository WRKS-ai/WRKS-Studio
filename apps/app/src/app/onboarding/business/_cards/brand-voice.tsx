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

// Card 5 — brand voice. Single-select. Drives the agent's tone in copy
// generation. Options carry brand exemplars as descriptors (far more
// useful for the agent's prompt than abstract "professional" alone).

type VoiceDescriptor =
  | "professional"
  | "bold"
  | "warm"
  | "expert"
  | "playful"
  | "quiet";

const OPTIONS: ReadonlyArray<PickerOption<VoiceDescriptor>> = [
  {
    value: "professional",
    label: "Professional & polished",
    descriptor: "Stripe, McKinsey vibe",
  },
  {
    value: "bold",
    label: "Bold & contrarian",
    descriptor: "Liquid Death, Cards Against Humanity",
  },
  {
    value: "warm",
    label: "Warm & friendly",
    descriptor: "Mailchimp, Trader Joe's",
  },
  {
    value: "expert",
    label: "Expert & data-driven",
    descriptor: "Bloomberg, a16z",
  },
  {
    value: "playful",
    label: "Playful & creative",
    descriptor: "Notion, Duolingo",
  },
  {
    value: "quiet",
    label: "Quiet & minimalist",
    descriptor: "Aesop, Apple",
  },
];

type Props = {
  brandState: BrandStateSnapshot;
  advance: (patch: Partial<BrandStateSnapshot>) => Promise<void>;
  goBack: () => void;
};

export default function BrandVoiceCard({ brandState, advance, goBack }: Props) {
  const [value, setValue] = useState<VoiceDescriptor | null>(
    (brandState.voice_descriptor as VoiceDescriptor | null) ?? null,
  );
  const [busy, setBusy] = useState(false);

  const onNext = async () => {
    if (!value) return;
    setBusy(true);
    try {
      await advance({ voice_descriptor: value });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CardShell
      headline="How does your brand sound?"
      subhead="Picks the tone register the agent writes in across every output."
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
