// Slug rules shared by the API, the availability checker, and the client
// modal so validation matches everywhere.
//
// Keep in sync with the DB check constraints on published_sites.slug.

export const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export const RESERVED_SLUGS = new Set<string>([
  "www", "api", "admin", "app", "apps", "studio", "mail", "ftp",
  "test", "dev", "staging", "preview", "blog", "docs", "help",
  "support", "contact", "dashboard", "home", "marketing", "wrks",
  "wrksstudio", "root", "cdn", "static", "assets", "public", "private",
]);

// Turn a brand name / free text into a candidate slug.
// "Acme Studio" -> "acme-studio"
// "Björn's Café" -> "bjrns-caf"  (non-ASCII stripped for DNS safety)
export function suggestSlug(seed: string): string {
  return seed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Validate a slug against format + reserved rules. Returns null if OK,
// or a short user-facing reason string.
export function validateSlug(slug: string): string | null {
  if (!slug) return "Address can't be empty.";
  if (slug.length < 1) return "Address is too short.";
  if (slug.length > 63) return "Address is too long (max 63 characters).";
  if (!SLUG_REGEX.test(slug)) {
    return "Use lowercase letters, numbers, and hyphens.";
  }
  if (RESERVED_SLUGS.has(slug)) return "That address is reserved.";
  return null;
}
