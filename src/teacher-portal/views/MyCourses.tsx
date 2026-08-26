import { useState, type ReactNode } from 'react'
import { BookOpen, Check, ChevronDown, ClipboardList, GraduationCap, Users } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { cn } from '../lib/cn'
import type { TeacherAssignment, ViewId } from '../types'
import { CodePill } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, SectionHeading } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { accentBgSoft, accentBorder, accentText } from '../components/ui/accents'

export function MyCourses({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  const { courses } = useData()

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Courses"
        title="My courses"
        subtitle={`${courses.length} active classes this semester · ${courses.reduce((s, c) => s + c.students, 0)} students`}
        action={
          <Button variant="secondary" size="sm" iconLeft={<ClipboardList size={15} />} onClick={() => onNavigate('progress')}>
            Progress board
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {courses.map((course, i) => (
          <CourseCard key={course.id} course={course} index={i} />
        ))}
      </div>
    </div>
  )
}

function CourseCard({ course, index }: { course: TeacherAssignment; index: number }) {
  const { toggleSyllabusItem } = useData()
  const { push } = useToast()
  const [open, setOpen] = useState(true)

  const done = course.syllabus.filter((s) => s.done).length
  const total = course.syllabus.length

  const toggle = (itemId: string, title: string, wasDone: boolean) => {
    toggleSyllabusItem(course.id, itemId)
    if (!wasDone) {
      push({ variant: 'success', title: 'Topic marked complete', description: `${title} · ${course.courseCode}` })
    }
  }

  return (
    <Card
      hover
      padded={false}
      className="animate-fade-up overflow-hidden"
    >
      <div style={{ animationDelay: `${index * 70}ms` }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5">
          <div className="flex items-start gap-3">
            <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl', accentBgSoft[course.accent], accentText[course.accent])}>
              <BookOpen size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CodePill className={cn(accentText[course.accent], accentBorder[course.accent])}>{course.courseCode}</CodePill>
                <span className="text-xs text-faint">{course.semester}</span>
              </div>
              <h3 className="mt-1 font-display text-base font-semibold text-ink">{course.courseName}</h3>
              <p className="text-sm text-muted">{course.subject}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 px-5">
          <Stat icon={<Users size={15} />} label="Students" value={String(course.students)} />
          <Stat icon={<GraduationCap size={15} />} label="Syllabus" value={`${done}/${total}`} />
        </div>

        {/* Completion */}
        <div className="px-5 pt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted">Course completion</span>
            <span className="metric text-ink">{course.completionRate}%</span>
          </div>
          <ProgressBar value={course.completionRate} accent={course.accent} />
        </div>

        {/* Syllabus checklist */}
        <div className="mt-4 border-t border-line">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-center justify-between px-5 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <ClipboardList size={16} className="text-faint" />
              Syllabus checklist
            </span>
            <ChevronDown size={16} className={cn('text-faint transition-transform', open && 'rotate-180')} />
          </button>
          {open && (
            <ul className="space-y-1 px-3 pb-4">
              {course.syllabus.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => toggle(s.id, s.title, s.done)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-panel"
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                        s.done ? cn(accentText[course.accent], accentBgSoft[course.accent], 'border-current') : 'border-line text-transparent',
                      )}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className={cn('text-sm transition-colors', s.done ? 'text-muted line-through' : 'text-ink')}>
                      {s.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-faint">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="metric mt-1 text-lg font-semibold text-ink">{value}</div>
    </div>
  )
}
