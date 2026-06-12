"use client";

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from "react";

// The WRKS button language: dark glass surface + crystal-light comet
// revolving the rim. Replaces every solid-color filled CTA in the
// /studio surface (Publish, Upgrade, Back-to-onboarding, etc.).
//
// The personality.accent NEVER bleeds onto these buttons — chrome stays
// neutral so the user's brand only shows up in their actual content.

export type CrystalButtonSize = "sm" | "md" | "lg";
export type CrystalButtonTone = "default" | "quiet";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: CrystalButtonSize;
  tone?: CrystalButtonTone;
};

const SIZE_TOKENS: Record<
  CrystalButtonSize,
  { height: number; paddingX: number; fontSize: number; borderRadius: number }
> = {
  sm: { height: 30, paddingX: 12, fontSize: 12, borderRadius: 7 },
  md: { height: 36, paddingX: 18, fontSize: 13, borderRadius: 9 },
  lg: { height: 42, paddingX: 22, fontSize: 14, borderRadius: 10 },
};

export const CrystalButton = forwardRef<HTMLButtonElement, Props>(
  function CrystalButton(
    { size = "md", tone = "default", className = "", style, children, ...rest },
    ref,
  ) {
    const t = SIZE_TOKENS[size];
    const surface: CSSProperties =
      tone === "quiet"
        ? {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)",
          }
        : {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
          };

    return (
      <button
        ref={ref}
        type="button"
        className={`wrks-crystal-border-button inline-flex items-center justify-center gap-2 transition-[transform,color] duration-150 ease-out hover:-translate-y-px ${className}`}
        style={{
          height: t.height,
          padding: `0 ${t.paddingX}px`,
          borderRadius: t.borderRadius,
          fontSize: t.fontSize,
          fontWeight: 500,
          letterSpacing: "-0.005em",
          color: "rgba(245,245,247,0.95)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          ...surface,
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
