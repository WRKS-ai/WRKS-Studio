"use client";

import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import Aurora from "@/components/aurora";

// /studio — welcome canvas.
//
// Background: React Bits Aurora — simplex-noise ribbon that rises from
// the BOTTOM of the canvas (the original effect comes from the top;
// we flipped uv.y in the shader so the ribbon rises into view). The
// three-stop color ramp interpolates horizontally across the canvas.
// Native WebGL port — no OGL dependency.
//
// Foreground: centered Fraunces greeting from Clerk's useUser() —
// "Welcome back, {firstName}." with the React Bits hero kicker as the
// subhead. The sidebar (WRKS Studio wordmark + nav panel + user-menu)
// and the floating Siri orb stay as layout chrome across studio routes.

export default function StudioWelcomePage() {
  const reduced = useReducedMotion();
  const { user, isLoaded } = useUser();

  const firstName =
    user?.firstName ||
    user?.username ||
    (isLoaded ? "there" : "");

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      {/* React Bits Aurora — rising from the bottom */}
      <div className="absolute inset-0 pointer-events-none">
        <Aurora
          colorStops={["#7cff67", "#B497CF", "#5227FF"]}
          blend={0.5}
          amplitude={1.0}
          speed={1}
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
