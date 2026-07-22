"use client";

// v3 page artboard — iframes the WRKS server-side render endpoint
// /api/sites/render/[jobId] which streams the assembled HTML doc
// (stored in sites_generation_jobs.html) with Content-Type text/html.
//
// v2 (Bill-Fanter template + URL-embedded JSON) is fully removed —
// the v3 pipeline generates bespoke HTML per user via Opus 4.7
// reading the blueprint MDs, so there's no shared template to iframe
// anymore.

type Props = {
  jobId: string;
  // Optional dimensions — canvas passes these based on artboard size.
  width?: number;
  height?: number;
};

// Artboard sized to fit the full 10-section homepage without an
// inner scrollbar. Sections total ~4500-5500px at 1280 viewport
// (Hero 720 + MegaBento 1200 + Watchlist 700 + Community 720 +
// HelpGrid 500 + Spotlight 480 + HeroSplit 700 + Reviews 1400 +
// YoutubeCta 560 + AboutFounder 680). Rounded to 5200 with buffer.
const DEFAULT_HEIGHT = 5200;
const DEFAULT_WIDTH = 1280;

export function PagePreviewFrame({ jobId, width, height }: Props) {
  const src = `/api/sites/render/${encodeURIComponent(jobId)}`;

  return (
    <div
      className="page-artboard"
      style={{
        width: width ?? DEFAULT_WIDTH,
        height: height ?? DEFAULT_HEIGHT,
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
