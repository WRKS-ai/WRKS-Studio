import { pexelsSearchN } from "@/lib/pexels";
import type { BrandContext } from "./design-system";
import type { IngestedBrand } from "./brand-ingest";

// Pre-fetches a curated image pack for the site generation. Feeds
// Opus real photo URLs it can drop into hero/mega-bento/reviews so
// generated sites stop falling back to typography watermarks and
// mono-caps monograms.
//
// Query selection strategy:
// 1. Prefer the ingested heroImage if it looks like a proper photo
// 2. Fall back to Pexels queries derived from vertical + voice
// 3. Provide 6 images total: 1 hero (portrait) + 5 landscape supporting
//
// Pexels queries chosen for premium, editorial feel — never generic
// "business meeting" stock.

export type ImagePack = {
  hero: string;                 // portrait, ~1200×1600
  supporting: string[];         // 5 landscape ~1200×900 for tile backgrounds
  founder: string;              // portrait, ~800×1000 for about-founder section
  attribution: {
    provider: "pexels" | "unsplash" | "extracted" | "flickr-fallback";
    query: string;
  };
};

const VERTICAL_QUERIES: Record<string, {
  hero: string;
  supporting: string;
  founder: string;
}> = {
  agency: {
    hero: "creative studio dark editorial",
    supporting: "office minimal design workspace",
    founder: "professional portrait studio",
  },
  trading: {
    hero: "stock market chart display",
    supporting: "trading floor screens data",
    founder: "professional man suit portrait",
  },
  coaching: {
    hero: "leadership meeting warm light",
    supporting: "professional coach mentor",
    founder: "confident woman portrait",
  },
  saas: {
    hero: "software product dashboard",
    supporting: "laptop workspace tech",
    founder: "founder tech portrait",
  },
  consulting: {
    hero: "boardroom strategy session",
    supporting: "business analytics chart",
    founder: "consultant executive portrait",
  },
  hr: {
    hero: "diverse team professionals",
    supporting: "workplace culture office",
    founder: "hr leader portrait",
  },
  masterclass: {
    hero: "keynote speaker stage lit",
    supporting: "classroom learning workshop",
    founder: "instructor teaching portrait",
  },
  community: {
    hero: "people gathering event",
    supporting: "collaboration group discussion",
    founder: "community leader portrait",
  },
  newsletter: {
    hero: "editorial writing desk",
    supporting: "publication magazine layout",
    founder: "writer portrait",
  },
  personal_brand: {
    hero: "professional headshot dramatic",
    supporting: "personal brand workspace",
    founder: "founder portrait",
  },
  ecommerce: {
    hero: "product photography lifestyle",
    supporting: "retail store minimal",
    founder: "brand founder portrait",
  },
  service: {
    hero: "craftsman working professional",
    supporting: "service business tools",
    founder: "small business owner portrait",
  },
};

const DEFAULT_QUERIES = VERTICAL_QUERIES.agency!;

export async function curateImagePack(
  brand: BrandContext,
  ingest: IngestedBrand | null,
): Promise<ImagePack> {
  // Pick a vertical for the queries. Priority: ingest.detectedVerticals
  // first (specific), then brand.businessType (broader), then default.
  const detected = ingest?.detectedVerticals ?? [];
  const vertical =
    detected.find((v) => VERTICAL_QUERIES[v]) ??
    (brand.businessType && VERTICAL_QUERIES[brand.businessType] ? brand.businessType : null) ??
    "agency";

  const queries = VERTICAL_QUERIES[vertical] ?? DEFAULT_QUERIES;
  const seedBase = brand.brandName ?? ingest?.brandName ?? vertical;

  // Fire the three Pexels queries in parallel.
  const [heroPool, supportingPool, founderPool] = await Promise.all([
    pexelsSearchN(queries.hero, "portrait", 2, `${seedBase}-hero`, {
      w: 1200,
      h: 1600,
    }),
    pexelsSearchN(queries.supporting, "landscape", 5, `${seedBase}-supporting`, {
      w: 1200,
      h: 900,
    }),
    pexelsSearchN(queries.founder, "portrait", 2, `${seedBase}-founder`, {
      w: 800,
      h: 1000,
    }),
  ]);

  // Prefer ingested hero image if it looks like a real photo (not a
  // logo / icon / tiny image). Heuristic: extension is jpg/webp/png,
  // URL doesn't contain "logo" or "icon".
  let hero = heroPool[0] ?? "";
  const ingested = ingest?.heroImage;
  if (ingested && looksLikeRealPhoto(ingested)) {
    hero = ingested;
  }

  const provider =
    process.env.PEXELS_API_KEY ? ("pexels" as const) : ("flickr-fallback" as const);

  return {
    hero,
    supporting: supportingPool,
    founder: founderPool[0] ?? heroPool[1] ?? hero,
    attribution: { provider, query: `${queries.hero} / ${queries.supporting}` },
  };
}

function looksLikeRealPhoto(url: string): boolean {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|webp|png)(\?|$)/.test(lower) === false) return false;
  if (lower.includes("logo") || lower.includes("icon") || lower.includes("favicon")) return false;
  // OG images and hero backgrounds are typically fine
  return true;
}
