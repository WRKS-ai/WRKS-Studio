"use client";

import { ComingSoon, StudioPageShell, usePersonality } from "@/components/studio-page-shell";

export default function AnalyticsPage() {
  const personality = usePersonality();
  return (
    <StudioPageShell
      title="Analytics"
      subtitle="What landed, what didn&rsquo;t, and why. Your agent learns from each result."
      maxWidth={1080}
    >
      <ComingSoon
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 20V10M10 20V4M16 20v-7M22 20H2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        }
        title="Performance dashboard"
        description="Pull data from Meta, X, LinkedIn, and your landing pages into a single view. Your agent will use it to tune the next round of work."
        bullets={[
          "Cross-channel reach + engagement",
          "Campaign attribution",
          "Which copy moved the needle",
          "A/B variants tracked automatically",
          "Weekly digest in your inbox",
          "Export to CSV or PDF",
        ]}
        accent={personality.accent}
      />
    </StudioPageShell>
  );
}
