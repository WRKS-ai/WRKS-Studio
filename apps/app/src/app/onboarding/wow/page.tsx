"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ContinueButton } from "@/components/continue-button";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { type WowCategory } from "@/lib/wow-photos";
import { VOICES, type VoiceId } from "@/lib/voices";
import { getPalette, getRender, type Palette, type Theme } from "@/lib/palettes";
import {
  FacebookAdInFeed,
  InstagramMini,
  IPhoneFrame,
  LinkedInMini,
  MacBookFrame,
  XMini,
} from "@/components/wow-mockups";

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
  // Palette + theme picked on /reference. Lifted to component state so
  // the render layer (LandingPreview, MacBook chrome, etc.) can recolor
  // itself to match — the previous build hardcoded a cream/violet
  // aesthetic regardless of pick.
  const [palette, setPalette] = useState<Palette | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
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
      router.replace("/onboarding/personality");
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
      // Hydrate picked palette + theme. Both default-friendly if user
      // skipped /reference: palette stays null → fall back to legacy
      // cream constants; theme defaults to "light".
      const paletteIdRaw = localStorage.getItem("wrks-onboarding-palette");
      if (paletteIdRaw) {
        const pal = getPalette(paletteIdRaw);
        if (pal) setPalette(pal);
      }
      const themeRaw = localStorage.getItem("wrks-onboarding-theme");
      if (themeRaw === "light" || themeRaw === "dark") setTheme(themeRaw);
    } catch {
      router.replace("/onboarding/intake");
    }
  }, [router]);

  // Fire the wow API once hydrated. Re-fire on retry.
  useEffect(() => {
    if (!personalityId || !agentName || !intake) return;

    let cancelled = false;
    setState({ kind: "loading" });

    // Read the palette + theme the user picked on /reference (or
    // null if they skipped). These flow into the wow system prompt
    // as a style brief and visual identity hint.
    const paletteId = localStorage.getItem("wrks-onboarding-palette");
    const themeRaw = localStorage.getItem("wrks-onboarding-theme");
    const theme = themeRaw === "light" || themeRaw === "dark" ? themeRaw : null;

    fetch("/api/wow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalityId,
        agentName,
        business: intake.business,
        audience: intake.audience,
        differentiator: intake.differentiator,
        paletteId,
        theme,
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
    <OnboardingShell tint={palette?.accent ?? personality.glow}>
      <div className="w-full max-w-[1080px] flex flex-col items-center">
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
              palette={palette}
              theme={theme}
              deliverables={state.deliverables}
              images={state.images}
              onContinue={() => {
                // Hand the deliverables off to the studio so it can
                // render them as the user's existing work.
                if (state.kind === "ready") {
                  localStorage.setItem(
                    "wrks-studio-deliverables",
                    JSON.stringify({
                      deliverables: state.deliverables,
                      images: state.images,
                      createdAt: new Date().toISOString(),
                    }),
                  );
                }
                router.push("/studio");
              }}
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
  void personality;
  void line;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center pt-8 sm:pt-12 w-full"
      aria-live="polite"
      aria-label={`${agentName} is drafting`}
    >
      {/* Pre-render skeleton browser. Shows a fake landing-page
          being built with pulsing skeleton blocks and animated
          trace gradients tracing the perimeter. Visual metaphor:
          "your studio is being drafted." */}
      <WowSkeletonLoader />

      {/* Single premium one-liner. Replaces the per-personality
          "Drafting." string + verbose mono caption — the loader IS
          the message; the line below just adds a touch of voice. */}
      <motion.p
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="mt-12 font-serif italic text-center"
        style={{
          fontSize: "clamp(1.25rem, 1.9vw, 1.625rem)",
          color: "rgba(245,240,230,0.86)",
          letterSpacing: "-0.012em",
        }}
      >
        Composing your studio.
      </motion.p>
    </motion.div>
  );
}

/* ============================================================
 * WowSkeletonLoader — fake-browser SVG skeleton.
 *
 * The visual hook for the wow page's pre-render moment. A boxed
 * browser frame contains pulsing skeleton rectangles representing
 * the landing-page hero that's about to land, plus animated
 * gradient strokes "tracing" the boundary. Three traces stagger
 * by 1.6s each so there's always one mid-sweep at any given moment.
 * All styling lives in globals.css under `.wrks-loader-svg`.
 * ============================================================ */
function WowSkeletonLoader() {
  return (
    <svg
      className="wrks-loader-svg"
      viewBox="0 0 600 400"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <defs>
        {/* Trace gradients — three layered colors. Each goes from
            transparent to color and back so the "head" of the
            comet visually fades in/out as it travels. */}
        <linearGradient id="wrks-loader-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
          <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wrks-loader-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0" />
          <stop offset="50%" stopColor="#7dd3fc" stopOpacity="1" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wrks-loader-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5ad1cd" stopOpacity="0" />
          <stop offset="50%" stopColor="#5ad1cd" stopOpacity="1" />
          <stop offset="100%" stopColor="#5ad1cd" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Browser frame */}
      <rect
        className="browser-frame"
        x="20"
        y="20"
        width="560"
        height="360"
        rx="14"
      />

      {/* Top bar */}
      <rect
        className="browser-top"
        x="20"
        y="20"
        width="560"
        height="44"
        rx="14"
      />
      {/* Cover the rounded bottom of the top bar so it's flush */}
      <rect
        className="browser-top"
        x="20"
        y="48"
        width="560"
        height="16"
      />
      <line
        className="browser-divider"
        x1="20"
        y1="64"
        x2="580"
        y2="64"
      />

      {/* Traffic-light dots */}
      <circle cx="44" cy="42" r="5" fill="#ff5f57" />
      <circle cx="62" cy="42" r="5" fill="#febc2e" />
      <circle cx="80" cy="42" r="5" fill="#28c840" />

      {/* URL bar — minimal skeleton rect, no text. Embedded text
          in SVGs renders with default sans/mono fallback that looks
          chunky next to Fraunces; cleaner to leave it as a shape. */}
      <rect
        className="browser-url"
        x="180"
        y="32"
        width="240"
        height="20"
        rx="5"
      />
      <rect
        className="skeleton"
        x="200"
        y="38"
        width="160"
        height="8"
        rx="2"
      />

      {/* === SKELETON CONTENT (mirrors the hero artifact layout) === */}

      {/* Brand eyebrow */}
      <circle className="skeleton accent" cx="70" cy="100" r="4" />
      <rect className="skeleton" x="85" y="95" width="100" height="10" />

      {/* Headline lines (3 staggered rows) */}
      <rect className="skeleton" x="60" y="130" width="420" height="22" />
      <rect className="skeleton" x="60" y="160" width="380" height="22" />
      <rect className="skeleton" x="60" y="190" width="280" height="22" />

      {/* Subhead */}
      <rect className="skeleton" x="60" y="232" width="320" height="9" />
      <rect className="skeleton" x="60" y="248" width="290" height="9" />

      {/* Accent rule */}
      <rect className="skeleton accent" x="60" y="278" width="60" height="3" rx="1.5" />

      {/* Bullet rows */}
      <circle className="skeleton accent" cx="64" cy="305" r="3" />
      <rect className="skeleton" x="78" y="301" width="280" height="8" />
      <circle className="skeleton accent" cx="64" cy="324" r="3" />
      <rect className="skeleton" x="78" y="320" width="300" height="8" />
      <circle className="skeleton accent" cx="64" cy="343" r="3" />
      <rect className="skeleton" x="78" y="339" width="260" height="8" />

      {/* CTA button placeholder (bottom-left) */}
      <rect className="skeleton accent" x="60" y="360" width="110" height="16" rx="8" />

      {/* === TRACE FLOWS — three colored gradient strokes tracing
              the outer frame perimeter, staggered by animation-delay
              so there's continuous motion. === */}
      <path
        className="trace-flow trace-1"
        d="M 27 20 L 573 20 A 14 14 0 0 1 580 27 L 580 373 A 14 14 0 0 1 573 380 L 27 380 A 14 14 0 0 1 20 373 L 20 27 A 14 14 0 0 1 27 20 Z"
        stroke="url(#wrks-loader-grad-1)"
      />
      <path
        className="trace-flow trace-2"
        d="M 27 20 L 573 20 A 14 14 0 0 1 580 27 L 580 373 A 14 14 0 0 1 573 380 L 27 380 A 14 14 0 0 1 20 373 L 20 27 A 14 14 0 0 1 27 20 Z"
        stroke="url(#wrks-loader-grad-2)"
      />
      <path
        className="trace-flow trace-3"
        d="M 27 20 L 573 20 A 14 14 0 0 1 580 27 L 580 373 A 14 14 0 0 1 573 380 L 27 380 A 14 14 0 0 1 20 373 L 20 27 A 14 14 0 0 1 27 20 Z"
        stroke="url(#wrks-loader-grad-3)"
      />
    </svg>
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
function ReadyState({
  personality,
  agentName,
  deliverables,
  images,
  onContinue,
  onRegenerate,
  palette,
  theme,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  palette: Palette | null;
  theme: Theme;
  deliverables: WowDeliverables;
  images: WowImages;
  onContinue: () => void;
  onRegenerate: () => void;
  reduced: boolean;
}) {
  void images; // Stock photos retired — the redesign is typography-led.

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
      className="w-full flex flex-col items-center pt-4 pb-12"
    >
      <IdentityStrip
        agentName={agentName}
        personality={personality}
        reduced={reduced}
      />
      <HeroArtifact
        brandName={deliverables.brandName}
        landing={deliverables.landing}
        palette={palette}
        theme={theme}
        accentFallback={personality.accent}
        reduced={reduced}
      />
      <StudioPipeline
        deliverables={deliverables}
        accent={palette?.accent ?? personality.accent}
        reduced={reduced}
      />
      <Actions
        onContinue={onContinue}
        onRegenerate={onRegenerate}
        reduced={reduced}
      />
    </motion.div>
  );
}

/* ============================================================
 * IdentityStrip — single editorial line. NO orb, NO icon.
 *
 * Just a hairline + mono caps eyebrow. Decorative dots / icon
 * marks before wordmarks are on the explicit dislike list in the
 * design taste profile, and the personality orb at the top of the
 * wow page was hitting exactly that pattern.
 * ============================================================ */
function IdentityStrip({
  agentName,
  personality,
  reduced,
}: {
  agentName: string;
  personality: Personality;
  reduced: boolean;
}) {
  void personality;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
      className="flex items-center gap-4 mb-14"
    >
      <span
        aria-hidden
        className="block h-px w-12"
        style={{ background: "rgba(245,240,230,0.22)" }}
      />
      <span
        className="font-mono uppercase"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.36em",
          color: "rgba(245,240,230,0.5)",
        }}
      >
        Act Five · drafted by {agentName}
      </span>
      <span
        aria-hidden
        className="block h-px w-12"
        style={{ background: "rgba(245,240,230,0.22)" }}
      />
    </motion.div>
  );
}

/* ============================================================
 * HeroArtifact — the single deliverable, full glory.
 *
 * Premium glass card with the wrks-crystal-border revolving light
 * around the rim. Inside, the landing-page hero renders in the
 * user's picked palette + theme — every surface (bg, ink, accent)
 * reskins to match the brand. No mock browser chrome. No stock
 * photo. Pure editorial typography. Stripe Press × Aesop.
 * ============================================================ */
function HeroArtifact({
  brandName,
  landing,
  palette,
  theme,
  accentFallback,
  reduced,
}: {
  brandName: string;
  landing: WowDeliverables["landing"];
  palette: Palette | null;
  theme: Theme;
  accentFallback: string;
  reduced: boolean;
}) {
  const render = palette ? getRender(palette, theme) : null;
  const bg = render?.bg ?? "#f7f2e8";
  const ink = render?.ink ?? "#0e0c08";
  const inkMuted = render?.inkMuted ?? "#4a443c";
  const rim = render?.rim ?? "rgba(0,0,0,0.08)";
  const accent = palette?.accent ?? accentFallback;
  const headlineWords = landing.headline.split(" ");

  return (
    <div className="relative w-full max-w-[840px] flex items-center justify-center">
      {/* Atmospheric backdrop — three layered radial glows in the
          palette accent so the card reads as bathed in light rather
          than pasted onto a void. These sit BEHIND the card and
          spread well beyond its edges. */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: "-180px -200px",
          background: `radial-gradient(ellipse 55% 50% at 50% 50%, ${accent}33, transparent 65%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: "-80px -100px",
          background: `radial-gradient(ellipse 65% 70% at 50% 50%, ${accent}1f, transparent 70%)`,
          filter: "blur(12px)",
        }}
      />

      <motion.div
        initial={
          reduced
            ? false
            : { opacity: 0, y: 24, scale: 0.97, filter: "blur(8px)" }
        }
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{
          duration: 1.1,
          delay: 0.25,
          ease: [0.2, 0.7, 0.2, 1],
        }}
        className="wrks-crystal-border relative w-full overflow-hidden"
        style={{
          borderRadius: 32,
          background: bg,
          border: `1px solid ${rim}`,
          boxShadow: `0 80px 160px -60px ${accent}88, 0 50px 100px -40px rgba(0,0,0,0.6), 0 0 0 1px ${accent}1a`,
        }}
      >
      {/* Asymmetric editorial spread — left column is the hero
          (wordmark + display headline + subhead + CTA), right column
          is a quiet stack of numbered details. Magazine-cover layout
          rather than the AI-default "everything center-stacked." */}
      <div
        className="relative grid items-stretch"
        style={{
          gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)",
          padding: "64px clamp(36px, 5vw, 72px) 64px",
          gap: "clamp(40px, 5vw, 72px)",
        }}
      >
        {/* === LEFT COLUMN === */}
        <div className="relative flex flex-col">
          {/* Brand wordmark — top of the spread, no decorative
              dot. Just the name in display Fraunces. */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.55 }}
            className="flex items-center gap-3"
            style={{ marginBottom: 56 }}
          >
            <span
              aria-hidden
              className="block h-px"
              style={{ width: 28, background: accent }}
            />
            <span
              className="font-serif"
              style={{
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "-0.012em",
                color: ink,
              }}
            >
              {brandName}
            </span>
          </motion.div>

          {/* Headline — display scale, word-by-word stagger */}
          <h2
            className="font-serif"
            style={{
              fontSize: "clamp(2.5rem, 5.8vw, 5rem)",
              fontWeight: 500,
              letterSpacing: "-0.042em",
              lineHeight: 0.95,
              color: ink,
              margin: 0,
            }}
          >
            {headlineWords.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={
                  reduced
                    ? false
                    : { opacity: 0, y: 20, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.7,
                  delay: 0.85 + i * 0.045,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="inline-block mr-[0.22em]"
              >
                {word}
              </motion.span>
            ))}
          </h2>

          {/* Subhead — narrower max-width on the left column */}
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.1 + headlineWords.length * 0.045,
              duration: 0.7,
            }}
            className="font-sans"
            style={{
              fontSize: "clamp(0.9375rem, 1.05vw, 1.0625rem)",
              lineHeight: 1.55,
              color: inkMuted,
              maxWidth: "44ch",
              margin: "32px 0 0",
            }}
          >
            {landing.subhead}
          </motion.p>

          {/* CTA — anchored to bottom of left column. mt-auto plus
              top margin so it always sits with breathing room above
              regardless of subhead length. */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.55 }}
            className="mt-auto"
            style={{ paddingTop: 48 }}
          >
            <motion.button
              whileHover={reduced ? undefined : { y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="inline-flex items-center gap-3 rounded-full font-mono uppercase"
              style={{
                padding: "16px 28px",
                background: accent,
                color: bg,
                fontSize: 11.5,
                letterSpacing: "0.22em",
                boxShadow: `0 14px 36px -8px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}
            >
              {landing.primaryCta}
              <span aria-hidden>→</span>
            </motion.button>
          </motion.div>
        </div>

        {/* === RIGHT COLUMN === */}
        {/* Vertical numbered details. A tiny hairline at top splits
            them off from the wordmark line on the left without
            needing a visible vertical divider. */}
        <div className="relative flex flex-col" style={{ paddingTop: 0 }}>
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="flex items-center gap-2 mb-7"
          >
            <span
              aria-hidden
              className="block h-px w-6"
              style={{ background: accent }}
            />
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 9.5,
                letterSpacing: "0.32em",
                color: inkMuted,
              }}
            >
              The details
            </span>
          </motion.div>

          <div className="flex flex-col" style={{ gap: 28 }}>
            {landing.valueBullets.map((bullet, i) => (
              <motion.div
                key={i}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 1.6 + i * 0.12,
                  duration: 0.5,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="flex gap-4"
              >
                <span
                  className="font-mono tabular-nums shrink-0"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    color: accent,
                    fontWeight: 600,
                    paddingTop: 2,
                    minWidth: 24,
                  }}
                >
                  0{i + 1}
                </span>
                <span
                  className="font-serif"
                  style={{
                    fontSize: "clamp(0.9375rem, 1.05vw, 1.0625rem)",
                    lineHeight: 1.4,
                    color: ink,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {bullet}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle bottom hairline running the full card width — gives
          the spread a "printed page" footer feel. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
        style={{ background: rim }}
      />
      </motion.div>
    </div>
  );
}

/* ============================================================
 * StudioPipeline — three glass pills teasing what's next.
 * ============================================================ */
function StudioPipeline({
  deliverables,
  accent,
  reduced,
}: {
  deliverables: WowDeliverables;
  accent: string;
  reduced: boolean;
}) {
  const chips = [
    { label: "Instagram", text: firstSentence(deliverables.social.instagram) },
    { label: "X · Twitter", text: firstSentence(deliverables.social.twitter) },
    { label: "Facebook ad", text: deliverables.ad.headline },
  ];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 2.4, ease: [0.2, 0.7, 0.2, 1] }}
      className="w-full max-w-[840px]"
      style={{ marginTop: 80 }}
    >
      <div className="flex items-center gap-3 mb-7">
        <span
          aria-hidden
          className="block h-px w-8"
          style={{ background: "rgba(245,240,230,0.22)" }}
        />
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.32em",
            color: "rgba(245,240,230,0.46)",
          }}
        >
          Coming up in your studio
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {chips.map((chip, i) => (
          <StudioChip
            key={chip.label}
            label={chip.label}
            text={chip.text}
            accent={accent}
            index={i}
            reduced={reduced}
          />
        ))}
      </div>
    </motion.div>
  );
}

function StudioChip({
  label,
  text,
  accent,
  index,
  reduced,
}: {
  label: string;
  text: string;
  accent: string;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 2.55 + index * 0.08 }}
      whileHover={reduced ? undefined : { y: -2 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        padding: "22px 22px 24px",
        minHeight: 124,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(28px) saturate(170%)",
        WebkitBackdropFilter: "blur(28px) saturate(170%)",
        boxShadow: "0 18px 40px -16px rgba(0,0,0,0.5)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 100% 100%, ${accent}22, transparent 75%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)",
        }}
      />
      <div className="relative flex items-center gap-2.5 mb-3">
        <span
          aria-hidden
          className="block rounded-full"
          style={{
            width: 5,
            height: 5,
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
          }}
        />
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "rgba(245,240,230,0.55)",
          }}
        >
          {label}
        </span>
      </div>
      <p
        className="relative font-sans"
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "rgba(245,240,230,0.78)",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text}
      </p>
    </motion.div>
  );
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^[\s\S]{20,200}?[.!?](\s|$)/);
  if (match) return match[0].trim();
  return trimmed.slice(0, 180);
}

/* ============================================================
 * Actions — Continue is the hero, Regenerate is the escape hatch
 * ============================================================ */
function Actions({
  onContinue,
  onRegenerate,
  reduced,
}: {
  onContinue: () => void;
  onRegenerate: () => void;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 3.0 }}
      className="flex flex-col items-center gap-6"
      style={{ marginTop: 64 }}
    >
      <ContinueButton onClick={onContinue}>
        Take it to the studio
        <span aria-hidden style={{ marginLeft: "0.7em" }}>
          →
        </span>
      </ContinueButton>
      <button
        type="button"
        onClick={onRegenerate}
        className="font-mono uppercase transition-opacity hover:opacity-80"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.32em",
          color: "rgba(245,240,230,0.4)",
        }}
      >
        Or regenerate it all
      </button>
    </motion.div>
  );
}

// ============================================================
// LEGACY components below are no longer rendered by ReadyState but
// remain in the file to keep the diff focused. Safe to delete in a
// follow-up commit once the new layout is locked in.
// ============================================================
function _LegacyReadyStateBody({
  personality,
  agentName,
  deliverables,
  images,
  onContinue,
  onRegenerate,
  palette,
  theme,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  palette: Palette | null;
  theme: Theme;
  deliverables: WowDeliverables;
  images: WowImages;
  onContinue: () => void;
  onRegenerate: () => void;
  reduced: boolean;
}) {
  const brandName = deliverables.brandName;
  const pix = images;
  const handleSlug =
    brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "brand";

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

      {/* ============== ACT ONE — ON THE WEB ============== */}
      <ChapterDivider
        index="01"
        label="On the web"
        sublabel="Your homepage, ready to launch"
        accent={personality.accent}
        reduced={reduced}
      />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="w-full"
      >
        <MacBookFrame>
          <LandingPreview
            personality={personality}
            palette={palette}
            theme={theme}
            brandName={brandName}
            data={deliverables.landing}
            heroImage={pix.heroLandscape}
            featuredImages={pix.featured}
          />
        </MacBookFrame>
        <p className="mt-6 text-center text-[10px] tracking-[0.22em] uppercase font-mono text-ink-dim">
          Scroll inside the screen to see the whole page
        </p>
      </motion.div>

      {/* ============== ACT TWO — IN THE FEED ============== */}
      <ChapterDivider
        index="02"
        label="In the feed"
        sublabel="Three posts, three platforms, one voice"
        accent={personality.accent}
        reduced={reduced}
      />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="w-full grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-6 items-start"
      >
        <PhoneInLineup
          width={260}
          glow={personality.glow}
          label="Instagram"
          rotate={-1.5}
        >
          <InstagramMini
            handle={handleSlug}
            caption={deliverables.social.instagram}
            image={pix.instagramSquare}
            accent={personality.accent}
            accentDeep={personality.accentDeep}
          />
        </PhoneInLineup>
        <PhoneInLineup
          width={260}
          glow={personality.glow}
          label="X / Twitter"
          rotate={0}
        >
          <XMini
            brandName={brandName}
            handle={`@${handleSlug}`}
            text={deliverables.social.twitter}
            accent={personality.accent}
            accentDeep={personality.accentDeep}
          />
        </PhoneInLineup>
        <PhoneInLineup
          width={260}
          glow={personality.glow}
          label="LinkedIn"
          rotate={1.5}
        >
          <LinkedInMini
            agentName={agentName}
            brandName={brandName}
            text={deliverables.social.linkedin}
            accent={personality.accent}
            accentDeep={personality.accentDeep}
          />
        </PhoneInLineup>
      </motion.div>

      {/* ============== ACT THREE — IN THE WILD ============== */}
      <ChapterDivider
        index="03"
        label="In the wild"
        sublabel="Your ad, scrolling past someone right now"
        accent={personality.accent}
        reduced={reduced}
      />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="w-full flex flex-col items-center"
      >
        <IPhoneFrame width={320} shadowGlow={personality.glow}>
          <FacebookAdInFeed
            brandName={brandName}
            adData={deliverables.ad}
            adImage={pix.adHero}
            accent={personality.accent}
            accentDeep={personality.accentDeep}
          />
        </IPhoneFrame>
        <p className="mt-6 text-center text-[10px] tracking-[0.22em] uppercase font-mono text-ink-dim max-w-md">
          Sponsored, in context — between two real feed posts
        </p>
      </motion.div>

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
            Open your{" "}
            <span style={{ color: personality.accent }}>studio</span>
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
 * Editorial chapter divider — replaces "Section heading"
 * ============================================================ */
function ChapterDivider({
  index,
  label,
  sublabel,
  accent,
  reduced,
}: {
  index: string;
  label: string;
  sublabel: string;
  accent: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      className="w-full mt-24 sm:mt-32 mb-12 sm:mb-16 flex flex-col items-center text-center"
    >
      {/* Hairline with bloom */}
      <div className="relative w-full max-w-[480px] mb-10">
        <div className="h-px w-full bg-white/10" aria-hidden />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background: accent,
            opacity: 0.4,
            filter: "blur(6px)",
          }}
        />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <span
          className="text-[10px] tracking-[0.32em] uppercase font-mono"
          style={{ color: accent }}
        >
          Act {index}
        </span>
        <span
          className="h-px w-12 inline-block"
          style={{ background: "rgba(255,255,255,0.15)" }}
          aria-hidden
        />
        <span className="font-serif text-[clamp(1.5rem,2.2vw,1.875rem)] text-ink tracking-tight leading-none">
          {label}
        </span>
      </div>
      <p className="font-serif italic text-[clamp(0.875rem,1vw,1rem)] text-ink-muted">
        {sublabel}
      </p>
    </motion.div>
  );
}

/* ============================================================
 * iPhone with a slight tilt + label below, for the social lineup
 * ============================================================ */
function PhoneInLineup({
  children,
  width,
  glow,
  label,
  rotate,
}: {
  children: ReactNode;
  width: number;
  glow: string;
  label: string;
  rotate: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <div style={{ transform: `rotate(${rotate}deg)`, transformOrigin: "bottom center" }}>
        <IPhoneFrame width={width} shadowGlow={glow}>
          {children}
        </IPhoneFrame>
      </div>
      <p className="mt-6 text-[10px] tracking-[0.22em] uppercase font-mono text-ink-dim">
        {label}
      </p>
    </div>
  );
}

/* ============================================================
 * PREVIEW FRAMES
 * ============================================================ */

// Light-mode tokens — real platforms (Instagram, X, LinkedIn, Meta ads,
// most landing pages) are predominantly white/light. Dark previews
// read as gloomy mockups, not real product output.
// Module-level fallbacks — used inside LandingPreview when no palette
// has been picked (user skipped /reference). The function shadows
// these with palette-derived locals named LIGHT_BG / LIGHT_INK / etc.
const LIGHT_BG_FALLBACK = "#f7f2e8";          // warm cream (editorial paper tone)
const LIGHT_BG_WHITE_FALLBACK = "#ffffff";    // pure white for the social platforms
const LIGHT_BG_DEEP_FALLBACK = "#efe9dc";     // slightly darker room tone for chapter shifts
const LIGHT_BG_HIGH_FALLBACK = "#fbf7ee";     // slightly lighter room tone
const LIGHT_INK_FALLBACK = "#0e0c08";         // near-black, warm
const LIGHT_INK_MUTED_FALLBACK = "#4a443c";   // body / secondary text
const LIGHT_INK_DIM_FALLBACK = "#827a6e";     // meta text

/**
 * Cheap hex shader for deriving HIGH / DEEP / DIM variants from the
 * palette's base bg + ink. Positive percent lightens, negative darkens.
 * Used inside LandingPreview to skin chapter dividers + meta text in
 * a tone consistent with the picked palette.
 */
function shadeHex(hex: string, percent: number): string {
  if (!hex || hex[0] !== "#" || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const clamp = (x: number) => Math.max(0, Math.min(255, x));
  const delta = Math.round(255 * percent);
  const r = clamp((n >> 16) + delta);
  const g = clamp(((n >> 8) & 0xff) + delta);
  const b = clamp((n & 0xff) + delta);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
const LIGHT_BORDER = "rgba(14,12,8,0.10)";
const LIGHT_BORDER_SOFT = "rgba(14,12,8,0.06)";

// Inline SVG noise for the "film grain" overlay — single biggest
// per-byte upgrade for editorial feel per the design research.
const NOISE_SVG =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIi8+PC9zdmc+";

function LandingPreview({
  personality,
  palette,
  theme,
  brandName,
  data,
  heroImage,
  featuredImages,
}: {
  personality: Personality;
  palette: Palette | null;
  theme: Theme;
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

  // Themed colors — derived from the user's picked palette + theme.
  // We shadow the module-scope LIGHT_* constants with same-named
  // locals so every reference inside this function automatically
  // picks up the themed value. When no palette was picked, the
  // locals copy the module fallbacks and the rendering is unchanged.
  /* eslint-disable @typescript-eslint/no-shadow */
  const render = palette ? getRender(palette, theme) : null;
  const LIGHT_BG = render?.bg ?? LIGHT_BG_FALLBACK;
  const LIGHT_INK = render?.ink ?? LIGHT_INK_FALLBACK;
  const LIGHT_INK_MUTED = render?.inkMuted ?? LIGHT_INK_MUTED_FALLBACK;
  const LIGHT_INK_DIM = render
    ? shadeHex(LIGHT_INK_MUTED, theme === "dark" ? -0.12 : 0.18)
    : LIGHT_INK_DIM_FALLBACK;
  const LIGHT_BG_HIGH = render
    ? shadeHex(LIGHT_BG, theme === "dark" ? 0.04 : 0.02)
    : LIGHT_BG_HIGH_FALLBACK;
  const LIGHT_BG_DEEP = render
    ? shadeHex(LIGHT_BG, theme === "dark" ? 0.06 : -0.04)
    : LIGHT_BG_DEEP_FALLBACK;
  // bgWhite kept for the social-platform white surface; locks to
  // pure white in light mode, lightened palette bg in dark mode.
  const LIGHT_BG_WHITE = render
    ? theme === "dark"
      ? shadeHex(LIGHT_BG, 0.08)
      : "#ffffff"
    : LIGHT_BG_WHITE_FALLBACK;
  const PAL_ACCENT = palette?.accent ?? personality.accent;
  void LIGHT_BG_WHITE;
  void PAL_ACCENT;
  /* eslint-enable @typescript-eslint/no-shadow */

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
        background: LIGHT_BG_DEEP_FALLBACK,
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
