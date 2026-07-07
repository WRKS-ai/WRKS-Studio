import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// POST /api/sites/generate — kicks off a site generation job.
// GET  /api/sites/generate?jobId=… — SSE stream of section events.
//
// v1 (2026-06-30): mock generator. Curation + copy are hardcoded to
// the Bill-Fanter homepage sample; events stream on a fixed cadence
// so the theater has real streaming to consume. Real Claude two-pass
// generation (Haiku curate → Sonnet copy) lands in the next commit.

export const runtime = "nodejs";
export const maxDuration = 60;

// In-memory job store — sufficient for the mock. Real generation will
// persist to a `sites_generation_jobs` table in Supabase so SSE
// consumers can survive lambda cold-starts + reconnects.
const JOBS = new Map<
  string,
  { userId: string; brief: string; templateId: string; createdAt: number }
>();

const PostBody = z.object({
  brief: z.string().trim().min(6).max(600),
  templateId: z.string().trim().min(1).max(120),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: z.infer<typeof PostBody>;
  try {
    body = PostBody.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Invalid body";
    return NextResponse.json(
      { error: "Invalid brief", detail },
      { status: 400 },
    );
  }
  const jobId = crypto.randomUUID();
  JOBS.set(jobId, {
    userId,
    brief: body.brief,
    templateId: body.templateId,
    createdAt: Date.now(),
  });
  return NextResponse.json({ jobId });
}

// ============================================================
// SSE stream — the theater consumes this via EventSource.
// ============================================================

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }
  const job = JOBS.get(jobId);
  if (!job || job.userId !== userId) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: unknown) => {
        const payload =
          `event: ${event}\n` +
          `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };
      const sleep = (ms: number) =>
        new Promise<void>((resolve) => setTimeout(resolve, ms));

      // Emit curation immediately — theater uses it to lay out the
      // browser mockups and know how many pages to expect.
      emit("curation.done", MOCK_CURATION);
      await sleep(400);

      for (const page of MOCK_CURATION.pages) {
        const composition = MOCK_CURATION.compositions[page];
        if (!composition) continue;
        emit("page.start", { pageId: page });
        for (const sectionId of composition.sections) {
          emit("section.start", {
            pageId: page,
            sectionId,
            narration: SECTION_NARRATION[sectionId] ?? "Drafting…",
          });
          // Cursor draws + skeleton morph takes ~2.6s in the theater.
          // Real content lands mid-way through the animation.
          await sleep(1500);
          emit("section.done", {
            pageId: page,
            sectionId,
            content: MOCK_CONTENT[sectionId] ?? null,
          });
          await sleep(700);
        }
        emit("page.done", { pageId: page });
        await sleep(600);
      }

      emit("generation.done", {
        siteId: jobId,
      });
      controller.close();
      JOBS.delete(jobId);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}

// ============================================================
// Mock generation output — hardcoded to Bill-Fanter homepage until
// real Claude two-pass generation lands. This lets the theater ship
// with a real streaming feed to render, so animation timing +
// visual choreography are testable end-to-end before the LLM work.
// ============================================================

type Composition = { sections: string[] };
type MockCuration = {
  pages: string[];
  compositions: Record<string, Composition>;
};

const MOCK_CURATION: MockCuration = {
  pages: ["home"],
  compositions: {
    home: {
      sections: [
        "hero",
        "megaBento",
        "helpGrid",
        "community",
        "aboutBill",
      ],
    },
  },
};

const SECTION_NARRATION: Record<string, string> = {
  hero:
    "Starting with the hero. Big headline, sharp promise, one CTA — this is what visitors see first.",
  megaBento:
    "Adding the mega bento next. Every important destination on one screen so the site doesn't feel like a funnel.",
  helpGrid:
    "Three value props — what you do, why it matters, what changes for the visitor.",
  community:
    "Community proof. Real numbers, real people. This is what pushes the fence-sitters over.",
  aboutBill:
    "Closing with the founder story. Long-form, warm, credible — the human behind the brand.",
};

const MOCK_CONTENT: Record<string, Record<string, unknown>> = {
  hero: {
    headline: "Learn options trading and build income you control",
    subhead:
      "Bill Fanter teaches new and experienced traders how to read the options market, time entries, and place trades with a clear plan.",
    primaryCtaLabel: "Get the masterclass",
    secondaryCtaLabel: "Join the community",
  },
  megaBento: {
    heading: "Everything you need to trade options with confidence",
  },
  helpGrid: {
    heading: "Trade options with confidence and grow your income",
  },
  community: {
    heading: "Join my options trading community",
  },
  aboutBill: {
    heading: "Hi, I'm Bill Fanter. I'm excited to get to know you.",
  },
};
