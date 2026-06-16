"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { StudioInspectorFrame } from "@/components/studio-inspector";
import { ShinyText } from "@/components/shiny-text";

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

  // personality.accent does NOT bleed into the studio chrome.
  // Per master plan §C: the user's palette accent only appears in
  // their site preview, the brand-system card, the floating Siri orb,
  // active page-card glow, and the publish-sweep animation.
  void personality;

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
          SIDEBAR (240px) — workspace + nav
          Surface tone: #101012 (slightly lifted from body #0a0a0c).
          Depth comes from tone delta + shadow on the canvas panel,
          not from a visible border. Hairline only at the boundary.
          ============================================================ */}
      <aside
        className="shrink-0 h-full flex flex-col"
        style={{
          width: 240,
          background: "#101012",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* WRKS Studio shining wordmark — same metallic shine sweep as
            the onboarding pages, slightly larger here (24px vs 20px)
            because the sidebar gives it room. The wordmark IS the brand
            mark for the chrome; the user's brand name lives in the top
            bar breadcrumb. A horizontal hairline underneath separates
            the wordmark from the nav, matching the Lovable pattern. */}
        <div
          className="px-5 pt-6 pb-5"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Link
            href="/studio"
            className="inline-flex items-center group"
            aria-label="WRKS Studio home"
          >
            <span
              className="leading-none transition-transform group-hover:scale-[1.02]"
              style={{ fontSize: 24, lineHeight: 1 }}
            >
              <ShinyText
                text="WRKS Studio"
                speed={7}
                delay={0.5}
                yoyo
                color="#857c92"
                shineColor="#f5f0e6"
                spread={100}
                direction="left"
                className="font-serif font-medium tracking-[-0.025em]"
              />
            </span>
          </Link>
        </div>

        {/* Primary nav. No horizontal padding on the container —
            rows extend edge-to-edge so the active hairline rule
            sits flush against the sidebar's left edge. */}
        <div className="flex-1 overflow-y-auto">
          <SidebarSection label="Workspace" />
          <nav className="flex flex-col">
            {PRIMARY_NAV.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.Icon}
                shortcut={item.shortcut}
                isActive={pathname === item.href}
              />
            ))}
          </nav>

          <div style={{ marginTop: 16 }}>
            <SidebarSection label="Account" />
            <nav className="flex flex-col">
              {SECONDARY_NAV.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  Icon={item.Icon}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* Agent identity moved to the right inspector — that's where
            the agent lives. Sidebar gets quiet bottom padding so the
            nav doesn't feel anchored to the floor. */}
        <div className="h-4 shrink-0" aria-hidden />
      </aside>

      {/* ============================================================
          MAIN COLUMN — top bar + content
          ============================================================ */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        {/* TOP BAR — minimal chrome. Breadcrumb + version as
            typography on the left; Cmd-K icon, upgrade as a hairline
            link, notifications, avatar on the right. No visible
            search input, no chip-style pill for version. */}
        <header
          className="shrink-0 flex items-center justify-between gap-6"
          style={{
            height: 60,
            padding: "0 28px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-baseline gap-3 min-w-0">
            <span
              style={{
                fontSize: 13.5,
                color: "rgba(245,245,247,0.48)",
                letterSpacing: "-0.005em",
              }}
            >
              {brandName}
            </span>
            <span style={{ color: "rgba(245,245,247,0.22)", fontSize: 13 }}>
              /
            </span>
            <span
              className="truncate"
              style={{
                fontSize: 14.5,
                fontWeight: 500,
                color: "rgba(245,245,247,0.96)",
                letterSpacing: "-0.005em",
              }}
            >
              {labelForPath(pathname)}
            </span>
            {/* Version — typography element. Hairline before it acts
                as the visual separator instead of a chip border. */}
            <span
              aria-hidden
              className="block"
              style={{
                width: 18,
                height: 1,
                marginLeft: 6,
                marginRight: 2,
                background: "rgba(245,245,247,0.18)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                letterSpacing: "0.08em",
                color: "rgba(245,245,247,0.42)",
              }}
            >
              v3.2
            </span>
          </div>

          {/* Right cluster — tight, minimal */}
          <div className="flex items-center gap-1">
            {/* Cmd-K — icon-only button with shortcut hint that
                appears on hover. No visible "Search" label. */}
            <button
              type="button"
              aria-label="Search (⌘K)"
              title="Search · ⌘K"
              className="group relative inline-flex items-center justify-center transition-colors hover:bg-white/[0.04] rounded-md"
              style={{ width: 36, height: 36 }}
            >
              <span style={{ color: "rgba(245,245,247,0.6)" }}>
                <SearchIcon />
              </span>
            </button>

            {/* Plan — hairline link, not a button. */}
            <Link
              href="/studio/plans"
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-100"
              style={{
                padding: "0 12px",
                height: 36,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(245,245,247,0.55)",
                opacity: 0.9,
              }}
            >
              <span style={{ color: "rgba(245,245,247,0.45)" }}>Starter</span>
              <span style={{ color: "#f5f0e6", fontWeight: 600 }}>· Upgrade</span>
            </Link>

            <UtilButton title="Notifications">
              <BellIcon />
              <span
                className="absolute top-1.5 right-1.5 rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  background: "#f5f0e6",
                  boxShadow: "0 0 6px rgba(245,240,230,0.55)",
                }}
              />
            </UtilButton>

            {/* Avatar / profile menu — neutral chrome glass. The
                user's palette accent never appears on the top-bar
                avatar; it stays a brand-neutral element. */}
            <div data-profile-menu className="relative" style={{ marginLeft: 4 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen((v) => !v);
                }}
                className="rounded-full grid place-items-center transition-transform hover:scale-105"
                style={{
                  width: 32,
                  height: 32,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f5f0e6",
                  fontSize: 13.5,
                  fontWeight: 600,
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
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#f5f0e6",
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

        {/* CONTENT + INSPECTOR — inspector persists across routes */}
        <div className="flex-1 min-h-0 overflow-hidden flex">
          <StudioInspectorFrame>{children}</StudioInspectorFrame>
        </div>
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
      className="pt-5 pb-2 uppercase"
      style={{
        paddingLeft: 20,
        paddingRight: 20,
        fontSize: 11,
        letterSpacing: "0.28em",
        color: "rgba(245,245,247,0.4)",
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
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
}: {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  shortcut?: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 transition-colors group ${
        isActive ? "" : "hover:bg-white/[0.035]"
      }`}
      style={{
        padding: "9px 12px",
        marginLeft: 8,
        marginRight: 8,
        borderRadius: 8,
        background: isActive
          ? "rgba(255,255,255,0.065)"
          : undefined,
        border: isActive
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid transparent",
        color: isActive
          ? "rgba(245,245,247,1)"
          : "rgba(245,245,247,0.7)",
      }}
    >
      <span
        className="shrink-0"
        style={{
          color: isActive
            ? "rgba(245,245,247,0.96)"
            : "rgba(245,245,247,0.55)",
          transition: "color 180ms ease-out",
        }}
      >
        <Icon size={18} />
      </span>
      <span
        className="flex-1"
        style={{
          fontSize: 15,
          fontWeight: isActive ? 500 : 400,
          letterSpacing: "-0.005em",
          transition: "color 180ms ease-out",
        }}
      >
        {label}
      </span>
      {shortcut && !isActive && (
        <span
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            fontSize: 10.5,
            color: "rgba(245,245,247,0.45)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          ⌘{shortcut}
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
      className="relative rounded-md grid place-items-center transition-colors hover:bg-white/[0.04]"
      style={{
        width: 36,
        height: 36,
        color: "rgba(245,245,247,0.6)",
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
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
