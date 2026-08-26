import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Megaphone,
  MessagesSquare,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { ViewId } from '../../types'

export interface NavItem {
  id: ViewId
  label: string
  icon: LucideIcon
  eyebrow: string
  group: 'Teaching' | 'Intelligence' | 'Workspace'
}

export const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, eyebrow: 'Dashboard', group: 'Teaching' },
  { id: 'courses', label: 'My Courses', icon: BookOpen, eyebrow: 'Courses', group: 'Teaching' },
  { id: 'progress', label: 'Course Progress', icon: BarChart3, eyebrow: 'Delivery', group: 'Teaching' },
  { id: 'doubts', label: 'Student Doubts', icon: MessagesSquare, eyebrow: 'Doubts manager', group: 'Teaching' },
  { id: 'quizzes', label: 'Quiz Performance', icon: ClipboardCheck, eyebrow: 'Assessments', group: 'Intelligence' },
  { id: 'analytics', label: 'Learning Analytics', icon: LineChart, eyebrow: 'Cohort', group: 'Intelligence' },
  { id: 'insights', label: 'Lecture Insights', icon: Lightbulb, eyebrow: 'AI pedagogy', group: 'Intelligence' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, eyebrow: 'Broadcast', group: 'Workspace' },
  { id: 'activity', label: 'Activity Center', icon: Activity, eyebrow: 'Live stream', group: 'Workspace' },
  { id: 'settings', label: 'Profile & Settings', icon: Settings, eyebrow: 'Account', group: 'Workspace' },
]

export const NAV_GROUPS: NavItem['group'][] = ['Teaching', 'Intelligence', 'Workspace']

export function navItemFor(id: ViewId): NavItem {
  return NAV.find((n) => n.id === id) ?? NAV[0]
}
