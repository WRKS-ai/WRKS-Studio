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
        />
      </DeliverableSection>

      {/* DELIVERABLE 2 — Social posts */}
      <DeliverableSection
        label="Social posts"
        index={1}
        reduced={reduced}
      >
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <InstagramPreview
            personality={personality}
            brandName={brandName}
            caption={deliverables.social.instagram}
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

function LandingPreview({
  personality,
  brandName,
  data,
}: {
  personality: Personality;
  brandName: string;
  data: WowDeliverables["landing"];
}) {
  const slug =
    brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbusiness";
  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: `0 30px 80px -30px ${personality.glow}, 0 0 0 1px rgba(255,255,255,0.02)`,
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/60" />
          <span className="size-2.5 rounded-full bg-yellow-400/60" />
          <span className="size-2.5 rounded-full bg-green-400/60" />
        </div>
        <div
          className="flex-1 max-w-md mx-auto rounded-md px-3 py-1 text-[11px] font-mono text-ink-dim text-center"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          🔒 {slug}.com
        </div>
        <div className="w-12" aria-hidden />
      </div>

      {/* Site nav strip — makes it feel like a real site */}
      <div
        className="flex items-center justify-between px-6 sm:px-10 py-3 text-[12px]"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-2 font-serif">
          <span
            className="size-2 rounded-full"
            style={{ background: personality.accent }}
            aria-hidden
          />
          <span className="font-medium tracking-tight text-ink">
            {brandName}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-5 font-sans text-ink-muted">
          <span>Shop</span>
          <span>About</span>
          <span>Journal</span>
        </div>
        <div className="flex items-center gap-3 text-ink-muted font-sans">
          <span aria-hidden>⌕</span>
          <span aria-hidden>♡</span>
          <span aria-hidden>⊞</span>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 sm:px-12 py-12 sm:py-16 text-center">
        <h2 className="font-serif font-medium tracking-tight text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.05] text-ink max-w-3xl mx-auto">
          {data.headline}
        </h2>
        <p className="mt-5 text-[14px] sm:text-[15px] text-ink-muted leading-relaxed max-w-xl mx-auto">
          {data.subhead}
        </p>

        <button
          type="button"
          className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-full font-sans font-medium text-[14px] text-canvas transition-transform hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
            boxShadow: `0 8px 24px -8px ${personality.glow}`,
          }}
        >
          {data.primaryCta}
          <span aria-hidden>→</span>
        </button>

        <ul className="mt-10 flex flex-col gap-2.5 max-w-md mx-auto text-left">
          {data.valueBullets.map((bullet, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[13px] sm:text-[14px] text-ink-muted leading-snug"
            >
              <span
                aria-hidden
                className="mt-1 shrink-0 size-4 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
                }}
              >
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
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

      {/* Featured strip — placeholder gradient tiles, sells the
          "this is a real site" feeling */}
      <div
        className="px-6 sm:px-12 pt-2 pb-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono mb-4 mt-6 text-center">
          Featured
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-lg"
              style={{
                background: `radial-gradient(circle at ${30 + i * 20}% ${
                  25 + i * 15
                }%, ${personality.glow} 0%, transparent ${60 - i * 5}%), linear-gradient(${
                  135 + i * 20
                }deg, ${personality.accentDeep}55 0%, rgba(255,255,255,0.02) 100%)`,
              }}
              aria-hidden
            />
          ))}
        </div>
      </div>

      {/* Footer line */}
      <div
        className="px-6 sm:px-12 py-4 flex items-center justify-between text-[10px] font-mono text-ink-dim"
        style={{
          background: "rgba(255,255,255,0.015)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <span>© {brandName}</span>
        <span>{slug}.com</span>
      </div>
    </div>
  );
}

function InstagramPreview({
  personality,
  brandName,
  caption,
}: {
  personality: Personality;
  brandName: string;
  caption: string;
}) {
  const handle = `@${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  return (
    <div
      className="w-full rounded-2xl overflow-hidden flex flex-col text-left"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div
          className="size-7 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <span className="font-sans text-[13px] text-ink font-medium">
          {handle.replace("@", "")}
        </span>
        <span className="ml-auto text-ink-dim text-[18px] leading-none">⋯</span>
      </div>
      <div
        className="aspect-square w-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${personality.glow} 0%, transparent 65%), radial-gradient(circle at 70% 70%, ${personality.accentDeep}33 0%, transparent 60%), rgba(255,255,255,0.02)`,
        }}
        aria-hidden
      />
      <div className="px-4 py-3 flex items-center gap-3 text-[16px]">
        <span>♡</span>
        <span>💬</span>
        <span>📤</span>
        <span className="ml-auto">🔖</span>
      </div>
      <div className="px-4 pb-4 text-[13px] text-ink leading-relaxed">
        <span className="font-sans font-medium mr-1.5">
          {handle.replace("@", "")}
        </span>
        <span className="text-ink-muted whitespace-pre-wrap">{caption}</span>
      </div>
    </div>
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
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="size-10 rounded-full shrink-0"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-sans font-semibold text-[14px] text-ink">
              {brandName}
            </span>
            <span className="text-ink-dim text-[13px]">{handle}</span>
            <span className="text-ink-dim text-[13px]">·</span>
            <span className="text-ink-dim text-[13px]">2h</span>
          </div>
          <p className="mt-1.5 text-[14px] text-ink leading-snug whitespace-pre-wrap">
            {text}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-around text-ink-dim text-[14px] pt-1.5">
        <span>💬 12</span>
        <span>↻ 38</span>
        <span>♡ 214</span>
        <span>📊</span>
      </div>
    </div>
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
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-start gap-2.5 p-4">
        <div
          className="size-11 rounded-full shrink-0"
          style={{
            background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="font-sans font-semibold text-[14px] text-ink">
            {agentName}
          </div>
          <div className="text-ink-dim text-[11.5px]">
            Founder, {brandName} · 2h
          </div>
        </div>
      </div>
      <div className="px-4 pb-3">
        <p className="text-[13.5px] text-ink leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
      </div>
      <div
        className="px-4 py-2.5 flex items-center gap-5 text-ink-dim text-[12px]"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↻ Repost</span>
      </div>
    </div>
  );
}

function AdPreview({
  personality,
  brandName,
  data,
}: {
  personality: Personality;
  brandName: string;
  data: WowDeliverables["ad"];
}) {
  const slug =
    brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbusiness";
  return (
    <div className="w-full max-w-[640px] mx-auto">
      <div
        className="w-full rounded-2xl overflow-hidden flex flex-col text-left"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: `0 30px 80px -30px ${personality.glow}, 0 0 0 1px rgba(255,255,255,0.02)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="size-9 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
            }}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="font-sans font-semibold text-[13px] text-ink">
              {brandName}
            </div>
            <div className="text-[11px] tracking-tight text-ink-dim flex items-center gap-1.5">
              Sponsored <span aria-hidden>·</span> <span aria-hidden>🌐</span>
            </div>
          </div>
        </div>

        {/* Body copy */}
        <div className="px-4 pb-3">
          <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
            {data.body}
          </p>
        </div>

        {/* Hero image */}
        <div
          className="aspect-[16/9] w-full flex items-end p-6"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${personality.glow} 0%, transparent 60%), radial-gradient(circle at 70% 70%, ${personality.accentDeep}55 0%, transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
          }}
          aria-hidden
        >
          <h3 className="font-serif font-medium tracking-tight text-[clamp(1.25rem,2.4vw,1.875rem)] leading-tight text-ink max-w-md">
            {data.headline}
          </h3>
        </div>

        {/* CTA bar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider text-ink-dim font-mono">
              {slug}.com
            </div>
            <div className="text-[13px] font-sans text-ink truncate">
              {data.headline}
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 inline-flex items-center h-9 px-4 rounded-md font-sans font-medium text-[13px] text-canvas"
            style={{
              background: `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`,
            }}
          >
            {data.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
