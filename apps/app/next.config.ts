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
  // The site-generation pipeline reads MD files from the workspace-root
  // `blueprints/` folder at runtime via fs.readFileSync. Next.js output
  // file tracing catches literal-string reads (readSafe("DESIGN.md"))
  // but misses dynamic path construction like path.join(BLUEPRINTS_DIR,
  // meta.path, "character.md") used by the corpus router. Explicitly
  // include the entire blueprints tree with any route that touches it
  // so the files ship in the serverless function bundle.
  outputFileTracingIncludes: {
    "/api/sites/generate": ["../../blueprints/**/*"],
    "/api/sites/refine": ["../../blueprints/**/*"],
  },
};

export default nextConfig;
