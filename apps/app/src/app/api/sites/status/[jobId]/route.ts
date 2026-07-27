import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getJob, getJobStatus } from "@/lib/site-generation/job-store";

// GET /api/sites/status/[jobId]
//
// Simple JSON status endpoint for the generating page (and any manual
// debugging). Returns current phase, phase message, progress payload,
// error (if any), whether html is ready, and bytes.
//
// Auth-gated: only the job owner can see status (unlike /render which
// is public via unlisted UUID).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { jobId } = await params;

  const job = await getJob(jobId);
  if (!job || job.userId !== userId) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const status = await getJobStatus(jobId);
  if (!status) {
    return NextResponse.json({ error: "Job not found or expired" }, { status: 404 });
  }

  return NextResponse.json(status, {
    headers: { "cache-control": "no-store" },
  });
}
