import { createServiceSupabaseClient } from "@/lib/supabase";

// Returns the list of pages in a generation job (path + title, no HTML).
// Used by the preview overlay to render its page-tab bar so the user
// can switch between generated pages (/, /about, /services, /contact)
// inside the preview iframe.
//
// Unauthenticated — jobId is a UUID; same trust model as the render
// endpoint.

export const runtime = "nodejs";
export const revalidate = 60;

type StoredPage = { path: string; html: string; title: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!isUuid(jobId)) {
    return Response.json({ pages: [] }, { status: 404 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServiceSupabaseClient() as any;
    const { data } = await supabase
      .from("sites_generation_jobs")
      .select("pages, status, expires_at")
      .eq("id", jobId)
      .maybeSingle();

    if (!data) return Response.json({ pages: [] }, { status: 404 });

    const row = data as {
      pages: StoredPage[] | null;
      status: string;
      expires_at: string | null;
    };
    if (row.status !== "ready") return Response.json({ pages: [] });
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return Response.json({ pages: [] });
    }

    // Strip HTML from the response — the preview overlay only needs
    // path + title for its tabs.
    const summary = (row.pages ?? []).map((p) => ({
      path: p.path,
      title: p.title,
    }));

    return Response.json({ pages: summary });
  } catch (err) {
    console.error("[api/sites/pages] failed:", err);
    return Response.json({ pages: [] });
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
