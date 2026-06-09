import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";

// Voice session turn persistence.
//
// Each call to /api/agent/converse is one TURN within a session. We
// don't get a "session started / session ended" signal from
// ElevenLabs at the LLM layer — what we get is a conversation_id
// passed via custom_llm extra_body. So we upsert:
//
//   • New conversation_id → INSERT a new voice_sessions row
//   • Same conversation_id → APPEND the turn to transcript
//
// ended_at stays NULL until either a post-call webhook fires OR a
// sweeper job marks it on inactivity (Phase 8). Once ended_at is
// set, Phase 8's Edge Function triggers signal extraction.
//
// Transcript shape (append-only JSONB array):
//   [
//     { role: 'user',      content: 'hi',         ts: '...' },
//     { role: 'assistant', content: 'hi there',   ts: '...',
//       tool_calls: [{ name, input }] }
//   ]

export type AgentSurface = "onboarding" | "studio";

export type TurnUserMessage = {
  content: string;
};

export type TurnAssistantMessage = {
  content: string;
  toolUses: Array<{ id: string; name: string; input: unknown }>;
};

export type PersistTurnArgs = {
  conversationId: string;
  businessProfileId: string;
  surface: AgentSurface;
  user: TurnUserMessage | null;
  assistant: TurnAssistantMessage;
};

/**
 * Best-effort: append the turn to the voice session. Never throws —
 * caller fires-and-forgets so the response stream isn't blocked by
 * a Supabase hiccup.
 */
export async function persistVoiceTurn(
  supabase: SupabaseClient<Database>,
  args: PersistTurnArgs,
): Promise<void> {
  try {
    // Find or create the session
    const { data: existing, error: lookupErr } = await supabase
      .from("voice_sessions")
      .select("id, transcript")
      .eq("elevenlabs_conv_id", args.conversationId)
      .eq("business_profile_id", args.businessProfileId)
      .maybeSingle();
    if (lookupErr && lookupErr.code !== "PGRST116") {
      console.error("[persist-turn] lookup failed:", lookupErr);
      return;
    }

    const ts = new Date().toISOString();
    const newEntries: Json[] = [];
    if (args.user && args.user.content) {
      newEntries.push({
        role: "user",
        content: args.user.content,
        ts,
      } as Json);
    }
    newEntries.push({
      role: "assistant",
      content: args.assistant.content,
      ts,
      ...(args.assistant.toolUses.length > 0
        ? {
            tool_calls: args.assistant.toolUses.map((t) => ({
              id: t.id,
              name: t.name,
              input: t.input as Json,
            })),
          }
        : {}),
    } as Json);

    if (existing) {
      // Append to existing transcript
      const existingArr = Array.isArray(existing.transcript)
        ? (existing.transcript as Json[])
        : [];
      const merged = [...existingArr, ...newEntries];
      const { error: updateErr } = await supabase
        .from("voice_sessions")
        .update({ transcript: merged as unknown as Json })
        .eq("id", existing.id);
      if (updateErr) {
        console.error("[persist-turn] update failed:", updateErr);
      }
      return;
    }

    // First turn of a new session
    const { error: insertErr } = await supabase.from("voice_sessions").insert({
      business_profile_id: args.businessProfileId,
      surface: args.surface,
      elevenlabs_conv_id: args.conversationId,
      transcript: newEntries as unknown as Json,
    });
    if (insertErr) {
      console.error("[persist-turn] insert failed:", insertErr);
    }
  } catch (err) {
    console.error("[persist-turn] unexpected error:", err);
  }
}
