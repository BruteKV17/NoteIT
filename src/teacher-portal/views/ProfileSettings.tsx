import { useState } from 'react'
import {
  BadgeCheck,
  Bell,
  Camera,
  Check,
  Clock,
  Copy,
  GraduationCap,
  LogOut,
  Plus,
  Save,
  Trash2,
  UserCog,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { generateTeacherCode } from '../lib/uid'
import { cn } from '../lib/cn'
import type { FacultyProfile, NotificationPrefs, OfficeHour } from '../types'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card, SectionHeading } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Switch } from '../components/ui/Switch'

const TITLES: FacultyProfile['title'][] = ['Prof.', 'Dr.', 'Mr.', 'Ms.', 'Mx.']
const DAYS: OfficeHour['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MODES: OfficeHour['mode'][] = ['In-person', 'Online']

interface IdentityDraft {
  title: FacultyProfile['title']
  firstName: string
  surname: string
  phone: string
  university: string
  department: string
  bio: string
}

const notificationCopy: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'whatsappNewDoubt', label: 'WhatsApp on new doubt', description: 'Ping me the moment a student routes a doubt to my code.' },
  { key: 'whatsappDailyDigest', label: 'WhatsApp daily digest', description: 'One summary message each evening.' },
  { key: 'emailWeeklyReport', label: 'Email weekly report', description: 'Cohort analytics and weak-topic trends every Monday.' },
  { key: 'quietHours', label: 'Quiet hours (10pm–7am)', description: 'Hold non-urgent notifications overnight.' },
]

export function ProfileSettings() {
  const { profile, updateProfile, logout } = useAuth()
  const { push } = useToast()
  const { copied, copy } = useCopyToClipboard()

  const [draft, setDraft] = useState<IdentityDraft | null>(
    profile
      ? {
          title: profile.title,
          firstName: profile.firstName,
          surname: profile.surname,
          phone: profile.phone,
          university: profile.university,
          department: profile.department,
          bio: profile.bio ?? '',
        }
      : null,
  )
  const [newSubject, setNewSubject] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [oh, setOh] = useState<Omit<OfficeHour, 'id'>>({ day: 'Mon', start: '14:00', end: '16:00', mode: 'In-person', location: '' })

  if (!profile || !draft) return null

  const previewCode = generateTeacherCode(draft.firstName, draft.surname) || '········'

  const saveIdentity = () => {
    if (!draft.firstName.trim() || !draft.surname.trim()) {
      push({ variant: 'warning', title: 'Name required', description: 'First name and surname cannot be empty.' })
      return
    }
    updateProfile({
      title: draft.title,
      firstName: draft.firstName.trim(),
      surname: draft.surname.trim(),
      phone: draft.phone.trim(),
      university: draft.university.trim(),
      department: draft.department.trim(),
      bio: draft.bio.trim(),
    })
    push({ variant: 'success', title: 'Profile saved', description: `Teacher Code is now ${generateTeacherCode(draft.firstName, draft.surname)}.` })
  }

  const addSubject = () => {
    const val = newSubject.trim()
    if (!val) return
    if (profile.subjects.some((s) => s.toLowerCase() === val.toLowerCase())) {
      push({ variant: 'info', title: 'Already added', description: val })
      setNewSubject('')
      return
    }
    updateProfile({ subjects: [...profile.subjects, val] })
    setNewSubject('')
  }

  const removeSubject = (s: string) => updateProfile({ subjects: profile.subjects.filter((x) => x !== s) })

  const copyCode = async () => {
    const ok = await copy(profile.teacherCode)
    if (ok) push({ variant: 'success', title: 'Teacher Code copied', description: profile.teacherCode })
  }

  const applyAvatar = () => {
    updateProfile({ avatarUrl: avatarUrl.trim() || undefined })
    push({ variant: 'success', title: avatarUrl.trim() ? 'Avatar updated' : 'Avatar reset' })
    setAvatarUrl('')
  }

  const removeOfficeHour = (id: string) =>
    updateProfile({ officeHours: profile.officeHours.filter((h) => h.id !== id) })

  const addOfficeHour = () => {
    const entry: OfficeHour = { ...oh, id: `oh-${Date.now()}`, location: oh.location?.trim() || undefined }
    updateProfile({ officeHours: [...profile.officeHours, entry] })
    push({ variant: 'success', title: 'Office hour added', description: `${entry.day} ${entry.start}–${entry.end}` })
  }

  const toggleNotif = (key: keyof NotificationPrefs, next: boolean) =>
    updateProfile({ notifications: { ...profile.notifications, [key]: next } })

  const inputCls =
    'w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand-cyan/50 focus:outline-none'

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Account"
        title="Profile & settings"
        subtitle="Manage your identity, subjects, office hours, and notifications."
        action={
          <Button variant="danger" iconLeft={<LogOut size={16} />} onClick={logout}>
            Sign Out
          </Button>
        }
      />

      {/* Identity + avatar */}
      <Card padded>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Avatar column */}
          <div className="flex flex-col items-center gap-3 lg:w-56 lg:shrink-0">
            <div className="relative">
              <Avatar initials={profile.avatarInitials} src={profile.avatarUrl} size="xl" accent="gold" />
              <span className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card text-brand-gold">
                <Camera size={15} />
              </span>
            </div>
            <div className="text-center">
              <div className="font-display text-base font-semibold text-ink">
                {profile.title} {profile.firstName} {profile.surname}
              </div>
              <div className="text-xs text-muted">{profile.email}</div>
            </div>
            {/* Teacher code */}
            <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-3 py-2">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-brand-gold/70">Teacher code</div>
                <div className="metric text-sm font-semibold text-brand-gold">{profile.teacherCode}</div>
              </div>
              <button
                type="button"
                onClick={copyCode}
                aria-label="Copy Teacher Code"
                className="rounded-lg p-1.5 text-brand-gold/80 transition-colors hover:bg-brand-gold/20 hover:text-brand-gold"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <div className="flex w-full gap-2">
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Paste image URL"
                aria-label="Avatar image URL"
                className={cn(inputCls, 'py-2 text-xs')}
              />
              <Button variant="secondary" size="sm" onClick={applyAvatar}>
                Set
              </Button>
            </div>
          </div>

          {/* Fields */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <UserCog size={16} className="text-brand-cyan" />
              Identity
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="f-title" className="mb-1.5 block text-xs font-medium text-muted">Title</label>
                <select id="f-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value as FacultyProfile['title'] })} className={inputCls}>
                  {TITLES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="hidden sm:block" />
              <div>
                <label htmlFor="f-first" className="mb-1.5 block text-xs font-medium text-muted">First name</label>
                <input id="f-first" value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label htmlFor="f-last" className="mb-1.5 block text-xs font-medium text-muted">Surname</label>
                <input id="f-last" value={draft.surname} onChange={(e) => setDraft({ ...draft, surname: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label htmlFor="f-phone" className="mb-1.5 block text-xs font-medium text-muted">WhatsApp / phone</label>
                <input id="f-phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label htmlFor="f-uni" className="mb-1.5 block text-xs font-medium text-muted">University</label>
                <input id="f-uni" value={draft.university} onChange={(e) => setDraft({ ...draft, university: e.target.value })} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="f-dept" className="mb-1.5 block text-xs font-medium text-muted">Department</label>
                <input id="f-dept" value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="f-bio" className="mb-1.5 block text-xs font-medium text-muted">Bio</label>
                <textarea id="f-bio" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} rows={2} className={cn(inputCls, 'resize-y')} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="accent" iconLeft={<Save size={16} />} onClick={saveIdentity}>
                Save changes
              </Button>
              <span className="flex items-center gap-2 text-xs text-muted">
                <BadgeCheck size={14} className="text-brand-gold" />
                New code preview:
                <span className="metric font-semibold text-brand-gold">{previewCode}</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Subjects + Notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Subjects */}
        <Card padded>
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <GraduationCap size={16} className="text-brand-emerald" />
            Assigned subjects
          </div>
          <p className="mt-1 text-sm text-muted">Students pick from these when routing a doubt to your code.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.subjects.map((s) => (
              <Chip key={s} label={s} onRemove={() => removeSubject(s)} />
            ))}
            {profile.subjects.length === 0 && <span className="text-sm text-faint">No subjects yet.</span>}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addSubject()
                }
              }}
              placeholder="Add a subject and press Enter"
              aria-label="Add a subject"
              className={inputCls}
            />
            <Button variant="secondary" iconLeft={<Plus size={16} />} onClick={addSubject}>
              Add
            </Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card padded>
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Bell size={16} className="text-brand-gold" />
            WhatsApp & notifications
          </div>
          <p className="mt-1 text-sm text-muted">Choose how Note It AI reaches you.</p>
          <div className="mt-4 space-y-4">
            {notificationCopy.map((n) => (
              <Switch
                key={n.key}
                checked={profile.notifications[n.key]}
                onChange={(next) => toggleNotif(n.key, next)}
                label={n.label}
                description={n.description}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Office hours */}
      <Card padded>
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Clock size={16} className="text-brand-cyan" />
          Office hours
        </div>

        <ul className="mt-4 space-y-2">
          {profile.officeHours.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel/50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-11 items-center justify-center rounded-lg bg-brand-cyan/10 font-mono text-xs font-semibold text-brand-cyan">
                  {h.day}
                </span>
                <div className="min-w-0">
                  <div className="metric text-sm text-ink">
                    {h.start} – {h.end}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {h.mode}
                    {h.location ? ` · ${h.location}` : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeOfficeHour(h.id)}
                aria-label={`Remove ${h.day} office hour`}
                className="rounded-lg p-2 text-faint transition-colors hover:bg-brand-rose/15 hover:text-brand-rose"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
          {profile.officeHours.length === 0 && <li className="text-sm text-faint">No office hours set.</li>}
        </ul>

        {/* Add row */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-dashed border-line p-3 sm:grid-cols-5">
          <select value={oh.day} onChange={(e) => setOh({ ...oh, day: e.target.value as OfficeHour['day'] })} aria-label="Day" className={cn(inputCls, 'py-2')}>
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input type="time" value={oh.start} onChange={(e) => setOh({ ...oh, start: e.target.value })} aria-label="Start time" className={cn(inputCls, 'py-2')} />
          <input type="time" value={oh.end} onChange={(e) => setOh({ ...oh, end: e.target.value })} aria-label="End time" className={cn(inputCls, 'py-2')} />
          <select value={oh.mode} onChange={(e) => setOh({ ...oh, mode: e.target.value as OfficeHour['mode'] })} aria-label="Mode" className={cn(inputCls, 'py-2')}>
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <Button variant="secondary" iconLeft={<Plus size={16} />} onClick={addOfficeHour} className="col-span-2 sm:col-span-1">
            Add
          </Button>
          <input
            value={oh.location ?? ''}
            onChange={(e) => setOh({ ...oh, location: e.target.value })}
            placeholder="Location or meeting link (optional)"
            aria-label="Location"
            className={cn(inputCls, 'col-span-2 py-2 sm:col-span-5')}
          />
        </div>
      </Card>

      {/* Account Security & Sign Out Card */}
      <Card padded className="border-brand-rose/30 bg-brand-rose/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-ink">Sign Out of Faculty Portal</h3>
            <p className="text-xs text-muted">Safely end your current session and return to the login screen.</p>
          </div>
          <Button variant="danger" iconLeft={<LogOut size={16} />} onClick={logout}>
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  )
}
