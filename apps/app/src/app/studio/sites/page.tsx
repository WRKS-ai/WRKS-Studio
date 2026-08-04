import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { SitesComposer } from "./_composer";
import { SitesList, type SiteRow } from "./_sites-list";

// /studio/sites — Sites pillar entry point.
//
// Fetches the user's brand profile (redirects to onboarding if
// incomplete) + their existing generated sites, then renders a list
// of those sites above the composer. First-time visits show the
// composer only; returning users see their sites first.

export const runtime = "nodejs";

export default async function SitesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceSupabaseClient() as any;
  const { data: profile } = await supabase
    .from("business_profiles")
    .select(
      "brand_name, business_type, primary_goal, voice_descriptor, offer_summary, audience_description, differentiator, agent_name, onboarding_completed_at",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding/voice");

  const sites = await getUserSites(userId, supabase);

  return (
    <SitesComposer
      brandName={profile.brand_name ?? null}
      businessType={profile.business_type ?? null}
      primaryGoal={profile.primary_goal ?? null}
      voiceDescriptor={profile.voice_descriptor ?? null}
      offerSummary={profile.offer_summary ?? null}
      audienceDescription={profile.audience_description ?? null}
      differentiator={profile.differentiator ?? null}
      agentName={profile.agent_name ?? null}
      sitesList={<SitesList sites={sites} />}
    />
  );
}

// Fetch the user's ready generation jobs + join to any published_sites
// rows to include the live slug. Limited to 50 most recent for now —
// dashboards typically show recent-first; pagination is a follow-up.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserSites(userId: string, supabase: any): Promise<SiteRow[]> {
  const { data: jobs } = await supabase
    .from("sites_generation_jobs")
    .select("id, brief, brand, created_at, page_count, status")
    .eq("user_id", userId)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!jobs || jobs.length === 0) return [];

  type JobRow = {
    id: string;
    brief: string;
    brand: Record<string, unknown> | null;
    created_at: string;
    page_count: number | null;
    status: string;
  };
  const jobRows = jobs as JobRow[];

  const jobIds = jobRows.map((j) => j.id);
  const { data: published } = await supabase
    .from("published_sites")
    .select("slug, job_id")
    .in("job_id", jobIds);

  const publishedByJob = new Map<string, string>();
  for (const p of (published ?? []) as Array<{ slug: string; job_id: string }>) {
    publishedByJob.set(p.job_id, p.slug);
  }

  return jobRows.map((j) => {
    const brand = (j.brand ?? {}) as { brandName?: string | null };
    return {
      id: j.id,
      brandName: brand.brandName ?? null,
      brief: j.brief,
      createdAt: j.created_at,
      pageCount: j.page_count ?? 1,
      publishedSlug: publishedByJob.get(j.id) ?? null,
    };
  });
}
