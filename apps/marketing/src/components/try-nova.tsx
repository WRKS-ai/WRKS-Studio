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

/* ============================================================
 * Main component
 * ============================================================ */

const STATUS_LINES = ["Parsing intent…", "Picking frameworks…", "Drafting deliverables…"];

const VOICE_STORAGE_KEY = "wrks-voice-on";

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
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voice preference on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(VOICE_STORAGE_KEY);
    if (saved === "1") setVoiceOn(true);
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
    // Cancel previous run and any in-progress speech
    cancelRef.current.cancelled = true;
    stopSpeech();
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
            <span className="absolute left-4 size-1.5 rounded-full bg-emerald-400 animate-pulse pointer-events-none" />
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={isBusy}
              placeholder="Tell Nova what to make…"
              className="flex-1 h-12 pl-9 pr-4 rounded-2xl bg-canvas border border-line text-ink placeholder:text-ink-dim text-sm font-sans focus:outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10 transition-all disabled:opacity-60"
            />
            <motion.button
              type="submit"
              disabled={isBusy || !input.trim()}
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
        </div>

        {/* Response panel */}
        <AnimatePresence>
          {showResponse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 sm:px-7 pt-5 pb-6 border-t border-line/60 mt-5">
                {/* Nova row */}
                <div className="flex items-center gap-3 mb-3">
                  <NovaOrb pulsing={isBusy} speaking={isSpeaking} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-sans font-semibold text-ink">Nova</span>
                      <span className="text-[9px] font-mono text-ink-dim flex items-center gap-1">
                        <span
                          className={`size-1 rounded-full ${
                            isSpeaking
                              ? "bg-sky-400 animate-pulse"
                              : phase === "done"
                                ? "bg-emerald-400"
                                : "bg-amber-400 animate-pulse"
                          }`}
                        />
                        {isSpeaking
                          ? "speaking"
                          : phase === "thinking"
                            ? "thinking"
                            : phase === "working"
                              ? "drafting"
                              : "shipped"}
                      </span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${phase}-${statusStep}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="text-[10px] sm:text-xs font-sans text-ink-muted mt-0.5"
                      >
                        {phase === "thinking"
                          ? STATUS_LINES[statusStep]
                          : phase === "working"
                            ? `Drafting ${scenario?.deliverables.length} deliverables…`
                            : `Shipped in ${scenario?.totalTime ?? `${elapsed.toFixed(1)}s`}`}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {isBusy && (
                    <span className="text-[10px] font-mono text-ink-dim tabular-nums">
                      {elapsed.toFixed(1)}s
                    </span>
                  )}
                </div>

                {/* You said */}
                {scenario?.prompt && (
                  <div className="mb-3 rounded-xl border border-line bg-canvas/60 px-3 py-2">
                    <div className="text-[8px] tracking-[0.22em] uppercase text-ink-dim font-sans mb-1">
                      You said
                    </div>
                    <p className="text-sm font-serif italic text-ink leading-snug">
                      &ldquo;{scenario.prompt}&rdquo;
                    </p>
                  </div>
                )}

                {/* Deliverable cards */}
                <div className="space-y-2">
                  {scenario?.deliverables.map((d, i) => {
                    const visible = i < shownCount;
                    return (
                      <motion.div
                        key={`${scenario.id}-${i}-${d.title}`}
                        initial={{ opacity: 0, x: 16, scale: 0.98 }}
                        animate={
                          visible
                            ? { opacity: 1, x: 0, scale: 1 }
                            : { opacity: 0, x: 16, scale: 0.98 }
                        }
                        transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                        className={`rounded-xl border ${TONE_RING[d.tone]} bg-canvas/60 px-3 py-2.5 flex items-center gap-3`}
                      >
                        {/* Thumbnail */}
                        <div
                          className="relative size-10 rounded-lg overflow-hidden border border-line shrink-0 flex items-center justify-center text-white/95"
                          style={{ background: TONE_GRADIENTS[d.tone] }}
                        >
                          <KindIcon kind={d.kind} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-sans font-semibold text-ink truncate">
                              {d.title}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-ink-muted mt-0.5 truncate">
                            {d.detail}
                          </div>
                        </div>
                        <span className={`text-[9px] tracking-[0.18em] uppercase font-sans font-medium ${TONE_TEXT[d.tone]} shrink-0`}>
                          {d.status}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Done footer */}
                <AnimatePresence>
                  {phase === "done" && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, delay: 0.2 }}
                      className="mt-3 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/40 text-[10px] tracking-[0.18em] uppercase text-emerald-200 font-sans font-medium">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                        Shipped in {scenario?.totalTime ?? `${elapsed.toFixed(1)}s`}
                      </div>
                      <span className="text-[10px] font-sans text-ink-dim italic">
                        This is a demo · waitlist for the real thing
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper line below */}
      <div className="mt-3 text-center text-[10px] tracking-[0.18em] uppercase text-ink-dim font-sans">
        Pick a preset or type your own · 1 sentence, 3 deliverables
      </div>
    </div>
  );
}

/* ============================================================
 * Atoms
 * ============================================================ */

function NovaOrb({ pulsing, speaking }: { pulsing: boolean; speaking: boolean }) {
  const active = pulsing || speaking;
  return (
    <div className="relative shrink-0">
      {speaking && (
        <>
          <motion.span
            className="absolute -inset-3 rounded-full border border-sky-300/30"
            animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute -inset-3 rounded-full border border-sky-300/20"
            animate={{ scale: [1, 1.45, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
        </>
      )}
      <motion.div
        className="absolute -inset-1.5 rounded-full"
        style={{
          background: speaking
            ? "radial-gradient(circle, rgba(125,211,252,0.35), transparent 70%)"
            : "radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%)",
        }}
        animate={active ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : { opacity: 0.5 }}
        transition={active ? { duration: speaking ? 0.9 : 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      />
      <div
        className="relative size-8 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 30%, #ffffff, #e0e7ff 60%, rgba(99,102,241,0.6) 100%)",
          boxShadow: speaking
            ? "0 0 24px 2px rgba(125,211,252,0.5), inset 0 -6px 14px rgba(50,30,80,0.5)"
            : pulsing
              ? "0 0 18px 0 rgba(165,180,252,0.45), inset 0 -6px 14px rgba(50,30,80,0.5)"
              : "0 4px 12px -4px rgba(0,0,0,0.6), inset 0 -6px 14px rgba(50,30,80,0.4)",
        }}
      >
        <span
          className="absolute size-1.5 rounded-full bg-white top-1.5 left-1.5"
          style={{ filter: "blur(0.5px)" }}
        />
        {speaking && (
          <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="block w-[2px] rounded-full bg-white/90"
                animate={{ height: ["20%", "65%", "30%", "55%", "20%"] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.12,
                }}
                style={{ filter: "drop-shadow(0 0 2px rgba(125,211,252,0.8))" }}
              />
            ))}
          </div>
        )}
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
