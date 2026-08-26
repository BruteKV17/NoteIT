import type { CSSProperties, ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { accentBgSoft, accentText, type Accent } from './accents'

interface KpiCardProps {
  label: string
  value: string | number
  icon: ReactNode
  accent?: Accent
  delta?: string
  deltaDir?: 'up' | 'down' | 'flat'
  hint?: string
  style?: CSSProperties
}

export function KpiCard({
  label,
  value,
  icon,
  accent = 'cyan',
  delta,
  deltaDir = 'up',
  hint,
  style,
}: KpiCardProps) {
  const DeltaIcon = deltaDir === 'up' ? ArrowUpRight : deltaDir === 'down' ? ArrowDownRight : Minus
  const deltaColor =
    deltaDir === 'up' ? 'text-brand-emerald' : deltaDir === 'down' ? 'text-brand-rose' : 'text-muted'

  return (
    <div className="glass-panel glass-panel-hover animate-fade-up p-5" style={style}>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-xl',
            accentBgSoft[accent],
            accentText[accent],
          )}
        >
          {icon}
        </span>
        {delta && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', deltaColor)}>
            <DeltaIcon size={14} />
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="metric text-3xl font-semibold text-ink">{value}</div>
        <div className="mt-1 text-sm font-medium text-muted">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-faint">{hint}</div>}
      </div>
    </div>
  )
}
