"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import PixelBlast from "@/components/pixel-blast";

// /studio — composer-first welcome canvas.
// Implementing project_studio_master_plan.md §E (revised 2026-06-20):
//   - Background: React Bits PixelBlast (Bayer-dither WebGL field) in
//     WRKS violet — replaces the dotted grid + mouse-spotlight overlay.
//     Ripples-on-click are the interactive moment; pointer events on
//     uncovered canvas trigger them. patternDensity tuned down + edgeFade
//     bumped so it reads as ambient texture, not a loud pattern.
//   - Personalized headline: "What's next, {agentName}?" Fraunces 480.
//   - ONE rounded composer (~860px) — dark glass + crystal-light border,
//     ~220px tall, with Site/Post mode tabs LEFT + mic/send icons RIGHT.
//   - (Brand-system mini-card LEFT + work strip + status line — next pass)
// {agentName} falls back to Clerk first name until agent-name state wires.

type Mode = "site" | "post";

export default function StudioWelcomePage() {
  const { user, isLoaded } = useUser();
  const firstName =
    user?.firstName || user?.username || (isLoaded ? "there" : "");

  const [mode, setMode] = useState<Mode>("site");

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      <div className="absolute inset-0">
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#7c3aed"
          patternScale={2}
          patternDensity={0.9}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          speed={0.45}
          edgeFade={0.28}
          transparent
        />
      </div>

      <div
        className="relative z-10 size-full flex flex-col items-center justify-center px-8 pointer-events-none"
        style={{ gap: 36 }}
      >
        {firstName && (
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(36px, 4vw, 54px)",
              fontWeight: 480,
              letterSpacing: "-0.028em",
              color: "rgba(248,247,252,0.97)",
              lineHeight: 1.04,
              textAlign: "center",
              margin: 0,
            }}
          >
            What&apos;s next, {firstName}?
          </h1>
        )}

        <div
          className="wrks-crystal-border pointer-events-auto"
          style={{
            width: "min(860px, 92vw)",
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="flex flex-col"
            style={{ padding: "18px 18px 14px 22px", minHeight: 220 }}
          >
            <textarea
              placeholder="Tell your agent what to build or refine…"
              className="w-full flex-1 resize-none bg-transparent outline-none"
              style={{
                color: "rgba(245,245,247,0.95)",
                fontSize: 15,
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.005em",
                lineHeight: 1.55,
                caretColor: "rgba(245,245,247,0.95)",
                minHeight: 132,
              }}
            />

            <div
              className="flex items-center justify-between"
              style={{ marginTop: 8 }}
            >
              <div className="flex items-center" style={{ gap: 4 }}>
                <ModeTab
                  label="Site"
                  icon={<SiteIcon />}
                  selected={mode === "site"}
                  onClick={() => setMode("site")}
                />
                <ModeTab
                  label="Post"
                  icon={<PostIcon />}
                  selected={mode === "post"}
                  onClick={() => setMode("post")}
                />
              </div>

              <div className="flex items-center" style={{ gap: 6 }}>
                <IconButton aria-label="Speak to your agent">
                  <MicIcon />
                </IconButton>
                <IconButton primary aria-label="Send">
                  <ArrowUpIcon />
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ModeTab({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center transition-colors duration-150"
      style={{
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12.5,
        fontFamily: "var(--font-sans)",
        letterSpacing: "-0.005em",
        background: selected ? "rgba(255,255,255,0.06)" : "transparent",
        color: selected
          ? "rgba(245,245,247,0.95)"
          : "rgba(245,245,247,0.55)",
        border: "1px solid",
        borderColor: selected ? "rgba(255,255,255,0.09)" : "transparent",
        cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function IconButton({
  children,
  primary,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className="flex items-center justify-center transition-colors duration-150"
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        background: primary ? "rgba(255,255,255,0.08)" : "transparent",
        color: primary
          ? "rgba(245,245,247,0.95)"
          : "rgba(245,245,247,0.6)",
        border: primary
          ? "1px solid rgba(255,255,255,0.1)"
          : "1px solid transparent",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function SiteIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  );
}

function PostIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="13" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}
