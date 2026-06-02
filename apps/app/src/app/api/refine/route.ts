import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// POST /api/refine
// The agent loop: user types into the studio prompt → this route calls
// Claude with the current deliverables + the instruction → returns a
// short reply ("Tightened it — check the Instagram tab") plus an
// optional `updated` patch the client merges into the stored payload.
//
// Streaming TBD. For now sync response, ~3-6s with Sonnet 4.6.

const DeliverableShape = z.object({
  brandName: z.string(),
  landing: z.object({
    headline: z.string(),
    subhead: z.string(),
    primaryCta: z.string(),
    valueBullets: z.array(z.string()),
  }),
  social: z.object({
    instagram: z.string(),
    twitter: z.string(),
    linkedin: z.string(),
  }),
  ad: z.object({
    headline: z.string(),
    body: z.string(),
    cta: z.string(),
  }),
});

const ImagesShape = z.object({
  heroLandscape: z.string(),
  featured: z.array(z.string()),
  instagramSquare: z.string(),
  adHero: z.string(),
});

const StoredShape = z.object({
  deliverables: DeliverableShape,
  images: ImagesShape,
  createdAt: z.string(),
});

const BodySchema = z.object({
  personalityId: z.enum(["maven", "sage", "spark", "echo"]),
  agentName: z.string().min(1).max(60),
  instruction: z.string().min(1).max(2000),
  activeDeliverable: z
    .enum(["landing", "instagram", "twitter", "linkedin", "ad"])
    .nullable(),
  stored: StoredShape.nullable(),
});

// Output schema for Claude — a short reply + an optional patch of any
// deliverable fields to overwrite.
const RefinementSchema = z.object({
  reply: z
    .string()
    .describe(
      "Short, in-character message back to the user. 1-2 sentences max. Confirms what you changed (if anything) or asks a clarifying question. Don't paste the new copy in here — the user will see it in the deliverable card.",
    ),
  updated: z
    .object({
      brandName: z.string().optional(),
      landing: z
        .object({
          headline: z.string().optional(),
          subhead: z.string().optional(),
          primaryCta: z.string().optional(),
          valueBullets: z.array(z.string()).optional(),
        })
        .optional(),
      social: z
        .object({
          instagram: z.string().optional(),
          twitter: z.string().optional(),
          linkedin: z.string().optional(),
        })
        .optional(),
      ad: z
        .object({
          headline: z.string().optional(),
          body: z.string().optional(),
          cta: z.string().optional(),
        })
        .optional(),
    })
    .optional()
    .describe(
      "Optional patch of fields to overwrite on the user's saved deliverables. Only include fields you actually changed. Omit entirely if you just answered a question or no changes are needed.",
    ),
});

const PERSONALITY_VOICE: Record<
  z.infer<typeof BodySchema>["personalityId"],
  string
> = {
  maven: "direct, formal, brief. Periods, no exclamation marks. Confirm what you did in 1 sentence.",
  sage: "encouraging, formal, detailed. Warm but professional.",
  spark: "encouraging, casual, brief. ONE exclamation mark max.",
  echo: "direct, casual, detailed. Peer-to-peer voice.",
};

function buildSystemPrompt(personality: keyof typeof PERSONALITY_VOICE) {
  return `You are the user's WRKS Studio agent — an AI marketing assistant they configured during onboarding. You already drafted their first deliverables (landing page, social posts, paid ad). Now they're in the studio talking to you to refine them.

Your job each turn:
1. Read the user's instruction.
2. If they're asking you to change something, return the updated copy in the \`updated\` patch (only the fields that actually change).
3. Write a SHORT \`reply\` (1-2 sentences) confirming what you did or asking a clarifying question. DO NOT paste the new copy into the reply — the studio UI shows it.

PERSONALITY: ${PERSONALITY_VOICE[personality]}

HOUSE STYLE (carried over from the original deliverables):
- Never use: "transform your business", "take it to the next level", "unlock your potential", "comprehensive", "robust", "leverage", "world-class", "industry-leading", "cutting-edge", "seamless", "elevate", "empower", "revolutionize"
- Use the user's actual words from their business description. Don't translate their language.
- Bold, distinctive choices over safe/generic ones.
- Match the brand voice you established in the original deliverables.

IF THE USER ASKS A QUESTION (not a change request): answer in the \`reply\`, omit \`updated\` entirely.

IF THE INSTRUCTION IS AMBIGUOUS: ask ONE clarifying question in the \`reply\`, don't guess.

ACTIVE DELIVERABLE: the user may have a specific deliverable selected (you'll see it in the user message as "Active: <name>"). Prefer to act on that one unless the instruction is clearly about something else.`;
}

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

  if (!body.stored) {
    return NextResponse.json({
      reply:
        "I don't have any of your work saved yet — head back to onboarding and we'll draft your first deliverables.",
    });
  }

  const userMessage = [
    body.activeDeliverable
      ? `Active deliverable: ${body.activeDeliverable}`
      : "Active deliverable: none",
    "",
    "Current saved deliverables:",
    "```json",
    JSON.stringify(body.stored.deliverables, null, 2),
    "```",
    "",
    `User instruction: ${body.instruction}`,
  ].join("\n");

  try {
    const response = await client.messages.parse({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: buildSystemPrompt(body.personalityId),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
      output_config: {
        format: zodOutputFormat(RefinementSchema),
      },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        {
          error: "Couldn't parse the refinement — try again or rephrase.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(response.parsed_output);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited. Try again in a moment." },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      console.error(
        `[api/refine] Anthropic ${err.status} ${err.type}: ${err.message}`,
      );
      return NextResponse.json(
        { error: `Anthropic ${err.status}: ${err.message}` },
        { status: 502 },
      );
    }
    console.error("[api/refine] unexpected:", err);
    return NextResponse.json(
      {
        error: `Unexpected: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    );
  }
}
