"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import DarkVeil from "@/components/dark-veil";

// /studio/sites/generating — the theater.
//
// Consumes the /api/sites/generate SSE stream and renders section
// reveals inside a browser mockup. Voice narration + virtual cursor
// choreography layer on top of this foundation in follow-up commits.

type CurationEvent = {
  pages: string[];
  compositions: Record<string, { sections: string[] }>;
};
type SectionStartEvent = {
  pageId: string;
  sectionId: string;
  narration: string;
};
type SectionDoneEvent = {
  pageId: string;
  sectionId: string;
  content: Record<string, unknown> | null;
};

type SectionState = {
  id: string;
  status: "pending" | "drafting" | "done";
  narration: string | null;
  content: Record<string, unknown> | null;
};

const SECTION_LABEL: Record<string, string> = {
  hero: "Hero",
  megaBento: "Mega bento",
  helpGrid: "Value grid",
  community: "Community",
  aboutBill: "About",
  reviews: "Reviews",
  spotlight: "Spotlight",
  heroSplit: "Welcome split",
  watchlist: "Watchlist",
  youtubeCta: "YouTube CTA",
  communityPricing: "Pricing",
  effortlessStrategy: "Strategy",
  closing: "Closing",
  videoTestimonials: "Video reviews",
};

export default function GeneratingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const jobId = params.get("jobId");

  const [curation, setCuration] = useState<CurationEvent | null>(null);
  const [sections, setSections] = useState<Record<string, SectionState[]>>({});
  const [narration, setNarration] = useState<string>("");
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ siteId: string } | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!jobId) {
      setError("Missing job id — start again from the composer.");
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const es = new EventSource(`/api/sites/generate?jobId=${jobId}`);

    es.addEventListener("curation.done", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as CurationEvent;
      setCuration(data);
      const seeded: Record<string, SectionState[]> = {};
      for (const page of data.pages) {
        const list = data.compositions[page]?.sections ?? [];
        seeded[page] = list.map((id) => ({
          id,
          status: "pending",
          narration: null,
          content: null,
        }));
      }
      setSections(seeded);
      if (data.pages[0]) setCurrentPageId(data.pages[0]);
    });

    es.addEventListener("page.start", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { pageId: string };
      setCurrentPageId(data.pageId);
    });

    es.addEventListener("section.start", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as SectionStartEvent;
      setNarration(data.narration);
      setSections((prev) => ({
        ...prev,
        [data.pageId]: (prev[data.pageId] ?? []).map((s) =>
          s.id === data.sectionId
            ? { ...s, status: "drafting", narration: data.narration }
            : s,
        ),
      }));
    });

    es.addEventListener("section.done", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as SectionDoneEvent;
      setSections((prev) => ({
        ...prev,
        [data.pageId]: (prev[data.pageId] ?? []).map((s) =>
          s.id === data.sectionId
            ? { ...s, status: "done", content: data.content }
            : s,
        ),
      }));
    });

    es.addEventListener("generation.done", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { siteId: string };
      setDone(data);
      es.close();
    });

    es.addEventListener("error", () => {
      // EventSource fires 'error' on normal stream completion too — ignore
      // unless we haven't received generation.done. We rely on the done
      // handler to close cleanly; anything else here is genuine failure.
      if (!startedRef.current) return;
    });

    return () => {
      es.close();
    };
  }, [jobId]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => {
        router.push(`/studio/sites/${done.siteId}`);
      }, 2400);
      return () => clearTimeout(t);
    }
  }, [done, router]);

  const totalSections = useMemo(() => {
    if (!curation) return 0;
    return curation.pages.reduce(
      (acc, p) => acc + (curation.compositions[p]?.sections.length ?? 0),
      0,
    );
  }, [curation]);
  const doneSections = useMemo(() => {
    return Object.values(sections)
      .flat()
      .filter((s) => s.status === "done").length;
  }, [sections]);
  const progress = totalSections > 0 ? doneSections / totalSections : 0;

  const currentSections = currentPageId ? sections[currentPageId] ?? [] : [];

  return (
    <main
      className="relative size-full overflow-hidden"
      style={{ background: "#0a0a0c", color: "#f5f0e6" }}
    >
      <div className="absolute inset-0" style={{ opacity: 0.65 }}>
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.35}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(10,10,12,0.25) 0%, rgba(10,10,12,0.55) 65%, rgba(10,10,12,0.78) 100%)",
        }}
      />

      <div className="relative z-10 size-full overflow-y-auto">
        <div
          className="min-h-full flex flex-col items-center justify-center"
          style={{ padding: "56px 40px 72px", gap: 32 }}
        >
          <div className="text-center" style={{ maxWidth: 700 }}>
            <p
              style={{
                fontSize: 11.5,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(245,240,230,0.4)",
                margin: "0 0 10px",
              }}
            >
              {done
                ? "Site drafted"
                : curation
                  ? `Page ${
                      (curation.pages.findIndex((p) => p === currentPageId) ?? 0) + 1
                    } of ${curation.pages.length}`
                  : "Warming up"}
            </p>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.75rem)",
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.028em",
                color: "rgba(248,247,252,0.97)",
                margin: "0 0 8px",
              }}
            >
              {done
                ? "Handing off to the builder…"
                : narration || "Drafting your site."}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(245,240,230,0.5)",
                letterSpacing: "-0.003em",
                margin: 0,
              }}
            >
              {done
                ? "You'll be able to edit any section inline."
                : "About 60 seconds. Sit back — the agent will walk you through it."}
            </p>
          </div>

          <SiteChrome
            pageId={currentPageId}
            sections={currentSections}
            done={!!done}
          />

          <div
            className="w-full"
            style={{ maxWidth: 780 }}
          >
            <div
              style={{
                height: 2,
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${Math.max(4, progress * 100)}%`,
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.75) 100%)",
                  transition: "width 400ms cubic-bezier(0.2, 0.7, 0.2, 1)",
                }}
              />
            </div>
            <div
              className="flex items-center justify-between"
              style={{
                marginTop: 10,
                fontSize: 11.5,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(245,240,230,0.42)",
              }}
            >
              <span>{doneSections} / {totalSections} sections</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
          </div>

          {error && (
            <p
              className="text-center"
              style={{ fontSize: 13, color: "#ff9d98" }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

// ============================================================
// SiteChrome — browser-style mockup with section reveals inside.
// ============================================================

function SiteChrome({
  pageId,
  sections,
  done,
}: {
  pageId: string | null;
  sections: SectionState[];
  done: boolean;
}) {
  return (
    <div
      className="w-full"
      style={{
        maxWidth: 940,
        borderRadius: 16,
        overflow: "hidden",
        background: "#0d0d12",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 40px 120px -40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Chrome bar — traffic lights + address */}
      <div
        className="flex items-center"
        style={{
          padding: "12px 18px",
          gap: 14,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.018)",
        }}
      >
        <div className="flex items-center" style={{ gap: 7 }}>
          <span style={dotStyle("#ff5f56")} />
          <span style={dotStyle("#ffbd2e")} />
          <span style={dotStyle("#27c93f")} />
        </div>
        <div
          className="flex-1 flex items-center"
          style={{
            gap: 8,
            padding: "6px 14px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.04)",
            fontSize: 12,
            color: "rgba(245,240,230,0.55)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em",
          }}
        >
          <span aria-hidden style={{ opacity: 0.5 }}>◆</span>
          <span>
            {done ? "your-brand.wrks.studio" : "your-brand.wrks.studio"}
            {pageId && pageId !== "home" ? `/${pageId}` : ""}
          </span>
        </div>
      </div>

      {/* Canvas — sections drop in one by one */}
      <div
        style={{
          padding: "28px 32px",
          minHeight: 380,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          background:
            "linear-gradient(180deg, #0d0d12 0%, #0a0a0c 100%)",
        }}
      >
        {sections.map((s, i) => (
          <SectionMockup key={`${pageId}-${s.id}-${i}`} section={s} />
        ))}
        {sections.length === 0 && (
          <div
            className="flex items-center justify-center"
            style={{
              flex: 1,
              minHeight: 320,
              color: "rgba(245,240,230,0.32)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Warming up
          </div>
        )}
      </div>
    </div>
  );
}

function dotStyle(color: string): React.CSSProperties {
  return {
    display: "inline-block",
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: color,
    boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.15)`,
  };
}

function SectionMockup({ section }: { section: SectionState }) {
  const label = SECTION_LABEL[section.id] ?? section.id;
  const headline =
    section.content && typeof section.content.headline === "string"
      ? (section.content.headline as string)
      : section.content && typeof section.content.heading === "string"
        ? (section.content.heading as string)
        : null;
  const subhead =
    section.content && typeof section.content.subhead === "string"
      ? (section.content.subhead as string)
      : null;

  return (
    <div
      className="section-mockup"
      style={{
        padding: "22px 24px",
        borderRadius: 12,
        border: `1px solid ${
          section.status === "drafting"
            ? "rgba(255,255,255,0.18)"
            : "rgba(255,255,255,0.06)"
        }`,
        background:
          section.status === "done"
            ? "rgba(255,255,255,0.028)"
            : "rgba(255,255,255,0.014)",
        transition:
          "border-color 300ms ease, background 300ms ease, opacity 300ms ease",
        opacity: section.status === "pending" ? 0.55 : 1,
        position: "relative",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 10 }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color:
              section.status === "drafting"
                ? "rgba(245,240,230,0.65)"
                : "rgba(245,240,230,0.35)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color:
              section.status === "done"
                ? "rgba(120,220,140,0.72)"
                : section.status === "drafting"
                  ? "rgba(255,255,255,0.55)"
                  : "rgba(245,240,230,0.28)",
          }}
        >
          {section.status === "done"
            ? "Done"
            : section.status === "drafting"
              ? "Drafting"
              : "Queued"}
        </span>
      </div>

      {section.status === "done" && headline ? (
        <div className="flex flex-col" style={{ gap: 6 }}>
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              color: "rgba(245,240,230,0.95)",
            }}
          >
            {headline}
          </span>
          {subhead && (
            <span
              style={{
                fontSize: 12.5,
                lineHeight: 1.5,
                color: "rgba(245,240,230,0.55)",
                maxWidth: "62ch",
              }}
            >
              {subhead}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 8 }}>
          <span style={skelStyle(section.status === "drafting", "70%")} />
          <span style={skelStyle(section.status === "drafting", "88%")} />
          <span style={skelStyle(section.status === "drafting", "54%")} />
        </div>
      )}
    </div>
  );
}

function skelStyle(active: boolean, width: string): React.CSSProperties {
  return {
    display: "block",
    height: 8,
    width,
    borderRadius: 999,
    background: active
      ? "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.06) 100%)"
      : "rgba(255,255,255,0.05)",
    backgroundSize: active ? "200% 100%" : undefined,
    animation: active
      ? "wrks-skel-shimmer 1.6s ease-in-out infinite"
      : undefined,
  };
}
