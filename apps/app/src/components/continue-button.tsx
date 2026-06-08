"use client";

import "./continue-button.css";
import type React from "react";

// ContinueButton — the standard "Continue / Continue as X" button
// across onboarding and any other "advance to next step" surface.
//
// Adapted from a Uiverse button (Javierrocadev). Two blurred orbs
// inside a dark pill animate on hover: the larger orb slides out
// to the right while the smaller one drops toward the bottom. Border
// picks up an indigo glow. Text stays steady — no underline-shift
// dance that the original had (felt cartoonish for a serious flow).
//
// Colors are FIXED (indigo) regardless of which personality the user
// picked. Earlier accent-driven Continues changed color per agent;
// the user wanted one consistent treatment.

export type ContinueButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
};

export function ContinueButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
}: ContinueButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`continue-button ${className}`}
    >
      <span className="continue-button-text">{children}</span>
    </button>
  );
}
