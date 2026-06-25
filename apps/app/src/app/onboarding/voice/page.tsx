"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContinueButton } from "@/components/continue-button";
import { OnboardingFrame } from "@/components/onboarding-frame";
import { PERSONALITIES } from "@/lib/personalities";
import type { PersonalityId } from "@/lib/personalities";
import { VOICES } from "@/lib/voices";

const STORAGE_KEY = "wrks-onboarding-personality";
const VOICE_KEY = "wrks-onboarding-voice";
// Pricing lives on the marketing site (separate Next.js app
// deployed at wrks-studio-marketing.vercel.app). Opens in a new
// tab so the user doesn't lose their in-progress onboarding
// session. Anchor #pricing scrolls to the Pricing component on
// the homepage (apps/marketing/src/components/v2/pricing.tsx).
const PLANS_URL = "https://wrks-studio-marketing.vercel.app/#pricing";
const openPricing = () => {
  if (typeof window !== "undefined") {
    window.open(PLANS_URL, "_blank", "noopener,noreferrer");
  }
};

// Step 1 of 3 — pick your AGENT'S VOICE. Only one voice (the one our
// ElevenLabs dashboard agent is wired to — currently Brad) is on the
// free plan; the rest are premium previews with a glass lock overlay.
// Clicking a locked voice routes to the plans page.
//
// VOICE_INFO replaces the personality name+tagline on the LEFT side
// with voice-centric framing. The PERSONALITY system (Maven / Sage /
// etc.) still lives underneath — the conversational character — but
// the page UI treats each option as "a voice you can pick" because
// that's what the user is choosing.
//
// 2026-06-24: route renamed from /onboarding/personality → /onboarding/voice
// so the URL matches the page content. /personality keeps a 307 redirect.
// Eyebrow ("Act One — Choose a Voice") removed per `feedback_never_use_eyebrows.md`.

// Voices are described by CHARACTER, not by proper name — the user
// picks a name for their agent on the very next page, so showing
// voice names like "Aria" / "Brad" here muddles which name is which.
// A two-word character descriptor (warm & casual, confident & bright,
// etc.) is what actually matters when choosing how the agent sounds.
const VOICE_INFO: Record<
  PersonalityId,
  { character: string; isLocked: boolean }
> = {
  maven: { character: "Warm & casual", isLocked: false },
  sage: { character: "Confident & bright", isLocked: true },
  spark: { character: "Smooth & elegant", isLocked: true },
  echo: { character: "Deep & resonant", isLocked: true },
};

type PlayState = "idle" | "loading" | "playing" | "error";

export default function PersonalityPage() {
  const router = useRouter();
  const reduced = useReducedMotion();

  // Always land on the free/unlocked voice (index 0 = maven/Brad).
  // We don't restore from localStorage anymore — restoring a locked
  // voice slot would just dump the user on an upgrade CTA when they
  // hit the page, which is wrong. When/if more voices become free,
  // revisit and restore the LAST FREE selection.
  const [index, setIndex] = useState<number>(0);

  const previewed = PERSONALITIES[index]!;
  const total = PERSONALITIES.length;
  const accent = previewed.accent;
  const pairedVoice = VOICES.find((v) => v.id === previewed.voiceId)!;

  /* ── Audio playback ── */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const stopAudio = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    audioRef.current = null;
    setPlayState("idle");
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    stopAudio();
    return () => {
      stopAudio();
    };
  }, [index, stopAudio]);

  const playSample = useCallback(() => {
    stopAudio();
    setPlayState("loading");
    setCurrentTime(0);
    const el = new Audio(pairedVoice.sample);
    audioRef.current = el;
    el.addEventListener("loadedmetadata", () => {
      setDuration(el.duration || 0);
    });
    el.addEventListener("timeupdate", () => {
      setCurrentTime(el.currentTime);
    });
    el.addEventListener("ended", () => {
      setPlayState("idle");
      setCurrentTime(0);
      audioRef.current = null;
    });
    el.addEventListener("error", () => {
      setPlayState("error");
      audioRef.current = null;
    });
    el
      .play()
      .then(() => setPlayState("playing"))
      .catch(() => {
        setPlayState("error");
        audioRef.current = null;
      });
  }, [pairedVoice.sample, stopAudio]);

  const toggleListen = useCallback(() => {
    if (playState === "playing" || playState === "loading") stopAudio();
    else playSample();
  }, [playState, playSample, stopAudio]);

  /* ── Navigation ── */
  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const onContinue = useCallback(async () => {
    console.log("[onboarding/voice] Continue clicked — pre-grant mic");
    stopAudio();
    localStorage.setItem(STORAGE_KEY, previewed.id);
    localStorage.setItem(VOICE_KEY, previewed.voiceId);
    // Pre-grant mic permission while we still have a fresh user
    // gesture. /onboarding/name auto-starts the live agent on mount;
    // without this the browser blocks the mic request and the agent
    // can't speak until the user taps the floating widget.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      stream.getTracks().forEach((t) => t.stop());
      console.log("[onboarding/voice] mic pre-grant succeeded");
    } catch (err) {
      console.warn(
        "[onboarding/voice] mic pre-grant failed:",
        err,
      );
    }
    router.push("/onboarding/name");
  }, [previewed.id, previewed.voiceId, router, stopAudio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === " ") {
        e.preventDefault();
        toggleListen();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, toggleListen, onContinue]);

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <OnboardingFrame step={1} totalSteps={3} bloomTint={accent}>
      <div className="relative min-h-[calc(100vh-120px)] px-10 sm:px-14 py-10 flex flex-col items-center justify-center overflow-hidden">
        {/* LiquidAurora now lives on the shared onboarding provider
            (apps/app/src/lib/onboarding-agent.tsx) so every act gets
            the same purple morphing backdrop. Keyed to the saved
            personality accent — defaults to maven's purple until the
            user picks. */}

        <div className="relative w-full max-w-[1440px] flex flex-col gap-10">
          {/* Eyebrow removed 2026-06-24 per `feedback_never_use_eyebrows.md`.
              Step context lives in OnboardingFrame chrome (top-left "01 / 03"
              counter + hairline progress bar) — not above the headline. */}

          {/* Hero — on mobile stack ORB FIRST (the interaction the page
              centers on), then the headline + Continue below it.
              On lg+: asymmetric editorial spread (type LEFT, orb RIGHT).
              Grid template only applies at lg+ so mobile naturally
              flows in a single column with reversed flex order. */}
          <div className="flex flex-col-reverse items-center gap-6 lg:grid lg:items-center lg:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {/* LEFT — static voice-pick hero + Continue.
                Mobile: center-aligned (single column composition).
                Lg+: left-aligned within the asymmetric grid column. */}
            <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
              <motion.div
                initial={
                  reduced
                    ? false
                    : { opacity: 0, y: 14, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.55,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="w-full"
              >
                <h1
                  style={{
                    // 2026-06-26: capped to product-UI hero scale (max
                    // 52px) per `feedback_hero_scale_max_60px.md` — prior
                    // 104px was editorial-magazine scale, read as "AI
                    // splash" not premium product. Linear/Vercel/Stripe
                    // product hero sits 48-60px. Restraint = premium.
                    fontSize: "clamp(1.875rem, 3.5vw, 3.25rem)",
                    fontWeight: 600,
                    lineHeight: 1.0,
                    letterSpacing: "-0.03em",
                    color: "rgba(245,240,230,0.98)",
                  }}
                >
                  Pick your voice
                </h1>
                <p
                  className="mt-5"
                  style={{
                    fontSize: "clamp(1rem, 1.35vw, 1.1875rem)",
                    lineHeight: 1.45,
                    letterSpacing: "-0.005em",
                    color: "rgba(245,240,230,0.55)",
                  }}
                >
                  Tap the orb to hear it.
                </p>
              </motion.div>

              {/* Continue — neutral copy (no voice/agent name yet —
                  the user picks a name on the next page). Locked
                  voices route to /studio/plans instead of advancing. */}
              {VOICE_INFO[previewed.id].isLocked ? (
                <ContinueButton
                  onClick={openPricing}
                  className="mt-10"
                >
                  Unlock with Premium
                  <span aria-hidden style={{ marginLeft: "0.6em" }}>
                    →
                  </span>
                </ContinueButton>
              ) : (
                <ContinueButton onClick={onContinue} className="mt-10">
                  Continue
                  <span aria-hidden style={{ marginLeft: "0.6em" }}>
                    →
                  </span>
                </ContinueButton>
              )}
            </div>

            {/* RIGHT — orb carousel + nav arrows.
                Mobile: only the central orb is visible (ghost side orbs
                hidden via the lg:visible/lg:opacity-100 classes inside
                OrbCarousel). Nav arrows render BELOW the orb in a row.
                Desktop: full carousel (prev / current / next) with arrows
                flanking left + right of the 660px container. */}
            <div className="relative flex flex-col items-center w-full" style={{ gap: 14 }}>
              <div
                className="relative flex items-center justify-center origin-center w-[300px] h-[300px] lg:w-[660px] lg:h-[320px]"
              >
                <GlassNavArrow
                  direction="left"
                  accent={accent}
                  onClick={goPrev}
                  style={{
                    position: "absolute",
                    left: -28,
                    zIndex: 20,
                  }}
                  className="hidden lg:grid"
                />
                <OrbCarousel
                  currentIndex={index}
                  setIndex={setIndex}
                  playState={playState}
                  progressRatio={progressRatio}
                  onTogglePlay={toggleListen}
                  onLockedSideClick={openPricing}
                />
                <GlassNavArrow
                  direction="right"
                  accent={accent}
                  onClick={goNext}
                  style={{ position: "absolute", right: -28, zIndex: 20 }}
                  className="hidden lg:grid"
                />
              </div>
              {/* Mobile-only inline nav row below the orb. Lg+ uses the
                  flanking arrows inside the carousel container instead. */}
              <div className="flex items-center lg:hidden" style={{ gap: 20 }}>
                <GlassNavArrow
                  direction="left"
                  accent={accent}
                  onClick={goPrev}
                />
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    letterSpacing: "0.14em",
                    color: "rgba(245,240,230,0.55)",
                  }}
                >
                  {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
                <GlassNavArrow
                  direction="right"
                  accent={accent}
                  onClick={goNext}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </OnboardingFrame>
  );
}

/* ============================================================
 * GlassPlayButton — premium frosted-glass disc that is the voice
 * interaction. Press to hear. While playing, a thin accent arc
 * traces the circumference as a progress indicator.
 * ============================================================ */
function GlassPlayButton({
  state,
  progressRatio,
  accent,
  onToggle,
  interactive = true,
}: {
  state: PlayState;
  progressRatio: number;
  accent: string;
  onToggle: () => void;
  /** When false, the button renders as a quiet glass orb (no play
   *  icon, no progress arc, no pulse rings). Used for side orbs in
   *  the carousel which act as navigation targets only. */
  interactive?: boolean;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const isPlaying = interactive && state === "playing";
  const isLoading = interactive && state === "loading";
  const isError = interactive && state === "error";
  const size = 300;
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      disabled={isError}
      whileHover={
        reduced || isError
          ? undefined
          : {
              scale: 1.035,
              y: -3,
            }
      }
      whileTap={isError ? undefined : { scale: 0.97, y: 0 }}
      transition={{
        scale: { type: "spring", stiffness: 240, damping: 22, mass: 0.9 },
        y: { type: "spring", stiffness: 240, damping: 22, mass: 0.9 },
      }}
      className="relative grid place-items-center group disabled:cursor-not-allowed"
      style={{ width: size, height: size }}
      aria-label={isPlaying ? "Stop voice sample" : "Play voice sample"}
    >
      {/* Outer atmospheric glow halo — grows on hover */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -80,
          background: `radial-gradient(circle, ${accent}30 0%, ${accent}08 35%, transparent 65%)`,
          filter: "blur(30px)",
        }}
        animate={{
          opacity: hovered
            ? 1
            : isPlaying
              ? [0.7, 1, 0.7]
              : reduced
                ? 0.5
                : [0.45, 0.65, 0.45],
          scale: hovered ? 1.15 : 1,
        }}
        transition={
          hovered
            ? {
                opacity: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] },
                scale: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] },
              }
            : {
                duration: isPlaying ? 1.6 : 4,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />

      {/* Idle breathing ring — appears only on hover */}
      {!reduced && hovered && !isPlaying && (
        <motion.div
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -8,
            border: `1px solid ${accent}55`,
          }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: [0, 0.7, 0], scale: [0.96, 1.08, 1.16] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Pulse ring when playing */}
      {isPlaying && !reduced && (
        <>
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: 0,
                border: `1px solid ${accent}66`,
              }}
              animate={{ scale: [1, 1.18, 1.32], opacity: [0.55, 0.18, 0] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Glass body */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${accent}12 100%)`,
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
        animate={{
          borderColor: hovered
            ? "rgba(255,255,255,0.28)"
            : "rgba(255,255,255,0.14)",
          boxShadow: hovered
            ? [
                "inset 0 1px 0 rgba(255,255,255,0.32)",
                `inset 0 -2px 22px ${accent}55`,
                "0 30px 90px -12px rgba(0,0,0,0.7)",
                `0 0 120px -8px ${accent}aa`,
              ].join(", ")
            : [
                "inset 0 1px 0 rgba(255,255,255,0.22)",
                `inset 0 -2px 16px ${accent}33`,
                "0 24px 70px -12px rgba(0,0,0,0.6)",
                `0 0 90px -12px ${accent}66`,
              ].join(", "),
        }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        initial={false}
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      />

      {/* Specular highlight — top-left soft glint, brightens on hover */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "8%",
          left: "12%",
          width: "52%",
          height: "32%",
          borderRadius: "50%",
          filter: "blur(10px)",
        }}
        animate={{
          background: hovered
            ? "radial-gradient(ellipse, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 70%)"
            : "radial-gradient(ellipse, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)",
        }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      />

      {/* Bottom accent reflection — color bleeding up from below,
          intensifies on hover */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: "8%",
          left: "20%",
          width: "60%",
          height: "30%",
          borderRadius: "50%",
          filter: "blur(14px)",
        }}
        animate={{
          background: hovered
            ? `radial-gradient(ellipse, ${accent}55 0%, transparent 70%)`
            : `radial-gradient(ellipse, ${accent}30 0%, transparent 70%)`,
        }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      />

      {/* Progress arc — traces circumference while playing */}
      {(isPlaying || isLoading) && (
        <svg
          aria-hidden
          className="absolute inset-0 -rotate-90 pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`${accent}1f`}
            strokeWidth="1.5"
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference * (1 - progressRatio),
            }}
            transition={{ duration: 0.12, ease: "linear" }}
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
          />
        </svg>
      )}

      {/* Center icon — refined geometry, accent glow.
          Hidden when the orb is a non-interactive side preview. */}
      {interactive && (
        <motion.div
          className="relative"
          animate={{
            opacity: hovered ? 1 : 0.78,
            scale: hovered ? 1.06 : 1,
          }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {isLoading ? (
            <Spinner size={52} accent={accent} />
          ) : isPlaying ? (
            <StopIcon size={40} accent={accent} />
          ) : (
            <PlayIcon size={54} accent={accent} />
          )}
        </motion.div>
      )}
    </motion.button>
  );
}

/* ============================================================
 * OrbCarousel — prev / current / next glass orbs visible at once.
 * Smooth spring transitions; side orbs are blurred + reduced-
 * opacity ghosts in their own personality's accent color.
 *
 * Lock behavior: voices that are isLocked in VOICE_INFO render a
 * glass lock badge centered on their orb. Tapping a locked SIDE
 * orb routes to /studio/plans (the user is asking to upgrade);
 * tapping a locked CURRENT orb is handled by the Continue button
 * below the orb (which becomes "Unlock {voice} →").
 *
 * The current orb (free or locked) still plays its sample on tap.
 * ============================================================ */
function OrbCarousel({
  currentIndex,
  setIndex,
  playState,
  progressRatio,
  onTogglePlay,
  onLockedSideClick,
}: {
  currentIndex: number;
  setIndex: (i: number) => void;
  playState: PlayState;
  progressRatio: number;
  onTogglePlay: () => void;
  onLockedSideClick: () => void;
}) {
  const total = PERSONALITIES.length;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 660, height: 320 }}
    >
      {PERSONALITIES.map((p, i) => {
        const diff = ((i - currentIndex) % total + total) % total;
        const isCurrent = diff === 0;
        const isNext = diff === 1;
        const isPrev = diff === total - 1;
        const isLocked = VOICE_INFO[p.id].isLocked;

        let x = 0;
        let scale = 1;
        let opacity = 1;
        let blur = 0;
        let z = 3;

        if (!isCurrent) {
          if (isNext) {
            x = 215;
            scale = 0.62;
            opacity = 0.55;
            blur = 3;
            z = 2;
          } else if (isPrev) {
            x = -215;
            scale = 0.62;
            opacity = 0.55;
            blur = 3;
            z = 2;
          } else {
            // far / opposite — hidden behind
            x = 0;
            scale = 0.4;
            opacity = 0;
            blur = 16;
            z = 1;
          }
        }

        return (
          <motion.div
            key={p.id}
            // Side ghost orbs hidden on mobile (only the current orb
            // shows + the inline nav arrow row handles switching).
            // Lg+: all three render as the carousel.
            className={`absolute ${
              isCurrent ? "" : "hidden lg:block"
            }`}
            animate={{ x, scale, opacity, filter: `blur(${blur}px)` }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 28,
              mass: 1.1,
            }}
            style={{ zIndex: z }}
          >
            <div className="relative">
              <GlassPlayButton
                state={isCurrent ? playState : "idle"}
                progressRatio={isCurrent ? progressRatio : 0}
                accent={p.accent}
                interactive={isCurrent && !isLocked}
                onToggle={() => {
                  if (!isCurrent) {
                    // Side orb — either navigate (free) or upsell (locked)
                    if (isLocked) onLockedSideClick();
                    else setIndex(i);
                    return;
                  }
                  // Current orb — play / stop voice sample
                  if (!isLocked) onTogglePlay();
                  // If current AND locked, the Continue button below
                  // handles the upgrade CTA; tapping the orb is a no-op.
                }}
              />
              {/* Glass lock badge overlay — centered on locked orbs */}
              {isLocked && <LockBadge accent={p.accent} />}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================
 * LockBadge — small frosted-glass disc centered on a locked orb.
 * Lock SVG inside, accent rim tint to match the voice's color
 * family. Reads as "premium — tap to upgrade."
 * ============================================================ */
function LockBadge({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none grid place-items-center rounded-full"
      style={{
        width: 64,
        height: 64,
        top: "50%",
        left: "50%",
        marginTop: -32,
        marginLeft: -32,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${accent}66`,
        boxShadow: `0 0 24px -6px ${accent}77, inset 0 1px 0 rgba(255,255,255,0.16)`,
      }}
    >
      <svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(245,240,230,0.92)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${accent}aa)` }}
      >
        <rect x="4.5" y="11" width="15" height="9.5" rx="2" />
        <path d="M7.5 11V7a4.5 4.5 0 1 1 9 0v4" />
      </svg>
    </div>
  );
}

/* ============================================================
 * GlassNavArrow — small frosted-glass disc flanking the carousel.
 * Mirrors the language of the main glass play button (linear
 * gradient + backdrop blur + accent rim) at a quieter scale so it
 * reads as supplementary navigation, not a competing CTA.
 * ============================================================ */
function GlassNavArrow({
  direction,
  accent,
  onClick,
  style,
  className,
}: {
  direction: "left" | "right";
  accent: string;
  onClick: () => void;
  style?: React.CSSProperties;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.92 }}
      whileHover={reduced ? undefined : { scale: 1.08, y: -1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`grid place-items-center rounded-full ${className ?? ""}`}
      style={{
        width: 46,
        height: 46,
        background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${accent}10 100%)`,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: hovered
          ? `1px solid ${accent}aa`
          : "1px solid rgba(255,255,255,0.16)",
        boxShadow: hovered
          ? `0 0 26px -4px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.22)`
          : "inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 24px -8px rgba(0,0,0,0.5)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        ...style,
      }}
      aria-label={direction === "left" ? "Previous agent" : "Next agent"}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        style={{
          color: "rgba(245,240,230,0.85)",
          transform: direction === "left" ? "rotate(180deg)" : "none",
          filter: hovered ? `drop-shadow(0 0 6px ${accent}aa)` : "none",
          transition: "filter 0.3s ease",
        }}
      >
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}

// Refined play triangle — thin outlined glyph (rounded vertices)
// rather than a solid white slab. Soft accent drop-shadow gives it
// depth without screaming "playback button".
function PlayIcon({ size, accent }: { size: number; accent: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="rgba(245,240,230,0.92)"
      aria-hidden
      style={{
        filter: `drop-shadow(0 0 12px ${accent}66) drop-shadow(0 2px 6px rgba(0,0,0,0.5))`,
        marginLeft: 3,
      }}
    >
      <path
        d="M8.2 5.4c0-1 1.1-1.7 2-1.1l9.2 6.5c.8.5.8 1.7 0 2.3l-9.2 6.5c-.9.6-2-.1-2-1.1V5.4z"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
function StopIcon({ size, accent }: { size: number; accent: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="rgba(245,240,230,0.92)"
      aria-hidden
      style={{
        filter: `drop-shadow(0 0 12px ${accent}66) drop-shadow(0 2px 6px rgba(0,0,0,0.5))`,
      }}
    >
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </svg>
  );
}
function Spinner({ size, accent }: { size: number; accent: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={accent}
        strokeOpacity="0.3"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

