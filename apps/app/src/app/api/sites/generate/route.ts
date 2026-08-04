import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase";
import type { BrandContext } from "@/lib/site-generation/design-system";
import {
  claimForProcessing,
  createPendingJob,
  getJob,
  getJobStatus,
} from "@/lib/site-generation/job-store";
import { runGenerationJob } from "@/lib/site-generation/runner";

// v3 site-generation pipeline.
//
// ARCHITECTURE (rewritten): work is DECOUPLED from the HTTP request
// lifecycle. Before, Opus streamed into the SSE controller and any SSE
// drop killed generation. Now:
//
//   POST /api/sites/generate       — creates job, claims lock, kicks off
//                                    runGenerationJob() in the background
//                                    (fire-and-forget), returns jobId.
//   GET  /api/sites/generate?jobId — SSE that just POLLS job_status rows
//                                    every 2s and emits phase updates.
//                                    Never runs Opus. Never claims locks.
//                                    Safe to drop + reconnect any time.
//
// The runner writes phase / phase_message / phase_progress / html / error
// to sites_generation_jobs as it goes. The client just watches.
//
// Rendering: unchanged. /api/sites/render/[jobId] serves the stored
// html column with Content-Type text/html.

export const runtime = "nodejs";
// Poll endpoint: needs to stay open long enough to see the whole
// generation cycle (up to 6 min for slow Opus runs). 600s = 10 min
// which is Vercel Fluid Compute max.
export const maxDuration = 600;

const PostBody = z.object({
  brief: z.string().trim().min(6).max(600),
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

  // Pull brand context from business_profiles.
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
  let siteIntent: "has_site" | "no_site" | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServiceSupabaseClient() as any;
    const { data: profile } = await supabase
      .from("business_profiles")
      .select(
        "brand_name, business_type, primary_goal, voice_descriptor, offer_summary, audience_description, differentiator, existing_site_url, site_intent",
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
      // Prefer explicit site_intent flag; fall back to inferring from URL.
      if (profile.site_intent === "has_site" || profile.site_intent === "no_site") {
        siteIntent = profile.site_intent;
      } else if (profile.existing_site_url && profile.existing_site_url.trim().length > 0) {
        siteIntent = "has_site";
      } else {
        siteIntent = "no_site";
      }
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

  // Claim the lock immediately so any observer knows it's in progress,
  // then fire-and-forget the runner. The runner completes on its own
  // and writes result to Supabase. NO await — return response now.
  const claim = await claimForProcessing(jobId);
  if (claim.status === "claimed") {
    // Node fire-and-forget. On Vercel this needs Inngest for reliable
    // completion (serverless kills the process after response); on dev
    // / long-lived Node this runs to completion.
    void runGenerationJob({ jobId, brief: body.brief, brand, siteIntent });
  } else {
    console.warn(
      "[api/sites/generate] unexpected non-claimed status on fresh job:",
      claim.status,
    );
  }

  return NextResponse.json({ jobId });
}

// ============================================================
// SSE observer — just polls the DB every 2s and emits phase updates.
// Never runs Opus. Never claims. Safe to reconnect at any time.
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
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        } catch {
          // Controller closed (client disconnected). Poll loop will
          // detect and exit.
        }
      };

      let closed = false;
      const abortSignal = req.signal;
      abortSignal.addEventListener("abort", () => {
        closed = true;
      });

      // Emit an initial status snapshot on connect so reconnects don't
      // stare at a blank screen waiting for the next poll.
      const initial = await getJobStatus(jobId);
      if (initial) {
        emit("status", initial);
        if (initial.ready) {
          emit("generation.done", {
            siteId: jobId,
            renderUrl: `/api/sites/render/${jobId}`,
            bytes: initial.bytes ?? 0,
            replay: true,
          });
          controller.close();
          return;
        }
        if (initial.status === "error") {
          emit("error", { stage: "runner", message: initial.error ?? "Unknown error" });
          controller.close();
          return;
        }
      }

      // Poll loop: watch for phase changes + terminal state.
      let lastUpdatedAt = initial?.updatedAt ?? 0;
      const pollIntervalMs = 2000;
      const maxDurationMs = 9 * 60 * 1000; // 9 min budget under the 10 min func limit
      const deadline = Date.now() + maxDurationMs;

      while (!closed && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        if (closed) break;

        const status = await getJobStatus(jobId);
        if (!status) {
          emit("error", { stage: "poll", message: "Job disappeared." });
          controller.close();
          return;
        }

        // Only emit if something changed since last poll.
        if (status.updatedAt > lastUpdatedAt) {
          lastUpdatedAt = status.updatedAt;
          emit("status", status);
        } else {
          // Keep the SSE connection warm even when no changes.
          emit("ping", { at: Date.now() });
        }

        if (status.ready) {
          emit("generation.done", {
            siteId: jobId,
            renderUrl: `/api/sites/render/${jobId}`,
            bytes: status.bytes ?? 0,
          });
          controller.close();
          return;
        }
        if (status.status === "error") {
          emit("error", { stage: "runner", message: status.error ?? "Unknown error" });
          controller.close();
          return;
        }
      }

      // Timed out — client can reconnect to keep watching.
      emit("timeout", {
        message: "Still working — reconnect to keep watching.",
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
