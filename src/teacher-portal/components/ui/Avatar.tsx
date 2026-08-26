import { cn } from '../../lib/cn'
import { accentText, type Accent } from './accents'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<Size, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
}

/** Circular avatar — shows an image if provided, else initials on a glass disc. */
export function Avatar({
  initials,
  src,
  size = 'md',
  accent = 'cyan',
  className,
}: {
  initials: string
  src?: string
  size?: Size
  accent?: Accent
  className?: string
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-panel font-semibold',
        sizeMap[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={cn('font-display', accentText[accent])}>{initials}</span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]" />
    </span>
  )
}
