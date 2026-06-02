"use client";

import { ComingSoon, StudioPageShell, usePersonality } from "@/components/studio-page-shell";

export default function SchedulePage() {
  const personality = usePersonality();
  return (
    <StudioPageShell
      title="Schedule"
      subtitle="Queue what ships and when. Your agent fills the gaps if you fall behind."
      maxWidth={1080}
    >
      <ComingSoon
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect
              x="3.5"
              y="5"
              width="17"
              height="15"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <path
              d="M3.5 10h17M8 3v4M16 3v4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        }
        title="Content calendar"
        description="Plan your week, month, or campaign on a single canvas. Drag to reschedule, click to refine, publish on time without thinking about it."
        bullets={[
          "Week / month / quarter views",
          "Auto-fill gaps from your queue",
          "Channel-aware publish windows",
          "Approval workflow for teams",
          "Pause campaigns with one click",
          "Sync to Google Calendar + Notion",
        ]}
        accent={personality.accent}
      />
    </StudioPageShell>
  );
}
