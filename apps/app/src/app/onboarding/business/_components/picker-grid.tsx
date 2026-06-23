"use client";

import type { ReactNode } from "react";

// PickerGrid — option grid for single-select / multi-select picker cards.
// Each option is a button: icon (optional) + label + optional descriptor.
// Selected state: warm-cream hairline + slightly brighter bg (no purple
// accent on chrome). Hover: subtle brightening. Disabled options dim out
// (used for the locked "Both" option when a user hasn't picked either).
//
// Cols controls layout density: 2 (default) for short label sets,
// 3 for compact dense grids (e.g. traffic sources).

export type PickerOption<V extends string> = {
  value: V;
  label: string;
  /** Optional second-line muted text. Used for brand-voice exemplars. */
  descriptor?: string;
  /** Optional inline icon (SVG element). */
  icon?: ReactNode;
};

export type PickerGridProps<V extends string> =
  | {
      mode: "single";
      options: ReadonlyArray<PickerOption<V>>;
      value: V | null;
      onChange: (next: V) => void;
      cols?: 2 | 3;
    }
  | {
      mode: "multi";
      options: ReadonlyArray<PickerOption<V>>;
      value: V[] | null;
      onChange: (next: V[]) => void;
      cols?: 2 | 3;
    };

export default function PickerGrid<V extends string>(
  props: PickerGridProps<V>,
) {
  const { options, mode } = props;
  const cols = props.cols ?? 2;

  const isSelected = (v: V): boolean => {
    if (mode === "single") return props.value === v;
    return (props.value ?? []).includes(v);
  };

  const toggle = (v: V) => {
    if (mode === "single") {
      props.onChange(v);
      return;
    }
    const current = props.value ?? [];
    const next = current.includes(v)
      ? current.filter((x) => x !== v)
      : [...current, v];
    props.onChange(next);
  };

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: 10,
      }}
    >
      {options.map((opt) => {
        const selected = isSelected(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            aria-pressed={selected}
            className="text-left transition-all duration-150"
            style={{
              padding: opt.descriptor ? "14px 16px" : "14px 16px",
              borderRadius: 12,
              background: selected
                ? "rgba(255,255,255,0.045)"
                : "rgba(255,255,255,0.014)",
              border: selected
                ? "1px solid rgba(245,240,230,0.45)"
                : "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
              display: "flex",
              flexDirection: opt.descriptor ? "column" : "row",
              gap: opt.descriptor ? 6 : 10,
              alignItems: opt.descriptor ? "flex-start" : "center",
            }}
          >
            <span
              className="flex items-center"
              style={{ gap: 10 }}
            >
              {opt.icon && (
                <span
                  aria-hidden
                  className="grid place-items-center flex-shrink-0"
                  style={{
                    width: 18,
                    height: 18,
                    color: selected
                      ? "rgba(245,240,230,0.92)"
                      : "rgba(245,240,230,0.55)",
                  }}
                >
                  {opt.icon}
                </span>
              )}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  color: selected
                    ? "rgba(245,240,230,0.95)"
                    : "rgba(245,240,230,0.75)",
                }}
              >
                {opt.label}
              </span>
            </span>
            {opt.descriptor && (
              <span
                style={{
                  fontSize: 12.5,
                  color: selected
                    ? "rgba(245,240,230,0.62)"
                    : "rgba(245,240,230,0.42)",
                  letterSpacing: "-0.003em",
                }}
              >
                {opt.descriptor}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
