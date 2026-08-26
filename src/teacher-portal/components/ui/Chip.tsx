import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

/** Interactive subject/tag chip. Pass onRemove to show a remove affordance. */
export function Chip({
  label,
  onRemove,
  className,
}: {
  label: string
  onRemove?: () => void
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-sm text-ink',
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="-mr-1 rounded-full p-0.5 text-faint transition-colors hover:bg-brand-rose/20 hover:text-brand-rose"
        >
          <X size={13} />
        </button>
      )}
    </span>
  )
}
