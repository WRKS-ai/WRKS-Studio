"use client";

import { ShinyText } from "./shiny-text";

export function BrandMarquee() {
  return (
    <section
      className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 overflow-hidden"
      aria-label="WRKS Studio"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.08), transparent 65%)",
        }}
      />
      <div className="relative max-w-screen-2xl mx-auto text-center leading-[0.8]">
        <ShinyText
          text="WRKS Studio"
          speed={4.5}
          delay={0.6}
          yoyo={false}
          color="#2a2532"
          shineColor="#e9e3ff"
          spread={110}
          direction="left"
          className="font-serif font-medium tracking-[-0.04em]"
        />
      </div>
      <style>{`
        section[aria-label="WRKS Studio"] .shiny-text {
          font-size: clamp(5rem, 22vw, 22rem);
          line-height: 0.8;
        }
      `}</style>
    </section>
  );
}
