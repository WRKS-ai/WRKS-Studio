import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { composeMemoryContext } from "@/lib/agent/memory/compose";
import {
  encodeOpenAIChunk,
  openaiMessagesToAnthropic,
  SSE_DONE,
  type OpenAIChatCompletionRequest,
} from "@/lib/agent/openai-compat";
import { persistVoiceTurn } from "@/lib/agent/persist-turn";
import { buildSystemPrompt, type AgentSurface } from "@/lib/agent/prompts";
import { getToolsForSurface } from "@/lib/agent/tools";
import { PERSONALITIES } from "@/lib/personalities";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { VOICES } from "@/lib/voices";

// POST /api/agent/converse
//
// The custom-LLM endpoint that ElevenLabs Conversational AI points at.
// Receives OpenAI-format chat completion requests, returns OpenAI-format
// SSE streamed responses. Internally it composes a fresh system prompt
// with the user's memory + screen context and calls Claude.
//
// Auth: ElevenLabs sends our shared secret in the Authorization header.
// User identification: we ask ElevenLabs to forward the `wrks_user_id`
// field via `extra_body` on the agent; we read it from the request
// body and look up the active business profile.
//
// Streaming: the response is OpenAI's chat.completion.chunk SSE format.
// Anthropic's MessageStream events translate cleanly into delta chunks
// (text and tool_use). Tool execution happens client-side via
// @elevenlabs/react's useConversationClientTool — this endpoint just
// streams the calls through.

export const runtime = "nodejs";
// Long-running streamed responses — Vercel default is 10s, voice
// turns can run up to ~30s with tool calls + multiple paragraphs.
export const maxDuration = 60;

const SURFACE_SET: Set<AgentSurface> = new Set(["onboarding", "studio"]);

export async function POST(req: NextRequest) {
  // ── 1. Auth: shared secret from ElevenLabs ──────────────────────
  const sharedSecret = process.env.WRKS_AGENT_LLM_SECRET;
  if (!sharedSecret) {
    return NextResponse.json(
      { error: "Server misconfigured: WRKS_AGENT_LLM_SECRET not set." },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : auth.trim();
  if (presented !== sharedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse request body ───────────────────────────────────────
  let body: OpenAIChatCompletionRequest;
  try {
    body = (await req.json()) as OpenAIChatCompletionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = typeof body.user_id === "string" ? body.user_id : undefined;
  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Missing user_id. Configure the ElevenLabs agent to forward wrks_user_id via extra_body.",
      },
      { status: 400 },
    );
  }

  // Surface lives in a custom field we pass via extra_body too —
  // defaults to "onboarding" since that's the only surface live today.
  const surfaceRaw =
    typeof (body as { wrks_surface?: unknown }).wrks_surface === "string"
      ? ((body as { wrks_surface?: string }).wrks_surface as string)
      : "onboarding";
  const surface: AgentSurface = SURFACE_SET.has(surfaceRaw as AgentSurface)
    ? (surfaceRaw as AgentSurface)
    : "onboarding";

  // ElevenLabs conversation id — also forwarded via extra_body.
  // Lets us tie multiple turns into a single voice_sessions row for
  // Phase 8 signal extraction. Optional: turn persistence skips if
  // missing (safe for local testing without the ElevenLabs hop).
  const conversationId =
    typeof (body as { conversation_id?: unknown }).conversation_id === "string"
      ? ((body as { conversation_id?: string }).conversation_id as string)
      : undefined;

  // ── 3. Resolve the user's active profile + memory ───────────────
  const supabase = createServiceSupabaseClient();

  const { data: profile, error: profileErr } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (profileErr) {
    console.error("[api/agent/converse] profile lookup failed:", profileErr);
    return NextResponse.json(
      { error: "Profile lookup failed" },
      { status: 500 },
    );
  }

  // For onboarding-stage users (no profile yet), build a minimal
  // synthetic profile so the prompt builder still has something to
  // chew on. The agent will treat them as first-conversation.
  const effectiveProfile = profile ?? {
    id: "pending",
    user_id: userId,
    brand_name: null,
    agent_name: null,
    voice_id: null,
    personality_id: null,
    intake_summary: null,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Resolve personality + voice (used for character / voice rules
  // in the system prompt). Default to maven/Brad if unknown.
  const personality =
    PERSONALITIES.find((p) => p.id === effectiveProfile.personality_id) ??
    PERSONALITIES[0];
  const voice =
    VOICES.find((v) => v.id === effectiveProfile.voice_id) ?? VOICES[0];

  const memory = profile
    ? await composeMemoryContext(supabase, profile)
    : await composeMemoryContext(supabase, effectiveProfile);

  // ── 4. Build the system prompt ──────────────────────────────────
  const systemPrompt = buildSystemPrompt({
    surface,
    personality,
    voiceName: voice.name,
    memory,
    suggestedNames: personality.suggestedNames,
    screenContext:
      typeof body.wrks_screen_context === "object" &&
      body.wrks_screen_context !== null
        ? (body.wrks_screen_context as {
            pageLabel?: string;
            activeDeliverableId?: string;
            activeDeliverableKind?: string;
          })
        : undefined,
  });

  const tools = getToolsForSurface(surface);

  // ── 5. Convert messages to Anthropic format and stream ──────────
  const anthropicMessages = openaiMessagesToAnthropic(body.messages);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: ANTHROPIC_API_KEY not set." },
      { status: 503 },
    );
  }
  const client = new Anthropic({ apiKey });

  const requestId = `chatcmpl_${cryptoRandomId()}`;
  const created = Math.floor(Date.now() / 1000);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (line: string) => controller.enqueue(encoder.encode(line));
      try {
        const messageStream = client.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: systemPrompt,
          tools,
          messages: anthropicMessages,
        });

        // Track tool_use blocks by index so we can stream their
        // input JSON deltas with the right index in OpenAI format.
        const toolIndexById = new Map<string, number>();
        let nextToolIndex = 0;
        // Accumulators for turn persistence. We stream out as we go
        // but also collect everything into these so we can write the
        // full assistant turn to voice_sessions after the stream ends.
        let assistantText = "";
        const assistantToolUses: Array<{
          id: string;
          name: string;
          input: unknown;
          inputJson: string;
        }> = [];

        for await (const event of messageStream) {
          if (event.type === "content_block_start") {
            const block = event.content_block;
            if (block.type === "tool_use") {
              const idx = nextToolIndex++;
              toolIndexById.set(block.id, idx);
              assistantToolUses.push({
                id: block.id,
                name: block.name,
                input: block.input ?? {},
                inputJson: "",
              });
              enqueue(
                encodeOpenAIChunk({
                  id: requestId,
                  created,
                  chunk: {
                    type: "tool_start",
                    index: idx,
                    id: block.id,
                    name: block.name,
                  },
                }),
              );
            }
            continue;
          }
          if (event.type === "content_block_delta") {
            const delta = event.delta;
            if (delta.type === "text_delta") {
              assistantText += delta.text;
              enqueue(
                encodeOpenAIChunk({
                  id: requestId,
                  created,
                  chunk: { type: "text", text: delta.text },
                }),
              );
            } else if (delta.type === "input_json_delta") {
              // Tool args streaming. The index is the most-recent
              // tool_use block (Anthropic streams one tool's input
              // contiguously).
              const idx = nextToolIndex - 1;
              if (idx >= 0) {
                const tool = assistantToolUses[idx];
                if (tool) tool.inputJson += delta.partial_json;
                enqueue(
                  encodeOpenAIChunk({
                    id: requestId,
                    created,
                    chunk: {
                      type: "tool_args_delta",
                      index: idx,
                      partial_json: delta.partial_json,
                    },
                  }),
                );
              }
            }
            continue;
          }
          if (event.type === "message_delta") {
            const stop = event.delta.stop_reason;
            if (stop) {
              const reason =
                stop === "tool_use"
                  ? "tool_calls"
                  : stop === "end_turn"
                    ? "stop"
                    : stop === "max_tokens"
                      ? "length"
                      : "stop";
              enqueue(
                encodeOpenAIChunk({
                  id: requestId,
                  created,
                  chunk: { type: "stop", reason },
                }),
              );
            }
            continue;
          }
        }

        enqueue(SSE_DONE);
        controller.close();

        // Fire-and-forget turn persistence. Has to happen AFTER the
        // stream finishes (we need the accumulated assistant text +
        // tool inputs) but BEFORE the route returns so the Vercel
        // request lifecycle includes it. Errors don't propagate —
        // the user already got their response.
        if (conversationId && profile) {
          // Pull the last user message out of the inbound history.
          const lastUser = [...body.messages]
            .reverse()
            .find((m) => m.role === "user" && typeof m.content === "string");
          const userTurn =
            lastUser && typeof lastUser.content === "string"
              ? { content: lastUser.content }
              : null;

          // Finalize tool inputs: prefer the streamed partial_json
          // when present (most accurate), fall back to whatever
          // input shipped with content_block_start.
          const finalToolUses = assistantToolUses.map((t) => {
            if (t.inputJson) {
              try {
                return { id: t.id, name: t.name, input: JSON.parse(t.inputJson) };
              } catch {
                return { id: t.id, name: t.name, input: t.input };
              }
            }
            return { id: t.id, name: t.name, input: t.input };
          });

          void persistVoiceTurn(supabase, {
            conversationId,
            businessProfileId: profile.id,
            surface,
            user: userTurn,
            assistant: {
              content: assistantText,
              toolUses: finalToolUses,
            },
          });
        }
      } catch (err) {
        console.error("[api/agent/converse] stream error:", err);
        try {
          enqueue(
            encodeOpenAIChunk({
              id: requestId,
              created,
              chunk: { type: "stop", reason: "stop" },
            }),
          );
          enqueue(SSE_DONE);
        } catch {
          /* socket may already be torn down */
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
