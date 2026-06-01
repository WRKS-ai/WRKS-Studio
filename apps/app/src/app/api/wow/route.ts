import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  WOW_SYSTEM_PROMPT,
  WowDeliverablesSchema,
} from "@/lib/wow-prompt";

// POST /api/wow
// Takes a user's intake answers (personality, name, business, audience,
// differentiator) and returns four first-session outputs: a brand name,
// landing page hero block, three social posts (Instagram / X / LinkedIn),
// and one paid ad. Powered by Claude Sonnet 4.6 — Haiku produced safe,
// generic output for thin inputs; Sonnet gives the creative-director
// quality the brief's wow moment needs.
//
// Caching: the system prompt is the same across all users, marked
// `cache_control: ephemeral` so the prefix caches once Sonnet 4.6's
// 2048-token minimum is hit. The per-user payload (the intake answers)
// lives in the user message — invalidates nothing.

const BodySchema = z.object({
  personalityId: z.enum(["maven", "sage", "spark", "echo"]),
  agentName: z.string().min(1).max(60),
  business: z.string().min(1).max(2000),
  audience: z.string().min(1).max(2000),
  differentiator: z.string().min(1).max(2000),
});

const client = new Anthropic();

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const userPrompt = [
    `AGENT PERSONALITY: ${body.personalityId}`,
    `AGENT NAME: ${body.agentName}`,
    ``,
    `BUSINESS: ${body.business}`,
    ``,
    `AUDIENCE: ${body.audience}`,
    ``,
    `DIFFERENTIATOR: ${body.differentiator}`,
  ].join("\n");

  try {
    const response = await client.messages.parse({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: WOW_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: zodOutputFormat(WowDeliverablesSchema),
      },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        {
          error:
            "Couldn't generate your deliverables. Try again in a moment.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      deliverables: response.parsed_output,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cacheRead: response.usage.cache_read_input_tokens,
        cacheCreate: response.usage.cache_creation_input_tokens,
      },
    });
  } catch (err) {
    // TEMP: surface error detail in prod too so we can debug the
    // first-ship wow page failures. Revert once stable.
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited. Try again in a moment." },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      console.error(
        `[api/wow] Anthropic ${err.status} ${err.type}: ${err.message}`,
      );
      return NextResponse.json(
        {
          error: `Anthropic ${err.status} ${err.type}: ${err.message}`,
          type: err.type,
          status: err.status,
        },
        { status: 502 },
      );
    }
    console.error("[api/wow] unexpected error:", err);
    return NextResponse.json(
      {
        error: `Unexpected: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    );
  }
}
