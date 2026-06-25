"use client";

import type { ReactNode } from "react";

// Stepper rail for /onboarding/business — Vibiz-style pattern adapted
// to WRKS dark aesthetic per user reference 2026-06-26.
//
// Per-row layout (left→right): tabular mono step number, then step
// label, then a circular icon indicator anchored to the right edge of
// the rail. A hairline vertical line runs through the icon-circle
// centers, connecting them. The active step's circle is filled in
// warm cream (NOT purple — chrome rule via `feedback_no_accent_on_chrome_at_all.md`)
// with the dark icon inside; completed steps get a hairline circle +
// checkmark inside; upcoming steps get a quiet outline circle + the
// step's resting icon.
//
// Click past or current step to navigate; future steps disabled.

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
const ROW_GAP = 28;

export default function StepperRail({
  steps,
  currentStep,
  completed,
  onSelect,
}: StepperRailProps) {
  return (
    <nav
      aria-label="Onboarding progress"
      className="relative flex h-full flex-col"
      style={{ padding: "56px 32px" }}
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
            background: "rgba(255,255,255,0.06)",
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
                className="relative flex items-center w-full text-left transition-all duration-200"
                style={{
                  gap: 0,
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  cursor: canSelect ? "pointer" : "default",
                }}
              >
                {/* Step number — tabular mono, far left. */}
                <span
                  className="tabular-nums flex-shrink-0"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    letterSpacing: "0.06em",
                    color: isActive
                      ? "rgba(245,240,230,0.55)"
                      : isCompleted
                        ? "rgba(245,240,230,0.4)"
                        : "rgba(245,240,230,0.22)",
                    width: 22,
                  }}
                >
                  {String(s.id).padStart(2, "0")}
                </span>

                {/* Label — fills middle, pushes icon to the right. */}
                <span
                  className="flex-1"
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: "-0.005em",
                    lineHeight: 1.3,
                    color: isActive
                      ? "rgba(245,240,230,0.95)"
                      : isCompleted
                        ? "rgba(245,240,230,0.65)"
                        : "rgba(245,240,230,0.32)",
                    transition: "color 0.2s ease",
                    paddingLeft: 4,
                    paddingRight: 12,
                  }}
                >
                  {s.label}
                </span>

                {/* Icon circle — visual anchor, hugs right edge of the rail.
                    Active = filled warm cream (NOT purple per chrome rule)
                    with dark icon. Completed = hairline circle + checkmark.
                    Upcoming = quiet outline circle + the step's resting icon. */}
                <span
                  aria-hidden
                  className="relative grid place-items-center flex-shrink-0 transition-all duration-200"
                  style={{
                    width: CIRCLE,
                    height: CIRCLE,
                    borderRadius: 999,
                    background: isActive
                      ? "rgba(245,240,230,0.94)"
                      : "rgba(10,10,12,1)",
                    border: isActive
                      ? "1px solid rgba(245,240,230,0.94)"
                      : isCompleted
                        ? "1px solid rgba(255,255,255,0.16)"
                        : "1px solid rgba(255,255,255,0.07)",
                    color: isActive
                      ? "rgba(10,10,12,0.95)"
                      : isCompleted
                        ? "rgba(245,240,230,0.7)"
                        : "rgba(245,240,230,0.4)",
                    boxShadow: isActive
                      ? "0 10px 26px -8px rgba(245,240,230,0.18)"
                      : "none",
                  }}
                >
                  {isCompleted ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.icon
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
