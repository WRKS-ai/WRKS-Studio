"use client";

import { StudioPageShell } from "@/components/studio-page-shell";

const INTEGRATIONS: {
  name: string;
  category: string;
  description: string;
  status: "connect" | "soon" | "connected";
}[] = [
  {
    name: "Instagram Business",
    category: "Publish",
    description: "Schedule posts, reels, and stories directly from the studio.",
    status: "connect",
  },
  {
    name: "Meta Ads",
    category: "Publish",
    description: "Launch your Facebook + Instagram ad campaigns in one flow.",
    status: "connect",
  },
  {
    name: "LinkedIn Pages",
    category: "Publish",
    description: "Push polished updates to your company page on schedule.",
    status: "connect",
  },
  {
    name: "X (Twitter)",
    category: "Publish",
    description: "Threads and single posts. Auto-pulls performance data back.",
    status: "soon",
  },
  {
    name: "Notion",
    category: "Sync",
    description: "Mirror your library into a Notion database for the team.",
    status: "soon",
  },
  {
    name: "Google Drive",
    category: "Sync",
    description: "Save final assets and brand files to a Drive folder.",
    status: "soon",
  },
  {
    name: "Stripe",
    category: "Billing",
    description: "Manage subscriptions and invoices for the studio.",
    status: "connected",
  },
  {
    name: "Clerk",
    category: "Identity",
    description: "Authentication, team seats, and SSO.",
    status: "connected",
  },
];

export default function IntegrationsPage() {
  return (
    <StudioPageShell
      title="Integrations"
      subtitle="Connect WRKS to the tools your work flows through."
      maxWidth={1080}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INTEGRATIONS.map((it) => (
          <div
            key={it.name}
            className="p-5 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="text-[16px] font-medium"
                    style={{ color: "rgba(245,245,247,0.95)" }}
                  >
                    {it.name}
                  </h3>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10.5px] tracking-[0.18em] uppercase"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(245,245,247,0.55)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {it.category}
                  </span>
                </div>
                <p
                  className="text-[13.5px] leading-relaxed"
                  style={{ color: "rgba(245,245,247,0.6)" }}
                >
                  {it.description}
                </p>
              </div>
            </div>
            <StatusButton status={it.status} />
          </div>
        ))}
      </div>
    </StudioPageShell>
  );
}

function StatusButton({
  status,
}: {
  status: "connect" | "soon" | "connected";
}) {
  if (status === "connected") {
    return (
      <button
        type="button"
        className="h-9 px-3.5 rounded-lg text-[12.5px] font-medium inline-flex items-center gap-2"
        style={{
          background: "rgba(16,185,129,0.12)",
          color: "#34d399",
          border: "1px solid rgba(16,185,129,0.3)",
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{
            background: "#34d399",
            boxShadow: "0 0 6px rgba(16,185,129,0.6)",
          }}
        />
        Connected
      </button>
    );
  }
  if (status === "soon") {
    return (
      <button
        type="button"
        disabled
        className="h-9 px-3.5 rounded-lg text-[12.5px] font-medium opacity-50 cursor-not-allowed"
        style={{
          background: "rgba(255,255,255,0.03)",
          color: "rgba(245,245,247,0.55)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        Coming soon
      </button>
    );
  }
  return (
    <button
      type="button"
      className="h-9 px-3.5 rounded-lg text-[12.5px] font-medium transition-transform hover:scale-[1.02]"
      style={{
        background: "rgba(245,240,230,0.08)",
        color: "#f5f0e6",
        border: "1px solid rgba(245,240,230,0.22)",
      }}
    >
      Connect
    </button>
  );
}
