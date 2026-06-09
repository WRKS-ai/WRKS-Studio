import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Server-side Supabase client bound to the current Clerk session.
//
// Why this exists: when the user calls one of our API routes, we want
// reads/writes to flow through RLS — the same way browser-side reads
// would. The client injects the Clerk session JWT into every request
// so Supabase can resolve auth.jwt()->>'sub' and the RLS policies
// fire correctly.
//
// USE FOR: API routes that act ON BEHALF OF the user. Inserting their
// business_profile, reading their memory, writing their approvals.
//
// DO NOT USE FOR: trusted server jobs that need to bypass RLS
// (background ingest, system writes). Use createServiceClient instead.
//
// Requires Clerk wired as a Supabase third-party auth provider — see
// Phase 1f in CLAUDE.md / the migration notes.

export async function createServerSupabaseClient(): Promise<
  SupabaseClient<Database>
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Supabase env not configured. Missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient<Database>(url, publishableKey, {
    async accessToken() {
      const { getToken } = await auth();
      // null when the user is unauthenticated — Supabase will treat
      // the request as anonymous and RLS will deny anything tenant-scoped.
      const token = await getToken();
      return token ?? null;
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
