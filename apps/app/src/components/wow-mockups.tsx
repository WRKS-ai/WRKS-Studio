"use client";

import type { ReactNode } from "react";

// Device mockups for the /onboarding/wow page. Each frame is a
// stylized but recognizable device — MacBook Pro for website,
// iPhone Pro for social posts, iPhone in a Facebook feed scroll
// for the ad placement. Content scrolls inside the screen area.

/* ============================================================
 * MacBook Pro frame — for the website preview
 * Internal screen is scrollable; the bezel + hinge stay fixed.
 * ============================================================ */
export function MacBookFrame({
  children,
  screenAspectRatio = "16 / 10",
  maxWidth = 920,
}: {
  children: ReactNode;
  screenAspectRatio?: string;
  maxWidth?: number;
}) {
  return (
    <div
      className="relative mx-auto w-full"
      style={{ maxWidth: `${maxWidth}px` }}
    >
      {/* Top bezel + screen */}
      <div
        className="relative rounded-[14px] sm:rounded-[18px]"
        style={{
          background: "linear-gradient(180deg, #2a2a2c 0%, #1a1a1c 100%)",
          padding: "10px",
          boxShadow:
            "0 60px 120px -40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 30px 60px -20px rgba(0,0,0,0.5)",
        }}
      >
        {/* Camera notch */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
          style={{
            width: "90px",
            height: "18px",
            background: "#0a0a0c",
            borderRadius: "0 0 14px 14px",
          }}
        >
          <div
            className="absolute top-1.5 left-1/2 -translate-x-1/2 size-1.5 rounded-full"
            style={{ background: "#1c1c1f" }}
          />
        </div>

        {/* Screen content area — scrollable */}
        <div
          className="relative w-full rounded-[6px] sm:rounded-[8px] overflow-hidden bg-white"
          style={{ aspectRatio: screenAspectRatio }}
        >
          <div
            className="absolute inset-0 overflow-y-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            {children}
          </div>
          {/* Subtle screen reflection — top-left highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 35%)",
            }}
          />
        </div>
      </div>

      {/* Hinge / bottom bezel */}
      <div
        className="relative mx-auto"
        style={{
          width: "104%",
          marginLeft: "-2%",
          marginTop: "-2px",
          height: "18px",
          background:
            "linear-gradient(180deg, #c0c2c8 0%, #8a8d94 50%, #5e6068 100%)",
          borderRadius: "0 0 14px 14px",
          boxShadow:
            "0 14px 28px -10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        {/* Trackpad notch shadow */}
        <div
          aria-hidden
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-md"
          style={{
            width: "120px",
            height: "3px",
            background: "rgba(0,0,0,0.25)",
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
 * iPhone Pro frame — for social posts + ad
 * ============================================================ */
export function IPhoneFrame({
  children,
  width = 280,
  shadowGlow,
}: {
  children: ReactNode;
  width?: number;
  shadowGlow?: string; // optional accent-glow under the device
}) {
  return (
    <div className="relative mx-auto" style={{ width }}>
      <div
        className="relative w-full"
        style={{
          aspectRatio: "9 / 19.5",
          background: "linear-gradient(135deg, #1a1a1c 0%, #0a0a0c 100%)",
          padding: "8px",
          borderRadius: "44px",
          boxShadow: shadowGlow
            ? `0 50px 100px -30px ${shadowGlow}, 0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset`
            : "0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        {/* Inner screen */}
        <div
          className="relative size-full overflow-hidden bg-white"
          style={{ borderRadius: "36px" }}
        >
          {/* Dynamic Island */}
          <div
            aria-hidden
            className="absolute top-2 left-1/2 -translate-x-1/2 z-30 rounded-full"
            style={{
              width: "84px",
              height: "24px",
              background: "#000",
            }}
          />

          {/* Status bar (time + indicators) */}
          <div
            className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 pt-2.5"
            style={{ height: "32px", color: "#0a0a0c", fontSize: "11px" }}
          >
            <span className="font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <span className="block size-1 rounded-full bg-current" />
              <span className="block size-1 rounded-full bg-current" />
              <span className="block size-1 rounded-full bg-current" />
              <span className="block size-1 rounded-full bg-current" />
            </div>
          </div>

          {/* Home indicator */}
          <div
            aria-hidden
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 rounded-full"
            style={{
              width: "36%",
              height: "4px",
              background: "#0a0a0c",
            }}
          />

          {/* Scrollable content */}
          <div
            className="absolute inset-0 overflow-y-auto pt-[34px]"
            style={{ scrollbarWidth: "none" }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Mini Instagram UI to render inside iPhone
 * ============================================================ */
export function InstagramMini({
  handle,
  caption,
  image,
  accent,
  accentDeep,
}: {
  handle: string;
  caption: string;
  image: string;
  accent: string;
  accentDeep: string;
}) {
  return (
    <div className="size-full flex flex-col bg-white" style={{ color: "#0a0a0c" }}>
      {/* Top bar — Instagram script logo */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <span
          className="font-serif italic font-medium text-[18px] tracking-tight"
          style={{ fontFamily: "Fraunces, serif" }}
        >
          Instagram
        </span>
        <div className="flex items-center gap-3">
          <HeartIcon />
          <PaperPlaneIcon />
        </div>
      </div>

      {/* Stories row */}
      <div
        className="flex items-center gap-3 px-3 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <div
              className="size-12 rounded-full p-[2px]"
              style={{
                background:
                  i === 0
                    ? `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`
                    : "conic-gradient(from 0deg, #f09433, #e6683c, #dc2743, #bc1888)",
              }}
            >
              <div
                className="size-full rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
                  border: "2px solid white",
                }}
              />
            </div>
            <span
              className="text-[9px]"
              style={{ color: "#0a0a0c", maxWidth: "48px" }}
            >
              {i === 0 ? "Your story" : `friend${i}`}
            </span>
          </div>
        ))}
      </div>

      {/* Post */}
      <div className="flex flex-col">
        {/* Post header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div
            className="size-8 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
            }}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <div className="font-sans font-semibold text-[12.5px] leading-tight">
              {handle}
            </div>
            <div className="text-[11px]" style={{ color: "#5c5c66" }}>
              Sponsored
            </div>
          </div>
          <span className="text-[18px] leading-none" style={{ color: "#0a0a0c" }}>
            ⋯
          </span>
        </div>

        {/* Photo */}
        <div className="relative aspect-square w-full" style={{ background: "#f0f0f0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3.5 px-3 py-2.5" style={{ color: "#0a0a0c" }}>
          <HeartIcon />
          <CommentIcon />
          <PaperPlaneIcon />
          <span className="ml-auto">
            <BookmarkIcon />
          </span>
        </div>

        {/* Likes */}
        <div className="px-3 text-[12.5px] font-semibold" style={{ color: "#0a0a0c" }}>
          2,847 likes
        </div>

        {/* Caption */}
        <div className="px-3 pt-1.5 pb-4 text-[12.5px] leading-snug" style={{ color: "#0a0a0c" }}>
          <span className="font-semibold mr-1.5">{handle}</span>
          {caption}
        </div>
      </div>

      {/* Bottom nav */}
      <div
        className="mt-auto flex items-center justify-around py-3.5 px-4"
        style={{
          borderTop: "1px solid rgba(0,0,0,0.05)",
          background: "white",
        }}
      >
        <HomeIcon />
        <SearchIcon />
        <ReelsIcon />
        <ShopIcon />
        <div
          className="size-6 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}

/* ============================================================
 * Mini X (Twitter) UI to render inside iPhone
 * ============================================================ */
export function XMini({
  brandName,
  handle,
  text,
  accent,
  accentDeep,
}: {
  brandName: string;
  handle: string;
  text: string;
  accent: string;
  accentDeep: string;
}) {
  return (
    <div className="size-full flex flex-col bg-white" style={{ color: "#0f1419" }}>
      {/* Top bar — X logo */}
      <div
        className="flex items-center justify-center py-2.5 relative"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <span className="font-bold text-[18px]">𝕏</span>
        <div
          className="absolute left-3 size-7 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
          }}
          aria-hidden
        />
      </div>

      {/* Tabs */}
      <div
        className="flex items-center justify-around py-2.5 text-[13px] font-semibold"
        style={{
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          color: "#0f1419",
        }}
      >
        <span>For you</span>
        <span style={{ color: "#536471" }}>Following</span>
      </div>

      {/* Tweet */}
      <div className="px-3.5 py-3 flex gap-3">
        <div
          className="size-10 rounded-full shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1 flex-wrap leading-tight">
            <span className="font-bold text-[14px]">{brandName}</span>
            <span className="text-[13px]" style={{ color: "#536471" }}>
              {handle}
            </span>
            <span style={{ color: "#536471" }} className="text-[13px]">
              ·
            </span>
            <span className="text-[13px]" style={{ color: "#536471" }}>
              2h
            </span>
          </div>
          <p className="mt-1 text-[14px] leading-snug whitespace-pre-wrap">
            {text}
          </p>
          <div
            className="mt-3 flex items-center justify-between text-[12px]"
            style={{ color: "#536471" }}
          >
            <span className="flex items-center gap-1">
              <CommentIcon size={14} /> 12
            </span>
            <span className="flex items-center gap-1">
              <RetweetIcon /> 38
            </span>
            <span className="flex items-center gap-1">
              <HeartIcon size={14} /> 214
            </span>
            <span className="flex items-center gap-1">
              <ChartIcon /> 8.4K
            </span>
            <span>
              <PaperPlaneIcon size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* Fake other tweets for context */}
      <FakeTweet name="Alex Park" handle="@alexparkdesign" mins="34m" />
      <FakeTweet name="Jordan Vega" handle="@jvega" mins="1h" />

      {/* Bottom nav */}
      <div
        className="mt-auto flex items-center justify-around py-3.5 px-4"
        style={{
          borderTop: "1px solid rgba(0,0,0,0.05)",
          background: "white",
          color: "#0f1419",
        }}
      >
        <HomeIcon />
        <SearchIcon />
        <CommunityIcon />
        <BellIcon />
        <MailIcon />
      </div>
    </div>
  );
}

function FakeTweet({
  name,
  handle,
  mins,
}: {
  name: string;
  handle: string;
  mins: string;
}) {
  return (
    <div
      className="px-3.5 py-3 flex gap-3 opacity-50"
      style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
    >
      <div className="size-10 rounded-full shrink-0 bg-gray-300" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1 flex-wrap leading-tight">
          <span className="font-bold text-[14px]">{name}</span>
          <span className="text-[13px]" style={{ color: "#536471" }}>
            {handle}
          </span>
          <span style={{ color: "#536471" }} className="text-[13px]">
            · {mins}
          </span>
        </div>
        <p className="mt-1 text-[13px]" style={{ color: "#536471" }}>
          {name === "Alex Park"
            ? "Hot take of the day: tools should disappear."
            : "We launched something new. Quietly."}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
 * Mini LinkedIn UI to render inside iPhone
 * ============================================================ */
export function LinkedInMini({
  agentName,
  brandName,
  text,
  accent,
  accentDeep,
}: {
  agentName: string;
  brandName: string;
  text: string;
  accent: string;
  accentDeep: string;
}) {
  return (
    <div className="size-full flex flex-col bg-white" style={{ color: "#000" }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        <div
          className="size-7 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <div
          className="flex-1 rounded-md py-1.5 px-3 text-[12px]"
          style={{ background: "#eef3f8", color: "#666" }}
        >
          Search
        </div>
        <MailIcon />
      </div>

      {/* Post header */}
      <div className="flex items-start gap-2.5 px-3 py-3">
        <div
          className="size-10 rounded-full shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[13px] leading-tight">
            {agentName}
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: "#666" }}>
            Founder, {brandName}
          </div>
          <div
            className="text-[11px] mt-0.5 flex items-center gap-1"
            style={{ color: "#666" }}
          >
            <span>2h</span>
            <span>·</span>
            <span aria-hidden>🌐</span>
          </div>
        </div>
        <span className="text-[20px] leading-none" style={{ color: "#666" }}>
          ⋯
        </span>
      </div>

      {/* Post body */}
      <div className="px-3 pb-3 text-[12.5px] leading-relaxed whitespace-pre-wrap">
        {text}
      </div>

      {/* Reactions */}
      <div
        className="px-3 py-1.5 flex items-center gap-2 text-[11px]"
        style={{ color: "#666", borderTop: "1px solid rgba(0,0,0,0.05)" }}
      >
        <span className="flex items-center -space-x-1">
          <span
            className="size-4 rounded-full flex items-center justify-center text-white text-[8px] border border-white"
            style={{ background: "#0a66c2" }}
          >
            👍
          </span>
          <span
            className="size-4 rounded-full flex items-center justify-center text-white text-[8px] border border-white"
            style={{ background: "#f5b400" }}
          >
            💡
          </span>
        </span>
        <span>184</span>
        <span className="ml-auto">42 comments · 6 reposts</span>
      </div>

      {/* Actions */}
      <div
        className="px-3 py-2 flex items-center justify-around text-[12px] font-semibold"
        style={{ color: "#666", borderTop: "1px solid rgba(0,0,0,0.07)" }}
      >
        <span className="flex items-center gap-1">
          <ThumbIcon /> Like
        </span>
        <span className="flex items-center gap-1">
          <CommentIcon size={14} /> Comment
        </span>
        <span className="flex items-center gap-1">
          <RetweetIcon /> Repost
        </span>
        <span className="flex items-center gap-1">
          <PaperPlaneIcon size={14} /> Send
        </span>
      </div>

      {/* Bottom nav */}
      <div
        className="mt-auto flex items-center justify-around py-3.5 px-3"
        style={{
          borderTop: "1px solid rgba(0,0,0,0.07)",
          background: "white",
        }}
      >
        <HomeIcon />
        <NetworkIcon />
        <PostIcon />
        <BellIcon />
        <BriefcaseIcon />
      </div>
    </div>
  );
}

/* ============================================================
 * Mini Facebook feed with the ad in context (for ad tab)
 * ============================================================ */
export function FacebookAdInFeed({
  brandName,
  adData,
  adImage,
  accent,
  accentDeep,
}: {
  brandName: string;
  adData: { headline: string; body: string; cta: string };
  adImage: string;
  accent: string;
  accentDeep: string;
}) {
  const slug = brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "brand";
  return (
    <div className="size-full flex flex-col" style={{ background: "#f0f2f5", color: "#050505" }}>
      {/* FB top bar */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <span className="font-bold text-[20px]" style={{ color: "#1877f2" }}>
          facebook
        </span>
        <div className="flex items-center gap-2.5">
          <SearchIcon />
          <MailIcon />
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex items-center justify-around py-2"
        style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <HomeIcon />
        <NetworkIcon />
        <PlayIcon />
        <ShopIcon />
        <BellIcon />
      </div>

      {/* Fake post above */}
      <FakeFbPost name="Sarah Lin" mins="2h" />

      {/* THE ad — highlighted */}
      <div className="mt-2" style={{ background: "white" }}>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div
            className="size-9 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
            }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[13px] leading-tight">
              {brandName}
            </div>
            <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "#65676b" }}>
              <span>Sponsored</span>
              <span aria-hidden>·</span>
              <span aria-hidden>🌐</span>
            </div>
          </div>
          <span className="text-[20px] leading-none" style={{ color: "#65676b" }}>
            ⋯
          </span>
        </div>

        {/* Body copy */}
        <div className="px-3 pb-2.5 text-[13.5px] leading-relaxed">
          {adData.body}
        </div>

        {/* Image */}
        <div className="relative w-full" style={{ aspectRatio: "1 / 1", background: "#f0f0f0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={adImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* CTA bar */}
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ background: "#f0f2f5" }}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider" style={{ color: "#65676b" }}>
              {slug}.com
            </div>
            <div className="text-[13.5px] font-semibold truncate">
              {adData.headline}
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 inline-flex items-center h-8 px-3 rounded-md text-[12px] font-semibold text-white"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
            }}
          >
            {adData.cta}
          </button>
        </div>

        {/* Reactions */}
        <div
          className="flex items-center justify-between px-3 py-2 text-[12px]"
          style={{ color: "#65676b", borderTop: "1px solid rgba(0,0,0,0.05)" }}
        >
          <span>👍 ❤️ 1.2K</span>
          <span>184 comments · 38 shares</span>
        </div>

        {/* Actions */}
        <div
          className="px-3 py-1.5 flex items-center justify-around text-[12.5px]"
          style={{ borderTop: "1px solid rgba(0,0,0,0.05)", color: "#65676b" }}
        >
          <span className="flex items-center gap-1">
            <ThumbIcon /> Like
          </span>
          <span className="flex items-center gap-1">
            <CommentIcon size={14} /> Comment
          </span>
          <span className="flex items-center gap-1">
            <PaperPlaneIcon size={14} /> Share
          </span>
        </div>
      </div>

      {/* Fake post below — partial, fades out */}
      <FakeFbPost name="Lina Cole" mins="3h" />
    </div>
  );
}

function FakeFbPost({ name, mins }: { name: string; mins: string }) {
  return (
    <div className="mt-2 px-3 py-3 opacity-60" style={{ background: "white" }}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="size-8 rounded-full bg-gray-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[12.5px] leading-tight">{name}</div>
          <div className="text-[10.5px] mt-0.5" style={{ color: "#65676b" }}>
            {mins} ·{" "}
            <span aria-hidden>🌐</span>
          </div>
        </div>
        <span className="text-[18px] leading-none" style={{ color: "#65676b" }}>
          ⋯
        </span>
      </div>
      <p className="text-[12.5px] leading-snug" style={{ color: "#1c1e21" }}>
        {name === "Sarah Lin"
          ? "Coffee, then nothing else for an hour. Tried it for two weeks. Genuinely changed my mornings."
          : "Looking for a Pilates studio rec on the east side. Bonus if they have 6 a.m. classes."}
      </p>
    </div>
  );
}

/* ============================================================
 * Inline SVG icons (small, used in mini-UIs above)
 * ============================================================ */
function HeartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PaperPlaneIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function CommentIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 12L12 3l9 9M5 10v10h14V10" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function ReelsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 8l6 4-6 4z" fill="currentColor" />
    </svg>
  );
}
function ShopIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16l-2 13H6L4 7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function RetweetIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V10M10 20V4M16 20v-8M22 20v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function ThumbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 22V10M3 14v6a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-1.6L19 11a2 2 0 0 0-2-2.4h-4.6L13 4a2 2 0 0 0-2-2 2 2 0 0 0-2 2L7 9.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CommunityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10h18M8 6V3M16 6V3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9zM9 21a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 7l9 7 9-7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function NetworkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="11" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function PostIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 8l6 4-6 4z" fill="currentColor" />
    </svg>
  );
}
