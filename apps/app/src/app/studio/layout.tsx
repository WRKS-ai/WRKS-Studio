"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  const [personality, setPersonality] = useState<Personality | null>(null);

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
  }, [router]);

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
            because the sidebar gives it room. A horizontal hairline
            underneath separates the wordmark from the nav, matching the
            Lovable pattern. Padding tuned so the hairline → WORKSPACE
            label gap sits at ~24px, not ~40px. */}
        <div
          className="px-5 pt-5 pb-4"
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

          <div style={{ marginTop: 10 }}>
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

        {/* User menu trigger pinned to the bottom-left of the sidebar.
            Clicking the avatar opens a dropdown that animates upward —
            user identity row at top, menu items in the middle, Sign out
            in a separate footer block. Same pattern as the reference
            (Lovable / Linear / Notion / Cursor sidebar profile menus). */}
        <UserMenu />
      </aside>

      {/* ============================================================
          MAIN COLUMN — top bar + content
          ============================================================ */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        {/* TOP BAR removed — re-add when we agree on what the top
            chrome should be. Sidebar + floating Siri orb remain. */}

        {/* CONTENT + INSPECTOR — inspector persists across routes */}
        <div className="flex-1 min-h-0 overflow-hidden flex">
          <StudioInspectorFrame>{children}</StudioInspectorFrame>
        </div>
      </div>
    </div>
  );
}
/* ============================================================
 * Sidebar primitives
 * ============================================================ */
function SidebarSection({ label }: { label: string }) {
  return (
    <div
      className="uppercase"
      style={{
        paddingTop: 14,
        paddingBottom: 8,
        paddingLeft: 20,
        paddingRight: 20,
        fontSize: 11,
        letterSpacing: "0.28em",
        color: "rgba(245,245,247,0.42)",
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

/* ============================================================
 * UserMenu — bottom-left sidebar profile dropdown
 *
 * Trigger: small avatar button anchored at the bottom of the sidebar.
 * Dropdown: glass card that opens UPWARD smoothly. Identity row at the
 * top (avatar + name + email), menu items, then Sign out in its own
 * footer block. Click outside or pick an item to close.
 * ============================================================ */
function UserMenu() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Click outside closes the menu.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const node = wrapRef.current;
      if (!node) return;
      if (!node.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Escape key closes the menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const initial = (
    user?.firstName?.[0] ||
    user?.username?.[0] ||
    user?.primaryEmailAddress?.emailAddress?.[0] ||
    "U"
  ).toUpperCase();
  const displayName =
    user?.fullName || user?.firstName || user?.username || "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const photoUrl = user?.imageUrl ?? "";

  return (
    <div
      ref={wrapRef}
      className="relative shrink-0"
      style={{ padding: "12px 14px" }}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open user menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid place-items-center transition-transform hover:scale-[1.04]"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#f5f0e6",
          fontSize: 13.5,
          fontWeight: 600,
          overflow: "hidden",
        }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initial
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{
              duration: 0.22,
              ease: [0.22, 0.72, 0.2, 1],
            }}
            className="absolute z-50"
            style={{
              left: 14,
              bottom: "calc(100% - 4px)",
              width: 252,
              padding: 6,
              borderRadius: 14,
              background: "rgba(18,18,22,0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow:
                "0 26px 60px -16px rgba(0,0,0,0.75), 0 4px 12px -4px rgba(0,0,0,0.55)",
              transformOrigin: "bottom left",
            }}
          >
            {/* Identity row */}
            <div
              className="flex items-center gap-3"
              style={{ padding: "10px 10px 12px" }}
            >
              <span
                className="shrink-0 grid place-items-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f5f0e6",
                  fontSize: 14,
                  fontWeight: 600,
                  overflow: "hidden",
                }}
                aria-hidden
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initial
                )}
              </span>
              <div className="flex-1 min-w-0" style={{ lineHeight: 1.15 }}>
                <div
                  className="truncate"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgba(245,245,247,0.96)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {displayName}
                </div>
                {email && (
                  <div
                    className="truncate"
                    style={{
                      fontSize: 12,
                      color: "rgba(245,245,247,0.48)",
                      marginTop: 2,
                    }}
                  >
                    {email}
                  </div>
                )}
              </div>
            </div>

            {/* Hairline */}
            <div
              aria-hidden
              className="h-px mx-1.5 my-1"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />

            {/* Menu items */}
            <UserMenuLink
              href="/studio/profile"
              label="Profile"
              Icon={ProfileIcon}
              onPick={() => setOpen(false)}
            />
            <UserMenuLink
              href="/studio/settings"
              label="Settings"
              Icon={SettingsIcon}
              onPick={() => setOpen(false)}
            />
            <UserMenuLink
              href="/studio/plans"
              label="Plans & billing"
              Icon={PlansIcon}
              onPick={() => setOpen(false)}
            />
            <UserMenuLink
              href="/"
              label="Home"
              Icon={HomeIcon}
              onPick={() => setOpen(false)}
            />

            {/* Hairline */}
            <div
              aria-hidden
              className="h-px mx-1.5 my-1"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />

            {/* Sign out — wraps a Clerk SignOutButton */}
            <SignOutButton>
              <button
                type="button"
                className="flex items-center gap-3 w-full text-left transition-colors hover:bg-white/[0.05] rounded-md"
                style={{
                  padding: "9px 10px",
                  color: "rgba(245,245,247,0.85)",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                <span
                  className="shrink-0"
                  style={{ color: "rgba(245,245,247,0.55)" }}
                >
                  <SignOutIcon size={17} />
                </span>
                Sign out
              </button>
            </SignOutButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenuLink({
  href,
  label,
  Icon,
  onPick,
}: {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  onPick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onPick}
      className="flex items-center gap-3 transition-colors hover:bg-white/[0.05] rounded-md"
      style={{
        padding: "9px 10px",
        color: "rgba(245,245,247,0.92)",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.005em",
      }}
    >
      <span
        className="shrink-0"
        style={{ color: "rgba(245,245,247,0.6)" }}
      >
        <Icon size={17} />
      </span>
      {label}
    </Link>
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
function ProfileIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4 20c1.5-3.4 4.6-5 8-5s6.5 1.6 8 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
function HomeIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-3v-7H10v7H5a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SignOutIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
