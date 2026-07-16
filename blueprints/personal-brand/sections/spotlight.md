# SECTION — Spotlight (spotlight-cta-full-bleed)

> **Section family**: `spotlight-cta-full-bleed`
> **Used in**: personal-brand/home (position 6), personal-brand/masterclass (with CTA override)
> **Purpose**: single mid-page conversion spotlight — a full-bleed dark card with one headline, one lead, one CTA. The visual pause between content sections that shouts "if you take one action on this page, take THIS one."
> **Position on page**: mid-page, breaks up the light-heavy sections above with a dramatic dark card.

---

## 1. Section wrapper

```html
<section id="spotlight" data-section="spotlight-cta-full-bleed">
  <div class="spotlight-card spotlight-card--simple">
    <div data-griddistortion data-image="{spotlight.distortionImage}"
         class="spotlight-distortion"></div>
    <div class="spotlight-overlay"></div>
    <div class="spotlight-content spotlight-content--simple">
      <h2 class="spotlight-h2">{spotlight.heading}</h2>
      <p class="spotlight-lead">{spotlight.lead}</p>
      <a class="spotlight-btn" href="{spotlight.cta.href}">
        <span class="spotlight-video-icon"><!-- optional play icon --></span>
        {spotlight.cta.label}
      </a>
    </div>
  </div>
</section>
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-17)

| Property | Value | Notes |
|---|---|---|
| Section `padding` | `var(--section-pad) 24px` — typically `100px 24px` | 24px sides (NOT 40) — card bleeds closer to viewport edges |
| Section `padding-top` (when preceded by normal `.section`) | `0` | collapse doubled padding at the boundary |
| Section `background` | `transparent` or inherited | the card carries the visual weight |

**Why `padding: 100px 24px` (24 sides, not 40)**: the spotlight card is FULL-BLEED to the container. Sides at 24 (matching mobile gutter) makes the card feel closer to the viewport edge — more dramatic than the standard 40px container inset.

**Why collapse top padding after a normal section**: without collapse, the preceding section's `padding-bottom: 100` + this section's `padding-top: 100` = 200px gap. Feels like a page break. Collapsing to `padding-top: 0` restores the section rhythm.

---

## 2. Card — full-bleed 16:5 aspect ratio

The signature element. Landscape rectangle, dark, huge.

### CSS (verified from billfanter.com production)

```css
.spotlight-card {
  position: relative;
  width: 100%;
  margin: 0;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16 / 5;                   /* wide landscape — 3.2:1 */
  background: #0a0a0a;                    /* solid dark base */
  min-height: 360px;                      /* floor — never shorter than this on desktop */
  max-height: 480px;                      /* ceiling — never taller than this */
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04); /* one-pixel bottom hairline — subtle grounding */
}

.spotlight-card--simple {
  position: relative;
  display: flex;                          /* flex enables the content column below */
}

@media (max-width: 980px) {
  .spotlight-card {
    aspect-ratio: auto;                   /* drop the fixed ratio — 16:5 becomes 1100px tall at tablet width */
    min-height: 420px;                    /* raise floor slightly at tablet */
    max-height: none;                     /* let content drive height */
  }
}
```

**Why `aspect-ratio: 16/5`**: 16:5 is 3.2:1 — wider than a Full HD monitor. Signals "this is a cinematic banner, not a card." At 1180px wide container, gives ~370px tall card — dramatic without eating the viewport.

**Why `min: 360 / max: 480`**: floor + ceiling to hold the aspect ratio in check across viewport widths. At 1600px container, 16:5 would give 500px tall (too much); at 900px container, 16:5 gives 281px (too little). The bounds keep it feeling right.

**Why drop the ratio at 980px**: tablet widths break the aspect math. At 900px container width × 16:5 = 281px tall — too short for the content. And below tablet the content stacks/wraps, driving its own height. Letting height be content-driven at ≤980 avoids the "huge empty banner with a headline in the middle" bug.

**Why `border-radius: 12px`**: matches every other card radius on the site. Bigger radius (16-20) would feel too soft for a full-bleed dark card; smaller (6-8) would feel like a data widget.

---

## 3. Background layer — GridDistortion canvas (with fallback)

The signature visual. An interactive WebGL canvas that distorts a source image based on cursor proximity.

### HTML

```html
<div data-griddistortion
     data-image="{spotlight.distortionImage}"
     class="spotlight-distortion"></div>
```

### CSS

```css
.spotlight-distortion {
  position: absolute;
  inset: 0;
  z-index: 0;                             /* behind everything */
}
```

### Static image fallback (when GridDistortion JS isn't available)

```css
.spotlight-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 120%;                           /* 120% for parallax range */
  object-fit: cover;
  object-position: 80% center;            /* image is offset RIGHT — copy sits on darker LEFT */
  transform: translate3d(0, var(--parallax-y, 0px), 0);
  will-change: transform;
}
```

```html
<!-- Fallback if no JS grid distortion -->
<img class="spotlight-bg" src="{spotlight.distortionImage}"
     srcset="{spotlight.distortionImage}-1440.webp 1x, {spotlight.distortionImage} 2x"
     alt="" aria-hidden="true" />
```

**Why `object-position: 80% center` (right-shifted)**: the source image's subject (a distorted abstract) is intentionally chosen so its RIGHT side is visually busy and its LEFT side is naturally darker. Shifting the image RIGHT puts the busy area at the card's right edge (visual interest) and leaves the darker LEFT area behind the copy (legibility).

**Why 120% height + parallax**: subtle scroll parallax (JS-driven CSS variable `--parallax-y`) shifts the image up to 10px on scroll. Creates a "the card is a portal to something moving" feel without being obvious.

### Image content rules

- **Format**: WebP or AVIF, min 1600px wide
- **Content**: abstract, dark, textural — NEVER a photo of a person or product (the copy is the subject, the image is atmosphere)
- **Palette**: dark left half (for copy legibility) + brand-hue right half (for visual interest)
- **Reject**: gradients only (too flat), stock photos, illustrations with subjects
- **Fallback**: solid `#0a0a0a` if no image — the section still works without the distortion image

---

## 4. Overlay — legibility scrim over the image

Dark scrim ensures copy is readable on any image.

### CSS (verified from billfanter.com production)

```css
.spotlight-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;                             /* above image, below content */
  background: linear-gradient(
    90deg,
    rgba(10, 10, 10, 0.82) 0%,            /* fully-dark LEFT for headline */
    rgba(10, 10, 10, 0.65) 30%,
    rgba(10, 10, 10, 0.25) 55%,
    transparent 80%                       /* fade to zero RIGHT so image shows through */
  );
}

/* With interactive GridDistortion, the image left side is already dark — drop the overlay */
.spotlight:has(.spotlight-distortion) .spotlight-overlay {
  background: none;
}

/* Mobile: horizontal overlay flips to vertical (image bleeds full width, copy stacks at bottom) */
@media (max-width: 980px) {
  .spotlight-overlay {
    background: linear-gradient(
      180deg,
      transparent 30%,                    /* image visible at TOP */
      rgba(10, 10, 10, 0.55) 55%,
      rgba(10, 10, 10, 0.85) 100%         /* dark at BOTTOM behind copy */
    );
  }
}
```

**Why horizontal (90deg) on desktop, vertical (180deg) on mobile**: on desktop the layout is copy-LEFT + image-RIGHT. Horizontal scrim = dark left → transparent right respects that. On mobile the copy stacks at the BOTTOM of the card (below the image), so the scrim flips to dark-bottom.

**Why the overlay drops with interactive distortion**: the distortion image is authored with darkness baked in on the copy side. A second layer of scrim on top would blacken the whole card and defeat the interactive effect.

---

## 5. Content column — copy anchored to the CENTER-VERTICAL, LEFT

### HTML

```html
<div class="spotlight-content spotlight-content--simple">
  <h2 class="spotlight-h2" data-edit-id="spotlight.heading">
    {spotlight.heading}
  </h2>
  <p class="spotlight-lead" data-edit-id="spotlight.lead">
    {spotlight.lead}
  </p>
  <a class="spotlight-btn" href="{spotlight.cta.href}" data-edit-id="spotlight.cta">
    <span class="spotlight-video-icon">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2.5v11l9-5.5z"/>
      </svg>
    </span>
    {spotlight.cta.label}
  </a>
</div>
```

### Content column CSS (verified from billfanter.com production)

```css
.spotlight-content {
  position: relative;                     /* also has position:absolute in the older variant — --simple uses relative */
  z-index: 2;
}

.spotlight-content--simple {
  padding: clamp(40px, 6vw, 80px) clamp(24px, 4vw, 56px);
  max-width: 640px;                       /* caps the copy — doesn't fill full card width */
  display: flex;
  flex-direction: column;
  gap: 20px;                              /* 20 between h2, lead, and button */
  align-items: flex-start;                /* button lines up with h2 left edge */
  justify-content: center;                /* vertically centers copy in the card */
}

/* The content is centered on the container rail, not the card edge */
.spotlight-card--simple .spotlight-content--simple {
  max-width: var(--container, 1180px);
  margin: 0 auto;
  padding-left: 32px;
  padding-right: 32px;
  box-sizing: border-box;
  width: 100%;
}
```

**Why `padding: clamp(40px, 6vw, 80px) clamp(24px, 4vw, 56px)`**: fluid padding that scales with viewport. At 1600px viewport → 80px vertical / 56px horizontal (roomy). At 400px viewport → 40px vertical / 24px horizontal (tight). Never fixed-pixel because the card's height is dynamic.

**Why `justify-content: center` (vertical center inside the card)**: the card is 360-480px tall; the copy stack is ~200-260px. Vertical centering means equal empty space above the h2 and below the button — never top-heavy or bottom-anchored.

**Why the double `max-width` (640 first, then container)**: the OUTER wrapper is capped at container width (1180) so the copy aligns to the same rail as every other section on the page. The INNER content is capped at 640 so the h2 wraps at a readable width even inside that 1180 rail. Two-tier capping = alignment AND readability.

**Why `align-items: flex-start` (all content left-aligned)**: the h2, lead, and button all snap to the same left edge. Centering the button under the copy would feel dislocated from the h2 above.

### Pointer-events management (interactive distortion)

```css
.spotlight:has(.spotlight-distortion) .spotlight-overlay,
.spotlight:has(.spotlight-distortion) .spotlight-content {
  pointer-events: none;                   /* let mouse through to canvas */
}

.spotlight:has(.spotlight-distortion) .spotlight-btn {
  pointer-events: auto;                   /* keep the CTA clickable */
}
```

**Why**: the GridDistortion canvas needs mouse events to distort. If overlay + content capture the mouse, distortion never triggers. Set content to `pointer-events: none`, then re-enable ONLY the CTA (the only interactive element inside content).

---

## 6. Headline (h2)

### CSS (verified from billfanter.com production)

```css
.spotlight-h2 {
  font-family: 'Geist', sans-serif;
  font-size: clamp(28px, 3.4vw, 44px);    /* bigger than section h2 (24-36) but smaller than hero h1 (60-80) */
  line-height: 1.08;                      /* very tight — 44px @ 1.08 = 47.5px per line */
  font-weight: 500;
  letter-spacing: -0.028em;               /* tighter than -0.025 — mid-scale display type */
  color: #ffffff;
  margin: 0;
  max-width: 560px;                       /* extra cap ON TOP of content--simple max — h2 stays 2-3 lines */
}
```

**Why the h2 is BIGGER than a normal section h2**: this section is a spotlight — the CTA moment. Making the h2 taller than surrounding sections signals importance without making it hero-scale.

**Why `letter-spacing: -0.028em` (tighter than the -0.025 used elsewhere)**: at 44px, letters at default tracking feel loose. Tightening to -0.028em produces the crisp editorial-poster look.

**Why `max-width: 560px` on the h2 specifically**: the content column is 640 max; the h2 is capped tighter at 560 to force a 2-3 line wrap. A single-line h2 at 44px would sprawl 900px wide.

### Copy writing rules — headline

**Character count**: 30-70 characters
**Word count**: 6-12 words
**Structure**: verb-first invitation OR "[thing] you can [action]"
**Voice**: second-person, imperative
**Purpose**: the ONE thing you want the visitor to do, framed as their gain

### Good headlines

- ✓ "Learn options trading in my free demo webinar" (real BF — verb + specific what + qualifier)
- ✓ "Watch the free 60-minute masterclass"
- ✓ "Book your discovery call this week"
- ✓ "Download the HR playbook — free, no signup"

### Bad headlines

- ✗ "Get started today" (dead — generic, no what)
- ✗ "Take action now!" (exclamation, banned)
- ✗ "Discover our premium content" (banned words)
- ✗ "Ready to transform your business?" (banned "transform")

---

## 7. Lead (p)

### CSS (verified from billfanter.com production)

```css
.spotlight-lead {
  font-family: 'Geist', sans-serif;
  font-size: 16px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.85);       /* 85% white — deference to the h2 */
  margin: 0;
  max-width: 540px;                       /* even tighter than h2 max — lead wraps sooner */
}
```

**Why 85% white**: hero-scale copy is full white. Spotlight is mid-page; muting to 85% creates hierarchy under the pure-white h2. NOT so muted it becomes disclaimer text.

**Why `max-width: 540px` (tighter than h2's 560)**: lead paragraphs read better slightly narrower. Human eye scans a 40-50 character line best; 540 at 16px ≈ 55 chars — right on the boundary.

### Copy writing rules — lead

**Character count**: 100-220 characters
**Word count**: 18-35 words
**Structure**: 1-2 sentences describing WHO the offer is for + WHAT they'll learn/get
**Voice**: second-person, present tense
**Purpose**: qualify the audience + preview the value → reduces "is this for me" hesitation

### Good leads

- ✓ "Whether you are new to options or sharpening your skills, this free webinar shows how the options market works and how to place your first trade with a plan." (real BF — audience qualifier + specific promise)
- ✓ "For HR leaders navigating high-growth chaos. One session, one framework, one action plan you can present to your CEO on Monday." (audience + delivery format)

### Bad leads

- ✗ "Discover the future of trading." (banned + no what)
- ✗ "Sign up now to get exclusive access." (banned + form language)
- ✗ "Everyone can benefit from this webinar." (over-broad, no qualifier)

---

## 8. CTA — the button (two variants)

### Variant A — DEFAULT (solid white pill on dark)

The primary version. Solid white background, dark ink. Reads as the highest-intent action on the page.

### CSS (verified from billfanter.com production, default `.bf-page` variant)

```css
.spotlight-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;                              /* between icon and label */
  padding: 14px 26px;                     /* matches hero CTA — consistency */
  background: #ffffff;
  color: #0a0a0a;
  border-radius: 999px;                   /* pill */
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 16px;                        /* 16 here vs 15 on hero — this one is standalone/bigger */
  letter-spacing: -0.005em;
  text-decoration: none;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 6px;                        /* small bump above the button */
}

.spotlight-btn:hover {
  transform: translateY(-1px);
}

.spotlight-video-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;                            /* small circle */
  height: 26px;
  border-radius: 50%;
  background: var(--accent, #EF4444);     /* accent-color pop — the ONE accent moment in the section */
  color: #ffffff;
}

.spotlight-video-icon svg {
  width: 14px;
  height: 14px;
}
```

**Why solid white (not translucent)**: this button is THE spotlight action. Translucent glass would tie it to the card visually; solid white makes it visually SEPARATE — pops off the dark card as the only bright element.

**Why the accent-color inside the icon circle**: the ONE accent moment in this section. Every other pixel is white or dark. The tiny accent circle behind the play triangle catches the eye — hint of brand personality without dominating.

### Variant B — FROSTED GLASS (with interactive distortion background)

When the section uses the interactive `GridDistortion` canvas as its background, the button switches to a translucent frosted-glass style so it doesn't fight the animated background for visual weight.

### CSS (verified from Spotlight.astro scoped styles)

```css
/* Applied when card has .spotlight-distortion child */
.spotlight-btn {
  background: rgba(255, 255, 255, 0.16);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.42); /* uniform hairline — no rim-light gradient */
  color: #ffffff;
  transition: background 200ms ease, transform 200ms ease;
}

.spotlight-btn:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}

.spotlight-video-icon {
  color: #ffffff;
  background: transparent;                /* no accent pop in glass variant */
}
```

**Why the switch**: the animated distortion background is the visual star. A solid white pill would compete. Frosted glass sits on top of the distortion and reads as "part of the interactive surface."

### Icon rules

**When to include the play-triangle icon** (`ctaIcon: true`):
- CTA links to a video (masterclass preview, webinar recording, YouTube channel)

**When to skip the icon** (`ctaIcon: false`):
- CTA links to a form (booking, signup, download)
- CTA links to a page (pricing, contact)

### Copy writing rules — CTA label

**Character count**: 8-24 characters
**Word count**: 2-4 words
**Structure**: verb-first
**Voice**: direct, action-oriented

### Good CTA labels

- ✓ "Watch webinar" (real BF — 2 words, specific)
- ✓ "Book my seat"
- ✓ "Get the recording"
- ✓ "Start free trial"

### Bad CTA labels

- ✗ "Learn more" (dead)
- ✗ "Click here" (dead)
- ✗ "Sign up for our free webinar today!" (too long, exclamation)
- ✗ "Get started" (banned)

---

## 9. Content slot schema — what Opus emits

```typescript
type SpotlightContent = {
  heading: string;                        // 30-70 chars, verb-first
  lead: string;                           // 100-220 chars, audience-qualifier + promise
  cta: {
    label: string;                        // 8-24 chars, verb-first
    href: string;
  };
  ctaIcon: boolean;                       // true if CTA links to video
  distortionImage: string | null;         // URL to background image, null → solid dark fallback
  variant?: 'solid' | 'glass';            // default: 'glass' if distortionImage present, else 'solid'
};
```

## 10. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `distortionImage` | Solid `#0a0a0a` card + skip overlay (already dark) |
| `ctaIcon` | Default to `false` — no icon |
| `lead` | Render heading + CTA only, add 32px margin between them (feels intentional, not truncated) |
| `heading` | Never — required, error out |
| `cta.href` | Fall back to `#` and log warning |
| `cta.label` | Fall back to "Learn more" — but flag as generic; a real label is required for good conversion |

---

## 11. Complete assembled HTML (reference implementation)

### Solid variant (no distortion image)

```html
<section id="spotlight" data-section="spotlight-cta-full-bleed"
  style="padding: 100px 24px; padding-top: 0;">

  <div style="position: relative; width: 100%; margin: 0; border-radius: 12px;
              overflow: hidden; aspect-ratio: 16/5; background: #0a0a0a;
              min-height: 360px; max-height: 480px;
              box-shadow: 0 1px 0 rgba(0,0,0,0.04); display: flex;">

    <!-- Optional static bg image -->
    <img src="{spotlight.distortionImage}" alt="" aria-hidden="true"
      style="position: absolute; inset: 0; width: 100%; height: 120%;
             object-fit: cover; object-position: 80% center; z-index: 0;" />

    <!-- Legibility scrim -->
    <div style="position: absolute; inset: 0; z-index: 1;
                background: linear-gradient(90deg,
                  rgba(10,10,10,0.82) 0%,
                  rgba(10,10,10,0.65) 30%,
                  rgba(10,10,10,0.25) 55%,
                  transparent 80%);"></div>

    <!-- Content column — capped at container width for rail alignment -->
    <div style="position: relative; z-index: 2; max-width: 1180px;
                margin: 0 auto; padding: clamp(40px,6vw,80px) 32px;
                box-sizing: border-box; width: 100%;
                display: flex; flex-direction: column; gap: 20px;
                align-items: flex-start; justify-content: center;">

      <h2 data-edit-id="spotlight.heading"
        style="margin: 0; font-family: 'Geist', sans-serif;
               font-size: clamp(28px, 3.4vw, 44px); line-height: 1.08;
               font-weight: 500; letter-spacing: -0.028em; color: #fff;
               max-width: 560px;">
        {spotlight.heading}
      </h2>

      <p data-edit-id="spotlight.lead"
        style="margin: 0; font-family: 'Geist', sans-serif; font-size: 16px;
               line-height: 1.55; color: rgba(255,255,255,0.85);
               max-width: 540px;">
        {spotlight.lead}
      </p>

      <a href="{spotlight.cta.href}" data-edit-id="spotlight.cta"
        style="margin-top: 6px; display: inline-flex; align-items: center;
               gap: 10px; padding: 14px 26px; background: #fff; color: #0a0a0a;
               border-radius: 999px; font-family: 'Geist', sans-serif;
               font-weight: 600; font-size: 16px; letter-spacing: -0.005em;
               text-decoration: none;
               transition: transform 200ms cubic-bezier(.4,0,.2,1);">
        <!-- Icon (only if ctaIcon is true) -->
        <span style="display: inline-flex; align-items: center; justify-content: center;
                     width: 26px; height: 26px; border-radius: 50%;
                     background: var(--accent, #EF4444); color: #fff;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2.5v11l9-5.5z"/>
          </svg>
        </span>
        {spotlight.cta.label}
      </a>

    </div>
  </div>
</section>
```

### Glass variant (with interactive GridDistortion)

Same structure, but:
- Replace `<img class="spotlight-bg">` with `<div data-griddistortion data-image="…">`
- Drop the `<div>` overlay (or set its background to `none`)
- Change the button styles to the frosted-glass CSS in §8 Variant B
- Add pointer-events: none on overlay + content, pointer-events: auto on button

---

## 12. Interactive behaviors

- **Card as a whole**: NOT clickable — only the CTA is
- **GridDistortion canvas** (glass variant): distorts the source image based on cursor proximity, `data-return-duration` controls how quickly distortion snaps back
- **Parallax on scroll**: JS sets `--parallax-y` CSS variable based on scroll position → shifts the background image up to ~10px
- **Button hover**: lifts 1px, background brightens (solid → subtle; glass → 16% → 28%)
- **Button focus**: 2px outline in `var(--primary)` with 2px offset (from global DESIGN.md)
- **Reduced motion**: parallax disabled, hover transforms disabled, distortion static (no cursor reaction)

---

## 13. Responsive behavior

### Tablet (≤ 980px)

```css
@media (max-width: 980px) {
  .spotlight-card {
    aspect-ratio: auto;
    min-height: 420px;
    max-height: none;
  }
  .spotlight-overlay {
    background: linear-gradient(180deg,
      transparent 30%,
      rgba(10,10,10,0.55) 55%,
      rgba(10,10,10,0.85) 100%);
  }
}
```

Content stacks below the image visually. Overlay flips to vertical (dark bottom).

### Mobile (≤ 760px)

```css
@media (max-width: 760px) {
  .spotlight-content { padding: 32px 28px; }
  .spotlight-h2 { font-size: clamp(24px, 6vw, 32px); }
  .spotlight-lead { font-size: 15px; }
  .spotlight-btn { width: 100%; justify-content: center; }
}
```

CTA goes full-width — big tap target on mobile.

---

## 14. Accessibility checklist

- [x] `<h2>` inside a `<section>` — correct semantic order
- [x] Distortion / bg image `alt=""` + `aria-hidden="true"` — decorative
- [x] Overlay `aria-hidden="true"` — decorative scrim
- [x] CTA is `<a>` with `href` (not `<button>`) — navigates
- [x] Play icon inside CTA has no accessible text (button label carries meaning)
- [x] Focus ring on CTA: 2px outline `var(--primary)`, 2px offset
- [x] Color contrast: `#fff` on `rgba(10,10,10,0.82)` scrim = 15:1 (AAA)
- [x] Contrast on 85% white lead: `rgba(255,255,255,0.85)` on scrim = 12.4:1 (AAA)
- [x] `prefers-reduced-motion`: disable parallax, disable button transform, freeze distortion
- [x] Card is NOT wrapped in a link (only CTA is clickable)

## 15. Performance checklist

- [x] Background image WebP, min 1600w, `srcset` for 1x/2x
- [x] `loading="lazy"` on background image (mid-page section)
- [x] `will-change: transform` on `.spotlight-bg` — hints browser to composite
- [x] GridDistortion canvas is progressive enhancement (JS-only, fallback works without)
- [x] Overlay is CSS gradient (zero request cost)
- [x] Backdrop-filter on glass button is cheap (single element, small area)

## 16. Design token dependencies

```css
:root {
  --font-body: 'Geist', sans-serif;
  --accent: #hex;                          /* brand accent color for the video-icon circle */
  --primary: #hex;                         /* focus ring */
  --container: 1180px;
  --section-pad: 100px;
}
```

Hardcoded (structural):
- `#0a0a0a` (card bg)
- `#ffffff` (h2, button bg)
- `rgba(255,255,255,0.85)` (lead)
- `rgba(255,255,255,0.16)` and `rgba(255,255,255,0.42)` (glass variant)
- Overlay gradient stops

---

## 17. Rationale (why this section converts)

- **Full-bleed card in a padded section** = the card feels like a poster embedded in the page. Standard cards feel like content; this feels like an announcement.
- **16:5 aspect ratio (cinematic)** = signals "this is a hero moment, not a card." The dimensions alone signal importance.
- **Dark card on light page** = the visual pause. Every other section is white; this is dark. The break registers as "look here."
- **Single CTA** = one action, zero decision fatigue. Two CTAs here would dilute the spotlight.
- **h2 44px (bigger than section h2s, smaller than hero h1)** = mid-scale display type = "this is important but not the whole page's message."
- **Copy on LEFT, image visual on RIGHT** = classic editorial poster layout. Copy legibility never fights image content.
- **Vertical center inside the card** = equal empty space above and below the copy stack = feels balanced.
- **Solid white pill CTA (default variant)** = pops off the dark card. The button IS the visual anchor.
- **Accent-color inside the video-icon circle** = the ONE accent moment in the section. Restraint elsewhere lets this micro-detail hit.
- **Frosted-glass CTA (interactive variant)** = when the background is animated, glass CTA integrates with the interaction instead of blocking it.
- **Parallax on scroll** = subtle depth — 10px shift is enough to signal life, not enough to distract.
- **`padding-top: 0` after normal section** = restores rhythm at the boundary; without it the section reads as double-spaced.

---

## 18. What Opus should NOT do

- ❌ Add more than 1 CTA
- ❌ Use a rectangular button — pill only
- ❌ Center-align the copy inside the card
- ❌ Bump the h2 above 48px (crosses into hero-scale, competes with the actual hero above)
- ❌ Use a full-color photo of a person as the background image
- ❌ Skip the overlay scrim on a bright image (copy becomes unreadable)
- ❌ Use `aspect-ratio: 21/9` (too wide → card becomes a stripe, loses card feel)
- ❌ Use `aspect-ratio: 1/1` (square → competes with card grids elsewhere; not a spotlight anymore)
- ❌ Set `padding: 100px 40px` (needs 24px sides for the near-bleed feel)
- ❌ Emit both a distortion canvas AND a static overlay (they compete)
- ❌ Use hover scale >1.02 anywhere
- ❌ Add an eyebrow above the h2 (banned this section)
- ❌ Use rgba text below 80% opacity (readability + accent scattering)
- ❌ Add "as seen in" logo strip below the CTA
- ❌ Include a testimonial quote inside the spotlight card (that's a different section family — `spotlight-with-quote-inset`)
