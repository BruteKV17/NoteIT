/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BellRing, Send, Plus, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export default function FacultyAnnouncements() {
  const [announcements, setAnnouncements] = useState([
    {
      id: 'ann-1',
      title: 'Mid-Term Exam Schedule & Syllabus Coverage',
      subject: 'Operating Systems',
      content: 'Mid-term exams commence next Monday. Chapters 1 to 4 (Processes, Threads, CPU Scheduling, Virtual Memory) are included.',
      date: 'Today, 09:00 AM',
      author: 'Dr. Kishan Verma'
    },
    {
      id: 'ann-2',
      title: 'Lab Assignment 3 Deadline Extension',
      subject: 'Data Structures',
      content: 'Due to ongoing campus hackathon activities, the deadline for B-Tree implementation lab has been extended by 48 hours.',
      date: 'Yesterday',
      author: 'Dr. Kishan Verma'
    }
  ]);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Operating Systems');
  const [content, setContent] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnn = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      subject,
      content: content.trim(),
      date: 'Just now',
      author: 'Faculty Member'
    };

    setAnnouncements([newAnn, ...announcements]);
    setTitle('');
    setContent('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[var(--app-brand)] uppercase block">
            BROADCAST CENTER
          </span>
          <h1 className="text-2xl font-black text-[var(--app-text)] tracking-tight">
            Announcements & Course Resources
          </h1>
        </div>
      </div>

      {/* Post New Announcement Card */}
      <div className="p-6 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-4">
        <h2 className="text-base font-bold text-[var(--app-text)] flex items-center gap-2">
          <Plus size={18} className="text-[var(--app-brand)]" />
          Broadcast Announcement to Enrolled Students
        </h2>

        {sentSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500 text-emerald-500 text-xs font-mono font-bold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Announcement broadcasted successfully to all enrolled student feeds!</span>
          </div>
        )}

        <form onSubmit={handlePost} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement Title (e.g. Lab 4 Guidance)"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
              />
            </div>
            <div>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)]"
              >
                <option value="Operating Systems">Operating Systems</option>
                <option value="Data Structures">Data Structures</option>
                <option value="Database Systems">Database Systems</option>
                <option value="Computer Networks">Computer Networks</option>
              </select>
            </div>
          </div>

          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your detailed message for students..."
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] text-[var(--app-text)] font-sans text-sm focus:outline-none focus:border-[var(--app-brand)] resize-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[var(--app-brand)] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:opacity-90"
            >
              <Send size={14} />
              <span>Broadcast Announcement</span>
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--app-text)] flex items-center gap-2">
          <BellRing size={20} className="text-[var(--app-brand)]" />
          Recent Broadcast History
        </h2>

        {announcements.map(ann => (
          <div key={ann.id} className="p-5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded font-bold bg-[var(--app-brand)]/10 text-[var(--app-brand)] uppercase">
                {ann.subject}
              </span>
              <span className="text-[var(--app-muted)]">{ann.date}</span>
            </div>
            <h3 className="text-base font-bold text-[var(--app-text)]">{ann.title}</h3>
            <p className="text-xs font-mono text-[var(--app-muted)] leading-relaxed">{ann.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
