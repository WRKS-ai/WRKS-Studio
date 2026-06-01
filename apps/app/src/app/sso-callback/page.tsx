"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * OAuth return URL — Google/Apple redirect here after the user authorises.
 * Clerk's component completes the handshake, creates the session, and routes
 * to `redirectUrlComplete` (which we already pass from the OAuth button).
 */
export default function SSOCallbackPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 bg-canvas text-ink">
      <div className="w-full max-w-[360px] text-center">
        <div
          className="mx-auto mb-6 size-2.5 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #6366f1 100%)",
            boxShadow: "0 0 12px rgba(165,180,252,0.5)",
          }}
        />
        <h1 className="font-serif font-medium tracking-tight text-[clamp(1.5rem,2vw,1.875rem)] leading-[1.1] mb-2">
          Signing you in…
        </h1>
        <p className="text-[14px] text-ink-muted leading-relaxed">
          One sec while we finish the handshake.
        </p>
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/onboarding/personality"
          signUpForceRedirectUrl="/onboarding/personality"
        />
      </div>
    </main>
  );
}
