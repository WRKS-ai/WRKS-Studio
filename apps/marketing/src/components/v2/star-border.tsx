"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import "./star-border.css";

type StarBorderProps<T extends ElementType> = {
  as?: T;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "color" | "children">;

export function StarBorder<T extends ElementType = "button">({
  as,
  className = "",
  color = "white",
  speed = "6s",
  thickness = 1,
  children,
  style,
  ...rest
}: StarBorderProps<T>) {
  const Component = (as ?? "button") as ElementType;
  return (
    <Component
      className={`star-border-container ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...(style as object),
      }}
      {...(rest as Record<string, unknown>)}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="inner-content">{children}</div>
    </Component>
  );
}
