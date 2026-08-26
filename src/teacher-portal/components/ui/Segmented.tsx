import { cn } from '../../lib/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  count?: number
}

/** Pill-style segmented control used for status / subject filters. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-card p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-panel text-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'text-muted hover:text-ink',
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn('metric text-xs', active ? 'text-brand-cyan' : 'text-faint')}>{opt.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
