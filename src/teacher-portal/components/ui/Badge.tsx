import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import type { DoubtStatus } from '../../types'
import { accentBgSoft, accentBorder, accentDot, accentText, type Accent } from './accents'

/* --------------------------------- Badge -------------------------------- */
export function Badge({
  children,
  accent = 'cyan',
  className,
  glow = false,
}: {
  children: ReactNode
  accent?: Accent
  className?: string
  glow?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        accentText[accent],
        accentBgSoft[accent],
        accentBorder[accent],
        glow && 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]',
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------ Code badge ------------------------------ */
/** Monospace pill for course codes like CS301. */
export function CodePill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-xs font-medium text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------ Accent dot ------------------------------ */
export function AccentDot({ accent, pulse = false }: { accent: Accent; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && (
        <span
          className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', accentDot[accent])}
        />
      )}
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', accentDot[accent])} />
    </span>
  )
}

/* ------------------------------ Status pill ----------------------------- */
const statusMap: Record<DoubtStatus, { label: string; accent: Accent }> = {
  pending: { label: 'Pending', accent: 'gold' },
  answered: { label: 'Answered', accent: 'cyan' },
  resolved: { label: 'Resolved', accent: 'emerald' },
  escalated: { label: 'Escalated', accent: 'rose' },
}

export function StatusPill({ status }: { status: DoubtStatus }) {
  const { label, accent } = statusMap[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        accentText[accent],
        accentBgSoft[accent],
        accentBorder[accent],
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', accentDot[accent])} />
      {label}
    </span>
  )
}

export { statusMap }
