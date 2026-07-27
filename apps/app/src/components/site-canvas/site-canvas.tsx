"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PagePreviewFrame } from "./page-artboard";
import { PageArtboardPending } from "./page-artboard-pending";
import {
  DesignSystemArtboard,
  type DesignSystemArtboardData,
} from "./design-system-artboard";

// Infinite dotted-grid canvas for the site-generation theater. Real
// pan (mouse drag on empty canvas) + zoom (ctrl-wheel). Two artboard
// kinds live here: the design-system card (drops first) and the page
// artboard (mobile-shape while generating with cursor animation → real
// iframe when done).

export type SiteArtboard =
  | {
      id: string;
      kind: "design-system";
      title: string;
      data: DesignSystemArtboardData;
    }
  | {
      id: string;
      kind: "page";
      title: string;
      pageId: string;
      status: "pending" | "generating" | "done";
      jobId?: string;
      phase?: string | null;
      phaseMessage?: string | null;
      bytes?: number | null;
      paletteHex?: string | null;
    };

type Props = {
  artboards: SiteArtboard[];
};

const DS_WIDTH = 720;
const PAGE_W = 1280;            // Same width pending + done — no size jump
const ARTBOARD_GAP = 60;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2;

export function SiteCanvas({ artboards }: Props) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.5);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastFramedRef = useRef<number>(-1);

  // Frame the newest artboard OR frame BOTH together once page appears.
  useEffect(() => {
    if (artboards.length === 0) return;
    if (artboards.length - 1 === lastFramedRef.current) return;
    lastFramedRef.current = artboards.length - 1;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // If we now have both DS + page, frame both. Otherwise center the
    // single new artboard.
    if (artboards.length >= 2) {
      const totalWidth =
        artboardWidthOf(artboards[0]) +
        ARTBOARD_GAP +
        artboardWidthOf(artboards[1]);
      const desiredZoom = Math.min(0.5, (rect.width * 0.82) / totalWidth);
      const centerX = rect.width / 2 - (totalWidth / 2) * desiredZoom;
      // Bias UP so the top of the page (hero) shows, not the middle.
      const centerY = 100;
      setZoom(desiredZoom);
      setPan({ x: centerX, y: centerY });
    } else {
      const newest = artboards[artboards.length - 1];
      const wNew = artboardWidthOf(newest);
      const desiredZoom = Math.min(0.55, (rect.width * 0.65) / wNew);
      const centerX = rect.width / 2 - (wNew / 2) * desiredZoom;
      const centerY = 100;
      setZoom(desiredZoom);
      setPan({ x: centerX, y: centerY });
    }
  }, [artboards]);

  const onWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setZoom((prev) => {
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));
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
        background: "#0a0a0f",
        cursor: isPanning ? "grabbing" : "default",
        backgroundImage:
          "radial-gradient(circle at center, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
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
          const nodes = artboards.map((a, i) => {
            const left = x;
            x += artboardWidthOf(a) + ARTBOARD_GAP;
            return (
              <div
                key={a.id}
                style={{
                  position: "absolute",
                  left,
                  top: 0,
                  animation:
                    i === artboards.length - 1
                      ? "wrks-artboard-in 700ms cubic-bezier(0.34, 1.2, 0.64, 1) both"
                      : undefined,
                }}
              >
                {a.kind === "design-system" ? (
                  <DesignSystemArtboard {...a.data} />
                ) : a.status === "done" && a.jobId ? (
                  <PagePreviewFrame jobId={a.jobId} />
                ) : (
                  <PageArtboardPending
                    bytes={a.bytes ?? null}
                    paletteHex={a.paletteHex ?? null}
                    brandName={a.title === "Home" ? null : a.title}
                  />
                )}
              </div>
            );
          });
          return nodes;
        })()}

        {artboards.length === 0 && <EmptyState />}
      </div>

      <ZoomIndicator zoom={zoom} onReset={() => setZoom(0.5)} />

      <style>{`
        @keyframes wrks-artboard-in {
          from { opacity: 0; transform: translateY(20px) scale(0.98); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}

function artboardWidthOf(a: SiteArtboard): number {
  if (a.kind === "design-system") return DS_WIDTH;
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
        right: 76,
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
