"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import type { BrandStateSnapshot } from "../page";
import CardShell, {
  NextButton,
  SecondaryButton,
} from "../_components/card-shell";

// Card 1 — URL ingest.
// User pastes their site URL → POST /api/ingest/site → server fetches
// page, Claude Haiku extracts brand fields, writes to brand_state +
// returns the extraction. We merge the extraction into local state so
// the next 5 cards open pre-filled.
//
// "Skip" is a first-class action — many users don't have a site yet
// (pre-launch / new business). Skipping advances without writing.

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
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
        | {
            url: string;
            extracted: Partial<BrandStateSnapshot>;
            persisted: true;
          }
        | { error: string; detail?: string };
      if (!res.ok || !("extracted" in json)) {
        setStatus("error");
        const detail = "error" in json ? json.error : "Unknown error";
        setError(detail);
        return;
      }
      // Merge extracted fields into local state so cards 2-6 open prefilled.
      // The API already wrote to the DB; this just keeps the client in sync.
      setBrandState((prev) => ({
        ...prev,
        existing_site_url: json.url,
        voice_origin: "extracted_from_url",
        ...json.extracted,
      }));
      // Advance — don't double-write (the API already persisted), just step.
      await advance({});
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Couldn't reach the server");
    }
  };

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
            label="Read it"
            busy={status === "loading"}
          />
        </>
      }
    >
      <div className="flex flex-col" style={{ gap: 12 }}>
        <label
          htmlFor="ingest-url"
          className="sr-only"
        >
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
            className="font-sans"
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
            className="font-serif italic"
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
