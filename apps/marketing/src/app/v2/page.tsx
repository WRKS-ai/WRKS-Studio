import type { Metadata } from "next";
import { MeshGradient } from "@/components/mesh-gradient";
import { StarField } from "@/components/star-field";
import { BrandMarquee } from "@/components/v2/brand-marquee";
import { CardNav, type CardNavItem } from "@/components/v2/card-nav";
import { Connections } from "@/components/v2/connections";
import { Footer } from "@/components/v2/footer";
import { Hero } from "@/components/v2/hero";
import { HowItWorks } from "@/components/v2/how-it-works";
import { Memory } from "@/components/v2/memory";
import { Waitlist } from "@/components/v2/waitlist";
import { WhatItBuilds } from "@/components/v2/what-it-builds";

const NAV_ITEMS: CardNavItem[] = [
  {
    label: "Product",
    bgColor: "#1a1426",
    textColor: "#ffffff",
    links: [
      { label: "What it builds", href: "#builds", ariaLabel: "What Nova builds" },
      { label: "How it works", href: "#how", ariaLabel: "How it works" },
      { label: "Try Nova", href: "#nova", ariaLabel: "Try Nova demo" },
    ],
  },
  {
    label: "Why WRKS",
    bgColor: "#0f1a2b",
    textColor: "#ffffff",
    links: [
      { label: "Memory & personality", href: "#memory", ariaLabel: "Memory and personality" },
      { label: "Connections", href: "#connections", ariaLabel: "Connections" },
      { label: "Trust gates", href: "#memory", ariaLabel: "Trust gates" },
    ],
  },
  {
    label: "Company",
    bgColor: "#15192c",
    textColor: "#ffffff",
    links: [
      { label: "Founding cohort", href: "#waitlist", ariaLabel: "Founding cohort" },
      { label: "Contact", href: "mailto:contact@slightwrks.com", ariaLabel: "Contact" },
      { label: "Privacy", href: "#", ariaLabel: "Privacy policy" },
    ],
  },
];

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

      <CardNav items={NAV_ITEMS} />
      <Hero />

      {/* Placeholder bands to convey rhythm — will be replaced section-by-section */}
      <Placeholder
        eyebrow="Up next"
        title="Nova section"
        lede="The interactive demo gets its own breathing room here."
      />
      <WhatItBuilds />
      <HowItWorks />
      <Connections />
      <Memory />
      <Waitlist />
      <BrandMarquee />
      <Footer />
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
