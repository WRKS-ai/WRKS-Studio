"use client";

import { AnimatePresence, motion, useTime, useTransform } from "motion/react";
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
      <VoiceScene
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

/* ---------- Voice Scene — Nova on left, living previews on right ---------- */

/* Stable, pseudo-random scatter for ambient dust */
const DUST: { left: string; top: string; dur: number; delay: number }[] = [
  { left: "6%", top: "18%", dur: 6.2, delay: 0 },
  { left: "16%", top: "78%", dur: 7.5, delay: 0.8 },
  { left: "26%", top: "10%", dur: 5.8, delay: 1.6 },
  { left: "38%", top: "88%", dur: 8.1, delay: 0.4 },
  { left: "52%", top: "6%", dur: 6.6, delay: 1.2 },
  { left: "66%", top: "82%", dur: 7.2, delay: 2.0 },
  { left: "78%", top: "20%", dur: 5.4, delay: 0.6 },
  { left: "88%", top: "62%", dur: 7.8, delay: 1.4 },
  { left: "10%", top: "50%", dur: 6.0, delay: 2.4 },
  { left: "94%", top: "40%", dur: 6.4, delay: 1.0 },
];

/* Petal positions in stage coords (relative to Nova at center).
 * Stage = 960×600, Nova centered at (260, 300) — left third.
 * Petals fan out to the right at three vertical levels. */
const PETALS: {
  shape: string; // CSS border-radius — organic blob
  cx: number;
  cy: number;
  rotate: number;
  ribbonOffset: number;
}[] = [
  { shape: "62% 38% 58% 42% / 50% 56% 44% 50%", cx: 700, cy: 145, rotate: -3, ribbonOffset: -22 },
  { shape: "52% 48% 54% 46% / 56% 46% 54% 44%", cx: 740, cy: 300, rotate: 1.5, ribbonOffset: 0 },
  { shape: "40% 60% 42% 58% / 54% 50% 50% 46%", cx: 700, cy: 455, rotate: 3, ribbonOffset: 22 },
];

const NOVA_CX = 260;
const NOVA_CY = 300;
const STAGE_W = 960;
const STAGE_H = 600;

/* ---------- Living previews: per-kind stylized mini-UI ---------- */

function PreviewSocial({ d }: { d: Deliverable }) {
  return (
    <div className="relative w-full h-full flex flex-col px-4 py-3.5">
      {/* Top — handle + menu */}
      <div className="flex items-center gap-1.5">
        <div
          className="size-4 rounded-full"
          style={{ background: TONE_GRADIENTS[d.tone] }}
        />
        <div className="h-1 w-12 rounded-full bg-white/40" />
        <span className="ml-auto text-[8px] text-white/40 tracking-widest">···</span>
      </div>
      {/* Image */}
      <div
        className="mt-2 flex-1 rounded-md relative overflow-hidden"
        style={{
          background: TONE_GRADIENTS[d.tone],
          minHeight: 56,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-white/95" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>
          <KindIcon kind={d.kind} size={20} />
        </div>
        <div className="absolute bottom-1 left-2 right-2">
          <div className="h-1 w-2/3 rounded-full bg-white/45" />
        </div>
      </div>
      {/* Caption + icons */}
      <div className="mt-2 flex items-center gap-1.5">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2.2"><path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.65-7 10-7 10z"/></svg>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="2.2"><path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.3-4.6A8.5 8.5 0 1 1 21 11.5z"/></svg>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="2.2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <span className="ml-auto h-0.5 w-6 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

function PreviewWebsite({ d }: { d: Deliverable }) {
  return (
    <div className="relative w-full h-full flex flex-col px-4 py-3">
      {/* Browser chrome */}
      <div className="flex items-center gap-1 mb-2">
        <span className="size-1.5 rounded-full bg-rose-300/70" />
        <span className="size-1.5 rounded-full bg-amber-300/70" />
        <span className="size-1.5 rounded-full bg-emerald-300/70" />
        <div className="ml-2 flex-1 h-2 rounded-full bg-white/15 px-1.5 flex items-center">
          <div className="h-0.5 w-12 rounded-full bg-white/50" />
        </div>
      </div>
      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="h-1.5 w-3/4 rounded-full bg-white/85 mb-1.5" />
        <div className="h-1 w-1/2 rounded-full bg-white/50 mb-1" />
        <div className="h-1 w-3/5 rounded-full bg-white/35 mb-2.5" />
        <div
          className="inline-flex items-center self-start px-2 py-1 rounded-full"
          style={{ background: TONE_GRADIENTS[d.tone] }}
        >
          <span className="h-0.5 w-7 rounded-full bg-white/90" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[8px] font-mono text-white/40 tracking-tight">{d.detail.split(" · ")[0] ?? d.detail}</span>
      </div>
    </div>
  );
}

function PreviewCoupon({ d }: { d: Deliverable }) {
  // Big mono code in a ticket / coupon shape
  const code = d.detail.split(" · ")[0]?.toUpperCase() ?? "WRKS20";
  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 py-3">
      <div
        className="absolute inset-3 rounded-2xl border-2 border-dashed"
        style={{ borderColor: TONE_GLOW[d.tone] }}
      />
      <span className="text-[8px] tracking-[0.24em] uppercase text-white/50 font-sans font-medium mb-1.5">
        Promo code
      </span>
      <div
        className="font-mono font-bold text-base tracking-[0.18em] text-white px-3 py-1 rounded-md"
        style={{
          background: TONE_GRADIENTS[d.tone],
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }}
      >
        {code}
      </div>
      <span className="mt-2 font-serif italic text-[11px] text-white/70">
        {d.detail.split(" · ")[1] ?? "20% off"}
      </span>
    </div>
  );
}

function PreviewBlog({ d }: { d: Deliverable }) {
  return (
    <div className="relative w-full h-full flex flex-col px-4 py-3.5">
      <span className="text-[8px] tracking-[0.22em] uppercase text-white/40 font-sans">
        Article
      </span>
      <div className="mt-2 h-1.5 w-4/5 rounded-full bg-white/85" />
      <div className="mt-1.5 h-1 w-3/4 rounded-full bg-white/70" />
      <div className="mt-3 space-y-1">
        <div className="h-0.5 w-full rounded-full bg-white/35" />
        <div className="h-0.5 w-full rounded-full bg-white/35" />
        <div className="h-0.5 w-5/6 rounded-full bg-white/30" />
        <div className="h-0.5 w-full rounded-full bg-white/30" />
        <div className="h-0.5 w-3/4 rounded-full bg-white/25" />
      </div>
      <div className="mt-auto flex items-center gap-1.5">
        <div
          className="size-3 rounded-full"
          style={{ background: TONE_GRADIENTS[d.tone] }}
        />
        <span className="text-[8px] font-mono text-white/50">{d.detail.split(" · ")[0]}</span>
      </div>
    </div>
  );
}

function PreviewEmail({ d }: { d: Deliverable }) {
  return (
    <div className="relative w-full h-full flex flex-col px-4 py-3.5">
      <div className="flex items-center gap-1.5">
        <div
          className="size-5 rounded-md flex items-center justify-center text-white"
          style={{ background: TONE_GRADIENTS[d.tone] }}
        >
          <KindIcon kind="email" size={11} />
        </div>
        <div className="flex-1">
          <div className="h-1 w-3/4 rounded-full bg-white/80" />
          <div className="mt-1 h-0.5 w-1/2 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-0.5 w-full rounded-full bg-white/40" />
        <div className="h-0.5 w-5/6 rounded-full bg-white/35" />
        <div className="h-0.5 w-3/4 rounded-full bg-white/30" />
        <div className="h-0.5 w-full rounded-full bg-white/30" />
      </div>
      <div className="mt-auto flex items-center justify-end gap-1.5">
        <span className="text-[8px] tracking-[0.18em] uppercase text-white/50 font-sans">send</span>
        <span aria-hidden className="text-white/70">→</span>
      </div>
    </div>
  );
}

function PreviewAd({ d }: { d: Deliverable }) {
  return (
    <div className="relative w-full h-full flex flex-col px-4 py-3.5">
      <div
        className="rounded-md flex-1 relative overflow-hidden mb-2"
        style={{ background: TONE_GRADIENTS[d.tone], minHeight: 48 }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-white/95" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>
          <KindIcon kind={d.kind} size={18} />
        </div>
        <div className="absolute bottom-1.5 left-2 right-2 h-1 rounded-full bg-white/55" />
      </div>
      <div className="flex items-center gap-1">
        {["A", "B", "C"].map((v, i) => (
          <span
            key={v}
            className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
              i === 0 ? "bg-white text-canvas" : "bg-white/15 text-white/70"
            }`}
          >
            {v}
          </span>
        ))}
        <span className="ml-auto text-[8px] font-mono text-white/40">{d.detail.split(" · ")[0]}</span>
      </div>
    </div>
  );
}

function PreviewGeneric({ d }: { d: Deliverable }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-3">
      <div
        className="size-12 rounded-2xl flex items-center justify-center text-white relative mb-2.5"
        style={{
          background: TONE_GRADIENTS[d.tone],
          boxShadow: `0 6px 18px -6px ${TONE_GLOW[d.tone]}, inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.25)`,
        }}
      >
        <KindIcon kind={d.kind} size={20} />
      </div>
      <div className="text-center w-full">
        <div className="h-1 w-3/4 mx-auto rounded-full bg-white/75" />
        <div className="mt-1.5 h-0.5 w-1/2 mx-auto rounded-full bg-white/40" />
      </div>
    </div>
  );
}

function PreviewByKind({ d }: { d: Deliverable }) {
  switch (d.kind) {
    case "social":
    case "story":
      return <PreviewSocial d={d} />;
    case "website":
      return <PreviewWebsite d={d} />;
    case "code":
      return <PreviewCoupon d={d} />;
    case "blog":
    case "copy":
      return <PreviewBlog d={d} />;
    case "email":
      return <PreviewEmail d={d} />;
    case "ad":
      return <PreviewAd d={d} />;
    default:
      return <PreviewGeneric d={d} />;
  }
}

/* ---------- Petal (organic-shaped living preview tile) ---------- */
function LivingPetal({
  d,
  index,
  visible,
}: {
  d: Deliverable;
  index: number;
  visible: boolean;
}) {
  const petal = PETALS[index] ?? PETALS[0]!;
  // Subtle continuous breath
  const time = useTime();
  const bobY = useTransform(time, (t) => Math.sin((t / 1000 + index * 1.3) * 1.4) * 5);
  const bobR = useTransform(time, (t) => Math.sin((t / 1000 + index * 0.7) * 0.9) * 1.3);

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: petal.cx,
        top: petal.cy,
        width: 220,
        height: 150,
        marginLeft: -110,
        marginTop: -75,
        y: bobY,
        rotate: useTransform(bobR, (r) => petal.rotate + r),
      }}
      initial={{ opacity: 0, scale: 0.4, x: -340 }}
      animate={visible ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.4, x: -340 }}
      transition={{ duration: 0.95, ease: [0.2, 0.7, 0.2, 1], delay: visible ? 0.15 : 0 }}
    >
      <div
        className="relative w-full h-full backdrop-blur-sm"
        style={{
          borderRadius: petal.shape,
          background: `linear-gradient(135deg, rgba(20,20,32,0.92) 0%, rgba(30,28,52,0.92) 100%)`,
          border: `1px solid ${TONE_GLOW[d.tone]}`,
          boxShadow: `0 22px 50px -16px rgba(0,0,0,0.7), 0 0 32px -8px ${TONE_GLOW[d.tone]}, inset 0 1px 0 rgba(255,255,255,0.06)`,
          overflow: "hidden",
        }}
      >
        {/* Inner tone wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 0%, ${TONE_GLOW[d.tone]} 0%, transparent 55%)`,
            opacity: 0.5,
          }}
        />
        {/* Content */}
        <div className="relative w-full h-full">
          <PreviewByKind d={d} />
        </div>
      </div>
      {/* Naked label under petal */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 text-center whitespace-nowrap">
        <div className="font-serif text-[13px] text-ink font-semibold leading-tight">
          {d.title}
        </div>
        <div className={`mt-1 inline-flex items-center gap-1 text-[8px] tracking-[0.24em] uppercase font-sans font-medium ${TONE_TEXT[d.tone]}`}>
          <span className="size-1 rounded-full bg-current" />
          {d.status}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Flowing voice ribbon (SVG path) ---------- */
function VoiceRibbon({
  index,
  visible,
  tone,
}: {
  index: number;
  visible: boolean;
  tone: Deliverable["tone"];
}) {
  const petal = PETALS[index] ?? PETALS[0]!;
  // Source: right edge of Nova
  const sx = NOVA_CX + 75;
  const sy = NOVA_CY + petal.ribbonOffset;
  // Target: left side of petal
  const tx = petal.cx - 100;
  const ty = petal.cy;
  // Two control points for a flowing S-curve
  const c1x = sx + (tx - sx) * 0.35;
  const c1y = sy;
  const c2x = sx + (tx - sx) * 0.7;
  const c2y = ty;
  const path = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;

  return (
    <g>
      {/* Outer soft glow */}
      <motion.path
        d={path}
        stroke={TONE_GLOW[tone]}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: visible ? 1 : 0, opacity: visible ? 0.6 : 0 }}
        transition={{ duration: 0.95, ease: "easeOut" }}
        style={{ filter: `blur(4px)` }}
      />
      {/* Crisp inner line */}
      <motion.path
        d={path}
        stroke={TONE_GLOW[tone]}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: visible ? 1 : 0, opacity: visible ? 0.9 : 0 }}
        transition={{ duration: 0.95, ease: "easeOut" }}
      />
    </g>
  );
}

function VoiceScene({
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
      {/* Desktop: horizontal voice→preview scene */}
      <div className="hidden md:block relative w-full" style={{ height: STAGE_H }}>
        {/* Ambient backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 25% 50%, rgba(99,102,241,0.22), transparent 55%), radial-gradient(ellipse at 80% 50%, rgba(244,114,182,0.1), transparent 60%)",
          }}
        />
        {/* Drifting dust */}
        {DUST.map((p, i) => (
          <motion.span
            key={`dust-${i}`}
            className="absolute size-[3px] rounded-full bg-white/40 pointer-events-none"
            style={{ left: p.left, top: p.top, filter: "blur(0.5px)" }}
            animate={{ y: [0, -14, 0], opacity: [0.15, 0.55, 0.15] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}

        {/* Stage canvas — fixed aspect coords */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            marginLeft: -STAGE_W / 2,
            marginTop: -STAGE_H / 2,
          }}
        >
          {/* SVG layer: voice ribbons */}
          <svg
            className="absolute pointer-events-none"
            width={STAGE_W}
            height={STAGE_H}
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            style={{ overflow: "visible" }}
          >
            {scenario &&
              scenario.deliverables.map((d, i) => (
                <VoiceRibbon
                  key={`ribbon-${scenario.id}-${i}`}
                  index={i}
                  visible={i < shownCount}
                  tone={d.tone}
                />
              ))}
          </svg>

          {/* Nova orb — speak button */}
          <motion.button
            type="button"
            onClick={onOrbTap}
            whileHover={{ scale: micSupported ? 1.04 : 1 }}
            whileTap={{ scale: micSupported ? 0.96 : 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            aria-label={isListening ? "Stop listening" : micSupported ? "Tap Nova to talk" : "Tap a preset below"}
            disabled={!micSupported}
            className="absolute z-20 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-300/50 disabled:cursor-default"
            style={{
              left: NOVA_CX,
              top: NOVA_CY,
              marginLeft: -75,
              marginTop: -75,
              cursor: micSupported ? "pointer" : "default",
            }}
          >
            <BigNovaOrb size={150} pulsing={isBusy} speaking={isSpeaking} listening={isListening} />
          </motion.button>

          {/* Status / hint / transcript text — under Nova */}
          <div
            className="absolute z-10 pointer-events-none text-center"
            style={{ left: NOVA_CX, top: NOVA_CY + 110, marginLeft: -160, width: 320 }}
          >
            <AnimatePresence mode="wait">
              {!scenario && !isListening && (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="font-serif italic text-base lg:text-lg text-ink-muted"
                >
                  {micSupported ? "Tap Nova to talk" : "Pick a phrase below"}
                </motion.div>
              )}
              {isListening && (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
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
              {scenario && !isListening && (
                <motion.div
                  key={`status-${phase}-${statusStep}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="font-serif italic text-base text-ink-muted whitespace-nowrap">
                    {statusText}
                  </div>
                  {isBusy && (
                    <div className="text-[9px] font-mono text-ink-dim tabular-nums mt-1">
                      {elapsed.toFixed(1)}s
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Three living petals — actual content previews */}
          {scenario &&
            scenario.deliverables.map((d, i) => (
              <LivingPetal
                key={`petal-${scenario.id}-${i}`}
                d={d}
                index={i}
                visible={i < shownCount}
              />
            ))}

          {/* Shipped serif label */}
          <AnimatePresence>
            {phase === "done" && scenario && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute z-20 flex items-center gap-2 pointer-events-none"
                style={{ left: NOVA_CX, top: NOVA_CY + 170, marginLeft: -100, width: 200, justifyContent: "center" }}
              >
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-serif italic text-base text-emerald-200">
                  shipped in {scenario.totalTime}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="absolute bottom-2 right-4 text-[9px] font-sans text-ink-dim italic z-20">
          demo · waitlist for the real thing
        </span>
      </div>

      {/* Mobile / narrow: vertical with mini-petals */}
      <div className="md:hidden relative flex flex-col items-center pt-6 pb-6 overflow-hidden">
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
          <BigNovaOrb size={104} pulsing={isBusy} speaking={isSpeaking} listening={isListening} />
        </motion.button>

        <div className="mt-5 min-h-[2.4em] relative text-center px-6">
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
              <div className="font-serif italic text-sm text-ink">{transcript || "…"}</div>
            </div>
          )}
          {scenario && !isListening && (
            <span className="font-serif italic text-sm text-ink-muted">{statusText}</span>
          )}
        </div>

        <div className="mt-6 w-full flex flex-col items-center gap-7 relative px-4">
          {scenario &&
            scenario.deliverables.map((d, i) => {
              const visible = i < shownCount;
              const petal = PETALS[i] ?? PETALS[0]!;
              return (
                <motion.div
                  key={`m-petal-${i}`}
                  initial={{ opacity: 0, scale: 0.7, y: 18 }}
                  animate={visible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.7, y: 18 }}
                  transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                  className="relative w-full max-w-[260px]"
                >
                  <div
                    className="relative w-full backdrop-blur-sm"
                    style={{
                      height: 150,
                      borderRadius: petal.shape,
                      background: "linear-gradient(135deg, rgba(20,20,32,0.92) 0%, rgba(30,28,52,0.92) 100%)",
                      border: `1px solid ${TONE_GLOW[d.tone]}`,
                      boxShadow: `0 22px 50px -16px rgba(0,0,0,0.7), 0 0 32px -8px ${TONE_GLOW[d.tone]}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at 30% 0%, ${TONE_GLOW[d.tone]} 0%, transparent 55%)`,
                        opacity: 0.5,
                      }}
                    />
                    <PreviewByKind d={d} />
                  </div>
                  <div className="mt-3 text-center">
                    <div className="font-serif text-[13px] text-ink font-semibold leading-tight">
                      {d.title}
                    </div>
                    <div className={`mt-1 inline-flex items-center gap-1 text-[8px] tracking-[0.24em] uppercase font-sans font-medium ${TONE_TEXT[d.tone]}`}>
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
