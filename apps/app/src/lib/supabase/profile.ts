import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "./types";

// Resolve "the user's active business profile" everywhere we need it.
//
// Per brief §5.4 a user can own multiple business profiles (Growth = 3,
// Pro = 8, Agency = unlimited). For MVP we always work with ONE active
// profile per user — the first one created. When the profile picker
// UI lands, this resolves via a cookie / session preference.
//
// Returns null if the user has no profile yet (= hasn't completed
// intake). Callers decide whether to create one or return early.

export type BusinessProfile = Tables<"business_profiles">;

export async function getActiveBusinessProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<BusinessProfile | null> {
  const { data, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[supabase/profile] active profile lookup failed:", error);
    throw error;
  }
  return data;
}

export async function getActiveBusinessProfileId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const profile = await getActiveBusinessProfile(supabase, userId);
  return profile?.id ?? null;
}
