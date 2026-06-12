"use client";

import {
  ConversationProvider,
  useConversation,
  useConversationClientTool,
} from "@elevenlabs/react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { PersonalityIcon } from "@/components/personality-icon";
import { orbColorsFromAccent, SiriOrb } from "@/components/siri-orb";
import {
  PERSONALITIES,
  type Personality,
  type PersonalityId,
} from "@/lib/personalities";
import {
  type ChatLine,
  type DeliverableKind,
  resolveVoiceField,
  StudioContextProvider,
  type StoredWowPayload,
  type VoiceField,
  VoiceFieldRegistryProvider,
} from "@/lib/studio-context";
import {
  addPage,
  addSection,
  findPageByLabel,
  migrateLandingToSite,
  type SectionType,
  setActivePage,
  setSectionField,
  type Site,
} from "@/lib/site-model";
import {
  buildFirstMessage,
  buildSystemPrompt,
  readDeliverableAsText,
  resolveDeliverableKind,
  resolveNavRoute,
  type DeliverableKind as VoiceDeliverableKind,
} from "@/lib/voice-agent";
import { VOICES, type VoiceId } from "@/lib/voices";

// The right inspector: agent identity, chat history, composer, voice
// session. Lives in the studio layout so it persists across navigation.
// Owns the shared studio state and exposes it to descendants via
// StudioContextProvider.

const PERSONALITY_KEY = "wrks-onboarding-personality";
const NAME_KEY = "wrks-onboarding-name";
const VOICE_KEY = "wrks-onboarding-voice";
const STUDIO_KEY = "wrks-studio-deliverables";
const STUDIO_KEY_SITE = "wrks-studio-site";

const VALID_SECTION_TYPES: SectionType[] = [
  "hero",
  "feature_grid",
  "pricing",
  "testimonials",
  "faq",
  "cta_band",
  "footer",
  "rich_text",
];

function resolveSectionType(spoken: string): SectionType | null {
  const k = spoken.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((VALID_SECTION_TYPES as string[]).includes(k))
    return k as SectionType;
  if (k.includes("hero") || k.includes("banner")) return "hero";
  if (k.includes("feature") || k.includes("pillar") || k.includes("benefit"))
    return "feature_grid";
  if (k.includes("pricing") || k.includes("plan") || k.includes("tier"))
    return "pricing";
  if (
    k.includes("testimonial") ||
    k.includes("quote") ||
    k.includes("review") ||
    k.includes("social_proof")
  )
    return "testimonials";
  if (k.includes("faq") || k.includes("question")) return "faq";
  if (k.includes("cta") || k.includes("call_to_action") || k.includes("call_to"))
    return "cta_band";
  if (k.includes("footer")) return "footer";
  if (k.includes("rich") || k.includes("text") || k.includes("paragraph"))
    return "rich_text";
  return null;
}

const SUGGESTIONS = [
  "Tighten the headline",
  "Sharper angle on the hook",
  "Make it 30% shorter",
];

export function StudioInspectorFrame({ children }: { children: React.ReactNode }) {
  // Outer wrapper — owns the bootstrap (load identity from localStorage),
  // then mounts the ConversationProvider only once identity is known.
  const router = useRouter();
  const [personalityId, setPersonalityId] = useState<PersonalityId | null>(
    null,
  );
  const [agentName, setAgentName] = useState<string>("");
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [stored, setStored] = useState<StoredWowPayload | null>(null);
  const [bootChecked, setBootChecked] = useState(false);

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
    setPersonalityId(p);
    setAgentName(n);
    setVoiceId(v);
    const raw = localStorage.getItem(STUDIO_KEY);
    if (raw) {
      try {
        setStored(JSON.parse(raw) as StoredWowPayload);
      } catch {
        // ignore
      }
    }
    setBootChecked(true);
  }, [router]);

  if (!bootChecked || !personalityId || !voiceId) {
    return (
      <div
        className="fixed inset-0 grid place-items-center"
        style={{ background: "#09090b", color: "rgba(245,245,247,0.5)" }}
      >
        <div
          className="text-[13px] tracking-[0.22em] uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Loading workspace…
        </div>
      </div>
    );
  }

  const personality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const voice = VOICES.find((v) => v.id === voiceId)!;

  return (
    <ConversationProvider>
      <StudioInspectorInner
        personality={personality}
        voice={voice}
        agentName={agentName}
        stored={stored}
        setStored={setStored}
      >
        {children}
      </StudioInspectorInner>
    </ConversationProvider>
  );
}

function StudioInspectorInner({
  personality,
  voice,
  agentName,
  stored,
  setStored,
  children,
}: {
  personality: Personality;
  voice: { id: VoiceId; name: string; elevenLabsId: string };
  agentName: string;
  stored: StoredWowPayload | null;
  setStored: (v: StoredWowPayload) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [activeId, setActiveId] = useState<DeliverableKind>("landing");
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [composing, setComposing] = useState("");
  const [thinking, setThinking] = useState(false);
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Multi-page Site model — replaces single-landing for the website
  // canvas. Migrated from the legacy landing shape on first load,
  // persisted under STUDIO_KEY_SITE.
  const [site, setSiteState] = useState<Site | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STUDIO_KEY_SITE);
    if (raw) {
      try {
        setSiteState(JSON.parse(raw) as Site);
        return;
      } catch {
        // ignore, fall through to migration
      }
    }
    if (stored?.deliverables) {
      const migrated = migrateLandingToSite({
        brandName: stored.deliverables.brandName,
        landing: stored.deliverables.landing,
        heroImage: stored.images.heroLandscape,
      });
      setSiteState(migrated);
      localStorage.setItem(STUDIO_KEY_SITE, JSON.stringify(migrated));
    }
  }, [stored]);
  const siteRef = useRef(site);
  useEffect(() => {
    siteRef.current = site;
  }, [site]);
  const setSite = useCallback((s: Site) => {
    setSiteState(s);
    if (typeof window !== "undefined") {
      localStorage.setItem(STUDIO_KEY_SITE, JSON.stringify(s));
    }
  }, []);

  // Voice field registry — survives across renders. Pages register
  // their editable fields; the set_field tool resolves spoken names
  // against this map.
  const fieldRegistryRef = useRef<Map<string, VoiceField>>(
    new Map<string, VoiceField>(),
  );
  const registry = useRef({
    register: (field: VoiceField) => {
      fieldRegistryRef.current.set(field.id, field);
      return () => {
        if (fieldRegistryRef.current.get(field.id) === field) {
          fieldRegistryRef.current.delete(field.id);
        }
      };
    },
    list: () => Array.from(fieldRegistryRef.current.values()),
  }).current;

  // Refs keep tool handlers seeing the latest state.
  const storedRef = useRef(stored);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    storedRef.current = stored;
  }, [stored]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const runRefine = useCallback(
    async (instruction: string): Promise<string> => {
      const currentStored = storedRef.current;
      const currentActive = activeIdRef.current;
      if (!currentStored) return "No deliverables loaded yet.";

      setThinking(true);
      try {
        const res = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalityId: personality.id,
            agentName,
            instruction,
            activeDeliverable: currentActive,
            stored: currentStored,
          }),
        });
        const data = (await res.json()) as
          | {
              reply: string;
              updated?: Partial<StoredWowPayload["deliverables"]>;
            }
          | { error: string };

        if ("error" in data) return data.error;

        if (data.updated) {
          const changed = new Set<string>();
          if (data.updated.landing)
            for (const k of Object.keys(data.updated.landing))
              changed.add(`landing.${k}`);
          if (data.updated.social)
            for (const k of Object.keys(data.updated.social))
              changed.add(`social.${k}`);
          if (data.updated.ad)
            for (const k of Object.keys(data.updated.ad))
              changed.add(`ad.${k}`);
          setFlashFields(changed);
          setTimeout(() => setFlashFields(new Set()), 2000);

          const merged: StoredWowPayload = {
            ...currentStored,
            deliverables: {
              ...currentStored.deliverables,
              ...data.updated,
              landing: {
                ...currentStored.deliverables.landing,
                ...data.updated.landing,
              },
              social: {
                ...currentStored.deliverables.social,
                ...data.updated.social,
              },
              ad: { ...currentStored.deliverables.ad, ...data.updated.ad },
            },
          };
          setStored(merged);
          localStorage.setItem(STUDIO_KEY, JSON.stringify(merged));
        }
        return data.reply;
      } catch (err) {
        return err instanceof Error ? err.message : "Network error";
      } finally {
        setThinking(false);
      }
    },
    [personality.id, agentName, setStored],
  );

  const onTextSubmit = useCallback(async () => {
    const message = composing.trim();
    if (!message || thinking) return;
    setChatLines((c) => [...c, { role: "user", text: message }]);
    setComposing("");
    const reply = await runRefine(message);
    setChatLines((c) => [...c, { role: "agent", text: reply }]);
    setTimeout(() => composerRef.current?.focus(), 50);
  }, [composing, thinking, runRefine]);

  /* ============================================================
   * Voice session
   * ============================================================ */
  const [voiceState, setVoiceState] = useState<
    "idle" | "connecting" | "listening" | "speaking" | "error"
  >("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[voice] connected");
      setVoiceState("listening");
      setVoiceError(null);
    },
    onDisconnect: () => {
      console.log("[voice] disconnected");
      setVoiceState("idle");
    },
    onError: (err: unknown) => {
      console.error("[voice] error", err);
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Voice connection error";
      setVoiceError(msg);
      setVoiceState("error");
    },
    onMessage: (event) => {
      const source = (event as { source?: string }).source;
      const text =
        (event as { message?: string }).message ??
        (event as { text?: string }).text ??
        "";
      if (!text) return;
      if (source === "user") {
        setChatLines((c) => [...c, { role: "user", text }]);
      } else if (source === "ai") {
        setChatLines((c) => [...c, { role: "agent", text }]);
      }
    },
    onModeChange: (event) => {
      const mode = (event as { mode?: string }).mode;
      if (mode === "speaking") setVoiceState("speaking");
      else if (mode === "listening") setVoiceState("listening");
    },
    onUnhandledClientToolCall: (call) => {
      console.warn("[voice] UNHANDLED tool call:", call);
    },
  });

  useConversationClientTool("set_active_deliverable", (params) => {
    console.log("[voice] set_active_deliverable", params);
    const kind = String(params?.kind ?? "");
    const resolved = resolveDeliverableKind(kind);
    if (!resolved) {
      return `I don't know which deliverable "${kind}" means.`;
    }
    setActiveId(resolved as DeliverableKind);
    if (typeof window !== "undefined" && window.location.pathname !== "/studio") {
      router.push("/studio");
    }
    return `Switched to ${resolved}.`;
  });
  useConversationClientTool("navigate", (params) => {
    console.log("[voice] navigate", params);
    const destination = String(params?.destination ?? "");
    const route = resolveNavRoute(destination);
    if (!route) return `I don't know how to open "${destination}".`;
    console.log("[voice] router.push →", route);
    router.push(route);
    // If the target includes a hash, fire hashchange after a tick so
    // any page already mounted on that path (e.g. /studio/settings)
    // re-reads the hash and updates its sub-section.
    const hashIdx = route.indexOf("#");
    if (hashIdx >= 0) {
      setTimeout(() => {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }, 50);
    }
    return `Opened ${destination}.`;
  });
  useConversationClientTool("refine_active", async (params) => {
    console.log("[voice] refine_active", params);
    const instruction = String(params?.instruction ?? "").trim();
    if (!instruction) return "Tell me what to change.";
    setChatLines((c) => [...c, { role: "user", text: instruction }]);
    const reply = await runRefine(instruction);
    return reply;
  });
  useConversationClientTool("read_active", () => {
    console.log("[voice] read_active");
    const s = storedRef.current;
    const a = activeIdRef.current;
    if (!s) return "No deliverables loaded yet.";
    return readDeliverableAsText({
      kind: a as VoiceDeliverableKind,
      stored: s.deliverables,
    });
  });
  /* ------------------- Multi-page website tools ------------------- */
  useConversationClientTool("add_page", (params) => {
    console.log("[voice] add_page", params);
    const label = String(params?.label ?? "").trim();
    if (!label) return "Tell me what to call the page.";
    const current = siteRef.current;
    if (!current) return "Site isn't loaded yet.";
    const next = addPage(current, label);
    setSite(next);
    return `Added a ${label} page.`;
  });

  useConversationClientTool("set_active_page", (params) => {
    console.log("[voice] set_active_page", params);
    const which = String(params?.page ?? "").trim();
    if (!which) return "Which page should I open?";
    const current = siteRef.current;
    if (!current) return "Site isn't loaded yet.";
    const found = findPageByLabel(current, which);
    if (!found) {
      const known = current.pages.map((p) => p.label).join(", ");
      return `I don't see a page called "${which}". Pages: ${known}.`;
    }
    setSite(setActivePage(current, found.id));
    return `Showing the ${found.label} page.`;
  });

  useConversationClientTool("add_section", (params) => {
    console.log("[voice] add_section", params);
    const typeIn = String(params?.section_type ?? "").trim();
    const pageIn = String(params?.page ?? "").trim();
    const resolvedType = resolveSectionType(typeIn);
    if (!resolvedType) {
      return `I don't know a section called "${typeIn}". Try hero, features, pricing, testimonials, faq, cta, footer, or rich text.`;
    }
    const current = siteRef.current;
    if (!current) return "Site isn't loaded yet.";
    let targetPageId = current.activePageId;
    if (pageIn) {
      const found = findPageByLabel(current, pageIn);
      if (!found) {
        const known = current.pages.map((p) => p.label).join(", ");
        return `I don't see a page called "${pageIn}". Pages: ${known}.`;
      }
      targetPageId = found.id;
    }
    setSite(addSection(current, targetPageId, resolvedType));
    return `Added a ${resolvedType.replace("_", " ")} section.`;
  });

  useConversationClientTool("set_section_field", (params) => {
    console.log("[voice] set_section_field", params);
    const sectionType = String(params?.section_type ?? "").trim();
    const fieldPath = String(params?.field_path ?? "").trim();
    const value = String(params?.value ?? "");
    if (!sectionType || !fieldPath) {
      return "Tell me which section and field to update.";
    }
    const wantedType = resolveSectionType(sectionType);
    if (!wantedType) {
      return `I don't recognise the "${sectionType}" section.`;
    }
    const current = siteRef.current;
    if (!current) return "Site isn't loaded yet.";
    const page = current.pages.find((p) => p.id === current.activePageId);
    if (!page) return "No active page.";
    const match = page.sections.find((s) => s.type === wantedType);
    if (!match) {
      return `The current page doesn't have a ${sectionType} section yet. Want me to add one?`;
    }
    const result = setSectionField(
      current,
      page.id,
      match.id,
      fieldPath,
      value,
    );
    if (!result.ok) {
      return `Couldn't update ${sectionType}.${fieldPath}: ${result.reason ?? "invalid path"}.`;
    }
    setSite(result.site);
    return `Updated ${sectionType} ${fieldPath} to "${value}".`;
  });

  useConversationClientTool("set_field", (params) => {
    console.log("[voice] set_field", params);
    const fieldName = String(params?.field ?? "").trim();
    const value = String(params?.value ?? "");
    if (!fieldName) return "Tell me which field to update.";
    const fields = registry.list();
    const match = resolveVoiceField(fieldName, fields);
    if (!match) {
      if (fields.length === 0) {
        return `No editable fields are visible right now. Try navigating to a page like Settings first.`;
      }
      const known = fields.map((f) => f.aliases[0] ?? f.id).join(", ");
      return `I don't see a field called "${fieldName}" here. Editable now: ${known}.`;
    }
    match.set(value);
    return `Updated ${match.aliases[0] ?? match.id} to "${value}".`;
  });

  const startVoice = useCallback(async () => {
    setVoiceError(null);
    setVoiceState("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch("/api/voice/signed-url");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          body?.error ?? `Signed-URL endpoint returned ${res.status}`,
        );
      }
      const { signedUrl } = (await res.json()) as { signedUrl: string };

      const systemPrompt = buildSystemPrompt({
        personality,
        agentName,
        voiceName: voice.name,
        stored: storedRef.current?.deliverables ?? null,
        activeDeliverable: activeIdRef.current as VoiceDeliverableKind,
      });
      const firstMessage = buildFirstMessage({
        personality,
        agentName,
        stored: storedRef.current?.deliverables ?? null,
      });

      await conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        overrides: {
          agent: {
            prompt: { prompt: systemPrompt },
            firstMessage,
            language: "en",
          },
          tts: { voiceId: voice.elevenLabsId },
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't start voice";
      setVoiceError(msg);
      setVoiceState("error");
    }
  }, [personality, voice, agentName, conversation]);

  const stopVoice = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // ignore
    }
    setVoiceState("idle");
  }, [conversation]);

  const voiceActive =
    voiceState === "listening" ||
    voiceState === "speaking" ||
    voiceState === "connecting";

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatLines.length, thinking]);

  // personality.accent is intentionally NOT pulled into chrome here.
  // Per master plan §C, the user's palette accent only appears in
  // their site preview content, the brand-system card, the floating
  // Siri orb (StudioFloatingAgent below), active page-card glow, and
  // the publish-sweep animation. The inspector chrome stays neutral.

  return (
    <StudioContextProvider
      value={{
        personality,
        voice: voice as unknown as import("@/lib/voices").Voice,
        agentName,
        stored,
        activeId,
        setActiveId,
        flashFields,
        chatLines,
        thinking,
        site,
        setSite,
      }}
    >
      <VoiceFieldRegistryProvider registry={registry}>
        <div className="flex-1 h-full flex min-w-0">
          {/* Main content area (children) */}
          <div className="flex-1 min-w-0 h-full overflow-hidden">
            {children}
          </div>

        {/* Right inspector — persistent across routes.
            Phase 3 redesign: tabbed (Agent · Properties · Comments),
            compact identity, ambient always-listening Aura orb (NOT a
            button — state visualizer only), transcript-style activity
            feed, minimal composer pinned at footer. */}
        <aside
          className="shrink-0 h-full flex flex-col"
          style={{
            width: 320,
            background: "#101012",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <InspectorTabs />

          {/* Compact agent identity — one row, no big Fraunces */}
          <InspectorIdentity
            personality={personality}
            agentName={agentName}
            voiceName={voice.name}
            voiceState={voiceState}
            thinking={thinking}
            reduced={!!reduced}
          />

          {/* AmbientAura removed — replaced by the floating Siri-orb
              at bottom-right of the studio (sibling to the layout
              flex, see end of this return). User rejected the
              inspector-panel orb pattern multiple times. */}

          {/* Activity feed — replaces chat bubbles + templated chips */}
          <ActivityFeed
            ref={transcriptRef}
            agentName={agentName}
            chatLines={chatLines}
            thinking={thinking}
            suggestions={SUGGESTIONS}
            reduced={!!reduced}
            onPickSuggestion={(s) => {
              setComposing(s);
              composerRef.current?.focus();
            }}
          />

          {/* Composer — minimal text input with tiny mic toggle */}
          <div className="shrink-0 px-4 pb-4 pt-3">
            <MiniComposer
              agentName={agentName}
              composing={composing}
              thinking={thinking}
              voiceActive={voiceActive}
              voiceError={voiceError}
              onVoiceToggle={voiceActive ? stopVoice : startVoice}
              onComposingChange={setComposing}
              onSubmit={onTextSubmit}
              composerRef={composerRef}
            />
          </div>
        </aside>
        </div>

        {/* Floating Siri orb at bottom-right — same affordance and
            material as the onboarding pages. Doubles as start/stop
            control for the voice session. The big AmbientAura that
            used to live inside the inspector aside is gone. */}
        <StudioFloatingAgent
          personality={personality}
          voiceState={voiceState}
          voiceActive={voiceActive}
          onClick={voiceActive ? stopVoice : startVoice}
        />
      </VoiceFieldRegistryProvider>
    </StudioContextProvider>
  );
}

/* ============================================================
 * StudioFloatingAgent — fixed bottom-right Siri orb.
 *
 * Visual + behavior mirror of the onboarding FloatingAgent so the
 * same agent experience persists into /studio. Click toggles voice
 * session start/stop. Pulses with voice state (faster while
 * speaking). 64px button with backdrop blur, accent ring, layered
 * shadows; SiriOrb at 50px inside.
 * ============================================================ */
function StudioFloatingAgent({
  personality,
  voiceState,
  voiceActive,
  onClick,
}: {
  personality: Personality;
  voiceState: "idle" | "connecting" | "listening" | "speaking" | "error";
  voiceActive: boolean;
  onClick: () => void;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const accent = personality.accent;
  const isConnecting = voiceState === "connecting";
  const speaking = voiceState === "speaking";
  const listening = voiceState === "listening";
  const active = speaking || listening || voiceActive;
  const errored = voiceState === "error";

  const ringColor = errored
    ? "rgba(255,150,150,0.7)"
    : active || hovered
      ? `${accent}aa`
      : "rgba(255,255,255,0.18)";

  const orbColors = orbColorsFromAccent(accent);
  const orbDuration = speaking ? 5 : listening ? 16 : isConnecting ? 12 : 30;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.92 }}
      whileHover={reduced ? undefined : { scale: 1.06, y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="fixed grid place-items-center rounded-full z-40"
      style={{
        bottom: 28,
        right: 28,
        width: 64,
        height: 64,
        background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, ${accent}1a 100%)`,
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${ringColor}`,
        boxShadow: active
          ? `0 0 44px -4px ${accent}aa, 0 14px 36px -10px rgba(0,0,0,0.7)`
          : `0 0 30px -10px ${accent}88, 0 12px 28px -10px rgba(0,0,0,0.6)`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
      }}
      aria-label={active ? "Stop the agent" : "Start the agent"}
    >
      {speaking && !reduced && (
        <>
          {[0, 0.6].map((delay, i) => (
            <motion.div
              key={i}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{ inset: 0, border: `1px solid ${accent}66` }}
              animate={{
                scale: [1, 1.32, 1.6],
                opacity: [0.55, 0.18, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
      {!reduced && voiceState === "idle" && (
        <motion.div
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{ inset: -8, border: `1px solid ${accent}44` }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.94, 1.08, 1.2] }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeOut",
            repeatDelay: 0.6,
          }}
        />
      )}
      <SiriOrb
        size="50px"
        colors={orbColors}
        animationDuration={orbDuration}
        className="relative"
      />
    </motion.button>
  );
}

/* ============================================================
 * COMPOSER + atoms (mirrors what was in page.tsx)
 * ============================================================ */
function Composer({
  personality,
  agentName,
  composing,
  thinking,
  voiceState,
  voiceActive,
  voiceError,
  onVoiceToggle,
  onComposingChange,
  onSubmit,
  composerRef,
}: {
  personality: Personality;
  agentName: string;
  composing: string;
  thinking: boolean;
  voiceState: "idle" | "connecting" | "listening" | "speaking" | "error";
  voiceActive: boolean;
  voiceError: string | null;
  onVoiceToggle: () => void;
  onComposingChange: (v: string) => void;
  onSubmit: () => void;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
  const hasText = composing.trim().length > 0;
  const stateCopy =
    voiceState === "connecting"
      ? "Connecting…"
      : voiceState === "listening"
        ? "Listening — speak now"
        : voiceState === "speaking"
          ? `${agentName} is speaking`
          : voiceState === "error"
            ? voiceError || "Voice error — tap to retry"
            : `Tap to talk with ${agentName}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center">
        <VoiceOrbButton
          accent={personality.accent}
          accentDeep={personality.accentDeep}
          glow={personality.glow}
          state={voiceState}
          onToggle={onVoiceToggle}
        />
        <div
          className="mt-3 text-[13.5px] tracking-[0.06em] text-center"
          style={{
            color:
              voiceState === "error"
                ? "#fda4af"
                : voiceActive
                  ? personality.accent
                  : "rgba(245,245,247,0.6)",
          }}
        >
          {stateCopy}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <span
          className="text-[11.5px] tracking-[0.22em] uppercase"
          style={{
            color: "rgba(245,245,247,0.4)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Or type
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      </div>

      <div
        className="rounded-2xl relative"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: hasText
            ? `1px solid ${personality.accent}55`
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: hasText
            ? `0 12px 32px -10px ${personality.glow}`
            : "0 8px 24px -10px rgba(0,0,0,0.4)",
          transition: "box-shadow 0.4s ease, border 0.4s ease",
        }}
      >
        <textarea
          ref={composerRef}
          value={composing}
          onChange={(e) => onComposingChange(e.target.value)}
          onKeyDown={onKey}
          placeholder={`Tell ${agentName} what to change…`}
          disabled={thinking}
          rows={2}
          className="w-full bg-transparent border-0 outline-none resize-none px-5 pt-4 pb-1 text-[16px] leading-relaxed placeholder:text-white/40 disabled:opacity-50"
          style={{
            color: "rgba(245,245,247,1)",
            caretColor: personality.accent,
            fontFamily: "var(--font-sans)",
            minHeight: 76,
          }}
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <button
            type="button"
            className="size-10 rounded-lg grid place-items-center transition-all hover:bg-white/[0.05]"
            style={{ color: "rgba(245,245,247,0.6)" }}
            aria-label="Attach"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span
              className="text-[12px] tracking-[0.18em] uppercase"
              style={{
                color: "rgba(245,245,247,0.45)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ↵ Send
            </span>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!hasText || thinking}
              className="h-10 px-4 rounded-lg inline-flex items-center gap-2 text-[14px] font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-transform hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: hasText
                  ? `linear-gradient(135deg, ${personality.accent} 0%, ${personality.accentDeep} 100%)`
                  : "rgba(255,255,255,0.07)",
                boxShadow: hasText
                  ? `0 6px 20px -6px ${personality.glow}`
                  : "none",
              }}
              aria-label="Send"
            >
              <span>Send</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 19V5M5 12l7-7 7 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceOrbButton({
  accent,
  accentDeep,
  glow,
  state,
  onToggle,
}: {
  accent: string;
  accentDeep: string;
  glow: string;
  state: "idle" | "connecting" | "listening" | "speaking" | "error";
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();
  const isActive = state === "listening" || state === "speaking";
  const isConnecting = state === "connecting";
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      className="relative rounded-full grid place-items-center transition-all"
      style={{
        width: 84,
        height: 84,
        background: isActive
          ? `radial-gradient(circle at 30% 28%, ${accent}, ${accentDeep} 70%)`
          : `radial-gradient(circle at 30% 28%, ${accent}cc, ${accentDeep}cc 70%)`,
        boxShadow: isActive
          ? `0 0 0 8px ${accent}1f, 0 0 0 18px ${accent}10, 0 12px 40px -8px ${glow}`
          : `0 8px 30px -10px ${glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
        border: "1px solid rgba(255,255,255,0.12)",
      }}
      aria-label={isActive ? "End voice session" : "Start voice session"}
    >
      {!reduced && isActive && (
        <motion.span
          className="absolute inset-[-12px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accent}50, transparent 70%)`,
            filter: "blur(8px)",
          }}
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.12, 1] }}
          transition={{
            duration: state === "speaking" ? 0.9 : 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      {isConnecting && !reduced && (
        <motion.span
          className="absolute inset-1 rounded-full border-2 pointer-events-none"
          style={{
            borderColor: "rgba(255,255,255,0.25)",
            borderTopColor: "rgba(255,255,255,0.85)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      )}
      <span className="relative" style={{ color: "white" }}>
        {state === "speaking" ? (
          <WaveformIcon />
        ) : isActive ? (
          <StopIcon />
        ) : (
          <MicIcon size={28} />
        )}
      </span>
    </motion.button>
  );
}

function ChatBubble({
  line,
  personality,
  agentName,
  reduced,
}: {
  line: ChatLine;
  personality: Personality;
  agentName: string;
  reduced: boolean;
}) {
  if (line.role === "user") {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end"
      >
        <div
          className="px-4 py-3 rounded-2xl rounded-tr-md max-w-[88%] text-[16.5px] leading-relaxed"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(245,245,247,0.96)",
          }}
        >
          {line.text}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3"
    >
      <div className="shrink-0 mt-1">
        <PersonalityIcon personality={personality} size="xs" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[12.5px] tracking-[0.2em] uppercase mb-2"
          style={{
            color: personality.accent,
            fontFamily: "var(--font-mono)",
          }}
        >
          {agentName}
        </div>
        <p
          className="font-serif text-[18px] leading-[1.45]"
          style={{ color: "rgba(245,245,247,0.94)" }}
        >
          {line.text}
        </p>
      </div>
    </motion.div>
  );
}

function ThinkingDots({
  accent,
  reduced,
}: {
  accent: string;
  reduced: boolean;
}) {
  return (
    <div className="flex items-center gap-2 pl-9">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full"
          style={{ background: accent }}
          animate={
            reduced ? { opacity: 0.6 } : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }
          }
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function EmptyTranscript({
  personality,
  suggestions,
  onPick,
}: {
  personality: Personality;
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3.5 pt-1">
      <div
        className="text-[13px] tracking-[0.18em] uppercase"
        style={{
          color: "rgba(245,245,247,0.5)",
          fontFamily: "var(--font-mono)",
        }}
      >
        Try asking
      </div>
      <div className="flex flex-col gap-2.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="text-left px-4 py-3.5 rounded-xl text-[17px] transition-all hover:bg-white/[0.04] flex items-center justify-between group"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(245,245,247,0.92)",
            }}
          >
            <span className="font-serif">{s}</span>
            <span
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[16px]"
              style={{ color: personality.accent }}
            >
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="3"
        width="6"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function StopIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
function WaveformIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 12v0">
          <animate
            attributeName="d"
            values="M4 10v4;M4 7v10;M4 10v4"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M9 8v8">
          <animate
            attributeName="d"
            values="M9 8v8;M9 4v16;M9 8v8"
            dur="0.7s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M14 6v12">
          <animate
            attributeName="d"
            values="M14 6v12;M14 10v4;M14 6v12"
            dur="0.85s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M19 10v4">
          <animate
            attributeName="d"
            values="M19 10v4;M19 6v12;M19 10v4"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </svg>
  );
}

/* ============================================================
 * PHASE 3 INSPECTOR COMPONENTS
 * ============================================================
 * The pieces below replace the original inspector header / orb
 * button / Composer / EmptyTranscript stack with a tabbed-inspector
 * pattern (Figma) + ambient Aura orb (LiveKit) + transcript-style
 * activity feed (Granola). Mic-as-hero is gone; voice is always
 * listening when in the studio and the orb is a passive state
 * visualizer. The legacy Composer / VoiceOrbButton / ChatBubble /
 * EmptyTranscript above are dead code, safe to delete in a follow-up.
 * ============================================================ */

/* ----------------------------------------------------------
 * InspectorTabs — Figma-style tabbed inspector header.
 * ---------------------------------------------------------- */
const INSPECTOR_TABS = ["Agent", "Properties", "Comments"] as const;
type InspectorTab = (typeof INSPECTOR_TABS)[number];

function InspectorTabs() {
  const [active, setActive] = useState<InspectorTab>("Agent");
  return (
    <div
      className="shrink-0 flex items-stretch"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 16px",
      }}
    >
      {INSPECTOR_TABS.map((tab) => {
        const isActive = active === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className="relative transition-colors"
            style={{
              padding: "16px 14px 14px",
              color: isActive
                ? "rgba(245,245,247,0.95)"
                : "rgba(245,245,247,0.5)",
              fontSize: 12.5,
              fontWeight: isActive ? 500 : 400,
              letterSpacing: "-0.005em",
            }}
          >
            {tab}
            {isActive && (
              <span
                aria-hidden
                className="absolute left-3 right-3 bottom-0"
                style={{ height: 1.5, background: "rgba(245,240,230,0.7)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------
 * InspectorIdentity — single-row identity strip.
 * Replaces the giant 38px Fraunces agent name + multiline meta.
 * ---------------------------------------------------------- */
function InspectorIdentity({
  personality,
  agentName,
  voiceName,
  voiceState,
  thinking,
  reduced,
}: {
  personality: Personality;
  agentName: string;
  voiceName: string;
  voiceState: "idle" | "connecting" | "listening" | "speaking" | "error";
  thinking: boolean;
  reduced: boolean;
}) {
  const state = thinking
    ? "Refining"
    : voiceState === "speaking"
      ? "Speaking"
      : voiceState === "listening"
        ? "Listening"
        : voiceState === "connecting"
          ? "Connecting"
          : voiceState === "error"
            ? "Voice error"
            : "Ready";
  return (
    <div
      className="shrink-0 flex items-center gap-3"
      style={{ padding: "16px 18px 14px" }}
    >
      <span
        aria-hidden
        className="shrink-0 rounded-full grid place-items-center"
        style={{
          width: 30,
          height: 30,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#f5f0e6",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {(agentName?.[0] ?? "A").toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: "rgba(245,245,247,0.95)",
            letterSpacing: "-0.005em",
          }}
        >
          {agentName}
        </div>
        <div
          className="flex items-center gap-1.5 truncate mt-0.5"
          style={{
            fontSize: 11,
            color: "rgba(245,245,247,0.5)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          <motion.span
            aria-hidden
            animate={
              reduced || (!thinking && voiceState !== "listening" && voiceState !== "speaking")
                ? { opacity: 0.8 }
                : { opacity: [0.35, 1, 0.35] }
            }
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="block rounded-full"
            style={{
              width: 4,
              height: 4,
              background: "#f5f0e6",
              boxShadow: "0 0 6px rgba(245,240,230,0.55)",
            }}
          />
          <span className="truncate uppercase">
            {personality.name} · {voiceName} · {state}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
 * AmbientAura — Aura-style state visualizer (NOT a button).
 *
 * Soft 80px orb that pulses with the voice state. Sits centered in
 * its own band. Replaces the giant tap-to-talk mic. Below the orb
 * is a quiet one-line state caption.
 * ---------------------------------------------------------- */
function AmbientAura({
  personality,
  voiceActive,
  voiceState,
  thinking,
  reduced,
}: {
  personality: Personality;
  voiceActive: boolean;
  voiceState: "idle" | "connecting" | "listening" | "speaking" | "error";
  thinking: boolean;
  reduced: boolean;
}) {
  const accent = personality.accent;
  const accentDeep = personality.accentDeep;
  const speaking = voiceState === "speaking";
  const listening = voiceState === "listening";
  const breathing = !reduced && (voiceActive || thinking);
  const caption = thinking
    ? "Refining the draft…"
    : speaking
      ? "Speaking"
      : listening
        ? "Listening"
        : voiceState === "connecting"
          ? "Connecting…"
          : voiceState === "error"
            ? "Voice paused — tap mic to retry"
            : "Idle · always listening when active";

  return (
    <div
      className="shrink-0 relative flex flex-col items-center"
      style={{
        padding: "20px 16px 22px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 70% at 50% 35%, ${accent}14, transparent 70%)`,
        }}
      />
      <div className="relative" style={{ width: 84, height: 84 }}>
        {/* Outer halo — breathes when active */}
        <motion.div
          aria-hidden
          animate={
            breathing
              ? { opacity: [0.55, 0.85, 0.55], scale: [1, 1.08, 1] }
              : { opacity: 0.45, scale: 1 }
          }
          transition={{
            duration: speaking ? 1.6 : listening ? 3 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            inset: -18,
            background: `radial-gradient(circle, ${accent}66, transparent 65%)`,
            filter: "blur(18px)",
          }}
        />
        {/* Inner halo */}
        <motion.div
          aria-hidden
          animate={
            breathing
              ? { opacity: [0.7, 1, 0.7] }
              : { opacity: 0.7 }
          }
          transition={{
            duration: speaking ? 1.6 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            inset: -4,
            background: `radial-gradient(circle, ${accent}80, transparent 70%)`,
            filter: "blur(8px)",
          }}
        />
        {/* Orb body */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 28%),
              radial-gradient(circle at 28% 22%, rgba(255,255,255,0.92), transparent 9%),
              radial-gradient(circle at 70% 78%, rgba(0,0,0,0.45), transparent 38%),
              radial-gradient(circle at 50% 50%, ${accent} 0%, ${accentDeep} 70%, rgba(0,0,0,0.2) 100%)
            `,
            boxShadow: `
              0 24px 60px -16px ${accent}b0,
              inset 0 -10px 24px rgba(0,0,0,0.35),
              inset 0 7px 14px rgba(255,255,255,0.18),
              inset 0 0 0 1px rgba(255,255,255,0.08)
            `,
          }}
        />
        {/* Status dot — top-right corner */}
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            top: 2,
            right: 2,
            width: 11,
            height: 11,
            background:
              voiceState === "error"
                ? "#f87171"
                : voiceActive
                  ? "#10b981"
                  : "rgba(245,245,247,0.25)",
            boxShadow:
              voiceState === "error"
                ? "0 0 8px #f87171"
                : voiceActive
                  ? "0 0 8px #10b981"
                  : "none",
            border: "1.5px solid #101012",
          }}
        />
      </div>
      <div
        className="relative mt-3.5 text-center"
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: voiceState === "error"
            ? "#fda4af"
            : "rgba(245,245,247,0.48)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {caption}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
 * ActivityFeed — transcript-style chronological feed.
 *
 * Replaces ChatBubble + EmptyTranscript with templated chips. When
 * there's no history we show three quiet starter prompts. When there's
 * history we show each turn as a compact entry — agent in normal text,
 * user in muted italic, with timestamps inline. Past actions are
 * one-click re-runnable (handled by parent via onPickSuggestion when
 * the user clicks a chip, transcript click re-run is a Phase 4 add).
 * ---------------------------------------------------------- */
type ActivityFeedProps = {
  agentName: string;
  chatLines: ChatLine[];
  thinking: boolean;
  suggestions: string[];
  reduced: boolean;
  onPickSuggestion: (s: string) => void;
};

const ActivityFeed = forwardRef<HTMLDivElement, ActivityFeedProps>(
  function ActivityFeed(
    { agentName, chatLines, thinking, suggestions, reduced, onPickSuggestion },
    ref,
  ) {
    void agentName;
    return (
      <div
        ref={ref}
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollbarWidth: "thin" }}
      >
        {chatLines.length === 0 ? (
          <FeedEmpty suggestions={suggestions} onPick={onPickSuggestion} />
        ) : (
          <div className="flex flex-col" style={{ padding: "12px 0 14px" }}>
            <div
              className="px-5 pt-3 pb-2 uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.32em",
                color: "rgba(245,245,247,0.36)",
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}
            >
              Activity
            </div>
            {chatLines.map((line, i) => (
              <FeedEntry key={i} line={line} reduced={reduced} />
            ))}
            {thinking && (
              <div
                className="flex items-center gap-2 px-5 py-3"
                style={{
                  fontSize: 11,
                  color: "rgba(245,245,247,0.52)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.04em",
                }}
              >
                <motion.span
                  aria-hidden
                  animate={
                    reduced ? { opacity: 0.7 } : { opacity: [0.3, 1, 0.3] }
                  }
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="block rounded-full"
                  style={{
                    width: 4,
                    height: 4,
                    background: "#f5f0e6",
                    boxShadow: "0 0 6px rgba(245,240,230,0.55)",
                  }}
                />
                Refining…
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

function FeedEmpty({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  return (
    <div className="px-5 pt-7 pb-4 flex flex-col">
      <div
        className="uppercase mb-3"
        style={{
          fontSize: 10,
          letterSpacing: "0.32em",
          color: "rgba(245,245,247,0.36)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        Try something
      </div>
      <div className="flex flex-col gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="text-left rounded-md transition-colors hover:bg-white/[0.04]"
            style={{
              padding: "9px 12px",
              fontSize: 13,
              color: "rgba(245,245,247,0.78)",
              letterSpacing: "-0.005em",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span
              aria-hidden
              className="inline-block mr-2"
              style={{ color: "rgba(245,240,230,0.85)" }}
            >
              →
            </span>
            {s}
          </button>
        ))}
      </div>
      <p
        className="mt-5 font-serif italic"
        style={{
          fontSize: 12.5,
          color: "rgba(245,245,247,0.4)",
          lineHeight: 1.55,
          letterSpacing: "-0.005em",
        }}
      >
        Or just start talking — the agent is listening.
      </p>
    </div>
  );
}

function FeedEntry({
  line,
  reduced,
}: {
  line: ChatLine;
  reduced: boolean;
}) {
  void reduced;
  const isAgent = line.role === "agent";
  return (
    <div
      className="px-5 py-2.5"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.03)",
      }}
    >
      <div
        className="uppercase mb-1.5 flex items-center gap-1.5"
        style={{
          fontSize: 9.5,
          letterSpacing: "0.3em",
          color: isAgent
            ? "rgba(245,245,247,0.52)"
            : "rgba(245,245,247,0.36)",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        <span
          aria-hidden
          className="block rounded-full"
          style={{
            width: 3,
            height: 3,
            background: isAgent ? "#f5f0e6" : "rgba(245,245,247,0.4)",
            boxShadow: isAgent ? "0 0 4px rgba(245,240,230,0.55)" : "none",
          }}
        />
        {isAgent ? "Agent" : "You"}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: isAgent
            ? "rgba(245,245,247,0.88)"
            : "rgba(245,245,247,0.6)",
          letterSpacing: "-0.005em",
        }}
      >
        {line.text}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
 * MiniComposer — minimal text input + tiny mic toggle.
 *
 * Replaces the original Composer which had a giant centered orb
 * + state copy + "Or type" divider + full-width input with gradient
 * send button. Now: a single low-chrome input row, mic icon on the
 * left (toggles voice session — small affordance, NOT the centerpiece),
 * send arrow on the right.
 * ---------------------------------------------------------- */
function MiniComposer({
  agentName,
  composing,
  thinking,
  voiceActive,
  voiceError,
  onVoiceToggle,
  onComposingChange,
  onSubmit,
  composerRef,
}: {
  agentName: string;
  composing: string;
  thinking: boolean;
  voiceActive: boolean;
  voiceError: string | null;
  onVoiceToggle: () => void;
  onComposingChange: (v: string) => void;
  onSubmit: () => void;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  void voiceError;
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
  const hasText = composing.trim().length > 0;
  return (
    <div
      className="rounded-xl flex items-end gap-1"
      style={{
        padding: "8px 8px 8px 10px",
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${
          hasText
            ? "rgba(245,240,230,0.35)"
            : "rgba(255,255,255,0.07)"
        }`,
        transition: "border-color 180ms ease-out",
      }}
    >
      {/* Mic toggle — small, mute/start affordance. NOT a CTA. */}
      <button
        type="button"
        onClick={onVoiceToggle}
        title={voiceActive ? "Pause voice" : "Resume voice"}
        aria-label={voiceActive ? "Pause voice" : "Resume voice"}
        className="shrink-0 grid place-items-center transition-colors"
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          color: voiceActive ? "#f5f0e6" : "rgba(245,245,247,0.5)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="9"
            y="3"
            width="6"
            height="11"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M5 11a7 7 0 0 0 14 0M12 18v3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <textarea
        ref={composerRef}
        value={composing}
        onChange={(e) => onComposingChange(e.target.value)}
        onKeyDown={onKey}
        placeholder={`Tell ${agentName} what to change…`}
        disabled={thinking}
        rows={1}
        className="flex-1 bg-transparent border-0 outline-none resize-none"
        style={{
          padding: "5px 4px",
          fontSize: 13.5,
          lineHeight: 1.5,
          color: "rgba(245,245,247,0.95)",
          caretColor: "#f5f0e6",
          fontFamily: "var(--font-sans)",
          minHeight: 28,
          maxHeight: 110,
        }}
      />

      {/* Send arrow — warm-cream chip when armed, transparent when
          empty. No personality accent on the composer chrome. */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!hasText || thinking}
        aria-label="Send"
        className="shrink-0 grid place-items-center transition-opacity disabled:opacity-25"
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: hasText ? "rgba(245,240,230,0.14)" : "transparent",
          border: hasText
            ? "1px solid rgba(245,240,230,0.3)"
            : "1px solid transparent",
          color: hasText ? "#f5f0e6" : "rgba(245,245,247,0.4)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
