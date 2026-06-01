// Pexels image search — properly curated stock photos, free tier
// gives 200 req/hour with API key. Server-side only (reads env var).
//
// Get a key at pexels.com/api — free, instant. Add to .env.local
// and Vercel as PEXELS_API_KEY.
//
// Falls back to Lorem Flickr when the key isn't set so the flow
// still works without setup, just with lower-quality photos.

export type PexelsOrientation = "landscape" | "portrait" | "square";

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  photographer: string;
};

type PexelsResponse = {
  photos: PexelsPhoto[];
  total_results: number;
};

const SIZE_BY_ORIENTATION: Record<PexelsOrientation, keyof PexelsPhoto["src"]> = {
  landscape: "landscape",
  portrait: "portrait",
  square: "large",
};

function flickrFallback(query: string, w: number, h: number, seed: string): string {
  const tag =
    query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)[0] || "minimal";
  const safeSeed = encodeURIComponent(seed.slice(0, 32));
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(tag)}?lock=${safeSeed}`;
}

/**
 * Search Pexels and return a single photo URL matching the query +
 * orientation. Picks one of the top results by `seed` so the same
 * input is stable across renders. Returns a Lorem Flickr URL when
 * PEXELS_API_KEY isn't configured.
 */
export async function pexelsSearch(
  query: string,
  orientation: PexelsOrientation,
  seed: string,
  fallbackDims: { w: number; h: number },
): Promise<string> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    return flickrFallback(query, fallbackDims.w, fallbackDims.h, seed);
  }

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "10");
    url.searchParams.set("orientation", orientation);

    const res = await fetch(url, {
      headers: { Authorization: key },
      // Cache identical queries for 1 hour at the edge so repeat sessions
      // don't burn rate-limit
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return flickrFallback(query, fallbackDims.w, fallbackDims.h, seed);
    }
    const data = (await res.json()) as PexelsResponse;
    if (!data.photos?.length) {
      return flickrFallback(query, fallbackDims.w, fallbackDims.h, seed);
    }

    // Pick stable index off seed so same brand+role pulls same photo
    const idx =
      Math.abs(hashString(seed)) % Math.min(data.photos.length, 10);
    const photo = data.photos[idx]!;
    const sizeKey = SIZE_BY_ORIENTATION[orientation];
    return photo.src[sizeKey] ?? photo.src.large;
  } catch {
    return flickrFallback(query, fallbackDims.w, fallbackDims.h, seed);
  }
}

// Simple deterministic string hash for picking a stable photo from the
// returned list. Not crypto — just needs to be the same number for the
// same input.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
