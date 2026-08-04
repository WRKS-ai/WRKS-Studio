import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { loadBlueprints } from "@/lib/site-generation/blueprint-loader";
import { normalizeGenerationError } from "@/lib/site-generation/error-normalize";

// POST /api/sites/refine
// Refines a single page of a generated site based on a user instruction.
// Loads the current HTML for that page, sends it to Opus with the
// instruction + DESIGN.md's ban list, receives modified HTML, writes
// it back to the pages jsonb array.
//
// One page per request. For multi-page instructions ("make the whole
// site darker"), the client should call refine per-page or the user
// runs it against home + it propagates via voice/palette hints (best-
// effort — Opus doesn't see the other pages here).

export const runtime = "nodejs";
// Refinement runs one Opus call at ~60-120s for a full-page rewrite.
export const maxDuration = 300;

const BodySchema = z.object({
  jobId: z.string().uuid(),
  pagePath: z.string().min(1).max(200),
  instruction: z.string().trim().min(3).max(2000),
});

type StoredPage = { path: string; html: string; title: string };

const REFINE_MODEL = "claude-opus-4-7";
const MAX_OUTPUT_TOKENS = 32_000;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Invalid body";
    return NextResponse.json({ error: "Invalid body", detail }, { status: 400 });
  }

  const normalizedPath = normalizePath(body.pagePath);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceSupabaseClient() as any;

  // Load job + verify ownership
  const { data: job, error: jobErr } = await supabase
    .from("sites_generation_jobs")
    .select("id, user_id, status, html, pages, brand")
    .eq("id", body.jobId)
    .maybeSingle();

  if (jobErr || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (job.status !== "ready") {
    return NextResponse.json({ error: "Site is not ready yet" }, { status: 409 });
  }

  const jobRow = job as {
    id: string;
    user_id: string;
    status: string;
    html: string | null;
    pages: StoredPage[] | null;
    brand: Record<string, unknown> | null;
  };

  // Find the current page HTML.
  let currentHtml: string | null = null;
  let pageTitle = "Home";
  if (jobRow.pages && jobRow.pages.length > 0) {
    const match = jobRow.pages.find((p) => p.path === normalizedPath);
    if (match) {
      currentHtml = match.html;
      pageTitle = match.title;
    }
  } else if (normalizedPath === "/") {
    currentHtml = jobRow.html;
  }

  if (!currentHtml) {
    return NextResponse.json(
      { error: `No page found at ${normalizedPath}` },
      { status: 404 },
    );
  }

  try {
    const bundle = loadBlueprints();
    const brand = (jobRow.brand ?? {}) as { brandName?: string | null };

    const anthropic = new Anthropic();
    const system = buildRefineSystemPrompt(bundle.design);
    const user = buildRefineUserPrompt({
      brandName: brand.brandName ?? null,
      pagePath: normalizedPath,
      pageTitle,
      currentHtml,
      instruction: body.instruction,
    });

    const stream = anthropic.messages.stream({
      model: REFINE_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
    });

    let fullText = "";
    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        fullText += chunk.delta.text;
      }
    }

    const newHtml = extractHtml(fullText);
    if (!newHtml || newHtml.length < 500) {
      return NextResponse.json(
        { error: "Refinement produced empty or invalid HTML." },
        { status: 502 },
      );
    }

    // Persist the updated page back to the pages array. If the job was
    // legacy single-page, upgrade it to a pages array with the new HTML.
    const updatedPages: StoredPage[] = jobRow.pages
      ? jobRow.pages.map((p) =>
          p.path === normalizedPath ? { ...p, html: newHtml } : p,
        )
      : [{ path: "/", html: newHtml, title: brand.brandName ?? "Home" }];

    const { error: updateErr } = await supabase
      .from("sites_generation_jobs")
      .update({
        html: normalizedPath === "/" ? newHtml : jobRow.html,
        pages: updatedPages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.jobId);

    if (updateErr) {
      console.error("[api/sites/refine] persist failed:", updateErr);
      return NextResponse.json(
        { error: "Couldn't save the refinement. Try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      pagePath: normalizedPath,
      pageTitle,
      byteCount: newHtml.length,
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const normalized = normalizeGenerationError(err);
    console.error(`[api/sites/refine] FAILED [${normalized.category}]:`, raw);
    return NextResponse.json(
      { error: normalized.userMessage },
      { status: 502 },
    );
  }
}

function buildRefineSystemPrompt(designMd: string): string {
  return `You are the site-refinement model for WRKS Studio.

# YOUR JOB

The user has an already-generated page. They want you to MODIFY it based on a short instruction. Return the ENTIRE modified HTML5 document, ready to render.

# CRITICAL RULES

1. **Return the ENTIRE document.** Not a diff, not a patch, not just the changed section. The full \`<!DOCTYPE html>\` … \`</html>\` document, ready to overwrite the existing one.
2. **Preserve nav + footer exactly.** These are shared across pages in the site. Changing them here would break cross-page consistency. Keep them identical to what the current HTML has (structure, links, labels, styling) unless the user explicitly asks to change the nav/footer.
3. **Preserve the site's palette + typography** (they're bound to the brand). Only change colors/fonts if the user explicitly asks.
4. **Follow DESIGN.md's constitutional bans.** They apply as much to refinement as to first-gen. Never introduce a banned pattern to satisfy an instruction — reject the pattern and adapt.
5. **Match the tone + voice of the existing copy.** If the current headline is warm-editorial, keep it warm-editorial. Don't shift to sales-copy voice mid-refinement.
6. **Output format**: ONLY the HTML doc, wrapped in a single \`\`\`html fenced block. No prose before or after.

# WHAT COUNTS AS A REFINEMENT

- "Change the hero headline to X" → swap the hero H1 text.
- "Make the buttons rounder" → adjust border-radius in the button CSS.
- "Add a testimonial section" → insert a new section in a natural place (typically before the CTA), following DESIGN.md's testimonial patterns.
- "Make it darker" → shift palette one shade darker; keep contrast ratios; keep type readable.
- "Remove the reviews section" → drop the section, tighten spacing between neighbors so no visual gap remains.

# WHEN THE INSTRUCTION IS AMBIGUOUS

Make a REASONABLE inferred change. Do not return an unchanged doc asking for clarification — always deliver an updated doc reflecting your best interpretation.

# DESIGN.md — CONSTITUTIONAL LAW (excerpt of the most-violated rules)

${extractCoreBans(designMd)}

Full DESIGN.md applies. If in doubt, err on the side of the bans.`;
}

function buildRefineUserPrompt(input: {
  brandName: string | null;
  pagePath: string;
  pageTitle: string;
  currentHtml: string;
  instruction: string;
}): string {
  const { brandName, pagePath, pageTitle, currentHtml, instruction } = input;
  return [
    `# Refinement request`,
    ``,
    `**Brand**: ${brandName ?? "(unknown)"}`,
    `**Page**: ${pageTitle} (${pagePath})`,
    ``,
    `**User's instruction**:`,
    ``,
    `> ${instruction}`,
    ``,
    `---`,
    ``,
    `# Current HTML (this is what you're modifying — return the full modified doc)`,
    ``,
    `\`\`\`html`,
    currentHtml,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `# Task`,
    ``,
    `Modify the HTML above per the instruction. Preserve nav + footer + palette + typography + voice. Return ONLY the fenced code block starting with \`\`\`html and ending with \`\`\`. Nothing before, nothing after.`,
  ].join("\n");
}

// Best-effort extraction of the DESIGN.md ban list — keeps the refinement
// system prompt smaller than shoving the entire 400-line doc in. Pulls
// everything between "## Non-negotiable BANS" and the next H2 header.
function extractCoreBans(designMd: string): string {
  const start = designMd.indexOf("## Non-negotiable BANS");
  if (start === -1) return "";
  const rest = designMd.slice(start);
  const end = rest.indexOf("\n## ", 4);
  return end === -1 ? rest.slice(0, 4000) : rest.slice(0, end);
}

function extractHtml(text: string): string {
  const fenced = /```html\s*([\s\S]*?)```/i.exec(text);
  if (fenced && fenced[1]) return fenced[1].trim();
  const doctypeIdx = text.toLowerCase().indexOf("<!doctype html");
  if (doctypeIdx >= 0) return text.slice(doctypeIdx).trim();
  return "";
}

function normalizePath(path: string): string {
  if (!path || path === "") return "/";
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  if (trimmed.length > 1 && trimmed.endsWith("/")) return trimmed.slice(0, -1);
  return trimmed;
}
