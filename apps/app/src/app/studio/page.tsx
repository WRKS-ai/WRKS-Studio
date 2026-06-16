"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import Aurora from "@/components/aurora";
import BlurText from "@/components/blur-text";

// /studio — premium welcome canvas.
//
// Two elements, that's the whole page:
//   1) Fraunces headline that names the state ("Your edition is ready.")
//      — entered through the React Bits BlurText per-word stagger.
//   2) A single cream "cover" card with the user's wordmark + a hairline,
//      magazine-cover proportions, click → /studio/library.
// Aurora rises from the bottom as ambient floor; nothing else competes.

export default function StudioWelcomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const reduced = useReducedMotion();

  const wordmark =
    user?.firstName || user?.username || (isLoaded ? "Your brand" : "");

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <Aurora
          colorStops={["#4c1d95", "#7c3aed", "#312e81"]}
          blend={0.55}
          amplitude={0.7}
          speed={0.6}
        />
      </div>

      <div
        className="relative z-10 size-full flex flex-col items-center justify-center px-8"
        style={{ gap: 64 }}
      >
        {wordmark && (
          <BlurText
            text="Your edition is ready."
            delay={140}
            animateBy="words"
            direction="top"
            className="font-serif"
            style={{
              fontSize: "clamp(36px, 4vw, 52px)",
              fontWeight: 480,
              letterSpacing: "-0.028em",
              color: "rgba(248,247,252,0.97)",
              lineHeight: 1.04,
              justifyContent: "center",
              padding: 0,
            }}
          />
        )}

        {wordmark && (
          <motion.button
            type="button"
            onClick={() => router.push("/studio/library")}
            initial={
              reduced
                ? false
                : { opacity: 0, scale: 0.96, y: 12, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 0.72, 0.2, 1] }}
            whileHover={reduced ? undefined : { scale: 1.012, y: -2 }}
            whileTap={reduced ? undefined : { scale: 0.996 }}
            className="group relative focus:outline-none text-left"
            style={{
              width: 420,
              height: 540,
              background: "#fbf7ee",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              padding: "36px 36px 40px",
              boxShadow:
                "0 30px 70px rgba(0,0,0,0.5), 0 2px 0 rgba(255,255,255,0.04) inset",
            }}
            aria-label={`Open ${wordmark}'s edition`}
          >
            <div className="size-full flex flex-col justify-between">
              <div className="flex flex-col" style={{ gap: 12 }}>
                <span
                  className="font-serif"
                  style={{
                    fontSize: 17,
                    fontWeight: 500,
                    color: "#0a0a0c",
                    letterSpacing: "-0.012em",
                  }}
                >
                  {wordmark}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 1,
                    background: "rgba(10,10,12,0.22)",
                  }}
                />
              </div>

              <div
                className="flex-1 flex items-center"
                style={{ paddingBottom: 24 }}
              >
                <span
                  className="font-serif italic"
                  style={{
                    fontSize: "clamp(48px, 4.6vw, 64px)",
                    fontWeight: 380,
                    color: "#0a0a0c",
                    letterSpacing: "-0.032em",
                    lineHeight: 0.98,
                  }}
                >
                  Begin.
                </span>
              </div>
            </div>
          </motion.button>
        )}
      </div>
    </main>
  );
}
