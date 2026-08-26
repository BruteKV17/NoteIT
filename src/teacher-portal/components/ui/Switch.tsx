import { cn } from '../../lib/cn'

/** Accessible on/off switch (role="switch"). */
export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          checked ? 'border-brand-cyan/40 bg-brand-cyan/25' : 'border-line bg-panel',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full transition-transform',
            checked ? 'translate-x-6 bg-brand-cyan' : 'translate-x-1 bg-faint',
          )}
        />
      </button>
    </label>
  )
}
