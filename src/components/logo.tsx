// Bloat Buddy logo: the "Calm wave" mark (a settled belly line) and the name. Colours come from the
// tokens, so the mark follows the light and dark themes.
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={className}>
      <rect width="64" height="64" rx="18" fill="var(--brand)" />
      <path d="M14 37c5-8 11-8 16-3s12 6 20-3" stroke="var(--on-brand)" strokeWidth="5.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      <span className="font-display text-[1.25rem] font-extrabold leading-none tracking-[-0.02em] text-ink">Bloat Buddy</span>
    </span>
  );
}
