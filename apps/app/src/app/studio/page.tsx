"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useStudio, type DeliverableKind } from "@/lib/studio-context";

// /studio — practical professional dashboard.
//
// User directive 2026-06-15: "We are making a professional app, think as a
// user what should they see on this page." After four iterations on the
// decorative/editorial direction (centered orb, brand cover, multi-card
// constellation), pivot to a real dashboard. Reference: Linear's home,
// Mercury's account overview, Vercel's dashboard, Notion's daily view.
//
// What the user actually needs on /studio:
//   1. A quick status read (what's drafted / published / pending)
//   2. Their work, one click to open each piece
//   3. Recent agent activity, scannable timeline
//   4. The floating orb for voice (always)
//
// No aurora. No grain. No decorative cards. Flat dark canvas, hairline
// structure, typography hierarchy. The agent presence is the
// bottom-right floating Siri orb (rendered by StudioInspectorFrame).

type ActivityItem = {
  role: "agent" | "user";
  text: string;
  time: string;
};

const DELIVERABLE_META: {
  id: DeliverableKind;
  label: string;
  dims: string;
  Icon: (p: { size?: number }) => React.ReactElement;
}[] = [
  { id: "landing", label: "Landing page", dims: "1440 × 900", Icon: BrowserIcon },
  { id: "instagram", label: "Instagram post", dims: "1080 × 1080", Icon: CameraIcon },
  { id: "twitter", label: "X post", dims: "280 chars", Icon: XGlyphIcon },
  { id: "linkedin", label: "LinkedIn update", dims: "700 chars", Icon: WorkIcon },
  { id: "ad", label: "Meta ad", dims: "1200 × 628", Icon: CampaignIcon },
];

export default function StudioWelcomePage() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const { personality, agentName, stored, setActiveId } = useStudio();

  const brandName = stored?.deliverables.brandName ?? "Your brand";
  const agent = agentName?.trim() || personality.name;

  const headline = stored
    ? "Your edition is drafted."
    : "Let's draft your first edition.";

  const status = stored
    ? `5 deliverables · ${personality.name} stands ready · not published yet`
    : `${personality.name} stands ready · just say what you want to build`;

  const activity: ActivityItem[] = stored
    ? [
        {
          role: "agent",
          text: `${agent} refined the landing headline.`,
          time: "2 hours ago",
        },
        {
          role: "agent",
          text: `${agent} drafted an Instagram caption for ${brandName}.`,
          time: "Yesterday",
        },
        {
          role: "user",
          text: "You asked to add a pricing section.",
          time: "Yesterday",
        },
        {
          role: "agent",
          text: `${agent} set up the brand voice for ${brandName}.`,
          time: "2 days ago",
        },
      ]
    : [];

  const onPickWork = (id: DeliverableKind) => {
    setActiveId(id);
    router.push("/studio/library");
  };

  return (
    <main
      className="relative size-full overflow-auto"
      style={{ background: "#0a0a0c" }}
    >
      {/* Very subtle accent halo top-right — the only ambient bg flourish.
          Restrained: a single 12% accent glow that fades out fast so the
          page reads as flat, professional, content-first. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 90% 0%, ${personality.accent}1a, transparent 65%)`,
        }}
      />

      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: 1180,
          padding: "44px 56px 96px",
        }}
      >
        {/* HEADER — eyebrow + headline + meta */}
        <motion.header
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 0.72, 0.2, 1] }}
        >
          <EyebrowRule>{brandName} · Studio</EyebrowRule>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(32px, 3.4vw, 44px)",
              fontWeight: 480,
              letterSpacing: "-0.024em",
              lineHeight: 1.1,
              color: "rgba(245,245,247,0.97)",
              marginTop: 20,
            }}
          >
            {headline}
          </h1>
          <p
            className="uppercase"
            style={{
              fontSize: 11.5,
              letterSpacing: "0.18em",
              color: "rgba(245,245,247,0.5)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              marginTop: 14,
            }}
          >
            {status}
          </p>
        </motion.header>

        {/* YOUR WORK — 5-card grid of deliverables */}
        <motion.section
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 0.72, 0.2, 1] }}
          style={{ marginTop: 56 }}
        >
          <EyebrowRule>Your work</EyebrowRule>
          <div
            className="grid mt-5"
            style={{
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {DELIVERABLE_META.map((d, i) => (
              <WorkCard
                key={d.id}
                index={i}
                label={d.label}
                dims={d.dims}
                Icon={d.Icon}
                hasDraft={!!stored}
                onPick={() => onPickWork(d.id)}
                reduced={!!reduced}
              />
            ))}
          </div>
        </motion.section>

        {/* RECENT ACTIVITY — scannable timeline */}
        <motion.section
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 0.72, 0.2, 1] }}
          style={{ marginTop: 56 }}
        >
          <EyebrowRule>Recent activity</EyebrowRule>
          {activity.length === 0 ? (
            <EmptyActivity agentName={agent} />
          ) : (
            <ul className="flex flex-col mt-3">
              {activity.map((item, i) => (
                <ActivityRow
                  key={i}
                  item={item}
                  isLast={i === activity.length - 1}
                />
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* Bottom-left status line */}
      <StatusLine
        status={
          stored
            ? `Edition one · draft · not published yet`
            : `Ready · just say what you want to build`
        }
      />
    </main>
  );
}

/* ============================================================
 * Atoms
 * ============================================================ */

function EyebrowRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="block"
        style={{
          width: 22,
          height: 1,
          background: "rgba(245,245,247,0.2)",
        }}
      />
      <span
        className="uppercase"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.32em",
          color: "rgba(245,245,247,0.48)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function WorkCard({
  label,
  dims,
  Icon,
  hasDraft,
  onPick,
  index,
  reduced,
}: {
  label: string;
  dims: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  hasDraft: boolean;
  onPick: () => void;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: 0.18 + index * 0.04,
        ease: [0.22, 0.72, 0.2, 1],
      }}
      className="wrks-crystal-border group relative block text-left transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        height: 156,
        padding: "18px 18px 18px",
        borderRadius: 14,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.008) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="relative z-[2] h-full flex flex-col">
        <div className="flex items-start justify-between">
          <span
            className="grid place-items-center"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(245,245,247,0.78)",
            }}
          >
            <Icon size={15} />
          </span>
          <span
            aria-hidden
            className="block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: hasDraft
                ? "rgba(245,240,230,0.82)"
                : "rgba(245,245,247,0.22)",
              boxShadow: hasDraft
                ? "0 0 8px rgba(245,240,230,0.45)"
                : "none",
            }}
            title={hasDraft ? "Draft" : "Not started"}
          />
        </div>
        <div className="mt-auto">
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(245,245,247,0.95)",
              letterSpacing: "-0.005em",
              lineHeight: 1.2,
            }}
          >
            {label}
          </div>
          <div
            className="uppercase"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.18em",
              color: "rgba(245,245,247,0.42)",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              marginTop: 4,
            }}
          >
            {hasDraft ? "Draft" : "Not started"} · {dims}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function ActivityRow({
  item,
  isLast,
}: {
  item: ActivityItem;
  isLast: boolean;
}) {
  const isAgent = item.role === "agent";
  return (
    <li
      className="flex items-center justify-between"
      style={{
        padding: "16px 4px",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <span
          aria-hidden
          className="block rounded-full shrink-0"
          style={{
            width: 5,
            height: 5,
            background: isAgent
              ? "rgba(245,240,230,0.78)"
              : "rgba(245,245,247,0.4)",
            boxShadow: isAgent
              ? "0 0 6px rgba(245,240,230,0.45)"
              : "none",
          }}
        />
        <span
          className="truncate"
          style={{
            fontSize: 14,
            color: "rgba(245,245,247,0.88)",
            letterSpacing: "-0.005em",
          }}
        >
          {item.text}
        </span>
      </div>
      <span
        className="shrink-0 uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          color: "rgba(245,245,247,0.42)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
          marginLeft: 24,
        }}
      >
        {item.time}
      </span>
    </li>
  );
}

function EmptyActivity({ agentName }: { agentName: string }) {
  return (
    <div
      className="font-serif italic"
      style={{
        fontSize: 16,
        color: "rgba(245,245,247,0.55)",
        marginTop: 18,
        letterSpacing: "-0.005em",
        lineHeight: 1.5,
      }}
    >
      Nothing here yet — tell {agentName} what to build and the log will
      fill in.
    </div>
  );
}

function StatusLine({ status }: { status: string }) {
  return (
    <div
      className="absolute flex items-center gap-3 pointer-events-none"
      style={{ bottom: 26, left: 32, zIndex: 5 }}
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
 * Icons — stroke only, consistent 1.6-1.7 weight
 * ============================================================ */
function BrowserIcon({ size = 16 }: { size?: number }) {
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
function CameraIcon({ size = 16 }: { size?: number }) {
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
function XGlyphIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.97 6.817H1.68l7.73-8.835L1.25 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function WorkIcon({ size = 16 }: { size?: number }) {
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
function CampaignIcon({ size = 16 }: { size?: number }) {
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
