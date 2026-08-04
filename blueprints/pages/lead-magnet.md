# LEAD-MAGNET — Universal lead-magnet page composition

> **What this file is**: the composition of a Lead-Magnet page — a
> single-purpose page that trades an email address for a valuable
> free resource (newsletter subscription, PDF guide, template, mini-
> course, private feed).
>
> **How Opus reads it**: DESIGN.md → primary reference character.md →
> this file → user brand data → emit HTML5 document for /watchlist,
> /guide, /newsletter, or whichever slug fits the offer.

---

## Purpose

Lead-magnet pages have ONE job: capture an email in exchange for
something valuable. Every design choice serves that goal. Everything
that doesn't drive the opt-in gets cut.

## Applies to

- **personal_brand + primary_goal in [build_audience, capture_leads]**: primary use case
- **service + primary_goal = capture_leads**: works well for lead-gen
  offers (free consult, project estimate calculator)
- **saas**: less common — usually a landing page with a signup form
  IS the lead magnet
- **agency**: works for gated content (industry report, benchmark study)

Skip for: ecommerce (product pages do this job), pure booking-first
services (Home + Contact is enough).

## Naming per goal

| Offer type | URL path options |
|---|---|
| Email newsletter | `/newsletter`, `/subscribe`, `/watchlist` (curated recs) |
| PDF guide / ebook | `/guide`, `/{topic}-guide`, `/download` |
| Free mini-course | `/free-course`, `/{topic}-course` |
| Template / tool | `/template`, `/tool`, `/{name}` |
| Private feed / dashboard | `/access`, `/feed`, `/{name}` |

Pick the domain-appropriate slug. "Watchlist" fits a stock-picks
newsletter; "guide" fits a downloadable PDF; "access" fits a private
community.

## Global constraints (inherit from DESIGN.md)

Same as other pages — inherit all tokens, bans, and rules from
DESIGN.md.

---

## Above-the-fold intent

Visitor's first 3 seconds on the Lead-Magnet page must deliver:

1. **What they get** — explicit description of the free resource
2. **Why it's valuable** — one specific benefit or proof point
3. **How to get it** — email input + primary CTA visible

Not required in first viewport: full explanation, testimonials, FAQ,
sample content. Those live below to reinforce for hesitant visitors.

---

## Section inventory (in order)

Lead-magnet pages are SHORTER than other pages. 5-8 sections total.

1. **Nav** — same nav as Home. Simplified (fewer links = less
   distraction). Current page marker.
2. **Hero (lead-magnet-specific)** — the FORM is the point.
   Two-column typical:
   - LEFT (60%): headline (what they get), subhead (why it's valuable), email input + submit button, small print ("no spam, unsubscribe anytime")
   - RIGHT (40%): visual preview of the resource — cover image, sample screenshot, or founder holding the artifact
3. **What's inside** — 3-6 bullet points of what the free resource contains. Concrete, specific. "Every Sunday: 3 stock picks + 2 sector callouts + weekly summary." NOT "curated insights delivered weekly."
4. **Social proof band** — subscriber count OR named subscribers OR one testimonial:
   - "Read by 12,000+ solo founders each week"
   - "Trusted by teams at [3-5 real logos or names, if REAL]"
   - "One testimonial from a subscriber, 1-3 sentences, real name + role"
   NEVER fake stats. If user has none, use ONE testimonial or skip this section.
5. **Sample content preview** (optional) — show a snippet of the actual resource. First page of the PDF, one issue of the newsletter, a preview of the tool. Reduces "will this be worth it?" hesitation.
6. **Second opt-in form** — repeat the email input at the bottom of the page. Different context: "Ready? Get your first issue in 24 hours." Same fields.
7. **FAQ (short, opt-in-specific)** — 3-4 questions max. Common: "how often?", "can I unsubscribe?", "who's it for?", "is it really free?".
8. **Footer** — same footer as Home. NO extra CTAs to buy things — this page's job is opt-in only.

---

## Section count by resource type

| Resource | Target sections | Include |
|---|---|---|
| Newsletter | 5-6 | Hero + what's inside + social proof + second form + FAQ |
| PDF guide / ebook | 6-8 | Hero + what's inside + sample preview + author bio card + FAQ + second form |
| Free mini-course | 6-8 | Hero + curriculum outline + instructor bio + sample lesson preview + FAQ + second form |
| Template / tool | 5-7 | Hero + what's inside + one screenshot + social proof + FAQ + download form |
| Private feed | 5-6 | Hero + what's inside + social proof + FAQ + form |

---

## Copy voice notes

- **Value must be SPECIFIC.** "Weekly newsletter" is filler. "Every
  Sunday, one 500-word essay on solo-operator taxes" is the pitch.
- **Frequency and format visible.** How often, what medium, what to
  expect from each installment.
- **"Unsubscribe anytime" earns trust.** Include it near the form,
  small type. Users need permission to opt in without commitment.
- **Never these phrases**:
  - "Join our community of..." (community isn't a bribe; the RESOURCE is)
  - "Insights delivered straight to your inbox" (filler)
  - "Level up / take your business to the next level" (banned by DESIGN.md)
  - "Exclusive tips and strategies" (empty)
- **Form microcopy**:
  - Label / placeholder: "your@email.com" (or nothing — the input is
    obvious)
  - Submit button: "Get access" / "Subscribe" / "Send it" — never
    just "Submit"
  - Post-submit success: "Check your inbox for the first issue" +
    confirmation email preview
- **Small print**: "One email per {frequency}. Unsubscribe with one
  click." Small, low-contrast, but visible.

---

## Adaptation rules

**Simple email newsletter (no PDF, no download)**:
- Skip sample-content preview (5) or replace with 1-2 quoted lines
  from a past issue
- 5-6 sections total

**PDF or downloadable resource**:
- Include a visual of the PDF cover in the hero (right column)
- Add sample-content preview (5) — screenshot of one page
- Author bio card (optional) — small section with founder photo +
  1-line credential
- Post-submit: "check your email for the download link"

**Free mini-course (multi-lesson)**:
- Expand "what's inside" (3) to a curriculum outline
- Add instructor bio prominently (5 or as replacement for social
  proof band)
- Include sample lesson preview (video snippet or first-lesson text)
- 7-8 sections total

**Tool or template (SaaS-adjacent)**:
- Hero right-column shows the tool interface (screenshot or short
  video)
- "What's inside" becomes "What it does" (3-5 capability bullets)
- CTA can be "Start free" instead of "Subscribe" if the tool has a
  no-signup free tier

**Private community / feed access**:
- Emphasize social proof (4) — member count, notable members
- Add "who this is for" section between hero and what's inside
- CTA: "Request access" if invite-only, "Join now" if open

---

## Nav integration

Lead-magnet page nav should be MINIMAL. Options:

**Full nav** (default):
```
[Logo]   Home   About   Services   Contact   [Subscribe / Join CTA]
```

**Minimal nav** (aggressive conversion optimization):
```
[Logo]                                            [Subscribe]
```
Only if the user explicitly wants a "landing page" style — no other
nav links, no escape. Use when the lead-magnet IS the primary
business goal (email-first businesses like newsletters).

---

## Rationale

Lead-magnet pages have the highest conversion pressure of any page
type. Every section is either serving the opt-in or actively
sabotaging it. This composition strips filler while providing enough
proof + specificity to reduce hesitation. Two form placements (hero
+ bottom) capture both immediate-yes visitors and after-reading
visitors.
