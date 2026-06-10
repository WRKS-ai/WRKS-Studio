import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes don't require a Clerk session.
//
// The agent endpoints under /api/agent/* are called by ElevenLabs
// (custom-LLM webhook) and Vercel Cron, neither of which carries a
// Clerk JWT. They have their own auth via WRKS_AGENT_LLM_SECRET in
// the Authorization header — Clerk must not bounce them to 404.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/terms",
  "/security",
  // Clerk's own handshake / verification endpoints
  "/sso-callback(.*)",
  "/verify(.*)",
  // Agent endpoints — self-authenticated via shared secret
  "/api/agent/(.*)",
]);

// If a signed-in user lands here, route them into the studio instead of
// showing the sign-in/sign-up form (which would fail with Clerk's
// "You're already signed in.").
const isAuthEntryRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (userId && isAuthEntryRoute(req)) {
    return NextResponse.redirect(new URL("/onboarding/personality", req.url));
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params.
    // Audio extensions (mp3/wav/m4a/ogg/webm) are included so the voice-picker
    // samples in /public/voices/ are served without going through auth.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp3|wav|m4a|ogg|webm|mp4)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
