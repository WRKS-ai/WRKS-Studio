# SECTION — HelpGrid (help-grid-3col-icon)

> **Section family**: `help-grid-3col-icon`
> **Used in**: personal-brand/home (position 5), any page that needs a mid-page value-prop grid
> **Purpose**: three parallel value propositions rendered as icon cards. The "what you get" quick-answer for scanners who won't read the founder story below.
> **Position on page**: mid-page, on white. Sits between two heavier sections as a light breathing beat.

---

## 1. Section wrapper

```html
<section id="help" data-section="help-grid-3col-icon">
  <div class="container">
    <div class="help-header is-center">
      <h2>{helpGrid.heading}</h2>
    </div>
    <div class="help-grid">
      <!-- 3 icon cards -->
    </div>
  </div>
</section>
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-17)

| Property | Value | Notes |
|---|---|---|
| `background` | `#ffffff` | white — same as Community above, no visual seam |
| `padding-top` | `100px` | DESIGN.md rhythm |
| `padding-bottom` | `100px` | |
| Container `max-width` | `1180px` | |
| Container horizontal padding | `40px` / `24px` mobile |

---

## 2. Section header — centered, no lead

Unlike Community (heading + lead), this section is HEADING ONLY. The cards ARE the lead.

### HTML

```html
<div class="help-header is-center">
  <h2 data-edit-id="helpGrid.heading">{helpGrid.heading}</h2>
</div>
```

### CSS

```css
.help-header {
  max-width: 720px;
  margin: 0 auto 56px;                    /* 56 to grid — but see override below for mobile */
  text-align: center;
}

.help-header h2 {
  font-family: 'Geist', sans-serif;
  font-size: clamp(24px, 2.6vw, 36px);
  line-height: 1.1;
  letter-spacing: -0.025em;
  font-weight: 500;
  color: var(--text, #0a0a0a);
  margin: 0;
}
```

### Copy writing rules — heading

**Character count**: 40-70 characters
**Word count**: 7-12 words
**Structure**: two-clause promise — "[action] and [outcome]" — the three cards will each unpack a different mechanism
**Voice**: second-person imperative

### Good headings

- ✓ "Trade options with confidence and grow your income" (real Bill-Fanter — action + outcome)
- ✓ "Ship your first landing page and grow with what you learn"
- ✓ "Lead your HR team with clarity and change your organization"

### Bad headings

- ✗ "Why choose us" (dead — introspective, not customer-focused)
- ✗ "Our features" (list category, not a promise)
- ✗ "Everything you need in one place" ("in one place" is filler)

---

## 3. Three-column grid

### CSS (verified from billfanter.com production)

```css
.help-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* 3 equal cols */
  gap: 16px;                              /* 16 — tight (matches MegaBento grid gap) */
  margin-top: 64px;                       /* 64 from header */
  max-width: 1040px;                      /* cap 1040 within 1180 container — centered variant */
  margin-left: auto;
  margin-right: auto;
}
```

**Why `max-width: 1040px` inside a 1180 container**: the 3-col grid at 1180 makes each card ~380px wide — too spread out. Capping at 1040 gives cards ~336px each, which reads as a tight group instead of three floating billboards.

**Why 16px gap (matching MegaBento)**: card gap discipline across the site. If HelpGrid used 24 and MegaBento used 16, the eye reads them as different systems.

**Why 64px `margin-top` from header (matching Community)**: consistent breathing between section-header and section-grid, everywhere.

### Fallback: 4-column variant (`help-grid-4col-icon`)

If Opus decides to render 4 cards instead of 3 (business has 4 core props), use `grid-template-columns: repeat(4, 1fr)`, drop `max-width: 1040px`, and use full container width.

---

## 4. Individual card

Every card is identical in structure. NOT a link, NOT hoverable (the section is descriptive, not navigable — for a navigable variant see `help-grid-4col-icon-nav`).

### HTML

```html
<div class="help-card">
  <div class="help-card__icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <!-- Icon path(s) — 1-3 <path>/<rect>/<circle> per icon -->
    </svg>
  </div>
  <div class="help-card__title" data-edit-id="helpGrid.cards.N.title">
    {card.title}
  </div>
  <p class="help-card__body" data-edit-id="helpGrid.cards.N.body">
    {card.body}
  </p>
</div>
```

### Card CSS (verified from billfanter.com production)

```css
.help-card {
  position: relative;
  padding: 36px 32px 32px;                /* 36 top / 32 sides / 32 bottom — top slightly larger */
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, rgba(10, 10, 10, 0.08));
  border-radius: 12px;
  transition:
    transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 250ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 16px;                              /* 16 between icon → title → body */
  min-height: 260px;                      /* keeps desktop row even; dropped at tablet down */
}

/* Hover lift ONLY when the card IS a link (<a class="help-card">).
   Static <div> cards (like this section) do NOT hover. */
a.help-card:hover {
  transform: translateY(-3px);
  border-color: rgba(10, 10, 10, 0.16);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
}
```

**Why `padding: 36 32 32` (asymmetric top)**: the icon sits at the top, and the extra 4px of top padding gives the icon breathing room without pushing the title too far down. Symmetric padding would make the icon feel jammed against the border.

**Why `min-height: 260px`**: keeps the 3-card row visually even when card body lengths vary. Without it, longer cards make the row look ragged. Below 980px the min-height drops so cards fit content.

**Why `gap: 16` between icon/title/body**: consistent 16px vertical rhythm inside the card. 16 = one unit of the spacing scale (`4/8/12/16/…`).

**Why NO shadow on resting state**: card is defined by its 1px border only. Adding shadow at rest would make every card feel like it's floating; borders + white bg = flat editorial ledger. Shadow appears only on hover (link variant).

---

## 5. Icon chip

The visual anchor at the top of every card. Solid dark chip, stroked line icon inside.

### CSS (verified from billfanter.com production)

```css
.help-card__icon {
  width: 44px;                            /* 44 — larger than benefits' 36 chip (bigger visual weight) */
  height: 44px;
  border-radius: 10px;                    /* 10 — softer than 8 (benefits), sharper than 12 (cards) */
  background: #0a0a0a;                    /* solid dark — NOT accent color */
  color: #ffffff;                         /* stroke color inherits from currentColor */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.help-card__icon svg {
  width: 22px;                            /* 22 — half the chip size */
  height: 22px;
}
```

**Why 44px chip (vs 36px on benefits)**: the HelpGrid card is a standalone element (no companion screenshot); the icon carries more visual weight. Community's benefit chip is one of five in a compact list; smaller chip keeps the list tight.

**Why 10px radius (vs 8 on benefits chip, 12 on card)**: 8 = ledger stamp, 10 = branded chip, 12 = card. The icon sits between "data point" and "content" — 10 is the middle setting.

**Why solid dark, NOT accent**: SAME reasoning as Community's chips — accent color scattered across icon chips flattens hierarchy. Neutral chips let the h2 above and the individual titles carry.

### Icon path rules

- **Stroke only, 1.8px stroke width** (matches every icon on the site — Feather/Lucide style)
- **1-3 path elements per icon** (never complex illustrations)
- **`stroke-linecap: round`, `stroke-linejoin: round`** (matches DESIGN.md icon rules)
- **Bounded to 24×24 viewBox** (SVG renders at 22×22, so paths have 1px of visual breathing room)
- **NO fills** (stroke-only enforces the editorial look)
- **NO gradients inside the icon** (dark chip + white stroke is enough contrast)
- **NO emoji as fallback**

### Icon vocabulary — 12 canonical icons

Use one from this shortlist unless the concept genuinely doesn't map:

| Concept | Icon paths |
|---|---|
| earnings / money | `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6 12h.01M18 12h.01"/>` |
| chart / trending up | `<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>` |
| growth / mountain | `<path d="m3 20 6-11 4 6 2-3 6 8z"/><path d="M3 20h18"/>` |
| community / people | `<circle cx="9" cy="7" r="4"/><path d="M2 21c0-4 3.6-7 7-7s7 3 7 7"/><circle cx="17" cy="9" r="3"/><path d="M23 21c0-3-2.4-5.5-5-5.5"/>` |
| calendar / schedule | `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>` |
| shield / protection | `<path d="M12 2l9 4v6c0 5-3.7 9.4-9 10-5.3-.6-9-5-9-10V6z"/>` |
| lightning / speed | `<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>` |
| target / focus | `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>` |
| book / learn | `<path d="M4 4h12a4 4 0 0 1 4 4v14"/><path d="M4 4v14"/><path d="M4 18h12a4 4 0 0 1 4 4"/>` |
| toolkit / setup | `<path d="M14.7 6.3 20 11.6l-5.3 5.3-5.3-5.3z"/><path d="M6 14 3 17l4 4 3-3"/>` |
| chat / support | `<path d="M21 12a9 9 0 1 1-3.6-7.2L21 3v6h-6"/>` |
| certificate / credential | `<circle cx="12" cy="8" r="6"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>` |

If the concept doesn't fit any of the above, fall back to a mono-caps letter (e.g. `E` for Earnings) at 22px inside the same 44px dark chip — never fake an illustration.

---

## 6. Title

### CSS (verified from billfanter.com production)

```css
.help-card__title {
  font-family: 'Geist', sans-serif;
  font-size: 16px;                        /* 16 — smaller than Community benefit title (19) */
  font-weight: 600;
  color: var(--text, #0a0a0a);
  letter-spacing: -0.01em;
  margin: 0;
}
```

**Why 16px (matching body size)**: this section's cards are peer-sized elements. Title-vs-body distinction comes from weight (600 vs 400), not size. Feels editorial ledger, not billboard.

**Why NOT bumping to 19-20px like Community benefit titles**: Community has ONE column of benefits (needs internal hierarchy). HelpGrid has THREE parallel cards (each card is its own visual unit). Bumping title bigger would make cards feel like separate mini-headlines.

### Copy writing rules — title

**Character count**: 15-40 characters
**Word count**: 3-6 words
**Structure**: verb-first OR noun-phrase promise
**Voice**: second-person implicit ("Earn X"), never first-person

### Good titles

- ✓ "Earn beyond your paycheck" (real BF — verb + specific)
- ✓ "Trade with independence"
- ✓ "Build long-term wealth"
- ✓ "Ship on your own timeline"

### Bad titles

- ✗ "Financial Freedom" (dead — abstract, no verb)
- ✗ "Amazing Results" (banned)
- ✗ "Value-added services" (corporate filler)

---

## 7. Body

### CSS (verified from billfanter.com production)

```css
.help-card__body {
  font-family: 'Geist', sans-serif;
  font-size: 16px;
  line-height: 1.6;                       /* 1.6 — matches Community body */
  color: var(--text-muted, #565656);
  margin: 0;
}
```

### Copy writing rules — body

**Character count**: 40-100 characters
**Word count**: 8-18 words
**Structure**: ONE sentence unpacking HOW the title's promise gets delivered
**Voice**: second-person, present tense
**Purpose**: prove the title with the concrete mechanism, not a restatement

### Good bodies

- ✓ "Take control of your income and lean less on your 9 to 5." (real BF — concrete mechanism)
- ✓ "Learn to read the options market and trade with a plan, not guesses."
- ✓ "Use proven options trading strategies to grow and keep wealth over time."

### Bad bodies

- ✗ "Discover the future of investing." (banned words + no mechanism)
- ✗ "Take advantage of our comprehensive solution." (dead — no what, no how)
- ✗ "Financial freedom is within reach." (aspirational, not concrete)

---

## 8. Content slot schema — what Opus emits

```typescript
type HelpGridContent = {
  heading: string;                        // 40-70 chars, two-clause promise
  cards: Array<{
    title: string;                        // 15-40 chars, verb-first or noun-phrase
    body: string;                         // 40-100 chars, ONE sentence
    iconPaths: string;                    // SVG inner content — <path>/<rect>/<circle>, stroke only
  }>;                                     // exactly 3 (or exactly 4 for 4col variant)
};
```

## 9. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `heading` | Never — required, error out |
| Fewer than 3 cards | Use `hero-split-media-copy-bento` OR pad to 3 with derived cards from voice_descriptor |
| More than 3 cards | Use `help-grid-4col-icon` variant if exactly 4, or trim to 3 |
| `iconPaths` | Fall back to mono-caps first letter of title (rendered inside the 44px chip at 22px weight 600) |
| `body` on a card | Show title only, card still valid |
| `title` on a card | Drop the card entirely |

---

## 10. Complete assembled HTML (reference implementation)

```html
<section id="help" data-section="help-grid-3col-icon"
  style="background: #ffffff; padding: 100px 40px;">

  <div style="max-width: 1180px; margin: 0 auto;">

    <!-- Centered heading only (no lead) -->
    <div style="max-width: 720px; margin: 0 auto 56px; text-align: center;">
      <h2 data-edit-id="helpGrid.heading"
        style="margin: 0; font-family: 'Geist', sans-serif;
               font-size: clamp(24px, 2.6vw, 36px); line-height: 1.1;
               letter-spacing: -0.025em; font-weight: 500;
               color: var(--text, #0a0a0a);">
        {helpGrid.heading}
      </h2>
    </div>

    <!-- 3-col grid, capped at 1040px, centered -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr);
                gap: 16px; margin: 64px auto 0; max-width: 1040px;">

      <!-- Card 1 -->
      <div style="position: relative; padding: 36px 32px 32px;
                  background: #fff; border: 1px solid rgba(10,10,10,0.08);
                  border-radius: 12px; display: flex; flex-direction: column;
                  gap: 16px; min-height: 260px;">
        <div style="width: 44px; height: 44px; border-radius: 10px;
                    background: #0a0a0a; color: #fff;
                    display: inline-flex; align-items: center; justify-content: center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
            style="width: 22px; height: 22px;">
            {helpGrid.cards.0.iconPaths}
          </svg>
        </div>
        <div data-edit-id="helpGrid.cards.0.title"
          style="font-family: 'Geist', sans-serif; font-size: 16px;
                 font-weight: 600; color: var(--text, #0a0a0a);
                 letter-spacing: -0.01em; margin: 0;">
          {helpGrid.cards.0.title}
        </div>
        <p data-edit-id="helpGrid.cards.0.body"
          style="margin: 0; font-family: 'Geist', sans-serif; font-size: 16px;
                 line-height: 1.6; color: var(--text-muted, #565656);">
          {helpGrid.cards.0.body}
        </p>
      </div>

      <!-- Cards 2 + 3: same structure with different index -->

    </div>
  </div>
</section>
```

---

## 11. Responsive behavior

### Tablet (≤ 980px)

```css
@media (max-width: 980px) {
  .help-grid { grid-template-columns: repeat(2, 1fr); }
  .help-card { min-height: 0; }             /* drop min-height so cards fit content */
}
```

Two columns. Third card wraps to a second row alone (asymmetric — that's fine; better than three cramped 250px cards).

### Mobile heading gap (≤ 767px)

```css
@media (max-width: 767px) {
  .help-grid { margin-top: 0; }              /* drop 64px grid-top-margin — header's 40px is enough */
}
```

### Mobile single column (≤ 540px)

```css
@media (max-width: 540px) {
  .help-grid { grid-template-columns: 1fr; }
}
```

---

## 12. Accessibility checklist

- [x] Cards are `<div>` (NOT `<a>`) — the section is descriptive, not navigable
- [x] Icons have `aria-hidden="true"` implicit via being decorative SVG (or explicit if paranoid)
- [x] Icon color contrast: `#fff` on `#0a0a0a` = 20:1 (AAA)
- [x] Title contrast: `#0a0a0a` on `#fff` = 20:1 (AAA)
- [x] Body contrast: `#565656` on `#fff` = 7.2:1 (AAA)
- [x] `prefers-reduced-motion`: no transition on card (transitions only apply to `a.help-card` hover state)
- [x] Semantic order: header → grid → cards (matches visual order for screen readers)

## 13. Performance checklist

- [x] No images (SVG icons only)
- [x] No JavaScript (fully static)
- [x] No custom fonts loaded here
- [x] SVG icons inline (zero HTTP requests for icon assets)
- [x] No shadows on resting state (cheap render)

## 14. Design token dependencies

```css
:root {
  --font-body: 'Geist', sans-serif;
  --text: #0a0a0a;
  --text-muted: #565656;
  --surface: #ffffff;
  --border: rgba(10, 10, 10, 0.08);
}
```

Hardcoded:
- Card border color `rgba(10, 10, 10, 0.08)`
- Icon chip bg `#0a0a0a`, ink `#ffffff`
- Card bg `#ffffff`

---

## 15. Rationale (why this section converts)

- **3 cards, not 4 or 6** = the rule-of-three sticks in short-term memory. Four+ starts to feel like a menu, not a summary.
- **Header only (no lead)** = the cards ARE the lead. A lead + header + cards is triple-covering the same ground.
- **Icons in dark chips, not accent color** = the accent color is scarce elsewhere; using it here would flatten the h2's authority.
- **Stroke-only icons** = editorial rigor. Filled icons feel app-like; strokes feel print-designed.
- **16px title (not bigger)** = each card is a peer, not a mini-headline. Weight (600 vs 400) does the hierarchy, not size.
- **min-height: 260px** = the row stays even at desktop. Ragged card heights read as unfinished.
- **12px radius on card, 10px on icon chip** = subtle chip-vs-card differentiation. Matching radii would make the icon feel embedded in the card corner; slight difference makes the icon feel like it's SITTING ON the card.
- **Card gap 16px** = tight — 3 cards feel like ONE unit, not 3 separate elements.
- **NO hover on non-link cards** = signaling truth. Hover states promise clickability; using them on non-links betrays the user.
- **`max-width: 1040px` inside 1180 container** = 3 cards at 380px each feel too spread. 336px each feels intentional.

---

## 16. What Opus should NOT do

- ❌ Add a CTA button below the grid — the section is descriptive, not action-oriented
- ❌ Use filled icons — stroke only, 1.8px
- ❌ Use emoji as icons
- ❌ Color the icon chip with the accent color
- ❌ Add hover states to non-link cards
- ❌ Add shadow to resting card state
- ❌ Bump the title above 16px (breaks the peer-card system)
- ❌ Use bold body copy — body is always regular 400
- ❌ Add a "learn more" link inside each card (that's `help-grid-3col-icon-nav`, a different section family)
- ❌ Emit fewer than 3 or more than 4 cards
- ❌ Use `min-height` at tablet+ breakpoints (must drop to 0 or content overflows)
- ❌ Center-align the body text (left-align only)
- ❌ Add background gradient to a card (undermines the flat-editorial ledger look)
- ❌ Use an eyebrow above the h2 (banned this page)
