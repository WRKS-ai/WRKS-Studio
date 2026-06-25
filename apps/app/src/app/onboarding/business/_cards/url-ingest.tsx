"use client";

import Image from "next/image";
import { type Dispatch, type SetStateAction, useState } from "react";
import type { BrandStateSnapshot } from "../page";
import CardShell, {
  NextButton,
  SecondaryButton,
} from "../_components/card-shell";

// Card 1 — URL ingest. Two phases:
//
// INPUT phase: URL input + Skip / Read-it buttons. User pastes the URL.
//
// SUMMARY phase: shows the extracted brand state inline so the user
// sees what the agent learned about them — hero strip (og:image with
// favicon fallback), brand name + URL + page title, then a structured
// list of the inferred fields (business type / primary goal / voice /
// offer summary / audience / differentiator / competitors). User can
// re-fetch (paste a different URL) or Continue to advance.
//
// "Skip" is a first-class action at any time — many users don't have
// a site yet (pre-launch / new business). Skipping advances without
// writing or showing the summary.

type Extracted = {
  business_type: string | null;
  primary_goal: string | null;
  traffic_sources: string[] | null;
  voice_descriptor: string | null;
  brand_name: string | null;
  offer_summary: string | null;
  audience_description: string | null;
  differentiator: string | null;
  competitor_urls: string[] | null;
};

type IngestResponse = {
  url: string;
  extracted: Extracted;
  heroImage: string | null;
  favicon: string | null;
  pageTitle: string | null;
  pageDescription: string | null;
  persisted: true;
};

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  service: "Service business",
  ecommerce: "E-commerce",
  saas: "SaaS / software",
  agency: "Agency",
  personal_brand: "Personal brand / creator",
  other: "Other",
};
const PRIMARY_GOAL_LABEL: Record<string, string> = {
  book_calls: "Book calls",
  sell_products: "Sell products",
  capture_leads: "Capture leads",
  build_audience: "Build an audience",
  launch_new: "Launch something new",
  fix_conversions: "Fix conversions",
};
const VOICE_DESCRIPTOR_LABEL: Record<string, string> = {
  professional: "Professional & polished",
  bold: "Bold & contrarian",
  warm: "Warm & friendly",
  expert: "Expert & data-driven",
  playful: "Playful & creative",
  quiet: "Quiet & minimalist",
};
const TRAFFIC_LABEL: Record<string, string> = {
  paid_ads: "Paid ads",
  seo: "SEO",
  social: "Social",
  email: "Email",
  referrals: "Referrals",
  cold_outreach: "Outreach",
  press: "Press",
};

type Props = {
  brandState: BrandStateSnapshot;
  setBrandState: Dispatch<SetStateAction<BrandStateSnapshot>>;
  advance: (patch: Partial<BrandStateSnapshot>) => Promise<void>;
  onSkip: () => void;
};

export default function UrlIngestCard({
  brandState,
  setBrandState,
  advance,
  onSkip,
}: Props) {
  const [url, setUrl] = useState<string>(brandState.existing_site_url ?? "");
  const [status, setStatus] = useState<"input" | "loading" | "summary" | "error">(
    brandState.existing_site_url ? "summary" : "input",
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);

  const submit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/ingest/site", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const json = (await res.json()) as
        | IngestResponse
        | { error: string; detail?: string };
      if (!res.ok || !("extracted" in json)) {
        setStatus("error");
        const detail = "error" in json ? json.error : "Unknown error";
        setError(detail);
        return;
      }
      setResult(json);
      // Merge extracted fields into local state so cards 2-6 open prefilled.
      setBrandState((prev) => ({
        ...prev,
        existing_site_url: json.url,
        voice_origin: "extracted_from_url",
        ...json.extracted,
      }));
      setStatus("summary");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Couldn't reach the server");
    }
  };

  const reset = () => {
    setStatus("input");
    setResult(null);
    setError(null);
  };

  // ── Input / loading / error phase ──
  if (status === "input" || status === "loading" || status === "error") {
    return (
      <CardShell
        headline="Got a website we can learn from?"
        subhead="Drop the URL and we'll read it — industry, offer, audience, voice. Saves you most of the typing on the next cards. No site? Skip it."
        actions={
          <>
            <SecondaryButton
              onClick={onSkip}
              label="Skip"
              disabled={status === "loading"}
            />
            <NextButton
              onClick={submit}
              disabled={url.trim().length === 0}
              label={status === "error" ? "Try again" : "Read it"}
              busy={status === "loading"}
            />
          </>
        }
      >
        <div className="flex flex-col" style={{ gap: 12 }}>
          <label htmlFor="ingest-url" className="sr-only">
            Website URL
          </label>
          <input
            id="ingest-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            autoFocus
            spellCheck={false}
            placeholder="yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim().length > 0) {
                e.preventDefault();
                submit();
              }
            }}
            disabled={status === "loading"}
            className="w-full bg-transparent outline-none transition-colors duration-150"
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.018)",
              color: "rgba(245,240,230,0.95)",
              fontSize: 17,
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.005em",
            }}
          />
          {status === "error" && error && (
            <p
              role="alert"
              style={{
                fontSize: 13,
                color: "rgba(255,180,160,0.85)",
              }}
            >
              {error}
            </p>
          )}
          {status === "loading" && (
            <p
              style={{
                fontSize: 13.5,
                color: "rgba(245,240,230,0.5)",
              }}
            >
              Reading your site… this usually takes 10–20 seconds.
            </p>
          )}
        </div>
      </CardShell>
    );
  }

  // ── Summary phase — render what was extracted ──
  const extracted = result?.extracted ?? {
    business_type: brandState.business_type,
    primary_goal: brandState.primary_goal,
    traffic_sources: brandState.traffic_sources,
    voice_descriptor: brandState.voice_descriptor,
    brand_name: brandState.brand_name,
    offer_summary: brandState.offer_summary,
    audience_description: brandState.audience_description,
    differentiator: brandState.differentiator,
    competitor_urls: brandState.competitor_urls,
  };
  const heroImage = result?.heroImage ?? null;
  const favicon = result?.favicon ?? null;
  const displayUrl = (result?.url ?? brandState.existing_site_url ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const brandName =
    extracted.brand_name ?? result?.pageTitle ?? displayUrl;

  return (
    <CardShell
      headline="Here's what I learned from your site."
      subhead="Review what I pulled. Anything off? You can edit it on the next cards. Pasting a different URL re-reads from scratch."
      actions={
        <>
          <SecondaryButton onClick={reset} label="Use a different URL" />
          <NextButton
            onClick={() => advance({})}
            label="Looks right"
          />
        </>
      }
    >
      <div className="flex flex-col" style={{ gap: 18 }}>
        {/* Hero strip — og:image if available, otherwise a typographic
            fallback with favicon + brand name. */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.018)",
            aspectRatio: heroImage ? "16/9" : "auto",
            minHeight: heroImage ? undefined : 88,
          }}
        >
          {heroImage ? (
            <Image
              src={heroImage}
              alt={brandName || "Site preview"}
              fill
              sizes="(max-width: 760px) 100vw, 760px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          ) : (
            <div
              className="flex items-center w-full h-full"
              style={{ gap: 14, padding: "20px 22px" }}
            >
              {favicon && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={favicon}
                  alt=""
                  width={36}
                  height={36}
                  style={{
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    objectFit: "contain",
                  }}
                />
              )}
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "rgba(245,240,230,0.95)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {brandName}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    color: "rgba(245,240,230,0.5)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {displayUrl}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Extracted fields — structured grid. Empty rows hidden so we
            only show what Claude was confident enough to return. */}
        <dl
          className="grid"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
            rowGap: 12,
            columnGap: 18,
            padding: "16px 18px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.012)",
          }}
        >
          {extracted.brand_name && (
            <Row label="Brand">
              {extracted.brand_name}
            </Row>
          )}
          {extracted.business_type && (
            <Row label="Business type">
              {BUSINESS_TYPE_LABEL[extracted.business_type] ?? extracted.business_type}
            </Row>
          )}
          {extracted.primary_goal && (
            <Row label="Primary goal">
              {PRIMARY_GOAL_LABEL[extracted.primary_goal] ?? extracted.primary_goal}
            </Row>
          )}
          {extracted.voice_descriptor && (
            <Row label="Voice">
              {VOICE_DESCRIPTOR_LABEL[extracted.voice_descriptor] ?? extracted.voice_descriptor}
            </Row>
          )}
          {extracted.traffic_sources && extracted.traffic_sources.length > 0 && (
            <Row label="Traffic">
              {extracted.traffic_sources
                .map((t) => TRAFFIC_LABEL[t] ?? t)
                .join(", ")}
            </Row>
          )}
          {extracted.offer_summary && (
            <Row label="Offer">{extracted.offer_summary}</Row>
          )}
          {extracted.audience_description && (
            <Row label="Audience">{extracted.audience_description}</Row>
          )}
          {extracted.differentiator && (
            <Row label="Edge">{extracted.differentiator}</Row>
          )}
          {extracted.competitor_urls && extracted.competitor_urls.length > 0 && (
            <Row label="Competitors">
              {extracted.competitor_urls.slice(0, 3).join(" · ")}
            </Row>
          )}
        </dl>
      </div>
    </CardShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt
        style={{
          fontSize: 11.5,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(245,240,230,0.4)",
          paddingTop: 2,
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          fontSize: 14,
          lineHeight: 1.45,
          color: "rgba(245,240,230,0.85)",
          letterSpacing: "-0.005em",
          margin: 0,
        }}
      >
        {children}
      </dd>
    </>
  );
}
