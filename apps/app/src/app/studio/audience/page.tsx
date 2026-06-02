"use client";

import { ComingSoon, StudioPageShell, usePersonality } from "@/components/studio-page-shell";

export default function AudiencePage() {
  const personality = usePersonality();
  return (
    <StudioPageShell
      title="Audience"
      subtitle="Who your work is for. WRKS uses this to tune voice, length, and channel mix."
      maxWidth={1080}
    >
      <ComingSoon
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="17" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M3 19c1.4-3.2 4-4.5 6-4.5s4.6 1.3 6 4.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        }
        title="Audience profiles"
        description="Define one or more audiences for your work. WRKS will adapt copy, format, and channel choices based on which audience you&rsquo;re targeting."
        bullets={[
          "Persona templates",
          "Channel preference per persona",
          "Reading level + vocabulary calibration",
          "Local language and idioms",
          "Audience-specific brand voice variations",
          "Performance overlays per audience",
        ]}
        accent={personality.accent}
      />
    </StudioPageShell>
  );
}
