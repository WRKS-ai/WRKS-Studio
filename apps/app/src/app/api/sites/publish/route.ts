import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getJob } from "@/lib/site-generation/job-store";
import {
  isSlugTaken,
  publishSite,
  repointSite,
} from "@/lib/published-sites/store";
import { RESERVED_SLUGS, SLUG_REGEX } from "@/lib/published-sites/slugs";

// Publish a generated site to {slug}.wrksstudio.com.
//
// Body: { jobId, slug, brandName?, title? }
// - jobId must belong to the caller and have status=ready.
// - slug must match DNS-safe format, not be reserved, and not be taken
//   by another user.
// - If the caller ALREADY owns a row with this slug, we repoint it to
//   the new jobId (republish flow) instead of erroring.

export const runtime = "nodejs";

const Body = z.object({
  jobId: z.string().uuid(),
  slug: z.string().trim().min(1).max(63),
  brandName: z.string().trim().max(200).nullish(),
  title: z.string().trim().max(200).nullish(),
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
    return NextResponse.json({ error: "Invalid body", detail }, { status: 400 });
  }

  const slug = body.slug.toLowerCase();

  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: "Invalid slug", detail: "Use lowercase letters, numbers, and hyphens." },
      { status: 400 },
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json(
      { error: "Slug reserved", detail: "That address is reserved." },
      { status: 400 },
    );
  }

  const job = await getJob(body.jobId);
  if (!job || job.status !== "ready") {
    return NextResponse.json({ error: "Job not ready" }, { status: 404 });
  }
  if (job.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Repoint if this user already owns this slug (republish path).
  const repointed = await repointSite({ slug, userId, jobId: body.jobId });
  if (repointed) {
    return NextResponse.json({
      site: repointed,
      url: `https://${slug}.wrksstudio.com`,
    });
  }

  // Fresh publish — first check global uniqueness.
  if (await isSlugTaken(slug)) {
    return NextResponse.json(
      { error: "Slug taken", detail: "That address is taken." },
      { status: 409 },
    );
  }

  try {
    const site = await publishSite({
      slug,
      userId,
      jobId: body.jobId,
      brandName: body.brandName ?? job.brand.brandName ?? null,
      title: body.title ?? null,
    });
    return NextResponse.json({
      site,
      url: `https://${slug}.wrksstudio.com`,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Publish failed", detail },
      { status: 500 },
    );
  }
}
