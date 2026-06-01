"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";

type Mode = "sign-in" | "sign-up";

export function MagicLinkForm({
  mode,
  cta,
  sentTitle,
  sentBody,
}: {
  mode: Mode;
  cta: string;
  sentTitle: string;
  sentBody: string;
}) {
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const isLoaded = mode === "sign-in" ? signInLoaded : signUpLoaded;

  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !isLoaded || stage === "sending") return;
    setStage("sending");
    setErrorMessage(null);

    const redirectUrl = `${window.location.origin}/verify`;

    try {
      if (mode === "sign-in") {
        if (!signIn) throw new Error("signIn not loaded");
        const attempt = await signIn.create({ identifier: email });
        const emailLinkFactor = attempt.supportedFirstFactors?.find(
          (f) => f.strategy === "email_link",
        ) as { emailAddressId: string } | undefined;
        if (!emailLinkFactor) {
          throw new Error("Email link not enabled for this account.");
        }
        const { startEmailLinkFlow } = signIn.createEmailLinkFlow();
        // Fire-and-forget — the user clicks the link in their email.
        void startEmailLinkFlow({
          emailAddressId: emailLinkFactor.emailAddressId,
          redirectUrl,
        });
      } else {
        if (!signUp) throw new Error("signUp not loaded");
        await signUp.create({ emailAddress: email });
        const { startEmailLinkFlow } = signUp.createEmailLinkFlow();
        void startEmailLinkFlow({ redirectUrl });
      }

      setStage("sent");
    } catch (err: unknown) {
      const msg = extractClerkError(err);
      setErrorMessage(msg);
      setStage("error");
    }
  };

  const handleReset = () => {
    setStage("idle");
    setErrorMessage(null);
    if (mode === "sign-in") signIn?.create({ identifier: "" }).catch(() => {});
  };

  // setActive is used after verification; ensures the hook isn't tree-shaken.
  void setActive;

  return (
    <AnimatePresence mode="wait">
      {stage === "sent" ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.22em] uppercase text-emerald-200/90 font-sans font-medium">
              {sentTitle}
            </span>
          </div>
          <p className="text-[14px] text-ink leading-relaxed">{sentBody}</p>
          <p className="mt-1.5 text-[13px] text-ink-muted leading-relaxed">
            Check <span className="text-ink">{email}</span> — link expires in
            15 minutes.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-3 text-[12px] text-ink-muted hover:text-ink transition-colors font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-[6px] px-1 py-0.5 -mx-1"
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
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={stage === "sending"}
            className="w-full h-11 px-3.5 rounded-[10px] bg-white/[0.02] border border-white/[0.10] text-[14px] text-ink placeholder:text-ink-dim font-sans outline-none transition-colors focus:border-white/[0.28] focus:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-sky-300/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!email.trim() || stage === "sending" || !isLoaded}
            className="group relative w-full h-11 rounded-[10px] bg-ink text-canvas text-[14px] font-sans font-semibold inline-flex items-center justify-center gap-2 transition-all hover:bg-white disabled:bg-white/[0.08] disabled:text-ink-dim disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
          >
            {stage === "sending" ? (
              <>
                <Spinner />
                Sending…
              </>
            ) : (
              <>
                {cta}
                <span
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-[2px]"
                >
                  →
                </span>
              </>
            )}
          </button>
          {stage === "error" && errorMessage && (
            <p
              role="alert"
              className="text-[12px] text-rose-300/90 font-sans leading-snug"
            >
              {errorMessage}
            </p>
          )}
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function extractClerkError(err: unknown): string {
  if (typeof err === "object" && err !== null && "errors" in err) {
    const errors = (err as { errors: Array<{ longMessage?: string; message?: string }> }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors[0]!.longMessage ?? errors[0]!.message ?? "Something went wrong.";
    }
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Try again.";
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
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
