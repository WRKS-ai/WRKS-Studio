export default function Home() {
  return (
    <main className="flex flex-col">
      <Nav />
      <Hero />
      <VisionMoment />
      <HowItWorks />
      <WhatItBuilds />
      <Waitlist />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-bg/70 border-b border-border">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
        <span className="font-serif text-lg tracking-tight">
          WRKS<span className="text-fg-muted"> Studio</span>
        </span>
        <a
          href="#waitlist"
          className="text-sm text-fg-muted hover:text-fg transition-colors"
        >
          Join waitlist
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-screen-xl mx-auto">
        <p className="text-sm text-fg-muted uppercase tracking-widest mb-6">
          The Connected Business Nervous System
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-4xl">
          Tell it.
          <br />
          <span className="italic text-fg-muted">It WRKS.</span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-fg-muted max-w-2xl leading-relaxed">
          A personalized AI agent that runs your business. Say what you need —
          it builds, publishes, and remembers. Websites, ads, content, copy,
          SEO. Live from your phone.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-fg text-bg font-medium hover:opacity-90 transition-opacity"
          >
            Join the waitlist
          </a>
          <a
            href="#how"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-border text-fg hover:bg-bg-elev transition-colors"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

function VisionMoment() {
  return (
    <section className="py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-screen-xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        <div>
          <p className="text-sm text-fg-muted uppercase tracking-widest mb-6">
            The vision moment
          </p>
          <p className="font-serif text-3xl sm:text-4xl leading-tight tracking-tight">
            <span className="text-fg-muted">&ldquo;</span>
            I want a 20% promo for March. Social post, banner on my website,
            discount code for returning customers.
            <span className="text-fg-muted">&rdquo;</span>
          </p>
          <p className="mt-8 text-base text-fg-muted leading-relaxed">
            One sentence. Three deliverables. Published in minutes — without
            switching tools, without writing a brief, without leaving the
            conversation.
          </p>
        </div>
        <div className="space-y-3">
          <OutputCard label="Instagram post" status="Published" />
          <OutputCard label="Website banner" status="Live on site" />
          <OutputCard
            label="Discount code"
            status="Active for returning users"
          />
        </div>
      </div>
    </section>
  );
}

function OutputCard({ label, status }: { label: string; status: string }) {
  return (
    <div className="border border-border rounded-2xl p-5 bg-bg-elev">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-fg-muted">{status}</span>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Tell it",
      body: "Speak or type. The agent understands your business — your voice, your audience, your offers — because you've built it together over time.",
    },
    {
      n: "02",
      title: "It shows you",
      body: "Before anything goes live, the agent shows what it's about to make. You confirm, redirect, or refine — through conversation, not menus.",
    },
    {
      n: "03",
      title: "It ships",
      body: "Approved work publishes immediately. Posts go live. Pages deploy. The agent remembers the decision and gets sharper for next time.",
    },
  ];
  return (
    <section id="how" className="py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-screen-xl mx-auto">
        <p className="text-sm text-fg-muted uppercase tracking-widest mb-6">
          How it works
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight max-w-2xl">
          A relationship, not a tool.
        </h2>
        <div className="mt-16 grid md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <div key={s.n}>
              <div className="text-sm font-mono text-fg-dim mb-4">{s.n}</div>
              <h3 className="font-serif text-2xl mb-3">{s.title}</h3>
              <p className="text-base text-fg-muted leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatItBuilds() {
  const items = [
    {
      title: "Websites & funnels",
      body: "Pages that convert, with forms forwarded to your CRM and Stripe payments built in.",
    },
    {
      title: "Social content",
      body: "Posts, captions, and visuals formatted for Instagram, Facebook, and LinkedIn.",
    },
    {
      title: "Ad creatives",
      body: "Headlines, body copy, and image direction for paid campaigns.",
    },
    {
      title: "Copywriting",
      body: "Page copy, CTAs, and brand voice writing — written to a proven framework.",
    },
    {
      title: "SEO & blog",
      body: "Long-form posts structured for search, with metadata and internal linking.",
    },
  ];
  return (
    <section className="py-24 px-6 lg:px-8 border-t border-border">
      <div className="max-w-screen-xl mx-auto">
        <p className="text-sm text-fg-muted uppercase tracking-widest mb-6">
          What it builds
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight max-w-2xl">
          Five deliverables.
          <br />
          <span className="text-fg-muted italic">Done right, every time.</span>
        </h2>
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-3xl overflow-hidden">
          {items.map((it) => (
            <div key={it.title} className="bg-bg p-8">
              <h3 className="font-serif text-xl mb-3">{it.title}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{it.body}</p>
            </div>
          ))}
          <div className="bg-bg-elev p-8 flex flex-col justify-center">
            <p className="text-xs text-fg-dim uppercase tracking-widest mb-2">
              Coming later
            </p>
            <p className="text-sm text-fg-muted">
              Email, sales sequences, and CRM are deliberately out of scope for
              v1. We&apos;re building the core five exceptionally first.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Waitlist() {
  return (
    <section
      id="waitlist"
      className="py-32 px-6 lg:px-8 border-t border-border"
    >
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-sm text-fg-muted uppercase tracking-widest mb-6">
          Early access
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight">
          We&apos;re opening the door
          <br />
          <span className="italic text-fg-muted">to the first hundred.</span>
        </h2>
        <p className="mt-6 text-lg text-fg-muted">
          Built for owners who want to run their business from their pocket.
          Limited founding cohort.
        </p>
        <form className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="you@yourbusiness.com"
            aria-label="Email address"
            required
            className="flex-1 h-12 px-5 rounded-full bg-bg-elev border border-border text-fg placeholder:text-fg-dim focus:outline-none focus:border-fg transition-colors"
          />
          <button
            type="submit"
            className="h-12 px-6 rounded-full bg-fg text-bg font-medium hover:opacity-90 transition-opacity"
          >
            Request access
          </button>
        </form>
        <p className="mt-4 text-xs text-fg-dim">
          No credit card. We&apos;ll email you when your slot opens.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 lg:px-8 border-t border-border">
      <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="font-serif text-base">
            WRKS<span className="text-fg-muted"> Studio</span>
          </span>
          <p className="text-xs text-fg-dim mt-1">
            A SlightWrks platform. © 2026.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-fg-muted">
          <a href="#" className="hover:text-fg transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-fg transition-colors">
            Terms
          </a>
          <a
            href="mailto:contact@slightwrks.com"
            className="hover:text-fg transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
