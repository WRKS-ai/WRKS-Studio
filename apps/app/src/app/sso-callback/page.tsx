"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { BouncingLoader } from "@/components/bouncing-loader";

/**
 * OAuth return URL — Google/Apple redirect here after the user authorises.
 * Clerk's component completes the handshake, creates the session, and routes
 * to `redirectUrlComplete` (which we already pass from the OAuth button).
 */
export default function SSOCallbackPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 bg-canvas text-ink">
      <div className="w-full max-w-[360px] text-center flex flex-col items-center">
        <BouncingLoader className="mb-8" />
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
