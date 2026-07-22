// BrandContext — the onboarding-derived brand snapshot passed into
// the v3 generation pipeline. Sourced from business_profiles and
// stored on each sites_generation_jobs row.
//
// (The old Zod DesignSystem schema + generateDesignSystem() function
// lived here for the v2 template-iframe pipeline. Both were removed
// when v3 replaced them; only this type survives because it's used
// by the ingest → generate → store chain.)

export type BrandContext = {
  brandName: string | null;
  businessType: string | null;
  primaryGoal: string | null;
  voiceDescriptor: string | null;
  offerSummary: string | null;
  audienceDescription: string | null;
  differentiator: string | null;
  existingSiteUrl: string | null;
};

// Legacy DesignSystem type stubbed so any residual imports type-check.
// Nothing should reference this after v2 cleanup completes.
export type DesignSystem = never;
