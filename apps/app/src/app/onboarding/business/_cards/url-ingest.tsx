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
        headline="Got a website?"
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
      headline="Here's what I learned."
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
      <div className="flex flex-col" style={{ gap: 32 }}>
        {/* Hero strip — og:image if available, otherwise a typographic
            fallback with favicon + brand name. */}
        {heroImage ? (
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.018)",
              aspectRatio: "16/9",
            }}
          >
            <Image
              src={heroImage}
              alt={brandName || "Site preview"}
              fill
              sizes="(max-width: 760px) 100vw, 760px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>
        ) : null}

        {/* Brand identity — favicon (if no hero) + brand name + URL. */}
        <div className="flex items-center" style={{ gap: 14 }}>
          {!heroImage && favicon && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={favicon}
              alt=""
              width={40}
              height={40}
              style={{
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                objectFit: "contain",
                padding: 6,
              }}
            />
          )}
          <div className="flex flex-col" style={{ gap: 4 }}>
            <h2
              style={{
                fontSize: "clamp(1.375rem, 2.2vw, 1.875rem)",
                fontWeight: 600,
                letterSpacing: "-0.022em",
                lineHeight: 1.05,
                color: "rgba(245,240,230,0.98)",
                margin: 0,
              }}
            >
              {brandName}
            </h2>
            <a
              href={result?.url ?? brandState.existing_site_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13.5,
                color: "rgba(245,240,230,0.5)",
                letterSpacing: "-0.003em",
                textDecoration: "none",
              }}
            >
              {displayUrl} ↗
            </a>
          </div>
        </div>

        {/* Quick-facts pills — type / goal / voice as inline chips so the
            top-line categorization is scannable in one glance. */}
        {(extracted.business_type ||
          extracted.primary_goal ||
          extracted.voice_descriptor) && (
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {extracted.business_type && (
              <Pill>
                {BUSINESS_TYPE_LABEL[extracted.business_type] ??
                  extracted.business_type}
              </Pill>
            )}
            {extracted.primary_goal && (
              <Pill>
                {PRIMARY_GOAL_LABEL[extracted.primary_goal] ??
                  extracted.primary_goal}
              </Pill>
            )}
            {extracted.voice_descriptor && (
              <Pill>
                {VOICE_DESCRIPTOR_LABEL[extracted.voice_descriptor] ??
                  extracted.voice_descriptor}{" "}
                voice
              </Pill>
            )}
          </div>
        )}

        {/* Long-form fields — sentence-case section headlines + prose body.
            Each section separated by a hairline. Reads as editorial brand
            study, not a debug grid. */}
        {(extracted.offer_summary ||
          extracted.audience_description ||
          extracted.differentiator ||
          (extracted.traffic_sources &&
            extracted.traffic_sources.length > 0) ||
          (extracted.competitor_urls &&
            extracted.competitor_urls.length > 0)) && (
          <div className="flex flex-col" style={{ gap: 20 }}>
            {extracted.offer_summary && (
              <Section title="What you do">{extracted.offer_summary}</Section>
            )}
            {extracted.audience_description && (
              <Section title="Who buys it">
                {extracted.audience_description}
              </Section>
            )}
            {extracted.differentiator && (
              <Section title="Your edge">{extracted.differentiator}</Section>
            )}
            {extracted.traffic_sources &&
              extracted.traffic_sources.length > 0 && (
                <Section title="Where customers find you">
                  {extracted.traffic_sources
                    .map((t) => TRAFFIC_LABEL[t] ?? t)
                    .join(" · ")}
                </Section>
              )}
            {extracted.competitor_urls &&
              extracted.competitor_urls.length > 0 && (
                <Section title="Watching">
                  {extracted.competitor_urls.slice(0, 3).join(" · ")}
                </Section>
              )}
          </div>
        )}
      </div>
    </CardShell>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        color: "rgba(245,240,230,0.78)",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        gap: 6,
        paddingTop: 16,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "-0.005em",
          color: "rgba(245,240,230,0.55)",
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          letterSpacing: "-0.005em",
          color: "rgba(245,240,230,0.9)",
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}
