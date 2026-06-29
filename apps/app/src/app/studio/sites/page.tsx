import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/lib/supabase";

// /studio/sites — Sites pillar workspace (placeholder).
//
// Shipped as a minimal-real page (not a dummy "coming soon" splash)
// per `feedback_no_dummy_no_disconnected.md`. Real Server Component
// fetches the user's brand_state and displays it so the page IS doing
// real work — confirms back to the user what the agent already knows
// about their brand. The actual canvas-style builder lands in a
// future commit (Phase 5).
//
// First-time users with no brand state get redirected back to
// onboarding (same guard as the dashboard).

export const runtime = "nodejs";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  service: "Service business",
  ecommerce: "E-commerce",
  saas: "SaaS / software",
  agency: "Agency",
  personal_brand: "Personal brand / creator",
  other: "Other",
};
const PRIMARY_GOAL_LABEL: Record<string, string> = {
  book_calls: "Book calls / consultations",
  sell_products: "Sell products online",
  capture_leads: "Capture leads",
  build_audience: "Build an audience",
  launch_new: "Launch something new",
  fix_conversions: "Fix conversions on existing site",
};
const VOICE_DESCRIPTOR_LABEL: Record<string, string> = {
  professional: "Professional & polished",
  bold: "Bold & contrarian",
  warm: "Warm & friendly",
  expert: "Expert & data-driven",
  playful: "Playful & creative",
  quiet: "Quiet & minimalist",
};

export default async function SitesWorkspacePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createServiceSupabaseClient();
  const { data: profile } = await supabase
    .from("business_profiles")
    .select(
      "brand_name, business_type, primary_goal, voice_descriptor, offer_summary, audience_description, differentiator, existing_site_url, onboarding_completed_at",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding/voice");

  return (
    <main
      className="relative size-full overflow-y-auto"
      style={{ background: "#0a0a0c", color: "#f5f0e6" }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 920, padding: "72px 40px 96px" }}
      >
        <BackToStudio />

        <h1
          style={{
            fontSize: "clamp(1.875rem, 3.5vw, 3.25rem)",
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            color: "rgba(248,247,252,0.97)",
            margin: "20px 0 8px",
          }}
        >
          Sites
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.5,
            color: "rgba(245,240,230,0.6)",
            letterSpacing: "-0.003em",
            maxWidth: "62ch",
            margin: 0,
          }}
        >
          The canvas builder lands next. Until then, this is what the agent
          already knows about your brand — it&apos;ll use all of this when
          generating your first site.
        </p>

        <BrandSummary profile={profile} />

        <p
          style={{
            marginTop: 36,
            fontSize: 13,
            color: "rgba(245,240,230,0.4)",
            letterSpacing: "-0.003em",
          }}
        >
          Next: a Figma-style canvas with the agent alongside, generating from
          templates loaded from the WRKS GitHub.
        </p>
      </div>
    </main>
  );
}

function BackToStudio() {
  return (
    <Link
      href="/studio"
      className="inline-flex items-center transition-opacity duration-150 hover:opacity-80"
      style={{
        gap: 6,
        fontSize: 12.5,
        color: "rgba(245,240,230,0.55)",
        letterSpacing: "-0.003em",
      }}
    >
      <span aria-hidden>←</span> Studio
    </Link>
  );
}

function BrandSummary({
  profile,
}: {
  profile: {
    brand_name: string | null;
    business_type: string | null;
    primary_goal: string | null;
    voice_descriptor: string | null;
    offer_summary: string | null;
    audience_description: string | null;
    differentiator: string | null;
    existing_site_url: string | null;
  };
}) {
  const pills = [
    profile.business_type
      ? BUSINESS_TYPE_LABEL[profile.business_type] ?? profile.business_type
      : null,
    profile.primary_goal
      ? PRIMARY_GOAL_LABEL[profile.primary_goal] ?? profile.primary_goal
      : null,
    profile.voice_descriptor
      ? `${
          VOICE_DESCRIPTOR_LABEL[profile.voice_descriptor] ??
          profile.voice_descriptor
        } voice`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div
      className="flex flex-col"
      style={{
        gap: 24,
        marginTop: 40,
        padding: "28px 28px 30px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.018)",
      }}
    >
      {(profile.brand_name || profile.existing_site_url) && (
        <div className="flex flex-col" style={{ gap: 4 }}>
          {profile.brand_name && (
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.018em",
                color: "rgba(245,240,230,0.95)",
              }}
            >
              {profile.brand_name}
            </span>
          )}
          {profile.existing_site_url && (
            <a
              href={profile.existing_site_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                color: "rgba(245,240,230,0.5)",
                textDecoration: "none",
              }}
            >
              {profile.existing_site_url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
            </a>
          )}
        </div>
      )}

      {pills.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {pills.map((pill) => (
            <span
              key={pill}
              style={{
                display: "inline-flex",
                padding: "5px 10px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.003em",
                color: "rgba(245,240,230,0.78)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {pill}
            </span>
          ))}
        </div>
      )}

      {(profile.offer_summary ||
        profile.audience_description ||
        profile.differentiator) && (
        <div className="flex flex-col" style={{ gap: 20 }}>
          {profile.offer_summary && (
            <Section title="What you do">{profile.offer_summary}</Section>
          )}
          {profile.audience_description && (
            <Section title="Who buys it">
              {profile.audience_description}
            </Section>
          )}
          {profile.differentiator && (
            <Section title="Your edge">{profile.differentiator}</Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        gap: 6,
        paddingTop: 16,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "-0.003em",
          color: "rgba(245,240,230,0.55)",
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          letterSpacing: "-0.003em",
          color: "rgba(245,240,230,0.9)",
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}
