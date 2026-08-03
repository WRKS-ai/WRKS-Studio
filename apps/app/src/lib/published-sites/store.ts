import { createServiceSupabaseClient } from "@/lib/supabase";

// Storage layer for the published_sites table — the slug → job_id lookup
// that powers /_sites/{slug} (the wildcard subdomain public renderer).
//
// Rows are written by the /api/sites/publish endpoint (Clerk-protected).
// Reads happen from the wildcard subdomain rewrite (no auth) so any
// visitor of alex.wrksstudio.com can see Alex's published HTML.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const TABLE = "published_sites";

export type PublishedSite = {
  id: string;
  slug: string;
  userId: string;
  jobId: string;
  brandName: string | null;
  title: string | null;
  publishedAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  slug: string;
  user_id: string;
  job_id: string;
  brand_name: string | null;
  title: string | null;
  published_at: string;
  updated_at: string;
};

function fromRow(r: Row): PublishedSite {
  return {
    id: r.id,
    slug: r.slug,
    userId: r.user_id,
    jobId: r.job_id,
    brandName: r.brand_name,
    title: r.title,
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
  };
}

export async function getSiteBySlug(
  slug: string,
): Promise<PublishedSite | null> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, slug, user_id, job_id, brand_name, title, published_at, updated_at")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  if (error) {
    console.error("[published-sites] getSiteBySlug failed:", error);
    return null;
  }
  return data ? fromRow(data as Row) : null;
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("slug", slug.toLowerCase());
  if (error) {
    console.error("[published-sites] isSlugTaken failed:", error);
    return true;
  }
  return (count ?? 0) > 0;
}

export async function getSitesByUser(userId: string): Promise<PublishedSite[]> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, slug, user_id, job_id, brand_name, title, published_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[published-sites] getSitesByUser failed:", error);
    return [];
  }
  return (data as Row[]).map(fromRow);
}

export async function publishSite(input: {
  slug: string;
  userId: string;
  jobId: string;
  brandName?: string | null;
  title?: string | null;
}): Promise<PublishedSite> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      slug: input.slug.toLowerCase(),
      user_id: input.userId,
      job_id: input.jobId,
      brand_name: input.brandName ?? null,
      title: input.title ?? null,
    })
    .select("id, slug, user_id, job_id, brand_name, title, published_at, updated_at")
    .single();
  if (error || !data) {
    throw new Error(`Failed to publish site: ${error?.message ?? "unknown"}`);
  }
  return fromRow(data as Row);
}

export async function repointSite(input: {
  slug: string;
  userId: string;
  jobId: string;
}): Promise<PublishedSite | null> {
  const supabase = createServiceSupabaseClient() as AnySupabase;
  const { data, error } = await supabase
    .from(TABLE)
    .update({ job_id: input.jobId })
    .eq("slug", input.slug.toLowerCase())
    .eq("user_id", input.userId)
    .select("id, slug, user_id, job_id, brand_name, title, published_at, updated_at")
    .maybeSingle();
  if (error) {
    console.error("[published-sites] repointSite failed:", error);
    return null;
  }
  return data ? fromRow(data as Row) : null;
}
