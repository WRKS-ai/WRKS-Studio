import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert } from "./types";

// Typed wrappers for the delta_playbook — the agent's procedural-
// memory layer. Each row is a terse evolving rule about the user /
// business, with helpful/harmful counters and a derived confidence.
//
// The reflection pass (P6a) writes to this table after every session.
// The composer reads it on every conversation start and injects the
// top-N rules into the system prompt so the agent walks in already
// knowing the user's taste.

export const DELTA_KIND = {
  /** A taste call — what the user prefers stylistically. */
  preference: "preference",
  /** A recurring behavior — what the user usually does. */
  pattern: "pattern",
  /** Something the user has rejected and shouldn't be repeated. */
  avoid: "avoid",
  /** A stable factual claim about the user or their business. */
  fact: "fact",
} as const;

export type DeltaKind = (typeof DELTA_KIND)[keyof typeof DELTA_KIND];

export type DeltaRow = Tables<"delta_playbook">;

/* ============================================================
 * Read — fetch the top-N deltas for a profile, sorted by
 * confidence × recency. Used by composeMemoryContext.
 * ============================================================ */

export async function fetchTopDeltas(
  supabase: SupabaseClient<Database>,
  businessProfileId: string,
  limit = 30,
): Promise<DeltaRow[]> {
  const { data, error } = await supabase
    .from("delta_playbook")
    .select("*")
    .eq("business_profile_id", businessProfileId)
    .order("confidence", { ascending: false })
    .order("last_used_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[supabase/playbook] fetchTopDeltas failed:", error);
    return [];
  }
  return data ?? [];
}

/* ============================================================
 * Confidence — Wilson lower bound of a Bernoulli proportion.
 * Single-tail 95% CI.
 *
 *   helpful_count is "successes", helpful + harmful is "trials".
 *   This bakes in sample-size — a delta with 10 helpful / 0 harmful
 *   beats one with 1 helpful / 0 harmful even though the raw ratio
 *   is the same. New deltas start at the 0.5 default; the reflection
 *   pass recomputes on every change.
 * ============================================================ */

const WILSON_Z = 1.96; // 95% confidence

export function deltaConfidence(helpful: number, harmful: number): number {
  const n = helpful + harmful;
  if (n === 0) return 0.5; // no signal yet
  const z = WILSON_Z;
  const phat = helpful / n;
  const denominator = 1 + (z * z) / n;
  const center = phat + (z * z) / (2 * n);
  const margin = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);
  const lower = (center - margin) / denominator;
  return Math.max(0, Math.min(1, lower));
}

/* ============================================================
 * Write operations — the reflection pass calls these per session.
 *
 * Mirrors Mem0's update vocabulary:
 *   ADD    — brand-new delta
 *   UPDATE — bump helpful or harmful, optionally rewrite text
 *   DELETE — contradicted / obsolete delta
 *   NOOP   — no-op (not represented in code, just the absence of
 *            a write)
 * ============================================================ */

export type DeltaAddArgs = {
  businessProfileId: string;
  text: string;
  kind: DeltaKind;
  /** Initial helpful count — usually 1 since the delta just paid off this session. */
  helpfulCount?: number;
};

export async function addDelta(
  supabase: SupabaseClient<Database>,
  args: DeltaAddArgs,
): Promise<DeltaRow | null> {
  const helpful = args.helpfulCount ?? 1;
  const harmful = 0;
  const row: TablesInsert<"delta_playbook"> = {
    business_profile_id: args.businessProfileId,
    text: args.text.trim(),
    kind: args.kind,
    helpful_count: helpful,
    harmful_count: harmful,
    confidence: deltaConfidence(helpful, harmful),
    last_used_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("delta_playbook")
    .insert(row)
    .select("*")
    .single();
  if (error) {
    console.error("[supabase/playbook] addDelta failed:", error);
    return null;
  }
  return data;
}

export type DeltaUpdateArgs = {
  deltaId: string;
  /** +1 / +N to helpful counter. */
  helpfulDelta?: number;
  /** +1 / +N to harmful counter. */
  harmfulDelta?: number;
  /** Optional rewrite of the rule text — used when the reflection
   *  pass decides the existing rule needs sharpening. */
  text?: string;
  /** Touch last_used_at? Defaults to true. */
  touch?: boolean;
};

export async function updateDelta(
  supabase: SupabaseClient<Database>,
  args: DeltaUpdateArgs,
): Promise<DeltaRow | null> {
  // Fetch current so we can recompute confidence and add to the counters.
  const { data: current, error: fetchErr } = await supabase
    .from("delta_playbook")
    .select("*")
    .eq("id", args.deltaId)
    .single();
  if (fetchErr || !current) {
    console.error("[supabase/playbook] updateDelta lookup failed:", fetchErr);
    return null;
  }
  const helpful = current.helpful_count + (args.helpfulDelta ?? 0);
  const harmful = current.harmful_count + (args.harmfulDelta ?? 0);
  const next: Partial<TablesInsert<"delta_playbook">> = {
    helpful_count: helpful,
    harmful_count: harmful,
    confidence: deltaConfidence(helpful, harmful),
  };
  if (args.text && args.text.trim()) next.text = args.text.trim();
  if (args.touch !== false) next.last_used_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("delta_playbook")
    .update(next)
    .eq("id", args.deltaId)
    .select("*")
    .single();
  if (error) {
    console.error("[supabase/playbook] updateDelta failed:", error);
    return null;
  }
  return data;
}

export async function deleteDelta(
  supabase: SupabaseClient<Database>,
  deltaId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("delta_playbook")
    .delete()
    .eq("id", deltaId);
  if (error) {
    console.error("[supabase/playbook] deleteDelta failed:", error);
    return false;
  }
  return true;
}
