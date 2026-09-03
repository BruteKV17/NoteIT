import React, { useState } from 'react';
import { 
  Zap, 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  Check, 
  ArrowRight, 
  Target,
  GraduationCap
} from 'lucide-react';
import { CanonicalSubject, searchCanonicalSubjects, CANONICAL_SUBJECTS } from '../../utils/subjectCanonicalizer';
import { Lecture, Quiz, Note } from '../../types';
import QuizView from '../QuizView';

interface PracticeBlitzWorkspaceProps {
  lectures?: Lecture[];
  notes?: Note[];
  quizzes?: Quiz[];
  selectedQuizId?: string | null;
  setSelectedQuizId?: (id: string | null) => void;
  onUpdateQuizScore?: (id: string, score: number, scores?: { easy?: number; medium?: number; hard?: number }) => void;
  onAddQuestions?: (quizId: string, difficulty: 'easy' | 'medium' | 'hard', newQuestions: any[]) => void;
  theme?: 'light' | 'dark';
}

export function PracticeBlitzWorkspace({
  lectures = [],
  notes = [],
  quizzes = [],
  selectedQuizId = null,
  setSelectedQuizId = () => {},
  onUpdateQuizScore = () => {},
  onAddQuestions = () => {},
  theme = 'light'
}: PracticeBlitzWorkspaceProps) {
  const [selectedSubject, setSelectedSubject] = useState<CanonicalSubject>(CANONICAL_SUBJECTS[0]);
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);
  const [practiceType, setPracticeType] = useState<'quiz' | 'concept' | 'subjective' | 'application' | 'mixed' | 'weak'>('quiz');
  const [activeSession, setActiveSession] = useState<boolean>(false);

  const filteredLectures = lectures.filter(l => 
    !l.subject || l.subject.toLowerCase().includes(selectedSubject.canonicalName.toLowerCase()) ||
    selectedSubject.aliases.some(a => (l.subject || '').toLowerCase().includes(a.toLowerCase()))
  );

  const toggleLectureSelection = (id: string) => {
    setSelectedLectureIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (activeSession && practiceType === 'quiz') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setActiveSession(false)}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold hover:bg-slate-100 cursor-pointer flex items-center gap-1.5"
        >
          ← Back to Practice Blitz Setup
        </button>

        <QuizView
          quizzes={quizzes}
          selectedQuizId={selectedQuizId}
          setSelectedQuizId={setSelectedQuizId}
          onUpdateQuizScore={onUpdateQuizScore}
          onAddQuestions={onAddQuestions}
          theme={theme}
          lectures={lectures}
          notes={notes}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left animate-fade-in">
      
      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl border-2 border-black dark:border-slate-700 bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#1E293B] text-white shadow-2xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFC400] text-black border border-black rounded-lg text-xs font-mono font-black uppercase tracking-wider shadow-sm">
          <Zap className="h-4 w-4 fill-black" />
          <span>PRACTICE BLITZ MODE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-heading">
          Adaptive Lecture Practice & Revision
        </h2>
        <p className="text-xs sm:text-sm text-slate-200 font-bold max-w-2xl leading-relaxed">
          Master your regular coursework lecture by lecture. Select your subject and target lectures to generate adaptive quizzes, subjective challenges, and weak-topic reinforcement.
        </p>
      </div>

      {/* SETUP FORM */}
      <div className="p-6 sm:p-8 rounded-3xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] shadow-paper-lg space-y-6">
        
        {/* 1. SELECT SUBJECT */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-slate-200 block">
            1. Target Subject
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CANONICAL_SUBJECTS.slice(0, 6).map((subj) => {
              const isSelected = selectedSubject.subjectId === subj.subjectId;
              return (
                <button
                  key={subj.subjectId}
                  type="button"
                  onClick={() => setSelectedSubject(subj)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-black bg-[#2563EB] text-white shadow-paper-xs font-bold'
                      : 'border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0D1117] text-black dark:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-extrabold block truncate">{subj.canonicalName}</span>
                  <span className={`text-[10px] font-mono block mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{subj.subjectId}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SELECT LECTURE(S) */}
        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-slate-200 flex items-center justify-between">
            <span>2. Select Lecture(s) ({selectedLectureIds.length} selected)</span>
            <span className="text-[10px] text-slate-400 font-bold">Multi-Select Supported</span>
          </label>

          {filteredLectures.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs font-mono text-slate-400">
              No recorded lectures found for {selectedSubject.canonicalName}. Practice will use AI knowledge base.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
              {filteredLectures.map((lec) => {
                const isSelected = selectedLectureIds.includes(lec.id);
                return (
                  <button
                    key={lec.id}
                    type="button"
                    onClick={() => toggleLectureSelection(lec.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-black bg-[#FFC400]/20 dark:bg-amber-400/10 border-2 border-black dark:border-amber-400'
                        : 'border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0D1117]'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-black dark:text-white truncate pr-2">{lec.title}</span>
                    {isSelected && <Check className="h-4 w-4 text-[#2563EB] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. PRACTICE TYPE */}
        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-slate-200 block">
            3. Practice Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'quiz', label: '⚡ Adaptive Quiz', desc: 'Interactive MCQs' },
              { id: 'concept', label: '💡 Concept Mastery', desc: 'Core explanations' },
              { id: 'subjective', label: '📝 Subjective Practice', desc: 'Detailed answers' },
              { id: 'application', label: '⚙️ Application', desc: 'Problem solving' },
              { id: 'mixed', label: '🎯 Mixed Blitz', desc: 'All formats' },
              { id: 'weak', label: '🔍 Weak Topic Fix', desc: 'Targeted drill' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPracticeType(p.id as any)}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  practiceType === p.id
                    ? 'border-black bg-[#2563EB] text-white shadow-paper-xs font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0D1117] text-black dark:text-slate-200'
                }`}
              >
                <div className="text-xs font-extrabold block">{p.label}</div>
                <div className={`text-[10px] block mt-0.5 ${practiceType === p.id ? 'text-blue-100' : 'text-slate-500'}`}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* START BUTTON */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveSession(true)}
            className="w-full py-4 px-6 rounded-2xl border-2 border-black bg-[#2563EB] hover:bg-blue-700 text-white font-heading text-sm font-black uppercase tracking-wider shadow-paper hover:shadow-paper-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="h-5 w-5 fill-white" />
            <span>START PRACTICE BLITZ</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
