"use client";

import type { ReactNode } from "react";

// Stepper rail for /onboarding/business — Vibiz-style icon+circle pattern
// adapted to WRKS dark aesthetic. 2026-06-26 v4: GENEROUS vertical spacing
// per user direction ("the left side design should be long, like lines
// linking them so it takes more length of the page"). 70px gap between
// steps so the rail spans most of the page height, connecting hairlines
// run through the icon-circle centers as the visual anchor.
//
// Per-row layout (left→right): tabular mono step number, then step
// label, then a circular icon indicator anchored to the right edge of
// the rail. Active circle = filled warm cream (NO purple per chrome
// rule). Completed = hairline + checkmark. Upcoming = outline + resting
// icon at lower opacity.
//
// Click past or current step to navigate; future disabled.

export type StepperStep = {
  readonly id: number;
  readonly label: string;
  /** Resting icon for the step (rendered inside the circle indicator). */
  readonly icon: ReactNode;
};

export type StepperRailProps = {
  steps: ReadonlyArray<StepperStep>;
  currentStep: number;
  completed: Record<number, boolean>;
  onSelect: (id: number) => void;
};

const CIRCLE = 36;
const ROW_GAP = 70;

export default function StepperRail({
  steps,
  currentStep,
  completed,
  onSelect,
}: StepperRailProps) {
  return (
    <nav
      aria-label="Onboarding progress"
      className="relative flex h-full flex-col justify-center"
      style={{ padding: "48px 36px" }}
    >
      <ol className="relative flex flex-col" style={{ gap: ROW_GAP }}>
        {/* Connecting hairline — runs through the icon-circle centers on
            the right side. Top/bottom inset to avoid bleeding past the
            first / last circle. */}
        <div
          aria-hidden
          className="absolute w-px"
          style={{
            top: CIRCLE / 2,
            bottom: CIRCLE / 2,
            right: CIRCLE / 2,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 100%)",
          }}
        />

        {steps.map((s) => {
          const isActive = s.id === currentStep;
          const isCompleted = completed[s.id] && !isActive;
          const isUpcoming = !isActive && !isCompleted && s.id > currentStep;
          const canSelect = !isUpcoming;

          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => canSelect && onSelect(s.id)}
                disabled={!canSelect}
                aria-current={isActive ? "step" : undefined}
                className="relative flex items-center w-full text-left transition-all duration-200 group"
                style={{
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  cursor: canSelect ? "pointer" : "default",
                }}
              >
                <span
                  className="tabular-nums flex-shrink-0"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    letterSpacing: "0.08em",
                    color: isActive
                      ? "rgba(245,240,230,0.6)"
                      : isCompleted
                        ? "rgba(245,240,230,0.42)"
                        : "rgba(245,240,230,0.22)",
                    width: 24,
                  }}
                >
                  {String(s.id).padStart(2, "0")}
                </span>

                <span
                  className="flex-1"
                  style={{
                    fontSize: isActive ? 15 : 14,
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: "-0.005em",
                    lineHeight: 1.3,
                    color: isActive
                      ? "rgba(245,240,230,0.96)"
                      : isCompleted
                        ? "rgba(245,240,230,0.7)"
                        : "rgba(245,240,230,0.3)",
                    transition: "color 0.2s ease, font-size 0.2s ease",
                    paddingLeft: 4,
                    paddingRight: 14,
                  }}
                >
                  {s.label}
                </span>

                {/* Icon circle — dark glass disc with the step's icon
                    inside. Border state varies by phase:
                    - Active: `wrks-crystal-border-button` class drives a
                      slow-revolving comet around the rim (per the global
                      brand crystal-light treatment).
                    - Completed: solid warm-cream rim "locks" the circle.
                    - Upcoming: quiet hairline outline. */}
                <span
                  aria-hidden
                  className={`relative grid place-items-center flex-shrink-0 transition-colors duration-200 ${
                    isActive ? "wrks-crystal-border-button" : ""
                  }`}
                  style={{
                    width: CIRCLE,
                    height: CIRCLE,
                    borderRadius: 999,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    // Border is the state signal. Active uses no explicit
                    // border (the comet pseudo-element draws the rim).
                    // Completed = solid warm cream. Upcoming = faint
                    // hairline.
                    border: isActive
                      ? "none"
                      : isCompleted
                        ? "1.2px solid rgba(245,240,230,0.78)"
                        : "1px solid rgba(255,255,255,0.07)",
                    color: isActive
                      ? "rgba(245,240,230,0.95)"
                      : isCompleted
                        ? "rgba(245,240,230,0.85)"
                        : "rgba(245,240,230,0.38)",
                    boxShadow: isActive
                      ? "0 0 28px -8px rgba(245,240,230,0.18), inset 0 1px 0 rgba(255,255,255,0.06)"
                      : isCompleted
                        ? "0 0 18px -8px rgba(245,240,230,0.18)"
                        : "none",
                  }}
                >
                  {s.icon}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
