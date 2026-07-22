import { getReadyJobHtml } from "@/lib/site-generation/job-store";

// Public HTML renderer for v3 generated sites.
//
// Serves the assembled HTML doc stored in sites_generation_jobs.html
// with Content-Type text/html so the studio canvas iframe (or any
// share link) renders it as a live document.
//
// Unauthenticated intentionally — jobId is a UUID (unlisted-YouTube
// pattern). Ready jobs expire after 6h per the table's expires_at.
//
// Returns 404 if:
//   - Job doesn't exist
//   - Job is still pending (no html yet)
//   - Job expired

export const runtime = "nodejs";
// Small cache — if the same iframe reloads, don't hammer Postgres.
// Value only matters for the duration of a session; jobs are immutable
// once ready.
export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!isUuid(jobId)) {
    return new Response(notFoundHtml("Invalid job id"), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const html = await getReadyJobHtml(jobId);
  if (!html) {
    return new Response(notFoundHtml("This draft isn't ready yet or has expired."), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Iframe embedding is the whole point — override any global
      // X-Frame-Options DENY that the Next.js middleware might set.
      "x-frame-options": "SAMEORIGIN",
      "cache-control": "public, max-age=60, s-maxage=60",
    },
  });
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function notFoundHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Not ready</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #0a0a0c; color: rgba(245,240,230,0.7); font-family: -apple-system, ui-sans-serif, system-ui, sans-serif; }
    body { display: grid; place-items: center; padding: 40px; text-align: center; }
    h1 { font-size: 14px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(245,240,230,0.4); margin: 0 0 12px; }
    p { font-size: 16px; line-height: 1.5; max-width: 32ch; margin: 0; }
  </style>
</head>
<body>
  <div>
    <h1>Not ready</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
