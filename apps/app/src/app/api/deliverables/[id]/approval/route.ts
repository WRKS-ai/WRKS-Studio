import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MEMORY_KIND,
  MEMORY_SOURCE,
  createServiceSupabaseClient,
  writeMemoryEntry,
} from "@/lib/supabase";
import type { Json } from "@/lib/supabase/types";

// POST /api/deliverables/[id]/approval
//
// The §3.2 approval step in code form. The user (via the studio UI or
// the voice agent) tells us they want to approve, revise, or reject
// the deliverable. We:
//
//   1. Verify the deliverable belongs to this user's active profile
//      (defense in depth on top of RLS)
//   2. Insert an approvals row
//   3. Update the deliverable's status
//        approved → 'approved'
//        rejected → 'rejected'
//        revised  → 'staging'    (the orchestrator will write a new
//                                 deliverable with revision_of set)
//   4. Write a memory_entry capturing the signal
//        approved → kind='approved_output', weight=1.3
//        rejected → kind='rejection_signal' with the reason, weight=1.1
//        revised  → kind='rejection_signal' with the reason, weight=1.0
//
// The memory entries flow into composeMemoryContext on the next voice
// turn so the orchestrator knows what landed and what didn't.

export const runtime = "nodejs";

const Body = z.object({
  action: z.enum(["approved", "revised", "rejected"]),
  reason: z.string().trim().max(2000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: deliverableId } = await context.params;
  if (!deliverableId) {
    return NextResponse.json(
      { error: "Missing deliverable id" },
      { status: 400 },
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Invalid body";
    return NextResponse.json(
      { error: "Invalid approval payload", detail },
      { status: 400 },
    );
  }

  // For approvals on revised/rejected, the reason is recommended but
  // not strictly required. Default to an empty string for memory
  // consistency.
  const reason = body.reason ?? null;

  const supabase = createServiceSupabaseClient();

  // ── Ownership check (defense in depth — RLS would already deny,
  //    but service-role bypasses RLS so we verify here) ──
  const { data: deliv, error: lookupErr } = await supabase
    .from("deliverables")
    .select(
      "id, business_profile_id, kind, content, status, business_profiles!inner(user_id)",
    )
    .eq("id", deliverableId)
    .single();

  if (lookupErr) {
    if (lookupErr.code === "PGRST116") {
      return NextResponse.json(
        { error: "Deliverable not found" },
        { status: 404 },
      );
    }
    console.error("[api/deliverables/approval] lookup failed:", lookupErr);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const ownerId = (
    deliv.business_profiles as unknown as { user_id: string } | null
  )?.user_id;
  if (ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 1. Insert approvals row ──
  const { error: approvalErr } = await supabase.from("approvals").insert({
    deliverable_id: deliverableId,
    business_profile_id: deliv.business_profile_id,
    action: body.action,
    reason,
  });
  if (approvalErr) {
    console.error("[api/deliverables/approval] approval insert failed:", approvalErr);
    return NextResponse.json(
      { error: "Approval write failed" },
      { status: 500 },
    );
  }

  // ── 2. Update deliverable status ──
  const nextStatus =
    body.action === "approved"
      ? "approved"
      : body.action === "rejected"
        ? "rejected"
        : "staging";

  const { error: statusErr } = await supabase
    .from("deliverables")
    .update({ status: nextStatus })
    .eq("id", deliverableId);
  if (statusErr) {
    console.error("[api/deliverables/approval] status update failed:", statusErr);
    // Approval is recorded; status update is recoverable. Continue.
  }

  // ── 3. Write memory signal ──
  // The content shape stays small — just enough for the prompt
  // renderer to surface the signal without bloating tokens.
  const memoryContent: Json = {
    deliverable_id: deliverableId,
    deliverable_kind: deliv.kind,
    action: body.action,
    reason: reason ?? undefined,
    deliverable_summary: extractDeliverableSummary(deliv.content),
  };

  try {
    if (body.action === "approved") {
      await writeMemoryEntry(supabase, {
        businessProfileId: deliv.business_profile_id,
        kind: MEMORY_KIND.approvedOutput,
        content: memoryContent,
        source: MEMORY_SOURCE.approval,
        weight: 1.3,
      });
    } else {
      await writeMemoryEntry(supabase, {
        businessProfileId: deliv.business_profile_id,
        kind: MEMORY_KIND.rejectionSignal,
        content: memoryContent,
        source: MEMORY_SOURCE.approval,
        weight: body.action === "rejected" ? 1.1 : 1.0,
      });
    }
  } catch (err) {
    console.error("[api/deliverables/approval] memory write failed:", err);
    // Approval was recorded; memory write failure is recoverable
    // — the entry can be backfilled by a follow-up job. Don't fail
    // the user's request on this.
  }

  return NextResponse.json({
    ok: true,
    action: body.action,
    status: nextStatus,
  });
}

function extractDeliverableSummary(content: Json): string {
  // Same heuristic as compose.ts — pull a representative short string
  // out of arbitrary deliverable shapes so the prompt has a hint of
  // WHICH deliverable the signal is about.
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return "";
  }
  const c = content as Record<string, Json>;
  const candidate =
    (typeof c.headline === "string" && c.headline) ||
    (typeof c.title === "string" && c.title) ||
    (typeof c.text === "string" && c.text) ||
    (typeof c.body === "string" && c.body) ||
    "";
  return String(candidate).slice(0, 200);
}
