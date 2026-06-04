// Multi-page site model. Replaces the single-landing-page shape with
// a tree of pages, each composed of typed sections. The voice agent
// adds pages, adds sections, and sets section fields.

export type SectionType =
  | "hero"
  | "feature_grid"
  | "pricing"
  | "testimonials"
  | "faq"
  | "cta_band"
  | "footer"
  | "rich_text";

export type HeroSection = {
  id: string;
  type: "hero";
  eyebrow?: string;
  headline: string;
  subhead: string;
  primaryCta: string;
  secondaryCta?: string;
  imageUrl?: string;
};

export type FeatureGridSection = {
  id: string;
  type: "feature_grid";
  eyebrow?: string;
  title: string;
  subhead?: string;
  features: { title: string; description: string }[];
};

export type PricingSection = {
  id: string;
  type: "pricing";
  eyebrow?: string;
  title: string;
  subhead?: string;
  tiers: {
    name: string;
    price: string;
    cadence: string;
    features: string[];
    cta: string;
    recommended?: boolean;
  }[];
};

export type TestimonialsSection = {
  id: string;
  type: "testimonials";
  eyebrow?: string;
  title: string;
  quotes: { text: string; author: string; role: string }[];
};

export type FaqSection = {
  id: string;
  type: "faq";
  eyebrow?: string;
  title: string;
  items: { question: string; answer: string }[];
};

export type CtaBandSection = {
  id: string;
  type: "cta_band";
  headline: string;
  subhead?: string;
  primaryCta: string;
};

export type FooterSection = {
  id: string;
  type: "footer";
  brand: string;
  tagline?: string;
  columns: { heading: string; links: string[] }[];
};

export type RichTextSection = {
  id: string;
  type: "rich_text";
  title?: string;
  body: string;
};

export type Section =
  | HeroSection
  | FeatureGridSection
  | PricingSection
  | TestimonialsSection
  | FaqSection
  | CtaBandSection
  | FooterSection
  | RichTextSection;

export type Page = {
  id: string;
  slug: string;
  label: string;
  sections: Section[];
};

export type Site = {
  brandName: string;
  activePageId: string;
  pages: Page[];
};

/* ============================================================
 * Helpers
 * ============================================================ */

let idCounter = 0;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "page"
  );
}

/** Render a section to plain text — used by the voice agent to read it. */
export function sectionAsText(s: Section): string {
  switch (s.type) {
    case "hero":
      return `Hero. Headline: ${s.headline}. Subhead: ${s.subhead}. Call to action: ${s.primaryCta}.`;
    case "feature_grid":
      return `Features: ${s.title}. ${s.features.map((f) => `${f.title} — ${f.description}`).join(" | ")}.`;
    case "pricing":
      return `Pricing: ${s.title}. ${s.tiers.map((t) => `${t.name} at ${t.price} ${t.cadence}`).join("; ")}.`;
    case "testimonials":
      return `Testimonials: ${s.title}. ${s.quotes.map((q) => `"${q.text}" — ${q.author}, ${q.role}`).join(" | ")}.`;
    case "faq":
      return `FAQ: ${s.title}. ${s.items.map((i) => `${i.question} ${i.answer}`).join(" | ")}.`;
    case "cta_band":
      return `Call to action: ${s.headline}. ${s.subhead ?? ""} Button: ${s.primaryCta}.`;
    case "footer":
      return `Footer for ${s.brand}. ${s.tagline ?? ""}`;
    case "rich_text":
      return `${s.title ? s.title + ". " : ""}${s.body}`;
  }
}

/* ============================================================
 * Migration: legacy single-landing → multi-page Site
 * ============================================================ */

export type LegacyLanding = {
  headline: string;
  subhead: string;
  primaryCta: string;
  valueBullets: string[];
};

export function migrateLandingToSite({
  brandName,
  landing,
  heroImage,
}: {
  brandName: string;
  landing: LegacyLanding;
  heroImage?: string;
}): Site {
  const homeId = makeId("page");
  const heroId = makeId("section");
  const featuresId = makeId("section");
  const ctaId = makeId("section");

  const home: Page = {
    id: homeId,
    slug: "home",
    label: "Home",
    sections: [
      {
        id: heroId,
        type: "hero",
        eyebrow: "Now showing",
        headline: landing.headline,
        subhead: landing.subhead,
        primaryCta: landing.primaryCta,
        imageUrl: heroImage,
      } satisfies HeroSection,
      {
        id: featuresId,
        type: "feature_grid",
        eyebrow: "Why us",
        title: "What you get",
        features: landing.valueBullets.slice(0, 3).map((b, i) => {
          // Try to split "Title — Description" or "Title: Description"
          const parts = b.split(/\s*[—:]\s*/, 2);
          if (parts.length === 2) {
            return { title: parts[0], description: parts[1] };
          }
          return { title: `Pillar 0${i + 1}`, description: b };
        }),
      } satisfies FeatureGridSection,
      {
        id: ctaId,
        type: "cta_band",
        headline: "Ready when you are.",
        subhead: "Two-minute setup. No card.",
        primaryCta: landing.primaryCta,
      } satisfies CtaBandSection,
    ],
  };

  // A second placeholder page so the page strip has something to show.
  const aboutId = makeId("page");
  const about: Page = {
    id: aboutId,
    slug: "about",
    label: "About",
    sections: [
      {
        id: makeId("section"),
        type: "hero",
        eyebrow: "About",
        headline: `Why ${brandName} exists.`,
        subhead: "Tell the agent what to write here.",
        primaryCta: "Talk to us",
      } satisfies HeroSection,
    ],
  };

  return {
    brandName,
    activePageId: homeId,
    pages: [home, about],
  };
}

/* ============================================================
 * Mutation helpers (used by the voice tools)
 * ============================================================ */

export function addPage(site: Site, label: string): Site {
  const newPage: Page = {
    id: makeId("page"),
    slug: slugify(label),
    label,
    sections: [
      {
        id: makeId("section"),
        type: "hero",
        eyebrow: label.toUpperCase(),
        headline: `${label} — coming together.`,
        subhead: "Tell the agent what to fill in here.",
        primaryCta: "Talk to us",
      } satisfies HeroSection,
    ],
  };
  return {
    ...site,
    pages: [...site.pages, newPage],
    activePageId: newPage.id,
  };
}

export function setActivePage(site: Site, pageId: string): Site {
  if (!site.pages.some((p) => p.id === pageId)) return site;
  return { ...site, activePageId: pageId };
}

export function findPageByLabel(site: Site, spoken: string): Page | null {
  const k = spoken.trim().toLowerCase();
  if (!k) return null;
  for (const p of site.pages) {
    if (p.slug === k || p.label.toLowerCase() === k) return p;
  }
  for (const p of site.pages) {
    if (p.label.toLowerCase().includes(k) || k.includes(p.label.toLowerCase()))
      return p;
  }
  return null;
}

export function addSection(
  site: Site,
  pageId: string,
  type: SectionType,
): Site {
  const pages = site.pages.map((p) => {
    if (p.id !== pageId) return p;
    const section = makeStarterSection(type);
    return { ...p, sections: [...p.sections, section] };
  });
  return { ...site, pages };
}

function makeStarterSection(type: SectionType): Section {
  const id = makeId("section");
  switch (type) {
    case "hero":
      return {
        id,
        type,
        eyebrow: "New hero",
        headline: "Replace with your headline.",
        subhead: "And the subhead.",
        primaryCta: "Get started",
      };
    case "feature_grid":
      return {
        id,
        type,
        title: "Three reasons to pick us",
        features: [
          { title: "Speed", description: "Built for momentum." },
          { title: "Clarity", description: "No corporate filler." },
          { title: "Results", description: "Outcomes you can point to." },
        ],
      };
    case "pricing":
      return {
        id,
        type,
        title: "Simple pricing",
        tiers: [
          {
            name: "Starter",
            price: "$0",
            cadence: "free",
            features: ["Core access"],
            cta: "Start free",
          },
          {
            name: "Pro",
            price: "$29",
            cadence: "per month",
            features: ["Everything in Starter", "More of it"],
            cta: "Go Pro",
            recommended: true,
          },
        ],
      };
    case "testimonials":
      return {
        id,
        type,
        title: "What people say",
        quotes: [
          {
            text: "Game-changing — replace this quote.",
            author: "Name",
            role: "Role",
          },
        ],
      };
    case "faq":
      return {
        id,
        type,
        title: "Frequently asked",
        items: [
          { question: "Question one?", answer: "Answer goes here." },
          { question: "Question two?", answer: "And another." },
        ],
      };
    case "cta_band":
      return {
        id,
        type,
        headline: "Ready to start?",
        subhead: "Two-minute setup.",
        primaryCta: "Get started",
      };
    case "footer":
      return {
        id,
        type,
        brand: "Brand",
        tagline: "Tagline goes here.",
        columns: [
          { heading: "Product", links: ["Features", "Pricing", "Changelog"] },
          { heading: "Company", links: ["About", "Careers", "Contact"] },
        ],
      };
    case "rich_text":
      return { id, type, title: "Section title", body: "Body copy here." };
  }
}

/**
 * Set a field on a section. The field path can be dot/bracket notation:
 *   "headline" → s.headline
 *   "features.0.title" → s.features[0].title
 *   "tiers.1.price" → s.tiers[1].price
 *
 * Returns a new Site with the mutation applied, or null if the path/section
 * doesn't exist or the type doesn't match the targeted field.
 */
export function setSectionField(
  site: Site,
  pageId: string,
  sectionId: string,
  fieldPath: string,
  value: string,
): { site: Site; ok: boolean; reason?: string } {
  const pageIdx = site.pages.findIndex((p) => p.id === pageId);
  if (pageIdx < 0) return { site, ok: false, reason: "page not found" };
  const page = site.pages[pageIdx];
  const secIdx = page.sections.findIndex((s) => s.id === sectionId);
  if (secIdx < 0) return { site, ok: false, reason: "section not found" };

  const original = page.sections[secIdx];
  const next = JSON.parse(JSON.stringify(original)) as Section;
  const path: (string | number)[] = fieldPath
    .split(".")
    .map((seg) => (/^\d+$/.test(seg) ? parseInt(seg, 10) : seg));

  // Walk the path
  let cursor: unknown = next;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (cursor === null || typeof cursor !== "object")
      return { site, ok: false, reason: `path stuck at ${key}` };
    cursor = (cursor as Record<string, unknown>)[String(key)];
  }
  if (cursor === null || typeof cursor !== "object")
    return { site, ok: false, reason: "leaf parent missing" };

  const leaf = path[path.length - 1];
  (cursor as Record<string, unknown>)[String(leaf)] = value;

  const newSections = [...page.sections];
  newSections[secIdx] = next;
  const newPages = [...site.pages];
  newPages[pageIdx] = { ...page, sections: newSections };
  return { site: { ...site, pages: newPages }, ok: true };
}
