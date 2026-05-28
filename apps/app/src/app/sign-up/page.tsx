import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Divider } from "@/components/divider";
import { MagicLinkForm } from "@/components/magic-link-form";
import { OAuthRow } from "@/components/oauth-buttons";

export const metadata: Metadata = {
  title: "Create your account — WRKS Studio",
  description: "Start building with WRKS Studio.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      heading="Create your account"
      subheading="One agent. Five deliverables. Live from your phone."
      altCtaText="Already a member?"
      altCtaHref="/sign-in"
      altCtaLabel="Sign in →"
      footer={
        <span>
          By creating an account you agree to our{" "}
          <Link
            href="/terms"
            className="text-ink-muted hover:text-ink transition-colors"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-ink-muted hover:text-ink transition-colors"
          >
            Privacy
          </Link>
          .
        </span>
      }
    >
      <OAuthRow />

      <div className="my-5">
        <Divider label="or continue with email" />
      </div>

      <MagicLinkForm
        cta="Create account"
        sentTitle="One last step"
        sentBody="We sent a confirmation link. Tap it on this device to claim your account."
      />
    </AuthShell>
  );
}
