// Default content for the "bill-fanter" template — verbatim copy from
// the original billfanter.com site. Used during template development so
// `npm run dev` still renders the canonical Bill-Fanter homepage exactly
// as before, even after the .astro files have been refactored to read
// from slots.
//
// In production, WRKS Studio replaces this import on a per-user basis
// with their own AI-generated `content.ts` that satisfies the same
// `TemplateContent` type.

import type { TemplateContent } from './content.schema';

export const content: TemplateContent = {
  hero: {
    headline: "Learn options trading and build income you control",
    subhead:
      "Bill Fanter teaches new and experienced traders how to read the options market, time entries, and place trades with a clear plan.",
    primaryCta: { label: "Get the masterclass", href: "/masterclass" },
    secondaryCta: { label: "Join the community", href: "/community" },
    trust: {
      label: "Recommended by",
      rating: 5,
      count: "1,600+ Students",
    },
    portrait: {
      src: "/assets/664a5b263659c7265be280ad/68eeba02f9fafe342cd54b44_Gemini_Generated_Image_6ut8i56ut8i56ut8.webp",
      alt: "Bill Fanter",
    },
    namecard: {
      name: "Bill Fanter",
      role: "Former banker, options mentor",
    },
  },
};
