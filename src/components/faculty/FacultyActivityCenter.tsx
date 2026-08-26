/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, Clock, CheckCircle2, MessageSquare, BookOpen, AlertTriangle } from 'lucide-react';

export default function FacultyActivityCenter() {
  const activities = [
    {
      id: 'act-1',
      title: 'Doubt Resolved',
      description: 'Answered student doubt on Page Fault Handling in Operating Systems.',
      timestamp: '10 mins ago',
      type: 'resolution',
      user: 'Student: Rahul S.'
    },
    {
      id: 'act-2',
      title: 'New Student Doubt Submitted',
      description: 'Selected text query regarding B-Tree Node Splitting.',
      timestamp: '35 mins ago',
      type: 'doubt',
      user: 'Student: Priya M.'
    },
    {
      id: 'act-3',
      title: 'Class Learning Alert Triggered',
      description: 'System flagged high doubt density on LRU Cache Replacement.',
      timestamp: '2 hours ago',
      type: 'alert',
      user: 'System Bot'
    },
    {
      id: 'act-4',
      title: 'Course Syllabus Updated',
      description: 'Uploaded Module 4 presentation slides for Database Management Systems.',
      timestamp: 'Yesterday',
      type: 'course',
      user: 'Faculty'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[var(--app-brand)] uppercase block">
            REAL-TIME LOG
          </span>
          <h1 className="text-2xl font-black text-[var(--app-text)] tracking-tight">
            Faculty Activity Center
          </h1>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-4">
        <h2 className="text-base font-bold text-[var(--app-text)] flex items-center gap-2">
          <Activity size={18} className="text-[var(--app-brand)]" />
          Recent Interaction Stream
        </h2>

        <div className="space-y-3">
          {activities.map(act => (
            <div key={act.id} className="p-4 rounded-lg bg-[var(--app-surface-alt)] border border-[var(--app-border)] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--app-surface)] border border-[var(--app-border)] shrink-0">
                {act.type === 'resolution' && <CheckCircle2 size={16} className="text-emerald-500" />}
                {act.type === 'doubt' && <MessageSquare size={16} className="text-[#38BDF8]" />}
                {act.type === 'alert' && <AlertTriangle size={16} className="text-rose-500" />}
                {act.type === 'course' && <BookOpen size={16} className="text-amber-500" />}
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[var(--app-text)]">{act.title}</span>
                  <span className="text-[var(--app-muted)] flex items-center gap-1">
                    <Clock size={12} /> {act.timestamp}
                  </span>
                </div>
                <p className="text-xs text-[var(--app-muted)] font-mono">{act.description}</p>
                <div className="text-[10px] font-mono text-[var(--app-brand)] font-bold">{act.user}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
