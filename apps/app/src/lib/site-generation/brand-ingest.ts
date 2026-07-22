import { load } from "cheerio";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";

extend([namesPlugin]);

// Deep brand-ingest for the v3 generation pipeline.
//
// Given a URL, fetches the page + a small handful of linked stylesheets
// and extracts structured brand data that Opus can use to generate a
// bespoke site: palette (from inline styles + external CSS), fonts
// (from CSS + Google Fonts links), logo, hero image, existing headline,
// testimonials, and business_type / voice cues.
//
// Uses cheerio (server-side jQuery) for DOM traversal and colord for
// color parsing. NO Playwright — too heavy for serverless. That means
// we can't extract computed styles from JS-rendered sites; we work off
// server-rendered HTML + linked CSS only.
//
// Runs in ≤10s for typical sites (single fetch + up to 3 stylesheet
// fetches in parallel).

export type IngestedBrand = {
  url: string;
  brandName: string | null;
  existingHeadline: string | null;
  existingSubhead: string | null;
  pageTitle: string | null;
  pageDescription: string | null;
  logo: {
    src: string | null;                     // absolute URL
    alt: string | null;
  };
  heroImage: string | null;                 // og:image or first large image
  favicon: string | null;
  palette: {
    // Ordered by prominence (most-used color first)
    colors: Array<{
      hex: string;
      count: number;                        // how many times this color appears in styles
      role: "primary" | "secondary" | "tertiary" | "neutral-warm" | "neutral-dark" | "unclassified";
    }>;
  };
  typefaces: {
    display: string | null;                 // largest font-family in headings
    body: string | null;                    // dominant font-family in body
    googleFonts: string[];                  // any Google Fonts family names detected
  };
  testimonials: Array<{
    quote: string;
    attribution: string | null;
  }>;
  socialLinks: {
    youtube: string | null;
    instagram: string | null;
    tiktok: string | null;
    linkedin: string | null;
    twitter: string | null;
  };
  detectedVerticals: string[];              // heuristic tags: "trading", "coaching", "ecommerce", etc.
  raw: {
    fetchedBytes: number;
    stylesheetsFetched: number;
    durationMs: number;
  };
};

const FETCH_TIMEOUT_MS = 8_000;
const CSS_TIMEOUT_MS = 4_000;
const MAX_STYLESHEETS = 3;
const USER_AGENT =
  "WRKS-Studio-Ingest/1.0 (+https://app.slightwrks.com) Mozilla/5.0";

export async function ingestBrand(rawUrl: string): Promise<IngestedBrand> {
  const started = Date.now();
  const url = normalizeUrl(rawUrl);

  const html = await fetchText(url.toString(), FETCH_TIMEOUT_MS);
  const $ = load(html);

  const pageTitle = $("title").first().text().trim() || null;
  const pageDescription =
    $('meta[property="og:description"]').attr("content") ??
    $('meta[name="description"]').attr("content") ??
    null;

  const brandName = extractBrandName($, pageTitle, url);
  const existingHeadline = extractHeadline($);
  const existingSubhead = extractSubhead($);
  const logo = extractLogo($, url);
  const heroImage = extractHeroImage($, url);
  const favicon = extractFavicon($, url);
  const socialLinks = extractSocialLinks($);
  const testimonials = extractTestimonials($);
  const detectedVerticals = detectVerticals($, html);

  // Palette + typefaces need CSS. Grab up to N linked stylesheets in
  // parallel, plus inline <style> blocks. Best-effort; failures per-
  // stylesheet don't break the ingest.
  const inlineCss = $("style")
    .map((_, el) => $(el).text())
    .get()
    .join("\n");

  const stylesheetUrls = extractStylesheetUrls($, url).slice(0, MAX_STYLESHEETS);
  const stylesheets = await Promise.all(
    stylesheetUrls.map((u) => fetchText(u, CSS_TIMEOUT_MS).catch(() => "")),
  );
  const combinedCss = [inlineCss, ...stylesheets].join("\n");

  const palette = extractPalette(combinedCss, $);
  const typefaces = extractTypefaces(combinedCss, $);

  return {
    url: url.toString(),
    brandName,
    existingHeadline,
    existingSubhead,
    pageTitle,
    pageDescription,
    logo,
    heroImage,
    favicon,
    palette,
    typefaces,
    testimonials,
    socialLinks,
    detectedVerticals,
    raw: {
      fetchedBytes: html.length,
      stylesheetsFetched: stylesheets.filter((s) => s.length > 0).length,
      durationMs: Date.now() - started,
    },
  };
}

// ============================================================
// URL / fetch helpers
// ============================================================

function normalizeUrl(raw: string): URL {
  const withProto = raw.trim().startsWith("http")
    ? raw.trim()
    : `https://${raw.trim()}`;
  return new URL(withProto);
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,text/css,*/*;q=0.9" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function resolveAbsolute(base: URL, maybePath: string | null | undefined): string | null {
  if (!maybePath) return null;
  try {
    return new URL(maybePath, base).toString();
  } catch {
    return null;
  }
}

// ============================================================
// Copy / metadata extraction
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cheerio$ = any;

function extractBrandName(
  $: Cheerio$,
  pageTitle: string | null,
  url: URL,
): string | null {
  // og:site_name > title first word > hostname (stripped)
  const og = $('meta[property="og:site_name"]').attr("content")?.trim();
  if (og) return og;
  if (pageTitle) {
    const cleaned = pageTitle
      .split(/\s[|—\-–]\s/)[0]
      .trim();
    if (cleaned.length > 0 && cleaned.length < 60) return cleaned;
  }
  return url.hostname.replace(/^www\./, "").split(".")[0];
}

function extractHeadline($: Cheerio$): string | null {
  const h1 = $("h1").first().text().trim();
  return h1.length > 0 ? h1.slice(0, 200) : null;
}

function extractSubhead($: Cheerio$): string | null {
  // The paragraph directly after the first h1, if any
  const firstH1 = $("h1").first();
  if (firstH1.length === 0) return null;
  const next = firstH1.nextAll("p").first().text().trim();
  return next.length > 0 ? next.slice(0, 400) : null;
}

function extractLogo(
  $: Cheerio$,
  url: URL,
): { src: string | null; alt: string | null } {
  // Prefer <img> with alt/class matching "logo" or inside a header/nav
  let bestSrc: string | null = null;
  let bestAlt: string | null = null;
  $("img").each((_: number, el: unknown) => {
    if (bestSrc) return;
    const $img = $(el);
    const alt = ($img.attr("alt") ?? "").toLowerCase();
    const cls = ($img.attr("class") ?? "").toLowerCase();
    const src = $img.attr("src");
    if (!src) return;
    const inHeader =
      $img.parents("header, nav").length > 0 ||
      $img.parents('[class*="header"], [class*="nav"], [class*="logo"]').length > 0;
    const looksLikeLogo =
      alt.includes("logo") ||
      cls.includes("logo") ||
      inHeader;
    if (looksLikeLogo) {
      bestSrc = resolveAbsolute(url, src);
      bestAlt = $img.attr("alt")?.trim() || null;
    }
  });
  return { src: bestSrc, alt: bestAlt };
}

function extractHeroImage($: Cheerio$, url: URL): string | null {
  const og =
    $('meta[property="og:image"]').attr("content") ??
    $('meta[name="twitter:image"]').attr("content");
  if (og) return resolveAbsolute(url, og);

  // Fallback: first <img> whose width attr suggests large size, or
  // the first <img> inside a main / section element
  let hero: string | null = null;
  $("main img, section img").each((_: number, el: unknown) => {
    if (hero) return;
    const src = $(el).attr("src");
    if (src) hero = resolveAbsolute(url, src);
  });
  return hero;
}

function extractFavicon($: Cheerio$, url: URL): string | null {
  const href =
    $('link[rel="icon"]').first().attr("href") ??
    $('link[rel="shortcut icon"]').first().attr("href") ??
    "/favicon.ico";
  return resolveAbsolute(url, href);
}

function extractSocialLinks($: Cheerio$): IngestedBrand["socialLinks"] {
  const links = { youtube: null, instagram: null, tiktok: null, linkedin: null, twitter: null } as IngestedBrand["socialLinks"];
  $("a[href]").each((_: number, el: unknown) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href) return;
    if (!links.youtube && /(?:^|\/\/)(?:www\.)?youtube\.com\//i.test(href)) links.youtube = href;
    if (!links.instagram && /(?:^|\/\/)(?:www\.)?instagram\.com\//i.test(href)) links.instagram = href;
    if (!links.tiktok && /(?:^|\/\/)(?:www\.)?tiktok\.com\//i.test(href)) links.tiktok = href;
    if (!links.linkedin && /(?:^|\/\/)(?:www\.)?linkedin\.com\//i.test(href)) links.linkedin = href;
    if (!links.twitter && /(?:^|\/\/)(?:www\.)?(?:twitter|x)\.com\//i.test(href)) links.twitter = href;
  });
  return links;
}

function extractTestimonials(
  $: Cheerio$,
): Array<{ quote: string; attribution: string | null }> {
  const out: Array<{ quote: string; attribution: string | null }> = [];
  // <blockquote> is the most reliable signal
  $("blockquote").each((_: number, el: unknown) => {
    const quote = $(el).text().trim().replace(/\s+/g, " ");
    if (quote.length < 30 || quote.length > 500) return;
    const attribution =
      $(el).find("cite").first().text().trim() ||
      $(el).next("cite, figcaption").text().trim() ||
      null;
    out.push({ quote: quote.slice(0, 400), attribution });
  });
  // <figure> with quote pattern
  if (out.length < 3) {
    $('figure').each((_: number, el: unknown) => {
      const q = $(el).find("blockquote, .quote, [class*='quote']").text().trim();
      if (q.length < 30 || q.length > 500) return;
      const caption = $(el).find("figcaption").text().trim() || null;
      out.push({ quote: q.slice(0, 400), attribution: caption });
    });
  }
  return out.slice(0, 6);
}

function detectVerticals($: Cheerio$, html: string): string[] {
  const text = ($("body").text() || html).toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["trading", /options?\s+trading|day\s+trad|stock\s+market|watchlist/],
    ["coaching", /coach(?:ing)?|mentor|mentee|1[:\-]on[:\-]1/],
    ["saas", /(?:free\s+)?trial|pricing|per\s+month|sign\s+up\s+for\s+free|integrations/],
    ["ecommerce", /add\s+to\s+cart|shop\s+now|free\s+shipping|checkout/],
    ["consulting", /consulting|consultant|engagement|discovery\s+call/],
    ["agency", /portfolio|our\s+work|case\s+studies|agency|clients?\s+include/],
    ["community", /join\s+the\s+community|discord|members?\s+only/],
    ["masterclass", /masterclass|cohort|course|curriculum|module/],
    ["newsletter", /subscribe|weekly\s+newsletter|inbox/],
    ["hr", /human\s+resources|hr\s+consult|chro|talent/],
  ];
  const tags: string[] = [];
  for (const [tag, re] of rules) if (re.test(text)) tags.push(tag);
  return tags;
}

// ============================================================
// CSS extraction — palette + typefaces
// ============================================================

function extractStylesheetUrls($: Cheerio$, url: URL): string[] {
  const urls: string[] = [];
  $('link[rel="stylesheet"]').each((_: number, el: unknown) => {
    const href = $(el).attr("href");
    const abs = resolveAbsolute(url, href);
    if (abs) urls.push(abs);
  });
  return urls;
}

function extractPalette(css: string, $: Cheerio$): IngestedBrand["palette"] {
  const counts = new Map<string, number>();
  const bump = (raw: string) => {
    const c = colord(raw);
    if (!c.isValid()) return;
    const hex = c.toHex().toLowerCase();
    // Skip near-black / near-white — captured in neutrals separately
    if (hex === "#000000" || hex === "#ffffff") return;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  };

  // Extract hex, rgb, rgba, hsl, named colors from CSS declarations
  const hexRe = /#[0-9a-f]{3,8}\b/gi;
  const rgbRe = /rgba?\(\s*\d+[\d\s.,%/]*\)/gi;
  const hslRe = /hsla?\(\s*\d+[\d\s.,%/]*\)/gi;
  for (const m of css.matchAll(hexRe)) bump(m[0]);
  for (const m of css.matchAll(rgbRe)) bump(m[0]);
  for (const m of css.matchAll(hslRe)) bump(m[0]);

  // Inline styles on elements
  $("[style]").each((_: number, el: unknown) => {
    const s = $(el).attr("style") ?? "";
    for (const m of s.matchAll(hexRe)) bump(m[0]);
    for (const m of s.matchAll(rgbRe)) bump(m[0]);
  });

  const sorted = Array.from(counts.entries())
    .map(([hex, count]) => ({ hex, count }))
    .sort((a, b) => b.count - a.count);

  // Score colors — chromatic first, then saturation, then count
  const scored = sorted
    .map(({ hex, count }) => {
      const c = colord(hex);
      const { s, l } = c.toHsl();
      return { hex, count, saturation: s, lightness: l };
    })
    .filter((c) => c.saturation > 8 || (c.lightness < 20 || c.lightness > 88));

  // Pick roles: primary = highest-count chromatic; secondary = next distinct
  // hue; tertiary = another distinct hue; neutrals = extremes.
  const chromatic = scored.filter((c) => c.saturation > 15).sort((a, b) => b.count - a.count);
  const neutrals = scored.filter((c) => c.saturation <= 15).sort((a, b) => b.count - a.count);

  const roled: IngestedBrand["palette"]["colors"] = [];
  const seenHues = new Set<number>();
  const hueBucket = (h: number) => Math.round(h / 30);

  const assign = (
    entry: (typeof chromatic)[number] | undefined,
    role: IngestedBrand["palette"]["colors"][number]["role"],
  ) => {
    if (!entry) return;
    roled.push({ hex: entry.hex, count: entry.count, role });
    seenHues.add(hueBucket(colord(entry.hex).toHsl().h));
  };

  const primary = chromatic[0];
  assign(primary, "primary");

  const secondary = chromatic.find(
    (c) => !seenHues.has(hueBucket(colord(c.hex).toHsl().h)),
  );
  assign(secondary, "secondary");

  const tertiary = chromatic.find(
    (c) => !seenHues.has(hueBucket(colord(c.hex).toHsl().h)),
  );
  assign(tertiary, "tertiary");

  const warm = neutrals.find((n) => n.lightness > 85);
  assign(warm, "neutral-warm");

  const dark = neutrals.find((n) => n.lightness < 20);
  assign(dark, "neutral-dark");

  return { colors: roled };
}

function extractTypefaces(css: string, $: Cheerio$): IngestedBrand["typefaces"] {
  // font-family declarations in CSS
  const familyRe = /font-family\s*:\s*([^;{}]+)[;}]/gi;
  const families = new Map<string, number>();
  const bump = (family: string) => {
    // Just the first name in the stack
    const first = family
      .split(",")[0]
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!first) return;
    if (/^(?:inherit|initial|unset|serif|sans-serif|monospace|system-ui|-apple-system|ui-serif|ui-sans-serif|ui-monospace)$/i.test(first)) return;
    families.set(first, (families.get(first) ?? 0) + 1);
  };
  for (const m of css.matchAll(familyRe)) bump(m[1]);

  // Google Fonts link tags → parse ?family=Geist|Fraunces:wght@…
  const googleFonts = new Set<string>();
  $('link[href*="fonts.googleapis.com"]').each((_: number, el: unknown) => {
    const href = $(el).attr("href") ?? "";
    const params = new URLSearchParams(href.split("?")[1] ?? "");
    const family = params.getAll("family");
    for (const f of family) {
      // "Geist:wght@400;500" → "Geist"
      const name = f.split(":")[0].replace(/\+/g, " ");
      if (name) googleFonts.add(name);
    }
  });

  // Body font = most-used family; display = family used on h1 (from CSS)
  const sorted = Array.from(families.entries()).sort((a, b) => b[1] - a[1]);
  const body = sorted[0]?.[0] ?? Array.from(googleFonts)[0] ?? null;
  const display =
    sorted.find(([name]) => new RegExp(`h1[^{]*\\{[^}]*font-family[^;]*${escapeRe(name)}`, "i").test(css))?.[0] ??
    Array.from(googleFonts)[0] ??
    body;

  return {
    display,
    body,
    googleFonts: Array.from(googleFonts),
  };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
