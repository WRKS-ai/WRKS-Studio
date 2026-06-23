import { redirect } from "next/navigation";

// 2026-06-24 — route renamed /onboarding/personality → /onboarding/voice
// so the URL matches the actual page content (voice picker, not personality).
// Permanent redirect so old links / saved URLs / external references keep
// working. The voice picker page lives at ../voice/page.tsx.

export default function PersonalityRedirect() {
  redirect("/onboarding/voice");
}
