"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Scenario = {
  prompt: string;
  outputs: { label: string; status: string }[];
};

const SCENARIOS: Scenario[] = [
  {
    prompt:
      "20% promo for March. Social post, banner on my site, discount code for returning customers.",
    outputs: [
      { label: "Instagram post", status: "Published" },
      { label: "Website banner", status: "Live on site" },
      { label: "Discount code", status: "Active for returning users" },
    ],
  },
  {
    prompt:
      "We're launching a new latte on Friday. Make me a post and a story tile.",
    outputs: [
      { label: "Instagram post · 1080×1080", status: "Scheduled" },
      { label: "Story tile · 1080×1920", status: "Scheduled" },
      { label: "Brand voice memory", status: "Updated" },
    ],
  },
  {
    prompt:
      "Write a Black Friday landing page for the gift card. Include the offer and a buy button.",
    outputs: [
      { label: "Landing page", status: "Deployed to live domain" },
      { label: "Stripe checkout", status: "Embedded" },
      { label: "Lead form", status: "Forwarding to CRM" },
    ],
  },
];

type Phase = "typing" | "working" | "done" | "fading";

const TYPING_SPEED_MS = 22;
const WORK_BUFFER_MS = 800;
const STAGGER_MS = 380;
const HOLD_MS = 2400;
const FADE_MS = 500;

export function LiveDemo({
  onSpeakingChange,
}: {
  onSpeakingChange?: (speaking: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const [shownCount, setShownCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const speakingRef = useRef(onSpeakingChange);
  speakingRef.current = onSpeakingChange;

  const scenario = SCENARIOS[index]!;

  // Reset state on scenario change
  useEffect(() => {
    setTyped("");
    setShownCount(0);
    setElapsed(0);
    setPhase("typing");
    speakingRef.current?.(false);
  }, [index]);

  // Typing animation
  useEffect(() => {
    if (phase !== "typing") return;
    let i = 0;
    speakingRef.current?.(true);
    const id = setInterval(() => {
      i += 1;
      if (i <= scenario.prompt.length) {
        setTyped(scenario.prompt.slice(0, i));
      } else {
        clearInterval(id);
        setPhase("working");
      }
    }, TYPING_SPEED_MS);
    return () => clearInterval(id);
  }, [phase, scenario.prompt]);

  // Working + staggering outputs
  useEffect(() => {
    if (phase !== "working") return;
    speakingRef.current?.(true);

    const start = Date.now();
    const tick = setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 60);

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    scenario.outputs.forEach((_, i) => {
      timeouts.push(
        setTimeout(() => {
          setShownCount(i + 1);
        }, WORK_BUFFER_MS + i * STAGGER_MS),
      );
    });
    timeouts.push(
      setTimeout(
        () => {
          setPhase("done");
          speakingRef.current?.(false);
          clearInterval(tick);
        },
        WORK_BUFFER_MS + scenario.outputs.length * STAGGER_MS + 200,
      ),
    );

    return () => {
      clearInterval(tick);
      timeouts.forEach(clearTimeout);
    };
  }, [phase, scenario.outputs]);

  // Done → fading
  useEffect(() => {
    if (phase !== "done") return;
    const id = setTimeout(() => setPhase("fading"), HOLD_MS);
    return () => clearTimeout(id);
  }, [phase]);

  // Fading → next scenario
  useEffect(() => {
    if (phase !== "fading") return;
    const id = setTimeout(
      () => setIndex((n) => (n + 1) % SCENARIOS.length),
      FADE_MS,
    );
    return () => clearTimeout(id);
  }, [phase]);

  const fading = phase === "fading";
  const working = phase === "working";
  const done = phase === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      <motion.div
        animate={{ opacity: fading ? 0.2 : 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Prompt card */}
        <div className="border border-line rounded-2xl bg-panel backdrop-blur-md p-5 shadow-2xl shadow-black/60 ring-1 ring-white/[0.04]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-[0.18em] uppercase text-ink-muted font-sans">
              You said
            </span>
            <span className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-ink-muted font-sans">
              <span className="size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
              Live
            </span>
          </div>
          <p className="font-serif text-base sm:text-lg leading-snug italic text-ink min-h-[3.2em]">
            &ldquo;{typed}
            <span
              className={cn(
                "inline-block w-[2px] ml-0.5 align-middle bg-ink",
                phase === "typing" ? "animate-pulse" : "opacity-0",
              )}
              style={{ height: "1em" }}
            />
            &rdquo;
          </p>
        </div>

        {/* Status bar */}
        <motion.div
          animate={{ opacity: working || done ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 flex items-center gap-3 text-[10px] tracking-[0.18em] uppercase text-ink-muted font-sans"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              working
                ? "bg-emerald-400/80 animate-pulse"
                : "bg-ink-muted/60",
            )}
          />
          {working
            ? `Agent is making ${scenario.outputs.length} things`
            : `${scenario.outputs.length} deliverables shipped`}
          <span className="flex-1 h-px bg-line" />
          <span className="font-mono text-ink-muted">
            {elapsed.toFixed(1)}s
          </span>
        </motion.div>

        {/* Outputs */}
        <div className="mt-3 space-y-2">
          {scenario.outputs.map((o, i) => {
            const visible = i < shownCount;
            return (
              <motion.div
                key={`${index}-${o.label}`}
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                animate={
                  visible
                    ? { opacity: 1, x: 0, scale: 1 }
                    : { opacity: 0, x: 24, scale: 0.98 }
                }
                transition={{
                  duration: 0.55,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="group border border-line rounded-xl bg-panel/90 p-4 flex items-center justify-between ring-1 ring-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={visible ? { scale: 1 } : { scale: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 20,
                      delay: visible ? 0.1 : 0,
                    }}
                    className="size-7 rounded-full bg-ink text-canvas flex items-center justify-center text-[11px] font-sans font-semibold"
                  >
                    {i + 1}
                  </motion.div>
                  <span className="text-sm font-sans font-medium">
                    {o.label}
                  </span>
                </div>
                <span className="text-[10px] tracking-[0.18em] uppercase text-emerald-400/90 font-sans font-medium">
                  {o.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Scenario indicator */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {SCENARIOS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-[3px] rounded-full transition-all duration-500",
              i === index ? "w-8 bg-ink" : "w-2 bg-ink-dim",
            )}
          />
        ))}
      </div>
      <div className="mt-2 text-center text-xs font-sans text-ink-dim">
        One sentence. Multiple outputs. Zero tools opened.
      </div>
    </motion.div>
  );
}
