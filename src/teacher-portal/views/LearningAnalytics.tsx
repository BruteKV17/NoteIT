import { ArrowDownRight, ArrowUpRight, Grid3x3, Minus, Stethoscope } from 'lucide-react'
import { COHORT, WEAK_TOPICS } from '../lib/mockData'
import { cn } from '../lib/cn'
import type { CohortStudent } from '../types'
import { CodePill } from '../components/ui/Badge'
import { Card, SectionHeading } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Avatar } from '../components/ui/Avatar'

const topics = Object.keys(COHORT[0]?.scores ?? {})

const cellClass = (v: number): string => {
  if (v >= 85) return 'bg-brand-emerald/20 text-brand-emerald'
  if (v >= 70) return 'bg-brand-cyan/15 text-brand-cyan'
  if (v >= 60) return 'bg-brand-gold/15 text-brand-gold'
  return 'bg-brand-rose/20 text-brand-rose'
}

function TrendGlyph({ trend }: { trend: CohortStudent['trend'] }) {
  if (trend === 'up') return <ArrowUpRight size={15} className="text-brand-emerald" />
  if (trend === 'down') return <ArrowDownRight size={15} className="text-brand-rose" />
  return <Minus size={15} className="text-muted" />
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

export function LearningAnalytics() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Cohort"
        title="Learning analytics"
        subtitle="Per-student mastery across topics and a diagnostic of where the class is weakest."
      />

      {/* Cohort score matrix */}
      <Card padded={false}>
        <div className="border-b border-line p-5">
          <SectionHeading
            eyebrow="CS301 · Data Structures"
            title="Cohort score matrix"
            icon={<Grid3x3 size={18} className="text-brand-cyan" />}
            subtitle="Topic mastery per student (0–100)."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 z-10 bg-card px-5 py-3 text-left font-medium text-muted">Student</th>
                {topics.map((t) => (
                  <th key={t} className="px-3 py-3 text-center font-mono text-[11px] uppercase tracking-wide text-faint">
                    {t}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-medium text-muted">Overall</th>
              </tr>
            </thead>
            <tbody>
              {COHORT.map((student) => (
                <tr key={student.id} className="border-b border-line last:border-0 transition-colors hover:bg-panel/40">
                  <td className="sticky left-0 z-10 bg-card px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={initials(student.name)} size="sm" accent="cyan" />
                      <span className="whitespace-nowrap text-sm font-medium text-ink">{student.name}</span>
                    </div>
                  </td>
                  {topics.map((t) => {
                    const v = student.scores[t] ?? 0
                    return (
                      <td key={t} className="px-3 py-3 text-center">
                        <span className={cn('metric inline-flex h-9 w-11 items-center justify-center rounded-lg text-xs font-semibold', cellClass(v))}>
                          {v}
                        </span>
                      </td>
                    )
                  })}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="metric text-sm font-semibold text-ink">{student.overall}</span>
                      <TrendGlyph trend={student.trend} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Weak topic diagnostic */}
      <Card padded={false}>
        <div className="border-b border-line p-5">
          <SectionHeading
            eyebrow="Diagnostic"
            title="Weak topic breakdown"
            icon={<Stethoscope size={18} className="text-brand-rose" />}
            subtitle="Ranked by lowest mastery — each ties back to related doubts."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-5 py-3 font-medium text-muted">Topic</th>
                <th className="px-4 py-3 font-medium text-muted">Mastery</th>
                <th className="px-4 py-3 text-center font-medium text-muted">Struggling</th>
                <th className="px-4 py-3 text-center font-medium text-muted">Doubts</th>
                <th className="px-5 py-3 font-medium text-muted">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {[...WEAK_TOPICS]
                .sort((a, b) => a.mastery - b.mastery)
                .map((w) => (
                  <tr key={w.topic} className="border-b border-line last:border-0 align-top transition-colors hover:bg-panel/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <CodePill>{w.courseCode}</CodePill>
                        <span className="font-medium text-ink">{w.topic}</span>
                      </div>
                    </td>
                    <td className="w-40 px-4 py-4">
                      <ProgressBar value={w.mastery} accent={w.mastery < 60 ? 'rose' : w.mastery < 75 ? 'gold' : 'emerald'} height="sm" showLabel />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="metric text-brand-rose">{w.strugglingStudents}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="metric text-ink">{w.relatedDoubts}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">{w.recommendation}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
