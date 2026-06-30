// Content slot schema for the WRKS "bill-fanter" template.
//
// Defines the SHAPE of every editable slot in the template. Values live in
// `content.sample.ts` (default, preserves the original Bill-Fanter site)
// and in each WRKS user's generated content file at publish time.
//
// Scope of extraction:
//   - All user-facing TEXT (headlines, body copy, CTA labels, feature
//     lists, list items, ticker symbols)
//   - All IMAGE URLs (portraits, screenshots, device mocks)
//   - All TESTIMONIAL / REVIEW / PRICING data (per-brand)
//   - All CTA HREFs (so links can point at the user's pages)
//
// Out of scope (stays template-defined inline):
//   - SVG icon paths (visual identity of the template)
//   - Gradient color stops (visual identity)
//   - Vimeo/video URLs that are part of the template's demo reel
//     (out of scope for v1 — these become slots later if needed)
//   - Layout flags (featured, span, square, tall) — structural
//
// Conventions:
//   - Section names match the .astro file (e.g. HeroSplit → heroSplit)
//   - String slots that accept HTML (`set:html`) keep `<br />` etc.
//   - Optional slots are marked `?` — sections render the surrounding
//     wrapper only when the slot is present (matches existing behavior).

// ============================================================
// Atom-level slot types (reused across sections)
// ============================================================

export type CtaSlot = {
  label: string;
  href: string;
  target?: '_blank';
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

export type ReviewSlot = {
  quote: string;
  name: string;
  title: string;
  img: string;
};

export type IconCardSlot = {
  title: string;
  body: string;
  // Inline SVG path data — template-defined visual identity, but stored
  // as a slot so a user with their own iconography can override.
  iconPaths: string;
};

export type NumberedBenefitSlot = {
  num: string;
  title: string;
  body: string;
};

export type FeatureLineSlot = {
  lead: string; // bold prefix
  rest: string; // body suffix (often starts with a space)
};

export type PricingPlanSlot = {
  name: string;
  price: string;
  period: string;
  featured: boolean;
  badge: string | null;
  url: string;
  desc: string;
  features: string[];
};

export type MegaTileSlot =
  | {
      kind: 'image';
      featured?: boolean;
      span: 'w2' | 'w4' | 'w6';
      href: string;
      title: string;
      img: string;
      aria: string;
      target?: '_blank';
    }
  | {
      kind: 'gradient';
      span: 'w2' | 'w4' | 'w6';
      square?: boolean;
      tall?: boolean;
      dark?: boolean;
      tight?: boolean;
      grad: string;
      g1?: string;
      g2?: string;
      g3?: string;
      device?: string;
      pick?: string;
      video?: string;
      icon?: string;
      href: string;
      title: string;
      aria: string;
      target?: '_blank';
    }
  | {
      kind: 'reviews';
      span: 'w2' | 'w4' | 'w6';
      href: string;
      title: string;
      aria: string;
      testimonials: ReviewSlot[];
    };

export type TickerChip = [symbol: string, change: string, dir: 'up' | 'down'];

// ============================================================
// Section content types
// ============================================================

export type HeroContent = {
  headline: string;
  subhead: string;
  primaryCta: CtaSlot;
  secondaryCta: CtaSlot;
  trust: StarTrustSlot;
  portrait: ImageSlot;
  namecard: NamecardSlot;
};

export type AboutBillContent = {
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  cta: CtaSlot;
  photo: ImageSlot;
};

export type ClosingContent = {
  heading: string;
  lead: string;
  trust: StarTrustSlot;
  reviews: ReviewSlot[];
  ctaMore: CtaSlot;
  pills: CtaSlot[];
};

export type CommunityContent = {
  heading: string;
  lead: string;
  benefits: NumberedBenefitSlot[];
  cta: CtaSlot;
  screenshot: ImageSlot;
};

export type CommunityPricingContent = {
  eyebrow: string;
  heading: string;
  lead: string;
  plans: PricingPlanSlot[];
};

export type EffortlessStrategyContent = {
  heading: string; // accepts <br />
  lead: string;
  cta: CtaSlot;
  review: ReviewSlot;
  features: FeatureLineSlot[];
  image: ImageSlot;
};

export type HelpGridContent = {
  heading: string;
  cards: IconCardSlot[];
};

export type HeroSplitContent = {
  eyebrow: string | null;
  heading: string;
  lead: string;
  cta: CtaSlot;
  trust: StarTrustSlot;
  quote: { text: string; name: string; title: string };
  quoteLink: CtaSlot;
  photo: ImageSlot;
  videoVimeoId: string;
};

export type MegaBentoContent = {
  heading: string;
  tiles: MegaTileSlot[];
};

export type ReviewsContent = {
  eyebrow: string;
  heading: string;
  videoVimeoIds: string[];
  screenshots: string[];
  cta: CtaSlot;
};

export type SpotlightContent = {
  heading: string;
  lead: string;
  cta: CtaSlot;
  ctaIcon: boolean;
  distortionImage: string;
};

export type VideoTestimonialsContent = {
  heading: string;
  lead: string;
  videoVimeoIds: string[];
};

export type WatchlistContent = {
  eyebrow: string;
  heading: string;
  lead: string;
  submitLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  lockedPreview: ImageSlot;
  tickerA: TickerChip[];
  tickerB: TickerChip[];
};

export type YoutubeCtaContent = {
  heading: string;
  lead: string;
  cta: CtaSlot;
  channelImage: ImageSlot;
};

// ============================================================
// Root type — every section the template can render
// ============================================================

export type TemplateContent = {
  hero: HeroContent;
  aboutBill: AboutBillContent;
  closing: ClosingContent;
  community: CommunityContent;
  communityPricing: CommunityPricingContent;
  effortlessStrategy: EffortlessStrategyContent;
  helpGrid: HelpGridContent;
  heroSplit: HeroSplitContent;
  megaBento: MegaBentoContent;
  reviews: ReviewsContent;
  spotlight: SpotlightContent;
  videoTestimonials: VideoTestimonialsContent;
  watchlist: WatchlistContent;
  youtubeCta: YoutubeCtaContent;
};
