"use client";

import { motion, type Easing, type TargetAndTransition } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

// BlurText — TypeScript port of the React Bits BlurText component.
// Splits a string into words or letters and staggers each segment
// through a blur → focus + opacity 0 → 1 + Y-slide animation. Triggers
// once when the element scrolls into view (IntersectionObserver).
//
// Added vs the original: a `style` prop merged into the host <p> so
// callers can pass typography (font-size, color, etc.) without having
// to express every value as a Tailwind class.

export type BlurDirection = "top" | "bottom";
export type BlurAnimateBy = "words" | "letters";

type Snapshot = Record<string, number | string>;

export interface BlurTextProps {
  text?: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  animateBy?: BlurAnimateBy;
  direction?: BlurDirection;
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Snapshot;
  animationTo?: Snapshot[];
  easing?: Easing | ((t: number) => number);
  onAnimationComplete?: () => void;
  stepDuration?: number;
}

function buildKeyframes(from: Snapshot, steps: Snapshot[]) {
  const keys = new Set<string>([
    ...Object.keys(from),
    ...steps.flatMap((s) => Object.keys(s)),
  ]);
  const keyframes: Record<string, Array<number | string>> = {};
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])];
  });
  return keyframes;
}

export default function BlurText({
  text = "",
  delay = 200,
  className = "",
  style,
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
  stepDuration = 0.35,
}: BlurTextProps) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo<Snapshot>(
    () =>
      direction === "top"
        ? { filter: "blur(10px)", opacity: 0, y: -50 }
        : { filter: "blur(10px)", opacity: 0, y: 50 },
    [direction],
  );

  const defaultTo = useMemo<Snapshot[]>(
    () => [
      {
        filter: "blur(5px)",
        opacity: 0.5,
        y: direction === "top" ? 5 : -5,
      },
      { filter: "blur(0px)", opacity: 1, y: 0 },
    ],
    [direction],
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) =>
    stepCount === 1 ? 0 : i / (stepCount - 1),
  );

  return (
    <p
      ref={ref}
      className={className}
      style={{ display: "flex", flexWrap: "wrap", ...style }}
    >
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
        return (
          <motion.span
            className="inline-block will-change-[transform,filter,opacity]"
            key={index}
            initial={fromSnapshot as TargetAndTransition}
            animate={
              (inView ? animateKeyframes : fromSnapshot) as TargetAndTransition
            }
            transition={{
              duration: totalDuration,
              times,
              delay: (index * delay) / 1000,
              ease: easing,
            }}
            onAnimationComplete={
              index === elements.length - 1 ? onAnimationComplete : undefined
            }
          >
            {segment === " " ? " " : segment}
            {animateBy === "words" && index < elements.length - 1 && " "}
          </motion.span>
        );
      })}
    </p>
  );
}
