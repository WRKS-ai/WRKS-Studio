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

// POST /api/sites/generate       — create a job, return jobId.
// GET  /api/sites/generate?jobId — SSE stream of generation events.
//
// v2 (2026-06-30) — Stitch-style: real Haiku design system pass fires
// first, streams the resulting palette + type + buttons + narration.
// Per-page Sonnet content pass lands in Ship 2.

export const runtime = "nodejs";
export const maxDuration = 60;

// In-memory job store. Real generation persists to a
// `sites_generation_jobs` table (Ship 3) so SSE consumers can survive
// lambda cold-starts + reconnects. In-memory works for local dev and
// single-instance deploys; multi-instance requires the DB.
const JOBS = new Map<
  string,
  {
    userId: string;
    brief: string;
    templateId: string;
    brand: BrandContext;
    createdAt: number;
  }
>();

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
  JOBS.set(jobId, {
    userId,
    brief: body.brief,
    templateId: body.templateId,
    brand,
    createdAt: Date.now(),
  });
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
  const job = JOBS.get(jobId);
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
        JOBS.delete(jobId);
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

      try {
        const page = await generatePageContent({
          brief: job.brief,
          brand: job.brand,
          designSystem,
          pageId: "home",
        });
        emit("page.done", page);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[api/sites/generate] page content failed:", message);
        emit("error", {
          stage: "page-content",
          message,
        });
        controller.close();
        JOBS.delete(jobId);
        return;
      }

      emit("generation.done", { siteId: jobId });
      controller.close();
      JOBS.delete(jobId);
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
