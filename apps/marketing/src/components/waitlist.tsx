"use client";

import { motion } from "motion/react";
import { useState } from "react";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section
      id="waitlist"
      className="relative py-32 px-6 lg:px-8 border-t border-line overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full bg-ink/[0.05] blur-[140px]" />
      </div>

      <div className="max-w-screen-xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-20 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-[10px] tracking-[0.22em] uppercase text-ink-muted font-sans mb-5"
          >
            Early access
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-serif text-4xl sm:text-5xl lg:text-[3.75rem] leading-[1.02] tracking-tight"
          >
            We&apos;re opening the door
            <br />
            <span className="italic text-ink-muted">to the first hundred.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-7 text-base sm:text-lg text-ink-muted max-w-lg"
          >
            Built for owners who want to run their business from their pocket.
            Limited founding cohort — we onboard manually so we can make sure
            your first session is the wow it should be.
          </motion.p>

          {!submitted ? (
            <motion.form
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                aria-label="Email address"
                required
                className="flex-1 h-12 px-5 rounded-full bg-panel border border-line text-ink placeholder:text-ink-dim focus:outline-none focus:border-ink/60 focus:ring-2 focus:ring-ink/10 transition-all font-sans"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="h-12 px-6 rounded-full bg-ink text-canvas font-sans font-medium shadow-lg shadow-ink/10 hover:shadow-ink/20 transition-shadow"
              >
                Request access
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-10 inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-400/[0.06] px-5 py-3 text-sm font-sans text-ink"
            >
              <span className="size-2 rounded-full bg-emerald-400" />
              You&apos;re on the list. We&apos;ll email you when your slot
              opens.
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-5 flex items-center gap-5 text-[10px] tracking-[0.22em] uppercase font-sans text-ink-dim"
          >
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-ink-dim" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-ink-dim" />
              14-day trial
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-ink-dim" />
              Cancel any time
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto"
        >
          <PhoneMock />
        </motion.div>
      </div>
    </section>
  );
}

function PhoneMock() {
  return (
    <div className="relative w-[260px] sm:w-[300px] mx-auto">
      <div className="absolute -inset-4 rounded-[3rem] bg-ink/[0.03] blur-2xl" />
      <div className="relative rounded-[2.5rem] border border-ink/15 bg-gradient-to-b from-panel to-canvas p-3 shadow-2xl shadow-black/50">
        <div className="rounded-[2rem] border border-line bg-canvas overflow-hidden">
          <div className="h-6 bg-panel flex items-center justify-center">
            <span className="size-2 rounded-full bg-line" />
          </div>
          <div className="px-5 pt-5 pb-7">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="size-9 rounded-full bg-gradient-to-br from-ink to-ink-muted" />
              <div>
                <div className="text-xs font-sans font-semibold">Nova</div>
                <div className="text-[10px] text-ink-muted font-sans">
                  online · thinking
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-ink text-canvas px-3.5 py-2.5 text-[11px] font-sans">
                New Friday post about the latte menu
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-line bg-panel px-3.5 py-2.5 text-[11px] font-sans text-ink-muted">
                Drafting an Instagram post + story tile. One sec.
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-line bg-panel px-3.5 py-2.5">
                <div className="h-16 rounded-md bg-gradient-to-br from-ink/[0.08] to-ink/[0.02] border border-line mb-1.5" />
                <div className="text-[10px] font-sans text-ink-muted">
                  Ready to publish?
                </div>
              </div>
              <div className="ml-auto max-w-[60%] rounded-2xl rounded-tr-md bg-ink text-canvas px-3.5 py-2.5 text-[11px] font-sans">
                Yes
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-line flex items-center justify-between text-[10px] font-sans text-ink-dim">
              <span>Hold to speak</span>
              <span className="flex items-center gap-1">
                <span className="size-1 rounded-full bg-emerald-400/80" />
                live
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
