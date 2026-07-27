import { ingestBrand, type IngestedBrand } from "./brand-ingest";
import { generateHtmlDocument } from "./generate-html";
import type { BrandContext } from "./design-system";
import {
  markJobError,
  markJobReadyHtml,
  updateJobPhase,
} from "./job-store";

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
};

export async function runGenerationJob(input: RunnerInput): Promise<void> {
  const { jobId, brief, brand } = input;

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
    // Phase 2: Opus 4.7 emits full HTML
    // ------------------------------------------------------
    await updateJobPhase(
      jobId,
      "generate",
      "Drafting your site — 10 sections, tailored to your palette, voice, and offer. About 4-5 minutes.",
    );

    // Throttle phase updates so we don't hammer Supabase with writes
    // — Opus streams at ~50ms cadence, we push a progress row every 2s.
    let lastPush = 0;
    const result = await generateHtmlDocument(
      { brief, brand, ingest },
      (ev) => {
        const now = Date.now();
        if (now - lastPush > 2000) {
          lastPush = now;
          // Fire-and-forget — don't block Opus streaming on DB writes.
          void updateJobPhase(
            jobId,
            "generate.progress",
            `Writing your site… ${Math.round(ev.totalChars / 1000)}kb so far.`,
            { chars: ev.totalChars },
          );
        }
      },
    );

    // ------------------------------------------------------
    // Phase 3: persist
    // ------------------------------------------------------
    await markJobReadyHtml(jobId, result.html, ingest);
    console.log(
      `[runner] job ${jobId} ready: ${result.html.length} bytes, ${result.modelUsage.inputTokens}/${result.modelUsage.outputTokens} tokens`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[runner] job ${jobId} FAILED:`, msg);
    try {
      await markJobError(jobId, msg);
    } catch (persistErr) {
      console.error(`[runner] failed to persist error for ${jobId}:`, persistErr);
    }
  }
}
