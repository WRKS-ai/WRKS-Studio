import Link from "next/link";

// Server-rendered list of the user's generated sites. Sits above the
// composer on /studio/sites. Empty on first visit; populated after
// the first generation completes.

export type SiteRow = {
  id: string;              // jobId
  brandName: string | null;
  brief: string;
  createdAt: string;       // ISO
  pageCount: number;
  publishedSlug: string | null;
};

export function SitesList({ sites }: { sites: SiteRow[] }) {
  if (sites.length === 0) return null;

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 780,
        marginBottom: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            color: "rgba(245,240,230,0.7)",
            margin: 0,
          }}
        >
          Your sites
        </h2>
        <span
          style={{
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            color: "rgba(245,240,230,0.4)",
          }}
        >
          {sites.length} total
        </span>
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {sites.map((site) => (
          <SiteListRow key={site.id} site={site} />
        ))}
      </ul>

      <div
        style={{
          marginTop: 28,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      />
    </section>
  );
}

function SiteListRow({ site }: { site: SiteRow }) {
  const isPublished = !!site.publishedSlug;
  const liveUrl = isPublished ? `https://${site.publishedSlug}.wrksstudio.com` : null;
  const previewUrl = `/api/sites/render/${encodeURIComponent(site.id)}`;

  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 20,
        padding: "16px 18px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "background 150ms",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 500,
              color: "rgba(245,240,230,0.95)",
              letterSpacing: "-0.005em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {site.brandName ?? "Untitled site"}
          </span>
          <span
            style={{
              padding: "2px 7px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(245,240,230,0.6)",
              fontSize: 10.5,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {site.pageCount} {site.pageCount === 1 ? "page" : "pages"}
          </span>
          {isPublished && (
            <span
              style={{
                padding: "2px 7px",
                borderRadius: 4,
                background: "rgba(120,220,140,0.12)",
                color: "rgba(120,220,140,0.9)",
                fontSize: 10.5,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              Live
            </span>
          )}
        </div>
        {liveUrl ? (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12.5,
              fontFamily: "var(--font-mono)",
              color: "rgba(245,240,230,0.55)",
              textDecoration: "none",
              letterSpacing: "-0.003em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
          >
            {site.publishedSlug}.wrksstudio.com
          </a>
        ) : (
          <span
            style={{
              fontSize: 12.5,
              color: "rgba(245,240,230,0.45)",
              letterSpacing: "-0.003em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
          >
            {truncate(site.brief, 80)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={rowButtonStyle}
        >
          Preview
        </a>
        <Link href={`/studio/sites/${encodeURIComponent(site.id)}`} style={rowButtonStyle}>
          Open
        </Link>
      </div>
    </li>
  );
}

const rowButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(245,240,230,0.85)",
  fontSize: 12.5,
  fontWeight: 500,
  letterSpacing: "-0.003em",
  textDecoration: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
};

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
