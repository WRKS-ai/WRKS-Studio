import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";

// POST /api/agent/sweep-sessions
//
// Runs on a schedule (Vercel Cron, see vercel.json) to:
//   1. Mark voice_sessions as ended where the last transcript turn
//      is older than IDLE_MINUTES.
//   2. Kick off signal extraction for any ended sessions that haven't
//      been processed yet.
//
// Authentication: Vercel cron requests carry an `Authorization`
// header derived from CRON_SECRET. Manual calls need
// WRKS_AGENT_LLM_SECRET as a bearer token (the shared secret).
//
// Both are accepted — the cron secret is set by Vercel automatically;
// the agent secret lets you trigger sweeps manually from anywhere.

export const runtime = "nodejs";
export const maxDuration = 60;

const IDLE_MINUTES = 5;

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  const cutoff = new Date(Date.now() - IDLE_MINUTES * 60 * 1000).toISOString();

  // ── 1. End idle sessions ──
  // Selection: still open, started before cutoff. We check the
  // last-turn timestamp in transcript[-1].ts where available; for
  // sessions with no transcript yet we use started_at as a proxy.
  const { data: openSessions, error: openErr } = await supabase
    .from("voice_sessions")
    .select("id, transcript, started_at")
    .is("ended_at", null);
  if (openErr) {
    console.error("[sweep] open lookup failed:", openErr);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const toEnd: string[] = [];
  for (const s of openSessions ?? []) {
    const turns = Array.isArray(s.transcript)
      ? (s.transcript as Array<{ ts?: string }>)
      : [];
    const lastTs = turns.length > 0 ? turns[turns.length - 1]?.ts : undefined;
    const benchmark = lastTs ?? s.started_at;
    if (benchmark && benchmark < cutoff) toEnd.push(s.id);
  }

  let ended = 0;
  if (toEnd.length > 0) {
    const { error: endErr } = await supabase
      .from("voice_sessions")
      .update({ ended_at: new Date().toISOString() })
      .in("id", toEnd);
    if (endErr) {
      console.error("[sweep] end update failed:", endErr);
    } else {
      ended = toEnd.length;
    }
  }

  // ── 2. Trigger extraction + reflection for ended sessions ──
  // Two independent Claude passes per session:
  //   - extract-signals: pulls semantic/preference signals into
  //     memory_entries (Phase 8).
  //   - reflect: updates delta_playbook with ADD/UPDATE/DELETE ops
  //     against the agent's evolving rule set (Phase 6a).
  // Each is gated by its own flag (meta.extracted, meta.reflected)
  // so re-firing one without the other is safe.
  const { data: pending, error: pendingErr } = await supabase
    .from("voice_sessions")
    .select("id, meta")
    .not("ended_at", "is", null)
    .limit(50);
  if (pendingErr) {
    console.error("[sweep] pending lookup failed:", pendingErr);
  }

  const unextracted = (pending ?? []).filter((s) => {
    const meta = (s.meta ?? {}) as Record<string, unknown>;
    return meta.extracted !== true;
  });
  const unreflected = (pending ?? []).filter((s) => {
    const meta = (s.meta ?? {}) as Record<string, unknown>;
    return meta.reflected !== true;
  });

  const sharedSecret = process.env.WRKS_AGENT_LLM_SECRET;
  const baseUrl =
    process.env.VERCEL_URL?.startsWith("http")
      ? process.env.VERCEL_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

  let queuedExtract = 0;
  let queuedReflect = 0;
  if (sharedSecret) {
    const extractCalls = unextracted.map(async (s) => {
      const res = await fetch(
        `${baseUrl}/api/agent/extract-signals/${s.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sharedSecret}`,
          },
        },
      );
      if (!res.ok) {
        console.error(`[sweep] extract for ${s.id} returned ${res.status}`);
        return;
      }
      queuedExtract += 1;
    });
    const reflectCalls = unreflected.map(async (s) => {
      const res = await fetch(`${baseUrl}/api/agent/reflect/${s.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sharedSecret}`,
        },
      });
      if (!res.ok) {
        console.error(`[sweep] reflect for ${s.id} returned ${res.status}`);
        return;
      }
      queuedReflect += 1;
    });
    await Promise.allSettled([...extractCalls, ...reflectCalls]);
  } else {
    console.warn(
      "[sweep] WRKS_AGENT_LLM_SECRET missing — extraction + reflection skipped",
    );
  }

  return NextResponse.json({
    ok: true,
    ended,
    queued_extract: queuedExtract,
    queued_reflect: queuedReflect,
    pending_extract_total: unextracted.length,
    pending_reflect_total: unreflected.length,
  });
}

function isAuthorized(req: Request): boolean {
  // Accept three auth paths:
  //   1. Vercel Cron — the platform injects `x-vercel-cron: 1` on
  //      every scheduled invocation. This is an internal header and
  //      can't be set by external clients, so it's the most reliable
  //      proof of cron authenticity. No env config required.
  //   2. CRON_SECRET — if the user configures a CRON_SECRET env var
  //      on Vercel, the platform also sends `Authorization: Bearer <secret>`
  //      on cron calls. Backward-compatible with the original setup.
  //   3. WRKS_AGENT_LLM_SECRET — shared secret for manual / scripted
  //      sweeps (curl, postman, etc.) so we don't need cron config to
  //      kick a sweep off-cycle.
  if (req.headers.get("x-vercel-cron") === "1") return true;

  const cronSecret = process.env.CRON_SECRET;
  const agentSecret = process.env.WRKS_AGENT_LLM_SECRET;
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : header.trim();
  if (cronSecret && token === cronSecret) return true;
  if (agentSecret && token === agentSecret) return true;
  return false;
}
