/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Mic,
  Star,
  Play,
  FileText,
  Clock,
  Radio
} from 'lucide-react';
import { PageId, Lecture, WeakTopic, Note } from '../types';
import { Button, Card, Badge, SectionHeader } from './bauhaus';

interface DashboardViewProps {
  setActivePage: (page: PageId) => void;
  setSelectedQuizId: (quizId: string) => void;
  lectures: Lecture[];
  weakTopics: WeakTopic[];
  onNewAnalysis: () => void;
  onOpenLecture: (lectureId: string) => void;
  theme: 'light' | 'dark';
  notes?: Note[];
  totalXp?: number;
  currentStreak?: number;
}

export default function DashboardView({
  setActivePage,
  setSelectedQuizId,
  lectures,
  weakTopics,
  onNewAnalysis,
  onOpenLecture,
  theme,
  notes = [],
  totalXp = 2450,
  currentStreak = 0
}: DashboardViewProps) {
  
  // Quick navigation helpers
  const handleStartRecording = () => {
    setActivePage('lecture-capture');
  };

  const handleOpenLibrary = () => {
    setActivePage('academic-library');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* 1. BAUHAUS EDITORIAL HERO CALLOUT BANNER (Matching Stitch Mockup 3) */}
      <div className="relative rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 md:p-10 shadow-paper-lg flex flex-col justify-between overflow-hidden">
        
        {/* Yellow Decorative Callout Accent Box */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC400] opacity-15 rotate-12 -translate-y-8 translate-x-8 border-2 border-[var(--border-main)] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Badge variant="yellow" size="md" icon={<Sparkles className="h-3.5 w-3.5" />}>
              NOTE-IT AI SUITE • CORE
            </Badge>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[var(--text-primary)] leading-none uppercase">
            AI THAT THINKS <br />
            <span className="bg-[#FFC400] text-[#111111] px-2 py-0.5 border-2 border-[var(--border-main)] shadow-paper-sm inline-block mt-1">
              WHILE YOU LEARN.
            </span>
          </h1>

          <p className="text-sm md:text-base font-medium text-[var(--text-secondary)] leading-relaxed max-w-2xl border-l-4 border-[#FFC400] pl-3 py-1">
            Record classroom lectures and instantly generate notes, summaries, quizzes, flashcards, and personalized revision plans with persistent AI memory.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleStartRecording}
              className="w-full sm:w-auto bg-[#2F6BFF] text-white hover:bg-[#255cd9] border-2 border-[var(--border-main)] shadow-paper-md"
              icon={<Mic className="h-4.5 w-4.5 text-white animate-pulse" />}
            >
              Start Recording Lecture
            </Button>
            
            <Button
              variant="tertiary"
              size="lg"
              onClick={handleOpenLibrary}
              className="w-full sm:w-auto border-2 border-[var(--border-main)] shadow-paper-md"
              icon={<BookOpen className="h-4 w-4 text-[var(--text-primary)]" />}
            >
              Open Academic Library
            </Button>
          </div>
        </div>
      </div>



      {/* 3. COGNITIVE RECENT LECTURES MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD A: Today's Lectures */}
        <Card shadow="md" className="p-5 flex flex-col justify-between h-[300px] bg-[var(--card-bg)] border-2 border-[var(--border-main)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-2">
              <span className="section-label text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                TODAY'S LECTURES
              </span>
              <Badge variant="red" size="sm" icon={<Radio className="w-3 h-3 animate-pulse" />}>
                LIVE NOW
              </Badge>
            </div>
            <h3 className="font-heading text-base font-bold text-[var(--text-primary)] uppercase tracking-tight">
              AI & Neural Optimizations
            </h3>
            <div className="p-3 bg-[var(--panel-bg)] rounded-[4px] border-2 border-[var(--border-main)] text-xs text-[var(--text-primary)] font-mono">
              <span className="font-bold block text-[#38BDF8]">Advanced Computer Science</span>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-3 leading-snug">
                Adaptive Momentum (Adam) derivations, matrix jacobians, and loss surface optimization.
              </p>
            </div>
          </div>

          <Button
            variant="tertiary"
            size="sm"
            fullWidth
            onClick={() => setActivePage('lecture-capture')}
            icon={<ArrowRight className="h-3.5 w-3.5" />}
            iconPosition="right"
          >
            Join Live Stream
          </Button>
        </Card>

        {/* CARD B: Recent Recordings */}
        <Card shadow="md" className="p-5 flex flex-col justify-between h-[300px] bg-[var(--card-bg)] border-2 border-[var(--border-main)]">
          <div className="space-y-2">
            <div className="border-b-2 border-[var(--border-main)] pb-2">
              <span className="section-label text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                RECENT RECORDINGS
              </span>
            </div>
            <h3 className="font-heading text-base font-bold text-[var(--text-primary)] uppercase tracking-tight">
              BioGenetics Lecture L04
            </h3>
            <p className="text-[11px] font-mono text-[var(--text-secondary)]">
              Synced: 2 hours ago • 42 mins
            </p>

            {/* Industrial Audio Waveform visualization */}
            <div className="h-12 flex items-center gap-1 justify-center bg-[var(--panel-bg)] rounded-[4px] px-3 border-2 border-[var(--border-main)]">
              {[24, 12, 32, 16, 8, 36, 14, 28, 10, 34, 12, 24, 18, 32, 14].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}px` }}
                  className="w-[4px] bg-[var(--text-primary)] rounded-none"
                />
              ))}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => setActivePage('academic-library')}
            icon={<Play className="h-3.5 w-3.5 fill-current" />}
          >
            Play Synced Audio
          </Button>
        </Card>

        {/* CARD C: Continue Session */}
        <Card shadow="md" className="p-5 flex flex-col justify-between h-[300px] bg-[var(--card-bg)] border-2 border-[var(--border-main)]">
          <div className="space-y-2">
            <div className="border-b-2 border-[var(--border-main)] pb-2">
              <span className="section-label text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                CONTINUE SESSION
              </span>
            </div>
            <h3 className="font-heading text-base font-bold text-[var(--text-primary)] uppercase tracking-tight">
              Quantum Mechanics
            </h3>
            <p className="text-[11px] font-mono text-[var(--text-secondary)]">
              Weak Topic Focus: Wavefunctions
            </p>

            <div className="p-2.5 rounded-[4px] bg-[var(--hover-bg)] border-2 border-[var(--border-main)] text-xs font-mono font-bold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#FFC400] shrink-0" />
              <span>Target 75%+ retention in Quiz Mode.</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => setActivePage('quiz-mode')}
            icon={<GraduationCap className="h-4 w-4" />}
          >
            Continue Study Mode
          </Button>
        </Card>

        {/* CARD D: Pinned Notes */}
        <Card shadow="md" className="p-5 flex flex-col justify-between h-[300px] bg-white border-2 border-[#111111]">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
              <span className="section-label text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                PINNED NOTES
              </span>
              <Star className="h-4 w-4 text-[#FFC400] fill-[#FFC400]" />
            </div>

            {notes.length > 0 ? (
              <>
                <h3 className="font-heading text-base font-bold text-[#111111] uppercase tracking-tight truncate">
                  {notes[0].title}
                </h3>
                <p className="text-[10px] font-mono text-[#666666]">
                  Synced: {notes[0].updatedAt?.seconds 
                    ? new Date(notes[0].updatedAt.seconds * 1000).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Recently'}
                </p>

                <div className="p-2.5 bg-[#F6F2EA] rounded-[4px] border-2 border-[#111111] text-[11px] font-mono text-[#111111] line-clamp-2">
                  "{notes[0].content}"
                </div>
              </>
            ) : (
              <>
                <h3 className="font-heading text-base font-bold text-[#111111] uppercase tracking-tight">
                  No Pinned Notes
                </h3>
                <p className="text-[10px] font-mono text-[#666666]">Workspace empty</p>
                <div className="p-2.5 bg-[#F6F2EA] rounded-[4px] border-2 border-[#111111] text-[11px] font-mono text-[#666666] italic">
                  Take notes in Research Hub to sync here automatically.
                </div>
              </>
            )}
          </div>

          <Button
            variant="tertiary"
            size="sm"
            fullWidth
            onClick={() => setActivePage('research-hub')}
            icon={<FileText className="h-3.5 w-3.5" />}
          >
            {notes.length > 0 ? 'Read Notes' : 'Create Note'}
          </Button>
        </Card>

      </div>

    </div>
  );
}
