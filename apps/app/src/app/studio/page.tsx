"use client";

import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import LightRays from "@/components/light-rays";

// /studio — welcome canvas. Light rays bleed down from the top-center
// of the canvas (React Bits LightRays via native WebGL shader), with a
// centered Fraunces welcome line that greets the signed-in user by
// first name.
//
// The sidebar (WRKS Studio wordmark + nav panel + user-menu) and the
// floating Siri orb (rendered by StudioInspectorFrame) are layout
// chrome — they stay across routes. This page only adds the bg + the
// greeting.

export default function StudioWelcomePage() {
  const reduced = useReducedMotion();
  const { user, isLoaded } = useUser();

  // Use the signed-in user's display name for the greeting. Fallback to
  // "there" while Clerk loads or if the user has no name set.
  const firstName =
    user?.firstName ||
    user?.username ||
    (isLoaded ? "there" : "");

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      {/* WebGL light rays from the top-center */}
      <div className="absolute inset-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      {/* Centered welcome message */}
      <div className="relative z-10 size-full grid place-items-center">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={
            firstName
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0 }
          }
          transition={{ duration: 0.8, ease: [0.22, 0.72, 0.2, 1] }}
          className="text-center px-8"
        >
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(40px, 5vw, 68px)",
              fontWeight: 480,
              letterSpacing: "-0.028em",
              color: "rgba(248,247,252,0.97)",
              lineHeight: 1.04,
            }}
          >
            Welcome back, {firstName || " "}.
          </h1>
          <p
            className="font-serif italic"
            style={{
              fontSize: "clamp(15px, 1.4vw, 19px)",
              color: "rgba(245,245,247,0.55)",
              letterSpacing: "-0.005em",
              marginTop: 18,
            }}
          >
            May these lights guide you on your path.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
