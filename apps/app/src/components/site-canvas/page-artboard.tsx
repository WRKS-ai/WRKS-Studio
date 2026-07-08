"use client";

import type { DesignSystem } from "@/lib/site-generation/design-system";
import type { PageContent } from "@/lib/site-generation/page-content";

// Page artboard — iframes the REAL Bill-Fanter Astro template running
// at bill-fanter-preview-tau.vercel.app/preview and reads the current
// user's content + designSystem from the URL query. No cross-service
// fetch, no auth surface — everything the preview needs is in the URL.
//
// Chose URL-embedded content over a Supabase job endpoint because the
// Studio deployment sits behind Vercel SSO, and Bill-Fanter's SSR
// fetch was hitting the SSO gate → 302 → 404 fallback. URL params
// sidestep the whole auth question. Trade-off: URL gets long
// (~5-7 KB), well under Vercel's 8 KB limit.

type Props = {
  content: PageContent;
  designSystem: DesignSystem;
};

const BILL_FANTER_PREVIEW_ORIGIN =
  process.env.NEXT_PUBLIC_BILL_FANTER_PREVIEW_ORIGIN ??
  "https://bill-fanter-preview-tau.vercel.app";

export function PagePreviewFrame({ content, designSystem }: Props) {
  const payload = encodeURIComponent(
    JSON.stringify({ content, designSystem }),
  );
  const previewUrl = `${BILL_FANTER_PREVIEW_ORIGIN}/preview?data=${payload}`;

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
    </div>
  );
}
