import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service-role Supabase client. BYPASSES ROW LEVEL SECURITY.
//
// USE FOR:
//   • Trusted system writes (signal extraction job, background
//     embedding fills, cron-style memory decay).
//   • The custom-LLM endpoint when ElevenLabs hits us — we already
//     verified the user out-of-band via the dynamic variable signed
//     by /api/voice/signed-url; RLS bypass is appropriate here.
//   • Migrations / one-off seeds.
//
// DO NOT USE FOR:
//   • Anything driven by an unauthenticated user request.
//   • Code paths where we WANT RLS to be a safety net.
//
// The key is server-only — NEVER expose it to the browser or to any
// route that could echo it back. The lack of NEXT_PUBLIC_ prefix is
// load-bearing.

let cached: SupabaseClient<Database> | null = null;

export function createServiceSupabaseClient(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase service client not configured. Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      // Identify ourselves in Supabase logs so service-role calls are
      // distinguishable from user calls.
      headers: { "x-wrks-client": "service-role" },
    },
  });

  return cached;
}
