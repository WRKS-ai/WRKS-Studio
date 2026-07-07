"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import DarkVeil from "@/components/dark-veil";

// Sites composer — the brief input for a new site. Voice-first product:
// text input primary + mic button on the right. On submit, POSTs to
// /api/sites/generate to kick off the job and redirects to the
// /studio/sites/generating theater with the job id.

type Props = {
  brandName: string | null;
  businessType: string | null;
  primaryGoal: string | null;
  voiceDescriptor: string | null;
  offerSummary: string | null;
  audienceDescription: string | null;
  differentiator: string | null;
  agentName: string | null;
};

const GOAL_HINT: Record<string, string> = {
  book_calls: "a landing page for booking discovery calls with your ideal client",
  sell_products: "a product page that converts browsers into buyers",
  capture_leads: "a lead-magnet page that grows your list",
  build_audience: "a personal-brand site that turns visitors into subscribers",
  launch_new: "a launch page for your next release, with a clear waitlist CTA",
  fix_conversions: "a rebuilt landing page with a sharper offer and cleaner CTA",
};

export function SitesComposer({
  brandName,
  businessType: _businessType,
  primaryGoal,
  voiceDescriptor: _voiceDescriptor,
  offerSummary,
  audienceDescription,
  differentiator,
  agentName,
}: Props) {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder = useMemo(() => {
    const example =
      (primaryGoal && GOAL_HINT[primaryGoal]) ??
      "a landing page for your primary offer";
    return `e.g. ${example}`;
  }, [primaryGoal]);

  const contextLoaded = [offerSummary, audienceDescription, differentiator]
    .filter(Boolean).length;

  const canSubmit = brief.trim().length >= 6 && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sites/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brief: brief.trim(),
          templateId: "bill-fanter",
        }),
      });
      if (!res.ok) {
        const detail = await safeReadError(res);
        setError(detail);
        setSubmitting(false);
        return;
      }
      const json = (await res.json()) as { jobId: string };
      router.push(`/studio/sites/generating?jobId=${json.jobId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reach the server");
      setSubmitting(false);
    }
  };

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c", color: "#f5f0e6" }}
    >
      <div className="absolute inset-0">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>

      <div className="relative z-10 size-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center px-10 py-16">
          <div className="w-full" style={{ maxWidth: 780 }}>
            <Link
              href="/studio"
              className="inline-flex items-center transition-opacity duration-150 hover:opacity-80"
              style={{
                gap: 6,
                fontSize: 12.5,
                color: "rgba(245,240,230,0.55)",
                letterSpacing: "-0.003em",
                marginBottom: 40,
              }}
            >
              <span aria-hidden>←</span> Studio
            </Link>

            <h1
              className="text-center"
              style={{
                fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)",
                fontWeight: 600,
                lineHeight: 1.03,
                letterSpacing: "-0.032em",
                color: "rgba(248,247,252,0.97)",
                margin: "0 0 14px",
              }}
            >
              What&apos;s this site for?
            </h1>
            <p
              className="text-center"
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: "rgba(245,240,230,0.55)",
                letterSpacing: "-0.003em",
                maxWidth: "56ch",
                margin: "0 auto 40px",
              }}
            >
              One sentence.{" "}
              {agentName ? `${agentName} handles the rest` : "The agent handles the rest"}
              {contextLoaded > 0 && brandName
                ? ` — voice, offer, and audience are already loaded from ${brandName}.`
                : "."}
            </p>

            <div
              className="composer relative flex flex-col"
              style={{
                gap: 12,
                padding: "22px 22px 20px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.028)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 60px -30px rgba(0,0,0,0.6)",
              }}
            >
              <textarea
                autoFocus
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ||
                    (e.key === "Enter" && !e.shiftKey && brief.trim().length >= 6)
                  ) {
                    e.preventDefault();
                    void onSubmit();
                  }
                }}
                placeholder={placeholder}
                rows={3}
                disabled={submitting}
                className="w-full resize-none bg-transparent outline-none"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 17,
                  lineHeight: 1.5,
                  letterSpacing: "-0.005em",
                  color: "rgba(245,240,230,0.95)",
                  minHeight: 78,
                }}
              />
              <div className="flex items-center justify-between">
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.06em",
                    color: "rgba(245,240,230,0.4)",
                    textTransform: "uppercase",
                  }}
                >
                  {contextLoaded > 0
                    ? `${contextLoaded}/3 brand fields loaded`
                    : "Brand context loading"}
                </span>
                <div className="flex items-center" style={{ gap: 10 }}>
                  <button
                    type="button"
                    aria-label="Speak your brief"
                    className="grid place-items-center transition-colors duration-150"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(245,240,230,0.7)",
                      cursor: "pointer",
                    }}
                    disabled={submitting}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="3" width="6" height="12" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className="composer-submit inline-flex items-center transition-all duration-200"
                    style={{
                      padding: "10px 18px",
                      gap: 8,
                      borderRadius: 999,
                      fontSize: 13.5,
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      opacity: canSubmit ? 1 : 0.5,
                      cursor: canSubmit ? "pointer" : "not-allowed",
                    }}
                  >
                    {submitting ? "Starting…" : "Draft it"}
                    {!submitting && (
                      <span aria-hidden style={{ display: "inline-block" }}>
                        →
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p
                className="text-center"
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  color: "#ff9d98",
                  letterSpacing: "-0.003em",
                }}
              >
                {error}
              </p>
            )}

            <p
              className="text-center"
              style={{
                marginTop: 28,
                fontSize: 12.5,
                color: "rgba(245,240,230,0.4)",
                letterSpacing: "-0.003em",
              }}
            >
              About 60 seconds. Sit back — the agent will walk you through it.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

async function safeReadError(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { error?: string; detail?: string };
    return json.error ?? `Server returned ${res.status}`;
  } catch {
    return `Server returned ${res.status}`;
  }
}
