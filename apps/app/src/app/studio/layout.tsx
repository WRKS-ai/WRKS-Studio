"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";

// Shared chrome for the /studio dashboard family:
// - 248px left sidebar (workspace + primary nav + secondary nav at bottom)
// - 56px top bar (breadcrumb + ⌘K + plan + bell + avatar menu)
// - flex content slot (each route fills this)
// Typography is set on the deliberately larger side per user feedback —
// body 15px, sidebar nav 14.5px, labels 12.5px minimum, headlines 22px+.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const STUDIO_KEY = "wrks-studio-deliverables";

type PrimaryNavItem = {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  shortcut?: string;
};

const PRIMARY_NAV: PrimaryNavItem[] = [
  { href: "/studio", label: "Studio", Icon: StudioIcon, shortcut: "S" },
  { href: "/studio/library", label: "Library", Icon: LibraryIcon, shortcut: "L" },
  { href: "/studio/brand", label: "Brand", Icon: BrandIcon, shortcut: "B" },
  { href: "/studio/audience", label: "Audience", Icon: AudienceIcon },
  { href: "/studio/schedule", label: "Schedule", Icon: ScheduleIcon },
  { href: "/studio/analytics", label: "Analytics", Icon: AnalyticsIcon },
  {
    href: "/studio/integrations",
    label: "Integrations",
    Icon: IntegrationsIcon,
  },
];

const SECONDARY_NAV: { href: string; label: string; Icon: (p: { size?: number }) => React.ReactElement }[] = [
  { href: "/studio/plans", label: "Plans & Billing", Icon: PlansIcon },
  { href: "/studio/settings", label: "Settings", Icon: SettingsIcon },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  const [personality, setPersonality] = useState<Personality | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("Untitled");
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
    if (!p) {
      router.replace("/onboarding/personality");
      return;
    }
    const obj = PERSONALITIES.find((x) => x.id === p);
    if (!obj) {
      router.replace("/onboarding/personality");
      return;
    }
    setPersonality(obj);
    setAgentName(localStorage.getItem(NAME_KEY) ?? "");
    const raw = localStorage.getItem(STUDIO_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.deliverables?.brandName)
          setBrandName(parsed.deliverables.brandName);
      } catch {
        // ignore
      }
    }
  }, [router]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-profile-menu]")) setProfileOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  if (!personality) {
    return (
      <div
        className="fixed inset-0 grid place-items-center"
        style={{ background: "#09090b", color: "rgba(245,245,247,0.5)" }}
      >
        <div
          className="text-[13px] tracking-[0.22em] uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Loading workspace…
        </div>
      </div>
    );
  }

  const accent = personality.accent;
  const accentDeep = personality.accentDeep;
  const glow = personality.glow;

  return (
    <div
      className="fixed inset-0 overflow-hidden flex"
      style={{
        background: "#0a0a0c",
        color: "rgba(245,245,247,1)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ============================================================
          SIDEBAR (248px) — workspace + nav
          ============================================================ */}
      <aside
        className="shrink-0 h-full flex flex-col"
        style={{
          width: 248,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(0,0,0,0) 60%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Workspace switcher */}
        <div className="px-4 pt-5 pb-3">
          <button
            type="button"
            className="w-full h-12 rounded-xl px-3 inline-flex items-center gap-3 transition-colors hover:bg-white/[0.04]"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span
              className="size-7 rounded-lg grid place-items-center text-[13px] font-semibold"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
                color: "white",
                boxShadow: `0 4px 12px -2px ${glow}`,
              }}
            >
              {brandName.charAt(0).toUpperCase()}
            </span>
            <div className="flex-1 text-left leading-tight min-w-0">
              <div
                className="text-[14.5px] font-medium truncate"
                style={{ color: "rgba(245,245,247,0.95)" }}
              >
                {brandName}
              </div>
              <div
                className="text-[11.5px] tracking-[0.06em]"
                style={{ color: "rgba(245,245,247,0.45)" }}
              >
                WRKS Workspace
              </div>
            </div>
            <ChevronUpDown />
          </button>
        </div>

        {/* Primary nav */}
        <div className="px-3 pt-2 flex-1 overflow-y-auto">
          <SidebarSection label="Workspace" />
          <nav className="flex flex-col gap-0.5">
            {PRIMARY_NAV.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.Icon}
                shortcut={item.shortcut}
                isActive={pathname === item.href}
                accent={accent}
                glow={glow}
              />
            ))}
          </nav>

          <div className="mt-6">
            <SidebarSection label="Account" />
            <nav className="flex flex-col gap-0.5">
              {SECONDARY_NAV.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  Icon={item.Icon}
                  isActive={pathname === item.href}
                  accent={accent}
                  glow={glow}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom: agent identity card */}
        <div className="px-3 pb-4">
          <div
            className="rounded-xl px-3 py-3 flex items-center gap-3"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="shrink-0">
              <div className="scale-[0.34] origin-left -ml-2">
                <PersonalityIcon personality={personality} size="md" />
              </div>
            </div>
            <div className="-ml-7 flex-1 min-w-0">
              <div
                className="text-[13.5px] font-medium truncate"
                style={{ color: "rgba(245,245,247,0.95)" }}
              >
                {agentName || "Agent"}
              </div>
              <div
                className="text-[11.5px] tracking-[0.06em] flex items-center gap-1.5"
                style={{ color: "rgba(245,245,247,0.5)" }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                />
                {personality.name} · Ready
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN COLUMN — top bar + content
          ============================================================ */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        {/* TOP BAR */}
        <header
          className="shrink-0 h-14 px-6 flex items-center justify-between gap-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="text-[13px]"
              style={{ color: "rgba(245,245,247,0.45)" }}
            >
              {brandName}
            </span>
            <span style={{ color: "rgba(245,245,247,0.25)" }}>/</span>
            <span
              className="text-[14.5px] font-medium truncate"
              style={{ color: "rgba(245,245,247,0.95)" }}
            >
              {labelForPath(pathname)}
            </span>
            <span
              className="ml-2 px-2 py-0.5 rounded-md text-[10.5px] tracking-[0.18em] uppercase"
              style={{
                background: `${accent}1f`,
                color: accent,
                fontFamily: "var(--font-mono)",
                border: `1px solid ${accent}33`,
              }}
            >
              v.1.04
            </span>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 px-3 rounded-lg inline-flex items-center gap-2 transition-colors hover:bg-white/[0.05]"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <SearchIcon />
              <span
                className="text-[12.5px]"
                style={{ color: "rgba(245,245,247,0.55)" }}
              >
                Search
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[10.5px]"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(245,245,247,0.55)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                ⌘K
              </span>
            </button>

            <Link
              href="/studio/plans"
              className="h-9 px-3 rounded-lg inline-flex items-center gap-2 transition-colors hover:bg-white/[0.05]"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span
                className="text-[12.5px] font-medium"
                style={{ color: "rgba(245,245,247,0.85)" }}
              >
                Starter
              </span>
              <span
                className="text-[12px]"
                style={{ color: accent }}
              >
                Upgrade
              </span>
            </Link>

            <UtilButton title="Notifications">
              <BellIcon />
              <span
                className="absolute top-2 right-2 size-1.5 rounded-full"
                style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
              />
            </UtilButton>

            {/* Avatar / profile menu */}
            <div data-profile-menu className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen((v) => !v);
                }}
                className="size-9 rounded-full grid place-items-center transition-transform hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: `0 4px 12px -2px ${glow}`,
                }}
                aria-label="Profile"
              >
                {(user?.firstName?.[0] || user?.username?.[0] || "W").toUpperCase()}
              </button>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-64 rounded-xl py-1.5 z-50"
                  style={{
                    background: "rgba(20,20,22,0.95)",
                    backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 20px 50px -10px rgba(0,0,0,0.6)",
                  }}
                >
                  <div className="px-3.5 py-3 flex items-center gap-3">
                    <div
                      className="size-9 rounded-full grid place-items-center text-[13px] font-semibold"
                      style={{
                        background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
                        color: "white",
                      }}
                    >
                      {(user?.firstName?.[0] || user?.username?.[0] || "W").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13.5px] font-medium truncate"
                        style={{ color: "rgba(245,245,247,0.95)" }}
                      >
                        {user?.fullName ||
                          user?.firstName ||
                          user?.username ||
                          "You"}
                      </div>
                      <div
                        className="text-[11.5px] truncate"
                        style={{ color: "rgba(245,245,247,0.5)" }}
                      >
                        {user?.primaryEmailAddress?.emailAddress ?? ""}
                      </div>
                    </div>
                  </div>
                  <div
                    className="h-px mx-3 my-1"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  />
                  <ProfileMenuItem
                    href="/studio/profile"
                    label="Profile"
                    onClick={() => setProfileOpen(false)}
                  />
                  <ProfileMenuItem
                    href="/studio/settings"
                    label="Settings"
                    onClick={() => setProfileOpen(false)}
                  />
                  <ProfileMenuItem
                    href="/studio/plans"
                    label="Plans & billing"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div
                    className="h-px mx-3 my-1"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  />
                  <ProfileMenuItem
                    href="/sign-out"
                    label="Sign out"
                    onClick={() => setProfileOpen(false)}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT SLOT */}
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function labelForPath(pathname: string) {
  if (pathname === "/studio") return "Studio";
  if (pathname.startsWith("/studio/library")) return "Library";
  if (pathname.startsWith("/studio/brand")) return "Brand";
  if (pathname.startsWith("/studio/audience")) return "Audience";
  if (pathname.startsWith("/studio/schedule")) return "Schedule";
  if (pathname.startsWith("/studio/analytics")) return "Analytics";
  if (pathname.startsWith("/studio/integrations")) return "Integrations";
  if (pathname.startsWith("/studio/settings")) return "Settings";
  if (pathname.startsWith("/studio/plans")) return "Plans & Billing";
  if (pathname.startsWith("/studio/profile")) return "Profile";
  return "Studio";
}

/* ============================================================
 * Sidebar primitives
 * ============================================================ */
function SidebarSection({ label }: { label: string }) {
  return (
    <div
      className="px-3 pt-3 pb-2 text-[10.5px] tracking-[0.22em] uppercase"
      style={{
        color: "rgba(245,245,247,0.35)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {label}
    </div>
  );
}

function SidebarLink({
  href,
  label,
  Icon,
  shortcut,
  isActive,
  accent,
  glow,
}: {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  shortcut?: string;
  isActive: boolean;
  accent: string;
  glow: string;
}) {
  return (
    <Link
      href={href}
      className="relative h-10 px-3 rounded-lg flex items-center gap-3 transition-colors group"
      style={{
        background: isActive ? "rgba(255,255,255,0.045)" : "transparent",
        color: isActive
          ? "rgba(245,245,247,1)"
          : "rgba(245,245,247,0.65)",
      }}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-sm"
          style={{
            background: accent,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />
      )}
      <span style={{ color: isActive ? accent : "rgba(245,245,247,0.5)" }}>
        <Icon size={17} />
      </span>
      <span className="text-[14.5px] font-medium flex-1">{label}</span>
      {shortcut && !isActive && (
        <span
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10.5px] px-1 rounded"
          style={{
            color: "rgba(245,245,247,0.45)",
            background: "rgba(255,255,255,0.05)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {shortcut}
        </span>
      )}
    </Link>
  );
}

function ProfileMenuItem({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block mx-1.5 px-2.5 py-2 rounded-lg text-[13.5px] transition-colors hover:bg-white/[0.06]"
      style={{ color: "rgba(245,245,247,0.85)" }}
    >
      {label}
    </Link>
  );
}

function UtilButton({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className="relative size-9 rounded-lg grid place-items-center transition-colors hover:bg-white/[0.05]"
      style={{
        color: "rgba(245,245,247,0.7)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================
 * Icons (stroke only, consistent 1.6 weight)
 * ============================================================ */
function StudioIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 12h8M8 8h5M8 16h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
function LibraryIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h6v14H4zM10 5h4v14h-4zM14 5h6v14h-6z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BrandIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-2.7L7 19.5l1-6-4-4 5.5-1z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function AudienceIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 19c1.4-3.2 4-4.5 6-4.5s4.6 1.3 6 4.5M15 19c1-2.4 3-3.3 4.5-3.3 1.2 0 2.3.6 3.5 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ScheduleIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 10h17M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
function AnalyticsIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20V10M10 20V4M16 20v-7M22 20H2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IntegrationsIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8a5 5 0 0 1 10 0v3M7 11h10v6a5 5 0 0 1-10 0v-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PlansIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function SettingsIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
function ChevronUpDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 9l4-4 4 4M8 15l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "rgba(245,245,247,0.4)" }}
      />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m20 20-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
