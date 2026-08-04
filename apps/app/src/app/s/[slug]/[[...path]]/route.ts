import { getSiteBySlug } from "@/lib/published-sites/store";
import { getSitePageHtml } from "@/lib/site-generation/job-store";

// Public renderer for wildcard-subdomain published sites (multi-page).
//
// Middleware rewrites {slug}.wrksstudio.com/<path> → /s/{slug}/<path>
// and bypasses Clerk. This optional-catch-all handler matches:
//   /s/{slug}            (empty path)  → home page
//   /s/{slug}/about      (path=[about]) → /about page
//   /s/{slug}/services   → /services page
//   /s/{slug}/contact    → /contact page
//
// The job's pages jsonb column holds the array of {path, html, title}.
// Legacy single-page jobs (pre-Ship-3) fall through to the html column
// via getSitePageHtml — those still serve root only, deeper paths 404.

export const runtime = "nodejs";
export const revalidate = 60;

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; path?: string[] }> },
) {
  const { slug, path } = await params;
  const normalizedSlug = slug.toLowerCase();
  const normalizedPath = "/" + (path?.join("/") ?? "");

  if (!SLUG_RE.test(normalizedSlug)) {
    return htmlResponse(notFoundHtml("This address doesn't look right."), 404);
  }

  const site = await getSiteBySlug(normalizedSlug);
  if (!site) {
    return htmlResponse(notFoundHtml("No site published at this address yet."), 404);
  }

  const html = await getSitePageHtml(site.jobId, normalizedPath);
  if (!html) {
    const message =
      normalizedPath === "/"
        ? "This site's content is unavailable."
        : `The page ${normalizedPath} doesn't exist on this site.`;
    return htmlResponse(notFoundHtml(message), 404);
  }

  return htmlResponse(html, 200, {
    "cache-control": "public, max-age=60, s-maxage=300",
  });
}

function htmlResponse(
  body: string,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function notFoundHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not found</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #0a0a0f; color: rgba(245,240,230,0.75); font-family: -apple-system, ui-sans-serif, system-ui, sans-serif; }
    body { display: grid; place-items: center; padding: 40px; text-align: center; }
    h1 { font-size: 32px; font-weight: 600; letter-spacing: -0.02em; color: rgba(245,240,230,0.95); margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.55; max-width: 40ch; margin: 0 0 20px; }
    a { color: rgba(245,240,230,0.65); font-size: 13px; text-decoration: none; border-bottom: 1px solid rgba(245,240,230,0.2); padding-bottom: 2px; }
    a:hover { color: rgba(245,240,230,0.95); border-color: rgba(245,240,230,0.6); }
  </style>
</head>
<body>
  <div>
    <h1>Nothing here yet</h1>
    <p>${escapeHtml(message)}</p>
    <a href="https://wrksstudio.com">Build your own with WRKS Studio</a>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
