"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Magic-link landing page.
 *
 * Clerk's email-link flow uses this route as the `redirectUrl`. When the user
 * clicks the link in their inbox, the browser opens here with verification
 * tokens in the URL. We call handleEmailLinkVerification, which completes
 * the sign-in (or sign-up), creates the session, and routes onward.
 */
export default function VerifyPage() {
  const { handleEmailLinkVerification, loaded } = useClerk();
  const router = useRouter();
  const [stage, setStage] = useState<"verifying" | "error">("verifying");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;

    handleEmailLinkVerification({
      redirectUrl: "/onboarding/personality",
      redirectUrlComplete: "/onboarding/personality",
    }).catch((err: unknown) => {
      if (cancelled) return;
      // Verified-on-other-device errors are non-fatal — the original tab
      // continues the flow. Show a helpful message instead of a hard error.
      const code = (err as { code?: string })?.code;
      if (code === "expired") {
        setMessage("That magic link expired. Request a fresh one.");
      } else if (code === "verified_on_other_device") {
        setMessage(
          "You're already signed in on another device. Head back to that tab.",
        );
      } else {
        setMessage(
          (err as { errors?: Array<{ longMessage?: string }> })?.errors?.[0]
            ?.longMessage ??
            "We couldn't verify that link. Try requesting a new one.",
        );
      }
      setStage("error");
    });

    return () => {
      cancelled = true;
    };
  }, [handleEmailLinkVerification, loaded]);

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 bg-canvas text-ink">
      <div className="w-full max-w-[400px] text-center">
        {stage === "verifying" ? (
          <>
            <div className="mx-auto mb-6 size-2.5 rounded-full" style={{
              background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #6366f1 100%)",
              boxShadow: "0 0 12px rgba(165,180,252,0.5)",
            }} />
            <h1 className="font-serif font-medium tracking-tight text-[clamp(1.75rem,2.4vw,2.125rem)] leading-[1.1] mb-2">
              Signing you in…
            </h1>
            <p className="text-[14px] text-ink-muted leading-relaxed">
              Verifying your magic link. Hold tight.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif font-medium tracking-tight text-[clamp(1.5rem,2vw,1.875rem)] leading-[1.1] mb-3">
              That link didn&rsquo;t work.
            </h1>
            <p className="text-[14px] text-ink-muted leading-relaxed mb-6">
              {message ?? "Try requesting a new magic link."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/sign-in")}
              className="h-10 px-4 rounded-[10px] bg-ink text-canvas text-[13px] font-medium inline-flex items-center gap-2 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
            >
              Back to sign-in
              <span aria-hidden>→</span>
            </button>
          </>
        )}
      </div>
    </main>
  );
}
