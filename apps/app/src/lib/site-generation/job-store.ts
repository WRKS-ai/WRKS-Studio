import type { DesignSystem, BrandContext } from "./design-system";
import type { PageContent } from "./page-content";

// Shared in-memory job store for /api/sites/generate.
//
// Two phases per job:
//   1. PENDING: created by POST /api/sites/generate — carries the
//      user's brief + brand snapshot until the SSE stream runs.
//   2. READY: populated after design + page passes complete. The
//      finished content + designSystem are readable by anyone with
//      the jobId (unlisted-YouTube pattern — jobId is a UUID, so
//      guessing is infeasible).
//
// Ready jobs are served publicly (no auth) from
// /api/sites/jobs/[jobId] so the Bill-Fanter Astro preview route can
// fetch them server-side without a Clerk session.
//
// In-memory works for single-instance Vercel deploys. Multi-region
// or cold-start reconnects need Supabase persistence — planned for a
// follow-up. Jobs auto-evict after JOB_TTL_MS to bound memory use.

const JOB_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export type PendingJob = {
  status: "pending";
  userId: string;
  brief: string;
  templateId: string;
  brand: BrandContext;
  createdAt: number;
};

export type ReadyJob = {
  status: "ready";
  userId: string;
  brief: string;
  templateId: string;
  brand: BrandContext;
  createdAt: number;
  content: PageContent;
  designSystem: DesignSystem;
};

export type Job = PendingJob | ReadyJob;

const globalStore = globalThis as unknown as {
  __wrksSiteJobs?: Map<string, Job>;
};

if (!globalStore.__wrksSiteJobs) {
  globalStore.__wrksSiteJobs = new Map();
}
const JOBS = globalStore.__wrksSiteJobs;

export function createPendingJob(
  jobId: string,
  data: Omit<PendingJob, "status" | "createdAt">,
): PendingJob {
  const job: PendingJob = {
    ...data,
    status: "pending",
    createdAt: Date.now(),
  };
  JOBS.set(jobId, job);
  return job;
}

export function getJob(jobId: string): Job | null {
  const job = JOBS.get(jobId);
  if (!job) return null;
  if (Date.now() - job.createdAt > JOB_TTL_MS) {
    JOBS.delete(jobId);
    return null;
  }
  return job;
}

export function markJobReady(
  jobId: string,
  content: PageContent,
  designSystem: DesignSystem,
): void {
  const current = JOBS.get(jobId);
  if (!current) return;
  JOBS.set(jobId, {
    ...current,
    status: "ready",
    content,
    designSystem,
  });
}

export function deleteJob(jobId: string): void {
  JOBS.delete(jobId);
}
