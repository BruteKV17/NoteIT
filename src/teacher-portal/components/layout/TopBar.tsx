import { useState, useRef, useEffect } from 'react'
import { Bell, BookOpen, Check, Copy, LogOut, Menu, Moon, Sun, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { useData } from '../../context/DataContext'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { cn } from '../../lib/cn'
import type { ViewId } from '../../types'
import { Avatar } from '../ui/Avatar'
import { navItemFor } from './navConfig'

export function TopBar({
  active,
  onOpenMenu,
  onNavigate,
}: {
  active: ViewId
  onOpenMenu: () => void
  onNavigate: (id: ViewId) => void
}) {
  const { profile, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { push } = useToast()
  const { doubts } = useData()
  const { copied, copy } = useCopyToClipboard()

  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const item = navItemFor(active)
  const Icon = item.icon
  const pendingCount = doubts.filter((d) => d.status === 'pending').length

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const copyCode = async () => {
    if (!profile) return
    const ok = await copy(profile.teacherCode)
    push(
      ok
        ? { variant: 'success', title: 'Teacher Code copied', description: profile.teacherCode }
        : { variant: 'error', title: 'Copy failed', description: 'Select and copy the code manually.' },
    )
  }

  // Prevent duplicate title formatting (e.g. "Prof. Prof. Kishan Verma")
  const formattedName = profile
    ? profile.firstName.startsWith(profile.title)
      ? `${profile.firstName} ${profile.surname}`.trim()
      : `${profile.title} ${profile.firstName} ${profile.surname}`.trim()
    : ''

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-canvas px-4 sm:px-6">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-panel hover:text-ink lg:hidden cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="hidden h-8 w-8 items-center justify-center rounded-lg bg-panel text-brand-emerald sm:inline-flex border border-line">
            <Icon size={16} />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{item.eyebrow}</div>
            <div className="truncate text-sm font-semibold text-ink">{item.label}</div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Teacher UID code badge + copy */}
        {profile && (
          <div className="flex items-center gap-1 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 py-1 pl-3 pr-1">
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-brand-emerald/70 sm:inline">
              Code
            </span>
            <span className="font-mono text-sm font-semibold tracking-wide text-brand-emerald">
              {profile.teacherCode}
            </span>
            <button
              type="button"
              onClick={copyCode}
              aria-label="Copy Teacher Code"
              className="ml-0.5 rounded-full p-1.5 text-brand-emerald/80 transition-colors hover:bg-brand-emerald/20 hover:text-brand-emerald cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-panel hover:text-ink cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('activity')}
          aria-label={`Activity center${pendingCount ? `, ${pendingCount} pending doubts` : ''}`}
          className="relative rounded-lg p-2 text-muted transition-colors hover:bg-panel hover:text-ink cursor-pointer"
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-emerald ring-2 ring-canvas" />
          )}
        </button>

        {/* Profile Avatar Dropdown Button & Menu */}
        {profile && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Profile menu"
              className={cn(
                'rounded-full transition-all cursor-pointer ring-2',
                menuOpen ? 'ring-brand-emerald scale-105' : 'ring-transparent hover:scale-105'
              )}
            >
              <Avatar initials={profile.avatarInitials} src={profile.avatarUrl} size="sm" accent="emerald" />
            </button>

            {/* Solid Opaque Dropdown Menu (No Transparency) */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border-2 border-line bg-[#101712] dark:bg-[#101712] p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[9999] animate-scale-in">
                <div className="flex items-center gap-3 p-2 border-b border-line pb-3">
                  <Avatar initials={profile.avatarInitials} src={profile.avatarUrl} size="md" accent="emerald" />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="truncate text-sm font-bold text-[#F2F7F3]">
                      {formattedName}
                    </div>
                    <div className="truncate text-xs text-[#A0B2A3]">{profile.department}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-brand-emerald bg-brand-emerald/15 px-2 py-0.5 rounded-full border border-brand-emerald/30">
                      Code: {profile.teacherCode}
                    </div>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onNavigate('settings'); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#F2F7F3] hover:bg-[#162019] transition-colors cursor-pointer"
                  >
                    <User size={15} className="text-[#A0B2A3]" />
                    <span>Profile & Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onNavigate('courses'); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#F2F7F3] hover:bg-[#162019] transition-colors cursor-pointer"
                  >
                    <BookOpen size={15} className="text-[#A0B2A3]" />
                    <span>My Courses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onNavigate('activity'); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#F2F7F3] hover:bg-[#162019] transition-colors cursor-pointer"
                  >
                    <Bell size={15} className="text-[#A0B2A3]" />
                    <span>Activity Center</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-rose bg-brand-rose/15 hover:bg-brand-rose/25 transition-colors cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
