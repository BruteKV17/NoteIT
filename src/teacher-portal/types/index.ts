/**
 * Note It AI — Faculty Portal
 * Central domain model. Every view imports its shapes from here.
 */

/* ----------------------------- Navigation ----------------------------- */

export type ViewId =
  | 'overview'
  | 'courses'
  | 'progress'
  | 'doubts'
  | 'quizzes'
  | 'analytics'
  | 'insights'
  | 'announcements'
  | 'activity'
  | 'settings'

export type ThemeMode = 'dark' | 'light'

/* ------------------------------ Faculty ------------------------------- */

export interface OfficeHour {
  id: string
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'
  start: string // "14:00"
  end: string // "16:00"
  mode: 'In-person' | 'Online'
  location?: string
}

export interface NotificationPrefs {
  whatsappNewDoubt: boolean
  whatsappDailyDigest: boolean
  emailWeeklyReport: boolean
  quietHours: boolean
}

export interface FacultyProfile {
  id: string
  title: 'Prof.' | 'Dr.' | 'Mr.' | 'Ms.' | 'Mx.'
  firstName: string
  surname: string
  /** WhatsApp / phone in international format, e.g. "+91 98765 43210" */
  phone: string
  email: string
  university: string
  department: string
  /** Assigned subjects — editable chips in Settings */
  subjects: string[]
  /** Auto-generated 8-char code, e.g. "KISHVERM" */
  teacherCode: string
  avatarUrl?: string
  avatarInitials: string
  officeHours: OfficeHour[]
  notifications: NotificationPrefs
  bio?: string
}

/** Data captured by the post-auth setup modal (no API key required). */
export interface FacultySetupInput {
  firstName: string
  surname: string
  phone: string
  university: string
  department: string
  subjects: string[]
  title?: FacultyProfile['title']
}

/* ------------------------------ Courses ------------------------------- */

export interface SyllabusItem {
  id: string
  title: string
  done: boolean
}

export interface TeacherAssignment {
  id: string
  /** Course code badge, e.g. "CS301" */
  courseCode: string
  courseName: string
  subject: string
  semester: string
  students: number
  /** 0–100 */
  completionRate: number
  accent: 'gold' | 'cyan' | 'emerald' | 'violet' | 'rose'
  syllabus: SyllabusItem[]
}

export interface ModuleProgress {
  id: string
  courseCode: string
  unit: string
  title: string
  /** 0–100 */
  completion: number
  lecturesConducted: number
  lecturesTotal: number
  /** Topics students are struggling with in this unit */
  weakTopics: string[]
}

/* ------------------------------- Doubts ------------------------------- */

export type DoubtStatus = 'pending' | 'answered' | 'resolved' | 'escalated'
export type DoubtPriority = 'low' | 'medium' | 'high'

export interface DoubtAttachment {
  name: string
  sizeMb: number // must be <= 10
  kind: 'image' | 'pdf' | 'doc' | 'code'
}

export interface DoubtItem {
  id: string
  studentName: string
  studentId: string
  /** Student WhatsApp for the wa.me deep link */
  studentPhone: string
  courseCode: string
  subject: string
  topic: string
  question: string
  /** The exact snippet the student highlighted from the notes */
  highlightedText?: string
  attachment?: DoubtAttachment
  status: DoubtStatus
  priority: DoubtPriority
  /** ISO timestamp */
  createdAt: string
  response?: string
  respondedAt?: string
}

/** Doubt Intelligence — similar queries grouped into a class-wide alert. */
export interface ClassLearningAlert {
  id: string
  topic: string
  courseCode: string
  /** How many students asked a semantically similar question */
  similarDoubts: number
  affectedStudents: string[]
  severity: 'info' | 'warning' | 'critical'
  suggestion: string
}

/* --------------------------- Quiz analytics --------------------------- */

export interface TopicAccuracy {
  topic: string
  courseCode: string
  /** 0–100 */
  accuracy: number
  attempts: number
}

export interface QuizSummary {
  id: string
  title: string
  courseCode: string
  /** 0–100 */
  averageScore: number
  /** 0–100 */
  completion: number
  attempts: number
  totalStudents: number
  postedAt: string
}

/* ------------------------- Learning analytics ------------------------- */

export interface CohortStudent {
  id: string
  name: string
  courseCode: string
  /** Per-topic scores keyed by topic name (0–100) */
  scores: Record<string, number>
  /** 0–100 */
  overall: number
  trend: 'up' | 'down' | 'flat'
}

export interface WeakTopicDiagnostic {
  topic: string
  courseCode: string
  /** 0–100 average mastery */
  mastery: number
  strugglingStudents: number
  relatedDoubts: number
  recommendation: string
}

/* --------------------------- Lecture insights ------------------------- */

export interface PedagogyRecommendation {
  id: string
  courseCode: string
  title: string
  detail: string
  category: 'pacing' | 'engagement' | 'assessment' | 'content'
  impact: 'high' | 'medium' | 'low'
}

export interface CognitiveTakeaway {
  id: string
  label: string
  value: string
  hint: string
  accent: 'gold' | 'cyan' | 'emerald'
}

/* ---------------------------- Announcements --------------------------- */

export interface Announcement {
  id: string
  title: string
  body: string
  audience: string[] // course codes
  postedAt: string
  author: string
  pinned: boolean
  reach: number // students reached
}

/* ---------------------------- Activity feed --------------------------- */

export type ActivityKind =
  | 'doubt-answered'
  | 'syllabus-edit'
  | 'announcement'
  | 'quiz-posted'
  | 'system-alert'
  | 'enrollment'

export interface ActivityEvent {
  id: string
  kind: ActivityKind
  title: string
  detail: string
  /** ISO timestamp */
  at: string
  courseCode?: string
}

/* ------------------------------- Toasts ------------------------------- */

export type ToastVariant = 'success' | 'info' | 'warning' | 'error'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
}
