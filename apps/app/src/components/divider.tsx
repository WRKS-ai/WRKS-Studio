export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-[10px] tracking-[0.24em] uppercase text-ink-dim font-mono">
        {label}
      </span>
      <span className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}
