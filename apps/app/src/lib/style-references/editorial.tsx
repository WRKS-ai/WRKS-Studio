import type { StyleReference } from "./index";
import type { Site } from "@/lib/site-model";

// EDITORIAL — Stripe Press × Aesop × Linear blog.
// Serif-led, considered, no hedging. Cream + ink palette.

const sampleSite: Site = {
  brandName: "Index",
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
          eyebrow: "Strategy advisory · est. 2019",
          headline: "We help good companies stop being subtle about it.",
          subhead:
            "A small firm advising founders who've outgrown their first pitch. Twelve engagements a year, always in-person, never decks.",
          primaryCta: "See current openings",
        },
        {
          id: "features_home",
          type: "feature_grid",
          eyebrow: "How we work",
          title: "The shape of an engagement.",
          features: [
            {
              title: "Twelve weeks.",
              description:
                "Eight conversations. One outcome we can both name on day one.",
            },
            {
              title: "Two of us in a room.",
              description:
                "Not a deck. Not a report. A position you can defend on Monday.",
            },
            {
              title: "We charge to walk away too.",
              description:
                "If the work isn't right, we say so by week three. The fee is structured for it.",
            },
          ],
        },
        {
          id: "testimonials_home",
          type: "testimonials",
          eyebrow: "After",
          title: "What founders say a year later.",
          quotes: [
            {
              text: "They said no to the brief I came in with. Then they wrote a new one that was right.",
              author: "Ana M.",
              role: "Founder, specialty retail",
            },
            {
              text: "First firm I've worked with that left me with fewer slides and more clarity.",
              author: "Jordan K.",
              role: "CEO, B2B fintech",
            },
          ],
        },
        {
          id: "cta_home",
          type: "cta_band",
          headline: "We take twelve engagements a year.",
          subhead: "Spring cohort opens March 14. One paragraph is enough.",
          primaryCta: "Write to us",
        },
        {
          id: "footer_home",
          type: "footer",
          brand: "Index",
          tagline: "An advisory firm. New York and Lisbon.",
          columns: [
            { heading: "Work", links: ["Manifesto", "Engagements", "Case studies"] },
            { heading: "Contact", links: ["Write", "Subscribe", "Office hours"] },
            { heading: "Index", links: ["Team", "Press", "Careers"] },
          ],
        },
      ],
    },
  ],
};

function EditorialPreview() {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: "#fbf7ee", color: "#0e0c08" }}
    >
      {/* Mini browser nav */}
      <div
        className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(14,12,8,0.06)" }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="size-1 rounded-full"
            style={{ background: "#0e0c08" }}
          />
          <span
            className="font-serif text-[10px]"
            style={{ color: "#0e0c08" }}
          >
            Index
          </span>
        </div>
        <div
          className="flex gap-3 text-[8px] tracking-[0.22em] uppercase"
          style={{ color: "#827a6e", fontFamily: "var(--font-mono)" }}
        >
          <span>Work</span>
          <span>Manifesto</span>
          <span>Write</span>
        </div>
      </div>
      {/* Hero composition */}
      <div className="flex-1 px-6 pt-6 pb-4 flex flex-col">
        <div
          className="text-[8.5px] tracking-[0.32em] uppercase mb-3 flex items-center gap-2"
          style={{ color: "#827a6e", fontFamily: "var(--font-mono)" }}
        >
          <span
            className="inline-block h-px w-5"
            style={{ background: "#0e0c08" }}
          />
          <span>Strategy advisory · est. 2019</span>
        </div>
        <h1
          className="font-serif font-medium text-[17px] leading-[1.05] mb-2.5"
          style={{ color: "#0e0c08", letterSpacing: "-0.025em" }}
        >
          We help good companies stop being subtle about it.
        </h1>
        <p
          className="font-serif italic text-[10.5px] leading-relaxed mb-3"
          style={{ color: "#4a443c" }}
        >
          Twelve engagements a year, always in-person, never decks.
        </p>
        <span
          className="font-serif text-[10px] self-start pb-0.5 inline-flex items-center gap-1"
          style={{
            borderBottom: "1px solid #0e0c08",
            color: "#0e0c08",
          }}
        >
          See current openings →
        </span>
      </div>
    </div>
  );
}

export const editorialStyle: StyleReference = {
  id: "editorial",
  name: "Editorial",
  tagline: "Serif-led, considered, no hedging.",
  description:
    "For agencies, advisors, B2B services, and brands whose work earns the right to be quiet.",
  influences: ["Stripe Press", "Aesop", "Linear blog", "The Browser Co."],
  accent: "#0e0c08",
  surface: "#fbf7ee",
  Preview: EditorialPreview,
  sampleSite,
  claudeBrief: `EDITORIAL STYLE BRIEF
─────────────────────

The brand wears its confidence quietly. Every sentence is something a thoughtful person would say in a room with five other thoughtful people — no megaphone, no exclamation, no growth-hack vernacular.

VOICE RULES
- Present tense. Declarative. "We do X." Never "we strive to" or "our mission is to."
- Max 14 words per sentence. If a sentence runs longer, break it.
- One idea per section.
- No hedging adverbs ("very", "really", "truly"). No marketing intensifiers ("incredible", "amazing", "powerful").
- No exclamation marks. No emoji. Anywhere.
- Specifics over abstractions. "Twelve engagements a year" beats "limited capacity."

STRUCTURAL CUES
- Hero headline: ONE complete sentence ending in a period. 7-12 words. States a position, not a benefit.
- Hero subhead: 2 short sentences. Ends on a specific noun when possible.
- Hero CTA: correspondence-flavored. "Write to us" / "See current openings" / "Read the manifesto." Never "Get started" or "Sign up."
- Hero eyebrow: classification + provenance. "Strategy advisory · est. 2019."
- Social posts: each stands alone as an observation. No threads, no "🧵". Instagram allowed 4-6 short sentences; X is one statement; LinkedIn 2-3 declarative paragraphs.
- Ad: counter-take or specific number, not a promise. CTA is correspondence-flavored.

EXAMPLES

GOOD: "We help good companies stop being subtle about it."
BAD: "Revolutionize your marketing!"

GOOD: "Coffee with a story you can taste in week three."
BAD: "Strategic advisory for modern brands."

GOOD CTA: "Write to us" / "Read the case study"
BAD CTA: "Get started today!" / "Sign up now!"

NEVER
- "We believe" / "We're passionate about"
- Three-word power phrases ("better, faster, simpler")
- Rhetorical questions to the reader
- "In today's fast-paced world"

The user picked this style because they want their work to feel like it earned the right to exist.`,
};
