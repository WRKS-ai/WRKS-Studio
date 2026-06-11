import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidateMemoryCache } from "@/lib/agent/memory/compose";
import {
  DELTA_KIND,
  addDelta,
  createServiceSupabaseClient,
  deleteDelta,
  fetchTopDeltas,
  updateDelta,
} from "@/lib/supabase";
import type { Json } from "@/lib/supabase/types";

// POST /api/agent/reflect/[sessionId]
//
// The session-end reflection pass — the "Curator" in the
// Generator / Reflector / Curator loop. After a voice session ends,
// this route reads the transcript + the current delta_playbook, then
// asks Claude (Haiku — cheap, fast, good enough) to propose a list of
// ADD / UPDATE / DELETE / NOOP operations against the playbook.
//
// Idempotency: voice_sessions.meta.reflected = true gates re-firing.
// The signal extractor uses the parallel meta.extracted flag; these
// two are independent because reflection can usefully re-run if the
// playbook structure changes, but extraction is a one-shot.
//
// Auth: shared secret in Authorization header — same WRKS_AGENT_LLM_SECRET
// as the extractor + chat endpoint.

export const runtime = "nodejs";
export const maxDuration = 60;

/* ============================================================
 * Op schema — what Claude returns
 * ============================================================ */

const DeltaKindEnum = z.enum([
  DELTA_KIND.preference,
  DELTA_KIND.pattern,
  DELTA_KIND.avoid,
  DELTA_KIND.fact,
]);

const OpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("ADD"),
    text: z
      .string()
      .min(8)
      .max(180)
      .describe(
        "The rule, one terse sentence. Imperative or descriptive — 'user prefers X', 'always defaults to Y', 'avoid Z'.",
      ),
    kind: DeltaKindEnum.describe(
      "preference = taste call; pattern = recurring behavior; avoid = something the user rejected; fact = stable truth.",
    ),
    reason: z
      .string()
      .max(180)
      .describe("One short sentence of evidence from THIS session."),
  }),
  z.object({
    op: z.literal("UPDATE"),
    id: z.string().uuid().describe("Existing delta id to update."),
    helpful_delta: z
      .number()
      .int()
      .min(0)
      .max(5)
      .describe("How many times the existing rule paid off this session."),
    harmful_delta: z
      .number()
      .int()
      .min(0)
      .max(5)
      .describe("How many times the existing rule misled the agent."),
    rewrite_text: z
      .string()
      .min(8)
      .max(180)
      .nullable()
      .describe(
        "If the existing rule needs sharpening, the new text. Null to keep current text.",
      ),
    reason: z.string().max(180).describe("One short sentence of evidence."),
  }),
  z.object({
    op: z.literal("DELETE"),
    id: z.string().uuid().describe("Existing delta id to remove."),
    reason: z
      .string()
      .max(180)
      .describe(
        "Why it's wrong now — usually a contradiction from this session.",
      ),
  }),
]);

const OpsListSchema = z
  .object({
    ops: z
      .array(OpSchema)
      .max(12)
      .describe(
        "Up to 12 operations against the playbook. Most sessions yield 0-3. Empty list (NOOP) is correct when the session was small talk.",
      ),
  })
  .describe("Playbook update ops from this session's reflection.");

/* ============================================================
 * Prompt
 * ============================================================ */

const REFLECTION_PROMPT = `You are the Curator for a voice agent's evolving "playbook" — a list of terse rules it has learned about a small-business owner over time.

Your job: read the latest session transcript and the current playbook, and propose updates. Be SPARING and HIGH-SIGNAL. Most sessions should yield 0-3 ops. A session of small talk is correctly handled with an empty ops list.

WHAT EACH OP MEANS
- ADD — the session revealed a brand-new preference / pattern / fact that no existing rule covers. Write it as one terse imperative or descriptive sentence in the agent's own voice ("user prefers playful copy over corporate", "always defaults to dark mode", "avoid the word 'empower'").
- UPDATE — an existing rule got more evidence (positive or negative). Bump helpful_delta when the rule paid off, harmful_delta when the rule misled. Optionally rewrite_text if the rule needs sharpening to match new evidence.
- DELETE — an existing rule was directly contradicted by the user this session, OR is now clearly wrong.

EVIDENCE STANDARDS
- One strong signal beats three weak ones. If the user gave a one-off opinion, that's weak. If they repeated a preference or rejected something explicitly, that's strong.
- Don't ADD generic rules ("user wants good copy"). Be specific ("user prefers 6-8 word headlines ending in a period").
- Don't UPDATE on weak signals. Skip rather than bump.
- DELETE only on direct contradiction — not on absence of evidence.
- If the agent has fewer than 5 sessions of history, prefer ADD over UPDATE — the playbook is still building.

OUTPUT
Return a JSON list of ops. Empty list is correct when no clear signals exist. Do NOT invent ops to fill space.`;

/* ============================================================
 * Route
 * ============================================================ */

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
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  // ── 2. Load session + idempotency check ──
  const { data: session, error: lookupErr } = await supabase
    .from("voice_sessions")
    .select("id, business_profile_id, transcript, meta, ended_at")
    .eq("id", sessionId)
    .single();
  if (lookupErr) {
    if (lookupErr.code === "PGRST116") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    console.error("[reflect] lookup failed:", lookupErr);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const meta = (session.meta ?? {}) as Record<string, Json>;
  if (meta.reflected === true) {
    return NextResponse.json({ ok: true, skipped: "already-reflected" });
  }

  const transcript = Array.isArray(session.transcript)
    ? (session.transcript as Array<{
        role?: string;
        content?: string;
        ts?: string;
      }>)
    : [];

  // Below ~3 turns there's nothing worth reflecting on. Mark so the
  // sweeper doesn't keep retrying.
  if (transcript.length < 3) {
    await supabase
      .from("voice_sessions")
      .update({
        meta: { ...meta, reflected: true, skipped: "too-short" } as Json,
      })
      .eq("id", sessionId);
    return NextResponse.json({ ok: true, skipped: "too-short" });
  }

  const profileId = session.business_profile_id;

  // ── 3. Current playbook for context ──
  const currentPlaybook = await fetchTopDeltas(supabase, profileId, 50);

  // ── 4. Compose Claude input ──
  const transcriptText = transcript
    .map((t) => `[${t.role ?? "?"}] ${t.content ?? ""}`)
    .join("\n");
  const playbookText =
    currentPlaybook.length === 0
      ? "(empty — no rules yet)"
      : currentPlaybook
          .map(
            (d) =>
              `- id=${d.id} | kind=${d.kind} | helpful=${d.helpful_count} harmful=${d.harmful_count} conf=${d.confidence.toFixed(2)} | "${d.text}"`,
          )
          .join("\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: ANTHROPIC_API_KEY not set." },
      { status: 503 },
    );
  }
  const client = new Anthropic({ apiKey });

  // ── 5. Claude reflection pass ──
  let ops: z.infer<typeof OpsListSchema>;
  try {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: REFLECTION_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `CURRENT PLAYBOOK:
${playbookText}

LATEST SESSION TRANSCRIPT:
${transcriptText}

Return the JSON ops list.`,
        },
      ],
      output_config: { format: zodOutputFormat(OpsListSchema) },
    });
    ops = response.parsed_output ?? { ops: [] };
  } catch (err) {
    console.error("[reflect] Claude failed:", err);
    return NextResponse.json({ error: "Reflection failed" }, { status: 502 });
  }

  // ── 6. Apply ops ──
  const applied = { added: 0, updated: 0, deleted: 0, errors: 0 };
  for (const op of ops.ops) {
    try {
      if (op.op === "ADD") {
        const row = await addDelta(supabase, {
          businessProfileId: profileId,
          text: op.text,
          kind: op.kind,
          helpfulCount: 1,
        });
        if (row) applied.added += 1;
        else applied.errors += 1;
      } else if (op.op === "UPDATE") {
        const row = await updateDelta(supabase, {
          deltaId: op.id,
          helpfulDelta: op.helpful_delta,
          harmfulDelta: op.harmful_delta,
          text: op.rewrite_text ?? undefined,
        });
        if (row) applied.updated += 1;
        else applied.errors += 1;
      } else if (op.op === "DELETE") {
        const ok = await deleteDelta(supabase, op.id);
        if (ok) applied.deleted += 1;
        else applied.errors += 1;
      }
    } catch (err) {
      console.error("[reflect] op failed:", op, err);
      applied.errors += 1;
    }
  }

  // ── 7. Invalidate composed-memory cache so the next conversation
  //       picks up the new playbook immediately ──
  invalidateMemoryCache(profileId);

  // ── 8. Mark session reflected ──
  const { error: markErr } = await supabase
    .from("voice_sessions")
    .update({
      meta: {
        ...meta,
        reflected: true,
        reflected_at: new Date().toISOString(),
        reflection: applied,
      } as Json,
    })
    .eq("id", sessionId);
  if (markErr) console.error("[reflect] mark reflected failed:", markErr);

  return NextResponse.json({ ok: true, ops_count: ops.ops.length, applied });
}
