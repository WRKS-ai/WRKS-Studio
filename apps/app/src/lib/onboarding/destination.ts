import { createServiceSupabaseClient } from "@/lib/supabase";

// Where should a signed-in user land when they hit "/" or return from
// Clerk's SSO callback? Depends on whether they've finished onboarding.
//
// - Completed onboarding    -> /studio
// - Profile exists, but not -> /onboarding/personality (resume from start
//   for now; per-step resume is a later refinement)
// - No profile yet          -> /onboarding/personality

export async function getPostSignInDestination(userId: string): Promise<string> {
  try {
    const supabase = createServiceSupabaseClient();
    const { data } = await supabase
      .from("business_profiles")
      .select("onboarding_completed_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.onboarding_completed_at) return "/studio";
    return "/onboarding/personality";
  } catch {
    return "/onboarding/personality";
  }
}
