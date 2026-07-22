"use client";

import { useEffect, useRef, useState } from "react";

// v3 page artboard — iframes the WRKS server-side render endpoint
// /api/sites/render/[jobId] which streams the assembled HTML doc
// (stored in sites_generation_jobs.html) with Content-Type text/html.
//
// Auto-heights: the render route injects a postMessage reporter that
// posts document.scrollHeight back on load / resize / image load. We
// listen and grow the iframe to match — no clipped footers, no dead
// grey space, works with any section count.

type Props = {
  jobId: string;
  width?: number;
};

// Initial height guess — the real value arrives via postMessage within
// ~200-500ms of the iframe loading. Keeping this in the ballpark
// prevents a huge layout jump on first render.
const INITIAL_HEIGHT = 6000;
const DEFAULT_WIDTH = 1280;

export function PagePreviewFrame({ jobId, width }: Props) {
  const [height, setHeight] = useState(INITIAL_HEIGHT);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      // Only accept messages from our own iframe to avoid cross-frame
      // noise (browser extensions, dev tools postMessage constantly).
      if (ev.source !== iframeRef.current?.contentWindow) return;
      const data = ev.data as { type?: string; height?: number };
      if (data?.type !== "wrks:height") return;
      if (typeof data.height !== "number" || data.height <= 0) return;
      // Add a tiny buffer so the last line of copy never touches the
      // iframe edge (also absorbs 1-2px sub-pixel measurement drift).
      setHeight(Math.ceil(data.height) + 4);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const src = `/api/sites/render/${encodeURIComponent(jobId)}`;

  return (
    <div
      className="page-artboard"
      style={{
        width: width ?? DEFAULT_WIDTH,
        height,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.1)",
        boxShadow:
          "0 40px 100px -40px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.2)",
        background: "#ffffff",
        position: "relative",
        transition: "height 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <iframe
        ref={iframeRef}
        src={src}
        title="Site preview"
        scrolling="no"
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
