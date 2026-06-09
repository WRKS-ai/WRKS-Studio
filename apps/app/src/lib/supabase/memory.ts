import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, Tables, TablesInsert } from "./types";

// Typed wrappers for memory writes. Centralizes the `kind` and
// `source` taxonomies so we don't end up with `style_pref` vs
// `style_preference` vs `stylePreference` scattered across files.
//
// New kinds get added here first. The schema accepts any text so
// migrations aren't required, but every reference should funnel
// through these constants.

export const MEMORY_KIND = {
  // Semantic facts about the business (always-inject):
  businessFundamentals: "business_fundamentals",
  audience: "audience",
  differentiator: "differentiator",
  brandVoice: "brand_voice",
  communicationStyle: "communication_style",
  // Style / aesthetic preferences (always-inject):
  stylePreference: "style_preference",
  // Episodic / signal entries (vector-retrieved on demand):
  approvedOutput: "approved_output",
  sampleOutput: "sample_output",
  voiceSignal: "voice_signal",
  rejectionSignal: "rejection_signal",
} as const;

export type MemoryKind = (typeof MEMORY_KIND)[keyof typeof MEMORY_KIND];

export const MEMORY_SOURCE = {
  intake: "intake",
  referencePicker: "reference_picker",
  wowGeneration: "wow_generation",
  approval: "approval",
  voiceExtraction: "voice_extraction",
  manual: "manual",
} as const;

export type MemorySource = (typeof MEMORY_SOURCE)[keyof typeof MEMORY_SOURCE];

export type MemoryEntry = Tables<"memory_entries">;

type WriteMemoryArgs = {
  businessProfileId: string;
  kind: MemoryKind;
  content: Json;
  source: MemorySource;
  /** Defaults to 1.0. Use higher for canonical facts, lower for noisy signals. */
  weight?: number;
};

export async function writeMemoryEntry(
  supabase: SupabaseClient<Database>,
  args: WriteMemoryArgs,
): Promise<MemoryEntry> {
  const row: TablesInsert<"memory_entries"> = {
    business_profile_id: args.businessProfileId,
    kind: args.kind,
    content: args.content,
    source: args.source,
    weight: args.weight ?? 1.0,
  };
  const { data, error } = await supabase
    .from("memory_entries")
    .insert(row)
    .select("*")
    .single();
  if (error) {
    console.error("[supabase/memory] writeMemoryEntry failed:", error);
    throw error;
  }
  return data;
}

export async function writeMemoryEntries(
  supabase: SupabaseClient<Database>,
  args: WriteMemoryArgs[],
): Promise<MemoryEntry[]> {
  if (args.length === 0) return [];
  const rows: TablesInsert<"memory_entries">[] = args.map((a) => ({
    business_profile_id: a.businessProfileId,
    kind: a.kind,
    content: a.content,
    source: a.source,
    weight: a.weight ?? 1.0,
  }));
  const { data, error } = await supabase
    .from("memory_entries")
    .insert(rows)
    .select("*");
  if (error) {
    console.error("[supabase/memory] writeMemoryEntries failed:", error);
    throw error;
  }
  return data;
}
