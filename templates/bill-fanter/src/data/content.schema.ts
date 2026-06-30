// Content slot schema for the WRKS "bill-fanter" template.
//
// This file defines the SHAPE of every editable slot in the template —
// nothing else. The values (the actual copy) live in `content.sample.ts`
// (the default, used during dev to preserve the original Bill-Fanter
// site verbatim) and in each WRKS user's generated content file.
//
// When WRKS Studio creates a new site, an AI agent reads the user's
// brand_state + brief and emits a fresh `content.ts` that satisfies this
// `TemplateContent` type. The template's .astro files always import that
// file, so swapping the import is the only thing that changes per user.
//
// Refactor strategy: add slot types here as each section is converted.
// The optional `?` markers below are for sections not yet refactored —
// they become required once the corresponding section has been ported.

export type CtaSlot = {
  label: string;
  href: string;
};

export type ImageSlot = {
  src: string;
  alt: string;
};

export type NamecardSlot = {
  name: string;
  role: string;
};

export type StarTrustSlot = {
  label: string;
  rating: number;
  count: string;
};

export type HeroContent = {
  headline: string;
  subhead: string;
  primaryCta: CtaSlot;
  secondaryCta: CtaSlot;
  trust: StarTrustSlot;
  portrait: ImageSlot;
  namecard: NamecardSlot;
};

export type TemplateContent = {
  hero: HeroContent;
  // Subsequent sections (about, masterclass, effortlessStrategy, mega-
  // bento, helpGrid, spotlight, reviews, videoTestimonials, community,
  // communityPricing, watchlist, youtubeCta, closing) land here as
  // they're refactored.
};
