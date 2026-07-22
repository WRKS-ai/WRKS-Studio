import { createServiceSupabaseClient } from "@/lib/supabase";
import type { BrandContext } from "./design-system";
import type { IngestedBrand } from "./brand-ingest";

// Supabase-backed job store for the v3 site-generation pipeline.
//
// Two phases per job:
//   1. PENDING: created by POST /api/sites/generate — carries the
//      user's brief + brand snapshot until the SSE stream runs.
//   2. READY: populated once Opus 4.7 finishes emitting the full HTML
//      document. HTML is stored in-column so the public renderer at
//      /api/sites/render/[jobId] can serve it without joining tables.
//
// Ready jobs are readable via getReadyJobHtml() without auth (unlisted-
// UUID pattern). TTL 6h enforced by expires_at.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const TABLE = "sites_generation_jobs";

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
  html: string;
  brandIngest: IngestedBrand | null;
};

export type Job = PendingJob | ReadyJob;

type JobRow = {
  id: string;
  user_id: string;
  brief: string;
  template_id: string;
  brand: BrandContext | null;
  status: string;
  html: string | null;
  brand_ingest: IngestedBrand | null;
  created_at: string;
  expires_at: string;
};

export async function createPendingJob(
  jobId: string,
  data: Omit<PendingJob, "status" | "createdAt">,
): Promise<PendingJob> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { error } = await supabase.from(TABLE).insert({
    id: jobId,
    user_id: data.userId,
    brief: data.brief,
    template_id: data.templateId,
    brand: data.brand,
    status: "pending",
  });
  if (error) {
    console.error("[job-store] createPendingJob failed:", error);
    throw new Error(`Failed to create job: ${error.message}`);
  }
  return {
    ...data,
    status: "pending",
    createdAt: Date.now(),
  };
}

export async function getJob(jobId: string): Promise<Job | null> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "id, user_id, brief, template_id, brand, status, html, brand_ingest, created_at, expires_at",
    )
    .eq("id", jobId)
    .maybeSingle();
  if (error) {
    console.error("[job-store] getJob failed:", error);
    return null;
  }
  if (!data) return null;
  const row = data as JobRow;

  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  const createdAt = new Date(row.created_at).getTime();
  const brand = row.brand ?? emptyBrand();

  if (row.status === "ready" && row.html) {
    return {
      status: "ready",
      userId: row.user_id,
      brief: row.brief,
      templateId: row.template_id,
      brand,
      createdAt,
      html: row.html,
      brandIngest: row.brand_ingest,
    };
  }
  return {
    status: "pending",
    userId: row.user_id,
    brief: row.brief,
    templateId: row.template_id,
    brand,
    createdAt,
  };
}

// Atomic claim: transition pending → processing IF and only IF no other
// invocation has claimed it. Returns true if we got the lock, false if
// someone else already has it (parallel SSE reconnect on the same job).
//
// Lease: if the row is already 'processing' but processing_started_at
// is older than 10 minutes, we treat the previous claim as dead
// (server crashed / lambda cold-boot before writing 'ready') and steal
// the lock. Keeps stuck jobs from blocking retries forever.
export async function claimForProcessing(jobId: string): Promise<
  { status: "claimed"; brand: BrandContext; brief: string }
  | { status: "already-ready" }
  | { status: "in-progress"; since: number }
  | { status: "not-found" }
> {
  const supabase = createServiceSupabaseClient() as AnySupabase;

  const { data: current, error: readErr } = await supabase
    .from(TABLE)
    .select("id, status, processing_started_at, brand, brief, expires_at")
    .eq("id", jobId)
    .maybeSingle();

  if (readErr || !current) return { status: "not-found" };
  const row = current as JobRow & { processing_started_at: string | null };

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { status: "not-found" };
  }
  if (row.status === "ready") return { status: "already-ready" };

  const now = Date.now();
  const leaseAge =
    row.processing_started_at !== null
      ? now - new Date(row.processing_started_at).getTime()
      : Infinity;

  if (row.status === "processing" && leaseAge < 10 * 60_000) {
    return { status: "in-progress", since: now - leaseAge };
  }

  // Attempt to claim. Use a conditional UPDATE to make this atomic —
  // only succeed if we can transition from the same status we just read
  // (optimistic concurrency).
  const nowIso = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from(TABLE)
    .update({ status: "processing", processing_started_at: nowIso })
    .eq("id", jobId)
    .eq("status", row.status)
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    return { status: "in-progress", since: 0 };
  }

  return {
    status: "claimed",
    brand: (row.brand as BrandContext | null) ?? emptyBrand(),
    brief: row.brief,
  };
}

// Poll helper for the SSE reconnect path: wait up to `maxWaitMs` for
// the job to reach 'ready' state, checking every `intervalMs`.
export async function waitForReady(
  jobId: string,
  maxWaitMs = 300_000,
  intervalMs = 3_000,
  onTick?: () => void,
): Promise<string | null> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const html = await getReadyJobHtml(jobId);
    if (html) return html;
    onTick?.();
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

// v3: mark ready with full assembled HTML doc + brand-ingest snapshot.
export async function markJobReadyHtml(
  jobId: string,
  html: string,
  brandIngest: IngestedBrand | null,
): Promise<void> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: "ready",
      html,
      brand_ingest: brandIngest,
    })
    .eq("id", jobId);
  if (error) {
    console.error("[job-store] markJobReadyHtml failed:", error);
  }
}

// Public read for /api/sites/render/[jobId]. Returns null if the job
// doesn't exist, isn't ready, or has expired.
export async function getReadyJobHtml(jobId: string): Promise<string | null> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { data, error } = await supabase
    .from(TABLE)
    .select("html, status, expires_at")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Pick<JobRow, "html" | "status" | "expires_at">;
  if (row.status !== "ready" || !row.html) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row.html;
}

export async function deleteJob(jobId: string): Promise<void> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  await supabase.from(TABLE).delete().eq("id", jobId);
}

function emptyBrand(): BrandContext {
  return {
    brandName: null,
    businessType: null,
    primaryGoal: null,
    voiceDescriptor: null,
    offerSummary: null,
    audienceDescription: null,
    differentiator: null,
    existingSiteUrl: null,
  };
}
