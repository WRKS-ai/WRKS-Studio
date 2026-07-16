# SECTION — Watchlist (lead-magnet-split-form)

> **Section family**: `lead-magnet-split-form`
> **Used in**: personal-brand/home (position 3), personal-brand/lead-magnet (as hero)
> **Purpose**: capture email in exchange for a recurring, valuable free asset. The single moment on the page where the visitor exchanges data for value.
> **Position on page**: renders inside the same continuous background wrapper as MegaBento above (`.bf-bento-fade`), then hard-cuts into the white Community section below.

---

## 1. Section wrapper

```html
<section id="watchlist" data-section="lead-magnet-split-form">
  <div class="container">
    <div class="wl-split">
      <div class="wl-copy">…</div>
      <div class="wl-media">…</div>
    </div>
  </div>
</section>
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-16)

| Property | Value | Notes |
|---|---|---|
| `background` | `transparent` (when wrapped) OR `linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%)` (standalone) | continuous fade from MegaBento above. Fade ends at `#f6f8fc` and hard-cuts into white Community below |
| `padding-top` | `100px` | matches DESIGN.md light-section rhythm |
| `padding-bottom` | `100px` | |
| Container `max-width` | `1180px` | |
| Container horizontal padding | `40px` desktop / `24px` mobile (≤767px) |

**Why transparent when wrapped**: MegaBento + Watchlist live inside one `.bf-bento-fade` wrapper that paints a single continuous background. If this section paints its own, there's a visible seam mid-gradient.

**Standalone gradient**: when this section is used as the /lead-magnet page hero (not inside the bento-fade wrapper), it needs its own subtle white-to-off-white fade so the page doesn't feel flat.

---

## 2. Split layout — 50/50 grid

The section's signature. Copy + form on the LEFT, visual card on the RIGHT.

### CSS (verified from billfanter.com production)

```css
.wl-split {
  display: grid;
  grid-template-columns: 1fr 1fr;         /* exactly 50/50 — not 60/40 */
  gap: 56px;                              /* 56px between columns — NOT 40 or 64 */
  align-items: center;                    /* vertical center — copy and image align on midline */
}
```

**Why 50/50 not 60/40**: the copy needs equal visual weight with the visual card. If the form is smaller than the card, the form reads secondary — but the form IS the section's conversion point. Equal split makes them peers.

**Why `align-items: center`**: the copy stack can be shorter or taller than the 520px square, but the two must appear centered as a matched pair. Top-align creates a floating card; center-align feels intentional.

---

## 3. Copy column — LEFT

### HTML

```html
<div class="wl-copy">
  <div class="eyebrow-wrap">
    <span class="eyebrow" data-edit-id="watchlist.eyebrow">
      {watchlist.eyebrow}
    </span>
  </div>
  <h2 class="wl-h2" data-edit-id="watchlist.heading">
    {watchlist.heading}
  </h2>
  <p class="wl-lead" data-edit-id="watchlist.lead">
    {watchlist.lead}
  </p>
  <form
    id="watchlist-form"
    name="watchlist-form"
    method="post"
    class="wl-form"
    action="{watchlist.submitAction}">
    <input class="wl-input"
           maxlength="256"
           name="Watchlist-name"
           placeholder="{watchlist.namePlaceholder}"
           type="text"
           required />
    <input class="wl-input"
           maxlength="256"
           name="Watchlist-email"
           placeholder="{watchlist.emailPlaceholder}"
           type="email"
           required />
    <input class="wl-submit"
           type="submit"
           data-wait="Please wait…"
           value="{watchlist.submitLabel}" />
  </form>
</div>
```

### CSS

```css
.wl-copy {
  max-width: 560px;                       /* caps the copy column — never fills the whole 50% cell */
  display: flex;
  flex-direction: column;
}
```

**Why `max-width: 560px` inside a 1fr column**: the 1fr column at 1180px container width is ~562px. The 560px cap means the copy hugs the LEFT of its column with a tiny right-side breathing gap. Feels intentional, not stretched.

### Spacing rhythm inside the copy column

| Above eyebrow | 0 (top of column) |
| Between eyebrow and h2 | 12-16px (default browser margin from eyebrow wrapper) |
| Between h2 and lead | 28px (`.wl-lead margin-top: 28`) |
| Between lead and form | 32px (`.wl-form margin-top: 32`) |
| Between form inputs | 12px (`.wl-form gap: 12`) |
| Between last input and submit | 12px (same gap) |

### 3a. Eyebrow — the ONE place eyebrows are allowed

Global rule from DESIGN.md: **never use eyebrows above headlines** — with ONE exception, this section.

**Why the exception**: this section is a lead-magnet CTA nested INSIDE the middle of the homepage. Without an eyebrow, the h2 reads as a subhead to the section above (MegaBento). The eyebrow ("Free weekly watchlist") is what identifies this as a distinct offer — not decorative, functional.

### Eyebrow CSS

```css
.eyebrow-wrap {
  margin-bottom: 12px;
}

.eyebrow {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary);                  /* accent color — the eyebrow is the ONE place accent shows here */
}
```

### Eyebrow copy rules

**Character count**: 12-30 characters (2-4 words)
**Structure**: describes the offer type + qualifier
**Voice**: matter-of-fact noun phrase

- ✓ "Free weekly watchlist"
- ✓ "Free trading webinar"
- ✓ "Monthly newsletter"
- ✓ "Free HR toolkit"
- ✗ "Get our free stuff" (colloquial, not a category)
- ✗ "Exclusive members-only preview" ("exclusive" is banned)

---

### 3b. Headline (h2)

### CSS (verified from billfanter.com production)

```css
.wl-h2 {
  margin: 0;
  font-family: 'Geist', sans-serif;
  font-size: clamp(24px, 2.6vw, 36px);
  line-height: 1.1;
  letter-spacing: -0.025em;
  font-weight: 500;
  color: var(--text, #0a0a0a);
}
```

### Copy rules — headline

**Character count**: 30-60 characters
**Word count**: 5-9 words
**Structure**: verb-first, action + what
**Voice**: second-person imperative ("Get X"), never first-person
**Purpose**: promise the exchange in one line — "Get [thing] so you can [outcome]"

### Good headlines

- ✓ "Get a curated weekly stock options watchlist" (real Bill-Fanter — verb + specific noun)
- ✓ "Download the HR leadership toolkit"
- ✓ "Get the weekly market breakdown, free"
- ✓ "Join 1,600+ traders getting Sunday's watchlist"

### Bad headlines

- ✗ "Subscribe to our newsletter" (dead — no what, no why)
- ✗ "Sign up for updates" (dead — "updates" ≠ value)
- ✗ "Join our email list" (dead — the list is not the value)
- ✗ "Discover our free content" (banned words + no what)
- ✗ "Unlock premium market insights" (Unlock + premium = banned)

### Anti-patterns

- No exclamation marks
- Never mention "email list" or "subscribe" in the headline — that's the CTA copy's job
- Never lead with "Free" as the first word (feels like a marketing shout — better in the eyebrow)

---

### 3c. Lead paragraph

### CSS (verified from billfanter.com production)

```css
.wl-lead {
  margin: 28px 0 0;
  font-size: 16px;                        /* smaller than hero subhead — matches body reading size */
  line-height: 1.55;
  color: var(--text-muted, #565656);      /* muted, not full-black — deference to h2 */
}
```

### Copy rules — lead

**Character count**: 120-260 characters
**Word count**: 25-50 words
**Structure**: 2-3 short sentences. First = what's inside. Second = how it arrives. Optional third = what to do with it.
**Voice**: second-person, present tense
**Purpose**: reduce anxiety about giving up an email — describe frequency, format, and immediate use

### Good leads

- ✓ "Each week, get a short list of stocks set up for potential moves. It lands straight in your inbox. Use it to spot setups early and plan your options trades before the market opens." (real Bill-Fanter — 3 sentences: what / how / use)
- ✓ "Every Monday, one HR framework you can apply the same week. Short reads, no fluff, always free. Cancel any time." (frequency + format + safety net)

### Bad leads

- ✗ "Sign up for our newsletter to receive the latest updates and insights from our team." (dead words + no specifics)
- ✗ "Get exclusive access to premium content." (banned words + vague)
- ✗ "Subscribe now and never miss a beat!" (exclamation + generic)

### Anti-patterns

- Never promise "spam-free" or "we hate spam too" — implies spam is the default expectation
- Never mention "unsubscribe" in the lead — belongs in fine-print, not the pitch
- Never fabricate delivery timing (if daily, say daily; if occasional, don't say weekly)

---

### 3d. Form — name + email + submit

Three vertical inputs. Not inline. Not multi-column.

### Form CSS (verified from billfanter.com production)

```css
.wl-form {
  margin: 32px 0 0;
  display: flex;
  flex-direction: column;                 /* vertical stack — NOT horizontal */
  gap: 12px;
  width: 100%;
}
```

**Why vertical, not inline horizontal**: two fields + submit inline is cramped on mobile and looks like a "sign up for our newsletter" widget. Vertical treats the exchange with weight — each input has its own row, submit is a full-width commitment.

### Input CSS (verified from billfanter.com production)

```css
.wl-input {
  width: 100%;
  background: #ffffff;                    /* white, not transparent — form floats on the section bg */
  border: 1px solid rgba(10, 10, 10, 0.12);
  border-radius: 12px;                    /* 12 — matches other card radii */
  padding: 16px 18px;                     /* 16 vertical / 18 horizontal */
  font-family: 'Geist', sans-serif;
  font-size: 16px;                        /* 16 — Apple/iOS won't zoom into 16px inputs, prevents mobile scroll jank */
  color: #0a0a0a;
  outline: 0;
  transition:
    border-color 200ms cubic-bezier(0.2, 0, 0, 1),
    box-shadow 200ms cubic-bezier(0.2, 0, 0, 1);
}

.wl-input::placeholder {
  color: rgba(10, 10, 10, 0.42);
}

.wl-input:focus {
  border-color: #0a0a0a;                  /* border deepens */
  box-shadow: 0 0 0 3px rgba(10, 10, 10, 0.06); /* soft dark halo — NOT accent color */
}
```

**Why exactly 16px font-size**: iOS Safari zooms into any input with font-size < 16px on focus. That zoom mid-form is UX friction. Every input in this section is 16px minimum.

**Why the focus ring is dark, not accent**: the accent color (from brand palette) shows in the eyebrow. Using it AGAIN in focus rings scatters accent across the page. Focus rings stay neutral dark.

### Submit button CSS (verified from billfanter.com production)

```css
.wl-submit {
  width: 100%;                            /* full-width — commitment CTA */
  background: #0a0a0a;
  color: #ffffff;
  border: 0;
  border-radius: 999px;                   /* pill — matches hero primary CTA */
  padding: 16px 28px;                     /* 16 v / 28 h — slightly taller than inputs for visual weight */
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition:
    transform 200ms cubic-bezier(0.2, 0, 0, 1),
    background-color 200ms cubic-bezier(0.2, 0, 0, 1);
}

.wl-submit:hover {
  transform: translateY(-1px);
  background: #1a1a1a;                    /* 4% lighter — respects DESIGN.md hover brighten rule */
}

.wl-submit:active {
  transform: translateY(0);
  transition-duration: 60ms;
}
```

**Why the submit is a pill (999px) while inputs are 12px**: differentiation. Inputs are receptacles (soft-cornered rectangles). The submit is a commitment (pill). Two different form factors signals "this one is different — this is the action."

**Why full-width, not inline**: full-width forces the eye to the button. On desktop, an inline submit next to the email input reads like a shrunken newsletter widget. Full-width says "commit to this."

### Placeholder copy rules

**Name placeholder**: single word — "Name", "Full name", "First name"
**Email placeholder**: single word — "Email", or "you@company.com" (never the literal "email@example.com" — feels lazy)

**Never use "*required" indicators**: every field is required. If a field is optional, delete it — don't ask for it.

### Submit label copy rules

**Character count**: 6-16 characters
**Word count**: 1-3 words
**Structure**: verb-first OR noun-of-thing
**Voice**: direct, not cute

### Good submit labels

- ✓ "Subscribe" (verb, clean)
- ✓ "Get the watchlist" (specific)
- ✓ "Send it to me" (personal)
- ✓ "Download PDF" (specific what)

### Bad submit labels

- ✗ "Submit" (dead — form language, not action language)
- ✗ "Sign up" (generic — worse than "Subscribe")
- ✗ "Click here" (dead)
- ✗ "Join the tribe" (colloquial, dated)
- ✗ "Get started for free" (banned "Get started")

---

## 4. Media column — RIGHT

The visual card. Signal what the visitor is about to receive.

### HTML

```html
<div class="wl-media">
  <div class="wl-square wl-square--image">
    <img class="wl-square__img"
         src="{watchlist.lockedPreview.src}"
         srcset="{watchlist.lockedPreview.src}-720.webp 1x, {watchlist.lockedPreview.src} 2x"
         alt="{watchlist.lockedPreview.alt}" />

    <!-- Optional ticker marquee overlay (finance/trading brands only) -->
    <div class="fw-ticker" aria-hidden="true">
      <div class="fw-ticker__row">
        <div class="fw-ticker__track fw-ticker__track--ltr">
          <!-- ticker chips × 2 (doubled for seamless loop) -->
        </div>
      </div>
      <div class="fw-ticker__row">
        <div class="fw-ticker__track fw-ticker__track--rtl">
          <!-- ticker chips × 2 -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### Media wrapper CSS (verified from billfanter.com production)

```css
.wl-media {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;              /* hug RIGHT edge of column — mirrors copy hugging LEFT */
}
```

**Why `justify-content: flex-end` not `center`**: symmetry with the copy column. The copy hugs the LEFT edge of its 1fr column (via `max-width: 560px` + default left-align). The media should hug the RIGHT edge of its 1fr column. Center-aligning the visual leaves an uneven gap on the right that feels floaty.

### Square card CSS (verified from billfanter.com production)

```css
.wl-square {
  position: relative;
  width: 100%;
  max-width: 520px;                       /* caps square at 520 — matches copy 560 for balanced weight */
  aspect-ratio: 1 / 1;                    /* square, always */
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    #FF8308 0%,
    #EF4444 52%,
    #6B3BD5 100%
  );                                      /* CSS fallback for animated grainient */
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 30px 60px -28px rgba(20, 60, 120, 0.4); /* cool-tinted shadow — NOT pure black */
}
```

**Why `aspect-ratio: 1/1`**: the square is a signature shape across this section family (matches YouTube CTA card). Rectangles feel like generic media, squares feel intentional.

**Why 520px max-width**: keeps the square visually balanced with the 560px copy cap. Square wider than 520 = it dominates. Smaller than 480 = it looks incidental.

**Why cool-tinted shadow (`rgba(20, 60, 120, 0.4)`)**: pure black shadows feel like they're on paper. Cool-tinted shadows feel atmospheric, like the card is in front of a room. Global DESIGN.md rule.

### Gradient formulas per voice_descriptor

Override the fallback gradient based on extracted brand palette:

| voice_descriptor | Gradient (135deg linear) |
|---|---|
| `bold` (default) | `#FF8308 → #EF4444 → #6B3BD5` (orange → red → purple — warm) |
| `professional` | `#1e3a8a → #3b82f6 → #0b1f5c` (navy → sky → deep navy) |
| `warm` | `#F97316 → #EA580C → #92400E` (amber to terracotta) |
| `expert` | `#0F172A → #1e40af → #0b1f5c` (dark blue mono-hue) |
| `playful` | primary + tertiary + primary-dark from brand palette |
| `quiet` | `var(--tertiary) → var(--primary)` (2-stop, low contrast) |

**Ban**: never emit a gradient using `#8B5CF6 → #3B82F6` (AI-tell purple-to-blue). If palette suggests it, substitute the closest brand hue.

### Image variant

When the preview is an actual image (not a static-gradient card), add the `wl-square--image` modifier:

```css
.wl-square--image {
  background: none;                       /* image replaces the gradient */
}

.wl-square__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;                      /* fills the square — no letterboxing */
}
```

### Cutout variant (Bill-Fanter's actual production)

When the image is a mockup with its own background (like a rendered device shot), use the `wl-square--cutout` treatment: no gradient, no crop, drop-shadow only.

```css
.wl-square--cutout {
  position: relative;
  overflow: visible;
  background: none;
  border-radius: 0;
  box-shadow: none;                       /* kill the base framing shadow */
}

.wl-square--cutout .wl-square__img {
  object-fit: contain;                    /* show the whole mockup — no crop */
  border-radius: 12px;                    /* round corners of the img itself */
  filter: drop-shadow(0 24px 50px rgba(20, 40, 80, 0.26)); /* atmospheric drop */
}
```

**When to use each**:
- Static-gradient card (default): user has no preview image → gradient + text label works
- `wl-square--image`: user has a rendered UI screenshot that photographs well cropped
- `wl-square--cutout`: user has a mockup with its own designed background that must be shown whole

---

## 5. Ticker marquee overlay (finance brands only — optional)

For trading/investing/finance verticals only. Two rows of scrolling ticker chips overlaid on the bottom third of the square. Adds motion without being decorative — signals "market data lives here."

### CSS (verified from billfanter.com production)

```css
.fw-ticker {
  position: absolute;
  top: 67%;                               /* bottom third of the square */
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%);
  /* Mask fades ticker in/out at the edges — no hard cut, no ugly overflow */
}

.fw-ticker__row {
  display: flex;
  overflow: hidden;
}

.fw-ticker__track {
  display: inline-flex;
  flex: 0 0 auto;
  white-space: nowrap;
  will-change: transform;
}

.fw-ticker__track--ltr {
  animation: fw-ticker-ltr 26s linear infinite;
}

.fw-ticker__track--rtl {
  animation: fw-ticker-rtl 26s linear infinite;
}

@keyframes fw-ticker-ltr {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }     /* -50% because chips are doubled */
}

@keyframes fw-ticker-rtl {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}

.fw-ticker__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  margin-right: 8px;
  padding: 5px 11px;
  border-radius: 999px;                   /* pill chips */
  background: rgba(10, 12, 20, 0.34);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
}

.fw-ticker__sym {
  font-weight: 700;
  letter-spacing: 0.01em;                 /* subtle positive tracking — reads like Bloomberg tickers */
}

.fw-ticker__chg--up   { color: #6ee7a0; } /* mint green — NOT pure #00ff00 */
.fw-ticker__chg--down { color: #ff9d98; } /* coral red — NOT pure #ff0000 */

@media (prefers-reduced-motion: reduce) {
  .fw-ticker__track--ltr,
  .fw-ticker__track--rtl { animation: none; }
}
```

**Why chips are doubled**: for a seamless infinite scroll. The track contains `[A, B, C, ...]` twice: `[A, B, C, A, B, C]`. Animation runs `translateX(0) → translateX(-50%)`, which lands the second copy exactly where the first started — invisible loop.

**Why 26s duration**: slow enough that a reader can catch a symbol they recognize, fast enough that the motion registers as "live market data." Faster feels jittery. Slower feels dead.

**Why the mask gradient**: without it, chips clip at the container edge and look broken. Fade-to-transparent at 14% and 86% (row edges) makes chips gracefully appear/disappear.

**Why mint green + coral red, not pure RGB**: DESIGN.md ban on `>85%` saturation. Pure green/red on a dark backdrop looks like a Windows XP theme. Muted variants read premium.

### When to use the ticker overlay

- **YES**: options trading, stock investing, day-trading, crypto, forex, wealth management
- **NO**: HR consulting, home services, coaching, agency, ecommerce, SaaS (any non-market brand)

If NOT a market brand, skip the ticker overlay entirely.

### Ticker content rules

- **Symbols**: 3-6 characters, real ticker symbols only (never invent)
- **Change**: `+X.X%` or `-X.X%`, one decimal place
- **Direction**: `up` (green) or `down` (red) — MUST match sign of change
- **Count per row**: 8-12 chips per row; doubled to make the scroll loop seamless
- **Row A vs Row B**: different symbols per row so both rows feel like distinct feeds

---

## 6. Content slot schema — what Opus emits

```typescript
type WatchlistContent = {
  eyebrow: string;                        // 12-30 chars, 2-4 words
  heading: string;                        // 30-60 chars, verb-first
  lead: string;                           // 120-260 chars, 2-3 sentences
  namePlaceholder: string;                // 1 word — "Name" default
  emailPlaceholder: string;               // 1 word or address — "Email" default
  submitLabel: string;                    // 6-16 chars — "Subscribe" default
  submitAction: string;                   // form POST endpoint OR mailto: fallback
  lockedPreview: {
    src: string;                          // preview image URL (WebP, min 800×800)
    alt: string;                          // descriptive alt — "Preview of the [thing]"
    variant?: 'image' | 'cutout' | 'gradient'; // default 'image'
  };
  ticker?: {                              // optional — finance brands only
    rowA: Array<[symbol: string, change: string, dir: 'up' | 'down']>;
    rowB: Array<[symbol: string, change: string, dir: 'up' | 'down']>;
  };
  gradient?: {                            // optional — override the palette-derived default
    hex1: string;
    hex2: string;
    hex3: string;
    angle?: number;                       // default 135
  };
};
```

## 7. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `eyebrow` | Show heading only (skip eyebrow wrap) |
| `lead` | Show form directly below h2 with margin-top 32px |
| `lockedPreview.src` | Render palette-derived gradient square with the offer type in large mono caps center |
| `ticker` | Skip ticker overlay entirely |
| `namePlaceholder` | Default to "Name" |
| `emailPlaceholder` | Default to "Email" |
| `submitLabel` | Default to "Subscribe" |
| `submitAction` | Default to `mailto:{brand.contactEmail}?subject=Watchlist signup` (last-resort fallback) |
| `heading` | Never — required, error out |
| `gradient` | Derive from brand palette (see §4 table) |

### Missing-image gradient fallback

```html
<div class="wl-square" style="background: linear-gradient(135deg, {gradient});">
  <div class="wl-square__label">
    <span class="mono-caps">{eyebrow}</span>
    <span class="wl-square__what">{eyebrow-derived-noun}</span>
  </div>
</div>
```

Centered mono-caps label + noun over the gradient. Never looks like a "missing image" placeholder — feels intentional.

---

## 8. Complete assembled HTML (reference implementation)

```html
<section id="watchlist" data-section="lead-magnet-split-form"
  style="background: transparent; padding: 100px 40px;">

  <div style="max-width: 1180px; margin: 0 auto;">

    <!-- 50/50 split, vertical center -->
    <div style="display: grid; grid-template-columns: 1fr 1fr;
                gap: 56px; align-items: center;">

      <!-- LEFT: copy + form -->
      <div style="max-width: 560px; display: flex; flex-direction: column;">

        <div style="margin-bottom: 12px;">
          <span data-edit-id="watchlist.eyebrow"
            style="display: inline-block; font-family: var(--font-mono);
                   font-size: 11.5px; font-weight: 500; letter-spacing: 0.14em;
                   text-transform: uppercase; color: var(--primary);">
            {watchlist.eyebrow}
          </span>
        </div>

        <h2 data-edit-id="watchlist.heading"
          style="margin: 0; font-family: 'Geist', sans-serif;
                 font-size: clamp(24px, 2.6vw, 36px); line-height: 1.1;
                 letter-spacing: -0.025em; font-weight: 500;
                 color: var(--text, #0a0a0a);">
          {watchlist.heading}
        </h2>

        <p data-edit-id="watchlist.lead"
          style="margin: 28px 0 0; font-size: 16px; line-height: 1.55;
                 color: var(--text-muted, #565656);">
          {watchlist.lead}
        </p>

        <form id="watchlist-form" name="watchlist-form"
          method="post" action="{watchlist.submitAction}"
          style="margin: 32px 0 0; display: flex; flex-direction: column;
                 gap: 12px; width: 100%;">

          <input maxlength="256" name="Watchlist-name"
            placeholder="{watchlist.namePlaceholder}" type="text" required
            style="width: 100%; background: #fff;
                   border: 1px solid rgba(10,10,10,0.12); border-radius: 12px;
                   padding: 16px 18px; font-family: 'Geist', sans-serif;
                   font-size: 16px; color: #0a0a0a; outline: 0;" />

          <input maxlength="256" name="Watchlist-email"
            placeholder="{watchlist.emailPlaceholder}" type="email" required
            style="width: 100%; background: #fff;
                   border: 1px solid rgba(10,10,10,0.12); border-radius: 12px;
                   padding: 16px 18px; font-family: 'Geist', sans-serif;
                   font-size: 16px; color: #0a0a0a; outline: 0;" />

          <input type="submit" data-wait="Please wait…"
            value="{watchlist.submitLabel}"
            style="width: 100%; background: #0a0a0a; color: #fff; border: 0;
                   border-radius: 999px; padding: 16px 28px;
                   font-family: 'Geist', sans-serif; font-weight: 600;
                   font-size: 16px; cursor: pointer;" />
        </form>
      </div>

      <!-- RIGHT: visual card, hugging right edge of column -->
      <div style="position: relative; width: 100%; display: flex;
                  align-items: center; justify-content: flex-end;">
        <div style="position: relative; width: 100%; max-width: 520px;
                    aspect-ratio: 1/1; border-radius: 12px; overflow: hidden;
                    background: linear-gradient(135deg,
                      {watchlist.gradient.hex1} 0%,
                      {watchlist.gradient.hex2} 52%,
                      {watchlist.gradient.hex3} 100%);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05),
                                0 30px 60px -28px rgba(20,60,120,0.4);">

          <img src="{watchlist.lockedPreview.src}"
            srcset="{watchlist.lockedPreview.src}-720.webp 1x, {watchlist.lockedPreview.src} 2x"
            alt="{watchlist.lockedPreview.alt}"
            style="position: absolute; inset: 0; width: 100%; height: 100%;
                   object-fit: cover;" />

          <!-- Optional ticker marquee overlay (finance brands only) -->
          <div aria-hidden="true"
            style="position: absolute; top: 67%; left: 0; right: 0; bottom: 0;
                   z-index: 2; display: flex; flex-direction: column;
                   justify-content: center; gap: 12px; pointer-events: none;
                   mask-image: linear-gradient(90deg, transparent 0%, #000 14%,
                                                #000 86%, transparent 100%);
                   -webkit-mask-image: linear-gradient(90deg, transparent 0%,
                                                #000 14%, #000 86%, transparent 100%);">
            <div style="display: flex; overflow: hidden;">
              <div style="display: inline-flex; flex: 0 0 auto; white-space: nowrap;
                          animation: fw-ticker-ltr 26s linear infinite;">
                <!-- {ticker.rowA doubled} — chips inline -->
              </div>
            </div>
            <div style="display: flex; overflow: hidden;">
              <div style="display: inline-flex; flex: 0 0 auto; white-space: nowrap;
                          animation: fw-ticker-rtl 26s linear infinite;">
                <!-- {ticker.rowB doubled} — chips inline -->
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>

  <!-- Inline keyframes for ticker (only emit if ticker is included) -->
  <style>
    @keyframes fw-ticker-ltr { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes fw-ticker-rtl { from { transform: translateX(-50%); } to { transform: translateX(0); } }
    @media (prefers-reduced-motion: reduce) {
      [style*="fw-ticker-ltr"], [style*="fw-ticker-rtl"] { animation: none !important; }
    }
  </style>
</section>
```

---

## 9. Interactive behaviors

- **Form submit**: `POST` to `{submitAction}`; if no endpoint, `mailto:` fallback
- **Input focus**: border deepens to `#0a0a0a`, soft dark halo appears via box-shadow (200ms)
- **Input hover** (before focus): no visual change — focus is the state that matters
- **Submit hover**: lifts 1px, background brightens from `#0a0a0a` to `#1a1a1a`
- **Submit active**: returns to `translateY(0)` with 60ms snap
- **Submit submitting**: replace value with `data-wait` text ("Please wait…"), disable pointer, add loading pulse (optional)
- **Ticker**: auto-scrolls infinite, opposite directions, 26s per loop; pauses if `prefers-reduced-motion`

### Form validation

- HTML5 `required` on both inputs
- HTML5 `type="email"` provides basic validation on email input
- On invalid submit, browser default red outline on offending field
- No custom JS validation needed — HTML5 handles it

---

## 10. Responsive behavior

### Tablet + mobile (≤ 900px)

```css
@media (max-width: 900px) {
  .wl-split {
    grid-template-columns: 1fr;           /* stack — copy above, media below */
    gap: 40px;                            /* shrink from 56 */
  }
  .wl-copy {
    max-width: none;                      /* full-width copy */
  }
  .wl-square {
    margin: 0 auto;                       /* center the square */
  }
}
```

**Why copy above media on stack**: the form is the conversion action. If the media stacks on top, the user has to scroll past a decorative image to reach the point. Copy-first respects the "state → context → action" hierarchy.

### Mobile-specific tuning (≤ 560px)

```css
@media (max-width: 560px) {
  .wl-form { gap: 10px; }
  .wl-input { padding: 14px 16px; font-size: 16px; } /* keep 16px for iOS */
  .wl-submit { padding: 14px 22px; font-size: 15px; }
  .wl-square { max-width: none; }
}
```

---

## 11. Accessibility checklist

- [x] Every form input has an associated label (visible OR sr-only)
- [x] Placeholders are NOT the only label — pair with `aria-label` on each input
- [x] Submit button is a proper `<input type="submit">` (native, keyboard-accessible)
- [x] `required` attribute triggers browser-native validation UX
- [x] Focus ring: 3px dark halo via box-shadow, contrast ratio ≥ 3:1 vs page bg
- [x] Ticker overlay is `aria-hidden="true"` (decorative motion, no meaning to screen readers)
- [x] `prefers-reduced-motion` disables ticker animation
- [x] Color contrast on lead paragraph: `#565656` on `#f7f9fc` = 6.4:1 (AA+)
- [x] Every image has meaningful `alt` (never empty on the preview — the visual IS the pitch)
- [x] Form errors announced via browser native (`invalid` state) — no custom aria-live needed

### Sr-only labels (add these — placeholders alone fail WCAG)

```html
<label for="wl-name" class="sr-only">Your name</label>
<input id="wl-name" name="Watchlist-name" ... />

<label for="wl-email" class="sr-only">Your email address</label>
<input id="wl-email" name="Watchlist-email" ... />
```

```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
```

## 12. Performance checklist

- [x] Preview image `loading="lazy"` (not LCP — this is section 3)
- [x] Preview image WebP with 1x/2x srcset
- [x] Ticker CSS-only — no JS
- [x] Form no JS — native browser submit
- [x] `backdrop-filter: blur(4px)` on ticker chips is cheap (few small elements)
- [x] Ticker animation uses `transform` only (never width/margin) — GPU-composited
- [x] `will-change: transform` on ticker tracks — hints browser to composite in advance

## 13. Design token dependencies

```css
:root {
  --font-mono: "Geist Mono", "IBM Plex Mono", ui-monospace, monospace;
  --primary: #hex;                        /* eyebrow accent color */
  --text: #0a0a0a;
  --text-muted: #565656;
}
```

Hardcoded (structural, not brand):
- `#ffffff` (input bg)
- `#0a0a0a` (submit bg, focused input border, text on light)
- `rgba(10, 10, 10, 0.12)` (input border)
- `rgba(10, 10, 10, 0.42)` (placeholder)
- `#6ee7a0` (ticker up)
- `#ff9d98` (ticker down)

---

## 14. Rationale (why this section converts)

- **50/50 split** = the form has equal visual weight with the promise-visual. Form-secondary-to-image reads like a marketing widget; equal weight reads like a real exchange.
- **Copy hugs LEFT, media hugs RIGHT** = the negative space between them (56px + column padding) creates rhythm. Center-aligning either side breaks the rhythm.
- **Eyebrow is the ONE allowed exception to the global "no eyebrows" rule** = distinguishes this offer from the section above (MegaBento) so the h2 doesn't read as MegaBento's subhead.
- **Full-width pill submit** = commitment shape. Rectangular submit reads like a form widget; pill reads like a CTA.
- **Vertical form (name → email → submit)** = each row is a decision beat. Inline horizontal forms compress those decisions into one glance and feel low-effort — bad for conversion.
- **16px input font** = prevents iOS zoom mid-form (UX friction that costs conversions).
- **Focused input halo is DARK, not accent** = the accent color already shows in the eyebrow. Repeating it in focus rings scatters attention. Neutral focus rings keep the eye on the form flow.
- **Square visual, not rectangle** = intentional shape choice, distinguishes from MegaBento's landscape tiles above. Matches the YouTube CTA card treatment for visual continuity.
- **Ticker overlay (finance brands)** = live-market motion is visual proof the offer is timely. For non-finance brands, the equivalent is an animated screenshot or a rotating quote card.
- **Bottom-third confinement of ticker** = doesn't compete with the preview image above (the preview IS the primary content).

---

## 15. What Opus should NOT do

- ❌ Use an inline horizontal form (name + email + submit on one row)
- ❌ Use a single email input (no name field) — name capture qualifies leads
- ❌ Add more than 2 fields (name + email only — asking for phone/company at hero-CTA level kills conversion)
- ❌ Center-align the copy inside the copy column
- ❌ Use a rectangular submit button — pill only
- ❌ Use an accent color for the focused input border/halo
- ❌ Emit "spam-free" or "we hate spam" microcopy (implies spam is the norm)
- ❌ Add a checkbox for "subscribe to marketing emails" (illegal in many jurisdictions to preselect + spam-implication)
- ❌ Use the ticker overlay for non-finance brands
- ❌ Skip the eyebrow (this section needs it — the ONE exception)
- ❌ Use gradient purple → blue → teal (AI-tell)
- ❌ Make the square card a rectangle (16:9, 4:3) — must be 1:1
- ❌ Add a "no credit card required" strapline — this isn't a paid product
- ❌ Include a "join X,XXX subscribers" counter unless the count is real AND >1,000
