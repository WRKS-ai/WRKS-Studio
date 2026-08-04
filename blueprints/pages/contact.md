# CONTACT — Universal contact-page composition

> **What this file is**: the composition of a Contact page — where
> visitors go to reach the business. Works across all business types
> and voice descriptors.
>
> **How Opus reads it**: DESIGN.md → primary reference character.md →
> this file → user brand data → emit HTML5 document for /contact.

---

## Purpose

Contact page reduces friction between "I want to talk to them" and
"I'm talking to them." Simplest of the page types — should feel
inevitable, not decorative.

## Applies to

Every business_type + voice_descriptor combo. Info shown varies
(physical address for local services, none for remote SaaS) but
structure is similar.

## Global constraints (inherit from DESIGN.md)

Same as other pages — inherit all tokens, bans, and rules from
DESIGN.md.

---

## Above-the-fold intent

Visitor's first 3 seconds on Contact must deliver:

1. **How to reach us** — email address, phone, or booking link visible
2. **When to expect a response** — "we respond within 24 hours" / "same-day for existing clients"
3. **Optional**: office address if location-relevant

Not required first viewport: form fields (those live in a section
below), map (below), FAQ (below).

---

## Section inventory (in order)

Contact pages should be SHORT. 4-7 sections total.

1. **Nav** — same nav as Home. Current page marker on Contact.
2. **Hero (contact-specific)** — simple, direct. Two-column typical:
   - LEFT: headline "Get in touch" / "Let's talk" / "Send us a message" + supporting sentence + primary contact info (email + phone visible, one line each) + response-time promise
   - RIGHT: (optional) simple contact form OR office/team photo OR map
3. **Contact form** (if separate from hero) — single-column form. Fields: name, email, [company or role for B2B], subject/topic, message. Privacy checkbox. Submit button. Nothing more.
4. **Contact methods grid** — 2-4 cards, each a different contact channel:
   - Email card (with actual email address)
   - Phone card (with actual number, formatted for country)
   - Booking link card (Calendly, Cal.com, etc.)
   - Physical office card (address, hours) — local services only
5. **Office locations** (multi-location businesses only) — 1-N office cards. Each: name, address, phone, hours, map link. Only include if user has real multiple locations.
6. **Map embed** (optional) — Google Maps iframe embed of the primary office. Only for location-relevant businesses.
7. **FAQ** (optional, keep short) — 3-5 quick questions specifically about contact: "How fast do you respond?", "What info do you need?", "Do you work with clients outside X?".
8. **Footer** — same footer as Home. Repeats key contact info for redundancy.

---

## Section count by business_type

| business_type | Target sections | Include |
|---|---|---|
| personal_brand (creator) | 3-4 | Hero + form. Skip locations + map. |
| service (law, medical, local) | 5-7 | All including office(s) + map |
| service (remote consulting) | 4-5 | Hero + form + contact methods grid. Skip map. |
| saas | 4-6 | Hero + form + contact methods (support, sales, general). Add short FAQ. |
| agency (remote) | 4-5 | Hero + form + contact methods grid. Skip map. |
| agency (with physical office) | 5-7 | All including office + map |
| other | 4-5 | Hero + form + methods |

---

## Copy voice notes

- **Response time is trust.** State it explicitly. "Within 24 hours"
  / "Same day M-F" / "48 hours on weekends."
- **Emails are visible, not clickable-only.** Show `hello@brand.com`
  as text (also linked). Don't hide behind a form.
- **Form should feel like a conversation, not a bureaucracy.**
  Placeholder text uses natural language: "What brings you here?" not
  "Please describe your inquiry."
- **Never these patterns**:
  - "Our team will get back to you as soon as possible." (be specific)
  - Contact form with 8+ fields (kills conversion)
  - "First name" + "Last name" as separate fields (use "Full name")
  - Required "How did you hear about us?" field (that's for your CRM,
    not the user's problem)
  - Captcha visible on the page (invisible reCAPTCHA is fine)
- **CTAs on this page**:
  - Form submit button: "Send message" / "Get in touch" (specific to
    what happens next)
  - Booking link: named for the specific action ("Book a 30-min call"
    not just "Book")

---

## Adaptation rules

**Solo creator with no team**:
- Skip contact methods grid (4) — replace with single "email me at X"
  block
- Skip locations (5) and map (6)
- Total: 3-4 sections

**Local service business (law, medical, dental, home services)**:
- Include office details (5)
- Include map embed (6)
- Add "Hours" section if relevant (or fold into office card)
- Total: 5-7 sections

**Multi-location business (chain, franchise, national law firm)**:
- Expand office section (5) to N cards
- Consider location-selector interaction (out of scope for static
  HTML — just list all locations)
- Include 1 map showing all pins OR separate map per location
- Total: 6-7 sections

**Fully remote SaaS**:
- Skip office (5) + map (6)
- Emphasize response channels: support email, sales email, community
  Discord/Slack link
- Add "Sales vs Support" contact methods grid (4)
- Total: 4-5 sections

**High-volume incoming (consultancy with a waitlist)**:
- Add prominent "Currently at capacity — join the waitlist" band
- Booking link goes to waitlist form, not calendar
- Contact form asks for project scope + timeline + budget upfront

---

## Nav integration

Contact page nav:
```
[Logo]   Home   About   Services   Contact (current)   [CTA →]
```

The Contact page's own CTA (in the header if kept) is typically
downgraded to "Send message" (repeats the primary action) or removed
entirely (the WHOLE page is a CTA — no need for a repeat button in
the nav).

---

## Rationale

Contact pages fail two ways: (1) they demand too much (huge forms,
required fields no one wants to fill), (2) they hide the actual
contact info behind a form. This composition prevents both by
demanding visible email + phone in the hero and capping form fields
at ~5.
