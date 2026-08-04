import { ingestBrand, type IngestedBrand } from "./brand-ingest";
import { generateHtmlDocument } from "./generate-html";
import { curateImagePack } from "./image-curator";
import type { BrandContext } from "./design-system";
import { normalizeGenerationError } from "./error-normalize";
import {
  markJobError,
  markJobReadyWithPages,
  updateJobPhase,
  type StoredPage,
} from "./job-store";
import { planPages } from "./page-planner";

// runGenerationJob — the actual work, decoupled from any HTTP request
// lifecycle. Runs ingest + Opus + persists HTML to Supabase. Updates
// the phase columns as it goes so the polling client can show live
// progress independent of whether any SSE/HTTP connection is open.
//
// This is called fire-and-forget from POST /api/sites/generate. On
// Vercel we'd need to convert to Inngest / queue worker for reliable
// completion, but for localhost + short-lived deploys it works.

export type RunnerInput = {
  jobId: string;
  brief: string;
  brand: BrandContext;
  siteIntent?: "has_site" | "no_site" | null;
};

export async function runGenerationJob(input: RunnerInput): Promise<void> {
  const { jobId, brief, brand, siteIntent } = input;

  try {
    // ------------------------------------------------------
    // Phase 1: brand ingest (if URL available)
    // ------------------------------------------------------
    let ingest: IngestedBrand | null = null;
    const ingestUrl = brand.existingSiteUrl;

    if (ingestUrl) {
      await updateJobPhase(
        jobId,
        "ingest",
        `Reading ${new URL(ingestUrl).hostname} — extracting palette, typography, hero copy, testimonials.`,
      );
      try {
        ingest = await ingestBrand(ingestUrl);
        await updateJobPhase(jobId, "ingest.done", "Ingest complete.", {
          brandName: ingest.brandName,
          palette: ingest.palette.colors.map((c) => ({ hex: c.hex, role: c.role })),
          typefaces: ingest.typefaces,
          heroImage: ingest.heroImage,
          logo: ingest.logo.src,
          testimonialsFound: ingest.testimonials.length,
          verticals: ingest.detectedVerticals,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[runner] ingest failed, continuing without:", msg);
        await updateJobPhase(
          jobId,
          "ingest.skipped",
          `Couldn't read that URL — generating from the brief alone.`,
        );
      }
    } else {
      await updateJobPhase(
        jobId,
        "ingest.skipped",
        "No existing site to read — generating from brand context alone.",
      );
    }

    // ------------------------------------------------------
    // Phase 1b: build the image-slot map. If ingest found a real
    // hero photo we use it; every other slot is a designed placeholder
    // the user fills in via the inline editor after generation.
    // ------------------------------------------------------
    const imagePack = await curateImagePack(brand, ingest);
    await updateJobPhase(jobId, "images.done", "Image slots ready — placeholders for you to fill in.", {
      heroSource: imagePack.attribution.heroSource,
      placeholderCount:
        (imagePack.hero.kind === "placeholder" ? 1 : 0) +
        imagePack.supporting.filter((s) => s.kind === "placeholder").length +
        (imagePack.founder.kind === "placeholder" ? 1 : 0),
    });

    // ------------------------------------------------------
    // Phase 2: page-by-page generation. Loops through the planned pages
    // (Home + supporting pages), calling Opus once per page. Home first
    // so the theater canvas can render it while the rest generate.
    // ------------------------------------------------------
    const plan = planPages(brand);
    console.log(
      `[runner] job ${jobId} planned ${plan.length} pages: ${plan.map((p) => p.path).join(", ")}`,
    );

    const generatedPages: StoredPage[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let i = 0; i < plan.length; i++) {
      const page = plan[i]!;
      const pageIndex = i + 1;

      await updateJobPhase(
        jobId,
        `generate.page.${i}`,
        i === 0
          ? `Drafting your home page — page ${pageIndex} of ${plan.length}.`
          : `Drafting your ${page.navLabel.toLowerCase()} page — page ${pageIndex} of ${plan.length}.`,
        { pageIndex, totalPages: plan.length, currentPath: page.path },
      );

      // Throttle progress updates per page.
      let lastPush = 0;
      const result = await generateHtmlDocument(
        {
          brief,
          brand,
          ingest,
          imagePack,
          siteIntent: siteIntent ?? null,
          pageType: page.pageType,
          pagePlan: plan,
        },
        (ev) => {
          const now = Date.now();
          if (now - lastPush > 2000) {
            lastPush = now;
            void updateJobPhase(
              jobId,
              "generate.progress",
              `Writing ${page.navLabel.toLowerCase()}… ${Math.round(ev.totalChars / 1000)}kb so far (page ${pageIndex}/${plan.length}).`,
              { chars: ev.totalChars, pageIndex, totalPages: plan.length },
            );
          }
        },
      );

      generatedPages.push({
        path: page.path,
        html: result.html,
        title: page.title,
      });
      totalInputTokens += result.modelUsage.inputTokens;
      totalOutputTokens += result.modelUsage.outputTokens;

      console.log(
        `[runner] job ${jobId} page ${page.path} ready: ${result.html.length} bytes`,
      );
    }

    // ------------------------------------------------------
    // Phase 3: persist all pages
    // ------------------------------------------------------
    await markJobReadyWithPages(jobId, generatedPages, ingest);
    console.log(
      `[runner] job ${jobId} ready: ${generatedPages.length} pages, ${totalInputTokens}/${totalOutputTokens} tokens total`,
    );
  } catch (err) {
    // Raw error goes to server logs for debugging. Users only ever see
    // the normalized user-facing message that we persist to the DB.
    const rawMsg = err instanceof Error ? err.message : String(err);
    const normalized = normalizeGenerationError(err);
    console.error(
      `[runner] job ${jobId} FAILED [${normalized.category}]:`,
      rawMsg,
    );
    try {
      await markJobError(jobId, normalized.userMessage);
    } catch (persistErr) {
      console.error(`[runner] failed to persist error for ${jobId}:`, persistErr);
    }
  }
}
