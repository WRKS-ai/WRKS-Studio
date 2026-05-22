"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { SIGN_UP_URL } from "@/lib/urls";
import { Button } from "./button";

type Tone = "violet" | "sky" | "emerald" | "rose" | "amber";

type Prompt = {
  id: string;
  text: string;
  hint: string;
  statusLabel: string;
  statusTone: Tone;
  view: ReactNode;
  speech: string;
};

const PROMPTS: Prompt[] = [
  {
    id: "march",
    text: "20% promo for March, all channels",
    hint: "Social · Site banner · Code",
    statusLabel: "Drafting",
    statusTone: "violet",
    view: <MarchView />,
    speech:
      "Got it. Building your March promo. Instagram post, site banner, and a discount code. Done in three seconds.",
  },
  {
    id: "latte",
    text: "Friday post about the new latte menu",
    hint: "Instagram · Story tile",
    statusLabel: "Scheduled",
    statusTone: "rose",
    view: <LatteView />,
    speech:
      "Scheduling your Friday latte post. Drafting the post and the story tile, all in your brand voice. All set.",
  },
  {
    id: "blackfriday",
    text: "Black Friday landing page for the gift card",
    hint: "Page · Stripe · Lead form",
    statusLabel: "Deploying",
    statusTone: "sky",
    view: <BlackFridayView />,
    speech:
      "Building your Black Friday landing page. Stripe checkout embedded, lead form forwarding to your CRM. Ready to publish.",
  },
];

const VOICE_STORAGE_KEY = "wrks-nova-voice-on";

function pickNovaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred = [
    /samantha/i,
    /aria/i,
    /natural female/i,
    /jenny/i,
    /female.*english/i,
    /google.*us english/i,
    /allison/i,
    /serena/i,
  ];
  for (const re of preferred) {
    const v = voices.find((vv) => vv.lang.startsWith("en") && re.test(vv.name));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

/* SpeechRecognition (browser STT) */

type MinRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((e: {
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal: boolean }
        >;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onstart: (() => void) | null;
};

function createRecognition(): MinRecognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => MinRecognition;
    webkitSpeechRecognition?: new () => MinRecognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  return rec;
}

function isRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

function resolvePromptIdx(text: string): number {
  const t = text.toLowerCase();
  if (
    t.includes("march") ||
    t.includes("promo") ||
    t.includes("discount") ||
    t.includes("20%") ||
    t.includes("sale")
  )
    return 0;
  if (
    t.includes("latte") ||
    t.includes("coffee") ||
    t.includes("friday") ||
    t.includes("schedul") ||
    t.includes("post about")
  )
    return 1;
  if (
    t.includes("black friday") ||
    t.includes("landing") ||
    t.includes("gift card") ||
    t.includes("page") ||
    t.includes("checkout")
  )
    return 2;
  return 0;
}

/* ============================================================
 * Section
 * ============================================================ */

type Stage = "idle" | "listening" | "responding";

export function Nova() {
  const [stage, setStage] = useState<Stage>("idle");
  const [activeIdx, setActiveIdx] = useState(0);
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [submittedText, setSubmittedText] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<MinRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setMicSupported(isRecognitionSupported());
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(VOICE_STORAGE_KEY);
      if (saved === "0") setVoiceOn(false);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!voiceOn) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickNovaVoice();
      if (voice) utter.voice = voice;
      utter.rate = 1.02;
      utter.pitch = 1.05;
      utter.volume = 1;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [voiceOn],
  );

  const toggleVoice = useCallback(() => {
    setVoiceOn((on) => {
      const next = !on;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(VOICE_STORAGE_KEY, next ? "1" : "0");
      }
      if (!next) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  const respondTo = useCallback(
    (text: string) => {
      stopSpeech();
      const idx = resolvePromptIdx(text);
      setActiveIdx(idx);
      setSubmittedText(text);
      setStage("responding");
      const p = PROMPTS[idx];
      if (p) speak(p.speech);
    },
    [speak, stopSpeech],
  );

  const onPick = (i: number) => {
    const p = PROMPTS[i];
    if (!p) return;
    setActiveIdx(i);
    setSubmittedText(null);
    setStage("responding");
    stopSpeech();
    speak(p.speech);
  };

  const onSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    respondTo(text);
  };

  const onReset = () => {
    stopSpeech();
    recognitionRef.current?.abort();
    setStage("idle");
    setSubmittedText(null);
    setInput("");
    setTranscript("");
    setMicError(null);
  };

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (!isRecognitionSupported()) {
      setMicError("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    const rec = createRecognition();
    if (!rec) return;
    recognitionRef.current = rec;
    finalTranscriptRef.current = "";
    setTranscript("");
    setMicError(null);

    rec.onstart = () => setStage("listening");
    rec.onresult = (e) => {
      let interim = "";
      let finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i]!;
        const alt = res[0]!;
        if (res.isFinal) finalText += alt.transcript;
        else interim += alt.transcript;
      }
      finalTranscriptRef.current = (finalTranscriptRef.current + finalText).trim();
      setTranscript((finalTranscriptRef.current + " " + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicError("Microphone blocked. Enable it to talk to Nova.");
      } else if (e.error === "no-speech") {
        setMicError("Didn't catch that — try again.");
      } else if (e.error !== "aborted") {
        setMicError("Voice input hit a snag. Try again.");
      }
      setStage("idle");
    };
    rec.onend = () => {
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        respondTo(finalText);
      } else {
        setStage("idle");
      }
    };

    try {
      rec.start();
    } catch {
      rec.abort();
      setStage("idle");
    }
  }, [respondTo]);

  const orbToggle = () => {
    if (stage === "listening") {
      stopListening();
    } else if (stage === "responding") {
      onReset();
    } else {
      startListening();
    }
  };

  return (
    <section
      id="nova"
      className="relative py-[60px] sm:py-[140px] px-6 lg:px-8"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.012)",
      }}
    >
      <div className="relative max-w-screen-xl mx-auto">
        <div className="text-center mb-20 sm:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.22em] uppercase text-ink-dim font-sans font-medium mb-6"
          >
            <span className="size-1 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />
            Try Nova
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-serif font-medium tracking-tight leading-[1.02] max-w-3xl mx-auto text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            Speak it.{" "}
            <span className="italic text-ink-muted">See it built.</span>
          </motion.h2>
        </div>

        {/* Mobile-only: heading + lede sits above the orb */}
        <div className="lg:hidden mb-8">
          <h3 className="font-serif font-medium tracking-tight leading-tight text-[clamp(1.5rem,2.5vw,2rem)] mb-4">
            Talk to Nova.
          </h3>
          <p className="text-[16px] text-ink-muted leading-[1.55] max-w-md">
            Tap the orb and describe what you need — or pick one of these to
            see her build it live. She&rsquo;ll talk back.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-center">
          {/* LEFT — talk-to-Nova guidance (order-2 on mobile so orb appears first) */}
          <div className="order-2 lg:order-1">
            {/* Desktop-only: heading + lede inside the left column */}
            <div className="hidden lg:block">
              <h3 className="font-serif font-medium tracking-tight leading-tight text-[clamp(1.5rem,2.5vw,2rem)] mb-4">
                Talk to Nova.
              </h3>
              <p className="text-[16px] text-ink-muted leading-[1.55] max-w-md mb-8">
                Tap the orb and describe what you need — or pick one of these to
                see her build it live. She&rsquo;ll talk back.
              </p>
            </div>

            <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono mb-3">
              Try saying
            </div>
            <div className="space-y-2 mb-6">
              {PROMPTS.map((p, i) => {
                const isActive =
                  stage === "responding" && i === activeIdx && !submittedText;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPick(i)}
                    className="relative w-full text-left rounded-2xl px-4 py-3.5 transition-all duration-300"
                    style={{
                      background: isActive
                        ? "rgba(167,139,250,0.06)"
                        : "rgba(255,255,255,0.02)",
                      border: isActive
                        ? "1px solid rgba(167,139,250,0.4)"
                        : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 text-[9px] font-mono tracking-[0.22em] uppercase shrink-0"
                        style={{
                          color: isActive
                            ? "rgba(167,139,250,0.95)"
                            : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-serif italic transition-colors duration-300"
                          style={{
                            fontSize: "clamp(0.95rem, 1.3vw, 1.05rem)",
                            color: isActive
                              ? "rgb(243 244 246)"
                              : "rgba(255,255,255,0.62)",
                            lineHeight: 1.35,
                          }}
                        >
                          &ldquo;{p.text}&rdquo;
                        </div>
                        <div className="mt-1 text-[9px] font-mono text-white/35">
                          {p.hint}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <form onSubmit={onSubmit} className="relative mb-4">
              <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono mb-2.5">
                Or type your own
              </div>
              <div
                className="relative flex items-center rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell Nova what to make…"
                  className="flex-1 bg-transparent h-11 px-4 outline-none text-[14px] font-sans text-ink placeholder:text-ink-dim min-w-0"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-8 mr-1.5 px-3.5 rounded-xl bg-ink text-canvas text-[12px] font-sans font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  Build
                  <span aria-hidden>→</span>
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 mb-8">
              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={voiceOn}
                className={`group relative h-7 pl-2 pr-3 rounded-full border text-[10px] tracking-[0.18em] uppercase font-sans flex items-center gap-1.5 transition-colors ${
                  voiceOn
                    ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
                    : "border-white/[0.12] bg-white/[0.02] text-ink-muted hover:text-ink hover:border-white/[0.25]"
                }`}
              >
                <span className="relative flex items-center justify-center size-4">
                  {voiceOn ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5L6 9H3v6h3l5 4V5z" />
                      <path d="M15.5 8.5a4 4 0 0 1 0 7" />
                      <path d="M18 6a8 8 0 0 1 0 12" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5L6 9H3v6h3l5 4V5z" />
                      <path d="M22 9l-6 6" />
                      <path d="M16 9l6 6" />
                    </svg>
                  )}
                  {isSpeaking && voiceOn && (
                    <span className="absolute -inset-1 rounded-full border border-emerald-300/40 animate-ping" />
                  )}
                </span>
                {voiceOn ? (isSpeaking ? "Speaking…" : "Voice on") : "Muted"}
              </button>

              {stage !== "idle" && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-[10px] tracking-[0.18em] uppercase text-ink-muted hover:text-ink font-sans flex items-center gap-1 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <path d="M3 3v6h6" />
                  </svg>
                  Try another
                </button>
              )}
            </div>

            {micError && (
              <div className="mb-4 text-[10px] tracking-[0.18em] uppercase text-rose-300/90 font-sans">
                {micError}
              </div>
            )}

            <Button variant="primary" size="md" withArrow href={SIGN_UP_URL}>
              Get started
            </Button>
          </div>

          {/* RIGHT — orb or app frame depending on stage */}
          <div className="order-1 lg:order-2 relative w-full">
            <div
              className="relative w-full rounded-2xl"
              style={{ aspectRatio: "16 / 11" }}
            >
              <AnimatePresence mode="wait">
                {stage === "responding" ? (
                  <motion.div
                    key={`frame-${activeIdx}-${submittedText ?? ""}`}
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -12 }}
                    transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    <NovaFrame
                      statusLabel={PROMPTS[activeIdx]!.statusLabel}
                      statusTone={PROMPTS[activeIdx]!.statusTone}
                      prompt={submittedText ?? PROMPTS[activeIdx]!.text}
                      isUserPrompt={Boolean(submittedText)}
                    >
                      {PROMPTS[activeIdx]!.view}
                    </NovaFrame>
                  </motion.div>
                ) : (
                  <motion.div
                    key="orb"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.06 }}
                    transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <NovaOrb
                      stage={stage}
                      transcript={transcript}
                      micSupported={micSupported}
                      onTap={orbToggle}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * NovaOrb — glowing centerpiece, the speak button
 * ============================================================ */

function NovaOrb({
  stage,
  transcript,
  micSupported,
  onTap,
}: {
  stage: Stage;
  transcript: string;
  micSupported: boolean;
  onTap: () => void;
}) {
  const isListening = stage === "listening";

  // Violet → sky palette (matches MagicRings in hero)
  const orbGradient = isListening
    ? "radial-gradient(circle at 32% 28%, #ffffff 0%, #fce7f3 22%, #f0abfc 50%, #c084fc 80%, #6d28d9 100%)"
    : "radial-gradient(circle at 32% 28%, #ffffff 0%, #dbeafe 22%, #a78bfa 55%, #7c6df2 80%, #38bdf8 100%)";
  const orbShadow = isListening
    ? "0 0 80px 8px rgba(217,70,239,0.45), 0 0 140px 30px rgba(167,139,250,0.18), inset 0 -28px 56px rgba(76,29,149,0.55)"
    : "0 0 80px 8px rgba(167,139,250,0.4), 0 0 140px 30px rgba(56,189,248,0.18), inset 0 -28px 56px rgba(49,46,129,0.55)";
  const ringColor = isListening
    ? "rgba(232,121,249,0.32)"
    : "rgba(167,139,250,0.32)";
  const haloBg = isListening
    ? "radial-gradient(circle, rgba(217,70,239,0.28) 0%, rgba(167,139,250,0.18) 40%, transparent 70%)"
    : "radial-gradient(circle, rgba(167,139,250,0.28) 0%, rgba(56,189,248,0.18) 40%, transparent 70%)";

  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      {/* Halo — soft ambient glow */}
      <motion.div
        className="absolute size-[420px] sm:size-[520px] rounded-full pointer-events-none"
        style={{ background: haloBg, filter: "blur(36px)" }}
        animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.04, 1] }}
        transition={{
          duration: isListening ? 3.2 : 5.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Concentric pulse rings — slow, ambient */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute size-44 sm:size-52 rounded-full pointer-events-none"
          style={{ border: `1px solid ${ringColor}` }}
          animate={{ scale: [0.95, 2.0, 0.95], opacity: [0.55, 0, 0.55] }}
          transition={{
            duration: isListening ? 4.5 : 6.5,
            repeat: Infinity,
            delay: i * (isListening ? 1.5 : 2.2),
            ease: "easeInOut",
          }}
        />
      ))}

      {/* The orb itself */}
      <motion.button
        type="button"
        onClick={onTap}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        animate={{ y: [0, -4, 0] }}
        transition={{
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
        className="relative size-44 sm:size-52 rounded-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 disabled:cursor-default"
        style={{
          background: orbGradient,
          boxShadow: orbShadow,
        }}
        aria-label={
          isListening ? "Stop listening" : "Tap to talk to Nova"
        }
      >
        {/* Inner hairline for definition */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
          }}
        />
        {/* Top-left specular highlight */}
        <span
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: 28,
            height: 28,
            top: 20,
            left: 24,
            filter: "blur(3px)",
            opacity: 0.85,
          }}
        />
        {/* Secondary smaller highlight */}
        <span
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: 10,
            height: 10,
            top: 30,
            left: 38,
            filter: "blur(1px)",
            opacity: 0.95,
          }}
        />
        {/* Mic icon */}
        <div
          className="absolute inset-0 flex items-center justify-center text-white"
          style={{ filter: "drop-shadow(0 2px 8px rgba(30,10,60,0.5))" }}
        >
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
        </div>
      </motion.button>

      {/* Status text + transcript below */}
      <div className="absolute -bottom-12 sm:-bottom-16 left-0 right-0 text-center px-6">
        {isListening ? (
          <>
            <div className="text-[10px] tracking-[0.22em] uppercase text-rose-300/90 font-sans mb-2 flex items-center justify-center gap-1.5">
              <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
              Listening — speak now
            </div>
            <div className="font-serif italic text-base text-white leading-snug min-h-[1.4em] max-w-md mx-auto">
              {transcript || "…"}
            </div>
          </>
        ) : (
          <div className="font-serif italic text-base sm:text-lg text-ink-muted">
            {micSupported ? "Tap to talk to Nova" : "Voice not supported · try a preset"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * NovaFrame — slim WRKS-app shell shown in the responding state
 * ============================================================ */

function NovaFrame({
  statusLabel,
  statusTone,
  prompt,
  isUserPrompt,
  children,
}: {
  statusLabel: string;
  statusTone: Tone;
  prompt: string;
  isUserPrompt: boolean;
  children: ReactNode;
}) {
  const toneClasses = {
    violet: { dot: "bg-violet-400", text: "text-violet-200" },
    sky: { dot: "bg-sky-400", text: "text-sky-200" },
    emerald: { dot: "bg-emerald-400", text: "text-emerald-200" },
    rose: { dot: "bg-rose-400", text: "text-rose-200" },
    amber: { dot: "bg-amber-400", text: "text-amber-200" },
  }[statusTone];

  return (
    <div
      className="relative size-full rounded-2xl overflow-hidden"
      style={{
        background: "#0a0a12",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow:
          "0 40px 100px -30px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-9 flex items-center px-3 gap-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span className="size-2 rounded-full bg-rose-400/60" />
        <span className="size-2 rounded-full bg-amber-400/60" />
        <span className="size-2 rounded-full bg-emerald-400/60" />
        <div className="ml-3 text-[10px] font-mono text-white/45 truncate">
          nova / hannahs-hair
        </div>
        <div
          className={`ml-auto text-[9px] tracking-[0.22em] uppercase ${toneClasses.text} font-sans font-medium flex items-center gap-1.5`}
        >
          <span className={`size-1 rounded-full ${toneClasses.dot} animate-pulse`} />
          {statusLabel}
        </div>
      </div>

      <div
        className="absolute top-9 left-0 right-0 px-4 py-2.5 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="size-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[8px] font-mono font-bold text-white shrink-0">
          {isUserPrompt ? "H" : "N"}
        </div>
        <div className="flex-1 min-w-0 text-[11px] font-serif italic text-white/80 truncate">
          &ldquo;{prompt}&rdquo;
        </div>
        <div className="text-[8px] font-mono text-emerald-300/85 flex items-center gap-1 shrink-0">
          <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
          {isUserPrompt ? "yours · live" : "processing"}
        </div>
      </div>

      <div
        className="absolute left-0 right-0 bottom-0 p-4 sm:p-5"
        style={{ top: "calc(2.25rem + 2.625rem)" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ============================================================
 * Per-prompt views — unchanged
 * ============================================================ */

function MarchView() {
  return (
    <div className="grid grid-cols-3 gap-2.5 size-full">
      <DeliverableTile
        label="Instagram"
        status="Drafted"
        tone="rose"
        delay={0.15}
        body={<InstagramPostMock />}
      />
      <DeliverableTile
        label="Site banner"
        status="Ready"
        tone="sky"
        delay={0.3}
        body={<SiteBannerMock />}
      />
      <DeliverableTile
        label="Promo code"
        status="Approved"
        tone="violet"
        delay={0.45}
        body={<PromoCodeMock />}
      />
    </div>
  );
}

function LatteView() {
  return (
    <div className="grid grid-cols-[2fr_1fr] gap-3 size-full">
      <DeliverableTile
        label="Instagram post"
        status="Scheduled · Fri 9am"
        tone="rose"
        delay={0.15}
        body={<LatteInstagramMock />}
      />
      <DeliverableTile
        label="Story tile"
        status="Queued"
        tone="amber"
        delay={0.3}
        body={<LatteStoryMock />}
      />
    </div>
  );
}

function BlackFridayView() {
  return (
    <div className="grid grid-cols-[3fr_2fr] gap-3 size-full">
      <DeliverableTile
        label="Landing page"
        status="Deploying"
        tone="sky"
        delay={0.15}
        body={<LandingPageMock />}
      />
      <div className="flex flex-col gap-2">
        <DeliverableTile
          label="Stripe"
          status="Embedded"
          tone="violet"
          delay={0.3}
          body={<StripeCheckoutMock />}
        />
        <DeliverableTile
          label="Lead form"
          status="→ HubSpot"
          tone="emerald"
          delay={0.45}
          body={<LeadFormMock />}
        />
      </div>
    </div>
  );
}

/* ============================================================
 * Mini-mockups — real-looking UI fragments so each tile reads
 * as the actual deliverable, not an abstract color block
 * ============================================================ */

function InstagramPostMock() {
  return (
    <div className="size-full rounded-md overflow-hidden bg-[#0a0a0c] flex flex-col">
      {/* IG chrome */}
      <div className="flex items-center gap-1 px-1.5 py-1 border-b border-white/5 shrink-0">
        <div className="size-3 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500 p-[1px]">
          <div className="size-full rounded-full bg-[#0a0a0c]" />
        </div>
        <div className="text-[6px] text-white/85 font-sans tracking-tight truncate">
          hannahshair
        </div>
        <div className="ml-auto flex gap-[2px]">
          <span className="size-[2px] rounded-full bg-white/40" />
          <span className="size-[2px] rounded-full bg-white/40" />
          <span className="size-[2px] rounded-full bg-white/40" />
        </div>
      </div>
      {/* Image */}
      <div
        className="flex-1 relative flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #f472b6 0%, #d946ef 50%, #f59e0b 100%)",
        }}
      >
        <div className="text-center text-white">
          <div className="font-serif italic text-[8px] leading-none mb-0.5 text-white/85">
            spring at
          </div>
          <div className="font-serif font-medium text-[18px] leading-[0.9] tracking-tight">
            20% off
          </div>
          <div className="font-sans text-[6px] tracking-[0.3em] uppercase mt-0.5 text-white/85">
            March only
          </div>
        </div>
      </div>
      {/* Actions */}
      <div className="px-1.5 py-1 flex items-center gap-1.5 border-t border-white/5 shrink-0">
        <Heart />
        <Comment />
        <Send />
        <div className="ml-auto text-[5px] text-white/40 font-mono">2:14</div>
      </div>
    </div>
  );
}

function SiteBannerMock() {
  return (
    <div className="size-full rounded-md overflow-hidden bg-[#0c1424] flex flex-col">
      {/* Browser chrome */}
      <div className="flex items-center gap-[3px] px-1.5 py-1 border-b border-white/5 shrink-0">
        <span className="size-1 rounded-full bg-rose-400/70" />
        <span className="size-1 rounded-full bg-amber-400/70" />
        <span className="size-1 rounded-full bg-emerald-400/70" />
        <div className="ml-1 flex-1 h-2 rounded-sm bg-white/[0.06] flex items-center px-1">
          <span className="text-[5px] text-white/40 font-mono truncate">
            hannahshair.com
          </span>
        </div>
      </div>
      {/* Hero */}
      <div
        className="flex-1 p-2 flex flex-col justify-center"
        style={{
          background:
            "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
        }}
      >
        <div className="font-serif text-white text-[11px] leading-[0.95] tracking-tight">
          Spring promo.
        </div>
        <div className="font-serif italic text-white/80 text-[9px] leading-tight mt-0.5">
          20% off all March.
        </div>
        <div className="mt-1.5 inline-flex items-center self-start gap-1 px-1.5 py-[3px] rounded-full bg-white text-[6px] font-sans font-semibold text-canvas">
          Book now →
        </div>
      </div>
    </div>
  );
}

function PromoCodeMock() {
  return (
    <div
      className="size-full rounded-md p-2 flex flex-col justify-center"
      style={{
        background:
          "linear-gradient(135deg, #1c1330 0%, #2a1f4a 100%)",
        border: "1px dashed rgba(167,139,250,0.45)",
      }}
    >
      <div className="text-[6px] tracking-[0.3em] uppercase text-violet-300/70 font-sans font-medium text-center">
        Promo code
      </div>
      <div
        className="font-mono font-bold text-white text-[16px] tracking-[0.18em] text-center my-1.5"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
      >
        HANNAH20
      </div>
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-[6px] tracking-wider uppercase text-violet-200/65 font-sans">
          20% off
        </span>
        <span className="size-[2px] rounded-full bg-violet-300/30" />
        <span className="text-[6px] tracking-wider uppercase text-violet-200/65 font-sans">
          ends Mar 31
        </span>
      </div>
    </div>
  );
}

function LatteInstagramMock() {
  return (
    <div className="size-full rounded-md overflow-hidden bg-[#0a0a0c] flex flex-col">
      <div className="flex items-center gap-1 px-1.5 py-1 border-b border-white/5 shrink-0">
        <div className="size-3 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500 p-[1px]">
          <div className="size-full rounded-full bg-[#0a0a0c]" />
        </div>
        <div className="text-[6px] text-white/85 font-sans truncate">
          northcafe
        </div>
        <div className="ml-auto text-[5px] text-white/40 font-mono">9:00</div>
      </div>
      <div
        className="flex-1 relative flex flex-col justify-end p-2"
        style={{
          background:
            "linear-gradient(160deg, #fb7185 0%, #b45309 70%, #292524 100%)",
        }}
      >
        {/* coffee cup glyph */}
        <div className="absolute top-1.5 right-2 size-7 rounded-full bg-gradient-to-b from-amber-100 via-amber-200 to-amber-700 opacity-90 border-2 border-amber-50/40" />
        <div className="text-white font-serif italic text-[11px] leading-tight">
          The new menu.
        </div>
        <div className="text-white/80 font-sans text-[7px] tracking-tight mt-0.5">
          Oat cortado · Vanilla matcha · Cold foam.
        </div>
      </div>
      <div className="px-1.5 py-1 flex items-center gap-1.5 border-t border-white/5 shrink-0">
        <Heart />
        <Comment />
        <Send />
      </div>
    </div>
  );
}

function LatteStoryMock() {
  return (
    <div
      className="size-full rounded-md overflow-hidden flex flex-col p-1.5"
      style={{
        background:
          "linear-gradient(180deg, #fbbf24 0%, #c2410c 60%, #44170b 100%)",
      }}
    >
      {/* progress bar */}
      <div className="flex gap-0.5 mb-1">
        <div className="h-[2px] flex-1 rounded-full bg-white" />
        <div className="h-[2px] flex-1 rounded-full bg-white/30" />
        <div className="h-[2px] flex-1 rounded-full bg-white/30" />
      </div>
      <div className="text-white/80 font-sans text-[5px] tracking-[0.22em] uppercase">
        northcafe · story
      </div>
      <div className="flex-1 flex items-center justify-center -mt-1">
        <div className="text-white font-serif italic text-center leading-[0.95] text-[14px]">
          Try the
          <br />
          oat
          <br />
          cortado.
        </div>
      </div>
      <div className="text-center text-white/85 text-[6px] tracking-[0.3em] uppercase">
        swipe up
      </div>
    </div>
  );
}

function LandingPageMock() {
  return (
    <div className="size-full rounded-md overflow-hidden bg-[#0c1424] flex flex-col">
      {/* Browser chrome */}
      <div className="flex items-center gap-[3px] px-1.5 py-1 border-b border-white/5 shrink-0">
        <span className="size-1 rounded-full bg-rose-400/70" />
        <span className="size-1 rounded-full bg-amber-400/70" />
        <span className="size-1 rounded-full bg-emerald-400/70" />
        <div className="ml-1 flex-1 h-2 rounded-sm bg-white/[0.06] flex items-center px-1">
          <span className="text-[5px] text-white/40 font-mono truncate">
            hannahshair.com/black-friday
          </span>
        </div>
      </div>
      {/* Top nav */}
      <div className="px-2 py-1 flex items-center justify-between border-b border-white/[0.04]">
        <span className="text-[6px] font-serif italic text-white/90">Hannah's</span>
        <div className="flex gap-1">
          <span className="text-[5px] text-white/50">Shop</span>
          <span className="text-[5px] text-white/50">About</span>
        </div>
      </div>
      {/* Hero */}
      <div className="px-2 pt-2 pb-1 shrink-0">
        <div className="font-serif text-white text-[12px] leading-[0.95] tracking-tight">
          Black Friday.
        </div>
        <div className="font-serif italic text-white/70 text-[8px] leading-tight">
          Gift cards from $49.
        </div>
      </div>
      {/* Pricing strip */}
      <div className="px-2 mt-1 grid grid-cols-3 gap-1">
        {["$49", "$99", "$249"].map((p, i) => (
          <div
            key={p}
            className="rounded-sm py-1 flex flex-col items-center justify-center border"
            style={{
              borderColor:
                i === 1 ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.08)",
              background:
                i === 1 ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.02)",
            }}
          >
            <div className="text-[8px] font-serif font-medium text-white tracking-tight">
              {p}
            </div>
            <div className="text-[4px] tracking-[0.22em] uppercase text-white/40 mt-[1px]">
              card
            </div>
          </div>
        ))}
      </div>
      {/* CTA */}
      <div className="mt-auto px-2 pb-2 pt-1.5 flex items-center gap-1">
        <div className="h-3.5 flex-1 rounded bg-white text-[6px] flex items-center justify-center font-sans font-semibold text-canvas">
          Buy a card →
        </div>
        <div className="h-3.5 px-1.5 rounded bg-white/10 text-[6px] flex items-center justify-center font-sans text-white/70">
          More
        </div>
      </div>
    </div>
  );
}

function StripeCheckoutMock() {
  return (
    <div className="size-full rounded-md p-1.5 bg-[#0f1530] flex flex-col gap-1 border border-violet-400/15">
      <div className="flex items-center justify-between shrink-0">
        <div className="text-[5px] tracking-[0.3em] uppercase text-violet-200/60 font-sans">
          checkout
        </div>
        <div className="text-[5px] font-mono font-semibold text-violet-200">
          stripe
        </div>
      </div>
      {/* Card field */}
      <div className="rounded-sm bg-white/[0.04] px-1.5 py-1 flex items-center gap-1 border border-white/5">
        <div className="size-2 rounded-[1px] bg-gradient-to-br from-sky-400 to-violet-500" />
        <div className="text-[5px] font-mono text-white/70 tracking-wider">
          •••• 4242
        </div>
        <div className="ml-auto text-[5px] font-mono text-white/40">12/27</div>
      </div>
      {/* Total */}
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[5px] tracking-[0.22em] uppercase text-white/40">
          total
        </span>
        <span className="text-[9px] font-serif font-medium text-white">
          $99.00
        </span>
      </div>
      <div className="h-3 rounded bg-gradient-to-r from-violet-500 to-indigo-500 text-[6px] flex items-center justify-center font-sans font-semibold text-white">
        Pay
      </div>
    </div>
  );
}

function LeadFormMock() {
  return (
    <div className="size-full rounded-md p-1.5 bg-[#0c1f1a] flex flex-col gap-1 border border-emerald-400/15">
      <div className="text-[5px] tracking-[0.3em] uppercase text-emerald-200/60 font-sans shrink-0">
        get on the list
      </div>
      {/* Fields */}
      {[
        { label: "name", value: "Hannah B." },
        { label: "email", value: "hb@cafe.co" },
      ].map((f) => (
        <div
          key={f.label}
          className="rounded-sm bg-white/[0.03] px-1.5 py-[3px] border border-white/5 flex items-center justify-between"
        >
          <span className="text-[4.5px] tracking-[0.22em] uppercase text-white/30 font-sans">
            {f.label}
          </span>
          <span className="text-[5px] font-mono text-white/70">{f.value}</span>
        </div>
      ))}
      <div className="mt-auto h-3 rounded bg-emerald-500/90 text-[6px] flex items-center justify-center font-sans font-semibold text-white">
        Subscribe
      </div>
    </div>
  );
}

/* tiny icons used inside Instagram chrome */
function Heart() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2.2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function Comment() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2.2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function Send() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2.2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function DeliverableTile({
  label,
  status,
  tone,
  body,
  delay = 0,
}: {
  label: string;
  status: string;
  tone: Tone;
  body: ReactNode;
  delay?: number;
}) {
  const ring = {
    violet: "rgba(167,139,250,0.35)",
    sky: "rgba(56,189,248,0.35)",
    emerald: "rgba(52,211,153,0.35)",
    rose: "rgba(244,114,182,0.35)",
    amber: "rgba(252,211,77,0.35)",
  }[tone];

  const labelColor = {
    violet: "text-violet-200",
    sky: "text-sky-200",
    emerald: "text-emerald-200",
    rose: "text-rose-200",
    amber: "text-amber-200",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative rounded-lg overflow-hidden bg-black/40 p-2 flex flex-col h-full min-h-0"
      style={{ border: `1px solid ${ring}` }}
    >
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <span
          className={`text-[7px] tracking-[0.22em] uppercase ${labelColor} font-sans font-medium truncate`}
        >
          {label}
        </span>
        <span className="text-[7px] tracking-[0.18em] uppercase text-emerald-300/85 font-sans whitespace-nowrap shrink-0">
          {status}
        </span>
      </div>
      <div className="flex-1 min-h-0">{body}</div>
    </motion.div>
  );
}
