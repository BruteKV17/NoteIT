/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BadgeInfo, 
  Search, 
  Filter, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Paperclip, 
  ExternalLink, 
  Send,
  User,
  BookOpen,
  FileText
} from 'lucide-react';
import { DoubtItem } from '../../types';
import { updateDoubtResponse, getWhatsAppDeepLink } from '../../services/teacherDoubtService';

interface FacultyStudentDoubtsProps {
  doubts: DoubtItem[];
  facultyPhone?: string;
}

export default function FacultyStudentDoubts({ doubts, facultyPhone }: FacultyStudentDoubtsProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeDoubt, setActiveDoubt] = useState<DoubtItem | null>(null);
  const [responseText, setResponseText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filteredDoubts = doubts.filter(d => {
    const matchSubject = selectedSubject === 'all' || d.subjectName === selectedSubject;
    const matchStatus = selectedStatus === 'all' || d.status === selectedStatus;
    const matchQuery = !searchQuery || 
      d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.selectedText && d.selectedText.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubject && matchStatus && matchQuery;
  });

  const handleSendResponse = async () => {
    if (!activeDoubt || !responseText.trim()) return;
    setIsSubmitting(true);
    try {
      await updateDoubtResponse(activeDoubt.id, responseText.trim(), 'ANSWERED');
      setActiveDoubt(prev => prev ? { ...prev, response: responseText.trim(), status: 'ANSWERED' } : null);
      setResponseText('');
    } catch (err) {
      console.error('Error submitting response:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--app-border)] pb-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-[var(--app-text)]">Student Doubts Dashboard</h1>
          <p className="text-xs font-mono text-[var(--app-muted)]">
            Review, respond, and resolve contextual academic doubts submitted by students
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] text-xs font-mono font-bold text-[var(--app-text)] outline-none"
          >
            <option value="all">All Subjects</option>
            <option value="Operating Systems">Operating Systems</option>
            <option value="Data Structures & Algorithms">Data Structures</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] text-xs font-mono font-bold text-[var(--app-text)] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="IN REVIEW">IN REVIEW</option>
            <option value="ANSWERED">ANSWERED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-muted)]" />
            <input
              type="text"
              placeholder="Search doubts or students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] text-xs font-mono text-[var(--app-text)] outline-none w-48 focus:w-60 transition-all"
            />
          </div>
        </div>
      </div>

      {/* DOUBTS LIST & RESPONSE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LIST COLUMN (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono font-bold text-[var(--app-muted)] uppercase tracking-wider">
            Showing {filteredDoubts.length} Doubt{filteredDoubts.length !== 1 ? 's' : ''}
          </div>

          {filteredDoubts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--app-surface)] border border-dashed border-[var(--app-border)] text-center text-xs font-mono text-[var(--app-muted)] space-y-2">
              <BadgeInfo className="w-8 h-8 mx-auto text-[var(--app-muted)] opacity-50" />
              <p>No doubts match the selected criteria.</p>
            </div>
          ) : (
            filteredDoubts.map(doubt => {
              const isSelected = activeDoubt?.id === doubt.id;
              return (
                <div
                  key={doubt.id}
                  onClick={() => { setActiveDoubt(doubt); setResponseText(doubt.response || ''); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected 
                      ? 'bg-[var(--app-surface)] border-[var(--app-brand)] ring-2 ring-[var(--app-brand)]/20 shadow-md' 
                      : 'bg-[var(--app-surface)] border-[var(--app-border)] hover:border-[var(--app-brand)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[var(--app-text)]">{doubt.studentName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doubt.status === 'NEW' ? 'bg-amber-500/20 text-amber-600' : 
                      doubt.status === 'ANSWERED' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {doubt.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[var(--app-brand)] font-mono">
                    {doubt.subjectName} • {doubt.topic}
                  </div>

                  {doubt.selectedText && (
                    <div className="text-[11px] font-mono text-[var(--app-muted)] italic line-clamp-1 bg-[var(--app-surface-alt)] p-2 rounded-lg border border-[var(--app-border)]">
                      "{doubt.selectedText}"
                    </div>
                  )}

                  <p className="text-xs font-mono text-[var(--app-text)] line-clamp-2">
                    {doubt.question}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* DETAILS & RESPONSE PANEL (7 cols) */}
        <div className="lg:col-span-7">
          {activeDoubt ? (
            <div className="p-6 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-5 shadow-md sticky top-24">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[var(--app-border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[var(--app-brand)]/10 text-[var(--app-brand)] font-mono text-xs font-bold">
                      {activeDoubt.subjectName}
                    </span>
                    <span className="text-xs font-mono text-[var(--app-muted)]">{activeDoubt.studentClass || 'B.Tech CSE'}</span>
                  </div>
                  <h2 className="text-xl font-heading font-extrabold text-[var(--app-text)] mt-2">
                    {activeDoubt.topic}
                  </h2>
                  <div className="text-xs font-mono text-[var(--app-muted)] mt-0.5">
                    Student: <strong className="text-[var(--app-text)]">{activeDoubt.studentName}</strong> ({activeDoubt.studentUniversity || 'Chandigarh University'})
                  </div>
                </div>

                {/* WhatsApp button for Faculty */}
                <a
                  href={getWhatsAppDeepLink(activeDoubt, facultyPhone || '919876543210')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold hover:bg-emerald-500 transition-colors flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
                >
                  <MessageSquare size={16} />
                  <span>Open WhatsApp</span>
                </a>
              </div>

              {/* Selected Note Content */}
              {activeDoubt.selectedText && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-[var(--app-muted)] uppercase tracking-wider block">
                    HIGHLIGHTED NOTE CONTEXT
                  </span>
                  <div className="p-3 rounded-xl bg-[var(--app-surface-alt)] border-l-4 border-[var(--app-brand)] text-xs font-mono text-[var(--app-text)] italic leading-relaxed">
                    "{activeDoubt.selectedText}"
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[var(--app-muted)] uppercase tracking-wider block">
                  STUDENT QUESTION
                </span>
                <p className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-xs font-mono text-[var(--app-text)] leading-relaxed">
                  {activeDoubt.question}
                </p>
              </div>

              {/* Attachment if present */}
              {activeDoubt.attachmentUrl && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-[var(--app-muted)] uppercase tracking-wider block">
                    ATTACHED FILE
                  </span>
                  <a
                    href={activeDoubt.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] hover:border-[var(--app-brand)] flex items-center justify-between text-xs font-mono text-[var(--app-brand)] font-bold transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} />
                      <span>{activeDoubt.attachmentName || 'View Attachment Document'}</span>
                    </div>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {/* Existing Response or Response Form */}
              <div className="space-y-3 pt-3 border-t border-[var(--app-border)]">
                <span className="text-[10px] font-mono font-bold text-[var(--app-muted)] uppercase tracking-wider block">
                  FACULTY RESPONSE
                </span>

                <textarea
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your explanation or answer for the student here..."
                  className="w-full p-3 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-xs font-mono text-[var(--app-text)] outline-none focus:border-[var(--app-brand)] transition-colors resize-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleSendResponse}
                    disabled={isSubmitting || !responseText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[var(--app-brand)] text-white font-mono text-xs font-extrabold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{isSubmitting ? 'Submitting...' : 'Send Response to Student'}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[var(--app-surface)] border border-dashed border-[var(--app-border)] text-center text-xs font-mono text-[var(--app-muted)] space-y-2">
              <BadgeInfo className="w-10 h-10 mx-auto text-[var(--app-muted)] opacity-40" />
              <p>Select a student doubt from the list to view context and respond.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
