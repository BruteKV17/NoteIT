import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { ViewId } from '../../types'
import { Sidebar, SidebarNav } from './Sidebar'
import { TopBar } from './TopBar'
import { GreenParticlesBg } from '../ui/GreenParticlesBg'

export function PortalLayout({
  active,
  onNavigate,
  drawerOpen,
  setDrawerOpen,
  children,
}: {
  active: ViewId
  onNavigate: (id: ViewId) => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  children: ReactNode
}) {
  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, setDrawerOpen])

  const navigate = (id: ViewId) => {
    onNavigate(id)
    setDrawerOpen(false)
  }

  return (
    <div className="relative flex min-h-screen bg-canvas text-ink overflow-hidden">
      {/* Ambient background particles & glow */}
      <div className="pointer-events-none fixed inset-0 bg-radial-glow z-0" aria-hidden="true" />
      <GreenParticlesBg />

      {/* Desktop rail */}
      <Sidebar active={active} onNavigate={navigate} />

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="animate-drawer absolute left-0 top-0 flex h-full w-72 flex-col border-r border-line bg-card"
          >
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="flex items-center gap-2 text-ink">
                <span className="text-sm font-semibold">NoteIT</span>
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg p-2 text-muted transition-colors hover:bg-panel hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarNav active={active} onNavigate={navigate} />
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <TopBar active={active} onOpenMenu={() => setDrawerOpen(true)} onNavigate={navigate} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
