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

// POST /api/agent/chat/completions
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

  // ElevenLabs wraps anything the client sends via
  // `extra_body_for_convai` (on startSession) under `elevenlabs_extra_body`
  // in the request body. That's our channel for per-turn identity +
  // surface + screen context.
  const extra = body.elevenlabs_extra_body ?? {};

  const userId = typeof extra.user_id === "string" ? extra.user_id : undefined;
  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Missing user_id. The client must pass it via extra_body_for_convai on startSession.",
      },
      { status: 400 },
    );
  }

  // Surface — onboarding vs studio. Defaults to onboarding since that's
  // the only surface live today.
  const surfaceRaw =
    typeof extra.wrks_surface === "string" ? extra.wrks_surface : "onboarding";
  const surface: AgentSurface = SURFACE_SET.has(surfaceRaw as AgentSurface)
    ? (surfaceRaw as AgentSurface)
    : "onboarding";

  // ElevenLabs conversation id — lets us tie multiple turns into a
  // single voice_sessions row for Phase 8 signal extraction. Optional:
  // turn persistence skips if missing (safe for local testing without
  // the ElevenLabs hop).
  const conversationId =
    typeof extra.conversation_id === "string"
      ? extra.conversation_id
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
    console.error("[api/agent/chat/completions] profile lookup failed:", profileErr);
    return NextResponse.json(
      { error: "Profile lookup failed" },
      { status: 500 },
    );
  }

  // For onboarding-stage users (no profile yet), build a minimal
  // synthetic profile so the prompt builder still has something to
  // chew on. The agent will treat them as first-conversation.
  // Every business_profiles column gets a null/default — keep this in
  // sync with the schema (see lib/supabase/types.ts).
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
    // New business-discovery columns (added 2026-06-24 migration).
    existing_site_url: null,
    industry: null,
    industry_custom: null,
    business_stage: null,
    years_running: null,
    offer_summary: null,
    offer_details: null,
    price_points: null,
    success_metric: null,
    revenue_target: null,
    differentiator: null,
    audience_description: null,
    audience_problem: null,
    audience_objections: null,
    audience_language_samples: null,
    voice_guide: null,
    existing_materials: null,
    competitor_urls: null,
    voice_origin: null,
    active_pillars: null,
    domain: null,
    crm: null,
    email_platform: null,
    payment_processor: null,
    scheduling_tool: null,
    ad_accounts: null,
    palette: null,
    onboarding_completed_at: null,
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
      typeof extra.wrks_screen_context === "object" &&
      extra.wrks_screen_context !== null
        ? (extra.wrks_screen_context as {
            pageLabel?: string;
            activeDeliverableId?: string;
            activeDeliverableKind?: string;
          })
        : undefined,
  });

  const tools = getToolsForSurface(surface);

  // ── 5. Convert messages to Anthropic format and stream ──────────
  const anthropicMessages = openaiMessagesToAnthropic(body.messages);

  // ── 5a. Silence guard ──────────────────────────────────────────
  // If the last user turn is empty, whitespace, or sub-utterance
  // ("um", "uh", "...", a stray punctuation), return a no-op
  // response instead of asking Claude to fill the silence. Without
  // this the agent loops on increasingly desperate re-prompts
  // ("Visual reference?" / "Whenever." / "Pick one.") because each
  // empty turn from ElevenLabs gets translated into a real LLM call.
  //
  // extractLastUserText returns null when the last user turn was a
  // tool_result — those aren't user speech, so we DON'T silence-gate
  // them. Letting them through is essential to keep the agent talking
  // after a tool fires.
  const lastUserText = extractLastUserText(anthropicMessages);
  if (lastUserText !== null && isSilenceTurn(lastUserText)) {
    console.log("[api/agent/chat/completions] silence turn — no-op", {
      lastUserText,
    });
    return emptyStreamResponse();
  }

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
          // Haiku 4.5 — ~250ms first-token, ~3x faster than Sonnet.
          // Voice replies are short (under 35 words) so Sonnet's deeper
          // reasoning isn't worth the latency. Studio orchestrator
          // (post-Phase 9) may switch to Sonnet for multi-deliverable
          // fan-outs where reasoning quality matters more than latency.
          model: "claude-haiku-4-5",
          // Voice turns are bounded to a few sentences. 256 tokens is
          // ample (~190 words) and reduces streaming overhead.
          max_tokens: 256,
          // Prompt caching on the system block — it's static turn-to-
          // turn for a given user (memory only changes between sessions
          // or on approval write-back). Skips re-tokenization on every
          // subsequent turn within the 5-min cache window. Saves
          // ~300-500ms latency + 90% prompt cost.
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
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
        console.error("[api/agent/chat/completions] stream error:", err);
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

/* ============================================================
 * Silence-turn detection
 * ============================================================
 * ElevenLabs sometimes emits an empty or sub-utterance user turn
 * when there's background noise, a quick breath, or the user
 * pauses to think mid-conversation. Letting Claude respond to
 * those produces the desperate-re-prompt loop ("Pick one." /
 * "Waiting." / "Go."). We bail before the LLM call instead.
 */
type AnthropicMessage = ReturnType<typeof openaiMessagesToAnthropic>[number];

/**
 * Find the most recent ACTUAL user speech turn — skipping tool_result
 * messages, which technically have role="user" in Anthropic's format
 * but are never user speech. Returns null when the last interaction
 * was a tool result (we let those through to Claude untouched).
 */
function extractLastUserText(messages: AnthropicMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const content = m.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      // Tool result follow-up turns aren't user speech — skip the
      // silence check for them entirely so Claude gets to respond to
      // its own tool call's result. Symptom of the bug this guards
      // against: the agent freezing after set_field fires.
      const hasToolResult = content.some(
        (block) =>
          block &&
          typeof block === "object" &&
          "type" in block &&
          block.type === "tool_result",
      );
      if (hasToolResult) return null;
      const text = content
        .map((block) => {
          if (typeof block === "string") return block;
          if (block && typeof block === "object" && "text" in block) {
            return typeof block.text === "string" ? block.text : "";
          }
          return "";
        })
        .join(" ");
      return text;
    }
    return "";
  }
  return "";
}

// Anything that's clearly a non-utterance — empty, whitespace only,
// stray punctuation, or a single filler token like "um" / "uh" /
// "hmm" / "okay" by itself. These all show up as legitimate turns
// from ElevenLabs' transcriber but they aren't really user intent;
// they're side-effects of mid-thought breaths / mic noise.
const SILENCE_FILLERS = new Set([
  "um",
  "uh",
  "umm",
  "uhh",
  "hmm",
  "mm",
  "mmm",
  "huh",
  "eh",
  "er",
  "ah",
  "oh",
]);

function isSilenceTurn(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  // Strip punctuation + lower-case, then check against filler set.
  const stripped = trimmed.replace(/[^a-zA-Z]/g, "").toLowerCase();
  if (stripped.length === 0) return true;
  if (stripped.length <= 3 && SILENCE_FILLERS.has(stripped)) return true;
  return false;
}

function emptyStreamResponse(): Response {
  const requestId = `chatcmpl_${cryptoRandomId()}`;
  const created = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  // Minimal valid OpenAI SSE stream — an empty text delta then a
  // stop chunk. ElevenLabs needs a well-formed response or it'll
  // think the LLM died and retry.
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enqueue = (line: string) =>
        controller.enqueue(encoder.encode(line));
      enqueue(
        encodeOpenAIChunk({
          id: requestId,
          created,
          chunk: { type: "text", text: "" },
        }),
      );
      enqueue(
        encodeOpenAIChunk({
          id: requestId,
          created,
          chunk: { type: "stop", reason: "stop" },
        }),
      );
      enqueue(SSE_DONE);
      controller.close();
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
