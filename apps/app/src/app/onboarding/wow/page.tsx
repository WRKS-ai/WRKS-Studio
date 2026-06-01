"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { type WowCategory } from "@/lib/wow-photos";
import { VOICES, type VoiceId } from "@/lib/voices";

// /onboarding/wow — the brief's "first wow" moment (Section 3.1):
// real first-session deliverables produced from what the user just said.
//
// Flow: hydrate prior steps from localStorage → POST /api/wow → render
// the 3 deliverables in staging-style preview frames.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const INTAKE_KEY = "wrks-onboarding-intake";

type WowDeliverables = {
  brandName: string;
  category: WowCategory;
  heroImageQuery: string;
  instagramImageQuery: string;
  adImageQuery: string;
  landing: {
    headline: string;
    subhead: string;
    primaryCta: string;
    valueBullets: string[];
  };
  social: {
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  ad: {
    headline: string;
    body: string;
    cta: string;
  };
};

type WowImages = {
  heroLandscape: string;
  featured: string[];
  instagramSquare: string;
  adHero: string;
};

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; deliverables: WowDeliverables; images: WowImages };

const LOADING_LINES: Record<PersonalityId, string> = {
  maven: "Drafting.",
  sage: "Drafting your first three. Won't be long.",
  spark: "Cooking up your first batch!",
  echo: "Drafting — give me a sec.",
};

const ERROR_LINES: Record<PersonalityId, string> = {
  maven: "Generation failed.",
  sage: "Something didn't land. Let me try that again.",
  spark: "Oof — that didn't work!",
  echo: "Hmm, that didn't go through.",
};

const READY_HEADING = ["Here's", "what", "I", "made", "for", "you."];

export default function WowPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  const [agentName, setAgentName] = useState<string>("");
  const [intake, setIntake] = useState<{
    business: string;
    audience: string;
    differentiator: string;
  } | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  // Hydrate prior steps — bounce back if anything's missing
  useEffect(() => {
    const p = localStorage.getItem(PERSONALITY_KEY) as PersonalityId | null;
    if (!p || !PERSONALITIES.some((x) => x.id === p)) {
      router.replace("/onboarding/personality");
      return;
    }
    const n = localStorage.getItem(NAME_KEY);
    if (!n) {
      router.replace("/onboarding/name");
      return;
    }
    const v = localStorage.getItem(VOICE_KEY) as VoiceId | null;
    if (!v || !VOICES.some((x) => x.id === v)) {
      router.replace("/onboarding/voice");
      return;
    }
    const i = localStorage.getItem(INTAKE_KEY);
    if (!i) {
      router.replace("/onboarding/intake");
      return;
    }
    try {
      const parsed = JSON.parse(i);
      if (
        typeof parsed.business !== "string" ||
        typeof parsed.audience !== "string" ||
        typeof parsed.differentiator !== "string" ||
        !parsed.business.trim() ||
        !parsed.audience.trim() ||
        !parsed.differentiator.trim()
      ) {
        router.replace("/onboarding/intake");
        return;
      }
      setPersonalityId(p);
      setAgentName(n);
      setIntake({
        business: parsed.business,
        audience: parsed.audience,
        differentiator: parsed.differentiator,
      });
    } catch {
      router.replace("/onboarding/intake");
    }
  }, [router]);

  // Fire the wow API once hydrated. Re-fire on retry.
  useEffect(() => {
    if (!personalityId || !agentName || !intake) return;

    let cancelled = false;
    setState({ kind: "loading" });

    fetch("/api/wow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalityId,
        agentName,
        business: intake.business,
        audience: intake.audience,
        differentiator: intake.differentiator,
      }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setState({
            kind: "error",
            message: data.error ?? "Generation failed.",
          });
          return;
        }
        const data = (await res.json()) as {
          deliverables: WowDeliverables;
          images: WowImages;
        };
        setState({
          kind: "ready",
          deliverables: data.deliverables,
          images: data.images,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Network error.";
        setState({ kind: "error", message: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [personalityId, agentName, intake, attempt]);

  if (!personalityId || !intake) return null;
  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;

  return (
    <OnboardingShell tint={personality.glow}>
      <div className="w-full max-w-[1080px] flex flex-col items-center text-center">
        {/* Subtle "post-act" label */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="text-[10px] tracking-[0.28em] uppercase text-ink-dim font-mono mb-6 sm:mb-8"
        >
          Your studio · First deliverables
        </motion.div>

        <AnimatePresence mode="wait">
          {state.kind === "loading" && (
            <LoadingState
              key="loading"
              personality={personality}
              agentName={agentName}
              line={LOADING_LINES[personality.id]}
              reduced={!!reduced}
            />
          )}

          {state.kind === "error" && (
            <ErrorState
              key="error"
              personality={personality}
              agentName={agentName}
              line={ERROR_LINES[personality.id]}
              detail={state.message}
              onRetry={() => setAttempt((a) => a + 1)}
              reduced={!!reduced}
            />
          )}

          {state.kind === "ready" && (
            <ReadyState
              key="ready"
              personality={personality}
              agentName={agentName}
              deliverables={state.deliverables}
              images={state.images}
              onContinue={() => router.push("/onboarding/connect")}
              onRegenerate={() => setAttempt((a) => a + 1)}
              reduced={!!reduced}
            />
          )}
        </AnimatePresence>
      </div>
    </OnboardingShell>
  );
}

/* ============================================================
 * LOADING — agent orb pulses while the API drafts the deliverables
 * ============================================================ */
function LoadingState({
  personality,
  agentName,
  line,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  line: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center pt-16 sm:pt-24"
    >
      <PersonalityIcon personality={personality} size="lg" />
      <div className="mt-6 font-serif italic text-[14px] text-ink-muted">
        {agentName} <span className="text-ink-dim">·</span> {personality.name}
      </div>

      <motion.p
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        className="mt-12 font-serif italic text-[clamp(1.25rem,2vw,1.5rem)] text-ink leading-snug max-w-xl"
      >
        {line}
      </motion.p>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-6 flex items-center justify-center gap-2"
        aria-live="polite"
        aria-label={`${agentName} is drafting`}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full"
            style={{ background: personality.accent }}
            animate={
              reduced
                ? { opacity: 0.6 }
                : { opacity: [0.3, 1, 0.3], y: [0, -4, 0] }
            }
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="mt-12 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono max-w-sm leading-relaxed"
      >
        Building from what you told me. A landing page, three social posts, and one paid ad — drafted in your business&rsquo;s voice.
      </motion.p>
    </motion.div>
  );
}

/* ============================================================
 * ERROR — on-character message + retry
 * ============================================================ */
function ErrorState({
  personality,
  agentName,
  line,
  detail,
  onRetry,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  line: string;
  detail: string;
  onRetry: () => void;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center pt-12 sm:pt-20"
    >
      <PersonalityIcon personality={personality} size="md" />
      <div className="mt-4 font-serif italic text-[14px] text-ink-muted">
        {agentName} <span className="text-ink-dim">·</span> {personality.name}
      </div>

      <p className="mt-10 font-serif italic text-[clamp(1.25rem,2vw,1.5rem)] text-ink leading-snug max-w-xl">
        {line}
      </p>
      <p className="mt-3 text-[12px] font-mono tracking-tight text-ink-dim max-w-md leading-relaxed">
        {detail}
      </p>

      <motion.button
        type="button"
        onClick={onRetry}
        whileHover={reduced ? undefined : { y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="mt-8 inline-flex items-center gap-2.5 h-11 px-6 rounded-full font-serif text-[15px] text-ink transition-all outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${personality.accent}`,
          boxShadow: `0 0 28px -8px ${personality.glow}`,
        }}
      >
        <span>Try again</span>
        <span aria-hidden>↻</span>
      </motion.button>
    </motion.div>
  );
}

/* ============================================================
 * READY — three deliverables in staging-style preview frames
 * ============================================================ */
type DeliverableTab = "website" | "social" | "advertising";

const TABS: { id: DeliverableTab; label: string; mono: string }[] = [
  { id: "website", label: "Website", mono: "01" },
  { id: "social", label: "Social posts", mono: "02" },
  { id: "advertising", label: "Advertising", mono: "03" },
];

function ReadyState({
  personality,
  agentName,
  deliverables,
  images,
  onContinue,
  onRegenerate,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  deliverables: WowDeliverables;
  images: WowImages;
  onContinue: () => void;
  onRegenerate: () => void;
  reduced: boolean;
}) {
  const brandName = deliverables.brandName;
  const pix = images;
  const [tab, setTab] = useState<DeliverableTab>("website");

  // Arrow-key navigation between tabs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = TABS.findIndex((t) => t.id === tab);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setTab(TABS[(idx + 1) % TABS.length]!.id);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setTab(TABS[(idx - 1 + TABS.length) % TABS.length]!.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab]);

  const tabIdx = TABS.findIndex((t) => t.id === tab);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full flex flex-col items-center"
    >
      {/* ============== HEADER ============== */}
      <PersonalityIcon personality={personality} size="sm" />
      <div className="mt-3 font-serif italic text-[14px] text-ink-muted">
        {agentName} <span className="text-ink-dim">·</span> {personality.name}
      </div>

      <h1 className="mt-10 font-serif font-medium tracking-tight text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[0.98] text-ink text-center">
        {READY_HEADING.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: 0.1 + i * 0.06,
              duration: 0.75,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="inline-block mr-[0.25em]"
          >
            {word}
          </motion.span>
        ))}
      </h1>

      <motion.p
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.7, ease: "easeOut" }}
        className="mt-5 max-w-xl text-[15px] sm:text-base text-ink-muted leading-relaxed font-serif italic text-center"
      >
        Drafting as{" "}
        <span className="text-ink not-italic font-medium">{brandName}</span>.
        Three pieces, one campaign — switch between them below.
      </motion.p>

      {/* Regenerate */}
      <motion.button
        type="button"
        onClick={onRegenerate}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.95, duration: 0.5 }}
        whileHover={reduced ? undefined : { y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="mt-5 inline-flex items-center gap-2 px-4 h-9 rounded-full text-[12px] tracking-[0.18em] uppercase font-mono text-ink-muted hover:text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span>Regenerate</span>
        <span aria-hidden style={{ color: personality.accent }}>
          ↻
        </span>
      </motion.button>

      {/* ============== TAB NAVIGATION ============== */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
        className="mt-14 sm:mt-16 w-full max-w-[820px]"
      >
        <div
          className="flex items-end justify-center gap-0 sm:gap-2 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="group relative flex items-baseline gap-3 px-4 sm:px-6 pb-4 sm:pb-5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-t-md"
                style={{ color: isActive ? "rgb(245 245 245)" : "rgba(245,245,245,0.45)" }}
              >
                <span
                  className="text-[10px] tracking-[0.28em] uppercase font-mono"
                  style={{
                    color: isActive ? personality.accent : "rgba(245,245,245,0.35)",
                  }}
                >
                  {t.mono}
                </span>
                <span className="font-serif text-[clamp(0.9375rem,1.2vw,1.0625rem)] tracking-tight">
                  {t.label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute -bottom-px left-0 right-0 h-[2px]"
                    style={{ background: personality.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div
          className="mt-3 flex items-center justify-between text-[10px] tracking-[0.22em] uppercase font-mono"
          style={{ color: "rgba(245,245,245,0.35)" }}
        >
          <span>
            {String(tabIdx + 1).padStart(2, "0")} of{" "}
            {String(TABS.length).padStart(2, "0")}
          </span>
          <span aria-hidden>← → to navigate</span>
        </div>
      </motion.div>

      {/* ============== ACTIVE DELIVERABLE ============== */}
      <div className="mt-10 sm:mt-12 w-full">
        <AnimatePresence mode="wait">
          {tab === "website" && (
            <motion.div
              key="website"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <LandingPreview
                personality={personality}
                brandName={brandName}
                data={deliverables.landing}
                heroImage={pix.heroLandscape}
                featuredImages={pix.featured}
              />
            </motion.div>
          )}

          {tab === "social" && (
            <motion.div
              key="social"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start"
            >
              <InstagramPreview
                personality={personality}
                brandName={brandName}
                caption={deliverables.social.instagram}
                image={pix.instagramSquare}
              />
              <div className="flex flex-col gap-4 sm:gap-5">
                <TwitterPreview
                  personality={personality}
                  brandName={brandName}
                  text={deliverables.social.twitter}
                />
                <LinkedInPreview
                  personality={personality}
                  agentName={agentName}
                  brandName={brandName}
                  text={deliverables.social.linkedin}
                />
              </div>
            </motion.div>
          )}

          {tab === "advertising" && (
            <motion.div
              key="advertising"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <AdPreview
                personality={personality}
                brandName={brandName}
                data={deliverables.ad}
                image={pix.adHero}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============== PREV / NEXT ============== */}
      <div className="mt-10 sm:mt-12 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() =>
            setTab(TABS[(tabIdx - 1 + TABS.length) % TABS.length]!.id)
          }
          className="group inline-flex items-center gap-2.5 px-3 py-2 text-[12px] tracking-[0.22em] uppercase font-mono text-ink-dim hover:text-ink-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md"
        >
          <span aria-hidden>←</span>
          <span>Previous</span>
        </button>
        <span
          className="text-[10px] tracking-[0.22em] uppercase font-mono"
          style={{ color: "rgba(245,245,245,0.25)" }}
        >
          {TABS[tabIdx]!.label}
        </span>
        <button
          type="button"
          onClick={() => setTab(TABS[(tabIdx + 1) % TABS.length]!.id)}
          className="group inline-flex items-center gap-2.5 px-3 py-2 text-[12px] tracking-[0.22em] uppercase font-mono text-ink-dim hover:text-ink-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md"
        >
          <span>Next</span>
          <span aria-hidden>→</span>
        </button>
      </div>

      {/* ============== CONTINUE ============== */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.7 }}
        className="mt-14 sm:mt-16 h-12 flex items-center justify-center"
      >
        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={reduced ? undefined : { x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="group inline-flex items-center gap-3 font-serif text-[clamp(1.125rem,1.6vw,1.375rem)] text-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-md px-2 py-1"
        >
          <span>
            Connect your accounts{" "}
            <span style={{ color: personality.accent }}>to publish</span>
          </span>
          <motion.span
            aria-hidden
            animate={reduced ? undefined : { x: [0, 3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            →
          </motion.span>
        </motion.button>
      </motion.div>

      <p className="mt-3 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
        Nothing is published yet — these are drafts only
      </p>
    </motion.div>
  );
}

/* ============================================================
 * PREVIEW FRAMES
 * ============================================================ */

// Light-mode tokens — real platforms (Instagram, X, LinkedIn, Meta ads,
// most landing pages) are predominantly white/light. Dark previews
// read as gloomy mockups, not real product output.
const LIGHT_BG = "#f7f2e8";          // warm cream (editorial paper tone)
const LIGHT_BG_WHITE = "#ffffff";    // pure white for the social platforms
const LIGHT_BG_DEEP = "#efe9dc";     // slightly darker room tone for chapter shifts
const LIGHT_BG_HIGH = "#fbf7ee";     // slightly lighter room tone
const LIGHT_INK = "#0e0c08";         // near-black, warm
const LIGHT_INK_MUTED = "#4a443c";   // body / secondary text
const LIGHT_INK_DIM = "#827a6e";     // meta text
const LIGHT_BORDER = "rgba(14,12,8,0.10)";
const LIGHT_BORDER_SOFT = "rgba(14,12,8,0.06)";

// Inline SVG noise for the "film grain" overlay — single biggest
// per-byte upgrade for editorial feel per the design research.
const NOISE_SVG =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIi8+PC9zdmc+";

function LandingPreview({
  personality,
  brandName,
  data,
  heroImage,
  featuredImages,
}: {
  personality: Personality;
  brandName: string;
  data: WowDeliverables["landing"];
  heroImage: string;
  featuredImages: string[];
}) {
  // Pexels portraits will always look generic for arbitrary businesses,
  // so per the design research we're using them as one supporting hero
  // (mid-scroll, duotone-washed) and *replacing* the featured photo
  // grid with typographic principle cards — Stripe Press style.
  void featuredImages;

  const slug =
    brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbusiness";

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: LIGHT_BG,
        boxShadow: `0 80px 160px -60px ${personality.glow}, 0 50px 100px -40px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Page-wide noise grain — single biggest editorial signal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.07]"
        style={{
          backgroundImage: `url(${NOISE_SVG})`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
          mixBlendMode: "multiply",
        }}
      />

      {/* macOS browser chrome */}
      <div
        className="relative flex items-center gap-3 px-4 py-3"
        style={{ background: "#2a2a2c", borderBottom: "1px solid #18181a" }}
      >
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-500/90" />
          <span className="size-2.5 rounded-full bg-yellow-500/90" />
          <span className="size-2.5 rounded-full bg-green-500/90" />
        </div>
        <div
          className="flex-1 max-w-md mx-auto rounded-md px-3 py-1 text-[11px] font-mono text-center"
          style={{ background: "#3a3a3c", color: "#a0a0a8" }}
        >
          🔒 {slug}.com
        </div>
        <div className="w-12" aria-hidden />
      </div>

      {/* Hairline-only nav — minimal, refined */}
      <header
        className="relative flex items-center justify-between px-6 sm:px-14 py-5"
        style={{ borderBottom: `1px solid ${LIGHT_BORDER}` }}
      >
        <span
          className="font-serif tracking-tight"
          style={{
            color: LIGHT_INK,
            fontSize: "clamp(1rem,1.2vw,1.125rem)",
            letterSpacing: "-0.02em",
          }}
        >
          {brandName}
          <span
            aria-hidden
            className="inline-block ml-1.5 size-1.5 rounded-full align-middle"
            style={{ background: personality.accent }}
          />
        </span>
        <nav
          className="hidden sm:flex items-center gap-9"
          style={{
            color: LIGHT_INK_MUTED,
            fontSize: "11px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span>Index</span>
          <span>Studio</span>
          <span>Contact</span>
        </nav>
        <span
          className="font-mono uppercase tracking-[0.22em]"
          style={{ color: LIGHT_INK_DIM, fontSize: "11px" }}
        >
          Vol. 01
        </span>
      </header>

      {/* ============== HERO — TYPE-LED, NO ABOVE-FOLD PHOTO ============== */}
      <section
        className="relative px-6 sm:px-14 pt-20 sm:pt-32 pb-20 sm:pb-28 text-left"
        style={{ background: LIGHT_BG_HIGH }}
      >
        {/* Tiny mono label */}
        <div
          className="font-mono uppercase mb-12 sm:mb-16 flex items-center gap-3"
          style={{
            color: LIGHT_INK_DIM,
            fontSize: "11px",
            letterSpacing: "0.32em",
          }}
        >
          <span
            className="inline-block h-px w-8"
            style={{ background: personality.accent }}
            aria-hidden
          />
          <span>01 — Now showing</span>
        </div>

        {/* The headline IS the hero. Massive. Serif. Single brand-tone. */}
        <h1
          className="font-serif font-medium max-w-[16ch]"
          style={{
            color: LIGHT_INK,
            fontSize: "clamp(2.75rem, 7.5vw, 6rem)",
            lineHeight: 0.94,
            letterSpacing: "-0.025em",
          }}
        >
          {data.headline}
        </h1>

        {/* Subhead — italic serif, restrained scale */}
        <p
          className="mt-10 sm:mt-12 font-serif italic max-w-[42ch]"
          style={{
            color: LIGHT_INK_MUTED,
            fontSize: "clamp(1.125rem, 1.5vw, 1.375rem)",
            lineHeight: 1.45,
          }}
        >
          {data.subhead}
        </p>

        {/* CTA is a text link with arrow, not a button. Aesop move. */}
        <div className="mt-12 sm:mt-14 flex items-center gap-12">
          <button
            type="button"
            className="group inline-flex items-center gap-3 font-serif transition-all"
            style={{
              color: LIGHT_INK,
              fontSize: "clamp(0.9375rem, 1.1vw, 1.0625rem)",
              borderBottom: `1px solid ${LIGHT_INK}`,
              paddingBottom: "4px",
            }}
          >
            <span>{data.primaryCta}</span>
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-1"
              style={{ color: personality.accent }}
            >
              →
            </span>
          </button>
          <span
            className="font-mono uppercase"
            style={{
              color: LIGHT_INK_DIM,
              fontSize: "11px",
              letterSpacing: "0.22em",
            }}
          >
            Limited series
          </span>
        </div>
      </section>

      <Hairline accent={personality.accent} />

      {/* ============== HERO PHOTO — DUOTONE WASH, MID-SCROLL ============== */}
      <section
        className="relative px-6 sm:px-14 py-14 sm:py-20"
        style={{ background: LIGHT_BG }}
      >
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div
            className="font-mono uppercase"
            style={{
              color: LIGHT_INK_DIM,
              fontSize: "11px",
              letterSpacing: "0.32em",
            }}
          >
            Plate 01 — The opening still
          </div>
          <div
            className="font-mono uppercase"
            style={{
              color: LIGHT_INK_DIM,
              fontSize: "11px",
              letterSpacing: "0.22em",
            }}
          >
            {brandName}
          </div>
        </div>
        <DuotonePhoto
          src={heroImage}
          alt={`${brandName} editorial still`}
          accent={personality.accent}
          accentDeep={personality.accentDeep}
          aspectRatio="16 / 9"
        />
      </section>

      <Hairline accent={personality.accent} />

      {/* ============== THREE PRINCIPLES — TYPOGRAPHIC, NOT PHOTOS ============== */}
      <section
        className="relative grid grid-cols-1 md:grid-cols-3"
        style={{ background: LIGHT_BG_DEEP }}
      >
        {data.valueBullets.slice(0, 3).map((bullet, i) => (
          <div
            key={i}
            className="relative px-6 sm:px-10 py-14 sm:py-20"
            style={{
              background:
                i === 0 ? LIGHT_BG_HIGH : i === 1 ? LIGHT_BG : LIGHT_BG_DEEP,
              borderRight:
                i < 2 ? `1px solid ${LIGHT_BORDER}` : undefined,
            }}
          >
            <div
              className="font-mono uppercase mb-10"
              style={{
                color: personality.accent,
                fontSize: "11px",
                letterSpacing: "0.32em",
              }}
            >
              0{i + 1} — Principle
            </div>
            <p
              className="font-serif"
              style={{
                color: LIGHT_INK,
                fontSize: "clamp(1.125rem, 1.5vw, 1.375rem)",
                lineHeight: 1.35,
                letterSpacing: "-0.005em",
              }}
            >
              <span
                aria-hidden
                className="font-serif italic mr-1 align-top"
                style={{
                  color: personality.accent,
                  fontSize: "1.5em",
                  lineHeight: 0,
                }}
              >
                &ldquo;
              </span>
              {bullet}
            </p>
          </div>
        ))}
      </section>

      <Hairline accent={personality.accent} />

      {/* ============== MANIFESTO — ONE BIG TYPOGRAPHIC STATEMENT ============== */}
      <section
        className="relative px-6 sm:px-14 py-20 sm:py-28"
        style={{ background: LIGHT_BG_HIGH }}
      >
        <div
          className="font-mono uppercase mb-10"
          style={{
            color: LIGHT_INK_DIM,
            fontSize: "11px",
            letterSpacing: "0.32em",
          }}
        >
          Manifesto · No. 1
        </div>
        <p
          className="font-serif italic max-w-[28ch]"
          style={{
            color: LIGHT_INK,
            fontSize: "clamp(1.875rem, 4vw, 3rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
          }}
        >
          {data.subhead}
        </p>
        <div
          className="mt-10 font-mono uppercase flex items-center gap-3"
          style={{
            color: LIGHT_INK_DIM,
            fontSize: "11px",
            letterSpacing: "0.32em",
          }}
        >
          <span
            className="inline-block h-px w-8"
            style={{ background: personality.accent }}
            aria-hidden
          />
          <span>Signed — {brandName}</span>
        </div>
      </section>

      <Hairline accent={personality.accent} />

      {/* ============== NEWSLETTER — RESTRAINED, NOT CARD-LIKE ============== */}
      <section
        className="relative px-6 sm:px-14 py-20 sm:py-28"
        style={{ background: LIGHT_BG_DEEP }}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 sm:gap-16 items-end">
          <div>
            <div
              className="font-mono uppercase mb-8"
              style={{
                color: LIGHT_INK_DIM,
                fontSize: "11px",
                letterSpacing: "0.32em",
              }}
            >
              Correspondence
            </div>
            <h3
              className="font-serif font-medium"
              style={{
                color: LIGHT_INK,
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
                lineHeight: 0.96,
                letterSpacing: "-0.02em",
              }}
            >
              Quietly delivered.
              <br />
              <span style={{ color: personality.accent }} className="italic">
                When something arrives.
              </span>
            </h3>
          </div>
          <div>
            <p
              className="font-serif italic mb-8 max-w-[34ch]"
              style={{
                color: LIGHT_INK_MUTED,
                fontSize: "1rem",
                lineHeight: 1.5,
              }}
            >
              No noise. No abandoned-cart sequences. Just the work, when it&rsquo;s ready.
            </p>
            <div
              className="flex items-center gap-3 pb-3"
              style={{ borderBottom: `1px solid ${LIGHT_INK}` }}
            >
              <input
                type="email"
                placeholder="your@email"
                disabled
                className="flex-1 bg-transparent border-0 outline-none font-serif"
                style={{
                  color: LIGHT_INK,
                  fontSize: "1rem",
                }}
              />
              <button
                type="button"
                className="group inline-flex items-center gap-2 font-mono uppercase"
                style={{
                  color: LIGHT_INK,
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                }}
              >
                <span>Subscribe</span>
                <span
                  aria-hidden
                  style={{ color: personality.accent }}
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FOOTER — DEEP, EDITORIAL ============== */}
      <footer
        className="relative px-6 sm:px-14 py-10"
        style={{
          background: "#0a0908",
          color: "#9a948a",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 items-end">
          <div>
            <div
              className="font-serif"
              style={{
                color: "#f0eadd",
                fontSize: "1.25rem",
                letterSpacing: "-0.02em",
              }}
            >
              {brandName}
              <span
                aria-hidden
                className="inline-block ml-1.5 size-1.5 rounded-full align-middle"
                style={{ background: personality.accent }}
              />
            </div>
            <div
              className="mt-3 font-mono uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.32em",
              }}
            >
              © {brandName}, Vol. 01
            </div>
          </div>
          <div
            className="sm:justify-self-center flex items-center gap-7 font-mono uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "0.28em",
            }}
          >
            <span>Instagram</span>
            <span>Editorial</span>
            <span>Contact</span>
          </div>
          <div
            className="sm:justify-self-end font-mono uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "0.28em",
            }}
          >
            {slug}.com
          </div>
        </div>
      </footer>
    </div>
  );
}

// Hairline divider with a soft accent-color bloom on top — Linear's
// signature move. Replaces card borders throughout the preview.
function Hairline({ accent }: { accent: string }) {
  return (
    <div className="relative" aria-hidden>
      <div
        className="h-px w-full"
        style={{ background: LIGHT_BORDER }}
      />
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: accent,
          opacity: 0.35,
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}

// Photo wrapper with grayscale + brand-color duotone + grain.
// Turns 4 random stock photos into one chromatic identity.
function DuotonePhoto({
  src,
  alt,
  accent,
  accentDeep,
  aspectRatio,
}: {
  src: string;
  alt: string;
  accent: string;
  accentDeep: string;
  aspectRatio: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-sm"
      style={{
        aspectRatio,
        background: LIGHT_BG_DEEP,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "grayscale(1) contrast(1.05) brightness(0.95)",
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = "0";
        }}
      />
      {/* Brand-color duotone overlay */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
          mixBlendMode: "color",
          opacity: 0.72,
        }}
      />
      {/* Soft warm tone underneath the cool side */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, transparent 0%, rgba(247,242,232,0.18) 100%)`,
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  );
}

function InstagramPreview({
  personality,
  brandName,
  caption,
  image,
}: {
  personality: Personality;
  brandName: string;
  caption: string;
  image: string;
}) {
  const handleText = brandName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    <div
      className="w-full rounded-2xl overflow-hidden flex flex-col text-left"
      style={{
        background: LIGHT_BG_WHITE,
        boxShadow: `0 30px 60px -30px ${personality.glow}, 0 20px 40px -20px rgba(0,0,0,0.5)`,
      }}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div
          className="size-8 rounded-full p-[1.5px]"
          style={{
            background:
              "conic-gradient(from 0deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #f09433)",
          }}
          aria-hidden
        >
          <div
            className="size-full rounded-full"
            style={{
              background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
              border: "1.5px solid white",
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-sans text-[13px] font-semibold leading-tight"
            style={{ color: LIGHT_INK }}
          >
            {handleText}
          </div>
        </div>
        <span
          aria-hidden
          className="text-[18px] leading-none"
          style={{ color: LIGHT_INK }}
        >
          ⋯
        </span>
      </div>
      <div
        className="relative aspect-square w-full"
        style={{ background: "#f5f5f5" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0";
          }}
        />
      </div>
      <div
        className="px-3.5 pt-2.5 flex items-center gap-3.5"
        style={{ color: LIGHT_INK }}
      >
        <IgHeartIcon />
        <IgCommentIcon />
        <IgShareIcon />
        <span className="ml-auto">
          <IgBookmarkIcon />
        </span>
      </div>
      <div
        className="px-3.5 pt-2 text-[13px] font-semibold leading-tight"
        style={{ color: LIGHT_INK }}
      >
        2,847 likes
      </div>
      <div
        className="px-3.5 pt-1.5 pb-3.5 text-[13px] leading-snug"
        style={{ color: LIGHT_INK }}
      >
        <span className="font-semibold mr-1.5">{handleText}</span>
        <span className="whitespace-pre-wrap">{caption}</span>
      </div>
    </div>
  );
}

// Instagram-style action icons (closer to real platform UI)
function IgHeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IgCommentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IgShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function IgBookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function TwitterPreview({
  personality,
  brandName,
  text,
}: {
  personality: Personality;
  brandName: string;
  text: string;
}) {
  const handle = `@${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  return (
    <div
      className="w-full rounded-2xl p-4 flex flex-col gap-3 text-left"
      style={{
        background: LIGHT_BG_WHITE,
        boxShadow: `0 30px 60px -30px ${personality.glow}, 0 20px 40px -20px rgba(0,0,0,0.5)`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="size-11 rounded-full shrink-0"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
            <span
              className="font-sans font-bold text-[15px]"
              style={{ color: LIGHT_INK }}
            >
              {brandName}
            </span>
            <span
              className="text-[14px]"
              style={{ color: LIGHT_INK_DIM }}
            >
              {handle}
            </span>
            <span style={{ color: LIGHT_INK_DIM }} className="text-[14px]">
              ·
            </span>
            <span
              className="text-[14px]"
              style={{ color: LIGHT_INK_DIM }}
            >
              2h
            </span>
          </div>
          <p
            className="mt-1 text-[15px] leading-snug whitespace-pre-wrap"
            style={{ color: LIGHT_INK }}
          >
            {text}
          </p>
        </div>
      </div>
      <div
        className="flex items-center justify-between pt-2 text-[13px]"
        style={{ color: LIGHT_INK_DIM }}
      >
        <span className="flex items-center gap-1.5">
          <XCommentIcon />
          12
        </span>
        <span className="flex items-center gap-1.5">
          <XRetweetIcon />
          38
        </span>
        <span className="flex items-center gap-1.5">
          <XHeartIcon />
          214
        </span>
        <span className="flex items-center gap-1.5">
          <XViewsIcon />
          8.4K
        </span>
        <span>
          <XShareIcon />
        </span>
      </div>
    </div>
  );
}

function XCommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 5v11a2 2 0 0 0 2 2h4l3 3 3-3h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function XRetweetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7 22l-4-4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function XHeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function XViewsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V10M10 20V4M16 20v-8M22 20v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function XShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v12M12 3l4 4M12 3l-4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkedInPreview({
  personality,
  agentName,
  brandName,
  text,
}: {
  personality: Personality;
  agentName: string;
  brandName: string;
  text: string;
}) {
  return (
    <div
      className="w-full rounded-2xl flex flex-col text-left overflow-hidden"
      style={{
        background: LIGHT_BG_WHITE,
        boxShadow: `0 30px 60px -30px ${personality.glow}, 0 20px 40px -20px rgba(0,0,0,0.5)`,
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="size-12 rounded-full shrink-0"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div
            className="font-sans font-semibold text-[14px] leading-tight"
            style={{ color: LIGHT_INK }}
          >
            {agentName}
          </div>
          <div
            className="text-[12px] leading-tight mt-0.5"
            style={{ color: LIGHT_INK_MUTED }}
          >
            Founder, {brandName}
          </div>
          <div
            className="text-[11.5px] mt-0.5 flex items-center gap-1"
            style={{ color: LIGHT_INK_DIM }}
          >
            <span>2h</span>
            <span>·</span>
            <span aria-hidden>🌐</span>
          </div>
        </div>
        <span
          aria-hidden
          className="text-[20px] leading-none"
          style={{ color: LIGHT_INK_MUTED }}
        >
          ⋯
        </span>
      </div>
      <div className="px-4 pb-3">
        <p
          className="text-[14px] leading-relaxed whitespace-pre-wrap"
          style={{ color: LIGHT_INK }}
        >
          {text}
        </p>
      </div>
      <div
        className="px-4 py-1.5 flex items-center gap-3 text-[11.5px]"
        style={{
          color: LIGHT_INK_DIM,
          borderTop: `1px solid ${LIGHT_BORDER_SOFT}`,
        }}
      >
        <span className="flex items-center gap-1">
          <span
            className="size-4 rounded-full flex items-center justify-center text-white text-[8px]"
            style={{ background: "#0a66c2" }}
          >
            👍
          </span>
          <span>184</span>
        </span>
        <span className="ml-auto">42 comments · 6 reposts</span>
      </div>
      <div
        className="px-4 py-2 flex items-center justify-around text-[13px] font-semibold"
        style={{
          color: LIGHT_INK_MUTED,
          borderTop: `1px solid ${LIGHT_BORDER_SOFT}`,
        }}
      >
        <span className="flex items-center gap-1.5">
          <LiThumbIcon /> Like
        </span>
        <span className="flex items-center gap-1.5">
          <LiCommentIcon /> Comment
        </span>
        <span className="flex items-center gap-1.5">
          <LiRepostIcon /> Repost
        </span>
        <span className="flex items-center gap-1.5">
          <LiSendIcon /> Send
        </span>
      </div>
    </div>
  );
}

function LiThumbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 22V10M3 14v6a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-1.6L19 11a2 2 0 0 0-2-2.4h-4.6L13 4a2 2 0 0 0-2-2 2 2 0 0 0-2 2L7 9.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LiCommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function LiRepostIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LiSendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function AdPreview({
  personality,
  brandName,
  data,
  image,
}: {
  personality: Personality;
  brandName: string;
  data: WowDeliverables["ad"];
  image: string;
}) {
  const slug =
    brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbusiness";
  return (
    <div className="w-full max-w-[640px] mx-auto">
      <div
        className="w-full rounded-2xl overflow-hidden flex flex-col text-left"
        style={{
          background: LIGHT_BG_WHITE,
          boxShadow: `0 50px 100px -40px ${personality.glow}, 0 30px 60px -30px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="size-10 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
            }}
            aria-hidden
          />
          <div className="min-w-0">
            <div
              className="font-sans font-semibold text-[14px] leading-tight"
              style={{ color: LIGHT_INK }}
            >
              {brandName}
            </div>
            <div
              className="text-[11.5px] tracking-tight flex items-center gap-1 mt-0.5"
              style={{ color: LIGHT_INK_DIM }}
            >
              <span>Sponsored</span>
              <span aria-hidden>·</span>
              <span aria-hidden>🌐</span>
            </div>
          </div>
          <span
            aria-hidden
            className="ml-auto text-[20px] leading-none"
            style={{ color: LIGHT_INK_MUTED }}
          >
            ⋯
          </span>
        </div>

        {/* Body copy */}
        <div className="px-4 pb-3">
          <p
            className="text-[14px] leading-relaxed whitespace-pre-wrap"
            style={{ color: LIGHT_INK }}
          >
            {data.body}
          </p>
        </div>

        {/* Hero image with headline overlay */}
        <div
          className="relative aspect-[16/9] w-full"
          style={{
            background: `linear-gradient(135deg, ${personality.accent}22 0%, ${personality.accentDeep}33 100%)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0";
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-3/4"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-end p-5">
            <h3 className="font-serif font-medium tracking-tight text-[clamp(1.25rem,2.4vw,1.875rem)] leading-tight text-white max-w-md">
              {data.headline}
            </h3>
          </div>
        </div>

        {/* CTA bar (Meta ad style — gray strip with URL + button) */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "#f0f2f5" }}
        >
          <div className="min-w-0 flex-1">
            <div
              className="text-[11px] uppercase tracking-wider font-mono"
              style={{ color: LIGHT_INK_DIM }}
            >
              {slug}.com
            </div>
            <div
              className="text-[14px] font-sans font-medium truncate"
              style={{ color: LIGHT_INK }}
            >
              {data.headline}
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 inline-flex items-center h-9 px-4 rounded-md font-sans font-medium text-[13px] text-white"
            style={{
              background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
            }}
          >
            {data.cta}
          </button>
        </div>

        {/* Reaction bar — completes the "real ad" feel */}
        <div
          className="flex items-center justify-between px-4 py-2.5 text-[12px]"
          style={{
            color: LIGHT_INK_DIM,
            borderTop: `1px solid ${LIGHT_BORDER_SOFT}`,
          }}
        >
          <span>👍❤️🔥 1.2K</span>
          <span>184 comments · 38 shares</span>
        </div>
      </div>
    </div>
  );
}
