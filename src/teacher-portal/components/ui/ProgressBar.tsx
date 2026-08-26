import { cn } from '../../lib/cn'
import { pct } from '../../lib/format'
import { accentBar, type Accent } from './accents'

/** Horizontal progress bar with an animated fill. */
export function ProgressBar({
  value,
  accent = 'cyan',
  className,
  height = 'md',
  showLabel = false,
}: {
  value: number
  accent?: Accent
  className?: string
  height?: 'sm' | 'md'
  showLabel?: boolean
}) {
  const v = pct(value)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn('relative w-full overflow-hidden rounded-full bg-panel', height === 'sm' ? 'h-1.5' : 'h-2.5')}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', accentBar[accent])}
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel && <span className="metric w-10 shrink-0 text-right text-xs text-muted">{v}%</span>}
    </div>
  )
}
