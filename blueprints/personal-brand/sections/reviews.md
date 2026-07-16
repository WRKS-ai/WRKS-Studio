# SECTION — Reviews (reviews-video-plus-wall)

> **Section family**: `reviews-video-plus-wall`
> **Used in**: personal-brand/home (position 8), personal-brand/masterclass (with `showCta: false`), personal-brand/lead-magnet
> **Purpose**: heavyweight social-proof block. Three video testimonials on top + LinkedIn-style screenshot wall below. Not written testimonials in a carousel (that's `reviews-carousel`); this is video FACE + real screenshots of real people posting about the brand.
> **Position on page**: near the bottom of the page, after HeroSplit. The dedicated proof section — the last major beat before the founder story closer.

---

## 1. Section wrapper

```html
<section id="reviews" data-section="reviews-video-plus-wall">
  <div class="container">
    <div class="reviews-header is-center">
      <span class="eyebrow">{reviews.eyebrow}</span>
      <h2>{reviews.heading}</h2>
    </div>
    <div class="reviews-videos">…</div>
    <div class="reviews-wall">…</div>
    <div class="reviews-cta-wrap">…</div>
  </div>
</section>
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-17)

| Property | Value | Notes |
|---|---|---|
| Section `background` | `var(--bg-2)` — flat neutral grey (e.g. `#f1f5fb` or brand-derived) | changes from Community's white — signals a distinct section |
| Section `padding` | `var(--section-pad) 0` = **`100px 0`** | zero sides on the section itself; container inside handles horizontal padding |
| Container `max-width` | `1180px` | |
| Container horizontal padding | `40px` desktop / `24px` mobile |

**Why bg is neutral grey, not white**: this section carries the most visual content (3 videos + up to 20 screenshots). A grey bg makes the white/pale screenshots pop as content. On a pure-white bg, the screenshots would visually merge with the section — no boundary between "the page" and "the screenshots."

**Why `padding: 100px 0` (zero sides)**: unlike Watchlist / Community which handle horizontal padding on the section wrapper, this section pushes horizontal padding down to the container. Reason: the screenshot wall on mobile spans slightly past the container gutter for visual immersion, and 0 side padding on the section keeps that door open.

---

## 2. Section header

Centered header, WITH eyebrow. This is a proof section — the eyebrow is functional (naming the type of proof).

### HTML

```html
<div class="reviews-header is-center">
  <span class="eyebrow" data-edit-id="reviews.eyebrow">
    {reviews.eyebrow}
  </span>
  <h2 data-edit-id="reviews.heading">
    {reviews.heading}
  </h2>
</div>
```

### CSS (matches section-header pattern from community.md)

```css
.reviews-header {
  max-width: 720px;
  margin: 0 auto 40px;                    /* 40 to first content block (videos) — tighter than community's 56 */
  text-align: center;
}

.reviews-header .eyebrow {
  display: inline-block;
  margin-bottom: 24px;                    /* 24 to h2 */
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted, #565656);      /* muted eyebrow — NOT accent */
}

.reviews-header h2 {
  font-family: 'Geist', sans-serif;
  font-size: clamp(24px, 2.6vw, 36px);
  line-height: 1.1;
  letter-spacing: -0.025em;
  font-weight: 500;
  color: var(--text, #0a0a0a);
  margin: 0;
}
```

### Copy writing rules — eyebrow

**Character count**: 12-25 characters
**Word count**: 2-3 words
**Structure**: names the type of social proof

- ✓ "Student reviews" (real BF)
- ✓ "Client stories"
- ✓ "Customer results"
- ✗ "Testimonials" (dead — corporate label)

### Copy writing rules — heading

**Character count**: 40-90 characters
**Word count**: 8-15 words
**Structure**: describes WHO is talking + WHAT they got
**Voice**: third-person, present tense

### Good headings

- ✓ "Hear success stories from real options traders learning with Bill" (real BF — WHO + WHAT)
- ✓ "See what senior HR leaders say after 6 months in the community"
- ✓ "Real reviews from indie founders shipping with the framework"

### Bad headings

- ✗ "Testimonials" (dead)
- ✗ "What our clients are saying" (dead + "our" is corporate)
- ✗ "Amazing results from our customers" (banned)

---

## 3. Video grid — 3 videos, top row

Three widescreen testimonial video cards. Click-to-play (opens Vimeo lightbox), no autoplay.

### HTML

```html
<div class="reviews-videos">
  <article class="reviews-vidcard" data-vimeo="{videoId}">
    <button class="reviews-vidthumb"
            type="button"
            data-vimeo="{videoId}"
            data-wide
            aria-label="Play student testimonial">
      <img src="https://vumbnail.com/{videoId}.jpg"
           loading="lazy"
           alt=""
           onerror="this.style.display='none'" />
      <span class="reviews-vidplay" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" fill="currentColor"/>
        </svg>
      </span>
    </button>
  </article>
  <!-- 2 more articles -->
</div>
```

### Grid CSS (verified from billfanter.com production)

```css
.reviews-videos {
  margin-top: 48px;                       /* 48 from header — larger than typical to signal "primary content starts here" */
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;                              /* 20 — sits between MegaBento (16) and Community (24) */
}
```

### Video card CSS (verified from billfanter.com production)

```css
.reviews-vidcard {
  border-radius: 12px;
  overflow: hidden;
  background: #0a0a0a;                    /* dark bg — no flash before poster loads */
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 12px 30px rgba(20, 60, 120, 0.08);  /* cool-tinted lift shadow */
}
```

### Video thumb button CSS

```css
.reviews-vidthumb {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;                   /* widescreen — matches lightbox player format */
  border: 0;
  margin: 0;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  /* Fallback gradient BEHIND the poster image (shows while img loads OR if 404) */
  background: linear-gradient(
    135deg,
    #0b1f5c 0%,
    #1754d8 55%,
    #3b82f6 100%
  );
}

.reviews-vidthumb img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Bottom scrim — makes the play button pop over any poster */
.reviews-vidthumb::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%);
  pointer-events: none;
}
```

**Why 16:9 (widescreen)**: matches the aspect ratio of the Vimeo lightbox player. Poster 16:9 → click → lightbox opens 16:9 → no jarring resize.

**Why a gradient behind the img**: `https://vumbnail.com/{videoId}.jpg` occasionally 404s. Without a background fallback, the card renders as pure black `#0a0a0a`. The 3-color gradient (matches Watchlist's "professional" gradient family) means even a missing poster reads as intentional design.

**Why `onerror` inline on img**: hides the broken img element if the vumbnail 404s → the gradient shows through. `onerror="this.style.display='none'"` is the smallest possible inline fix.

### Play button CSS (verified from billfanter.com production)

```css
.reviews-vidplay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64px;                            /* 64 — large, obvious tap target */
  height: 64px;
  border-radius: 50%;
  background: #ffffff;
  color: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1;
}

.reviews-vidplay svg {
  width: 26px;
  height: 26px;
  margin-left: 3px;                       /* 3px right nudge — optical center of the play triangle */
}

.reviews-vidthumb:hover .reviews-vidplay {
  transform: translate(-50%, -50%) scale(1.08);   /* 1.08 — the ONE allowed scale exception, for video poster CTAs */
}

/* Playing state (JS sets .is-playing when Vimeo iframe injects) */
.reviews-vidthumb.is-playing img,
.reviews-vidthumb.is-playing::after,
.reviews-vidthumb.is-playing .reviews-vidplay { display: none; }
```

**Why 64px play button (bigger than usual)**: this button is the section's primary interaction. Videos are the highest-value social proof unit. Bigger = "click me" without needing a text label.

**Why `scale(1.08)` allowed here (DESIGN.md bans >1.02)**: video poster play buttons are a documented exception. The scale spring `cubic-bezier(.34, 1.56, .64, 1)` is a mild overshoot (springs slightly past 1.08 then settles). Feels like a physical button pressing.

**Why `margin-left: 3px` on the SVG**: the play triangle's geometric center sits ~2-3px LEFT of its bounding box center. Nudging the SVG right compensates for the optical illusion. Without it, the triangle looks slightly left-of-center in the circle.

### Playing state

When user clicks the thumb, JavaScript:
1. Injects a Vimeo `<iframe>` into the card
2. Adds `.is-playing` class to the thumb → hides poster img + scrim + play button
3. Iframe autoplays with controls visible

(This is a shared lightbox script wired at layout level, not per-section.)

### Content rules — videos

- **Count**: exactly 3 (fewer = looks empty; more = fights the screenshot wall below)
- **Length**: 30-90 seconds each ideal
- **Aspect**: hosted at 16:9 (any orientation works because poster crops, but 16:9 avoids letterboxing)
- **Content**: real customers on camera, talking directly, unscripted-feeling
- **Vimeo IDs**: numeric ID from Vimeo URL — the `data-vimeo` attribute drives the lightbox
- **Poster fallback**: `https://vumbnail.com/{id}.jpg` (auto-generated by Vumbnail service)
- **If <3 videos available**: fall back to `reviews-quote-band` section family (written testimonial band)

---

## 4. Screenshot wall — masonry below

CSS-columns masonry of LinkedIn/Twitter/testimonial screenshots. Real posts, real handles, real activity.

### HTML

```html
<div class="reviews-wall">
  <img class="reviews-shot"
       src="/assets/reviews/{filename1}.webp"
       alt="LinkedIn review screenshot"
       loading="lazy" />
  <img class="reviews-shot"
       src="/assets/reviews/{filename2}.webp"
       alt="LinkedIn review screenshot"
       loading="lazy" />
  <!-- repeat for each screenshot, 6-20 total -->
</div>
```

### Wall CSS (verified from billfanter.com production)

```css
.reviews-wall {
  margin-top: 56px;                       /* 56 from video grid — larger than internal rhythm */
  column-count: 2;                        /* 2 masonry columns — NOT 3 or 4 */
  column-gap: 20px;                       /* matches video grid gap */
}

.reviews-shot {
  width: 100%;
  margin: 0 0 20px;                       /* 20 between shots vertically — matches column gap */
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 10px 26px rgba(20, 60, 120, 0.07);  /* cool-tinted shadow — matches video cards */
  break-inside: avoid;                    /* CRITICAL — prevents screenshots being sliced across columns */
  display: block;
}

@media (max-width: 767px) {
  .reviews-wall { column-count: 1; }      /* single column on mobile */
}
```

**Why `column-count: 2` (not 3)**: 3 columns produces skinny screenshots — LinkedIn posts become unreadable. 2 columns gives each shot enough width to keep post text legible at natural size.

**Why CSS columns (not grid)**: masonry. Screenshots have varying natural heights (short reactions vs. long posts). CSS columns pack them naturally by column-flow, giving that "Pinterest wall" feel without needing a JS masonry library. Grid would require specifying row heights or using `grid-auto-rows: masonry` (still experimental).

**Why `break-inside: avoid`**: prevents a screenshot from being cut in half across column boundaries. Without it, mid-screenshot slicing looks broken.

**Why 12px radius (matching cards elsewhere)**: consistency. Same radius across every framed element = one visual system.

### Screenshot content rules

- **Count**: 6-20 screenshots (Bill-Fanter ships 20)
- **Source**: real screenshots — LinkedIn, Twitter/X, Facebook, testimonial forms, private message screenshots (with permission)
- **Format**: WebP, min 400px wide (so 2-col masonry gives ~200-260px per shot)
- **Consistency**: all screenshots from the SAME platform look best (all LinkedIn, all Twitter) — mixed platforms fight for visual attention
- **PII**: obscure phone numbers, email addresses, DM contents. Names + roles + profile pics stay (they're proof)
- **Aspect variance**: LEAVE the natural variance — that's what makes it a wall, not a grid. Short reactions + long posts + question threads all mixed = authentic

### Fallback: fewer than 6 screenshots

If the brand has <6 screenshots, drop the wall entirely and use just the video grid. A 3-screenshot wall looks incomplete.

---

## 5. CTA — bottom, centered, optional

Show only on the homepage (`showCta: true`). Hide on landing pages where you don't want visitors leaving (`showCta: false`).

### HTML

```html
<div class="reviews-cta-wrap">
  <a class="btn btn-primary" href="{reviews.cta.href}" data-edit-id="reviews.cta">
    {reviews.cta.label}
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-left: 8px;">
      <path d="M3 8h10m-4-4 4 4-4 4"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </a>
</div>
```

### CSS (verified from billfanter.com production)

```css
.reviews-cta-wrap {
  display: flex;
  justify-content: center;                /* centered under section */
  margin-top: 56px;                       /* 56 from wall */
}

.reviews-cta-wrap .btn {
  display: inline-flex;
  align-items: center;
  width: auto;                            /* NOT full-width — pill hugs content */
}

@media (max-width: 767px) {
  .reviews-cta-wrap { margin-top: 28px; } /* tighter on mobile */
}
```

Button reuses the primary CTA styling ([community.md §6](./community.md)) — `padding: 14 24`, pill, `#0a0a0a` bg, white ink.

**Why centered under the wall (not left-aligned like Community CTA)**: Community CTA anchors to its column (benefits column, left-aligned inside). Reviews wall is full-width; centered CTA is the natural point of gravity below.

### CTA label rules

- **Character count**: 12-24
- **Verb-first**
- ✓ "See all reviews" (real BF)
- ✓ "Read every review"
- ✓ "View the case studies"
- ✗ "Learn more" (dead)
- ✗ "Read more" (dead)

---

## 6. Content slot schema — what Opus emits

```typescript
type ReviewsContent = {
  eyebrow: string;                        // 12-25 chars, 2-3 words
  heading: string;                        // 40-90 chars, WHO + WHAT
  videoVimeoIds: string[];                // exactly 3 numeric Vimeo IDs
  screenshots: string[];                  // 6-20 filenames (relative to /assets/reviews/)
  cta: {
    label: string;                        // 12-24 chars, verb-first
    href: string;
  };
  showCta?: boolean;                      // default true
};
```

## 7. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `videoVimeoIds` has <3 items | Skip video grid, promote screenshot wall to top |
| `videoVimeoIds` has 0 items AND `screenshots` has <6 | Skip section entirely; use `reviews-quote-band` (single quote row) instead |
| `screenshots` has <6 items | Show video grid only; skip wall |
| `cta` missing | Set `showCta: false` — no CTA |
| `eyebrow` missing | Show heading only |
| Vumbnail poster 404 | Falls back to the CSS gradient (already in place via `onerror`) |
| `heading` missing | Never — required, error out |

---

## 8. Complete assembled HTML (reference implementation)

```html
<section id="reviews" data-section="reviews-video-plus-wall"
  style="background: var(--bg-2, #f1f5fb); padding: 100px 0;">

  <div style="max-width: 1180px; margin: 0 auto; padding: 0 40px;">

    <!-- Centered header with eyebrow + h2 -->
    <div style="max-width: 720px; margin: 0 auto 40px; text-align: center;">
      <span data-edit-id="reviews.eyebrow"
        style="display: inline-block; margin-bottom: 24px;
               font-family: var(--font-mono); font-size: 11.5px; font-weight: 500;
               letter-spacing: 0.14em; text-transform: uppercase;
               color: var(--text-muted, #565656);">
        {reviews.eyebrow}
      </span>
      <h2 data-edit-id="reviews.heading"
        style="margin: 0; font-family: 'Geist', sans-serif;
               font-size: clamp(24px, 2.6vw, 36px); line-height: 1.1;
               letter-spacing: -0.025em; font-weight: 500;
               color: var(--text, #0a0a0a);">
        {reviews.heading}
      </h2>
    </div>

    <!-- 3 videos — 16:9 posters, click-to-play lightbox -->
    <div style="margin-top: 48px; display: grid;
                grid-template-columns: repeat(3, 1fr); gap: 20px;">
      <article style="border-radius: 12px; overflow: hidden; background: #0a0a0a;
                       box-shadow: 0 1px 3px rgba(0,0,0,0.06),
                                   0 12px 30px rgba(20,60,120,0.08);">
        <button type="button" data-vimeo="{reviews.videoVimeoIds.0}" data-wide
          aria-label="Play student testimonial"
          style="all: unset; cursor: pointer; position: relative; display: block;
                 width: 100%; aspect-ratio: 16/9; overflow: hidden;
                 background: linear-gradient(135deg, #0b1f5c 0%, #1754d8 55%, #3b82f6 100%);">
          <img src="https://vumbnail.com/{reviews.videoVimeoIds.0}.jpg"
            loading="lazy" alt="" onerror="this.style.display='none'"
            style="position: absolute; inset: 0; width: 100%; height: 100%;
                   object-fit: cover; display: block;" />
          <span aria-hidden="true"
            style="position: absolute; inset: 0; pointer-events: none;
                   background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%);"></span>
          <span aria-hidden="true"
            style="position: absolute; top: 50%; left: 50%;
                   transform: translate(-50%, -50%); z-index: 1;
                   width: 64px; height: 64px; border-radius: 50%;
                   background: #fff; color: #0a0a0a;
                   display: flex; align-items: center; justify-content: center;
                   box-shadow: 0 6px 24px rgba(0,0,0,0.35);">
            <svg viewBox="0 0 24 24" style="width: 26px; height: 26px; margin-left: 3px;">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
          </span>
        </button>
      </article>
      <!-- Video cards 2 and 3: same structure -->
    </div>

    <!-- Screenshot wall — CSS masonry, 2 columns -->
    <div style="margin-top: 56px; column-count: 2; column-gap: 20px;">
      <img src="/assets/reviews/{reviews.screenshots.0}" alt="LinkedIn review screenshot"
        loading="lazy"
        style="width: 100%; margin: 0 0 20px; border-radius: 12px;
               box-shadow: 0 1px 3px rgba(0,0,0,0.05),
                           0 10px 26px rgba(20,60,120,0.07);
               break-inside: avoid; display: block;" />
      <!-- Repeat for each screenshot -->
    </div>

    <!-- CTA — centered pill (optional based on showCta) -->
    <div style="display: flex; justify-content: center; margin-top: 56px;">
      <a href="{reviews.cta.href}" data-edit-id="reviews.cta"
        style="display: inline-flex; align-items: center; padding: 14px 24px;
               border-radius: 999px; background: #0a0a0a; color: #fff;
               font-family: 'Geist', sans-serif; font-size: 16px; font-weight: 600;
               letter-spacing: -0.005em; text-decoration: none; width: auto;">
        {reviews.cta.label}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          style="margin-left: 8px;">
          <path d="M3 8h10m-4-4 4 4-4 4"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>
  </div>
</section>
```

---

## 9. Interactive behaviors

- **Video click**: opens Vimeo lightbox modal (globally wired via `data-vimeo` attribute at layout level)
- **Video hover**: play button `scale(1.08)` (the one allowed exception to scale-hover ban)
- **CTA hover**: 1px lift, bg brightens `#0a0a0a → #1a1a1a`
- **Screenshot hover**: NONE (they're proof images, not links — no false-affordance signals)
- **prefers-reduced-motion**: disable play button scale, disable button lift

### Lightbox behavior (shared script, referenced not defined here)

- Click thumbnail → lightbox modal opens
- Modal contains autoplaying (unmuted, controls-visible) Vimeo iframe
- Backdrop click OR escape key closes modal
- Focus trap while modal open (keyboard-navigable)
- Body scroll locked while modal open

---

## 10. Responsive behavior

### Tablet (≤ 900px)

```css
@media (max-width: 900px) {
  .reviews-videos {
    grid-template-columns: 1fr;
    max-width: 480px;                     /* cap width so single-col video isn't oversized */
    margin-left: auto;
    margin-right: auto;
  }
}
```

Single-column videos, capped at 480px width so each 16:9 poster is a reasonable ~270px tall (not a wall-filling billboard).

### Mobile-specific tweaks (≤ 767px)

```css
@media (max-width: 767px) {
  .reviews-videos { margin-top: 0; }     /* drop 48 — header's 40 handles the gap */
  .reviews-wall { column-count: 1; }     /* single-column wall */
  .reviews-cta-wrap { margin-top: 28px; } /* tighter to wall */
}
```

### Phone (≤ 600px)

```css
@media (max-width: 600px) {
  .reviews-videos { max-width: none; }   /* unclamp — videos span full container width */
}
```

---

## 11. Accessibility checklist

- [x] Video buttons have `aria-label="Play student testimonial"` — thumbnail is not the only affordance
- [x] Play icon overlay `aria-hidden="true"` — button label carries meaning
- [x] Video thumb images have `alt=""` — decorative (button label describes the action)
- [x] Screenshot images have `alt="LinkedIn review screenshot"` (or platform-appropriate) — informative
- [x] Screenshot alt should describe TYPE of proof, NOT quote the text (would double-narrate for screen readers)
- [x] Focus states on video buttons: 2px outline `var(--primary)` with 2px offset
- [x] Focus states on screenshots: none (they're not interactive — no focus needed)
- [x] Color contrast on play button (dark ink on white): 20:1 (AAA)
- [x] Lightbox modal: focus-trap, escape-to-close, backdrop-click-to-close (from shared lightbox script)
- [x] `prefers-reduced-motion`: freeze play button scale animation

## 12. Performance checklist

- [x] Video posters via Vumbnail (auto-generated, no manual asset step)
- [x] Poster fallback: CSS gradient shows if 404 (no broken-image icon)
- [x] Every image `loading="lazy"` (this is section 8, well below fold)
- [x] Vimeo iframe injected on click only (never loaded on page render)
- [x] CSS masonry (columns) — zero JS
- [x] No custom fonts loaded here
- [x] Screenshot images should be WebP with 400-800px widths (masonry column is ~260px)

## 13. Design token dependencies

```css
:root {
  --font-body: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
  --text: #0a0a0a;
  --text-muted: #565656;
  --bg-2: #f1f5fb;                        /* neutral grey band bg — brand-derivable */
  --primary: #hex;                        /* focus ring only */
  --container: 1180px;
}
```

Hardcoded (structural):
- `#0a0a0a` (video card bg, CTA bg, play button ink)
- `#ffffff` (play button bg, CTA ink)
- Poster gradient stops `#0b1f5c → #1754d8 → #3b82f6` (deep-blue palette — matches "professional" voice_descriptor)
- Cool-tinted shadows `rgba(20, 60, 120, 0.07-0.08)`

---

## 14. Rationale (why this section converts)

- **Videos ON TOP, screenshots BELOW** = video is highest-fidelity proof (face + voice + emotion). Screenshots are volume proof (many people, real posts). Video first captures attention; screenshots second reinforce with density.
- **3 videos (not 4 or 6)** = a triptych. Two feels sparse; four+ becomes a wall (competing with the actual wall below). Three is the classic proof unit.
- **16:9 widescreen posters** = matches lightbox player format. No jarring resize on click.
- **Vumbnail.com posters** = zero manual asset production. Video ID in, poster URL out. Reduces friction from "add a testimonial video" to "paste Vimeo ID."
- **64px play button (larger than usual)** = the section's primary interaction is this button. Size = affordance.
- **1.08 scale hover on play button (the exception)** = video posters use physical button feedback (scale + spring). Reserving this animation just for video CTAs makes it feel intentional across the site.
- **Optical center nudge (`margin-left: 3px` on triangle)** = geometric detail. Without it, the triangle looks left-of-center in the circle. This detail is what separates "we care" from "we shipped."
- **CSS masonry wall (columns, not grid)** = variable-height screenshots pack naturally. Grid would force uniform heights, killing the "real wall of real posts" feel.
- **`break-inside: avoid` on screenshots** = the ONE line that makes CSS masonry actually work. Without it, screenshots slice across column boundaries.
- **Neutral grey section bg** = white screenshots don't disappear into a white section. Grey creates the container the screenshots live in.
- **CTA hidden on landing pages (`showCta: false`)** = social proof exists to convert visitors on the page they're on. Sending them to /reviews mid-conversion is a leak. Landing pages hide the CTA; the homepage shows it (since the homepage is the top of the funnel).
- **Muted eyebrow (not accent)** = proof sections carry weight through the CONTENT, not the chrome. Accent eyebrow would be dressing on proof that doesn't need it.

---

## 15. What Opus should NOT do

- ❌ Use 4 or 6 videos (must be 3)
- ❌ Use vertical/portrait videos (must be 16:9 landscape)
- ❌ Autoplay the videos (click-to-play only — respects user attention)
- ❌ Add sound to autoplaying background (would be the second AI-tell in the page)
- ❌ Use stock testimonial videos (must be real customers on camera)
- ❌ Use 3-column screenshot wall (columns become too skinny — LinkedIn text unreadable)
- ❌ Convert masonry to a fixed grid (kills the wall-of-posts feel)
- ❌ Omit `break-inside: avoid` on screenshot images (screenshots will slice)
- ❌ Add scale-on-hover to screenshots (they're proof, not links)
- ❌ Add captions ON the screenshots (screenshots already contain their own text)
- ❌ Use `col-count: 4` even at wider desktop (2 is the max — 3 loses readability)
- ❌ Show a "See all reviews" CTA on a landing page (leaks the visitor)
- ❌ Use accent color on the play button (must be neutral #0a0a0a on white)
- ❌ Use rounded 999 (pill) on video cards (must be 12px card radius)
- ❌ Add a "star rating average" widget above the heading (that's `reviews-quote-band` territory)
- ❌ Add a filter/tag UI to the wall (proof grid = flat, unranked — filtering it undermines the "everyone loves it" signal)
