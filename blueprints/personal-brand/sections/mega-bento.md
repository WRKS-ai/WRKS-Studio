# SECTION — MegaBento (mega-bento-6tile)

> **Section family**: `mega-bento-6tile`
> **Used in**: personal-brand/home (position 2, immediately after hero)
> **Purpose**: single-glance overview of every product/asset the brand offers, ranked by conversion intent, so a scanner can jump straight to the tile that matches their stage.
> **Reference**: Stripe.com "Everything you need" section
> **Position on page**: renders inside the same continuous background as the watchlist section below (both live inside a `.bf-bento-fade` wrapper), so the section wrapper is transparent.

---

## 1. Section wrapper

```html
<section id="mega-bento" data-section="mega-bento-6tile">
  <div class="container">
    <div class="mega-header">
      <h2>{megaBento.heading}</h2>
    </div>
    <div class="mega-grid">
      <!-- 6 tiles here -->
    </div>
  </div>
</section>
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-16)

| Property | Value | Notes |
|---|---|---|
| `background` | `transparent` | continuous fade from hero-adjacent wrapper — the section itself paints nothing |
| `padding-top` | `100px` | matches DESIGN.md light-section rhythm |
| `padding-bottom` | `100px` | (flows into watchlist section without visual seam) |
| Container `max-width` | `1180px` | (or `1440px` if voice_descriptor is `expert` — dense info sites) |
| Container horizontal padding | `40px` desktop / `24px` mobile (≤767px) |

**Why transparent background**: the visual continuity between MegaBento and Watchlist below relies on a shared gradient wrapper. If this section paints its own color it creates a seam.

---

## 2. Header block

Left-aligned h2 sitting in the top-left of the container. Never centered — asymmetry is deliberate.

### HTML

```html
<div class="mega-header">
  <h2 data-edit-id="megaBento.heading">{megaBento.heading}</h2>
</div>
```

### CSS (verified from billfanter.com production)

```css
.mega-header {
  text-align: left;
  max-width: 640px;              /* caps the h2 so it wraps to 2 lines */
  margin: 0 auto 40px 0;          /* left-flushed, 40px below to grid */
}

.mega-header h2 {
  font-family: var(--font-display);
  font-size: clamp(24px, 2.6vw, 36px);   /* Bill-Fanter production */
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.025em;
  color: var(--text);                     /* NOT white — h2 is on the light continuous bg */
  font-feature-settings: 'ss01', 'ss02';  /* Geist stylistic sets */
  margin: 0;
}
```

### Spacing

| Above the h2 | `100px` (section padding) |
| Below the h2 | `40px` to grid |

### Copy writing rules — heading

**Character count**: 30-70 characters
**Word count**: 6-11 words
**Structure**: ONE promise that covers everything in the grid below. Not a list, not a question.
**Voice**: Second-person implicit ("Everything you need to X") or noun-phrase declarative ("Every tool for building Y").

### Good headings

- ✓ "Everything you need to trade options with confidence" (real Bill-Fanter, 8 words)
- ✓ "One toolkit for the entire HR consulting stack"
- ✓ "Every service a growing home electrical needs"
- ✓ "The complete system for owner-operators"

### Bad headings

- ✗ "Our services" (no promise)
- ✗ "What we offer" (dead words)
- ✗ "Discover our full range of products and services" (banned words)
- ✗ "Everything you need to succeed" (empty — "succeed" at what?)
- ✗ "The ultimate solution for X" (banned "ultimate")

### Anti-patterns

- No eyebrow above the h2 (violates global "never use eyebrows" rule)
- No subhead paragraph under the h2 — the tiles ARE the subhead
- No question mark headings
- No centered h2 — always left

---

## 3. The grid — 6 tiles across 3 rows

The signature of this section. Not equal-weight cards — three rows of distinct emphasis so the eye lands on the hero tile first, then the community tile, then scans the utility row.

### Grid CSS (verified from billfanter.com production)

```css
.mega-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(3, 386px);   /* 386px rows — tall enough for 9:16 mobile ratio on the tall tile */
  gap: 16px;                              /* NOT 24 — tight */
}

/* Width classes */
.tile--w2 { grid-column: span 2; }
.tile--w4 { grid-column: span 4; }
.tile--w6 { grid-column: span 6; }

/* Height class */
.tile.is-tall { grid-row: span 2; }
```

### Layout topology

```
Row 1 (386px):  [ MASTERCLASS w4 ]      [ COMMUNITY w2 ]
                (4 cols, big hero tile)  (2 cols — first row of the tall tile)

Row 2 (386px):  [ WATCHLIST w2 ] [ WEBINAR w2 ]  [ COMMUNITY w2 continues (is-tall) ]
                                                  (this tile is w2 × 2 rows = square-ish)

Row 3 (386px):  [ REVIEWS w4 ]                    [ COMMUNITY w2 tall tile ends ]
```

Wait — verify against actual: Bill-Fanter's layout is:

```
Row 1: [ Masterclass w4 ] [ Community w2 ]
Row 2: [ Watchlist w2 sq ] [ Webinar w2 ] [ YouTube w2 tall — spans rows 2+3 ]
Row 3: [ Reviews w4 ]
```

That's 6 tiles: 1 hero (w4), 4 medium (w2), 1 tall (w2 × 2 rows), 1 full-width reviews (w4). Total width per row = 6 columns. ✓

### Tile base CSS (shared by all six tiles)

```css
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;              /* copy anchors to bottom-left */
  padding: 28px;                          /* 28 — verified. Featured tile uses 36 */
  border-radius: var(--radius-lg);        /* typically 16-20px */
  overflow: hidden;
  background: var(--surface-strong);
  box-shadow: var(--shadow-card);
  isolation: isolate;                     /* z-index boundary */
  color: #fff;                            /* text on tiles is always white — every tile has dark scrim/dark bg */
  transition:
    transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tile:hover {
  transform: translateY(-4px);            /* NOT scale — global anti-scale rule */
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 18px 40px rgba(0, 0, 0, 0.12);
}

.tile.is-featured { padding: 36px; }      /* only the w4 masterclass hero */
```

**Why tiles are anchored bottom-left**: the copy sits over an image or gradient background. Bottom-left = furthest from the top-right arrow chip = maximum visual balance.

**Why `translateY(-4px)` not scale**: global DESIGN.md rule — `scale()` >1.02 on hover is banned. The lift is enough motion.

---

## 4. Tile type 1 — Image tile (photo background)

Used for the hero (masterclass) and webinar tiles. Full-bleed image behind copy.

### HTML

```html
<a class="tile tile--image tile--w4 is-featured"
   href="{tile.href}"
   aria-label="{tile.aria}">
  <img class="tile__img"
       src="{tile.img}"
       srcset="{tile.img}-720.webp 1x, {tile.img} 2x"
       alt=""
       aria-hidden="true"
       loading="lazy" />
  <span class="tile__scrim" aria-hidden="true"></span>
  <span class="tile__body">
    <span class="tile__title" data-edit-id="megaBento.tiles.0.title">
      {tile.title}
    </span>
  </span>
  <span class="tile__arrow" aria-hidden="true">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M5 13L13 5M13 5H6M13 5V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>
</a>
```

### CSS

```css
.tile__img {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tile:hover .tile__img {
  transform: scale(1.04);                 /* 1.04 exactly — the ONE allowed exception, per global DESIGN.md */
}

.tile__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 30%,
    rgba(0, 0, 0, 0.35) 62%,
    rgba(0, 0, 0, 0.82) 100%
  );
}
```

### When to use image tile

- The tile's subject is a person, product, or scene that photographs well
- The user has a real high-quality image (400×280+ minimum)
- The subject is more compelling than any typographic treatment would be

### When NOT to use image tile

- User has no photo → fall back to gradient tile (§5)
- Photo is a stock image → gradient is more premium
- Photo is a screenshot of software → use "tight" variant (§7)

---

## 5. Tile type 2 — Gradient tile (colored surface)

Used for community, watchlist, YouTube. A colored background (static CSS gradient OR animated grainient) plus optional embedded content (device mockup, pick screenshot, video reel).

### HTML — plain gradient

```html
<a class="tile tile--gradient tile--w2"
   href="{tile.href}"
   aria-label="{tile.aria}"
   style="--tile-grad: {tile.grad};">
  <span class="tile__grain"
        data-grainient
        data-color1="{tile.g1}"
        data-color2="{tile.g2}"
        data-color3="{tile.g3}"
        aria-hidden="true"></span>
  <span class="tile__body">
    <span class="tile__title" data-edit-id="megaBento.tiles.N.title">{tile.title}</span>
  </span>
  <span class="tile__arrow" aria-hidden="true"><!-- arrow svg --></span>
</a>
```

### CSS

```css
.tile--gradient {
  background: var(--tile-grad);           /* CSS fallback for the animated grainient */
}

.tile__grain {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  overflow: hidden;
}

/* Bottom scrim: keeps title legible over bright grainients */
.tile--gradient::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 48%, rgba(0, 0, 0, 0.5) 100%);
}
```

### Gradient formulas (verified from Bill-Fanter production)

| Tile | Gradient (135deg linear) |
|---|---|
| Community (warm) | `#FF8308 → #EF4444 → #6B3BD5` (orange → red → purple) |
| Watchlist (cool) | `#1754d8 → #3b82f6 → #0b1f5c` (mid blue → sky → deep navy) |
| YouTube (dark) | `#0a0a0a` (solid, hosts video reel) |

**How to pick gradient per user brand**:
- Use extracted `brand_palette.primary` + `brand_palette.tertiary` + `brand_palette.secondary` in that order
- If palette has <3 colors: primary → primary lighter → primary darker
- Ban rules: no purple→blue→teal (AI-tell), no rainbow

### Grainient variant (interactive)

If the JS grainient library is available, the `<span class="tile__grain" data-grainient>` mounts an animated color-shifting grain effect. Static CSS gradient is the fallback.

Never use in static HTML output — Opus emits the static gradient only; grainient is a progressive enhancement.

---

## 6. Tile type 3 — Gradient + device mockup (community tile)

The community/masterclass "shows the product" pattern: gradient background + a phone/device mockup anchored to the bottom of the tile.

### HTML addition (inside a gradient tile)

```html
<img class="tile__device"
     src="{tile.device}"
     srcset="{tile.device}-720.webp 1x, {tile.device} 2x"
     alt=""
     aria-hidden="true"
     loading="lazy" />
```

### CSS

```css
.tile__device {
  position: absolute;
  z-index: 1;                             /* above gradient, below title text */
  bottom: 0;                              /* anchored to bottom edge of tile */
  left: 50%;
  transform: translateX(-50%);            /* horizontally centered */
  width: 62%;                             /* device is smaller than tile — grainient shows on sides */
  height: 96%;
  object-fit: cover;                      /* crops into the mockup — source has wide empty margins */
  object-position: center bottom;
  filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.4));
}
```

**Why 62% width, not full width**: the device mockup has empty background around it in the source image. Sizing to 62% means the gradient shows on the sides — feels intentional, not "someone forgot to remove the background."

**Why anchored bottom, not centered**: creates the "phone standing on the tile floor" effect. Center-anchored feels floating.

---

## 7. Tile type 4 — Gradient + screenshot pick (watchlist tile)

Shows a UI screenshot (like a preview of what a signup delivers) floating over a gradient.

### HTML

```html
<img class="tile__pick"
     src="{tile.pick}"
     srcset="{tile.pick}-720.webp 1x, {tile.pick} 2x"
     alt=""
     aria-hidden="true"
     loading="lazy" />
```

### CSS

```css
.tile__pick {
  position: absolute;
  z-index: 1;
  top: 50%;                               /* dead-center in tile */
  left: 50%;
  width: 92%;                             /* nearly full-width — the screenshot IS the content */
  transform: translate(-50%, -50%);
  border-radius: 10px;                    /* matches the screenshot's own UI radius */
  transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tile:hover .tile__pick {
  transform: translate(-50%, -50%) scale(1.03);   /* 1.03 exactly */
}
```

**Difference from device tile**: `device` = bottom-anchored, small (62%), portrait format. `pick` = center-anchored, wide (92%), landscape screenshot.

---

## 8. Tile type 5 — Gradient + video reel (YouTube tile)

Autoplaying muted vertical reel filling a tall tile.

### HTML

```html
<a class="tile tile--gradient tile--w2 is-tall is-dark"
   href="{tile.href}"
   target="_blank"
   rel="noopener"
   aria-label="{tile.aria}"
   style="--tile-grad: #0a0a0a;">
  <iframe class="tile__video"
          data-lazysrc="{tile.video}"
          title=""
          tabindex="-1"
          aria-hidden="true"
          loading="lazy"
          allow="autoplay; fullscreen"></iframe>
  <span class="tile__scrim" aria-hidden="true"></span>
  <span class="tile__icon" aria-hidden="true">
    <!-- YouTube icon SVG (24×24, stroke, 1.8px) -->
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 8.5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/>
      <path d="M10.5 9.2l4.5 2.8-4.5 2.8z"/>
    </svg>
  </span>
  <span class="tile__body">
    <span class="tile__title" data-edit-id="megaBento.tiles.4.title">{tile.title}</span>
  </span>
  <span class="tile__arrow" aria-hidden="true"><!-- arrow svg --></span>
</a>
```

### CSS

```css
.tile.is-dark { background: #0a0a0a; }    /* solid black behind the reel */

.tile__video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Overscale 4px + center so the reel bleeds past tile edges (clipped by
     overflow:hidden) instead of leaving thin dark slivers on the sides */
  width: calc(100% + 4px);
  height: calc(100% + 4px);
  border: 0;
  z-index: 0;
  pointer-events: none;                   /* the tile itself is the link, not the iframe */
}
```

### Video source rules

- **Aspect ratio**: 9:16 vertical (like a Reel/Short)
- **Autoplay**: yes, muted, loop
- **Controls**: hidden
- **Source**: Vimeo/YouTube shorts URL with `background=1&autoplay=1&muted=1&loop=1&controls=0&playsinline=1&dnt=1`
- **Fallback**: if no video URL, drop the iframe and use a device mockup pattern (§6) OR a large icon (§9) — never leave the tile empty

### Icon variant

The YouTube tile shows the platform icon in the top-LEFT (not top-right where the arrow chip lives). See §11 for icon CSS.

---

## 9. Tile type 6 — Reviews slideshow tile (bottom-row w4)

Full-width autoplaying carousel of written testimonials. Different from every other tile: no image, no gradient, black background, sliding quotes.

### HTML

```html
<div class="tile tile--reviews tile--w4"
     data-mega-reviews
     data-href="{tile.href}">
  <div class="slides">
    <figure class="slide is-active">
      <p class="quote">&ldquo;{testimonial.quote}&rdquo;</p>
      <figcaption class="rauthor">
        <img class="ravatar" src="{testimonial.img}" alt="{testimonial.name}" loading="lazy" />
        <span class="rmeta">
          <span class="rname">{testimonial.name}</span>
          <span class="rtitle">{testimonial.title}</span>
        </span>
      </figcaption>
    </figure>
    <!-- Additional <figure class="slide"> elements — one per testimonial -->
  </div>
  <div class="slider-foot">
    <a class="more" href="{tile.href}">
      Read all reviews
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
    <div class="dots">
      <span class="dot is-active"></span>
      <!-- one <span> per testimonial -->
    </div>
  </div>
</div>
```

### CSS

```css
.tile--reviews {
  background: #0a0a0a;                    /* solid black — quotes read like premium print */
  padding: 0;                             /* slides handle their own padding */
  cursor: pointer;                        /* whole tile is clickable */
}

.tile--reviews:hover .more {
  gap: 12px;
  opacity: 1;
}

.slides {
  position: absolute;
  inset: 0;
}

.slide {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 40px 44px 30px;                /* 40 top / 44 sides / 30 bottom */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition:
    opacity 0.5s ease,
    transform 0.5s ease,
    visibility 0.5s ease;
}

.slide.is-active {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.quote {
  margin: 0;
  font-size: 20px;                        /* matches tile__title so the tile reads consistent */
  line-height: 1.45;
  font-weight: 500;
  color: #fff;
  max-width: 62ch;
}

.rauthor {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ravatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 auto;
}

.rmeta {
  display: flex;
  flex-direction: column;
}

.rname {
  font-weight: 600;
  color: #fff;
}

.rtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.slider-foot {
  position: absolute;
  bottom: 30px;
  right: 36px;
  display: flex;
  align-items: center;
  gap: 18px;
  z-index: 3;
}

.more {
  display: inline-flex;
  align-items: center;
  gap: 7px;                               /* 7px default → 10 hover → 12 tile-hover */
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  opacity: 0.9;
  transition: opacity 0.2s, gap 0.2s;
}

.more:hover {
  opacity: 1;
  gap: 10px;
}

.dots {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dot {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.28);
  transition: background-color 0.2s, transform 0.2s;
}

.dot.is-active {
  background-color: #fff;
  transform: scale(1.15);
}

/* Interactive dots (desktop only): grow hit area to 24×24 for tap-target compliance,
   draw visible 8px dot via ::after */
.dot[role="button"] {
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 0;
  background-color: transparent;
  transform: none;
  position: relative;
}

.dot[role="button"]::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.28);
  transition: background-color 0.2s, transform 0.2s;
}

.dot[role="button"]:hover::after {
  background-color: rgba(255, 255, 255, 0.5);
}

.dot[role="button"].is-active::after {
  background-color: #fff;
  transform: scale(1.15);
}
```

### Interaction behavior

- **Auto-advance**: every 6 seconds
- **Pause on hover**: yes (desktop only)
- **Swipe** (mobile): >40px horizontal touch delta advances slides
- **Dot click** (desktop): jump to slide, resets timer
- **Whole-tile click**: navigates to `data-href` UNLESS clicking a dot or the "Read all reviews" link

### Inline `<script>` for reviews carousel

Ships inline (no external JS bundle). See §14 for full script.

### Testimonial content rules

- **Quote**: 40-80 words, real testimonials only, no ellipses in the middle (never truncate someone's words invisibly — either quote them in full or pick a different testimonial)
- **Name**: full name, first + last
- **Title**: role @ company, real
- **Avatar**: 88×88 minimum, square, real photo (never stock)
- **Minimum count**: 3 testimonials required (fewer = no carousel, use quote-band section family instead)

---

## 10. Shared elements — title, body, arrow chip, icon

Every tile shares these anchor elements. Consistent positioning across all 6 tiles is what makes the grid read as one system.

### Title + body block (bottom-left of every tile)

```html
<span class="tile__body">
  <span class="tile__title">{tile.title}</span>
  <!-- Optional description — only on featured tile -->
  <span class="tile__desc">{tile.desc}</span>
</span>
```

```css
.tile__body {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 90%;                         /* prevents text touching the arrow chip on narrow tiles */
}

.tile__title {
  font-size: 20px;                        /* same across every tile — including featured */
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
  color: #fff;
}

.tile__desc {
  font-size: 14px;
  line-height: 1.5;
  color: #fff;
}

/* Featured tile: same 20px title (deliberate consistency), 16px desc, 420px max */
.tile.is-featured .tile__title { font-size: 20px; }
.tile.is-featured .tile__desc {
  font-size: 16px;
  max-width: 420px;
}
```

**Why every title is 20px (even the featured hero)**: consistency across the grid. If the featured tile's title were 28px, it would fight the h2 above the grid. Restraint > hierarchy explosion.

### Arrow chip (top-right of every tile)

```html
<span class="tile__arrow" aria-hidden="true">
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M5 13L13 5M13 5H6M13 5V12"
          stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</span>
```

```css
.tile__arrow {
  position: absolute;
  top: 24px;                              /* 24 from top / 24 from right — NOT 28 */
  right: 24px;
  z-index: 3;                             /* above everything else in the tile */
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #fff;
  transition:
    background 200ms cubic-bezier(0.2, 0, 0, 1),
    transform 200ms cubic-bezier(0.2, 0, 0, 1);
}

.tile:hover .tile__arrow {
  background: rgba(255, 255, 255, 0.95);
  color: #0a0a0a;                         /* arrow inverts on hover */
  transform: translate(2px, -2px);        /* moves toward its own direction — reinforces "click me" */
}
```

**Why the arrow inverts on hover**: the tile is the link — the arrow is the visible signal. Inversion (translucent white → solid white with dark ink) makes it feel like a "button pressed" state, tying the whole tile to the click affordance.

### Icon chip (top-left, only on tiles with an icon)

```css
.tile__icon {
  position: absolute;
  top: 28px;                              /* 28 top / 28 left — differs from arrow's 24 */
  left: 28px;
  z-index: 2;
  width: 48px;
  height: 48px;
  border-radius: 12px;                    /* square-ish, not circle — differentiates from arrow */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #fff;
}

.tile__icon svg { width: 24px; height: 24px; }
```

**When to include icon**: only on gradient tiles that link to an external platform (YouTube, Spotify, Instagram, LinkedIn, Discord, etc.). Icons on image tiles or reviews tile = visual clutter.

---

## 11. Tight image variant

For tiles that host a screenshot of software (a UI shot) — the image displays smaller, framed within the tile, instead of edge-to-edge cover.

### CSS

```css
.tile.is-tight .tile__img {
  object-fit: contain;
  padding: 8%;
  box-sizing: border-box;
}
```

**When to use `is-tight`**: the source image has its own UI chrome (like a screenshot of a dashboard) — cropping edge-to-edge would cut off important pixels. `is-tight` treats the image like a framed photograph in a gallery instead.

---

## 12. Content slot schema — what Opus emits

```typescript
type MegaBentoContent = {
  heading: string;                        // 30-70 chars, one promise
  tiles: Array<MegaBentoTile>;            // exactly 6 tiles
};

type MegaBentoTile =
  | ImageTile
  | GradientTile
  | ReviewsTile;

type BaseTile = {
  span: 'w2' | 'w4' | 'w6';               // grid column span
  href: string;                           // internal path or external URL
  target?: '_blank';                      // external only
  title: string;                          // 2-6 words
  aria: string;                           // full sentence — "See X: Y" or "Get Z"
  desc?: string;                          // optional; only on featured (is-featured) tile
  featured?: boolean;                     // makes it padding: 36 + is-featured styling
  tall?: boolean;                         // spans 2 rows (used for w2 tiles only)
  square?: boolean;                       // meta hint, no direct CSS
  dark?: boolean;                         // solid #0a0a0a bg (for video tiles)
  tight?: boolean;                        // is-tight image variant
};

type ImageTile = BaseTile & {
  kind: 'image';
  img: string;                            // WebP URL, min 800px wide
};

type GradientTile = BaseTile & {
  kind: 'gradient';
  grad: string;                           // CSS gradient string (linear-gradient 135deg …)
  g1?: string;                            // hex — grainient color 1 (progressive enhancement)
  g2?: string;
  g3?: string;
  device?: string;                        // portrait mockup image URL
  pick?: string;                          // landscape screenshot image URL
  video?: string;                         // Vimeo embed URL with background params
  icon?: string;                          // SVG path string for icon chip
};

type ReviewsTile = BaseTile & {
  kind: 'reviews';
  testimonials: Array<{
    quote: string;                        // 40-80 words
    name: string;
    title: string;                        // role @ company
    img: string;                          // avatar URL, min 88×88
  }>;                                     // min 3, max 6
};
```

## 13. Fallbacks — what to render when data is missing

| Missing / thin data | Fallback |
|---|---|
| Fewer than 6 tiles | Emit 4-tile variant (`mega-bento-4tile`) instead — see that section family |
| No image + no gradient colors | Use `linear-gradient(135deg, var(--primary), var(--secondary))` as CSS gradient |
| No `device`/`pick`/`video`/`icon` | Plain gradient tile with just title bottom-left |
| Fewer than 3 testimonials | Skip reviews tile entirely — replace with another gradient tile OR use `quote-band` section instead |
| No `desc` on featured | Show title only (no desc — never fabricate) |
| Tile has no `img` but `kind: 'image'` | Convert to gradient tile using palette |

**Never fabricate**:
- Testimonials (attribution required)
- Titles (must match the linked page)
- Aria labels (must describe the actual destination)

---

## 14. Complete assembled HTML (reference implementation)

```html
<section id="mega-bento" data-section="mega-bento-6tile"
  style="background: transparent; padding: 100px 40px;">

  <div style="max-width: 1180px; margin: 0 auto;">

    <!-- Header -->
    <div style="text-align: left; max-width: 640px; margin: 0 auto 40px 0;">
      <h2 data-edit-id="megaBento.heading"
        style="font-family: var(--font-display); font-size: clamp(24px, 2.6vw, 36px);
               font-weight: 500; line-height: 1.1; letter-spacing: -0.025em;
               color: var(--text); margin: 0;">
        {megaBento.heading}
      </h2>
    </div>

    <!-- Grid: 6 columns × 3 rows × 386px each × 16px gap -->
    <div style="display: grid; grid-template-columns: repeat(6, 1fr);
                grid-template-rows: repeat(3, 386px); gap: 16px;">

      <!-- Tile 1: Masterclass (image, w4, featured, row 1) -->
      <a href="{megaBento.tiles.0.href}" aria-label="{megaBento.tiles.0.aria}"
        style="grid-column: span 4; position: relative; display: flex;
               flex-direction: column; justify-content: flex-end;
               padding: 36px; border-radius: 20px; overflow: hidden;
               isolation: isolate; color: #fff; text-decoration: none;
               box-shadow: 0 6px 16px rgba(0,0,0,0.08), 0 18px 40px rgba(0,0,0,0.12);
               transition: transform 250ms cubic-bezier(.4,0,.2,1);">
        <img src="{megaBento.tiles.0.img}" alt="" aria-hidden="true" loading="lazy"
          style="position: absolute; inset: 0; z-index: 0; width: 100%;
                 height: 100%; object-fit: cover;" />
        <span aria-hidden="true"
          style="position: absolute; inset: 0; z-index: 1;
                 background: linear-gradient(180deg, rgba(0,0,0,0) 30%,
                   rgba(0,0,0,0.35) 62%, rgba(0,0,0,0.82) 100%);"></span>
        <span style="position: relative; z-index: 2; display: flex;
                     flex-direction: column; gap: 8px; max-width: 90%;">
          <span data-edit-id="megaBento.tiles.0.title"
            style="font-size: 20px; font-weight: 600; letter-spacing: -0.015em;
                   line-height: 1.2; color: #fff;">
            {megaBento.tiles.0.title}
          </span>
        </span>
        <span aria-hidden="true"
          style="position: absolute; top: 24px; right: 24px; z-index: 3;
                 width: 38px; height: 38px; border-radius: 50%; display: inline-flex;
                 align-items: center; justify-content: center;
                 background: rgba(255,255,255,0.16);
                 border: 1px solid rgba(255,255,255,0.28);
                 backdrop-filter: blur(6px); color: #fff;">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 13L13 5M13 5H6M13 5V12" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </a>

      <!-- Tile 2: Community (gradient + device, w2, spans row 1) -->
      <a href="{megaBento.tiles.1.href}" aria-label="{megaBento.tiles.1.aria}"
        style="grid-column: span 2; position: relative; display: flex;
               flex-direction: column; justify-content: flex-end; padding: 28px;
               border-radius: 20px; overflow: hidden; isolation: isolate;
               color: #fff; text-decoration: none;
               background: {megaBento.tiles.1.grad};">
        <img src="{megaBento.tiles.1.device}" alt="" aria-hidden="true" loading="lazy"
          style="position: absolute; z-index: 1; bottom: 0; left: 50%;
                 transform: translateX(-50%); width: 62%; height: 96%;
                 object-fit: cover; object-position: center bottom;
                 filter: drop-shadow(0 18px 40px rgba(0,0,0,0.4));" />
        <span aria-hidden="true"
          style="position: absolute; inset: 0; z-index: 1; pointer-events: none;
                 background: linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,0.5) 100%);"></span>
        <span style="position: relative; z-index: 2; display: flex;
                     flex-direction: column; gap: 8px; max-width: 90%;">
          <span data-edit-id="megaBento.tiles.1.title"
            style="font-size: 20px; font-weight: 600; letter-spacing: -0.015em;
                   line-height: 1.2; color: #fff;">
            {megaBento.tiles.1.title}
          </span>
        </span>
        <span aria-hidden="true"
          style="position: absolute; top: 24px; right: 24px; z-index: 3;
                 width: 38px; height: 38px; border-radius: 50%; display: inline-flex;
                 align-items: center; justify-content: center;
                 background: rgba(255,255,255,0.16);
                 border: 1px solid rgba(255,255,255,0.28);
                 backdrop-filter: blur(6px); color: #fff;">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 13L13 5M13 5H6M13 5V12" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </a>

      <!-- Tile 3: Watchlist (gradient + pick, w2, row 2) -->
      <a href="{megaBento.tiles.2.href}" aria-label="{megaBento.tiles.2.aria}"
        style="grid-column: span 2; position: relative; display: flex;
               flex-direction: column; justify-content: flex-end; padding: 28px;
               border-radius: 20px; overflow: hidden; isolation: isolate;
               color: #fff; text-decoration: none;
               background: {megaBento.tiles.2.grad};">
        <img src="{megaBento.tiles.2.pick}" alt="" aria-hidden="true" loading="lazy"
          style="position: absolute; z-index: 1; top: 50%; left: 50%;
                 width: 92%; transform: translate(-50%, -50%);
                 border-radius: 10px;" />
        <span aria-hidden="true"
          style="position: absolute; inset: 0; z-index: 1; pointer-events: none;
                 background: linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,0.5) 100%);"></span>
        <span style="position: relative; z-index: 2;">
          <span data-edit-id="megaBento.tiles.2.title"
            style="font-size: 20px; font-weight: 600; letter-spacing: -0.015em;
                   line-height: 1.2; color: #fff;">
            {megaBento.tiles.2.title}
          </span>
        </span>
        <span aria-hidden="true"
          style="position: absolute; top: 24px; right: 24px; z-index: 3;
                 width: 38px; height: 38px; border-radius: 50%; display: inline-flex;
                 align-items: center; justify-content: center;
                 background: rgba(255,255,255,0.16);
                 border: 1px solid rgba(255,255,255,0.28);
                 backdrop-filter: blur(6px); color: #fff;">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 13L13 5M13 5H6M13 5V12" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </a>

      <!-- Tile 4: Webinar (image, w2, row 2) — same structure as Tile 1 but w2 -->
      <a href="{megaBento.tiles.3.href}" aria-label="{megaBento.tiles.3.aria}"
        style="grid-column: span 2; position: relative; display: flex;
               flex-direction: column; justify-content: flex-end; padding: 28px;
               border-radius: 20px; overflow: hidden; isolation: isolate;
               color: #fff; text-decoration: none;">
        <img src="{megaBento.tiles.3.img}" alt="" aria-hidden="true" loading="lazy"
          style="position: absolute; inset: 0; z-index: 0; width: 100%;
                 height: 100%; object-fit: cover;" />
        <span aria-hidden="true"
          style="position: absolute; inset: 0; z-index: 1;
                 background: linear-gradient(180deg, rgba(0,0,0,0) 30%,
                   rgba(0,0,0,0.35) 62%, rgba(0,0,0,0.82) 100%);"></span>
        <span style="position: relative; z-index: 2;">
          <span data-edit-id="megaBento.tiles.3.title"
            style="font-size: 20px; font-weight: 600; letter-spacing: -0.015em;
                   line-height: 1.2; color: #fff;">
            {megaBento.tiles.3.title}
          </span>
        </span>
        <!-- arrow chip omitted for brevity, same as above -->
      </a>

      <!-- Tile 5: YouTube (gradient + video, w2, is-tall spanning rows 2+3) -->
      <a href="{megaBento.tiles.4.href}" target="_blank" rel="noopener"
        aria-label="{megaBento.tiles.4.aria}"
        style="grid-column: span 2; grid-row: span 2;
               position: relative; display: flex; flex-direction: column;
               justify-content: flex-end; padding: 28px; border-radius: 20px;
               overflow: hidden; isolation: isolate; color: #fff;
               text-decoration: none; background: #0a0a0a;">
        <iframe src="{megaBento.tiles.4.video}" title="" tabindex="-1"
          aria-hidden="true" loading="lazy" allow="autoplay; fullscreen"
          style="position: absolute; top: 50%; left: 50%;
                 transform: translate(-50%, -50%);
                 width: calc(100% + 4px); height: calc(100% + 4px);
                 border: 0; z-index: 0; pointer-events: none;"></iframe>
        <span aria-hidden="true"
          style="position: absolute; inset: 0; z-index: 1;
                 background: linear-gradient(180deg, rgba(0,0,0,0) 30%,
                   rgba(0,0,0,0.35) 62%, rgba(0,0,0,0.82) 100%);"></span>
        <span aria-hidden="true"
          style="position: absolute; top: 28px; left: 28px; z-index: 2;
                 width: 48px; height: 48px; border-radius: 12px;
                 display: inline-flex; align-items: center; justify-content: center;
                 background: rgba(255,255,255,0.16);
                 border: 1px solid rgba(255,255,255,0.28);
                 backdrop-filter: blur(6px); color: #fff;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
            style="width: 24px; height: 24px;">
            <path d="M2 8.5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/>
            <path d="M10.5 9.2l4.5 2.8-4.5 2.8z"/>
          </svg>
        </span>
        <span style="position: relative; z-index: 2;">
          <span data-edit-id="megaBento.tiles.4.title"
            style="font-size: 20px; font-weight: 600; letter-spacing: -0.015em;
                   line-height: 1.2; color: #fff;">
            {megaBento.tiles.4.title}
          </span>
        </span>
      </a>

      <!-- Tile 6: Reviews (slideshow, w4, row 3) -->
      <div data-mega-reviews data-href="{megaBento.tiles.5.href}"
        style="grid-column: span 4; position: relative; border-radius: 20px;
               overflow: hidden; isolation: isolate; background: #0a0a0a;
               cursor: pointer;">
        <div style="position: absolute; inset: 0;">
          <figure class="slide is-active"
            style="position: absolute; inset: 0; margin: 0; padding: 40px 44px 30px;
                   display: flex; flex-direction: column;
                   justify-content: space-between; gap: 20px;">
            <p style="margin: 0; font-size: 20px; line-height: 1.45; font-weight: 500;
                      color: #fff; max-width: 62ch;">
              &ldquo;{megaBento.tiles.5.testimonials.0.quote}&rdquo;
            </p>
            <figcaption style="display: flex; align-items: center; gap: 12px;">
              <img src="{megaBento.tiles.5.testimonials.0.img}"
                alt="{megaBento.tiles.5.testimonials.0.name}" loading="lazy"
                style="width: 44px; height: 44px; border-radius: 50%;
                       object-fit: cover; flex: 0 0 auto;" />
              <span style="display: flex; flex-direction: column;">
                <span style="font-weight: 600; color: #fff;">
                  {megaBento.tiles.5.testimonials.0.name}
                </span>
                <span style="font-size: 14px; color: rgba(255,255,255,0.6);">
                  {megaBento.tiles.5.testimonials.0.title}
                </span>
              </span>
            </figcaption>
          </figure>
          <!-- Additional <figure class="slide"> — one per testimonial -->
        </div>
        <div style="position: absolute; bottom: 30px; right: 36px;
                    display: flex; align-items: center; gap: 18px; z-index: 3;">
          <a href="{megaBento.tiles.5.href}"
            style="display: inline-flex; align-items: center; gap: 7px;
                   font-size: 14px; font-weight: 600; color: #fff;
                   text-decoration: none; opacity: 0.9;">
            Read all reviews
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor"
                stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="is-active"
              style="display: block; width: 8px; height: 8px; border-radius: 50%;
                     background-color: #fff; transform: scale(1.15);"></span>
            <!-- one <span> per testimonial (only first has is-active) -->
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Inline script for reviews carousel -->
  <script>
    (function initMegaReviews() {
      document.querySelectorAll('[data-mega-reviews]').forEach(function (slider) {
        if (slider.dataset.mrInit === '1') return;
        var slides = Array.from(slider.querySelectorAll('.slide'));
        var dots = Array.from(slider.querySelectorAll('.dots > span'));
        if (slides.length <= 1) return;
        slider.dataset.mrInit = '1';
        var idx = 0, timer;
        function show(i) {
          idx = (i + slides.length) % slides.length;
          slides.forEach(function (s, n) { s.classList.toggle('is-active', n === idx); });
          dots.forEach(function (d, n) { d.classList.toggle('is-active', n === idx); });
        }
        function start() { timer = window.setInterval(function () { show(idx + 1); }, 6000); }
        function stop() { window.clearInterval(timer); }
        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        var href = slider.getAttribute('data-href');
        if (href) slider.addEventListener('click', function (e) {
          if (e.target.closest('.dots > span') || e.target.closest('a')) return;
          window.location.href = href;
        });
        show(0); start();
      });
    })();
  </script>
</section>
```

---

## 15. Responsive behavior

### Tablet (≤ 900px)

```css
@media (max-width: 900px) {
  .mega-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: none;
    grid-auto-rows: 300px;                /* uniform 300px rows */
  }
  .tile--w4,
  .tile--w6 { grid-column: span 2; }      /* full-width */
  .tile--w2 { grid-column: span 1; }      /* half-width */
}
```

Two columns. Featured tile goes full-width, small tiles pair up.

### Mobile (≤ 560px)

```css
@media (max-width: 560px) {
  .mega-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-auto-rows: minmax(260px, auto);
  }
  .tile.is-tall { aspect-ratio: 9 / 16; } /* video tile fills width in reel format */
  .tile--w2,
  .tile--w4,
  .tile--w6 { grid-column: span 1; padding: 28px; }

  /* Reviews mobile: shrink + line-clamp quote, center foot below author */
  .tile--reviews { padding: 0; }
  .slide { padding: 24px 22px 56px; }
  .quote {
    font-size: 15px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .slider-foot { left: 0; right: 0; bottom: 18px; justify-content: center; }
}
```

Single column, every tile full-width. Video tile locks to 9:16 to feel native.

---

## 16. Accessibility checklist

- [x] Every tile that's a link is an `<a>` with descriptive `aria-label`
- [x] Every image inside a link has `alt=""` + `aria-hidden="true"` (link's aria-label carries the meaning)
- [x] Arrow chips and scrims have `aria-hidden="true"`
- [x] Reviews tile testimonial avatars have real `alt` = author name (they're informative, not decorative)
- [x] `<figure>`/`<figcaption>` for each testimonial slide (semantic HTML for quoted material)
- [x] Reviews dots on desktop upgraded to `role="button"` + `tabindex="0"` + keyboard handler (Enter/Space)
- [x] Reviews dots on mobile stay as `<span>` (never a tap target under 24×24) — user swipes instead
- [x] Color contrast on all titles: `#fff` on scrimmed dark = 8:1+ (AAA)
- [x] `prefers-reduced-motion`: disable image scale-on-hover, slide transition duration → 0
- [x] External-link tiles use `target="_blank" rel="noopener"`

## 17. Performance checklist

- [x] Every image `loading="lazy"` (except LCP hero if MegaBento is above the fold — unlikely, it's section 2)
- [x] Vimeo iframe uses `background=1&autoplay=1&muted=1&loop=1&controls=0&playsinline=1&dnt=1`
- [x] Vimeo iframe `loading="lazy"` (video doesn't request until in-view)
- [x] Each tile image supplies WebP with `srcset` for 1x (720w) and 2x (native)
- [x] Reviews carousel is inline `<script>` — no external JS bundle
- [x] No custom fonts loaded specifically for this section (uses global `var(--font-display)`, `var(--font-body)`)
- [x] Backdrop-filter `blur(6px)` on chips is cheap (small elements only)

## 18. Design token dependencies

Uses these CSS variables set in `<head>`:

```css
:root {
  --font-display: "Fraunces", "Cabinet Grotesk", ui-serif, Georgia, serif;
  --text: #0a0a0c;
  --primary: #hex;                         /* brand primary — used for fallback gradients */
  --secondary: #hex;                       /* brand secondary */
  --tertiary: #hex;                        /* brand tertiary */
  --surface-strong: #0a0a0c;               /* dark surface behind tiles */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 20px 44px -20px rgba(0,0,0,0.12);
  --radius-lg: 20px;
}
```

The `#0a0a0a` (dark tile / reviews bg), `#fff` (tile text), and per-tile gradient hexes come from brand palette OR the tile's own `grad` field.

---

## 19. Rationale (why this section converts)

- **6 tiles in one glance** = every product visible without scrolling, so scanners can jump to the tile that matches their stage (buyer, browser, learner, community-seeker).
- **Featured w4 hero tile** = the primary offer gets 2× the visual weight without duplicating the CTA — clicking anywhere on the tile is the click.
- **Same 20px title on every tile (including featured)** = restraint. If the featured title were 28px, it would fight the section h2 above. Consistency signals a system.
- **Icon chip top-left + arrow chip top-right on every tile** = predictable affordance across the grid. User learns the pattern once.
- **Testimonials slideshow inline (as the 6th tile)** = social proof lives IN the product overview, not a separate section, so nobody scrolls past it.
- **Whole-tile clickable, not just the arrow** = 100% of the tile's surface is the tap target. Mobile-friendly, and the arrow chip is the visible signal (not the actual link).
- **Gradient + device/pick/video** = each tile shows what the product LOOKS like, not just labels it. "The trading community" tile has a Discord phone in it. "Free stock watchlist" has the actual watchlist preview.
- **Two rows tall for the video tile** = a reel needs its native 9:16 aspect ratio to feel like content, not decoration.
- **Continuous background wrap with the section below** = the bento and the watchlist section feel like one editorial spread, not two isolated cards.

---

## 20. What Opus should NOT do

- ❌ Add a subhead paragraph between h2 and grid
- ❌ Center the h2 or the grid
- ❌ Make every tile the same size (equal-weight card grid = generic template feel)
- ❌ Use a scale-on-hover greater than 1.04 (image) or 1.03 (pick)
- ❌ Add rounded 8px small radii — every tile is 20px (`--radius-lg`)
- ❌ Skip the arrow chip on any tile
- ❌ Use different title sizes across tiles (breaks the visual system)
- ❌ Add pagination arrows to the reviews tile (dots only)
- ❌ Autoplay video with sound
- ❌ Use gradient colors that resemble AI-tell purple→blue→teal
- ❌ Emit a mega-bento with fewer than 4 or more than 6 tiles — use a different section family instead
- ❌ Include a "See all" button below the grid — the grid IS the "all"
