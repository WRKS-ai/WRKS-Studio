# WRKS Studio

**The Connected Business Nervous System**

WRKS Studio is a personalized AI agent platform that executes professional business deliverables on command — websites, funnels, content, ad creatives, copywriting, and SEO — using proprietary WRKS frameworks and deep memory of the user's business.

## The vision moment

A business owner says: *"Make a 20% March promo. Social post, banner on my website, discount code for returning users."* One sentence. WRKS Studio creates the post, publishes it, updates the site banner, and applies the discount — simultaneously, from a phone, without touching another tool.

Every architectural and design decision is judged against whether it serves this moment.

## Architecture

Five layers, top to bottom:

1. **Interface** — Home ecosystem, avatar UI, voice, mobile app, web app
2. **Orchestrator agent** — Intent parsing, multi-action fan-out, clarification, memory management
3. **Staging environments** — Five domain-specific live preview surfaces
4. **Framework + execution layer** — WRKS proprietary frameworks per deliverable type
5. **Connections** — Social publish, CRM webhook, Stripe embed (no live data reads)

## Tech stack

- **Monorepo:** Turborepo 2.0 + pnpm
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind 4 + shadcn/ui
- **Auth:** Clerk (Organizations = business profiles)
- **Database:** Supabase (Postgres + Row-Level Security)
- **Payments:** Stripe
- **Email:** Resend
- **Deploy:** Vercel (platform), Cloudflare Pages (per-business sites)
- **Per-business sites:** Astro

## Repo structure

```
WRKS-Studio/
├── apps/
│   ├── marketing/      # Public marketing site
│   ├── web/            # Product app (home + staging envs)
│   ├── mobile/         # Expo app (Q3 2026)
│   └── api/            # Webhooks, CRM forwarding
├── packages/
│   ├── ui/             # Shared shadcn components
│   ├── design/         # Tokens + design.md
│   ├── frameworks/     # WRKS framework execution engine
│   ├── agent/          # Orchestrator + memory
│   └── shared/         # Types, utils
└── docs/
    └── WRKS_System_Founding_Brief_v4.docx
```

## Status

Pre-foundation. Founding Product Brief v4 is the source of truth. See `docs/WRKS_System_Founding_Brief_v4.docx`.

## Brand

Parent: **SlightWrks** (slightwrks.com)
Platform: **WRKS Studio**
GitHub org: **WRKS-ai**
