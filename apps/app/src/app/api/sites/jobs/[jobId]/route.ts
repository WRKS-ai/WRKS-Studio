import { NextResponse } from "next/server";
import { getJob } from "@/lib/site-generation/job-store";

// GET /api/sites/jobs/[jobId]
//
// Public read (no auth) — Bill-Fanter's Astro /preview/[jobId] route
// fetches this server-side to hydrate its section props with the
// current user's generated content.
//
// Security: jobId is a UUID v4. Guessing an active jobId is
// infeasible (128 bits of entropy + 6h TTL). Same unlisted-YouTube
// pattern.

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!jobId || jobId.length < 8) {
    return NextResponse.json(
      { error: "Invalid jobId" },
      { status: 400 },
    );
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 },
    );
  }

  if (job.status !== "ready") {
    return NextResponse.json(
      { error: "Job still generating", status: job.status },
      { status: 409 },
    );
  }

  // Public read — only the ready content + designSystem. Keep the
  // brand snapshot + brief private (they carry PII in offer/audience
  // fields).
  return NextResponse.json(
    {
      content: job.content,
      designSystem: job.designSystem,
    },
    {
      headers: {
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    },
  );
}
