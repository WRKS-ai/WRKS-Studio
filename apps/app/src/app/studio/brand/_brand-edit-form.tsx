"use client";

import Link from "next/link";
import { useState } from "react";

// Editable brand-info form. Sits at /studio/brand as the user's ongoing
// source of truth for what the agent knows about their business. Every
// field maps to a business_profiles column; save PATCHes only the
// changed fields via /api/onboarding/save.

export type BrandProfile = {
  brandName: string;
  businessType: string | null;
  primaryGoal: string | null;
  voiceDescriptor: string | null;
  offerSummary: string;
  audienceDescription: string;
  differentiator: string;
  existingSiteUrl: string;
  agentName: string | null;
};

const BUSINESS_TYPES = [
  { value: "personal_brand", label: "Personal brand (creator, coach, freelancer)" },
  { value: "service", label: "Service business (law, medical, consulting)" },
  { value: "saas", label: "SaaS / software product" },
  { value: "agency", label: "Agency (creative, marketing, dev)" },
  { value: "ecommerce", label: "Ecommerce (products, retail)" },
  { value: "other", label: "Other" },
];

const PRIMARY_GOALS = [
  { value: "book_calls", label: "Book calls / consults" },
  { value: "sell_products", label: "Sell products or services directly" },
  { value: "capture_leads", label: "Capture leads for follow-up" },
  { value: "build_audience", label: "Build an audience / newsletter" },
  { value: "launch_new", label: "Launch a new product or offering" },
  { value: "fix_conversions", label: "Fix conversion problems on an existing site" },
];

const VOICE_DESCRIPTORS = [
  { value: "professional", label: "Professional — clean, restrained, trustworthy" },
  { value: "bold", label: "Bold — confident, high-contrast, direct" },
  { value: "warm", label: "Warm — humanist, generous, kind" },
  { value: "expert", label: "Expert — thoughtful, editorial, deep" },
  { value: "playful", label: "Playful — bright, energetic, unexpected" },
  { value: "quiet", label: "Quiet — minimal, restrained, generous whitespace" },
];

export function BrandEditForm({ initial }: { initial: BrandProfile }) {
  const [profile, setProfile] = useState<BrandProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const patch = <K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const isDirty = JSON.stringify(profile) !== JSON.stringify(initial);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        brand_name: profile.brandName.trim() || null,
        business_type: profile.businessType,
        primary_goal: profile.primaryGoal,
        voice_descriptor: profile.voiceDescriptor,
        offer_summary: profile.offerSummary.trim() || null,
        audience_description: profile.audienceDescription.trim() || null,
        differentiator: profile.differentiator.trim() || null,
        existing_site_url: profile.existingSiteUrl.trim() || null,
      };
      const res = await fetch("/api/onboarding/save", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Save failed.");
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setSaving(false);
    }
  };

  return (
    <main
      className="relative size-full overflow-y-auto"
      style={{ background: "#0a0a0c", color: "#f5f0e6" }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 720, padding: "48px 40px 96px" }}
      >
        <Link
          href="/studio"
          className="inline-flex items-center transition-opacity duration-150 hover:opacity-80"
          style={{
            gap: 6,
            fontSize: 12.5,
            color: "rgba(245,240,230,0.55)",
            letterSpacing: "-0.003em",
          }}
        >
          <span aria-hidden>←</span> Studio
        </Link>

        <h1
          style={{
            marginTop: 32,
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.028em",
            color: "rgba(248,247,252,0.97)",
            margin: "32px 0 8px",
          }}
        >
          Brand
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: "rgba(245,240,230,0.6)",
            letterSpacing: "-0.003em",
            margin: "0 0 40px",
            maxWidth: "62ch",
          }}
        >
          The source of truth for your tone, offer, and audience. Your agent
          reads from here before every draft and every refinement. Edit
          anything, save, and future generations use the new answers.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <TextField
            label="Brand name"
            hint="What you call your business or your work."
            value={profile.brandName}
            onChange={(v) => patch("brandName", v)}
            placeholder="Acme Studio"
          />

          <TextField
            label="Existing site URL"
            hint="If you already have a live site. Leave blank if none."
            value={profile.existingSiteUrl}
            onChange={(v) => patch("existingSiteUrl", v)}
            placeholder="https://yoursite.com"
          />

          <SelectField
            label="Business type"
            hint="Shapes which reference the agent picks + which pages get generated."
            value={profile.businessType}
            onChange={(v) => patch("businessType", v)}
            options={BUSINESS_TYPES}
          />

          <SelectField
            label="Primary goal"
            hint="What a visitor should do on your site."
            value={profile.primaryGoal}
            onChange={(v) => patch("primaryGoal", v)}
            options={PRIMARY_GOALS}
          />

          <SelectField
            label="Voice"
            hint="Sets the visual + copy tone. Bold sites look bold; quiet sites read differently."
            value={profile.voiceDescriptor}
            onChange={(v) => patch("voiceDescriptor", v)}
            options={VOICE_DESCRIPTORS}
          />

          <TextareaField
            label="Offer"
            hint="What you actually sell or offer. Be specific — 'coaching for first-time founders' beats 'consulting services'."
            value={profile.offerSummary}
            onChange={(v) => patch("offerSummary", v)}
            placeholder="I coach first-time founders through their first 12 months."
            rows={3}
          />

          <TextareaField
            label="Audience"
            hint="Who your work is for. Real people, specific traits."
            value={profile.audienceDescription}
            onChange={(v) => patch("audienceDescription", v)}
            placeholder="Solo founders in their first year, pre-product-market-fit, technical background."
            rows={3}
          />

          <TextareaField
            label="Differentiator"
            hint="What makes you different from the obvious alternatives."
            value={profile.differentiator}
            onChange={(v) => patch("differentiator", v)}
            placeholder="I've shipped 3 startups to profitability myself — not academic advice."
            rows={3}
          />
        </div>

        {/* Save bar */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: error
                ? "#ff9d98"
                : saved
                ? "rgba(120,220,140,0.9)"
                : "rgba(245,240,230,0.5)",
              letterSpacing: "-0.003em",
            }}
          >
            {error
              ? error
              : saved
              ? "Saved — future generations will use these answers."
              : isDirty
              ? "Unsaved changes."
              : "All changes saved."}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || saving}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              background: isDirty && !saving ? "#ffffff" : "rgba(255,255,255,0.08)",
              color: isDirty && !saving ? "#0a0a0f" : "rgba(245,240,230,0.4)",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              border: "none",
              cursor: isDirty && !saving ? "pointer" : "not-allowed",
              transition: "background 150ms, color 150ms",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// Field primitives
// ============================================================

function FieldShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(245,240,230,0.9)",
            letterSpacing: "-0.005em",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        {hint && (
          <div
            style={{
              fontSize: 12,
              color: "rgba(245,240,230,0.5)",
              letterSpacing: "-0.003em",
              lineHeight: 1.4,
            }}
          >
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none"
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 14,
          color: "rgba(245,240,230,0.95)",
          letterSpacing: "-0.005em",
        }}
      />
    </FieldShell>
  );
}

function TextareaField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="w-full bg-transparent outline-none resize-y"
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 14,
          lineHeight: 1.55,
          color: "rgba(245,240,230,0.95)",
          letterSpacing: "-0.005em",
          fontFamily: "inherit",
        }}
      />
    </FieldShell>
  );
}

function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-transparent outline-none"
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 14,
          color: "rgba(245,240,230,0.95)",
          letterSpacing: "-0.005em",
          appearance: "auto",
        }}
      >
        <option value="" style={{ background: "#0a0a0c" }}>
          — Not set —
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#0a0a0c" }}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
