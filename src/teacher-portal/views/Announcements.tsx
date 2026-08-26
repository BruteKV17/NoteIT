import { useState } from 'react'
import { Megaphone, Pin, Radio, Send, Users } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { relativeTime } from '../lib/format'
import { cn } from '../lib/cn'
import { CodePill } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, SectionHeading } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'

export function Announcements() {
  const { announcements, courses, addAnnouncement } = useData()
  const { profile } = useAuth()
  const { push } = useToast()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<string[]>([])

  const author = profile ? `${profile.title} ${profile.firstName} ${profile.surname}` : 'Faculty'
  const reach = courses.filter((c) => audience.includes(c.courseCode)).reduce((s, c) => s + c.students, 0)

  const toggle = (code: string) =>
    setAudience((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))

  const canSend = title.trim() && body.trim() && audience.length > 0

  const broadcast = () => {
    if (!canSend) {
      push({ variant: 'warning', title: 'Incomplete announcement', description: 'Add a title, message, and at least one class.' })
      return
    }
    addAnnouncement({ title: title.trim(), body: body.trim(), audience, author })
    push({ variant: 'success', title: 'Announcement broadcast', description: `Reached ${reach} students.` })
    setTitle('')
    setBody('')
    setAudience([])
  }

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return Date.parse(b.postedAt) - Date.parse(a.postedAt)
  })

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Broadcast"
        title="Announcements"
        subtitle="Post updates to your classes — students see them instantly in Note It AI."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Composer */}
        <Card className="lg:col-span-2" padded>
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Radio size={16} className="text-brand-gold" />
            New broadcast
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="an-title" className="mb-1.5 block text-xs font-medium text-muted">
                Title
              </label>
              <input
                id="an-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-term rescheduled"
                className="w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand-cyan/50 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="an-body" className="mb-1.5 block text-xs font-medium text-muted">
                Message
              </label>
              <textarea
                id="an-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Write the details students need to know…"
                className="w-full resize-y rounded-xl border border-line bg-panel px-3.5 py-3 text-sm text-ink placeholder:text-faint focus:border-brand-cyan/50 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs font-medium text-muted">Audience</div>
              <div className="flex flex-wrap gap-2">
                {courses.map((c) => {
                  const on = audience.includes(c.courseCode)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.courseCode)}
                      aria-pressed={on}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs font-medium transition-colors',
                        on
                          ? 'border-brand-cyan/50 bg-brand-cyan/15 text-brand-cyan'
                          : 'border-line bg-panel text-muted hover:text-ink',
                      )}
                    >
                      {c.courseCode}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line bg-panel/50 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-sm text-muted">
                <Users size={15} className="text-faint" />
                Estimated reach
              </span>
              <span className="metric text-sm font-semibold text-ink">{reach} students</span>
            </div>

            <Button variant="accent" block iconLeft={<Send size={16} />} onClick={broadcast} disabled={!canSend}>
              Broadcast announcement
            </Button>
          </div>
        </Card>

        {/* Feed */}
        <div className="space-y-4 lg:col-span-3">
          {sorted.length === 0 ? (
            <Card>
              <EmptyState icon={<Megaphone size={22} />} title="No announcements yet" description="Your broadcasts will appear here." />
            </Card>
          ) : (
            sorted.map((a) => (
              <Card key={a.id} hover padded>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-brand-gold/15 px-2 py-0.5 text-[11px] font-semibold text-brand-gold">
                        <Pin size={11} /> Pinned
                      </span>
                    )}
                    {a.audience.map((code) => (
                      <CodePill key={code}>{code}</CodePill>
                    ))}
                  </div>
                  <span className="shrink-0 text-xs text-faint">{relativeTime(a.postedAt)}</span>
                </div>
                <h3 className="mt-2.5 font-display text-base font-semibold text-ink">{a.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{a.body}</p>
                <div className="mt-3 flex items-center gap-3 border-t border-line pt-3 text-xs text-faint">
                  <span>{a.author}</span>
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {a.reach} reached
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
