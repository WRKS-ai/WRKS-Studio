import type { ReactNode } from "react";
import { OnboardingAgentProvider } from "@/lib/onboarding-agent";

// Onboarding layout — owns the live agent session, the floating Siri
// orb, the conversation panel, and the dark backdrop. All of those
// persist across child page navigations because Next.js keeps the
// layout instance mounted while the children swap.
//
// Each child page (/onboarding/personality, /name, /intake, etc.) can
// register its own client-tool handlers via useConversationClientTool
// from @elevenlabs/react — registrations are scoped to the same
// ConversationProvider above, but unmount with the page so they
// don't conflict.
//
// The /onboarding/personality page is special: the agent shouldn't
// auto-start there (the user is still picking which voice to use).
// Auto-start in onboarding-agent.tsx waits until a personality is
// saved to localStorage, which happens on personality-page Continue.

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <OnboardingAgentProvider>{children}</OnboardingAgentProvider>;
}
