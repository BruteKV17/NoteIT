import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type {
  ActivityEvent,
  Announcement,
  DoubtItem,
  DoubtStatus,
  TeacherAssignment,
} from '../types'
import { ACTIVITY, ANNOUNCEMENTS, COURSES, DOUBTS } from '../lib/mockData'

interface DataContextValue {
  doubts: DoubtItem[]
  courses: TeacherAssignment[]
  announcements: Announcement[]
  activity: ActivityEvent[]
  answerDoubt: (id: string, response: string) => void
  setDoubtStatus: (id: string, status: DoubtStatus) => void
  toggleSyllabusItem: (courseId: string, itemId: string) => void
  addAnnouncement: (input: { title: string; body: string; audience: string[]; author: string }) => void
  logActivity: (event: Omit<ActivityEvent, 'id' | 'at'>) => void
}

const DataContext = createContext<DataContextValue | null>(null)

let seq = 0
const uid = (prefix: string) => `${prefix}-${Date.now()}-${seq++}`

export function DataProvider({ children }: { children: ReactNode }) {
  const [doubts, setDoubts] = useState<DoubtItem[]>(DOUBTS)
  const [courses, setCourses] = useState<TeacherAssignment[]>(COURSES)
  const [announcements, setAnnouncements] = useState<Announcement[]>(ANNOUNCEMENTS)
  const [activity, setActivity] = useState<ActivityEvent[]>(ACTIVITY)

  const logActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'at'>) => {
    setActivity((list) => [{ ...event, id: uid('e'), at: new Date().toISOString() }, ...list])
  }, [])

  const answerDoubt = useCallback(
    (id: string, response: string) => {
      let studentName = ''
      let courseCode: string | undefined
      setDoubts((list) =>
        list.map((d) => {
          if (d.id !== id) return d
          studentName = d.studentName
          courseCode = d.courseCode
          return { ...d, response, status: 'answered', respondedAt: new Date().toISOString() }
        }),
      )
      logActivity({
        kind: 'doubt-answered',
        title: 'Answered a doubt',
        detail: `Replied to ${studentName}.`,
        courseCode,
      })
    },
    [logActivity],
  )

  const setDoubtStatus = useCallback((id: string, status: DoubtStatus) => {
    setDoubts((list) => list.map((d) => (d.id === id ? { ...d, status } : d)))
  }, [])

  const toggleSyllabusItem = useCallback(
    (courseId: string, itemId: string) => {
      let courseCode = ''
      let itemTitle = ''
      let willBeDone = false
      setCourses((list) =>
        list.map((c) => {
          if (c.id !== courseId) return c
          courseCode = c.courseCode
          return {
            ...c,
            syllabus: c.syllabus.map((s) => {
              if (s.id !== itemId) return s
              itemTitle = s.title
              willBeDone = !s.done
              return { ...s, done: !s.done }
            }),
          }
        }),
      )
      if (willBeDone) {
        logActivity({
          kind: 'syllabus-edit',
          title: 'Syllabus updated',
          detail: `Marked "${itemTitle}" complete in ${courseCode}.`,
          courseCode,
        })
      }
    },
    [logActivity],
  )

  const addAnnouncement = useCallback(
    (input: { title: string; body: string; audience: string[]; author: string }) => {
      const reach = courses
        .filter((c) => input.audience.includes(c.courseCode))
        .reduce((sum, c) => sum + c.students, 0)
      const announcement: Announcement = {
        id: uid('an'),
        title: input.title,
        body: input.body,
        audience: input.audience,
        author: input.author,
        postedAt: new Date().toISOString(),
        pinned: false,
        reach,
      }
      setAnnouncements((list) => [announcement, ...list])
      logActivity({
        kind: 'announcement',
        title: 'Announcement broadcast',
        detail: `"${input.title}" sent to ${input.audience.join(', ') || 'all classes'} (${reach} reached).`,
      })
    },
    [courses, logActivity],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      doubts,
      courses,
      announcements,
      activity,
      answerDoubt,
      setDoubtStatus,
      toggleSyllabusItem,
      addAnnouncement,
      logActivity,
    }),
    [doubts, courses, announcements, activity, answerDoubt, setDoubtStatus, toggleSyllabusItem, addAnnouncement, logActivity],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
