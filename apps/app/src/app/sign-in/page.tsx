import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { Divider } from "@/components/divider";
import { MagicLinkForm } from "@/components/magic-link-form";
import { OAuthRow } from "@/components/oauth-buttons";

export const metadata: Metadata = {
  title: "Sign in — WRKS Studio",
  description: "Sign in to WRKS Studio.",
};

export default function SignInPage() {
  return (
    <AuthShell
      heading="Sign in to WRKS Studio"
      subheading="Pick up where you left off."
      altCtaText="New here?"
      altCtaHref="/sign-up"
      altCtaLabel="Create an account →"
    >
      <OAuthRow mode="sign-in" />

      <div className="my-5">
        <Divider label="or continue with email" />
      </div>

      <MagicLinkForm
        mode="sign-in"
        cta="Sign in with email"
        sentTitle="Check your inbox"
        sentBody="We sent you a magic link. Open it on this device to sign in."
      />
    </AuthShell>
  );
}
