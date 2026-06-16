"use client";

import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import LightRays from "@/components/light-rays";
import { useStudio } from "@/lib/studio-context";

// /studio — welcome canvas.
//
// The React Bits LightRays effect runs full-bleed across the canvas
// (top-center anchor, soft cone, mouse-tracked parallax). The ray color
// is the SIGNED-IN USER'S personality accent — Maven user gets violet,
// Sage gets sky, Spark gets amber, Echo gets forest. That keeps the
// chrome palette-neutral (rays are still essentially white-cinematic
// because of the shader's built-in brightness gradient) while giving
// each user a beam that's quietly theirs.
//
// Centered Fraunces greeting overlays the rays — "Welcome back,
// {firstName}." with the React Bits hero kicker as the subhead.

export default function StudioWelcomePage() {
  const reduced = useReducedMotion();
  const { user, isLoaded } = useUser();
  const { personality } = useStudio();

  const firstName =
    user?.firstName ||
    user?.username ||
    (isLoaded ? "there" : "");

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      {/* React Bits LightRays — color tied to the user's personality */}
      <div className="absolute inset-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor={personality.accent}
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
            Welcome back, {firstName || " "}.
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
