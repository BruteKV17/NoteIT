import React, { useState, useEffect } from 'react'
import type { ViewId, FacultyProfile } from './types'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { Toaster } from './components/ui/Toaster'
import { LandingHero } from './components/landing/LandingHero'
import { PortalLayout } from './components/layout/PortalLayout'
import { OverviewDashboard } from './views/OverviewDashboard'
import { MyCourses } from './views/MyCourses'
import { CourseProgress } from './views/CourseProgress'
import { StudentDoubtsManager } from './views/StudentDoubtsManager'
import { QuizPerformance } from './views/QuizPerformance'
import { LearningAnalytics } from './views/LearningAnalytics'
import { LectureInsights } from './views/LectureInsights'
import { Announcements } from './views/Announcements'
import { ActivityCenter } from './views/ActivityCenter'
import { ProfileSettings } from './views/ProfileSettings'
import { DEMO_PROFILE } from './lib/mockData'

function ViewRouter({ active, onNavigate }: { active: ViewId; onNavigate: (id: ViewId) => void }) {
  switch (active) {
    case 'overview':
      return <OverviewDashboard onNavigate={onNavigate} />
    case 'courses':
      return <MyCourses onNavigate={onNavigate} />
    case 'progress':
      return <CourseProgress />
    case 'doubts':
      return <StudentDoubtsManager />
    case 'quizzes':
      return <QuizPerformance />
    case 'analytics':
      return <LearningAnalytics />
    case 'insights':
      return <LectureInsights />
    case 'announcements':
      return <Announcements />
    case 'activity':
      return <ActivityCenter />
    case 'settings':
      return <ProfileSettings />
    default:
      return <OverviewDashboard onNavigate={onNavigate} />
  }
}

interface TeacherPortalAppProps {
  user: {
    uid: string
    fullName: string
    emailAddress: string
    teacherCode?: string
    institution?: string
  }
  onSignOut: () => void
  theme?: 'light' | 'dark'
  setTheme?: (t: 'light' | 'dark') => void
}

function TeacherPortalInner({ user, onSignOut }: TeacherPortalAppProps) {
  const { stage, initProfile } = useAuth()
  const [active, setActive] = useState<ViewId>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (user) {
      const parts = (user.fullName || 'Faculty Scholar').trim().split(' ')
      const firstName = parts[0] || 'Faculty'
      const surname = parts.slice(1).join(' ') || 'Scholar'

      const customProf: FacultyProfile = {
        ...DEMO_PROFILE,
        id: user.uid,
        firstName,
        surname,
        email: user.emailAddress || DEMO_PROFILE.email,
        teacherCode: user.teacherCode || DEMO_PROFILE.teacherCode,
        university: user.institution || DEMO_PROFILE.university,
        avatarInitials: `${firstName[0] || 'F'}${surname[0] || 'S'}`,
      }
      initProfile(customProf)
    }
  }, [user, initProfile])

  if (stage === 'hero') {
    return <LandingHero />
  }

  return (
    <PortalLayout active={active} onNavigate={setActive} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
      <div key={active} className="animate-fade-in">
        <ViewRouter active={active} onNavigate={setActive} />
      </div>
    </PortalLayout>
  )
}

export default function TeacherPortalApp(props: TeacherPortalAppProps) {
  const parts = (props.user?.fullName || 'Faculty Scholar').trim().split(' ')
  const firstName = parts[0] || 'Faculty'
  const surname = parts.slice(1).join(' ') || 'Scholar'

  const initialProfile: FacultyProfile = {
    ...DEMO_PROFILE,
    id: props.user.uid,
    firstName,
    surname,
    email: props.user.emailAddress || DEMO_PROFILE.email,
    teacherCode: props.user.teacherCode || DEMO_PROFILE.teacherCode,
    university: props.user.institution || DEMO_PROFILE.university,
    avatarInitials: `${firstName[0] || 'F'}${surname[0] || 'S'}`,
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider initialProfile={initialProfile} onSignOut={props.onSignOut} initialStage="ready">
          <DataProvider>
            <TeacherPortalInner {...props} />
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
