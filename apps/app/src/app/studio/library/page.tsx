"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, StudioPageShell } from "@/components/studio-page-shell";
import { CrystalButton } from "@/components/crystal-button";

type StoredPayload = {
  deliverables: { brandName: string; landing: { headline: string } };
  images: { heroLandscape: string };
  createdAt: string;
};

export default function LibraryPage() {
  const [stored, setStored] = useState<StoredPayload | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("wrks-studio-deliverables");
    if (raw) {
      try {
        setStored(JSON.parse(raw) as StoredPayload);
      } catch {
        // ignore
      }
    }
  }, []);

  const items = stored
    ? [
        {
          id: "current",
          title: stored.deliverables.brandName,
          subtitle: stored.deliverables.landing.headline,
          image: stored.images.heroLandscape,
          when: "Today",
        },
      ]
    : [];

  return (
    <StudioPageShell
      title="Library"
      subtitle="Every set of deliverables you&rsquo;ve drafted. Pick one to refine."
      maxWidth={1180}
      actions={
        <Link
          href="/studio"
          className="h-10 px-4 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-white/[0.05] inline-flex items-center gap-2"
          style={{
            color: "rgba(245,245,247,0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Open Studio →
        </Link>
      }
    >
      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <div
            className="text-[14.5px] mb-5"
            style={{ color: "rgba(245,245,247,0.6)" }}
          >
            You haven&rsquo;t saved any deliverables yet.
          </div>
          <Link href="/onboarding/personality" className="inline-flex">
            <CrystalButton size="lg">
              Start a new brand
              <span aria-hidden>→</span>
            </CrystalButton>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => (
            <Link
              key={it.id}
              href="/studio"
              className="group block rounded-2xl overflow-hidden transition-transform hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image}
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div
                  className="text-[11px] tracking-[0.2em] uppercase mb-1.5"
                  style={{
                    color: "rgba(245,240,230,0.85)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {it.when}
                </div>
                <div
                  className="text-[17px] font-medium mb-1.5"
                  style={{ color: "rgba(245,245,247,0.95)" }}
                >
                  {it.title}
                </div>
                <p
                  className="text-[13.5px] line-clamp-2 leading-relaxed"
                  style={{ color: "rgba(245,245,247,0.6)" }}
                >
                  {it.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </StudioPageShell>
  );
}
