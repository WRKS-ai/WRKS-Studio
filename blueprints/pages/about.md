# ABOUT — Universal about-page composition

> **What this file is**: the composition of an About page — which sections
> render, in what order, adapted per business type. Works across all
> reference bundles (personal-brand, wrks-online, tomorrows-sunrise,
> claxton-law) by combining THIS page structure with the reference's
> visual character.
>
> **How Opus reads it**: DESIGN.md (constitution) → primary reference
> character.md (vibe) → this file (About page structure) → user brand
> data → emit one complete HTML5 document for the /about URL.

---

## Purpose

The About page answers *who is behind this*. It's where the buyer's
"can I trust these people" question gets resolved. On smaller sites,
this is the single most-visited internal page after Home.

## Applies to

Every business_type + voice_descriptor combo. Copy tone and image
treatment shift per voice; structure stays similar.

## Global constraints (inherit from DESIGN.md)

- **Container**: max-width 1180px, horizontal padding 40px desktop / 24px mobile
- **Typography**: single-family per site, matches Home page
- **Palette**: HARD-CONSTRAINED to user's brand palette; same as Home
- **Spacing scale**: only DESIGN.md's approved values
- **Motion**: same tier as Home (voice-gated)
- **Bans + tokens + HTML rules**: all inherited from DESIGN.md — do not restate

---

## Above-the-fold intent (Hero + start of Story in first viewport)

Visitor's first 3 seconds on About must deliver:

1. **Who we are** — hero headline names the founder OR the mission
2. **One credibility hook** — years in business, background credential, or founding-story teaser
3. **One human element** — real portrait, real photo, or specific detail

Not required in first viewport: values, methodology, awards, timeline.
Those live below.

---

## Section inventory (in order)

Adapt this sequence. Drop what doesn't fit; never add generic filler.

1. **Nav** — same nav as Home (must link back to Home + across to sibling pages: `/`, `/services`, `/contact`)
2. **Hero (about-specific)** — different from Home hero. Options depending on business:
   - Portrait-led: large founder photo + headline "Hi, I'm {name}" + one-line credential
   - Mission-led: text-first, no photo, headline states the mission
   - Team-led: 3-4 team headshots in a strip, headline names the collective
3. **Story / founding narrative** — long-form prose. 3-5 paragraphs. Real specifics: year founded, why founded, first client / breakthrough moment, current state.
4. **Values or principles** (optional) — 3-5 named values, each with one-sentence explanation. NEVER generic ("integrity", "excellence") — must be specific to how this business operates.
5. **Team grid** (drop for solo founders) — headshots + names + titles + one-line bios. Real photos or initial-monograms; never StyleGAN.
6. **Timeline or milestones** (optional, only if user has real milestones) — visual timeline of key moments (founded, first product, first 1000 customers, etc.)
7. **Photos of the work / the space** (optional) — if user has a physical space, showroom, or product photos, this is where they land
8. **Press / mentions** (optional, only if REAL) — logos of publications that covered the founder / business. NEVER faked "As seen in TechCrunch/Forbes."
9. **Personal-touch section** (optional) — quirky detail, personal Q&A, "outside of work" content. Humanizes the founder. Warm/quiet voices love this.
10. **Final CTA** — different call than Home. About → book a call / send a message / see services. Not "buy now."
11. **Footer** — same footer as Home.

---

## Section count by business_type

| business_type | Target sections | Skip |
|---|---|---|
| personal_brand | 6-8 | Team grid, timeline (unless real), press |
| service (solo) | 6-7 | Team grid |
| service (multi-person) | 8-10 | — |
| saas | 6-8 | Personal-touch, photos of the space |
| agency | 8-10 | — |
| ecommerce | 5-7 | Team grid unless brand-founder is the story |
| other | 6-7 | — |

---

## Copy voice notes

- **Founding story requires SPECIFICITY.** Real dates, real names, real numbers. Generic founder stories ("passionate about helping people succeed") read as filler.
- **First-person or third-person is a voice decision**:
  - `warm`, `bold`, `playful` voices → first-person ("I started this because...")
  - `professional`, `expert`, `quiet` voices → third-person ("Claxton Law was founded in 2005...")
- **Never these phrases**:
  - "We're passionate about..."
  - "Our mission is to elevate..."
  - "We believe in the power of..."
  - "In today's fast-paced world..."
- **Team bios**: name + title + 2-3 sentences MAX + one personal detail. Never generic corporate bios.

---

## Adaptation rules

**Solo founder (single-person business)**:
- Skip team grid (5)
- Elevate founding narrative (3) — this is the main event
- Add personal-touch section (9) if voice is warm/playful
- Total: 6-7 sections

**Multi-person team (2-10 people)**:
- Include team grid (5) with real headshots
- Founder story (3) can focus on the founder OR the collective
- Total: 8-9 sections

**Larger organization (10+ people)**:
- Team grid becomes "leadership" (5-6 key people, not everyone)
- Add company milestones / timeline (6)
- Consider adding "our approach" or methodology section between values (4) and team (5)
- Total: 9-11 sections

**No real photos of the founder or team**:
- Portrait-led hero → mission-led hero (option 2)
- Team grid → initial-monograms grid (name initials on colored backgrounds, still respect brand palette)
- NEVER StyleGAN faces. NEVER stock-photo faces.

**No real press or mentions**:
- Skip section 8 entirely
- Don't fake "As seen in" logos

---

## Nav integration

Every page's nav must include a link back to Home + across to sibling pages. About page nav example:

```
[Logo]   Home   About (current)   Services   Contact   [CTA →]
```

The current page's nav item uses:
- 1-2px underline in the accent color OR
- Slightly bolder weight OR
- Different color from other nav items

Never mark the current page with a background pill (looks like a button).

---

## Rationale

About pages fail two ways: (1) they read as corporate boilerplate
(generic mission statements, faceless team grids, stock-photo
stories), OR (2) they under-invest and become an empty "About us"
paragraph with nothing else. This composition provides enough scaffold
for the second failure while the copy rules prevent the first.
