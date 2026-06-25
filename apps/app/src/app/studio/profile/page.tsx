"use client";

import { useUser } from "@clerk/nextjs";
import { PersonalityIcon } from "@/components/personality-icon";
import { Card, StudioPageShell, usePersonality } from "@/components/studio-page-shell";
import { CrystalButton } from "@/components/crystal-button";

const STATS: { label: string; value: string }[] = [
  { label: "Deliverables created", value: "5" },
  { label: "Refinements", value: "23" },
  { label: "Brands", value: "1" },
  { label: "Day streak", value: "3" },
];

export default function ProfilePage() {
  const personality = usePersonality();
  const { user } = useUser();

  const displayName =
    user?.fullName || user?.firstName || user?.username || "You";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = (displayName[0] ?? "W").toUpperCase();

  return (
    <StudioPageShell
      title="Profile"
      subtitle="How you show up in WRKS — your details and how your agent collaborates with you."
      maxWidth={980}
    >
      {/* Identity card — chrome only, no personality accent. */}
      <Card className="p-7 mb-7 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-24 h-44 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 30% 100%, rgba(245,240,230,0.06), transparent 70%)",
          }}
        />
        <div className="relative flex items-start gap-6 flex-wrap">
          <div
            className="size-20 shrink-0 rounded-2xl grid place-items-center text-[32px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f5f0e6",
              boxShadow: "0 14px 40px -10px rgba(0,0,0,0.6)",
            }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-[200px]">
            <h2
              className="font-serif font-medium text-[28px] leading-tight tracking-tight"
              style={{
                color: "rgba(245,245,247,0.98)",
                letterSpacing: "-0.02em",
              }}
            >
              {displayName}
            </h2>
            <p
              className="mt-1.5 text-[14.5px]"
              style={{ color: "rgba(245,245,247,0.6)" }}
            >
              {email}
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <span
                className="px-2.5 py-1 rounded-md text-[11px] tracking-[0.16em] uppercase"
                style={{
                  background: "rgba(245,240,230,0.08)",
                  color: "#f5f0e6",
                  border: "1px solid rgba(245,240,230,0.22)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Founder
              </span>
              <span
                className="px-2.5 py-1 rounded-md text-[11px] tracking-[0.16em] uppercase"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(245,245,247,0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Starter
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="h-10 px-4 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-white/[0.05]"
              style={{
                color: "rgba(245,245,247,0.75)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Change avatar
            </button>
            <CrystalButton size="md">Edit profile</CrystalButton>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {STATS.map((s) => (
          <Card key={s.label} className="p-5">
            <div
              className="text-[12px] tracking-[0.18em] uppercase mb-2"
              style={{
                color: "rgba(245,245,247,0.45)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {s.label}
            </div>
            <div
              className="font-serif font-medium text-[28px]"
              style={{
                color: "rgba(245,245,247,0.98)",
                letterSpacing: "-0.025em",
              }}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Your agent */}
      <Card className="p-7 mb-7">
        <h3
          className="text-[12px] tracking-[0.22em] uppercase mb-5"
          style={{
            color: "rgba(245,245,247,0.45)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Your agent
        </h3>
        <div className="flex items-start gap-7 flex-wrap">
          <div className="shrink-0">
            <PersonalityIcon personality={personality} size="md" />
          </div>
          <div className="flex-1 min-w-[260px]">
            <div
              className="text-[20px] font-serif font-medium tracking-tight mb-1"
              style={{
                color: "rgba(245,245,247,0.98)",
                letterSpacing: "-0.01em",
              }}
            >
              {personality.name}
            </div>
            <p
              className="text-[14.5px] mb-4"
              style={{ color: "rgba(245,245,247,0.65)" }}
            >
              {personality.tagline}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {personality.traits.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-[12.5px]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(245,245,247,0.85)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <p
              className="mt-5 text-[15px] leading-relaxed"
              style={{ color: "rgba(245,240,230,0.78)" }}
            >
              &ldquo;{personality.sample}&rdquo;
            </p>
          </div>
          <div>
            <a
              href="/onboarding/personality"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-white/[0.05]"
              style={{
                color: "rgba(245,245,247,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Change agent
              <span style={{ color: "#f5f0e6" }}>→</span>
            </a>
          </div>
        </div>
      </Card>

      {/* Recent activity */}
      <Card className="p-7">
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-[16.5px] font-medium"
            style={{ color: "rgba(245,245,247,0.95)" }}
          >
            Recent activity
          </h3>
          <a
            href="/studio/library"
            className="text-[13px] font-medium hover:underline"
            style={{ color: "#f5f0e6" }}
          >
            View library
          </a>
        </div>
        <ul className="flex flex-col">
          {[
            { when: "2 min ago", what: "Refined Instagram caption" },
            { when: "27 min ago", what: "Generated 5 deliverables for Cinder & Bean" },
            { when: "Today", what: "Updated brand voice — added 3 banned words" },
            { when: "Yesterday", what: "Switched agent personality to Sage" },
          ].map((a, idx, arr) => (
            <li
              key={idx}
              className="flex items-center justify-between py-3"
              style={{
                borderBottom:
                  idx === arr.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span
                className="text-[14px]"
                style={{ color: "rgba(245,245,247,0.85)" }}
              >
                {a.what}
              </span>
              <span
                className="text-[12.5px]"
                style={{
                  color: "rgba(245,245,247,0.4)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {a.when}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </StudioPageShell>
  );
}
