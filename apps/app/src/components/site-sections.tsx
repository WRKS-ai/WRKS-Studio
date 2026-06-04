"use client";

import type {
  CtaBandSection,
  FaqSection,
  FeatureGridSection,
  FooterSection,
  HeroSection,
  PricingSection,
  RichTextSection,
  Section,
  TestimonialsSection,
} from "@/lib/site-model";

// Section renderers for the in-MacBook website preview. Editorial,
// warm, lightweight — every one of these maps to a typed Section so
// the voice agent can edit any field by path.

type Tokens = { accent: string; brandName: string };

export function SectionRenderer({
  section,
  tokens,
}: {
  section: Section;
  tokens: Tokens;
}) {
  switch (section.type) {
    case "hero":
      return <Hero section={section} tokens={tokens} />;
    case "feature_grid":
      return <FeatureGrid section={section} tokens={tokens} />;
    case "pricing":
      return <Pricing section={section} tokens={tokens} />;
    case "testimonials":
      return <Testimonials section={section} tokens={tokens} />;
    case "faq":
      return <Faq section={section} tokens={tokens} />;
    case "cta_band":
      return <CtaBand section={section} tokens={tokens} />;
    case "footer":
      return <Footer section={section} tokens={tokens} />;
    case "rich_text":
      return <RichText section={section} />;
  }
}

/* ============================================================
 * Hero
 * ============================================================ */
function Hero({
  section,
  tokens,
}: {
  section: HeroSection;
  tokens: Tokens;
}) {
  return (
    <section
      data-section-id={section.id}
      className="grid"
      style={{ gridTemplateColumns: "1.2fr 0.8fr", minHeight: 380 }}
    >
      <div className="px-10 py-10 text-left flex flex-col min-h-0">
        {section.eyebrow && (
          <div
            className="text-[11px] tracking-[0.32em] uppercase font-mono mb-5 flex items-center gap-3 shrink-0"
            style={{ color: "#827a6e" }}
          >
            <span
              className="inline-block h-px w-8"
              style={{ background: tokens.accent }}
            />
            <span>{section.eyebrow}</span>
          </div>
        )}
        <h1
          className="font-serif font-medium text-[clamp(1.5rem,2.8vw,2.25rem)] leading-[1.02] text-[#0e0c08] max-w-[17ch] shrink-0"
          style={{ letterSpacing: "-0.025em" }}
        >
          {section.headline}
        </h1>
        <p className="mt-4 font-serif italic text-[clamp(0.875rem,1.1vw,1rem)] text-[#4a443c] max-w-[42ch] leading-relaxed shrink-0">
          {section.subhead}
        </p>
        <div className="mt-5 flex items-center gap-4 shrink-0">
          <button
            className="inline-flex items-center gap-2 text-[#0e0c08] font-serif border-b border-[#0e0c08] pb-1 text-[14px]"
            type="button"
          >
            <span>{section.primaryCta}</span>
            <span style={{ color: tokens.accent }}>→</span>
          </button>
          {section.secondaryCta && (
            <span
              className="text-[13px] font-serif italic"
              style={{ color: "#827a6e" }}
            >
              {section.secondaryCta}
            </span>
          )}
        </div>
      </div>
      <div className="relative overflow-hidden" style={{ background: "#efe9da" }}>
        {section.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={section.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ color: "#a89c84", fontFamily: "var(--font-mono)" }}
          >
            <span className="text-[11px] tracking-[0.24em] uppercase">
              No image
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
 * Feature grid
 * ============================================================ */
function FeatureGrid({
  section,
  tokens,
}: {
  section: FeatureGridSection;
  tokens: Tokens;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.eyebrow && (
        <div
          className="text-[11px] tracking-[0.3em] uppercase font-mono mb-3"
          style={{ color: tokens.accent }}
        >
          {section.eyebrow}
        </div>
      )}
      <h2
        className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] leading-[1.1] text-[#0e0c08] max-w-[24ch]"
        style={{ letterSpacing: "-0.02em" }}
      >
        {section.title}
      </h2>
      {section.subhead && (
        <p
          className="mt-3 font-serif italic text-[14px] max-w-[48ch]"
          style={{ color: "#4a443c" }}
        >
          {section.subhead}
        </p>
      )}
      <div className="mt-8 grid grid-cols-3 gap-6">
        {section.features.map((f, i) => (
          <div key={i}>
            <div
              className="text-[10px] tracking-[0.3em] uppercase font-mono mb-2"
              style={{ color: tokens.accent }}
            >
              0{i + 1}
            </div>
            <h3
              className="font-serif text-[14px] text-[#0e0c08] mb-1.5"
              style={{ letterSpacing: "-0.01em" }}
            >
              {f.title}
            </h3>
            <p
              className="text-[12.5px] leading-snug font-sans"
              style={{ color: "#4a443c" }}
            >
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * Pricing
 * ============================================================ */
function Pricing({
  section,
  tokens,
}: {
  section: PricingSection;
  tokens: Tokens;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.eyebrow && (
        <div
          className="text-[11px] tracking-[0.3em] uppercase font-mono mb-3"
          style={{ color: tokens.accent }}
        >
          {section.eyebrow}
        </div>
      )}
      <h2
        className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] text-[#0e0c08]"
        style={{ letterSpacing: "-0.02em" }}
      >
        {section.title}
      </h2>
      {section.subhead && (
        <p
          className="mt-3 font-serif italic text-[14px] max-w-[48ch]"
          style={{ color: "#4a443c" }}
        >
          {section.subhead}
        </p>
      )}
      <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: `repeat(${section.tiers.length}, 1fr)` }}>
        {section.tiers.map((t, i) => (
          <div
            key={i}
            className="p-5 rounded-xl"
            style={{
              background: t.recommended ? `${tokens.accent}12` : "transparent",
              border: t.recommended
                ? `1px solid ${tokens.accent}55`
                : "1px solid rgba(14,12,8,0.12)",
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="font-serif text-[14px] text-[#0e0c08]"
              >
                {t.name}
              </span>
              {t.recommended && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9.5px] tracking-[0.2em] uppercase font-mono"
                  style={{ background: tokens.accent, color: "white" }}
                >
                  Popular
                </span>
              )}
            </div>
            <div className="mb-3">
              <span className="font-serif text-[24px] text-[#0e0c08]">
                {t.price}
              </span>
              <span className="ml-1 text-[11.5px] text-[#827a6e] font-sans">
                {t.cadence}
              </span>
            </div>
            <ul className="mb-4 space-y-1.5">
              {t.features.map((f, j) => (
                <li
                  key={j}
                  className="text-[12px] text-[#4a443c] font-sans leading-snug"
                >
                  · {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="w-full h-9 rounded-md text-[12.5px] font-serif"
              style={{
                background: t.recommended ? tokens.accent : "transparent",
                color: t.recommended ? "white" : "#0e0c08",
                border: t.recommended
                  ? "none"
                  : "1px solid rgba(14,12,8,0.2)",
              }}
            >
              {t.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * Testimonials
 * ============================================================ */
function Testimonials({
  section,
  tokens,
}: {
  section: TestimonialsSection;
  tokens: Tokens;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.eyebrow && (
        <div
          className="text-[11px] tracking-[0.3em] uppercase font-mono mb-3"
          style={{ color: tokens.accent }}
        >
          {section.eyebrow}
        </div>
      )}
      <h2
        className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] text-[#0e0c08]"
        style={{ letterSpacing: "-0.02em" }}
      >
        {section.title}
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-6">
        {section.quotes.map((q, i) => (
          <blockquote
            key={i}
            className="font-serif"
            style={{ borderLeft: `2px solid ${tokens.accent}`, paddingLeft: 16 }}
          >
            <p
              className="italic text-[#0e0c08] text-[14.5px] leading-relaxed"
            >
              &ldquo;{q.text}&rdquo;
            </p>
            <footer
              className="mt-3 text-[11.5px] font-sans not-italic"
              style={{ color: "#827a6e" }}
            >
              {q.author} · <span>{q.role}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * FAQ
 * ============================================================ */
function Faq({ section, tokens }: { section: FaqSection; tokens: Tokens }) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.eyebrow && (
        <div
          className="text-[11px] tracking-[0.3em] uppercase font-mono mb-3"
          style={{ color: tokens.accent }}
        >
          {section.eyebrow}
        </div>
      )}
      <h2
        className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] text-[#0e0c08]"
        style={{ letterSpacing: "-0.02em" }}
      >
        {section.title}
      </h2>
      <div className="mt-6 flex flex-col">
        {section.items.map((it, i) => (
          <div
            key={i}
            className="py-4"
            style={{
              borderBottom:
                i === section.items.length - 1
                  ? "none"
                  : "1px solid rgba(14,12,8,0.08)",
            }}
          >
            <h3
              className="font-serif text-[14px] text-[#0e0c08] mb-1"
            >
              {it.question}
            </h3>
            <p
              className="text-[12.5px] leading-snug font-sans"
              style={{ color: "#4a443c" }}
            >
              {it.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * CTA band
 * ============================================================ */
function CtaBand({
  section,
  tokens,
}: {
  section: CtaBandSection;
  tokens: Tokens;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12 text-center"
      style={{
        background: `${tokens.accent}10`,
        borderTop: "1px solid rgba(14,12,8,0.08)",
      }}
    >
      <h2
        className="font-serif font-medium text-[clamp(1.5rem,2.4vw,2rem)] text-[#0e0c08]"
        style={{ letterSpacing: "-0.025em" }}
      >
        {section.headline}
      </h2>
      {section.subhead && (
        <p
          className="mt-3 font-serif italic text-[14px] max-w-[42ch] mx-auto"
          style={{ color: "#4a443c" }}
        >
          {section.subhead}
        </p>
      )}
      <button
        type="button"
        className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-md text-[13px] text-white font-serif"
        style={{ background: tokens.accent }}
      >
        <span>{section.primaryCta}</span>
        <span>→</span>
      </button>
    </section>
  );
}

/* ============================================================
 * Footer
 * ============================================================ */
function Footer({
  section,
  tokens,
}: {
  section: FooterSection;
  tokens: Tokens;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-10"
      style={{
        background: "#0e0c08",
        color: "#fbf7ee",
      }}
    >
      <div className="grid grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="size-1.5 rounded-full"
              style={{ background: tokens.accent }}
            />
            <span className="font-serif text-[14px]">{section.brand}</span>
          </div>
          {section.tagline && (
            <p
              className="text-[11.5px] font-serif italic leading-relaxed"
              style={{ color: "rgba(251,247,238,0.65)" }}
            >
              {section.tagline}
            </p>
          )}
        </div>
        {section.columns.map((c, i) => (
          <div key={i}>
            <div
              className="text-[10px] tracking-[0.3em] uppercase font-mono mb-2"
              style={{ color: "rgba(251,247,238,0.5)" }}
            >
              {c.heading}
            </div>
            <ul className="space-y-1.5">
              {c.links.map((l, j) => (
                <li
                  key={j}
                  className="text-[12px] font-sans"
                  style={{ color: "rgba(251,247,238,0.85)" }}
                >
                  {l}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * Rich text
 * ============================================================ */
function RichText({ section }: { section: RichTextSection }) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.title && (
        <h2
          className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] text-[#0e0c08] mb-3"
          style={{ letterSpacing: "-0.02em" }}
        >
          {section.title}
        </h2>
      )}
      <p
        className="text-[13px] leading-relaxed font-sans whitespace-pre-wrap"
        style={{ color: "#4a443c" }}
      >
        {section.body}
      </p>
    </section>
  );
}
