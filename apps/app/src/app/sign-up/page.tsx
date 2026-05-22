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
      eyebrow="Get started"
      heading="Create your account."
      subheading="One agent. Five deliverables. Live from your phone."
      altCtaText="Already have an account?"
      altCtaHref="/sign-in"
      altCtaLabel="Sign in"
      brandQuote="It builds the website, schedules the post, ships the ad. I just talk."
      brandAttribution="Marcus Chen"
      brandLocation="Meadow Cafe · Portland"
      footer={
        <span>
          By creating an account you agree to our{" "}
          <Link
            href="/terms"
            className="text-ink-muted hover:text-ink transition-colors underline-offset-4 hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-ink-muted hover:text-ink transition-colors underline-offset-4 hover:underline"
          >
            Privacy
          </Link>
          .
        </span>
      }
    >
      <OAuthRow />

      <div className="my-5">
        <Divider label="or with email" />
      </div>

      <MagicLinkForm
        cta="Create account"
        sentTitle="One last step"
        sentBody="We sent a confirmation link. Tap it on this device to claim your account."
      />
    </AuthShell>
  );
}
