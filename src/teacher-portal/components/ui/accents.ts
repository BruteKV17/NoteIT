/** Accent color system shared across UI primitives. */
export type Accent = 'gold' | 'cyan' | 'emerald' | 'violet' | 'rose'

export const accentText: Record<Accent, string> = {
  gold: 'text-brand-gold',
  cyan: 'text-brand-cyan',
  emerald: 'text-brand-emerald',
  violet: 'text-brand-violet',
  rose: 'text-brand-rose',
}

export const accentBgSoft: Record<Accent, string> = {
  gold: 'bg-brand-gold/10',
  cyan: 'bg-brand-cyan/10',
  emerald: 'bg-brand-emerald/10',
  violet: 'bg-brand-violet/10',
  rose: 'bg-brand-rose/10',
}

export const accentBorder: Record<Accent, string> = {
  gold: 'border-brand-gold/30',
  cyan: 'border-brand-cyan/30',
  emerald: 'border-brand-emerald/30',
  violet: 'border-brand-violet/30',
  rose: 'border-brand-rose/30',
}

export const accentDot: Record<Accent, string> = {
  gold: 'bg-brand-gold',
  cyan: 'bg-brand-cyan',
  emerald: 'bg-brand-emerald',
  violet: 'bg-brand-violet',
  rose: 'bg-brand-rose',
}

export const accentBar: Record<Accent, string> = {
  gold: 'bg-brand-gold',
  cyan: 'bg-brand-cyan',
  emerald: 'bg-brand-emerald',
  violet: 'bg-brand-violet',
  rose: 'bg-brand-rose',
}

export const accentGlow: Record<Accent, string> = {
  gold: 'shadow-glow-gold',
  cyan: 'shadow-glow-cyan',
  emerald: 'shadow-glow-emerald',
  violet: 'shadow-[0_0_22px_-4px_rgba(167,139,250,0.55)]',
  rose: 'shadow-[0_0_22px_-4px_rgba(251,113,133,0.55)]',
}
