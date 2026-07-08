"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SiteCanvas, type SiteArtboard } from "@/components/site-canvas/site-canvas";
import type { DesignSystem } from "@/lib/site-generation/design-system";
import type { PageContent } from "@/lib/site-generation/page-content";

// /studio/sites/generating — Stitch-style full-canvas theater.
//
// Ship 1 (2026-06-30): full-viewport canvas with dotted grid + top
// glass toolbar + left narration panel + right icon tools + bottom
// composer. Design system pass runs against real Haiku via
// /api/sites/generate SSE stream; result renders as the FIRST
// artboard on the canvas.
//
// Ship 2+ adds page artboards (Sonnet content), inline editing,
// voice narration, and undo/redo.

type NarrationLine = {
  id: string;
  role: "system" | "agent";
  text: string;
};

export default function GeneratingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const jobId = params.get("jobId");
  const [artboards, setArtboards] = useState<SiteArtboard[]>([]);
  const [narration, setNarration] = useState<NarrationLine[]>([]);
  const [projectTitle, setProjectTitle] = useState<string>("New site");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"design" | "pages" | "done">("design");
  const streamStartedRef = useRef(false);

  useEffect(() => {
    if (!jobId) {
      setError("Missing job id — start again from the composer.");
      return;
    }
    if (streamStartedRef.current) return;
    streamStartedRef.current = true;

    pushNarration(
      setNarration,
      "system",
      "Warming up the design agent…",
    );

    const es = new EventSource(`/api/sites/generate?jobId=${jobId}`);

    es.addEventListener("design.start", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { message: string };
      pushNarration(setNarration, "agent", data.message);
    });

    let latestDesign: DesignSystem | null = null;

    es.addEventListener("design.done", (e) => {
      const ds = JSON.parse((e as MessageEvent).data) as DesignSystem;
      latestDesign = ds;
      setArtboards((prev) => [
        ...prev,
        {
          id: "design-system",
          kind: "design-system",
          title: makeSystemTitle(ds),
          designSystem: ds,
        },
      ]);
      setProjectTitle(makeSystemTitle(ds));
      pushNarration(setNarration, "agent", ds.narration);
      setPhase("pages");
    });

    es.addEventListener("page.start", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as {
        pageId: string;
        message: string;
      };
      pushNarration(setNarration, "agent", data.message);
      // Add a pending page artboard so the canvas frames its slot
      // while Sonnet writes.
      setArtboards((prev) => [
        ...prev,
        {
          id: `page-${data.pageId}`,
          kind: "page",
          title: prettyPageTitle(data.pageId),
          pageId: data.pageId,
          status: "generating",
        },
      ]);
    });

    // Sonnet finished writing this page's content. We DON'T flip the
    // artboard to "done" yet — that would mount the iframe before the
    // server's markJobReady() Supabase write completes. Just capture
    // the narration + title; generation.done triggers the swap.
    let pendingTitle: string | null = null;
    es.addEventListener("page.done", (e) => {
      const page = JSON.parse((e as MessageEvent).data) as PageContent;
      pushNarration(setNarration, "agent", page.narration);
      pendingTitle = page.title;
    });

    es.addEventListener("generation.done", () => {
      // Now the server has committed the job to Supabase. Safe for the
      // iframe to fetch. Flip the artboard status → done which mounts
      // the PagePreviewFrame.
      setArtboards((prev) =>
        prev.map((a) =>
          a.kind === "page"
            ? {
                ...a,
                status: "done" as const,
                jobId: jobId ?? undefined,
                title: pendingTitle ?? a.title,
              }
            : a,
        ),
      );
      setPhase("done");
      pushNarration(
        setNarration,
        "system",
        "Draft is ready. Type in the composer to iterate.",
      );
      es.close();
    });

    es.addEventListener("error", (e) => {
      try {
        const raw = (e as MessageEvent).data;
        if (raw) {
          const data = JSON.parse(raw as string) as {
            stage: string;
            message: string;
          };
          setError(`${data.stage}: ${data.message}`);
        }
      } catch {
        // EventSource fires 'error' on normal stream close too. Only
        // surface if we haven't reached the done phase.
      }
    });

    return () => {
      es.close();
    };
  }, [jobId]);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: "#0a0a0c",
        color: "#f5f0e6",
        fontFamily: "var(--font-sans)",
      }}
    >
      <TopToolbar title={projectTitle} phase={phase} onExit={() => router.push("/studio/sites")} />

      <div className="flex-1 min-h-0 flex">
        {/* Left narration panel */}
        <LeftPanel narration={narration} phase={phase} error={error} />

        {/* Center canvas */}
        <div className="flex-1 min-w-0 relative">
          <SiteCanvas artboards={artboards} />
          <RightTools />
          <BottomComposer phase={phase} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Top toolbar
// ============================================================
function TopToolbar({
  title,
  phase,
  onExit,
}: {
  title: string;
  phase: "design" | "pages" | "done";
  onExit: () => void;
}) {
  return (
    <div
      className="shrink-0 flex items-center justify-between"
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(20,20,26,0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className="flex items-center" style={{ gap: 12 }}>
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit"
          className="grid place-items-center transition-colors duration-150 hover:bg-white/[0.06]"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(245,240,230,0.8)",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            color: "rgba(245,240,230,0.92)",
          }}
        >
          {title}
        </span>
      </div>

      <div className="flex items-center" style={{ gap: 4 }}>
        <ModeDropdown label="Generate" active={phase !== "done"} />
        <ModeDropdown label="Modify" active={false} />
        <ModeDropdown label="Preview" active={phase === "done"} />
        <ModeDropdown label="More" more />
      </div>

      <div className="flex items-center" style={{ gap: 8 }}>
        <button
          type="button"
          className="inline-flex items-center transition-colors duration-150 hover:bg-white/[0.06]"
          style={{
            padding: "6px 12px",
            gap: 6,
            borderRadius: 8,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(245,240,230,0.85)",
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M16 6l-4-4-4 4M12 2v14" />
          </svg>
          Export
        </button>
        <button
          type="button"
          className="inline-flex items-center transition-colors duration-150 hover:bg-white/[0.06]"
          style={{
            padding: "6px 12px",
            gap: 6,
            borderRadius: 8,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(245,240,230,0.85)",
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="18" r="3" />
            <path d="m9 9 6 6M9 15l6-6" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
}

function ModeDropdown({
  label,
  active,
  more,
}: {
  label: string;
  active?: boolean;
  more?: boolean;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center transition-colors duration-150 hover:bg-white/[0.06]"
      style={{
        padding: "6px 10px",
        gap: 5,
        borderRadius: 8,
        background: active ? "rgba(255,255,255,0.05)" : "transparent",
        color: active ? "rgba(245,240,230,0.95)" : "rgba(245,240,230,0.68)",
        fontSize: 12.5,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {label}
      {!more && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
      {more && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      )}
    </button>
  );
}

// ============================================================
// Left panel — narration stream
// ============================================================
function LeftPanel({
  narration,
  phase,
  error,
}: {
  narration: NarrationLine[];
  phase: "design" | "pages" | "done";
  error: string | null;
}) {
  return (
    <aside
      className="shrink-0 flex flex-col"
      style={{
        width: 340,
        background: "rgba(15,15,20,0.9)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div style={{ padding: "18px 22px 14px" }}>
        <div className="flex items-center" style={{ gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: 999,
              background:
                phase === "done"
                  ? "rgba(120,220,140,0.8)"
                  : "rgba(255,255,255,0.6)",
              animation:
                phase !== "done" ? "wrks-skel-shimmer 1.6s ease-in-out infinite" : undefined,
            }}
          />
          <span
            style={{
              fontSize: 10.5,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(245,240,230,0.55)",
            }}
          >
            {phase === "done" ? "Ready" : "Agent thinking"}
          </span>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "0 22px 22px" }}
      >
        {narration.map((line, i) => (
          <p
            key={line.id}
            style={{
              margin: i === 0 ? "0 0 14px" : "14px 0",
              fontSize: line.role === "system" ? 12 : 14,
              lineHeight: 1.55,
              letterSpacing: "-0.003em",
              color:
                line.role === "system"
                  ? "rgba(245,240,230,0.45)"
                  : "rgba(245,240,230,0.9)",
              fontFamily:
                line.role === "system"
                  ? "var(--font-mono)"
                  : "var(--font-sans)",
            }}
          >
            {line.text}
          </p>
        ))}
        {error && (
          <p
            style={{
              margin: "14px 0",
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(255,120,110,0.06)",
              border: "1px solid rgba(255,120,110,0.14)",
              fontSize: 12.5,
              color: "#ff9d98",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </aside>
  );
}

// ============================================================
// Right icon toolbar
// ============================================================
function RightTools() {
  return (
    <div
      className="absolute flex flex-col"
      style={{
        right: 16,
        top: "50%",
        transform: "translateY(-50%)",
        gap: 4,
        padding: 4,
        borderRadius: 12,
        background: "rgba(20,20,26,0.7)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {(
        [
          { id: "cursor", d: "M4 4l7 20 3-9 9-3z" },
          { id: "marquee", d: "M4 4h4M20 4h-4M4 20h4M20 20h-4M4 12v-2M4 14v-2M12 4h-2M14 4h-2M20 12v-2M20 14v-2M12 20h-2M14 20h-2" },
          { id: "pen", d: "M4 20l4-1 11-11-3-3L5 16z" },
          { id: "hand", d: "M9 11V5a2 2 0 0 1 4 0v6M13 11V4a2 2 0 0 1 4 0v11a5 5 0 0 1-10 0V9" },
          { id: "image", d: "M4 6h16v12H4zM4 15l5-5 5 5 3-3 3 3" },
          { id: "palette", d: "M12 3a9 9 0 1 0 3 17.5c-1 0-2-1-2-2s.4-2 1-2h2a5 5 0 0 0 0-10h-4z" },
          { id: "star", d: "M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" },
        ] as const
      ).map((t) => (
        <button
          key={t.id}
          type="button"
          aria-label={t.id}
          className="grid place-items-center transition-colors duration-150 hover:bg-white/[0.08]"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: t.id === "cursor" ? "rgba(255,255,255,0.06)" : "transparent",
            color:
              t.id === "cursor"
                ? "rgba(245,240,230,0.95)"
                : "rgba(245,240,230,0.6)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={t.d} />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Bottom composer — placeholder until Ship 4 (edit-with-AI)
// ============================================================
function BottomComposer({ phase }: { phase: "design" | "pages" | "done" }) {
  return (
    <div
      className="absolute"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 20,
        width: "min(720px, calc(100% - 120px))",
      }}
    >
      <div
        className="flex flex-col"
        style={{
          gap: 8,
          padding: 12,
          borderRadius: 14,
          background: "rgba(20,20,26,0.82)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 20px 60px -30px rgba(0,0,0,0.7)",
        }}
      >
        <input
          type="text"
          placeholder={
            phase === "done"
              ? "What would you like to change or create?"
              : "Agent is drafting — hang on…"
          }
          disabled={phase !== "done"}
          className="w-full bg-transparent outline-none"
          style={{
            padding: "8px 6px",
            fontSize: 14,
            letterSpacing: "-0.005em",
            color: "rgba(245,240,230,0.95)",
          }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: 4 }}>
            {(["+", "/"] as const).map((c) => (
              <button
                key={c}
                type="button"
                className="grid place-items-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "transparent",
                  color: "rgba(245,240,230,0.55)",
                  fontSize: 15,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center" style={{ gap: 6 }}>
            <span
              style={{
                fontSize: 11.5,
                fontFamily: "var(--font-mono)",
                color: "rgba(245,240,230,0.42)",
                letterSpacing: "0.06em",
              }}
            >
              Sonnet 4.6
            </span>
            <button
              type="button"
              aria-label="Voice"
              className="grid place-items-center transition-colors duration-150 hover:bg-white/[0.06]"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "rgba(255,255,255,0.03)",
                color: "rgba(245,240,230,0.65)",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Send"
              disabled={phase !== "done"}
              className="grid place-items-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: phase === "done" ? "#ffffff" : "rgba(255,255,255,0.08)",
                color: phase === "done" ? "#0a0a0c" : "rgba(245,240,230,0.35)",
                border: "none",
                cursor: phase === "done" ? "pointer" : "not-allowed",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function pushNarration(
  setNarration: React.Dispatch<React.SetStateAction<NarrationLine[]>>,
  role: NarrationLine["role"],
  text: string,
) {
  setNarration((prev) => [
    ...prev,
    { id: crypto.randomUUID(), role, text },
  ]);
}

function makeSystemTitle(ds: DesignSystem): string {
  return `${ds.palette.primary.name} · ${ds.type.display.family}`;
}

function prettyPageTitle(pageId: string): string {
  if (pageId === "home") return "Home";
  return pageId.charAt(0).toUpperCase() + pageId.slice(1).replace(/-/g, " ");
}
