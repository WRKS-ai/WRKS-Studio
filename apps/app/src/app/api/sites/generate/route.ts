import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase";
import type { BrandContext } from "@/lib/site-generation/design-system";
import {
  claimForProcessing,
  createPendingJob,
  getJob,
  getReadyJobHtml,
  markJobReadyHtml,
  waitForReady,
} from "@/lib/site-generation/job-store";
import { ingestBrand, type IngestedBrand } from "@/lib/site-generation/brand-ingest";
import { generateHtmlDocument } from "@/lib/site-generation/generate-html";

// v3 site-generation pipeline.
//
// Flow (single-pass, SSE-streamed):
//   POST /api/sites/generate       — create a pending job, return jobId
//   GET  /api/sites/generate?jobId — SSE stream:
//     1. ingest.start / ingest.done — deep-fetch the user's URL if any
//     2. generate.start / generate.done — Opus 4.7 emits full HTML doc
//     3. generation.done — job persisted, ready for /api/sites/render
//
// Storage: sites_generation_jobs.html holds the assembled HTML doc,
// sites_generation_jobs.brand_ingest holds the deep-ingested facts.
// TTL 6h per row.
//
// Rendering: the studio canvas iframes /api/sites/render/[jobId]
// which serves the stored HTML with the correct Content-Type.

export const runtime = "nodejs";
// Opus 4.7 emitting 25-40K chars of HTML in one call typically runs
// 90-180s. 300s is Vercel Pro's serverless max — we heartbeat every
// 10s to keep the SSE connection alive.
export const maxDuration = 300;

const PostBody = z.object({
  brief: z.string().trim().min(6).max(600),
  // templateId is legacy — v3 doesn't need a template id, but keeping
  // it optional so the composer doesn't break if it still sends one.
  templateId: z.string().trim().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof PostBody>;
  try {
    body = PostBody.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Invalid body";
    return NextResponse.json(
      { error: "Invalid brief", detail },
      { status: 400 },
    );
  }

  // Pull brand context from business_profiles for the generation prompt.
  const brand: BrandContext = {
    brandName: null,
    businessType: null,
    primaryGoal: null,
    voiceDescriptor: null,
    offerSummary: null,
    audienceDescription: null,
    differentiator: null,
    existingSiteUrl: null,
  };
  try {
    const supabase = createServiceSupabaseClient();
    const { data: profile } = await supabase
      .from("business_profiles")
      .select(
        "brand_name, business_type, primary_goal, voice_descriptor, offer_summary, audience_description, differentiator, existing_site_url",
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (profile) {
      brand.brandName = profile.brand_name ?? null;
      brand.businessType = profile.business_type ?? null;
      brand.primaryGoal = profile.primary_goal ?? null;
      brand.voiceDescriptor = profile.voice_descriptor ?? null;
      brand.offerSummary = profile.offer_summary ?? null;
      brand.audienceDescription = profile.audience_description ?? null;
      brand.differentiator = profile.differentiator ?? null;
      brand.existingSiteUrl = profile.existing_site_url ?? null;
    }
  } catch (err) {
    console.warn("[api/sites/generate] brand_state fetch failed:", err);
  }

  const jobId = crypto.randomUUID();
  try {
    await createPendingJob(jobId, {
      userId,
      brief: body.brief,
      templateId: body.templateId ?? "personal-brand",
      brand,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Couldn't create job", detail },
      { status: 500 },
    );
  }
  return NextResponse.json({ jobId });
}

// ============================================================
// SSE stream — the v3 pipeline
// ============================================================
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }
  const job = await getJob(jobId);
  if (!job || job.userId !== userId) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      // Heartbeat every 10s throughout — keeps SSE warm during the
      // long Opus call.
      const heartbeat = setInterval(() => {
        emit("ping", { at: Date.now() });
      }, 10_000);

      // ==================================================
      // Guard: atomically claim the job. Prevents SSE reconnects from
      // spawning parallel Opus calls on the same jobId.
      // ==================================================
      const claim = await claimForProcessing(jobId);

      if (claim.status === "already-ready") {
        // Fast-path replay: someone finished this before we opened.
        const existing = await getReadyJobHtml(jobId);
        emit("generation.done", {
          siteId: jobId,
          renderUrl: `/api/sites/render/${jobId}`,
          bytes: existing?.length ?? 0,
          replay: true,
        });
        clearInterval(heartbeat);
        controller.close();
        return;
      }

      if (claim.status === "in-progress") {
        // Another SSE (or reconnect) is running Opus. Wait for readiness
        // instead of racing a second generation.
        emit("generate.start", {
          message:
            "Resuming your existing draft — another connection is still writing. Hang on…",
        });
        const html = await waitForReady(jobId, 300_000, 3_000, () => {
          emit("ping", { at: Date.now() });
        });
        if (html) {
          emit("generation.done", {
            siteId: jobId,
            renderUrl: `/api/sites/render/${jobId}`,
            bytes: html.length,
            replay: true,
          });
        } else {
          emit("error", {
            stage: "generate",
            message:
              "Draft still writing after 5 minutes — reload the page to check its state.",
          });
        }
        clearInterval(heartbeat);
        controller.close();
        return;
      }

      if (claim.status === "not-found") {
        emit("error", {
          stage: "claim",
          message: "Job expired or was removed. Start again from the composer.",
        });
        clearInterval(heartbeat);
        controller.close();
        return;
      }

      // ==================================================
      // Phase 1 — Deep brand ingest (if URL available)
      // We hold the processing lock now; safe to run Opus.
      // ==================================================
      let ingest: IngestedBrand | null = null;
      const ingestUrl = job.brand.existingSiteUrl;

      if (ingestUrl) {
        emit("ingest.start", {
          url: ingestUrl,
          message: `Reading ${new URL(ingestUrl).hostname} — extracting palette, typography, hero copy, testimonials.`,
        });

        try {
          ingest = await ingestBrand(ingestUrl);
          emit("ingest.done", {
            url: ingest.url,
            durationMs: ingest.raw.durationMs,
            brandName: ingest.brandName,
            palette: ingest.palette.colors.map((c) => ({ hex: c.hex, role: c.role })),
            typefaces: ingest.typefaces,
            heroImage: ingest.heroImage,
            logo: ingest.logo.src,
            testimonialsFound: ingest.testimonials.length,
            verticals: ingest.detectedVerticals,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn("[api/sites/generate] ingest failed, continuing without:", message);
          emit("ingest.skipped", {
            message: `Couldn't read that URL — generating from the brief alone.`,
            detail: message,
          });
        }
      } else {
        emit("ingest.skipped", {
          message: "No existing site to read — generating from brand context alone.",
        });
      }

      // ==================================================
      // Phase 2 — Opus 4.7 emits the full HTML document
      // ==================================================
      emit("generate.start", {
        message:
          "Drafting your site — 10 sections, tailored to your palette, voice, and offer. About 60-90 seconds.",
      });

      let html: string;
      let modelUsage: { inputTokens: number; outputTokens: number };
      // Throttle progress ticks to at most 1/second so the client
      // doesn't get flooded — Opus streams deltas at ~50ms cadence.
      let lastTick = 0;
      try {
        const result = await generateHtmlDocument(
          {
            brief: job.brief,
            brand: job.brand,
            ingest,
          },
          (ev) => {
            const now = Date.now();
            if (now - lastTick > 1000) {
              lastTick = now;
              emit("generate.progress", { chars: ev.totalChars });
            }
          },
        );
        html = result.html;
        modelUsage = result.modelUsage;
      } catch (err) {
        clearInterval(heartbeat);
        const message = err instanceof Error ? err.message : String(err);
        console.error("[api/sites/generate] generate failed:", message);
        emit("error", { stage: "generate", message });
        controller.close();
        // Keep the row so the user can see what happened + retry.
        // (Old code deleted the job here; that meant a reconnect on a
        // transient failure lost all context.)
        return;
      }

      emit("generate.done", {
        bytes: html.length,
        modelUsage,
      });

      // ==================================================
      // Phase 3 — Persist + notify canvas
      // ==================================================
      try {
        await markJobReadyHtml(jobId, html, ingest);
      } catch (err) {
        console.error("[api/sites/generate] markJobReadyHtml failed:", err);
        // Don't fail the stream — HTML is already in memory, canvas
        // will still get it via generation.done payload.
      }

      clearInterval(heartbeat);
      emit("generation.done", {
        siteId: jobId,
        renderUrl: `/api/sites/render/${jobId}`,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}
