import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

// OpenAI ↔ Anthropic conversion helpers.
//
// ElevenLabs's custom LLM provider speaks OpenAI chat completions
// over SSE. Our backend uses Claude via the Anthropic SDK. These
// helpers translate between them on both sides — request normalization
// (OpenAI in → Anthropic out) and response streaming (Anthropic
// events → OpenAI delta chunks).
//
// We deliberately do NOT echo the system message we receive — we
// build the system prompt ourselves from memory. ElevenLabs's
// pre-filled system prompt is discarded.

// ============================================================
// Request normalization
// ============================================================

export type OpenAIChatRole = "system" | "user" | "assistant" | "tool";

export type OpenAIToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type OpenAIChatMessage = {
  role: OpenAIChatRole;
  content: string | null;
  // For role="tool", who we're responding to
  tool_call_id?: string;
  name?: string;
  // For role="assistant", the tool calls we made
  tool_calls?: OpenAIToolCall[];
};

export type OpenAIChatCompletionRequest = {
  model?: string;
  messages: OpenAIChatMessage[];
  stream?: boolean;
  temperature?: number | null;
  max_tokens?: number;
  tools?: unknown[];
  // ElevenLabs forwards anything the client passes via
  // `extra_body_for_convai` on startSession under this top-level key.
  // We read user_id / wrks_surface / conversation_id from here.
  // See: https://elevenlabs.io/docs/eleven-agents/customization/llm/custom-llm
  elevenlabs_extra_body?: {
    user_id?: string;
    wrks_surface?: string;
    conversation_id?: string;
    wrks_screen_context?: unknown;
    [key: string]: unknown;
  };
};

/**
 * Convert OpenAI-format messages → Anthropic Messages API messages.
 * Drops system messages — caller provides the system prompt separately.
 */
export function openaiMessagesToAnthropic(
  messages: OpenAIChatMessage[],
): MessageParam[] {
  const out: MessageParam[] = [];
  for (const m of messages) {
    if (m.role === "system") continue;

    if (m.role === "user") {
      if (typeof m.content === "string" && m.content) {
        out.push({ role: "user", content: m.content });
      }
      continue;
    }

    if (m.role === "assistant") {
      // If the assistant turn used tools, encode both the text and
      // the tool_use blocks. Otherwise just text.
      if (m.tool_calls && m.tool_calls.length > 0) {
        const blocks: Array<
          | { type: "text"; text: string }
          | {
              type: "tool_use";
              id: string;
              name: string;
              input: unknown;
            }
        > = [];
        if (m.content) {
          blocks.push({ type: "text", text: m.content });
        }
        for (const t of m.tool_calls) {
          let parsed: unknown = {};
          try {
            parsed = JSON.parse(t.function.arguments || "{}");
          } catch {
            parsed = {};
          }
          blocks.push({
            type: "tool_use",
            id: t.id,
            name: t.function.name,
            input: parsed,
          });
        }
        out.push({ role: "assistant", content: blocks });
      } else if (typeof m.content === "string" && m.content) {
        out.push({ role: "assistant", content: m.content });
      }
      continue;
    }

    if (m.role === "tool") {
      // OpenAI tool result → Anthropic tool_result block on a user message
      if (!m.tool_call_id) continue;
      out.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: m.tool_call_id,
            content: typeof m.content === "string" ? m.content : "",
          },
        ],
      });
      continue;
    }
  }
  return out;
}

// ============================================================
// SSE response encoding (Anthropic stream → OpenAI SSE chunks)
// ============================================================

export type SSEChunk =
  | { type: "text"; text: string }
  | {
      type: "tool_start";
      index: number;
      id: string;
      name: string;
    }
  | {
      type: "tool_args_delta";
      index: number;
      partial_json: string;
    }
  | { type: "stop"; reason?: string };

/**
 * Build an OpenAI-format SSE line for a streaming chat completion
 * chunk. ElevenLabs's custom-LLM client expects this exact shape.
 */
export function encodeOpenAIChunk(args: {
  id: string;
  created: number;
  chunk: SSEChunk;
}): string {
  const base = {
    id: args.id,
    object: "chat.completion.chunk",
    created: args.created,
    model: "wrks-orchestrator",
  };

  let payload: Record<string, unknown>;

  switch (args.chunk.type) {
    case "text":
      payload = {
        ...base,
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content: args.chunk.text },
            finish_reason: null,
          },
        ],
      };
      break;
    case "tool_start":
      payload = {
        ...base,
        choices: [
          {
            index: 0,
            delta: {
              role: "assistant",
              tool_calls: [
                {
                  index: args.chunk.index,
                  id: args.chunk.id,
                  type: "function",
                  function: { name: args.chunk.name, arguments: "" },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      };
      break;
    case "tool_args_delta":
      payload = {
        ...base,
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index: args.chunk.index,
                  function: { arguments: args.chunk.partial_json },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      };
      break;
    case "stop":
      payload = {
        ...base,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: args.chunk.reason ?? "stop",
          },
        ],
      };
      break;
  }
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export const SSE_DONE = "data: [DONE]\n\n";
