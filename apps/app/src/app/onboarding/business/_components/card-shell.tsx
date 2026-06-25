"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// CardShell — the common frame each business-discovery card lives in.
// No eyebrow (per `feedback_never_use_eyebrows.md`), no glass card
// wrapper (per `feedback_no_boxes_pattern.md`). Just headline + subhead
// + content area + an action row at the bottom.
//
// Layout is anchored top-left of the right pane — NOT center-stacked.
// The stepper rail on the left already carries step context.

export type CardShellProps = {
  headline: string;
  subhead?: string;
  children: ReactNode;
  /** Right-bottom slot for primary action(s) — Next / Skip / etc. */
  actions: ReactNode;
};

export default function CardShell({
  headline,
  subhead,
  children,
  actions,
}: CardShellProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative flex flex-col"
      style={{ gap: 28 }}
    >
      <header className="flex flex-col" style={{ gap: 10 }}>
        <h1
          style={{
            // 2026-06-26: card headline scale per `feedback_hero_scale_max_60px.md`.
            // Max 40px — restrained relative to page-level heroes (52px on
            // voice/name) since these cards live inside a stepper flow.
            fontSize: "clamp(1.625rem, 2.8vw, 2.5rem)",
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            color: "rgba(245,240,230,0.98)",
          }}
        >
          {headline}
        </h1>
        {subhead && (
          <p
            style={{
              fontSize: "clamp(0.9375rem, 1.15vw, 1.0625rem)",
              lineHeight: 1.5,
              letterSpacing: "-0.005em",
              color: "rgba(245,240,230,0.55)",
              maxWidth: "62ch",
            }}
          >
            {subhead}
          </p>
        )}
      </header>

      <div className="relative">{children}</div>

      <div className="flex items-center justify-end" style={{ gap: 12, marginTop: 12 }}>
        {actions}
      </div>
    </motion.div>
  );
}

// Small helper buttons used inside `actions` slots. Kept here so the
// per-card files don't each re-style their own primary/secondary buttons.

export function NextButton({
  onClick,
  disabled,
  label = "Next",
  busy,
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled || !!busy}
      className="inline-flex items-center transition-colors duration-150 disabled:cursor-not-allowed"
      style={{
        padding: "10px 18px",
        gap: 8,
        borderRadius: 999,
        fontSize: 13.5,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        background: disabled || busy
          ? "rgba(255,255,255,0.04)"
          : "rgba(245,240,230,0.92)",
        color: disabled || busy ? "rgba(245,240,230,0.35)" : "#0a0a0c",
        border: "1px solid",
        borderColor: disabled || busy
          ? "rgba(255,255,255,0.06)"
          : "rgba(245,240,230,0.92)",
        cursor: disabled || busy ? "not-allowed" : "pointer",
      }}
    >
      {busy ? "Saving…" : label}
      {!busy && (
        <span aria-hidden style={{ marginLeft: 2 }}>
          →
        </span>
      )}
    </button>
  );
}

export function SecondaryButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      className="inline-flex items-center transition-colors duration-150 disabled:cursor-not-allowed"
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 400,
        letterSpacing: "-0.005em",
        background: "transparent",
        color: disabled ? "rgba(245,240,230,0.25)" : "rgba(245,240,230,0.55)",
        border: "1px solid transparent",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}
