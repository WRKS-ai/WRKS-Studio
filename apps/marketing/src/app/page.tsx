import { Architecture } from "@/components/architecture";
import { FAQ } from "@/components/faq";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { NovaPill } from "@/components/nova-pill";
import { Pricing } from "@/components/pricing";
import { ScrollProgress } from "@/components/scroll-progress";
import { TrustStrip } from "@/components/trust-strip";
import { Waitlist } from "@/components/waitlist";
import { WhatItBuilds } from "@/components/what-it-builds";

export default function Home() {
  return (
    <main className="flex flex-col">
      <ScrollProgress />
      <NovaPill />
      <Nav />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <WhatItBuilds />
      <Architecture />
      <Pricing />
      <FAQ />
      <Waitlist />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-canvas/70 border-b border-line">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
        <span className="font-serif text-lg tracking-tight">
          WRKS<span className="text-ink-muted"> Studio</span>
        </span>
        <div className="hidden sm:flex items-center gap-7 text-sm font-sans text-ink-muted">
          <a href="#how" className="hover:text-ink transition-colors">
            How it works
          </a>
          <a href="#pricing" className="hover:text-ink transition-colors">
            Pricing
          </a>
        </div>
        <a
          href="#waitlist"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink text-canvas text-sm font-sans font-medium h-9 px-4 hover:opacity-90 transition-opacity"
        >
          Join waitlist
          <span aria-hidden>→</span>
        </a>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="py-16 px-6 lg:px-8 border-t border-line">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid sm:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <span className="font-serif text-xl tracking-tight">
              WRKS<span className="text-ink-muted"> Studio</span>
            </span>
            <p className="mt-3 text-sm text-ink-muted font-sans max-w-xs leading-relaxed">
              The connected business nervous system. One agent. Five
              deliverables. Live from your phone.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { label: "How it works", href: "#how" },
              { label: "Pricing", href: "#pricing" },
              { label: "Waitlist", href: "#waitlist" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About", href: "#" },
              { label: "Contact", href: "mailto:contact@slightwrks.com" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
            ]}
          />
        </div>
        <div className="pt-8 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-ink-dim font-sans">
          <span>A SlightWrks platform · © 2026</span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            Founding cohort onboarding
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-sans mb-4">
        {title}
      </div>
      <ul className="space-y-2.5 text-sm font-sans">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-ink-muted hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
