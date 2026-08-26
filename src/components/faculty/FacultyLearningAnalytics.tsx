/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart3, TrendingUp, Users, Target, BookOpen, AlertCircle, Award } from 'lucide-react';

export default function FacultyLearningAnalytics() {
  const analyticsData = [
    { subject: 'Operating Systems', totalStudents: 120, avgScore: 84, completionRate: 92, weakTopics: 2 },
    { subject: 'Data Structures & Algorithms', totalStudents: 115, avgScore: 76, completionRate: 85, weakTopics: 4 },
    { subject: 'Database Management Systems', totalStudents: 108, avgScore: 88, completionRate: 95, weakTopics: 1 },
    { subject: 'Computer Networks', totalStudents: 98, avgScore: 71, completionRate: 78, weakTopics: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--app-border)] pb-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[var(--app-brand)] uppercase block">
            ACADEMIC PERFORMANCE RADAR
          </span>
          <h1 className="text-2xl font-black text-[var(--app-text)] tracking-tight">
            Learning Analytics & Topic Mastery
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-xs font-mono text-[var(--app-text)]">
          <TrendingUp size={16} className="text-emerald-500" />
          <span>Cohort Performance +6.4% vs last term</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-1">
          <div className="text-xs font-mono text-[var(--app-muted)] flex items-center justify-between">
            <span>TOTAL ENROLLED</span>
            <Users size={16} className="text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-black text-[var(--app-text)]">441 Students</div>
          <div className="text-[10px] font-mono text-emerald-500">+12 new this month</div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-1">
          <div className="text-xs font-mono text-[var(--app-muted)] flex items-center justify-between">
            <span>COHORT AVERAGE</span>
            <Target size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[var(--app-text)]">79.8%</div>
          <div className="text-[10px] font-mono text-emerald-500">Above benchmark target</div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-1">
          <div className="text-xs font-mono text-[var(--app-muted)] flex items-center justify-between">
            <span>SYLLABUS COMPLETION</span>
            <BookOpen size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-[var(--app-text)]">87.5%</div>
          <div className="text-[10px] font-mono text-[var(--app-muted)]">On track for finals</div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-1">
          <div className="text-xs font-mono text-[var(--app-muted)] flex items-center justify-between">
            <span>ACTIVE WEAK TOPICS</span>
            <AlertCircle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500">12 Concepts</div>
          <div className="text-[10px] font-mono text-rose-400">Requires review session</div>
        </div>
      </div>

      {/* Analytics Subject Breakdown Table */}
      <div className="p-6 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-4">
        <h2 className="text-lg font-bold text-[var(--app-text)] flex items-center gap-2">
          <BarChart3 size={20} className="text-[var(--app-brand)]" />
          Subject-Wise Learning Distribution
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--app-border)] text-[var(--app-muted)] uppercase tracking-wider">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Enrolled</th>
                <th className="py-3 px-4">Avg Score</th>
                <th className="py-3 px-4">Syllabus %</th>
                <th className="py-3 px-4">Weak Topics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {analyticsData.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--app-surface-alt)]">
                  <td className="py-3.5 px-4 font-bold text-[var(--app-text)]">{item.subject}</td>
                  <td className="py-3.5 px-4 text-[var(--app-muted)]">{item.totalStudents}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      item.avgScore >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {item.avgScore}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[var(--app-text)]">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-[var(--app-border)] overflow-hidden">
                        <div className="h-full bg-[var(--app-brand)]" style={{ width: `${item.completionRate}%` }} />
                      </div>
                      <span>{item.completionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-rose-500 font-bold">{item.weakTopics} Flagged</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
