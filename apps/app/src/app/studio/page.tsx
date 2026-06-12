"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStudio, type DeliverableKind } from "@/lib/studio-context";
import type { Personality } from "@/lib/personalities";
import type { StoredWowPayload } from "@/lib/studio-context";

// /studio — Phase 1 welcome canvas.
//
// Replaces the previous 3-column "deliverable rail + Mercury canvas + MacBook
// frame" with a clean, composer-led entry point. Layout follows master-plan §E:
//
//   • Dotted grid background tinted #101012, ~22px spacing
//   • Mouse-tracked spotlight (radial brightness following the cursor)
//   • Personalized headline centered: "What's next, {agentName}?"
//   • ONE rounded composer below — dark glass + crystal-light border, ~720px
//   • 3 suggestion pills below the composer
//   • Brand-system mini-card quietly on the LEFT (palette + sample type)
//   • Work strip below pills — 5 small deliverable tiles
//   • One status line at the bottom (mono caps, low opacity)
//
// The personality.accent only shows up in the brand-system mini-card and the
// floating Siri orb (mounted by the layout). The rest of the chrome stays
// neutral per the master-plan rule on chrome vs content.

export default function StudioWelcomePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { personality, agentName, stored, setActiveId } = useStudio();
  const [composing, setComposing] = useState("");
  const bgRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Mouse spotlight — written to CSS variables on the bg element via rAF
  // so React isn't re-rendering on every mouse move.
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--sy", `${e.clientY - rect.top}px`);
      });
    };
    const onLeave = () => {
      el.style.setProperty("--sx", `50%`);
      el.style.setProperty("--sy", `35%`);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    onLeave();
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const onSubmit = () => {
    const text = composing.trim();
    if (!text) return;
    // Phase 1: the composer routes to the library where the existing
    // editor lives. Phase 3 will replace this with /api/site/generate.
    router.push("/studio/library");
  };

  const onPickWork = (kind: DeliverableKind) => {
    setActiveId(kind);
    router.push("/studio/library");
  };

  const greeting = (() => {
    const name = agentName?.trim() || "there";
    if (!stored) return `Let's start, ${name}`;
    return `What's next, ${name}?`;
  })();

  const suggestions = stored
    ? [
        "Refine the landing headline",
        "Draft a fresh Instagram post",
        "Add a pricing section",
      ]
    : [
        "Spin up a landing page for my new product",
        "Draft this week's social calendar",
        "Help me write a launch tweet",
      ];

  return (
    <main className="relative size-full overflow-hidden" style={{ background: "#101012" }}>
      {/* Dotted grid background + spotlight overlay. Both pseudo-layers
          sit under everything; the spotlight reads CSS vars updated by
          the mousemove rAF loop above. */}
      <div
        ref={bgRef}
        aria-hidden
        className="absolute inset-0 wrks-studio-dots pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle 460px at var(--sx, 50%) var(--sy, 35%), rgba(255,255,255,0.055), transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Hairline vignette at the edges so the dots don't read flat. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, transparent, rgba(0,0,0,0.35))",
        }}
      />

      {/* Brand system mini-card — quietly on the left. The personality
          accent is allowed here (master plan §C). */}
      <BrandMiniCard
        personality={personality}
        stored={stored}
        agentName={agentName}
        reduced={!!reduced}
      />

      {/* Centered main column */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-8 z-10">
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 14, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.72, ease: [0.22, 0.72, 0.2, 1] }}
          className="font-serif text-center"
          style={{
            fontSize: "clamp(34px, 4.4vw, 56px)",
            fontWeight: 480,
            letterSpacing: "-0.028em",
            color: "rgba(245,245,247,0.97)",
            lineHeight: 1.04,
            marginBottom: 36,
          }}
        >
          {greeting}
        </motion.h1>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.78, delay: 0.1, ease: [0.22, 0.72, 0.2, 1] }}
          className="w-full max-w-[720px]"
        >
          <Composer
            value={composing}
            onChange={setComposing}
            onSubmit={onSubmit}
            agentName={agentName}
            composerRef={composerRef}
          />
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-5 flex items-center gap-2 flex-wrap justify-center max-w-[720px]"
        >
          {suggestions.map((s, i) => (
            <SuggestionPill
              key={i}
              text={s}
              onPick={() => {
                setComposing(s);
                composerRef.current?.focus();
              }}
            />
          ))}
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ marginTop: 56 }}
        >
          <WorkStrip stored={stored} onPick={onPickWork} />
        </motion.div>
      </div>

      {/* Bottom status line */}
      <StatusLine stored={stored} />
    </main>
  );
}

/* ============================================================
 * Composer — dark glass + crystal-light revolving border.
 * Textarea on top, footer row with hint + send button.
 * ============================================================ */
function Composer({
  value,
  onChange,
  onSubmit,
  agentName,
  composerRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  agentName: string;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const placeholder = `Tell ${agentName?.trim() || "your agent"} what to build or refine…`;
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
  const hasText = value.trim().length > 0;
  return (
    <div
      className="wrks-crystal-border relative"
      style={{
        borderRadius: 20,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 100%)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        boxShadow:
          "0 24px 60px -28px rgba(0,0,0,0.8), 0 2px 6px -2px rgba(0,0,0,0.4)",
      }}
    >
      <div className="relative z-[2] flex flex-col" style={{ padding: "18px 20px 14px" }}>
        <textarea
          ref={composerRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          rows={3}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 outline-none resize-none"
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            color: "rgba(245,245,247,0.96)",
            caretColor: "#f5f0e6",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.005em",
            minHeight: 78,
            maxHeight: 220,
          }}
        />
        <div className="flex items-center justify-between gap-3 pt-2.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            className="uppercase"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.26em",
              color: "rgba(245,245,247,0.32)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            Press <span style={{ color: "rgba(245,245,247,0.5)" }}>↵</span> to send · <span style={{ color: "rgba(245,245,247,0.5)" }}>⇧↵</span> for new line
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!hasText}
            aria-label="Send"
            className="grid place-items-center transition-all duration-200 disabled:cursor-not-allowed"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: hasText
                ? "linear-gradient(180deg, rgba(245,240,230,0.14) 0%, rgba(245,240,230,0.06) 100%)"
                : "rgba(255,255,255,0.025)",
              border: hasText
                ? "1px solid rgba(245,240,230,0.28)"
                : "1px solid rgba(255,255,255,0.06)",
              color: hasText ? "#f5f0e6" : "rgba(245,245,247,0.32)",
              transform: hasText ? "scale(1)" : "scale(0.96)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 19V5M5 12l7-7 7 7"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * SuggestionPill — quiet outline pill, lifts on hover.
 * ============================================================ */
function SuggestionPill({ text, onPick }: { text: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-px"
      style={{
        height: 32,
        padding: "0 13px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        color: "rgba(245,245,247,0.78)",
        fontSize: 12.5,
        letterSpacing: "-0.003em",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <span
        aria-hidden
        style={{ color: "rgba(245,240,230,0.85)", fontSize: 13 }}
      >
        →
      </span>
      {text}
    </button>
  );
}

/* ============================================================
 * BrandMiniCard — quiet 280px panel on the left. The ONE place on this
 * canvas where the user's personality.accent is allowed to surface
 * (master plan §C: brand-system card).
 * ============================================================ */
function BrandMiniCard({
  personality,
  stored,
  agentName,
  reduced,
}: {
  personality: Personality;
  stored: StoredWowPayload | null;
  agentName: string;
  reduced: boolean;
}) {
  const brandName = stored?.deliverables.brandName ?? "Your brand";
  const swatches = [personality.accent, personality.accentDeep, personality.glow];
  return (
    <motion.aside
      initial={reduced ? false : { opacity: 0, x: -16, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 0.72, 0.2, 1] }}
      className="absolute"
      style={{
        top: 28,
        left: 28,
        width: 268,
        padding: "20px 22px 22px",
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.008) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        zIndex: 5,
      }}
    >
      {/* Eyebrow */}
      <div
        className="uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          color: "rgba(245,245,247,0.42)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
          marginBottom: 16,
        }}
      >
        Brand system
      </div>

      {/* Brand mark + name */}
      <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
        <span
          className="shrink-0 grid place-items-center"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: `0 8px 20px -8px ${personality.glow}`,
          }}
        >
          {brandName.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div
            className="truncate font-serif"
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "rgba(245,245,247,0.96)",
              letterSpacing: "-0.012em",
              lineHeight: 1.1,
            }}
          >
            {brandName}
          </div>
          <div
            className="truncate uppercase"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.24em",
              color: "rgba(245,245,247,0.45)",
              fontFamily: "var(--font-mono)",
              marginTop: 3,
            }}
          >
            {agentName?.trim() || "Agent"} · {personality.name}
          </div>
        </div>
      </div>

      {/* Palette swatches */}
      <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
        {swatches.map((c, i) => (
          <span
            key={i}
            aria-hidden
            className="block rounded-full"
            style={{
              width: 18,
              height: 18,
              background: c,
              boxShadow: i === 0 ? `0 0 0 1px rgba(255,255,255,0.18), 0 6px 14px -4px ${personality.glow}` : "0 0 0 1px rgba(255,255,255,0.08)",
            }}
          />
        ))}
        <span
          className="ml-auto uppercase"
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            color: "rgba(245,245,247,0.4)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          Palette
        </span>
      </div>

      {/* Hairline separator */}
      <div
        aria-hidden
        className="h-px"
        style={{ background: "rgba(255,255,255,0.05)", marginBottom: 16 }}
      />

      {/* Sample type — display + body */}
      <div
        className="font-serif"
        style={{
          fontSize: 22,
          fontWeight: 480,
          color: "rgba(245,245,247,0.93)",
          letterSpacing: "-0.022em",
          lineHeight: 1.08,
        }}
      >
        Display Aa
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "rgba(245,245,247,0.6)",
          letterSpacing: "-0.003em",
          marginTop: 4,
          lineHeight: 1.45,
        }}
      >
        The quick brown fox jumps over.
      </div>
    </motion.aside>
  );
}

/* ============================================================
 * WorkStrip — 5 small tiles. Click → open that deliverable in the
 * library editor.
 * ============================================================ */
type WorkItem = {
  id: DeliverableKind;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
};

const WORK_ITEMS: WorkItem[] = [
  { id: "landing", label: "Landing", Icon: BrowserIcon },
  { id: "instagram", label: "Instagram", Icon: CameraIcon },
  { id: "twitter", label: "X post", Icon: XGlyphIcon },
  { id: "linkedin", label: "LinkedIn", Icon: WorkIcon },
  { id: "ad", label: "Meta ad", Icon: CampaignIcon },
];

function WorkStrip({
  stored,
  onPick,
}: {
  stored: StoredWowPayload | null;
  onPick: (k: DeliverableKind) => void;
}) {
  const empty = !stored;
  return (
    <div className="flex flex-col items-center" style={{ gap: 12 }}>
      <div
        className="uppercase"
        style={{
          fontSize: 9.5,
          letterSpacing: "0.32em",
          color: "rgba(245,245,247,0.35)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        {empty ? "Nothing in your work yet" : "Your work"}
      </div>
      <div className="flex items-stretch gap-3">
        {WORK_ITEMS.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onPick(it.id)}
            disabled={empty}
            className="group relative flex flex-col items-center justify-center gap-1.5 transition-all duration-200 enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              width: 124,
              height: 84,
              borderRadius: 14,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "rgba(245,245,247,0.78)",
            }}
          >
            <span
              className="transition-colors"
              style={{ color: "rgba(245,245,247,0.55)" }}
            >
              <it.Icon size={18} />
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "-0.003em",
              }}
            >
              {it.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * StatusLine — bottom-left mono caps.
 * ============================================================ */
function StatusLine({ stored }: { stored: StoredWowPayload | null }) {
  const status = stored
    ? `Draft · ${stored.deliverables.brandName} · not published yet`
    : "Ready · tell your agent what to build";
  return (
    <div
      className="absolute flex items-center gap-3 pointer-events-none"
      style={{ bottom: 24, left: 32, zIndex: 5 }}
    >
      <span
        aria-hidden
        className="block"
        style={{
          width: 22,
          height: 1,
          background: "rgba(245,245,247,0.18)",
        }}
      />
      <span
        className="uppercase"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.28em",
          color: "rgba(245,245,247,0.4)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        {status}
      </span>
    </div>
  );
}

/* ============================================================
 * Icons (stroke only, 1.7 weight)
 * ============================================================ */
function BrowserIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="6" cy="6.5" r="0.7" fill="currentColor" />
      <circle cx="8.5" cy="6.5" r="0.7" fill="currentColor" />
    </svg>
  );
}
function CameraIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 7l1.5-2.5h5L16 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function XGlyphIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.97 6.817H1.68l7.73-8.835L1.25 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function WorkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 13h18" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function CampaignIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h3l8 4V5l-8 4H4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M18 8a4 4 0 0 1 0 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
