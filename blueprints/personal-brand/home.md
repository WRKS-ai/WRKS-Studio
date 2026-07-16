# HOME — Personal-brand ideal blueprint

> **Provenance**: extracted from billfanter.com (converting personal-brand /
> coaching / masterclass site), refined into a generation spec.
>
> **Applies to**: founders selling a masterclass + community + free lead magnet.
> Voice descriptors: `bold`, `warm`, `expert`, `professional`.
>
> **Renderer**: Opus 4.7 emits a COMPLETE HTML5 document from this spec.
> The output uses semantic HTML + Tailwind (CDN) + inline CSS variables for
> palette + typography from user's brand data. NO Astro components; NO
> template reuse.

---

## Global constraints (inherit from DESIGN.md, do not restate; overrides below)

- **Container**: `max-width: 1180px`, horizontal padding `40px` desktop / `24px` mobile
- **Typography**: single-family discipline per DESIGN.md voice mapping
- **Palette**: HARD-CONSTRAINED to user's `brand_palette` when ingested; fall
  back to voice-descriptor default per DESIGN.md
- **Spacing scale**: only `4/8/12/16/20/24/32/40/48/64/88/100/120/168`
- **Motion**: `transform` + `opacity` only; enter = spring stiff 100 / damp 20;
  hover = 200ms ease-out

## Above-the-fold intent

Land the visitor in 3 seconds with:
1. **One clear promise** (headline states the outcome, not the method)
2. **Who's teaching** (portrait + name + one-line credential)
3. **One social-proof signal** (star rating + student count)
4. **Two escape hatches** (primary CTA to buy, secondary CTA to community)

## Page structure — 10 sections in exact order

```
Nav (floating cream bar over Hero)
Hero (dark, portrait right)
MegaBento (light, 6-tile grid)
Watchlist (light-fade, split form)
Community (light, screenshot + benefits)
HelpGrid (light, 3 icon cards)
Spotlight (full-bleed CTA card)
HeroSplit (light, media LEFT + copy RIGHT)
Reviews (light-fade, video + screenshot wall)
YoutubeCta (dark card)
AboutBill (light, photo + long-form)
```

Section rhythm alternates dark/light: `[dark hero] [light bento+watchlist fade] [light community] [light helpgrid] [dark spotlight card on light bg] [light heroSplit] [light-fade reviews] [dark youtubeCta card on light bg] [light aboutBill]`.

---

# SECTION 0 — Nav (floating cream bar)

**Section family**: `nav-floating-cream`
**Purpose**: brand mark + primary nav + persistent "book now" CTA, without
committing full-width chrome that competes with the dark hero.

## Layout spec

- Positioned `absolute`, `top: 20px`, `left: 24px`, `right: 24px`, `z-index: 6`
- Sits OVER the dark hero (Section 1), not above it
- Background: `#ffffff` at 100%, border-radius `14px`
- Padding: `14px 22px`
- Shadow: `0 10px 30px -6px rgba(0,0,0,0.4)`
- Flex row, `justify-content: space-between`, `align-items: center`

## Elements (in order left → right)

**1. Brand mark** (`<a href="/">`)
- Font: display typeface, `16px`, weight `700`, letter-spacing `-0.005em`
- Color: `neutral-dark` (#0a0a0c or extracted)
- Content slot: `nav.brandMark` — string (typically brand_name in ALL-CAPS
  or wordmark form; render as-is)
- Hover: no color change, no scale, no underline

**2. Nav links** (center flex, gap `20px`)
- Font: body typeface, `13px`, weight `500`
- Color: `rgba(neutral-dark, 0.7)`
- Content slots: `nav.links[]` — array of `{label, href}` — 3-5 items
- Hover: color → `rgba(neutral-dark, 1)`, no underline
- On mobile <768px: hide, show hamburger instead

**3. Primary CTA button** (`<a>` styled as button)
- Padding: `9px 18px`, border-radius `999px` (pill)
- Background: `neutral-dark`
- Color: `#ffffff`
- Font: body, `13px`, weight `600`
- Content slot: `nav.primaryCta` — `{label, href}` (typically matches
  `hero.primaryCta`)
- Hover: no scale; `translateY(-1)`; brighten fill 4%

## Content slots

```json
{
  "brandMark": "BILL",
  "links": [
    { "label": "Join", "href": "/community" },
    { "label": "Learn", "href": "/masterclass" },
    { "label": "Company", "href": "/about" }
  ],
  "primaryCta": { "label": "Get the masterclass", "href": "/masterclass" }
}
```

## Fallbacks

- No brand_name → use first word of `existing_headline`
- No links → generate 3: `Home`, `About`, `Contact`
- No primaryCta → use `hero.primaryCta`

---

# SECTION 1 — Hero (dark-portrait-split)

**Section family**: `hero-dark-portrait-split`
**Purpose**: instant credibility + one clear promise + primary conversion action
**Renders BEHIND**: the floating nav (Section 0)

## Layout spec

- Section wrapper: `position: relative; overflow: hidden`
- Background: `#0a0a0a` (pure dark stage — not neutral-dark, this is
  intentional deep black for premium contrast)
- Padding: `168px 40px 128px` (top clears the 20px nav + 14px nav shadow
  + 88px breathing room = 168px total)
- Min-height: `720px`
- Full-viewport-width bleed

## Layered stack (z-index bottom → top)

### Layer 1 — Dot-grid overlay (`z: 1`)
- Position `absolute inset-0`, opacity `0.66`
- CSS: `background-image: radial-gradient(circle at center, rgba(69,69,69,0.66) 2px, transparent 2px); background-size: 10px 10px`
- Purpose: adds texture, breaks up flat black

### Layer 2 — Dark scrim (`z: 0`)
- Position `absolute inset-0`
- CSS: `background: rgba(10,10,10,0.5)`
- Purpose: mutes the dot grid so it doesn't overwhelm

### Layer 3 — Portrait column (`z: 2`, right)
- Position `absolute top-0 bottom-0 right-0`, `left: 55%`
- Contains `<img>` sized `width: 100%; height: 100%; object-fit: cover; object-position: center top`
- Content slot: `hero.portraitImage` — full URL, must be portrait-orientation
  or use `object-position: center top` to keep face in frame
- Fallback: layered gradient — primary hex 0% opacity → primary hex 55%
  opacity → secondary hex 100% opacity, plus inset radial vignette
  `radial-gradient(ellipse 60% 55% at 45% 40%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)`

### Layer 4 — Copy rail (`z: 4`, left)
- Position `relative`, `max-width: 780px`
- Container padding zero (uses section's padding)
- Contains all copy elements (below)

### Layer 5 — Namecard bubble (`z: 5`, bottom-left of portrait area)
- Position `absolute`, `left: calc(55% + 24px)`, `bottom: 32px`
- Background: `rgba(255,255,255,0.94)`, backdrop-filter `blur(8px)`
- Padding: `14px 20px`, border-radius `14px`
- Shadow: `0 12px 34px rgba(0,0,0,0.35)`
- Flex column, gap `2px`

## Copy elements (in order, inside Layer 4 copy rail)

**1. h1 — Display headline**
- Font: display typeface (Fraunces / Cabinet Grotesk / Instrument Serif)
- Size: `80px` (clamp with `clamp(60px, 5vw, 80px)` for responsive)
- Weight: `600`
- Line-height: `1.04`
- Letter-spacing: `-0.03em`
- Color: `#ffffff`
- Max-width: `16ch` (forces 2-3 line ragged-right wrap)
- Margin: `0`
- Content slot: `hero.headline` — string, ≤14 words, ONE claim only
- Bans: no multi-clause headlines ("X that also Y"), no filler ("Empower")

**2. p — Subhead**
- Font: body typeface
- Size: `19px`
- Line-height: `1.55`
- Color: `#ffffff` at 100% (not muted — hero copy is loud)
- Max-width: `56ch`
- Margin: `28px 0 0`
- Content slot: `hero.subhead` — one sentence, ≤30 words

**3. CTA pair** (`display: flex; gap: 12px; flex-wrap: wrap`)
- Margin-top: `36px`
- Primary CTA: `padding: 16px 30px; border-radius: 999px; background: #ffffff; color: #0a0a0a; font: 500 15px body-typeface; letter-spacing: -0.01em`
  - Hover: `translateY(-1); box-shadow: inset 0 1px 0 rgba(255,255,255,1), 0 14px 32px -10px rgba(10,10,12,0.65)`
- Secondary CTA: same padding, `background: transparent; color: #ffffff; border: 1px solid rgba(255,255,255,0.4)`
  - Hover: `background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.6)`
- Content slots: `hero.primaryCta` `{label, href}`, `hero.secondaryCta` `{label, href}`
- CTA copy bans: no "Learn more" alone, no "Get started", no "Click here" — must be action verbs

**4. Trust row** (`display: flex; align-items: center; gap: 10px`)
- Margin-top: `30px`
- Font: body, `14px`, weight `500`, color: `#f5f0e6` (cream, not white — softer)
- Elements in order:
  a. Label span (`font-weight: 600`) — content: `hero.trust.label` (typically "Recommended by" / "Loved by")
  b. Star row (`display: inline-flex; gap: 2px`) — N filled star SVGs (16×16px), fill `#ffc14d`
  c. Count span (`font-weight: 400`) — content: `hero.trust.count` (typically "1,600+ Students")
- Content slots: `hero.trust` `{label, rating: number 1-5, count: string}`

## Namecard bubble (Layer 5) contents

- Name span: `font: 700 16px display-typeface; color: #0a0a0a; line-height: 1.1`
- Role span: `font: 500 13px body-typeface; color: rgba(10,10,10,0.6)`
- Content slots: `hero.namecard` `{name: string, role: string}`

## Content slot summary

```json
{
  "headline": "Learn options trading and build income you control",
  "subhead": "Bill Fanter teaches new and experienced traders how to read the options market, time entries, and place trades with a clear plan.",
  "primaryCta": { "label": "Get the masterclass", "href": "/masterclass" },
  "secondaryCta": { "label": "Join the community", "href": "/community" },
  "trust": { "label": "Recommended by", "rating": 5, "count": "1,600+ Students" },
  "namecard": { "name": "Bill Fanter", "role": "Former banker, options mentor" },
  "portraitImage": "https://…/portrait.webp"
}
```

## Rationale

- Dark stage = premium signal, editorial confidence
- Massive display headline = one thing to remember when they leave
- Right-anchored portrait = personal brand made visible immediately
- Two CTAs = high-intent (buy) + low-intent (community) escape hatches
- Trust row = social proof without a testimonial section required above the fold
- Namecard bubble on portrait = introduces the founder without a separate "about" element competing with the copy rail

---

# SECTION 2 — MegaBento (6-tile destination map)

**Section family**: `mega-bento-6tile`
**Purpose**: give visitors the entire IA in one scan; skimmers pick a destination, readers get depth

## Layout spec

- Wrapper: full-width, background `#fcfdff` (near-white) with gradient fade
  into the next section (see "Section pairing" below)
- Padding: `100px 40px`
- Container: `max-width: 1180px; margin: 0 auto`

## Section header (above grid)

- Text-align `left`, max-width `640px`, margin-bottom `40px`
- h2 headline: display typeface, `clamp(28px, 3vw, 40px)`, weight `500`,
  line-height `1.1`, letter-spacing `-0.02em`, color `neutral-dark`
- Content slot: `megaBento.heading` — one sentence

## Grid spec

- `display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(3, 386px); gap: 16px`
- 3 rows × 6 cols = 18 tile-cells
- Each tile spans multiple cells (see per-tile spec)

## Tile layout (spans)

Row 1 (0–6): `[Tile 1 (w4, hero image)] [Tile 2 (w2, gradient + device)]`
Row 2 (0–6): `[Tile 3 (w2, gradient + pick)] [Tile 4 (w2, image)] [Tile 5 (w2 tall, video reel, spans rows 2-3)]`
Row 3 (0–6): `[Tile 6 (w4, reviews carousel)]`

## Tile base styling (applies to all)

- `position: relative; display: flex; flex-direction: column; justify-content: flex-end; padding: 28px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05); isolation: isolate; color: #fff`
- Hover: `transform: translateY(-4px); box-shadow: 0 6px 16px rgba(0,0,0,0.08), 0 18px 40px rgba(0,0,0,0.12); transition: transform 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms`
- Each tile has arrow chip (top-right, 24×24px, rounded, glass fill) — see below

## Per-tile spec

### Tile 1 — Hero image tile (w4, featured)

- Grid: `grid-column: span 4`
- Featured styling: `padding: 36px`
- Background: full-bleed `<img>` positioned `absolute inset-0; z: 0; object-fit: cover`
- Scrim: `<span>` positioned `absolute inset-0; z: 1; background: linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.35) 62%, rgba(0,0,0,0.82) 100%)`
- Image hover: `transform: scale(1.04); transition: transform 500ms cubic-bezier(0.4,0,0.2,1)`
- Body: relative `z: 2`, contains title + description
  - Title: display font, `20px`, weight `600`, color `#fff`
  - Description: body font, `16px`, color `#fff`, max-width `420px`
- Content slot: `megaBento.tiles[0]` — `{kind: "image", title, description, image: url, href, aria}`

### Tile 2 — Gradient + device (w2)

- Grid: `grid-column: span 2`
- Background: user's `primary → secondary → tertiary` gradient at 135°
- Grainient overlay: `<span data-grainient>` with mount animation (see DESIGN.md motion tokens)
- Device image: floats bottom of tile, `<img>` at `bottom: 0; left: 50%; transform: translateX(-50%); width: 62%; height: 96%; object-fit: cover; object-position: center bottom; filter: drop-shadow(0 18px 40px rgba(0,0,0,0.4))`
- Copy: `padding: 28px`, title only
- Content slot: `megaBento.tiles[1]` — `{kind: "gradient-device", title, description, deviceImage, href, aria}`

### Tile 3 — Gradient + pick image (w2, square)

- Grid: `grid-column: span 2`
- Background: alternate gradient palette (secondary → tertiary → primary at 135°)
- Pick image: `absolute top: 50%; left: 50%; width: 92%; transform: translate(-50%, -50%); border-radius: 10px`
- Hover: pick image `scale(1.03)`
- Content slot: `megaBento.tiles[2]` — `{kind: "gradient-pick", title, description, pickImage, href, aria}`

### Tile 4 — Image tile (w2)

- Grid: `grid-column: span 2`
- Same structure as Tile 1 but smaller
- Content slot: `megaBento.tiles[3]` — `{kind: "image", title, description, image, href, aria}`

### Tile 5 — Tall video reel (w2, spans 2 rows)

- Grid: `grid-column: span 2; grid-row: span 2`
- Aspect ratio ends up 9:16 (mobile video)
- Background: `#0a0a0a` (dark)
- Video: `<iframe>` positioned `absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: calc(100% + 4px); height: calc(100% + 4px); z: 0; border: 0; pointer-events: none`
  - Autoplay muted loop, no controls, `background=1&autoplay=1&muted=1&loop=1&controls=0&playsinline=1`
- Bottom scrim: `linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,0.5) 100%)`
- Icon chip top-left (48×48px, glass, backdrop-blur, SVG icon inside)
- Content slot: `megaBento.tiles[4]` — `{kind: "video", title, description, videoSrc, iconSvg, href, aria}`

### Tile 6 — Reviews carousel (w6, full-width)

- Grid: `grid-column: span 6`
- Background: `#0a0a0a` (dark), `padding: 0`
- Contents:
  - Rotating quote slideshow: absolutely positioned slides, crossfade
    (each slide `position: absolute inset: 0; opacity: 0/1 transition 500ms`)
  - Auto-advance 6s, pause on hover, dots at bottom-right (8×8px circles)
  - Each slide: `<p>` (`font-size: 20px; line-height: 1.45; weight: 500; color: #fff; max-width: 62ch`) + `<figcaption>` (avatar 44×44 circular + name + title)
- Bottom-right: "Read all reviews →" link (14px, weight 600) + dot indicators
- Whole tile clickable (JS click handler on `[data-mega-reviews]`, navigates to `href`)
- Content slot: `megaBento.tiles[5]` — `{kind: "reviews", title, href, testimonials: [{quote, name, title, avatar}]}`

## Arrow chip (top-right of every tile except reviews)

- `position: absolute; top: 24px; right: 24px; z: 3`
- `width: 38px; height: 38px; border-radius: 50%`
- Background: `rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.28); backdrop-filter: blur(6px)`
- SVG: up-right arrow, `18×18`, stroke `1.8px`, color `#fff`
- Hover: background `rgba(255,255,255,0.95); color: #0a0a0a; transform: translate(2px, -2px); transition: 200ms`

## Responsive

- `<900px`: `grid-template-columns: repeat(2, 1fr); grid-auto-rows: 300px`; w4/w6 → `span 2`, w2 → `span 1`
- `<560px`: `grid-template-columns: 1fr; grid-auto-rows: minmax(260px, auto)`; tall tile keeps `aspect-ratio: 9/16`

## Content slot summary

```json
{
  "heading": "Everything you need to trade options with confidence",
  "tiles": [
    { "kind": "image", "title": "…", "description": "…", "image": "url", "href": "/masterclass", "aria": "…" },
    { "kind": "gradient-device", "title": "…", "description": "…", "deviceImage": "url", "href": "/community" },
    { "kind": "gradient-pick", "title": "…", "description": "…", "pickImage": "url", "href": "/free-watchlist" },
    { "kind": "image", "title": "…", "description": "…", "image": "url", "href": "/webinar" },
    { "kind": "video", "title": "…", "description": "…", "videoSrc": "vimeo-url", "iconSvg": "<path d=…/>", "href": "https://youtube.com/…" },
    { "kind": "reviews", "title": "Student reviews", "href": "/reviews", "testimonials": [{ "quote": "…", "name": "…", "title": "…", "avatar": "url" }] }
  ]
}
```

## Rationale

- 6 tiles = every major destination surface visible at once
- Mixed sizes = hierarchy without a strict grid (skimmers pick the biggest)
- Video tile = motion draws the eye without competing text
- Reviews as full-width closer = social proof caps the section

---

# SECTION 3 — Watchlist / lead magnet (split-form)

**Section family**: `lead-magnet-split-form`
**Purpose**: capture mid-funnel visitors who aren't ready to buy but want free
value; grow the email list; feed the nurture

## Layout spec

- Wrapper: full-width, background inherits from previous section (transparent — Section 2 sets a gradient fade that continues through)
- Padding: `100px 40px`
- Container: `max-width: 1180px; margin: 0 auto`
- Inner grid: `display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center`

## Left column — Copy + form

**Eyebrow**
- `<div class="eyebrow">` — mono-caps label
- Font: mono typeface, `11.5px`, weight `500`, letter-spacing `0.14em`, uppercase
- Color: `rgba(neutral-dark, 0.5)`
- Content slot: `watchlist.eyebrow` — string ("Free weekly watchlist")

**h2 — Section headline**
- Display font, `clamp(24px, 2.6vw, 36px)`, weight `500`, line-height `1.1`, letter-spacing `-0.025em`
- Color: `neutral-dark`
- Margin: `12px 0 0`
- Content slot: `watchlist.heading` — one sentence

**Lead paragraph**
- Body font, `16px`, line-height `1.6`
- Color: `neutral-dark`
- Max-width: none (fills column)
- Margin: `24px 0 0`
- Content slot: `watchlist.lead` — 1-2 sentences describing value

**Form**
- `<form>` element with `id`, `name`, `data-wf-page-id`, `data-wf-element-id` attributes (for Webflow/Kajabi handler compat if user has one) — otherwise plain POST to `/api/lead-magnet`
- Margin-top: `32px`
- Flex column, gap `10px`
- Inputs: `padding: 14px 16px; border-radius: 8px; border: 1px solid rgba(neutral-dark, 0.15); background: #ffffff; font: 400 15px body-typeface`
  - Name input: `type="text"`, `placeholder` slot: `watchlist.namePlaceholder` (default "Name")
  - Email input: `type="email"`, `placeholder` slot: `watchlist.emailPlaceholder` (default "Email")
- Submit button: `padding: 14px 24px; border-radius: 8px; background: neutral-dark; color: #ffffff; font: 600 15px body-typeface; border: 0; cursor: pointer`
  - Content slot: `watchlist.submitLabel` (default "Subscribe")

## Right column — Locked-preview image + ticker

**Image tile wrapper**
- `position: relative; overflow: visible; border-radius: 0` (image has its own rounding)

**Preview image**
- `<img src="{watchlist.previewImage}" alt="{watchlist.previewAlt}">`
- Styling: `object-fit: contain; border-radius: 12px; filter: drop-shadow(0 24px 50px rgba(20,40,80,0.26))`
- Purpose: shows a "locked" or blurred preview of what the visitor gets after subscribing (creates curiosity gap)

**Ticker overlay** (optional, on top of preview image)
- Position: `absolute; top: 67%; left: 0; right: 0; bottom: 0; z: 2`
- Two rows of chips scrolling opposite directions (marquee animation)
- Chip styling: `padding: 5px 11px; border-radius: 999px; background: rgba(10,12,20,0.34); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.16); font: 700 12.5px body-typeface; color: #fff`
- Content slot: `watchlist.tickerA[]` and `watchlist.tickerB[]` — each array of `[symbol, change, "up" | "down"]`
- Animation: `@keyframes` translateX 0 → -50% over 26s linear infinite

## Content slot summary

```json
{
  "eyebrow": "Free weekly watchlist",
  "heading": "Get a curated weekly stock options watchlist",
  "lead": "Each week, get a short list of stocks set up for potential moves…",
  "namePlaceholder": "Name",
  "emailPlaceholder": "Email",
  "submitLabel": "Subscribe",
  "previewImage": "url",
  "previewAlt": "Preview of the weekly watchlist",
  "tickerA": [["AAPL", "+1.2%", "up"], ["NVDA", "+2.4%", "up"]],
  "tickerB": [["AMZN", "+0.9%", "up"], ["GOOGL", "+0.7%", "up"]]
}
```

## Fallbacks

- No lead magnet → skip this section entirely
- No preview image → show a stylized envelope illustration + palette gradient bg
- No ticker data → hide overlay, show only preview image

## Responsive

- `<960px`: `grid-template-columns: 1fr; gap: 32px`; form column stacks above image column

## Rationale

- Split layout = clear "you give / you get" symmetry
- Locked preview = curiosity beats promise every time
- Ticker chips = live-market feel, activity, urgency
- Low commitment (email only) = high capture rate

---

# SECTION 4 — Community (screenshot + numbered benefits)

**Section family**: `community-screenshot-benefits`
**Purpose**: sell the community/product-as-service dimension by making it VISIBLE

## Layout spec

- Wrapper: `background: #ffffff` (hard cut from previous section's gradient)
- Padding: `100px 40px`
- Container: `max-width: 1180px; margin: 0 auto`

## Header (centered above grid)

- Text-align `center`, max-width `680px`, margin `0 auto 48px`
- h2: display font, `clamp(28px, 3vw, 40px)`, weight `500`, letter-spacing `-0.02em`, color `neutral-dark`
- Lead: body font, `16px`, line-height `1.55`, color `rgba(neutral-dark, 0.7)`, margin-top `14px`
- Content slots: `community.heading`, `community.lead`

## Grid (two-column split)

- `display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; margin-top: 48px`

## Left column — Community screenshot

- Wrapper: `align-self: start`
- `<img>`: `width: 88%; margin-inline: auto; display: block; border-radius: 12px`
- Purpose: show the ACTUAL community (Discord/Slack/Circle screenshot with real messages if user provides; otherwise stylized mockup)
- Content slot: `community.screenshot` — `{src, alt}`

## Right column — Numbered benefits + CTA

**Benefits list** (`<div>` container, flex column, gap `20px`)

- Each benefit renders as a row:
  - Number badge: `<div>` — `display: inline-flex; width: 40px; height: 40px; border-radius: 50%; background: rgba(primary, 0.08); color: primary; font: 600 14px body-typeface; align-items: center; justify-content: center`
  - Body block: flex column, gap `4px`
    - Title: display font, `17px`, weight `600`, color `neutral-dark`
    - Body: body font, `14.5px`, line-height `1.55`, color `rgba(neutral-dark, 0.7)`
- Content slot: `community.benefits[]` — array of `{num: string (e.g. "01"), title, body}` — 4-6 items typical

**CTA button** (below benefits, `margin-top: 12px`)
- Aligned to `align-self: flex-start`
- Same styling as Hero primary CTA on light: `padding: 14px 24px; border-radius: 999px; background: neutral-dark; color: #ffffff; font: 600 15px`
- Contains label + arrow SVG (14×14px, currentColor stroke)
- Content slot: `community.cta` — `{label, href}`

## Content slot summary

```json
{
  "heading": "Join my options trading community",
  "lead": "Trade alongside active traders who share setups in real time.",
  "screenshot": { "src": "url", "alt": "The community Discord" },
  "benefits": [
    { "num": "01", "title": "Get instant Discord access", "body": "…" },
    { "num": "02", "title": "See live trade alerts", "body": "…" },
    { "num": "03", "title": "Get daily market analysis", "body": "…" },
    { "num": "04", "title": "Trade in a focused community", "body": "…" },
    { "num": "05", "title": "Reach me directly", "body": "…" }
  ],
  "cta": { "label": "Join the community", "href": "/community" }
}
```

## Fallbacks

- No community offering → skip this section
- No screenshot → render a stylized illustration with palette gradient

## Responsive

- `<960px`: single column, screenshot stacks above benefits

## Rationale

- Seeing the community = "it's real, people talk here"
- Numbered benefits = value stack in scannable form
- Direct CTA at bottom = capture the sold visitor immediately

---

# SECTION 5 — HelpGrid (3-card outcome grid)

**Section family**: `help-grid-3col-icon`
**Purpose**: name the 3 outcomes the visitor gets; reinforces value from third angle

## Layout spec

- Wrapper: `background: #ffffff`
- Padding: `100px 40px`
- Container: `max-width: 1040px; margin: 0 auto` (narrower than usual to force focus)

## Header (centered)

- Text-align `center`, max-width `640px`, margin `0 auto 48px`
- h2: display font, `clamp(28px, 3vw, 40px)`, weight `500`, letter-spacing `-0.02em`, color `neutral-dark`
- Content slot: `helpGrid.heading` — one sentence naming the outcome bundle

## Grid

- `display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px`
- Each card: `padding: 28px; background: #ffffff; border: 1px solid rgba(neutral-dark, 0.06); border-radius: 14px`
- Card hover: `border-color: rgba(neutral-dark, 0.12); box-shadow: 0 20px 44px -20px rgba(neutral-dark, 0.15); transform: translateY(-2px); transition: 220ms cubic-bezier(0.2, 0.7, 0.2, 1)`

## Card contents

**Icon slot** (top)
- `width: 44px; height: 44px; border-radius: 12px; background: rgba(primary, 0.08); color: primary; display: inline-flex; align-items: center; justify-content: center`
- Inside: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">` with path data from `helpGrid.cards[i].iconPaths`

**Title** (below icon, margin-top `20px`)
- Display font, `20px`, weight `600`, letter-spacing `-0.015em`, color `neutral-dark`
- Content slot: `helpGrid.cards[i].title` — 3-5 words

**Body** (below title, margin-top `10px`)
- Body font, `15px`, line-height `1.55`, color `rgba(neutral-dark, 0.7)`
- Content slot: `helpGrid.cards[i].body` — 1-2 sentences

## Content slot summary

```json
{
  "heading": "Trade options with confidence and grow your income",
  "cards": [
    { "title": "Earn beyond your paycheck", "body": "…", "iconPaths": "<rect …/>…" },
    { "title": "Trade with independence", "body": "…", "iconPaths": "<path …/>…" },
    { "title": "Build long-term wealth", "body": "…", "iconPaths": "<path …/>…" }
  ]
}
```

## Icon vocabulary

Opus should pick from these stroke-icon paths per card meaning
(all `viewBox: 0 0 24 24; stroke-width: 1.8`):

- Money / income: `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.4"/>`
- Growth / chart: `<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>`
- Wealth / stack: `<path d="m3 20 6-11 4 6 2-3 6 8z"/><path d="M3 20h18"/>`
- Freedom / bird: `<path d="M6 12l4-4 3 3 5-5"/><circle cx="18" cy="6" r="1.5"/>`
- Time / clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>`
- Community / people: `<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 19c1.4-3.2 4-4.5 6-4.5s4.6 1.3 6 4.5"/>`

## Responsive

- `<860px`: `grid-template-columns: 1fr; max-width: 480px`

## Rationale

- Third statement of value = repetition drives retention
- 3 cards = memorable (not 4, not 5)
- Icon + title + body = quick scan pattern
- Palette-tinted icon chip = subtle brand presence per card

---

# SECTION 6 — Spotlight (full-bleed CTA card)

**Section family**: `spotlight-cta-full-bleed`
**Purpose**: secondary conversion action for warm visitors — lower friction than buy

## Layout spec

- Wrapper: `background: #ffffff`
- Padding: `48px 40px`
- Container: `max-width: 1180px; margin: 0 auto`

## Card

- `<div>` — `position: relative; overflow: hidden; border-radius: 16px; padding: 88px 64px; background: neutral-dark`
- Height: min `320px`

## Background layer (animated)

- Optional GridDistortion / animated abstract via `data-griddistortion data-image={backgroundImage}` — mounts a WebGL canvas
- If no animation lib available: static gradient `linear-gradient(135deg, primary 0%, secondary 60%, tertiary 100%)` at 20% opacity over `neutral-dark`
- Position: `absolute inset-0; z: 0; pointer-events: none`

## Content layer (relative, z: 2)

- Max-width: `560px`
- h2 headline: display font, `clamp(30px, 3.5vw, 44px)`, weight `500`, line-height `1.1`, letter-spacing `-0.025em`, color `#ffffff`
- Lead: body font, `17px`, line-height `1.55`, color `rgba(255,255,255,0.85)`, margin-top `18px`
- CTA: pill button, `margin-top: 32px`
  - Background: `rgba(255,255,255,0.16)`, backdrop-filter `blur(10px)`
  - Border: `1px solid rgba(255,255,255,0.42)`
  - Color: `#ffffff`
  - Padding: `14px 26px`
  - Font: `600 15px`
  - Icon (optional, before label): 14×14 play-icon SVG for video CTAs
  - Hover: `background: rgba(255,255,255,0.28); transform: translateY(-1px)`

## Content slot summary

```json
{
  "heading": "Learn options trading in my free demo webinar",
  "lead": "Whether you are new to options or sharpening your skills…",
  "cta": { "label": "Watch webinar", "href": "/webinar" },
  "ctaIcon": true,
  "backgroundImage": "url" 
}
```

## Fallbacks

- No `backgroundImage` → use static gradient described above
- `ctaIcon: false` → no play-icon, label only

## Responsive

- `<720px`: padding `48px 24px`; headline `clamp(24px, 6vw, 32px)`

## Rationale

- Warm-visitor conversion path — offer something free before asking for money
- Full-bleed card = visually distinct break from other sections
- Dark on white = pattern break, forces the eye

---

# SECTION 7 — HeroSplit (welcome bento — media LEFT, copy RIGHT)

**Section family**: `hero-split-media-copy-bento`
**Purpose**: introduce founder philosophy, preview offering, use video/quote/photo to build parasocial trust

## Layout spec

- Wrapper: `background: #ffffff`
- Padding: `100px 40px`
- Container: `max-width: 1180px; margin: 0 auto`
- Inner grid: `display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: center`

## LEFT column — Media bento (3 tiles)

Grid inside column: `display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 260px 260px; gap: 16px`

### Tile A — Video reel (spans full height on left, `grid-column: 1; grid-row: 1 / span 2`)

- Aspect: 9:16 vertical reel
- Contains `<button class="vreel">` wrapper for click-to-expand behavior
- `<iframe>` inside: `data-lazysrc="vimeo-url"; allow="autoplay; fullscreen"; loading="lazy"`
- Play button overlay: 64×64px circle, white bg, dark play triangle
- Content slot: `heroSplit.videoSrc` — vimeo/youtube URL

### Tile B — Quote card on grainient (top-right)

- Aspect: fills grid cell
- Background: grainient gradient (primary → secondary → tertiary at 135°)
- Padding: `24px`
- Contents:
  - Quote (`<p>`): body font, `16px`, line-height `1.5`, color `#ffffff`, weight `500`
  - Footer flex row:
    - Author block (name + title, both `#ffffff`)
    - Link "Read more reviews" (`13px`, weight `500`, color `#ffffff`, small arrow icon)
- Content slot: `heroSplit.quote` — `{text, name, title}` + `heroSplit.quoteLink` — `{label, href}`

### Tile C — Portrait photo (bottom-right)

- Aspect: fills grid cell, `object-fit: cover`
- `<img src={heroSplit.photo.src} alt={heroSplit.photo.alt}>`
- Content slot: `heroSplit.photo` — `{src, alt}`

## RIGHT column — Copy rail

Padding-left `48px` (inset to separate from media column).

**Eyebrow** (optional, top)
- Mono-caps label, `11.5px`, weight `500`, letter-spacing `0.14em`, uppercase
- Color: `rgba(primary, 0.7)`
- Content slot: `heroSplit.eyebrow` — string, nullable

**h2 headline**
- Display font, `clamp(24px, 2.6vw, 36px)`, weight `500`, line-height `1.15`, letter-spacing `-0.02em`
- Color: `neutral-dark`
- Margin: `12px 0 0`
- Content slot: `heroSplit.heading`

**Lead paragraph**
- Body font, `17px`, line-height `1.55`, color `rgba(neutral-dark, 0.7)`
- Margin: `20px 0 0`
- Content slot: `heroSplit.lead`

**CTA button** (`margin-top: 28px`)
- Same styling as Hero primary on light
- Content slot: `heroSplit.cta` — `{label, href}`

**Trust row** (`margin-top: 24px`)
- Same structure as Hero trust row (label + stars + count)
- Content slot: `heroSplit.trust` — `{label, rating, count}`

## Content slot summary

```json
{
  "eyebrow": "Welcome to Bill Fanter",
  "heading": "Learn proven options trading strategies that work in any market",
  "lead": "Go past random tips and learn a repeatable options trading system…",
  "cta": { "label": "Join the masterclass", "href": "/masterclass" },
  "trust": { "label": "Recommended by", "rating": 5, "count": "1,600+ Students" },
  "videoSrc": "https://player.vimeo.com/video/…",
  "quote": { "text": "Bill's masterclass was…", "name": "Rob Stalkie", "title": "Account Manager" },
  "quoteLink": { "label": "Read more reviews", "href": "/reviews" },
  "photo": { "src": "url", "alt": "Bill Fanter at his trading desk" }
}
```

## Fallbacks

- No video → replace Tile A with a large static photo, spanning both rows
- No quote → replace Tile B with a stat callout (big number + label)
- No photo → grainient placeholder

## Responsive

- `<980px`: single column; copy stacks above media; media bento becomes 1-col centered stack (video → quote → photo), `max-width: 440px`

## Rationale

- Video = parasocial trust (voice + face)
- Quote card = social proof reinforcement
- Photo = human presence
- Copy right = deeper narrative than hero can carry

---

# SECTION 8 — Reviews (video-first + LinkedIn screenshot wall)

**Section family**: `reviews-video-plus-wall`
**Purpose**: hardest social proof — real videos + real LinkedIn posts

## Layout spec

- Wrapper: `background: #f6f8fb` (flat neutral grey — pattern break from previous white sections)
- Padding: `100px 40px`
- Container: `max-width: 1180px; margin: 0 auto`

## Header (centered)

- Eyebrow: mono-caps `Student reviews`, `11.5px`, weight `500`, letter-spacing `0.14em`, color `rgba(neutral-dark, 0.55)`
- h2: display font, `clamp(28px, 3vw, 40px)`, weight `500`, letter-spacing `-0.02em`, color `neutral-dark`
- Content slots: `reviews.eyebrow` (default "Student reviews"), `reviews.heading`

## Video row (3-up grid)

- `display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 48px`
- Each card:
  - Wrapper: `border-radius: 12px; overflow: hidden; background: #0a0a0a; box-shadow: 0 12px 30px rgba(20,60,120,0.08)`
  - Thumb button: `position: relative; width: 100%; aspect-ratio: 16/9`
  - Poster `<img src="https://vumbnail.com/{vimeoId}.jpg">` positioned absolute inset-0, `object-fit: cover`
  - Scrim: `linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)`
  - Play button center: 64×64 circle, white bg, dark play triangle
- Click → opens lightbox with autoplay video (data-vimeo attribute triggers global handler)
- Content slot: `reviews.videoVimeoIds[]` — array of 3 Vimeo IDs

## Screenshot wall (masonry, 2 columns)

- `column-count: 2; column-gap: 20px; margin-top: 56px`
- Each screenshot: `<img>` with `width: 100%; margin: 0 0 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 10px 26px rgba(20,60,120,0.07); break-inside: avoid; display: block`
- Content slot: `reviews.screenshots[]` — array of image URLs (LinkedIn testimonial post screenshots)
- Target ~10-20 screenshots for visual density

## CTA (below wall, centered)

- `display: flex; justify-content: center; margin-top: 56px`
- Button styling: pill on white background, dark ink (same as HelpGrid CTA style)
- Content slot: `reviews.cta` — `{label, href}` (default "See all reviews" → "/reviews")

## Content slot summary

```json
{
  "eyebrow": "Student reviews",
  "heading": "Hear success stories from real customers",
  "videoVimeoIds": ["1173480173", "1173480185", "1173480159"],
  "screenshots": ["url1", "url2", "url3", "…"],
  "cta": { "label": "See all reviews", "href": "/reviews" }
}
```

## Fallbacks

- No videos → skip video row, expand screenshot wall to 3-column
- No screenshots → replace wall with 3-4 quote cards (author + quote + role)
- No videos AND no screenshots → replace whole section with a `reviews-carousel` fallback (5-8 rotating written quotes)

## Responsive

- `<900px`: video row → 1-col, `max-width: 480px; margin: auto`
- `<767px`: screenshot wall → `column-count: 1`

## Rationale

- Video reviews > written every time (harder to fake, feels real)
- LinkedIn screenshots > staged testimonial cards (public, verifiable)
- Grey band = pattern break, separates from other sections
- CTA closer = drives review-page traffic for depth

---

# SECTION 9 — YoutubeCta (dark card with reel)

**Section family**: `social-cta-dark-card-with-reel`
**Purpose**: promote YouTube channel = build audience even for visitors who don't buy today

## Layout spec

- Wrapper: `background: #ffffff`
- Padding: `100px 40px`
- Container: `max-width: 1180px; margin: 0 auto`

## Card

- `<div>` — `background: #0a0a0a; border-radius: 16px; padding: 88px 64px`
- Inner grid: `display: grid; grid-template-columns: 1fr 440px; gap: 60px; align-items: center`

### LEFT column — Copy

**h2 headline**
- Display font, `clamp(28px, 3vw, 40px)`, weight `500`, line-height `1.15`, letter-spacing `-0.02em`
- Color: `#ffffff`
- Content slot: `youtubeCta.heading`

**Lead paragraph**
- Body font, `17px`, line-height `1.55`, color `rgba(255,255,255,0.75)`
- Margin: `18px 0 0`
- Content slot: `youtubeCta.lead`

**CTA button** (`margin-top: 30px`)
- Pill, `padding: 14px 26px`
- Background: `#ffffff`; color: `#0a0a0a`
- Icon SVG: 16×16 YouTube glyph (before label)
- Content slot: `youtubeCta.cta` — `{label, href, target: "_blank"}`

### RIGHT column — Grainient card with reel

- Wrapper: `position: relative; height: 100%; min-height: 300px; border-radius: 12px; overflow: hidden`
- Grainient background: `<div data-grainient data-color1={primary} data-color2={secondary} data-color3={tertiary}>` — animates
- Reel image (floating, drop shadow): `<img src={youtubeCta.channelImage.src}>` positioned `absolute top: 12%; left: 50%; transform: translateX(-50%); height: 92%; max-width: 62%; object-fit: contain; filter: drop-shadow(0 24px 40px rgba(0,0,0,0.4))`

## Content slot summary

```json
{
  "heading": "Get options trading insights on my YouTube channel",
  "lead": "Watch free breakdowns of real trades, market setups, and options strategies…",
  "cta": { "label": "Watch on YouTube", "href": "https://youtube.com/@BillFanter", "target": "_blank" },
  "channelImage": { "src": "url", "alt": "Bill Fanter's YouTube channel" }
}
```

## Fallbacks

- No channel image → show large YouTube glyph on grainient bg
- No YouTube channel at all → replace with an Instagram / X / newsletter card (same structure, different logo/link)

## Responsive

- `<960px`: single column, image stacks below copy at `max-width: 440px`

## Rationale

- Free-content path = long-tail audience capture
- Dark card = pattern break inside light section
- Actual channel screenshot > generic YouTube logo (proves the channel is real + shows quality)

---

# SECTION 10 — AboutBill (long-form founder split)

**Section family**: `long-form-founder-split`
**Purpose**: humanize the brand; give the visitor the "who is this person and why should I trust them" answer; last conversion push before they leave

## Layout spec

- Wrapper: `background: #ffffff`
- Padding: `100px 40px 120px` (extra bottom = last section before footer, needs breathing room)
- Container: `max-width: 1180px; margin: 0 auto`
- Inner grid: `display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 60px; align-items: start`

## LEFT column — Portrait photo

- Wrapper: `position: relative`
- `<img>`: `width: 100%; height: 480px; object-fit: cover; object-position: center 18%; border-radius: 14px`
- Optional signature overlay: `<div class="signature">` positioned `absolute; right: 18px; bottom: 16px; width: 150px; max-width: 44%; color: neutral-dark; filter: drop-shadow(0 1px 2px rgba(255,255,255,0.55))` — SVG signature file
- Content slots: `aboutBill.photo` — `{src, alt}`, `aboutBill.signature` — SVG path data (nullable)

## RIGHT column — Long-form copy

**Eyebrow** (top)
- Mono-caps, `11.5px`, weight `500`, letter-spacing `0.14em`, uppercase
- Color: `rgba(neutral-dark, 0.55)`
- Content slot: `aboutBill.eyebrow` — default "Meet your mentor" / "About the founder"

**h2 headline**
- Display font, `clamp(28px, 3vw, 40px)`, weight `500`, line-height `1.1`, letter-spacing `-0.025em`
- Color: `neutral-dark`
- Margin: `12px 0 0`
- Max-width: `24ch` (force 2-line wrap)
- Content slot: `aboutBill.heading` — warm + personal, first-person ("Hi, I'm X…")

**Paragraphs** (below heading, `margin-top: 28px`)
- Each `<p>`: body font, `16px`, line-height `1.65`, color `neutral-dark`, margin `0 0 16px`
- 3-5 paragraphs
- Content slot: `aboutBill.paragraphs[]` — array of strings, HTML-allowed (may include `&hellip;` etc.)

**Actions row** (below paragraphs, `margin-top: 28px`)
- `display: flex; gap: 12px; flex-wrap: wrap`
- Primary CTA: same style as Hero primary on light
- Optional secondary CTA
- Content slot: `aboutBill.cta` — `{label, href}` (single CTA typical for this section)

## Content slot summary

```json
{
  "eyebrow": "Meet your mentor",
  "heading": "Hi, I'm Bill Fanter. I'm excited to get to know you.",
  "paragraphs": [
    "Over a 35-year career, I became one of the most sought-after executive-level bankers…",
    "I've spent thousands of hours and thousands of dollars learning the art of trading…",
    "I will teach you the exact same strategies that helped me build my wealth from the ground up.",
    "And the best part of all?",
    "I'll make it easy on you. As I like to say… This ain't rocket science!"
  ],
  "photo": { "src": "url", "alt": "Bill Fanter" },
  "signature": null,
  "cta": { "label": "Book a call", "href": "/contact" }
}
```

## Fallbacks

- No photo → palette gradient block same dimensions
- No signature → skip overlay
- <3 paragraphs → pad with brand story from `existing_site_bio` (extracted during ingest) or use `["I've built this because I saw a gap in the market…"]` skeleton

## Responsive

- `<980px`: single column; photo stacks above copy; photo height `320px`

## Rationale

- Photo LEFT + copy RIGHT = classic editorial biography layout
- First-person heading = disarming
- 3-5 paragraphs = enough for narrative, not enough to lose attention
- Single CTA at end = clear next step after they've read the whole thing
- Last section = biggest bottom padding (feels finished, doesn't crowd footer)

---

# Global JSON schema — content contract

The complete content object Opus must emit for a home page:

```json
{
  "meta": {
    "title": "string",
    "description": "string",
    "ogImage": "url"
  },
  "nav": { … },
  "hero": { … },
  "megaBento": { … },
  "watchlist": { … } | null,
  "community": { … } | null,
  "helpGrid": { … },
  "spotlight": { … } | null,
  "heroSplit": { … } | null,
  "reviews": { … } | null,
  "youtubeCta": { … } | null,
  "aboutBill": { … }
}
```

**Required sections**: `nav`, `hero`, `megaBento`, `helpGrid`, `aboutBill`
**Optional sections** (skip if user doesn't have the offering): `watchlist`, `community`, `spotlight`, `heroSplit`, `reviews`, `youtubeCta`

If an optional section is null, the renderer skips it entirely (no empty
placeholder, no ghost padding).

## Generation instructions for Opus

When generating from this blueprint:

1. Read `DESIGN.md` for global taste + tokens
2. Read this file (`home.md`) for structural spec + section slots
3. Read user's brand ingest data (palette, typefaces, hero image, existing
   headline, testimonials, team, contact info)
4. Emit ONE complete HTML document with:
   - `<head>`: charset, viewport, title (`meta.title`), description
     (`meta.description`), og:image (`meta.ogImage`), preconnect
     fonts.googleapis.com + fonts.gstatic.com, `<link>` to Google Fonts
     for chosen display + body + mono, `<link>` to favicon
   - `<script src="https://cdn.tailwindcss.com">` (self-contained renderer)
   - `<style>` inline: CSS custom properties for palette (`--primary`,
     `--secondary`, `--tertiary`, `--neutral-dark`, `--neutral-warm`)
     + type variables (`--font-display`, `--font-body`, `--font-mono`)
     + any keyframes needed (`fw-ticker-ltr`, `fw-ticker-rtl` for Section 3)
   - `<body>`: `<header>` (nav), `<main>` (sections 1-10 in order),
     `<footer>` (minimal — brand mark + copyright + social links)
5. Every section wrapped in `<section>` with `id="{section-family}"`
6. Every editable text element gets `data-edit-id="{section}.{slot}"`
   for future inline editing (Ship X — surgical Opus edits)
7. Every image: `loading="lazy"` except `hero.portraitImage` which is
   `fetchpriority="high"`
8. All Tailwind classes; no external CSS beyond Tailwind CDN + the
   inline `<style>` for design tokens

## Length budget

- Total HTML output: 4000-8000 lines (dense, not padded)
- Total token count: ~10K-20K output tokens
- Opus 4.7 time: 60-90 seconds
- Store output in Supabase Storage as `.html`, serve from a signed URL that
  the Studio canvas iframes

## What Opus should NOT do

- Do NOT invent sections not in this MD
- Do NOT reorder sections (order is optimized for conversion flow)
- Do NOT rewrite existing user copy from scratch — polish only
- Do NOT emit React/JSX — plain HTML only
- Do NOT use any color outside the extracted brand palette
- Do NOT use any typeface outside the extracted brand typefaces
- Do NOT deviate from the spacing scale
- Do NOT add analytics scripts, chat widgets, or third-party embeds
  unless explicitly listed in a section spec
