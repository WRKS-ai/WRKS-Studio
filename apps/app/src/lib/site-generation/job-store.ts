import { createServiceSupabaseClient } from "@/lib/supabase";
import type { DesignSystem, BrandContext } from "./design-system";
import type { PageContent } from "./page-content";

// Supabase-backed job store for /api/sites/generate.
//
// Two phases per job:
//   1. PENDING: created by POST /api/sites/generate — carries the
//      user's brief + brand snapshot until the SSE stream runs.
//   2. READY: populated after design + page passes complete. The
//      finished content + designSystem are readable by anyone with
//      the jobId (unlisted-YouTube pattern — jobId is a UUID).
//
// Ready jobs are served publicly (no auth) from
// /api/sites/jobs/[jobId] so the Bill-Fanter Astro preview route can
// fetch them server-side without a Clerk session.
//
// Backed by Supabase's `sites_generation_jobs` table so jobs survive
// lambda cold-starts + reconnects. Previously in-memory, which broke
// because Bill-Fanter's SSR fetch would hit a different lambda than
// the one that created the job.
//
// The Supabase generated types file (lib/supabase/types.ts) hasn't
// been regenerated since this table was added, so we type-cast the
// client to any at each call site. Regenerating types is a
// mechanical follow-up.

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
  content: PageContent;
  designSystem: DesignSystem;
};

export type Job = PendingJob | ReadyJob;

type JobRow = {
  id: string;
  user_id: string;
  brief: string;
  template_id: string;
  brand: BrandContext | null;
  status: string;
  content: PageContent | null;
  design_system: DesignSystem | null;
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
      "id, user_id, brief, template_id, brand, status, content, design_system, created_at, expires_at",
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

  if (row.status === "ready" && row.content && row.design_system) {
    return {
      status: "ready",
      userId: row.user_id,
      brief: row.brief,
      templateId: row.template_id,
      brand,
      createdAt,
      content: row.content,
      designSystem: row.design_system,
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

export async function markJobReady(
  jobId: string,
  content: PageContent,
  designSystem: DesignSystem,
): Promise<void> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: "ready",
      content,
      design_system: designSystem,
    })
    .eq("id", jobId);
  if (error) {
    console.error("[job-store] markJobReady failed:", error);
  }
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
