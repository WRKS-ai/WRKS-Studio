import fs from "node:fs";
import path from "node:path";

// Reads the MD blueprint files from the repo and caches them at module
// scope so subsequent generations don't re-read from disk.
//
// The blueprints/ directory lives at the repo root (not inside apps/app/).
// Path resolution uses `process.cwd()` — Next.js dev + build both cwd
// into the app directory, so we resolve up to the workspace root.

const REPO_ROOT = resolveRepoRoot();
const BLUEPRINTS_DIR = path.join(REPO_ROOT, "blueprints");

function resolveRepoRoot(): string {
  // Walk up from cwd until we find a `blueprints/` directory sibling
  // to `apps/`. Fallback to cwd + "../.." (the typical
  // apps/app → workspace root path).
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "blueprints");
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback
  return path.resolve(process.cwd(), "..", "..");
}

let cache: BlueprintBundle | null = null;

export type BlueprintBundle = {
  design: string;                             // DESIGN.md
  composition: string;                        // personal-brand/home.md
  sections: {
    nav: string;
    hero: string;
    megaBento: string;
    watchlist: string;
    community: string;
    helpGrid: string;
    spotlight: string;
    heroSplit: string;
    reviews: string;
    youtubeCta: string;
    aboutFounder: string;
  };
};

export function loadBlueprints(): BlueprintBundle {
  if (cache) return cache;

  const readSafe = (rel: string): string => {
    const abs = path.join(BLUEPRINTS_DIR, rel);
    try {
      return fs.readFileSync(abs, "utf-8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read blueprint ${rel} at ${abs}: ${msg}`);
    }
  };

  cache = {
    design: readSafe("DESIGN.md"),
    composition: readSafe("personal-brand/home.md"),
    sections: {
      nav: readSafe("personal-brand/sections/nav.md"),
      hero: readSafe("personal-brand/sections/hero.md"),
      megaBento: readSafe("personal-brand/sections/mega-bento.md"),
      watchlist: readSafe("personal-brand/sections/watchlist.md"),
      community: readSafe("personal-brand/sections/community.md"),
      helpGrid: readSafe("personal-brand/sections/help-grid.md"),
      spotlight: readSafe("personal-brand/sections/spotlight.md"),
      heroSplit: readSafe("personal-brand/sections/hero-split.md"),
      reviews: readSafe("personal-brand/sections/reviews.md"),
      youtubeCta: readSafe("personal-brand/sections/youtube-cta.md"),
      aboutFounder: readSafe("personal-brand/sections/about-founder.md"),
    },
  };

  return cache;
}

// For tests / dev tooling only.
export function clearBlueprintCache(): void {
  cache = null;
}
