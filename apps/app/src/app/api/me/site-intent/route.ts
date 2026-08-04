import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";

// Small endpoint the client uses to switch labels between:
//   - has_site   -> "Publish preview" / "your live site is untouched"
//   - no_site    -> "Publish live"    / "your site is live at ..."
//   - null       -> fallback to neutral labels
//
// Cheap on purpose — one column, cache-friendly.

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ siteIntent: null }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServiceSupabaseClient() as any;
    const { data } = await supabase
      .from("business_profiles")
      .select("site_intent, existing_site_url")
      .eq("user_id", userId)
      .maybeSingle();

    const row = data as
      | { site_intent: string | null; existing_site_url: string | null }
      | null;

    // Prefer the explicit flag; fall back to inferring from URL for
    // users whose profile predates the column being populated.
    let siteIntent: "has_site" | "no_site" | null = null;
    if (row?.site_intent === "has_site" || row?.site_intent === "no_site") {
      siteIntent = row.site_intent;
    } else if (row?.existing_site_url && row.existing_site_url.trim().length > 0) {
      siteIntent = "has_site";
    } else if (row) {
      siteIntent = "no_site";
    }

    return NextResponse.json({ siteIntent });
  } catch {
    return NextResponse.json({ siteIntent: null });
  }
}
