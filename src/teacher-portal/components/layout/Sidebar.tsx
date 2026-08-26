import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import type { ViewId } from '../../types'
import { Avatar } from '../ui/Avatar'
import { NAV, NAV_GROUPS } from './navConfig'
import AILogo from '../../../components/AILogo'

/** Shared sidebar content — reused by the desktop rail and the mobile drawer. */
export function SidebarNav({
  active,
  onNavigate,
}: {
  active: ViewId
  onNavigate: (id: ViewId) => void
}) {
  const { profile } = useAuth()

  return (
    <div className="flex h-full flex-col min-w-0 overflow-hidden">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 min-w-0 overflow-hidden border-b border-line/50 bg-panel/30">
        <AILogo size={32} showText={false} theme="dark" />
        <div className="leading-tight min-w-0 flex-1 overflow-hidden">
          <div className="font-display text-[15px] font-bold text-ink truncate">NoteIT</div>
          <div className="font-mono text-[10px] lowercase tracking-[0.15em] text-brand-emerald font-semibold truncate">faculty portal</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint font-semibold">{group}</div>
            <ul className="space-y-1">
              {NAV.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon
                const isActive = item.id === active
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      data-active={isActive}
                      aria-current={isActive ? 'page' : undefined}
                      className="nav-item w-full cursor-pointer"
                    >
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-emerald transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <Icon size={17} className={cn('shrink-0', isActive ? 'text-brand-emerald' : 'text-faint')} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pinned Profile Card at bottom left */}
      {profile && (
        <div className="border-t border-line p-3 shrink-0 bg-panel/40 min-w-0 overflow-hidden">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            title="View Profile Settings"
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-panel min-w-0 overflow-hidden cursor-pointer group"
          >
            <Avatar initials={profile.avatarInitials} src={profile.avatarUrl} size="md" accent="emerald" />
            <span className="min-w-0 flex-1 overflow-hidden">
              <span className="block truncate text-sm font-semibold text-ink group-hover:text-brand-emerald transition-colors">
                {profile.firstName.startsWith(profile.title)
                  ? `${profile.firstName} ${profile.surname}`.trim()
                  : `${profile.title} ${profile.firstName} ${profile.surname}`.trim()}
              </span>
              <span className="block truncate text-xs text-muted">{profile.department}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

/** Desktop sidebar rail. */
export function Sidebar({ active, onNavigate }: { active: ViewId; onNavigate: (id: ViewId) => void }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-card/80 lg:flex overflow-hidden">
      <SidebarNav active={active} onNavigate={onNavigate} />
    </aside>
  )
}
