import type { Personality } from "@/lib/personalities";
import type { ComposedMemory } from "../memory/compose";
import { renderMemoryForPrompt } from "../memory/compose";
import { buildOnboardingPrompt } from "./onboarding";
import { buildStudioPrompt } from "./studio";

// Surface-aware system prompt builder.
//
// The same Claude agent serves both onboarding and studio surfaces.
// The system prompt swaps based on `surface` so the agent knows
// whether it's guiding a first-time user through name → intake →
// reference → wow, or orchestrating a returning user's command in
// the studio (intent parse → framework select → fan-out → approve).
//
// Memory injection is the same on both surfaces — the WHAT-THE-AGENT-
// KNOWS block is rendered once and concatenated.

export type AgentSurface = "onboarding" | "studio";

export type BuildSystemPromptArgs = {
  surface: AgentSurface;
  personality: Personality;
  voiceName: string;
  memory: ComposedMemory;
  // Onboarding-only — suggested names to nudge the user with
  suggestedNames?: string[];
  // Studio-only — live screen context the agent should be aware of
  screenContext?: {
    pageLabel?: string;
    activeDeliverableId?: string;
    activeDeliverableKind?: string;
  };
};

export function buildSystemPrompt(args: BuildSystemPromptArgs): string {
  const memoryBlock = renderMemoryForPrompt(args.memory);

  if (args.surface === "onboarding") {
    return buildOnboardingPrompt({
      personality: args.personality,
      voiceName: args.voiceName,
      suggestedNames: args.suggestedNames ?? [],
      memoryBlock,
    });
  }

  return buildStudioPrompt({
    personality: args.personality,
    voiceName: args.voiceName,
    memoryBlock,
    screenContext: args.screenContext,
    agentName: args.memory.profile.agentName ?? "Agent",
    brandName: args.memory.profile.brandName ?? "the business",
  });
}
