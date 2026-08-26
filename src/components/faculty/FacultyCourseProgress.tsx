/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';

export default function FacultyCourseProgress() {
  const modules = [
    {
      name: 'Module 1: Process Management & Scheduling',
      lectures: 'Lecture 01 - Lecture 05',
      status: 'Completed',
      completion: 100,
      doubtsCount: 4,
      avgQuizScore: 88
    },
    {
      name: 'Module 2: Concurrency & Synchronization',
      lectures: 'Lecture 06 - Lecture 10',
      status: 'Completed',
      completion: 100,
      doubtsCount: 9,
      avgQuizScore: 72
    },
    {
      name: 'Module 3: Deadlocks & Prevention',
      lectures: 'Lecture 11 - Lecture 15',
      status: 'In Progress',
      completion: 70,
      doubtsCount: 14,
      avgQuizScore: 54,
      isWeakTopic: true
    },
    {
      name: 'Module 4: Memory Management & Paging',
      lectures: 'Lecture 16 - Lecture 20',
      status: 'Upcoming',
      completion: 0,
      doubtsCount: 0,
      avgQuizScore: 0
    },
    {
      name: 'Module 5: Storage & File Systems',
      lectures: 'Lecture 21 - Lecture 25',
      status: 'Upcoming',
      completion: 0,
      doubtsCount: 0,
      avgQuizScore: 0
    }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--app-border)] pb-4">
        <h1 className="text-2xl font-heading font-extrabold text-[var(--app-text)]">Course Progress & Syllabus Breakdown</h1>
        <p className="text-xs font-mono text-[var(--app-muted)]">Operating Systems (CS301) — Academic Semester Fall 2026</p>
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="text-xs font-mono text-[var(--app-muted)] uppercase">Overall Syllabus Conducted</div>
          <div className="text-2xl font-extrabold text-[var(--app-text)] font-heading">17 / 25 Lectures</div>
          <div className="w-full bg-[var(--app-surface-alt)] h-2 rounded-full overflow-hidden">
            <div className="bg-[var(--app-brand)] h-full w-[68%]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="text-xs font-mono text-[var(--app-muted)] uppercase">Student Quiz Accuracy</div>
          <div className="text-2xl font-extrabold text-[var(--app-text)] font-heading">76.4% Avg</div>
          <div className="text-[10px] font-mono text-emerald-500 font-bold">Passed Threshold (70%)</div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="text-xs font-mono text-[var(--app-muted)] uppercase">Total Doubts Logged</div>
          <div className="text-2xl font-extrabold text-amber-500 font-heading">27 Doubts</div>
          <div className="text-[10px] font-mono text-[var(--app-muted)]">Across 3 completed modules</div>
        </div>
      </div>

      {/* MODULE LIST */}
      <div className="space-y-4">
        <h2 className="text-lg font-heading font-extrabold text-[var(--app-text)]">Module Breakdown</h2>
        {modules.map((mod, idx) => (
          <div key={idx} className={`p-5 rounded-2xl bg-[var(--app-surface)] border space-y-3 shadow-sm ${
            mod.isWeakTopic ? 'border-amber-500/50 bg-amber-500/5' : 'border-[var(--app-border)]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-base text-[var(--app-text)]">{mod.name}</h3>
                  {mod.isWeakTopic && (
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-bold text-[10px] uppercase">
                      ⚠️ Weak Topic Alert
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-[var(--app-muted)]">{mod.lectures}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  mod.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  mod.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }`}>
                  {mod.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)]">
                <span className="text-[var(--app-muted)]">Completion: </span>
                <span className="font-bold text-[var(--app-text)]">{mod.completion}%</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)]">
                <span className="text-[var(--app-muted)]">Logged Doubts: </span>
                <span className="font-bold text-amber-500">{mod.doubtsCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)]">
                <span className="text-[var(--app-muted)]">Quiz Score: </span>
                <span className={`font-bold ${mod.avgQuizScore < 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {mod.avgQuizScore > 0 ? `${mod.avgQuizScore}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
