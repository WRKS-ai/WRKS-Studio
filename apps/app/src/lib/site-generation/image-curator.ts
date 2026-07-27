import type { BrandContext } from "./design-system";
import type { IngestedBrand } from "./brand-ingest";

// Image slots for the generated site. Instead of auto-fetching stock
// photos (which returned repetitive skyscrapers and felt inauthentic),
// we emit designed placeholder slots the user fills in later via the
// inline editor.
//
// If the ingest picked up a real hero image from the user's existing
// site, use it. Everything else is a placeholder with:
//   - palette-derived gradient background
//   - camera icon + "Add [thing]" hint
//   - data-image-slot attribute for future click-to-upload wiring
//
// Provider "extracted" means we used the user's own asset.
// Provider "placeholder" means the section should render a placeholder
// block per the system-prompt placeholder recipe.

export type ImageSlot = {
  kind: "real" | "placeholder";
  url: string | null;         // set only when kind === 'real'
  slotId: string;             // unique id for the future editor to target
  label: string;              // "Hero photo", "Tile background", etc.
};

export type ImagePack = {
  hero: ImageSlot;
  supporting: ImageSlot[];    // 5 tile backgrounds for MegaBento
  founder: ImageSlot;
  attribution: {
    provider: "extracted" | "placeholder";
    heroSource: "ingest" | "placeholder";
  };
};

export async function curateImagePack(
  _brand: BrandContext,
  ingest: IngestedBrand | null,
): Promise<ImagePack> {
  const ingested = ingest?.heroImage;
  const useIngestHero = ingested && looksLikeRealPhoto(ingested);

  const hero: ImageSlot = useIngestHero
    ? { kind: "real", url: ingested, slotId: "hero.image", label: "Hero photo" }
    : { kind: "placeholder", url: null, slotId: "hero.image", label: "Hero photo" };

  const supporting: ImageSlot[] = Array.from({ length: 5 }, (_, i) => ({
    kind: "placeholder" as const,
    url: null,
    slotId: `megabento.tile${i}.image`,
    label:
      i === 0 ? "Featured service photo" :
      i === 1 ? "Tall tile photo" :
      i === 4 ? "Trailing tile photo" :
      "Tile photo",
  }));

  const founder: ImageSlot = { kind: "placeholder", url: null, slotId: "founder.photo", label: "Founder photo" };

  return {
    hero,
    supporting,
    founder,
    attribution: {
      provider: useIngestHero ? "extracted" : "placeholder",
      heroSource: useIngestHero ? "ingest" : "placeholder",
    },
  };
}

function looksLikeRealPhoto(url: string): boolean {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|webp|png)(\?|$)/.test(lower) === false) return false;
  if (lower.includes("logo") || lower.includes("icon") || lower.includes("favicon")) return false;
  return true;
}
