import type {
  ActivityEvent,
  Announcement,
  ClassLearningAlert,
  CognitiveTakeaway,
  CohortStudent,
  DoubtItem,
  FacultyProfile,
  FacultySetupInput,
  ModuleProgress,
  NotificationPrefs,
  OfficeHour,
  PedagogyRecommendation,
  QuizSummary,
  TeacherAssignment,
  TopicAccuracy,
  WeakTopicDiagnostic,
} from '../types'
import { generateTeacherCode, initialsFrom } from './uid'

/* ------------------------- relative time helpers ------------------------ */
const now = Date.now()
export const minsAgo = (m: number) => new Date(now - m * 60_000).toISOString()
export const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString()
export const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString()

/* ------------------------------ defaults -------------------------------- */
export const DEFAULT_OFFICE_HOURS: OfficeHour[] = [
  { id: 'oh1', day: 'Tue', start: '14:00', end: '16:00', mode: 'In-person', location: 'Block C · Room 204' },
  { id: 'oh2', day: 'Thu', start: '11:00', end: '12:30', mode: 'Online', location: 'Meet · /kishverm' },
]

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  whatsappNewDoubt: true,
  whatsappDailyDigest: false,
  emailWeeklyReport: true,
  quietHours: true,
}

/** Prefill used by setup preview. */
export const DEMO_SETUP: FacultySetupInput = {
  title: 'Prof.',
  firstName: 'Kishan',
  surname: 'Verma',
  phone: '+91 98765 43210',
  university: 'Indira Institute of Technology',
  department: 'Computer Science & Engineering',
  subjects: ['Data Structures', 'DBMS', 'Machine Learning'],
}

/** Build a full faculty profile from setup input. */
export function makeFacultyProfile(input: FacultySetupInput): FacultyProfile {
  return {
    id: 'faculty-1',
    title: input.title ?? 'Prof.',
    firstName: input.firstName.trim(),
    surname: input.surname.trim(),
    phone: input.phone.trim(),
    email: `${input.firstName}.${input.surname}@iit.edu`.toLowerCase().replace(/\s+/g, ''),
    university: input.university.trim(),
    department: input.department.trim(),
    subjects: input.subjects,
    teacherCode: generateTeacherCode(input.firstName, input.surname),
    avatarInitials: initialsFrom(input.firstName, input.surname),
    officeHours: DEFAULT_OFFICE_HOURS,
    notifications: DEFAULT_NOTIFICATIONS,
    bio: 'Teaching CS fundamentals with a focus on intuition-first problem solving.',
  }
}

/** A ready-made demo profile. */
export const DEMO_PROFILE: FacultyProfile = makeFacultyProfile(DEMO_SETUP)

/* ------------------------------- courses (2 demo courses) -------------------------------- */
export const COURSES: TeacherAssignment[] = [
  {
    id: 'c-cs301',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    subject: 'Data Structures',
    semester: 'Fall 2026',
    students: 82,
    completionRate: 68,
    accent: 'gold',
    syllabus: [
      { id: 's1', title: 'Arrays, Strings & Complexity', done: true },
      { id: 's2', title: 'Linked Lists & Stacks', done: true },
      { id: 's3', title: 'Trees & Binary Search Trees', done: true },
      { id: 's4', title: 'Heaps & Priority Queues', done: false },
      { id: 's5', title: 'Graphs & Traversals', done: false },
    ],
  },
  {
    id: 'c-cs210',
    courseCode: 'CS210',
    courseName: 'Database Management Systems',
    subject: 'DBMS',
    semester: 'Fall 2026',
    students: 74,
    completionRate: 81,
    accent: 'cyan',
    syllabus: [
      { id: 's1', title: 'Relational Model & Algebra', done: true },
      { id: 's2', title: 'SQL & Joins', done: true },
      { id: 's3', title: 'Normalization (1NF–BCNF)', done: true },
      { id: 's4', title: 'Indexing & B+ Trees', done: true },
      { id: 's5', title: 'Transactions & Concurrency', done: false },
    ],
  },
]

/* ------------------------------- modules (3 demo modules) -------------------------------- */
export const MODULES: ModuleProgress[] = [
  { id: 'm1', courseCode: 'CS301', unit: 'Unit 3', title: 'Trees & BST', completion: 92, lecturesConducted: 6, lecturesTotal: 6, weakTopics: ['AVL rotations', 'Tree height proofs'] },
  { id: 'm2', courseCode: 'CS301', unit: 'Unit 4', title: 'Heaps & Priority Queues', completion: 40, lecturesConducted: 2, lecturesTotal: 5, weakTopics: ['Heapify complexity'] },
  { id: 'm3', courseCode: 'CS210', unit: 'Unit 4', title: 'Indexing & B+ Trees', completion: 88, lecturesConducted: 5, lecturesTotal: 6, weakTopics: ['Fan-out calculations'] },
]

/* -------------------------------- doubts (3 demo doubts) -------------------------------- */
export const DOUBTS: DoubtItem[] = [
  {
    id: 'd1',
    studentName: 'Ananya Rao',
    studentId: 'CS22B031',
    studentPhone: '+91 90000 11111',
    courseCode: 'CS301',
    subject: 'Data Structures',
    topic: 'AVL Trees',
    question:
      'When we do a left-right rotation, why do we rotate the left child first? I keep getting the final tree wrong on paper.',
    highlightedText:
      'A left-right (LR) imbalance is fixed with a left rotation on the left child, followed by a right rotation on the node.',
    attachment: { name: 'avl-attempt.png', sizeMb: 2.4, kind: 'image' },
    status: 'pending',
    priority: 'high',
    createdAt: minsAgo(24),
  },
  {
    id: 'd2',
    studentName: 'Priya Nair',
    studentId: 'CS22B045',
    studentPhone: '+91 90000 33333',
    courseCode: 'CS210',
    subject: 'DBMS',
    topic: 'Normalization',
    question:
      'Is a table in BCNF always in 3NF? Our notes say yes but the practice question marked it false.',
    highlightedText: 'Every relation in BCNF is necessarily in 3NF, but the converse does not hold.',
    attachment: { name: 'question-14.pdf', sizeMb: 0.8, kind: 'pdf' },
    status: 'answered',
    priority: 'medium',
    createdAt: hoursAgo(3),
    response:
      'Yes — BCNF is strictly stronger than 3NF, so BCNF ⟹ 3NF. The practice key had a typo; I flagged it.',
    respondedAt: hoursAgo(2),
  },
  {
    id: 'd3',
    studentName: 'Sneha Kulkarni',
    studentId: 'CS22B052',
    studentPhone: '+91 90000 55555',
    courseCode: 'CS301',
    subject: 'Data Structures',
    topic: 'Heaps',
    question: 'Why is build-heap O(n) and not O(n log n)? The sum confuses me.',
    status: 'resolved',
    priority: 'low',
    createdAt: daysAgo(1),
    response: 'The tighter bound comes from summing h/2^h — most nodes are shallow. Shared the derivation in notes.',
    respondedAt: hoursAgo(20),
  },
]

/* -------------------- doubt intelligence (2 demo alerts) --------------------- */
export const CLASS_ALERTS: ClassLearningAlert[] = [
  {
    id: 'a1',
    topic: 'AVL rotation order (LR / RL)',
    courseCode: 'CS301',
    similarDoubts: 9,
    affectedStudents: ['Ananya Rao', 'Rohit Menon', '+7 more'],
    severity: 'critical',
    suggestion: 'Re-teach rotations with a live step-through; 9 students hit the same LR confusion in 24h.',
  },
  {
    id: 'a2',
    topic: 'Isolation levels vs anomalies',
    courseCode: 'CS210',
    similarDoubts: 5,
    affectedStudents: ['Aditya Iyer', 'Priya Nair', '+3 more'],
    severity: 'warning',
    suggestion: 'Post the anomaly-matrix cheat sheet and add one exam-style example.',
  },
]

/* ----------------------------- quiz summary (2 demo quizzes) ----------------------------- */
export const QUIZZES: QuizSummary[] = [
  { id: 'q1', title: 'DSA · Trees Checkpoint', courseCode: 'CS301', averageScore: 71, completion: 88, attempts: 72, totalStudents: 82, postedAt: daysAgo(3) },
  { id: 'q2', title: 'DBMS · Normalization Quiz', courseCode: 'CS210', averageScore: 83, completion: 95, attempts: 70, totalStudents: 74, postedAt: daysAgo(5) },
]

export const TOPIC_ACCURACY: TopicAccuracy[] = [
  { topic: 'BST operations', courseCode: 'CS301', accuracy: 84, attempts: 72 },
  { topic: 'AVL rotations', courseCode: 'CS301', accuracy: 51, attempts: 72 },
  { topic: 'Normalization', courseCode: 'CS210', accuracy: 88, attempts: 70 },
]

/* ------------------------- cohort learning matrix (3 demo students) ----------------------- */
export const COHORT: CohortStudent[] = [
  { id: 'st1', name: 'Ananya Rao', courseCode: 'CS301', overall: 88, trend: 'up', scores: { Arrays: 92, 'Linked Lists': 85, Trees: 90, Heaps: 78 } },
  { id: 'st2', name: 'Rohit Menon', courseCode: 'CS301', overall: 64, trend: 'down', scores: { Arrays: 80, 'Linked Lists': 70, Trees: 55, Heaps: 48 } },
  { id: 'st3', name: 'Sneha Kulkarni', courseCode: 'CS301', overall: 91, trend: 'up', scores: { Arrays: 95, 'Linked Lists': 92, Trees: 88, Heaps: 90 } },
]

export const WEAK_TOPICS: WeakTopicDiagnostic[] = [
  { topic: 'AVL rotations', courseCode: 'CS301', mastery: 51, strugglingStudents: 34, relatedDoubts: 9, recommendation: 'Live step-through + 5 targeted practice trees.' },
  { topic: 'Heapify cost', courseCode: 'CS301', mastery: 63, strugglingStudents: 21, relatedDoubts: 3, recommendation: 'Show the h/2^h summation visually.' },
]

/* --------------------------- lecture insights (2 demo recommendations) --------------------------- */
export const PEDAGOGY: PedagogyRecommendation[] = [
  { id: 'p1', courseCode: 'CS301', title: 'Slow down on AVL rotations', detail: 'Doubt volume spiked 3× after the last lecture. Insert a 10-minute live worked example before moving to deletion.', category: 'pacing', impact: 'high' },
  { id: 'p2', courseCode: 'CS210', title: 'Formative check on isolation levels', detail: 'Add a 3-question exit ticket; the anomaly matrix is the most-missed concept this unit.', category: 'assessment', impact: 'high' },
]

export const TAKEAWAYS: CognitiveTakeaway[] = [
  { id: 't1', label: 'Peak attention', value: 'First 18 min', hint: 'Front-load the hardest proof', accent: 'cyan' },
  { id: 't2', label: 'Recall drop-off', value: 'After 40 min', hint: 'Insert a retrieval break', accent: 'gold' },
  { id: 't3', label: 'Best-retained format', value: 'Worked examples', hint: '+22% vs slides-only', accent: 'emerald' },
]

/* ----------------------------- announcements (2 demo announcements) ---------------------------- */
export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'an1', title: 'DSA mid-term moved to Sep 12', body: 'The Data Structures mid-term is now on Friday, Sep 12, 10:00 AM, Hall B. Syllabus up to Unit 4 (Heaps).', audience: ['CS301'], postedAt: daysAgo(1), author: 'Prof. Kishan Verma', pinned: true, reach: 82 },
  { id: 'an2', title: 'DBMS assignment 3 posted', body: 'Normalization + indexing set is live on the portal. Due next Monday, submit as a single PDF.', audience: ['CS210'], postedAt: daysAgo(4), author: 'Prof. Kishan Verma', pinned: false, reach: 74 },
]

/* ------------------------------- activity (3 demo activity events) ------------------------------- */
export const ACTIVITY: ActivityEvent[] = [
  { id: 'e1', kind: 'doubt-answered', title: 'Answered a doubt', detail: 'Replied to Priya Nair on “BCNF vs 3NF”.', at: hoursAgo(2), courseCode: 'CS210' },
  { id: 'e2', kind: 'system-alert', title: 'Learning alert raised', detail: 'Doubt Intelligence grouped 9 similar AVL-rotation questions.', at: hoursAgo(3), courseCode: 'CS301' },
  { id: 'e3', kind: 'announcement', title: 'Announcement broadcast', detail: 'Mid-term reschedule sent to CS301 (82 reached).', at: daysAgo(1), courseCode: 'CS301' },
]
