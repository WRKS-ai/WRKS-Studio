# SECTION — YoutubeCta (social-cta-dark-card-with-reel)

> **Section family**: `social-cta-dark-card-with-reel`
> **Used in**: personal-brand/home (position 9), or any page pointing to an external social platform
> **Purpose**: single-purpose card driving visitors to an external content platform (YouTube channel, Instagram, TikTok, LinkedIn). Not for internal navigation — external only. The "if you want more of me, here" moment.
> **Position on page**: near the end of the page, after Reviews and before the founder story. A quieter conversion beat — this isn't a product CTA, it's a "keep me in your life" invite.

---

## 1. Section wrapper

```html
<section id="youtube-cta" data-section="social-cta-dark-card-with-reel">
  <div class="container">
    <div class="darkcta darkcta--black">
      <div class="darkcta__grid">
        <div class="darkcta__copy">…</div>
        <div class="darkcta__media" aria-hidden="true">…</div>
      </div>
    </div>
  </div>
</section>
```

### Wrapper dimensions (verified against billfanter.com production 2026-07-17)

| Property | Value | Notes |
|---|---|---|
| Section `background` | `transparent` or inherits from page | the card carries visual weight |
| Section `padding` | `100px 40px` desktop / `80px 24px` mobile | standard rhythm |
| Container `max-width` | `1180px` | |

The section itself is neutral — the card is where the section lives.

---

## 2. The dark card — full-bleed container

Black card with rounded corners. Full container width. Padding-heavy so the two-column split has room to breathe.

### CSS (verified from billfanter.com production, `.bf-darkcta.bf-darkcta--black`)

```css
.darkcta--black {
  position: relative;
  isolation: isolate;
  background: #0a0a0a;                    /* solid dark — differentiates from gradient variants */
  border-radius: var(--radius-lg, 20px);
  padding: 48px;                          /* 48 — smaller than the gradient variant's 72 */
  overflow: hidden;                       /* clips the reel that bleeds below the gradient square */
  color: #ffffff;
}

@media (max-width: 980px) {
  .darkcta--black {
    padding: 32px 24px;                   /* tighter on mobile */
  }
}
```

**Why the card is BLACK (not gradient like other dark CTAs)**: the gradient carries INSIDE the card as the small square behind the reel. Putting the gradient on the OUTER card would compete with the interior gradient card — accent stacked on accent. Black outside + gradient inside = "the gradient is a spotlight inside the section," which reads more premium.

**Why `padding: 48px` (not the 72 used in gradient dark CTAs)**: this variant has a smaller gradient card inside (aspect 1/1) so the outer padding can be tighter — 48 keeps the copy + gradient card visually anchored.

**Why `overflow: hidden`**: the vertical reel BLEEDS past the gradient card's bottom edge (like a device sitting BEHIND the card panel). The outer card's overflow-hidden crops that bleed cleanly to the card's rounded corners.

---

## 3. Two-column grid — copy LEFT, media RIGHT

### CSS (verified from billfanter.com production)

```css
.darkcta__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;         /* 50/50 exactly */
  gap: 48px;
  align-items: center;                    /* vertically centered — copy stack vs 1:1 media */
}

@media (max-width: 980px) {
  .darkcta__grid {
    grid-template-columns: 1fr;           /* stack */
    gap: 48px;                            /* keep 48 vertical gap when stacked */
  }
}
```

**Why 50/50 (not 60/40 favoring copy)**: this section is BOTH copy AND visual proof of the channel. Equal weight treats them as peers. Copy-heavy split would make the reel feel like decoration.

**Why `align-items: center` (not stretch or start)**: the copy stack is ~200px, the media square is 380px — center-aligning both means the copy sits at the media's midpoint. Top-align would leave the copy floating in the upper half.

---

## 4. Copy column — LEFT

Heading + lead + single CTA. Standard hero-block structure, dark-bg variant.

### HTML

```html
<div class="darkcta__copy">
  <h2 class="darkcta__h2" data-edit-id="youtubeCta.heading">
    {youtubeCta.heading}
  </h2>
  <p class="darkcta__lead" data-edit-id="youtubeCta.lead">
    {youtubeCta.lead}
  </p>
  <div class="darkcta__buttons">
    <a class="darkcta__btn"
       href="{youtubeCta.cta.href}"
       target="{youtubeCta.cta.target}"
       rel="{youtubeCta.cta.target ? 'noopener' : undefined}"
       data-edit-id="youtubeCta.cta">
      <span class="darkcta__btn-icon">
        <!-- Platform icon (YouTube, Instagram, TikTok, etc.) — see §6 -->
      </span>
      {youtubeCta.cta.label}
    </a>
  </div>
</div>
```

### Headline CSS (verified from billfanter.com production)

```css
.darkcta__h2 {
  font-family: 'Geist', sans-serif;
  font-size: clamp(24px, 2.6vw, 36px);    /* section-h2 scale */
  line-height: 1.1;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: #ffffff;
  max-width: 600px;                       /* wraps at ~600 in the ~380-460px column */
  margin: 0;
}
```

### Copy writing rules — heading

**Character count**: 30-65 characters
**Word count**: 6-12 words
**Structure**: "[verb] [content type] on my [platform]" OR "[verb] my [platform] for [what]"
**Voice**: second-person imperative, first-person possessive ("my channel", "my newsletter")

### Good headings

- ✓ "Get options trading insights on my YouTube channel" (real BF — verb + specific + possessive + platform)
- ✓ "Follow my Instagram for daily HR frameworks"
- ✓ "Subscribe to my newsletter, one email per week"
- ✓ "Watch every build on my TikTok"

### Bad headings

- ✗ "Follow us on social media" (generic — no specific platform, dead)
- ✗ "Check out our YouTube channel" (dead — "check out" is filler)
- ✗ "Stay connected!" (banned exclamation + generic)
- ✗ "Don't miss our latest videos" (negative framing weakens)

### Lead CSS (verified from billfanter.com production)

```css
.darkcta__lead {
  font-family: 'Geist', sans-serif;
  margin-top: 18px;                       /* 18 — TIGHTER than other lead rhythms (36 default). See below */
  color: #ffffff;                         /* pure white — max contrast on dark */
  font-size: 16px;
  line-height: 1.6;
  max-width: 520px;
  margin-bottom: 0;
}
```

**Why 18px margin-top (not 36 like other dark CTAs)**: this variant has less vertical space (aspect 1/1 media instead of 5/4). Tighter h2→lead rhythm keeps the copy block from stretching taller than the square media beside it.

**Why full white body (not muted 85%)**: DESIGN.md rule — dark backgrounds get pure-white body text for max legibility. Muting to 85% on dark reads as disclaimer text; on light it reads as "supporting."

### Copy writing rules — lead

**Character count**: 100-200 characters
**Word count**: 18-35 words
**Structure**: 1-2 sentences describing WHAT's on the platform + CADENCE
**Voice**: second-person, present tense
**Purpose**: preview the content pipeline — what they'll get if they follow

### Good leads

- ✓ "Watch free breakdowns of real trades, market setups, and options trading strategies. Subscribe to learn something new each week." (real BF — what + cadence)
- ✓ "One 5-minute HR framework every Monday morning. Real problems, real solutions, no fluff."
- ✓ "Behind-the-scenes builds, product decisions, and design reviews — twice a week."

### Bad leads

- ✗ "Subscribe for exclusive content." (banned + vague)
- ✗ "Join our community of like-minded professionals." (dead)
- ✗ "Discover amazing videos on our channel." (banned words)

---

## 5. CTA button — the ONE action

### Buttons wrapper CSS (verified from billfanter.com production)

```css
.darkcta__buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 26px;                       /* 26 to lead — matches the tight variant rhythm */
}
```

**Why margin-top 26 (not 36)**: same reasoning as the lead — this variant compresses vertical rhythm to match the 1:1 media proportion.

### Primary button CSS (verified from billfanter.com production)

```css
.darkcta__btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;                     /* 14v/22h — slightly tighter than hero CTA (14/26) */
  background: #ffffff;                    /* white pill on dark — max pop */
  color: #0a0a0a;
  border-radius: 999px;
  font-family: 'Geist', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.005em;
  text-decoration: none;
  transition:
    transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.darkcta__btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(255, 255, 255, 0.12); /* white-tinted lift shadow — glows on dark */
}
```

### Button icon CSS

```css
.darkcta__btn-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

**Why white-tinted shadow on dark card**: dark shadows disappear on a dark bg. Using a white-tinted shadow at 12% opacity creates a subtle glow around the button on hover — reads as "the button is lifting toward you" rather than "the button is disappearing into shadow."

**Why single CTA (not primary + ghost secondary)**: this section is ONE action — go to the external platform. A secondary CTA ("see all videos" inside the card) would dilute the primary. The reel preview on the right IS the visual secondary.

### Platform-specific icon SVGs

| Platform | Icon path (inside `<svg viewBox="0 0 24 24" fill="currentColor">`) |
|---|---|
| YouTube | `<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>` |
| Instagram | Use official IG glyph (stroke-only version at 1.8px) |
| TikTok | Use official TT glyph |
| LinkedIn | Use official LI glyph |
| Twitter/X | Use X glyph (single stroke) |

**Why platform's OFFICIAL logo (not a generic play icon)**: recognition. YouTube's play button in white on a red card = universal signal. Generic play icon reads as "some video" not "the YouTube channel." Use the platform's brand mark.

**Copyright note**: platform logos are trademarked. Using them for "follow us on X" links is fair use (nominative), but never modify colors/shape.

### Copy writing rules — CTA label

**Character count**: 12-24 characters
**Word count**: 2-4 words
**Structure**: verb-first + platform name

### Good labels

- ✓ "Watch on YouTube" (real BF)
- ✓ "Follow on Instagram"
- ✓ "Subscribe on YouTube"
- ✓ "Follow on TikTok"

### Bad labels

- ✗ "Learn more" (dead + no platform)
- ✗ "Click here" (dead)
- ✗ "Visit our channel" (dead — "visit" is passive, no verb-action)

---

## 6. Media column — RIGHT (gradient card + reel behind)

The visual anchor. A small square gradient card with a vertical video reel sitting BEHIND it (bleeding past the top and bottom edges).

### HTML

```html
<div class="darkcta__media" aria-hidden="true">
  <div class="darkcta__grain-card">
    <div class="grainient-mount"
         data-grainient="youtube"
         data-color1="#FF8308"
         data-color2="#EF4444"
         data-color3="#6B3BD5"></div>
    <div class="darkcta__reel">
      <img src="{youtubeCta.channelImage.src}"
           alt="{youtubeCta.channelImage.alt}"
           loading="lazy" />
    </div>
  </div>
</div>
```

### Media wrapper CSS (verified from billfanter.com production)

```css
.darkcta--black .darkcta__media {
  position: relative;
  aspect-ratio: 1 / 1;                    /* square — 1:1 (differs from gradient variant's 5:4) */
  overflow: visible;                      /* reel bleeds past bottom */
  width: 100%;
  max-width: 440px;                       /* Bill-Fanter override — larger than the default 380 */
  margin-left: auto;
  margin-right: 0;                        /* right-align inside its column */
}

@media (max-width: 980px) {
  .darkcta--black .darkcta__media {
    aspect-ratio: 16 / 11;                /* wider ratio on stacked mobile */
    margin-left: auto;
    margin-right: auto;                   /* center when stacked */
  }
}
```

**Why 1:1 aspect (square)**: signals "app store card." Rectangular media would read as a video or product screenshot. Square = branded destination card.

**Why `max-width: 440` (Bill-Fanter's scoped override, larger than default 380)**: at the default 380, the channel preview reads slightly small next to the copy column. 440 pushes it to visual peer weight. This override is per-brand tunable.

**Why `margin-right: 0` (right-align inside column)**: matches the copy hugging LEFT in its column. Both anchor to their column's outer edge, creating symmetric outer weight.

**Why `overflow: visible` (unusual)**: the reel bleeds past the gradient card's bottom edge (by ~4-12% depending on breakpoint). Overflow-hidden on media would clip that bleed and lose the "device sitting behind panel" effect.

### Gradient card CSS (verified from billfanter.com production)

```css
.darkcta--black .darkcta__grain-card {
  position: absolute;
  inset: 0;
  border-radius: 12px;                    /* card radius — smaller than outer card's 20 */
  overflow: hidden;                       /* clips the grainient to the square */
}

.darkcta--black .darkcta__media .grainient-mount {
  display: block;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  /* Fallback CSS gradient — always visible before grainient JS mounts */
  background: linear-gradient(
    135deg,
    #FF8308 0%,
    #EF4444 45%,
    #6B3BD5 100%
  );
}
```

**Why gradient-card radius 12px, not the outer 20px**: creates a stepped look — outer card (20) contains the smaller gradient card (12). Same-radius nesting looks like one shape; different radii make the interior card feel like a distinct object.

### Reel (device) CSS (verified from billfanter.com production)

```css
.darkcta--black .darkcta__reel {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 12%;                               /* BF override: was 16%, pushed to 12% for the larger card */
  height: 92%;                            /* BF override: was 88%, matches 12% top */
  aspect-ratio: 9 / 16;                   /* vertical device — 9:16 mobile */
  max-width: 62%;                         /* BF override: was 56%, larger for the 440 card */
  border-radius: 8px 8px 0 0;             /* rounded top only — bottom cropped by outer card */
  overflow: hidden;
  background: #000000;                    /* black backing while img loads */
  z-index: 1;                             /* above gradient card */
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5); /* deep shadow — reel FLOATS above the gradient */
}

.darkcta--black .darkcta__reel iframe,
.darkcta--black .darkcta__reel img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  object-fit: cover;
}

@media (max-width: 980px) {
  .darkcta--black .darkcta__reel {
    top: 12%;
    height: 92%;
    max-width: 42%;                       /* smaller on mobile stack */
  }
}
```

**Why radius `8px 8px 0 0` (top only)**: the reel represents a mobile device with a screen. Devices are rounded on all corners, BUT the bottom of the device runs past the gradient card's edge (via the outer card's `overflow: hidden`). Rounded bottom corners here would be cropped and look weird. Sharp bottom + rounded top = "device sitting behind panel, cropped at panel's bottom edge."

**Why deep dark shadow `rgba(0, 0, 0, 0.5)` (not cool-tinted)**: the reel sits on a bright gradient card. A cool-tinted shadow (like Watchlist's) would clash with the warm gradient. Pure dark shadow reads as depth without color.

**Why `max-width: 62%` (not 100%)**: the reel is smaller than the gradient card, so gradient shows on both sides. If the reel filled the card, the gradient (the accent moment) would disappear. 62% width means ~19% gradient on each side.

### Media content rules

- **channelImage.src**: WebP or AVIF, min 480×854 (9:16 aspect)
- **Content**: a rendered screenshot of the platform's UI showing the founder's channel — YouTube channel homepage, Instagram profile, TikTok profile, etc.
- **Alt**: describes what platform + whose profile — "Bill Fanter's YouTube channel"
- **Fallback**: if no screenshot, use the platform's official brand card layout (see §7)

### Optional: autoplay reel iframe (instead of static img)

Replace the `<img>` with an iframe embedding a short vertical reel:

```html
<iframe
  src="https://www.youtube.com/embed/{shortId}?autoplay=1&mute=1&loop=1&controls=0&playlist={shortId}&modestbranding=1&rel=0"
  allow="autoplay; encrypted-media"
  title="Latest YouTube short"
  loading="lazy"></iframe>
```

Applies same CSS as the img. Iframe styling matches (absolute inset:0 width/height 100%).

---

## 7. Fallback for missing channel screenshot

If the brand doesn't have a rendered platform screenshot:

```html
<div class="darkcta__reel darkcta__reel--placeholder">
  <div class="placeholder-content">
    <!-- Platform icon -->
    <svg class="placeholder-icon" viewBox="0 0 24 24">…</svg>
    <div class="placeholder-handle">@{brand.handle}</div>
    <div class="placeholder-metric">{brand.followers} followers</div>
  </div>
</div>
```

Show the platform icon + brand handle + follower count centered on the reel. Feels intentional (like an artist's Spotify card), never "missing image."

---

## 8. Content slot schema — what Opus emits

```typescript
type YoutubeCtaContent = {
  heading: string;                        // 30-65 chars
  lead: string;                           // 100-200 chars
  cta: {
    label: string;                        // 12-24 chars, verb + platform
    href: string;                         // external URL to platform channel
    target: '_blank';                     // always _blank for external
  };
  platform: 'youtube' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter';
  channelImage: {
    src: string;                          // WebP, min 480×854 (9:16)
    alt: string;                          // "Founder Name's Platform"
  } | null;
  handle?: string;                        // used for fallback placeholder
  followers?: string;                     // "12.5K", "1.2M" — used for fallback placeholder
  gradient?: {                            // override default brand gradient
    hex1: string;
    hex2: string;
    hex3: string;
  };
};
```

## 9. Fallbacks — what to render when data is missing

| Missing slot | Fallback |
|---|---|
| `channelImage.src` | Use placeholder card (§7) with platform icon + handle + follower count |
| `handle` (and no image) | Skip handle, show icon + follower count only |
| `followers` (and no image) | Skip metric, show icon + handle only |
| Both `handle` + `followers` missing (and no image) | Show large platform icon centered — feels like a channel identity card |
| `platform` unknown | Fall back to generic play icon in the button |
| `gradient` | Derive from brand palette; default to `#FF8308 → #EF4444 → #6B3BD5` |
| `heading` | Never — required, error out |
| `cta.href` | Never — required, error out |

---

## 10. Complete assembled HTML (reference implementation)

```html
<section id="youtube-cta" data-section="social-cta-dark-card-with-reel"
  style="padding: 100px 40px;">

  <div style="max-width: 1180px; margin: 0 auto;">

    <div style="position: relative; isolation: isolate; background: #0a0a0a;
                border-radius: 20px; padding: 48px; overflow: hidden;
                color: #fff;">

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px;
                  align-items: center;">

        <!-- LEFT: copy -->
        <div>
          <h2 data-edit-id="youtubeCta.heading"
            style="margin: 0; font-family: 'Geist', sans-serif;
                   font-size: clamp(24px, 2.6vw, 36px); line-height: 1.1;
                   font-weight: 500; letter-spacing: -0.025em;
                   color: #fff; max-width: 600px;">
            {youtubeCta.heading}
          </h2>

          <p data-edit-id="youtubeCta.lead"
            style="margin: 18px 0 0; font-family: 'Geist', sans-serif;
                   color: #fff; font-size: 16px; line-height: 1.6;
                   max-width: 520px;">
            {youtubeCta.lead}
          </p>

          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px;">
            <a href="{youtubeCta.cta.href}" target="_blank" rel="noopener"
              data-edit-id="youtubeCta.cta"
              style="display: inline-flex; align-items: center; gap: 10px;
                     padding: 14px 22px; background: #fff; color: #0a0a0a;
                     border-radius: 999px; font-family: 'Geist', sans-serif;
                     font-size: 16px; font-weight: 600; letter-spacing: -0.005em;
                     text-decoration: none;
                     transition: transform 200ms cubic-bezier(.4,0,.2,1),
                                 box-shadow 200ms cubic-bezier(.4,0,.2,1);">
              <span style="width: 18px; height: 18px; display: inline-flex;
                           align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <!-- Platform icon path — see §6 -->
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </span>
              {youtubeCta.cta.label}
            </a>
          </div>
        </div>

        <!-- RIGHT: media — square gradient card + reel behind -->
        <div aria-hidden="true"
          style="position: relative; aspect-ratio: 1/1; overflow: visible;
                 width: 100%; max-width: 440px;
                 margin-left: auto; margin-right: 0;">

          <div style="position: absolute; inset: 0; border-radius: 12px;
                      overflow: hidden;">
            <div style="position: absolute; inset: 0; border-radius: inherit;
                        overflow: hidden;
                        background: linear-gradient(135deg,
                          {youtubeCta.gradient.hex1} 0%,
                          {youtubeCta.gradient.hex2} 45%,
                          {youtubeCta.gradient.hex3} 100%);"></div>

            <div style="position: absolute; left: 50%; transform: translateX(-50%);
                        top: 12%; height: 92%; aspect-ratio: 9/16;
                        max-width: 62%; border-radius: 8px 8px 0 0;
                        overflow: hidden; background: #000; z-index: 1;
                        box-shadow: 0 18px 44px rgba(0,0,0,0.5);">
              <img src="{youtubeCta.channelImage.src}"
                alt="{youtubeCta.channelImage.alt}" loading="lazy"
                style="position: absolute; inset: 0; width: 100%; height: 100%;
                       object-fit: cover; display: block;" />
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>
```

---

## 11. Interactive behaviors

- **CTA hover**: lift 1px, white-tinted glow shadow (`0 12px 28px rgba(255,255,255,0.12)`)
- **CTA active**: `translateY(0)`, 60ms snap
- **CTA focus**: 2px outline `var(--primary)` with 2px offset
- **Grainient**: JS animates the gradient card's colors (progressive enhancement over the static CSS gradient)
- **Reel img**: static — no hover effect. Reel is preview, CTA is action
- **External link**: opens in new tab (`target="_blank" rel="noopener"`)
- **prefers-reduced-motion**: freeze grainient, disable CTA lift

---

## 12. Responsive behavior

### Tablet (≤ 980px)

```css
@media (max-width: 980px) {
  .darkcta--black { padding: 32px 24px; }
  .darkcta--black .darkcta__grid { grid-template-columns: 1fr; }
  .darkcta--black .darkcta__media {
    aspect-ratio: 16 / 11;                /* wider than 1:1 for stack width */
    margin-left: auto;
    margin-right: auto;                   /* center when stacked */
  }
  .darkcta--black .darkcta__reel {
    top: 12%;
    height: 92%;
    max-width: 42%;                       /* smaller so gradient still shows meaningfully */
  }
}
```

**Why aspect flips from 1:1 to 16:11 on mobile stack**: at 1:1 the media becomes a tall square eating full mobile viewport. 16:11 (landscape) is a shorter card that still holds the reel + gradient without dominating the scroll.

### Mobile-specific tuning (≤ 600px)

```css
@media (max-width: 600px) {
  .darkcta__buttons { justify-content: center; }
  .darkcta__btn { width: 100%; justify-content: center; }
}
```

Full-width CTA + centered on mobile.

---

## 13. Accessibility checklist

- [x] `<h2>` for the card heading
- [x] Media container `aria-hidden="true"` — decorative, meaning is in the CTA label
- [x] External link uses `target="_blank" rel="noopener"` (security + a11y)
- [x] CTA has full text label — icon is supplementary, not sole affordance
- [x] Color contrast: `#fff` on `#0a0a0a` = 20:1 (AAA)
- [x] CTA contrast: `#0a0a0a` on `#fff` = 20:1 (AAA)
- [x] Focus ring: 2px outline `var(--primary)`, 2px offset
- [x] `prefers-reduced-motion`: grainient freeze, no hover transforms
- [x] Platform icon SVG has no `<title>` (button label carries meaning)

## 14. Performance checklist

- [x] Channel image `loading="lazy"` (this is section 9, well below fold)
- [x] Image WebP + srcset 1x/2x
- [x] Grainient is progressive enhancement (CSS fallback always renders)
- [x] Reel iframe (if used) `loading="lazy"`
- [x] Card is CSS-only — no JS required for baseline render
- [x] backdrop-filter NOT used here (kept cheap)

## 15. Design token dependencies

```css
:root {
  --font-body: 'Geist', sans-serif;
  --primary: #hex;                        /* focus ring only */
  --radius-lg: 20px;
}
```

Hardcoded (structural):
- `#0a0a0a` (card bg, reel bg, CTA ink)
- `#ffffff` (h2, lead, CTA bg)
- Gradient stops (brand-derivable)
- `rgba(255,255,255,0.12)` (hover glow)
- `rgba(0,0,0,0.5)` (reel dark shadow)

---

## 16. Rationale (why this section converts)

- **Dedicated section for external platform** = signals "this is a distinct destination, not another product page." Bundling YouTube CTA into MegaBento would flatten it into "one of many things"; giving it its own black card says "if you want more of me long-term, here."
- **Black outer card + gradient inner card** = accent contained. Section stays visually calm; accent hits only where the eye lands (the media). Full-bleed gradient card would fight the copy for attention.
- **1:1 media square (not 16:9 or 5:4)** = signals app-store category card. Cinematic/rectangular aspects = video/product. Square = branded destination.
- **Reel bleeding past card bottom** = "device sitting behind panel" effect. Reads more premium than a reel neatly framed inside a card (which would feel like a video widget).
- **Radius stepping (20 outer → 12 gradient card → 8 reel)** = visual hierarchy through corner sharpness. Bigger radius = "background frame"; smaller radius = "interior object"; sharpest = "the actual device."
- **Sharp bottom corners on reel + `overflow: hidden` on outer card** = crop illusion that sells the "behind panel" effect. Rounded bottom corners would look pasted-on.
- **Platform's official logo in the CTA** = zero-thought recognition. Users don't parse "what's this button" — they see YouTube's play glyph and know instantly.
- **White-tinted hover glow (not dark shadow)** = dark shadows disappear on dark backgrounds. Light-tinted glow says "the button is coming toward you."
- **Single CTA** = one action. Adding secondary options (like "See top videos" inside the card) would dilute the "go to platform" intent.
- **Tighter margin-top on lead (18) and buttons (26)** = the 1:1 media on the right is short; matching the copy stack height means less vertical space to work with. Compressed rhythm keeps the two columns visually balanced.

---

## 17. What Opus should NOT do

- ❌ Use a gradient background on the OUTER card (compete with the inner gradient card)
- ❌ Add a secondary CTA (must be single action)
- ❌ Use a generic play-triangle icon instead of the platform's official logo
- ❌ Make the media anything other than 1:1 (or 16:11 on mobile stack)
- ❌ Fill the reel to 100% of the gradient card width (gradient must show on sides)
- ❌ Use rounded ALL corners on the reel (must be top-only — bottom cropped by outer card)
- ❌ Use a cool-tinted shadow on the reel (must be pure dark rgba(0,0,0,0.5) on warm gradient)
- ❌ Match the outer card radius to the inner card radius (20 outer / 12 inner is the step)
- ❌ Skip `overflow: hidden` on the outer card (reel bleed would break the card boundary)
- ❌ Add background pattern/texture to the outer black card (must stay solid)
- ❌ Use a light-mode ghost variant of the CTA (only solid white pill — dark background needs max-contrast primary)
- ❌ Add "as seen in" logo strip below the card
- ❌ Add subscriber-count / follower-count as a large stat prop (that fights the CTA — leave it as micro-text in placeholder fallback only)
- ❌ Use for INTERNAL links (this section is external-only; internal links belong in MegaBento or Community)
- ❌ Include the section BEFORE Reviews (position 9 always — the "keep me in your life" beat comes AFTER proof)
