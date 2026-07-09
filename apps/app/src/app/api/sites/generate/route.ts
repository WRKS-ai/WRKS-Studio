import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase";
import {
  type BrandContext,
  type DesignSystem,
  generateDesignSystem,
} from "@/lib/site-generation/design-system";
import { generatePageContent } from "@/lib/site-generation/page-content";
import {
  createPendingJob,
  deleteJob,
  getJob,
  markJobReady,
} from "@/lib/site-generation/job-store";

// POST /api/sites/generate       — create a job, return jobId.
// GET  /api/sites/generate?jobId — SSE stream of generation events.
//
// Job lifecycle:
//   POST  → createPendingJob
//   GET   → runs design + page passes, streams events
//   done  → markJobReady (stores content + designSystem)
//   /api/sites/jobs/[jobId] serves the ready job publicly to the
//   Bill-Fanter Astro preview route (bill-fanter-preview.vercel.app/
//   preview/[jobId]).

export const runtime = "nodejs";
// Sonnet for 6 sections + Haiku for design system regularly exceeds
// 60s. Bumping to Vercel Pro's 300s serverless max. If we go over
// that we'll need to split Sonnet into per-section calls or move to
// Fluid Compute (up to 800s).
export const maxDuration = 300;

const PostBody = z.object({
  brief: z.string().trim().min(6).max(600),
  templateId: z.string().trim().min(1).max(120),
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

  // Pull brand_state so the Haiku pass has the full picture. If it
  // fails we still start the job — the design system just gets a
  // thinner input.
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
      templateId: body.templateId,
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
// SSE stream
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

      // ==================================================
      // Pass 1 — Design system (real Haiku).
      // ==================================================
      emit("design.start", {
        message:
          "Reading your brand and drafting a design system — palette, type, buttons.",
      });

      let designSystem: DesignSystem;
      try {
        designSystem = await generateDesignSystem({
          brief: job.brief,
          brand: job.brand,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[api/sites/generate] design system failed:", message);
        emit("error", {
          stage: "design-system",
          message,
        });
        controller.close();
        await deleteJob(jobId);
        return;
      }

      emit("design.done", designSystem);

      // ==================================================
      // Pass 2 — Per-page content generation (real Sonnet).
      // Ship 2: single-page (home). Multi-page baton pattern
      // + agent-curated page selection land in Ship 3.
      // ==================================================
      emit("page.start", {
        pageId: "home",
        message:
          "Now writing your home page — hero, value cards, closer. In your voice.",
      });

      // Heartbeat every 10s while Sonnet works — keeps the SSE
      // connection warm and gives the client something to show.
      const heartbeat = setInterval(() => {
        emit("ping", { at: Date.now() });
      }, 10_000);

      let page;
      try {
        page = await generatePageContent({
          brief: job.brief,
          brand: job.brand,
          designSystem,
          pageId: "home",
        });
        clearInterval(heartbeat);
        emit("page.done", page);
      } catch (err) {
        clearInterval(heartbeat);
        const message = err instanceof Error ? err.message : String(err);
        console.error("[api/sites/generate] page content failed:", message);
        emit("error", {
          stage: "page-content",
          message,
        });
        controller.close();
        await deleteJob(jobId);
        return;
      }

      // Persist so the Bill-Fanter preview route can fetch this
      // job's content over HTTP after generation completes.
      await markJobReady(jobId, page, designSystem);

      emit("generation.done", { siteId: jobId });
      controller.close();
      // Job stays in the store for its TTL so preview can fetch.
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
