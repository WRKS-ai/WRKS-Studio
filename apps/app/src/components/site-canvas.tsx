"use client";

import { motion } from "motion/react";
import type { Personality } from "@/lib/personalities";
import type { Site } from "@/lib/site-model";
import { SectionRenderer } from "@/components/site-sections";
import { MacBookFrame } from "@/components/wow-mockups";

// The website canvas: a page strip above the MacBook (pages of the
// site) + the active page rendered as a stack of sections inside the
// browser screen. Pages persist across the voice agent's navigation.

export function SiteCanvas({
  site,
  personality,
  onPickPage,
  onAddPage,
}: {
  site: Site;
  personality: Personality;
  onPickPage: (pageId: string) => void;
  onAddPage: () => void;
}) {
  const activePage =
    site.pages.find((p) => p.id === site.activePageId) ?? site.pages[0];
  const accent = personality.accent;

  return (
    <div className="w-full max-w-[920px] flex flex-col gap-5">
      {/* Page strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[11px] tracking-[0.22em] uppercase mr-2"
          style={{
            color: "rgba(245,245,247,0.42)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Pages
        </span>
        {site.pages.map((p) => {
          const isActive = p.id === activePage?.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPickPage(p.id)}
              className="h-9 px-3.5 rounded-lg inline-flex items-center gap-2 transition-colors"
              style={{
                background: isActive
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.02)",
                border: isActive
                  ? `1px solid ${accent}55`
                  : "1px solid rgba(255,255,255,0.07)",
                color: isActive
                  ? "rgba(245,245,247,0.98)"
                  : "rgba(245,245,247,0.65)",
              }}
            >
              {isActive && (
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                />
              )}
              <span className="text-[13.5px] font-medium">{p.label}</span>
              <span
                className="text-[11px]"
                style={{
                  color: "rgba(245,245,247,0.35)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                /{p.slug}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAddPage}
          className="h-9 px-3 rounded-lg inline-flex items-center gap-1.5 transition-colors hover:bg-white/[0.04]"
          style={{
            color: "rgba(245,245,247,0.5)",
            border: "1px dashed rgba(255,255,255,0.12)",
          }}
        >
          <span className="text-[14px] leading-none">+</span>
          <span className="text-[12.5px]">Add page</span>
        </button>
      </div>

      {/* MacBook with the active page rendered inside */}
      <MacBookFrame>
        {activePage ? (
          <motion.div
            key={activePage.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="size-full bg-[#fbf7ee] flex flex-col"
          >
            <SiteNav site={site} activePageSlug={activePage.slug} accent={accent} />
            <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {activePage.sections.length === 0 ? (
                <EmptyPage accent={accent} />
              ) : (
                activePage.sections.map((s) => (
                  <SectionRenderer
                    key={s.id}
                    section={s}
                    tokens={{ accent, brandName: site.brandName }}
                  />
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <div className="size-full grid place-items-center bg-[#fbf7ee] text-[#827a6e] text-[13px] font-mono">
            No pages yet.
          </div>
        )}
      </MacBookFrame>
    </div>
  );
}

function SiteNav({
  site,
  activePageSlug,
  accent,
}: {
  site: Site;
  activePageSlug: string;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between px-8 py-3 border-b border-black/5 shrink-0">
      <span className="font-serif text-[15px] text-[#0e0c08] flex items-center gap-2">
        <span
          className="size-1.5 rounded-full"
          style={{ background: accent }}
        />
        {site.brandName}
      </span>
      <div className="flex gap-6 text-[11px] uppercase tracking-[0.22em] font-mono text-[#827a6e]">
        {site.pages.map((p) => {
          const isActive = p.slug === activePageSlug;
          return (
            <span
              key={p.id}
              style={{
                color: isActive ? "#0e0c08" : "#827a6e",
                borderBottom: isActive ? `1px solid ${accent}` : "1px solid transparent",
                paddingBottom: 2,
              }}
            >
              {p.label}
            </span>
          );
        })}
      </div>
      <span className="text-[11px] uppercase tracking-[0.22em] font-mono text-[#827a6e]">
        Vol. 01
      </span>
    </div>
  );
}

function EmptyPage({ accent }: { accent: string }) {
  return (
    <div className="px-10 py-16 text-center">
      <p
        className="font-serif italic text-[16px] mb-2"
        style={{ color: "#827a6e" }}
      >
        Empty page.
      </p>
      <p
        className="text-[12.5px] font-sans"
        style={{ color: "#827a6e" }}
      >
        Tell the agent: <span style={{ color: accent }}>&ldquo;add a hero&rdquo;</span>,{" "}
        <span style={{ color: accent }}>&ldquo;add pricing&rdquo;</span>, or{" "}
        <span style={{ color: accent }}>&ldquo;add testimonials&rdquo;</span>.
      </p>
    </div>
  );
}
