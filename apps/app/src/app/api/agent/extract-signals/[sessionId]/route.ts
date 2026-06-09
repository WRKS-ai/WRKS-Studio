import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MEMORY_KIND,
  MEMORY_SOURCE,
  createServiceSupabaseClient,
  writeMemoryEntries,
} from "@/lib/supabase";
import type { Json } from "@/lib/supabase/types";

// POST /api/agent/extract-signals/[sessionId]
//
// The long-tail memory builder. Once a voice session ends, this
// route reads the transcript, runs a Claude pass over it to extract
// preference signals (likes, dislikes, voice cues, communication
// style), and writes memory_entries that surface in future voice
// turns via composeMemoryContext.
//
// Idempotency: the extraction sets voice_sessions.meta.extracted = true
// so re-firing on the same session is a no-op. If you want to re-run
// (e.g. after improving the prompt), clear that flag first.
//
// Auth: shared secret in Authorization header. Same secret as the
// custom-LLM endpoint — Vercel Cron, Supabase pg_cron, or manual
// curl can all call it as long as they have WRKS_AGENT_LLM_SECRET.

export const runtime = "nodejs";
export const maxDuration = 60;

// What we ask Claude to pull out. Each field is optional — for short
// or low-signal sessions we expect mostly empty output, which is fine.
const SignalsSchema = z
  .object({
    voiceSignals: z
      .array(z.string())
      .max(8)
      .describe(
        "Things the user expressed preference FOR — specific phrasings, tones, hooks, or directions they liked. One per array entry, in their own words.",
      )
      .optional(),
    rejectionSignals: z
      .array(z.string())
      .max(8)
      .describe(
        "Things the user rejected or pushed back on — phrases, tones, or directions they said 'no' to. Capture the WHY when they gave one.",
      )
      .optional(),
    communicationStyle: z
      .string()
      .max(400)
      .describe(
        "1-3 sentences on how this user prefers to be SPOKEN TO. Detail level (brief vs detailed), tone (formal vs casual), interaction style (collaborative vs decisive). Only fill if the session gave clear evidence.",
      )
      .optional(),
    brandVoice: z
      .string()
      .max(400)
      .describe(
        "1-3 sentences on how the BUSINESS sounds when it talks — based on what the user approved and how they described it. Only fill if the session contributed evidence.",
      )
      .optional(),
  })
  .describe("Preference signals extracted from a voice session transcript.");

const EXTRACTION_PROMPT = `You read voice session transcripts between a small-business owner and their personalized AI agent. Your job is to extract durable PREFERENCE SIGNALS — what the owner liked, what they pushed back on, how they prefer to be spoken to, and how their business sounds.

You are NOT writing a summary. You are extracting signal. If a session contains mostly small talk or short tool calls, return mostly empty fields. Don't invent signals from weak evidence.

WHAT COUNTS AS A SIGNAL
- Voice signal: "yes, that's perfect" / "I like the warmth there" / "that hook works" — capture the specific thing that landed.
- Rejection signal: "no, too corporate" / "that sounds AI" / "drop that bullet" — capture the directive AND the reason if given.
- Communication style: how the owner asks questions, how much explanation they want, how decisive vs exploratory they sound.
- Brand voice: how the owner described the brand's tone, OR what they approved that demonstrates the tone.

DO NOT
- Summarize the conversation.
- Invent generic preferences ("they like quality content").
- Capture transient things ("they said hi").
- Include the agent's own reflections.

Be specific. Be sparing. An empty array is better than a vague one.`;

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(req: Request, context: RouteContext) {
  // ── 1. Shared-secret auth ──
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

  const { sessionId } = await context.params;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId" },
      { status: 400 },
    );
  }

  const supabase = createServiceSupabaseClient();

  // ── 2. Load session + check idempotency ──
  const { data: session, error: lookupErr } = await supabase
    .from("voice_sessions")
    .select("id, business_profile_id, transcript, meta, ended_at")
    .eq("id", sessionId)
    .single();
  if (lookupErr) {
    if (lookupErr.code === "PGRST116") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    console.error("[extract-signals] lookup failed:", lookupErr);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const meta = (session.meta ?? {}) as Record<string, Json>;
  if (meta.extracted === true) {
    return NextResponse.json({
      ok: true,
      skipped: "already-extracted",
    });
  }

  const transcript = Array.isArray(session.transcript)
    ? (session.transcript as Array<{
        role?: string;
        content?: string;
        ts?: string;
      }>)
    : [];

  // Sessions shorter than a couple of exchanges aren't worth a Claude
  // call. Mark extracted=true so we don't poll them forever.
  if (transcript.length < 3) {
    const { error: noopErr } = await supabase
      .from("voice_sessions")
      .update({ meta: { ...meta, extracted: true, skipped: "too-short" } as Json })
      .eq("id", sessionId);
    if (noopErr) console.error("[extract-signals] noop mark failed:", noopErr);
    return NextResponse.json({ ok: true, skipped: "too-short" });
  }

  // ── 3. Build the user-message prompt with the transcript ──
  const transcriptText = transcript
    .map((t) => `[${t.role ?? "?"}] ${t.content ?? ""}`)
    .join("\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: ANTHROPIC_API_KEY not set." },
      { status: 503 },
    );
  }
  const client = new Anthropic({ apiKey });

  // ── 4. Claude extraction pass (Haiku — cheap, fast, accurate enough) ──
  let signals: z.infer<typeof SignalsSchema>;
  try {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: EXTRACTION_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Extract preference signals from this voice session transcript:\n\n${transcriptText}`,
        },
      ],
      output_config: { format: zodOutputFormat(SignalsSchema) },
    });
    if (!response.parsed_output) {
      console.warn("[extract-signals] no parsed output");
      signals = {};
    } else {
      signals = response.parsed_output;
    }
  } catch (err) {
    console.error("[extract-signals] Claude failed:", err);
    return NextResponse.json(
      { error: "Extraction failed" },
      { status: 502 },
    );
  }

  // ── 5. Write memory entries ──
  const profileId = session.business_profile_id;
  const memoryWrites: Array<{
    businessProfileId: string;
    kind: typeof MEMORY_KIND[keyof typeof MEMORY_KIND];
    content: Json;
    source: typeof MEMORY_SOURCE[keyof typeof MEMORY_SOURCE];
    weight?: number;
  }> = [];

  for (const sig of signals.voiceSignals ?? []) {
    memoryWrites.push({
      businessProfileId: profileId,
      kind: MEMORY_KIND.voiceSignal,
      content: { text: sig, source_session: sessionId } as Json,
      source: MEMORY_SOURCE.voiceExtraction,
      weight: 1.0,
    });
  }
  for (const sig of signals.rejectionSignals ?? []) {
    memoryWrites.push({
      businessProfileId: profileId,
      kind: MEMORY_KIND.rejectionSignal,
      content: { text: sig, source_session: sessionId } as Json,
      source: MEMORY_SOURCE.voiceExtraction,
      weight: 1.0,
    });
  }
  if (signals.communicationStyle) {
    memoryWrites.push({
      businessProfileId: profileId,
      kind: MEMORY_KIND.communicationStyle,
      content: { text: signals.communicationStyle, source_session: sessionId } as Json,
      source: MEMORY_SOURCE.voiceExtraction,
      weight: 1.1,
    });
  }
  if (signals.brandVoice) {
    memoryWrites.push({
      businessProfileId: profileId,
      kind: MEMORY_KIND.brandVoice,
      content: { text: signals.brandVoice, source_session: sessionId } as Json,
      source: MEMORY_SOURCE.voiceExtraction,
      weight: 1.1,
    });
  }

  if (memoryWrites.length > 0) {
    try {
      await writeMemoryEntries(supabase, memoryWrites);
    } catch (err) {
      console.error("[extract-signals] memory write failed:", err);
      // Continue — mark the session extracted so we don't loop on a
      // permanent failure (manual re-run can clear the flag).
    }
  }

  // ── 6. Mark extracted so the next sweep skips this session ──
  const { error: markErr } = await supabase
    .from("voice_sessions")
    .update({
      meta: {
        ...meta,
        extracted: true,
        extracted_at: new Date().toISOString(),
        signals_count: memoryWrites.length,
      } as Json,
    })
    .eq("id", sessionId);
  if (markErr) console.error("[extract-signals] mark extracted failed:", markErr);

  return NextResponse.json({
    ok: true,
    signals_written: memoryWrites.length,
    breakdown: {
      voice: signals.voiceSignals?.length ?? 0,
      rejection: signals.rejectionSignals?.length ?? 0,
      communicationStyle: !!signals.communicationStyle,
      brandVoice: !!signals.brandVoice,
    },
  });
}
