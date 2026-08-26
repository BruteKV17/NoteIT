import { Search, X } from 'lucide-react'
import { cn } from '../../lib/cn'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search size={16} className="pointer-events-none absolute left-3 text-faint" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="w-full rounded-xl border border-line bg-panel py-2.5 pl-9 pr-9 text-sm text-ink placeholder:text-faint transition-colors focus:border-brand-cyan/50 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 rounded-md p-1 text-faint transition-colors hover:text-ink"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
