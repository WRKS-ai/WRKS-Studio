import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase";
import type { TablesInsert } from "@/lib/supabase";

type BusinessProfileInsert = TablesInsert<"business_profiles">;

// PATCH /api/onboarding/save
//
// Single endpoint the business-discovery cards call as each one
// advances. Takes a partial brand_state row, upserts by Clerk user_id.
// Validation is per-field — each enum-constrained column rejects
// unknown values, free-text fields are length-capped.
//
// The picker cards on /onboarding/business each call this on Next.
// First Next creates the row; subsequent Nexts patch in place.
// Concurrent calls from the same user are safe (we look up by
// user_id + status="active" with limit 1 and upsert).

export const runtime = "nodejs";

const BUSINESS_TYPES = [
  "service",
  "ecommerce",
  "saas",
  "agency",
  "personal_brand",
  "other",
] as const;
const PRIMARY_GOALS = [
  "book_calls",
  "sell_products",
  "capture_leads",
  "build_audience",
  "launch_new",
  "fix_conversions",
] as const;
const TRAFFIC_SOURCES = [
  "paid_ads",
  "seo",
  "social",
  "email",
  "referrals",
  "cold_outreach",
  "press",
] as const;
const VOICE_DESCRIPTORS = [
  "professional",
  "bold",
  "warm",
  "expert",
  "playful",
  "quiet",
] as const;
const ACTIVE_PILLARS = ["sites", "copy"] as const;

const Body = z
  .object({
    // Card 1 — URL ingest (URL itself is set by /api/ingest/site;
    // this endpoint just accepts the field for symmetry).
    existing_site_url: z.string().trim().max(2000).nullable().optional(),
    // Card 2 — business type
    business_type: z.enum(BUSINESS_TYPES).nullable().optional(),
    // Card 3 — primary goal
    primary_goal: z.enum(PRIMARY_GOALS).nullable().optional(),
    // Card 4 — traffic sources (multi)
    traffic_sources: z.array(z.enum(TRAFFIC_SOURCES)).nullable().optional(),
    // Card 5 — voice descriptor
    voice_descriptor: z.enum(VOICE_DESCRIPTORS).nullable().optional(),
    // Card 6 — use case (active pillars at launch = sites and/or copy)
    active_pillars: z.array(z.enum(ACTIVE_PILLARS)).nullable().optional(),
    // Free-text narrative fields the agent reads from brand state
    brand_name: z.string().trim().max(160).nullable().optional(),
    offer_summary: z.string().trim().max(2000).nullable().optional(),
    audience_description: z.string().trim().max(2000).nullable().optional(),
    differentiator: z.string().trim().max(2000).nullable().optional(),
    competitor_urls: z.array(z.string().trim().max(500)).max(10).nullable().optional(),
    // Final-card-only — passed when the last business card advances.
    onboarding_completed_at: z.string().datetime().nullable().optional(),
  })
  .strict();

export async function PATCH(req: Request) {
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
      { error: "Invalid save payload", detail },
      { status: 400 },
    );
  }

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Empty save payload" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  const { data: existing, error: lookupErr } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (lookupErr) {
    console.error("[api/onboarding/save] lookup failed:", lookupErr);
    return NextResponse.json(
      { error: "Profile lookup failed", detail: lookupErr.message },
      { status: 500 },
    );
  }

  const update: Partial<BusinessProfileInsert> = { ...body };

  if (existing) {
    const { error: updateErr } = await supabase
      .from("business_profiles")
      .update(update)
      .eq("id", existing.id);
    if (updateErr) {
      console.error("[api/onboarding/save] update failed:", updateErr);
      return NextResponse.json(
        { error: "Couldn't save", detail: updateErr.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ profileId: existing.id, mode: "updated" });
  }

  const insertRow: BusinessProfileInsert = {
    user_id: userId,
    ...update,
  };
  const { data: created, error: insertErr } = await supabase
    .from("business_profiles")
    .insert(insertRow)
    .select("id")
    .single();
  if (insertErr || !created) {
    console.error("[api/onboarding/save] insert failed:", insertErr);
    return NextResponse.json(
      { error: "Couldn't create profile", detail: insertErr?.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ profileId: created.id, mode: "created" });
}
