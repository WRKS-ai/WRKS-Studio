"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { suggestSlug, validateSlug } from "@/lib/published-sites/slugs";

// Publish modal — takes a finished generation and publishes it to
// {slug}.wrksstudio.com. Auto-suggests a slug from the brand name.
// Live-checks availability with a 350ms debounce.
//
// Labels differentiate between users who already have a real site
// (this is a preview URL, not a replacement) vs users starting fresh
// (this IS their live site). Pulled from /api/me/site-intent on mount.

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; mine?: boolean }
  | { status: "unavailable"; reason: string };

type SiteIntent = "has_site" | "no_site" | null;

export function PublishModal({
  jobId,
  brandName,
  onClose,
}: {
  jobId: string;
  brandName: string;
  onClose: () => void;
}) {
  const [slug, setSlug] = useState<string>(() => suggestSlug(brandName || "site"));
  const [check, setCheck] = useState<CheckState>({ status: "idle" });
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [siteIntent, setSiteIntent] = useState<SiteIntent>(null);
  const debounceRef = useRef<number | null>(null);

  // Fetch site intent once on mount so we can swap labels.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/site-intent")
      .then((r) => r.json())
      .then((d: { siteIntent?: SiteIntent }) => {
        if (!cancelled) setSiteIntent(d.siteIntent ?? null);
      })
      .catch(() => {
        /* leave as null — labels fall back to neutral */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runCheck = useCallback((next: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const localReason = validateSlug(next);
    if (localReason) {
      setCheck({ status: "unavailable", reason: localReason });
      return;
    }
    setCheck({ status: "checking" });
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/sites/slug-check?slug=${encodeURIComponent(next)}`);
        const data = (await r.json()) as { available: boolean; reason?: string; mine?: boolean };
        if (data.available) {
          setCheck({ status: "available", mine: data.mine });
        } else {
          setCheck({ status: "unavailable", reason: data.reason ?? "Not available." });
        }
      } catch {
        setCheck({ status: "unavailable", reason: "Couldn't reach the server." });
      }
    }, 350);
  }, []);

  useEffect(() => {
    runCheck(slug);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [slug, runCheck]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canPublish =
    !publishing && !publishedUrl && check.status === "available";

  const isPreview = siteIntent === "has_site";
  const primaryLabel = publishing
    ? "Publishing…"
    : check.status === "available" && check.mine
    ? isPreview
      ? "Update preview"
      : "Republish"
    : isPreview
    ? "Publish preview"
    : "Publish live";
  const successHeading = isPreview ? "Your preview is live" : "Your site is live";
  const successSubcopy = isPreview
    ? "Share this preview link. Your existing site is untouched."
    : "Share this link — anyone with it can see your site.";
  const introHeading = isPreview ? "Publish a preview" : "Publish your site";
  const introSubcopy = isPreview
    ? "Pick a preview address. Your live site stays exactly as it is."
    : "Pick a subdomain. Your site will be live in seconds.";

  async function handlePublish() {
    if (!canPublish) return;
    setPublishing(true);
    setError(null);
    try {
      const r = await fetch("/api/sites/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId, slug, brandName }),
      });
      const data = (await r.json()) as { url?: string; error?: string; detail?: string };
      if (!r.ok || !data.url) {
        setError(data.detail ?? data.error ?? "Publish failed.");
      } else {
        setPublishedUrl(data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setPublishing(false);
    }
  }

  async function copyUrl() {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "rgba(4,4,8,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "wrks-publish-fade 200ms ease-out",
      }}
    >
      <style>{`
        @keyframes wrks-publish-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wrks-publish-lift {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, calc(100% - 32px))",
          background: "rgba(18,17,22,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          padding: "24px 24px 22px",
          color: "rgba(245,240,230,0.95)",
          fontFamily: "var(--font-sans)",
          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4)",
          animation: "wrks-publish-lift 240ms ease-out",
        }}
      >
        {!publishedUrl ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {introHeading}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "rgba(245,240,230,0.55)",
                  letterSpacing: "-0.003em",
                }}
              >
                {introSubcopy}
              </span>
            </div>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(245,240,230,0.6)",
                marginBottom: 8,
                letterSpacing: "-0.003em",
              }}
            >
              Address
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${borderColorForCheck(check)}`,
                transition: "border-color 150ms",
                overflow: "hidden",
              }}
            >
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="your-site"
                autoFocus
                className="bg-transparent outline-none"
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "rgba(245,240,230,0.95)",
                  letterSpacing: "-0.005em",
                }}
              />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 14px",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "rgba(245,240,230,0.5)",
                  letterSpacing: "-0.003em",
                  background: "rgba(255,255,255,0.03)",
                  borderLeft: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                .wrksstudio.com
              </span>
            </div>

            <div
              style={{
                marginTop: 8,
                minHeight: 18,
                fontSize: 12,
                color: statusColor(check),
                letterSpacing: "-0.003em",
              }}
            >
              {statusMessage(check)}
            </div>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(255,120,110,0.08)",
                  border: "1px solid rgba(255,120,110,0.16)",
                  fontSize: 12.5,
                  color: "#ff9d98",
                  letterSpacing: "-0.003em",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 22,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "9px 16px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(245,240,230,0.75)",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={!canPublish}
                style={{
                  padding: "9px 18px",
                  borderRadius: 999,
                  background: canPublish ? "#ffffff" : "rgba(255,255,255,0.08)",
                  color: canPublish ? "#0a0a0f" : "rgba(245,240,230,0.35)",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                  cursor: canPublish ? "pointer" : "not-allowed",
                  transition: "background 150ms, color 150ms",
                }}
              >
                {primaryLabel}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {successHeading}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "rgba(245,240,230,0.55)",
                  letterSpacing: "-0.003em",
                }}
              >
                {successSubcopy}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(245,240,230,0.95)",
                  letterSpacing: "-0.005em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {publishedUrl}
              </span>
              <button
                type="button"
                onClick={copyUrl}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(245,240,230,0.9)",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "-0.003em",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "9px 16px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(245,240,230,0.75)",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "9px 18px",
                  borderRadius: 999,
                  background: "#ffffff",
                  color: "#0a0a0f",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Open site
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function borderColorForCheck(c: CheckState): string {
  switch (c.status) {
    case "available":
      return "rgba(120, 220, 160, 0.4)";
    case "unavailable":
      return "rgba(255, 120, 110, 0.35)";
    case "checking":
      return "rgba(255,255,255,0.14)";
    default:
      return "rgba(255,255,255,0.08)";
  }
}

function statusColor(c: CheckState): string {
  switch (c.status) {
    case "available":
      return "rgba(120, 220, 160, 0.9)";
    case "unavailable":
      return "rgba(255, 157, 152, 0.9)";
    case "checking":
      return "rgba(245,240,230,0.55)";
    default:
      return "rgba(245,240,230,0.4)";
  }
}

function statusMessage(c: CheckState): string {
  switch (c.status) {
    case "available":
      return c.mine ? "You already own this — publishing will update it." : "Available";
    case "unavailable":
      return c.reason;
    case "checking":
      return "Checking…";
    default:
      return " ";
  }
}
