"use client";

import { createContext, useContext } from "react";
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
