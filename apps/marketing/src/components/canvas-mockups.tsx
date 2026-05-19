"use client";

import { motion } from "motion/react";

/* Shared chrome pieces ---------------------------------------------------- */

function WindowChrome({
  filename,
  status,
}: {
  filename: string;
  status?: string;
}) {
  return (
    <div className="h-7 flex items-center gap-1.5 px-3 border-b border-line bg-panel/70">
      <span className="size-2 rounded-full bg-red-400/70" />
      <span className="size-2 rounded-full bg-amber-400/70" />
      <span className="size-2 rounded-full bg-emerald-400/70" />
      <span className="ml-3 flex-1 h-4 rounded-full bg-canvas border border-line flex items-center px-2.5 gap-1.5 min-w-0">
        <span className="size-1 rounded-full bg-emerald-400" />
        <span className="text-[8px] font-mono text-ink-muted truncate">
          {filename}
        </span>
      </span>
      {status && (
        <span className="text-[8px] font-mono text-ink-dim ml-2">{status}</span>
      )}
    </div>
  );
}

/* 1. WebsiteCanvas — design tool view --------------------------------------- */

export function WebsiteCanvas() {
  const layers = [
    { label: "Navigation", indent: 0, active: false },
    { label: "Hero", indent: 0, active: true },
    { label: "Headline", indent: 1, active: false, type: "text" },
    { label: "Subtitle", indent: 1, active: false, type: "text" },
    { label: "Image", indent: 1, active: false, type: "image" },
    { label: "Booking form", indent: 0, active: false },
    { label: "Footer", indent: 0, active: false },
  ];
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-2xl shadow-black/50">
      <WindowChrome filename="hannahshair.com / Hero" status="Editing" />
      <div className="grid grid-cols-[34%_1fr] h-[260px]">
        {/* Layers panel */}
        <div className="border-r border-line bg-panel/50 p-2 overflow-hidden">
          <div className="text-[8px] tracking-[0.18em] uppercase text-ink-dim font-sans px-1 mb-1.5">
            Layers
          </div>
          {layers.map((l, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[9px] font-mono ${
                l.active
                  ? "bg-sky-400/15 text-sky-200 ring-1 ring-sky-400/30"
                  : "text-ink-muted"
              }`}
              style={{ paddingLeft: `${6 + l.indent * 10}px` }}
            >
              <span
                className={`size-1 rounded-full shrink-0 ${
                  l.type === "text"
                    ? "bg-amber-400/70"
                    : l.type === "image"
                      ? "bg-rose-400/70"
                      : "bg-ink-muted/50"
                }`}
              />
              <span className="truncate">{l.label}</span>
            </div>
          ))}
        </div>
        {/* Canvas */}
        <div className="relative bg-canvas/30 p-3 overflow-hidden">
          <div className="absolute inset-3 rounded border border-dashed border-sky-400/50 ring-2 ring-sky-400/[0.04] pointer-events-none" />
          {/* Page wireframe */}
          <div className="relative h-full rounded bg-canvas border border-line p-2.5 flex flex-col gap-2 overflow-hidden">
            {/* Nav */}
            <div className="flex items-center justify-between">
              <span className="h-1 w-8 rounded-full bg-ink/60" />
              <div className="flex gap-1">
                <span className="h-1 w-4 rounded-full bg-ink-muted/40" />
                <span className="h-1 w-4 rounded-full bg-ink-muted/40" />
                <span className="h-1 w-4 rounded-full bg-ink-muted/40" />
              </div>
            </div>
            <div className="h-px bg-line" />
            {/* Hero */}
            <div className="grid grid-cols-[1fr_42%] gap-2 flex-1">
              <div className="flex flex-col justify-center gap-1">
                <div className="h-2.5 w-full rounded bg-ink/85" />
                <div className="h-2.5 w-3/4 rounded bg-ink/70" />
                <div className="mt-1 h-1 w-full rounded-full bg-ink-muted/30" />
                <div className="h-1 w-5/6 rounded-full bg-ink-muted/30" />
                <div className="mt-2 flex gap-1.5">
                  <span className="h-3 w-10 rounded-full bg-ink" />
                  <span className="h-3 w-10 rounded-full border border-line" />
                </div>
              </div>
              <div className="relative rounded bg-gradient-to-br from-panel to-canvas border border-line flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="text-ink-dim/60"
                >
                  <rect x="3" y="5" width="18" height="14" rx="1" />
                  <circle cx="9" cy="11" r="2" />
                  <path d="M21 17l-5-5-9 9" />
                </svg>
              </div>
            </div>
            {/* Spacing indicator */}
            <div className="absolute right-[44%] top-[55%] flex items-center gap-0.5">
              <span className="h-px w-3 bg-rose-400" />
              <span className="text-[7px] font-mono text-rose-400 bg-canvas px-0.5">
                24
              </span>
              <span className="h-px w-3 bg-rose-400" />
            </div>
          </div>
          {/* Floating toolbar */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-panel/95 backdrop-blur-md border border-line-bright rounded-full px-2 py-1 shadow-xl">
            {["cursor", "hand", "frame", "text"].map((k, i) => (
              <span
                key={k}
                className={`size-5 rounded-full flex items-center justify-center text-[9px] ${
                  i === 0
                    ? "bg-ink text-canvas"
                    : "text-ink-muted"
                }`}
              >
                <Tool kind={k} />
              </span>
            ))}
            <span className="ml-1 pl-1.5 border-l border-line text-[8px] font-mono text-ink-muted">
              100%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tool({ kind }: { kind: string }) {
  switch (kind) {
    case "cursor":
      return (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 3l14 8-7 1-3 7L5 3z" />
        </svg>
      );
    case "hand":
      return (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11V6a1 1 0 1 1 2 0v4M11 10V4a1 1 0 1 1 2 0v6M13 10V5a1 1 0 1 1 2 0v6M15 10V7a1 1 0 1 1 2 0v5a6 6 0 0 1-6 6h-2a4 4 0 0 1-4-4 4 4 0 0 1 4-4" />
        </svg>
      );
    case "frame":
      return (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="1" />
        </svg>
      );
    case "text":
      return (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 7h14M12 7v12" />
        </svg>
      );
  }
  return null;
}

/* 2. SocialCanvas — content calendar --------------------------------------- */

export function SocialCanvas() {
  const days = [
    { d: 3, label: "M", post: null },
    { d: 4, label: "T", post: "scheduled" },
    { d: 5, label: "W", post: null },
    { d: 6, label: "T", post: "published" },
    { d: 7, label: "F", post: "scheduled", active: true },
    { d: 8, label: "S", post: null },
    { d: 9, label: "S", post: "draft" },
  ];
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-2xl shadow-black/50">
      <div className="h-7 flex items-center justify-between px-3 border-b border-line bg-panel/70">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-[9px] tracking-[0.18em] uppercase text-ink-muted font-sans">
            March 2026 · Schedule
          </span>
        </div>
        <span className="text-[8px] font-mono text-ink-dim">12 posts</span>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <div
              key={day.d}
              className={`relative aspect-[3/4] rounded-md border p-1.5 flex flex-col ${
                day.active
                  ? "border-dashed border-rose-400 ring-2 ring-rose-400/[0.08]"
                  : "border-line"
              } bg-canvas/40`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[7px] font-mono text-ink-dim">
                  {day.label}
                </span>
                <span className="text-[7px] font-mono text-ink-muted">
                  {day.d}
                </span>
              </div>
              {day.post && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 rounded-sm bg-gradient-to-br from-rose-400/20 via-fuchsia-400/15 to-amber-300/15" />
                  <div className="mt-1 space-y-0.5">
                    <div className="h-0.5 w-full rounded-full bg-ink-muted/40" />
                    <div className="h-0.5 w-2/3 rounded-full bg-ink-muted/40" />
                  </div>
                  <div
                    className={`mt-1 h-0.5 w-full rounded-full ${
                      day.post === "scheduled"
                        ? "bg-rose-400"
                        : day.post === "published"
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Selected post details */}
        <div className="mt-3 rounded-lg border border-line bg-canvas/40 p-2.5 flex items-center gap-2.5">
          <div className="size-9 rounded bg-gradient-to-br from-rose-400 via-fuchsia-400 to-amber-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-sans font-semibold text-ink leading-tight">
              Friday · 7 Mar · 09:00
            </div>
            <div className="text-[9px] font-mono text-ink-muted mt-0.5 truncate">
              @hannahshair · &ldquo;New looks this season.&rdquo;
            </div>
          </div>
          <span className="text-[8px] tracking-[0.18em] uppercase font-sans font-medium text-rose-300">
            Scheduled
          </span>
        </div>
      </div>
    </div>
  );
}

/* 3. AdCanvas — A/B/C variants --------------------------------------------- */

export function AdCanvas() {
  const variants = [
    { id: "A", ctr: "4.2%", winner: false },
    { id: "B", ctr: "7.8%", winner: true },
    { id: "C", ctr: "2.1%", winner: false },
  ];
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-2xl shadow-black/50">
      <div className="h-7 flex items-center justify-between px-3 border-b border-line bg-panel/70">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[9px] tracking-[0.18em] uppercase text-ink-muted font-sans">
            Campaign · March promo
          </span>
        </div>
        <span className="text-[8px] font-mono text-ink-dim">A/B/C · live</span>
      </div>
      <div className="p-3 grid grid-cols-3 gap-2">
        {variants.map((v) => (
          <div
            key={v.id}
            className={`rounded-lg border p-2 flex flex-col gap-1.5 ${
              v.winner
                ? "border-dashed border-emerald-400 ring-2 ring-emerald-400/[0.08] bg-emerald-400/[0.03]"
                : "border-line bg-canvas/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono text-ink-dim">
                Variant {v.id}
              </span>
              {v.winner && (
                <span className="text-[7px] tracking-widest uppercase text-emerald-400 font-sans font-medium">
                  Winner
                </span>
              )}
            </div>
            {/* Ad creative preview */}
            <div className="relative h-14 rounded-sm bg-gradient-to-br from-amber-400/20 via-orange-400/15 to-rose-400/15 border border-line/60 flex items-center justify-center">
              <span className="text-[8px] font-serif italic text-ink/80">
                Hair that…
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-full rounded-full bg-ink-muted/40" />
              <div className="h-1 w-3/4 rounded-full bg-ink-muted/40" />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[8px] font-mono text-ink-muted">CTR</span>
              <span
                className={`text-[9px] font-mono font-semibold ${
                  v.winner ? "text-emerald-300" : "text-ink"
                }`}
              >
                {v.ctr}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 flex items-center gap-2 text-[8px] tracking-[0.18em] uppercase text-ink-dim font-sans">
        <span className="flex-1 h-px bg-line" />
        <span>Auto-promoting winner in 4h</span>
        <span className="flex-1 h-px bg-line" />
      </div>
    </div>
  );
}

/* 4. CopyCanvas — variant tester ------------------------------------------- */

export function CopyCanvas() {
  const variants = [
    {
      id: "A",
      heading: "The salon",
      italic: "that knows you",
      cvr: "12.4%",
      best: true,
    },
    {
      id: "B",
      heading: "Premium cuts",
      italic: "on your schedule",
      cvr: "7.1%",
      best: false,
    },
    {
      id: "C",
      heading: "Modern hair.",
      italic: "Honest pricing.",
      cvr: "5.8%",
      best: false,
    },
  ];
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-2xl shadow-black/50">
      <div className="h-7 flex items-center justify-between px-3 border-b border-line bg-panel/70">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[9px] tracking-[0.18em] uppercase text-ink-muted font-sans">
            Hero copy · variant test
          </span>
        </div>
        <span className="text-[8px] font-mono text-ink-dim">3 of 7 live</span>
      </div>
      <div className="p-3 space-y-1.5">
        {variants.map((v) => (
          <div
            key={v.id}
            className={`rounded-lg border p-2.5 flex items-center gap-3 ${
              v.best
                ? "border-violet-400/50 bg-violet-400/[0.04] ring-1 ring-violet-400/15"
                : "border-line bg-canvas/40 opacity-80"
            }`}
          >
            <span
              className={`size-6 rounded-md flex items-center justify-center text-[9px] font-mono font-semibold shrink-0 ${
                v.best
                  ? "bg-violet-400 text-violet-950"
                  : "border border-line text-ink-muted"
              }`}
            >
              {v.id}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-serif text-[12px] leading-tight tracking-tight text-ink">
                {v.heading}{" "}
                <span className="italic text-ink-muted">{v.italic}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`text-[10px] font-mono font-semibold ${
                  v.best ? "text-violet-300" : "text-ink-muted"
                }`}
              >
                {v.cvr}
              </div>
              <div className="text-[7px] tracking-widest uppercase text-ink-dim font-sans">
                CVR
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 flex items-center justify-between text-[8px] tracking-[0.18em] uppercase font-sans">
        <span className="text-ink-dim">2,847 sessions · 99% confidence</span>
        <span className="text-violet-300 font-medium">Promote winner →</span>
      </div>
    </div>
  );
}

/* 5. BlogCanvas — editor + SEO panel ---------------------------------------- */

export function BlogCanvas() {
  const outline = [
    { level: 1, label: "How often should you trim layered hair?" },
    { level: 2, label: "Why layered hair grows differently" },
    { level: 2, label: "The right interval for your texture" },
    { level: 3, label: "Fine hair · 4–6 weeks" },
    { level: 3, label: "Coarse hair · 8–10 weeks" },
    { level: 2, label: "Booking your next trim" },
  ];
  const seo = [
    { label: "SEO score", value: "94", tone: "good" },
    { label: "Readability", value: "A2", tone: "good" },
    { label: "Words", value: "1,247", tone: "neutral" },
    { label: "Read time", value: "4 min", tone: "neutral" },
  ];
  return (
    <div className="relative rounded-2xl border border-line-bright bg-canvas overflow-hidden shadow-2xl shadow-black/50">
      <WindowChrome filename="layered-cuts.md" status="Draft · auto-saved" />
      <div className="grid grid-cols-[44%_1fr] h-[260px]">
        {/* Outline */}
        <div className="border-r border-line bg-panel/50 p-2 overflow-hidden">
          <div className="text-[8px] tracking-[0.18em] uppercase text-ink-dim font-sans px-1 mb-1.5">
            Outline
          </div>
          {outline.map((o, i) => (
            <div
              key={i}
              className={`flex items-start gap-1.5 px-1 py-1 rounded text-[8px] ${
                i === 1
                  ? "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/30"
                  : "text-ink-muted"
              }`}
              style={{ paddingLeft: `${4 + (o.level - 1) * 8}px` }}
            >
              <span
                className={`font-mono shrink-0 text-ink-dim ${
                  o.level === 1 ? "text-emerald-400" : ""
                }`}
              >
                H{o.level}
              </span>
              <span className="leading-tight">{o.label}</span>
            </div>
          ))}
        </div>
        {/* Editor + SEO */}
        <div className="grid grid-rows-[1fr_auto] overflow-hidden">
          <div className="relative p-3 overflow-hidden">
            <div className="font-serif text-[12px] leading-tight tracking-tight text-ink mb-1.5">
              Why layered hair grows differently
            </div>
            <div className="space-y-1 mb-2">
              <div className="h-1 w-full rounded-full bg-ink-muted/30" />
              <div className="h-1 w-[96%] rounded-full bg-ink-muted/30" />
              <div className="h-1 w-[88%] rounded-full bg-ink-muted/30" />
              <div className="h-1 w-[60%] rounded-full bg-ink-muted/30" />
            </div>
            <div className="space-y-1">
              <div className="h-1 w-[92%] rounded-full bg-ink-muted/30" />
              <div className="h-1 w-[78%] rounded-full bg-ink-muted/30" />
            </div>
            {/* Inline cursor */}
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-3 top-[42px] inline-block w-[1.5px] h-2.5 bg-ink"
            />
          </div>
          <div className="border-t border-line bg-panel/30 p-2 grid grid-cols-4 gap-1.5">
            {seo.map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className={`text-[11px] font-mono font-semibold ${
                    s.tone === "good" ? "text-emerald-300" : "text-ink"
                  }`}
                >
                  {s.value}
                </div>
                <div className="text-[7px] tracking-[0.18em] uppercase text-ink-dim font-sans mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
