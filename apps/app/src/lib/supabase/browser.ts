"use client";

import { useSession } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import type { Database } from "./types";

// Browser-side Supabase client bound to the current Clerk session.
//
// USE FOR: client-side reads on pages that already have an active
// Clerk session (the studio dashboard, profile pages). RLS applies.
//
// We don't memoize across components — each `useBrowserSupabase`
// call returns a memoized client scoped to that component. The
// underlying Clerk session reference is stable, so re-renders don't
// thrash connections.

export function useBrowserSupabase(): SupabaseClient<Database> {
  const { session } = useSession();

  return useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) {
      throw new Error(
        "Supabase env not configured. Missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      );
    }

    return createClient<Database>(url, publishableKey, {
      async accessToken() {
        return (await session?.getToken()) ?? null;
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }, [session]);
}
