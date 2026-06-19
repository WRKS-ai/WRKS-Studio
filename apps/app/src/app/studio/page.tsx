"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

// /studio — composer-first welcome canvas.
// Implementing project_studio_master_plan.md §E (revised 2026-06-20):
//   - Dotted grid bg (~22px spacing) + mouse-spotlight overlay
//   - Personalized headline: "What's next, {agentName}?" Fraunces 480
//   - ONE rounded composer (~860px) — dark glass + crystal-light border
//   - (Brand-system mini-card LEFT + work strip + status line — next pass)
// Suggestion pills removed per user 2026-06-20 — canvas reads cleaner
// as just headline + composer, centered.

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
            width: "min(860px, 92vw)",
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
      </div>
    </main>
  );
}
