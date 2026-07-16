# SECTION — Community (community-screenshot-benefits)

> **Section family**: `community-screenshot-benefits`
> **Used in**: personal-brand/home (position 4), personal-brand/masterclass (with CTA override)
> **Purpose**: turn "community access" from an abstract benefit into a concrete visual proof — real screenshot of the actual community + a numbered list of what members get.
> **Position on page**: renders on a hard-cut white background — the section ABOVE (Watchlist) ends its light-gradient fade at `#f6f8fc` and this section begins at pure `#ffffff`, creating a deliberate visual seam that signals "new territory."

---

## 1. Section wrapper

```html
<section id="community" data-section="community-screenshot-benefits">
  <div class="container">
    <div class="community-header is-center">
      <h2>{community.heading}</h2>
      <p class="lead">{community.lead}</p>
    </div>
    <div class="community-grid">
      <div class="community-media">…</div>
      <div class="community-benefits">…</div>
    </div>
  </div>
</section>
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-16)

| Property | Value | Notes |
|---|---|---|
| `background` | `#ffffff` | pure white — hard cut from Watchlist above. Deliberate seam. |
| `padding-top` | `100px` | DESIGN.md light-section rhythm |
| `padding-bottom` | `100px` | |
| Container `max-width` | `1180px` | |
| Container horizontal padding | `40px` desktop / `24px` mobile (≤767px) |

**Why pure white after the gradient fade above**: the visual seam is intentional. Watchlist ends at `#f6f8fc` (nearly white), Community begins at `#ffffff` — a 4-6% brightness jump the eye registers as "new chapter." Without the seam, MegaBento + Watchlist + Community read as one endless light section.

---

## 2. Section header — CENTERED (the one asymmetry exception)

Global DESIGN.md rule: asymmetric editorial only. **This section is the exception.**

**Why centered here**: the section is a symmetric two-column split below (screenshot LEFT + benefits RIGHT, both equal-weight). A left-flushed header above a symmetric grid feels lopsided. Centered header + symmetric grid = compositional balance.

### HTML

```html
<div class="community-header is-center">
  <h2 data-edit-id="community.heading">{community.heading}</h2>
  <p class="lead" data-edit-id="community.lead">{community.lead}</p>
</div>
```

### Header CSS (verified from billfanter.com production)

```css
.community-header {
  max-width: 720px;                       /* caps header — keeps h2 from spanning entire container */
  margin-bottom: 56px;                    /* 56 to grid — NOT 40 or 64 */
}

.community-header.is-center {
  margin-left: auto;                      /* centered variant */
  margin-right: auto;
  text-align: center;
}

.community-header h2 {
  font-family: 'Geist', sans-serif;
  font-size: clamp(24px, 2.6vw, 36px);    /* matches every other section h2 */
  line-height: 1.1;
  letter-spacing: -0.025em;
  font-weight: 500;
  color: var(--text, #0a0a0a);
  margin: 0;
}

.community-header h2 + p,
.community-header h2 + .lead {
  margin-top: 22px;                       /* 22 — NOT 24 or 28. Bill-Fanter's actual rhythm */
}

.community-header .lead {
  font-size: 16px;
  line-height: 1.6;                       /* 1.6 for reading paragraphs, not 1.55 */
  color: var(--text-muted, #565656);
}
```

**Why 720px max on header (vs 640 on MegaBento header)**: MegaBento header is left-flushed, has 4 cols of tiles beside it (visually competing), so smaller max keeps it tight. Community header is centered above a symmetric grid, so it can breathe wider without competing.

**Why 22px between h2 and lead (vs 28 elsewhere)**: subtle. This section uses the tighter section-header rhythm (h2 → lead) because the h2 is smaller (clamp 24-36) and centered. Wider spacing feels floaty at those proportions.

### Copy writing rules — heading

**Character count**: 25-55 characters
**Word count**: 4-9 words
**Structure**: verb-first invitation OR noun-phrase claim
**Voice**: second-person, imperative
**Purpose**: name the community and invite entry in one line

### Good headings

- ✓ "Join my options trading community" (real Bill-Fanter — 5 words)
- ✓ "Come inside the founder's roundtable"
- ✓ "Where 1,600+ HR leaders trade playbooks"
- ✓ "The private Discord for indie builders"

### Bad headings

- ✗ "Join our amazing community" ("amazing" is filler)
- ✗ "Our community" (dead — no invitation)
- ✗ "Discover our exclusive members-only group" (banned words)
- ✗ "The best trading community online" ("best" is empty, "online" is redundant)

### Copy writing rules — lead

**Character count**: 60-150 characters
**Word count**: 12-25 words
**Structure**: ONE sentence describing what members DO together
**Voice**: second-person, present tense, action verbs
**Purpose**: paint the day-to-day activity, not the value prop

### Good leads

- ✓ "Trade alongside active options traders who share setups, alerts, and feedback in real time." (real Bill-Fanter — action, cohort, cadence)
- ✓ "Compare playbooks, get feedback on your process, and see how peers solve the same problems every week."
- ✓ "Post drafts, review each other's copy, and learn from senior operators building the same thing."

### Bad leads

- ✗ "Join our thriving community of like-minded professionals." (dead — "thriving" is filler, no what)
- ✗ "Get access to premium members-only content." (banned words + no action)
- ✗ "Network with industry leaders and grow your career." ("network" as verb = dead)

---

## 3. Two-column grid — screenshot LEFT + benefits RIGHT

### CSS (verified from billfanter.com production)

```css
.community-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;         /* 50/50 exactly */
  gap: 48px;                              /* 48 — NOT 56 (Watchlist gap) or 40 */
  align-items: center;                    /* midline alignment */
  margin-top: 64px;                       /* 64 from header — larger than internal rhythm */
}

.community-grid .community-benefits {
  padding-left: 48px;                     /* extra 48px indent on benefits column — visual weight to screenshot */
}
```

**Why 48px extra `padding-left` on benefits**: makes the visual asymmetric within a symmetric grid. The screenshot column reaches all the way to its column edge; the benefits column is pushed 48px away from the gap. This makes the screenshot feel primary (it's the proof) while the numbered list feels like commentary alongside it.

**Why `margin-top: 64px` from header (larger than internal 24-32px rhythm)**: the header block is a distinct semantic beat. The 64px gap says "header ends here, evidence begins."

---

## 4. Media column — LEFT (the actual community screenshot)

The single most important element in the section. Real screenshot, actual UI, showing real activity.

### HTML

```html
<div class="community-media">
  <img src="{community.screenshot.src}"
       srcset="{community.screenshot.src}-720.webp 1x, {community.screenshot.src} 2x"
       alt="{community.screenshot.alt}"
       loading="lazy" />
</div>
```

### CSS (verified from billfanter.com production)

```css
.community-media {
  border-radius: 0;                       /* NO frame, NO card treatment */
  overflow: visible;
  background: transparent;                /* no bg — screenshot brings its own */
  border: 0;
  box-shadow: none;                       /* NO framing shadow */
  aspect-ratio: auto;                     /* let the image dictate its own height */
  width: 100%;
  max-width: none;
  margin: 0;
  align-self: start;                      /* raise toward the TOP of the row */
}

.community-media img {
  width: 88%;                             /* 88% — smaller than full column width */
  height: auto;
  object-fit: contain;                    /* show the whole screenshot, no crop */
  display: block;
  margin-inline: auto;                    /* horizontally centered within column */
}
```

**Why NO card frame / border / shadow around the screenshot**: the screenshot is a photograph of a real product (Discord, Slack, forum UI). It already has its own visual chrome — window rounding, sidebar, avatars. Adding a card frame around it says "here is a card of a screenshot" — a redundant visual layer. Letting the screenshot bleed feels like you're actually looking INTO the community.

**Why 88% width, not 100%**: negative space on both sides breathes. 100% width feels like the image is bursting out of its column. 88% is enough breathing room that the image feels intentional.

**Why `align-self: start` (top-aligned, not centered)**: the screenshot is typically taller than the benefits list. Center-aligning both would leave the screenshot floating with weird top/bottom gaps. Top-align means the screenshot starts at the same y as the first benefit row — visually anchored.

### Screenshot rules — content

- **Source**: MUST be a real screenshot of the actual community
- **Content visible**: at least 3 real message threads, real avatars (with faces or initials — never blank), real timestamps
- **PII**: blur or crop out full names, email addresses, phone numbers, private links — but leave first names/handles visible (they signal real people)
- **Format**: WebP, transparent background if the source has one, min 1200px on the long axis
- **Aspect**: portrait works best (matches the vertical benefit list). Landscape is acceptable if the image is tall enough to hold the eye.

### Fallback: no real screenshot

If the user hasn't provided a real screenshot:

```html
<div class="community-media community-media--placeholder">
  <div class="fake-chat">
    <!-- Rendered UI mockup with brand palette:
         3 fake message rows showing sample activity
         Never use lorem ipsum. Use short realistic seed messages -->
  </div>
</div>
```

Never use a stock "team collaboration" photo. Never render a generic Discord logo. Either a real screenshot or a designed placeholder that resembles the actual product.

---

## 5. Benefits column — RIGHT (numbered list)

### HTML

```html
<div class="community-benefits">
  <div class="benefit">
    <div class="benefit-num">01</div>
    <div>
      <div class="benefit-title" data-edit-id="community.benefits.0.title">
        {benefit.title}
      </div>
      <p class="benefit-body" data-edit-id="community.benefits.0.body">
        {benefit.body}
      </p>
    </div>
  </div>
  <!-- Repeat for each benefit -->

  <a class="btn btn-primary"
     href="{community.cta.href}"
     data-edit-id="community.cta">
    {community.cta.label}
    <svg class="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10m-4-4 4 4-4 4"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </a>
</div>
```

### Column CSS (verified from billfanter.com production)

```css
.community-benefits {
  display: flex;
  flex-direction: column;
  gap: 24px;                              /* 24 between benefit blocks — matches DESIGN.md scale */
}
```

### Benefit row CSS (verified from billfanter.com production)

```css
.benefit {
  display: grid;
  grid-template-columns: 56px 1fr;        /* 56px numbered chip + rest */
  gap: 16px;                              /* between chip and title/body block */
  padding: 20px 0;                        /* vertical padding — the hairline sits on top */
  border-top: 1px solid rgba(10, 10, 10, 0.08); /* subtle divider between benefits */
}

.benefit:first-child {
  border-top: 0;                          /* no top divider on first row */
  padding-top: 0;                         /* no extra padding at the top */
}
```

**Why `grid-template-columns: 56px 1fr` (not flex with gap)**: grid guarantees the numbered chip column stays a fixed 56px width AND aligns baselines between chip and title. Flex-with-gap can produce misalignment when title text wraps.

**Why the hairline divider (`border-top: 1px solid rgba(10,10,10,0.08)`)**: instead of card treatment for each benefit, the hairline says "these are distinct rows in a list." Cards would make each benefit fight the numbered chip. Hairline = editorial ledger.

**Why 20px vertical padding (creates 40px rhythm between rows) + `gap: 24` on parent**: no — `gap` on parent is between elements, `padding: 20 0` is inside each row. Total space between two benefit titles = 20 (bottom of row A) + 24 (gap) + 20 (top of row B) = 64px felt spacing between titles. Feels breathable, not cramped.

### Numbered chip CSS (verified from billfanter.com production)

```css
.benefit-num {
  flex-shrink: 0;
  width: 36px;                            /* 36 — chip is smaller than the 56px column, centered */
  height: 36px;
  border-radius: 8px;                     /* 8 — sharper than 12 (rounded but not pill) */
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  background: #0a0a0a;                    /* solid dark chip — NOT accent color */
}
```

**Why chip is 36px inside a 56px column**: the column is 56px so the chip has 20px of breathing room (10 each side) between it and the title. Chip = 36 makes it a comfortable tap-target-adjacent size without being oversized.

**Why 8px radius (not 12 or 999)**: sharper. 12 = generic card corner. 999 = pill (already used for CTAs). 8 = numbered ticket, ledger-style — matches editorial mood.

**Why solid `#0a0a0a`, NOT accent color**: accent color is scattered enough (eyebrows, focus rings, primary CTA). Using it AGAIN on 5-8 numbered chips creates visual clutter. Neutral dark chips let the accent CTA at the bottom carry the accent weight.

**Why mono font on chip**: matches the mono-eyebrow taxonomy from DESIGN.md. Numbers as data → mono. Body copy → sans.

### Title CSS (verified from billfanter.com production)

```css
.benefit-title {
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 19px;                        /* 19 — between h3 (24) and body (16) */
  margin-bottom: 6px;                     /* tight — title and body are a unit */
  letter-spacing: -0.015em;
  color: var(--text, #0a0a0a);
}
```

**Why 19px (not 20 or 24)**: 20+ becomes h3-scale, competing with the section h2 above. 19 sits BELOW section h2 in hierarchy but above body — the "list-item title" register.

**Why `margin-bottom: 6` (not 8 or 12)**: the title and body form ONE semantic unit. Tight spacing signals "these two lines belong together as this benefit." 12+ would break them into separate ideas.

### Body CSS (verified from billfanter.com production)

```css
.benefit-body {
  font-family: 'Geist', sans-serif;
  font-size: 16px;
  line-height: 1.55;                      /* 1.55 — slightly tighter than lead's 1.6 (list context) */
  color: var(--text-muted, #565656);
  margin: 0;
}
```

### Copy writing rules — benefit title

**Character count**: 15-45 characters
**Word count**: 3-7 words
**Structure**: verb-first ("Get X", "See Y", "Reach Z")
**Voice**: second-person imperative
**Purpose**: name the specific thing the member gets

### Good benefit titles

- ✓ "Get instant Discord access" (real BF — verb + specific what)
- ✓ "See live trade alerts"
- ✓ "Get daily market analysis"
- ✓ "Reach Bill directly"
- ✓ "Compare quarterly playbooks"

### Bad benefit titles

- ✗ "Access to community" (dead — no verb, no what specifically)
- ✗ "Community features" (list category, not a benefit)
- ✗ "Amazing exclusive perks" (banned words)
- ✗ "Networking opportunities" ("opportunities" = corporate filler)

### Copy writing rules — benefit body

**Character count**: 60-130 characters
**Word count**: 12-24 words
**Structure**: ONE sentence
**Voice**: second-person, active, describes WHO does WHAT together
**Purpose**: prove the benefit by naming the daily activity

### Good benefit bodies

- ✓ "Join active options traders who share trades, answer questions, and help you start fast."
- ✓ "See Bill break down the market each day so you know what to watch and why."
- ✓ "Share setups, wins, and lessons with traders working the same strategies."

### Bad benefit bodies

- ✗ "Our community provides a wealth of resources and support." (dead — no specifics)
- ✗ "Members get exclusive access to premium content." (banned + no what)
- ✗ "You'll love our vibrant community!" (banned exclamation + "love" is empty)

### Benefit count rules

- **Minimum**: 3 benefits (fewer = too thin — use `hero-split-media-copy-bento` instead)
- **Maximum**: 7 benefits (more = the list dominates the screenshot — use `help-grid` instead)
- **Ideal**: 4-5 benefits
- **Numbering format**: two-digit padded — `01`, `02`, `03` (never `1`, `2`, `3`)

---

## 6. CTA button — bottom of benefits column

The single action beneath the list. NOT centered under the whole section — anchored to the benefits column, left-aligned to align with the numbered rows above.

### CSS (verified from billfanter.com production)

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;                     /* 14v/24h — matches hero CTA (14v/26h) close enough */
  border-radius: 999px;                   /* pill */
  font-family: 'Geist', sans-serif;
  font-size: 16px;                        /* 16 here vs 15 on hero — slightly larger because this is standalone */
  font-weight: 600;
  letter-spacing: -0.005em;
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
    background 200ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.btn-primary {
  background: #0a0a0a;
  color: #ffffff;
  border: 1px solid #0a0a0a;
}

.btn-primary:hover {
  background: #1a1a1a;                    /* 4% brighter — DESIGN.md hover rule */
  transform: translateY(-1px);
}

.btn .arrow {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:hover .arrow {
  transform: translateX(3px);             /* arrow slides right on hover — reinforces "go" */
}
```

**Why arrow slides on hover (not lift)**: the arrow direction IS the affordance. Sliding right says "you're going forward if you click." Lifting the arrow separately from the button would be over-choreographed.

### CTA placement in HTML

```html
<a class="btn btn-primary" href="{community.cta.href}"
   style="margin-top: 8px; align-self: flex-start;">
  {community.cta.label}
  <svg class="arrow">…</svg>
</a>
```

**`margin-top: 8`**: the CTA is close to the last benefit — feels like a continuation. Not 24 (that would make it feel separate).

**`align-self: flex-start`**: left-aligned within the benefits column, so it visually anchors to the same left-edge as the numbered chips.

### Copy writing rules — CTA label

**Character count**: 12-24 characters
**Word count**: 2-4 words
**Structure**: verb-first
**Voice**: direct, invitational

### Good CTA labels

- ✓ "Join the community" (real BF)
- ✓ "Get inside"
- ✓ "Request an invite"
- ✓ "See member benefits"

### Bad CTA labels

- ✗ "Learn more" (dead)
- ✗ "Sign up now!" (exclamation, generic)
- ✗ "Click here" (dead)
- ✗ "Unlock full access" (banned "Unlock")

---

## 7. Content slot schema — what Opus emits

```typescript
type CommunityContent = {
  heading: string;                        // 25-55 chars, 4-9 words, verb-first
  lead: string;                           // 60-150 chars, ONE sentence
  benefits: Array<{
    num: string;                          // '01' through '99' — two-digit padded
    title: string;                        // 15-45 chars, verb-first
    body: string;                         // 60-130 chars, ONE sentence
  }>;                                     // min 3, max 7, ideal 4-5
  cta: {
    label: string;                        // 12-24 chars, verb-first
    href: string;
  };
  screenshot: {
    src: string;                          // real screenshot URL, WebP, min 1200px long axis
    alt: string;                          // "Screenshot of [community name]'s [platform]"
  };
};
```

## 8. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `screenshot.src` | Rendered placeholder mockup using brand palette (see §4) |
| Fewer than 3 benefits | Use `hero-split-media-copy-bento` section family instead |
| More than 7 benefits | Trim to top 5, or switch to `help-grid-3col-icon` |
| `cta` | Fall back to `{label: "Join now", href: "#community-signup"}` and log warning — never omit CTA silently |
| `lead` | Show heading only (skip lead) |
| `heading` | Never — required, error out |
| Individual benefit missing `body` | Render title only, tighter list rhythm |

---

## 9. Complete assembled HTML (reference implementation)

```html
<section id="community" data-section="community-screenshot-benefits"
  style="background: #ffffff; padding: 100px 40px;">

  <div style="max-width: 1180px; margin: 0 auto;">

    <!-- Centered header block -->
    <div style="max-width: 720px; margin: 0 auto 56px; text-align: center;">
      <h2 data-edit-id="community.heading"
        style="margin: 0; font-family: 'Geist', sans-serif;
               font-size: clamp(24px, 2.6vw, 36px); line-height: 1.1;
               letter-spacing: -0.025em; font-weight: 500;
               color: var(--text, #0a0a0a);">
        {community.heading}
      </h2>
      <p data-edit-id="community.lead"
        style="margin: 22px 0 0; font-size: 16px; line-height: 1.6;
               color: var(--text-muted, #565656);">
        {community.lead}
      </p>
    </div>

    <!-- Two-col grid: screenshot left, benefits right -->
    <div style="display: grid; grid-template-columns: 1fr 1fr;
                gap: 48px; align-items: center; margin-top: 64px;">

      <!-- LEFT: real screenshot, no frame -->
      <div style="align-self: start; width: 100%;">
        <img src="{community.screenshot.src}"
          srcset="{community.screenshot.src}-720.webp 1x, {community.screenshot.src} 2x"
          alt="{community.screenshot.alt}" loading="lazy"
          style="width: 88%; height: auto; object-fit: contain;
                 display: block; margin-inline: auto;" />
      </div>

      <!-- RIGHT: numbered benefits + CTA -->
      <div style="padding-left: 48px; display: flex; flex-direction: column; gap: 24px;">

        <!-- Benefit row 1 (first-child — no border-top, no padding-top) -->
        <div style="display: grid; grid-template-columns: 56px 1fr;
                    gap: 16px; padding: 0 0 20px;">
          <div style="width: 36px; height: 36px; border-radius: 8px;
                      display: flex; align-items: center; justify-content: center;
                      font-family: 'Geist Mono', ui-monospace, monospace;
                      font-size: 13px; font-weight: 600; color: #fff;
                      background: #0a0a0a;">
            {community.benefits.0.num}
          </div>
          <div>
            <div data-edit-id="community.benefits.0.title"
              style="font-family: 'Geist', sans-serif; font-weight: 600;
                     font-size: 19px; margin-bottom: 6px; letter-spacing: -0.015em;
                     color: var(--text, #0a0a0a);">
              {community.benefits.0.title}
            </div>
            <p data-edit-id="community.benefits.0.body"
              style="margin: 0; font-family: 'Geist', sans-serif; font-size: 16px;
                     line-height: 1.55; color: var(--text-muted, #565656);">
              {community.benefits.0.body}
            </p>
          </div>
        </div>

        <!-- Benefit rows 2..N (each with border-top hairline + padding: 20 0) -->
        <div style="display: grid; grid-template-columns: 56px 1fr; gap: 16px;
                    padding: 20px 0; border-top: 1px solid rgba(10,10,10,0.08);">
          <div style="width: 36px; height: 36px; border-radius: 8px;
                      display: flex; align-items: center; justify-content: center;
                      font-family: 'Geist Mono', ui-monospace, monospace;
                      font-size: 13px; font-weight: 600; color: #fff;
                      background: #0a0a0a;">
            {community.benefits.1.num}
          </div>
          <div>
            <div data-edit-id="community.benefits.1.title"
              style="font-family: 'Geist', sans-serif; font-weight: 600;
                     font-size: 19px; margin-bottom: 6px; letter-spacing: -0.015em;
                     color: var(--text, #0a0a0a);">
              {community.benefits.1.title}
            </div>
            <p data-edit-id="community.benefits.1.body"
              style="margin: 0; font-family: 'Geist', sans-serif; font-size: 16px;
                     line-height: 1.55; color: var(--text-muted, #565656);">
              {community.benefits.1.body}
            </p>
          </div>
        </div>

        <!-- Repeat for remaining benefits (3, 4, 5 …) — same structure as row 2 -->

        <!-- CTA — left-aligned, close to last benefit -->
        <a href="{community.cta.href}" data-edit-id="community.cta"
          style="margin-top: 8px; align-self: flex-start;
                 display: inline-flex; align-items: center; justify-content: center;
                 gap: 8px; padding: 14px 24px; border-radius: 999px;
                 font-family: 'Geist', sans-serif; font-size: 16px;
                 font-weight: 600; letter-spacing: -0.005em;
                 border: 1px solid #0a0a0a; background: #0a0a0a; color: #fff;
                 text-decoration: none; white-space: nowrap;
                 transition: transform 200ms cubic-bezier(.4,0,.2,1),
                             background 200ms cubic-bezier(.4,0,.2,1);">
          {community.cta.label}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10m-4-4 4 4-4 4"
              stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  </div>
</section>
```

---

## 10. Interactive behaviors

- **Benefit hover** (optional enhancement): subtle `padding-left: 8px` shift on hover → signals "this row is interactive if clicked" — but only if benefits ARE clickable (they usually aren't; the CTA at the bottom is the single action). Skip this on the homepage version.
- **CTA hover**: background brightens `#0a0a0a → #1a1a1a`, lifts 1px, arrow slides right 3px (200ms ease-out)
- **CTA active**: returns to `translateY(0)` with 60ms snap
- **Screenshot**: static, no hover effect — it's a photograph, not a link

### Reveal animation (optional, on-scroll)

If AnimatedList or IntersectionObserver is available, fade in each benefit row sequentially as the section scrolls into view:

```css
.benefit {
  opacity: var(--reveal, 1);              /* default 1 = fully visible */
}
```

JavaScript sets `--reveal: 0` on load, then sets `--reveal: 1` on each row 100ms apart when section is 30% visible.

If JS unavailable, benefits are visible by default (progressive enhancement).

---

## 11. Responsive behavior

### Tablet (≤ 1024px) — verified in production

```css
@media (max-width: 1024px) {
  .community-grid {
    grid-template-columns: 1fr;           /* stack */
    gap: 32px;                            /* shrink from 48 */
  }
  .community-grid .community-benefits {
    padding-left: 0;                      /* remove the 48px indent when stacked */
  }
}
```

**Why the breakpoint is 1024px (not 900 or 768)**: in the 900-1023px range, the 2-col layout leaves the phone mockup top-aligned beside a taller benefits list, which reads unbalanced. Stacking at 1024 avoids that awkward window.

### Mobile (≤ 767px)

```css
@media (max-width: 767px) {
  .community-header { margin-bottom: 40px; } /* shrink from 56 */
  .community-grid { margin-top: 40px; }      /* shrink from 64 */
  .benefit { padding: 16px 0; }              /* shrink from 20 */
  .benefit-title { font-size: 17px; }        /* shrink from 19 */
  .btn { width: 100%; }                      /* CTA full-width on mobile */
}
```

**Why CTA goes full-width on mobile**: on mobile the CTA is far below the fold, and users are thumbs-on-screen. Full-width button = huge tap target, easy commit.

---

## 12. Accessibility checklist

- [x] `<h2>` for section heading (page uses one `<h1>` in hero, then h2s)
- [x] Screenshot `alt` is descriptive: "Screenshot of {brand}'s Discord community" (not empty)
- [x] Numbered chip inside `.benefit-num` is decorative text — screen reader reads it as "01, Get instant Discord access" which is fine (no aria-hidden needed)
- [x] CTA button is `<a>` with real `href` (not `<button>` — it navigates)
- [x] Arrow SVG has no accessible text (visually paired with the label; `<a>` carries meaning)
- [x] Color contrast: `#565656` on `#ffffff` = 7.2:1 (AAA)
- [x] Benefit title contrast: `#0a0a0a` on `#ffffff` = 20:1 (AAA)
- [x] CTA contrast: `#ffffff` on `#0a0a0a` = 20:1 (AAA)
- [x] `prefers-reduced-motion`: disable CTA transform + arrow slide, reveal animations become instant
- [x] Focus state on CTA: 2px `var(--primary)` outline + 2px offset (from global DESIGN.md a11y baseline)

## 13. Performance checklist

- [x] Screenshot `loading="lazy"` (this is section 4, below the fold)
- [x] Screenshot WebP with 1x/2x srcset
- [x] No JavaScript required for baseline render (reveal animation is optional enhancement)
- [x] No custom fonts loaded here (uses global `Geist` / `Geist Mono`)
- [x] Number chips are text (not SVG), zero request cost
- [x] `border-top` hairlines are CSS (zero cost)

## 14. Design token dependencies

```css
:root {
  --font-body: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
  --text: #0a0a0a;
  --text-muted: #565656;
  --primary: #hex;                         /* CTA background falls back to #0a0a0a; primary is for focus rings only */
}
```

Hardcoded (structural):
- `#ffffff` (section bg)
- `#0a0a0a` (chip bg, CTA bg, title color)
- `rgba(10, 10, 10, 0.08)` (hairline divider)
- `#565656` (body text)

---

## 15. Rationale (why this section converts)

- **Real screenshot** = visual proof that trumps any words. "Join the community" is abstract; "here are 3 conversations happening right now" is concrete.
- **Screenshot with NO frame** = it feels like you're looking INTO the community, not at a picture of it. Card treatment would create distance.
- **Numbered list, not bullets, not cards** = numbered ledger reads like a receipt — "here is EXACTLY what you get, in order." Bullets feel like brochure copy; cards feel like a product grid.
- **Mono numbered chips** = data affordance. Numbers as ticker/data, not decoration.
- **Neutral dark chips (not accent)** = restraint. Accent color is scarce elsewhere on the page; scattering it across 5 chips flattens the visual hierarchy.
- **Centered header above symmetric grid** = compositional balance. The one asymmetry exception, justified by the grid's own symmetry.
- **CTA anchored to benefits column (not centered under section)** = the CTA is the RESPONSE to the numbered list. Centering it under the whole section would make it a "section CTA" (weaker); anchoring it to the list makes it "the next step after reading these benefits" (stronger).
- **48px padding-left on benefits column** = internal asymmetry inside a symmetric grid. Screenshot gets the visual anchor, benefits get the reading position.
- **`align-self: start` on screenshot** = tops of both columns align, avoiding the "floating screenshot with weird gaps" problem when heights differ.
- **Screenshot 88% width inside its column** = breathing room. 100% would burst the column edge; 88% floats intentionally.
- **Hairline dividers between benefits** = editorial ledger. Cards would compete with the numbered chip. Hairline is quiet, reads like list items in a print magazine.
- **Title + body tight (6px gap)** = title and body are one thought. Wider spacing breaks them into separate ideas.

---

## 16. What Opus should NOT do

- ❌ Add a card frame / border / shadow around the screenshot
- ❌ Use lorem ipsum or fake-looking placeholder text in the screenshot mockup fallback
- ❌ Use stock "team collaboration" photo instead of real community screenshot
- ❌ Use bullet points (`•`) instead of numbered chips
- ❌ Use icon-based benefit list (icons ≠ numbers; wrong pattern for this section family)
- ❌ Number without padding (`1`, `2`, `3` instead of `01`, `02`, `03`)
- ❌ Use accent color for the numbered chip background
- ❌ Center the CTA under the whole section
- ❌ Add a decorative border/glow around the CTA
- ❌ Add a secondary CTA — this section has ONE action
- ❌ Skip the hairline dividers between benefits (cards or nothing = both wrong)
- ❌ Add an eyebrow above the h2 (this section is one of the pages where eyebrow is banned — the h2 alone carries)
- ❌ Emit fewer than 3 or more than 7 benefits (use a different section family)
- ❌ Use rounded 999 (pill) on the numbered chips — 8px only
- ❌ Autoplay a video of the community — screenshot only
