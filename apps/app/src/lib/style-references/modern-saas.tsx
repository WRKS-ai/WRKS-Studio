import type { StyleReference } from "./index";
import type { Site } from "@/lib/site-model";

// MODERN SAAS — Linear × Vercel × Cron × Raycast.
// Punchy, technical, opinionated. Inter throughout, bright accent, structured grids.

const sampleSite: Site = {
  brandName: "Lattice",
  activePageId: "page_home",
  pages: [
    {
      id: "page_home",
      slug: "home",
      label: "Home",
      sections: [
        {
          id: "hero_home",
          type: "hero",
          eyebrow: "v2.4 — out now",
          headline: "Ship work, not status updates.",
          subhead:
            "Lattice replaces standups, retros, and the weekly sync with one async loop your team actually reads. Twelve minutes saved per person per day. Sometimes more.",
          primaryCta: "Start free",
          secondaryCta: "See changelog",
        },
        {
          id: "features_home",
          type: "feature_grid",
          eyebrow: "How it works",
          title: "Three things, done well.",
          features: [
            {
              title: "Smart digests",
              description:
                "Yesterday compressed into one screen. Linear, GitHub, Notion, Slack — read where you already are.",
            },
            {
              title: "Async standup",
              description:
                "Three questions, prompted in your inbox at 9am. Skip days you don't have anything to say.",
            },
            {
              title: "Decisions log",
              description:
                "Tag a Slack thread #decision and Lattice files it. Searchable. Auditable. Tied to the projects it shaped.",
            },
          ],
        },
        {
          id: "pricing_home",
          type: "pricing",
          eyebrow: "Pricing",
          title: "Per seat. Cancel anytime.",
          tiers: [
            {
              name: "Free",
              price: "$0",
              cadence: "forever",
              features: ["Up to 5 teammates", "Daily digest", "7-day history"],
              cta: "Start",
            },
            {
              name: "Team",
              price: "$8",
              cadence: "per seat / month",
              features: [
                "Unlimited teammates",
                "Async standup",
                "Decisions log",
                "Slack + GitHub + Linear integrations",
              ],
              cta: "Start free trial",
              recommended: true,
            },
            {
              name: "Org",
              price: "$24",
              cadence: "per seat / month",
              features: [
                "Everything in Team",
                "SSO + SCIM",
                "Audit log",
                "Priority support",
              ],
              cta: "Talk to sales",
            },
          ],
        },
        {
          id: "cta_home",
          type: "cta_band",
          headline: "Read the changelog. Then start.",
          subhead: "v2.4 ships every Friday. No card required for the first 30 days.",
          primaryCta: "Start free",
        },
        {
          id: "footer_home",
          type: "footer",
          brand: "Lattice",
          tagline: "Async-first team OS. SOC 2 Type II.",
          columns: [
            { heading: "Product", links: ["Changelog", "Integrations", "Pricing"] },
            { heading: "Resources", links: ["Docs", "API", "Status"] },
            { heading: "Company", links: ["About", "Careers", "Customers"] },
          ],
        },
      ],
    },
  ],
};

function ModernSaasPreview() {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(91,139,255,0.18), transparent 60%), linear-gradient(180deg, #0e0f14 0%, #0a0b10 100%)",
        color: "rgba(255,255,255,0.95)",
      }}
    >
      {/* Top bar */}
      <div className="px-6 pt-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="size-3.5 rounded-sm rotate-45"
            style={{
              background: "linear-gradient(135deg, #5b8bff 0%, #7a55ff 100%)",
            }}
          />
          <span
            className="text-[11px] font-semibold tracking-tight"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Lattice
          </span>
        </div>
        <div
          className="flex gap-3 text-[9px]"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <span>Product</span>
          <span>Changelog</span>
          <span>Pricing</span>
          <span>Docs</span>
        </div>
      </div>

      {/* Version pill */}
      <div className="px-6 pt-5">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] tracking-[0.1em] font-medium"
          style={{
            background: "rgba(91,139,255,0.15)",
            color: "#a0b8ff",
            border: "1px solid rgba(91,139,255,0.3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span className="size-1 rounded-full" style={{ background: "#5b8bff" }} />
          v2.4 — out now
        </span>
      </div>

      {/* Hero */}
      <div className="flex-1 px-6 pt-3 flex flex-col">
        <h1
          className="text-[18px] leading-[1.05] font-semibold mb-2"
          style={{
            color: "white",
            letterSpacing: "-0.025em",
            fontFamily: "var(--font-sans)",
          }}
        >
          Ship work, not
          <br />
          status updates.
        </h1>
        <p
          className="text-[10px] leading-relaxed mb-3"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Replaces standups, retros, and the weekly sync with one async loop your team reads.
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="px-3 py-1.5 rounded-md text-[9.5px] font-semibold"
            style={{
              background: "white",
              color: "#0a0b10",
            }}
          >
            Start free
          </span>
          <span
            className="px-3 py-1.5 rounded-md text-[9.5px] font-medium"
            style={{
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            See changelog
          </span>
        </div>
      </div>

      {/* Dashboard preview strip */}
      <div
        className="mx-4 mb-4 rounded-md px-3 py-2.5 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="size-1.5 rounded-full"
            style={{ background: "#22c55e" }}
          />
          <span
            className="text-[9px]"
            style={{ color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-mono)" }}
          >
            12 min / day saved
          </span>
        </div>
        <span
          className="text-[8.5px]"
          style={{ color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-mono)" }}
        >
          ↗ +18%
        </span>
      </div>
    </div>
  );
}

export const modernSaasStyle: StyleReference = {
  id: "modern-saas",
  name: "Modern SaaS",
  tagline: "Punchy, structured, opinionated.",
  description:
    "For software products, dev tools, and productivity apps. Sans-serif throughout, bright accent, structured feature grids, technical specificity.",
  influences: ["Linear", "Vercel", "Cron", "Raycast"],
  accent: "#5b8bff",
  surface: "#0e0f14",
  Preview: ModernSaasPreview,
  sampleSite,
  claudeBrief: `MODERN SAAS STYLE BRIEF
───────────────────────

The brand is software, so the copy talks like the people building it. Direct. Opinionated. Specific. Read like Linear's homepage or a Vercel changelog.

VOICE RULES
- Active voice. Punchy. Sentences max 16 words.
- Lead with the verb. "Ship work." "Replaces standups." "Cuts the weekly sync."
- Numbers, version strings, and concrete integrations as proof. "v2.4 ships every Friday." "Twelve minutes per person per day." "Slack, Linear, GitHub."
- Opinionated framing: "X, not Y." "Made for X. Bad for Y."
- Sans-serif feel — short adjectives, technical specificity.
- One exclamation mark in the whole site, max. Usually zero.
- Acronyms are fine if real (SOC 2, SCIM, SSO). No invented acronyms.

STRUCTURAL CUES
- Hero headline: 4-7 words. States a contrast or replaces a status quo. "Ship work, not status updates." "Stop waiting on the deploy."
- Hero subhead: 1-2 sentences. Names the thing being replaced + the saved time or specific benefit.
- Hero eyebrow: version + status, OR product category. "v2.4 — out now" / "Async-first standup tool."
- Hero CTAs: "Start free" + secondary "See changelog" / "Read the docs." Never "Sign up today" or "Get started now."
- Feature grid: 3 features. Each title is 2-3 words ("Smart digests") + a one-sentence specific description with a concrete integration name.
- Pricing: 3 tiers (Free / Team / Org). Prices end in "0" or "9" — $0 / $8 / $24. Cadence in the format "per seat / month."
- Social: Instagram rarely (this isn't an IG brand). X is the home channel — short product updates, links to changelogs. LinkedIn is launch posts with a metric and a link.
- Ad: a benefit-as-fact + a price. "Twelve min/day back. $8/seat." CTA is "Start free."

EXAMPLES

GOOD HEADLINE: "Ship work, not status updates."
GOOD HEADLINE: "The unscheduled standup."
BAD HEADLINE: "Streamline your team's collaboration!"

GOOD SUBHEAD: "Replaces standups, retros, and the weekly sync with one async loop."
BAD SUBHEAD: "Empower your team to work more efficiently and effectively."

GOOD CTA: "Start free" / "See changelog" / "Read the docs"
BAD CTA: "Sign up now!" / "Get started today" / "Try it free!"

GOOD FEATURE TITLE: "Smart digests" / "Async standup" / "Decisions log"
BAD FEATURE TITLE: "Enhanced productivity" / "Seamless integration" / "Powerful insights"

NEVER
- "Streamline" / "empower" / "leverage" / "synergy" / "best-in-class"
- "Take your X to the next level"
- Adjectives like "powerful," "robust," "scalable" without a metric attached
- Anything that could fit any SaaS product

The user picked this style because they're building software and want the marketing copy to match the rigor of the product.`,
};
