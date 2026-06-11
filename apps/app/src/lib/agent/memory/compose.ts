import type { SupabaseClient } from "@supabase/supabase-js";
import { MEMORY_KIND } from "@/lib/supabase/memory";
import { fetchTopDeltas } from "@/lib/supabase/playbook";
import type { BusinessProfile } from "@/lib/supabase/profile";
import type { Database, Json } from "@/lib/supabase/types";

// Memory compose — fetches a structured snapshot of everything the
// agent should know about the current business profile, then renders
// it into a prompt block ready to inject into Claude's system prompt.
//
// Architecture (per 2026 hybrid memory pattern):
//   • SEMANTIC memory (always-inject): facts about the business
//     and the owner's voice that should flavor every output.
//   • EPISODIC memory (always-inject most recent, vector-recall the
//     rest): recent approved deliverables + rejections so the agent
//     knows what's been built and what didn't land.
//
// Vector recall (HNSW cosine on memory_entries.embedding) is wired
// for when the embedder lands — for now we deliver the last-N
// approvals and rely on the structured semantic block for context.

export type ComposedMemory = {
  profile: {
    id: string;
    brandName: string | null;
    agentName: string | null;
    voiceId: string | null;
    personalityId: string | null;
    intakeSummary: string | null;
  };
  semantic: {
    businessFundamentals?: string;
    audience?: string;
    differentiator?: string;
    stylePreferences?: string[];
    brandVoice?: string;
    communicationStyle?: string;
  };
  episodic: {
    recentApprovals: Array<{
      kind: string;
      summary: string;
      approvedAt: string;
    }>;
    recentRejections: Array<{
      kind: string;
      reason: string | null;
      rejectedAt: string;
    }>;
  };
  /** Procedural memory — the agent's evolving cheat sheet of rules
   *  it's learned about this user. Populated by the session-end
   *  reflection pass (P6a). Top-N by confidence × recency. */
  playbook: Array<{
    text: string;
    kind: string;
    helpful: number;
    harmful: number;
    confidence: number;
  }>;
};

// Sane defaults — capped so the prompt stays under ~6k tokens.
const DEFAULTS = {
  recentApprovalsLimit: 5,
  recentRejectionsLimit: 5,
  /** Top-N deltas to inject. Each delta ~12-25 tokens; 30 stays
   *  comfortably under the budget alongside semantic + episodic. */
  playbookLimit: 30,
};

// ============================================================
// In-memory cache for composed memory
// ============================================================
// Memory only changes between voice sessions (intake re-submit, wow
// generation, approval flow). Within a single voice session, every
// turn pulls the same data — so caching it server-side cuts 100-300ms
// of Supabase round-trips per turn.
//
// Per-Lambda-instance Map. Each Vercel function instance has its own
// cache; not shared across instances but that's fine — the Lambda
// stays warm for the duration of an active voice session, so
// successive turns from one user usually hit the same instance.
//
// TTL: 60 seconds. Voice sessions are typically 30s-5min, so this
// covers a full session of turns from one user while also picking
// up changes within a minute if the user re-completes intake or a
// deliverable lands.

type CacheEntry = { composed: ComposedMemory; expiresAt: number };
const CACHE_TTL_MS = 60_000;
const memoryCache = new Map<string, CacheEntry>();

function getCached(profileId: string): ComposedMemory | null {
  const entry = memoryCache.get(profileId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(profileId);
    return null;
  }
  return entry.composed;
}

function setCached(profileId: string, composed: ComposedMemory): void {
  memoryCache.set(profileId, {
    composed,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Manually invalidate the cache for a profile. Call this from write
 * paths (approval flow, wow generation) so the next voice turn
 * picks up the fresh state immediately without waiting for TTL.
 */
export function invalidateMemoryCache(profileId: string): void {
  memoryCache.delete(profileId);
}

export async function composeMemoryContext(
  supabase: SupabaseClient<Database>,
  profile: BusinessProfile,
): Promise<ComposedMemory> {
  const cached = getCached(profile.id);
  if (cached) return cached;
  // Parallel fetches: semantic memory + episodic (approvals +
  // rejections) + procedural (delta playbook).
  const [semanticRows, approvedRows, rejectionRows, playbookRows] =
    await Promise.all([
      // current_memory view returns latest entry per (profile, kind)
      supabase
        .from("current_memory")
        .select("kind, content, weight")
        .eq("business_profile_id", profile.id),

      // Recently approved deliverables — episodic anchors
      supabase
        .from("approvals")
        .select(
          "action, created_at, deliverable:deliverable_id(id, kind, content)",
        )
        .eq("business_profile_id", profile.id)
        .eq("action", "approved")
        .order("created_at", { ascending: false })
        .limit(DEFAULTS.recentApprovalsLimit),

      // Recent rejections — signals to avoid
      supabase
        .from("approvals")
        .select(
          "action, reason, created_at, deliverable:deliverable_id(id, kind, content)",
        )
        .eq("business_profile_id", profile.id)
        .in("action", ["rejected", "revised"])
        .order("created_at", { ascending: false })
        .limit(DEFAULTS.recentRejectionsLimit),

      // Top-N evolved rules from the procedural playbook
      fetchTopDeltas(supabase, profile.id, DEFAULTS.playbookLimit),
    ]);

  if (semanticRows.error) {
    console.error("[agent/memory/compose] semantic fetch failed:", semanticRows.error);
  }
  if (approvedRows.error) {
    console.error("[agent/memory/compose] approvals fetch failed:", approvedRows.error);
  }
  if (rejectionRows.error) {
    console.error("[agent/memory/compose] rejections fetch failed:", rejectionRows.error);
  }

  // Index semantic entries by kind for cheap lookup
  const semanticByKind = new Map<string, Json>();
  for (const row of semanticRows.data ?? []) {
    if (row.kind && row.content) semanticByKind.set(row.kind, row.content);
  }

  const composed: ComposedMemory = {
    profile: {
      id: profile.id,
      brandName: profile.brand_name,
      agentName: profile.agent_name,
      voiceId: profile.voice_id,
      personalityId: profile.personality_id,
      intakeSummary: profile.intake_summary,
    },
    semantic: {
      businessFundamentals: extractText(
        semanticByKind.get(MEMORY_KIND.businessFundamentals),
      ),
      audience: extractText(semanticByKind.get(MEMORY_KIND.audience)),
      differentiator: extractText(
        semanticByKind.get(MEMORY_KIND.differentiator),
      ),
      stylePreferences: extractStringArray(
        semanticByKind.get(MEMORY_KIND.stylePreference),
        "references",
      ),
      brandVoice: extractText(semanticByKind.get(MEMORY_KIND.brandVoice)),
      communicationStyle: extractText(
        semanticByKind.get(MEMORY_KIND.communicationStyle),
      ),
    },
    episodic: {
      recentApprovals: (approvedRows.data ?? []).flatMap((row) => {
        const d = row.deliverable as
          | { id: string; kind: string; content: Json }
          | null;
        if (!d) return [];
        return [
          {
            kind: d.kind,
            summary: summarizeDeliverable(d.content),
            approvedAt: row.created_at,
          },
        ];
      }),
      recentRejections: (rejectionRows.data ?? []).flatMap((row) => {
        const d = row.deliverable as { kind: string } | null;
        if (!d) return [];
        return [
          {
            kind: d.kind,
            reason: row.reason,
            rejectedAt: row.created_at,
          },
        ];
      }),
    },
    playbook: playbookRows.map((row) => ({
      text: row.text,
      kind: row.kind,
      helpful: row.helpful_count,
      harmful: row.harmful_count,
      confidence: row.confidence,
    })),
  };

  setCached(profile.id, composed);
  return composed;
}

// ============================================================
// Prompt rendering
// ============================================================
// Turns a ComposedMemory into a prompt block. Format is markdown-ish
// — Claude reads it well and it's debuggable when we log prompts.
// Designed to be ~2k tokens for a freshly-onboarded user, ~6k for
// a heavy user (5 recent approvals + 5 rejections + full semantic).

export function renderMemoryForPrompt(memory: ComposedMemory): string {
  const lines: string[] = [];

  lines.push("═══ BUSINESS MEMORY ═══");
  lines.push("");

  // Profile header
  lines.push("## Profile");
  if (memory.profile.brandName) {
    lines.push(`Brand: ${memory.profile.brandName}`);
  }
  if (memory.profile.agentName) {
    lines.push(`Agent name: ${memory.profile.agentName}`);
  }
  lines.push("");

  // Semantic — business facts
  const sem = memory.semantic;
  if (sem.businessFundamentals || sem.audience || sem.differentiator) {
    lines.push("## What the business is");
    if (sem.businessFundamentals) {
      lines.push(`What they do: ${sem.businessFundamentals}`);
    }
    if (sem.audience) {
      lines.push(`Who it's for: ${sem.audience}`);
    }
    if (sem.differentiator) {
      lines.push(`Their edge: ${sem.differentiator}`);
    }
    lines.push("");
  }

  // Style preferences from references picker
  if (sem.stylePreferences && sem.stylePreferences.length > 0) {
    lines.push("## Style references");
    lines.push(
      `User picked: ${sem.stylePreferences.join(", ")}. Lean every output toward this aesthetic + voice.`,
    );
    lines.push("");
  }

  // Brand voice — populated over time by signal extraction
  if (sem.brandVoice) {
    lines.push("## Brand voice");
    lines.push(sem.brandVoice);
    lines.push("");
  }
  if (sem.communicationStyle) {
    lines.push("## How the owner prefers to be spoken to");
    lines.push(sem.communicationStyle);
    lines.push("");
  }

  // Procedural — the evolving cheat sheet. Listed near the top
  // of the prompt because these rules should bias every reply.
  // Group by kind so the agent sees preferences / patterns /
  // avoid-list separately rather than as an undifferentiated blob.
  if (memory.playbook.length > 0) {
    const byKind: Record<string, string[]> = {
      preference: [],
      pattern: [],
      avoid: [],
      fact: [],
    };
    for (const d of memory.playbook) {
      const bucket = byKind[d.kind] ?? byKind.preference;
      bucket.push(d.text);
    }
    lines.push("## What you've learned about this user");
    lines.push(
      "(Each rule below is something you figured out across past sessions. Apply them by default; only deviate if the user clearly signals otherwise.)",
    );
    if (byKind.preference.length > 0) {
      lines.push("");
      lines.push("Preferences:");
      for (const t of byKind.preference) lines.push(`• ${t}`);
    }
    if (byKind.pattern.length > 0) {
      lines.push("");
      lines.push("Patterns you've noticed:");
      for (const t of byKind.pattern) lines.push(`• ${t}`);
    }
    if (byKind.avoid.length > 0) {
      lines.push("");
      lines.push("Avoid:");
      for (const t of byKind.avoid) lines.push(`• ${t}`);
    }
    if (byKind.fact.length > 0) {
      lines.push("");
      lines.push("Facts about them:");
      for (const t of byKind.fact) lines.push(`• ${t}`);
    }
    lines.push("");
  }

  // Episodic — what's been built
  if (memory.episodic.recentApprovals.length > 0) {
    lines.push("## Recently approved (what the brand sounds like in practice)");
    for (const item of memory.episodic.recentApprovals) {
      lines.push(`• ${item.kind}: ${item.summary}`);
    }
    lines.push("");
  }
  if (memory.episodic.recentRejections.length > 0) {
    lines.push("## Recently rejected / revised (avoid these directions)");
    for (const item of memory.episodic.recentRejections) {
      const reason = item.reason ? ` — reason: ${item.reason}` : "";
      lines.push(`• ${item.kind}${reason}`);
    }
    lines.push("");
  }

  // Fallback when memory is brand new
  if (
    !sem.businessFundamentals &&
    !sem.audience &&
    !sem.differentiator &&
    memory.episodic.recentApprovals.length === 0 &&
    memory.playbook.length === 0
  ) {
    if (memory.profile.intakeSummary) {
      lines.push("## Intake summary");
      lines.push(memory.profile.intakeSummary);
    } else {
      lines.push(
        "(No memory yet — this user is mid-onboarding. Treat them like a first conversation.)",
      );
    }
  }

  lines.push("═══ END MEMORY ═══");
  return lines.join("\n");
}

// ============================================================
// helpers
// ============================================================

function extractText(value: Json | undefined): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const text = (value as Record<string, Json>).text;
  if (typeof text === "string" && text.trim()) return text.trim();
  return undefined;
}

function extractStringArray(
  value: Json | undefined,
  key: string,
): string[] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const arr = (value as Record<string, Json>)[key];
  if (!Array.isArray(arr)) return undefined;
  const strings = arr.filter((x): x is string => typeof x === "string");
  return strings.length > 0 ? strings : undefined;
}

function summarizeDeliverable(content: Json): string {
  // Pull a representative short string out of arbitrary deliverable
  // shapes. Specific deliverable schemas can register richer summaries
  // later — for now we look for common fields.
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return "[no preview]";
  }
  const c = content as Record<string, Json>;
  const candidate =
    (typeof c.headline === "string" && c.headline) ||
    (typeof c.title === "string" && c.title) ||
    (typeof c.text === "string" && c.text) ||
    (typeof c.body === "string" && c.body) ||
    "";
  if (candidate) return String(candidate).slice(0, 180);
  return "[no preview]";
}
