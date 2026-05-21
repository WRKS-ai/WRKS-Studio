"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

const LINKS = [
  { label: "Try Nova", href: "#nova" },
  { label: "What it builds", href: "#builds" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300",
        scrolled
          ? "border-b border-white/[0.06] backdrop-blur-[16px]"
          : "border-b border-transparent",
      )}
      style={
        scrolled
          ? { backgroundColor: "rgba(10,10,10,0.55)" }
          : { backgroundColor: "transparent" }
      }
    >
      <div className="max-w-screen-xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/v2" className="flex items-center gap-2.5 group">
          <span className="relative size-2.5 rounded-full bg-gradient-to-br from-white via-sky-200 to-indigo-300 shadow-[0_0_8px_rgba(165,180,252,0.5)]">
            <span className="absolute inset-0 rounded-full bg-white/40 blur-[2px]" />
          </span>
          <span className="font-serif text-base tracking-tight text-ink">
            WRKS<span className="text-ink-muted"> Studio</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-[13px] font-sans">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-ink-muted hover:text-ink transition-colors duration-150"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="md" href="#signin" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button variant="primary" size="md" withArrow href="#waitlist">
            Get WRKS
          </Button>
        </div>
      </div>
    </header>
  );
}
