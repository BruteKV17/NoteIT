/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  HelpCircle, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle,
  MessageSquare,
  Sparkles,
  Clock
} from 'lucide-react';
import { DoubtItem, PageId, ClassLearningAlert } from '../../types';
import { generateClassLearningAlerts } from '../../services/teacherDoubtService';

interface FacultyOverviewProps {
  doubts: DoubtItem[];
  setActivePage: (page: PageId) => void;
  facultyName: string;
}

export default function FacultyOverview({
  doubts,
  setActivePage,
  facultyName
}: FacultyOverviewProps) {
  const [alerts, setAlerts] = useState<ClassLearningAlert[]>([]);

  useEffect(() => {
    setAlerts(generateClassLearningAlerts(doubts));
  }, [doubts]);

  const pendingDoubtsCount = doubts.filter(d => d.status === 'NEW' || d.status === 'IN REVIEW').length;
  const resolvedDoubtsCount = doubts.filter(d => d.status === 'ANSWERED' || d.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      
      {/* WELCOME BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--app-brand)] to-sky-600 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-md bg-white/20 text-xs font-mono font-bold uppercase tracking-wider">
            FACULTY DASHBOARD
          </span>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight mt-2">
            Welcome back, {facultyName || 'Professor'} 👋
          </h1>
          <p className="text-xs font-mono text-sky-100 mt-1 max-w-xl">
            You have {pendingDoubtsCount} pending student doubt{pendingDoubtsCount !== 1 ? 's' : ''} awaiting your review across Operating Systems and Data Structures.
          </p>
        </div>
        <button
          onClick={() => setActivePage('faculty-doubts')}
          className="px-4 py-2.5 rounded-xl bg-white text-[var(--app-brand-strong)] font-mono text-xs font-extrabold hover:bg-sky-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>Review Doubts</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* SMART CLASS LEARNING ALERTS (DOUBT INTELLIGENCE LAYER) */}
      {alerts.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm font-heading uppercase tracking-wide">
              <AlertTriangle size={18} />
              <span>Class Learning Alerts ({alerts.length})</span>
            </div>
            <button
              onClick={() => setActivePage('faculty-insights')}
              className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View Teaching Recommendations →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.slice(0, 2).map((alert) => (
              <div key={alert.id} className="p-4 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[var(--app-brand)] uppercase">{alert.subject}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-[10px]">
                    {alert.doubtCount} Similar Doubts
                  </span>
                </div>
                <div className="font-bold text-sm text-[var(--app-text)]">{alert.topic}</div>
                <p className="text-xs font-mono text-[var(--app-muted)] leading-relaxed">
                  {alert.recommendation}
                </p>
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 pt-1 border-t border-[var(--app-border)]">
                  <span>Est. Quiz Accuracy: {alert.quizAccuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--app-muted)]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Enrolled</span>
            <Users size={20} className="text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--app-text)] font-heading">128 Students</div>
          <div className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
            <TrendingUp size={12} />
            <span>94% Attendance Rate</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--app-muted)]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Active Doubts</span>
            <HelpCircle size={20} className="text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--app-text)] font-heading">{pendingDoubtsCount} Pending</div>
          <div className="text-[10px] font-mono text-sky-500 font-bold">
            {resolvedDoubtsCount} Doubts Answered
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--app-muted)]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Course Progress</span>
            <BookOpen size={20} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--app-text)] font-heading">68% Complete</div>
          <div className="w-full bg-[var(--app-surface-alt)] h-2 rounded-full overflow-hidden mt-1">
            <div className="bg-indigo-500 h-full w-[68%]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--app-muted)]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Avg Quiz Score</span>
            <GraduationCap size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--app-text)] font-heading">78% Overall</div>
          <div className="text-[10px] font-mono text-emerald-500 font-bold">
            Highest: 96% • Lowest: 52%
          </div>
        </div>

      </div>

      {/* RECENT DOUBTS FEED */}
      <div className="p-6 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-extrabold text-[var(--app-text)]">Recent Student Doubts</h2>
            <p className="text-xs font-mono text-[var(--app-muted)]">Real-time doubts submitted by enrolled students</p>
          </div>
          <button
            onClick={() => setActivePage('faculty-doubts')}
            className="text-xs font-mono font-bold text-[var(--app-brand)] hover:underline cursor-pointer"
          >
            View All ({doubts.length}) →
          </button>
        </div>

        {doubts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[var(--app-border)] rounded-xl text-xs font-mono text-[var(--app-muted)]">
            No doubts submitted yet. Student doubts will appear here automatically.
          </div>
        ) : (
          <div className="space-y-3">
            {doubts.slice(0, 3).map((doubt) => (
              <div 
                key={doubt.id} 
                onClick={() => setActivePage('faculty-doubts')}
                className="p-4 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] hover:border-[var(--app-brand)] transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--app-text)]">{doubt.studentName}</span>
                    <span className="text-[var(--app-muted)]">• {doubt.studentClass || 'B.Tech CSE'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    doubt.status === 'NEW' ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'
                  }`}>
                    {doubt.status}
                  </span>
                </div>

                <div className="font-bold text-xs text-[var(--app-brand)]">{doubt.subjectName} — {doubt.topic}</div>

                {doubt.selectedText && (
                  <p className="text-xs font-mono text-[var(--app-muted)] italic line-clamp-1 bg-[var(--app-surface)] p-2 rounded border border-[var(--app-border)]">
                    "{doubt.selectedText}"
                  </p>
                )}

                <p className="text-xs font-mono text-[var(--app-text)] line-clamp-2">
                  {doubt.question}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
