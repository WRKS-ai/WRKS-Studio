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

const CYCLE_MS = 6500;

/* ============================================================
 * SpeechRecognition (browser STT) — minimal typing
 * ============================================================ */

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

/* Keyword router → returns prompt index */
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

export function Nova() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [input, setInput] = useState("");
  const [submittedText, setSubmittedText] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<MinRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setMicSupported(isRecognitionSupported());
    // Hydrate voice preference + warm up the voice list
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

  useEffect(() => {
    if (paused || hasInteracted) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % PROMPTS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [paused, hasInteracted]);

  const active = PROMPTS[activeIdx]!;

  const onPick = (i: number) => {
    stopSpeech();
    setActiveIdx(i);
    setHasInteracted(true);
    setSubmittedText(null);
    const p = PROMPTS[i];
    if (p) speak(p.speech);
  };

  const onSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    stopSpeech();
    const idx = resolvePromptIdx(text);
    setActiveIdx(idx);
    setSubmittedText(text);
    setHasInteracted(true);
    const p = PROMPTS[idx];
    if (p) speak(p.speech);
  };

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
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
    setInput("");
    setMicError(null);

    rec.onstart = () => setIsListening(true);
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
      setInput((finalTranscriptRef.current + " " + interim).trim());
    };
    rec.onerror = (e) => {
      setIsListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicError("Microphone blocked. Enable it to talk to Nova.");
      } else if (e.error === "no-speech") {
        setMicError("Didn't catch that — try again.");
      } else if (e.error !== "aborted") {
        setMicError("Voice input hit a snag. Try again.");
      }
    };
    rec.onend = () => {
      setIsListening(false);
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        const idx = resolvePromptIdx(finalText);
        setActiveIdx(idx);
        setSubmittedText(finalText);
        setHasInteracted(true);
        const p = PROMPTS[idx];
        if (p) speak(p.speech);
      }
    };

    try {
      rec.start();
    } catch {
      rec.abort();
      setIsListening(false);
    }
  }, [speak]);

  return (
    <section
      id="nova"
      className="relative py-32 sm:py-40 px-6 lg:px-8"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.012)",
      }}
    >
      <div className="relative max-w-screen-xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
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
            Speak it. {" "}
            <span className="italic text-ink-muted">See it built.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="mt-6 text-[18px] text-ink-muted leading-[1.55] max-w-2xl mx-auto"
          >
            Tap the mic, type something, or pick a prompt. Watch Nova ship the
            page, the post, the code — live.
          </motion.p>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 lg:gap-12 items-start"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* LEFT — input + prompt suggestions */}
          <div>
            {/* Voice toggle pill */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
                Talk to Nova
              </div>
              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={voiceOn}
                aria-label={voiceOn ? "Mute Nova's voice" : "Enable Nova's voice"}
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
            </div>

            {/* Talk to Nova input */}
            <form onSubmit={onSubmit} className="relative">
              <div
                className="relative flex items-center rounded-2xl transition-all duration-300"
                style={{
                  background: isListening
                    ? "rgba(244,114,182,0.05)"
                    : "rgba(255,255,255,0.02)",
                  border: isListening
                    ? "1px solid rgba(244,114,182,0.45)"
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isListening
                    ? "0 0 32px -8px rgba(244,114,182,0.5), inset 0 1px 0 rgba(255,255,255,0.04)"
                    : "inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                {micSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? "Stop listening" : "Talk to Nova"}
                    className="relative size-10 ml-1.5 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      background: isListening ? "#f43f5e" : "rgba(255,255,255,0.04)",
                      color: "white",
                    }}
                  >
                    {isListening && (
                      <>
                        <span className="absolute inset-0 rounded-xl bg-rose-500/40 animate-ping" />
                        <span className="absolute -inset-1 rounded-xl border border-rose-400/40 animate-pulse" />
                      </>
                    )}
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="relative"
                    >
                      <rect x="9" y="3" width="6" height="12" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0" />
                      <path d="M12 18v3" />
                    </svg>
                  </button>
                )}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? "Listening… speak now"
                      : micSupported
                        ? "Tap the mic or tell Nova what to make…"
                        : "Tell Nova what to make…"
                  }
                  className="flex-1 bg-transparent h-12 px-3 outline-none text-[15px] font-sans text-ink placeholder:text-ink-dim min-w-0"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isListening}
                  className="h-9 mr-1.5 px-4 rounded-xl bg-ink text-canvas text-[13px] font-sans font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  Build it
                  <span aria-hidden>→</span>
                </button>
              </div>
              {micError && (
                <div className="mt-2 text-[10px] tracking-[0.18em] uppercase text-rose-300/90 font-sans">
                  {micError}
                </div>
              )}
            </form>

            {/* Preset prompts */}
            <div className="mt-7">
              <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono mb-3">
                Or try a preset
              </div>
              <div className="space-y-2">
                {PROMPTS.map((p, i) => {
                  const isActive = i === activeIdx;
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
                        boxShadow: isActive
                          ? "0 8px 24px -10px rgba(167,139,250,0.35)"
                          : "none",
                      }}
                    >
                      {isActive && !paused && !hasInteracted && (
                        <motion.div
                          key={activeIdx}
                          className="absolute bottom-0 left-0 h-px rounded-b-2xl"
                          style={{
                            background:
                              "linear-gradient(90deg, #a78bfa 0%, #38bdf8 100%)",
                          }}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: CYCLE_MS / 1000,
                            ease: "linear",
                          }}
                        />
                      )}
                      <div className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 text-[9px] font-mono tracking-[0.22em] uppercase shrink-0 transition-colors duration-300"
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
                                : "rgba(255,255,255,0.55)",
                              lineHeight: 1.35,
                            }}
                          >
                            &ldquo;{p.text}&rdquo;
                          </div>
                          <div
                            className="mt-1 text-[9px] font-mono transition-colors duration-300"
                            style={{
                              color: isActive
                                ? "rgba(255,255,255,0.5)"
                                : "rgba(255,255,255,0.3)",
                            }}
                          >
                            {p.hint}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6">
              <Button variant="primary" size="md" withArrow href="#waitlist">
                Get the real thing
              </Button>
            </div>
          </div>

          {/* RIGHT — app frame mockup */}
          <div className="relative w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${active.id}-${submittedText ?? ""}`}
                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.985 }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <NovaFrame
                  statusLabel={active.statusLabel}
                  statusTone={active.statusTone}
                  prompt={submittedText ?? active.text}
                  isUserPrompt={Boolean(submittedText)}
                >
                  {active.view}
                </NovaFrame>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Nova app frame — slimmed-down WRKS-app shell
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
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "#0a0a12",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow:
          "0 40px 100px -30px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        aspectRatio: "16 / 11",
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
 * View 1 — March promo (3 deliverables: social, banner, code)
 * ============================================================ */

function MarchView() {
  return (
    <div className="grid grid-cols-3 gap-2.5 size-full">
      <DeliverableTile
        label="Instagram"
        status="Drafted"
        tone="rose"
        delay={0.15}
        body={
          <div
            className="size-full rounded-md relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #f472b6 0%, #d946ef 50%, #f59e0b 100%)",
            }}
          >
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-[7px] tracking-[0.22em] uppercase text-white font-sans">
              March · 20%
            </div>
          </div>
        }
      />
      <DeliverableTile
        label="Site banner"
        status="Ready"
        tone="sky"
        delay={0.3}
        body={
          <div
            className="size-full rounded-md relative overflow-hidden p-2 flex flex-col justify-center"
            style={{
              background:
                "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            }}
          >
            <div className="h-1 w-2/3 rounded-full bg-white/85 mb-1" />
            <div className="h-0.5 w-1/2 rounded-full bg-white/50" />
            <div className="mt-1.5 h-2 w-12 rounded bg-white" />
          </div>
        }
      />
      <DeliverableTile
        label="Promo code"
        status="Approved"
        tone="violet"
        delay={0.45}
        body={
          <div
            className="size-full rounded-md flex items-center justify-center font-mono font-bold text-white text-[12px] tracking-[0.18em]"
            style={{
              background:
                "linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)",
              textShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}
          >
            HANNAH20
          </div>
        }
      />
    </div>
  );
}

function LatteView() {
  return (
    <div className="grid grid-cols-[2fr_1fr] gap-3 size-full">
      <DeliverableTile
        label="Instagram post"
        status="Scheduled · Fri 9:00 am"
        tone="rose"
        delay={0.15}
        body={
          <div
            className="size-full rounded-md relative overflow-hidden p-2 flex flex-col justify-end"
            style={{
              background:
                "linear-gradient(135deg, #fb7185 0%, #b45309 100%)",
            }}
          >
            <div className="absolute top-2 left-2 size-5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500 p-[1px]">
              <div className="size-full rounded-full bg-[#0d0d12]" />
            </div>
            <div className="text-white font-serif italic text-[12px] leading-tight">
              The new latte menu.
            </div>
            <div className="text-white/85 text-[8px] tracking-widest uppercase mt-1">
              Friday · 9am
            </div>
          </div>
        }
      />
      <DeliverableTile
        label="Story tile"
        status="Queued"
        tone="amber"
        delay={0.3}
        body={
          <div
            className="size-full rounded-md relative overflow-hidden flex items-center justify-center"
            style={{
              background:
                "linear-gradient(180deg, #fbbf24 0%, #b45309 100%)",
            }}
          >
            <div className="text-white font-serif italic text-[11px] text-center leading-tight px-2">
              Try the<br/>oat
              <br/>cortado
            </div>
          </div>
        }
      />
    </div>
  );
}

function BlackFridayView() {
  return (
    <div className="grid grid-cols-[3fr_2fr] gap-3 size-full">
      <DeliverableTile
        label="Landing page"
        status="Deploying · hannahshair.com"
        tone="sky"
        delay={0.15}
        body={
          <div
            className="size-full rounded-md relative overflow-hidden p-2 flex flex-col"
            style={{ background: "#0c1424" }}
          >
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-rose-400/70" />
              <span className="size-1.5 rounded-full bg-amber-400/70" />
              <span className="size-1.5 rounded-full bg-emerald-400/70" />
              <div className="ml-1.5 flex-1 h-2 rounded-sm bg-white/[0.04]" />
            </div>
            <div className="mt-3 font-serif text-white text-[13px] leading-[0.95] tracking-tight">
              Black Friday.
              <div className="italic text-white/70">Gift cards from $49.</div>
            </div>
            <div className="mt-auto flex items-center gap-1">
              <div className="h-3 w-10 rounded bg-white text-[7px] flex items-center justify-center font-sans font-semibold text-canvas">
                Buy
              </div>
              <div className="h-3 w-12 rounded bg-white/10 text-[7px] flex items-center justify-center font-sans text-white/70">
                See more
              </div>
            </div>
          </div>
        }
      />
      <div className="flex flex-col gap-2">
        <DeliverableTile
          label="Stripe"
          status="Embedded"
          tone="violet"
          delay={0.3}
          body={
            <div
              className="size-full rounded-md flex items-center justify-center text-[10px] font-mono text-white"
              style={{
                background:
                  "linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)",
              }}
            >
              $49 · $99 · $249
            </div>
          }
        />
        <DeliverableTile
          label="Lead form"
          status="→ HubSpot"
          tone="emerald"
          delay={0.45}
          body={
            <div
              className="size-full rounded-md p-2 flex flex-col gap-1 justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
              }}
            >
              <div className="h-1 w-3/4 rounded-full bg-white/65" />
              <div className="h-1 w-2/3 rounded-full bg-white/50" />
              <div className="h-1 w-3/5 rounded-full bg-white/35" />
            </div>
          }
        />
      </div>
    </div>
  );
}

/* ============================================================
 * Shared tile primitive
 * ============================================================ */

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
