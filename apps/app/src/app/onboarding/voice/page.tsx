"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { PersonalityIcon } from "@/components/personality-icon";
import { VoiceCard } from "@/components/voice-card";
import {
  PERSONALITIES,
  type PersonalityId,
} from "@/lib/personalities";
import { SAMPLE_SCRIPT, VOICES, type VoiceId } from "@/lib/voices";

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";

export default function VoicePage() {
  const router = useRouter();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<VoiceId | null>(null);
  const [playingVoice, setPlayingVoice] = useState<VoiceId | null>(null);

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
    setPersonalityId(p);
    setAgentName(n);
    const v = localStorage.getItem(VOICE_KEY) as VoiceId | null;
    if (v && VOICES.some((x) => x.id === v)) {
      setSelectedVoice(v);
    }
  }, [router]);

  if (!personalityId) return null;
  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;

  const onSelect = (id: VoiceId) => setSelectedVoice(id);

  const onContinue = () => {
    if (!selectedVoice) return;
    localStorage.setItem(VOICE_KEY, selectedVoice);
    router.push("/onboarding/intake");
  };

  const selectedName = VOICES.find((v) => v.id === selectedVoice)?.name;

  return (
    <OnboardingShell
      step={3}
      totalSteps={4}
      stepLabel={`Step 3 · ${agentName}'s voice`}
      heading={`Give ${agentName} a voice.`}
      subheading={
        <>
          Tap each one to hear them say:{" "}
          <em className="text-ink not-italic" style={{ fontStyle: "italic" }}>
            &ldquo;{SAMPLE_SCRIPT}&rdquo;
          </em>
        </>
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => router.push("/onboarding/name")}
            className="text-[12px] text-ink-dim hover:text-ink-muted transition-colors font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 rounded-[6px] px-1 py-0.5 -mx-1"
          >
            ← Back
          </button>
          <motion.button
            type="button"
            onClick={onContinue}
            disabled={!selectedVoice}
            whileHover={selectedVoice ? { x: 2 } : undefined}
            whileTap={selectedVoice ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="h-11 px-5 rounded-[10px] bg-ink text-canvas text-[14px] font-sans font-semibold inline-flex items-center gap-2 transition-all hover:bg-white disabled:bg-white/[0.08] disabled:text-ink-dim disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
          >
            {selectedName
              ? `Continue with ${selectedName}`
              : "Pick a voice to continue"}
            <span aria-hidden>→</span>
          </motion.button>
        </>
      }
    >
      {/* Small personality reminder at top — visual tie to step 1 */}
      <div className="flex flex-col items-center text-center mb-10 sm:mb-12">
        <PersonalityIcon personality={personality} size="sm" />
        <div className="mt-3 text-[11px] tracking-[0.22em] uppercase text-ink-dim font-mono">
          {personality.name} · {agentName}
        </div>
      </div>

      {/* Voice cards — single column, 2 columns on wider screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {VOICES.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            selected={selectedVoice === voice.id}
            isPlaying={playingVoice === voice.id}
            onSelect={() => onSelect(voice.id)}
            onPlayChange={({ playing, voiceId }) => {
              setPlayingVoice(playing ? voiceId : null);
            }}
          />
        ))}
      </div>

      {/* Below — note about samples */}
      <p className="mt-8 text-center text-[11px] tracking-[0.18em] uppercase text-ink-dim font-mono">
        Powered by ElevenLabs · Same voice across calls, the app, and your phone
      </p>
    </OnboardingShell>
  );
}
