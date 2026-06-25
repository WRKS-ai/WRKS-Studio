"use client";

// Stepper rail for /onboarding/business — typographic, not graphical.
// Premium product UI references (Linear, Mercury, Stripe checkout) lean
// on type hierarchy over numbered-circle widgets. The active step pops
// via weight + opacity; completed steps mark with a hairline check icon
// inline left of the label; upcoming steps fade.
//
// No vertical connecting line. No numbered-circle widget. No background
// tint on the rail (blends with the canvas). The whole rail reads as
// editorial table-of-contents — quiet, confident, no Bootstrap-wizard
// energy.
//
// Click any past or current step to navigate to it. Future steps are
// not clickable (you can't skip ahead).

export type StepperStep = {
  readonly id: number;
  readonly label: string;
};

export type StepperRailProps = {
  steps: ReadonlyArray<StepperStep>;
  currentStep: number;
  completed: Record<number, boolean>;
  onSelect: (id: number) => void;
};

export default function StepperRail({
  steps,
  currentStep,
  completed,
  onSelect,
}: StepperRailProps) {
  const total = steps.length;
  const activeLabel =
    steps.find((s) => s.id === currentStep)?.label ?? "";

  return (
    <nav
      aria-label="Onboarding progress"
      className="flex h-full flex-col"
      style={{ padding: "56px 36px" }}
    >
      {/* Step counter — tabular mono pair, top of rail. The active section
          name follows on a second line for context without taking nav space. */}
      <div
        className="flex flex-col"
        style={{ gap: 6, marginBottom: 44 }}
      >
        <span
          className="tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            letterSpacing: "0.14em",
            color: "rgba(245,240,230,0.42)",
            textTransform: "uppercase",
          }}
        >
          {String(currentStep).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span
          style={{
            fontSize: 13,
            letterSpacing: "-0.005em",
            color: "rgba(245,240,230,0.62)",
          }}
        >
          {activeLabel}
        </span>
      </div>

      {/* Steps — typographic. No circles, no vertical line. Active = bigger
          + full opacity. Completed = checkmark + medium opacity. Upcoming =
          dim. */}
      <ol className="flex flex-col" style={{ gap: 14 }}>
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
                className="flex items-baseline w-full text-left transition-all duration-200"
                style={{
                  gap: 12,
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  cursor: canSelect ? "pointer" : "default",
                }}
              >
                {/* Indicator slot — fixed width so labels align. Active
                    gets nothing (the label weight + size does the work);
                    completed gets a hairline checkmark; upcoming gets a
                    quiet bullet. */}
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 16,
                    height: 16,
                    color: isCompleted
                      ? "rgba(245,240,230,0.55)"
                      : "rgba(245,240,230,0.25)",
                    transform: "translateY(2px)",
                  }}
                >
                  {isCompleted ? (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isActive ? null : (
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: 999,
                        background: "rgba(245,240,230,0.32)",
                      }}
                    />
                  )}
                </span>

                <span
                  style={{
                    fontSize: isActive ? 16 : 14,
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: "-0.005em",
                    lineHeight: 1.3,
                    color: isActive
                      ? "rgba(245,240,230,0.95)"
                      : isCompleted
                        ? "rgba(245,240,230,0.62)"
                        : "rgba(245,240,230,0.32)",
                    transition: "color 0.2s ease, font-size 0.2s ease",
                  }}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
