import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { AgentSurface } from "../prompts";

// Server-side tool registry. We define each tool's schema here so
// Claude (via Anthropic SDK) knows their names and parameter shapes.
//
// EXECUTION lives on the client in @elevenlabs/react's
// useConversationClientTool — the LLM emits tool_use; ElevenLabs
// forwards over WebSocket; the client hook fires the React update
// (set form field, navigate router, etc.). The server-side endpoint
// just streams the tool_use through in OpenAI-compatible format.
//
// As studio tools start needing server-side state (e.g., write to
// the deliverables table), those handlers move here and the client
// just renders the result.

const onboardingTools: Tool[] = [
  {
    name: "set_field",
    description:
      "Update a named field on the current on-screen form. Fire this BEFORE confirming in voice — never confirm a value you haven't set.",
    input_schema: {
      type: "object",
      properties: {
        field: {
          type: "string",
          enum: ["name", "business", "audience", "differentiator"],
          description:
            "Which field to update. 'name' on the naming page; the others on the intake page.",
        },
        value: {
          type: "string",
          description:
            "The value to set. Pass the user's exact words — don't quote, don't spell-fix.",
        },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "navigate",
    description:
      "Move the user to a different onboarding page. Use when they say 'continue', 'next', 'go', 'back', or similar.",
    input_schema: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          enum: ["next", "back"],
          description:
            "'next' advances to the following page; 'back' goes one page back.",
        },
      },
      required: ["destination"],
    },
  },
];

const studioTools: Tool[] = [
  {
    name: "set_active_deliverable",
    description:
      "Switch the staging environment to focus on a specific deliverable.",
    input_schema: {
      type: "object",
      properties: {
        deliverable_id: {
          type: "string",
          description: "UUID of the deliverable to focus.",
        },
      },
      required: ["deliverable_id"],
    },
  },
  {
    name: "refine_active",
    description:
      "Apply a revision to the currently-active deliverable. The instruction should be the user's exact directive (e.g., 'make the headline shorter', 'change the CTA to Read the case study').",
    input_schema: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
          description: "The revision directive in the user's voice.",
        },
      },
      required: ["instruction"],
    },
  },
  {
    name: "read_active",
    description:
      "Read the current deliverable's content back to the user in plain speech.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "navigate",
    description:
      "Move the user to a different studio page. Common destinations: library, brand, audience, schedule, analytics, integrations, plans, settings, profile.",
    input_schema: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "Name of the destination page.",
        },
      },
      required: ["destination"],
    },
  },
];

export function getToolsForSurface(surface: AgentSurface): Tool[] {
  return surface === "onboarding" ? onboardingTools : studioTools;
}
