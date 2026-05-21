"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { StarBorder } from "./star-border";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section
      id="waitlist"
      className="relative py-32 sm:py-44 px-6 lg:px-8 overflow-hidden"
    >
      {/* Strong ambient gradient — the closing moment */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.18), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.12), transparent 60%)",
        }}
      />

      <div className="relative max-w-screen-xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-7"
        >
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Founding cohort · early 2026
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.95, ease: [0.2, 0.7, 0.2, 1] }}
          className="font-serif font-medium tracking-tight leading-[0.98] max-w-4xl mx-auto text-[clamp(3rem,7vw,5.5rem)]"
        >
          Be among
          <br />
          <span className="italic text-ink-muted">the first 100.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mt-8 text-[19px] text-ink-muted leading-[1.55] max-w-xl mx-auto"
        >
          Hand-onboarded. Personalized. No credit card. We&rsquo;re only
          taking 100 founding businesses this cohort.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.3, duration: 0.7 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) setSubmitted(true);
          }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto"
        >
          <div className="relative flex-1 w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-emerald-400/80 animate-pulse pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitted}
              placeholder="you@yourshop.com"
              className="w-full h-12 pl-9 pr-4 rounded-2xl bg-canvas/60 border border-white/[0.1] text-ink placeholder:text-ink-dim text-[15px] font-sans focus:outline-none focus:border-white/[0.3] focus:ring-2 focus:ring-violet-400/20 transition-all disabled:opacity-60 backdrop-blur-sm"
            />
          </div>
          <StarBorder
            as="button"
            type="submit"
            color="#a78bfa"
            speed="6s"
            disabled={submitted}
            className="cursor-pointer disabled:cursor-default disabled:opacity-70"
          >
            {submitted ? (
              <>
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                On the list
              </>
            ) : (
              <>
                Join the waitlist
                <span aria-hidden>→</span>
              </>
            )}
          </StarBorder>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-10 flex items-center justify-center gap-6 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-sans"
        >
          <span className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-violet-400" />
            No credit card
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-sky-400" />
            Hand-onboarded
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-emerald-400" />
            Phone-first
          </span>
        </motion.div>
      </div>
    </section>
  );
}
