"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteCanvas, type SiteArtboard } from "@/components/site-canvas/site-canvas";

// /studio/sites/generating — v3 generation theater.
//
// Structured state model (no scrolling narration log): each server
// `status` event updates a fixed PipelineStatus record with:
//   - current phase (mapped to one of 4 stepper phases)
//   - live verb / message (single line, updates in place)
//   - brand facts (palette, typefaces, verticals) once ingest.done
//   - byte count from generate.progress ticks
//   - startedAt timestamp for elapsed clock
//
// The left sidebar renders: phase stepper + brand facts card + one
// live activity line. The center canvas renders a full-artboard
// skeleton (page-artboard-pending) that reflects the same live state.

type StepPhase = "read" | "draft" | "style" | "render" | "done";

type BrandFacts = {
  brandName: string | null;
  palette: Array<{ hex: string; role: string }>;
  typefaces: { display: string | null; body: string | null } | null;
  testimonialsFound: number;
  verticals: string[];
};

type PipelineStatus = {
  currentPhase: StepPhase | "idle";
  liveMessage: string | null;         // one-line verb-first present-tense line
  bytes: number;                       // running byte count
  startedAt: number;                   // ms epoch — for elapsed clock
  brandFacts: BrandFacts | null;
};

// Byte thresholds to advance the phase stepper past "draft" into
// "style" then "render". Rough — the point is a live sense of progress.
const BYTES_DRAFT_END = 30_000;
const BYTES_STYLE_END = 55_000;

export default function GeneratingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const jobId = params.get("jobId");
  const [artboards, setArtboards] = useState<SiteArtboard[]>([]);
  const [status, setStatus] = useState<PipelineStatus>({
    currentPhase: "idle",
    liveMessage: null,
    bytes: 0,
    startedAt: Date.now(),
    brandFacts: null,
  });
  const [projectTitle, setProjectTitle] = useState<string>("New site");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"ingest" | "generate" | "done">("ingest");
  const streamStartedRef = useRef(false);

  // Derive stepper phase from bytes when in the middle of generation.
  const derivedPhase: StepPhase | "idle" = useMemo(() => {
    if (status.currentPhase === "done") return "done";
    if (status.currentPhase === "idle") return "idle";
    if (status.currentPhase === "read") return "read";
    // In generate — walk through draft/style/render by bytes.
    if (status.bytes >= BYTES_STYLE_END) return "render";
    if (status.bytes >= BYTES_DRAFT_END) return "style";
    return "draft";
  }, [status.currentPhase, status.bytes]);

  useEffect(() => {
    if (!jobId) {
      setError("Missing job id — start again from the composer.");
      return;
    }
    if (streamStartedRef.current) return;
    streamStartedRef.current = true;

    // Initial live message.
    setStatus((prev) => ({
      ...prev,
      currentPhase: "read",
      liveMessage: "warming up the design agent",
      startedAt: Date.now(),
    }));

    // Seed the canvas with a pending page artboard immediately so the
    // user sees a framed slot while ingest + Opus run.
    setArtboards([
      {
        id: `page-home-${jobId}`,
        kind: "page",
        title: "Home",
        pageId: "home",
        status: "generating",
      },
    ]);

    const es = new EventSource(`/api/sites/generate?jobId=${jobId}`);

    // v3 poll architecture: server emits one `status` event whenever the
    // job row changes phase. We map that to a structured PipelineStatus
    // (one live message + brand facts + bytes) instead of pushing new
    // narration lines. No more scrolling wall of duplicates.
    es.addEventListener("status", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as {
        status: string;
        phase: string | null;
        phaseMessage: string | null;
        phaseProgress: Record<string, unknown> | null;
        ready: boolean;
        bytes: number | null;
      };

      // Terminal ready state — actual artboard flip happens on generation.done.
      if (data.phase === "done") return;

      // Ingest completion carries the brand facts payload — extract into
      // structured state so the sidebar card can render palette + type.
      if (data.phase === "ingest.done" && data.phaseProgress) {
        const p = data.phaseProgress as {
          brandName?: string | null;
          palette?: Array<{ hex: string; role: string }>;
          typefaces?: { display?: string | null; body?: string | null };
          testimonialsFound?: number;
          verticals?: string[];
        };
        if (p.brandName) setProjectTitle(p.brandName);
        const paletteHex =
          p.palette?.find((c) => c.role === "primary")?.hex ??
          p.palette?.[0]?.hex ??
          null;
        setStatus((prev) => ({
          ...prev,
          currentPhase: "draft",
          liveMessage: "structure",
          brandFacts: {
            brandName: p.brandName ?? null,
            palette: p.palette ?? [],
            typefaces: p.typefaces
              ? { display: p.typefaces.display ?? null, body: p.typefaces.body ?? null }
              : null,
            testimonialsFound: p.testimonialsFound ?? 0,
            verticals: p.verticals ?? [],
          },
        }));
        setArtboards((prev) =>
          prev.map((a) =>
            a.pageId === "home"
              ? { ...a, paletteHex, title: p.brandName ?? a.title }
              : a,
          ),
        );
        setPhase("generate");
        return;
      }

      if (data.phase === "ingest.skipped") {
        setStatus((prev) => ({
          ...prev,
          currentPhase: "draft",
          liveMessage: "structure",
        }));
        setPhase("generate");
        return;
      }

      if (data.phase === "generate.progress") {
        const bytes = (data.phaseProgress as { chars?: number } | null)?.chars ?? data.bytes ?? 0;
        setStatus((prev) => ({
          ...prev,
          bytes,
          liveMessage: verbForBytes(bytes),
        }));
        // Also update the artboard so the skeleton's top progress bar
        // and centered pill reflect the live byte count.
        setArtboards((prev) =>
          prev.map((a) =>
            a.pageId === "home"
              ? { ...a, bytes, phase: "generate.progress" }
              : a,
          ),
        );
        return;
      }

      if (data.phase === "generate") {
        setStatus((prev) => ({ ...prev, currentPhase: "draft", liveMessage: "sketching structure" }));
        setPhase("generate");
        return;
      }

      if (data.phase === "ingest" || data.phase === "images") {
        // Pipeline pre-generate phases — keep in "read" stepper phase.
        const msg = data.phase === "ingest" ? "reading your site" : "curating image slots";
        setStatus((prev) => ({ ...prev, currentPhase: "read", liveMessage: msg }));
        return;
      }
    });

    es.addEventListener("generation.done", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as {
        siteId: string;
      };
      // Flip the page artboard to done — attach jobId so the iframe
      // renders /api/sites/render/[jobId].
      setArtboards((prev) =>
        prev.map((a) =>
          a.pageId === "home"
            ? { ...a, status: "done" as const, jobId: data.siteId }
            : a,
        ),
      );
      setStatus((prev) => ({ ...prev, currentPhase: "done", liveMessage: null }));
      setPhase("done");
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
        {/* Left status panel (structured stepper + brand facts + live line) */}
        <LeftPanel
          status={status}
          derivedPhase={derivedPhase}
          phase={phase}
          error={error}
        />

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
  phase: "ingest" | "generate" | "done";
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
// Left panel — structured stepper + brand facts + one live line
// ============================================================
//
// Design: no scrolling log. Fixed 4-phase stepper at top (Read → Draft
// → Style → Render). Brand-facts card appears once ingest.done. One
// live-verb line + elapsed clock at the bottom.

const STEPS: Array<{ id: StepPhase; label: string }> = [
  { id: "read", label: "Read" },
  { id: "draft", label: "Draft" },
  { id: "style", label: "Style" },
  { id: "render", label: "Render" },
];

function LeftPanel({
  status,
  derivedPhase,
  phase,
  error,
}: {
  status: PipelineStatus;
  derivedPhase: StepPhase | "idle";
  phase: "ingest" | "generate" | "done";
  error: string | null;
}) {
  // Rolling elapsed clock, ticks every 1s.
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    if (phase === "done") return;
    const t = setInterval(() => {
      setElapsedMs(Date.now() - status.startedAt);
    }, 1000);
    return () => clearInterval(t);
  }, [phase, status.startedAt]);

  const primaryHex =
    status.brandFacts?.palette.find((c) => c.role === "primary")?.hex ??
    status.brandFacts?.palette[0]?.hex ??
    "#75B5FF";

  return (
    <aside
      className="shrink-0 flex flex-col"
      style={{
        width: 340,
        background: "rgba(12,12,16,0.94)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Status pill top */}
      <div style={{ padding: "18px 22px 8px" }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: 999,
              background: phase === "done" ? "rgba(120,220,140,0.9)" : primaryHex,
              boxShadow:
                phase === "done"
                  ? "0 0 8px rgba(120,220,140,0.5)"
                  : `0 0 8px ${primaryHex}`,
              animation:
                phase !== "done" ? "wrks-pulse-dot 1.6s ease-in-out infinite" : undefined,
            }}
          />
          <span
            style={{
              fontSize: 10.5,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(245,240,230,0.7)",
              fontWeight: 500,
            }}
          >
            {phase === "done" ? "Ready" : "Working"}
          </span>
        </div>
      </div>

      {/* Phase stepper */}
      <div style={{ padding: "16px 22px 8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {STEPS.map((step, i) => {
            const isActive = derivedPhase === step.id;
            const isDone =
              derivedPhase === "done" ||
              STEPS.findIndex((s) => s.id === derivedPhase) > i;
            return (
              <StepRow
                key={step.id}
                label={step.label}
                state={isDone ? "done" : isActive ? "active" : "pending"}
                sublineFor={isActive ? status.liveMessage : null}
                accent={primaryHex}
              />
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: "12px 22px", height: 1, background: "rgba(255,255,255,0.05)" }} />

      {/* Brand facts card — appears once ingest.done */}
      <div style={{ padding: "0 22px 8px" }}>
        {status.brandFacts ? (
          <BrandFactsCard facts={status.brandFacts} />
        ) : (
          <BrandFactsSkeleton />
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Error surface */}
      {error && (
        <div style={{ padding: "0 22px 12px" }}>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(255,120,110,0.06)",
              border: "1px solid rgba(255,120,110,0.14)",
              fontSize: 12.5,
              color: "#ff9d98",
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* Bottom: elapsed + bytes */}
      <div
        style={{
          padding: "14px 22px 18px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 11.5,
          letterSpacing: "0.08em",
          color: "rgba(245,240,230,0.5)",
          textTransform: "uppercase",
        }}
      >
        <span>{formatElapsed(elapsedMs)}</span>
        <span>{status.bytes > 0 ? `${Math.round(status.bytes / 1000)}kb` : "—"}</span>
      </div>

      <style>{`
        @keyframes wrks-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.75); }
        }
      `}</style>
    </aside>
  );
}

function StepRow({
  label,
  state,
  sublineFor,
  accent,
}: {
  label: string;
  state: "pending" | "active" | "done";
  sublineFor: string | null;
  accent: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0" }}>
      <StepIndicator state={state} accent={accent} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13.5,
            fontWeight: state === "active" ? 500 : 400,
            color:
              state === "done"
                ? "rgba(245,240,230,0.55)"
                : state === "active"
                ? "rgba(245,240,230,0.95)"
                : "rgba(245,240,230,0.35)",
            letterSpacing: "-0.005em",
            transition: "color 300ms ease, font-weight 300ms ease",
          }}
        >
          {label}
        </span>
        {sublineFor && state === "active" && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              color: "rgba(245,240,230,0.55)",
              letterSpacing: "0.02em",
            }}
          >
            {sublineFor}
          </span>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  state,
  accent,
}: {
  state: "pending" | "active" | "done";
  accent: string;
}) {
  const size = 16;
  if (state === "done") {
    return (
      <div
        style={{
          width: size,
          height: size,
          marginTop: 2,
          borderRadius: "50%",
          background: "rgba(120,220,140,0.14)",
          border: "1px solid rgba(120,220,140,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(120,220,140,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    );
  }
  if (state === "active") {
    return (
      <div
        style={{
          width: size,
          height: size,
          marginTop: 2,
          borderRadius: "50%",
          background: accent,
          boxShadow: `0 0 12px ${accent}`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            border: `1px solid ${accent}`,
            opacity: 0.4,
            animation: "wrks-ripple 2s ease-out infinite",
          }}
        />
        <style>{`
          @keyframes wrks-ripple {
            0% { opacity: 0.5; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.8); }
          }
        `}</style>
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        marginTop: 2,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    />
  );
}

function BrandFactsCard({ facts }: { facts: BrandFacts }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(245,240,230,0.5)",
        }}
      >
        Found
      </div>
      {facts.brandName && (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(245,240,230,0.95)",
            letterSpacing: "-0.005em",
          }}
        >
          {facts.brandName}
        </div>
      )}
      {facts.palette.length > 0 && (
        <div style={{ display: "flex", gap: 4 }}>
          {facts.palette.slice(0, 5).map((c, i) => (
            <div
              key={i}
              title={`${c.role} · ${c.hex}`}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: c.hex,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {facts.typefaces?.display && (
          <FactRow label="Type" value={facts.typefaces.display} />
        )}
        {facts.testimonialsFound > 0 && (
          <FactRow
            label="Testimonials"
            value={String(facts.testimonialsFound)}
          />
        )}
        {facts.verticals.length > 0 && (
          <FactRow label="Verticals" value={facts.verticals.slice(0, 2).join(", ")} />
        )}
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        color: "rgba(245,240,230,0.55)",
      }}
    >
      <span style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: "rgba(245,240,230,0.85)", fontFamily: "var(--font-sans)", fontSize: 12.5 }}>{value}</span>
    </div>
  );
}

function BrandFactsSkeleton() {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(245,240,230,0.35)",
        }}
      >
        Reading brand
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          />
        ))}
      </div>
      <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.05)", width: "70%" }} />
      <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.05)", width: "55%" }} />
    </div>
  );
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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
function BottomComposer({ phase }: { phase: "ingest" | "generate" | "done" }) {
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
              Opus 4.7
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

// Map running byte count → a terse present-tense verb (Cursor / Linear
// style). Rotates as generation progresses; single line updates in
// place in the sidebar's "live" slot.
function verbForBytes(bytes: number): string {
  if (bytes < 4000) return "warming up";
  if (bytes < 10_000) return "sketching structure";
  if (bytes < 18_000) return "writing hero";
  if (bytes < 26_000) return "assembling grid";
  if (bytes < 34_000) return "placing sections";
  if (bytes < 42_000) return "shaping copy";
  if (bytes < 50_000) return "styling components";
  if (bytes < 58_000) return "polishing details";
  return "finishing";
}

