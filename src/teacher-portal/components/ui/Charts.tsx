import { cn } from '../../lib/cn'
import { pct } from '../../lib/format'
import { accentBar, accentText, type Accent } from './accents'

export interface ChartDatum {
  label: string
  value: number
  accent?: Accent
}

/* ------------------------- Horizontal bar chart ------------------------- */
export function BarChart({
  data,
  unit = '%',
  className,
}: {
  data: ChartDatum[]
  unit?: string
  className?: string
}) {
  const max = Math.max(100, ...data.map((d) => d.value))
  return (
    <div className={cn('space-y-3', className)}>
      {data.map((d) => {
        const width = pct((d.value / max) * 100)
        return (
          <div key={d.label} className="group">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate text-muted">{d.label}</span>
              <span className="metric ml-3 shrink-0 text-ink">
                {d.value}
                {unit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-panel">
              <div
                className={cn('h-full origin-left rounded-full', accentBar[d.accent ?? 'cyan'])}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------- Vertical column chart ----------------------- */
export function ColumnChart({
  data,
  unit = '%',
  className,
}: {
  data: ChartDatum[]
  unit?: string
  className?: string
}) {
  const max = Math.max(100, ...data.map((d) => d.value))
  return (
    <div className={cn('flex items-end gap-3', className)} style={{ height: 180 }}>
      {data.map((d) => {
        const h = pct((d.value / max) * 100)
        return (
          <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="metric text-xs text-ink">
              {d.value}
              {unit}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className={cn('w-full rounded-t-lg transition-[height] duration-700 ease-out', accentBar[d.accent ?? 'cyan'])}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="w-full truncate text-center font-mono text-[10px] uppercase tracking-wide text-faint">
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------ Donut ring ------------------------------ */
export function DonutRing({
  value,
  accent = 'cyan',
  size = 132,
  label,
  sublabel,
  className,
}: {
  value: number
  accent?: Accent
  size?: number
  label?: string
  sublabel?: string
  className?: string
}) {
  const v = pct(value)
  const r = 42
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - v / 100)
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(var(--panel))" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className={accentText[accent]}
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="metric text-2xl font-semibold text-ink">{label ?? `${v}%`}</span>
        {sublabel && <span className="mt-0.5 text-[11px] text-faint">{sublabel}</span>}
      </div>
    </div>
  )
}
