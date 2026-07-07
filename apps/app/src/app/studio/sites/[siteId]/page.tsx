import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

// /studio/sites/[siteId] — post-generation handoff.
//
// v1 (2026-06-30) placeholder: the theater redirects here on
// completion. Shows a "site drafted" confirmation + entry to the
// builder (which lands in a follow-up commit).

export const runtime = "nodejs";

export default async function SitePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main
      className="relative size-full overflow-y-auto"
      style={{ background: "#0a0a0c", color: "#f5f0e6" }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 780, padding: "72px 40px 96px" }}
      >
        <Link
          href="/studio/sites"
          className="inline-flex items-center transition-opacity duration-150 hover:opacity-80"
          style={{
            gap: 6,
            fontSize: 12.5,
            color: "rgba(245,240,230,0.55)",
            letterSpacing: "-0.003em",
          }}
        >
          <span aria-hidden>←</span> Sites
        </Link>

        <p
          style={{
            marginTop: 40,
            fontSize: 11.5,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(120,220,140,0.75)",
            margin: "40px 0 12px",
          }}
        >
          Draft ready
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 3.5vw, 3rem)",
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            color: "rgba(248,247,252,0.97)",
            margin: "0 0 12px",
          }}
        >
          Your site is drafted.
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: "rgba(245,240,230,0.6)",
            letterSpacing: "-0.003em",
            maxWidth: "62ch",
            margin: 0,
          }}
        >
          The builder canvas lands next — inline edits, voice refinement,
          publish to <span style={{ color: "rgba(245,240,230,0.9)" }}>{`{brand}.wrks.studio`}</span>.
          For now this page confirms the pipeline: brief → curate → draft
          → handoff.
        </p>

        <div
          style={{
            marginTop: 40,
            padding: "22px 24px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <p
            style={{
              fontSize: 11.5,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(245,240,230,0.4)",
              margin: "0 0 8px",
            }}
          >
            Draft id
          </p>
          <p
            style={{
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              color: "rgba(245,240,230,0.85)",
              margin: 0,
              wordBreak: "break-all",
            }}
          >
            {siteId}
          </p>
        </div>

        <p
          style={{
            marginTop: 36,
            fontSize: 13,
            color: "rgba(245,240,230,0.4)",
            letterSpacing: "-0.003em",
          }}
        >
          Next: Figma-style builder with inline copy edits + Aura orb
          voice refinement + publish pipeline to Cloudflare Pages.
        </p>
      </div>
    </main>
  );
}
