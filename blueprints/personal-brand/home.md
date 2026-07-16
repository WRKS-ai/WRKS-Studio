# HOME — Personal-brand homepage composition

> **What this file is**: the ordered composition of section families that
> make up a personal-brand homepage. It says WHICH sections render, in
> WHAT order, with WHAT page-level constraints.
>
> **What this file is NOT**: the section specs. Each section's full
> per-element spec (dimensions, typography, CSS, copy rules, fallbacks,
> assembled HTML reference) lives in its own file under
> [`sections/`](./sections/).
>
> **How Opus reads it**: this file first (page-level plan) → then each
> referenced section MD (per-section spec) → then user's ingested brand
> data → emit one complete HTML document.

---

## Provenance

Extracted from [billfanter.com](https://www.billfanter.com) — the reference
site for the personal-brand vertical. Every CSS value, layout choice, and
copy rule in the section MDs has been cross-referenced against that site's
actual production code.

**Applies to**: founders selling a masterclass + community + free lead magnet.
**Voice descriptors this composition works for**: `bold`, `warm`, `expert`, `professional`.
Not recommended for: `playful` (use `personal-brand-playful/home.md` when it
lands), `quiet` (use `personal-brand-quiet/home.md`).

---

## Global constraints (inherit from [DESIGN.md](../DESIGN.md))

- **Container**: `max-width: 1180px`, horizontal padding `40px` desktop / `24px` mobile (≤767px)
- **Typography**: single-family Geist (display + body), Geist Mono for eyebrows / labels
- **Palette**: HARD-CONSTRAINED to user's `brand_palette` when ingested; fall back to voice-descriptor default per DESIGN.md
- **Spacing scale**: only `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 88 / 100 / 120 / 168`
- **Motion**: `transform` + `opacity` only; enter = spring stiff 100 / damp 20; hover = 200ms ease-out
- **Bans, taxonomy, HTML output rules**: all inherited from DESIGN.md — do not restate

---

## Above-the-fold intent (Hero + top of MegaBento in first viewport)

The visitor's first 3 seconds must deliver:

1. **One clear promise** — headline states the outcome, not the method
2. **Who's teaching** — portrait + name + one-line credential
3. **One social-proof signal** — star rating + student count
4. **Two escape hatches** — primary CTA (buy) + secondary CTA (community)

Everything below the hero exists to reinforce or unpack these four.

---

## Page structure — 10 sections in exact order

```
Nav          → nav-card-dropdown-overlay        (overlays hero, position: absolute)
Hero         → hero-dark-portrait-split         (position 1)
MegaBento    → mega-bento-6tile                 (position 2)
Watchlist    → lead-magnet-split-form           (position 3)
Community    → community-screenshot-benefits    (position 4)
HelpGrid     → help-grid-3col-icon              (position 5)
Spotlight    → spotlight-cta-full-bleed         (position 6)
HeroSplit    → hero-split-media-copy-bento      (position 7)
Reviews      → reviews-video-plus-wall          (position 8)
YoutubeCta   → social-cta-dark-card-with-reel   (position 9)
AboutFounder → long-form-founder-split          (position 10 — closer)
```

### Visual rhythm

Alternating dark/light with two dark cards embedded in light sections for punctuation:

| # | Section | Background | Tone |
|---|---|---|---|
| 0 | Nav | white (overlays hero) | chrome |
| 1 | Hero | `#0a0a0a` | dark stage |
| 2 | MegaBento | transparent (light fade) | light |
| 3 | Watchlist | transparent (continues fade) | light |
| 4 | Community | `#ffffff` (hard cut) | light |
| 5 | HelpGrid | `#ffffff` | light |
| 6 | Spotlight | dark card on transparent | dark card on light |
| 7 | HeroSplit | `#ffffff` | light |
| 8 | Reviews | `var(--bg-2)` neutral grey | light-grey |
| 9 | YoutubeCta | dark card on transparent | dark card on light |
| 10 | AboutFounder | `#ffffff` | light close |

**Reasoning**: darkness at start (hero) commands attention. A single unbroken run of light sections (2-8) reads as one editorial spread — the two dark cards (Spotlight, YoutubeCta) are visual punctuation, not stage changes. AboutFounder closes on light for a quiet reading environment before footer.

---

## Section index — full spec per section

Every entry below points to a self-contained MD spec. Each spec contains: wrapper dimensions, layered stack, per-element CSS, copy writing rules with good/bad examples, content-slot schema (TypeScript), fallbacks matrix, complete assembled HTML reference, interactive behaviors, responsive breakpoints, accessibility + performance checklists, design token dependencies, rationale, and don'ts.

| # | Section | Spec | Purpose |
|---|---|---|---|
| 0 | Nav | [sections/nav.md](./sections/nav.md) | Primary site navigation. Overlays hero, colored-card dropdowns with Stripe-style backdrop blur. |
| 1 | Hero | [sections/hero.md](./sections/hero.md) | Instant credibility + one clear promise + primary conversion action. Dark stage + portrait right. |
| 2 | MegaBento | [sections/mega-bento.md](./sections/mega-bento.md) | 6-tile grid. Single-glance overview of every product/asset, ranked by conversion intent. |
| 3 | Watchlist | [sections/watchlist.md](./sections/watchlist.md) | Lead-magnet capture. Copy + form LEFT, preview visual RIGHT. The exchange moment. |
| 4 | Community | [sections/community.md](./sections/community.md) | Real screenshot LEFT + numbered benefits RIGHT + CTA. Turns "community" from abstract into visual proof. |
| 5 | HelpGrid | [sections/help-grid.md](./sections/help-grid.md) | 3 icon cards. Parallel value props for the scanner who won't read the founder story. |
| 6 | Spotlight | [sections/spotlight.md](./sections/spotlight.md) | Full-bleed dark 16:5 card. Single mid-page conversion moment ("if you take one action, take this"). |
| 7 | HeroSplit | [sections/hero-split.md](./sections/hero-split.md) | Media LEFT (video + quote + photo) + copy RIGHT. Mid-page founder introduction in 3 formats. |
| 8 | Reviews | [sections/reviews.md](./sections/reviews.md) | 3 video testimonials + LinkedIn-style screenshot wall. The heavyweight social-proof block. |
| 9 | YoutubeCta | [sections/youtube-cta.md](./sections/youtube-cta.md) | Dark card driving external social platform (YouTube channel, etc.). "Keep me in your life" beat. |
| 10 | AboutFounder | [sections/about-founder.md](./sections/about-founder.md) | Long-form founder story. Portrait + signature + first-person paragraphs. Emotional close. |

---

## Global JSON schema — what Opus receives

Composed from each section's own content schema:

```typescript
type PersonalBrandHomeContent = {
  // Global brand data (from deep ingest)
  brand: {
    name: string;
    palette: {
      primary: string;
      secondary: string;
      tertiary: string;
      neutralWarm: string;
      neutralDark: string;
    };
    typefaces: {
      display: string;                    // Geist Sans by default
      body: string;
      mono: string;
    };
    voiceDescriptor: 'bold' | 'warm' | 'expert' | 'professional' | 'playful' | 'quiet';
    logo: { src: string; alt: string; };
    contactEmail: string;
  };

  // Per-section content
  nav: NavContent;                        // see sections/nav.md
  hero: HeroContent;                      // see sections/hero.md
  megaBento: MegaBentoContent;
  watchlist: WatchlistContent;
  community: CommunityContent;
  helpGrid: HelpGridContent;
  spotlight: SpotlightContent;
  heroSplit: HeroSplitContent;
  reviews: ReviewsContent;
  youtubeCta: YoutubeCtaContent;
  aboutFounder: AboutFounderContent;
};
```

Each `*Content` type is defined fully inside its own section MD.

---

## Content sharing across sections (Opus generation rules)

Some content slots recur across sections. When Opus generates copy, these must be consistent:

| Slot | Where it appears | Rule |
|---|---|---|
| Founder name | `hero.namecard.name`, `heroSplit.eyebrow` (implicit), `aboutFounder.eyebrow` (implicit), `aboutFounder.photo.alt`, `nav.logo.alt` | ONE canonical spelling. Never mix "Bill" and "William Fanter". |
| Trust label + rating + count | `hero.trust`, `heroSplit.trust` | Same numbers. Never inflate on second appearance. |
| Primary CTA | `hero.primaryCta`, `nav.buttonHref`, potentially `spotlight.cta` | Same destination URL, same or near-same label. |
| Portrait photo | `hero.portraitImage`, `heroSplit.photo`, `aboutFounder.photo` | Three DIFFERENT photos ideally (studio for hero, candid for heroSplit, environmental for aboutFounder). If only one photo available, use it in `hero` only; skip photos in the other two. |
| Testimonial quotes | `megaBento.reviews.testimonials`, `heroSplit.quote`, `reviews.videoVimeoIds` (video) | Never repeat the same quote across sections. If limited testimonials, prioritize `reviews` (video) > `heroSplit.quote` > `megaBento` (skip if scarce). |
| Brand accent color | Eyebrow on `watchlist`, video-icon circle on `spotlight`, gradient stops throughout | Same accent color from `brand.palette.primary`. |

---

## Fallback matrix — when the user's brand data is thin

If the user's site had minimal extractable content, sections may need to swap or drop:

| Missing data | Impact | Fallback |
|---|---|---|
| No testimonials at all | Reviews + MegaBento reviews tile + HeroSplit quote tile | Drop Reviews section entirely; replace MegaBento reviews tile with another gradient tile; drop HeroSplit quote tile (2-tile bento). |
| No founder photo | Hero portrait + HeroSplit photo + AboutFounder photo | Use palette-gradient fallback in Hero (see hero.md §9). Skip HeroSplit photo tile. Use initials-in-gradient placeholder in AboutFounder. |
| No lead-magnet asset | Watchlist section | Swap Watchlist → HelpGrid variant with 4 cards instead of 3 (fills the position). |
| No external social channel | YoutubeCta section | Drop the section entirely; page becomes 9 sections. |
| Fewer than 3 products/offerings | MegaBento | Swap to `mega-bento-4tile` variant. If <4, drop MegaBento entirely and expand HelpGrid to `help-grid-4col-icon`. |
| No community | Community section + MegaBento community tile | Drop Community section entirely; replace MegaBento community tile with another gradient tile. |
| No video content | HeroSplit video tile + Reviews video grid | Replace HeroSplit video with photo pillar. Drop Reviews video row; wall-only. |

Never leave a section rendered with empty placeholders. Either fill fully or drop cleanly.

---

## Generation instructions for Opus

When emitting the full HTML document:

1. **Read [DESIGN.md](../DESIGN.md) first** — global taste + bans + tokens.
2. **Read each section MD in order** — each is self-contained; each has its own assembled HTML reference.
3. **Inject brand data** — palette, typefaces, voice descriptor before assembling copy.
4. **Emit ONE complete `<html>` document** — doctype, head (meta + preconnect + Google Fonts + Tailwind CDN + inline `<style>` for CSS variables), body (sections in order).
5. **Every editable element gets `data-edit-id="section.slot"`** — future inline editor targets this.
6. **Every image gets `alt`** — informative or empty per DESIGN.md a11y baseline.
7. **Progressive enhancement only** — every section must render fully without JS. JS is for CardNav dropdowns, Vimeo lightbox, grainient animations only.
8. **Test the fallbacks** — if a section's content is thin, apply that section's fallback rules from its MD.

### HTML document skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{brand.name} — {hero.headline}</title>
  <meta name="description" content="{hero.subhead}">

  <!-- OG -->
  <meta property="og:title" content="{brand.name}">
  <meta property="og:description" content="{hero.subhead}">
  <meta property="og:image" content="{hero.portraitImage}">
  <meta property="og:type" content="website">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@500;600;700&display=swap" rel="stylesheet">

  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Design tokens as CSS variables (brand-derived) -->
  <style>
    :root {
      --font-display: 'Geist', sans-serif;
      --font-body: 'Geist', sans-serif;
      --font-mono: 'Geist Mono', ui-monospace, monospace;
      --primary: {brand.palette.primary};
      --secondary: {brand.palette.secondary};
      --tertiary: {brand.palette.tertiary};
      --neutral-warm: {brand.palette.neutralWarm};
      --neutral-dark: {brand.palette.neutralDark};
      --text: #0a0a0a;
      --text-muted: #565656;
      --bg-2: #f1f5fb;
      --border: rgba(10, 10, 10, 0.08);
      --radius-lg: 20px;
      --container: 1180px;
      --section-pad: 100px;
    }
    /* Global resets, prefers-reduced-motion, focus styles inherited from DESIGN.md */
  </style>
</head>
<body>
  <a href="#main" class="sr-only">Skip to content</a>

  <!-- Nav mounts here — position: absolute overlays hero below -->
  {NAV HTML — see sections/nav.md §13}

  <main id="main">
    {HERO HTML         — see sections/hero.md §10}
    {MEGA-BENTO HTML   — see sections/mega-bento.md §14}
    {WATCHLIST HTML    — see sections/watchlist.md §8}
    {COMMUNITY HTML    — see sections/community.md §9}
    {HELP-GRID HTML    — see sections/help-grid.md §10}
    {SPOTLIGHT HTML    — see sections/spotlight.md §11}
    {HERO-SPLIT HTML   — see sections/hero-split.md §10}
    {REVIEWS HTML      — see sections/reviews.md §8}
    {YOUTUBE-CTA HTML  — see sections/youtube-cta.md §10}
    {ABOUT-FOUNDER HTML — see sections/about-founder.md §8}
  </main>

  <!-- Footer sits below — spec pending (blueprints/personal-brand/sections/footer.md when needed) -->

  <!-- Small inline scripts for CardNav toggle, Vimeo lightbox, mega-bento reviews carousel (see each section MD) -->
</body>
</html>
```

---

## Length budget

Emitting all 10 sections inline as one HTML document is expected to produce **20,000–35,000 characters** (2-3 pages of raw HTML). Opus 4.7 handles this comfortably in a single generation call.

If token budget is tight, sections can be emitted individually (one section per Opus call, results concatenated), but the recommended path is single-pass generation for consistency of brand voice across sections.

---

## What changed from the v1 monolith

Previous `home.md` (before 2026-07-17) contained the full per-section spec inline — 1,098 lines. Two problems:

1. **Redundancy**: the hero, mega-bento, and every other section were all spec'd in this one file AND in the (planned) section MDs. Every edit had to happen twice.
2. **Reader burden**: to know how the hero renders, you had to read 200+ lines inside a 1,098-line file. Faster to load a self-contained `sections/hero.md`.

This slim composition file (~250 lines) contains only what's page-level: order, rhythm, cross-section rules, global schema, fallback matrix, generation instructions. Every section spec lives in its own file — Opus loads only what it needs for each section.

Full history preserved in git (`git log blueprints/personal-brand/home.md`).
