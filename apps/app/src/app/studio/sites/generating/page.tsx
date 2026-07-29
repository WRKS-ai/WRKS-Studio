"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SiteCanvas, type SiteArtboard } from "@/components/site-canvas/site-canvas";
import type { DesignSystemArtboardData } from "@/components/site-canvas/design-system-artboard";
import { PreviewOverlay } from "@/components/site-canvas/preview-overlay";
import { AnalogPanel } from "@/components/site-canvas/analog-panel";

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
          const data = JSON.parse(raw as string) as { stage: string; message: string };
          setError(`${data.stage}: ${data.message}`);
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
      `}</style>

      {/* Canvas fills the whole area below the toolbar. Left cards +
          right rail + bottom composer float ON TOP of it. */}
      <div className="flex-1 min-h-0 relative">
        <SiteCanvas artboards={artboards} />

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

        {/* Bottom composer */}
        <BottomComposer disabled={!status.isDone} />
      </div>

      {/* Preview overlay (opens on top of everything when triggered) */}
      {previewOpen && readyJobId && (
        <PreviewOverlay
          jobId={readyJobId}
          brandName={projectTitle}
          onClose={() => setPreviewOpen(false)}
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
}: {
  title: string;
  onExit: () => void;
  canPreview: boolean;
  onOpenPreview: () => void;
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
          primary={canPreview}
        />
        <ToolbarButton label="Export" icon="export" />
        <ToolbarButton label="Share" icon="share" />
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
  icon: "export" | "share" | "preview";
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

  // Warm cream fallback — no hue. Brand palette wins when ingested.
  const accent =
    status.brandFacts?.palette.find((c) => c.role === "primary")?.hex ??
    status.brandFacts?.palette[0]?.hex ??
    "#f5f0e6";

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

function BottomComposer({ disabled }: { disabled: boolean }) {
  const [prefill, setPrefill] = useState<string>("");
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
      {!disabled && (
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
          placeholder={disabled ? "Agent is drafting — hang on…" : "What would you like to change or create?"}
          disabled={disabled}
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
              aria-label="Send"
              disabled={disabled}
              className="grid place-items-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: disabled ? "rgba(255,255,255,0.06)" : "#ffffff",
                color: disabled ? "rgba(245,240,230,0.35)" : "#0a0a0f",
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
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
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
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
