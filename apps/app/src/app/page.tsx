import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPostSignInDestination } from "@/lib/onboarding/destination";

// Root landing page.
//
// If the visitor is signed in, we route them onward: /studio when
// onboarding is complete, otherwise back into the onboarding flow.
// If they're signed out, we show the placeholder sign-in surface.

export default async function AppHome() {
  const { userId } = await auth();
  if (userId) {
    redirect(await getPostSignInDestination(userId));
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="size-2.5 rounded-full mb-6" style={{
        background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #6366f1 100%)",
        boxShadow: "0 0 12px rgba(165,180,252,0.55)",
      }} />
      <h1 className="font-serif font-medium tracking-tight text-[clamp(2rem,4vw,3rem)] leading-tight mb-4">
        WRKS Studio
      </h1>
      <p className="text-ink-muted text-[15px] max-w-md mb-10 leading-relaxed">
        The dashboard goes here. For now, jump to sign-in or sign-up.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/sign-in"
          className="h-10 px-4 rounded-[10px] bg-ink text-canvas text-[14px] font-medium inline-flex items-center"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="h-10 px-4 rounded-[10px] border border-white/[0.14] text-ink text-[14px] font-medium inline-flex items-center hover:border-white/[0.28] hover:bg-white/[0.03] transition-colors"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
