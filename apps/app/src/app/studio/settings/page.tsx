"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, StudioPageShell, usePersonality } from "@/components/studio-page-shell";

type Section =
  | "account"
  | "brand-voice"
  | "team"
  | "billing"
  | "api"
  | "integrations"
  | "shortcuts";

const SECTIONS: { id: Section; label: string; description: string }[] = [
  { id: "account", label: "Account", description: "Your name, email, password" },
  { id: "brand-voice", label: "Brand voice", description: "House rules, banned words, tone" },
  { id: "team", label: "Team", description: "Invite teammates and set roles" },
  { id: "billing", label: "Billing", description: "Payment method and invoices" },
  { id: "api", label: "API & webhooks", description: "Programmatic access" },
  { id: "integrations", label: "Integrations", description: "Connect Meta, X, LinkedIn" },
  { id: "shortcuts", label: "Keyboard shortcuts", description: "Customise your hotkeys" },
];

export default function SettingsPage() {
  const personality = usePersonality();
  const accent = personality.accent;
  const accentDeep = personality.accentDeep;
  const glow = personality.glow;
  const { user } = useUser();
  const [section, setSection] = useState<Section>("account");

  return (
    <StudioPageShell
      title="Settings"
      subtitle="Workspace, account, and integration controls. Changes save instantly."
      maxWidth={1180}
    >
      <div className="grid gap-8" style={{ gridTemplateColumns: "232px 1fr" }}>
        {/* Sub-nav */}
        <nav className="flex flex-col gap-0.5 sticky top-0 self-start">
          {SECTIONS.map((s) => {
            const isActive = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className="text-left px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  background: isActive ? "rgba(255,255,255,0.045)" : "transparent",
                  border: "1px solid",
                  borderColor: isActive
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                }}
              >
                <div
                  className="text-[14px] font-medium flex items-center gap-2"
                  style={{
                    color: isActive
                      ? "rgba(245,245,247,1)"
                      : "rgba(245,245,247,0.78)",
                  }}
                >
                  {isActive && (
                    <span
                      className="size-1.5 rounded-full"
                      style={{
                        background: accent,
                        boxShadow: `0 0 6px ${accent}`,
                      }}
                    />
                  )}
                  {s.label}
                </div>
                <div
                  className="text-[12px] mt-0.5 ml-3.5"
                  style={{ color: "rgba(245,245,247,0.45)" }}
                >
                  {s.description}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div>
          {section === "account" && (
            <AccountSection
              accent={accent}
              accentDeep={accentDeep}
              glow={glow}
              userName={user?.fullName ?? user?.firstName ?? ""}
              userEmail={user?.primaryEmailAddress?.emailAddress ?? ""}
            />
          )}
          {section === "brand-voice" && (
            <BrandVoiceSection accent={accent} accentDeep={accentDeep} glow={glow} />
          )}
          {section === "team" && <TeamSection accent={accent} accentDeep={accentDeep} glow={glow} />}
          {section === "billing" && <BillingPlaceholder />}
          {section === "api" && <ApiSection accent={accent} />}
          {section === "integrations" && <IntegrationsSection accent={accent} />}
          {section === "shortcuts" && <ShortcutsSection accent={accent} />}
        </div>
      </div>
    </StudioPageShell>
  );
}

/* ============================================================
 * Account
 * ============================================================ */
function AccountSection({
  accent,
  accentDeep,
  glow,
  userName,
  userEmail,
}: {
  accent: string;
  accentDeep: string;
  glow: string;
  userName: string;
  userEmail: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Account" description="How we identify you across WRKS." />
      <Card className="p-6">
        <Field label="Display name" hint="Shown across the workspace.">
          <input
            defaultValue={userName}
            className="w-full h-11 px-4 rounded-lg text-[14.5px] outline-none focus:border-transparent transition"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(245,245,247,0.95)",
            }}
          />
        </Field>
        <FieldDivider />
        <Field label="Email" hint="Used for login and important account notices.">
          <input
            defaultValue={userEmail}
            readOnly
            className="w-full h-11 px-4 rounded-lg text-[14.5px] outline-none"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(245,245,247,0.7)",
            }}
          />
        </Field>
        <FieldDivider />
        <Field
          label="Time zone"
          hint="We use this for scheduling and analytics windows."
        >
          <select
            className="w-full h-11 px-4 rounded-lg text-[14.5px] outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(245,245,247,0.95)",
            }}
            defaultValue="America/Los_Angeles"
          >
            <option>America/Los_Angeles</option>
            <option>America/New_York</option>
            <option>Europe/London</option>
            <option>Asia/Karachi</option>
            <option>Asia/Tokyo</option>
          </select>
        </Field>
      </Card>

      <Card className="p-6">
        <SectionHeader
          title="Password & sessions"
          description="Sign out of other devices or change your password."
        />
        <div className="mt-5 flex items-center gap-3">
          <SecondaryButton>Change password</SecondaryButton>
          <SecondaryButton>Sign out of other sessions</SecondaryButton>
        </div>
      </Card>

      <Card className="p-6" style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
        <h3
          className="text-[15.5px] font-medium mb-1"
          style={{ color: "#fda4af" }}
        >
          Danger zone
        </h3>
        <p
          className="text-[13.5px] leading-relaxed mb-4"
          style={{ color: "rgba(245,245,247,0.6)" }}
        >
          Permanently delete your account and all associated deliverables, brand
          voices, and history. This cannot be undone.
        </p>
        <button
          type="button"
          className="h-10 px-4 rounded-lg text-[13.5px] font-medium transition-colors"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fda4af",
          }}
        >
          Delete account
        </button>
      </Card>

      <div className="flex justify-end gap-3">
        <SecondaryButton>Cancel</SecondaryButton>
        <PrimaryButton accent={accent} accentDeep={accentDeep} glow={glow}>
          Save changes
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ============================================================
 * Brand voice
 * ============================================================ */
function BrandVoiceSection({
  accent,
  accentDeep,
  glow,
}: {
  accent: string;
  accentDeep: string;
  glow: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Brand voice"
        description="Your agent applies these to every refinement."
      />
      <Card className="p-6">
        <Field
          label="House style"
          hint="A short paragraph describing your tone, cadence, and personality."
        >
          <textarea
            defaultValue="Direct, opinionated, never corporate. Short sentences. Specific verbs. Skip hedging."
            rows={4}
            className="w-full px-4 py-3 rounded-lg text-[14.5px] outline-none resize-none leading-relaxed"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(245,245,247,0.95)",
              fontFamily: "var(--font-sans)",
            }}
          />
        </Field>
        <FieldDivider />
        <Field
          label="Banned words"
          hint="Comma-separated. Your agent will refuse to use these."
        >
          <input
            defaultValue="leverage, seamless, world-class, robust, comprehensive"
            className="w-full h-11 px-4 rounded-lg text-[14.5px] outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(245,245,247,0.95)",
            }}
          />
        </Field>
        <FieldDivider />
        <Field
          label="Reading level"
          hint="Aim writing at this audience by default."
        >
          <div className="flex items-center gap-2">
            {(["7th grade", "10th grade", "college", "industry"] as const).map(
              (level, idx) => (
                <button
                  key={level}
                  type="button"
                  className="h-9 px-3.5 rounded-lg text-[13px] font-medium transition-colors"
                  style={{
                    background:
                      idx === 1 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                    border:
                      idx === 1
                        ? `1px solid ${accent}55`
                        : "1px solid rgba(255,255,255,0.08)",
                    color:
                      idx === 1
                        ? "rgba(245,245,247,0.95)"
                        : "rgba(245,245,247,0.7)",
                  }}
                >
                  {level}
                </button>
              ),
            )}
          </div>
        </Field>
      </Card>
      <div className="flex justify-end gap-3">
        <SecondaryButton>Cancel</SecondaryButton>
        <PrimaryButton accent={accent} accentDeep={accentDeep} glow={glow}>
          Save brand voice
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ============================================================
 * Team
 * ============================================================ */
function TeamSection({
  accent,
  accentDeep,
  glow,
}: {
  accent: string;
  accentDeep: string;
  glow: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Team"
        description="Invite teammates to your workspace. Pro plan and above."
      />
      <Card className="p-6">
        <div className="flex items-end gap-3">
          <Field label="Invite by email" inline>
            <input
              placeholder="teammate@company.com"
              className="w-full h-11 px-4 rounded-lg text-[14.5px] outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(245,245,247,0.95)",
              }}
            />
          </Field>
          <PrimaryButton accent={accent} accentDeep={accentDeep} glow={glow}>
            Send invite
          </PrimaryButton>
        </div>
        <div
          className="mt-7 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            className="text-[12px] tracking-[0.18em] uppercase mb-3"
            style={{
              color: "rgba(245,245,247,0.5)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Members
          </div>
          <div
            className="text-[14px] py-7 text-center rounded-xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              color: "rgba(245,245,247,0.5)",
              border: "1px dashed rgba(255,255,255,0.08)",
            }}
          >
            You&rsquo;re solo for now. Invite your first teammate to collaborate.
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
 * Billing pointer
 * ============================================================ */
function BillingPlaceholder() {
  return (
    <Card className="p-7">
      <h3
        className="text-[16.5px] font-medium mb-2"
        style={{ color: "rgba(245,245,247,0.95)" }}
      >
        Billing lives in Plans
      </h3>
      <p
        className="text-[14px] leading-relaxed mb-4"
        style={{ color: "rgba(245,245,247,0.6)" }}
      >
        Manage your subscription, payment methods, and invoices from the Plans
        page.
      </p>
      <a
        href="/studio/plans"
        className="inline-flex items-center gap-2 text-[14px] font-medium hover:underline"
        style={{ color: "rgba(245,245,247,0.95)" }}
      >
        Open Plans <span>→</span>
      </a>
    </Card>
  );
}

/* ============================================================
 * API
 * ============================================================ */
function ApiSection({ accent }: { accent: string }) {
  return (
    <Card className="p-6">
      <SectionHeader
        title="API access"
        description="Programmatically refine deliverables or sync brand state."
      />
      <div className="mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-2 py-0.5 rounded text-[10.5px] tracking-[0.18em] uppercase"
            style={{
              background: `${accent}1f`,
              color: accent,
              border: `1px solid ${accent}33`,
              fontFamily: "var(--font-mono)",
            }}
          >
            Pro plan
          </span>
          <span className="text-[13px]" style={{ color: "rgba(245,245,247,0.6)" }}>
            API access is included on Pro and Studio plans.
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
 * Integrations
 * ============================================================ */
function IntegrationsSection({ accent }: { accent: string }) {
  const items = [
    { name: "Instagram Business", status: "Connect" },
    { name: "Meta Ads", status: "Connect" },
    { name: "LinkedIn Pages", status: "Connect" },
    { name: "X (Twitter)", status: "Coming soon", disabled: true },
  ];
  return (
    <Card className="p-6">
      <SectionHeader
        title="Integrations"
        description="Publish directly to where your audience lives."
      />
      <div className="mt-5 flex flex-col gap-2.5">
        {items.map((it) => (
          <div
            key={it.name}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span
              className="text-[14px] font-medium"
              style={{ color: "rgba(245,245,247,0.9)" }}
            >
              {it.name}
            </span>
            <button
              type="button"
              disabled={it.disabled}
              className="h-9 px-4 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: it.disabled ? "rgba(245,245,247,0.5)" : accent,
                background: it.disabled ? "rgba(255,255,255,0.04)" : `${accent}1a`,
                border: it.disabled
                  ? "1px solid rgba(255,255,255,0.06)"
                  : `1px solid ${accent}33`,
              }}
            >
              {it.status}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================
 * Shortcuts
 * ============================================================ */
function ShortcutsSection({ accent }: { accent: string }) {
  const shortcuts: { keys: string; label: string }[] = [
    { keys: "⌘ K", label: "Open command palette" },
    { keys: "G then S", label: "Go to Studio" },
    { keys: "G then L", label: "Go to Library" },
    { keys: "G then B", label: "Go to Brand" },
    { keys: "/", label: "Open composer" },
    { keys: "Space (hold)", label: "Talk to agent" },
    { keys: "⌘ Enter", label: "Send refinement" },
    { keys: "⌘ Z", label: "Undo last refinement" },
    { keys: "?", label: "Show this list" },
  ];
  return (
    <Card className="p-6">
      <SectionHeader
        title="Keyboard shortcuts"
        description="A keyboard-first studio. Press ? from anywhere to bring this up."
      />
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shortcuts.map((s) => (
          <div
            key={s.keys}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span className="text-[13.5px]" style={{ color: "rgba(245,245,247,0.85)" }}>
              {s.label}
            </span>
            <span
              className="px-2 py-0.5 rounded text-[12px] tracking-[0.06em]"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(245,245,247,0.85)",
                fontFamily: "var(--font-mono)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {s.keys}
            </span>
          </div>
        ))}
      </div>
      <div
        className="mt-5 text-[12.5px]"
        style={{ color: "rgba(245,245,247,0.4)" }}
      >
        Tip: customise these in the next release.
        <span style={{ color: accent }}> Coming soon.</span>
      </div>
    </Card>
  );
}

/* ============================================================
 * Atoms
 * ============================================================ */
function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2
        className="text-[18px] font-medium tracking-tight"
        style={{
          color: "rgba(245,245,247,0.98)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      <p
        className="mt-1.5 text-[14px]"
        style={{ color: "rgba(245,245,247,0.55)" }}
      >
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  inline,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "flex-1" : ""}>
      <label className="block">
        <span
          className="block text-[13.5px] font-medium mb-1.5"
          style={{ color: "rgba(245,245,247,0.85)" }}
        >
          {label}
        </span>
        {hint && (
          <span
            className="block text-[12.5px] mb-2"
            style={{ color: "rgba(245,245,247,0.5)" }}
          >
            {hint}
          </span>
        )}
        {children}
      </label>
    </div>
  );
}

function FieldDivider() {
  return (
    <div
      className="my-5 h-px"
      style={{ background: "rgba(255,255,255,0.05)" }}
    />
  );
}

function PrimaryButton({
  children,
  accent,
  accentDeep,
  glow,
}: {
  children: React.ReactNode;
  accent: string;
  accentDeep: string;
  glow: string;
}) {
  return (
    <button
      type="button"
      className="h-10 px-5 rounded-lg text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
        boxShadow: `0 8px 24px -8px ${glow}`,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="h-10 px-4 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-white/[0.05]"
      style={{
        color: "rgba(245,245,247,0.75)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </button>
  );
}
