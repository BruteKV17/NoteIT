import React, { useState } from 'react';
import { Flame, Zap, Award, Target, BookOpen } from 'lucide-react';
import { ExamRushSetup, ExamRushConfig } from './preparation/ExamRushSetup';
import { ExamRushWorkspace } from './preparation/ExamRushWorkspace';
import { PracticeBlitzWorkspace } from './preparation/PracticeBlitzWorkspace';
import { Quiz, QuizQuestion, Lecture, Note } from '../types';

interface PreparationModeViewProps {
  quizzes?: Quiz[];
  selectedQuizId?: string | null;
  setSelectedQuizId?: (id: string | null) => void;
  onUpdateQuizScore?: (id: string, score: number, scores?: { easy?: number; medium?: number; hard?: number }) => void;
  onAddQuestions?: (quizId: string, difficulty: 'easy' | 'medium' | 'hard', newQuestions: QuizQuestion[]) => void;
  theme?: 'light' | 'dark';
  lectures?: Lecture[];
  notes?: Note[];
  currentStreak?: number;
}

export default function PreparationModeView({
  quizzes = [],
  selectedQuizId = null,
  setSelectedQuizId = () => {},
  onUpdateQuizScore = () => {},
  onAddQuestions = () => {},
  theme = 'light',
  lectures = [],
  notes = [],
  currentStreak = 0
}: PreparationModeViewProps) {
  const [activeMode, setActiveMode] = useState<'exam_rush' | 'practice_blitz'>('exam_rush');
  const [activeExamConfig, setActiveExamConfig] = useState<ExamRushConfig | null>(null);

  // Auto-launch fullscreen exam rush environment if opened via new tab URL
  React.useEffect(() => {
    const isFullscreenMode = window.location.search.includes('mode=exam-rush-fullscreen');
    const savedConfigStr = sessionStorage.getItem('noteit_exam_rush_active_config');
    
    if (savedConfigStr && (isFullscreenMode || !activeExamConfig)) {
      try {
        const parsedConfig = JSON.parse(savedConfigStr);
        setActiveExamConfig(parsedConfig);
        
        // Trigger fullscreen mode
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {
        console.error('Failed to parse saved exam rush config', e);
      }
    }
  }, []);

  if (activeExamConfig) {
    return (
      <div className="fixed inset-0 z-[999999] h-screen w-screen overflow-y-auto bg-[#FAF7F5] dark:bg-[#120F10]">
        <ExamRushWorkspace
          config={activeExamConfig}
          lectures={lectures}
          notes={notes}
          onExit={() => {
            sessionStorage.removeItem('noteit_exam_rush_active_config');
            setActiveExamConfig(null);
            if (document.fullscreenElement && document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* MODE TOGGLE SWITCHER - CALM ACADEMIC DEEP RED */}
      <div className="flex items-center justify-center">
        <div className="p-1.5 bg-[#191416] rounded-2xl border border-[#3D282C] shadow-sm flex items-center gap-1.5 font-sans">
          <button
            type="button"
            onClick={() => setActiveMode('exam_rush')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'exam_rush'
                ? 'bg-[#8F1D2C] text-white shadow-sm font-extrabold'
                : 'text-[#A3989B] hover:text-white'
            }`}
          >
            <Flame className="h-4 w-4 fill-current" />
            <span>🚨 EXAM RUSH</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('practice_blitz')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'practice_blitz'
                ? 'bg-[#8F1D2C] text-white shadow-sm font-extrabold'
                : 'text-[#A3989B] hover:text-white'
            }`}
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>⚡ PRACTICE BLITZ</span>
          </button>
        </div>
      </div>

      {/* MODE CONTENT AREA */}
      {activeMode === 'exam_rush' ? (
        <ExamRushSetup
          onStartExamRush={(config) => setActiveExamConfig(config)}
          theme={theme}
        />
      ) : (
        <PracticeBlitzWorkspace
          lectures={lectures}
          notes={notes}
          quizzes={quizzes}
          selectedQuizId={selectedQuizId}
          setSelectedQuizId={setSelectedQuizId}
          onUpdateQuizScore={onUpdateQuizScore}
          onAddQuestions={onAddQuestions}
          theme={theme}
        />
      )}

    </div>
  );
}
