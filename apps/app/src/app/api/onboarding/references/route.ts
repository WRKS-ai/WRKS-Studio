import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidateMemoryCache } from "@/lib/agent/memory/compose";
import {
  MEMORY_KIND,
  MEMORY_SOURCE,
  createServiceSupabaseClient,
  writeMemoryEntries,
} from "@/lib/supabase";

// POST /api/onboarding/references
//
// Called when the user submits the reference page. Writes the picked
// style references as a single style_preference memory entry tied to
// the user's active profile.
//
// Idempotent: re-submitting (e.g. user goes back, re-picks) replaces
// any prior reference-picker entries on the profile.
//
// Skip path: client can pass `picks: []` to indicate the user chose
// "use the default" — we still record an empty entry so the
// orchestrator knows the user actively opted out.

export const runtime = "nodejs";

const Body = z.object({
  picks: z.array(z.string().trim().min(1).max(64)).max(8),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Invalid body";
    return NextResponse.json(
      { error: "Invalid references payload", detail },
      { status: 400 },
    );
  }

  const supabase = createServiceSupabaseClient();

  // Active profile lookup — must exist (intake creates it).
  const { data: profile, error: lookupErr } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (lookupErr) {
    console.error("[api/onboarding/references] lookup failed:", lookupErr);
    return NextResponse.json(
      { error: "Profile lookup failed" },
      { status: 500 },
    );
  }
  if (!profile) {
    return NextResponse.json(
      { error: "No active profile. Complete intake first." },
      { status: 409 },
    );
  }

  // Drop prior reference-picker entries so re-submissions don't pile
  // up. Anything sourced from approvals or voice extraction survives.
  const { error: clearErr } = await supabase
    .from("memory_entries")
    .delete()
    .eq("business_profile_id", profile.id)
    .eq("source", MEMORY_SOURCE.referencePicker);
  if (clearErr) {
    console.error("[api/onboarding/references] clear stale failed:", clearErr);
  }

  if (body.picks.length > 0) {
    try {
      await writeMemoryEntries(supabase, [
        {
          businessProfileId: profile.id,
          kind: MEMORY_KIND.stylePreference,
          content: { references: body.picks },
          source: MEMORY_SOURCE.referencePicker,
          weight: 1.2,
        },
      ]);
    } catch (err) {
      console.error("[api/onboarding/references] memory write failed:", err);
      return NextResponse.json(
        { error: "Memory write failed" },
        { status: 500 },
      );
    }
  }

  invalidateMemoryCache(profile.id);

  return NextResponse.json({ ok: true, count: body.picks.length });
}
