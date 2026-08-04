# SERVICES — Universal services-page composition

> **What this file is**: the composition of a Services page — the
> catalog + detail of what the business offers. Works across all
> business types (creator services, agency services, professional
> services) by combining THIS structure with the reference bundle's
> character.
>
> **How Opus reads it**: DESIGN.md → primary reference character.md
> → this file → user brand data → emit HTML5 document for /services
> (or /work, /coaching, /practice-areas — see naming rules below).

---

## Purpose

Services page tells the buyer: *here's exactly what you can hire us
for, at what depth, and how to get started.* It's the conversion
page for consideration-stage buyers who've decided the business is
credible but need to see the offer laid out.

## Applies to

All business_types except pure ecommerce (which uses product pages
instead — out of scope for launch).

## Naming per business_type

| business_type | URL path options |
|---|---|
| personal_brand | `/services`, `/coaching`, `/work-with-me` |
| service | `/services`, `/practice-areas` (law), `/treatments` (medical) |
| saas | `/features`, `/product`, or split into per-feature pages |
| agency | `/services`, `/work`, `/what-we-do` |
| other | `/services` |

Pick the domain-appropriate slug. Never a generic `/services` when
the industry has a stronger term (law firms → `/practice-areas`,
medical → `/services` or `/treatments`, creators → `/coaching` or
`/work-with-me`).

## Global constraints (inherit from DESIGN.md)

Same as About page — inherit all tokens, bans, and rules from
DESIGN.md.

---

## Above-the-fold intent

Visitor's first 3 seconds on Services must deliver:

1. **One-sentence category** — "Immigration law across three specialty areas" or "Coaching for founders through their first 12 months"
2. **Number or breadth signal** — "3 specialty areas" / "5 programs" / "12+ years" / "$1M+ managed"
3. **Entry point** — one CTA to explore deeper OR one "book a consult" primary

Not required in first viewport: pricing, testimonials, FAQ. Those live
below.

---

## Section inventory (in order)

1. **Nav** — same nav as Home. Current page marker on Services link.
2. **Hero (services-specific)** — different from Home. Options:
   - Category-led: headline names the category ("Family law · Immigration · Business formation")
   - Outcome-led: headline names the outcome ("From concept to launched course in 6 weeks")
   - Simple: single-column headline + supporting paragraph + CTA
3. **Service grid or list** — the CATALOG. Either a grid of service cards OR a stacked list of detailed service blocks. Choose based on:
   - Grid: 3-9 services, each with icon/label + short description + link to detail
   - Stacked list: 2-5 deep services, each with 3-5 sentence prose + inline CTA
4. **Service detail sections** (for stacked-list variant) — one deeper section per service. Includes: name, description, what's included, timeline, pricing (if fixed), CTA.
5. **Process / how-it-works** — 3-5 step process for engaging with the business. Numbered steps, one sentence each.
6. **Pricing section** — ONLY if user has fixed pricing. Options:
   - Table with tiers
   - Simple "starts from $X" line
   - "Custom / contact for quote" — if pricing varies per project
7. **Case study or example work** (optional) — 1-3 example projects. Real client names if consented; anonymized outcomes otherwise.
8. **Testimonials specific to services** — different from Home testimonials. These focus on the WORK, not the person. "The site he built ranked #1 in a month" vs "Bill's a great guy."
9. **FAQ (services-specific)** — 4-8 questions. Common ones: "how long does X take?", "what's included?", "how do we start?", "what if I need Y?".
10. **Final CTA** — book a consult / send a project brief / start an intake form
11. **Footer** — same footer as Home.

---

## Section count by business_type

| business_type | Target sections | Layout notes |
|---|---|---|
| personal_brand | 6-8 | Stacked-list variant (2-5 deep offerings) |
| service (law, medical, accounting) | 8-10 | Grid variant (5-9 practice areas) + service detail per area |
| saas | 6-8 | Feature grid + pricing tiers |
| agency | 7-9 | Grid (5-8 service types) + case studies |
| other | 6-8 | — |

---

## Copy voice notes

- **Service descriptions require SPECIFICITY.** Never "we build custom
  solutions for your business needs." Always "we build 6-page Astro
  sites in 2 weeks for $8-12K, including copywriting."
- **Pricing transparency signals confidence.** If the user has a real
  price point, show it. If pricing varies, say "typical projects are
  $X-$Y" — never dodge.
- **Process descriptions**: number the steps. Concrete verbs. "Book
  the call. Send the brief. Review the draft. Approve or revise. Ship."
- **Never these phrases**:
  - "Bespoke solutions tailored to..."
  - "We work closely with clients to..."
  - "Comprehensive services designed to..."
  - "End-to-end / full-service / turnkey"
- **CTAs**: match the sales cycle. Enterprise → "Book a consult".
  Direct-purchase → "Buy now". Newsletter → "Subscribe".

---

## Adaptation rules

**Solo consultant (1-3 services, high-touch)**:
- Use stacked-list variant (each service = its own deep section)
- Skip service grid (3) — replace with the stacked details (4)
- Add pricing if fixed
- Total: 6-7 sections

**Agency (5-10 services)**:
- Use grid variant (3)
- Add case studies (7) — this is critical for agencies
- FAQ (9) can be shorter (4-5 questions)
- Total: 7-9 sections

**Law firm / medical practice (5-15 practice areas)**:
- Grid variant with icon+title+2-line description per area
- Skip individual service detail sections (4) — that's per-area pages
- Add process (5) — "How consultations work"
- Total: 7-8 sections

**SaaS (5-15 features)**:
- Rename "services" → "features"; page slug becomes /features
- Use grid variant with icon+title+short description
- Add pricing tiers section (6) at the bottom
- Skip case studies unless they're customer stories
- Total: 6-7 sections

**Freelancer with unclear catalog**:
- Simple stacked list with 2-3 offerings
- Skip pricing (default to "starts from" or "contact for quote")
- Skip FAQ
- Total: 5-6 sections

---

## Nav integration

Services page nav must include:
```
[Logo]   Home   About   Services (current)   Contact   [CTA →]
```

If site has per-area sub-pages (`/services/immigration`, `/services/family`),
this Services page shows the CATALOG. Detail pages are separate (out
of scope for Ship 3 unless we go deeper).

---

## Rationale

Services pages fail three ways: (1) vague copy ("we help businesses
grow"), (2) hiding pricing entirely, (3) burying the CTA. This
composition forces specificity via section prompts + pricing
transparency rules + a mandatory final CTA.
