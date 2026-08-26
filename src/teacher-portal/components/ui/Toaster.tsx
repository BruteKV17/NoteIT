import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { cn } from '../../lib/cn'
import type { ToastVariant } from '../../types'

const meta: Record<ToastVariant, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'text-brand-emerald' },
  info: { icon: Info, cls: 'text-brand-cyan' },
  warning: { icon: AlertTriangle, cls: 'text-brand-gold' },
  error: { icon: XCircle, cls: 'text-brand-rose' },
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const m = meta[t.variant]
        const Icon = m.icon
        return (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : 'status'}
            className="glass-panel pointer-events-auto flex animate-slide-in-right items-start gap-3 p-3.5 pr-2"
          >
            <Icon size={18} className={cn('mt-0.5 shrink-0', m.cls)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-faint transition-colors hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
