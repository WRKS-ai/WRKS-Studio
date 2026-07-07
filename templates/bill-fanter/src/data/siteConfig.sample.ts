// Default siteConfig for the "bill-fanter" template — reproduces the
// FULL canonical Bill-Fanter site (all pages + all sections in original
// order). Used during template dev so `npm run dev` keeps rendering
// billfanter.com exactly as before.
//
// In production, WRKS Studio swaps this import for a per-user file
// emitted by the curation pass. The AI picks a subset that best fits
// the user's brand_state + brief.

import type { SiteConfig } from './siteConfig.schema';

export const siteConfig: SiteConfig = {
  // Original Bill-Fanter has 18 pages. Sample keeps all of them so the
  // dev build matches production 1:1.
  pages: [
    'home',
    'about',
    'masterclass',
    'community',
    'free-watchlist',
    'webinar',
    'watch-webinar',
    'blog',
    'student-comments',
    'contact',
    'booking',
    'guide',
    'training',
    'watchlist-confirmed',
    'privacy-policy',
    'terms-conditions',
    'refund-policy',
    '404',
  ],

  compositions: {
    // Homepage composition matches src/pages/index.astro import order:
    //   Hero → MegaBento → Watchlist → Community → HelpGrid →
    //   Spotlight → HeroSplit → Reviews → YoutubeCta → AboutBill
    // Only sections included in `compositions[page].sections` are rendered.
    home: {
      sections: [
        'hero',
        'megaBento',
        'watchlist',
        'community',
        'helpGrid',
        'spotlight',
        'heroSplit',
        'reviews',
        'youtubeCta',
        'aboutBill',
      ],
    },
    // Other pages use their own section subsets — filled in as the
    // remaining 17 pages are refactored to read from siteConfig.
    // Empty compositions here means "render whatever the page file
    // renders directly" until each page is ported. Homepage refactored
    // first as proof.
  },
};
