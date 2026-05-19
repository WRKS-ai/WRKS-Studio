"use client";

import { motion } from "motion/react";

export function MeshGradient() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* Animated soft blobs */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 720,
          height: 720,
          left: "12%",
          top: "-10%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.08), transparent 60%)",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, 20, 40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 540,
          height: 540,
          right: "-5%",
          top: "20%",
          background:
            "radial-gradient(circle, rgba(180,200,255,0.06), transparent 60%)",
          filter: "blur(90px)",
        }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 30, -10, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 480,
          height: 480,
          left: "30%",
          top: "50%",
          background:
            "radial-gradient(circle, rgba(255,210,180,0.04), transparent 60%)",
          filter: "blur(100px)",
        }}
        animate={{
          x: [0, 50, -40, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.7), transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.7), transparent 75%)",
        }}
      />
    </div>
  );
}
