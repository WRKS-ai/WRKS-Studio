"use client";

import Link from "next/link";
import { ComingSoon, StudioPageShell, usePersonality } from "@/components/studio-page-shell";

export default function BrandPage() {
  const personality = usePersonality();
  return (
    <StudioPageShell
      title="Brand"
      subtitle="The source of truth for your tone, palette, and what makes your work feel like you."
      maxWidth={1080}
      actions={
        <Link
          href="/studio/settings"
          className="h-10 px-4 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-white/[0.05] inline-flex items-center gap-2"
          style={{
            color: "rgba(245,245,247,0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Open brand voice settings
        </Link>
      }
    >
      <ComingSoon
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-2.7L7 19.5l1-6-4-4 5.5-1z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        }
        title="Brand workspace"
        description="A dedicated home for your house style, logo marks, color tokens, and brand voice training data. Your agent reads from here before every refinement."
        bullets={[
          "Train your agent on past work",
          "Define banned words and tone targets",
          "Lock down primary + accent palette",
          "Upload reference creative",
          "Version history of brand voice changes",
          "Style guide auto-generated",
        ]}
        accent={personality.accent}
      />
    </StudioPageShell>
  );
}
