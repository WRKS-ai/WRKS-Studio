"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

// /studio — composer-first welcome canvas.
// Implementing project_studio_master_plan.md §E (locked 2026-06-13):
//   - Dotted grid bg (~22px spacing) + mouse-spotlight overlay
//   - Personalized headline: "What's next, {agentName}?" Fraunces 480
//   - ONE rounded composer (~720px) — dark glass + crystal-light border
//   - 3 suggestion pills below composer (crystal-light pill buttons)
//   - (Brand-system mini-card LEFT + work strip + status line — next pass)
// Aurora + "Welcome back / cover card" experiments removed.
//
// {agentName} is the user's named WRKS agent. Falls back to Clerk first
// name until the agent-name state wiring lands; same TODO for composer
// placeholder.

export default function StudioWelcomePage() {
  const { user, isLoaded } = useUser();
  const firstName =
    user?.firstName || user?.username || (isLoaded ? "there" : "");

  const containerRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const onLeave = () => setSpot(null);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <main
      ref={containerRef}
      className="relative size-full overflow-hidden"
      style={{
        background: "#0a0a0c",
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {spot && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle 420px at ${spot.x}px ${spot.y}px, rgba(255,255,255,0.05), transparent 65%)`,
          }}
        />
      )}

      <div
        className="relative z-10 size-full flex flex-col items-center justify-center px-8"
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
          className="wrks-crystal-border"
          style={{
            width: "min(720px, 92vw)",
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "18px 22px",
          }}
        >
          <textarea
            rows={2}
            placeholder="Tell your agent what to build or refine…"
            className="w-full resize-none bg-transparent outline-none"
            style={{
              color: "rgba(245,245,247,0.95)",
              fontSize: 15,
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.005em",
              lineHeight: 1.5,
              caretColor: "rgba(245,245,247,0.95)",
            }}
          />
        </div>

        <div className="flex gap-2.5 flex-wrap justify-center">
          {["Refine the landing", "Draft a new ad", "Add a pricing page"].map(
            (label) => (
              <button
                key={label}
                type="button"
                className="wrks-crystal-border-button transition-colors duration-200 hover:bg-white/[0.025]"
                style={{
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  color: "rgba(245,245,247,0.85)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  letterSpacing: "-0.005em",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>
    </main>
  );
}
