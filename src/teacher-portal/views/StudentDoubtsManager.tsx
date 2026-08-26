import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  FileCode2,
  FileText,
  Highlighter,
  ImageIcon,
  Inbox,
  MessageSquare,
  Paperclip,
  Send,
  ShieldAlert,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { buildWaLink } from '../lib/uid'
import { relativeTime } from '../lib/format'
import { cn } from '../lib/cn'
import type { DoubtAttachment, DoubtItem, DoubtPriority, DoubtStatus } from '../types'
import { Badge, CodePill, StatusPill } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, SectionHeading } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SearchInput } from '../components/ui/SearchInput'
import { Segmented, type SegmentOption } from '../components/ui/Segmented'
import type { Accent } from '../components/ui/accents'
import { ExplanationWhiteboardModal } from '../components/ui/ExplanationWhiteboardModal'

const WhatsAppGlyph = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.17 0 4.2.85 5.74 2.38a8.06 8.06 0 0 1 2.38 5.73c0 4.47-3.64 8.11-8.12 8.11-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.07 8.07 0 0 1-1.24-4.3c0-4.47 3.64-8.11 8.11-8.11ZM8.53 7.3c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.43-.58 1.63-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41-.14-.01-.3-.01-.46-.01Z" />
  </svg>
)

const priorityAccent: Record<DoubtPriority, Accent> = { high: 'rose', medium: 'gold', low: 'emerald' }

const attachmentIcon = (kind: DoubtAttachment['kind']) => {
  switch (kind) {
    case 'image':
      return ImageIcon
    case 'code':
      return FileCode2
    default:
      return FileText
  }
}

export function StudentDoubtsManager() {
  const { doubts } = useData()
  const [status, setStatus] = useState<'all' | DoubtStatus>('all')
  const [subject, setSubject] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(doubts[0]?.id ?? null)

  const subjects = useMemo(() => Array.from(new Set(doubts.map((d) => d.subject))), [doubts])

  // Filter by subject + text first
  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase()
    return doubts.filter((d) => {
      if (subject !== 'all' && d.subject !== subject) return false
      if (!q) return true
      return (
        d.studentName.toLowerCase().includes(q) ||
        d.topic.toLowerCase().includes(q) ||
        d.question.toLowerCase().includes(q) ||
        d.studentId.toLowerCase().includes(q)
      )
    })
  }, [doubts, subject, query])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: scoped.length, pending: 0, answered: 0, resolved: 0, escalated: 0 }
    for (const d of scoped) c[d.status] += 1
    return c
  }, [scoped])

  const list = status === 'all' ? scoped : scoped.filter((d) => d.status === status)

  useEffect(() => {
    if (list.length === 0) {
      setSelectedId(null)
    } else if (!list.some((d) => d.id === selectedId)) {
      setSelectedId(list[0].id)
    }
  }, [list, selectedId])

  const selected = doubts.find((d) => d.id === selectedId) ?? null

  const statusOptions: SegmentOption<'all' | DoubtStatus>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'answered', label: 'Answered', count: counts.answered },
    { value: 'resolved', label: 'Resolved', count: counts.resolved },
    { value: 'escalated', label: 'Escalated', count: counts.escalated },
  ]

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Doubts manager"
        title="Student doubts"
        subtitle="Triage questions routed to your Teacher Code, respond, and use Whiteboard Studio for visual explanations."
      />

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented options={statusOptions} value={status} onChange={(v) => setStatus(v as any)} ariaLabel="Filter by status" />
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="subject-filter">
              Filter by subject
            </label>
            <select
              id="subject-filter"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink transition-colors focus:border-brand-cyan/50 focus:outline-none"
            >
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Search students, topics, questions…" ariaLabel="Search doubts" />
      </div>

      {/* Master / detail */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* List */}
        <Card className="lg:col-span-2" padded={false}>
          {list.length === 0 ? (
            <EmptyState icon={<Inbox size={22} />} title="No doubts match" description="Try clearing filters or search terms." />
          ) : (
            <ul className="max-h-[640px] divide-y divide-line overflow-y-auto">
              {list.map((d) => {
                const active = d.id === selectedId
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(d.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex w-full flex-col gap-1.5 border-l-2 p-4 text-left transition-colors cursor-pointer',
                        active ? 'border-brand-cyan bg-panel/70' : 'border-transparent hover:bg-panel/40',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <CodePill>{d.courseCode}</CodePill>
                          <span className="text-xs text-faint">{relativeTime(d.createdAt)}</span>
                        </span>
                        <StatusPill status={d.status} />
                      </div>
                      <span className="truncate text-sm font-semibold text-ink">{d.studentName}</span>
                      <span className="line-clamp-2 text-sm text-muted">{d.question}</span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={cn('h-1.5 w-1.5 rounded-full', priorityAccent[d.priority] === 'rose' ? 'bg-brand-rose' : priorityAccent[d.priority] === 'gold' ? 'bg-brand-gold' : 'bg-brand-emerald')} />
                        <span className="text-[11px] uppercase tracking-wide text-faint">{d.priority} priority · {d.topic}</span>
                        {d.attachment && <Paperclip size={12} className="text-faint" />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <DoubtDetail key={selected.id} doubt={selected} />
          ) : (
            <Card>
              <EmptyState icon={<MessageSquare size={22} />} title="Select a doubt" description="Pick a question from the list to view details and respond." />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function DoubtDetail({ doubt }: { doubt: DoubtItem }) {
  const { answerDoubt, setDoubtStatus } = useData()
  const { push } = useToast()
  const [draft, setDraft] = useState(doubt.response ?? '')
  const [viewAttachment, setViewAttachment] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [attachedWhiteboard, setAttachedWhiteboard] = useState<{ imageDataUrl: string; resourceLinks: string[]; note: string } | null>(null)

  const firstName = doubt.studentName.split(' ')[0]
  const waMessage = `Hi ${firstName}, regarding your doubt on "${doubt.topic}" (${doubt.courseCode}):\n\n${draft || 'Let me walk you through it.'}\n\n— via Note IT AI`
  const waLink = buildWaLink(doubt.studentPhone, waMessage)

  const handleAttachWhiteboard = (data: { imageDataUrl: string; resourceLinks: string[]; note: string }) => {
    setAttachedWhiteboard(data)
    
    let appendedText = draft ? `${draft}\n\n` : ''
    if (data.note) {
      appendedText += `[WHITEBOARD EXPLANATION NOTE]: ${data.note}\n`
    }
    if (data.resourceLinks.length > 0) {
      appendedText += `[REFERENCE LINKS]:\n` + data.resourceLinks.map(l => `• ${l}`).join('\n') + `\n`
    }
    appendedText += `🎨 [WHITEBOARD DIAGRAM ATTACHED]`
    
    setDraft(appendedText)
    push({ variant: 'success', title: 'Whiteboard attached', description: 'Diagram and links attached to your response.' })
  }

  const sendResponse = () => {
    if (!draft.trim()) {
      push({ variant: 'warning', title: 'Write a response first', description: 'The reply box is empty.' })
      return
    }
    answerDoubt(doubt.id, draft.trim())
    push({ variant: 'success', title: 'Response sent', description: `${doubt.studentName} was notified.` })
  }

  const AttachIcon = doubt.attachment ? attachmentIcon(doubt.attachment.kind) : Paperclip

  return (
    <Card padded={false}>
      {/* Header */}
      <div className="border-b border-line p-5">
        <div className="flex flex-wrap items-center gap-2">
          <CodePill>{doubt.courseCode}</CodePill>
          <StatusPill status={doubt.status} />
          <Badge accent={priorityAccent[doubt.priority]}>{doubt.priority} priority</Badge>
          <span className="ml-auto text-xs text-faint">{relativeTime(doubt.createdAt)}</span>
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold text-ink">{doubt.topic}</h3>
        <p className="mt-0.5 text-sm text-muted">
          {doubt.studentName} · <span className="metric">{doubt.studentId}</span> · {doubt.subject}
        </p>
      </div>

      <div className="space-y-5 p-5">
        {/* Question */}
        <div>
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Question</div>
          <p className="text-sm leading-relaxed text-ink">{doubt.question}</p>
        </div>

        {/* Highlighted from notes */}
        {doubt.highlightedText && (
          <div className="rounded-xl border border-brand-gold/25 bg-brand-gold/[0.07] p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-gold">
              <Highlighter size={13} />
              Highlighted from notes
            </div>
            <p className="text-sm italic leading-relaxed text-ink/90">
              <mark className="bg-brand-gold/25 text-ink">{doubt.highlightedText}</mark>
            </p>
          </div>
        )}

        {/* Attachment */}
        {doubt.attachment && (
          <div className="rounded-xl border border-line bg-panel/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                  <AttachIcon size={18} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{doubt.attachment.name}</div>
                  <div className="metric text-xs text-faint">
                    {doubt.attachment.sizeMb.toFixed(1)} MB · {doubt.attachment.kind}
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setViewAttachment((v) => !v)}>
                {viewAttachment ? 'Hide' : 'View'}
              </Button>
            </div>
            {viewAttachment && (
              <div className="mt-3 flex h-44 items-center justify-center rounded-lg border border-dashed border-line bg-canvas/60">
                <div className="text-center">
                  <AttachIcon size={30} className="mx-auto text-faint" />
                  <p className="mt-2 text-xs text-muted">Preview of {doubt.attachment.name}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Whiteboard Snapshot Preview */}
        {attachedWhiteboard && (
          <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#22C55E] flex items-center gap-1.5">
                <Sparkles size={14} />
                Whiteboard Explanation Attached
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowWhiteboard(true)}>
                Edit Board
              </Button>
            </div>
            <img
              src={attachedWhiteboard.imageDataUrl}
              alt="Whiteboard Explanation"
              className="max-h-48 w-full rounded-lg border border-[#233326] object-contain bg-[#101712]"
            />
          </div>
        )}

        {/* Existing response */}
        {doubt.response && (
          <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/[0.06] p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-cyan">
              <CheckCircle2 size={13} />
              Your response {doubt.respondedAt && <span className="font-normal text-faint">· {relativeTime(doubt.respondedAt)}</span>}
            </div>
            <p className="text-sm leading-relaxed text-ink/90">{doubt.response}</p>
          </div>
        )}

        {/* Composer */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="composer" className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              {doubt.response ? 'Edit / follow-up' : 'Compose response'}
            </label>

            {/* WHITEBOARD STUDIO TRIGGER BUTTON */}
            <button
              type="button"
              onClick={() => setShowWhiteboard(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#22C55E]/40 bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Sparkles size={14} />
              <span>🎨 Open Whiteboard Studio</span>
            </button>
          </div>

          <textarea
            id="composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="Explain the concept, draw on whiteboard, link a resource, or clarify confusion…"
            className="w-full resize-y rounded-xl border border-line bg-panel px-3.5 py-3 text-sm text-ink placeholder:text-faint transition-colors focus:border-brand-cyan/50 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="accent" size="sm" iconLeft={<Send size={15} />} onClick={sendResponse}>
              Send response
            </Button>
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" iconLeft={<WhatsAppGlyph size={15} />} className="text-brand-emerald">
                Reply on WhatsApp
              </Button>
            </a>

            <div className="ml-auto flex items-center gap-2">
              {doubt.status !== 'resolved' && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<CheckCircle2 size={15} />}
                  onClick={() => {
                    setDoubtStatus(doubt.id, 'resolved')
                    push({ variant: 'success', title: 'Marked resolved' })
                  }}
                >
                  Resolve
                </Button>
              )}
              {doubt.status !== 'escalated' && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<ShieldAlert size={15} />}
                  className="text-brand-rose"
                  onClick={() => {
                    setDoubtStatus(doubt.id, 'escalated')
                    push({ variant: 'warning', title: 'Doubt escalated', description: 'Flagged for a detailed session.' })
                  }}
                >
                  Escalate
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WHITEBOARD STUDIO MODAL */}
      <ExplanationWhiteboardModal
        isOpen={showWhiteboard}
        onClose={() => setShowWhiteboard(false)}
        onAttach={handleAttachWhiteboard}
        studentName={doubt.studentName}
        topic={doubt.topic}
      />
    </Card>
  )
}
