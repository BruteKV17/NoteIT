import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Accessible modal dialog:
 *  - role="dialog" aria-modal, labelled by the caller
 *  - focus moves in on open and is trapped (Tab / Shift+Tab wrap)
 *  - Escape and backdrop click close it (when dismissible)
 *  - body scroll locked; focus restored to the trigger on close
 */
export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  describedBy,
  dismissible = true,
  className,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
  describedBy?: string
  dismissible?: boolean
  className?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const prevFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const getFocusable = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : []

    // Move focus into the dialog.
    const focusables = getFocusable()
    ;(focusables[0] ?? panel)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const list = getFocusable()
      if (list.length === 0) {
        e.preventDefault()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocused?.focus?.()
    }
  }, [open, onClose, dismissible])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/75 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn('relative z-10 w-full max-w-lg animate-scale-in outline-none', className)}
      >
        {children}
      </div>
    </div>
  )
}
