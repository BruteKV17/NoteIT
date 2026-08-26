import { ClipboardCheck, Percent, Target, Users } from 'lucide-react'
import { COURSES, QUIZZES, TOPIC_ACCURACY } from '../lib/mockData'
import { shortDate } from '../lib/format'
import { cn } from '../lib/cn'
import type { Accent } from '../components/ui/accents'
import { accentText } from '../components/ui/accents'
import { CodePill } from '../components/ui/Badge'
import { Card, SectionHeading } from '../components/ui/Card'
import { BarChart, DonutRing, type ChartDatum } from '../components/ui/Charts'
import { KpiCard } from '../components/ui/KpiCard'
import { ProgressBar } from '../components/ui/ProgressBar'

const accentFor = (courseCode: string): Accent =>
  COURSES.find((c) => c.courseCode === courseCode)?.accent ?? 'cyan'

const scoreAccent = (v: number): Accent => (v < 60 ? 'rose' : v < 75 ? 'gold' : 'emerald')

export function QuizPerformance() {
  const avgScore = Math.round(QUIZZES.reduce((s, q) => s + q.averageScore, 0) / QUIZZES.length)
  const avgCompletion = Math.round(QUIZZES.reduce((s, q) => s + q.completion, 0) / QUIZZES.length)
  const totalAttempts = QUIZZES.reduce((s, q) => s + q.attempts, 0)

  const accuracyData: ChartDatum[] = TOPIC_ACCURACY.map((t) => ({
    label: t.topic,
    value: t.accuracy,
    accent: scoreAccent(t.accuracy),
  }))

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Assessments"
        title="Quiz performance"
        subtitle="Class averages, completion, and per-topic accuracy across your quizzes."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Avg class score" value={`${avgScore}%`} icon={<ClipboardCheck size={18} />} accent="cyan" delta="+4 pts" deltaDir="up" />
        <KpiCard label="Avg completion" value={`${avgCompletion}%`} icon={<Percent size={18} />} accent="emerald" delta="+6%" deltaDir="up" />
        <KpiCard label="Total attempts" value={totalAttempts} icon={<Users size={18} />} accent="gold" />
        <KpiCard label="Quizzes posted" value={QUIZZES.length} icon={<Target size={18} />} accent="violet" hint="This semester" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Quiz cards */}
        <div className="space-y-4 lg:col-span-3">
          {QUIZZES.map((q, i) => {
            const accent = accentFor(q.courseCode)
            return (
              <Card key={q.id} hover className="animate-fade-up" padded>
                <div style={{ animationDelay: `${i * 60}ms` }} className="flex items-center gap-5">
                  <DonutRing value={q.averageScore} accent={scoreAccent(q.averageScore)} size={104} sublabel="avg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CodePill className={cn(accentText[accent])}>{q.courseCode}</CodePill>
                      <span className="text-xs text-faint">Posted {shortDate(q.postedAt)}</span>
                    </div>
                    <h3 className="mt-1.5 truncate font-display text-base font-semibold text-ink">{q.title}</h3>
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted">Completion</span>
                          <span className="metric text-ink">
                            {q.completion}% · {q.attempts}/{q.totalStudents}
                          </span>
                        </div>
                        <ProgressBar value={q.completion} accent={accent} height="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Topic accuracy */}
        <Card className="lg:col-span-2" padded={false}>
          <div className="border-b border-line p-5">
            <SectionHeading
              eyebrow="Diagnostic"
              title="Topic accuracy"
              icon={<Target size={18} className="text-brand-cyan" />}
              subtitle="Red topics need re-teaching."
            />
          </div>
          <div className="p-5">
            <BarChart data={accuracyData} />
            <div className="mt-5 flex items-center justify-center gap-4 border-t border-line pt-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-rose" /> &lt; 60%</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-gold" /> 60–74%</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-emerald" /> ≥ 75%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
