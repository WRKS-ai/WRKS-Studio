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

// Published-site host routing.
// Any subdomain of wrksstudio.com other than `www` is a user's published
// site (e.g. alex.wrksstudio.com). We rewrite internally to /s/{slug} so
// the public renderer can serve the stored HTML, and we bypass Clerk
// entirely for these requests.
// (Route folder is /s/ not /_sites/ because underscore-prefixed folders
// are private in the Next.js App Router and don't create routes.)
const APP_HOST = "wrksstudio.com";
function publishedSiteSlug(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  if (!hostname.endsWith("." + APP_HOST) && hostname !== APP_HOST) return null;
  if (hostname === APP_HOST) return null;
  const sub = hostname.slice(0, -("." + APP_HOST).length);
  if (sub === "" || sub === "www") return null;
  return sub;
}

export default clerkMiddleware(async (auth, req) => {
  // Published-site subdomain? Rewrite to public renderer + skip Clerk.
  const slug = publishedSiteSlug(req.headers.get("host"));
  if (slug) {
    const url = req.nextUrl.clone();
    const restOfPath = url.pathname === "/" ? "" : url.pathname;
    url.pathname = `/s/${slug}${restOfPath}`;
    return NextResponse.rewrite(url);
  }

  const { userId } = await auth();

  // Signed-in user hitting the auth entry pages? Bounce to root, which
  // does the smart routing (studio vs resume onboarding) based on
  // business_profiles.onboarding_completed_at.
  if (userId && isAuthEntryRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
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
