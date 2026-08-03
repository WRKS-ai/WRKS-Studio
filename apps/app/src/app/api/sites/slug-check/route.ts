import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isSlugTaken, getSiteBySlug } from "@/lib/published-sites/store";
import { validateSlug } from "@/lib/published-sites/slugs";

// Live slug-availability check for the Publish modal.
//
// GET /api/sites/slug-check?slug=xyz
// Returns { available: boolean, reason?: string }
// - available: false if invalid format, reserved, or taken by another user
// - "taken by the current user" counts as available (that's the republish
//   path — same user overwriting their own slug)

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ available: false, reason: "Not signed in." }, { status: 401 });
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get("slug") ?? "";
  const slug = raw.trim().toLowerCase();

  const reason = validateSlug(slug);
  if (reason) {
    return NextResponse.json({ available: false, reason });
  }

  const taken = await isSlugTaken(slug);
  if (taken) {
    const owner = await getSiteBySlug(slug);
    if (owner && owner.userId === userId) {
      return NextResponse.json({ available: true, mine: true });
    }
    return NextResponse.json({ available: false, reason: "That address is taken." });
  }

  return NextResponse.json({ available: true });
}
