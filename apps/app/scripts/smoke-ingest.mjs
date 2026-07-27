// Isolate the /api/ingest/site failure. Fetches abbraccigroup.com,
// strips HTML, calls Haiku with the same prompt/schema the route uses,
// and prints exactly what came back so we can see WHERE it fails.

import { config } from "dotenv";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

config({ path: join(process.cwd(), ".env.local") });

const url = process.argv[2] ?? "https://www.abbraccigroup.com/";
console.log(`\n[smoke-ingest] URL: ${url}`);

// 1. Fetch
const res = await fetch(url, {
  headers: {
    "User-Agent": "WRKS-Studio-Ingest/1.0 (+https://app.slightwrks.com) Mozilla/5.0",
    Accept: "text/html,application/xhtml+xml",
  },
  redirect: "follow",
});
console.log(`[smoke-ingest] fetch: HTTP ${res.status}, ${res.headers.get("content-type")}`);
if (!res.ok) process.exit(1);
const html = await res.text();
console.log(`[smoke-ingest] html: ${html.length} bytes`);

// 2. Strip
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 12_000);
console.log(`[smoke-ingest] stripped text: ${text.length} chars`);
console.log(`[smoke-ingest] text head: ${text.slice(0, 300)}\n`);

// 3. Extract with Haiku
const anthropic = new Anthropic();

const models = [
  "claude-haiku-4-5-20251001",
  "claude-haiku-4-5",
];

for (const model of models) {
  console.log(`\n[smoke-ingest] trying model: ${model}`);
  const started = Date.now();
  try {
    const result = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: `Return ONE JSON object with these fields (all nullable):
brand_name, business_type, primary_goal, voice_descriptor, offer_summary, audience_description, differentiator.
No prose, no markdown fences.`,
      messages: [
        {
          role: "user",
          content: `URL: ${url}\n\nText:\n${text}`,
        },
      ],
    });
    console.log(`[smoke-ingest]   ${model} OK in ${Date.now() - started}ms`);
    console.log(`[smoke-ingest]   usage:`, result.usage);
    const block = result.content.find((b) => b.type === "text");
    if (block?.type === "text") {
      console.log(`[smoke-ingest]   text response (first 500 chars):`);
      console.log(block.text.slice(0, 500));
    }
  } catch (err) {
    console.error(`[smoke-ingest]   ${model} FAILED after ${Date.now() - started}ms:`);
    console.error(`    ${err.message}`);
    if (err.status) console.error(`    HTTP status: ${err.status}`);
    if (err.error) console.error(`    error body:`, JSON.stringify(err.error, null, 2));
  }
}
