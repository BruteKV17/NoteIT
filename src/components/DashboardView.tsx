/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Mic, 
  Flame, 
  Zap 
} from 'lucide-react';
import { PageId, Lecture, WeakTopic, Note } from '../types';
import { Button, Badge } from './bauhaus';

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
  currentStreak = 6
}: DashboardViewProps) {
  
  // Quick navigation helpers
  const handleStartRecording = () => {
    setActivePage('lecture-capture');
  };

  const handleOpenLibrary = () => {
    setActivePage('academic-library');
  };

  const streak = currentStreak && currentStreak > 0 ? currentStreak : 6;
  const progressPercent = Math.min(100, Math.max(1, Math.round((streak / 90) * 100)));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* 1. BAUHAUS EDITORIAL HERO CALLOUT BANNER WITH CUTE 3D MASCOT */}
      <div className="relative rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 md:p-10 shadow-paper-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        
        {/* Yellow Decorative Callout Accent Box */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFC400] opacity-15 rotate-12 -translate-y-8 translate-x-8 border-2 border-[var(--border-main)] pointer-events-none" />

        {/* Left Side: Content & Actions */}
        <div className="relative z-10 max-w-2xl space-y-4">
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

        {/* Right Side: 3D Blue Mascot with Headphones */}
        <div className="relative z-10 shrink-0 mt-6 md:mt-0 flex flex-col items-center justify-center">
          <div className="relative group flex flex-col items-center">
            {/* Friendly Mascot Speech Bubble */}
            <div className="mb-2 px-3.5 py-1.5 rounded-full bg-[#FFC400] text-[#111111] border-2 border-[var(--border-main)] font-mono text-xs font-extrabold uppercase shadow-paper-xs animate-bounce flex items-center gap-1.5 z-20">
              <span>Hey! Ready to learn? 🎧</span>
            </div>

            {/* Ambient Glow Accent */}
            <div className="absolute -inset-4 rounded-full bg-[#FFC400]/25 blur-2xl group-hover:bg-[#FFC400]/45 transition-all pointer-events-none" />

            <img
              src="/mascots/mascot-hero-blue.png"
              alt="NoteIT Blue AI Mascot"
              className="w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72 object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.35)] transform group-hover:scale-105 transition-transform duration-300 pointer-events-none"
            />
          </div>
        </div>

      </div>

      {/* 2. 90-DAY XP PROGRESS BAR CARD (PLACED JUST BELOW THE MAIN CARD) */}
      <div 
        onClick={() => setActivePage('rewards')}
        className="rounded-[6px] border-2 border-[var(--border-main)] bg-[#0C172C] p-4 md:p-5 shadow-paper-md hover:border-[#FFC400] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between font-mono text-xs md:text-sm font-extrabold tracking-wider mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-white uppercase tracking-widest">
              DAY {streak} / 90 PROGRESS
            </span>
          </div>
          <span className="text-[#19B56B] uppercase tracking-widest font-extrabold">
            {progressPercent}% COMPLETE
          </span>
        </div>

        {/* Recessed dark progress track matching exact screenshot layout */}
        <div className="h-4 sm:h-5 w-full rounded-[4px] border-2 border-[#1E2D4A] bg-[#070D1B] overflow-hidden p-[2px] relative shadow-inner">
          <div 
            className="h-full rounded-[2px] bg-[#FFC400] transition-all duration-500 shadow-[0_0_12px_rgba(255,196,0,0.6)]" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. DASHBOARD QUICK STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stat Card 1: Total XP */}
        <div 
          onClick={() => setActivePage('rewards')}
          className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm hover:border-[#FFC400] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              TOTAL XP BALANCE
            </div>
            <div className="text-2xl font-extrabold font-heading text-[#FFC400] mt-1 flex items-center gap-1.5">
              <Zap className="h-5 w-5 fill-[#FFC400]" />
              <span>{(totalXp || 2450).toLocaleString()} XP</span>
            </div>
          </div>
          <Badge variant="yellow" size="sm">LEVEL {Math.floor((totalXp || 2450) / 1000) + 1}</Badge>
        </div>

        {/* Stat Card 2: Current Streak */}
        <div 
          onClick={() => setActivePage('rewards')}
          className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm hover:border-[#FF4D4D] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              CURRENT STREAK
            </div>
            <div className="text-2xl font-extrabold font-heading text-[#FF4D4D] mt-1 flex items-center gap-1.5">
              <Flame className="h-5 w-5 fill-[#FF4D4D]" />
              <span>{streak} DAYS</span>
            </div>
          </div>
          <Badge variant="red" size="sm">ACTIVE</Badge>
        </div>

        {/* Stat Card 3: Lectures Recorded */}
        <div 
          onClick={() => setActivePage('academic-library')}
          className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm hover:border-[#2F6BFF] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              COURSE LECTURES
            </div>
            <div className="text-2xl font-extrabold font-heading text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
              <BookOpen className="h-5 w-5 text-[#2F6BFF]" />
              <span>{lectures.length} SAVED</span>
            </div>
          </div>
          <Badge variant="blue" size="sm">LIBRARY</Badge>
        </div>

      </div>

    </div>
  );
}

