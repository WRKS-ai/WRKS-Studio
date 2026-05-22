import type { Metadata } from "next";
import { MeshGradient } from "@/components/mesh-gradient";
import { StarField } from "@/components/star-field";
import { BrandMarquee } from "@/components/v2/brand-marquee";
import { CardNav, type CardNavItem } from "@/components/v2/card-nav";
import { Connections } from "@/components/v2/connections";
import { Footer } from "@/components/v2/footer";
import { Hero } from "@/components/v2/hero";
import { HowItWorks } from "@/components/v2/how-it-works";
import { Manifesto } from "@/components/v2/manifesto";
import { Memory } from "@/components/v2/memory";
import { Newsletter } from "@/components/v2/newsletter";
import { Nova } from "@/components/v2/nova";
import { Pricing } from "@/components/v2/pricing";
import { WhatItBuilds } from "@/components/v2/what-it-builds";
import { SIGN_UP_URL } from "@/lib/urls";

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
      { label: "Newsletter", href: "#newsletter", ariaLabel: "Newsletter" },
      { label: "Contact", href: "mailto:contact@slightwrks.com", ariaLabel: "Contact" },
      { label: "Privacy", href: "#", ariaLabel: "Privacy policy" },
    ],
  },
];

export const metadata: Metadata = {
  title: "WRKS Studio — The Connected Business Nervous System",
  description:
    "A personalized AI agent that builds your business outputs — websites, ads, social, copy, SEO. Just say what you need, from your phone.",
};

export default function Home() {
  return (
    <main className="relative flex flex-col overflow-x-clip">
      <StarField />
      <MeshGradient />

      <CardNav items={NAV_ITEMS} ctaLabel="Get started" ctaHref={SIGN_UP_URL} />
      <Hero />

      <WhatItBuilds />
      <Nova />
      <Manifesto />
      <HowItWorks />
      <Connections />
      <Memory />
      <Pricing />
      <Newsletter />
      <BrandMarquee />
      <Footer />
    </main>
  );
}
