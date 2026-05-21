"use client";

const PRODUCT_LINKS = [
  { label: "What it builds", href: "#builds" },
  { label: "How it works", href: "#how" },
  { label: "Try Nova", href: "#nova" },
  { label: "Connections", href: "#connections" },
];

const COMPANY_LINKS = [
  { label: "Founding cohort", href: "#waitlist" },
  { label: "Contact", href: "mailto:contact@slightwrks.com" },
  { label: "Press", href: "#" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Security", href: "#" },
];

export function Footer() {
  return (
    <footer
      className="relative py-16 px-6 lg:px-8"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Top — brand + 3 link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 sm:gap-12 mb-14">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="relative size-2.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #6366f1 100%)",
                  boxShadow: "0 0 8px rgba(165,180,252,0.4)",
                }}
              />
              <span className="font-serif text-base tracking-tight text-ink">
                WRKS<span className="text-ink-muted"> Studio</span>
              </span>
            </div>
            <p className="text-[13px] text-ink-muted leading-relaxed max-w-xs">
              The connected business nervous system. One agent. Five
              deliverables. Live from your phone.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono">
              <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
              Founding cohort · early 2026
            </div>
          </div>

          <FooterCol title="Product" links={PRODUCT_LINKS} />
          <FooterCol title="Company" links={COMPANY_LINKS} />
          <FooterCol title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom strip */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-ink-dim font-mono"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span>A SlightWrks platform · © 2026</span>
          <span className="flex items-center gap-2">
            <span>Built with restraint in Toronto.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.22em] uppercase text-ink-dim font-mono mb-4">
        {title}
      </div>
      <ul className="space-y-2.5 text-[13px] font-sans">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-ink-muted hover:text-ink transition-colors duration-150"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
