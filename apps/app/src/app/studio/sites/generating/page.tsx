"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SiteCanvas, type SiteArtboard } from "@/components/site-canvas/site-canvas";
import type { DesignSystemArtboardData } from "@/components/site-canvas/design-system-artboard";
import { PreviewOverlay } from "@/components/site-canvas/preview-overlay";
import { AnalogPanel } from "@/components/site-canvas/analog-panel";
import { PublishModal } from "@/components/site-canvas/publish-modal";
import { normalizeGenerationError } from "@/lib/site-generation/error-normalize";

// /studio/sites/generating — the generation theater.
//
// Reference: Google Stitch. Floating chat card on the left, canvas
// with design-system artboard + cursor-drawn page artboard in the
// center, minimal top toolbar, right icon rail, bottom composer.

type BrandFacts = {
  brandName: string | null;
  palette: Array<{ hex: string; role: string }>;
  typefaces: { display: string | null; body: string | null } | null;
  testimonialsFound: number;
  verticals: string[];
};

type PipelineStatus = {
  liveMessage: string | null;
  bytes: number;
  startedAt: number;
  brandFacts: BrandFacts | null;
  isDone: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
};

// Steps in the generation pipeline — feeds AnalogPanel's Steps list.
type StepPhase = "read" | "draft" | "style" | "render" | "done";

// Byte thresholds that advance the phase stepper past 'draft' into
// 'style' then 'render'. Rough — the point is a live sense of progress.
const BYTES_DRAFT_END = 30_000;
const BYTES_STYLE_END = 55_000;

export default function GeneratingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const jobId = params.get("jobId");

  const [artboards, setArtboards] = useState<SiteArtboard[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<PipelineStatus>({
    liveMessage: "warming up",
    bytes: 0,
    startedAt: Date.now(),
    brandFacts: null,
    isDone: false,
  });
  const [projectTitle, setProjectTitle] = useState<string>("Marketing Landing Page");
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const streamStartedRef = useRef(false);

  // Derive stepper phase from bytes during generation.
  const derivedPhase: StepPhase | "idle" = (() => {
    if (status.isDone) return "done";
    if (!status.brandFacts && status.bytes === 0) return "read";
    if (status.bytes >= BYTES_STYLE_END) return "render";
    if (status.bytes >= BYTES_DRAFT_END) return "style";
    if (status.brandFacts || status.bytes > 0) return "draft";
    return "read";
  })();

  // Grab the finished job id (if any) for the Preview overlay iframe.
  const readyJobId =
    artboards
      .filter((a): a is Extract<SiteArtboard, { kind: "page" }> => a.kind === "page")
      .find((a) => a.status === "done" && a.jobId)?.jobId ?? null;

  // Ambient accent — reused by the atmosphere layer and the panel.
  const ambientAccent =
    status.brandFacts?.palette.find((c) => c.role === "primary")?.hex ??
    status.brandFacts?.palette[0]?.hex ??
    "#8b5cf6";

  useEffect(() => {
    if (!jobId) {
      setError("Missing job id — start again from the composer.");
      return;
    }
    if (streamStartedRef.current) return;
    streamStartedRef.current = true;

    // Seed the chat with the user's brief + agent's opening line.
    setChat([
      {
        id: "u-1",
        role: "user",
        text: "A page for my site",
      },
      {
        id: "a-1",
        role: "agent",
        text:
          "I'll begin by reading your existing site and building the design system — palette, typography, and component styles. Once that's in place I'll draft the full page section by section.",
      },
    ]);

    setStatus((prev) => ({ ...prev, startedAt: Date.now(), liveMessage: "reading your site" }));

    const es = new EventSource(`/api/sites/generate?jobId=${jobId}`);

    es.addEventListener("status", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as {
        status: string;
        phase: string | null;
        phaseMessage: string | null;
        phaseProgress: Record<string, unknown> | null;
        ready: boolean;
        bytes: number | null;
      };

      if (data.phase === "done") return;

      // ---------------------------------------------
      // Ingest complete: drop design-system artboard
      // ---------------------------------------------
      if (data.phase === "ingest.done" && data.phaseProgress) {
        const p = data.phaseProgress as {
          brandName?: string | null;
          palette?: Array<{ hex: string; role: string }>;
          typefaces?: { display?: string | null; body?: string | null };
          testimonialsFound?: number;
          verticals?: string[];
        };
        if (p.brandName) {
          setProjectTitle(p.brandName);
        }
        const paletteHex =
          p.palette?.find((c) => c.role === "primary")?.hex ??
          p.palette?.[0]?.hex ??
          null;

        const dsData: DesignSystemArtboardData = {
          systemName: `${p.brandName ?? "Site"} Design System`,
          palette: p.palette ?? [],
          typefaces: p.typefaces
            ? { display: p.typefaces.display ?? null, body: p.typefaces.body ?? null }
            : null,
        };

        setStatus((prev) => ({
          ...prev,
          liveMessage: "building your design system",
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

        // Add agent chat line about the design system.
        setChat((prev) => [
          ...prev,
          {
            id: `a-ds-${Date.now()}`,
            role: "agent",
            text: `I've extracted your brand system — ${p.palette?.length ?? 0} palette colors${p.typefaces?.display ? `, ${p.typefaces.display} typography` : ""}. Now drafting the page.`,
          },
        ]);

        // Spawn the design-system artboard, and update the page
        // artboard with paletteHex for its cursor + gradient.
        setArtboards((prev) => {
          const hasDS = prev.some((a) => a.kind === "design-system");
          const dsBoard: SiteArtboard = {
            id: "ds-1",
            kind: "design-system",
            title: dsData.systemName,
            data: dsData,
          };
          const updated = prev.map((a) =>
            a.kind === "page" && a.pageId === "home"
              ? { ...a, paletteHex, title: p.brandName ?? a.title }
              : a,
          );
          if (hasDS) return updated;
          // Insert design-system BEFORE page artboard.
          const idx = updated.findIndex((a) => a.kind === "page");
          if (idx < 0) return [dsBoard, ...updated];
          return [...updated.slice(0, idx), dsBoard, ...updated.slice(idx)];
        });
        return;
      }

      if (data.phase === "ingest.skipped") {
        setStatus((prev) => ({ ...prev, liveMessage: "drafting from your brief" }));
        return;
      }

      if (data.phase === "generate.progress") {
        const bytes = (data.phaseProgress as { chars?: number } | null)?.chars ?? data.bytes ?? 0;
        setStatus((prev) => ({
          ...prev,
          bytes,
          liveMessage: verbForBytes(bytes),
        }));
        setArtboards((prev) =>
          prev.map((a) =>
            a.kind === "page" && a.pageId === "home"
              ? { ...a, bytes, phase: "generate.progress" }
              : a,
          ),
        );
        return;
      }

      if (data.phase === "generate") {
        setStatus((prev) => ({ ...prev, liveMessage: "sketching structure" }));
        return;
      }

      if (data.phase === "ingest" || data.phase === "images") {
        setStatus((prev) => ({
          ...prev,
          liveMessage: data.phase === "ingest" ? "reading your site" : "picking images",
        }));
        return;
      }
    });

    es.addEventListener("generation.done", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { siteId: string };
      setArtboards((prev) =>
        prev.map((a) =>
          a.kind === "page" && a.pageId === "home"
            ? { ...a, status: "done" as const, jobId: data.siteId }
            : a,
        ),
      );
      setStatus((prev) => ({ ...prev, liveMessage: null, isDone: true }));
      setChat((prev) => [
        ...prev,
        {
          id: `a-done-${Date.now()}`,
          role: "agent",
          text: "Your site is ready. Iterate below or export.",
        },
      ]);
      es.close();
    });

    es.addEventListener("error", (e) => {
      try {
        const raw = (e as MessageEvent).data;
        if (raw) {
          const data = JSON.parse(raw as string) as { stage?: string; message?: string };
          const source = data.message ?? "Something went wrong.";
          // Belt-and-suspenders: runner already stores the friendly
          // version, but re-run through the normalizer here so raw API
          // JSON never reaches the panel even if the source changes.
          setError(normalizeGenerationError(source).userMessage);
        }
      } catch {
        /* normal close */
      }
    });

    // Seed the initial page artboard.
    setArtboards([
      {
        id: `page-home-${jobId}`,
        kind: "page",
        title: "Home",
        pageId: "home",
        status: "generating",
      },
    ]);

    return () => {
      es.close();
    };
  }, [jobId]);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: "#0a0a0f",
        color: "#f5f0e6",
        fontFamily: "var(--font-sans)",
      }}
    >
      <TopToolbar
        title={projectTitle}
        onExit={() => router.push("/studio/sites")}
        canPreview={!!readyJobId}
        onOpenPreview={() => setPreviewOpen(true)}
        canPublish={!!readyJobId}
        onOpenPublish={() => setPublishOpen(true)}
      />

      {/* Global keyframes reused across children */}
      <style>{`
        @keyframes wrks-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes wrks-border-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes wrks-halo-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes wrks-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }
        @keyframes wrks-pulse-bar {
          0%, 100% { opacity: 1; transform: scaleY(1); }
          50% { opacity: 0.5; transform: scaleY(0.7); }
        }
        @keyframes wrks-atmos-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-4%, 3%, 0) scale(1.08); }
        }
        @keyframes wrks-atmos-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(5%, -3%, 0) scale(1.1); }
        }
        @keyframes wrks-atmos-c {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
          50% { transform: translate3d(-3%, -4%, 0) scale(1.14); opacity: 0.85; }
        }
        @keyframes wrks-atmos-grain {
          0% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(-8px, 4px, 0); }
          50% { transform: translate3d(6px, -6px, 0); }
          75% { transform: translate3d(-4px, -3px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes wrks-theater-mote-a {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.35; }
          25% { opacity: 0.75; }
          50% { transform: translate3d(30px, -42px, 0); opacity: 0.55; }
          75% { opacity: 0.75; }
        }
        @keyframes wrks-theater-mote-b {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.3; }
          33% { opacity: 0.7; }
          50% { transform: translate3d(-28px, 36px, 0); opacity: 0.5; }
          66% { opacity: 0.7; }
        }
        @keyframes wrks-theater-mote-c {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.4; }
          40% { opacity: 0.8; }
          50% { transform: translate3d(38px, 26px, 0); opacity: 0.5; }
          60% { opacity: 0.8; }
        }
      `}</style>

      {/* Canvas fills the whole area below the toolbar. Left cards +
          right rail + bottom composer float ON TOP of it. */}
      <div className="flex-1 min-h-0 relative" style={{ background: "#0a0a0f" }}>
        <SiteCanvas artboards={artboards} />

        {/* Atmosphere — ambient light rig + grain + vignette + motes.
            Sits over the canvas but pointer-events: none so pan/zoom
            still work. Chrome (panels, composer) sits above at z:20. */}
        <TheaterAtmosphere accent={ambientAccent} />

        {/* Left floating analog editorial panel */}
        <LeftFloatingStack
          chat={chat}
          status={status}
          isDone={status.isDone}
          projectTitle={projectTitle}
          error={error}
          derivedPhase={derivedPhase}
        />

        {/* Right icon toolbar */}
        <RightTools />

        {/* Bottom composer — refinement enabled once generation is done */}
        <BottomComposer
          disabled={!status.isDone}
          jobId={readyJobId}
          onRefined={() => {
            // Simplest reliable refresh: reload the page so the canvas
            // re-fetches the updated HTML from the pages array. Losing
            // client state (preview overlay position, etc.) is acceptable
            // for launch v1 — page-level refresh will be replaced by a
            // targeted iframe-key bump in a follow-up.
            if (typeof window !== "undefined") window.location.reload();
          }}
        />
      </div>

      {/* Preview overlay (opens on top of everything when triggered) */}
      {previewOpen && readyJobId && (
        <PreviewOverlay
          jobId={readyJobId}
          brandName={projectTitle}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Publish modal — slug picker + subdomain */}
      {publishOpen && readyJobId && (
        <PublishModal
          jobId={readyJobId}
          brandName={projectTitle}
          onClose={() => setPublishOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// Top toolbar — minimal (hamburger + title + Export + Share + avatar)
// ============================================================
function TopToolbar({
  title,
  onExit,
  canPreview,
  onOpenPreview,
  canPublish,
  onOpenPublish,
}: {
  title: string;
  onExit: () => void;
  canPreview: boolean;
  onOpenPreview: () => void;
  canPublish: boolean;
  onOpenPublish: () => void;
}) {
  return (
    <div
      className="shrink-0 flex items-center justify-between"
      style={{
        padding: "12px 20px",
        background: "rgba(10,10,15,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-center" style={{ gap: 14 }}>
        <button
          type="button"
          onClick={onExit}
          aria-label="Menu"
          className="grid place-items-center transition-colors duration-150 hover:bg-white/[0.08]"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(245,240,230,0.85)",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.008em",
            color: "rgba(245,240,230,0.96)",
          }}
        >
          {title}
        </span>
      </div>

      <div className="flex items-center" style={{ gap: 8 }}>
        <ToolbarButton
          label="Preview"
          icon="preview"
          onClick={onOpenPreview}
          disabled={!canPreview}
        />
        <ToolbarButton
          label="Publish"
          icon="publish"
          onClick={onOpenPublish}
          disabled={!canPublish}
          primary={canPublish}
        />
        <ToolbarButton label="Export" icon="export" />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            marginLeft: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: "rgba(245,240,230,0.85)",
          }}
        >
          Y
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  icon,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  icon: "export" | "share" | "preview" | "publish";
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const style: React.CSSProperties = primary
    ? {
        padding: "7px 14px",
        gap: 7,
        borderRadius: 999,
        background: "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)",
        border: "1px solid rgba(255,255,255,0.14)",
        color: "#ffffff",
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: "-0.005em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        boxShadow: "0 6px 20px -6px rgba(167,139,250,0.55)",
      }
    : {
        padding: "7px 14px",
        gap: 7,
        borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(245,240,230,0.85)",
        fontSize: 12.5,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center transition-all duration-150 hover:brightness-110"
      style={style}
    >
      {icon === "preview" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : icon === "publish" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l7-7 7 7M12 5v14" />
        </svg>
      ) : icon === "export" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M16 6l-4-4-4 4M12 2v14" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
          <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
        </svg>
      )}
      {label}
    </button>
  );
}


// ============================================================
// Left floating stack — single editorial AnalogPanel
// ============================================================
const STEP_DEFS: Array<{ id: StepPhase; label: string }> = [
  { id: "read", label: "Read" },
  { id: "draft", label: "Draft" },
  { id: "style", label: "Style" },
  { id: "render", label: "Render" },
];

function LeftFloatingStack({
  chat,
  status,
  isDone,
  projectTitle,
  error,
  derivedPhase,
}: {
  chat: ChatMessage[];
  status: PipelineStatus;
  isDone: boolean;
  projectTitle: string;
  error: string | null;
  derivedPhase: StepPhase | "idle";
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    if (isDone) return;
    const t = setInterval(() => setElapsedMs(Date.now() - status.startedAt), 1000);
    return () => clearInterval(t);
  }, [isDone, status.startedAt]);

  const userPrompt = chat.find((m) => m.role === "user")?.text ?? "A page for my site";
  const agentReply = chat
    .filter((m) => m.role === "agent")
    .map((m) => m.text)
    .join("\n\n");

  // Brand purple fallback — matches WRKS accent. Ingested brand
  // palette still wins when we have one.
  const accent =
    status.brandFacts?.palette.find((c) => c.role === "primary")?.hex ??
    status.brandFacts?.palette[0]?.hex ??
    "#8b5cf6";

  // Steps derived from current phase.
  const activeIdx = STEP_DEFS.findIndex((s) => s.id === derivedPhase);
  const steps = STEP_DEFS.map((s, i) => ({
    id: s.id,
    label: s.label,
    state: (isDone
      ? "done"
      : i < activeIdx
      ? "done"
      : i === activeIdx
      ? "active"
      : "pending") as "pending" | "active" | "done",
  }));

  // Estimated remaining time from elapsed / progress.
  const EST_TOTAL_BYTES = 65_000;
  const progress = isDone
    ? 1
    : Math.min(0.98, Math.max(0.04, status.bytes / EST_TOTAL_BYTES));
  let estRemainingMs: number | null = null;
  if (!isDone && progress > 0.05 && elapsedMs > 3000) {
    const totalEstMs = elapsedMs / progress;
    estRemainingMs = Math.max(0, totalEstMs - elapsedMs);
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 20,
        pointerEvents: "auto",
        maxHeight: "calc(100% - 40px)",
      }}
    >
      <AnalogPanel
        projectTitle={truncate(projectTitle, 40)}
        userPrompt={userPrompt}
        agentReply={agentReply}
        liveVerb={status.liveMessage}
        bytes={status.bytes}
        estRemainingMs={estRemainingMs}
        elapsedMs={elapsedMs}
        isDone={isDone}
        steps={steps}
        accent={accent}
        error={error}
      />
    </div>
  );
}



// ============================================================
// Right icon toolbar (kept the vertical rail)
// ============================================================
function RightTools() {
  const tools = [
    { id: "cursor", d: "M4 4l7 20 3-9 9-3z" },
    { id: "marquee", d: "M4 4h4M20 4h-4M4 20h4M20 20h-4M4 12v-2M4 14v-2M12 4h-2M14 4h-2M20 12v-2M20 14v-2M12 20h-2M14 20h-2" },
    { id: "pen", d: "M4 20l4-1 11-11-3-3L5 16z" },
    { id: "hand", d: "M9 11V5a2 2 0 0 1 4 0v6M13 11V4a2 2 0 0 1 4 0v11a5 5 0 0 1-10 0V9" },
    { id: "image", d: "M4 6h16v12H4zM4 15l5-5 5 5 3-3 3 3" },
    { id: "palette", d: "M12 3a9 9 0 1 0 3 17.5c-1 0-2-1-2-2s.4-2 1-2h2a5 5 0 0 0 0-10h-4z" },
    { id: "star", d: "M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" },
  ] as const;
  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 4,
        borderRadius: 14,
        background: "rgba(20,20,28,0.85)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        zIndex: 20,
      }}
    >
      {tools.map((t, i) => (
        <button
          key={t.id}
          type="button"
          aria-label={t.id}
          className="grid place-items-center transition-colors duration-150 hover:bg-white/[0.08]"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: i === 0 ? "rgba(255,255,255,0.08)" : "transparent",
            color: i === 0 ? "rgba(245,240,230,0.95)" : "rgba(245,240,230,0.55)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d={t.d} />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Bottom composer — pill + / commands + model + mic + send
// ============================================================
const QUICK_ACTIONS: Array<{ id: string; label: string; prefill: string }> = [
  { id: "dark", label: "Make it dark mode", prefill: "Rework the site in dark mode with the same brand accents." },
  { id: "pricing", label: "Add a pricing section", prefill: "Add a pricing section with 3 tiers below the reviews section." },
  { id: "hero", label: "Change the hero headline", prefill: "Rewrite the hero headline to be shorter and punchier." },
];

function BottomComposer({
  disabled,
  jobId,
  onRefined,
}: {
  disabled: boolean;
  jobId: string | null;
  onRefined: () => void;
}) {
  const [prefill, setPrefill] = useState<string>("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const canRefine = !disabled && !refining && !!jobId && prefill.trim().length >= 3;

  const submitRefinement = async () => {
    if (!canRefine || !jobId) return;
    setRefining(true);
    setRefineError(null);
    try {
      const res = await fetch("/api/sites/refine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobId,
          pagePath: "/", // Ship 4B v1: refine home only; page-selector coming later
          instruction: prefill.trim(),
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setRefineError(data.error ?? "Refinement failed — try again.");
        setRefining(false);
        return;
      }
      setPrefill("");
      setRefining(false);
      onRefined();
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Refinement failed.");
      setRefining(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 20,
        width: "min(720px, calc(100% - 400px))",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
      }}
    >
      {!disabled && !refining && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {QUICK_ACTIONS.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setPrefill(a.prefill)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(20,20,28,0.85)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(245,240,230,0.85)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
                cursor: "pointer",
                transition: "background 150ms, border-color 150ms",
              }}
            >
              {a.label}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.04em",
                  color: "rgba(245,240,230,0.4)",
                  paddingLeft: 4,
                  borderLeft: "1px solid rgba(255,255,255,0.08)",
                  marginLeft: 4,
                }}
              >
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {refineError && (
        <div
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(255,120,110,0.1)",
            border: "1px solid rgba(255,120,110,0.2)",
            color: "#ff9d98",
            fontSize: 12,
            letterSpacing: "-0.003em",
          }}
        >
          {refineError}
        </div>
      )}

      <div
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 18,
          background: "rgba(20,20,28,0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px -20px rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <input
          type="text"
          value={prefill}
          onChange={(e) => setPrefill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && canRefine) {
              e.preventDefault();
              void submitRefinement();
            }
          }}
          placeholder={
            disabled
              ? "Agent is drafting — hang on…"
              : refining
              ? "Refining your home page — this takes 60-90 seconds…"
              : "Ask for a change — e.g. 'make the hero shorter'"
          }
          disabled={disabled || refining}
          className="w-full bg-transparent outline-none"
          style={{
            padding: "4px 6px",
            fontSize: 14,
            letterSpacing: "-0.005em",
            color: "rgba(245,240,230,0.95)",
          }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: 4 }}>
            {["+", "/"].map((c) => (
              <button
                key={c}
                type="button"
                className="grid place-items-center transition-colors duration-150 hover:bg-white/[0.08]"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: "transparent",
                  color: "rgba(245,240,230,0.55)",
                  fontSize: 15,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center" style={{ gap: 6 }}>
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 11.5,
                fontWeight: 500,
                color: "rgba(245,240,230,0.85)",
                letterSpacing: "-0.003em",
                cursor: "pointer",
              }}
            >
              Opus 4.7
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Voice"
              className="grid place-items-center transition-colors duration-150 hover:bg-white/[0.08]"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                color: "rgba(245,240,230,0.75)",
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
              aria-label={refining ? "Refining…" : "Send refinement"}
              disabled={!canRefine}
              onClick={submitRefinement}
              className="grid place-items-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: canRefine ? "#ffffff" : "rgba(255,255,255,0.06)",
                color: canRefine ? "#0a0a0f" : "rgba(245,240,230,0.35)",
                border: "none",
                cursor: canRefine ? "pointer" : "not-allowed",
              }}
            >
              {refining ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "wrks-spin 800ms linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Theater atmosphere — ambient light rig, grain, vignette, motes.
// Every layer is pointer-events: none so the canvas stays interactive.
// ============================================================
const THEATER_MOTES: Array<{
  left: string;
  top: string;
  size: number;
  dir: "a" | "b" | "c";
  dur: number;
  delay: number;
}> = [
  { left: "14%", top: "20%", size: 3, dir: "a", dur: 68, delay: 0 },
  { left: "82%", top: "24%", size: 2, dir: "b", dur: 82, delay: 6 },
  { left: "28%", top: "72%", size: 3, dir: "c", dur: 74, delay: 12 },
  { left: "68%", top: "78%", size: 2, dir: "a", dur: 90, delay: 3 },
  { left: "48%", top: "44%", size: 2, dir: "b", dur: 62, delay: 18 },
  { left: "58%", top: "14%", size: 2, dir: "c", dur: 78, delay: 9 },
  { left: "18%", top: "50%", size: 3, dir: "b", dur: 85, delay: 22 },
  { left: "88%", top: "58%", size: 2, dir: "a", dur: 71, delay: 15 },
];

function TheaterAtmosphere({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 5,
      }}
    >
      {/* Warm gold — top-right corner glow */}
      <div
        style={{
          position: "absolute",
          top: "-25%",
          right: "-15%",
          width: "70vw",
          height: "70vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${withAlpha("#e8c785", 0.16)} 0%, transparent 65%)`,
          filter: "blur(120px)",
          mixBlendMode: "screen",
          animation: "wrks-atmos-a 42s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Brand purple — bottom-left corner glow (dominant) */}
      <div
        style={{
          position: "absolute",
          bottom: "-25%",
          left: "-15%",
          width: "75vw",
          height: "75vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${withAlpha(accent, 0.22)} 0%, transparent 65%)`,
          filter: "blur(140px)",
          mixBlendMode: "screen",
          animation: "wrks-atmos-b 55s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Cool violet — mid-canvas ambient wash */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "32%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${withAlpha("#4c3d8f", 0.14)} 0%, transparent 60%)`,
          filter: "blur(160px)",
          mixBlendMode: "screen",
          animation: "wrks-atmos-c 68s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />

      {/* Film grain — barely perceptible, drifts to break up static feel */}
      <div
        style={{
          position: "absolute",
          inset: "-4%",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.96  0 0 0 0 0.94  0 0 0 0 0.9  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          opacity: 0.05,
          mixBlendMode: "overlay",
          animation: "wrks-atmos-grain 24s steps(6) infinite",
        }}
      />

      {/* Vignette — soft edge darkening pulls focus to center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Dust motes — 8 particles drifting on independent cycles */}
      {THEATER_MOTES.map((m, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${withAlpha(accent, 0.65)} 0%, transparent 70%)`,
            boxShadow: `0 0 6px ${withAlpha(accent, 0.4)}`,
            animation: `wrks-theater-mote-${m.dir} ${m.dur}s ease-in-out infinite`,
            animationDelay: `${m.delay}s`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const expanded =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const bigint = parseInt(expanded, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
