"use client";

// Full-viewport preview mode — opens the generated site in a clean
// browser-chrome frame with device-size toggles (Desktop / Tablet /
// Mobile), refresh, open-in-new-tab, and close. Standard pattern
// from v0 / Lovable / Bolt / Framer AI.
//
// Opens on top of the studio theater. ESC closes.

import { useEffect, useRef, useState } from "react";

type Device = "desktop" | "tablet" | "mobile";

type Props = {
  jobId: string;
  brandName: string | null;
  onClose: () => void;
};

const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 1440,
  tablet: 834,
  mobile: 390,
};

const DEVICE_HEIGHTS: Record<Device, number | "auto"> = {
  desktop: 900,
  tablet: 1194,
  mobile: 844,
};

type PageSummary = { path: string; title: string };

export function PreviewOverlay({ jobId, brandName, onClose }: Props) {
  const [device, setDevice] = useState<Device>("desktop");
  const [reloadKey, setReloadKey] = useState(0);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build the iframe src — home page has no ?path=, other pages include it.
  const src =
    currentPath === "/"
      ? `/api/sites/render/${encodeURIComponent(jobId)}`
      : `/api/sites/render/${encodeURIComponent(jobId)}?path=${encodeURIComponent(currentPath)}`;
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}${src}` : src;

  // Fetch the pages list on mount so we can show tabs for multi-page sites.
  // Single-page sites (legacy or 1-page results) get an empty array and
  // we hide the tab bar.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sites/pages/${encodeURIComponent(jobId)}`)
      .then((r) => r.json())
      .then((d: { pages?: PageSummary[] }) => {
        if (!cancelled && d.pages) setPages(d.pages);
      })
      .catch(() => {
        /* silent — tab bar just stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const width = DEVICE_WIDTHS[device];
  const height = DEVICE_HEIGHTS[device];
  const hasMultiplePages = pages.length > 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        // Subtle dotted grid matching the studio canvas
        backgroundImage:
          "radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        animation: "wrks-preview-in 260ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top browser chrome bar */}
      <div
        style={{
          flexShrink: 0,
          height: 56,
          padding: "0 16px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 16,
          background: "rgba(20,20,28,0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Left: back + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconButton onClick={onClose} label="Back to editor">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </IconButton>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: "rgba(245,240,230,0.9)",
                letterSpacing: "-0.005em",
              }}
            >
              {brandName ?? "Preview"}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.06em",
                color: "rgba(245,240,230,0.4)",
                textTransform: "uppercase",
              }}
            >
              Preview mode · {device} · {width}px
            </span>
          </div>
        </div>

        {/* Center: device toggle */}
        <div
          role="group"
          aria-label="Device size"
          style={{
            display: "inline-flex",
            gap: 2,
            padding: 3,
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <DeviceButton active={device === "desktop"} onClick={() => setDevice("desktop")} label="Desktop">
            <DesktopIcon />
          </DeviceButton>
          <DeviceButton active={device === "tablet"} onClick={() => setDevice("tablet")} label="Tablet">
            <TabletIcon />
          </DeviceButton>
          <DeviceButton active={device === "mobile"} onClick={() => setDevice("mobile")} label="Mobile">
            <MobileIcon />
          </DeviceButton>
        </div>

        {/* Right: refresh + open in new tab + close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <IconButton onClick={() => setReloadKey((k) => k + 1)} label="Reload preview">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </IconButton>
          <IconButton onClick={() => window.open(publicUrl, "_blank")} label="Open in new tab">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </IconButton>
          <IconButton onClick={onClose} label="Close preview">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Page tab bar — only when the site has multiple pages */}
      {hasMultiplePages && (
        <div
          role="tablist"
          aria-label="Site pages"
          style={{
            flexShrink: 0,
            display: "flex",
            gap: 4,
            padding: "8px 20px",
            background: "rgba(20,20,28,0.5)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            overflowX: "auto",
          }}
        >
          {pages.map((p) => {
            const active = p.path === currentPath;
            return (
              <button
                key={p.path}
                role="tab"
                aria-selected={active}
                onClick={() => setCurrentPath(p.path)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "rgba(245,240,230,0.95)" : "rgba(245,240,230,0.55)",
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 500,
                  letterSpacing: "-0.003em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 150ms, color 150ms",
                }}
              >
                {p.title}
                <span
                  style={{
                    marginLeft: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "rgba(245,240,230,0.35)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {p.path}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Preview area — iframe centered at device dims */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: "32px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width,
            maxWidth: "100%",
            height: height === "auto" ? "auto" : `min(${height}px, calc(100vh - 120px))`,
            minHeight: 400,
            borderRadius: device === "desktop" ? 14 : 24,
            overflow: "hidden",
            background: "#ffffff",
            boxShadow:
              "0 60px 140px -40px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
            transition: "width 400ms cubic-bezier(0.4, 0, 0.2, 1), border-radius 400ms",
          }}
        >
          <iframe
            key={`${reloadKey}-${currentPath}`}
            ref={iframeRef}
            src={src}
            title="Site preview"
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              display: "block",
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>

      <style>{`
        @keyframes wrks-preview-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Primitives
// ============================================================

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid place-items-center transition-colors duration-150 hover:bg-white/[0.08]"
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(245,240,230,0.85)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function DeviceButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid place-items-center transition-all duration-150"
      style={{
        width: 32,
        height: 28,
        borderRadius: 7,
        background: active ? "rgba(255,255,255,0.1)" : "transparent",
        color: active ? "rgba(245,240,230,0.95)" : "rgba(245,240,230,0.5)",
        border: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function DesktopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  );
}
