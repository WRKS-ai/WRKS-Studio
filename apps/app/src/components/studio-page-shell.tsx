"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type React from "react";
import { PERSONALITIES, type Personality, type PersonalityId } from "@/lib/personalities";

// Shared shell for /studio sub-pages (Plans, Settings, Profile, Library, etc.).
// Phase 4 — surface system aligned with the redesigned /studio main page:
//   * Borderless cards (#16161A panel tone, no visible 1px rim) — depth
//     comes from a soft shadow, not chrome.
//   * Mercury-style title block: Fraunces 28-32 weight 480 with mono-
//     caps eyebrow above and a thin sub-line.
//   * No tinted backgrounds or chip pills.
//   * Accent used only on focus, active state, and primary CTA.

export function StudioPageShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth = 980,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
  /** Small mono caps label above the title — page section context.
   *  Defaults to nothing when omitted (legacy callers stay clean). */
  eyebrow?: string;
}) {
  return (
    <div className="size-full overflow-y-auto" style={{ background: "#0a0a0c" }}>
      <div
        className="mx-auto"
        style={{ maxWidth, padding: "36px 40px 56px" }}
      >
        <motion.header
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex items-end justify-between gap-6"
          style={{ marginBottom: 36 }}
        >
          <div className="min-w-0">
            {eyebrow && (
              <div
                className="uppercase mb-3"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.28em",
                  color: "rgba(245,245,247,0.38)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                }}
              >
                {eyebrow}
              </div>
            )}
            <h1
              className="font-serif"
              style={{
                fontSize: "clamp(1.75rem, 2.3vw, 2.125rem)",
                fontWeight: 480,
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                color: "rgba(245,245,247,0.97)",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-2.5"
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "rgba(245,245,247,0.55)",
                  maxWidth: "55ch",
                  letterSpacing: "-0.005em",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

/** Borderless canvas panel — replaces the visible-rim card. Depth
 *  comes from a single soft shadow against the slightly lifted
 *  surface tone (#16161A on #0a0a0c body). */
export function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "#16161A",
        boxShadow: "0 24px 60px -28px rgba(0,0,0,0.45)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ComingSoon({
  icon,
  title,
  description,
  bullets,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
}) {
  // Chrome surface — neutral warm-cream only. Personality accent
  // does not bleed into the stub-page shell.
  return (
    <Card style={{ padding: "32px 36px 36px" }}>
      <div className="flex items-start gap-5">
        <div
          className="shrink-0 grid place-items-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            color: "rgba(245,240,230,0.85)",
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 8 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "rgba(245,245,247,0.95)",
                letterSpacing: "-0.012em",
              }}
            >
              {title}
            </h2>
            <span
              className="uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.32em",
                color: "rgba(245,240,230,0.85)",
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}
            >
              · soon
            </span>
          </div>
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "rgba(245,245,247,0.6)",
              maxWidth: "62ch",
              letterSpacing: "-0.005em",
            }}
          >
            {description}
          </p>
          <ul
            className="grid grid-cols-1 sm:grid-cols-2"
            style={{ marginTop: 24, gap: 10 }}
          >
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5"
                style={{
                  fontSize: 13,
                  color: "rgba(245,245,247,0.75)",
                  lineHeight: 1.5,
                  letterSpacing: "-0.005em",
                }}
              >
                <span
                  aria-hidden
                  className="block rounded-full shrink-0"
                  style={{
                    marginTop: 7,
                    width: 4,
                    height: 4,
                    background: "#f5f0e6",
                    boxShadow: "0 0 5px rgba(245,240,230,0.55)",
                  }}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export function usePersonality(): Personality {
  const [personality, setPersonality] = useState<Personality>(PERSONALITIES[1]);
  useEffect(() => {
    const id = localStorage.getItem("wrks-onboarding-personality") as
      | PersonalityId
      | null;
    const found = id ? PERSONALITIES.find((p) => p.id === id) : null;
    if (found) setPersonality(found);
  }, []);
  return personality;
}
