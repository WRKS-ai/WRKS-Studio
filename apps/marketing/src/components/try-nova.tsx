"use client";

import { AnimatePresence, motion, useSpring, useTime, useTransform } from "motion/react";
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

function KindIcon({ kind, size = 14 }: { kind: Kind; size?: number }) {
  const common = { width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
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

  const onPreset = (preset: typeof PRESETS[number]) => {
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

  const onOrbTap = () => {
    if (isListening) {
      stopListening();
      return;
    }
    if (micSupported) {
      startListening();
    }
  };

  const isBusy = phase === "thinking" || phase === "working";

  return (
    <div className="w-full relative">
      {/* Top bar — boxless */}
      <div className="max-w-3xl mx-auto px-2 sm:px-4 flex items-center justify-between mb-4 sm:mb-2">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] tracking-[0.24em] uppercase text-emerald-300/90 font-sans font-medium">
            Try Nova
          </span>
          <span className="text-[10px] tracking-[0.24em] uppercase text-ink-dim font-sans">· live demo</span>
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
                : "border-line bg-canvas/40 text-ink-muted hover:text-ink hover:border-ink/40"
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

      {/* Orbital centerpiece — orb is the speak button, spheres orbit around */}
      <OrbitalCenterpiece
        scenario={scenario}
        shownCount={shownCount}
        statusStep={statusStep}
        phase={phase}
        elapsed={elapsed}
        isSpeaking={isSpeaking}
        isListening={isListening}
        transcript={input}
        micSupported={micSupported}
        onOrbTap={onOrbTap}
      />

      {/* Naked preset suggestions */}
      <div className="max-w-3xl mx-auto px-4 mt-4 text-center">
        <div className="text-[10px] tracking-[0.24em] uppercase text-ink-dim font-sans mb-3">
          {micSupported ? "tap Nova to talk · or try" : "try saying"}
        </div>
        <div className="flex flex-wrap items-baseline justify-center gap-x-1 sm:gap-x-2 gap-y-2">
          {PRESETS.map((p, i) => (
            <span key={p.id} className="inline-flex items-baseline">
              <button
                type="button"
                onClick={() => onPreset(p)}
                disabled={isBusy || isListening}
                className="font-serif italic text-sm sm:text-base text-ink hover:text-emerald-200 transition-colors underline-offset-4 hover:underline decoration-emerald-400/40 disabled:opacity-50"
              >
                &ldquo;{p.label}&rdquo;
              </button>
              {i < PRESETS.length - 1 && (
                <span className="text-ink-dim mx-2 sm:mx-3">·</span>
              )}
            </span>
          ))}
        </div>
        {micError && (
          <div className="mt-3 text-[10px] tracking-[0.18em] uppercase text-rose-300/90 font-sans">
            {micError}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Atoms
 * ============================================================ */

/* ---------- Nova orb (big, central, tappable) ---------- */
function BigNovaOrb({
  size,
  pulsing,
  speaking,
  listening = false,
}: {
  size: number;
  pulsing: boolean;
  speaking: boolean;
  listening?: boolean;
}) {
  const active = pulsing || speaking || listening;
  const haloColor = listening
    ? "rgba(244,114,182,0.5)"
    : speaking
      ? "rgba(125,211,252,0.45)"
      : "rgba(165,180,252,0.42)";
  const ringColor = listening ? "rgba(244,114,182,0.45)" : "rgba(125,211,252,0.3)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {(speaking || listening) && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ margin: -size * 0.4, border: `1px solid ${ringColor}` }}
            animate={{ scale: [0.95, 1.4, 0.95], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ margin: -size * 0.65, border: `1px solid ${ringColor}`, opacity: 0.5 }}
            animate={{ scale: [0.95, 1.55, 0.95], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
        </>
      )}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          margin: -size * 0.25,
          background: `radial-gradient(circle, ${haloColor}, transparent 70%)`,
        }}
        animate={active ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] } : { opacity: 0.55 }}
        transition={active ? { duration: speaking || listening ? 1.0 : 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      />
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: listening
            ? "radial-gradient(circle at 32% 28%, #ffffff, #fbcfe8 55%, rgba(244,114,182,0.85) 100%)"
            : "radial-gradient(circle at 32% 28%, #ffffff, #e0e7ff 55%, rgba(99,102,241,0.85) 100%)",
          boxShadow: listening
            ? "0 0 64px 6px rgba(244,114,182,0.55), inset 0 -18px 40px rgba(80,20,50,0.6)"
            : speaking
              ? "0 0 64px 6px rgba(125,211,252,0.55), inset 0 -18px 40px rgba(50,30,80,0.6)"
              : pulsing
                ? "0 0 48px 0 rgba(165,180,252,0.6), inset 0 -18px 40px rgba(50,30,80,0.55)"
                : "0 18px 40px -10px rgba(0,0,0,0.75), inset 0 -18px 40px rgba(50,30,80,0.5)",
        }}
      >
        <span
          className="absolute rounded-full bg-white"
          style={{
            width: size * 0.2,
            height: size * 0.2,
            top: size * 0.16,
            left: size * 0.19,
            filter: "blur(2px)",
            opacity: 0.9,
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
        {listening && !speaking && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width={size * 0.32} height={size * 0.32} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }}>
              <rect x="9" y="3" width="6" height="12" rx="3"/>
              <path d="M5 11a7 7 0 0 0 14 0"/>
              <path d="M12 18v3"/>
            </svg>
          </div>
        )}
        {!speaking && !listening && pulsing && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ gap: Math.max(2, size * 0.04) }}>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block rounded-full bg-white/70"
                style={{ width: Math.max(2, size * 0.035), filter: "drop-shadow(0 0 4px rgba(165,180,252,0.8))" }}
                animate={{ height: ["20%", "45%", "20%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Floating sphere (no box, no border) ---------- */
function OrbSphere({ d, size = 68 }: { d: Deliverable; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Soft halo */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -size * 0.35,
          background: `radial-gradient(circle, ${TONE_GLOW[d.tone]}, transparent 65%)`,
          opacity: 0.7,
        }}
      />
      {/* Sphere body */}
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: TONE_GRADIENTS[d.tone],
          boxShadow: `inset 0 -${size * 0.16}px ${size * 0.32}px rgba(0,0,0,0.55), inset 0 ${size * 0.05}px ${size * 0.1}px rgba(255,255,255,0.3), 0 ${size * 0.18}px ${size * 0.34}px -${size * 0.12}px rgba(0,0,0,0.75), 0 0 40px -10px ${TONE_GLOW[d.tone]}`,
        }}
      >
        {/* Highlight */}
        <span
          className="absolute rounded-full bg-white"
          style={{
            width: size * 0.24,
            height: size * 0.24,
            top: size * 0.12,
            left: size * 0.17,
            filter: "blur(2px)",
            opacity: 0.88,
          }}
        />
        {/* Embossed icon */}
        <div
          className="absolute inset-0 flex items-center justify-center text-white"
          style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.55))" }}
        >
          <KindIcon kind={d.kind} size={Math.round(size * 0.4)} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Orbital centerpiece (boxless, orb-as-button) ---------- */

/* Stable, pseudo-random scatter for ambient dust */
const DUST: { left: string; top: string; dur: number; delay: number }[] = [
  { left: "8%", top: "20%", dur: 6.2, delay: 0 },
  { left: "18%", top: "78%", dur: 7.5, delay: 0.8 },
  { left: "30%", top: "12%", dur: 5.8, delay: 1.6 },
  { left: "42%", top: "92%", dur: 8.1, delay: 0.4 },
  { left: "58%", top: "8%", dur: 6.6, delay: 1.2 },
  { left: "72%", top: "84%", dur: 7.2, delay: 2.0 },
  { left: "85%", top: "30%", dur: 5.4, delay: 0.6 },
  { left: "92%", top: "70%", dur: 7.8, delay: 1.4 },
  { left: "12%", top: "48%", dur: 6.0, delay: 2.4 },
  { left: "88%", top: "52%", dur: 6.4, delay: 1.0 },
];

/* Orbit parameters per slot: starting angle, radius, angular speed deg/sec */
const ORBITS: { angle: number; radius: number; speed: number }[] = [
  { angle: -90, radius: 218, speed: 5.5 },
  { angle: 30, radius: 232, speed: 6.4 },
  { angle: 150, radius: 218, speed: 5.0 },
];

function OrbitingSphere({ d, index, visible }: { d: Deliverable; index: number; visible: boolean }) {
  const orbit = ORBITS[index] ?? ORBITS[0]!;
  const time = useTime();

  // Continuous orbital position via motion values
  const orbitalX = useTransform(time, (t) =>
    Math.cos(((orbit.angle + (t / 1000) * orbit.speed) * Math.PI) / 180) * orbit.radius,
  );
  const orbitalY = useTransform(time, (t) =>
    Math.sin(((orbit.angle + (t / 1000) * orbit.speed) * Math.PI) / 180) * orbit.radius,
  );

  // Spawn progression: 0 = at Nova center, 1 = at orbital position
  const spawnProgress = useSpring(0, { stiffness: 90, damping: 20 });
  useEffect(() => {
    spawnProgress.set(visible ? 1 : 0);
  }, [visible, spawnProgress]);

  const x = useTransform([spawnProgress, orbitalX], (vs) => {
    const arr = vs as number[];
    return (arr[0] ?? 0) * (arr[1] ?? 0);
  });
  const y = useTransform([spawnProgress, orbitalY], (vs) => {
    const arr = vs as number[];
    return (arr[0] ?? 0) * (arr[1] ?? 0);
  });
  const opacity = useTransform(spawnProgress, [0, 0.25, 1], [0, 0.5, 1]);
  const scale = useTransform(spawnProgress, [0, 1], [0.35, 1]);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-10 pointer-events-none"
      style={{ x, y, opacity, scale, marginLeft: -78, marginTop: -36 }}
    >
      <motion.div
        animate={visible ? { y: [0, -4, 0] } : {}}
        transition={visible ? { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 } : {}}
        className="flex flex-col items-center"
        style={{ width: 156 }}
      >
        <OrbSphere d={d} size={64} />
        <div className="mt-3 text-center">
          <div className="font-serif text-[14px] text-ink font-semibold leading-tight">
            {d.title}
          </div>
          <div className="text-[9px] font-mono text-ink-muted mt-1 leading-tight">
            {d.detail}
          </div>
          <div className={`mt-1.5 inline-flex items-center gap-1 text-[8px] tracking-[0.24em] uppercase font-sans font-medium ${TONE_TEXT[d.tone]}`}>
            <span className="size-1 rounded-full bg-current" />
            {d.status}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OrbitalCenterpiece({
  scenario,
  shownCount,
  statusStep,
  phase,
  elapsed,
  isSpeaking,
  isListening,
  transcript,
  micSupported,
  onOrbTap,
}: {
  scenario: Scenario | null;
  shownCount: number;
  statusStep: number;
  phase: Phase;
  elapsed: number;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  micSupported: boolean;
  onOrbTap: () => void;
}) {
  const isBusy = phase === "thinking" || phase === "working";
  const statusText = !scenario
    ? null
    : phase === "thinking"
      ? STATUS_LINES[statusStep]
      : phase === "working"
        ? "Drafting deliverables…"
        : `Shipped in ${scenario.totalTime}`;

  return (
    <div className="relative w-full">
      {/* Desktop centerpiece */}
      <div className="hidden sm:flex relative h-[600px] items-center justify-center overflow-visible">
        {/* Ambient backdrop — soft glow only, no border */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.2), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(244,114,182,0.07), transparent 60%)",
          }}
        />

        {/* Drifting dust particles */}
        {DUST.map((p, i) => (
          <motion.span
            key={`dust-${i}`}
            className="absolute size-[3px] rounded-full bg-white/40 pointer-events-none"
            style={{ left: p.left, top: p.top, filter: "blur(0.5px)" }}
            animate={{ y: [0, -14, 0], opacity: [0.15, 0.55, 0.15] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}

        {/* Slowly counter-rotating orbit rings */}
        <motion.div
          className="absolute size-[520px] rounded-full border border-white/[0.05] pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute size-1 rounded-full bg-white/30 -top-0.5 left-1/2 -translate-x-1/2" />
        </motion.div>
        <motion.div
          className="absolute size-[360px] rounded-full border border-white/[0.045] pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute size-0.5 rounded-full bg-white/25 -bottom-0.5 left-1/2 -translate-x-1/2" />
        </motion.div>

        {/* Emission burst at Nova when a deliverable spawns */}
        <AnimatePresence>
          {shownCount > 0 && scenario && scenario.deliverables[shownCount - 1] && (
            <motion.span
              key={`burst-${scenario.id}-${shownCount}`}
              className="absolute left-1/2 top-1/2 rounded-full pointer-events-none z-10"
              style={{
                marginLeft: -70,
                marginTop: -70,
                width: 140,
                height: 140,
                border: `2px solid ${TONE_GLOW[scenario.deliverables[shownCount - 1]!.tone]}`,
              }}
              initial={{ scale: 0.8, opacity: 0.85 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{ duration: 0.95, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* Orbiting spheres */}
        {scenario && scenario.deliverables.map((d, i) => (
          <OrbitingSphere
            key={`orbit-${scenario.id}-${i}`}
            d={d}
            index={i}
            visible={i < shownCount}
          />
        ))}

        {/* Center Nova orb — tappable speak button */}
        <motion.button
          type="button"
          onClick={onOrbTap}
          whileHover={{ scale: micSupported ? 1.05 : 1 }}
          whileTap={{ scale: micSupported ? 0.96 : 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 20 }}
          aria-label={isListening ? "Stop listening" : micSupported ? "Tap Nova to talk" : "Tap a preset below"}
          disabled={!micSupported}
          className="relative z-20 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-300/50 disabled:cursor-default"
          style={{ cursor: micSupported ? "pointer" : "default" }}
        >
          <BigNovaOrb size={150} pulsing={isBusy} speaking={isSpeaking} listening={isListening} />
        </motion.button>

        {/* Idle hint under orb */}
        <AnimatePresence>
          {!scenario && !isListening && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 z-10 pointer-events-none text-center"
              style={{ marginTop: 110 }}
            >
              <div className="font-serif italic text-base sm:text-lg text-ink-muted whitespace-nowrap">
                {micSupported ? "Tap Nova to talk" : "Pick a phrase below"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live transcript while listening */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 z-10 pointer-events-none text-center w-[80%] max-w-md"
              style={{ marginTop: 115 }}
            >
              <div className="text-[9px] tracking-[0.24em] uppercase text-rose-300/90 font-sans mb-2 flex items-center justify-center gap-1.5">
                <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
                listening
              </div>
              <div className="font-serif italic text-base text-ink leading-snug min-h-[1.4em]">
                {transcript || "…"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scenario status (thinking/working/done) */}
        <AnimatePresence>
          {scenario && !isListening && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 z-10 pointer-events-none text-center"
              style={{ marginTop: 110 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${phase}-${statusStep}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="font-serif italic text-base text-ink-muted whitespace-nowrap"
                >
                  {statusText}
                </motion.div>
              </AnimatePresence>
              {isBusy && (
                <div className="text-[9px] font-mono text-ink-dim tabular-nums mt-1">
                  {elapsed.toFixed(1)}s
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shipped serif label at bottom */}
        <AnimatePresence>
          {phase === "done" && scenario && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-none"
            >
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-serif italic text-base text-emerald-200">
                shipped in {scenario.totalTime}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <span className="absolute bottom-2 right-4 text-[9px] font-sans text-ink-dim italic z-20">
          demo · waitlist for the real thing
        </span>
      </div>

      {/* Mobile vertical layout */}
      <div className="sm:hidden relative flex flex-col items-center pt-8 pb-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 20%, rgba(99,102,241,0.22), transparent 60%)",
          }}
        />
        <motion.button
          type="button"
          onClick={onOrbTap}
          whileHover={{ scale: micSupported ? 1.04 : 1 }}
          whileTap={{ scale: micSupported ? 0.96 : 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 20 }}
          aria-label={isListening ? "Stop listening" : micSupported ? "Tap Nova to talk" : "Tap a preset below"}
          disabled={!micSupported}
          className="relative z-20 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-300/50 disabled:cursor-default"
        >
          <BigNovaOrb size={100} pulsing={isBusy} speaking={isSpeaking} listening={isListening} />
        </motion.button>

        <div className="mt-5 min-h-[1.4em] relative text-center px-6">
          {!scenario && !isListening && (
            <span className="font-serif italic text-sm text-ink-muted">
              {micSupported ? "Tap Nova to talk" : "Pick a phrase below"}
            </span>
          )}
          {isListening && (
            <div>
              <div className="text-[9px] tracking-[0.24em] uppercase text-rose-300/90 font-sans mb-1 flex items-center justify-center gap-1.5">
                <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
                listening
              </div>
              <div className="font-serif italic text-sm text-ink">
                {transcript || "…"}
              </div>
            </div>
          )}
          {scenario && !isListening && (
            <span className="font-serif italic text-sm text-ink-muted">{statusText}</span>
          )}
        </div>

        <div className="mt-6 w-full flex flex-col items-center gap-5 relative">
          {scenario && scenario.deliverables.map((d, i) => {
            const visible = i < shownCount;
            return (
              <motion.div
                key={`m-node-${i}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                className="flex items-center gap-4"
              >
                <OrbSphere d={d} size={52} />
                <div>
                  <div className="font-serif text-sm text-ink font-semibold leading-tight">
                    {d.title}
                  </div>
                  <div className="text-[9px] font-mono text-ink-muted mt-0.5 leading-tight">
                    {d.detail}
                  </div>
                  <div className={`mt-1 inline-flex items-center gap-1 text-[8px] tracking-[0.22em] uppercase font-sans font-medium ${TONE_TEXT[d.tone]}`}>
                    <span className="size-1 rounded-full bg-current" />
                    {d.status}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        <AnimatePresence>
          {phase === "done" && scenario && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-6 flex items-center gap-2 relative"
            >
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-serif italic text-sm text-emerald-200">
                shipped in {scenario.totalTime}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
