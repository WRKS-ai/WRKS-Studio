"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SiteCanvas, type SiteArtboard } from "@/components/site-canvas/site-canvas";
import type { DesignSystemArtboardData } from "@/components/site-canvas/design-system-artboard";

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
  const streamStartedRef = useRef(false);

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
      <TopToolbar title={projectTitle} onExit={() => router.push("/studio/sites")} />

      {/* Global keyframes reused across children */}
      <style>{`
        @keyframes wrks-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Canvas fills the whole area below the toolbar. Left cards +
          right rail + bottom composer float ON TOP of it. */}
      <div className="flex-1 min-h-0 relative">
        <SiteCanvas artboards={artboards} />

        {/* Left floating chat + agent-log stack */}
        <LeftFloatingStack
          chat={chat}
          status={status}
          isDone={status.isDone}
          projectTitle={projectTitle}
          error={error}
        />

        {/* Right icon toolbar */}
        <RightTools />

        {/* Bottom composer */}
        <BottomComposer disabled={!status.isDone} />
      </div>
    </div>
  );
}

// ============================================================
// Top toolbar — minimal (hamburger + title + Export + Share + avatar)
// ============================================================
function TopToolbar({ title, onExit }: { title: string; onExit: () => void }) {
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
        <ToolbarButton label="Export" icon="export" />
        <ToolbarButton label="Share" icon="share" />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #a78bfa, #ec4899)",
            marginLeft: 6,
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        />
      </div>
    </div>
  );
}

function ToolbarButton({ label, icon }: { label: string; icon: "export" | "share" }) {
  return (
    <button
      type="button"
      className="inline-flex items-center transition-colors duration-150 hover:bg-white/[0.08]"
      style={{
        padding: "7px 14px",
        gap: 7,
        borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(245,240,230,0.85)",
        fontSize: 12.5,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        cursor: "pointer",
      }}
    >
      {icon === "export" ? (
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
// Left floating stack — chat card + active job pill + agent log
// ============================================================
function LeftFloatingStack({
  chat,
  status,
  isDone,
  projectTitle,
  error,
}: {
  chat: ChatMessage[];
  status: PipelineStatus;
  isDone: boolean;
  projectTitle: string;
  error: string | null;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    if (isDone) return;
    const t = setInterval(() => setElapsedMs(Date.now() - status.startedAt), 1000);
    return () => clearInterval(t);
  }, [isDone, status.startedAt]);

  const userPrompt = chat.find((m) => m.role === "user")?.text ?? "A page for my site";
  const agentReply = chat.filter((m) => m.role === "agent").map((m) => m.text).join("\n\n");

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        width: 320,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 20,
        pointerEvents: "auto",
        maxHeight: "calc(100% - 40px)",
      }}
    >
      <ChatCard
        userPrompt={userPrompt}
        agentReply={agentReply}
        liveMessage={status.liveMessage}
        isDone={isDone}
      />

      {/* Job progress pill */}
      <JobStatusPill
        title={truncate(projectTitle, 32)}
        isDone={isDone}
        elapsedMs={elapsedMs}
      />

      {/* Agent log collapsed footer */}
      <AgentLogFooter status={status} isDone={isDone} />

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(255,120,110,0.08)",
            border: "1px solid rgba(255,120,110,0.16)",
            fontSize: 12.5,
            color: "#ff9d98",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function ChatCard({
  userPrompt,
  agentReply,
  liveMessage,
  isDone,
}: {
  userPrompt: string;
  agentReply: string;
  liveMessage: string | null;
  isDone: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        padding: 1,
        background:
          "linear-gradient(135deg, rgba(167,139,250,0.5), rgba(236,72,153,0.35), rgba(96,165,250,0.5))",
        boxShadow:
          "0 20px 60px -20px rgba(120,90,255,0.35), 0 0 0 1px rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          borderRadius: 19,
          background: "rgba(15,15,22,0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          padding: "14px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Header: three dots */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              gap: 3,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ width: 3, height: 3, borderRadius: 999, background: "rgba(245,240,230,0.6)" }}
              />
            ))}
          </div>
        </div>

        {/* Prompt pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #a78bfa, #ec4899)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12.5,
              color: "rgba(245,240,230,0.85)",
              letterSpacing: "-0.005em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {userPrompt}
          </span>
          <button
            type="button"
            aria-label="Copy"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "transparent",
              border: "none",
              color: "rgba(245,240,230,0.5)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="More"
            style={{
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: "rgba(245,240,230,0.5)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Agent reply — streams in */}
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13.5,
            lineHeight: 1.55,
            letterSpacing: "-0.003em",
            color: "rgba(245,240,230,0.9)",
            whiteSpace: "pre-wrap",
            overflowY: "auto",
            maxHeight: 360,
          }}
        >
          {agentReply}
        </div>

        {/* Live status line */}
        {!isDone && liveMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingTop: 4,
              borderTop: "1px solid rgba(255,255,255,0.04)",
              marginTop: 2,
            }}
          >
            <Spinner />
            <span
              style={{
                fontSize: 12,
                fontStyle: "italic",
                color: "rgba(245,240,230,0.6)",
                letterSpacing: "-0.003em",
              }}
            >
              {liveMessage}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function JobStatusPill({
  title,
  isDone,
  elapsedMs,
}: {
  title: string;
  isDone: boolean;
  elapsedMs: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 999,
        background: "rgba(20,20,28,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {isDone ? <CheckmarkIcon /> : <Spinner size="sm" />}
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: "rgba(245,240,230,0.9)",
          letterSpacing: "-0.005em",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "rgba(245,240,230,0.4)",
          letterSpacing: "0.04em",
        }}
      >
        {formatElapsed(elapsedMs)}
      </span>
    </div>
  );
}

function AgentLogFooter({ status, isDone }: { status: PipelineStatus; isDone: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        borderRadius: 14,
        background: "rgba(20,20,28,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
        style={{
          padding: "12px 14px",
          background: "transparent",
          border: "none",
          color: "rgba(245,240,230,0.85)",
          fontSize: 12.5,
          fontWeight: 500,
          cursor: "pointer",
          letterSpacing: "-0.005em",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RocketIcon />
          Agent log
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms",
          }}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      {expanded && (
        <div
          style={{
            padding: "0 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "rgba(245,240,230,0.55)",
            letterSpacing: "0.02em",
          }}
        >
          <LogRow label="Read" done />
          <LogRow label="Design system" done={!!status.brandFacts} />
          <LogRow label="Draft" done={isDone} />
          <LogRow label="Render" done={isDone} />
        </div>
      )}
    </div>
  );
}

function LogRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {done ? (
        <CheckmarkIcon />
      ) : (
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            border: "1px solid rgba(245,240,230,0.2)",
          }}
        />
      )}
      <span>{label}</span>
    </div>
  );
}

// ============================================================
// Right icon toolbar (kept the vertical rail from Stitch reference)
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
// Bottom composer — clean pill (input + / + mic + model + send)
// ============================================================
function BottomComposer({ disabled }: { disabled: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 20,
        width: "min(720px, calc(100% - 400px))",
        zIndex: 20,
      }}
    >
      <div
        style={{
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
          placeholder={
            disabled ? "Agent is drafting — hang on…" : "What would you like to change or create?"
          }
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
                gap: 4,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 11.5,
                fontWeight: 500,
                color: "rgba(245,240,230,0.75)",
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
// Icons + helpers
// ============================================================

function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? 10 : 12;
  return (
    <span
      style={{
        display: "inline-block",
        width: dim,
        height: dim,
        borderRadius: "50%",
        border: `1.5px solid rgba(245,240,230,0.15)`,
        borderTopColor: "rgba(245,240,230,0.85)",
        animation: "wrks-spin 900ms linear infinite",
      }}
    />
  );
}

function CheckmarkIcon() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "rgba(120,220,140,0.16)",
        border: "1px solid rgba(120,220,140,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(120,220,140,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

function RocketIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

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

function formatElapsed(ms: number): string {
  if (ms < 1000) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
