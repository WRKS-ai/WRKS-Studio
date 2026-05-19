"use client";

import { motion } from "motion/react";

export function AgentOrb({
  size = 200,
  speaking = false,
}: {
  size?: number;
  speaking?: boolean;
}) {
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 55%, transparent 70%)",
          filter: "blur(8px)",
        }}
        animate={{
          scale: speaking ? [1, 1.06, 1] : [1, 1.02, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: speaking ? 1.2 : 3.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute inset-[8%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0.05) 60%)",
          filter: "blur(1px)",
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="absolute inset-[18%] rounded-full border border-white/[0.18]"
        animate={{
          scale: speaking ? [1, 1.04, 1] : [1, 1.015, 1],
        }}
        transition={{
          duration: speaking ? 0.9 : 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute inset-[28%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.95), rgba(220,220,220,0.4) 50%, rgba(120,120,120,0.05) 80%)",
          boxShadow:
            "inset 0 -8px 24px rgba(0,0,0,0.45), 0 0 30px rgba(255,255,255,0.12)",
        }}
        animate={{
          scale: speaking ? [1, 1.03, 1] : [1, 1.008, 1],
        }}
        transition={{
          duration: speaking ? 0.6 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute rounded-full bg-white/85"
        style={{
          width: size * 0.1,
          height: size * 0.1,
          top: size * 0.38,
          left: size * 0.38,
          filter: "blur(2px)",
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Outer pulse rings when speaking */}
      {speaking && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-white/20"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.4, opacity: [0, 0.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-white/15"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.6, opacity: [0, 0.35, 0] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.6,
            }}
          />
        </>
      )}
    </div>
  );
}
