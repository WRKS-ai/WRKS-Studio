"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PersonalityIcon } from "@/components/personality-icon";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import { type WowCategory } from "@/lib/wow-photos";
import { VOICES, type VoiceId } from "@/lib/voices";
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
