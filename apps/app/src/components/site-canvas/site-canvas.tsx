"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PagePreviewFrame } from "./page-artboard";

// Infinite dotted-grid canvas for the Stitch-style site generation
// theater. Real pan (mouse drag) + zoom (wheel + trackpad). Artboards
// are absolute-positioned children.
//
// Chose a hand-rolled canvas over tldraw for Ship 1 because tldraw's
// v5 API is a big surface and we don't need drawing/selection tools
// yet — we need reliable pan/zoom + custom artboard content. tldraw
// upgrade lands in a later ship if we need canvas primitives.

// v3: canvas holds page artboards only. Each page artboard renders as
// an iframe pointing at /api/sites/render/[jobId] once the job is ready.
export type SiteArtboard = {
  id: string;
  kind: "page";
  title: string;
  pageId: string;
  status: "pending" | "generating" | "done";
  jobId?: string;                             // set when the ready HTML is available
};

type Props = {
  artboards: SiteArtboard[];
};

const PAGE_W = 1280;
const ARTBOARD_GAP = 80;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;

export function SiteCanvas({ artboards }: Props) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.55);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastFramedRef = useRef<number>(-1);

  // Center the newest artboard when one appears.
  useEffect(() => {
    if (artboards.length === 0) return;
    if (artboards.length - 1 === lastFramedRef.current) return;
    lastFramedRef.current = artboards.length - 1;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    // Compute total width by summing artboard widths + gaps up to the new one.
    let x = 0;
    for (let i = 0; i < artboards.length - 1; i++) {
      x += artboardWidthOf(artboards[i]) + ARTBOARD_GAP;
    }
    const newest = artboards[artboards.length - 1];
    const wNew = artboardWidthOf(newest);
    // Page artboards are tall (~5200px); frame to the hero-visible
    // height (720) so the canvas zooms to show the TOP of the page.
    // Pan/scroll reveals the sections below.
    const hNew = 720;
    // Pick a zoom that keeps the new artboard visible: fit its width to
    // ~70% of the container width.
    const desiredZoom = Math.min(0.42, (rect.width * 0.7) / wNew);
    const centerX = rect.width / 2 - (x + wNew / 2) * desiredZoom;
    const centerY = rect.height / 2 - (hNew / 2) * desiredZoom;
    setZoom(desiredZoom);
    setPan({ x: centerX, y: centerY });
  }, [artboards]);

  const onWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    // Ctrl / meta wheel = zoom. Plain wheel = pan.
    if (e.ctrlKey || e.metaKey) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setZoom((prev) => {
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));
        // Zoom around cursor point.
        setPan((p) => ({
          x: mx - ((mx - p.x) * next) / prev,
          y: my - ((my - p.y) * next) / prev,
        }));
        return next;
      });
    } else {
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    // Middle-click OR space+drag OR click on empty grid → pan.
    const target = e.target as HTMLElement;
    const isArtboard = target.closest(".ds-artboard, .page-artboard");
    if (e.button !== 1 && isArtboard) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanning]);

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      className="relative size-full overflow-hidden"
      style={{
        background: "#0a0a0c",
        cursor: isPanning ? "grabbing" : "default",
        // Dotted grid — CSS radial gradient scaled with zoom.
        backgroundImage:
          "radial-gradient(circle at center, rgba(255,255,255,0.09) 1px, transparent 1px)",
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      <div
        ref={contentRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transformOrigin: "0 0",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          pointerEvents: isPanning ? "none" : "auto",
          willChange: "transform",
        }}
      >
        {(() => {
          let x = 0;
          const nodes = artboards.map((a) => {
            const left = x;
            x += artboardWidthOf(a) + ARTBOARD_GAP;
            return (
              <div
                key={a.id}
                style={{ position: "absolute", left, top: 0 }}
              >
                {a.status === "done" && a.jobId ? (
                  <PagePreviewFrame jobId={a.jobId} />
                ) : (
                  <PageArtboardPending
                    title={a.title}
                    status={a.status}
                  />
                )}
                {/* Artboard label — small caption below the artboard */}
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 11.5,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(245,240,230,0.5)",
                  }}
                >
                  {a.title}
                </div>
              </div>
            );
          });
          return nodes;
        })()}

        {artboards.length === 0 && <EmptyState />}
      </div>

      <ZoomIndicator zoom={zoom} onReset={() => setZoom(0.55)} />
    </div>
  );
}

function artboardWidthOf(_a: SiteArtboard): number {
  return PAGE_W;
}

function EmptyState() {
  return (
    <div
      style={{
        width: 720,
        height: 480,
        borderRadius: 14,
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(245,240,230,0.35)",
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      Warming up…
    </div>
  );
}

function PageArtboardPending({
  title,
  status,
}: {
  title: string;
  status: "pending" | "generating" | "done";
}) {
  return (
    <div
      className="page-artboard"
      style={{
        width: 1280,
        minHeight: 800,
        borderRadius: 16,
        background: "#0d0d12",
        color: "#f5f0e6",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          padding: "10px 22px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {title} · {status}
        {status === "generating" && (
          <span
            style={{
              display: "inline-block",
              marginLeft: 8,
              animation: "wrks-skel-shimmer 1.6s ease-in-out infinite",
            }}
          >
            …
          </span>
        )}
      </span>
    </div>
  );
}

function ZoomIndicator({
  zoom,
  onReset,
}: {
  zoom: number;
  onReset: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="absolute transition-opacity duration-150 hover:opacity-80"
      style={{
        bottom: 16,
        right: 16,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(245,240,230,0.7)",
        fontSize: 11.5,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.06em",
        cursor: "pointer",
      }}
    >
      {Math.round(zoom * 100)}%
    </button>
  );
}
