import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";

// GET /api/studio/home
// One call that returns everything the /studio dashboard needs to render:
//   - The user's brand_state row (so the hero / pillar cards know the
//     agent name, brand, picked pillars, etc.)
//   - The 10 most-recent deliverables (drafts + published) for the
//     recent-work feed
//
// Used by /studio/page.tsx on mount. Returns nulls / empty arrays for
// first-time users so the dashboard renders its empty state.

export const runtime = "nodejs";

const RECENT_LIMIT = 10;

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();

  const { data: profile, error: profileErr } = await supabase
    .from("business_profiles")
    .select(
      "id, brand_name, agent_name, business_type, primary_goal, active_pillars, voice_descriptor, offer_summary, audience_description, differentiator, existing_site_url, onboarding_completed_at",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (profileErr) {
    console.error("[api/studio/home] profile lookup failed:", profileErr);
    return NextResponse.json(
      { error: "Profile lookup failed", detail: profileErr.message },
      { status: 500 },
    );
  }

  // No profile = user hasn't completed onboarding. Return minimal payload
  // so /studio knows to redirect them back to onboarding (handled client-side).
  if (!profile) {
    return NextResponse.json({
      profile: null,
      deliverables: [],
      counts: { sites: 0, copy: 0 },
    });
  }

  // Only fetch deliverables whose kind belongs to the new pillar
  // taxonomy (site_* / copy_*). Older rows from the legacy intake-agent
  // (kinds like 'fact' / 'audience' / 'differentiator') are excluded so
  // they don't surface in the dashboard as stale "drafts" — per
  // `feedback_no_dummy_no_disconnected.md`, the feed shows REAL pillar
  // work only.
  const { data: deliverables, error: delErr } = await supabase
    .from("deliverables")
    .select("id, kind, content, status, framework, created_at, updated_at")
    .eq("business_profile_id", profile.id)
    .or("kind.like.site%,kind.like.copy%")
    .order("updated_at", { ascending: false })
    .limit(RECENT_LIMIT);
  if (delErr) {
    console.error("[api/studio/home] deliverables lookup failed:", delErr);
    return NextResponse.json(
      { error: "Deliverables lookup failed", detail: delErr.message },
      { status: 500 },
    );
  }

  const rows = deliverables ?? [];

  // Per-pillar counts. The query already filters to site_* / copy_*
  // kinds, so a single pass classifying each row is enough.
  const counts = rows.reduce(
    (acc, row) => {
      if (typeof row.kind === "string") {
        if (row.kind.startsWith("site")) acc.sites += 1;
        else if (row.kind.startsWith("copy")) acc.copy += 1;
      }
      return acc;
    },
    { sites: 0, copy: 0 },
  );

  return NextResponse.json({
    profile,
    deliverables: rows,
    counts,
  });
}
