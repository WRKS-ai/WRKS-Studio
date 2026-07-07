import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { SitesComposer } from "./_composer";

// /studio/sites — Sites pillar entry point.
//
// Server Component fetches the user's brand_state (redirects to
// onboarding if missing) and passes it to the SitesComposer client
// component that handles the brief input + submit → generation flow.
//
// v1 (2026-06-30): every visit lands on the composer. Once users have
// existing sites, this page becomes a grid + "New site" tile — deferred
// until we have at least one generated site to display.

export const runtime = "nodejs";

export default async function SitesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createServiceSupabaseClient();
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
    />
  );
}
