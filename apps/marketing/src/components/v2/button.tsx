"use client";

import { motion } from "motion/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type AnchorProps = ComponentPropsWithoutRef<"a">;

type Props = Omit<
  AnchorProps,
  | "children"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDragExit"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onTransitionEnd"
  | "onTransitionStart"
> & {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  withArrow?: boolean;
  children: ReactNode;
};

const SIZE = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
} as const;

const VARIANT = {
  primary:
    "bg-ink text-canvas shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_-8px_rgba(255,255,255,0.18)] hover:bg-white hover:shadow-[0_2px_4px_rgba(0,0,0,0.5),0_12px_32px_-8px_rgba(255,255,255,0.28)]",
  ghost:
    "border border-white/[0.14] text-ink hover:border-white/[0.28] hover:bg-white/[0.03]",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  withArrow = false,
  className,
  children,
  ...rest
}: Props) {
  return (
    <motion.a
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 rounded-[10px] font-sans font-medium transition-[background-color,border-color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40",
        SIZE[size],
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      {withArrow && (
        <span
          aria-hidden
          className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-[3px]"
        >
          →
        </span>
      )}
    </motion.a>
  );
}
