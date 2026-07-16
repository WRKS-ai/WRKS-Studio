# SECTION — Nav (nav-card-dropdown-overlay)

> **Section family**: `nav-card-dropdown-overlay`
> **Used in**: every page — mounted globally at the top, overlaid on the hero
> **Purpose**: primary site navigation. Distinguishes itself from generic nav bars via a Stripe-style dropdown UX — hovering a top-level label reveals a full-width panel of COLORED CARDS (one per link), with backdrop blur dimming the rest of the page.
> **Position on page**: overlaid at the absolute TOP of the page (`position: absolute`). Does NOT scroll with the page (not sticky). On the homepage it "melts into" the dark hero visually.

---

## 1. Section wrapper — nav container

Nav is NOT a `<section>` inside the page flow. It's an overlay mounted OVER the page content, anchored to the top.

```html
<div class="nav-container is-split">
  <div class="nav-backdrop" aria-hidden="true"></div>
  <nav class="nav">
    <div class="nav-top">…</div>
    <div class="nav-mobile-panel">…</div>
  </nav>
</div>
```

### Container CSS (verified from billfanter.com production)

```css
.nav-container {
  position: absolute;                     /* NOT fixed — scrolls away with the page */
  top: 0;
  left: 0;
  width: 100%;
  z-index: 99;
  box-sizing: border-box;
}

@media (min-width: 769px) {
  /* Homepage variant: nav width matches the hero's copy-column axis */
  .nav-container.is-split {
    width: min(65vw, calc((100vw - 1440px) / 2 + 937px));
  }

  /* Every other page: contained to container width, centered */
  .nav-container:not(.is-split) {
    max-width: var(--container, 1440px);
    left: 0;
    right: 0;
    margin: 0 auto;
  }
}
```

**Why `position: absolute` (NOT `fixed` and NOT `sticky`)**: Bill-Fanter's nav overlays the hero at page top and scrolls away as you scroll. Fixed would keep it visible forever (competing with page content); sticky would introduce a border transition. Absolute overlays cleanly on the hero, then vanishes as you scroll — like a magazine masthead, not a browser toolbar.

**Why `.is-split` on homepage uses the same complex `min(65vw, calc(…))` formula as the hero portrait**: intentional axis alignment. The nav's RIGHT edge lands on the SAME vertical line as the hero portrait's LEFT edge — one continuous visual grid across nav + hero.

**Why `z-index: 99` (not the more common 10 or 50)**: the nav sits above every other element including modal-adjacent overlays but below actual modals (which use 100+). This lets the nav dropdown blur backdrop cover the page without being covered by other page elements.

---

## 2. The blur backdrop (Stripe pattern)

When a dropdown opens, a full-viewport dark scrim + blur effect fades in behind the nav, dimming the rest of the page.

### CSS (verified from billfanter.com production)

```css
.nav-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: 0;
  visibility: hidden;
  background: rgba(10, 10, 10, 0.16);     /* neutral dark tint (NOT blue-tinted) */
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);              /* 5px blur — subtle */
  pointer-events: none;
  transition:
    opacity 0.4s ease,
    visibility 0s linear 0.4s;             /* delay visibility change to end of opacity fade */
}

.nav-container.has-open .nav-backdrop {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity 0.4s ease, visibility 0s;
}
```

**Why 5px blur (not 10 or 20)**: 5px blurs page content just enough to defocus it while keeping it recognizable. 10+ makes the page unreadable which fights the "peek at content behind" reading of the nav dropdown.

**Why `rgba(10, 10, 10, 0.16)` scrim (neutral, not tinted)**: any color tint here would push accent to the WHOLE PAGE. Neutral 16% dims uniformly without imposing a color mood.

**Why 0.4s transition (matches dropdown drawer)**: the backdrop fade-in and the dropdown clip-reveal share timing. They open together — feels like one motion.

---

## 3. The nav bar itself

Fixed 72px height. White background. Full-width.

### CSS (verified from billfanter.com production)

```css
.nav {
  display: block;
  height: 72px;                            /* CANONICAL 72 — every other section pads AROUND this height */
  padding: 0;
  background-color: white;                 /* baseColor prop can override */
  border: 0;
  border-radius: 0;                        /* squared edges (was rounded, changed to flush) */
  box-shadow: none;                        /* NO shadow at rest — appears only when dropdown opens */
  position: relative;
  z-index: 1;                              /* above the backdrop (0) but below dropdown (2) */
  /* NO overflow:hidden — dropdowns must spill below the bar */
}
```

**Why 72px height (not 60 or 80)**: 72 lands on the spacing scale (`4/8/12/16/20/24/32/40/48/64/88`) as a rounded-up 64+8. Tall enough for a 44px logo + 14px vertical padding, short enough not to eat hero real estate.

**Why NO shadow at rest**: the nav overlays a dark hero. A shadow would create a fake border. Shadowless = the bar reads as "the page ends here, hero begins here" without any drawn line.

**Why NO overflow-hidden**: the per-item dropdowns spill BELOW the 72px bar. Overflow-hidden would clip them.

### Inner top bar

```css
.nav-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;          /* logo LEFT, nav CENTER, actions RIGHT */
  padding: 0.7rem 1.25rem;                 /* 11.2px vertical, 20px horizontal */
  z-index: 2;
}
```

---

## 4. Logo — CENTERED (unusual)

Bill-Fanter's logo sits absolutely-centered horizontally, NOT left-aligned like most nav bars.

### CSS (verified from billfanter.com production)

```css
.logo-container {
  display: flex;
  align-items: center;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.nav .logo {
  height: 44px;                            /* fixed 44 — canonical logo height */
  width: auto;
}

@media (min-width: 769px) {
  .logo-container {
    position: static;                      /* left-align on desktop */
    transform: none;
  }
}
```

**Why centered on mobile but left on desktop**: on mobile the bar shows only the logo + hamburger. Centering the logo gives it the visual prominence it needs when there's no other content beside it. On desktop, the logo shares the bar with nav items and actions — left-align lets it anchor the row.

**Why 44px logo height**: 44 is a canonical tap-target size + fits comfortably in a 72px bar with 14px padding each side. Larger logos (56+) make the bar feel top-heavy.

### Logo content rules

- **Format**: SVG preferred (scales, crisp at any DPI). PNG with transparent bg acceptable.
- **Height**: 44px display. Source at 88px @ 2x minimum.
- **Color**: single-color (dark), so the same logo works on light nav (default) and dark hero (behind). Multi-color logos don't work here.
- **Alt**: brand name — `alt="Bill Fanter"`, not `alt="Logo"`

---

## 5. Nav menu — 3 top-level items with dropdown cards

The signature interaction. Three items (Join, Learn, Company). Each opens a full-width panel of colored cards on hover.

### HTML per item

```html
<div class="nav-item">
  <span class="nav-menu-item" tabindex="0">
    Join
    <span class="nav-menu-caret" aria-hidden="true"></span>
  </span>
  <div class="nav-dropdown" role="menu">
    <a class="nav-card" href="/masterclass" role="menuitem"
       aria-label="Join the masterclass"
       style="background-color: #0f1115; color: #fff;">
      <svg class="nav-card-arrow"><!-- up-right arrow --></svg>
      <div class="nav-card-label">Join the masterclass</div>
      <div class="nav-card-desc">6 live sessions, beginner to confident</div>
    </a>
    <a class="nav-card" href="/community" role="menuitem"
       aria-label="Join the community"
       style="background-color: #0f1115; color: #fff;">
      <svg class="nav-card-arrow"></svg>
      <div class="nav-card-label">Join the community</div>
      <div class="nav-card-desc">Live Discord, alerts & 1,000+ traders</div>
    </a>
  </div>
</div>
```

### Menu CSS (verified from billfanter.com production)

```css
.nav-menu {
  display: none;                           /* hidden on mobile */
  align-items: center;
  gap: 0.85rem;                            /* 13.6px between top-level items */
}

@media (min-width: 769px) {
  .nav-menu {
    display: flex;
    margin-left: 1.5rem;                   /* 24px from logo */
    height: 100%;
  }
}
```

**Why gap 0.85rem (13.6px) — wider than usual**: hover targets. Tighter gaps mean the cursor moving between "Join" and "Learn" hits the next item's hover zone accidentally, snapping open a different dropdown mid-scan. 13.6px is wide enough that intent-hover is deliberate.

### Top-level item CSS

```css
.nav-menu-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;                                /* between label text and caret */
  font-size: 15px;
  font-weight: 500;
  color: inherit;                          /* matches menuColor prop */
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.nav-menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);   /* 5% dark tint — subtle hover bg */
}
```

### Caret (arrow-down triangle)

```css
.nav-menu-caret {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid currentColor;
  opacity: 0.5;
  transition: transform 0.25s ease;
}

.nav-item.is-open .nav-menu-caret,
.nav-item:focus-within .nav-menu-caret {
  transform: rotate(180deg);               /* flips up when dropdown open */
}
```

**Why CSS-triangle caret (not SVG)**: 0 HTTP requests, no rendering pipeline overhead. And rotating a border-triangle is cheaper than rotating an SVG.

---

## 6. Dropdown panel — the full-width colored-card drawer

The signature. When a top-level item is hovered, a full-width panel drops down below the bar, revealing colored cards (one per link).

### Dropdown container CSS (verified from billfanter.com production)

```css
.nav-item {
  position: static;                        /* CRITICAL — lets dropdown anchor to .nav-top, not the item */
  display: flex;
  align-items: center;
  height: 100%;
}

.nav-dropdown {
  position: absolute;
  top: 100%;
  margin-top: -2px;                        /* tuck up 2px — panel's white covers bar's bottom edge */
  left: 0;
  right: 0;                                /* span the ENTIRE bar width */
  display: flex;
  gap: 12px;                               /* between cards */
  padding: 12px 1.25rem;                   /* card row insets 20px from nav edges */
  background: #ffffff;
  border: 0;
  border-radius: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
  z-index: 1;
  /* Drawer reveal via clip-path */
  clip-path: inset(0 0 100% 0);            /* fully clipped from bottom (closed) */
  transition:
    clip-path 0.4s cubic-bezier(0.33, 1, 0.68, 1),
    visibility 0s linear 0.4s;
}

.nav-item.is-open .nav-dropdown,
.nav-item:focus-within .nav-dropdown {
  visibility: visible;
  pointer-events: auto;
  z-index: 2;
  clip-path: inset(0 0 0 0);               /* unclipped (open) */
  transition:
    clip-path 0.4s cubic-bezier(0.33, 1, 0.68, 1),
    visibility 0s;
}

/* During SWITCH between items: the closing panel HOLDS open under the opening
   one, then snaps closed → reads as one continuous panel with content swapping */
.nav-container.has-open .nav-dropdown {
  transition: clip-path 0s linear 0.4s, visibility 0s linear 0.4s;
}
```

**Why `clip-path: inset(0 0 100% 0)` instead of `max-height` transition**: the drawer reveals via a rolling clip mask, not a growing container. Clip-path animates smoothly at exact content height (no dead-zone pause). A `max-height` bigger than content forces the browser to interpolate through empty space at the end — creates a visible hang.

**Why the switch state (`.has-open` on parent) holds the closing panel open for 400ms**: prevents flicker. When user moves cursor from Join → Learn, without the hold the Join panel snaps closed → viewport empty for 100ms → Learn panel opens. With the hold, Join stays visible until Learn is fully open, then Join snaps closed.

**Why `margin-top: -2px`**: covers the sub-pixel gap between the bar's bottom edge and the dropdown's top edge that some browsers render. Ensures the visual reads as one continuous white block.

---

## 7. Nav cards inside dropdown

Each link becomes a colored card. Colored bg + card text + up-right arrow. Cards flex to fill the full-width panel.

### CSS (verified from billfanter.com production)

```css
.nav-card {
  position: relative;
  flex: 1 1 0;                             /* equal-width fill */
  min-width: 0;
  min-height: 130px;                       /* fixed minimum — cards feel present */
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(10, 20, 40, 0.16);
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  gap: 6px;
  text-decoration: none;
  color: inherit;                          /* inherits from inline style textColor */
  /* Card slides up + fades in as drawer opens (staggered per-child delay) */
  transform: translateY(24px);
  opacity: 0;
  transition:
    transform 0.4s cubic-bezier(0.33, 1, 0.68, 1),
    opacity 0.36s ease,
    box-shadow 0.25s ease;
}

.nav-item.is-open .nav-card {
  transform: translateY(0);
  opacity: 1;
}

/* Staggered reveal — 2nd and 3rd cards enter slightly after the 1st */
.nav-item.is-open .nav-card:nth-child(2) { transition-delay: 0.07s; }
.nav-item.is-open .nav-card:nth-child(3) { transition-delay: 0.14s; }
```

**Why cards use `flex: 1 1 0`**: equal-width fill. 2 links = 2 cards each 50% wide; 3 links = 3 cards each 33% wide. Natural adaptation to link count.

**Why `min-height: 130px`**: cards feel present. Shorter cards (60-80) read like buttons; 130 feels like actionable content blocks.

**Why cards stagger their reveal (7ms/14ms delays)**: motion signal that this is a designed reveal, not a generic dropdown. The card slide-up matches ReactBits card animation vocabulary.

**Why cards use per-item `bgColor` + `textColor` (inline styles)**: dropdown items can differ per top-level group. All "Join" cards could be dark (`#0f1115` + white text), all "Learn" cards could be brand-color, all "Company" cards could be white with dark ink. Signals category through color.

### Nav card arrow (up-right)

```css
.nav-card-arrow {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 18px;
  opacity: 0.7;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.nav-card:hover .nav-card-arrow {
  opacity: 1;
  transform: translate(2px, -2px);         /* nudges up-right on hover */
}
```

### Nav card label + description

```css
.nav-card-label {
  font-weight: 500;
  font-size: 18px;                         /* 18 — hero of the card */
  letter-spacing: -0.01em;
  line-height: 1.18;
  max-width: 86%;                          /* leaves room for arrow */
}

.nav-card-desc {
  margin-top: auto;                        /* pushes description to bottom */
  font-size: 16px;                         /* 16 — matches body */
  line-height: 1.4;
  opacity: 1;                              /* NOT muted — full color */
}
```

**Why `margin-top: auto` on desc**: pushes description to the bottom of the card, label stays at the top. Creates a visual "anchor top, action bottom" rhythm within each card.

**Why label 18 / desc 16 (both close)**: cards use size to differentiate title from body, but only slightly (2px). Weight (500 vs 400) does the rest. Bigger label (24+) would fight the site h2 hierarchy.

### Card content rules

- **Label**: 4-8 words, verb + object — "Join the masterclass", "Watch free webinar"
- **Description**: 5-10 words describing what/how — "6 live sessions, beginner to confident"
- **Arrow**: ALWAYS present (up-right arrow from `react-icons/go GoArrowUpRight`)
- **Aria label**: full accessible description — "Join the Masterclass"

---

## 8. Right-side actions — Login (optional) + CTA

Right end of the nav. Quiet Login text link + solid Primary CTA button.

### HTML

```html
<div class="nav-actions">
  <a href="{loginHref}" target="_blank" rel="noopener" class="nav-login">
    {loginLabel}
  </a>
  <a href="{buttonHref}" class="btn btn-primary nav-cta">
    {buttonLabel}
  </a>
</div>
```

### CSS (verified from billfanter.com production)

```css
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;                             /* 9.6px between login and CTA */
  height: 100%;
}

@media (min-width: 769px) {
  .nav-actions { margin-left: auto; }     /* push to right end */
}

.nav-login {
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding: 0 0.5rem;
  font-size: 15px;                         /* matches nav menu items */
  font-weight: 500;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}

.nav-login:hover {
  opacity: 0.65;                           /* soften — subtle attention */
}
```

### CTA button — reuses site primary button

```css
.nav-cta {
  padding: 10px 18px;                      /* SMALLER than section CTAs (14/24) — nav must feel light */
  font-size: 14px;                         /* 14 — smaller than nav menu items to signal "quick action" */
}
```

**Why nav CTA is smaller than section CTAs**: nav is chrome, not content. Section CTAs (14/24, 16px) are page anchors. Nav CTA (10/18, 14px) is a quick-jump. If they were the same size, the nav would feel content-heavy.

**Why nav CTA uses same primary button treatment**: consistency. The same solid `#0a0a0a` pill everywhere on the site = one action language. Different treatment here would fragment the visual system.

### Copy writing rules — CTA label

**Character count**: 8-16 characters
**Word count**: 2-3 words
**Structure**: verb-first primary action for the site

- ✓ "Get the masterclass" (primary offer of the site)
- ✓ "Book a call"
- ✓ "Start free trial"
- ✗ "Learn more" (dead + wrong for nav CTA)

---

## 9. Hamburger — mobile menu toggle

Left-side stacked lines that morph into an X when open. Only appears on mobile.

### CSS (verified from billfanter.com production)

```css
.hamburger-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  gap: 6px;                                /* between the two lines */
}

.hamburger-menu:hover .hamburger-line {
  opacity: 0.75;
}

.hamburger-line {
  width: 30px;
  height: 2px;
  background-color: currentColor;
  transition:
    transform 0.25s ease,
    opacity 0.2s ease;
  transform-origin: 50% 50%;
}

/* X state when open */
.hamburger-menu.open .hamburger-line:first-child {
  transform: translateY(4px) rotate(45deg);
}

.hamburger-menu.open .hamburger-line:last-child {
  transform: translateY(-4px) rotate(-45deg);
}

@media (min-width: 769px) {
  .hamburger-menu { display: none; }
}
```

**Why 2 lines (not 3)**: 3-line hamburger is the internet default and reads generic. 2 lines is quieter, more editorial. The morph-to-X still works because the two lines rotate 45°/−45° and cross.

**Why `width: 30px` per line**: 30 hits a tap-target-adjacent size (the outer container is larger). Wider than 24 (feels too small), narrower than 40 (feels too wide).

**Why `translateY ± 4px` in the X state**: the two lines start 6px apart (gap). Moving them 4px each toward center brings them to the same y-position, then rotating 45° each direction creates the X. Exact translate value is `gap / 2 + line_height / 2 = 3 + 1 = 4`.

---

## 10. Mobile panel — full-screen overlay

When hamburger tapped, a full-screen panel slides in showing every group + link stacked.

### HTML

```html
<div class="nav-mobile-panel">
  <div class="nav-mobile-group">
    <div class="nav-mobile-grouplabel">Join</div>
    <a class="nav-mobile-link" href="/masterclass">Join the masterclass</a>
    <a class="nav-mobile-link" href="/community">Join the community</a>
  </div>
  <!-- More groups -->
  <a class="nav-mobile-cta" href="{buttonHref}">{buttonLabel}</a>
</div>
```

### CSS

```css
.nav-mobile-panel {
  display: none;
  position: fixed;
  inset: 0;
  padding: 88px 24px 24px;                /* 88 top to clear the nav bar */
  background: #ffffff;
  overflow-y: auto;
  z-index: 3;                             /* above nav bar */
}

.nav-mobile-panel.open {
  display: block;
}

.nav-mobile-group {
  padding: 20px 0;
  border-top: 1px solid rgba(10, 10, 10, 0.08);
}

.nav-mobile-group:first-child {
  border-top: 0;
  padding-top: 0;
}

.nav-mobile-grouplabel {
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted, #565656);
  margin-bottom: 12px;
}

.nav-mobile-link {
  display: block;
  padding: 12px 0;
  font-family: 'Geist', sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: var(--text, #0a0a0a);
  text-decoration: none;
}

.nav-mobile-cta {
  display: block;
  margin-top: 40px;
  padding: 16px 24px;
  background: #0a0a0a;
  color: #ffffff;
  border-radius: 999px;
  font-family: 'Geist', sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
}
```

### Body scroll lock behavior

When the mobile panel is open, page body scroll must be disabled:

```javascript
document.body.style.overflow = isHamburgerOpen ? 'hidden' : '';
```

Prevents the page behind from scrolling while the panel is open.

---

## 11. Content slot schema — what Opus emits

```typescript
type NavContent = {
  logo: {
    src: string;                          // SVG or PNG URL
    alt: string;                          // brand name
    href: string;                         // typically '/'
  };
  items: Array<{                          // MAX 3 top-level items
    label: string;                        // 4-7 chars ("Join", "Learn", "Company")
    bgColor: string;                      // card bg — typically dark #0f1115 or brand hue
    textColor: string;                    // card text — typically #ffffff
    links: Array<{                        // 2-4 links per group
      label: string;                      // 4-8 words
      desc?: string;                      // 5-10 words, optional
      href: string;
      ariaLabel: string;                  // full accessible description
    }>;
  }>;
  buttonLabel: string;                    // primary CTA label — 8-16 chars
  buttonHref: string;                     // CTA destination
  loginLabel?: string;                    // optional login link
  loginHref?: string;                     // login destination
  baseColor?: string;                     // nav bg color — default '#ffffff'
  menuColor?: string;                     // nav item text color — default '#000'
  variant?: 'split' | 'contained';        // 'split' for homepage, 'contained' for other pages
};
```

## 12. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `items` has 0 | Render nav with only logo + CTA (no dropdown menu) |
| `items` has 4+ | Slice to first 3 (JSX enforces `items.slice(0, 3)`) |
| A group has 0 `links` | Skip that top-level item (empty dropdown = broken) |
| Link `desc` missing | Card renders label only, no description line |
| `loginLabel` missing | Skip the login link, CTA sits alone in actions |
| `logo.src` missing | Fall back to brand name in `Geist` bold 20px |
| `buttonLabel` missing | Fall back to "Get started" — but log warning |
| `variant` missing | Default to `'contained'` (safer than `'split'`) |

---

## 13. Complete assembled HTML (reference implementation — server-rendered baseline)

```html
<div class="nav-container is-split">
  <div class="nav-backdrop" aria-hidden="true"></div>

  <nav class="nav" style="background-color: #ffffff;">

    <div class="nav-top">

      <!-- Left: Hamburger (mobile) + Logo -->
      <div class="hamburger-menu" role="button" aria-label="Open menu" tabindex="0">
        <div class="hamburger-line"></div>
        <div class="hamburger-line"></div>
      </div>

      <a class="logo-container" href="/" aria-label="Bill Fanter, home">
        <img src="{logo.src}" alt="{logo.alt}" class="logo" />
      </a>

      <!-- Center: Top-level nav items (desktop) -->
      <div class="nav-menu" style="color: #000;">
        <!-- Repeat per item (max 3) -->
        <div class="nav-item">
          <span class="nav-menu-item" tabindex="0">
            {item.label}
            <span class="nav-menu-caret" aria-hidden="true"></span>
          </span>
          <div class="nav-dropdown" role="menu">
            <!-- Repeat per link -->
            <a class="nav-card" href="{link.href}" role="menuitem"
               aria-label="{link.ariaLabel}"
               style="background-color: {item.bgColor}; color: {item.textColor};">
              <svg class="nav-card-arrow" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H8M17 7v9"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="nav-card-label">{link.label}</div>
              <div class="nav-card-desc">{link.desc}</div>
            </a>
          </div>
        </div>
      </div>

      <!-- Right: Login + CTA -->
      <div class="nav-actions">
        <a href="{loginHref}" target="_blank" rel="noopener" class="nav-login"
           style="color: #000;">
          {loginLabel}
        </a>
        <a href="{buttonHref}" class="btn btn-primary nav-cta">
          {buttonLabel}
        </a>
      </div>

    </div>

    <!-- Mobile panel (hidden on desktop) -->
    <div class="nav-mobile-panel">
      <!-- Groups + links + CTA — see §10 -->
    </div>

  </nav>
</div>
```

Full JavaScript interactivity (dropdown open/close, hamburger toggle, focus management, body scroll lock) requires the CardNav React component OR equivalent vanilla JS. This blueprint documents the visual + behavioral spec — the JS is a shared build artifact, not per-generation.

---

## 14. Interactive behaviors — full summary

| Trigger | Effect |
|---|---|
| Cursor enters top-level item | Its dropdown opens immediately (`openIdx = idx`) |
| Cursor leaves nav entirely | Close scheduled with 220ms delay (prevents accidental close on gap crossing) |
| Cursor moves within nav | Any pending close is cancelled |
| Cursor moves between items | Old panel HOLDS OPEN until new panel is fully in, then old snaps closed (400ms transition) |
| Focus lands on top-level item (tab) | Dropdown opens (`:focus-within`) |
| Focus leaves the item (tab away) | Dropdown closes |
| Hamburger tap (mobile) | Mobile panel opens + body scroll locks |
| Hamburger tap again | Panel closes + body scroll unlocks |
| Escape key | Closes any open dropdown OR mobile panel |
| Backdrop click (dropdown open) | Closes the dropdown |
| Card click | Navigate to `href` (link, not JS handler) |
| prefers-reduced-motion | Disable clip-path drawer + card stagger + hover transforms |

---

## 15. Responsive behavior

### Mobile (≤ 768px)

- Logo centered horizontally
- Hamburger on the LEFT
- Nav menu (top-level items) HIDDEN — only accessible via mobile panel
- Login + CTA HIDDEN in the bar — appear inside the mobile panel

### Desktop (≥ 769px)

- Hamburger HIDDEN
- Logo left-aligned (position: static)
- Nav menu visible in center
- Login + CTA visible on the right

---

## 16. Accessibility checklist

- [x] Hamburger has `role="button"`, `tabindex="0"`, `aria-label` (that toggles between "Open menu" and "Close menu")
- [x] Logo link has `aria-label` including brand name + ", home"
- [x] Nav items have `tabindex="0"` — keyboard-focusable
- [x] Nav item span uses `onFocus` to open dropdown — keyboard-accessible
- [x] Each dropdown has `role="menu"`
- [x] Each card link has `role="menuitem"` + `aria-label`
- [x] `:focus-within` on nav item opens the dropdown (keyboard equivalent of hover)
- [x] Backdrop has `aria-hidden="true"` (decorative)
- [x] Login link has `target="_blank" rel="noopener"` (external)
- [x] Escape key closes open dropdown (handled by shared JS)
- [x] Body scroll locked when mobile panel open (`document.body.style.overflow = 'hidden'`)
- [x] Color contrast: dark text on white nav = 20:1 (AAA)
- [x] Card text on dark card: `#fff` on `#0f1115` = 19:1 (AAA)
- [x] `prefers-reduced-motion`: disable clip-path drawer, disable card stagger, disable hover transforms

## 17. Performance checklist

- [x] Nav CSS-only baseline (dropdowns work without JS via `:focus-within`)
- [x] Backdrop uses `backdrop-filter: blur(5px)` — cheap for a full-viewport element
- [x] Card reveal uses `transform` + `opacity` only (GPU-composited)
- [x] Clip-path animation uses cubic-bezier (no JS interpolation)
- [x] Logo image `height` fixed (no layout shift as image loads)
- [x] Mobile panel scroll-lock uses `body.style.overflow` (no CSS class toggle overhead)
- [x] Hamburger lines use `transform` only (no width/height animation)

## 18. Design token dependencies

```css
:root {
  --font-body: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
  --text: #0a0a0a;
  --text-muted: #565656;
  --container: 1440px;                    /* wider than page container (1180) — nav can breathe on wide monitors */
}
```

Hardcoded (structural):
- `72px` nav height (canonical)
- `44px` logo height
- `#ffffff` (default nav bg)
- `rgba(10, 10, 10, 0.16)` (backdrop scrim)
- `5px` backdrop blur
- `0f1115` (default card bg — a slightly-lighter black than pure `#0a0a0a`, creates layered depth against the white nav)
- `0.4s` (canonical drawer transition — matches backdrop fade)

---

## 19. Rationale (why this nav wins)

- **Colored cards inside dropdown (not text-list dropdown)** = signature move. Every other site's nav dropdown is a text menu. Cards force each link to be a MOMENT — visually weighted, category-colored, individually promotable. Category-colored bg makes the group's identity visible.
- **Stripe-style backdrop blur** = focuses attention. Standard dropdowns compete with page content behind them; the blur removes the competition, letting the nav become momentarily primary.
- **Full-width panel (not per-item small panels)** = one visual system. Each item's dropdown occupies the same space, holding open during switch → reads as ONE panel with content swapping, not three separate popovers.
- **Clip-path drawer (not max-height)** = eliminates the dead-zone hang bug. Clip-path animates the visible mask at exact content height; max-height overshoots and creates a visible pause at the end.
- **Cards stagger their reveal (7ms/14ms)** = motion signal. Uniform simultaneous appear reads as an application; staggered reveal reads as designed content.
- **Nav overlays hero (not sits above it)** = magazine masthead pattern. The nav becomes part of the hero's visual — not a separate browser toolbar.
- **`.is-split` axis alignment on homepage** = the nav's right edge sits on the SAME vertical line as the hero's portrait left edge. One continuous grid. Nobody consciously notices; the whole page feels tighter.
- **72px height (canonical)** = tall enough for a 44px logo + padding, short enough not to eat hero real estate. Matches the design system's spacing scale.
- **NO shadow at rest, shadow only when dropdown opens** = the nav is quiet when the reader is scrolling content, present when the reader is interacting with it. Behavioral shadow, not decorative shadow.
- **13.6px gap between top-level items** = deliberately wider than usual. Prevents accidental hover on the next item mid-scan.
- **CSS-triangle caret (not SVG)** = 0 HTTP requests, cheap rotate animation, matches editorial minimalism.
- **Nav CTA is SMALLER than section CTAs** = nav is chrome, not content. Different scale enforces the hierarchy.
- **Body scroll lock during mobile panel** = users can't accidentally scroll page behind the panel. Critical for mobile UX.
- **2-line hamburger (not 3)** = quieter, more editorial. The morph-to-X still works with 2 lines.
- **220ms close delay** = accommodates cursor gap crossing. Without it, moving from item label DOWN to the panel snaps the panel shut mid-motion.

---

## 20. What Opus should NOT do

- ❌ Use `position: fixed` on the nav (must be absolute — nav scrolls away with page)
- ❌ Use `position: sticky` (creates browser-toolbar behavior)
- ❌ Emit more than 3 top-level items (JSX enforces `.slice(0, 3)`; 4+ = generic nav feel)
- ❌ Emit dropdown as a text-list (must be colored cards)
- ❌ Use `max-height` transition for dropdown reveal (must be clip-path)
- ❌ Skip the backdrop blur (removes the Stripe-focus signal)
- ❌ Skip the switch-hold behavior (produces flicker between items)
- ❌ Use a shadow on the nav at rest (must be shadowless — appears only on dropdown open)
- ❌ Use rounded corners on the nav bar (must be squared — flush block)
- ❌ Make nav CTA the same size as section CTAs (must be smaller: 10/18 padding, 14px font)
- ❌ Use `overflow: hidden` on the `.nav` element (kills the dropdown spill)
- ❌ Add a search input to the nav (that's `nav-with-search`, a different family)
- ❌ Add sub-menus inside dropdown cards (2-level hierarchy only)
- ❌ Use 3-line hamburger
- ❌ Skip body scroll lock when mobile panel opens
- ❌ Use accent color on the nav bar background (must be neutral — white default, or brand's own header bg if strongly light/dark)
- ❌ Add a "Sign in with Google" button inline (that's a settings-page concern)
- ❌ Add a currency/language selector to the nav (adds cognitive load; use footer instead)
- ❌ Emit the dropdown as `<details>`/`<summary>` (loses the drawer animation)
