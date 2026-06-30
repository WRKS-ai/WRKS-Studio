// WRKS template manifest — Bill-Fanter.
//
// Declares the template's identity, the section components it offers,
// the pages it ships with (each marked required/optional so users can
// pick a subset at site creation), and which brand_state shapes the
// template is best suited for.
//
// WRKS Studio reads this at site creation time to: (1) score this
// template against the user's brand_state + brief, (2) present the
// page list to the user (or to the AI) so it can be pruned, and (3)
// know which slots in content.schema.ts to fill.

export type TemplateManifest = {
  id: string;
  name: string;
  description: string;
  stack: 'astro';
  industryTags: string[];
  bestForGoals: Array<
    | 'book_calls'
    | 'sell_products'
    | 'capture_leads'
    | 'build_audience'
    | 'launch_new'
    | 'fix_conversions'
  >;
  bestForBusinessTypes: Array<
    | 'service'
    | 'ecommerce'
    | 'saas'
    | 'agency'
    | 'personal_brand'
    | 'other'
  >;
  sections: string[];
  pages: Array<{
    id: string;
    title: string;
    file: string;
    required: boolean;
    description: string;
  }>;
};

export const manifest: TemplateManifest = {
  id: 'bill-fanter',
  name: 'Coaching / Education',
  description:
    'Dark editorial education template with a hero portrait, mega bento, video reels, written + LinkedIn reviews, membership pricing, and a long-form mentor bio. Ideal for personal brands selling a masterclass + paid community + free lead magnet.',
  stack: 'astro',
  industryTags: [
    'education',
    'finance',
    'coaching',
    'mentor',
    'masterclass',
    'community',
    'creator',
  ],
  bestForGoals: ['book_calls', 'capture_leads', 'sell_products'],
  bestForBusinessTypes: ['personal_brand', 'service'],

  // Section components available to compose pages. Names match the
  // file in src/components/sections/ and the slot key in content.schema.ts.
  sections: [
    'hero',
    'aboutBill',
    'closing',
    'community',
    'communityPricing',
    'effortlessStrategy',
    'helpGrid',
    'heroSplit',
    'megaBento',
    'reviews',
    'spotlight',
    'videoTestimonials',
    'watchlist',
    'youtubeCta',
  ],

  // Pages the template ships with. Users (or the AI) pick a subset
  // at site creation; required pages are always included. Per user
  // direction 2026-06-30: "we will keep 18 as a template and make
  // the number of pages according to the requirements."
  pages: [
    { id: 'home', title: 'Home', file: 'src/pages/index.astro', required: true, description: 'Hero + mega bento + watchlist + community + help grid + spotlight + welcome split + reviews + YouTube CTA + about.' },
    { id: 'about', title: 'About', file: 'src/pages/about/index.astro', required: false, description: 'Long-form bio + journey + credentials.' },
    { id: 'masterclass', title: 'Masterclass', file: 'src/pages/masterclass/index.astro', required: false, description: 'Paid course landing page with pricing + curriculum + reviews.' },
    { id: 'community', title: 'Community', file: 'src/pages/community/index.astro', required: false, description: 'Membership landing with benefits + pricing + Discord preview.' },
    { id: 'free-watchlist', title: 'Free watchlist', file: 'src/pages/free-watchlist/index.astro', required: false, description: 'Lead magnet — email capture for weekly content drop.' },
    { id: 'webinar', title: 'Webinar', file: 'src/pages/webinar/index.astro', required: false, description: 'Free training registration page.' },
    { id: 'watch-webinar', title: 'Watch webinar', file: 'src/pages/watch-webinar/index.astro', required: false, description: 'On-demand webinar viewer.' },
    { id: 'blog', title: 'Blog', file: 'src/pages/blog/index.astro', required: false, description: 'Long-form posts index.' },
    { id: 'student-comments', title: 'Reviews', file: 'src/pages/student-comments/index.astro', required: false, description: 'Full reviews wall.' },
    { id: 'contact', title: 'Contact', file: 'src/pages/contact/index.astro', required: false, description: 'Booking + contact form.' },
    { id: 'booking', title: 'Book a call', file: 'src/pages/booking.astro', required: false, description: 'Cal.com / Calendly embed.' },
    { id: 'guide', title: 'Guide', file: 'src/pages/guide.astro', required: false, description: 'Standalone guide / resource page.' },
    { id: 'training', title: 'Training', file: 'src/pages/training.astro', required: false, description: 'Training landing page.' },
    { id: 'watchlist-confirmed', title: 'Watchlist confirmed', file: 'src/pages/watchlist-confirmed/index.astro', required: false, description: 'Post-signup confirmation page.' },
    { id: 'privacy-policy', title: 'Privacy policy', file: 'src/pages/privacy-policy/index.astro', required: false, description: 'Legal — privacy policy.' },
    { id: 'terms-conditions', title: 'Terms & conditions', file: 'src/pages/terms-conditions/index.astro', required: false, description: 'Legal — terms and conditions.' },
    { id: 'refund-policy', title: 'Refund policy', file: 'src/pages/refund-policy/index.astro', required: false, description: 'Legal — refund policy.' },
    { id: '404', title: '404', file: 'src/pages/404.astro', required: true, description: 'Not-found fallback page.' },
  ],
};
