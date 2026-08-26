import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Primary surface — glassmorphism border over the dark card color. */
export function Card({
  children,
  className,
  hover = false,
  padded = true,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
  padded?: boolean
}) {
  return (
    <div className={cn('glass-panel', hover && 'glass-panel-hover', padded && 'p-5', className)}>
      {children}
    </div>
  )
}

/** Section header with an eyebrow label, title, and optional trailing action. */
export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  icon,
  action,
  className,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{eyebrow}</div>
        )}
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-muted">{icon}</span>}
          <h2 className="truncate text-lg font-semibold text-ink">{title}</h2>
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Thin divider tuned for the dark palette. */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />
}
