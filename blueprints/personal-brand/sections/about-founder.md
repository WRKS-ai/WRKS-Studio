# SECTION — AboutFounder (long-form-founder-split)

> **Section family**: `long-form-founder-split`
> **Used in**: personal-brand/home (position 10 — final content section), personal-brand/about (as page hero variant)
> **Purpose**: the founder story. Long-form biographical copy paired with a portrait + signature — the emotional close before the page transitions to footer. This is the "who's the human behind this?" answer that every trust-building page needs.
> **Position on page**: LAST content section, immediately before the footer. This is where the reader either commits to the founder as a person or bounces.

---

## 1. Section wrapper

```html
<section id="about-founder" data-section="long-form-founder-split">
  <div class="container">
    <div class="about-grid">
      <div class="about-media">…</div>
      <div class="about-copy">…</div>
    </div>
  </div>
</section>
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-17)

| Property | Value | Notes |
|---|---|---|
| Section `background` | `#ffffff` | white — quiet reading environment for the long story |
| Section `padding-top` | `100px` | standard rhythm |
| Section `padding-bottom` | `100px` | this is the LAST section before footer — owns the bottom breathing room; footer adds none |
| Container `max-width` | `1180px` | |
| Container horizontal padding | `40px` desktop / `24px` mobile |

**Why 100px bottom padding (not 0)**: unlike Spotlight which collapses padding, this section OWNS the bottom breathing room before the footer. The footer no longer adds outer spacing of its own, so this section must give the eye a clean rest before dark territory below.

---

## 2. Two-column grid — media LEFT + copy RIGHT

Same 50/50 grid as HeroSplit, but SWAPPED: HeroSplit has media LEFT via `order`, this has media LEFT natively.

### CSS (verified from billfanter.com production)

```css
.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;         /* 50/50 exactly — canonical */
  gap: 48px;                              /* matches HeroSplit + Community */
  align-items: center;                    /* vertical center */
}

.about-copy {
  padding-left: 48px;                     /* 48 inset — copy sits farther from gap */
  max-width: 588px;                       /* caps reading width — even at wide viewports */
}

@media (max-width: 980px) {
  .about-grid {
    grid-template-columns: 1fr;           /* stack */
    gap: 28px;                            /* tighter than desktop's 48 — story wants proximity */
  }
  .about-copy {
    padding-left: 0;
    max-width: none;
  }
}
```

**Why `align-items: center`**: the photo is 480px tall (fixed). The copy is variable — 3 short paragraphs (~200px) up to 6 long paragraphs (~600px). Centering means whichever is taller drives the row height and the shorter one balances to midline. Top-aligning would leave one column floating.

**Why 48px `padding-left` on copy (matching HeroSplit + Community pattern)**: this is the canonical text+image split. Any section using this pattern gets the 48px inset — consistency across pages.

**Why `max-width: 588` (unusual — not the 560/560/540 pattern)**: this is a LONG-FORM copy section. 588px ≈ 65-70 chars per line, which is the optimal reading width for multi-paragraph body. Shorter forces too-frequent line breaks in a story format; longer strains reading rhythm.

**Why 28px gap on mobile stack (tighter than 40)**: the story feels intimate — the founder photo and their words shouldn't feel like separate elements when stacked. 28px is close enough that they read as one continuous introduction.

---

## 3. Media column — LEFT (portrait + signature overlay)

The founder portrait. Not a headshot in a card — a large full-height portrait framed like an editorial magazine spread.

### HTML

```html
<div class="about-media">
  <img src="{about.photo.src}"
       srcset="{about.photo.src}-720.webp 1x, {about.photo.src} 2x"
       alt="{about.photo.alt}"
       loading="lazy" />
  <!-- Optional signature overlay -->
  <svg class="about-sig" viewBox="0 0 240 80" fill="none">
    <!-- founder's signature as SVG paths — see §4 -->
  </svg>
</div>
```

### Media wrapper CSS (verified from billfanter.com production)

```css
.about-media {
  position: relative;                     /* anchor for signature overlay */
}

.about-media img {
  width: 100%;
  height: 480px;                          /* FIXED height — 480px on desktop */
  object-fit: cover;                      /* crop to fill */
  object-position: center 18%;            /* top-weighted crop — keeps face in view */
  border-radius: var(--radius-lg, 20px);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 20px 44px -20px rgba(0, 0, 0, 0.15); /* subtle lift shadow */
  border: 1px solid var(--border, rgba(10, 10, 10, 0.08));
}

@media (max-width: 980px) {
  .about-media img {
    height: 320px;                        /* shrink to 320 on stacked mobile */
  }
}
```

**Why fixed 480px height (not aspect ratio)**: the founder portrait may be any aspect (square selfie, portrait phone shot, landscape studio photo). Fixed pixel height + object-fit-cover normalizes them all to the same visual weight. Aspect ratio would let a landscape photo become short-and-wide while a portrait becomes tall-and-narrow — inconsistent.

**Why `object-position: center 18%` (top-weighted)**: portraits crop face-out at default `center center`. 18% top-bias means the face stays visible even when the crop is aggressive. If the founder's face is at 30% from top of source photo, 18% object-position keeps it centered vertically in the frame.

**Why the 1px border**: on light backgrounds, a shadowless photo edge disappears into the page. A subtle 1px border (rgba 0.08) defines the boundary without visual heaviness.

**Why radius `var(--radius-lg)` (20px) not 12**: this photo is LARGER than any other framed image on the page (video cards, screenshots). Larger elements can carry larger radii without feeling soft. 12px on a 480px-tall photo would look pinched.

### Photo content rules

- **Composition**: founder alone, looking at camera OR looking off-camera in candid pose. NEVER a group photo (this is the founder, not the team).
- **Framing**: waist-up or headshot. Full-body reads too corporate.
- **Environment**: at their workspace, in their element, in a natural setting. NOT a studio white-background headshot (feels stock/LinkedIn).
- **Format**: WebP or AVIF, min 800px wide, portrait or square preferred (landscape crops face-out at 480px height)
- **Alt**: founder's name only — `alt="Bill Fanter"` — the photo IS meaningful; alt="" would be wrong

---

## 4. Signature overlay (optional but recommended)

Founder's handwritten signature, overlaid at the bottom-right of the photo. Signals a personal endorsement of the words to the right.

### HTML

```html
<svg class="about-sig" viewBox="0 0 240 80" fill="none">
  <path d="M{signature paths}"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none" />
</svg>
```

### CSS (verified from billfanter.com production)

```css
.about-sig {
  position: absolute;
  right: 18px;                            /* 18px from right edge of photo */
  bottom: 16px;                           /* 16px from bottom edge */
  width: 150px;                           /* natural width — signature scales with viewBox */
  max-width: 44%;                         /* on narrow viewports, cap at 44% of photo width */
  color: #0a0a0a;                         /* dark ink — currentColor drives stroke */
  filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.55)); /* white outline glow — lifts sig off any bg */
}
```

**Why the drop-shadow is WHITE (not dark)**: the photo background is unpredictable — could be dark, light, or mid-tone at the bottom-right where the sig lives. A white drop-shadow at 55% opacity creates a subtle halo around the dark ink signature, making it legible over ANY photo background.

**Why bottom-right (not bottom-left or center)**: signatures traditionally sit bottom-right in Western reading direction ("I've read this and signed it here"). Reads as personal endorsement, not decoration.

**Why 44% max-width on narrow viewports**: at mobile widths, a 150px fixed signature could take up half the photo. 44% caps it proportionally so the signature always feels like a small annotation, not a design element.

### Signature source rules

- **Real signature**: preferred. Founder scans their signature, converts to SVG paths
- **Handwritten font fallback**: if no real signature, use a handwritten font (Great Vibes, Sacramento, Yellowtail) rendered ONCE and converted to SVG (never leave as live font — accessibility + rendering consistency)
- **Never**: use "Signature" as text in a script font — that's a joke, not a signature
- **Never**: skip the signature AND leave the space empty — either include a real signature OR omit the overlay entirely

### Fallback: no signature

Skip the `<svg>` element entirely. The photo stands alone. Never leave a placeholder text like "[Signature here]".

---

## 5. Copy column — RIGHT (the long-form story)

### HTML

```html
<div class="about-copy">
  <span class="eyebrow" data-edit-id="about.eyebrow">
    {about.eyebrow}
  </span>
  <h2 class="about-h2" data-edit-id="about.heading">
    {about.heading}
  </h2>
  <p data-edit-id="about.paragraphs.0" style="margin-top: 28px;">
    {about.paragraphs[0]}
  </p>
  <p data-edit-id="about.paragraphs.1">
    {about.paragraphs[1]}
  </p>
  <!-- Repeat for each additional paragraph -->
  <div class="about-actions">
    <a class="btn btn-primary" href="{about.cta.href}" data-edit-id="about.cta">
      {about.cta.label}
    </a>
  </div>
</div>
```

### Copy column CSS

```css
.about-copy {
  padding-left: 48px;
  max-width: 588px;
}
```

### 5a. Eyebrow — allowed here (final-section-signal)

The THIRD and last exception to the global "no eyebrows" rule. Watchlist, HeroSplit, and this section are the three permitted spots.

**Why the exception**: at position 10 (the last section), without an eyebrow the h2 reads as ANOTHER value prop. The eyebrow ("Meet your mentor", "About Bill", "From the founder") is what signals "this is the personal story, not another sales beat."

### Eyebrow CSS (verified from billfanter.com production)

```css
.about-copy .eyebrow {
  display: inline-block;
  margin-bottom: 24px;                    /* 24 to h2 */
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted, #565656);      /* muted — quiet-personal tone */
}
```

### Eyebrow copy rules

**Character count**: 12-25 characters
**Word count**: 2-4 words
**Structure**: personal-invitation

- ✓ "Meet your mentor" (real BF)
- ✓ "About the founder"
- ✓ "From my desk"
- ✓ "Behind the work"
- ✗ "About us" (dead — plural, corporate)
- ✗ "Our story" (dead — plural)

---

### 5b. Headline (h2)

### CSS (uses the standard section h2 pattern)

```css
.about-h2 {
  font-family: 'Geist', sans-serif;
  font-size: clamp(24px, 2.6vw, 36px);    /* section h2 scale */
  line-height: 1.1;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: var(--text, #0a0a0a);
  margin: 0;
}
```

### Copy writing rules — heading

**Character count**: 30-70 characters
**Word count**: 6-13 words
**Structure**: first-person greeting + intent
**Voice**: FIRST-PERSON — this is the founder speaking directly

### Good headings

- ✓ "Hi, I'm Bill Fanter. I'm excited to get to know you." (real BF — greeting + intent)
- ✓ "I'm Sarah, and I built this because HR needed better tools."
- ✓ "My name is Marcus. Here's why I started this."
- ✓ "I'm Kate, and every framework here comes from a client I nearly lost."

### Bad headings

- ✗ "About Us" (dead + plural)
- ✗ "Our Story" (dead + plural + generic)
- ✗ "Meet the founder" (redundant with eyebrow)
- ✗ "Who is Bill Fanter?" (question format = weak — assert, don't ask)

### Anti-patterns

- **Never** third-person here — "Bill helps traders…" reads like a bio, not a personal address
- **Never** use exclamation marks (feels desperate)
- **Never** use nickname AND full name — pick one ("Bill Fanter" OR "Bill", not both)

---

### 5c. Body paragraphs

The story. Multiple paragraphs of first-person copy.

### CSS (verified from billfanter.com production)

```css
.about-copy p {
  color: var(--text, #0a0a0a);            /* FULL TEXT color, NOT muted — this is the story, must feel present */
  font-size: 16px;
  line-height: 1.6;                       /* 1.6 for long-form reading */
  font-family: 'Geist', sans-serif;
  margin: 0;
}

.about-copy p + p {
  margin-top: 18px;                       /* 18 between paragraphs — tight enough to feel continuous */
}

/* First paragraph after h2 gets extra margin-top */
.about-copy p:first-of-type {
  margin-top: 28px;                       /* 28 from h2 to first paragraph */
}
```

**Why FULL text color (not muted)**: every other body paragraph on the page is muted (`#565656`). This section's paragraphs are the founder speaking. Muting the founder's voice = signaling it's less important than the site copy. Full text color = "these are HER words, treat them like the h2."

**Why 18px between paragraphs (not 22 or 24)**: story continuity. 24+ between paragraphs breaks the reading flow into separate ideas. 18 is close enough that the eye reads them as one continuous story with paragraph breaks for breath.

**Why 28px from h2 to first paragraph**: bigger than 18 (paragraph-to-paragraph) because the h2 → first-paragraph transition IS a bigger semantic beat. 28 says "the greeting ends, the story begins."

### Copy writing rules — paragraphs

**Paragraph count**: 3-6 paragraphs (ideal 4-5)
**Character count per paragraph**: 100-350 chars (short paragraphs > long walls)
**Total word count**: 150-450 words (5-15 sentences)
**Voice**: first-person throughout ("I", "my", "we")
**Structure per paragraph**:
1. First para: career context / credentials (WHERE the founder came from)
2. Middle paras: the journey — what they built, what they learned, why they teach
3. Late para: what they'll do for the reader (transitions to CTA)
4. Optional closer: a personality moment (Bill's "This ain't rocket science" — signals warmth)

### Good paragraph examples

- ✓ "Over a 35-year career, I became one of the most sought-after executive-level bankers in the industry. I spearheaded the management of some of the largest multi-billion-dollar banks in America…" (real BF — credentials up front)
- ✓ "I've spent thousands of hours and thousands of dollars learning the art of trading and testing the best tools for the job. After building my own trading income from scratch…" (journey + earned expertise)

### Bad paragraph examples

- ✗ "Our team is passionate about helping clients achieve their goals." (plural, dead, no story)
- ✗ "We believe in providing world-class solutions." (banned + no first-person)
- ✗ "With years of experience, we deliver results." (plural, corporate, empty)

### Anti-patterns

- **Never** switch pronoun mid-section — pick "I" or "we" and hold it
- **Never** use third-person about the founder in this section — "Bill helps traders" belongs in HeroSplit, not here
- **Never** include a bulleted list — this is prose, not a resume
- **Never** include a "credentials" heading followed by sub-bullets — write it as sentences
- **Never** exceed 6 paragraphs — becomes a wall; readers scan and leave
- **Never** use "In today's fast-paced world" or any variant (banned)
- **Never** use `<strong>` or `<b>` on any word (compromises the editorial flow)

---

### 5d. CTA — bottom of story

### HTML

```html
<div class="about-actions">
  <a class="btn btn-primary" href="{about.cta.href}" data-edit-id="about.cta">
    {about.cta.label}
  </a>
</div>
```

### CSS (verified from billfanter.com production)

```css
.about-actions {
  margin-top: 28px;                       /* 28 from last paragraph */
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
```

Button reuses the primary CTA pattern ([community.md §6](./community.md)) — pill, `#0a0a0a` bg, white ink, hover lift + `#1a1a1a`.

**Why 28px from last paragraph (matches h2 → first paragraph rhythm)**: symmetry. The story is bookended by 28px gaps — one before the first paragraph, one after the last. Feels intentional.

**Why single CTA (not primary + secondary)**: this is the final beat. Reader has scrolled past 9 sections. If they're here, they're deciding. One clear next action, not a choice.

### CTA label rules

- **Character count**: 8-16 (shorter than other CTAs — this is intimate)
- **Verb-first**
- **Personal tone** — "Book a call" not "Book a discovery call"

### Good CTA labels

- ✓ "Book a call" (real BF — short, personal)
- ✓ "Send me a message"
- ✓ "Say hello"
- ✓ "Read my process"

### Bad CTA labels

- ✗ "Learn more about our services" (long, corporate)
- ✗ "Contact sales" (transactional — wrong tone for a founder story)
- ✗ "Get started" (banned)

---

## 6. Content slot schema — what Opus emits

```typescript
type AboutFounderContent = {
  eyebrow: string;                        // 12-25 chars, personal-invitation
  heading: string;                        // 30-70 chars, first-person greeting
  paragraphs: string[];                   // 3-6 paragraphs, 100-350 chars each
  cta: {
    label: string;                        // 8-16 chars, verb-first
    href: string;                         // internal, typically /contact or /about
  };
  photo: {
    src: string;                          // portrait WebP, min 800px wide
    alt: string;                          // founder name only
  };
  signature?: {                           // optional — signature as SVG paths
    viewBox: string;                      // typically "0 0 240 80"
    paths: string;                        // SVG <path d="…" /> inner content
  };
};
```

## 7. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `signature` | Skip the overlay — photo alone |
| `photo.src` | Use founder's initials in a large centered mono-caps letter over the palette-derived gradient in the media slot |
| `paragraphs` has <3 | Fall back to `long-form-founder-centered` (single-column variant) — 2 paragraphs looks empty in a 50/50 split |
| `paragraphs` has 7+ | Trim to 6 (never let it become a wall) |
| `cta` missing | Fall back to `{label: "Book a call", href: "/contact"}` — the founder story always needs an action step |
| `eyebrow` missing | Show heading only — but log a warning (loses the section-signal beat) |
| `heading` | Never — required, error out |

---

## 8. Complete assembled HTML (reference implementation)

```html
<section id="about-founder" data-section="long-form-founder-split"
  style="background: #ffffff; padding: 100px 40px;">

  <div style="max-width: 1180px; margin: 0 auto;">

    <div style="display: grid; grid-template-columns: 1fr 1fr;
                gap: 48px; align-items: center;">

      <!-- LEFT: portrait + signature -->
      <div style="position: relative;">
        <img src="{about.photo.src}"
          srcset="{about.photo.src}-720.webp 1x, {about.photo.src} 2x"
          alt="{about.photo.alt}" loading="lazy"
          style="width: 100%; height: 480px; object-fit: cover;
                 object-position: center 18%; border-radius: 20px;
                 box-shadow: 0 1px 3px rgba(0,0,0,0.05),
                             0 20px 44px -20px rgba(0,0,0,0.15);
                 border: 1px solid rgba(10,10,10,0.08);" />

        <!-- Optional signature overlay -->
        <svg viewBox="0 0 240 80" fill="none"
          style="position: absolute; right: 18px; bottom: 16px;
                 width: 150px; max-width: 44%; color: #0a0a0a;
                 filter: drop-shadow(0 1px 2px rgba(255,255,255,0.55));">
          <!-- Signature SVG path(s) here -->
          <path d="{signaturePaths}"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </div>

      <!-- RIGHT: eyebrow + h2 + long-form paragraphs + CTA -->
      <div style="padding-left: 48px; max-width: 588px;">

        <span data-edit-id="about.eyebrow"
          style="display: inline-block; margin-bottom: 24px;
                 font-family: var(--font-mono); font-size: 11.5px;
                 font-weight: 500; letter-spacing: 0.14em;
                 text-transform: uppercase;
                 color: var(--text-muted, #565656);">
          {about.eyebrow}
        </span>

        <h2 data-edit-id="about.heading"
          style="margin: 0; font-family: 'Geist', sans-serif;
                 font-size: clamp(24px, 2.6vw, 36px); line-height: 1.1;
                 font-weight: 500; letter-spacing: -0.025em;
                 color: var(--text, #0a0a0a);">
          {about.heading}
        </h2>

        <!-- First paragraph — has margin-top: 28 -->
        <p data-edit-id="about.paragraphs.0"
          style="margin: 28px 0 0; color: var(--text, #0a0a0a);
                 font-size: 16px; line-height: 1.6;
                 font-family: 'Geist', sans-serif;">
          {about.paragraphs.0}
        </p>

        <!-- Subsequent paragraphs — margin-top: 18 -->
        <p data-edit-id="about.paragraphs.1"
          style="margin: 18px 0 0; color: var(--text, #0a0a0a);
                 font-size: 16px; line-height: 1.6;
                 font-family: 'Geist', sans-serif;">
          {about.paragraphs.1}
        </p>

        <!-- Repeat for paragraphs 2, 3, 4, 5 -->

        <!-- CTA -->
        <div style="margin-top: 28px; display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="{about.cta.href}" data-edit-id="about.cta"
            style="display: inline-flex; align-items: center; gap: 8px;
                   padding: 14px 24px; border-radius: 999px;
                   background: #0a0a0a; color: #fff;
                   font-family: 'Geist', sans-serif; font-size: 16px;
                   font-weight: 600; letter-spacing: -0.005em;
                   text-decoration: none; white-space: nowrap;
                   transition: transform 200ms cubic-bezier(.4,0,.2,1),
                               background 200ms cubic-bezier(.4,0,.2,1);">
            {about.cta.label}
          </a>
        </div>

      </div>
    </div>
  </div>
</section>
```

---

## 9. Interactive behaviors

- **Photo**: static, no hover effect (a portrait, not a link)
- **Signature**: static SVG, no interaction
- **CTA hover**: 1px lift, bg `#0a0a0a → #1a1a1a`
- **CTA active**: `translateY(0)`, 60ms snap
- **CTA focus**: 2px outline `var(--primary)` with 2px offset
- **prefers-reduced-motion**: disable CTA lift

**No scroll animations, no fade-ins, no parallax** on the story itself. This is a moment of stillness — the founder's words presented as-is, no theatrics.

---

## 10. Responsive behavior

### Tablet + mobile (≤ 980px)

```css
@media (max-width: 980px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 28px;                            /* tighter stack gap */
  }
  .about-copy {
    padding-left: 0;
    max-width: none;
  }
  .about-media img {
    height: 320px;                        /* smaller portrait on mobile */
  }
}
```

**Why 28px stack gap (not 40 or 48)**: intimacy. The founder photo and their words feel like one continuous introduction, not two separate blocks.

### Mobile-specific tweaks (≤ 767px)

```css
@media (max-width: 767px) {
  .about-h2 { font-size: clamp(22px, 6vw, 28px); }
  .about-copy p { font-size: 15px; }
  .about-actions { justify-content: flex-start; }
  .about-actions .btn { width: 100%; justify-content: center; }
}
```

Full-width CTA on mobile.

---

## 11. Accessibility checklist

- [x] `<h2>` for the section heading (page has one `<h1>` in hero)
- [x] Photo `alt` = founder's name (informative, not empty — the photo is meaningful)
- [x] Signature SVG has no `role="img"` — it's a decorative flourish; the founder name in the alt above carries meaning
- [x] Signature SVG has `<title>` skipped — matches the decorative treatment
- [x] Paragraph text contrast: `#0a0a0a` on `#fff` = 20:1 (AAA)
- [x] Eyebrow contrast: `#565656` on `#fff` = 7.2:1 (AAA)
- [x] CTA is `<a>` with `href` — navigates
- [x] Focus ring: 2px outline, 2px offset
- [x] Reading order: photo → eyebrow → heading → paragraphs → CTA (matches visual)
- [x] Semantic HTML: `<section>` wrapper, `<h2>`, `<p>` for paragraphs
- [x] Never wrap the photo in an `<a>` — it's not a link

## 12. Performance checklist

- [x] Photo `loading="lazy"` (this is section 10, well below fold)
- [x] Photo WebP with 1x/2x srcset
- [x] Signature SVG inline (no HTTP request)
- [x] No JS required
- [x] No custom fonts loaded here
- [x] Shadow recipe reused from global tokens (no per-section shadow computation)

## 13. Design token dependencies

```css
:root {
  --font-body: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
  --text: #0a0a0a;
  --text-muted: #565656;
  --radius-lg: 20px;
  --border: rgba(10, 10, 10, 0.08);
  --shadow-card: 0 1px 3px rgba(0,0,0,0.05), 0 20px 44px -20px rgba(0,0,0,0.15);
  --container: 1180px;
}
```

Hardcoded (structural):
- `#ffffff` (section bg)
- Photo positioning (object-position: center 18%)
- Signature drop-shadow color (`rgba(255,255,255,0.55)`)

---

## 14. Rationale (why this section converts)

- **LAST content section (before footer)** = the reader has invested scroll. This is where the decision happens. Founder story here is the emotional close.
- **50/50 split with photo LEFT** = symmetry mirrors the About page convention across editorial sites (Aesop, Mercury, Stripe all use photo-left about sections).
- **Fixed 480px photo height** = normalizes any portrait aspect. Founder photo variety (portrait phone shot, studio landscape, candid selfie) all resolve to the same visual weight.
- **`object-position: center 18%`** = keeps face in view when the crop is aggressive. Founders aren't in the geometric center of most photos; they're 30-40% down.
- **Signature overlay bottom-right** = personal endorsement of the words to the right. Signature bottom-left would feel like a photographer credit; center would compete with the face.
- **White drop-shadow on signature** = legible on ANY photo background. Dark shadow would clash with dark bg photos.
- **First-person copy (I, my, we)** = the founder speaking. Third-person biographical copy reads like a Wikipedia entry.
- **Full text color on paragraphs (not muted like other body)** = the founder's words are as important as the h2. Muting says "these are supporting details"; full color says "read this like the promise."
- **18px between paragraphs (tighter than 22)** = story continuity. Multiple paragraphs read as ONE continuous introduction, not disconnected beats.
- **28px from h2 to first para + 28px from last para to CTA** = symmetric bookending. The story feels enclosed as one piece of content.
- **Single CTA (personal tone — "Book a call", "Say hello")** = the reader is at the emotional edge. One warm invitation, not a menu.
- **Eyebrow allowed here** = signals "personal story starts now" — without it, the h2 reads as another value prop.
- **NO scroll animations, NO parallax, NO fade-ins** = stillness. This is the moment the reader commits or doesn't. Theatrics interfere.
- **Photo has `border` + `border-radius` + `shadow`** = feels like a framed magazine portrait, not a Facebook profile pic.

---

## 15. What Opus should NOT do

- ❌ Write the copy in third-person ("Bill helps traders", "Sarah has 20 years") — first-person only in this section
- ❌ Use plural pronouns ("we", "our", "us") — this is ONE person's story
- ❌ Emit fewer than 3 or more than 6 paragraphs
- ❌ Use bulleted lists or numbered lists (prose only)
- ❌ Include a "credentials" subheading with sub-bullets (write it as sentences)
- ❌ Use `<strong>` or `<b>` for emphasis (compromises editorial flow)
- ❌ Use italics anywhere (global ban)
- ❌ Center-align the copy (left-align only on desktop)
- ❌ Use a group photo (must be the founder alone)
- ❌ Use a studio white-background headshot (must be candid/environmental)
- ❌ Wrap the photo in a link
- ❌ Use hover scale on the photo
- ❌ Add a "read full bio" secondary link below the CTA (the paragraphs ARE the full bio)
- ❌ Add scroll-triggered fade-in on the paragraphs (stillness)
- ❌ Skip the eyebrow (needed to signal "personal story" beat)
- ❌ Use CTAs like "Get started" or "Learn more" (must be personal — "Book a call", "Say hello")
- ❌ Include another testimonial quote inside this section (proof lives in Reviews; this is voice)
