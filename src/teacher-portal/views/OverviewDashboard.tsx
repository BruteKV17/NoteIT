import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  MessagesSquare,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { CLASS_ALERTS, QUIZZES } from '../lib/mockData'
import { relativeTime } from '../lib/format'
import type { ClassLearningAlert, ViewId } from '../types'
import { Badge, CodePill, StatusPill } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, SectionHeading } from '../components/ui/Card'
import { KpiCard } from '../components/ui/KpiCard'
import type { Accent } from '../components/ui/accents'
import { accentBgSoft, accentBorder, accentText } from '../components/ui/accents'

const severityAccent: Record<ClassLearningAlert['severity'], Accent> = {
  critical: 'rose',
  warning: 'gold',
  info: 'cyan',
}

export function OverviewDashboard({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  const { doubts, courses } = useData()

  const totalStudents = courses.reduce((sum, c) => sum + c.students, 0)
  const pending = doubts.filter((d) => d.status === 'pending')
  const avgQuiz = Math.round(QUIZZES.reduce((s, q) => s + q.averageScore, 0) / QUIZZES.length)

  const recentDoubts = [...doubts]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5)

  const topAlert = CLASS_ALERTS[0]

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Dashboard"
        title="Good to see you, back to teaching"
        subtitle="Here's what your classes need attention on today."
        action={
          <Button variant="secondary" size="sm" iconRight={<ArrowRight size={15} />} onClick={() => onNavigate('doubts')}>
            Open doubts
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Students taught"
          value={totalStudents}
          icon={<Users size={18} />}
          accent="cyan"
          delta="+12 this term"
          deltaDir="up"
          style={{ animationDelay: '0ms' }}
        />
        <KpiCard
          label="Active courses"
          value={courses.length}
          icon={<BookOpen size={18} />}
          accent="gold"
          hint="Fall 2026 semester"
          delta="On track"
          deltaDir="flat"
          style={{ animationDelay: '60ms' }}
        />
        <KpiCard
          label="Pending doubts"
          value={pending.length}
          icon={<MessagesSquare size={18} />}
          accent="rose"
          delta="Needs reply"
          deltaDir="down"
          style={{ animationDelay: '120ms' }}
        />
        <KpiCard
          label="Avg quiz score"
          value={`${avgQuiz}%`}
          icon={<GraduationCap size={18} />}
          accent="emerald"
          delta="+4 pts"
          deltaDir="up"
          style={{ animationDelay: '180ms' }}
        />
      </div>

      {/* Doubt Intelligence banner */}
      {topAlert && (
        <DoubtIntelligenceBanner alert={topAlert} onNavigate={onNavigate} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent doubts feed */}
        <Card className="lg:col-span-3" padded={false}>
          <div className="flex items-center justify-between border-b border-line p-5">
            <SectionHeading
              eyebrow="Live feed"
              title="Recent doubts"
              icon={<MessagesSquare size={18} className="text-brand-cyan" />}
            />
            <button
              type="button"
              onClick={() => onNavigate('doubts')}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan transition-opacity hover:opacity-80"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <ul className="divide-y divide-line">
            {recentDoubts.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onNavigate('doubts')}
                  className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-panel/60"
                >
                  <span className="mt-0.5">
                    <CodePill>{d.courseCode}</CodePill>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{d.studentName}</span>
                      <span className="text-xs text-faint">· {d.topic}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-sm text-muted">{d.question}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusPill status={d.status} />
                    <span className="text-[11px] text-faint">{relativeTime(d.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Course snapshot */}
        <Card className="lg:col-span-2" padded={false}>
          <div className="border-b border-line p-5">
            <SectionHeading
              eyebrow="This semester"
              title="Course completion"
              icon={<TrendingUp size={18} className="text-brand-gold" />}
            />
          </div>
          <ul className="space-y-4 p-5">
            {courses.map((c) => (
              <li key={c.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <CodePill>{c.courseCode}</CodePill>
                    <span className="truncate text-sm text-muted">{c.courseName}</span>
                  </span>
                  <span className="metric shrink-0 text-sm text-ink">{c.completionRate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-panel">
                  <div
                    className={`h-full rounded-full ${accentText[c.accent]}`}
                    style={{ width: `${c.completionRate}%`, backgroundColor: 'currentColor' }}
                  />
                </div>
              </li>
            ))}
            <li>
              <Button
                variant="ghost"
                size="sm"
                block
                iconRight={<ArrowRight size={15} />}
                onClick={() => onNavigate('progress')}
              >
                See detailed progress
              </Button>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

function DoubtIntelligenceBanner({
  alert,
  onNavigate,
}: {
  alert: ClassLearningAlert
  onNavigate: (id: ViewId) => void
}) {
  const accent = severityAccent[alert.severity]
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${accentBorder[accent]} ${accentBgSoft[accent]} p-5`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-current opacity-[0.06] blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accentBgSoft[accent]} ${accentText[accent]}`}>
            <Sparkles size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge accent={accent} glow>
                <Zap size={12} /> Doubt intelligence
              </Badge>
              <CodePill>{alert.courseCode}</CodePill>
              <span className={`metric text-xs font-semibold ${accentText[accent]}`}>
                {alert.similarDoubts} similar doubts · 24h
              </span>
            </div>
            <h3 className="mt-2 font-display text-base font-semibold text-ink">{alert.topic}</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted">{alert.suggestion}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {alert.affectedStudents.map((s) => (
                <span key={s} className="rounded-md border border-line bg-canvas/40 px-2 py-0.5 text-[11px] text-faint">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          iconRight={<ArrowRight size={15} />}
          onClick={() => onNavigate('insights')}
        >
          View recommendation
        </Button>
      </div>
    </div>
  )
}
