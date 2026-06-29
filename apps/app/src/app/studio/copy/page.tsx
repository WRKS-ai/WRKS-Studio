import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/lib/supabase";

// /studio/copy — Copywriting pillar workspace (placeholder).
//
// Shipped as a minimal-real page (not a "coming soon" splash) per
// `feedback_no_dummy_no_disconnected.md`. Real Server Component fetches
// brand_state and shows the agent's voice picture — what register it
// will write in, what offer + audience it'll write about. Confirms
// back to the user that the agent IS ready to draft on demand. The
// actual Quill-based editor lands in Phase 6.

export const runtime = "nodejs";

const VOICE_DESCRIPTOR_LABEL: Record<string, string> = {
  professional: "Professional & polished",
  bold: "Bold & contrarian",
  warm: "Warm & friendly",
  expert: "Expert & data-driven",
  playful: "Playful & creative",
  quiet: "Quiet & minimalist",
};
const VOICE_DESCRIPTOR_EXEMPLAR: Record<string, string> = {
  professional: "Stripe, McKinsey vibe",
  bold: "Liquid Death, Cards Against Humanity",
  warm: "Mailchimp, Trader Joe's",
  expert: "Bloomberg, a16z",
  playful: "Notion, Duolingo",
  quiet: "Aesop, Apple",
};

const FORMATS = [
  { label: "Landing page copy", note: "Hero, value props, CTAs." },
  { label: "Ad copy", note: "Meta, Google, LinkedIn ads." },
  { label: "Email sequences", note: "Welcome series, nurture, sales." },
  { label: "Social posts", note: "IG / X / LinkedIn captions." },
  { label: "Website copy", note: "About, services, FAQ pages." },
];

export default async function CopyWorkspacePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createServiceSupabaseClient();
  const { data: profile } = await supabase
    .from("business_profiles")
    .select(
      "brand_name, voice_descriptor, offer_summary, audience_description, differentiator, onboarding_completed_at",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding/voice");

  const voiceLabel = profile.voice_descriptor
    ? VOICE_DESCRIPTOR_LABEL[profile.voice_descriptor] ?? profile.voice_descriptor
    : null;
  const voiceExemplar = profile.voice_descriptor
    ? VOICE_DESCRIPTOR_EXEMPLAR[profile.voice_descriptor] ?? null
    : null;

  return (
    <main
      className="relative size-full overflow-y-auto"
      style={{ background: "#0a0a0c", color: "#f5f0e6" }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 920, padding: "72px 40px 96px" }}
      >
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
          Copywriting
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
          The voice-driven editor lands next. Until then, this is the voice
          the agent will write in — applied to whatever format you ask for.
        </p>

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
          {voiceLabel && (
            <div className="flex flex-col" style={{ gap: 4 }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(245,240,230,0.42)",
                }}
              >
                Voice
              </span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: "-0.018em",
                  color: "rgba(245,240,230,0.95)",
                }}
              >
                {voiceLabel}
              </span>
              {voiceExemplar && (
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(245,240,230,0.5)",
                    letterSpacing: "-0.003em",
                  }}
                >
                  {voiceExemplar}
                </span>
              )}
            </div>
          )}

          {(profile.offer_summary || profile.audience_description) && (
            <div className="flex flex-col" style={{ gap: 20 }}>
              {profile.offer_summary && (
                <Section title="Writing about">{profile.offer_summary}</Section>
              )}
              {profile.audience_description && (
                <Section title="Writing for">
                  {profile.audience_description}
                </Section>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 40 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.12em",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              color: "rgba(245,240,230,0.42)",
              margin: "0 0 14px",
            }}
          >
            Formats the agent will draft
          </h2>
          <ul className="flex flex-col" style={{ gap: 10 }}>
            {FORMATS.map((f) => (
              <li
                key={f.label}
                className="flex items-baseline"
                style={{
                  gap: 14,
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.012)",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(245,240,230,0.9)",
                    letterSpacing: "-0.003em",
                  }}
                >
                  {f.label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(245,240,230,0.5)",
                    letterSpacing: "-0.003em",
                  }}
                >
                  {f.note}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p
          style={{
            marginTop: 36,
            fontSize: 13,
            color: "rgba(245,240,230,0.4)",
            letterSpacing: "-0.003em",
          }}
        >
          Next: voice-driven Quill editor — speak or type a request, the agent
          drafts in your voice, you edit inline.
        </p>
      </div>
    </main>
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
