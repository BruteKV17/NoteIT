import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  Copy,
  GraduationCap,
  Phone,
  Plus,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { DEMO_SETUP } from '../../lib/mockData'
import { generateTeacherCode } from '../../lib/uid'
import { cn } from '../../lib/cn'
import { Modal } from '../ui/Modal'
import type { FacultyProfile } from '../../types'

const TITLES: FacultyProfile['title'][] = ['Prof.', 'Dr.', 'Mr.', 'Ms.', 'Mx.']
const SUGGESTED = [
  'Data Structures',
  'DBMS',
  'Machine Learning',
  'Operating Systems',
  'Computer Networks',
  'Discrete Mathematics',
  'Algorithms',
  'Web Development',
]

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/70">{label}</span>
      <span className="relative flex items-center">
        {icon && <span className="pointer-events-none absolute left-3.5 text-white/40">{icon}</span>}
        {children}
      </span>
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-white/15 bg-white/5 py-3 pr-4 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none'

export function SetupModal() {
  const { stage, completeSetup, cancelAuth } = useAuth()
  const { push } = useToast()
  const { copied, copy } = useCopyToClipboard()

  const [title, setTitle] = useState<FacultyProfile['title']>('Prof.')
  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [university, setUniversity] = useState('')
  const [department, setDepartment] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  const open = stage === 'setup'
  const code = useMemo(() => generateTeacherCode(firstName, surname), [firstName, surname])
  const slots = Array.from({ length: 8 }, (_, i) => code[i] ?? '')

  const valid =
    firstName.trim() && surname.trim() && phone.trim() && university.trim() && department.trim() && subjects.length > 0

  const addSubject = (value: string) => {
    const v = value.trim()
    if (!v) return
    setSubjects((list) => (list.some((s) => s.toLowerCase() === v.toLowerCase()) ? list : [...list, v]))
    setDraft('')
  }

  const removeSubject = (value: string) => setSubjects((list) => list.filter((s) => s !== value))

  const fillSample = () => {
    setTitle(DEMO_SETUP.title ?? 'Prof.')
    setFirstName(DEMO_SETUP.firstName)
    setSurname(DEMO_SETUP.surname)
    setPhone(DEMO_SETUP.phone)
    setUniversity(DEMO_SETUP.university)
    setDepartment(DEMO_SETUP.department)
    setSubjects(DEMO_SETUP.subjects)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    completeSetup({ title, firstName, surname, phone, university, department, subjects })
    push({ variant: 'success', title: 'Workspace ready', description: `Signed in as ${title} ${firstName} ${surname}` })
  }

  const copyCode = async () => {
    if (!code) return
    const ok = await copy(code)
    if (ok) push({ variant: 'success', title: 'Code copied', description: code })
  }

  return (
    <Modal open={open} onClose={cancelAuth} labelledBy="setup-title" describedBy="setup-desc" className="max-w-2xl">
      <div className="liquid-glass max-h-[88vh] overflow-y-auto rounded-[28px] p-7 text-white sm:p-8">
        <button
          type="button"
          onClick={cancelAuth}
          aria-label="Cancel setup"
          className="absolute right-5 top-5 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white/80">
          <Sparkles size={12} /> Streamlined setup · no API key
        </span>
        <h2 id="setup-title" className="mt-4 text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Set up your faculty profile
        </h2>
        <p id="setup-desc" className="mt-2 text-sm text-white/70">
          A few details and you are in. Your Teacher UID Code is generated live as you type.
        </p>

        {/* Live UID preview */}
        <div className="mt-6 rounded-2xl border border-white/15 bg-black/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-white/60">Your Teacher UID</span>
            <button
              type="button"
              onClick={copyCode}
              disabled={!code}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {slots.map((ch, i) => (
              <span
                key={i}
                className={cn(
                  'flex h-11 w-9 items-center justify-center rounded-lg border font-mono text-lg font-semibold transition-colors',
                  ch ? 'border-brand-gold/40 bg-brand-gold/10 text-brand-gold' : 'border-white/10 bg-white/5 text-white/25',
                )}
              >
                {ch || '·'}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-white/50">
            First 4 letters of your first name + first 4 of your surname. Students use this to route doubts to you.
          </p>
        </div>

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[110px_1fr_1fr]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/70">Title</span>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value as FacultyProfile['title'])}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-white focus:border-white/40 focus:outline-none [&>option]:text-black"
              >
                {TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <Field label="First name" icon={<User size={16} />}>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Kishan"
                className={cn(inputCls, 'pl-10')}
                autoFocus
              />
            </Field>
            <Field label="Surname" icon={<User size={16} />}>
              <input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Verma"
                className={cn(inputCls, 'pl-10')}
              />
            </Field>
          </div>

          <Field label="WhatsApp / phone number" icon={<Phone size={16} />}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              inputMode="tel"
              className={cn(inputCls, 'pl-10')}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="University" icon={<Building2 size={16} />}>
              <input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Indira Institute of Technology"
                className={cn(inputCls, 'pl-10')}
              />
            </Field>
            <Field label="Department" icon={<GraduationCap size={16} />}>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Science & Engineering"
                className={cn(inputCls, 'pl-10')}
              />
            </Field>
          </div>

          {/* Subjects */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-white/70">Assigned subjects</span>
            <div className="rounded-xl border border-white/15 bg-white/5 p-2.5">
              {subjects.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {subjects.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSubject(s)}
                        aria-label={`Remove ${s}`}
                        className="-mr-1 rounded-full p-0.5 text-white/60 hover:bg-brand-rose/30 hover:text-white"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="ml-1 text-white/40" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addSubject(draft)
                    }
                  }}
                  placeholder="Type a subject and press Enter"
                  className="flex-1 bg-transparent py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addSubject(draft)}
                  aria-label="Add subject"
                  className="rounded-lg border border-white/15 p-1.5 text-white/80 hover:bg-white/10"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED.filter((s) => !subjects.includes(s)).slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSubject(s)}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60 transition-colors hover:border-white/25 hover:text-white"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse items-center justify-between gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={fillSample}
              className="text-xs font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
            >
              Prefill sample data
            </button>
            <button
              type="submit"
              disabled={!valid}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.01] active:scale-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-7"
            >
              Enter portal
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
