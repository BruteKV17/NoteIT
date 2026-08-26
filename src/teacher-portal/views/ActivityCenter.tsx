import { useMemo, useState } from 'react'
import {
  Activity as ActivityIcon,
  ClipboardCheck,
  ClipboardList,
  Megaphone,
  MessageSquare,
  UserPlus,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { relativeTime } from '../lib/format'
import { cn } from '../lib/cn'
import type { ActivityKind } from '../types'
import { CodePill } from '../components/ui/Badge'
import { Card, SectionHeading } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Segmented, type SegmentOption } from '../components/ui/Segmented'
import type { Accent } from '../components/ui/accents'
import { accentBgSoft, accentText } from '../components/ui/accents'

const kindMeta: Record<ActivityKind, { icon: LucideIcon; accent: Accent; label: string }> = {
  'doubt-answered': { icon: MessageSquare, accent: 'cyan', label: 'Doubt' },
  'syllabus-edit': { icon: ClipboardList, accent: 'emerald', label: 'Syllabus' },
  announcement: { icon: Megaphone, accent: 'gold', label: 'Broadcast' },
  'quiz-posted': { icon: ClipboardCheck, accent: 'violet', label: 'Quiz' },
  'system-alert': { icon: Zap, accent: 'rose', label: 'Alert' },
  enrollment: { icon: UserPlus, accent: 'cyan', label: 'Enrollment' },
}

type Filter = 'all' | ActivityKind

export function ActivityCenter() {
  const { activity } = useData()
  const [filter, setFilter] = useState<Filter>('all')

  const kinds = useMemo(() => Array.from(new Set(activity.map((e) => e.kind))), [activity])
  const list = filter === 'all' ? activity : activity.filter((e) => e.kind === filter)

  const options: SegmentOption<Filter>[] = [
    { value: 'all', label: 'All', count: activity.length },
    ...kinds.map((k) => ({ value: k, label: kindMeta[k].label })),
  ]

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Live stream"
        title="Activity center"
        subtitle="A real-time log of answered doubts, syllabus edits, broadcasts, and alerts."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 px-2.5 py-1 text-[11px] font-semibold text-brand-emerald">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-emerald opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-emerald" />
            </span>
            Live
          </span>
        }
      />

      <Segmented options={options} value={filter} onChange={(v) => setFilter(v as Filter)} ariaLabel="Filter activity" />

      <Card padded={false}>
        {list.length === 0 ? (
          <EmptyState icon={<ActivityIcon size={22} />} title="Nothing here yet" description="Activity will stream in as you work." />
        ) : (
          <ol className="p-5">
            {list.map((e, i) => {
              const meta = kindMeta[e.kind]
              const Icon = meta.icon
              const last = i === list.length - 1
              return (
                <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Connector */}
                  {!last && <span className="absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px bg-line" aria-hidden="true" />}
                  <span className={cn('relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line', accentBgSoft[meta.accent], accentText[meta.accent])}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{e.title}</span>
                      {e.courseCode && <CodePill>{e.courseCode}</CodePill>}
                      <span className="ml-auto text-xs text-faint">{relativeTime(e.at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{e.detail}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </Card>
    </div>
  )
}
