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
      eyebrow="Welcome back"
      heading="Sign in to WRKS."
      subheading="Pick up exactly where you left off."
      altCtaText="No account yet?"
      altCtaHref="/sign-up"
      altCtaLabel="Create one"
      brandQuote="I shipped a landing page from the salon chair."
      brandAttribution="Hannah Park"
      brandLocation="Hannah's Hair · Toronto"
    >
      <OAuthRow />

      <div className="my-5">
        <Divider label="or with email" />
      </div>

      <MagicLinkForm
        cta="Continue with email"
        sentTitle="Check your inbox"
        sentBody="We sent you a magic link. Open it on this device to sign in."
      />
    </AuthShell>
  );
}
