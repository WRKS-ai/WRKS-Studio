"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type React from "react";
import { PERSONALITIES, type Personality, type PersonalityId } from "@/lib/personalities";

// Shared shell for /studio sub-pages (Plans, Settings, Profile, Library, etc.).
// Provides a consistent header (title + subtitle + actions) and a scrollable
// content area that sits inside the StudioLayout's content slot.

export function StudioPageShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth = 980,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div className="size-full overflow-y-auto">
      <div
        className="mx-auto px-10 py-10"
        style={{ maxWidth }}
      >
        <motion.header
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          className="mb-10 flex items-end justify-between gap-6"
        >
          <div>
            <h1
              className="font-serif font-medium tracking-tight"
              style={{
                fontSize: "clamp(1.75rem, 2.2vw, 2.25rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "rgba(245,245,247,0.98)",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-3 text-[15px] leading-relaxed max-w-[55ch]"
                style={{ color: "rgba(245,245,247,0.6)" }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2.5">{actions}</div>}
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
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
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
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
  accent: string;
}) {
  return (
    <Card className="p-10">
      <div className="flex items-start gap-5">
        <div
          className="size-12 rounded-xl grid place-items-center"
          style={{
            background: `${accent}1a`,
            border: `1px solid ${accent}33`,
            color: accent,
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2
              className="text-[20px] font-medium tracking-tight"
              style={{ color: "rgba(245,245,247,0.95)" }}
            >
              {title}
            </h2>
            <span
              className="px-2 py-0.5 rounded-md text-[10.5px] tracking-[0.2em] uppercase"
              style={{
                background: `${accent}1f`,
                color: accent,
                border: `1px solid ${accent}33`,
                fontFamily: "var(--font-mono)",
              }}
            >
              Soon
            </span>
          </div>
          <p
            className="text-[15px] leading-relaxed max-w-[60ch]"
            style={{ color: "rgba(245,245,247,0.65)" }}
          >
            {description}
          </p>
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 text-[14px]"
                style={{ color: "rgba(245,245,247,0.78)" }}
              >
                <span
                  className="mt-1.5 size-1.5 rounded-full shrink-0"
                  style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
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
