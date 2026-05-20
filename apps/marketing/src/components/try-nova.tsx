"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

/* ============================================================
 * Types
 * ============================================================ */

type Phase = "idle" | "thinking" | "working" | "done";

type Kind =
  | "social"
  | "story"
  | "website"
  | "code"
  | "memory"
  | "payment"
  | "crm"
  | "blog"
  | "ad"
  | "copy"
  | "email";

type Deliverable = {
  kind: Kind;
  title: string;
  status: string;
  detail: string;
  tone: "rose" | "sky" | "violet" | "amber" | "emerald";
};

type Scenario = {
  id: string;
  prompt: string;
  deliverables: Deliverable[];
  totalTime: string;
  speech: string;
};

/* ============================================================
 * Pre-baked scenarios
 * ============================================================ */

const SCENARIOS: Record<string, Scenario> = {
  march: {
    id: "march",
    prompt: "20% promo for March. Social post, banner, discount code.",
    deliverables: [
      { kind: "social", title: "Instagram post", status: "Drafted", detail: "1080×1080 · @hannahshair", tone: "rose" },
      { kind: "website", title: "Website banner", status: "Ready to deploy", detail: "hannahshair.com", tone: "sky" },
      { kind: "code", title: "Discount code", status: "Pending approval", detail: "HANNAH20 · 20% off", tone: "violet" },
    ],
    totalTime: "3.2s",
    speech: "Got it. Building your March promo. Instagram post, website banner, and a discount code. Done in three seconds.",
  },
  latte: {
    id: "latte",
    prompt: "Schedule a Friday post about our new latte menu.",
    deliverables: [
      { kind: "social", title: "Instagram post · 1080×1080", status: "Scheduled", detail: "Fri 9:00 am", tone: "rose" },
      { kind: "story", title: "Story tile · 1080×1920", status: "Scheduled", detail: "Fri 9:05 am", tone: "amber" },
      { kind: "memory", title: "Brand voice memory", status: "Updated", detail: "+1 entry", tone: "emerald" },
    ],
    totalTime: "2.8s",
    speech: "Scheduling your Friday latte post. Drafting the post and the story tile, and updating brand voice. All set.",
  },
  blackfriday: {
    id: "blackfriday",
    prompt: "Black Friday landing page for the gift card.",
    deliverables: [
      { kind: "website", title: "Landing page", status: "Deployed", detail: "hannahshair.com/giftcard", tone: "sky" },
      { kind: "payment", title: "Stripe checkout", status: "Embedded", detail: "$49 · $99 · $249 tiers", tone: "violet" },
      { kind: "crm", title: "Lead form", status: "Forwarding to CRM", detail: "→ HubSpot", tone: "emerald" },
    ],
    totalTime: "4.1s",
    speech: "Building your Black Friday landing page. Stripe checkout embedded, lead form forwarding to your CRM. Ready to publish.",
  },
  fallback: {
    id: "fallback",
    prompt: "",
    deliverables: [
      { kind: "social", title: "Social post", status: "Drafted", detail: "Tuned to your voice", tone: "rose" },
      { kind: "website", title: "Landing section", status: "Ready", detail: "Live preview", tone: "sky" },
      { kind: "email", title: "Follow-up email", status: "Drafted", detail: "Sequence ready", tone: "amber" },
    ],
    totalTime: "3.0s",
    speech: "Got it. Drafting a social post, a landing section, and a follow-up email. All tuned to your voice.",
  },
  blog: {
    id: "blog",
    prompt: "",
    deliverables: [
      { kind: "blog", title: "Long-form post", status: "Drafted", detail: "1,247 words · SEO 94", tone: "emerald" },
      { kind: "social", title: "Promo tweet", status: "Drafted", detail: "Pull-quote selected", tone: "rose" },
      { kind: "memory", title: "Topic memory", status: "Updated", detail: "+3 keywords", tone: "amber" },
    ],
    totalTime: "3.8s",
    speech: "Drafting a long-form post, a promo tweet with a pull-quote, and updating topic memory. SEO score ninety-four.",
  },
  ad: {
    id: "ad",
    prompt: "",
    deliverables: [
      { kind: "ad", title: "Ad creative · A/B/C", status: "Ready", detail: "3 variants · Meta ready", tone: "amber" },
      { kind: "copy", title: "Headline set", status: "Drafted", detail: "8 hooks tested", tone: "violet" },
      { kind: "social", title: "Organic adapt", status: "Drafted", detail: "IG + Facebook", tone: "rose" },
    ],
    totalTime: "3.5s",
    speech: "Building three ad variants for the test, an eight hook headline set, and an organic adaptation. Ready for Meta.",
  },
};

const PRESETS = [
  { id: "march", label: "20% promo for March", prompt: "20% promo for March. Social post, banner on my site, discount code for returning customers." },
  { id: "latte", label: "Friday latte post", prompt: "Schedule a Friday Instagram post about our new latte menu." },
  { id: "blackfriday", label: "Black Friday landing page", prompt: "Build a Black Friday landing page for the gift card." },
];

function resolveScenario(text: string): Scenario {
  const t = text.toLowerCase();
  // exact preset match
  for (const p of PRESETS) {
    if (t.includes(p.label.toLowerCase())) {
      const s = SCENARIOS[p.id];
      if (s) return { ...s, prompt: text };
    }
  }
  // keyword routing
  if (t.includes("march") || t.includes("promo") || t.includes("discount")) return { ...SCENARIOS.march!, prompt: text };
  if (t.includes("latte") || t.includes("schedul") || t.includes("post about")) return { ...SCENARIOS.latte!, prompt: text };
  if (t.includes("black friday") || t.includes("gift card") || t.includes("landing")) return { ...SCENARIOS.blackfriday!, prompt: text };
  if (t.includes("blog") || t.includes("article") || t.includes("seo")) return { ...SCENARIOS.blog!, prompt: text };
  if (t.includes("ad ") || t.includes("ads") || t.includes("campaign") || t.includes("variant")) return { ...SCENARIOS.ad!, prompt: text };
  return { ...SCENARIOS.fallback!, prompt: text };
}

/* ============================================================
 * Visual icons per kind
 * ============================================================ */

function KindIcon({ kind }: { kind: Kind }) {
  const common = { width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "social":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg>;
    case "story":
      return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>;
    case "website":
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="6.5" cy="6.5" r="0.6" fill="currentColor"/><circle cx="8.8" cy="6.5" r="0.6" fill="currentColor"/></svg>;
    case "code":
      return <svg {...common}><path d="M20 12l-7.5 7.5a1.5 1.5 0 0 1-2.1 0L3 12V3h9l8 8a1.5 1.5 0 0 1 0 2z"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/></svg>;
    case "memory":
      return <svg {...common}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;
    case "payment":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>;
    case "crm":
      return <svg {...common}><path d="M3 8l9 6 9-6"/><rect x="3" y="6" width="18" height="14" rx="2"/></svg>;
    case "blog":
      return <svg {...common}><path d="M6 5h9l4 4v10H6z"/><path d="M15 5v4h4"/><path d="M9 13h6M9 16h4"/></svg>;
    case "ad":
      return <svg {...common}><path d="M4 10v4l11 5V5L4 10Z"/><path d="M15 9a3 3 0 0 1 0 6"/></svg>;
    case "copy":
      return <svg {...common}><path d="M5 7h14M12 7v12"/></svg>;
    case "email":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>;
  }
}

const TONE_GRADIENTS: Record<Deliverable["tone"], string> = {
  rose: "linear-gradient(135deg, #f472b6 0%, #d946ef 50%, #f59e0b 100%)",
  sky: "linear-gradient(135deg, #38bdf8 0%, #2563eb 60%, #1e3a8a 100%)",
  violet: "linear-gradient(135deg, #a78bfa 0%, #6d28d9 60%, #1e1b4b 100%)",
  amber: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 60%, #b45309 100%)",
  emerald: "linear-gradient(135deg, #34d399 0%, #059669 60%, #064e3b 100%)",
};

const TONE_RING: Record<Deliverable["tone"], string> = {
  rose: "border-rose-400/40",
  sky: "border-sky-400/40",
  violet: "border-violet-400/40",
  amber: "border-amber-400/40",
  emerald: "border-emerald-400/40",
};

const TONE_TEXT: Record<Deliverable["tone"], string> = {
  rose: "text-rose-300",
  sky: "text-sky-300",
  violet: "text-violet-300",
  amber: "text-amber-300",
  emerald: "text-emerald-300",
};

const TONE_GLOW: Record<Deliverable["tone"], string> = {
  rose: "rgba(244,114,182,0.45)",
  sky: "rgba(56,189,248,0.45)",
  violet: "rgba(167,139,250,0.45)",
  amber: "rgba(252,211,77,0.45)",
  emerald: "rgba(52,211,153,0.45)",
};

const TONE_LINE: Record<Deliverable["tone"], string> = {
  rose: "rgba(244,114,182,0.55)",
  sky: "rgba(56,189,248,0.55)",
  violet: "rgba(167,139,250,0.55)",
  amber: "rgba(252,211,77,0.55)",
  emerald: "rgba(52,211,153,0.55)",
};

/* Triangle around Nova: top, lower-right, lower-left */
const ORBIT_POSITIONS: { angle: number; x: number; y: number }[] = [
  { angle: -90, x: 0, y: -200 },
  { angle: 30, x: 173, y: 100 },
  { angle: 150, x: -173, y: 100 },
];
const ORBIT_RADIUS = 200;

/* ============================================================
 * Main component
 * ============================================================ */

const STATUS_LINES = ["Parsing intent…", "Picking frameworks…", "Drafting deliverables…"];

const VOICE_STORAGE_KEY = "wrks-voice-on";

/* ---------- SpeechRecognition (browser STT) ---------- */
type MinRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
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
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

function pickNovaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer high-quality female English voices
  const preferred = [
    /samantha/i,           // macOS
    /aria/i,               // Windows
    /natural female/i,     // Edge enhanced
    /jenny/i,
    /female.*english/i,
    /google.*us english/i, // Chrome
    /allison/i,
    /serena/i,
  ];
  for (const re of preferred) {
    const v = voices.find((vv) => vv.lang.startsWith("en") && re.test(vv.name));
    if (v) return v;
  }
  // Any English voice
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

export function TryNova() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState("");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [shownCount, setShownCount] = useState(0);
  const [statusStep, setStatusStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [hasRunFirstDemo, setHasRunFirstDemo] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<MinRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");

  // Load voice preference + detect mic support on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(VOICE_STORAGE_KEY);
    if (saved === "1") setVoiceOn(true);
    setMicSupported(isRecognitionSupported());
    // Warm up voice list
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.abort();
    };
  }, []);

  const persistVoice = (on: boolean) => {
    setVoiceOn(on);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VOICE_STORAGE_KEY, on ? "1" : "0");
    }
    if (!on && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speak = (text: string) => {
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
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const startListening = () => {
    if (!isRecognitionSupported()) {
      setMicError("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    // Cancel any in-progress speech so Nova doesn't talk over the user
    stopSpeech();
    // Cancel any in-progress demo run
    cancelRef.current.cancelled = true;

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
      const display = (finalTranscriptRef.current + " " + interim).trim();
      setInput(display);
    };
    rec.onerror = (e) => {
      setIsListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicError("Microphone blocked. Enable it in your browser to talk to Nova.");
      } else if (e.error === "no-speech") {
        setMicError("Didn't catch that. Tap the mic and try again.");
      } else if (e.error !== "aborted") {
        setMicError("Voice input hit a snag. Try again or type instead.");
      }
    };
    rec.onend = () => {
      setIsListening(false);
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        // Auto-enable voice so visitors hear Nova talk back
        if (!voiceOn) persistVoice(true);
        setInput(finalText);
        void runScenario(finalText);
      }
    };

    try {
      rec.start();
    } catch {
      // start() throws if already started — recover by aborting and retrying
      rec.abort();
      setIsListening(false);
    }
  };

  // First-load auto-demo
  useEffect(() => {
    if (hasRunFirstDemo) return;
    const t = setTimeout(() => {
      void runScenario(PRESETS[0]!.prompt);
      setHasRunFirstDemo(true);
    }, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScenario = async (text: string) => {
    // Cancel previous run, any in-progress speech, and any open mic
    cancelRef.current.cancelled = true;
    stopSpeech();
    recognitionRef.current?.abort();
    setIsListening(false);
    setMicError(null);
    const localCancel = { cancelled: false };
    cancelRef.current = localCancel;

    const scen = resolveScenario(text);
    setScenario(scen);
    setShownCount(0);
    setStatusStep(0);
    setElapsed(0);
    setPhase("thinking");

    // Thinking phase: cycle status lines
    for (let i = 0; i < STATUS_LINES.length; i++) {
      if (localCancel.cancelled) return;
      setStatusStep(i);
      await wait(550);
    }

    if (localCancel.cancelled) return;
    setPhase("working");

    // Tick elapsed time
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 60);

    // Stagger deliverables
    for (let i = 0; i < scen.deliverables.length; i++) {
      if (localCancel.cancelled) {
        clearInterval(interval);
        return;
      }
      await wait(550);
      setShownCount(i + 1);
    }

    await wait(400);
    clearInterval(interval);
    if (localCancel.cancelled) return;
    setPhase("done");

    // Speak after the visual ships
    if (voiceOn) {
      speak(scen.speech);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    void runScenario(text);
  };

  const onPreset = (preset: typeof PRESETS[number]) => {
    setInput(preset.prompt);
    void runScenario(preset.prompt);
  };

  const onReset = () => {
    cancelRef.current.cancelled = true;
    stopSpeech();
    recognitionRef.current?.abort();
    setIsListening(false);
    setMicError(null);
    setPhase("idle");
    setScenario(null);
    setShownCount(0);
    setStatusStep(0);
    setElapsed(0);
    setInput("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const isBusy = phase === "thinking" || phase === "working";
  const showResponse = scenario !== null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Outer glass panel */}
      <div
        className="relative rounded-3xl border border-line-bright bg-panel/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40"
        style={{
          boxShadow:
            "0 30px 80px -20px rgba(99,102,241,0.18), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15), transparent 65%), radial-gradient(ellipse at 50% 100%, rgba(244,114,182,0.08), transparent 60%)",
          }}
        />
        {/* Composer header */}
        <div className="px-5 sm:px-7 pt-5 sm:pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] tracking-[0.22em] uppercase text-emerald-300/90 font-sans font-medium">
                Try Nova
              </span>
              <span className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-sans">· demo</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => persistVoice(!voiceOn)}
                aria-pressed={voiceOn}
                aria-label={voiceOn ? "Mute Nova" : "Hear Nova"}
                className={`group relative h-7 pl-2 pr-3 rounded-full border text-[10px] tracking-[0.18em] uppercase font-sans flex items-center gap-1.5 transition-colors ${
                  voiceOn
                    ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
                    : "border-line bg-canvas/60 text-ink-muted hover:text-ink hover:border-ink/40"
                }`}
              >
                <span className="relative flex items-center justify-center size-4">
                  {voiceOn ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5L6 9H3v6h3l5 4V5z"/>
                      <path d="M15.5 8.5a4 4 0 0 1 0 7"/>
                      <path d="M18 6a8 8 0 0 1 0 12"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5L6 9H3v6h3l5 4V5z"/>
                      <path d="M22 9l-6 6"/>
                      <path d="M16 9l6 6"/>
                    </svg>
                  )}
                  {isSpeaking && voiceOn && (
                    <span className="absolute -inset-1 rounded-full border border-emerald-300/40 animate-ping" />
                  )}
                </span>
                {voiceOn ? "Voice on" : "Hear Nova"}
              </button>
              {phase === "done" && (
                <motion.button
                  onClick={onReset}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] tracking-[0.18em] uppercase text-ink-muted hover:text-ink font-sans flex items-center gap-1 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 3-6.7"/>
                    <path d="M3 3v6h6"/>
                  </svg>
                  Try another
                </motion.button>
              )}
            </div>
          </div>
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPreset(p)}
                disabled={isBusy}
                className="text-[10px] sm:text-xs font-sans h-7 px-3 rounded-full border border-line bg-canvas/60 text-ink-muted hover:text-ink hover:border-ink/40 hover:bg-canvas transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Input form */}
          <form onSubmit={onSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              {micSupported ? (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isBusy}
                  aria-label={isListening ? "Stop listening" : "Talk to Nova"}
                  className={`absolute left-1.5 top-1/2 -translate-y-1/2 size-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isListening
                      ? "bg-rose-500 text-white"
                      : "bg-canvas border border-line text-ink-muted hover:text-ink hover:border-ink/40"
                  }`}
                >
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-xl bg-rose-500/40 animate-ping" />
                      <span className="absolute -inset-1 rounded-xl border border-rose-400/40 animate-pulse" />
                    </>
                  )}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative">
                    <rect x="9" y="3" width="6" height="12" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0" />
                    <path d="M12 18v3" />
                  </svg>
                </button>
              ) : (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-emerald-400 animate-pulse pointer-events-none" />
              )}
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                disabled={isBusy}
                placeholder={
                  isListening
                    ? "Listening… speak now"
                    : micSupported
                      ? "Tap the mic, or type what to make…"
                      : "Tell Nova what to make…"
                }
                className={`w-full h-12 ${micSupported ? "pl-12" : "pl-9"} pr-4 rounded-2xl bg-canvas border text-ink placeholder:text-ink-dim text-sm font-sans focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${
                  isListening
                    ? "border-rose-400/60 ring-2 ring-rose-400/20 focus:border-rose-400/60 focus:ring-rose-400/20"
                    : "border-line focus:border-ink/40 focus:ring-ink/10"
                }`}
              />
            </div>
            <motion.button
              type="submit"
              disabled={isBusy || !input.trim() || isListening}
              whileHover={{ scale: isBusy ? 1 : 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="h-12 px-5 rounded-2xl bg-ink text-canvas text-sm font-sans font-semibold shadow-lg shadow-ink/10 hover:shadow-ink/20 transition-shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-ink/10"
            >
              {isBusy ? (
                <>
                  <Spinner /> Working
                </>
              ) : (
                <>
                  Try it
                  <span aria-hidden>→</span>
                </>
              )}
            </motion.button>
          </form>
          {micError && (
            <div className="mt-2 text-[10px] tracking-[0.18em] uppercase text-rose-300/90 font-sans">
              {micError}
            </div>
          )}
        </div>

        {/* Orbital stage */}
        <AnimatePresence>
          {showResponse && scenario && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              className="overflow-hidden"
            >
              <OrbitalStage
                scenario={scenario}
                shownCount={shownCount}
                statusStep={statusStep}
                phase={phase}
                elapsed={elapsed}
                isSpeaking={isSpeaking}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper line below */}
      <div className="mt-3 text-center text-[10px] tracking-[0.18em] uppercase text-ink-dim font-sans">
        {micSupported
          ? "Talk to Nova or type · 1 sentence, 3 deliverables"
          : "Pick a preset or type your own · 1 sentence, 3 deliverables"}
      </div>
    </div>
  );
}

/* ============================================================
 * Atoms
 * ============================================================ */

/* ---------- Nova orb (big, central) ---------- */
function BigNovaOrb({ size, pulsing, speaking }: { size: number; pulsing: boolean; speaking: boolean }) {
  const active = pulsing || speaking;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {speaking && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border border-sky-300/30"
            style={{ margin: -size * 0.35 }}
            animate={{ scale: [0.95, 1.35, 0.95], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border border-sky-300/15"
            style={{ margin: -size * 0.6 }}
            animate={{ scale: [0.95, 1.45, 0.95], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
        </>
      )}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          margin: -size * 0.2,
          background: speaking
            ? "radial-gradient(circle, rgba(125,211,252,0.45), transparent 70%)"
            : "radial-gradient(circle, rgba(165,180,252,0.4), transparent 70%)",
        }}
        animate={active ? { scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] } : { opacity: 0.55 }}
        transition={active ? { duration: speaking ? 1.0 : 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      />
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: "radial-gradient(circle at 32% 28%, #ffffff, #e0e7ff 55%, rgba(99,102,241,0.85) 100%)",
          boxShadow: speaking
            ? "0 0 56px 6px rgba(125,211,252,0.55), inset 0 -18px 40px rgba(50,30,80,0.6)"
            : pulsing
              ? "0 0 40px 0 rgba(165,180,252,0.55), inset 0 -18px 40px rgba(50,30,80,0.55)"
              : "0 16px 36px -10px rgba(0,0,0,0.7), inset 0 -18px 40px rgba(50,30,80,0.5)",
        }}
      >
        <span
          className="absolute rounded-full bg-white"
          style={{
            width: size * 0.18,
            height: size * 0.18,
            top: size * 0.18,
            left: size * 0.2,
            filter: "blur(1px)",
            opacity: 0.95,
          }}
        />
        {speaking && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ gap: Math.max(2, size * 0.04) }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.span
                key={i}
                className="block rounded-full bg-white/95"
                style={{ width: Math.max(2, size * 0.035), filter: "drop-shadow(0 0 4px rgba(125,211,252,0.9))" }}
                animate={{ height: ["18%", "62%", "30%", "55%", "25%", "65%", "20%"] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Orbital deliverable chip ---------- */
function OrbChip({ d }: { d: Deliverable }) {
  return (
    <div
      className={`w-40 rounded-2xl border ${TONE_RING[d.tone]} bg-canvas/85 backdrop-blur-md px-3 py-2.5`}
      style={{
        boxShadow: `0 16px 34px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px -8px ${TONE_GLOW[d.tone]}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="size-9 rounded-lg overflow-hidden border border-line shrink-0 flex items-center justify-center text-white/95"
          style={{ background: TONE_GRADIENTS[d.tone] }}
        >
          <KindIcon kind={d.kind} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-sans font-semibold text-ink leading-tight truncate">
            {d.title}
          </div>
          <div className="text-[9px] font-mono text-ink-muted leading-tight truncate mt-0.5">
            {d.detail}
          </div>
        </div>
      </div>
      <div className={`mt-2 flex items-center gap-1 text-[8px] tracking-[0.22em] uppercase font-sans font-medium ${TONE_TEXT[d.tone]}`}>
        <span className="size-1 rounded-full bg-current" />
        {d.status}
      </div>
    </div>
  );
}

/* ---------- Mobile compact chip (full width) ---------- */
function OrbChipWide({ d }: { d: Deliverable }) {
  return (
    <div
      className={`w-full rounded-xl border ${TONE_RING[d.tone]} bg-canvas/80 backdrop-blur-md px-3 py-2.5 flex items-center gap-3`}
      style={{ boxShadow: `0 0 22px -10px ${TONE_GLOW[d.tone]}` }}
    >
      <div
        className="size-9 rounded-lg overflow-hidden border border-line shrink-0 flex items-center justify-center text-white/95"
        style={{ background: TONE_GRADIENTS[d.tone] }}
      >
        <KindIcon kind={d.kind} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-sans font-semibold text-ink truncate leading-tight">
          {d.title}
        </div>
        <div className="text-[9px] font-mono text-ink-muted truncate mt-0.5">{d.detail}</div>
      </div>
      <span className={`text-[8px] tracking-[0.2em] uppercase font-sans font-medium ${TONE_TEXT[d.tone]} shrink-0`}>
        {d.status}
      </span>
    </div>
  );
}

/* ---------- Orbital constellation stage ---------- */
function OrbitalStage({
  scenario,
  shownCount,
  statusStep,
  phase,
  elapsed,
  isSpeaking,
}: {
  scenario: Scenario;
  shownCount: number;
  statusStep: number;
  phase: Phase;
  elapsed: number;
  isSpeaking: boolean;
}) {
  const isBusy = phase === "thinking" || phase === "working";
  const statusText =
    phase === "thinking"
      ? STATUS_LINES[statusStep]
      : phase === "working"
        ? "Drafting deliverables…"
        : `Shipped in ${scenario.totalTime}`;

  return (
    <div className="relative border-t border-line/60 mt-5">
      {/* Desktop orbital constellation */}
      <div className="hidden sm:flex relative h-[520px] items-center justify-center overflow-hidden">
        {/* Ambient backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(244,114,182,0.08), transparent 60%)",
          }}
        />
        {/* Decorative orbit rings */}
        <div className="absolute size-[440px] rounded-full border border-white/[0.05]" />
        <div className="absolute size-[300px] rounded-full border border-white/[0.04]" />
        <div className="absolute size-[160px] rounded-full border border-white/[0.03]" />

        {/* Connection lines (rotated divs) */}
        {scenario.deliverables.map((d, i) => {
          const pos = ORBIT_POSITIONS[i];
          if (!pos) return null;
          const visible = i < shownCount;
          return (
            <motion.div
              key={`line-${i}`}
              className="absolute left-1/2 top-1/2 origin-left"
              style={{
                width: ORBIT_RADIUS,
                height: 1,
                transform: `rotate(${pos.angle}deg)`,
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: visible ? 1 : 0, opacity: visible ? 1 : 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              <div
                className="h-px w-full"
                style={{
                  background: `linear-gradient(90deg, ${TONE_LINE[d.tone]} 0%, ${TONE_LINE[d.tone]} 35%, transparent 100%)`,
                }}
              />
            </motion.div>
          );
        })}

        {/* Center Nova orb */}
        <div className="relative z-10">
          <BigNovaOrb size={104} pulsing={isBusy} speaking={isSpeaking} />
        </div>

        {/* Status line directly under orb */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 z-10" style={{ marginTop: 80 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${phase}-${statusStep}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] font-sans text-ink-muted whitespace-nowrap text-center"
            >
              {statusText}
            </motion.div>
          </AnimatePresence>
          {isBusy && (
            <div className="text-[9px] font-mono text-ink-dim tabular-nums text-center mt-0.5">
              {elapsed.toFixed(1)}s
            </div>
          )}
        </div>

        {/* Spawning particle for the most recent deliverable */}
        <AnimatePresence>
          {shownCount > 0 && scenario.deliverables[shownCount - 1] && ORBIT_POSITIONS[shownCount - 1] && (
            <motion.span
              key={`particle-${scenario.id}-${shownCount}`}
              className="absolute left-1/2 top-1/2 size-2.5 rounded-full z-30 pointer-events-none"
              style={{
                background: TONE_GRADIENTS[scenario.deliverables[shownCount - 1]!.tone],
                boxShadow: `0 0 16px 4px ${TONE_GLOW[scenario.deliverables[shownCount - 1]!.tone]}`,
              }}
              initial={{ x: -5, y: -5, opacity: 1, scale: 0.6 }}
              animate={{
                x: ORBIT_POSITIONS[shownCount - 1]!.x - 5,
                y: ORBIT_POSITIONS[shownCount - 1]!.y - 5,
                opacity: 0,
                scale: 1.6,
              }}
              transition={{ duration: 0.75, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* Deliverable chips at orbit positions */}
        {scenario.deliverables.map((d, i) => {
          const pos = ORBIT_POSITIONS[i];
          if (!pos) return null;
          const visible = i < shownCount;
          return (
            <motion.div
              key={`chip-${scenario.id}-${i}-${d.title}`}
              className="absolute left-1/2 top-1/2 z-20"
              style={{ marginLeft: -80, marginTop: -36 }}
              initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              animate={
                visible
                  ? { opacity: 1, scale: 1, x: pos.x, y: pos.y }
                  : { opacity: 0, scale: 0.4, x: 0, y: 0 }
              }
              transition={{ duration: 0.75, ease: [0.2, 0.7, 0.2, 1], delay: visible ? 0.15 : 0 }}
            >
              <motion.div
                animate={visible ? { y: [0, -4, 0] } : {}}
                transition={visible ? { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 } : {}}
              >
                <OrbChip d={d} />
              </motion.div>
            </motion.div>
          );
        })}

        {/* Shipped pill — bottom of stage */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/40 text-[10px] tracking-[0.22em] uppercase text-emerald-200 font-sans font-medium"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7"/>
              </svg>
              Shipped in {scenario.totalTime}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo disclaimer */}
        <span className="absolute bottom-1.5 right-4 text-[9px] font-sans text-ink-dim italic">
          Demo · waitlist for the real thing
        </span>
      </div>

      {/* Mobile vertical layout */}
      <div className="sm:hidden flex flex-col items-center px-5 pt-8 pb-6">
        <BigNovaOrb size={72} pulsing={isBusy} speaking={isSpeaking} />
        <AnimatePresence mode="wait">
          <motion.div
            key={`m-${phase}-${statusStep}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="mt-4 text-[11px] font-sans text-ink-muted text-center"
          >
            {statusText}
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 w-full space-y-2">
          {scenario.deliverables.map((d, i) => {
            const visible = i < shownCount;
            return (
              <motion.div
                key={`m-chip-${i}`}
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16, scale: 0.95 }}
                animate={visible ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <OrbChipWide d={d} />
              </motion.div>
            );
          })}
        </div>
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/40 text-[10px] tracking-[0.22em] uppercase text-emerald-200 font-sans font-medium"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7"/>
              </svg>
              Shipped in {scenario.totalTime}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </motion.svg>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
