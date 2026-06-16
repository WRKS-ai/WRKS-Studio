"use client";

import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import SoftAurora from "@/components/soft-aurora";

// /studio — welcome canvas.
//
// Background: React Bits SoftAurora with fixed WRKS-brand dark colors
// (deep violet #6d28d9 + near-black indigo #1e1b4b). The bright white +
// magenta from the user's spec read as a neon billboard against the
// #0a0a0c page; these darker palette-aligned tones sit atmospheric
// instead. Brightness dropped 1 → 0.85 to keep the aurora restrained.
// Mouse parallax responds properly now (listener moved canvas → window
// inside the component so events pass through the pointer-events:none
// wrapper).
//
// Foreground: centered Fraunces greeting that pulls from Clerk's
// useUser() — "Welcome back, {firstName}." with the React Bits hero
// kicker as the subhead. The sidebar + floating Siri orb stay as layout
// chrome across all studio routes.

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
      {/* React Bits SoftAurora — fixed WRKS-brand dark palette.
          Tuned so the band reads as one continuous wave across the
          canvas instead of breaking at the center, while staying dark
          enough to feel atmospheric, not neon. */}
      <div className="absolute inset-0 pointer-events-none">
        <SoftAurora
          speed={0.55}
          scale={1.2}
          brightness={1.1}
          color1="#8b5cf6"
          color2="#1e3a8a"
          noiseFrequency={1.8}
          noiseAmplitude={0.85}
          bandHeight={0.5}
          bandSpread={0.55}
          octaveDecay={0.35}
          layerOffset={4}
          colorSpeed={0.6}
          enableMouseInteraction
          mouseInfluence={0.25}
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
