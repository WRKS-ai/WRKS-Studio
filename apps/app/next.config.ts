import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow og:image / favicon previews from any HTTPS host (used by
    // the /onboarding/business URL-ingest card to show the user's site
    // hero). Component-level `unoptimized` prop is also set per usage
    // so the Vercel image service isn't invoked.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
