"use client";

// /studio — blank canvas.
//
// Reset 2026-06-17. The bento direction was the fourth or fifth attempt
// at this surface and the user asked to start over from nothing. This
// page now intentionally renders empty so we can rebuild from a clean
// foundation. The chrome around it stays — sidebar (WRKS Studio wordmark
// + nav with glass-bg active state), top bar (breadcrumb + Upgrade +
// bell + avatar), and the floating Siri orb at bottom-right — because
// those are layout concerns, not page concerns.
//
// Next step: agree on direction with the user before adding anything
// back. Do NOT pre-fill with placeholder content.

export default function StudioBlankPage() {
  return (
    <main
      className="relative size-full"
      style={{ background: "#0a0a0c" }}
    />
  );
}
