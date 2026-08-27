import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  ActivityEvent,
  Announcement,
  DoubtItem,
  DoubtStatus,
  TeacherAssignment,
} from '../types'
import { ACTIVITY, ANNOUNCEMENTS, COURSES, DOUBTS } from '../lib/mockData'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebaseConfig'
import { updateDoubtResponse } from '../../services/teacherDoubtService'

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

  // Real-time synchronization of student doubts from Firestore, localStorage, and window events
  useEffect(() => {
    let unsubscribe = () => {};

    const loadCombinedDoubts = (fsDoubts: DoubtItem[] = []) => {
      // Check local storage for fallback doubts
      let localDoubts: DoubtItem[] = [];
      try {
        const rawLocal = localStorage.getItem('noteit_local_doubts');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            localDoubts = parsed.map((d: any) => ({
              id: d.id || uid('d'),
              studentName: d.studentName || 'Student Scholar',
              studentId: d.studentId || 'student_demo',
              studentPhone: d.studentPhone || '919876543210',
              courseCode: d.courseCode || (d.subjectName ? d.subjectName.substring(0, 6).toUpperCase() : 'CS301'),
              subject: d.subjectName || d.subject || 'Data Structures',
              topic: d.topic || 'General Topic',
              question: d.question || '',
              highlightedText: d.selectedText || d.highlightedText || '',
              status: (d.status?.toLowerCase() === 'new' ? 'pending' : d.status?.toLowerCase() || 'pending') as DoubtStatus,
              priority: d.priority || 'medium',
              createdAt: d.createdAt || new Date().toISOString(),
              response: d.response,
              respondedAt: d.respondedAt,
            }));
          }
        }
      } catch (e) {}

      // Deduplicate and combine (Firestore + Local + Demo)
      const map = new Map<string, DoubtItem>();
      [...fsDoubts, ...localDoubts, ...DOUBTS].forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      const combined = Array.from(map.values());
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setDoubts(combined);
    };

    try {
      // Query collection without orderBy to prevent Firestore index errors
      const doubtsRef = collection(db, 'doubts');

      unsubscribe = onSnapshot(
        doubtsRef,
        (snapshot) => {
          let fsDoubts: DoubtItem[] = [];

          if (!snapshot.empty) {
            fsDoubts = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();

              let rawStatus = (data.status || 'pending').toString().toLowerCase();
              if (rawStatus === 'new') rawStatus = 'pending';
              const validStatus: DoubtStatus = ['pending', 'answered', 'resolved', 'escalated'].includes(rawStatus)
                ? (rawStatus as DoubtStatus)
                : 'pending';

              let createdIso = new Date().toISOString();
              if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                  createdIso = data.createdAt.toDate().toISOString();
                } else if (typeof data.createdAt === 'string') {
                  createdIso = data.createdAt;
                }
              }

              let attachmentObj = undefined;
              if (data.attachmentName) {
                attachmentObj = {
                  name: data.attachmentName,
                  sizeMb: data.attachmentSize ? Number((data.attachmentSize / (1024 * 1024)).toFixed(1)) : 1.0,
                  kind: (data.attachmentType?.includes('image') ? 'image' : 'pdf') as any,
                };
              }

              return {
                id: docSnap.id,
                studentName: data.studentName || 'Student Scholar',
                studentId: data.studentId || 'student_demo',
                studentPhone: data.studentPhone || '919876543210',
                courseCode: data.courseCode || (data.subjectName ? data.subjectName.substring(0, 6).toUpperCase() : 'CS301'),
                subject: data.subjectName || data.subject || 'Data Structures',
                topic: data.topic || 'General Topic',
                question: data.question || '',
                highlightedText: data.selectedText || data.highlightedText || '',
                attachment: attachmentObj,
                status: validStatus,
                priority: data.priority || 'medium',
                createdAt: createdIso,
                response: data.response || undefined,
                respondedAt: data.respondedAt
                  ? typeof data.respondedAt.toDate === 'function'
                    ? data.respondedAt.toDate().toISOString()
                    : data.respondedAt
                  : undefined,
              };
            });
          }

          loadCombinedDoubts(fsDoubts);
        },
        (err) => {
          console.warn('Error reading real-time doubts from Firestore, fallback to local storage:', err);
          loadCombinedDoubts([]);
        }
      );
    } catch (err) {
      console.warn('Firestore initialization fallback for doubts:', err);
      loadCombinedDoubts([]);
    }

    // Listen for custom doubt creation events within the same window
    const handleDoubtCreated = () => {
      loadCombinedDoubts([]);
    };
    window.addEventListener('noteit_doubt_created', handleDoubtCreated);
    window.addEventListener('storage', handleDoubtCreated);

    return () => {
      unsubscribe();
      window.removeEventListener('noteit_doubt_created', handleDoubtCreated);
      window.removeEventListener('storage', handleDoubtCreated);
    };
  }, []);

  const logActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'at'>) => {
    setActivity((list) => [{ ...event, id: uid('e'), at: new Date().toISOString() }, ...list])
  }, [])

  const answerDoubt = useCallback(
    async (id: string, response: string) => {
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

      // Sync response to Firestore
      try {
        await updateDoubtResponse(id, response, 'ANSWERED')
      } catch (err) {
        console.warn('Failed to update doubt in Firestore:', err)
      }

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
    // Sync status change to Firestore
    const firestoreStatusMap: Record<DoubtStatus, any> = {
      pending: 'NEW',
      answered: 'ANSWERED',
      resolved: 'RESOLVED',
      escalated: 'ESCALATED',
    }
    updateDoubtResponse(id, '', firestoreStatusMap[status] || 'ANSWERED').catch(() => {})
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
