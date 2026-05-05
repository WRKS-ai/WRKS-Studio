# WRKS Studio — Design System

This file is the single source of truth for the WRKS Studio design language. Every Claude Code prompt, every component, every screen references this file. Update this file as the design evolves; never let design decisions drift into individual files.

> **Status:** Skeleton. Tokens, type, and color decisions pending design pass (Stitch + 21st.dev variants → curate → encode here).

---

## 1. Brand foundation

**Parent brand:** SlightWrks
**Platform:** WRKS Studio
**Personality:** Confident, calm, professional. The agent runs the business; the platform stays out of the way.
**Voice (UI copy):** Plain, direct, no exclamation points, no marketing fluff. Talks like a competent person, not a chatbot.

### Core promise
*One instruction. Multiple professional outputs. Zero tool-switching.*

---

## 2. Design principles

1. **Mobile-first, always.** Every surface must pass the test: *can a business owner do this from their phone, between clients, in real life?*
2. **The avatar is the anchor.** On every screen, the agent is present. Not a chatbot popup — a persistent presence.
3. **Conversation is the primary input.** Buttons exist. Forms exist. But the default way to act is to talk.
4. **Live preview, not editing canvas.** Staging environments show what the agent built. The user directs; the agent makes changes.
5. **Show before do.** Irreversible actions never auto-execute. The agent states the plan, the user confirms.
6. **Quiet, not flashy.** Professional output is the wow. The interface should feel calm, premium, and out of the user's way.

---

## 3. Color system

> **TBD — pending design pass.** Generate via Stitch 2.0, curate, encode tokens here.

### Required scales
- **Primary** — main brand color, used for agent presence and primary actions
- **Secondary** — supporting accent
- **Neutral** — full grayscale (50–950) for text, surfaces, borders
- **Semantic** — success, warning, error, info

### Constraints
- Must work in both light and dark mode (dark mode is likely primary based on brief tone)
- Avatar accent color must remain distinct from semantic colors (no confusion with success/error)
- WCAG AA contrast for all text on backgrounds

```css
/* Placeholder — replace after design pass */
--color-primary: TBD;
--color-secondary: TBD;
--color-bg: TBD;
--color-fg: TBD;
```

---

## 4. Typography

> **TBD — pending design pass.**

### Stack hypothesis (to validate)
- **Display + Headings:** A premium serif (e.g., Fraunces, Tiempos, GT Sectra) — gives the platform editorial weight
- **Body + UI:** A clean sans-serif (e.g., Inter, Geist, GT America) — readable, modern, neutral
- **Monospace (code, IDs):** JetBrains Mono or Geist Mono

### Scale (Tailwind defaults to start)
- `text-xs` 12 / `text-sm` 14 / `text-base` 16 / `text-lg` 18 / `text-xl` 20
- `text-2xl` 24 / `text-3xl` 30 / `text-4xl` 36 / `text-5xl` 48 / `text-6xl` 60

### Rules
- Body: sans, 16px minimum on mobile
- Headings: serif if hypothesis confirmed, otherwise sans with tighter tracking
- Never use more than two type families on one screen

---

## 5. Spacing & layout

- Tailwind default 4px scale
- Container max-widths: `max-w-screen-sm` mobile, `max-w-screen-xl` desktop
- Mobile gutter: 16px (`px-4`)
- Desktop gutter: 24–32px (`px-6` to `px-8`)
- Vertical rhythm: prefer 4 / 6 / 8 / 12 / 16 / 24 step increments

---

## 6. Elevation & depth

- **Surface 0** — page background
- **Surface 1** — cards, modals (subtle shadow + 1px border)
- **Surface 2** — elevated overlays (more shadow, no border)

Avoid heavy shadows. Premium feel comes from restraint.

---

## 7. Motion

- **Default duration:** 200ms ease-out for state changes
- **Page transitions:** 300–400ms
- **Avatar idle motion:** subtle, organic — never distracting
- **Loading states:** skeleton screens preferred over spinners (preview builds can take 15–60s — design for this latency, don't hide it)

---

## 8. Component patterns

### The avatar
Persistent across every authenticated screen. Anchored bottom-right (mobile) or in a fixed sidebar (desktop). Speaks via ElevenLabs Conversational AI. Always-on conversation input adjacent.

### The conversation surface
Single full-width input. Voice + text. Auto-expands on focus. Submits on enter (desktop) or send button (mobile).

### Staging environment shell
Used by all five environments (Website, Content, Ads, SEO/Blog, Copywriting):
- Full-width live preview surface (the deliverable)
- Persistent conversation input at bottom
- No code panel, no split window, no manual editing controls

### Show-then-do plan view
Before any multi-deliverable execution, the agent renders a plan card listing what will be made. User confirms or redirects.

### Approval modal (irreversible actions)
Required for: live publish, CRM webhook send, discount application, domain deployment. Plain-language description of what will happen. Cancel + Confirm.

---

## 9. Accessibility

- Keyboard navigation everywhere
- Focus states visible (never `outline: none` without replacement)
- ARIA labels on all icon-only buttons
- Conversation input must accept dictation
- Voice output captioned (transcripts always available)

---

## 10. Don'ts

- **No chatbot UI patterns.** No "I'm a virtual assistant" framing. The agent is named, voiced, and personality-driven.
- **No exclamation points** in default UI copy. (Agent dialogue may use them based on personality.)
- **No spinners** when a skeleton or progress indicator would tell the user more.
- **No modal dialogs** for routine actions — only for irreversible ones.
- **No emoji** in UI chrome unless the user enables it. (Agent may use them in conversation per personality.)
- **No multiple primary CTAs on one screen.**
- **No information density beyond what mobile can carry.** Desktop is the full environment but designs originate on mobile.

---

## 11. Open design questions

- Avatar visual treatment (illustrated character / abstract orb / photoreal — TBD)
- Light vs dark default (leaning dark)
- Serif heading hypothesis — validate or reject after first variants
- Voice model selection (ElevenLabs Conversational AI — specific voice IDs per avatar TBD)
- Preview-build latency UX (15–60s — what does the user see while CF Pages builds?)
- Home ecosystem layout (the "always-there" surface — flagged in brief as a critical unresolved question)

---

## 12. Update protocol

When a design decision is made:
1. Encode it in this file under the relevant section
2. Replace any TBD with the locked value
3. Add it to the relevant component in `packages/ui` or token file in `packages/design`
4. Reference this file in the commit message

This file should grow over time. Stale rules are worse than no rules — review quarterly.
