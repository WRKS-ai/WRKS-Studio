"use client";

// Stepper rail for /onboarding/business — vertical step navigator on
// the left, mirroring the Vibiz layout pattern but in WRKS aesthetic:
// dark canvas, Geist labels, hairline circles, NO glowing orbs / no
// accent color (per `feedback_no_accent_on_chrome_at_all.md`).
//
// Active step: warm-cream circle fill + label at full opacity.
// Completed step: hairline circle with a subtle checkmark inside +
// label at 0.7 opacity.
// Upcoming step: empty hairline circle + label at 0.35 opacity.
//
// Click any completed step (or the current step) to navigate to it.
// Future steps are not clickable (you can't skip ahead).

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
  return (
    <nav
      aria-label="Onboarding progress"
      className="flex h-full flex-col"
      style={{ padding: "44px 32px" }}
    >
      <ol className="relative flex flex-col" style={{ gap: 28 }}>
        {/* Vertical hairline running through the circle centers.
            Inset to avoid bleeding past the first / last circle. */}
        <div
          aria-hidden
          className="absolute left-[15px] top-3 bottom-3 w-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />

        {steps.map((s) => {
          const isActive = s.id === currentStep;
          const isCompleted = completed[s.id] && !isActive;
          const isUpcoming = !isActive && !isCompleted && s.id > currentStep;
          const canSelect = !isUpcoming;

          return (
            <li key={s.id} className="relative flex items-center" style={{ gap: 14 }}>
              <button
                type="button"
                onClick={() => canSelect && onSelect(s.id)}
                disabled={!canSelect}
                aria-current={isActive ? "step" : undefined}
                className="relative grid place-items-center transition-all duration-200"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: isActive
                    ? "rgba(245,240,230,0.92)"
                    : "rgba(255,255,255,0.012)",
                  border: isActive
                    ? "1px solid rgba(245,240,230,0.92)"
                    : isCompleted
                      ? "1px solid rgba(255,255,255,0.18)"
                      : "1px solid rgba(255,255,255,0.08)",
                  color: isActive
                    ? "#0a0a0c"
                    : isCompleted
                      ? "rgba(245,240,230,0.75)"
                      : "rgba(245,240,230,0.45)",
                  cursor: canSelect ? "pointer" : "not-allowed",
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.04em",
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    {s.id}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => canSelect && onSelect(s.id)}
                disabled={!canSelect}
                className="text-left transition-opacity duration-200 hover:opacity-90"
                style={{
                  fontSize: 14,
                  letterSpacing: "-0.005em",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive
                    ? "rgba(245,240,230,0.95)"
                    : isCompleted
                      ? "rgba(245,240,230,0.7)"
                      : "rgba(245,240,230,0.35)",
                  cursor: canSelect ? "pointer" : "default",
                  flex: 1,
                  padding: 0,
                  background: "transparent",
                  border: "none",
                }}
              >
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
