"use client";

import { createElement, useEffect, useRef } from "react";

// Inline-editable text. Renders as a normal element until clicked, then
// becomes contentEditable. Commits on blur. Enter blurs (single-line)
// unless multiline, Shift+Enter inserts a line break in either mode,
// Escape reverts.
//
// Sync rule: the DOM textContent is kept in sync with the `value` prop
// only when the element is NOT focused. This avoids the classic
// contentEditable cursor-jump that happens when React rewrites the
// node during an active edit.

export function EditableText({
  value,
  onCommit,
  multiline = false,
  as = "span",
  className,
  style,
  hoverHint = "Click to edit",
}: {
  value: string;
  onCommit: (next: string) => void;
  multiline?: boolean;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4";
  className?: string;
  style?: React.CSSProperties;
  hoverHint?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (document.activeElement === node) return;
    if (node.textContent !== value) {
      node.textContent = value;
    }
  }, [value]);

  const onBlur = (e: React.FocusEvent<HTMLElement>) => {
    const next = (e.currentTarget.textContent ?? "").trim();
    if (next !== value && next.length > 0) {
      onCommit(next);
    } else if (next.length === 0) {
      e.currentTarget.textContent = value;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !multiline && !e.shiftKey) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).textContent = value;
      (e.currentTarget as HTMLElement).blur();
    }
  };

  return createElement(
    as,
    {
      ref,
      contentEditable: true,
      suppressContentEditableWarning: true,
      spellCheck: false,
      title: hoverHint,
      onBlur,
      onKeyDown,
      className: `wrks-editable ${className ?? ""}`.trim(),
      style,
    },
    value,
  );
}
