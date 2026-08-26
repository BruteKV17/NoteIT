import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarCheck, CalendarClock, GaugeCircle, PlayCircle } from 'lucide-react'
import { COURSES, MODULES } from '../lib/mockData'
import { cn } from '../lib/cn'
import type { Accent } from '../components/ui/accents'
import { accentText } from '../components/ui/accents'
import { CodePill } from '../components/ui/Badge'
import { Card, SectionHeading } from '../components/ui/Card'
import { KpiCard } from '../components/ui/KpiCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Segmented, type SegmentOption } from '../components/ui/Segmented'

const accentFor = (courseCode: string): Accent =>
  COURSES.find((c) => c.courseCode === courseCode)?.accent ?? 'cyan'

type Filter = string // 'all' | courseCode

export function CourseProgress() {
  const [filter, setFilter] = useState<Filter>('all')

  const courseCodes = useMemo(() => Array.from(new Set(MODULES.map((m) => m.courseCode))), [])
  const filtered = filter === 'all' ? MODULES : MODULES.filter((m) => m.courseCode === filter)

  const conducted = filtered.reduce((s, m) => s + m.lecturesConducted, 0)
  const totalLectures = filtered.reduce((s, m) => s + m.lecturesTotal, 0)
  const remaining = totalLectures - conducted
  const avgCompletion = filtered.length
    ? Math.round(filtered.reduce((s, m) => s + m.completion, 0) / filtered.length)
    : 0

  const options: SegmentOption<Filter>[] = [
    { value: 'all', label: 'All courses' },
    ...courseCodes.map((c) => ({ value: c, label: c })),
  ]

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Delivery"
        title="Course progress"
        subtitle="Module completion, lectures delivered, and where students are struggling."
        action={<Segmented options={options} value={filter} onChange={setFilter} ariaLabel="Filter by course" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Lectures conducted" value={conducted} icon={<CalendarCheck size={18} />} accent="emerald" hint={`of ${totalLectures} planned`} delta={`${remaining} remaining`} deltaDir="flat" />
        <KpiCard label="Lectures remaining" value={remaining} icon={<CalendarClock size={18} />} accent="gold" hint="Across active units" />
        <KpiCard label="Avg module completion" value={`${avgCompletion}%`} icon={<GaugeCircle size={18} />} accent="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filtered.map((m, i) => {
          const accent = accentFor(m.courseCode)
          const remainingLectures = m.lecturesTotal - m.lecturesConducted
          return (
            <Card key={m.id} hover className="animate-fade-up" padded>
              <div style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CodePill className={cn(accentText[accent])}>{m.courseCode}</CodePill>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{m.unit}</span>
                    </div>
                    <h3 className="mt-1.5 font-display text-base font-semibold text-ink">{m.title}</h3>
                  </div>
                  <span className={cn('metric text-2xl font-semibold', accentText[accent])}>{m.completion}%</span>
                </div>

                <div className="mt-3">
                  <ProgressBar value={m.completion} accent={accent} />
                </div>

                {/* Lecture pips */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: m.lecturesTotal }).map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          idx < m.lecturesConducted ? accentText[accent] : 'text-line',
                        )}
                        style={{ backgroundColor: 'currentColor' }}
                      />
                    ))}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <PlayCircle size={14} className={accentText[accent]} />
                    <span className="metric text-ink">{m.lecturesConducted}</span> of {m.lecturesTotal} · {remainingLectures} left
                  </span>
                </div>

                {/* Weak topics */}
                {m.weakTopics.length > 0 && (
                  <div className="mt-4 rounded-xl border border-brand-rose/20 bg-brand-rose/[0.06] p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-rose">
                      <AlertTriangle size={13} />
                      Weak topics flagged
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.weakTopics.map((t) => (
                        <span key={t} className="rounded-md border border-brand-rose/20 bg-canvas/40 px-2 py-0.5 text-[11px] text-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
