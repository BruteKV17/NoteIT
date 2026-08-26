/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  PanelTopOpen, 
  BadgeInfo, 
  GraduationCap, 
  Sparkles, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building,
  BarChart3,
  Lightbulb,
  BellRing,
  Activity,
  Copy,
  Check
} from 'lucide-react';
import { PageId } from '../../types';
import AILogo from '../AILogo';
import { generateTeacherCode } from '../../services/teacherDoubtService';

interface FacultyLayoutProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  user: { uid: string; fullName: string; emailAddress: string; teacherCode?: string };
  onSignOut: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  children: React.ReactNode;
}

export default function FacultyLayout({
  activePage,
  setActivePage,
  user,
  onSignOut,
  theme,
  setTheme,
  children
}: FacultyLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const teacherCode = user.teacherCode || generateTeacherCode(user.fullName || 'Professor');

  const copyTeacherCode = () => {
    navigator.clipboard.writeText(teacherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navigationItems = [
    { id: 'faculty-dashboard' as PageId, label: 'Overview', icon: LayoutDashboard },
    { id: 'faculty-courses' as PageId, label: 'My Courses', icon: BookOpen },
    { id: 'faculty-course-progress' as PageId, label: 'Course Progress', icon: PanelTopOpen },
    { id: 'faculty-doubts' as PageId, label: 'Student Doubts', icon: BadgeInfo, badge: 'LIVE' },
    { id: 'faculty-quiz-analytics' as PageId, label: 'Quiz Performance', icon: GraduationCap },
    { id: 'faculty-learning-analytics' as PageId, label: 'Learning Analytics', icon: BarChart3 },
    { id: 'faculty-lecture-insights' as PageId, label: 'Lecture Insights', icon: Lightbulb, badge: 'AI' },
    { id: 'faculty-announcements' as PageId, label: 'Announcements', icon: BellRing },
    { id: 'faculty-activity-center' as PageId, label: 'Activity Center', icon: Activity },
    { id: 'faculty-insights' as PageId, label: 'Teaching Insights', icon: Sparkles },
    { id: 'faculty-settings' as PageId, label: 'Profile & Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col font-sans bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-200 select-none">
      
      {/* TOP HEADER */}
      <header className="h-16 shrink-0 border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 flex items-center justify-between z-50 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg border border-[var(--app-border)] text-[var(--app-text)] hover:bg-[var(--app-surface-alt)]"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage('faculty-dashboard')}>
            <div className="p-1.5 rounded-lg bg-[var(--app-brand)] text-white shadow-sm">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="font-heading font-extrabold text-base tracking-tight leading-none text-[var(--app-text)]">
                NOTEIT
              </div>
              <div className="text-[10px] font-mono font-bold text-[var(--app-brand)] tracking-wider">
                TEACHER PORTAL
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Teacher Code Badge */}
          <button
            onClick={copyTeacherCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFC400]/15 border-2 border-[#FFC400] text-[#FFC400] hover:bg-[#FFC400]/25 transition-all cursor-pointer font-mono text-xs font-bold"
            title="Click to copy Teacher Code for students"
          >
            <span className="text-[10px] uppercase opacity-75">CODE:</span>
            <span className="tracking-widest font-black">{teacherCode}</span>
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          {/* Institution Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-xs font-mono text-[var(--app-muted)]">
            <Building size={14} className="text-[var(--app-brand)]" />
            <span className="truncate max-w-[180px]">Chandigarh University</span>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] hover:opacity-80 transition-opacity cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
          </button>

          {/* User Profile info & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--app-border)]">
            <div className="w-8 h-8 rounded-full bg-[var(--app-brand)] text-white font-mono font-bold flex items-center justify-center text-xs">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'F'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-[var(--app-text)] truncate max-w-[120px]">{user.fullName || 'Faculty'}</div>
              <div className="text-[10px] font-mono text-[var(--app-brand)]">Faculty</div>
            </div>
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer ml-1"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className={`
          fixed md:sticky top-16 z-40 h-[calc(100vh-64px)] border-r border-[var(--app-border)] bg-[var(--app-surface)]
          transition-all duration-300 flex flex-col justify-between py-4
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'md:w-20 px-2' : 'md:w-64 px-3'}
        `}>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-4">
              {!collapsed && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--app-muted)]">
                  FACULTY ACADEMIC MENU
                </span>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex p-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-alt)] text-[var(--app-text)] hover:opacity-80 ml-auto"
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>

            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer text-left relative
                    ${isActive 
                      ? 'bg-[var(--app-brand)] text-white shadow-sm' 
                      : 'text-[var(--app-text)] hover:bg-[var(--app-surface-alt)]'
                    }
                  `}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                      isActive ? 'bg-white text-[var(--app-brand)]' : 'bg-[var(--app-brand)] text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[var(--app-border)] px-2">
            {!collapsed && (
              <div className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] space-y-1 text-center">
                <div className="text-[11px] font-bold text-[var(--app-text)]">Active Semester</div>
                <div className="text-[10px] font-mono text-[var(--app-muted)]">Fall 2026 Academic Term</div>
              </div>
            )}
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--app-bg)]">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
