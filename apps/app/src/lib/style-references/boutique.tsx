import type { StyleReference } from "./index";
import type { Site } from "@/lib/site-model";

// BOUTIQUE — Aesop × Verve Coffee × Studio Olafur Eliasson.
// Sensory, place-specific, small-batch. Cream + clay palette.

const sampleSite: Site = {
  brandName: "Cinder & Bean",
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
          eyebrow: "Coffee roastery · Bend, Oregon",
          headline: "Roasted Tuesday. In your kitchen by Friday.",
          subhead:
            "Single-origin beans, slow-roasted in small batches by a two-person team. Eight roasts a year. Each one drinks like the place it grew.",
          primaryCta: "See this week's roast",
        },
        {
          id: "story_home",
          type: "rich_text",
          title: "Our notes for this season.",
          body:
            "We started in 2019, in a leased garage, with one drum roaster and a list of seven farms we'd been writing to for years. We still write to those seven farms. We still roast on the same drum. The shop is now a storefront on Bond Street, but the work is unchanged: small lots, slow roasts, no flavor sheets you've memorized before you taste the cup.",
        },
        {
          id: "features_home",
          type: "feature_grid",
          eyebrow: "This season",
          title: "Three roasts on the bar.",
          features: [
            {
              title: "Midnight Blend",
              description:
                "Ethiopia Sidamo, washed. Plum, dark chocolate, finish like aged port.",
            },
            {
              title: "Day's Edge",
              description:
                "Colombia Huila, natural. Strawberry compote, honey, soft acid.",
            },
            {
              title: "Slow Hour",
              description:
                "Kenya Nyeri, washed. Blackcurrant, lime peel, the kind of brightness you taste at the back of your jaw.",
            },
          ],
        },
        {
          id: "cta_home",
          type: "cta_band",
          headline: "We ship Tuesdays.",
          subhead: "Subscriptions open Sunday at midnight. Three bags per month.",
          primaryCta: "Reserve a bag",
        },
        {
          id: "footer_home",
          type: "footer",
          brand: "Cinder & Bean",
          tagline: "A two-person coffee roastery. Bend, Oregon.",
          columns: [
            { heading: "Shop", links: ["This week", "Subscriptions", "Gift cards"] },
            { heading: "Read", links: ["Roast notes", "Field journal", "Farms"] },
            { heading: "Visit", links: ["Bond Street", "Hours", "Wholesale"] },
          ],
        },
      ],
    },
  ],
};

function BoutiquePreview() {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: "#f5ecdc", color: "#3d2f1f" }}
    >
      {/* Top stamp */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
        <span
          className="font-serif italic text-[12px]"
          style={{ color: "#3d2f1f" }}
        >
          Cinder &amp; Bean
        </span>
        <span
          className="text-[8px] tracking-[0.24em] uppercase"
          style={{ color: "#9d8765", fontFamily: "var(--font-mono)" }}
        >
          № 47
        </span>
      </div>

      {/* Product still-life */}
      <div className="flex-1 px-6 grid grid-cols-[1fr_1.1fr] gap-4 items-center">
        <div>
          <div
            className="text-[8.5px] tracking-[0.3em] uppercase mb-2.5"
            style={{ color: "#a87856", fontFamily: "var(--font-mono)" }}
          >
            This season
          </div>
          <h1
            className="font-serif italic text-[16px] leading-[1.1] mb-2"
            style={{ color: "#3d2f1f", letterSpacing: "-0.015em" }}
          >
            Roasted Tuesday. In your kitchen by Friday.
          </h1>
          <p
            className="font-serif text-[9.5px] leading-relaxed mb-3"
            style={{ color: "#5a4a36" }}
          >
            Single-origin. Slow-roasted. Eight roasts a year.
          </p>
          <span
            className="font-serif italic text-[9.5px] inline-flex items-center gap-1"
            style={{ color: "#3d2f1f" }}
          >
            See this week&rsquo;s roast →
          </span>
        </div>
        {/* Coffee bag */}
        <div className="relative h-full flex items-center justify-center">
          <div
            className="w-[100px] h-[140px] rounded-sm relative overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #2a1f15 0%, #1a130c 100%)",
              boxShadow:
                "0 18px 30px -10px rgba(58,40,20,0.5), inset 0 1px 0 rgba(255,210,140,0.08)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-4"
              style={{
                background: "rgba(245,236,220,0.08)",
                borderBottom: "1px dashed rgba(245,236,220,0.18)",
              }}
            />
            <div className="absolute inset-x-3 top-7 flex flex-col gap-1">
              <div
                className="text-[6px] tracking-[0.36em] uppercase"
                style={{
                  color: "#d4a574",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Lot 047
              </div>
              <div
                className="font-serif italic text-[10px]"
                style={{ color: "#f5ecdc", letterSpacing: "-0.01em" }}
              >
                Midnight
                <br />
                Blend
              </div>
              <div
                className="text-[5.5px] tracking-[0.28em] uppercase mt-1"
                style={{ color: "rgba(245,236,220,0.55)" }}
              >
                Ethiopia Sidamo
              </div>
            </div>
            <div
              className="absolute bottom-2 left-3 right-3 h-px"
              style={{ background: "rgba(245,236,220,0.18)" }}
            />
            <div
              className="absolute bottom-4 left-3 text-[5.5px] tracking-[0.18em]"
              style={{
                color: "rgba(245,236,220,0.55)",
                fontFamily: "var(--font-mono)",
              }}
            >
              250G · 8.8 OZ
            </div>
          </div>
        </div>
      </div>

      {/* Bottom mark */}
      <div
        className="px-6 py-3 flex items-center justify-between shrink-0"
        style={{ borderTop: "1px solid rgba(168,120,86,0.18)" }}
      >
        <span
          className="text-[8px] tracking-[0.22em] uppercase"
          style={{ color: "#9d8765", fontFamily: "var(--font-mono)" }}
        >
          Roasted 03.12
        </span>
        <span
          className="font-serif italic text-[9px]"
          style={{ color: "#5a4a36" }}
        >
          Bend, Oregon
        </span>
      </div>
    </div>
  );
}

export const boutiqueStyle: StyleReference = {
  id: "boutique",
  name: "Boutique",
  tagline: "Sensory, place-specific, small-batch.",
  description:
    "For makers, restaurants, coffee roasters, and brands whose work is touched by hand.",
  influences: ["Aesop", "Verve Coffee", "Glossier", "Studio Olafur Eliasson"],
  accent: "#a87856",
  surface: "#f5ecdc",
  Preview: BoutiquePreview,
  sampleSite,
  claudeBrief: `BOUTIQUE STYLE BRIEF
────────────────────

The brand is small, hands-on, and proud of where it comes from. Every line is sensory — a taste, a place, a process. Read like Aesop's product cards or a Verve Coffee bag.

VOICE RULES
- Italic-leaning, in feel even if not in actual style. Slow cadence.
- Specifics that engage a sense: taste, smell, texture, time of day, weather, place name.
- Process and provenance as personality. "Roasted Tuesday in Bend." "Pressed by Marco, who's been with us since 2019." "First batch of the season."
- Numbers that suggest scarcity, not scale. "Eight roasts a year." "47 bottles." "Three seats."
- No marketing intensifiers. No "premium," no "artisan," no "curated." The work is the proof.
- Em-dashes allowed sparingly. Italics for sensory adjectives.

STRUCTURAL CUES
- Hero headline: a small, true sentence. Often a process moment or a tasting note. "Roasted Tuesday. In your kitchen by Friday." "Pressed yesterday. Drinkable tomorrow."
- Hero subhead: 2 sentences. One sets the work, one sets the cadence.
- Hero eyebrow: trade + place. "Coffee roastery · Bend, Oregon." "Natural wine · Brooklyn."
- Hero CTA: invites the user into the rhythm of the business. "See this week's roast." "Reserve a bottle." "Visit the shop."
- Social: Instagram is a journal entry (a tasting note, a delivery, a moment in the shop). X is one line + the date. LinkedIn is two paragraphs about the work, not the brand.
- Ad: a single tasting/process note. CTA is "Try this batch" or "Reserve" — not "Order now."

EXAMPLES

GOOD: "Roasted Tuesday. In your kitchen by Friday."
GOOD: "Plum, dark chocolate, finish like aged port."
BAD: "Premium artisanal coffee, crafted with passion."

GOOD CTA: "See this week's roast" / "Reserve a bottle"
BAD CTA: "Shop now" / "Get yours today"

NEVER
- "Curated" / "artisanal" / "premium" / "handcrafted with love"
- The word "passion" or "passionate."
- Generic provenance ("from around the world").
- Anything that could fit any product. Specificity is the whole point.

The user picked this style because their work is touched by their hands and they want the copy to taste like that.`,
};
