"use client";

import { useId } from "react";

// Three-ball bouncing loader (adapted from Uiverse / mobinkakei).
// Three circles drop with squash-and-stretch onto a blurred floor
// shadow, staggered phases (0 / 0.2s / 0.3s) so the bounce reads as
// a small choreographed wave rather than three things doing the
// same thing. Used on every full-screen loading state (sign-in
// callbacks, magic-link verify, anything else).
//
// Self-contained: keyframes are scoped per instance via a useId
// suffix so multiple loaders on the same page won't fight over
// animation names.

export type BouncingLoaderProps = {
  /** Ball color. Defaults to off-white (WRKS ink). */
  color?: string;
  /** Floor shadow color. Defaults to black with low opacity. */
  shadowColor?: string;
  className?: string;
};

export function BouncingLoader({
  color = "#f5f0e6",
  shadowColor = "rgba(0,0,0,0.6)",
  className,
}: BouncingLoaderProps) {
  const id = useId().replace(/[:]/g, "");
  const ball = `ball-${id}`;
  const shadow = `shadow-${id}`;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={className}
      style={{
        position: "relative",
        width: 200,
        height: 60,
        zIndex: 1,
      }}
    >
      <span
        className={`${ball} ${ball}-1`}
        style={{ left: "15%" }}
        aria-hidden
      />
      <span
        className={`${ball} ${ball}-2`}
        style={{ left: "45%" }}
        aria-hidden
      />
      <span
        className={`${ball} ${ball}-3`}
        style={{ right: "15%" }}
        aria-hidden
      />

      <span
        className={`${shadow} ${shadow}-1`}
        style={{ left: "15%" }}
        aria-hidden
      />
      <span
        className={`${shadow} ${shadow}-2`}
        style={{ left: "45%" }}
        aria-hidden
      />
      <span
        className={`${shadow} ${shadow}-3`}
        style={{ right: "15%" }}
        aria-hidden
      />

      <style>{`
        .${ball} {
          width: 20px;
          height: 20px;
          position: absolute;
          border-radius: 50%;
          background-color: ${color};
          transform-origin: 50%;
          animation: ${ball}-bounce 0.5s alternate infinite ease;
          will-change: transform, top, height, border-radius;
        }
        .${ball}-2 { animation-delay: 0.2s; }
        .${ball}-3 { animation-delay: 0.3s; }

        @keyframes ${ball}-bounce {
          0% {
            top: 60px;
            height: 5px;
            border-radius: 50px 50px 25px 25px;
            transform: scaleX(1.7);
          }
          40% {
            height: 20px;
            border-radius: 50%;
            transform: scaleX(1);
          }
          100% {
            top: 0%;
          }
        }

        .${shadow} {
          width: 20px;
          height: 4px;
          border-radius: 50%;
          background-color: ${shadowColor};
          position: absolute;
          top: 62px;
          transform-origin: 50%;
          z-index: -1;
          filter: blur(1px);
          animation: ${shadow}-pulse 0.5s alternate infinite ease;
          will-change: transform, opacity;
        }
        .${shadow}-2 { animation-delay: 0.2s; }
        .${shadow}-3 { animation-delay: 0.3s; }

        @keyframes ${shadow}-pulse {
          0% { transform: scaleX(1.5); }
          40% { transform: scaleX(1); opacity: 0.7; }
          100% { transform: scaleX(0.2); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
