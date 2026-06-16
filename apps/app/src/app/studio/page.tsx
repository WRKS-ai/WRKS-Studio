"use client";

import { useUser } from "@clerk/nextjs";
import Aurora from "@/components/aurora";
import BlurText from "@/components/blur-text";

// /studio — welcome canvas.
//
// Background: React Bits Aurora — simplex-noise ribbon rising from the
// BOTTOM of the canvas (flipped uv.y in the shader). WRKS dark-violet
// palette (violet-900 → violet-600 → indigo-900).
//
// Foreground: "Welcome back, {firstName}." rendered through the React
// Bits BlurText effect — each word fades in from the top with a
// blur→focus + opacity 0→1 + y-slide stagger.

export default function StudioWelcomePage() {
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
      {/* React Bits Aurora — rising from the bottom, WRKS palette */}
      <div className="absolute inset-0 pointer-events-none">
        <Aurora
          colorStops={["#4c1d95", "#7c3aed", "#312e81"]}
          blend={0.55}
          amplitude={0.85}
          speed={0.7}
        />
      </div>

      {/* Centered welcome message — BlurText animates each word in */}
      <div className="relative z-10 size-full grid place-items-center">
        {firstName && (
          <BlurText
            text={`Welcome back, ${firstName}.`}
            delay={150}
            animateBy="words"
            direction="top"
            className="font-serif"
            style={{
              fontSize: "clamp(40px, 5vw, 68px)",
              fontWeight: 480,
              letterSpacing: "-0.028em",
              color: "rgba(248,247,252,0.97)",
              lineHeight: 1.04,
              justifyContent: "center",
              padding: "0 32px",
              maxWidth: "92vw",
            }}
          />
        )}
      </div>
    </main>
  );
}
