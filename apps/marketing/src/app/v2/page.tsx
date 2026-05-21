import type { Metadata } from "next";
import { MeshGradient } from "@/components/mesh-gradient";
import { StarField } from "@/components/star-field";
import { Hero } from "@/components/v2/hero";
import { Nav } from "@/components/v2/nav";
import { WhatItBuilds } from "@/components/v2/what-it-builds";

export const metadata: Metadata = {
  title: "WRKS Studio — v2",
  description: "Preview of the v2 marketing page.",
};

export default function V2Home() {
  return (
    <main className="relative flex flex-col">
      {/* Page-wide ambient — autonomous Stripe-style drift */}
      <StarField />
      <MeshGradient />

      <Nav />
      <Hero />

      {/* Placeholder bands to convey rhythm — will be replaced section-by-section */}
      <Placeholder
        eyebrow="Up next"
        title="Nova section"
        lede="The interactive demo gets its own breathing room here."
      />
      <WhatItBuilds />
      <Placeholder
        eyebrow="How it works"
        title="Three phases"
        lede="Tell it. It shows you. It ships. Simpler than before."
      />
      <Placeholder
        eyebrow="Built around you"
        title="Memory & personality"
        lede="Restrained typography only — no cursor scenes."
      />
      <Placeholder
        eyebrow="Get started"
        title="Join the waitlist"
        lede="Founding cohort onboarding underway."
      />
    </main>
  );
}

function Placeholder({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <section className="relative py-32 sm:py-40 px-6 lg:px-8 border-t border-white/[0.04]">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-[12px] tracking-[0.18em] uppercase text-ink-dim font-sans font-medium mb-5">
          {eyebrow}
        </div>
        <h2 className="font-serif text-5xl sm:text-6xl tracking-tight leading-[1.05] max-w-3xl">
          {title}
        </h2>
        <p className="mt-6 text-[20px] text-ink-muted leading-[1.55] max-w-2xl">
          {lede}
        </p>
        <div className="mt-10 inline-flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium">
          <span className="size-1 rounded-full bg-ink-dim" />
          Placeholder · section will land in next commits
        </div>
      </div>
    </section>
  );
}
