// Smoke test for the v3 generation pipeline.
// Runs ingest + generateHtmlDocument against a real URL and writes
// the assembled HTML to disk so we can eyeball it.
//
// Usage: pnpm dlx tsx scripts/smoke-generate.mjs [url]
// Defaults to billfanter.com (our reference site).

import { config } from "dotenv";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

config({ path: join(process.cwd(), ".env.local") });

const targetUrl = process.argv[2] ?? "https://www.billfanter.com";

console.log(`\n[smoke] URL: ${targetUrl}`);
console.log("[smoke] Loading blueprint bundle + ingest module…\n");

const { ingestBrand } = await import("../src/lib/site-generation/brand-ingest.ts");
const { generateHtmlDocument } = await import("../src/lib/site-generation/generate-html.ts");

// Phase 1 — ingest
const ingestStart = Date.now();
console.log("[smoke] === Phase 1: ingest ===");
let ingest;
try {
  ingest = await ingestBrand(targetUrl);
  console.log(`[smoke] Ingest done in ${Date.now() - ingestStart}ms`);
  console.log(`         brandName:        ${ingest.brandName}`);
  console.log(`         existingHeadline: ${ingest.existingHeadline?.slice(0, 80)}`);
  console.log(`         palette:          ${ingest.palette.colors.length} colors`);
  console.log(`         typefaces.display:${ingest.typefaces.display}`);
  console.log(`         testimonials:     ${ingest.testimonials.length}`);
  console.log(`         verticals:        ${ingest.detectedVerticals.join(", ")}`);
  console.log(`         heroImage:        ${ingest.heroImage}`);
  console.log(`         logo:             ${ingest.logo.src}`);
} catch (e) {
  console.error(`[smoke] Ingest failed: ${e.message}`);
  ingest = null;
}

// Phase 2 — generate
console.log("\n[smoke] === Phase 2: Opus 4.7 generation ===");
const genStart = Date.now();
const { html, modelUsage } = await generateHtmlDocument({
  brief: "A landing page for my options trading masterclass and community — book calls, capture leads.",
  brand: {
    brandName: ingest?.brandName ?? "Bill Fanter",
    businessType: "personal_brand",
    primaryGoal: "book_calls",
    voiceDescriptor: "bold",
    offerSummary: "6-session options trading masterclass + Discord community with live trade alerts",
    audienceDescription: "New and intermediate options traders who want a repeatable system",
    differentiator: "35-year banking career + 1,600+ students taught",
    existingSiteUrl: targetUrl,
  },
  ingest,
});

console.log(`[smoke] Generate done in ${Date.now() - genStart}ms`);
console.log(`         input tokens:  ${modelUsage.inputTokens}`);
console.log(`         output tokens: ${modelUsage.outputTokens}`);
console.log(`         html bytes:    ${html.length}`);

const outPath = join(process.cwd(), "smoke-output.html");
writeFileSync(outPath, html, "utf-8");
console.log(`\n[smoke] Written to: ${outPath}`);
console.log("[smoke] Open in browser: file://" + outPath.replace(/\\/g, "/"));
