"use client";

import { useState } from "react";
import { Card, StudioPageShell, usePersonality } from "@/components/studio-page-shell";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    cadence: "free",
    tagline: "For exploring the studio.",
    highlights: [
      "5 deliverables / month",
      "Sage personality",
      "Owen voice",
      "WRKS subdomain",
      "Email support",
    ],
    cta: "Current plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    cadence: "per month",
    tagline: "For the working business.",
    highlights: [
      "Unlimited deliverables",
      "All 4 personalities",
      "Choice of 8 voices",
      "Custom domain",
      "Brand voice training",
      "Publish to Instagram + LinkedIn",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    recommended: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: 119,
    cadence: "per month",
    tagline: "For agencies running multiple brands.",
    highlights: [
      "Everything in Pro",
      "Up to 10 brand workspaces",
      "Team seats — 5 included",
      "Custom brand model",
      "Voice cloning (your own voice)",
      "API access",
      "Dedicated success manager",
    ],
    cta: "Talk to sales",
  },
];

const USAGE = [
  { label: "Deliverables", used: 3, limit: 5 },
  { label: "Brand workspaces", used: 1, limit: 1 },
  { label: "Voice minutes", used: 12, limit: 30 },
];

export default function PlansPage() {
  const personality = usePersonality();
  const accent = personality.accent;
  const accentDeep = personality.accentDeep;
  const glow = personality.glow;
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <StudioPageShell
      title="Plans & Billing"
      subtitle="Pick the plan that fits how much you ship. Switch any time. Cancel any time."
      maxWidth={1180}
      actions={
        <div
          className="inline-flex p-1 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {(["monthly", "yearly"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBilling(b)}
              className="h-8 px-3.5 rounded-md text-[12.5px] font-medium capitalize transition-colors"
              style={{
                background: billing === b ? "rgba(255,255,255,0.07)" : "transparent",
                color:
                  billing === b
                    ? "rgba(245,245,247,0.95)"
                    : "rgba(245,245,247,0.55)",
              }}
            >
              {b}
              {b === "yearly" && (
                <span
                  className="ml-1.5 text-[11px]"
                  style={{ color: accent }}
                >
                  −20%
                </span>
              )}
            </button>
          ))}
        </div>
      }
    >
      {/* Current plan + usage */}
      <Card className="p-7 mb-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div
              className="text-[11.5px] tracking-[0.22em] uppercase mb-2"
              style={{
                color: "rgba(245,245,247,0.45)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Current plan
            </div>
            <div className="flex items-center gap-3">
              <h2
                className="text-[22px] font-medium"
                style={{ color: "rgba(245,245,247,0.98)" }}
              >
                Starter
              </h2>
              <span
                className="px-2.5 py-0.5 rounded-md text-[11px] tracking-[0.16em] uppercase"
                style={{
                  background: `${accent}1a`,
                  color: accent,
                  border: `1px solid ${accent}33`,
                  fontFamily: "var(--font-mono)",
                }}
              >
                Free
              </span>
            </div>
            <p
              className="mt-2 text-[14px]"
              style={{ color: "rgba(245,245,247,0.55)" }}
            >
              Renews automatically · No payment method on file
            </p>
          </div>
          <button
            type="button"
            className="h-10 px-5 rounded-lg text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
              boxShadow: `0 8px 24px -8px ${glow}`,
            }}
          >
            Upgrade plan
          </button>
        </div>

        <div className="mt-7 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {USAGE.map((u) => {
            const pct = Math.min(100, (u.used / u.limit) * 100);
            return (
              <div key={u.label}>
                <div className="flex items-baseline justify-between mb-2.5">
                  <span
                    className="text-[13px]"
                    style={{ color: "rgba(245,245,247,0.7)" }}
                  >
                    {u.label}
                  </span>
                  <span
                    className="text-[12.5px]"
                    style={{
                      color: "rgba(245,245,247,0.85)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {u.used}
                    <span style={{ color: "rgba(245,245,247,0.4)" }}>
                      /{u.limit}
                    </span>
                  </span>
                </div>
                <div
                  className="h-1.5 w-full rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${accent} 0%, ${accentDeep} 100%)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Plan grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {PLANS.map((p) => {
          const isRec = p.recommended;
          const adjustedPrice =
            billing === "yearly" ? Math.round(p.price * 0.8) : p.price;
          return (
            <Card
              key={p.id}
              className="p-7 relative flex flex-col"
              style={{
                border: isRec
                  ? `1px solid ${accent}55`
                  : "1px solid rgba(255,255,255,0.06)",
                boxShadow: isRec
                  ? `0 20px 50px -20px ${glow}, 0 0 0 1px ${accent}22`
                  : undefined,
                background: isRec
                  ? `linear-gradient(180deg, ${accent}08 0%, rgba(255,255,255,0.02) 60%)`
                  : "rgba(255,255,255,0.025)",
              }}
            >
              {isRec && (
                <span
                  className="absolute -top-3 left-7 px-2.5 py-1 rounded-md text-[10.5px] tracking-[0.22em] uppercase"
                  style={{
                    background: accent,
                    color: "white",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                  }}
                >
                  Most popular
                </span>
              )}
              <div className="flex items-baseline justify-between mb-2">
                <h3
                  className="text-[20px] font-medium"
                  style={{ color: "rgba(245,245,247,0.98)" }}
                >
                  {p.name}
                </h3>
              </div>
              <p
                className="text-[13.5px] leading-relaxed mb-5"
                style={{ color: "rgba(245,245,247,0.55)" }}
              >
                {p.tagline}
              </p>
              <div className="mb-6">
                <span
                  className="font-serif text-[40px] font-medium"
                  style={{
                    color: "rgba(245,245,247,0.98)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  ${adjustedPrice}
                </span>
                <span
                  className="ml-2 text-[13px]"
                  style={{ color: "rgba(245,245,247,0.5)" }}
                >
                  {p.cadence}
                </span>
              </div>
              <button
                type="button"
                disabled={p.disabled}
                className="h-11 rounded-lg text-[13.5px] font-semibold transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 mb-6"
                style={{
                  background: isRec
                    ? `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`
                    : "rgba(255,255,255,0.05)",
                  color: "white",
                  border: isRec ? "none" : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: isRec ? `0 8px 24px -8px ${glow}` : "none",
                }}
              >
                {p.cta}
              </button>
              <ul className="flex flex-col gap-2.5">
                {p.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-2.5 text-[13.5px] leading-relaxed"
                    style={{ color: "rgba(245,245,247,0.78)" }}
                  >
                    <CheckIcon color={accent} />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Billing history placeholder */}
      <Card className="mt-8 p-7">
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-[16.5px] font-medium"
            style={{ color: "rgba(245,245,247,0.95)" }}
          >
            Billing history
          </h3>
          <button
            type="button"
            className="text-[13px] font-medium transition-colors hover:bg-white/[0.05] px-3 h-8 rounded-lg"
            style={{
              color: "rgba(245,245,247,0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Manage payment method
          </button>
        </div>
        <div
          className="text-[14px] text-center py-10 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.02)",
            color: "rgba(245,245,247,0.5)",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
        >
          No invoices yet. Your first invoice will appear here after upgrading.
        </div>
      </Card>
    </StudioPageShell>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 mt-0.5"
      style={{ color }}
    >
      <path
        d="m4 12 5 5L20 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
