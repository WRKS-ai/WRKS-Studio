"use client";

import type { ReactElement } from "react";

import "./glass-icons.css";

export type GlassIconItem = {
  icon: ReactElement;
  color: string; // any CSS color or gradient string
  label: string;
  customClass?: string;
};

export function GlassIcons({
  items,
  className,
}: {
  items: GlassIconItem[];
  className?: string;
}) {
  return (
    <div className={`glass-icon-btns ${className ?? ""}`}>
      {items.map((item, index) => (
        <button
          key={index}
          className={`glass-icon-btn ${item.customClass ?? ""}`}
          aria-label={item.label}
          type="button"
        >
          <span className="glass-icon-btn__back" style={{ background: item.color }} />
          <span className="glass-icon-btn__front">
            <span className="glass-icon-btn__icon" aria-hidden="true">
              {item.icon}
            </span>
          </span>
          <span className="glass-icon-btn__label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
