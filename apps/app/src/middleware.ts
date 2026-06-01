import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes don't require a session.
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
]);

export default clerkMiddleware(async (auth, req) => {
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
