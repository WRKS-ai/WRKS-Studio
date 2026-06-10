// Style references = real brands the user picks to anchor the wow
// generation. Tells the agent "make my output feel like THIS."
//
// Why real brands instead of made-up "Editorial / Boutique" categories:
//   • Recognition is faster than reading. Most users know Aesop's vibe
//     instantly; nobody knows what "boutique style brief" means.
//   • Twelve real brands give twelve distinct outputs (briefs below
//     are prescriptive about voice, structure, and what to avoid).
//   • No more AI-template clichés ("EST. 2019", "№ 47") — brand names
//     ARE the reference, not invented placeholder copy.
//
// Each brand is a tile (the card IS the preview — no fake-website mock
// inside) plus a claudeBrief that gets concatenated into the wow API's
// system prompt via composeStyleBrief().

import type { ReactElement } from "react";

export type StyleReference = {
  id: string;
  name: string;
  tagline: string;
  /** "If you like X, you'll like this" chips. */
  influences: string[];
  /** Claude brief injected into the wow system prompt. */
  claudeBrief: string;
  /** Hex accent — used when this brand is selected as the pick highlight. */
  accent: string;
  /** Tile background hex / gradient. */
  surface: string;
  /** Whether the tile uses a dark or light text scheme. */
  scheme: "light" | "dark";
  /** Distinct visual identity rendered into the picker card. */
  Tile: () => ReactElement;
};

// ============================================================
// 1. APPLE
// ============================================================
const appleBrief = `APPLE STYLE BRIEF
─────────────────

Quiet confidence. The work is the marketing. The brand never raises its voice.

VOICE
- Sentences are SHORT. Often fragments. ("Faster. Smarter. Yours.")
- One declarative idea per sentence. Period. Then the next.
- No adjective stacking. "Beautifully designed" beats "incredibly beautifully designed."
- Use simple verbs. "Made" beats "engineered." "Built" beats "crafted."
- No exclamation marks. Ever.

STRUCTURE
- Hero headline: 3-7 words. Often a single noun phrase or imperative.
  Use line breaks to create rhythm.
- Hero subhead: 1-2 short sentences. Concrete, specific.
- CTA: 2-3 words. Verb-first. "Learn more.", "Buy.", "See pricing."
- Eyebrow: usually skipped, or a single category word in small caps.

EXAMPLES (good):
"Think different."
"Privacy. That's iPhone."
"There's more to iMac. Way more."

EXAMPLES (bad — never write like this):
"Revolutionary technology that transforms how you work!"
"Unlock your potential with our cutting-edge solution"

NEVER
- "Cutting-edge", "next-generation", "world-class", "innovative"
- Rhetorical questions ("Want to be productive?")
- Three-word power triplets
- Emoji`;

const AppleTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6"
    style={{
      background:
        "linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)",
    }}
  >
    <div
      className="font-sans"
      style={{
        fontSize: 48,
        fontWeight: 600,
        letterSpacing: "-0.04em",
        color: "#1d1d1f",
        lineHeight: 0.95,
      }}
    >
      Apple.
    </div>
    <div
      className="mt-4 font-sans text-center"
      style={{
        fontSize: 11,
        letterSpacing: "0.02em",
        color: "#86868b",
        maxWidth: "20ch",
      }}
    >
      Think different. Quietly.
    </div>
  </div>
);

const apple: StyleReference = {
  id: "apple",
  name: "Apple",
  tagline: "Quiet confidence. Less, said well.",
  influences: ["Bonobos", "Linear", "Things"],
  claudeBrief: appleBrief,
  accent: "#1d1d1f",
  surface: "#f5f5f7",
  scheme: "light",
  Tile: AppleTile,
};

// ============================================================
// 2. AESOP
// ============================================================
const aesopBrief = `AESOP STYLE BRIEF
─────────────────

Restraint. Considered. Reads like a serious magazine, never an ad.

VOICE
- Sentences are LONG but never run-on. Built with commas.
- Vocabulary is precise and slightly elevated. "Procure" not "buy."
  "Considered" not "thoughtful."
- Always present tense, declarative. Never future-promising.
- Use specifics: a number, a place, a year. Avoid abstractions.
- Speak about the work, not the customer. Describe what it IS.

STRUCTURE
- Hero headline: 8-14 words. A complete sentence. Often metaphorical.
  Always ends with a period.
- Hero subhead: 2-3 sentences. Sensory, specific. Describes the
  product's properties or origins, never benefits.
- CTA: correspondence-flavored. "Visit a store.", "Read more.",
  "Subscribe to the journal." Never "Get started" or "Sign up."
- Eyebrow: provenance + year. "Skincare. Est. 1987."

EXAMPLES (good):
"A botanical aromatique formulated for moments of needed pause."
"Soaps, shampoos, and skin care, created in Melbourne."

EXAMPLES (bad):
"Transform your skin with our amazing products!"
"The skincare brand changing the industry"

NEVER
- "Game-changing", "revolutionary", "incredible"
- Exclamation marks
- Direct address ("you'll love this")
- Rhetorical questions
- Emoji or icons`;

const AesopTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6"
    style={{ background: "#f0ead6" }}
  >
    <div
      className="font-serif italic"
      style={{
        fontSize: 54,
        fontWeight: 400,
        letterSpacing: "-0.02em",
        color: "#2b2018",
        lineHeight: 0.9,
      }}
    >
      Aesop.
    </div>
    <div
      className="mt-4 font-serif italic text-center"
      style={{
        fontSize: 11.5,
        letterSpacing: "0.02em",
        color: "#6b5d4f",
        maxWidth: "22ch",
        lineHeight: 1.5,
      }}
    >
      Restraint. Specifics. Never a sentence wasted.
    </div>
  </div>
);

const aesop: StyleReference = {
  id: "aesop",
  name: "Aesop",
  tagline: "Restraint, considered phrasing, no marketing-speak.",
  influences: ["Le Labo", "Diptyque", "Byredo"],
  claudeBrief: aesopBrief,
  accent: "#2b2018",
  surface: "#f0ead6",
  scheme: "light",
  Tile: AesopTile,
};

// ============================================================
// 3. LINEAR
// ============================================================
const linearBrief = `LINEAR STYLE BRIEF
──────────────────

Modern SaaS at its peak. Confident, technical, built for speed. Reads like
a changelog written by an engineer with taste.

VOICE
- Active voice, present tense, declarative.
- Sentences are TIGHT — 8-14 words. Often start with a verb.
- Use specific numbers and version-like precision. "v2.4", "ships Friday."
- No corporate softening. "Ship work, not status updates" beats
  "Help your team be more productive."
- One claim per sentence. Stack them for rhythm.

STRUCTURE
- Hero headline: 4-7 words. Bold claim. Often paired with second line that
  refines it. Ends with period.
- Hero subhead: 1-2 sentences, ~15-25 words. Names the specific things
  it replaces. Concrete mechanism.
- CTA: verb-first, 2-3 words. "Start free.", "Get started.", "See changelog."
- Eyebrow: version pill or category. "v2.4 — out now"

EXAMPLES (good):
"Linear is a better way to build products."
"Ship work, not status updates."
"Replaces standups, retros, and the weekly sync with one async loop."

EXAMPLES (bad):
"Empower your team with our innovative platform!"
"The all-in-one solution for modern teams"

NEVER
- "Empower", "innovative", "all-in-one", "platform" (just say what it is)
- Exclamation marks
- Vague benefit claims without mechanism`;

const LinearTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{
      background:
        "linear-gradient(135deg, #0a0a0c 0%, #1a0e2e 60%, #3d1d6e 100%)",
    }}
  >
    <div
      aria-hidden
      className="absolute"
      style={{
        top: "20%",
        right: "-30%",
        width: 200,
        height: 200,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(91,139,255,0.4), transparent 60%)",
        filter: "blur(40px)",
      }}
    />
    <div
      className="relative font-sans"
      style={{
        fontSize: 50,
        fontWeight: 600,
        letterSpacing: "-0.045em",
        color: "#ffffff",
        lineHeight: 0.95,
      }}
    >
      Linear.
    </div>
    <div
      className="mt-4 font-sans text-center relative"
      style={{
        fontSize: 11,
        letterSpacing: "0.02em",
        color: "rgba(255,255,255,0.6)",
        maxWidth: "22ch",
      }}
    >
      Ships every Friday. Built for speed.
    </div>
  </div>
);

const linear: StyleReference = {
  id: "linear",
  name: "Linear",
  tagline: "Modern SaaS. Confident. Built for speed.",
  influences: ["Vercel", "Raycast", "Cron"],
  claudeBrief: linearBrief,
  accent: "#5b8bff",
  surface: "#0a0a0c",
  scheme: "dark",
  Tile: LinearTile,
};

// ============================================================
// 4. STRIPE
// ============================================================
const stripeBrief = `STRIPE STYLE BRIEF
──────────────────

Professional, polished, technical without sounding cold. Builder energy with
adult confidence.

VOICE
- Calm, declarative sentences. Use "we" sparingly; usually "Stripe" as subject.
- Always say what something IS, then what it DOES, in that order.
- Technical accuracy matters. Use the actual word: "API", "webhook", "checkout."
- Sentences medium-length (12-20 words). One thought each.
- Light wit allowed but never punchy.

STRUCTURE
- Hero headline: 5-9 words. States the position. Often "X is Y."
- Hero subhead: 2-3 sentences. Names categories of customers. References specifics.
- CTA: verb-first. "Start with Stripe.", "Contact sales.", "Read the docs."
- Eyebrow: usually skipped or single category word.

EXAMPLES (good):
"Financial infrastructure for the internet."
"Millions of companies use Stripe to accept payments, send payouts, and manage
their businesses online."

EXAMPLES (bad):
"Revolutionize your payments today!"
"The best payment solution on the market"

NEVER
- Superlatives ("best", "leading", "#1")
- Exclamation marks
- Rhetorical questions
- "Game-changing", "disruptive", "world-class"`;

const StripeTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{ background: "#ffffff" }}
  >
    <div
      aria-hidden
      className="absolute inset-x-0 top-0 h-2"
      style={{
        background:
          "linear-gradient(90deg, #635bff 0%, #00d4ff 50%, #ff80b5 100%)",
      }}
    />
    <div
      className="font-sans"
      style={{
        fontSize: 50,
        fontWeight: 700,
        letterSpacing: "-0.035em",
        color: "#0a2540",
        lineHeight: 0.95,
      }}
    >
      Stripe.
    </div>
    <div
      className="mt-4 font-sans text-center"
      style={{
        fontSize: 11,
        letterSpacing: "0.02em",
        color: "#425466",
        maxWidth: "22ch",
        lineHeight: 1.5,
      }}
    >
      Polished. Technical. Adult.
    </div>
  </div>
);

const stripe: StyleReference = {
  id: "stripe",
  name: "Stripe",
  tagline: "Polished, technical, adult confidence.",
  influences: ["Plaid", "Modern Treasury", "Mercury"],
  claudeBrief: stripeBrief,
  accent: "#635bff",
  surface: "#ffffff",
  scheme: "light",
  Tile: StripeTile,
};

// ============================================================
// 5. PATAGONIA
// ============================================================
const patagoniaBrief = `PATAGONIA STYLE BRIEF
─────────────────────

Mission-driven. Rugged. Honest. The work matters because the planet matters.
Speaks like someone who has actually been outside.

VOICE
- First-person plural ("we") and second-person ("you") allowed and warm.
- Concrete: name the river, the mountain, the year, the gear.
- Mission-led: name the cause specifically (climate, repair, sourcing).
- Imperative voice for CTAs. "Buy used." "Repair, don't replace."
- Sentences are medium-long (15-25 words). Conversational, not corporate.

STRUCTURE
- Hero headline: 6-10 words. Often a directive or principle.
- Hero subhead: 2-3 sentences. Names specifics — places, years, percentages.
- CTA: action-verb plus concrete object. "Find a repair center.", "Shop used gear."
- Eyebrow: category + year founded. "Outdoor apparel. Since 1973."

EXAMPLES (good):
"We're in business to save our home planet."
"Don't buy this jacket unless you need it."
"Repair, recycle, and resell — that's the plan."

EXAMPLES (bad):
"Premium outdoor gear for active lifestyles"
"Experience the great outdoors with us!"

NEVER
- "Active lifestyles", "experience the outdoors", "premium gear"
- Vague aspiration without specifics
- Exclamation marks unless directly quoted
- Marketing-speak about "performance" without naming the performance`;

const PatagoniaTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{
      background: "linear-gradient(180deg, #c4682b 0%, #a04d1a 100%)",
    }}
  >
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-0"
      style={{
        height: "30%",
        background:
          "linear-gradient(180deg, transparent, rgba(20,10,5,0.5))",
        clipPath: "polygon(0 100%, 15% 30%, 28% 50%, 42% 10%, 55% 35%, 70% 5%, 85% 40%, 100% 25%, 100% 100%)",
      }}
    />
    <div
      className="relative font-sans"
      style={{
        fontSize: 44,
        fontWeight: 800,
        letterSpacing: "0.05em",
        color: "#fff8eb",
        lineHeight: 0.95,
        textTransform: "uppercase",
      }}
    >
      Patagonia
    </div>
    <div
      className="mt-4 font-sans text-center relative"
      style={{
        fontSize: 11,
        letterSpacing: "0.02em",
        color: "rgba(255,248,235,0.8)",
        maxWidth: "22ch",
      }}
    >
      Mission. Rugged. Honest.
    </div>
  </div>
);

const patagonia: StyleReference = {
  id: "patagonia",
  name: "Patagonia",
  tagline: "Mission-driven. Rugged. Built to last.",
  influences: ["REI", "Filson", "Yeti"],
  claudeBrief: patagoniaBrief,
  accent: "#c4682b",
  surface: "#a04d1a",
  scheme: "dark",
  Tile: PatagoniaTile,
};

// ============================================================
// 6. OFF-WHITE
// ============================================================
const offWhiteBrief = `OFF-WHITE STYLE BRIEF
─────────────────────

Bold, graphic, ironic. Streetwear with art-school energy. Uses quotation marks
as design elements. Self-aware about brand language.

VOICE
- All caps allowed and often correct. Headlines IN CAPS hit harder.
- Words in "QUOTATION MARKS" used as both label and irony.
- Short, declarative, punchy. 3-6 word phrases stacked.
- Reference design, art, music. Drop names of collaborators, cities, years.
- Direct address to the reader is fine and confident.

STRUCTURE
- Hero headline: 3-6 words, often ALL CAPS. Includes "quotation marks"
  on a key word for emphasis/irony.
- Hero subhead: 1-2 short sentences. Drops a year, collab, or city.
- CTA: imperative, often "SHOP", "ENTER", "GET ACCESS." All caps.
- Eyebrow: collection number + season. "C/O VIRGIL ABLOH" / "SS24"

EXAMPLES (good):
"FOR "WALKING""
"THE TEN — A REIMAGINING OF ICONIC NIKE SILHOUETTES"
"\"NOT FOR\" SALE — JUST KIDDING"

EXAMPLES (bad):
"Discover our amazing collection"
"Elevate your style with our premium pieces"

NEVER
- Soft marketing language
- "Elevate", "amazing", "premium" (use "FOR" in quotes ironically instead)
- Lowercase headlines (caps is the move)
- Excessive description — let the references and irony carry it`;

const OffWhiteTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{ background: "#fcd757" }}
  >
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "repeating-linear-gradient(45deg, transparent, transparent 28px, rgba(0,0,0,0.04) 28px, rgba(0,0,0,0.04) 32px)",
      }}
    />
    <div
      className="relative font-sans text-center"
      style={{
        fontSize: 42,
        fontWeight: 900,
        letterSpacing: "-0.01em",
        color: "#0a0a0a",
        lineHeight: 0.95,
        textTransform: "uppercase",
      }}
    >
      "OFF-WHITE"
    </div>
    <div
      className="mt-4 font-sans text-center relative"
      style={{
        fontSize: 10.5,
        letterSpacing: "0.18em",
        color: "rgba(10,10,10,0.7)",
        maxWidth: "22ch",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      "CAPS" — IRONIC, BOLD
    </div>
  </div>
);

const offWhite: StyleReference = {
  id: "off-white",
  name: "Off-White",
  tagline: "Bold, graphic, ironic. Streetwear energy.",
  influences: ["Supreme", "Fear of God", "Cactus Plant"],
  claudeBrief: offWhiteBrief,
  accent: "#0a0a0a",
  surface: "#fcd757",
  scheme: "light",
  Tile: OffWhiteTile,
};

// ============================================================
// 7. SUBSTACK
// ============================================================
const substackBrief = `SUBSTACK STYLE BRIEF
────────────────────

Editorial publishing. Warm, considered, writer-first. The reader is a thinking
adult who came here voluntarily.

VOICE
- Conversational but elevated. Like talking to a friend who's read widely.
- First person allowed and welcome. Second person ("you") in moderation.
- Specifics over generalities. Name the book, the year, the person.
- Use em dashes — for rhythm — and parenthetical asides (when natural).
- Sentences vary in length on purpose. Short. Then a longer one that
  builds with subordinate clauses for rhythm. Then short again.

STRUCTURE
- Hero headline: 6-12 words. Often a complete sentence. Curiosity-driven.
  Can include a question or surprising claim.
- Hero subhead: 2-3 sentences. Sets up the value of subscribing in writer terms,
  not marketing terms.
- CTA: correspondence-flavored. "Subscribe.", "Read the latest.", "Get the newsletter."
- Eyebrow: rarely used. If used: "A newsletter by [name]."

EXAMPLES (good):
"The kind of writing the internet was supposed to make possible."
"Where good writers find readers who pay them directly."

EXAMPLES (bad):
"Premium content for serious readers!"
"The ultimate newsletter platform"

NEVER
- "Content" (use "writing", "essays", "letters")
- "Platform" (use "place", "home", or just don't name it)
- Exclamation marks
- Three-word power phrases`;

const SubstackTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{ background: "#fffaeb" }}
  >
    <div
      className="font-serif italic"
      style={{
        fontSize: 50,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: "#1c1917",
        lineHeight: 0.95,
      }}
    >
      Substack
    </div>
    <div
      className="mt-3 font-serif italic"
      style={{
        fontSize: 14,
        color: "#ff6719",
      }}
    >
      Read more →
    </div>
    <div
      className="mt-4 font-serif italic text-center"
      style={{
        fontSize: 11.5,
        letterSpacing: "0.01em",
        color: "#78716c",
        maxWidth: "22ch",
        lineHeight: 1.5,
      }}
    >
      Writer-first. Warm. Considered.
    </div>
  </div>
);

const substack: StyleReference = {
  id: "substack",
  name: "Substack",
  tagline: "Editorial publishing. Warm, considered, writer-first.",
  influences: ["Read.cv", "The Browser", "Squeaky Wheel"],
  claudeBrief: substackBrief,
  accent: "#ff6719",
  surface: "#fffaeb",
  scheme: "light",
  Tile: SubstackTile,
};

// ============================================================
// 8. NOTION
// ============================================================
const notionBrief = `NOTION STYLE BRIEF
──────────────────

Calm, productive, friendly with structure. Like a thoughtful coworker who's
organized but not uptight.

VOICE
- Plain, clear, warm. Avoid jargon and corporate speak.
- Use "your" frequently — Notion is personal-feeling software.
- Sentences are medium-length (10-18 words). Direct subject-verb-object.
- Specific verbs: "write", "build", "track", "share."
- Lists are welcome. Notion's whole vibe is "structured but human."

STRUCTURE
- Hero headline: 5-9 words. Often pairs two functions ("Write, plan, share").
- Hero subhead: 1-2 sentences. Names what it replaces, mentions teams.
- CTA: 2-3 words, plain verb. "Get Notion free.", "Try Notion.", "Get started."
- Eyebrow: category, no fluff. "Notes & Docs."

EXAMPLES (good):
"One tool for your whole team. Write, plan, share, and get organized."
"Notion is the connected workspace where better, faster work happens."

EXAMPLES (bad):
"Revolutionize how your team collaborates!"
"The ultimate productivity platform for modern teams"

NEVER
- "Revolutionize", "transform", "next-generation"
- Exclamation marks (rare exception for genuine enthusiasm only)
- Empty buzzwords without naming what they mean`;

const NotionTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{ background: "#ffffff" }}
  >
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(0deg, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
    <div
      className="relative font-sans"
      style={{
        fontSize: 50,
        fontWeight: 600,
        letterSpacing: "-0.04em",
        color: "#1f1f1f",
        lineHeight: 0.95,
      }}
    >
      Notion
    </div>
    <div
      className="mt-4 font-sans text-center relative"
      style={{
        fontSize: 11,
        letterSpacing: "0.005em",
        color: "#6b6b6b",
        maxWidth: "22ch",
      }}
    >
      Calm. Friendly. Structured.
    </div>
  </div>
);

const notion: StyleReference = {
  id: "notion",
  name: "Notion",
  tagline: "Calm, productive. Friendly with structure.",
  influences: ["Coda", "Things", "Linear"],
  claudeBrief: notionBrief,
  accent: "#000000",
  surface: "#ffffff",
  scheme: "light",
  Tile: NotionTile,
};

// ============================================================
// 9. GLOSSIER
// ============================================================
const glossierBrief = `GLOSSIER STYLE BRIEF
────────────────────

Soft, accessible, conversational. Beauty-first. The reader is a friend who
shares their own routine.

VOICE
- Lowercase often correct (in headlines, in social).
- Lots of "you" and "your". Direct, warm, never preachy.
- Sentences are short and chatty. (16 words max.)
- Use sensory adjectives sparingly but well: "milky", "weightless", "dewy".
- Drop pronouns sometimes for rhythm. "Wear it everywhere. Forget you have it on."

STRUCTURE
- Hero headline: 4-8 words. Lowercase or sentence case. Includes the product
  benefit as a feeling, not a feature.
- Hero subhead: 1-2 sentences. Describes the texture, the moment, the feeling.
- CTA: friendly. "Shop now.", "Try it.", "Add to bag."
- Eyebrow: category in lowercase. "skincare." or "Skin Tint."

EXAMPLES (good):
"skin first. makeup second."
"the milky jelly cleanser everyone is obsessed with."
"a weightless skin tint, in 12 shades."

EXAMPLES (bad):
"Revolutionary beauty products for the modern woman!"
"Discover our premium luxury skincare collection"

NEVER
- "Revolutionary", "premium", "luxury" (these read tone-deaf for the brand)
- Hard-sell CTAs
- All-caps headlines
- Exclamation marks (rare exception: friendly aside)`;

const GlossierTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{ background: "#fbd5d5" }}
  >
    <div
      aria-hidden
      className="absolute"
      style={{
        top: "20%",
        right: "15%",
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.4)",
        filter: "blur(20px)",
      }}
    />
    <div
      className="relative font-sans"
      style={{
        fontSize: 48,
        fontWeight: 500,
        letterSpacing: "-0.03em",
        color: "#1a0a0e",
        lineHeight: 0.95,
        textTransform: "lowercase",
      }}
    >
      glossier.
    </div>
    <div
      className="mt-4 font-sans text-center relative"
      style={{
        fontSize: 11,
        letterSpacing: "0.005em",
        color: "rgba(26,10,14,0.6)",
        maxWidth: "22ch",
        textTransform: "lowercase",
      }}
    >
      skin first. soft. accessible.
    </div>
  </div>
);

const glossier: StyleReference = {
  id: "glossier",
  name: "Glossier",
  tagline: "Soft, accessible, conversational. Beauty-first.",
  influences: ["Topicals", "Rare Beauty", "Drunk Elephant"],
  claudeBrief: glossierBrief,
  accent: "#f4afa8",
  surface: "#fbd5d5",
  scheme: "light",
  Tile: GlossierTile,
};

// ============================================================
// 10. CARHARTT WIP
// ============================================================
const carharttBrief = `CARHARTT STYLE BRIEF
────────────────────

Workwear honesty. No frills. Built to be used, not displayed. Speaks in plain
trade-shop English.

VOICE
- Direct and concrete. Name the material, the construction, the weight.
- Sentences are SHORT (8-14 words). Statements, not promises.
- Spec-led: "12-oz canvas. Triple-stitched. Made in Mexico."
- No purple prose. No emotional appeals. The work makes the case.
- Use trade/construction vocabulary correctly: "duck canvas", "rivets",
  "selvedge", "double-knee."

STRUCTURE
- Hero headline: 3-6 words. Often the product name + a spec.
  ("Double Knee. 12 oz duck.")
- Hero subhead: 1-2 sentences listing build details + use case.
- CTA: imperative, plain. "Shop the line.", "Find a stockist.", "Add to cart."
- Eyebrow: category in caps. "WORKWEAR" / "DETROIT, MI."

EXAMPLES (good):
"Built for work. Worn for life."
"12 oz duck canvas. Triple-stitched. Made for the job."

EXAMPLES (bad):
"Experience the legendary craftsmanship!"
"Premium workwear for the modern adventurer"

NEVER
- "Legendary", "premium", "luxury", "adventurer"
- Emotional appeals about lifestyle
- Exclamation marks
- Adjective stacking`;

const CarharttTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{ background: "#b88746" }}
  >
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.05) 38px, rgba(0,0,0,0.05) 39px)",
      }}
    />
    <div
      className="relative font-sans text-center"
      style={{
        fontSize: 38,
        fontWeight: 900,
        letterSpacing: "0.01em",
        color: "#0a0a0a",
        lineHeight: 0.9,
        textTransform: "uppercase",
      }}
    >
      Carhartt
      <div
        style={{
          fontSize: 13,
          letterSpacing: "0.32em",
          marginTop: 6,
          fontWeight: 700,
          color: "rgba(10,10,10,0.7)",
        }}
      >
        WIP
      </div>
    </div>
    <div
      className="mt-4 font-sans text-center relative"
      style={{
        fontSize: 11,
        letterSpacing: "0.18em",
        color: "rgba(10,10,10,0.7)",
        maxWidth: "22ch",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      Built. Used. Spec-led.
    </div>
  </div>
);

const carhartt: StyleReference = {
  id: "carhartt",
  name: "Carhartt WIP",
  tagline: "Workwear honesty. No frills. Built for use.",
  influences: ["Dickies", "Red Wing", "Filson"],
  claudeBrief: carharttBrief,
  accent: "#b88746",
  surface: "#a87038",
  scheme: "dark",
  Tile: CarharttTile,
};

// ============================================================
// 11. NIKE
// ============================================================
const nikeBrief = `NIKE STYLE BRIEF
────────────────

Athletic, bold, motivational. Verb-first imperatives. Speaks to the athlete in
everyone — including the one who hasn't started yet.

VOICE
- IMPERATIVE. Start with a verb. "Run.", "Try.", "Go again."
- Short, punchy sentences. 4-10 words. Stack them for force.
- Direct address constant. "You" throughout.
- Reference movement, sweat, time, distance, effort. Not benefits.
- Slight aspirational edge — but rooted in the WORK, not the result.

STRUCTURE
- Hero headline: 2-4 words. Imperative or noun phrase. Often ends with period.
- Hero subhead: 1-2 punchy sentences. Names the athlete, the moment, the gear.
- CTA: 1-2 words, verb-first. "Shop.", "Try Nike.", "Start training."
- Eyebrow: sport or athlete name. "RUNNING." / "FOR ALL ATHLETES."

EXAMPLES (good):
"Just do it."
"There is no finish line."
"Find your greatness."

EXAMPLES (bad):
"Experience our incredible performance gear"
"The ultimate athletic wear collection"

NEVER
- Soft language
- Long, explanatory sentences
- "Experience", "incredible", "ultimate"
- Anything that doesn't make you want to lace up`;

const NikeTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{
      background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)",
    }}
  >
    <div
      aria-hidden
      className="absolute"
      style={{
        top: "30%",
        left: "10%",
        right: "10%",
        height: 1,
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
      }}
    />
    <div
      className="relative font-sans italic"
      style={{
        fontSize: 60,
        fontWeight: 900,
        letterSpacing: "-0.04em",
        color: "#ffffff",
        lineHeight: 0.9,
        textTransform: "uppercase",
      }}
    >
      Nike.
    </div>
    <div
      className="mt-4 font-sans text-center relative"
      style={{
        fontSize: 11,
        letterSpacing: "0.18em",
        color: "rgba(255,255,255,0.5)",
        maxWidth: "22ch",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      Just do it.
    </div>
  </div>
);

const nike: StyleReference = {
  id: "nike",
  name: "Nike",
  tagline: "Athletic, bold, motivational. Verb-first.",
  influences: ["Adidas", "Under Armour", "On Running"],
  claudeBrief: nikeBrief,
  accent: "#ffffff",
  surface: "#0a0a0a",
  scheme: "dark",
  Tile: NikeTile,
};

// ============================================================
// 12. THE BROWSER COMPANY
// ============================================================
const browserCoBrief = `THE BROWSER COMPANY STYLE BRIEF
────────────────────────────────

Playful, expressive, modern internet. Software that feels handmade. Confident
enough to be weird.

VOICE
- Sentences vary widely in length on purpose. Tonal play matters.
- Use unexpected word choices: "delightful", "ambient", "soft."
- First-person plural ("we") warmly. Talks like a small team that cares.
- Includes some genuine emotion — wonder, joy, frustration with the status quo.
- Mix tonal registers: a poetic claim followed by a plain spec.

STRUCTURE
- Hero headline: 5-10 words. Often a claim that sounds slightly literary.
  Can end in period or em dash for rhythm.
- Hero subhead: 2-3 sentences. Sets up emotional stakes + the actual product.
- CTA: friendly + slightly poetic. "Try Arc.", "Get it on Mac.", "Join the wait."
- Eyebrow: small but expressive. "A new browser." / "Made by humans."

EXAMPLES (good):
"The Internet computer."
"A browser that feels like the future, but with a soft edge."
"Built for people who use the internet a lot."

EXAMPLES (bad):
"Revolutionize your browsing experience!"
"The most innovative browser ever made"

NEVER
- "Revolutionize", "experience", "innovative" (the brand prides itself on
  rejecting tech-bro vocabulary)
- Tagline-y three-word power phrases
- All caps headlines`;

const BrowserCoTile = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
    style={{
      background:
        "linear-gradient(135deg, #f4a3ff 0%, #a3c4ff 50%, #ffd4a3 100%)",
    }}
  >
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 30% 70%, rgba(255,255,255,0.4), transparent 70%)",
      }}
    />
    <div
      className="relative font-serif italic text-center"
      style={{
        fontSize: 36,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: "#1a0a3e",
        lineHeight: 0.95,
      }}
    >
      The Browser
      <br />
      Company
    </div>
    <div
      className="mt-4 font-serif italic text-center relative"
      style={{
        fontSize: 11.5,
        letterSpacing: "0.01em",
        color: "rgba(26,10,62,0.7)",
        maxWidth: "22ch",
      }}
    >
      Playful. Expressive. Handmade.
    </div>
  </div>
);

const browserCo: StyleReference = {
  id: "browser-co",
  name: "The Browser Co.",
  tagline: "Playful, expressive, modern internet.",
  influences: ["Arc", "Pitch", "Raycast"],
  claudeBrief: browserCoBrief,
  accent: "#a3c4ff",
  surface: "#f4a3ff",
  scheme: "light",
  Tile: BrowserCoTile,
};

// ============================================================
// Registry + brief composer
// ============================================================

export const STYLE_REFERENCES: StyleReference[] = [
  apple,
  aesop,
  linear,
  stripe,
  patagonia,
  offWhite,
  substack,
  notion,
  glossier,
  carhartt,
  nike,
  browserCo,
];

export function getStyleReference(id: string): StyleReference | null {
  return STYLE_REFERENCES.find((s) => s.id === id) ?? null;
}

/**
 * Combine the picked brands' briefs into a single injection block
 * appended to the wow system prompt. The order of picks is preserved
 * so the dominant brand (first pick) gets emphasized.
 */
export function composeStyleBrief(ids: string[]): string {
  const refs = ids
    .map((id) => getStyleReference(id))
    .filter((r): r is StyleReference => !!r);
  if (refs.length === 0) return "";

  if (refs.length === 1) {
    return `\n═══════════════════════════════════════════════════
STYLE REFERENCE — THE USER PICKED THIS BRAND
═══════════════════════════════════════════════════

The user chose "${refs[0].name}" as their style reference. Read the brief
below and let it shape EVERY piece of copy you write — voice, sentence length,
cadence, structure, vocabulary, what to avoid. The Hero, Features, Social, and
Ad all need to read like a "${refs[0].name}" output.

${refs[0].claudeBrief}

If your output doesn't sound like the brief above, rewrite it.
`;
  }

  const names = refs.map((r) => `"${r.name}"`).join(" + ");
  return `\n═══════════════════════════════════════════════════
STYLE REFERENCES — THE USER PICKED MULTIPLE BRANDS
═══════════════════════════════════════════════════

The user chose ${names} as their style references. ${refs[0].name} is the
DOMINANT brand — borrow its voice and structure first. Then blend in cues
from the others where they reinforce the same direction; drop them where
they conflict. Never average — pick a direction and commit.

${refs.map((r, i) => `── REFERENCE ${i + 1}: ${r.name.toUpperCase()} ${i === 0 ? "(DOMINANT)" : ""} ──\n${r.claudeBrief}`).join("\n\n")}

If your output doesn't visibly carry the influence of these brands, rewrite it.
Don't write generic "professional" copy — be specific to ${refs[0].name}'s voice.
`;
}
