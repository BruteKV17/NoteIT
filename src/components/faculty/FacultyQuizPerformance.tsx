/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GraduationCap, TrendingUp, AlertTriangle, CheckCircle2, Award, HelpCircle } from 'lucide-react';
import { Quiz } from '../../types';

interface FacultyQuizPerformanceProps {
  quizzes?: Quiz[];
}

export default function FacultyQuizPerformance({ quizzes = [] }: FacultyQuizPerformanceProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('Operating Systems');

  const topicsData = [
    { name: 'Process Synchronization', accuracy: 89, attempts: 58, status: 'Strong' },
    { name: 'CPU Scheduling Algorithms', accuracy: 84, attempts: 61, status: 'Strong' },
    { name: 'Virtual Memory & Paging', accuracy: 68, attempts: 54, status: 'Moderate' },
    { name: 'Deadlock Prevention & Avoidance', accuracy: 52, attempts: 62, status: 'Weak' },
    { name: 'File Allocation Methods', accuracy: 76, attempts: 49, status: 'Moderate' },
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--app-border)] pb-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-[var(--app-text)]">Quiz Performance & Topic Analytics</h1>
          <p className="text-xs font-mono text-[var(--app-muted)]">Real-time student quiz retention and accuracy metrics</p>
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] text-xs font-mono font-bold text-[var(--app-text)] outline-none"
        >
          <option value="Operating Systems">Operating Systems (CS301)</option>
          <option value="Data Structures">Data Structures & Algorithms (CS201)</option>
        </select>
      </div>

      {/* OVERVIEW KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="text-xs font-mono text-[var(--app-muted)] uppercase">Average Score</div>
          <div className="text-3xl font-extrabold text-emerald-500 font-heading">78%</div>
          <div className="text-[10px] font-mono text-[var(--app-muted)]">+4.2% from previous quiz</div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="text-xs font-mono text-[var(--app-muted)] uppercase">Quiz Completion</div>
          <div className="text-3xl font-extrabold text-[var(--app-brand)] font-heading">91%</div>
          <div className="text-[10px] font-mono text-[var(--app-muted)]">58 out of 64 students completed</div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="text-xs font-mono text-[var(--app-muted)] uppercase">Weakest Topic</div>
          <div className="text-xl font-extrabold text-amber-500 font-heading truncate">Deadlock</div>
          <div className="text-[10px] font-mono text-amber-500 font-bold">52% Accuracy</div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2 shadow-sm">
          <div className="text-xs font-mono text-[var(--app-muted)] uppercase">Strongest Topic</div>
          <div className="text-xl font-extrabold text-emerald-500 font-heading truncate">Synchronization</div>
          <div className="text-[10px] font-mono text-emerald-500 font-bold">89% Accuracy</div>
        </div>
      </div>

      {/* TOPIC ACCURACY BREAKDOWN */}
      <div className="p-6 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-4 shadow-sm">
        <h2 className="text-lg font-heading font-extrabold text-[var(--app-text)]">Topic-wise Student Accuracy</h2>
        
        <div className="space-y-4">
          {topicsData.map((topic, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--app-text)]">{topic.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    topic.status === 'Weak' ? 'bg-amber-500/20 text-amber-600' :
                    topic.status === 'Strong' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-sky-500/20 text-sky-600'
                  }`}>
                    {topic.status}
                  </span>
                </div>
                <span className="font-bold text-[var(--app-text)]">{topic.accuracy}% Accuracy</span>
              </div>

              <div className="w-full bg-[var(--app-surface)] h-2 rounded-full overflow-hidden border border-[var(--app-border)]">
                <div 
                  className={`h-full transition-all ${
                    topic.accuracy < 60 ? 'bg-amber-500' : topic.accuracy > 80 ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${topic.accuracy}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-[var(--app-muted)] pt-1">
                <span>{topic.attempts} Student Attempts</span>
                <span>{topic.accuracy < 60 ? '⚠️ High Doubt Rate' : '✓ Good Retention'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
