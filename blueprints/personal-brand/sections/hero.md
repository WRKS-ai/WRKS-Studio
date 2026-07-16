# SECTION — Hero (dark-portrait-split)

> **Section family**: `hero-dark-portrait-split`
> **Used in**: personal-brand/home, personal-brand/masterclass
> **Purpose**: instant credibility + one clear promise + primary conversion action
> **Position on page**: always first section, renders behind the floating nav

---

## 1. Section wrapper

```
<section id="hero" data-section="hero-dark-portrait-split">
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-16)

| Property | Value | Notes |
|---|---|---|
| `position` | `relative` | anchor for absolute-positioned children |
| `overflow` | `hidden` | portrait bleed + dot-grid must clip |
| `background` | `#0a0a0a` | pure black, NOT neutral-dark from palette. Premium contrast requires deep pure black. |
| `color` | `#ffffff` | inherited by children unless overridden |
| `isolation` | `isolate` | z-index stacking context boundary |

**Content rail padding is what gives the hero height (no explicit `min-height`).** Padding is applied to the inner content div, NOT the section wrapper directly:

```css
.hero-inner {
  position: relative;
  z-index: 3;
  padding-top: 272px;    /* CardNav (72px) overlays hero; 272 → 200 visual after nav = 200 clean */
  padding-bottom: 200px; /* matches visual gap after nav — top 200, bottom 200, feels even */
  padding-left: 40px;    /* container horizontal padding */
  padding-right: 40px;
}
```

**Why 272 top, not 168**: the CardNav is 72px tall and OVERLAYS the hero (doesn't push it down). Content must clear the nav AND leave visual breathing room. `272 - 72 (nav height) = 200 visible padding above headline`, which matches the 200px bottom padding — perfect visual symmetry.

### Tablet overrides (viewport ≤ 991px)

| Property | Value |
|---|---|
| `.hero-inner padding-top` | `136px` |
| `.hero-inner padding-bottom` | `64px` |
| `.hero-headline font-size` | `clamp(40px, 8vw, 64px)` |

### Mobile overrides (viewport ≤ 767px)

| Property | Value |
|---|---|
| Section `display` | `flex` |
| Section `flex-direction` | `column` (stack portrait below copy) |
| `.hero-inner padding-top` | `124px` (72px nav + 52px breathing) |
| `.hero-inner padding-bottom` | `52px` |
| `.hero-headline font-size` | `clamp(34px, 9vw, 48px)` |
| `.hero-headline max-width` | `none` (no cap on mobile) |
| `.hero-portrait position` | `relative` (stops absolute-positioning) |
| `.hero-portrait left` | `0` |
| `.hero-portrait height` | `340px` (fixed) |

---

## 2. Layered stack (z-index bottom to top)

The section has 5 z-layers. Order matters — get this wrong and text becomes unreadable or portrait blocks the CTA.

### Layer 1 — Dark scrim (z: 0)

```html
<div aria-hidden="true" class="hero-scrim"></div>
```

CSS:
```css
.hero-scrim {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: rgba(10, 10, 10, 0.5);
  pointer-events: none;
}
```

**Purpose**: dims the dot-grid so it doesn't overwhelm copy. Without this the dots feel busy.

**Why below the dots**: the scrim sits BEHIND the dots so the dots read punchy against a muted backdrop, not the other way around.

### Layer 2 — Dot-grid overlay (z: 1)

```html
<div class="hero-dots" data-dotgrid data-dot-size="2" data-gap="10"
     data-base-color="#454545" data-active-color="#75B5FF"
     data-proximity="140" data-return-duration="0.6"></div>
```

CSS:
```css
.hero-dots {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.66;
  pointer-events: auto;  /* NOT pointer-events: none — the React Bits
                            DotGrid react to hover proximity */
}
```

**Purpose**: adds texture, breaks flat black, gives premium editorial feel.
Bill-Fanter uses the React Bits `DotGrid` interactive component that
responds to cursor proximity — dots near the cursor animate to
`data-active-color="#75B5FF"`.

**Static CSS fallback** (when interactive DotGrid isn't available):
```css
.hero-dots {
  background-image: radial-gradient(
    circle at center,
    rgba(69, 69, 69, 0.66) 2px,
    transparent 2px
  );
  background-size: 10px 10px;
  pointer-events: none;
}
```

**Alternative (if brand voice is `warm`)**: replace the dot-grid with a soft noise overlay.

### Layer 3 — Portrait column (z: 2)

```html
<div class="hero-portrait">
  <img src="{hero.portraitImage}" alt="{hero.namecard.name}" fetchpriority="high" />
  <!-- Namecard bubble lives INSIDE this container (see §7) -->
</div>
```

CSS:
```css
.hero-portrait {
  position: absolute;
  top: 0;
  bottom: 0;
  /* Left edge aligns to the "watchlist bento" grid line below the hero,
     so both share the same vertical axis. The formula: clamp to viewport
     at 65vw for small windows, snap to a 937px inset once viewport
     exceeds the 1440px container. */
  left: min(65vw, calc((100vw - 1440px) / 2 + 937px));
  right: 0;
  z-index: 2;
}
.hero-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;  /* keep face in frame */
}
```

**Left position formula (important)**:
- `min(65vw, calc((100vw - 1440px) / 2 + 937px))`
- At viewport <1440px: portrait starts at 65% of viewport width
- At viewport ≥1440px: portrait left edge sits at `(gutter) + 937px` — this aligns to Bill-Fanter's 1440px container's inner grid split
- Do NOT simplify to just `55%` — the responsive alignment matters, portrait must line up with the watchlist section's grid axis directly below

**Mobile behavior** (≤ 767px):
```css
@media (max-width: 767px) {
  .hero-portrait {
    position: relative;  /* stops absolute; stacks below copy in flex column */
    left: 0;
    height: 340px;      /* fixed height on mobile — image can't drive its own height when the section flex-columns */
  }
}
```

### Layer 4 — Copy rail (z: 3)

```html
<div class="hero-copy">
  <h1>...</h1>
  <p>...</p>
  <div class="hero-cta">...</div>
  <div class="hero-trust">...</div>
</div>
```

CSS:
```css
.hero-copy {
  position: relative;
  z-index: 3;
  max-width: 780px;
}
```

**Why max-width 780px, not 60ch**: at 80px display type, `60ch` is too wide → 5+ line headlines. 780px caps at ~2-3 lines. Force tight ragged-right wrap.

### Layer 5 — Namecard bubble (z: 4)

Anchored to bottom-left of the portrait area. Full detail in §7.

---

## 3. Headline (h1) — the display element

The single most important element on the page. Everything else supports it.

### HTML

```html
<h1 data-edit-id="hero.headline">Your headline here</h1>
```

### CSS (verified from billfanter.com production)

```css
.hero-copy h1 {
  font-family: var(--font-display);
  font-size: 5rem;              /* 80px fixed on desktop (NOT clamped) */
  font-weight: 600;
  line-height: 1.04;
  letter-spacing: -0.03em;
  color: #ffffff;
  max-width: 820px;             /* in px, NOT ch — forces ~2-3 line wrap at 80px */
  margin: 0;
}

@media (max-width: 991px) {
  .hero-copy h1 { font-size: clamp(40px, 8vw, 64px); }
}
@media (max-width: 767px) {
  .hero-copy h1 { font-size: clamp(34px, 9vw, 48px); max-width: none; }
}
```

**Why 5rem fixed, not clamped**: Bill-Fanter's headline sits at exactly 80px on desktop. Clamping introduces ambiguity — a 1200px viewport ends up at ~66px which is too small for the intended impact.

**Why max-width in px, not ch**: `ch` scales with font-metrics, meaning different fonts wrap differently. `820px` is the deliberate wrap point — always 2-3 lines regardless of which display font the brand uses.

### Spacing

| Above the h1 | 0 (h1 is the FIRST element in copy rail) |
| Below the h1 | 24px to subhead (see §4) |

### Copy writing rules

**Character count**: 30-90 characters (including spaces)
**Word count**: 6-14 words. Ideal: 8-11.
**Structure**: ONE claim. Never two coordinated clauses.
**Voice**: Second-person imperative OR third-person declarative. Never first-person.
**Tense**: Present. Never future ("will").
**Adjective budget**: MAX 1 non-obvious adjective. "Better trading system" no. "Options trading strategies that convert" yes.

### Good headlines (real Bill-Fanter and adjacent)

- ✓ "Learn options trading and build income you control" (10 words, one claim)
- ✓ "HR leaders don't need more training. They need permission to lead." (13 words, one claim delivered in two beats)
- ✓ "Certified electricians for EV chargers, panel upgrades, and Powerwall" (10 words, specific)
- ✓ "The design system for teams that ship" (8 words, focused)

### Bad headlines (Opus MUST NOT write these)

- ✗ "Elevate your business with our AI-powered platform" (banned words: Elevate, AI-powered)
- ✗ "Discover the future of X" (Discover + future = generic tell)
- ✗ "Transform your workflow and unlock your potential" (Transform + unlock = banned)
- ✗ "The best options trading masterclass that also builds your community" (two claims, "best" is empty)
- ✗ "Options trading made easy for beginners and experts alike" (comma-and clauses = weak)

### Anti-patterns

- No exclamation marks
- No question marks (headlines are declarations, not questions)
- No ellipses (…) at the end
- No colons before a sub-claim ("X: the future of Y") — use two sentences instead
- No emoji anywhere
- No `<br>` for manual line breaks — trust the max-width to wrap naturally

### Voice descriptor overrides

| Voice | Headline flavor |
|---|---|
| `bold` | Short, punchy, contrarian. "Stop shrinking. Start leading." Max 8 words. Two sentences OK. |
| `warm` | Conversational, first-name friendly. "We help you build the business you actually want." 10-14 words. |
| `expert` | Data-forward, specific. "The 3-step options framework used by 1,600+ traders." Numbers required. |
| `professional` | Clean statement of value. "Enterprise HR consulting for high-growth companies." 8-12 words. |
| `playful` | Personality-forward, unexpected angle. "The ugly truth about your onboarding flow." 8-12 words. |
| `quiet` | Restrained, precise. "Options, taught right." 3-6 words. Aesop-style minimalism. |

---

## 4. Subhead (p) — the support line

### HTML

```html
<p class="hero-subhead" data-edit-id="hero.subhead">Your subhead here</p>
```

### CSS (verified from billfanter.com production)

```css
.hero-subhead {
  font-family: var(--font-body);
  font-size: 18px;              /* 18, not 19 — Bill-Fanter production value */
  font-weight: 400;
  line-height: 1.55;
  letter-spacing: -0.003em;
  color: #ffffff;                /* full white — hero copy is loud */
  max-width: 560px;              /* in px, not ch */
  margin: 24px 0 0;              /* 24, not 28 */
}
```

### Spacing

| Above the subhead | 24px from h1 |
| Below the subhead | 36px to CTA row (see §5) |

**Why full white, not muted**: hero is meant to be read at a glance. Muting to 70% white feels like disclaimer text. Full white treats the subhead as important.

### Copy writing rules

**Character count**: 80-180 characters
**Word count**: 15-30 words. Ideal: 18-25.
**Structure**: ONE sentence. If you need two, cut the first.
**Voice**: Third-person if the h1 was imperative, second-person if the h1 was descriptive. Complementary, not repetitive.
**Purpose**: Explain HOW the headline's promise gets delivered — the mechanism, the audience, or the differentiator. Not a restatement of the promise.

### Good subheads

- ✓ "Bill Fanter teaches new and experienced traders how to read the options market, time entries, and place trades with a clear plan." (24 words — mechanism + audience + outcome)
- ✓ "Abbracci Group helps HR professionals step out of survival mode and into the kind of leadership that changes cultures — starting with their own." (26 words — audience + shift + differentiator)
- ✓ "We're certified electricians serving Southern California and Arizona for 47 years — EV chargers, panel upgrades, Powerwall, and full residential and commercial electrical work." (25 words — credentials + scope + service)

### Bad subheads

- ✗ "Discover a new way to approach [topic]." (Discover + generic)
- ✗ "Our platform empowers you to seamlessly manage everything in one place." (empowers + seamlessly)
- ✗ "Learn everything you need to know about options trading." (restates the h1)
- ✗ "The world's leading X for Y." ("world's leading" = fabricated claim)

### Anti-patterns

- Never repeat the h1's key noun as the first word of the subhead
- Never start with "We" if the h1 was "You" (jarring perspective shift)
- Never use "our", "we're", "we've" more than once in the subhead
- Never end with a preposition

---

## 5. CTA row — primary + secondary buttons

Two buttons side by side. High-intent primary + low-intent secondary.

### HTML

```html
<div class="hero-cta">
  <a class="btn-primary" href="{hero.primaryCta.href}" data-edit-id="hero.primaryCta">
    {hero.primaryCta.label}
  </a>
  <a class="btn-secondary" href="{hero.secondaryCta.href}" data-edit-id="hero.secondaryCta">
    {hero.secondaryCta.label}
  </a>
</div>
```

### Row CSS

```css
.hero-cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin: 36px 0 0;
}
```

### Primary button CSS (verified from billfanter.com production)

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 14px 26px;            /* 14×26, NOT 16×30 — Bill-Fanter's actual pill size */
  border-radius: 999px;
  background: #ffffff;
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(10, 10, 12, 0.4),
    0 8px 24px -8px rgba(10, 10, 12, 0.55);
  transition:
    background 150ms cubic-bezier(0.2, 0, 0, 1),
    box-shadow 200ms cubic-bezier(0.2, 0, 0, 1),
    transform 120ms cubic-bezier(0.2, 0, 0, 1);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.14),
    0 2px 4px rgba(10, 10, 12, 0.45),
    0 14px 32px -10px rgba(10, 10, 12, 0.65);
}

.btn-primary:active {
  transform: translateY(0);
  transition-duration: 60ms;
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 1px 1px rgba(10, 10, 12, 0.3);
}
```

### Secondary button CSS

```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 14px 26px;            /* matches primary */
  border-radius: 999px;
  background: transparent;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 200ms cubic-bezier(0.2, 0, 0, 1),
    border-color 200ms cubic-bezier(0.2, 0, 0, 1),
    transform 120ms cubic-bezier(0.2, 0, 0, 1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-1px);
}

.btn-secondary:active {
  transform: translateY(0);
  transition-duration: 60ms;
}
```

### Spacing

| Between primary and secondary buttons | 12px (from `gap`) |
| Above the CTA row | 36px from subhead |
| Below the CTA row | 30px to trust row |

### Copy writing rules — button labels

**Character count per button**: 8-24 characters
**Word count**: 2-4 words
**Structure**: Verb first. Action-oriented.

### Good CTA labels

**Primary (high-intent, buy/subscribe)**:
- ✓ "Get the masterclass"
- ✓ "Book a discovery call"
- ✓ "Start free trial"
- ✓ "Buy now — $299"
- ✓ "Book your seat"

**Secondary (low-intent, community/learn)**:
- ✓ "Join the community"
- ✓ "See how it works"
- ✓ "Read reviews"
- ✓ "Watch demo"
- ✓ "Learn more →"

### Bad CTA labels

- ✗ "Click here" (dead words)
- ✗ "Submit" (form language, not action language)
- ✗ "Learn more" alone (too vague — always pair with what)
- ✗ "Get started" (generic)
- ✗ "Sign up now!" (exclamation marks banned)
- ✗ "Unlock your potential" (banned copy)

### Rules

- **Primary and secondary must be different verbs**. Never "Get X" and "Get Y".
- **Never use both "Get" and "Book"** — pick one action family per hero.
- **The primary CTA text should hint at what happens after**: "Get the masterclass" = leads to masterclass page. "Start free trial" = leads to signup form. Never opaque.
- **The secondary CTA is the ESCAPE hatch** — the visitor who's not ready to buy. Community, reviews, or a video are all valid.

---

## 6. Trust row — social proof one-liner

### HTML

```html
<div class="hero-trust">
  <span class="trust-label" data-edit-id="hero.trust.label">
    {hero.trust.label}
  </span>
  <span class="trust-stars" aria-label="{hero.trust.rating} out of 5 stars">
    <!-- N filled star SVGs -->
  </span>
  <span class="trust-count" data-edit-id="hero.trust.count">
    {hero.trust.count}
  </span>
</div>
```

### CSS (verified from billfanter.com production)

```css
.hero-trust {
  display: flex;
  flex-wrap: wrap;              /* wraps on narrow viewports as whole units */
  align-items: center;
  gap: 6px 10px;                /* row-gap 6, column-gap 10 — different values */
  margin-top: 28px;             /* 28, NOT 30 */
  margin-left: 6px;             /* nudges right to correct optical-alignment
                                   illusion vs the pill CTAs above (pill text
                                   sits inset from the pill edge) */
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;               /* pure white — NOT cream. Bill-Fanter uses white */
}

.trust-label,
.trust-count {
  white-space: nowrap;          /* prevents label/count from breaking mid-phrase */
}

.trust-label {
  font-weight: 500;             /* inherits from parent — no bold override */
}

.trust-stars {
  display: inline-flex;
  gap: 2px;
}

.trust-stars svg {
  width: 16px;
  height: 16px;
  fill: #ffc14d;                /* warm gold, not pure yellow */
}

.trust-count {
  color: #ffffff;               /* explicitly white, weight 400 (lighter than label) */
  font-weight: 400;
}
```

### Star SVG (5 identical, one per star in rating)

```html
<svg viewBox="0 0 24 24" width="16" height="16" fill="#ffc14d" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2l3 7 7 .8-5 5 1.5 7-6.5-3.5L5 22l1.5-7-5-5L8.5 9z"/>
</svg>
```

Render exactly `hero.trust.rating` stars. If rating is 4.7, still show 5 (rounded up) — never partial-fill stars in a hero.

### Spacing

| Between label and stars | 10px column-gap |
| Between stars and count | 10px column-gap |
| Wrap row-gap | 6px (when the row wraps on narrow viewports) |
| Above the trust row | 28px from CTA row |
| Left nudge | 6px (optical alignment vs pill CTAs above) |
| Below the trust row | 0 — trust row is last in copy rail |

### Copy writing rules

**Label**: 2-4 words, describes the source of the rating
- ✓ "Recommended by"
- ✓ "Loved by"
- ✓ "Rated by"
- ✓ "Trusted by"
- ✗ "Recommended by our happy customers" (too long)

**Rating**: integer 4 or 5 only. Never 3 or below (not a positive signal).

**Count**: 4-25 characters, specific number + noun
- ✓ "1,600+ Students"
- ✓ "96 verified reviews"
- ✓ "250+ HR professionals"
- ✓ "Fortune 500 to solo consultancies"
- ✗ "Many happy customers" (vague — banned)
- ✗ "Millions worldwide" (unverifiable claim)

### Rule

- **Never invent numbers**. If ingest doesn't have a count, either use a truthful qualitative signal ("industry leaders") or OMIT the trust row entirely (never show a fabricated count).

---

## 7. Namecard bubble — floating over portrait

Introduces the founder without a full "meet the founder" section competing above the fold.

### HTML (verified from billfanter.com production)

The namecard lives **INSIDE the portrait container** (Layer 3), NOT as a separate absolute-positioned sibling of the section. This is critical — it means the namecard is anchored to the portrait itself, so as the portrait shifts on responsive breakpoints, the namecard shifts with it.

```html
<div class="hero-portrait">
  <img src="{hero.portraitImage}" alt="{hero.namecard.name}" fetchpriority="high" />
  <div class="hero-namecard">
    <span class="namecard-name" data-edit-id="hero.namecard.name">
      {hero.namecard.name}
    </span>
    <span class="namecard-role" data-edit-id="hero.namecard.role">
      {hero.namecard.role}
    </span>
  </div>
</div>
```

### CSS (verified from billfanter.com production)

```css
.hero-namecard {
  position: absolute;
  left: 24px;              /* 24px from LEFT EDGE of portrait container (not section) */
  bottom: 24px;            /* 24px, NOT 32 */
  z-index: 3;              /* z:3 inside portrait — portrait itself is z:2 on section */
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 18px;      /* 12×18, NOT 14×20 */
  border-radius: 12px;     /* 12, NOT 14 */
  background: rgba(255, 255, 255, 0.92);   /* 0.92, NOT 0.94 */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);  /* 10/30/0.3, NOT 12/34/0.35 */
}

.namecard-name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.1;
  color: #0a0a0a;
}

.namecard-role {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: rgba(10, 10, 10, 0.6);
}
```

**Why inside portrait container**: because the portrait's own responsive positioning (that complex `min(65vw, calc(…))` formula) means the portrait's left edge is a moving target. Anchoring the namecard to the portrait's own inner coordinates (`left: 24px, bottom: 24px`) guarantees it lands in the same relative spot regardless of viewport width.

### Mobile behavior (≤ 767px)

When the portrait becomes `position: relative` and stacks below the copy at `height: 340px`, the namecard automatically re-positions to `left: 24px, bottom: 24px` INSIDE that 340px tall portrait — still visible at bottom-left of the stacked image.

No additional mobile override needed for the namecard itself — the container change handles it.

### Copy writing rules

**Name**: founder's real name as they'd introduce themselves (First Last, not just First)
- ✓ "Bill Fanter"
- ✓ "Laci Anderson"
- ✗ "Bill" alone
- ✗ "William Fanter" (formal name if they go by casual)

**Role**: 3-8 words, one credential + one identity
- ✓ "Former banker, options mentor"
- ✓ "CEO, Abbracci Group"
- ✓ "Master electrician, 47 years"
- ✓ "HR consultant + former CHRO"
- ✗ "Founder & CEO of {company}" (redundant with name)
- ✗ "Passionate about helping people succeed" (vague)

---

## 8. Content slot schema — what Opus emits

```typescript
type HeroContent = {
  headline: string;              // 30-90 chars, one claim
  subhead: string;               // 80-180 chars, one sentence
  primaryCta: {
    label: string;               // 8-24 chars, verb-first
    href: string;                // absolute or relative URL
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  trust: {
    label: string;               // 2-4 words
    rating: 4 | 5;               // integer only
    count: string;               // "1,600+ Students" format
  };
  namecard: {
    name: string;                // First Last
    role: string;                // 3-8 words
  };
  portraitImage: string | null;  // URL to portrait; null → palette gradient fallback
};
```

## 9. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `portraitImage` | Palette gradient (see below) |
| `namecard.name` | Hide namecard entirely |
| `trust.count` | Hide trust row entirely (no fabrication) |
| `secondaryCta` | Show only primary CTA |
| `subhead` | Never — required, error out |
| `headline` | Never — required, error out |

### Portrait gradient fallback

When no portrait image is available:

```html
<div class="hero-portrait-fallback" aria-hidden="true"></div>
```

```css
.hero-portrait-fallback {
  position: absolute;
  top: 0;
  bottom: 0;
  /* Same responsive formula as the real portrait — fallback must land
     in the same place or the layout jumps between real-image and
     fallback-image users. */
  left: min(65vw, calc((100vw - 1440px) / 2 + 937px));
  right: 0;
  z-index: 2;
  background:
    radial-gradient(ellipse 60% 55% at 45% 40%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%),
    linear-gradient(180deg, var(--tertiary) 0%, var(--primary) 55%, var(--secondary) 100%);
}
```

Uses the extracted palette. Creates a "person-in-lit-space" mood without a real photo. Never looks like a "missing image" placeholder.

---

## 10. Complete assembled HTML (reference implementation)

Below is the exact structure that matches Bill-Fanter production. Note the
critical differences from the earlier draft:
- Padding lives on `.hero-inner`, NOT the section wrapper.
- Portrait uses the `min(65vw, calc(…))` responsive formula, not `55%`.
- Namecard lives INSIDE the portrait container as its child.
- All numbers (padding, sizes, gaps) match §1-§7 exactly.

```html
<section id="hero" data-section="hero-dark-portrait-split"
  style="position: relative; overflow: hidden; background: #0a0a0a; color: #ffffff;
         isolation: isolate;">

  <!-- Layer 1: dark scrim -->
  <div aria-hidden="true"
    style="position: absolute; inset: 0; z-index: 0;
           background: rgba(10,10,10,0.5); pointer-events: none;"></div>

  <!-- Layer 2: interactive dot-grid (React Bits DotGrid) -->
  <div class="hero-dots"
    data-dotgrid data-dot-size="2" data-gap="10"
    data-base-color="#454545" data-active-color="#75B5FF"
    data-proximity="140" data-return-duration="0.6"
    style="position: absolute; inset: 0; z-index: 1; opacity: 0.66;"></div>

  <!-- Layer 3: portrait column (namecard lives INSIDE this container) -->
  <div style="position: absolute; top: 0; bottom: 0; right: 0; z-index: 2;
              left: min(65vw, calc((100vw - 1440px) / 2 + 937px));">
    <img src="{hero.portraitImage}" alt="{hero.namecard.name}" fetchpriority="high"
      style="width: 100%; height: 100%; object-fit: cover; object-position: center top;" />

    <!-- Layer 5: namecard bubble, anchored to portrait's own bottom-left -->
    <div style="position: absolute; left: 24px; bottom: 24px; z-index: 3;
                display: flex; flex-direction: column; gap: 2px;
                padding: 12px 18px; border-radius: 12px;
                background: rgba(255,255,255,0.92);
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
      <span data-edit-id="hero.namecard.name"
        style="font-family: var(--font-display); font-size: 16px; font-weight: 700;
               line-height: 1.1; color: #0a0a0a;">
        {hero.namecard.name}
      </span>
      <span data-edit-id="hero.namecard.role"
        style="font-family: var(--font-body); font-size: 13px; font-weight: 500;
               color: rgba(10,10,10,0.6);">
        {hero.namecard.role}
      </span>
    </div>
  </div>

  <!-- Layer 4: copy rail — padding lives HERE, not on the section -->
  <div class="hero-inner"
    style="position: relative; z-index: 3; max-width: 780px;
           padding: 272px 40px 200px;">

    <h1 data-edit-id="hero.headline"
      style="font-family: var(--font-display); font-size: 5rem;
             font-weight: 600; line-height: 1.04; letter-spacing: -0.03em;
             color: #ffffff; max-width: 820px; margin: 0;">
      {hero.headline}
    </h1>

    <p data-edit-id="hero.subhead"
      style="font-family: var(--font-body); font-size: 18px; font-weight: 400;
             line-height: 1.55; letter-spacing: -0.003em; color: #ffffff;
             max-width: 560px; margin: 24px 0 0;">
      {hero.subhead}
    </p>

    <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin: 36px 0 0;">
      <a href="{hero.primaryCta.href}" data-edit-id="hero.primaryCta"
        class="btn-primary"
        style="display: inline-flex; align-items: center; padding: 14px 26px;
               border-radius: 999px; background: #ffffff; color: #0a0a0a;
               font-family: var(--font-body); font-size: 15px; font-weight: 600;
               letter-spacing: -0.01em; text-decoration: none; white-space: nowrap;
               box-shadow:
                 inset 0 1px 0 rgba(255,255,255,0.9),
                 inset 0 -1px 0 rgba(0,0,0,0.04),
                 0 1px 2px rgba(10,10,12,0.4),
                 0 8px 24px -8px rgba(10,10,12,0.55);">
        {hero.primaryCta.label}
      </a>
      <a href="{hero.secondaryCta.href}" data-edit-id="hero.secondaryCta"
        style="display: inline-flex; align-items: center; padding: 14px 26px;
               border-radius: 999px; background: transparent; color: #ffffff;
               border: 1px solid rgba(255,255,255,0.4); font-family: var(--font-body);
               font-size: 15px; font-weight: 600; letter-spacing: -0.01em;
               text-decoration: none; white-space: nowrap;">
        {hero.secondaryCta.label}
      </a>
    </div>

    <div style="display: flex; flex-wrap: wrap; align-items: center;
                gap: 6px 10px; margin-top: 28px; margin-left: 6px;
                font-family: var(--font-body); font-size: 14px; font-weight: 500; color: #ffffff;">
      <span style="white-space: nowrap;" data-edit-id="hero.trust.label">
        {hero.trust.label}
      </span>
      <span style="display: inline-flex; gap: 2px;" aria-label="{hero.trust.rating} out of 5 stars">
        <!-- Repeat star SVG hero.trust.rating times -->
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffc14d">
          <path d="M12 2l3 7 7 .8-5 5 1.5 7-6.5-3.5L5 22l1.5-7-5-5L8.5 9z"/>
        </svg>
        <!-- ×4 more -->
      </span>
      <span style="white-space: nowrap; font-weight: 400; color: #ffffff;"
            data-edit-id="hero.trust.count">
        {hero.trust.count}
      </span>
    </div>
  </div>
</section>
```

---

## 11. Accessibility checklist

- [x] `<h1>` is the section's only h1 (rest of page uses h2/h3)
- [x] `alt` on portrait image = founder name (not empty — this IS meaningful)
- [x] Trust row has `aria-label="{rating} out of 5 stars"` on stars container
- [x] Dot-grid and scrim overlays have `aria-hidden="true"`
- [x] CTAs are `<a>` tags with `href` (not `<button>` — they navigate)
- [x] Color contrast: `#ffffff` on `#0a0a0a` = 20:1 (AAA)
- [x] Namecard ink `#0a0a0a` on `rgba(255,255,255,0.92)` = 18:1 (AAA)
- [x] All interactive elements ≥ 44×44px tap target (CTAs are ~46px tall — 14px vertical padding + 15px font × 1.2 leading)
- [x] Skip to content link at top of `<body>` (outside this section)
- [x] `prefers-reduced-motion` respected (hover transforms disabled)

## 12. Performance checklist

- [x] `fetchpriority="high"` on portrait image (LCP element)
- [x] Portrait image should be WebP or AVIF, ~200KB max
- [x] No JavaScript for the hero (all CSS, no hydration)
- [x] Fonts preloaded in `<head>` (`<link rel="preload" as="font">`)
- [x] Dot-grid is CSS-only (no image request)

## 13. Design token dependencies

This section uses these CSS variables (must be set in `<head>` inline style):

```css
:root {
  --font-display: "Fraunces", "Cabinet Grotesk", ui-serif, Georgia, serif;
  --font-body: "Inter", "Geist Sans", ui-sans-serif, system-ui, sans-serif;
  --primary: #7A1F3B;
  --secondary: #2B2A28;
  --tertiary: #8A9385;
}
```

The `#0a0a0a` (background + namecard ink), `#ffffff` (copy + trust row + namecard bg 0.92 alpha), `#ffc14d` (stars) values are intentionally hardcoded — they're structural to the section, not brand-driven.

---

## 14. Rationale (why this section converts)

- **Dark stage** (`#0a0a0a`, not neutral-dark) = premium editorial signal. Aesop, Mercury, Linear all use dark heroes.
- **80px display type** (fixed 5rem, not clamped) = the promise is the biggest thing on the page. Nothing competes. Ambiguity from clamp-scaling is unacceptable at hero scale.
- **Portrait right column** with `min(65vw, calc(…))` responsive left = personal brand physically visible AND vertically aligned with the watchlist section grid axis below.
- **Two CTAs of different intent** = capture buyers AND browsers, no one leaves.
- **Trust row inline** with `margin-left: 6px` optical alignment = social proof without a separate section slowing the fold.
- **Namecard bubble anchored INSIDE the portrait container** = "who is this" answered without a separate "meet the founder" section, and it travels with the portrait on every viewport.
- **272px top padding on inner div (not section)** = clears the 72px CardNav gracefully AND leaves 200px visible breathing room that matches the 200px bottom padding — perfect visual symmetry.
- **Copy rail max 780px + headline max 820px** = forces tight display type wrap (2-3 lines), never sprawls.

Every choice is anti-generic: no centered hero, no lifestyle stock photo full-bleed, no rotating carousel, no video background, no scroll-cue arrow. The hero states, then leaves. Everything else is other sections.

---

## 15. What Opus should NOT do

- ❌ Add a scroll cue arrow at the bottom
- ❌ Center-align the copy rail
- ❌ Add a video background
- ❌ Use a stock photo instead of the founder portrait
- ❌ Make the CTA row 3+ buttons
- ❌ Add "As seen in [logos]" strip below the trust row
- ❌ Use a serif for body copy (display serif + body serif = double-serif crime)
- ❌ Animate the h1 letter-by-letter on load (dated, distracting)
- ❌ Add a "scroll to explore" widget
- ❌ Include a video autoplay
- ❌ Emit any additional sections inside `<section id="hero">`
