import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { BrandEditForm, type BrandProfile } from "./_brand-edit-form";

// /studio/brand — the source of truth for the brand info the agent
// reads before every generation and refinement. Users can edit these
// fields any time without re-running onboarding.
//
// Server-fetches the user's active business_profile row, hydrates the
// client form. Form PATCHes back to /api/onboarding/save (the same
// endpoint the onboarding cards use — supports partial updates).

export const runtime = "nodejs";

export default async function BrandPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceSupabaseClient() as any;
  const { data: profile } = await supabase
    .from("business_profiles")
    .select(
      "brand_name, business_type, primary_goal, voice_descriptor, offer_summary, audience_description, differentiator, existing_site_url, agent_name, onboarding_completed_at",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding/voice");

  const initial: BrandProfile = {
    brandName: profile.brand_name ?? "",
    businessType: profile.business_type ?? null,
    primaryGoal: profile.primary_goal ?? null,
    voiceDescriptor: profile.voice_descriptor ?? null,
    offerSummary: profile.offer_summary ?? "",
    audienceDescription: profile.audience_description ?? "",
    differentiator: profile.differentiator ?? "",
    existingSiteUrl: profile.existing_site_url ?? "",
    agentName: profile.agent_name ?? null,
  };

  return <BrandEditForm initial={initial} />;
}
