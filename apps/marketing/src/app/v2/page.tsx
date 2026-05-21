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
import { Nova } from "@/components/v2/nova";
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

      <WhatItBuilds />
      <Nova />
      <HowItWorks />
      <Connections />
      <Memory />
      <Waitlist />
      <BrandMarquee />
      <Footer />
    </main>
  );
}

