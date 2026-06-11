// Barrel exports for the Supabase layer. Import via
// `@/lib/supabase` instead of reaching into individual files.

export {
  MEMORY_KIND,
  MEMORY_SOURCE,
  writeMemoryEntries,
  writeMemoryEntry,
  type MemoryEntry,
  type MemoryKind,
  type MemorySource,
} from "./memory";
export {
  DELTA_KIND,
  addDelta,
  deleteDelta,
  deltaConfidence,
  fetchTopDeltas,
  updateDelta,
  type DeltaKind,
  type DeltaRow,
} from "./playbook";
export {
  getActiveBusinessProfile,
  getActiveBusinessProfileId,
  type BusinessProfile,
} from "./profile";
export { createServerSupabaseClient } from "./server";
export { createServiceSupabaseClient } from "./service";
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./types";

// Browser client lives in `./browser` because it must be marked
// "use client" and imports `useSession` from @clerk/nextjs.
// Don't re-export it here — that would pull the client code into
// every server route that imports from the barrel.
