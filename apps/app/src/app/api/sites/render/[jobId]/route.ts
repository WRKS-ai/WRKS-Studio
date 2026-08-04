import { getReadyJobHtml, getSitePageHtml } from "@/lib/site-generation/job-store";

// Public HTML renderer for v3 generated sites.
//
// Serves the assembled HTML doc stored in sites_generation_jobs.
// With no query params -> serves the home page (or the sole HTML for
// legacy single-page jobs). With ?path=/about -> serves the specified
// page from the multi-page pages array.
//
// Content-Type text/html so the studio canvas iframe (or any share
// link) renders it as a live document.
//
// Unauthenticated intentionally — jobId is a UUID (unlisted-YouTube
// pattern). Published jobs never expire; unpublished/preview jobs
// expire after 6h.

export const runtime = "nodejs";
// Small cache — if the same iframe reloads, don't hammer Postgres.
export const revalidate = 60;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!isUuid(jobId)) {
    return new Response(notFoundHtml("Invalid job id"), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path");

  // With ?path=: use the multi-page pages array lookup. Without ?path=:
  // fall back to the legacy html column so existing iframes keep working.
  const html = path
    ? await getSitePageHtml(jobId, path)
    : await getReadyJobHtml(jobId);

  if (!html) {
    return new Response(
      notFoundHtml(
        path
          ? `The page ${path} doesn't exist on this site.`
          : "This draft isn't ready yet or has expired.",
      ),
      {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      },
    );
  }

  // Inject the auto-height reporter before </body>. This posts the
  // document's real scroll height back to the parent studio canvas so
  // the artboard iframe can grow to fit — otherwise the fixed default
  // clips longer sections (footer + closing beats).
  const withReporter = injectHeightReporter(html);

  return new Response(withReporter, {
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

// ============================================================
// Auto-height reporter (injected script)
// ============================================================
//
// The generated HTML has variable length (5 to 12+ sections, each
// with variable copy). We can't know the render height statically, so
// the iframe posts its real height on load + on resize + on font/image
// load. The parent artboard listens for `wrks:height` messages and
// updates the iframe height to match.

function injectHeightReporter(html: string): string {
  // Measure the true content height (bottom of the LAST rendered element)
  // instead of relying on documentElement/body scrollHeight, which can
  // be inflated by phantom margins, absolute elements, or Tailwind CDN
  // late-swapping styles.
  //
  // Strategy: find the footer (or last <section> if no footer), take
  // its getBoundingClientRect().bottom + scrollY. That's the actual
  // pixel where visible content ends. Cap at 12000 for safety.
  const script = `
<script>
(function(){
  var last = 0;
  function measure(){
    // Prefer footer bottom. Fall back to last section, then body.
    var target = document.querySelector('footer')
      || document.querySelector('main > section:last-of-type')
      || document.querySelector('section:last-of-type')
      || document.body;
    if (!target) return 0;
    var rect = target.getBoundingClientRect();
    var footerBottom = Math.round(rect.bottom + (window.scrollY || 0));
    // Fallback to full doc height if footer measure returns 0 (element
    // not yet laid out).
    if (footerBottom <= 0) {
      footerBottom = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      );
    }
    // Cap: no site should be over 12000px tall.
    return Math.min(footerBottom, 12000);
  }
  function report(){
    var h = measure();
    if (h > 0 && Math.abs(h - last) > 2) {
      last = h;
      try { parent.postMessage({ type: 'wrks:height', height: h }, '*'); } catch (e) {}
    }
  }
  // Initial + on-load + resize
  document.addEventListener('DOMContentLoaded', report);
  window.addEventListener('load', report);
  window.addEventListener('resize', report);
  // Tailwind CDN swaps styles asynchronously; wait a few beats.
  [80, 250, 600, 1200, 2500, 5000, 10000].forEach(function(t){ setTimeout(report, t); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(report).catch(function(){});
  }
  // Late-loading images
  document.querySelectorAll('img').forEach(function(img){
    if (!img.complete) img.addEventListener('load', report);
  });
  // DOM mutations (Tailwind class injection, dynamic content)
  if (window.MutationObserver) {
    var mo = new MutationObserver(function(){
      // Debounce mutations — only report if stable for 200ms
      clearTimeout(window.__wrksReportTimer);
      window.__wrksReportTimer = setTimeout(report, 200);
    });
    mo.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style']
    });
  }
})();
</script>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}\n</body>`);
  }
  // Fallback — append at end
  return html + script;
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
