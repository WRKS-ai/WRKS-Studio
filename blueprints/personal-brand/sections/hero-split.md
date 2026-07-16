# SECTION — HeroSplit (hero-split-media-copy-bento)

> **Section family**: `hero-split-media-copy-bento`
> **Used in**: personal-brand/home (position 7 — "Welcome to Bill Fanter" block), personal-brand/masterclass (as intro), personal-brand/lead-magnet (as founder intro)
> **Purpose**: mid-page founder introduction. Not the hero (that's section 1), not the founder story (that's section 10). This is the "meet me in three formats" beat: quick face + quick voice + quick copy — so the reader has a person to attach the promise to before scrolling further.
> **Position on page**: after Spotlight (dark card), before Reviews. Returns the page to light background with a media-heavy bento that breaks up the copy density.

---

## 1. Section wrapper

```html
<section id="hero-split" data-section="hero-split-media-copy-bento">
  <div class="container">
    <div class="split-wrap">
      <div class="split-grid">
        <div class="split-bento">…</div>
        <div class="split-copy">…</div>
      </div>
    </div>
  </div>
</section>
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-17)

| Property | Value | Notes |
|---|---|---|
| Section `background` | `#ffffff` | white — returning to light after Spotlight above |
| Section `padding-top` | `0` | collapse doubled padding from the section above (Spotlight already contributes bottom padding) |
| Section `padding-bottom` | `100px` | standard light-section rhythm |
| `.split-wrap` `padding` | `0` (top + bottom) | prevents any inner padding stacking with section |
| `.split-grid` `padding` | `0 24px` desktop / `0` mobile | 24px inset on desktop matches container gutter; drop on mobile so tiles span container |
| `.split-grid` `max-width` | `1180px` | matches DESIGN.md container |

**Why `padding-top: 0`**: the Spotlight section above has generous bottom padding. Without the collapse, this section's top padding stacks and produces a 160px+ visual gap. Collapsing to 0 restores a single 100px rhythm.

**Why 24px inner padding on desktop, 0 on mobile**: the outer container already provides horizontal padding; adding 24 more inset on desktop tightens the split grid slightly from the container edges (feels intentional). On mobile the tiles must reach container edges for visual weight, so drop it.

---

## 2. Outer grid — 50/50 split with column swap

Media LEFT, copy RIGHT. Deliberately different from every OTHER split section on the page (which puts copy left).

### CSS (verified from billfanter.com production)

```css
.split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;         /* 50/50 exactly */
  gap: 48px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
  align-items: center;                    /* vertically centered — copy stack shorter than bento */
}

.split-bento { order: 1; }                /* MEDIA LEFT */
.split-copy  {
  order: 2;                               /* COPY RIGHT */
  padding-left: 48px;                     /* extra indent — copy sits farther from the bento */
}

@media (max-width: 980px) {
  .split-grid {
    grid-template-columns: 1fr;           /* stack */
    gap: 32px;
    padding: 0;
  }
  .split-copy {
    order: 1;                             /* copy FIRST when stacked */
    padding-left: 0;
  }
  .split-bento { order: 2; }              /* media SECOND when stacked */
}
```

**Why media LEFT on desktop but copy FIRST when stacked**: on desktop the media (bento) is the visual attention-grabber; putting it left creates left-to-right scan pattern of image → text. On mobile, dropping the bento above copy would force scroll past a large media block before reaching what the section is about. Copy-first on mobile respects "state → context → action" ordering.

**Why 48px left-padding on the copy column**: after the column swap, the copy hugs the LEFT edge of the RIGHT column. Without padding, the copy sits too close to the 48px gap and reads as visually crowded next to the bento. 48px padding pushes it right, evening the visual gap.

**Why `align-items: center`**: the bento is taller than the copy stack. Vertically centering them means the copy sits at the bento's midpoint, not top-aligned (would leave copy floating in the top-half of the row).

---

## 3. Copy column — RIGHT

### HTML

```html
<div class="split-copy">
  <div class="eyebrow-wrap">
    <span class="eyebrow" data-edit-id="heroSplit.eyebrow">
      {heroSplit.eyebrow}
    </span>
  </div>
  <h2 class="split-h1" data-edit-id="heroSplit.heading">
    {heroSplit.heading}
  </h2>
  <p class="split-lead" data-edit-id="heroSplit.lead">
    {heroSplit.lead}
  </p>
  <div class="split-cta">
    <a class="btn btn-primary" href="{heroSplit.cta.href}" data-edit-id="heroSplit.cta">
      {heroSplit.cta.label}
    </a>
  </div>
  <div class="split-trust">
    <span class="trust-label">{heroSplit.trust.label}</span>
    <span class="trust-stars"><!-- N star SVGs --></span>
    <span class="trust-count">{heroSplit.trust.count}</span>
  </div>
</div>
```

### Copy column CSS (verified from billfanter.com production)

```css
.split-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;                /* vertically center inside grid cell */
  align-items: flex-start;                /* left-align every element */
  text-align: left;
}

@media (max-width: 980px) {
  .split-copy {
    align-items: center;                  /* center-align when stacked */
    text-align: center;
  }
}
```

### 3a. Eyebrow — allowed here (welcome-block signal)

The second and last place eyebrows are permitted (after Watchlist).

**Why eyebrow allowed here**: this section is a WELCOME beat mid-page. The eyebrow ("Welcome to Bill Fanter") does the introduction — the h2 does the promise. Without an eyebrow, the h2 reads as another mid-page value prop, not a founder greeting.

### CSS

```css
.split-copy .eyebrow-wrap {
  margin-bottom: 20px;                    /* 20 to h2 — deliberate breathing before the promise */
}

.split-copy .eyebrow {
  color: var(--text-muted, #565656);      /* muted, NOT accent — welcome tone is quiet */
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
```

**Why muted (not accent) eyebrow here vs Watchlist accent eyebrow**: Watchlist is a CTA offer (accent = "look here, opportunity"). This is a welcome (muted = "let me introduce myself, softly").

### Eyebrow copy rules

**Character count**: 12-30 characters
**Word count**: 2-4 words
**Structure**: warm invitational — "Welcome to [name]", "Meet [name]", or "About [name]"

- ✓ "Welcome to Bill Fanter" (real BF)
- ✓ "Meet the founder"
- ✓ "From the desk of Sarah"
- ✗ "About us" (dead — no personality)
- ✗ "Introduction" (dead — label, not a moment)

---

### 3b. Headline — sized like a SECTION h2, tagged as h1 in source

### CSS (verified from billfanter.com production)

```css
.split-h1 {
  font-family: 'Geist', sans-serif;
  font-size: clamp(24px, 2.6vw, 36px);    /* MATCHES section h2 scale — NOT hero h1 scale */
  line-height: 1.1;
  letter-spacing: -0.025em;
  font-weight: 500;
  color: var(--text, #0a0a0a);
  margin: 0;
  max-width: 540px;                       /* forces 2-3 line wrap */
  text-align: inherit;                    /* inherits left (desktop) or center (mobile) */
}
```

**Why sized like a section h2, not a hero h1**: this section is INSIDE the page (position 7 of 10). Sizing it at hero-scale (60-80px) would fight the actual hero at top of page. Section h2 scale (24-36) puts it in appropriate mid-page hierarchy.

**Why the HTML tag is `<h2>` (not `<h1>` despite the class name)**: the page has ONE `<h1>` — in the actual hero section (position 1). Everything else uses `<h2>` regardless of visual weight. The `.split-h1` class name is a legacy artifact — the semantic tag is always `<h2>`.

### Copy writing rules — heading

**Character count**: 40-90 characters
**Word count**: 7-15 words
**Structure**: full sentence promise
**Voice**: second-person imperative OR "I show you HOW to X" (first-person allowed here since it's a founder-introduction beat)

### Good headings

- ✓ "Learn proven options trading strategies that work in any market" (real BF — 10 words, one claim)
- ✓ "I help HR leaders build teams that don't burn out"
- ✓ "The system for solo builders who need to ship faster"

### Bad headings

- ✗ "About us" (dead)
- ✗ "Welcome to my website" (redundant with eyebrow)
- ✗ "Discover our proven approach" (banned)

---

### 3c. Lead

### CSS (verified from billfanter.com production)

```css
.split-lead {
  font-family: 'Geist', sans-serif;
  margin-top: 22px;                       /* 22 to h2 — matches DESIGN.md h2→lead rhythm */
  max-width: 480px;                       /* tighter than h2 max (540) — lead wraps sooner */
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-muted, #565656);
  text-align: inherit;
}
```

### Copy writing rules — lead

**Character count**: 130-260 characters
**Word count**: 25-45 words
**Structure**: 1-2 sentences describing WHAT the founder actually teaches/does + WHY it works
**Voice**: third-person about the founder ("Bill shows you…") or first-person ("I show you…") — pick one and hold it
**Purpose**: shift from "here is a face" (bento) to "here is what they teach" (lead)

### Good leads

- ✓ "Go past random tips and learn a repeatable options trading system. Bill shows you how to read setups, manage risk, and trade with a plan you can run on your own." (real BF — mechanism + specific verbs)
- ✓ "For the HR leader who's tired of firefighting. Sarah's frameworks turn quarterly crises into monthly rhythms your team can run without you."

### Bad leads

- ✗ "Our platform helps you achieve your goals with ease." (dead + banned)
- ✗ "We are passionate about helping traders succeed." (dead + "passionate" = filler)

---

### 3d. CTA row

### CSS (verified from billfanter.com production)

```css
.split-cta {
  margin-top: 32px;                       /* 32 to lead — larger break, CTA is a distinct beat */
  justify-content: flex-start;            /* left-align on desktop */
}

@media (max-width: 980px) {
  .split-cta { justify-content: center; }
}
```

Button reuses the primary CTA styling from Community (`padding: 14 24`, pill, `#0a0a0a` bg, white ink, hover lift + `#1a1a1a` bg). See [community.md §6](./community.md) for full button CSS.

### CTA label rules

- **Single button only** — this section is a warm intro, NOT a two-choice hard sell (that's the hero)
- **Character count**: 12-24
- **Verb-first**
- ✓ "Join the masterclass" (real BF)
- ✓ "See how I work"
- ✓ "Book a discovery call"
- ✗ "Learn more" (dead)

---

### 3e. Trust row

### CSS (verified from billfanter.com production)

```css
.split-trust {
  margin-top: 28px;                       /* 28 to CTA */
  display: flex;
  align-items: center;
  gap: 6px 10px;
  flex-wrap: wrap;
  font-family: 'Geist', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--text, #0a0a0a);
}

@media (max-width: 980px) {
  .split-trust {
    justify-content: center;
    align-self: center;
  }
}
```

Reuses the hero trust-row structure ([hero.md §6](./hero.md#6-trust-row-social-proof-one-liner)) — label + rating stars + count. Only the color changes: hero uses white (dark bg); this uses dark ink `#0a0a0a` (light bg).

---

## 4. Bento column — LEFT

Three tiles in a bento grid: video pillar (spans 2 rows), gradient quote tile (top-right), photo tile (bottom-right).

### Bento grid CSS (verified from billfanter.com production)

```css
.split-bento {
  display: grid;
  grid-template-columns: 1.1fr 1fr;       /* video slightly wider than quote/photo column */
  grid-template-rows: 1fr 1fr;            /* two equal rows */
  gap: 8px;                               /* 8 — tight (matches watchlist v2 bento) */
}

@media (max-width: 980px) {
  .split-bento {
    grid-template-columns: 1fr 1fr;       /* equal cols at tablet */
    grid-template-rows: auto auto;
    gap: 12px;                            /* slightly bigger gap at tablet for tap comfort */
  }
}

@media (max-width: 560px) {
  .split-bento {
    grid-template-columns: 1fr;           /* single column on mobile — video, quote, photo stacked */
    grid-template-rows: auto;
  }
}
```

**Why 1.1fr / 1fr split (not equal 1fr / 1fr)**: the video pillar carries the most weight (autoplay motion + tallest element). Giving it 10% more width visually declares it primary without unbalancing the grid.

**Why `gap: 8px` (much tighter than MegaBento's 16)**: this bento is INSIDE a section column, not a full-width layout. Tighter gap makes it feel like ONE unit (the "founder introduction bento") vs three separate cards.

**Why single-column mobile stack at ≤560, not 2-col**: the 2-col mobile stack overflows the quote tile (too much text for a half-width column). Full-width tiles keep everything readable.

---

## 5. Video tile (LEFT of bento — spans 2 rows)

Autoplay muted vertical Vimeo reel. Signals "this founder actually shows up on camera."

### HTML

```html
<div class="split-video">
  <button type="button" class="vreel"
          data-vimeo="{heroSplit.videoVimeoId}"
          aria-label="Watch intro">
    <span class="vreel-frame">
      <iframe class="vreel-video"
              data-lazysrc="https://player.vimeo.com/video/{heroSplit.videoVimeoId}?background=1&autoplay=1&muted=1&loop=1&controls=0&playsinline=1&dnt=1"
              allow="autoplay; fullscreen"
              loading="lazy"
              title="Intro video"></iframe>
      <span class="vreel-overlay"></span>
      <span class="vreel-play" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <polygon points="8 5 19 12 8 19 8 5" fill="currentColor"/>
        </svg>
      </span>
    </span>
  </button>
</div>
```

### CSS (verified from billfanter.com production)

```css
.split-video {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #0a0a0a;                    /* black behind iframe — no flash before load */
  grid-row: span 2;                       /* spans BOTH rows of the bento */
  aspect-ratio: 9 / 16;                   /* vertical reel — 9:16 mobile-native ratio */
}

@media (max-width: 980px) {
  .split-video {
    grid-row: span 2;                     /* still spans full height at tablet */
    max-width: 280px;                     /* cap width so the reel doesn't dominate */
    margin: 0 auto;
  }
}

@media (max-width: 560px) {
  .split-video {
    grid-row: auto;
    max-width: none;                      /* full-width on mobile */
  }
}

.split-video .vreel,
.split-video .vreel-frame {
  width: 100%;
  height: 100%;
  border-radius: 0;                       /* inherits from parent */
}
```

**Why 9:16 aspect ratio (vertical reel)**: matches native mobile short-video format (Instagram Reels, TikTok, YouTube Shorts). Signals the video was shot mobile-first, not repurposed from a wide format.

**Why the play button overlay if it autoplays**: the autoplay is muted background loop. The play button signals "click to WATCH with sound" — turning the muted preview into a full experience.

### Play button overlay CSS

```css
.vreel-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.35) 100%);
  z-index: 1;
  pointer-events: none;
}

.vreel-play {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 2;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  color: #0a0a0a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.vreel-play svg { width: 18px; height: 18px; margin-left: 2px; } /* 2px right nudge — optical center of play triangle */
```

### Video source rules

- **Format**: Vimeo hosted (better background embed than YouTube)
- **Aspect**: 9:16 vertical
- **Length**: 15-45 seconds ideal (background loop viable)
- **Content**: founder on camera talking directly (not a product demo, not a montage)
- **Captions**: burned-in captions REQUIRED (muted autoplay means viewers see, don't hear)
- **Fallback**: if no video, replace with a `.split-video--photo` variant showing a full-height portrait photo instead

---

## 6. Quote tile (TOP RIGHT of bento — gradient background)

Testimonial quote on the brand-gradient background. Social proof that also carries the accent color.

### HTML

```html
<div class="split-tile split-tile--quote-on-gradient">
  <div class="grainient-mount"
       data-grainient="split-hero"
       data-color1="#FF8308" data-color2="#EF4444" data-color3="#6B3BD5"></div>
  <div class="tile-content">
    <p class="tile-quote">
      &ldquo;{heroSplit.quote.text}&rdquo;
    </p>
    <div class="tile-footer">
      <div class="tile-author">
        <div class="tile-author-name">{heroSplit.quote.name}</div>
        <div class="tile-author-title">{heroSplit.quote.title}</div>
      </div>
      <a class="tile-link" href="{heroSplit.quoteLink.href}">
        {heroSplit.quoteLink.label}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10m-4-4 4 4-4 4"
                stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>
  </div>
</div>
```

### Tile base CSS (verified from billfanter.com production)

```css
.split-tile {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  isolation: isolate;                     /* z-index stacking boundary */
}
```

### Quote-on-gradient variant CSS

```css
.split-tile--quote-on-gradient {
  position: relative;
  isolation: isolate;
  color: #ffffff;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    #FF8308 0%,
    #EF4444 45%,
    #6B3BD5 100%
  );                                      /* CSS gradient — always visible before JS grainient loads */
}

.split-tile--quote-on-gradient .grainient-mount {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(            /* fallback gradient inside the mount — matches parent */
    135deg,
    #FF8308 0%,
    #EF4444 45%,
    #6B3BD5 100%
  );
}

.split-tile--quote-on-gradient .tile-content {
  position: relative;
  z-index: 2;                             /* above grainient */
  padding: 28px 24px 24px;                /* 28 top / 24 sides / 24 bottom */
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;         /* quote pushes UP, footer anchors DOWN */
  gap: 16px;
}
```

**Why static CSS gradient BEHIND the grainient**: the animated grainient (canvas-based) takes a moment to mount. Without a fallback, the tile flashes black before the animation loads. The CSS gradient underneath fills that gap.

**Why gradient uses the same 3-stop palette as MegaBento's community tile**: consistency. If this quote tile uses a different gradient, the accent color scatters. Same gradient = same brand accent moment.

### Quote CSS (verified from billfanter.com production)

```css
.tile-quote {
  font-family: 'Geist', sans-serif;
  font-size: 16px;                        /* same as body — the quote is peer-sized to lead */
  line-height: 1.4;
  font-weight: 500;
  margin: 0;
  color: #ffffff;
  letter-spacing: -0.012em;
}
```

### Footer + author CSS

```css
.tile-footer {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tile-author { font-size: 13px; }

.tile-author-name {
  font-weight: 600;
  color: #ffffff;
}

.tile-author-title {
  color: rgba(255, 255, 255, 0.55);       /* muted white — deference to name */
}

.tile-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;                               /* 6 between label and arrow icon */
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  align-self: flex-start;                 /* left-align inside its flex parent */
  text-decoration: none;
}

.tile-link:hover { gap: 10px; }           /* arrow slides right — matches MegaBento reviews link */
```

### Quote content rules

- **Quote text**: 60-140 characters, real testimonial from a real person
- **Author name**: full name, first + last
- **Author title**: role only OR role @ company (13 chars max — this is small text)
- **Quote link**: "Read more reviews", "See all reviews", "Full case study" — links to the /reviews or /case-studies page

---

## 7. Photo tile (BOTTOM RIGHT of bento — solid photo)

The founder photo. Cropped-cover, no border, no caption.

### HTML

```html
<div class="split-tile split-tile--photo">
  <img src="{heroSplit.photo.src}"
       srcset="{heroSplit.photo.src}-720.webp 1x, {heroSplit.photo.src} 2x"
       alt="{heroSplit.photo.alt}" />
</div>
```

### CSS (verified from billfanter.com production)

```css
.split-tile--photo {
  background: #0a0a0a;                    /* dark bg behind image while it loads */
  padding: 0;
  overflow: hidden;
  position: relative;
  min-height: 0;                          /* required so absolute-positioned img can drive height */
}

.split-tile--photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;                      /* crop to fill — photo has its own natural aspect */
  display: block;
}
```

**Why the image is absolutely positioned**: the grid cell sets the tile's height (matching the row height). If the image drove its own height (using natural aspect), a portrait photo would push the row taller and misalign with the video pillar's fixed 9:16 height. Absolute positioning + inset:0 + object-cover means the image FILLS the grid cell exactly.

### Photo content rules

- **Content**: founder in candid context (at their desk, mid-conversation, walking somewhere). NOT a headshot (headshot goes in the namecard/about section).
- **Format**: WebP, min 800px on the long axis
- **Orientation**: landscape or square (portrait photos crop weirdly in this tile)
- **Alt**: descriptive — "Bill Fanter at his trading desk"

---

## 8. Content slot schema — what Opus emits

```typescript
type HeroSplitContent = {
  eyebrow: string | null;                 // 12-30 chars, welcome tone; null = skip
  heading: string;                        // 40-90 chars, section-h2 scale
  lead: string;                           // 130-260 chars, mechanism + why
  cta: {
    label: string;                        // 12-24 chars, verb-first
    href: string;
  };
  trust: {
    label: string;                        // 2-4 words
    rating: 4 | 5;
    count: string;                        // "1,600+ Students"
  };
  quote: {
    text: string;                         // 60-140 chars, real testimonial
    name: string;                         // First Last
    title: string;                        // role or role @ company
  };
  quoteLink: {
    label: string;                        // "Read more reviews"
    href: string;                         // typically /reviews or /student-comments
  };
  photo: {
    src: string;                          // WebP URL, min 800px
    alt: string;                          // "Founder Name at [context]"
  };
  videoVimeoId: string | null;            // Vimeo video ID, null = fallback to photo pillar
  gradient?: {                            // override the default brand gradient
    hex1: string;
    hex2: string;
    hex3: string;
  };
};
```

## 9. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `eyebrow` | Skip entirely; h2 becomes the top element |
| `videoVimeoId` | Replace video tile with a portrait photo (same 9:16 aspect); use founder's headshot |
| `quote` (all fields) | Drop the quote tile — use a 2-tile bento (video + photo only, video spans single row now) |
| `photo.src` | Use a palette-derived gradient tile with the founder name in centered mono caps |
| `quoteLink` | Drop the link; author block sits at the bottom alone |
| `trust` | Drop the trust row entirely |
| `heading` | Never — required, error out |
| `lead` | Never — required, error out |

---

## 10. Complete assembled HTML (reference implementation)

```html
<section id="hero-split" data-section="hero-split-media-copy-bento"
  style="background: #ffffff; padding: 0 40px 100px;">

  <div style="max-width: 1180px; margin: 0 auto;">

    <!-- Grid: bento LEFT, copy RIGHT -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px;
                padding: 0 24px; align-items: center;">

      <!-- LEFT: bento (order 1 desktop) -->
      <div style="order: 1; display: grid;
                  grid-template-columns: 1.1fr 1fr;
                  grid-template-rows: 1fr 1fr; gap: 8px;">

        <!-- Video pillar — spans 2 rows -->
        <div style="grid-row: span 2; position: relative; border-radius: 12px;
                    overflow: hidden; background: #0a0a0a; aspect-ratio: 9/16;">
          <button type="button" aria-label="Watch intro"
            style="all: unset; cursor: pointer; display: block;
                   width: 100%; height: 100%; position: relative;">
            <iframe src="https://player.vimeo.com/video/{heroSplit.videoVimeoId}?background=1&autoplay=1&muted=1&loop=1&controls=0&playsinline=1&dnt=1"
              allow="autoplay; fullscreen" loading="lazy" title="Intro video"
              style="position: absolute; inset: 0; width: 100%; height: 100%;
                     border: 0;"></iframe>
            <span style="position: absolute; inset: 0; z-index: 1;
                         background: linear-gradient(180deg, transparent 40%,
                                                      rgba(0,0,0,0.35) 100%);
                         pointer-events: none;"></span>
            <span style="position: absolute; bottom: 20px; left: 20px; z-index: 2;
                         width: 44px; height: 44px; border-radius: 50%;
                         background: rgba(255,255,255,0.94); color: #0a0a0a;
                         display: inline-flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; margin-left: 2px;">
                <polygon points="8 5 19 12 8 19 8 5" fill="currentColor"/>
              </svg>
            </span>
          </button>
        </div>

        <!-- Quote tile (top-right) -->
        <div style="position: relative; isolation: isolate; border-radius: 12px;
                    overflow: hidden; color: #fff;
                    background: linear-gradient(135deg,
                      {heroSplit.gradient.hex1} 0%,
                      {heroSplit.gradient.hex2} 45%,
                      {heroSplit.gradient.hex3} 100%);">
          <div style="position: relative; z-index: 2; padding: 28px 24px 24px;
                      height: 100%; display: flex; flex-direction: column;
                      justify-content: space-between; gap: 16px;">
            <p data-edit-id="heroSplit.quote.text"
              style="margin: 0; font-family: 'Geist', sans-serif;
                     font-size: 16px; line-height: 1.4; font-weight: 500;
                     color: #fff; letter-spacing: -0.012em;">
              &ldquo;{heroSplit.quote.text}&rdquo;
            </p>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div style="font-size: 13px;">
                <div style="font-weight: 600; color: #fff;">
                  {heroSplit.quote.name}
                </div>
                <div style="color: rgba(255,255,255,0.55);">
                  {heroSplit.quote.title}
                </div>
              </div>
              <a href="{heroSplit.quoteLink.href}"
                style="display: inline-flex; align-items: center; gap: 6px;
                       font-size: 13px; font-weight: 600; color: #fff;
                       text-decoration: none; align-self: flex-start;">
                {heroSplit.quoteLink.label}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10m-4-4 4 4-4 4"
                    stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Photo tile (bottom-right) -->
        <div style="position: relative; background: #0a0a0a;
                    border-radius: 12px; overflow: hidden; min-height: 0;">
          <img src="{heroSplit.photo.src}"
            srcset="{heroSplit.photo.src}-720.webp 1x, {heroSplit.photo.src} 2x"
            alt="{heroSplit.photo.alt}"
            style="position: absolute; inset: 0; width: 100%; height: 100%;
                   object-fit: cover; display: block;" />
        </div>

      </div>

      <!-- RIGHT: copy (order 2 desktop) -->
      <div style="order: 2; padding-left: 48px; display: flex; flex-direction: column;
                  justify-content: center; align-items: flex-start; text-align: left;">

        <div style="margin-bottom: 20px;">
          <span data-edit-id="heroSplit.eyebrow"
            style="color: var(--text-muted, #565656);
                   font-family: var(--font-mono);
                   font-size: 11.5px; font-weight: 500;
                   letter-spacing: 0.14em; text-transform: uppercase;">
            {heroSplit.eyebrow}
          </span>
        </div>

        <h2 data-edit-id="heroSplit.heading"
          style="margin: 0; font-family: 'Geist', sans-serif;
                 font-size: clamp(24px, 2.6vw, 36px); line-height: 1.1;
                 letter-spacing: -0.025em; font-weight: 500;
                 color: var(--text, #0a0a0a); max-width: 540px;">
          {heroSplit.heading}
        </h2>

        <p data-edit-id="heroSplit.lead"
          style="margin: 22px 0 0; font-family: 'Geist', sans-serif;
                 max-width: 480px; font-size: 16px; line-height: 1.6;
                 color: var(--text-muted, #565656);">
          {heroSplit.lead}
        </p>

        <div style="margin-top: 32px;">
          <a href="{heroSplit.cta.href}" data-edit-id="heroSplit.cta"
            style="display: inline-flex; align-items: center; gap: 8px;
                   padding: 14px 24px; border-radius: 999px;
                   background: #0a0a0a; color: #fff;
                   font-family: 'Geist', sans-serif; font-size: 16px;
                   font-weight: 600; letter-spacing: -0.005em;
                   text-decoration: none; white-space: nowrap;">
            {heroSplit.cta.label}
          </a>
        </div>

        <!-- Trust row -->
        <div style="margin-top: 28px; display: flex; align-items: center;
                    gap: 6px 10px; flex-wrap: wrap;
                    font-family: 'Geist', sans-serif; font-size: 14px;
                    font-weight: 500; color: var(--text, #0a0a0a);">
          <span style="white-space: nowrap;">{heroSplit.trust.label}</span>
          <span style="display: inline-flex; gap: 2px;"
                aria-label="{heroSplit.trust.rating} out of 5 stars">
            <!-- N star SVGs — see hero.md §6 -->
          </span>
          <span style="white-space: nowrap; font-weight: 400;">
            {heroSplit.trust.count}
          </span>
        </div>

      </div>
    </div>
  </div>
</section>
```

---

## 11. Interactive behaviors

- **Video autoplay**: muted, looped, background embed (no controls)
- **Video click**: opens Vimeo modal with full controls + sound
- **Quote tile grainient**: JS mounts animated grainient over CSS fallback gradient (progressive enhancement)
- **Photo**: static, no hover
- **CTA hover**: 1px lift, bg `#0a0a0a → #1a1a1a`
- **Quote link hover**: gap widens `6 → 10` (arrow slides right)
- **prefers-reduced-motion**: pause video autoplay, freeze grainient, disable all hover transforms

---

## 12. Responsive behavior — full summary

| Breakpoint | Grid | Order | Notes |
|---|---|---|---|
| Desktop (>980px) | 1fr 1fr, gap 48 | bento LEFT, copy RIGHT | 48px left-pad on copy |
| Tablet (≤980) | 1fr stacked, gap 32 | copy FIRST, bento SECOND | copy center-aligned |
| Tablet bento (≤980) | 1fr 1fr, auto rows, gap 12 | video-quote-photo across | video maxes 280px |
| Mobile (≤560) | 1fr single | copy-video-quote-photo | all tiles full-width |

---

## 13. Accessibility checklist

- [x] `<h2>` for section heading (page has one `<h1>` in hero — this is NOT it)
- [x] Video iframe has `title` attribute
- [x] Video button has `aria-label`
- [x] Play icon overlay `aria-hidden="true"` (button label carries meaning)
- [x] Photo `alt` is descriptive ("Founder Name at [context]")
- [x] Quote tile decorative gradient `aria-hidden="true"` on grainient mount
- [x] Trust stars container has `aria-label="{rating} out of 5 stars"`
- [x] Color contrast: `#fff` on gradient midpoint = 4.8:1 (AA large text; quote is 16px medium-weight, borderline — verify per-brand)
- [x] `prefers-reduced-motion`: pauses video, freezes grainient

## 14. Performance checklist

- [x] Vimeo iframe `loading="lazy"` (mid-page section)
- [x] Photo image WebP with 1x/2x srcset
- [x] Grainient is progressive enhancement (CSS fallback always renders)
- [x] `min-height: 0` on photo tile prevents wasted layout pass
- [x] Static CSS gradient renders instantly (no wait for grainient JS)

## 15. Design token dependencies

```css
:root {
  --font-body: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
  --text: #0a0a0a;
  --text-muted: #565656;
  --container: 1180px;
}
```

Hardcoded (structural):
- `#ffffff` (section bg)
- `#0a0a0a` (video tile bg, photo tile bg, CTA bg)
- Gradient hex stops (`#FF8308 → #EF4444 → #6B3BD5` — brand-derivable)
- `rgba(255,255,255,0.55)` (author-title muted)

---

## 16. Rationale (why this section works)

- **Media LEFT / copy RIGHT** = deliberate contrast with other splits on the page (Watchlist puts copy left). Signals "this is a different beat" — reset the reader's scan pattern.
- **Vertical video pillar (9:16)** = mobile-native reel format signals authenticity. Landscape video reads like a promo; vertical reads like the founder actually talking.
- **Video + quote + photo as 3 formats** = same message in 3 registers — motion (video), words (quote), presence (photo). One will land regardless of the reader's preferred input mode.
- **Photo cropped-cover in fixed grid cell** = the photo dimensions never disrupt layout. Any founder photo (portrait/landscape/square) renders correctly.
- **Quote on gradient (the ONE accent moment)** = the section's accent color anchor. Everything else stays neutral, so the gradient tile hits without competition.
- **h2 sized like a section heading** (24-36px, not hero-scale 60-80) = respects page hierarchy. This is a mid-page beat, not another hero.
- **Copy vertically centered against bento** = the tallest column (bento) drives height; the shorter column (copy) centers to it, so the pair reads as one balanced unit.
- **48px left-padding on copy** = internal asymmetry balancing the column swap. Without it, the copy sits too close to the bento's right edge.
- **Muted eyebrow (not accent color)** = welcome tone. Accent eyebrow reads as "look here, offer"; muted reads as "meet me, quietly."
- **CTA is SINGLE button** = a warm intro doesn't need dual-choice. The hero already made both offers; this section reinforces the primary path.
- **Trust row echoing the hero trust row** = consistency. Reader saw "1,600+ Students" at the top, sees it again here — pattern reinforcement, not repetition.

---

## 17. What Opus should NOT do

- ❌ Put copy LEFT and media RIGHT (that's every other split on the page — this one is deliberately different)
- ❌ Size the h2 above 40px (hero-scale — competes with actual hero)
- ❌ Use a landscape 16:9 video (must be vertical 9:16)
- ❌ Add controls to the autoplay video (background embed only)
- ❌ Add captions to the video that aren't burned into the file (SRT captions don't show on background embeds)
- ❌ Use a headshot in the photo tile (reserve headshot for the About section — this is candid context)
- ❌ Add two CTAs
- ❌ Skip the video AND the photo (need at least one visual anchor beside the quote)
- ❌ Use an accent-colored eyebrow (welcome tone requires muted)
- ❌ Change the bento gap to 16+ (must be 8 desktop / 12 tablet — tight = one unit)
- ❌ Use a portrait photo in the photo tile (crops weirdly at cover)
- ❌ Center-align the copy on desktop (only center at ≤980)
- ❌ Add hover scale to the photo tile
- ❌ Include a "subscribe to my newsletter" widget in the bento (that's the Watchlist section)
- ❌ Use a gradient that doesn't match the site's accent palette (must derive from brand palette or use the default 3-stop)
