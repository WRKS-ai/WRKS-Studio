import type { StyleReference } from "./index";
import type { Site } from "@/lib/site-model";

// CINEMATIC — Apple × Loewe × Rimowa × Magnum Photos.
// Image-led, dramatic, sparse text on full-bleed photography.

const sampleSite: Site = {
  brandName: "Hale Studio",
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
          eyebrow: "Wedding photography",
          headline: "Days that pass faster than you'll remember.",
          subhead:
            "I photograph wedding days for couples who want to feel the day, not script it. Twenty-two days a year. Booking through 2027.",
          primaryCta: "See available dates",
        },
        {
          id: "features_home",
          type: "feature_grid",
          eyebrow: "Work",
          title: "Three ways I show up.",
          features: [
            {
              title: "Editorial day",
              description:
                "Full day, two photographers, 600 edited frames. Six-week turnaround.",
            },
            {
              title: "Intimate ceremony",
              description:
                "Half day, just me. Under thirty guests. The quiet kind of wedding.",
            },
            {
              title: "Elopement",
              description:
                "You + the witness + a location. Anywhere. I'll meet you there.",
            },
          ],
        },
        {
          id: "testimonials_home",
          type: "testimonials",
          eyebrow: "After",
          title: "What couples have said.",
          quotes: [
            {
              text: "She was the second guest I told 'yes' to. I'm still glad about that.",
              author: "Maya",
              role: "Married, 2024",
            },
            {
              text: "We got images we'll print and hang. Not photos for the gallery wall — photographs.",
              author: "Theo & Sam",
              role: "Eloped, Iceland",
            },
          ],
        },
        {
          id: "cta_home",
          type: "cta_band",
          headline: "Twenty-two days a year.",
          subhead: "Tell me about yours. I'll respond by Sunday.",
          primaryCta: "Get in touch",
        },
        {
          id: "footer_home",
          type: "footer",
          brand: "Hale",
          tagline: "Wedding photography. Based in Edinburgh.",
          columns: [
            { heading: "Work", links: ["Editorial", "Intimate", "Elopement"] },
            { heading: "Read", links: ["Journal", "Process", "FAQ"] },
            { heading: "Contact", links: ["Write", "Instagram", "Print shop"] },
          ],
        },
      ],
    },
  ],
};

function CinematicPreview() {
  // Atmospheric image-feel built from CSS gradients — no external assets
  // needed. Reads like a moody black-and-white photo with text overlay.
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: "#0d0d0e" }}
    >
      {/* Photographic backdrop — layered gradients suggest a wide
          editorial photograph in shadow */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 50% at 35% 30%, rgba(190,180,170,0.22), transparent 60%)",
            "radial-gradient(ellipse 50% 70% at 75% 75%, rgba(60,55,50,0.6), transparent 70%)",
            "linear-gradient(180deg, rgba(13,13,14,0.2) 0%, rgba(13,13,14,0.85) 100%)",
            "linear-gradient(125deg, #2a2620 0%, #15140f 60%, #060606 100%)",
          ].join(", "),
        }}
      />
      {/* Subtle film grain via radial dots */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, white 0.5px, transparent 1px), radial-gradient(circle at 70% 60%, white 0.5px, transparent 1px), radial-gradient(circle at 40% 80%, white 0.5px, transparent 1px)",
          backgroundSize: "32px 32px, 24px 24px, 48px 48px",
        }}
      />

      {/* Top bar — minimal */}
      <div className="relative px-6 pt-5 flex items-center justify-between shrink-0">
        <span
          className="text-[11px] tracking-[0.32em] uppercase font-medium"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          HALE
        </span>
        <div
          className="flex gap-3 text-[8px] tracking-[0.24em] uppercase"
          style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)" }}
        >
          <span>Work</span>
          <span>Journal</span>
          <span>Contact</span>
        </div>
      </div>

      {/* Hero — large headline, sparse meta */}
      <div className="relative flex-1 flex flex-col justify-end px-6 pb-6">
        <div
          className="text-[8px] tracking-[0.32em] uppercase mb-2.5"
          style={{
            color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Wedding photography · est. 2018
        </div>
        <h1
          className="text-[19px] leading-[1] font-medium mb-3"
          style={{
            color: "white",
            letterSpacing: "-0.03em",
            fontFamily: "var(--font-sans)",
          }}
        >
          Days that pass
          <br />
          faster than you&rsquo;ll
          <br />
          remember.
        </h1>
        <div className="flex items-center gap-3">
          <span
            className="px-2.5 py-1 text-[8.5px] tracking-[0.2em] uppercase"
            style={{
              background: "rgba(255,255,255,0.92)",
              color: "#0d0d0e",
              fontFamily: "var(--font-mono)",
            }}
          >
            Available dates
          </span>
          <span
            className="text-[8.5px] tracking-[0.2em] uppercase"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Booking through 2027
          </span>
        </div>
      </div>
    </div>
  );
}

export const cinematicStyle: StyleReference = {
  id: "cinematic",
  name: "Cinematic",
  tagline: "Image-led, dramatic, sparse text.",
  description:
    "For photographers, portfolios, fashion houses, and visual agencies. Full-bleed photography, big sans-display headlines, deep contrasts.",
  influences: ["Apple", "Loewe", "Rimowa", "Magnum Photos"],
  accent: "#1c1c1d",
  surface: "#0d0d0e",
  Preview: CinematicPreview,
  sampleSite,
  claudeBrief: `CINEMATIC STYLE BRIEF
─────────────────────

The brand sells through its image work. Copy is sparse, weighty, and stays out of the photograph's way. Read like Apple's product page, a Loewe campaign, or a Magnum photographer's bio.

VOICE RULES
- Big sans-serif display feel. Short, declarative sentences. Often fragments.
- Headlines under 8 words when possible. Stack them in 2-3 lines, not one long line.
- The headline does the emotional work. The body explains the offer.
- No exclamation marks. No emoji. No hedging.
- Lyrical, not literary. "Days that pass faster than you'll remember" — emotional truth, not metaphor pile-up.
- Numbers are anchors: "Twenty-two days a year." "Booking through 2027." "Thirty seats."
- Time-aware: "By Sunday." "This season." "Next spring."

STRUCTURAL CUES
- Hero headline: 5-8 words, broken across lines for cadence. Ends with a period.
- Hero subhead: 2 sentences. The first tells you what they do. The second tells you how scarce it is.
- Hero eyebrow: trade + provenance OR year established. "Wedding photography." / "Fashion editorial · since 2019."
- Hero CTA: a quiet button label that suggests scarcity. "See available dates" / "Request a fitting" / "Open your file."
- Social: Instagram is one perfect image + 1-2 line caption. X is a single line. LinkedIn is a short paragraph that respects the reader.
- Ad: ONE line of headline. Body is the photograph. CTA is action-noun, not verb. "Available dates." "The book."

EXAMPLES

GOOD HEADLINE: "Days that pass faster than you'll remember."
GOOD HEADLINE: "A bag with the weather built in."
BAD HEADLINE: "Capturing your special day with passion and creativity!"

GOOD SUBHEAD: "Twenty-two days a year. Booking through 2027."
BAD SUBHEAD: "We specialize in capturing the magic of your wedding day with our experienced team of photographers."

GOOD CTA: "See available dates" / "The book" / "Reserve a session"
BAD CTA: "Book now!" / "Contact us today" / "Get a quote"

NEVER
- "Capture" as a verb for taking photos. Everyone uses it. Don't.
- "Magic" / "magical" / "special day"
- "Passionate" / "passion-driven"
- Anything that sounds like a stock photographer template

The user picked this style because their work IS the visual. The copy serves the image — never competes with it.`,
};
