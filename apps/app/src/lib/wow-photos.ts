// Stock photo selection for the wow page previews.
//
// Lorem Flickr serves a real, category-matched photo from Flickr based
// on a tag string. No API key needed. The `lock` seed makes the photo
// stable across renders (same seed = same photo), so when the user
// regenerates we get fresh photos but each render is consistent.

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

// Each entry is a Lorem Flickr tag string — comma-separated keywords
// that bias the photo selection toward the right vibe for that category.
// We avoid super-narrow tags (which can return zero matches) and stick
// to broadly-photographed concepts.
const TAG_SET: Record<WowCategory, string> = {
  fashion: "fashion,clothing,minimal",
  food: "food,plate,restaurant",
  fitness: "fitness,workout,gym",
  tech: "workspace,laptop,minimal",
  services: "office,professional,minimal",
  beauty: "beauty,skincare,minimal",
  creative: "design,art,workspace",
  finance: "office,minimal,architecture",
  home: "interior,home,minimal",
  travel: "travel,landscape,minimal",
  other: "minimal,modern,abstract",
};

function flickr(category: WowCategory, seed: string, w: number, h: number) {
  const tags = TAG_SET[category];
  const safeSeed = encodeURIComponent(seed.slice(0, 32));
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(tags)}?lock=${safeSeed}`;
}

// Each preview surface gets its own deterministic seed off (brandName, role)
// so the same render always returns the same photo, while a different brand
// or a different role pulls a different one.
export function photos(category: WowCategory, brandName: string) {
  const base = brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "studio";
  return {
    heroLandscape: flickr(category, `${base}-hero`, 1200, 600),
    featured: [
      flickr(category, `${base}-feat-1`, 600, 800),
      flickr(category, `${base}-feat-2`, 600, 800),
      flickr(category, `${base}-feat-3`, 600, 800),
    ],
    instagramSquare: flickr(category, `${base}-ig`, 800, 800),
    adHero: flickr(category, `${base}-ad`, 1200, 675),
  };
}
