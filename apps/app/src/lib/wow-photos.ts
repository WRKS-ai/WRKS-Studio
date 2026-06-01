// Stock photo selection for the wow page previews.
//
// We use Lorem Flickr (no API key) with search queries that Claude
// picks per-deliverable. Single-keyword queries work best — Flickr
// has more photos under each broad tag, and intersections are noisy.

export type WowCategory =
  | "fashion"
  | "food"
  | "fitness"
  | "tech"
  | "services"
  | "beauty"
  | "creative"
  | "finance"
  | "home"
  | "travel"
  | "other";

function safeTag(query: string): string {
  // Normalize: strip non-alphanumeric, collapse to comma-separated tags
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3) // cap to 3 tags max
    .join(",");
}

function flickr(query: string, seed: string, w: number, h: number) {
  const tags = safeTag(query) || "minimal";
  const safeSeed = encodeURIComponent(seed.slice(0, 32));
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(tags)}?lock=${safeSeed}`;
}

export type PhotoQueries = {
  heroQuery: string;
  instagramQuery: string;
  adQuery: string;
};

// Each preview surface gets its own seed off brand+role so the same
// render is consistent across the page (same render = same photo) but
// different brands or a regenerate pulls different photos.
export function photos(brandName: string, queries: PhotoQueries) {
  const base = brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "studio";
  return {
    heroLandscape: flickr(queries.heroQuery, `${base}-hero`, 1200, 600),
    featured: [
      flickr(queries.heroQuery, `${base}-feat-1`, 600, 800),
      flickr(queries.heroQuery, `${base}-feat-2`, 600, 800),
      flickr(queries.heroQuery, `${base}-feat-3`, 600, 800),
    ],
    instagramSquare: flickr(queries.instagramQuery, `${base}-ig`, 800, 800),
    adHero: flickr(queries.adQuery, `${base}-ad`, 1200, 675),
  };
}
