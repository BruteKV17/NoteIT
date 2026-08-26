import {
  BookOpen,
  Check,
  Gauge,
  Hand,
  Lightbulb,
  Sparkles,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react'
import { PEDAGOGY, TAKEAWAYS } from '../lib/mockData'
import { useToast } from '../context/ToastContext'
import { cn } from '../lib/cn'
import type { PedagogyRecommendation } from '../types'
import { Badge, CodePill } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, SectionHeading } from '../components/ui/Card'
import type { Accent } from '../components/ui/accents'
import { accentBgSoft, accentText } from '../components/ui/accents'

const categoryIcon: Record<PedagogyRecommendation['category'], LucideIcon> = {
  pacing: Gauge,
  engagement: Hand,
  assessment: ClipboardCheck,
  content: BookOpen,
}

const impactAccent: Record<PedagogyRecommendation['impact'], Accent> = {
  high: 'gold',
  medium: 'cyan',
  low: 'violet',
}

export function LectureInsights() {
  const { push } = useToast()

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="AI pedagogy"
        title="Lecture insights"
        subtitle="Cognitive patterns and teaching recommendations generated from your class signals."
        action={
          <Badge accent="cyan" glow>
            <Sparkles size={12} /> AI generated
          </Badge>
        }
      />

      {/* Cognitive takeaways */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TAKEAWAYS.map((t, i) => (
          <div
            key={t.id}
            className={cn('glass-panel glass-panel-hover animate-fade-up p-5')}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl', accentBgSoft[t.accent], accentText[t.accent])}>
              <Lightbulb size={18} />
            </div>
            <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{t.label}</div>
            <div className={cn('mt-1 font-display text-xl font-semibold', accentText[t.accent])}>{t.value}</div>
            <div className="mt-1 text-sm text-muted">{t.hint}</div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <Card padded={false}>
        <div className="border-b border-line p-5">
          <SectionHeading
            eyebrow="Recommendations"
            title="What to adjust next"
            icon={<Sparkles size={18} className="text-brand-gold" />}
          />
        </div>
        <ul className="divide-y divide-line">
          {PEDAGOGY.map((rec) => {
            const Icon = categoryIcon[rec.category]
            const accent = impactAccent[rec.impact]
            return (
              <li key={rec.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accentBgSoft[accent], accentText[accent])}>
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CodePill>{rec.courseCode}</CodePill>
                    <Badge accent={accent}>{rec.impact} impact</Badge>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-faint">{rec.category}</span>
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold text-ink">{rec.title}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{rec.detail}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  iconLeft={<Check size={15} />}
                  onClick={() => push({ variant: 'success', title: 'Added to your plan', description: rec.title })}
                >
                  Apply
                </Button>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
