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
import { photos, type WowCategory } from "@/lib/wow-photos";
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

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; deliverables: WowDeliverables };

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
        };
        setState({ kind: "ready", deliverables: data.deliverables });
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
function ReadyState({
  personality,
  agentName,
  deliverables,
  onContinue,
  onRegenerate,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  deliverables: WowDeliverables;
  onContinue: () => void;
  onRegenerate: () => void;
  reduced: boolean;
}) {
  const brandName = deliverables.brandName;
  const pix = photos(brandName, {
    heroQuery: deliverables.heroImageQuery,
    instagramQuery: deliverables.instagramImageQuery,
    adQuery: deliverables.adImageQuery,
  });
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full flex flex-col items-center"
    >
      {/* Agent presence */}
      <PersonalityIcon personality={personality} size="sm" />
      <div className="mt-3 font-serif italic text-[14px] text-ink-muted">
        {agentName} <span className="text-ink-dim">·</span> {personality.name}
      </div>

      {/* Hero heading — blur-in word by word */}
      <h1 className="mt-10 font-serif font-medium tracking-tight text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[0.98] text-ink">
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
        className="mt-5 max-w-xl text-[15px] sm:text-base text-ink-muted leading-relaxed font-serif italic"
      >
        Drafting as{" "}
        <span className="text-ink not-italic font-medium">{brandName}</span>.
        Not the angle you wanted? Have me try again.
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
        <span aria-hidden style={{ color: personality.accent }}>↻</span>
      </motion.button>

      {/* DELIVERABLE 1 — Landing page */}
      <DeliverableSection
        label="Landing page"
        index={0}
        reduced={reduced}
      >
        <LandingPreview
          personality={personality}
          brandName={brandName}
          data={deliverables.landing}
          heroImage={pix.heroLandscape}
          featuredImages={pix.featured}
        />
      </DeliverableSection>

      {/* DELIVERABLE 2 — Social posts */}
      <DeliverableSection
        label="Social posts"
        index={1}
        reduced={reduced}
      >
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-start">
          <InstagramPreview
            personality={personality}
            brandName={brandName}
            caption={deliverables.social.instagram}
            image={pix.instagramSquare}
          />
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
      </DeliverableSection>

      {/* DELIVERABLE 3 — Ad creative */}
      <DeliverableSection
        label="Ad creative"
        index={2}
        reduced={reduced}
      >
        <AdPreview
          personality={personality}
          brandName={brandName}
          data={deliverables.ad}
          image={pix.adHero}
        />
      </DeliverableSection>

      {/* Continue */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.7 }}
        className="mt-16 sm:mt-20 h-12 flex items-center justify-center"
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

function DeliverableSection({
  label,
  index,
  reduced,
  children,
}: {
  label: string;
  index: number;
  reduced: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 1.0 + index * 0.25,
        duration: 0.8,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className="w-full mt-16 sm:mt-20"
    >
      <div className="flex items-center justify-center gap-3 mb-8 sm:mb-10">
        <span className="h-px w-12 bg-white/10" aria-hidden />
        <span className="text-[10px] tracking-[0.28em] uppercase text-ink-dim font-mono">
          {label}
        </span>
        <span className="h-px w-12 bg-white/10" aria-hidden />
      </div>
      {children}
    </motion.section>
  );
}

/* ============================================================
 * PREVIEW FRAMES
 * ============================================================ */

// Light-mode tokens — real platforms (Instagram, X, LinkedIn, Meta ads,
// most landing pages) are predominantly white/light. Dark previews
// read as gloomy mockups, not real product output.
const LIGHT_BG = "#fafaf6";          // warm off-white for the landing page
const LIGHT_BG_WHITE = "#ffffff";    // pure white for the social platforms
const LIGHT_INK = "#0e0e10";         // near-black for headings
const LIGHT_INK_MUTED = "#4a4a52";   // body / secondary text
const LIGHT_INK_DIM = "#86868b";     // meta text
const LIGHT_BORDER = "rgba(0,0,0,0.08)";
const LIGHT_BORDER_SOFT = "rgba(0,0,0,0.05)";

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
  const slug =
    brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbusiness";
  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: LIGHT_BG,
        boxShadow: `0 50px 100px -40px ${personality.glow}, 0 30px 60px -30px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Browser chrome (stays dark — it's the macOS Safari frame) */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: "#2a2a2c",
          borderBottom: "1px solid #18181a",
        }}
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

      {/* Site nav */}
      <div
        className="flex items-center justify-between px-6 sm:px-10 py-3.5 text-[12px]"
        style={{ borderBottom: `1px solid ${LIGHT_BORDER_SOFT}` }}
      >
        <div className="flex items-center gap-2 font-serif">
          <span
            className="size-2 rounded-full"
            style={{ background: personality.accent }}
            aria-hidden
          />
          <span
            className="font-medium tracking-tight"
            style={{ color: LIGHT_INK }}
          >
            {brandName}
          </span>
        </div>
        <div
          className="hidden sm:flex items-center gap-5 font-sans"
          style={{ color: LIGHT_INK_MUTED }}
        >
          <span>Shop</span>
          <span>About</span>
          <span>Journal</span>
        </div>
        <div
          className="flex items-center gap-3 font-sans"
          style={{ color: LIGHT_INK_MUTED }}
        >
          <SearchIcon />
          <HeartOutlineIcon />
          <CartIcon />
        </div>
      </div>

      {/* Two-column hero — copy on left, photo on right */}
      <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
        <div className="px-6 sm:px-10 py-14 sm:py-20 text-left flex flex-col justify-center">
          <h2
            className="font-serif font-medium tracking-tight text-[clamp(1.875rem,4vw,3.25rem)] leading-[1.02]"
            style={{ color: LIGHT_INK }}
          >
            {data.headline}
          </h2>
          <p
            className="mt-6 text-[15px] sm:text-base leading-relaxed max-w-md"
            style={{ color: LIGHT_INK_MUTED }}
          >
            {data.subhead}
          </p>

          <button
            type="button"
            className="mt-9 inline-flex items-center gap-2 h-12 px-7 rounded-full font-sans font-medium text-[14px] text-white transition-transform hover:scale-[1.02] self-start"
            style={{
              background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
              boxShadow: `0 12px 32px -10px ${personality.glow}`,
            }}
          >
            {data.primaryCta}
            <span aria-hidden>→</span>
          </button>

          <ul className="mt-10 flex flex-col gap-3 max-w-md">
            {data.valueBullets.map((bullet, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: LIGHT_INK_MUTED }}
              >
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 size-4 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hero photo — fills the right side */}
        <div
          className="relative min-h-[320px] md:min-h-[520px]"
          style={{
            background: `linear-gradient(135deg, ${personality.accent}22 0%, ${personality.accentDeep}33 100%)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={`${brandName} hero`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* Featured strip */}
      <div
        className="px-6 sm:px-12 pt-8 pb-12"
        style={{ borderTop: `1px solid ${LIGHT_BORDER_SOFT}` }}
      >
        <div className="flex items-center justify-between mb-6">
          <div
            className="text-[10px] tracking-[0.22em] uppercase font-mono"
            style={{ color: LIGHT_INK_DIM }}
          >
            New in
          </div>
          <div
            className="text-[10px] tracking-[0.22em] uppercase font-mono"
            style={{ color: LIGHT_INK_MUTED }}
          >
            View all →
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {featuredImages.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] rounded-lg overflow-hidden group"
              style={{
                background: `linear-gradient(135deg, ${personality.accent}22 0%, ${personality.accentDeep}33 100%)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0";
                }}
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/2"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between text-[11px] font-mono text-white">
                <span className="uppercase tracking-wider">
                  {brandName} · 0{i + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-6 sm:px-12 py-4 flex items-center justify-between text-[10px] font-mono"
        style={{
          background: "#f0efea",
          color: LIGHT_INK_DIM,
          borderTop: `1px solid ${LIGHT_BORDER_SOFT}`,
        }}
      >
        <span>© {brandName}</span>
        <span>{slug}.com</span>
      </div>
    </div>
  );
}

// Inline SVG icons (lighter than emoji on light backgrounds, more "real")
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function HeartOutlineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 5h2l2.5 11h11L21 8H7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
    </svg>
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
