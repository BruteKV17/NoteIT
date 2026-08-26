import { useState } from 'react'
import type { ViewId } from './types'
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

function AppInner() {
  const { stage } = useAuth()
  const [active, setActive] = useState<ViewId>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (stage === 'ready') {
    return (
      <PortalLayout active={active} onNavigate={setActive} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
        <div key={active} className="animate-fade-in">
          <ViewRouter active={active} onNavigate={setActive} />
        </div>
      </PortalLayout>
    )
  }

  return <LandingHero />
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <AppInner />
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
