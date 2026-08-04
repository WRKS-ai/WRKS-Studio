import fs from "node:fs";
import path from "node:path";

// Corpus router — picks 1-2 reference bundles from blueprints/ based on
// the user's brand context (voice_descriptor + business_type +
// primary_goal + optional palette hint). Loads the picked bundles'
// corpus-facing files (character.md + sections.md + voice-map.md) so
// the runner can inject them into the Opus prompt.
//
// The pick is scored, not hardcoded — a user with `warm voice +
// service business` might match Tomorrow's Sunrise 65% and Claxton Law
// 40%, so both get picked (Tomorrow's Sunrise primary, Claxton Law
// secondary) because their voice-maps allow the pairing.
//
// Add a new bundle:
// 1. Add MDs under blueprints/references/{new-id}/
// 2. Add a BundleMeta entry below (voice/business/goal fit + palette
//    + allowedPairs)
// 3. That's it — no other code changes needed.

export type ReferenceBundleId =
  | "personal-brand"
  | "wrks-online"
  | "tomorrows-sunrise"
  | "claxton-law";

export type PaletteHint = "dark" | "light-warm" | "light-clean";

export type RouterInput = {
  voiceDescriptor: string | null;
  businessType: string | null;
  primaryGoal: string | null;
  siteIntent: "has_site" | "no_site" | null;
  paletteHint?: PaletteHint | null;
};

export type PickedReference = {
  id: ReferenceBundleId;
  path: string;
  character: string;
  sections: string;
  voiceMap: string;
  weight: number;
  score: number;
};

export type CorpusPick = {
  primary: PickedReference;
  secondary: PickedReference | null;
  reasoning: string;
};

type BundleMeta = {
  id: ReferenceBundleId;
  path: string; // relative to blueprints/
  primaryVoice: string[];
  secondaryVoice: string[];
  primaryBusiness: string[];
  secondaryBusiness: string[];
  primaryGoals: string[];
  paletteFit: PaletteHint[];
  allowedPairs: ReferenceBundleId[];
};

const BUNDLES: BundleMeta[] = [
  {
    id: "personal-brand",
    path: "personal-brand",
    primaryVoice: ["bold", "warm", "expert"],
    secondaryVoice: ["professional"],
    primaryBusiness: ["personal_brand"],
    secondaryBusiness: ["service", "agency"],
    primaryGoals: ["build_audience", "sell_products", "book_calls", "capture_leads"],
    paletteFit: ["dark"],
    allowedPairs: ["wrks-online"],
  },
  {
    id: "wrks-online",
    path: "references/wrks-online",
    primaryVoice: ["bold", "expert"],
    secondaryVoice: ["professional"],
    primaryBusiness: ["saas", "agency"],
    secondaryBusiness: ["service"],
    primaryGoals: ["book_calls", "sell_products", "fix_conversions"],
    paletteFit: ["dark"],
    allowedPairs: ["personal-brand", "claxton-law"],
  },
  {
    id: "tomorrows-sunrise",
    path: "references/tomorrows-sunrise",
    primaryVoice: ["warm", "quiet"],
    secondaryVoice: ["expert"],
    primaryBusiness: ["personal_brand", "service"],
    secondaryBusiness: ["agency"],
    primaryGoals: ["build_audience", "capture_leads", "book_calls"],
    paletteFit: ["light-warm"],
    allowedPairs: ["claxton-law"],
  },
  {
    id: "claxton-law",
    path: "references/claxton-law",
    primaryVoice: ["professional", "expert"],
    secondaryVoice: ["warm", "bold"],
    primaryBusiness: ["service"],
    secondaryBusiness: ["agency"],
    primaryGoals: ["book_calls", "capture_leads"],
    paletteFit: ["light-clean"],
    allowedPairs: ["tomorrows-sunrise", "wrks-online"],
  },
];

// Scoring weights — tuned so business_type is the strongest signal
// (a saas company should almost always get WRKS Online regardless of
// voice), voice_descriptor is second, palette + goal are tie-breakers.
const SCORE = {
  primaryBusiness: 40,
  secondaryBusiness: 20,
  primaryVoice: 30,
  secondaryVoice: 15,
  paletteMatch: 15,
  primaryGoal: 10,
};

function scoreBundle(meta: BundleMeta, input: RouterInput): number {
  let score = 0;

  if (input.businessType) {
    if (meta.primaryBusiness.includes(input.businessType)) {
      score += SCORE.primaryBusiness;
    } else if (meta.secondaryBusiness.includes(input.businessType)) {
      score += SCORE.secondaryBusiness;
    }
  }

  if (input.voiceDescriptor) {
    if (meta.primaryVoice.includes(input.voiceDescriptor)) {
      score += SCORE.primaryVoice;
    } else if (meta.secondaryVoice.includes(input.voiceDescriptor)) {
      score += SCORE.secondaryVoice;
    }
  }

  if (input.paletteHint && meta.paletteFit.includes(input.paletteHint)) {
    score += SCORE.paletteMatch;
  }

  if (input.primaryGoal && meta.primaryGoals.includes(input.primaryGoal)) {
    score += SCORE.primaryGoal;
  }

  return score;
}

// Secondary is picked only when it scores at least this + is in the
// primary's allowedPairs. 40 = at least one primary-tier match.
const SECONDARY_MIN_SCORE = 40;

export function pickReferences(input: RouterInput): CorpusPick {
  const scored = BUNDLES.map((meta) => ({ meta, score: scoreBundle(meta, input) })).sort(
    (a, b) => b.score - a.score,
  );

  const top = scored[0]!;
  const runnerUp = scored[1];

  const primaryWeight = 1.0;
  const primary = loadReference(top.meta, primaryWeight, top.score);

  let secondary: PickedReference | null = null;
  if (
    runnerUp &&
    runnerUp.score >= SECONDARY_MIN_SCORE &&
    top.meta.allowedPairs.includes(runnerUp.meta.id)
  ) {
    secondary = loadReference(runnerUp.meta, 0.35, runnerUp.score);
    primary.weight = 0.65;
  }

  return {
    primary,
    secondary,
    reasoning: buildReasoning(input, top, runnerUp, !!secondary),
  };
}

function buildReasoning(
  input: RouterInput,
  top: { meta: BundleMeta; score: number },
  runnerUp: { meta: BundleMeta; score: number } | undefined,
  hasSecondary: boolean,
): string {
  const parts: string[] = [];
  parts.push(`Primary: ${top.meta.id} (score ${top.score})`);
  if (hasSecondary && runnerUp) {
    parts.push(`Secondary: ${runnerUp.meta.id} (score ${runnerUp.score})`);
  } else if (runnerUp) {
    const reason = !top.meta.allowedPairs.includes(runnerUp.meta.id)
      ? "not in allowed pairs"
      : `score below ${SECONDARY_MIN_SCORE}`;
    parts.push(`Runner-up ${runnerUp.meta.id} (${runnerUp.score}) skipped: ${reason}`);
  }
  parts.push(
    `Signals: voice=${input.voiceDescriptor ?? "?"} business=${input.businessType ?? "?"} goal=${input.primaryGoal ?? "?"} palette=${input.paletteHint ?? "?"}`,
  );
  return parts.join(" · ");
}

// ============================================================
// File loading — reads the corpus-facing MDs for a picked bundle.
// Module-level cache keeps subsequent generations fast.
// ============================================================

const REPO_ROOT = resolveRepoRoot();
const BLUEPRINTS_DIR = path.join(REPO_ROOT, "blueprints");

function resolveRepoRoot(): string {
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
  return path.resolve(process.cwd(), "..", "..");
}

const referenceCache = new Map<
  ReferenceBundleId,
  { character: string; sections: string; voiceMap: string }
>();

function loadReference(
  meta: BundleMeta,
  weight: number,
  score: number,
): PickedReference {
  const cached = referenceCache.get(meta.id);
  if (cached) {
    return {
      id: meta.id,
      path: meta.path,
      character: cached.character,
      sections: cached.sections,
      voiceMap: cached.voiceMap,
      weight,
      score,
    };
  }

  const read = (rel: string): string => {
    const abs = path.join(BLUEPRINTS_DIR, meta.path, rel);
    try {
      return fs.readFileSync(abs, "utf-8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read corpus file ${meta.path}/${rel}: ${msg}`);
    }
  };

  const character = read("character.md");
  const sections = read("sections.md");
  const voiceMap = read("voice-map.md");

  referenceCache.set(meta.id, { character, sections, voiceMap });

  return {
    id: meta.id,
    path: meta.path,
    character,
    sections,
    voiceMap,
    weight,
    score,
  };
}

// Test / dev tooling only.
export function clearCorpusCache(): void {
  referenceCache.clear();
}
