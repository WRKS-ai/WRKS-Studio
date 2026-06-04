import type { StyleReference } from "./index";
import type { Site } from "@/lib/site-model";

// The Editorial style — Stripe Press × Aesop × Linear's blog.
// Fully hand-written. The sampleSite renders inside the picker card
// and matches what the user would actually get if they picked this
// style + ran wow on their own business.

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
            {
              heading: "Work",
              links: ["Manifesto", "Engagements", "Case studies"],
            },
            {
              heading: "Contact",
              links: ["Write", "Subscribe", "Office hours"],
            },
            {
              heading: "Index",
              links: ["Team", "Press", "Careers"],
            },
          ],
        },
      ],
    },
  ],
};

export const editorialStyle: StyleReference = {
  id: "editorial",
  name: "Editorial",
  tagline: "Serif-led, considered, no hedging.",
  description:
    "For agencies, advisors, B2B services, and brands whose work earns the right to be quiet. Fraunces headlines, monospace eyebrows, cream + ink palette, generous whitespace.",
  influences: ["Stripe Press", "Aesop", "Linear blog", "The Browser Co."],
  accent: "#0e0c08",
  surface: "#fbf7ee",
  sampleSite,
  available: true,
  claudeBrief: `EDITORIAL STYLE BRIEF
─────────────────────

The brand wears its confidence quietly. Every sentence is something a thoughtful person would say in a room with five other thoughtful people — no megaphone, no exclamation, no growth-hack vernacular. Think Stripe Press × Aesop × an old issue of The Atlantic.

VOICE RULES
- Present tense. Declarative. "We do X." "The work is Y." No "we strive to" or "our mission is to."
- Max 14 words per sentence. If a sentence runs longer, break it.
- One idea per section. Never two.
- No hedging adverbs ("very", "really", "truly"). No marketing intensifiers ("incredible", "amazing", "powerful").
- No exclamation marks. Anywhere. Including the social posts.
- No emoji. Anywhere.
- Specifics over abstractions. "Twelve engagements a year" beats "limited capacity." "Spring cohort opens March 14" beats "applications now open."
- Self-aware about restraint. Lines like "We charge to walk away too" or "Eight conversations, one outcome" — the editorial style is willing to say what most brands won't.

STRUCTURAL CUES FOR THE WOW DELIVERABLES
- Hero headline: ONE complete sentence, ending with a period. 7-12 words. States a position, not a benefit.
- Hero subhead: 2 short sentences max. Ends on a specific noun (a number, a place, a date) when possible.
- Hero CTA: an action that sounds like correspondence, not conversion. "Write to us" / "See current openings" / "Read the manifesto." Never "Get started" or "Sign up."
- Hero eyebrow: classification + provenance. "Strategy advisory · est. 2019" / "Coffee roaster · Bend, OR" / "Newsletter · since 2021." Used as a quiet identifier, not a hype line.
- Social posts: each one stands alone as a single observation, not a thread starter. No "1/" no "🧵" no "stay tuned." The Instagram caption is allowed to be longer (4-6 short sentences); X is one short statement; LinkedIn is 2-3 declarative paragraphs.
- Ad: more restrained than competitors. Headline is a counter-take or specific number, not a promise. Body is 1-2 sentences. CTA is correspondence-flavored.

EXAMPLES OF EDITORIAL VOICE IN ACTION

Hero headline (good): "We help good companies stop being subtle about it."
Hero headline (good): "Coffee with a story you can taste in week three."
Hero headline (bad — too hype): "Revolutionize your marketing!"
Hero headline (bad — too vague): "Strategic advisory for modern brands."

Hero subhead (good): "Twelve engagements a year, always in-person, never decks."
Hero subhead (bad): "We help our clients reach their full potential with personalized service tailored to their unique needs."

CTA (good): "Write to us" / "See current openings" / "Read the case study"
CTA (bad): "Get started today!" / "Sign up now!" / "Book a call"

X post (good): "Most brand briefs are answering yesterday's question. The interesting work is figuring out which question to ask next."
X post (bad): "🚀 Just launched our new service! Don't miss out — sign up today! #marketing #branding"

LinkedIn (good): "We take twelve engagements a year. We charge to walk away. Spring cohort opens March 14."
LinkedIn (bad): "Excited to share that we're now accepting applications for our spring cohort! Don't miss this incredible opportunity!"

THINGS THE EDITORIAL STYLE NEVER DOES
- It never says "we believe" or "we're passionate about."
- It never uses three-word power phrases ("better, faster, simpler").
- It never closes with a question to the reader.
- It never references "the future" or "today's fast-paced world."
- It never lists generic feature bullets ("Easy setup. Fast results. World-class support.")

The user picked this style because they want their work to feel like it earned the right to exist. Honor that.`,
};
