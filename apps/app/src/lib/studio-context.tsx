"use client";

import { createContext, useContext, useEffect } from "react";
import type { Personality } from "@/lib/personalities";
import type { Voice } from "@/lib/voices";

// Shared studio state. The layout owns everything (voice session, agent
// identity, deliverable state) so the right inspector stays mounted as
// the user navigates between /studio, /studio/settings, /studio/plans,
// etc. The studio page reads activeId/stored from here to render the
// canvas.

export type DeliverableKind =
  | "landing"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "ad";

export type StoredWowPayload = {
  deliverables: {
    brandName: string;
    landing: {
      headline: string;
      subhead: string;
      primaryCta: string;
      valueBullets: string[];
    };
    social: { instagram: string; twitter: string; linkedin: string };
    ad: { headline: string; body: string; cta: string };
  };
  images: {
    heroLandscape: string;
    featured: string[];
    instagramSquare: string;
    adHero: string;
  };
  createdAt: string;
};

export type ChatLine = { role: "user" | "agent"; text: string };

export type StudioContextValue = {
  personality: Personality;
  voice: Voice;
  agentName: string;
  stored: StoredWowPayload | null;
  activeId: DeliverableKind;
  setActiveId: (id: DeliverableKind) => void;
  flashFields: Set<string>;
  chatLines: ChatLine[];
  thinking: boolean;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioContextProvider({
  value,
  children,
}: {
  value: StudioContextValue;
  children: React.ReactNode;
}) {
  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const v = useContext(StudioContext);
  if (!v) {
    throw new Error("useStudio must be used inside StudioContextProvider");
  }
  return v;
}

/** Safe variant for sub-pages that don't need studio state. */
export function useStudioOptional(): StudioContextValue | null {
  return useContext(StudioContext);
}

/* ============================================================
 * Voice field registry — pages register their editable fields so the
 * voice agent can update them via the set_field tool.
 * ============================================================ */

export type VoiceField = {
  /** Stable id ("display_name", "house_style", etc.). */
  id: string;
  /** Spoken aliases ("display name", "name", "your name"). */
  aliases: string[];
  /** Where the field lives, for clarifications ("Settings · Account"). */
  location: string;
  /** Receive a new value. Implementations decide how to apply it. */
  set: (value: string) => void;
};

type Registry = {
  register: (field: VoiceField) => () => void;
  list: () => VoiceField[];
};

const VoiceFieldRegistryContext = createContext<Registry | null>(null);

export function VoiceFieldRegistryProvider({
  registry,
  children,
}: {
  registry: Registry;
  children: React.ReactNode;
}) {
  return (
    <VoiceFieldRegistryContext.Provider value={registry}>
      {children}
    </VoiceFieldRegistryContext.Provider>
  );
}

export function useRegisterVoiceField(field: VoiceField) {
  const reg = useContext(VoiceFieldRegistryContext);
  useEffect(() => {
    if (!reg) return;
    const unregister = reg.register(field);
    return unregister;
    // We intentionally watch a couple of identity-bearing parts of the
    // field so a page can update its set/aliases without leaking
    // multiple registrations. Children that need to re-register should
    // memoize their field object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reg, field.id, field.location, field.aliases.join("|")]);
}

export function useVoiceFieldRegistry(): Registry | null {
  return useContext(VoiceFieldRegistryContext);
}

/** Match spoken request to a registered field. */
export function resolveVoiceField(
  spoken: string,
  fields: VoiceField[],
): VoiceField | null {
  const key = spoken.trim().toLowerCase();
  if (!key) return null;
  for (const f of fields) {
    if (f.id === key) return f;
    for (const alias of f.aliases) {
      const a = alias.toLowerCase();
      if (a === key) return f;
    }
  }
  // Fuzzy: any alias is contained in the spoken phrase
  for (const f of fields) {
    for (const alias of f.aliases) {
      const a = alias.toLowerCase();
      if (key.includes(a) || a.includes(key)) return f;
    }
  }
  return null;
}
