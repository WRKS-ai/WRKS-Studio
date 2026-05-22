"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";

export function MagicLinkForm({
  cta,
  sentTitle,
  sentBody,
}: {
  cta: string;
  sentTitle: string;
  sentBody: string;
}) {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || stage === "sending") return;
    setStage("sending");
    // TODO: wire up to actual auth provider. Simulating for now.
    setTimeout(() => setStage("sent"), 700);
  };

  const handleReset = () => {
    setStage("idle");
  };

  return (
    <AnimatePresence mode="wait">
      {stage === "sent" ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
          className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.04] px-4 py-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.22em] uppercase text-emerald-200/90 font-sans font-medium">
              {sentTitle}
            </span>
          </div>
          <p className="text-[14px] text-ink leading-relaxed">{sentBody}</p>
          <p className="mt-1.5 text-[13px] text-ink-muted leading-relaxed">
            Check <span className="text-ink">{email}</span> — link is good for 15 minutes.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-3 text-[12px] tracking-[0.06em] text-ink-muted hover:text-ink transition-colors font-sans"
          >
            Use a different email →
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[11px] tracking-[0.18em] uppercase text-ink-dim font-sans font-medium"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 rounded-[10px] bg-white/[0.02] border border-white/[0.10] text-[14px] text-ink placeholder:text-ink-dim font-sans outline-none transition-colors focus:border-white/[0.28] focus:bg-white/[0.04]"
            />
          </div>
          <button
            type="submit"
            disabled={!email.trim() || stage === "sending"}
            className="group relative w-full h-11 rounded-[10px] text-[14px] font-sans font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              background:
                "linear-gradient(90deg, #a78bfa 0%, #38bdf8 100%)",
              boxShadow: "0 8px 24px -10px rgba(167,139,250,0.55)",
            }}
          >
            {stage === "sending" ? (
              <>
                <Spinner />
                Sending…
              </>
            ) : (
              <>
                {cta}
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-[2px]">
                  →
                </span>
              </>
            )}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="white" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
