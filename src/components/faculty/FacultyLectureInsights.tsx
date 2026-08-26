/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lightbulb, Sparkles, Video, Mic, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function FacultyLectureInsights() {
  const insights = [
    {
      id: 1,
      title: 'Virtual Memory & Page Replacement Strategies',
      subject: 'Operating Systems',
      date: 'Today, 10:30 AM',
      keyTakeaway: 'Students had a 35% higher doubt frequency on the LRU page replacement algorithm compared to FIFO.',
      actionableTip: 'Provide a visual step-by-step memory frame diagram in tomorrow’s lecture slides.',
      sentiment: 'Needs Review'
    },
    {
      id: 2,
      title: 'Graph Traversal Algorithms: BFS vs DFS',
      subject: 'Data Structures',
      date: 'Yesterday',
      keyTakeaway: '88% student comprehension accuracy on BFS recursion stack questions in post-lecture quiz.',
      actionableTip: 'Move forward to Dijkstra’s Shortest Path algorithm in next session.',
      sentiment: 'Mastered'
    },
    {
      id: 3,
      title: 'SQL Indexing & B-Tree Data Structures',
      subject: 'Database Systems',
      date: 'Aug 24, 2026',
      keyTakeaway: 'High engagement during live code demo. 14 students saved note summaries to personal libraries.',
      actionableTip: 'Assign lab exercise 4 on B-Tree node splitting.',
      sentiment: 'Engaged'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--app-border)] pb-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#FFC400] uppercase flex items-center gap-1">
            <Sparkles size={14} /> AI PEDAGOGY ASSISTANT
          </span>
          <h1 className="text-2xl font-black text-[var(--app-text)] tracking-tight">
            Lecture Insights & Curriculum Recommendations
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map(item => (
          <div key={item.id} className="p-6 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase bg-[#38BDF8]/10 text-[#38BDF8]">
                  {item.subject}
                </span>
                <span className="text-xs font-mono text-[var(--app-muted)] flex items-center gap-1">
                  <Clock size={12} /> {item.date}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                item.sentiment === 'Mastered' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : item.sentiment === 'Needs Review'
                  ? 'bg-rose-500/10 text-rose-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                {item.sentiment}
              </span>
            </div>

            <h3 className="text-lg font-bold text-[var(--app-text)]">{item.title}</h3>

            <div className="p-3 rounded-lg bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-xs font-mono space-y-1">
              <div className="text-[var(--app-muted)] font-bold">KEY COGNITIVE TAKEAWAY:</div>
              <div className="text-[var(--app-text)]">{item.keyTakeaway}</div>
            </div>

            <div className="p-3 rounded-lg bg-[#FFC400]/10 border border-[#FFC400]/30 text-xs font-mono space-y-1">
              <div className="text-[#FFC400] font-bold flex items-center gap-1">
                <Lightbulb size={14} /> AI TEACHING RECOMMENDATION:
              </div>
              <div className="text-[var(--app-text)]">{item.actionableTip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
