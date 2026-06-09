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

  // ── 2. Trigger extraction for ended-but-unextracted sessions ──
  // We don't await every Claude call — fire them in parallel and let
  // the cron move on. Each invocation marks its session as extracted
  // so re-firing is a no-op.
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

  const sharedSecret = process.env.WRKS_AGENT_LLM_SECRET;
  const baseUrl =
    process.env.VERCEL_URL?.startsWith("http")
      ? process.env.VERCEL_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

  let queued = 0;
  if (sharedSecret) {
    await Promise.allSettled(
      unextracted.map(async (s) => {
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
          console.error(
            `[sweep] extract for ${s.id} returned ${res.status}`,
          );
          return;
        }
        queued += 1;
      }),
    );
  } else {
    console.warn("[sweep] WRKS_AGENT_LLM_SECRET missing — extraction skipped");
  }

  return NextResponse.json({
    ok: true,
    ended,
    queued,
    pending_total: unextracted.length,
  });
}

function isAuthorized(req: Request): boolean {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` if set
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
