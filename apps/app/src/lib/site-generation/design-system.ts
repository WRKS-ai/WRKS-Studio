import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// Design system generation — Pass 1 of the /studio/sites Stitch-style
// pipeline. Runs Claude Haiku against the user's brand_state + brief
// and returns a strict JSON design system: palette, typography,
// button styles, icon style.
//
// The design system is NOVEL per user (not template-fixed) and is
// applied to the templated pages via CSS variables in Pass 2. See
// project_stitch_style_generation_locked.md.

const HEX = z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex must be 6-digit #RRGGBB");

const PaletteRow = z.object({
  name: z.string().min(1).max(60),
  hex: HEX,
  // 5-step scale from lightest → darkest. Each is a valid hex.
  scale: z.array(HEX).length(5),
});

export const DesignSystemSchema = z.object({
  palette: z.object({
    primary: PaletteRow,
    secondary: PaletteRow,
    tertiary: PaletteRow,
    neutral: PaletteRow,
  }),
  type: z.object({
    display: z.object({
      family: z.string().min(1).max(80),
      // Descriptive sample of the style, e.g. "Elegant, high-contrast serif".
      // Kept forgiving — Haiku sometimes writes richer descriptions.
      sample: z.string().min(1).max(400),
    }),
    body: z.object({
      family: z.string().min(1).max(80),
      sample: z.string().min(1).max(400),
    }),
    mono: z.object({
      family: z.string().min(1).max(80),
      sample: z.string().min(1).max(400),
    }),
  }),
  buttons: z.array(
    z.object({
      variant: z.enum(["primary", "secondary", "inverted", "outlined"]),
      // Describer of look. Room for palette-color refs + hover behavior.
      look: z.string().min(1).max(600),
    }),
  ).min(2).max(4),
  iconStyle: z.enum(["stroke", "fill", "duotone"]),
  // Left narration panel summary. 2-3 sentences worth of room.
  narration: z.string().min(1).max(800),
});

export type DesignSystem = z.infer<typeof DesignSystemSchema>;

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

export async function generateDesignSystem({
  brief,
  brand,
}: {
  brief: string;
  brand: BrandContext;
}): Promise<DesignSystem> {
  const anthropic = new Anthropic();

  const result = await anthropic.messages.create({
    // Opus 4.7 — the top Claude for taste. Design system decisions
    // (palette + typography + button style) constrain every downstream
    // page generation, so this call has the highest quality-per-token
    // leverage in the whole pipeline.
    model: "claude-opus-4-7",
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildUserMessage({ brief, brand }),
      },
    ],
  });

  const block = result.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const stripped = block.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(stripped);
  const validated = DesignSystemSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Design system schema validation failed: ${validated.error.message}`,
    );
  }
  return validated.data;
}

function buildSystemPrompt(): string {
  return `You are the WRKS Studio design-system agent. The user gave a brief for a new website; you emit a strict JSON design system that will be applied to a templated page structure.

Return ONLY a single JSON object — no prose, no markdown fences.

Schema:
{
  "palette": {
    "primary":   { "name": string, "hex": "#RRGGBB", "scale": ["#hex1","#hex2","#hex3","#hex4","#hex5"] },
    "secondary": { "name": string, "hex": "#RRGGBB", "scale": [...5 hexes...] },
    "tertiary":  { "name": string, "hex": "#RRGGBB", "scale": [...5 hexes...] },
    "neutral":   { "name": string, "hex": "#RRGGBB", "scale": [...5 hexes...] }
  },
  "type": {
    "display": { "family": string, "sample": string },
    "body":    { "family": string, "sample": string },
    "mono":    { "family": string, "sample": string }
  },
  "buttons": [
    { "variant": "primary" | "secondary" | "inverted" | "outlined", "look": string },
    ... 2 to 4 button entries ...
  ],
  "iconStyle": "stroke" | "fill" | "duotone",
  "narration": string
}

Quality bar — this is the WRKS taste profile. Follow it exactly:

1. **Palette** — Pick a palette that matches the brand's voice and industry.
   - Each of the 4 palette rows: give it a memorable NAME (e.g. "Midnight Cobalt", "Warm Sand", "Fog Grey", not just "Blue").
   - "hex" = the anchor color at 50% brightness.
   - "scale" = 5 stops from lightest → darkest of that hue (usually 100, 300, 500, 700, 900 in Tailwind-style progression).
   - Neutral row = a warm or cool grey scale, not pure #000/#fff at the ends.
   - AVOID: AI-generic purple-to-blue gradients, tinted pastels, high-saturation electric colors.
   - PREFER: editorial magazine palettes, restrained brand colors, muted secondary + one confident accent.

2. **Type** — Use REAL fonts from Google Fonts / Adobe or system stacks. Never invent typeface names.
   - Display: for hero headlines. Options span serif (Fraunces, Instrument Serif, Playfair, Cormorant), grotesk (Inter, Geist, Söhne fallback, Space Grotesk), or brand-appropriate.
   - Body: readable, usually different from display (paired). E.g. display=Fraunces + body=Inter.
   - Mono: for labels + captions. JetBrains Mono, Space Mono, IBM Plex Mono, Geist Mono.
   - "sample" = one-line describer of what this typeface conveys.

3. **Buttons** — MUST include a "primary" variant. Others are optional but appropriate.
   - "look" describes the styling in plain English: colors used from the palette above, radius, hover state.
   - AVOID: neon buttons, giant candy-red CTAs, pastel gradient buttons.
   - PREFER: dark solid + light text, hairline outlined variants, minimal shadow.

4. **iconStyle** — stroke = Feather/Lucide, fill = solid, duotone = two-tone glyphs.
   - Match the voice_descriptor: professional/expert = stroke; playful = duotone; quiet = stroke minimal weight.

5. **narration** — ONE sentence explaining the design system choice in the agent's voice. E.g. "Deep navy over warm cream keeps the founder brand serious while the display serif carries the coaching warmth." No fluff, no "Here's your design system".

Voice-to-palette hints (use as starting point, not a hard rule):
- professional → cobalt + off-white + slate mono
- bold        → strong single accent (crimson, orange) + charcoal
- warm        → terracotta / sage / cream editorial
- expert      → navy + slate + one clarifying accent
- playful     → confident hue pair, no gradients
- quiet       → warm-cream, single stone accent, editorial serifs

Return strictly valid JSON. No trailing commas.`;
}

function buildUserMessage({
  brief,
  brand,
}: {
  brief: string;
  brand: BrandContext;
}): string {
  const lines = [`Brief: ${brief}`];
  if (brand.brandName) lines.push(`Brand: ${brand.brandName}`);
  if (brand.businessType) lines.push(`Business type: ${brand.businessType}`);
  if (brand.primaryGoal) lines.push(`Primary goal: ${brand.primaryGoal}`);
  if (brand.voiceDescriptor) lines.push(`Voice: ${brand.voiceDescriptor}`);
  if (brand.offerSummary) lines.push(`Offer: ${brand.offerSummary}`);
  if (brand.audienceDescription)
    lines.push(`Audience: ${brand.audienceDescription}`);
  if (brand.differentiator) lines.push(`Edge: ${brand.differentiator}`);
  if (brand.existingSiteUrl)
    lines.push(`Existing site (for palette hints): ${brand.existingSiteUrl}`);
  return lines.join("\n");
}
