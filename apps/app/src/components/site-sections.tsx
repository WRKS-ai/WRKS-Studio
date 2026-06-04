"use client";

import { EditableText } from "@/components/editable-text";
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

// Section renderers for the in-MacBook website preview. Every text
// node is an EditableText — click to edit inline; commits on blur. The
// voice agent can still set the same fields by path.

type Tokens = { accent: string; brandName: string };

type EditFn = (fieldPath: string, value: string) => void;

export function SectionRenderer({
  section,
  tokens,
  onEdit,
}: {
  section: Section;
  tokens: Tokens;
  onEdit: EditFn;
}) {
  switch (section.type) {
    case "hero":
      return <Hero section={section} tokens={tokens} onEdit={onEdit} />;
    case "feature_grid":
      return <FeatureGrid section={section} tokens={tokens} onEdit={onEdit} />;
    case "pricing":
      return <Pricing section={section} tokens={tokens} onEdit={onEdit} />;
    case "testimonials":
      return (
        <Testimonials section={section} tokens={tokens} onEdit={onEdit} />
      );
    case "faq":
      return <Faq section={section} tokens={tokens} onEdit={onEdit} />;
    case "cta_band":
      return <CtaBand section={section} tokens={tokens} onEdit={onEdit} />;
    case "footer":
      return <Footer section={section} tokens={tokens} onEdit={onEdit} />;
    case "rich_text":
      return <RichText section={section} onEdit={onEdit} />;
  }
}

/* ============================================================
 * Hero
 * ============================================================ */
function Hero({
  section,
  tokens,
  onEdit,
}: {
  section: HeroSection;
  tokens: Tokens;
  onEdit: EditFn;
}) {
  return (
    <section
      data-section-id={section.id}
      className="grid"
      style={{ gridTemplateColumns: "1.2fr 0.8fr", minHeight: 380 }}
    >
      <div className="px-10 py-10 text-left flex flex-col min-h-0">
        <EditableText
          value={section.eyebrow ?? "Now showing"}
          onCommit={(v) => onEdit("eyebrow", v)}
          as="div"
          className="text-[11px] tracking-[0.32em] uppercase font-mono mb-5 flex items-center gap-3 shrink-0"
          style={{ color: "#827a6e" }}
        />
        <EditableText
          value={section.headline}
          onCommit={(v) => onEdit("headline", v)}
          as="h1"
          multiline
          className="font-serif font-medium text-[clamp(1.5rem,2.8vw,2.25rem)] leading-[1.02] text-[#0e0c08] max-w-[17ch] shrink-0"
          style={{ letterSpacing: "-0.025em" }}
        />
        <EditableText
          value={section.subhead}
          onCommit={(v) => onEdit("subhead", v)}
          as="p"
          multiline
          className="mt-4 font-serif italic text-[clamp(0.875rem,1.1vw,1rem)] text-[#4a443c] max-w-[42ch] leading-relaxed shrink-0"
        />
        <div className="mt-5 flex items-center gap-4 shrink-0">
          <span className="inline-flex items-center gap-2 text-[#0e0c08] font-serif border-b border-[#0e0c08] pb-1 text-[14px]">
            <EditableText
              value={section.primaryCta}
              onCommit={(v) => onEdit("primaryCta", v)}
              as="span"
            />
            <span style={{ color: tokens.accent }}>→</span>
          </span>
          {section.secondaryCta && (
            <EditableText
              value={section.secondaryCta}
              onCommit={(v) => onEdit("secondaryCta", v)}
              as="span"
              className="text-[13px] font-serif italic"
              style={{ color: "#827a6e" }}
            />
          )}
        </div>
      </div>
      <div
        className="relative overflow-hidden"
        style={{ background: "#efe9da" }}
      >
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
  onEdit,
}: {
  section: FeatureGridSection;
  tokens: Tokens;
  onEdit: EditFn;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.eyebrow !== undefined && (
        <EditableText
          value={section.eyebrow ?? ""}
          onCommit={(v) => onEdit("eyebrow", v)}
          as="div"
          className="text-[11px] tracking-[0.3em] uppercase font-mono mb-3"
          style={{ color: tokens.accent }}
        />
      )}
      <EditableText
        value={section.title}
        onCommit={(v) => onEdit("title", v)}
        as="h2"
        multiline
        className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] leading-[1.1] text-[#0e0c08] max-w-[24ch]"
        style={{ letterSpacing: "-0.02em" }}
      />
      {section.subhead !== undefined && (
        <EditableText
          value={section.subhead ?? ""}
          onCommit={(v) => onEdit("subhead", v)}
          as="p"
          multiline
          className="mt-3 font-serif italic text-[14px] max-w-[48ch]"
          style={{ color: "#4a443c" }}
        />
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
            <EditableText
              value={f.title}
              onCommit={(v) => onEdit(`features.${i}.title`, v)}
              as="h3"
              className="font-serif text-[14px] text-[#0e0c08] mb-1.5"
              style={{ letterSpacing: "-0.01em" }}
            />
            <EditableText
              value={f.description}
              onCommit={(v) => onEdit(`features.${i}.description`, v)}
              as="p"
              multiline
              className="text-[12.5px] leading-snug font-sans"
              style={{ color: "#4a443c" }}
            />
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
  onEdit,
}: {
  section: PricingSection;
  tokens: Tokens;
  onEdit: EditFn;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.eyebrow !== undefined && (
        <EditableText
          value={section.eyebrow ?? ""}
          onCommit={(v) => onEdit("eyebrow", v)}
          as="div"
          className="text-[11px] tracking-[0.3em] uppercase font-mono mb-3"
          style={{ color: tokens.accent }}
        />
      )}
      <EditableText
        value={section.title}
        onCommit={(v) => onEdit("title", v)}
        as="h2"
        className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] text-[#0e0c08]"
        style={{ letterSpacing: "-0.02em" }}
      />
      {section.subhead !== undefined && (
        <EditableText
          value={section.subhead ?? ""}
          onCommit={(v) => onEdit("subhead", v)}
          as="p"
          multiline
          className="mt-3 font-serif italic text-[14px] max-w-[48ch]"
          style={{ color: "#4a443c" }}
        />
      )}
      <div
        className="mt-8 grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${section.tiers.length}, 1fr)`,
        }}
      >
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
              <EditableText
                value={t.name}
                onCommit={(v) => onEdit(`tiers.${i}.name`, v)}
                as="span"
                className="font-serif text-[14px] text-[#0e0c08]"
              />
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
              <EditableText
                value={t.price}
                onCommit={(v) => onEdit(`tiers.${i}.price`, v)}
                as="span"
                className="font-serif text-[24px] text-[#0e0c08]"
              />
              <span className="ml-1 text-[11.5px] text-[#827a6e] font-sans">
                <EditableText
                  value={t.cadence}
                  onCommit={(v) => onEdit(`tiers.${i}.cadence`, v)}
                  as="span"
                />
              </span>
            </div>
            <ul className="mb-4 space-y-1.5">
              {t.features.map((f, j) => (
                <li
                  key={j}
                  className="text-[12px] text-[#4a443c] font-sans leading-snug"
                >
                  ·{" "}
                  <EditableText
                    value={f}
                    onCommit={(v) => onEdit(`tiers.${i}.features.${j}`, v)}
                    as="span"
                  />
                </li>
              ))}
            </ul>
            <EditableText
              value={t.cta}
              onCommit={(v) => onEdit(`tiers.${i}.cta`, v)}
              as="div"
              className="w-full h-9 rounded-md text-[12.5px] font-serif grid place-items-center"
              style={{
                background: t.recommended ? tokens.accent : "transparent",
                color: t.recommended ? "white" : "#0e0c08",
                border: t.recommended
                  ? "none"
                  : "1px solid rgba(14,12,8,0.2)",
              }}
            />
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
  onEdit,
}: {
  section: TestimonialsSection;
  tokens: Tokens;
  onEdit: EditFn;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.eyebrow !== undefined && (
        <EditableText
          value={section.eyebrow ?? ""}
          onCommit={(v) => onEdit("eyebrow", v)}
          as="div"
          className="text-[11px] tracking-[0.3em] uppercase font-mono mb-3"
          style={{ color: tokens.accent }}
        />
      )}
      <EditableText
        value={section.title}
        onCommit={(v) => onEdit("title", v)}
        as="h2"
        className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] text-[#0e0c08]"
        style={{ letterSpacing: "-0.02em" }}
      />
      <div className="mt-8 grid grid-cols-2 gap-6">
        {section.quotes.map((q, i) => (
          <blockquote
            key={i}
            className="font-serif"
            style={{
              borderLeft: `2px solid ${tokens.accent}`,
              paddingLeft: 16,
            }}
          >
            <EditableText
              value={q.text}
              onCommit={(v) => onEdit(`quotes.${i}.text`, v)}
              as="p"
              multiline
              className="italic text-[#0e0c08] text-[14.5px] leading-relaxed"
            />
            <footer
              className="mt-3 text-[11.5px] font-sans not-italic"
              style={{ color: "#827a6e" }}
            >
              <EditableText
                value={q.author}
                onCommit={(v) => onEdit(`quotes.${i}.author`, v)}
                as="span"
              />
              <span> · </span>
              <EditableText
                value={q.role}
                onCommit={(v) => onEdit(`quotes.${i}.role`, v)}
                as="span"
              />
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
function Faq({
  section,
  tokens,
  onEdit,
}: {
  section: FaqSection;
  tokens: Tokens;
  onEdit: EditFn;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.eyebrow !== undefined && (
        <EditableText
          value={section.eyebrow ?? ""}
          onCommit={(v) => onEdit("eyebrow", v)}
          as="div"
          className="text-[11px] tracking-[0.3em] uppercase font-mono mb-3"
          style={{ color: tokens.accent }}
        />
      )}
      <EditableText
        value={section.title}
        onCommit={(v) => onEdit("title", v)}
        as="h2"
        className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] text-[#0e0c08]"
        style={{ letterSpacing: "-0.02em" }}
      />
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
            <EditableText
              value={it.question}
              onCommit={(v) => onEdit(`items.${i}.question`, v)}
              as="h3"
              className="font-serif text-[14px] text-[#0e0c08] mb-1"
            />
            <EditableText
              value={it.answer}
              onCommit={(v) => onEdit(`items.${i}.answer`, v)}
              as="p"
              multiline
              className="text-[12.5px] leading-snug font-sans"
              style={{ color: "#4a443c" }}
            />
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
  onEdit,
}: {
  section: CtaBandSection;
  tokens: Tokens;
  onEdit: EditFn;
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
      <EditableText
        value={section.headline}
        onCommit={(v) => onEdit("headline", v)}
        as="h2"
        multiline
        className="font-serif font-medium text-[clamp(1.5rem,2.4vw,2rem)] text-[#0e0c08]"
        style={{ letterSpacing: "-0.025em" }}
      />
      {section.subhead !== undefined && (
        <EditableText
          value={section.subhead ?? ""}
          onCommit={(v) => onEdit("subhead", v)}
          as="p"
          multiline
          className="mt-3 font-serif italic text-[14px] max-w-[42ch] mx-auto"
          style={{ color: "#4a443c" }}
        />
      )}
      <EditableText
        value={section.primaryCta}
        onCommit={(v) => onEdit("primaryCta", v)}
        as="div"
        className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-md text-[13px] text-white font-serif"
        style={{ background: tokens.accent }}
      />
    </section>
  );
}

/* ============================================================
 * Footer
 * ============================================================ */
function Footer({
  section,
  onEdit,
  tokens,
}: {
  section: FooterSection;
  onEdit: EditFn;
  tokens: Tokens;
}) {
  return (
    <section
      data-section-id={section.id}
      data-edit-surface="dark"
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
            <EditableText
              value={section.brand}
              onCommit={(v) => onEdit("brand", v)}
              as="span"
              className="font-serif text-[14px]"
            />
          </div>
          {section.tagline !== undefined && (
            <EditableText
              value={section.tagline ?? ""}
              onCommit={(v) => onEdit("tagline", v)}
              as="p"
              multiline
              className="text-[11.5px] font-serif italic leading-relaxed"
              style={{ color: "rgba(251,247,238,0.65)" }}
            />
          )}
        </div>
        {section.columns.map((c, i) => (
          <div key={i}>
            <EditableText
              value={c.heading}
              onCommit={(v) => onEdit(`columns.${i}.heading`, v)}
              as="div"
              className="text-[10px] tracking-[0.3em] uppercase font-mono mb-2"
              style={{ color: "rgba(251,247,238,0.5)" }}
            />
            <ul className="space-y-1.5">
              {c.links.map((l, j) => (
                <li
                  key={j}
                  className="text-[12px] font-sans"
                  style={{ color: "rgba(251,247,238,0.85)" }}
                >
                  <EditableText
                    value={l}
                    onCommit={(v) => onEdit(`columns.${i}.links.${j}`, v)}
                    as="span"
                  />
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
function RichText({
  section,
  onEdit,
}: {
  section: RichTextSection;
  onEdit: EditFn;
}) {
  return (
    <section
      data-section-id={section.id}
      className="px-10 py-12"
      style={{ borderTop: "1px solid rgba(14,12,8,0.08)" }}
    >
      {section.title !== undefined && (
        <EditableText
          value={section.title ?? ""}
          onCommit={(v) => onEdit("title", v)}
          as="h2"
          className="font-serif font-medium text-[clamp(1.25rem,2vw,1.625rem)] text-[#0e0c08] mb-3"
          style={{ letterSpacing: "-0.02em" }}
        />
      )}
      <EditableText
        value={section.body}
        onCommit={(v) => onEdit("body", v)}
        as="p"
        multiline
        className="text-[13px] leading-relaxed font-sans whitespace-pre-wrap"
        style={{ color: "#4a443c" }}
      />
    </section>
  );
}
