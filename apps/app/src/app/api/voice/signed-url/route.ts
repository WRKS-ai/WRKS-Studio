import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET /api/voice/signed-url
// Returns a short-lived signed URL the browser uses to open a WebRTC
// session with our ElevenLabs Conversational AI agent. The agent ID
// and API key stay server-side.

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json(
      {
        error:
          "Voice not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in env.",
      },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(
        agentId,
      )}`,
      {
        headers: { "xi-api-key": apiKey },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error(
        `[api/voice/signed-url] ElevenLabs ${res.status}: ${detail.slice(0, 500)}`,
      );
      return NextResponse.json(
        {
          error: `ElevenLabs returned ${res.status}. Check your API key, agent ID, and that the agent is published.`,
        },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) {
      return NextResponse.json(
        { error: "ElevenLabs response missing signed_url." },
        { status: 502 },
      );
    }

    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (err) {
    console.error("[api/voice/signed-url] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
