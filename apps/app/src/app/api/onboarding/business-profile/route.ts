import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MEMORY_KIND,
  MEMORY_SOURCE,
  createServiceSupabaseClient,
  writeMemoryEntries,
} from "@/lib/supabase";

// POST /api/onboarding/business-profile
//
// Called when the user submits the intake page. This is the moment a
// business_profile actually comes into existence — voice / personality
// / name selections made on prior pages have been sitting in
// localStorage, and they get attached here.
//
// Idempotent: if the user already has an active profile (because they
// went back, or because they refreshed mid-flow and resubmitted), we
// update it in place rather than creating a duplicate.
//
// Uses the service-role client because we already authenticated the
// caller via Clerk above and we want to bypass RLS for this trusted
// server-side write. The brief §5.4 isolation guarantee still holds
// because we filter every read/write by the Clerk userId.

export const runtime = "nodejs";

const Body = z.object({
  business: z.string().trim().min(1).max(2000),
  audience: z.string().trim().min(1).max(2000),
  differentiator: z.string().trim().min(1).max(2000),
  agentName: z.string().trim().min(1).max(40).optional(),
  voiceId: z.string().trim().min(1).max(64).optional(),
  personalityId: z.string().trim().min(1).max(40).optional(),
  brandName: z.string().trim().min(1).max(80).optional(),
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
      { error: "Invalid intake payload", detail },
      { status: 400 },
    );
  }

  const supabase = createServiceSupabaseClient();

  // Look up the user's first active profile; upsert that instead of
  // blindly inserting (browser refresh / back-navigation shouldn't
  // create duplicates).
  const { data: existing, error: lookupErr } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (lookupErr) {
    console.error("[api/onboarding/business-profile] lookup failed:", lookupErr);
    return NextResponse.json(
      { error: "Profile lookup failed" },
      { status: 500 },
    );
  }

  const summary = composeIntakeSummary(body);

  let profileId: string;

  if (existing) {
    profileId = existing.id;
    const { error: updateErr } = await supabase
      .from("business_profiles")
      .update({
        agent_name: body.agentName ?? null,
        voice_id: body.voiceId ?? null,
        personality_id: body.personalityId ?? null,
        brand_name: body.brandName ?? null,
        intake_summary: summary,
      })
      .eq("id", profileId);
    if (updateErr) {
      console.error("[api/onboarding/business-profile] update failed:", updateErr);
      return NextResponse.json(
        { error: "Profile update failed" },
        { status: 500 },
      );
    }
    // Re-seed memory: delete prior intake-sourced entries so a re-submit
    // doesn't accumulate stale rows. Approval-derived memory survives.
    const { error: clearErr } = await supabase
      .from("memory_entries")
      .delete()
      .eq("business_profile_id", profileId)
      .eq("source", MEMORY_SOURCE.intake);
    if (clearErr) {
      console.error("[api/onboarding/business-profile] clear stale intake memory failed:", clearErr);
    }
  } else {
    const { data: created, error: insertErr } = await supabase
      .from("business_profiles")
      .insert({
        user_id: userId,
        agent_name: body.agentName ?? null,
        voice_id: body.voiceId ?? null,
        personality_id: body.personalityId ?? null,
        brand_name: body.brandName ?? null,
        intake_summary: summary,
      })
      .select("id")
      .single();
    if (insertErr || !created) {
      console.error("[api/onboarding/business-profile] insert failed:", insertErr);
      return NextResponse.json(
        { error: "Profile creation failed" },
        { status: 500 },
      );
    }
    profileId = created.id;
  }

  // Three semantic memory entries — one per intake question.
  try {
    await writeMemoryEntries(supabase, [
      {
        businessProfileId: profileId,
        kind: MEMORY_KIND.businessFundamentals,
        content: { text: body.business },
        source: MEMORY_SOURCE.intake,
        weight: 1.5, // canonical fact — boost over signals
      },
      {
        businessProfileId: profileId,
        kind: MEMORY_KIND.audience,
        content: { text: body.audience },
        source: MEMORY_SOURCE.intake,
        weight: 1.5,
      },
      {
        businessProfileId: profileId,
        kind: MEMORY_KIND.differentiator,
        content: { text: body.differentiator },
        source: MEMORY_SOURCE.intake,
        weight: 1.5,
      },
    ]);
  } catch (err) {
    console.error("[api/onboarding/business-profile] memory write failed:", err);
    return NextResponse.json(
      { error: "Memory write failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ profileId });
}

function composeIntakeSummary(body: z.infer<typeof Body>): string {
  // Compact text the orchestrator can drop into a prompt without
  // re-querying memory. Kept short — full memory_entries are richer.
  return [
    `BUSINESS: ${body.business}`,
    `AUDIENCE: ${body.audience}`,
    `EDGE: ${body.differentiator}`,
  ].join("\n");
}
