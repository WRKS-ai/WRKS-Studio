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
 * Fetch the top N distinct photos for a query+orientation. Used when
 * one query feeds multiple surfaces (e.g. hero + 3 featured tiles) so
 * we get 4 different photos from a single search instead of 4 calls
 * that all return the same #1 result.
 *
 * Falls back to per-index Lorem Flickr URLs if PEXELS_API_KEY is missing.
 */
export async function pexelsSearchN(
  query: string,
  orientation: PexelsOrientation,
  count: number,
  seedBase: string,
  fallbackDims: { w: number; h: number },
): Promise<string[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    return Array.from({ length: count }, (_, i) =>
      flickrFallback(query, fallbackDims.w, fallbackDims.h, `${seedBase}-${i}`),
    );
  }

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    // Always pull a generous pool so we have headroom to pick distinct
    // results — `per_page` of 30 gives us index 0..29 to slice from.
    url.searchParams.set("per_page", String(Math.max(30, count * 4)));
    url.searchParams.set("orientation", orientation);

    const res = await fetch(url, {
      headers: { Authorization: key },
      // Cache identical queries for 1h at the edge
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return Array.from({ length: count }, (_, i) =>
        flickrFallback(
          query,
          fallbackDims.w,
          fallbackDims.h,
          `${seedBase}-${i}`,
        ),
      );
    }
    const data = (await res.json()) as PexelsResponse;
    if (!data.photos?.length) {
      return Array.from({ length: count }, (_, i) =>
        flickrFallback(
          query,
          fallbackDims.w,
          fallbackDims.h,
          `${seedBase}-${i}`,
        ),
      );
    }

    const sizeKey = SIZE_BY_ORIENTATION[orientation];
    // Offset into the result list by a seed-hash so different brands with
    // the same query get different photos — but each brand's slice is
    // contiguous & distinct.
    const offset =
      Math.abs(hashString(seedBase)) % Math.max(1, data.photos.length - count);
    const slice = data.photos.slice(offset, offset + count);

    // De-dupe by photo ID in case Pexels returned dupes (shouldn't happen,
    // but the cost of being wrong here is the bug we're fixing)
    const seenIds = new Set<number>();
    const urls: string[] = [];
    for (const photo of slice) {
      if (seenIds.has(photo.id)) continue;
      seenIds.add(photo.id);
      urls.push(photo.src[sizeKey] ?? photo.src.large);
      if (urls.length >= count) break;
    }
    // Top up if we somehow didn't get enough after de-dupe
    while (urls.length < count) {
      const remaining = data.photos.filter((p) => !seenIds.has(p.id));
      if (!remaining.length) break;
      const photo = remaining[0]!;
      seenIds.add(photo.id);
      urls.push(photo.src[sizeKey] ?? photo.src.large);
    }
    // Final fallback if pool was too small
    while (urls.length < count) {
      urls.push(
        flickrFallback(
          query,
          fallbackDims.w,
          fallbackDims.h,
          `${seedBase}-${urls.length}`,
        ),
      );
    }
    return urls;
  } catch {
    return Array.from({ length: count }, (_, i) =>
      flickrFallback(query, fallbackDims.w, fallbackDims.h, `${seedBase}-${i}`),
    );
  }
}

/**
 * Single-photo convenience wrapper around pexelsSearchN — for surfaces
 * with their own unique query (Instagram, Ad).
 */
export async function pexelsSearch(
  query: string,
  orientation: PexelsOrientation,
  seed: string,
  fallbackDims: { w: number; h: number },
): Promise<string> {
  const [url] = await pexelsSearchN(
    query,
    orientation,
    1,
    seed,
    fallbackDims,
  );
  return url!;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
