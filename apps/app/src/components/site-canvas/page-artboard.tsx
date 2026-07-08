"use client";

import { useEffect, useState } from "react";

// Page artboard — iframes the REAL Bill-Fanter Astro template running
// at bill-fanter-preview.vercel.app/preview/[jobId], which fetches
// this user's generated content from Studio's public job endpoint
// and renders billfanter.com's actual section components with the
// user's copy.
//
// The React port that used to live here (hand-rolled Hero/HelpGrid/
// About/Closing renderers) was killed 2026-06-30 — chasing pixel
// parity with a hand-rolled port was the wrong direction. The
// template we spent all day slot-refactoring IS the answer.
//
// The iframe waits until we're confident the job endpoint has
// populated (a short delay after `page.done`) before loading —
// premature loads see a 409 and render the Bill-Fanter canonical
// content instead of the user's.

type Props = {
  jobId: string;
};

// The bill-fanter-preview Vercel project — runs the Bill-Fanter Astro
// template in SSR mode and exposes /preview/[jobId] that pulls the
// current user's generated content from Studio's job endpoint.
// Override via NEXT_PUBLIC_BILL_FANTER_PREVIEW_ORIGIN for staging.
const BILL_FANTER_PREVIEW_ORIGIN =
  process.env.NEXT_PUBLIC_BILL_FANTER_PREVIEW_ORIGIN ??
  "https://bill-fanter-preview-tau.vercel.app";

export function PagePreviewFrame({ jobId }: Props) {
  // Small delay so the /api/sites/jobs/[jobId] endpoint is populated
  // by the time Astro's SSR fetch runs (page.done event fires just
  // before markJobReady in the same request cycle, so the ordering
  // is usually fine — but a beat helps in cold-start scenarios).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, [jobId]);

  const previewUrl = `${BILL_FANTER_PREVIEW_ORIGIN}/preview/${jobId}`;

  return (
    <div
      className="page-artboard"
      style={{
        width: 1280,
        height: 900,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.1)",
        boxShadow:
          "0 40px 100px -40px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.2)",
        background: "#ffffff",
        position: "relative",
      }}
    >
      {!ready ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(10,10,12,0.4)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Loading preview…
        </div>
      ) : (
        <iframe
          src={previewUrl}
          title="Site preview"
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            display: "block",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      )}
    </div>
  );
}
