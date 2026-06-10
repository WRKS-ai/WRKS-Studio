import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidateMemoryCache } from "@/lib/agent/memory/compose";
import { getPalette } from "@/lib/palettes";
import {
  MEMORY_KIND,
  MEMORY_SOURCE,
  createServiceSupabaseClient,
  writeMemoryEntries,
} from "@/lib/supabase";
import type { Json, TablesInsert } from "@/lib/supabase/types";

// POST /api/onboarding/references
//
// Persists the user's "Set the look" choice — theme (light/dark) and
// palette (one of 8) — to memory. Replaces any prior reference-picker
// entries on the profile so re-submission is clean.
//
// Skip path: client can pass { theme: null, paletteId: null } to
// indicate the user opted for the default. We still clear prior
// entries so the wow generator falls back cleanly.

export const runtime = "nodejs";

const Body = z.object({
  theme: z.enum(["light", "dark"]).nullable(),
  paletteId: z.string().trim().min(1).max(64).nullable(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Invalid body";
    return NextResponse.json(
      { error: "Invalid references payload", detail },
      { status: 400 },
    );
  }

  const supabase = createServiceSupabaseClient();

  // Active profile lookup — must exist (intake creates it).
  const { data: profile, error: lookupErr } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (lookupErr) {
    console.error("[api/onboarding/references] lookup failed:", lookupErr);
    return NextResponse.json(
      { error: "Profile lookup failed" },
      { status: 500 },
    );
  }
  if (!profile) {
    return NextResponse.json(
      { error: "No active profile. Complete intake first." },
      { status: 409 },
    );
  }

  // Drop prior reference-picker entries so re-submissions don't pile
  // up. Anything sourced from approvals or voice extraction survives.
  const { error: clearErr } = await supabase
    .from("memory_entries")
    .delete()
    .eq("business_profile_id", profile.id)
    .eq("source", MEMORY_SOURCE.referencePicker);
  if (clearErr) {
    console.error("[api/onboarding/references] clear stale failed:", clearErr);
  }

  // Validate palette + compose the memory entries
  const writes: Array<Parameters<typeof writeMemoryEntries>[1][number]> = [];

  if (body.theme) {
    writes.push({
      businessProfileId: profile.id,
      kind: MEMORY_KIND.communicationStyle, // reused — theme is part of how the brand "speaks" visually
      content: { theme: body.theme } as Json,
      source: MEMORY_SOURCE.referencePicker,
      weight: 1.2,
    });
  }

  if (body.paletteId) {
    const palette = getPalette(body.paletteId);
    if (!palette) {
      return NextResponse.json(
        { error: `Unknown palette id: ${body.paletteId}` },
        { status: 400 },
      );
    }
    writes.push({
      businessProfileId: profile.id,
      kind: MEMORY_KIND.stylePreference,
      content: {
        paletteId: palette.id,
        paletteName: palette.name,
        tagline: palette.tagline,
        accent: palette.accent,
        supporting: palette.supporting,
        light: palette.light,
        dark: palette.dark,
      } as Json,
      source: MEMORY_SOURCE.referencePicker,
      weight: 1.3,
    });
  }

  if (writes.length > 0) {
    try {
      await writeMemoryEntries(supabase, writes);
    } catch (err) {
      console.error("[api/onboarding/references] memory write failed:", err);
      return NextResponse.json(
        { error: "Memory write failed" },
        { status: 500 },
      );
    }
  }

  invalidateMemoryCache(profile.id);

  return NextResponse.json({
    ok: true,
    theme: body.theme,
    paletteId: body.paletteId,
  });
}

// Suppress unused import warning when TablesInsert isn't directly used
// in the body of the file (kept for compile-time payload shaping).
void (null as unknown as TablesInsert<"memory_entries"> | null);
