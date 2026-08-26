import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconLeft?: ReactNode
  iconRight?: ReactNode
  block?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 select-none disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98]'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-canvas hover:opacity-90 shadow-lift',
  accent: 'bg-brand-gold text-black hover:brightness-105 shadow-glow-gold',
  secondary: 'bg-panel text-ink border border-line hover:border-brand-cyan/40 hover:bg-panel/70',
  ghost: 'text-muted hover:text-ink hover:bg-panel',
  danger: 'bg-brand-rose/15 text-brand-rose border border-brand-rose/30 hover:bg-brand-rose/25',
}

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3',
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  block,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}
