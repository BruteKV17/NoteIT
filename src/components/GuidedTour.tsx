/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PageId } from '../types';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector: string;
  pageId?: PageId;
  title: string;
  description: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    targetSelector: '[data-tour="dashboard-link"]',
    pageId: 'dashboard',
    title: 'Study Dashboard',
    description: 'Welcome to NoteIT! Track study activity, upcoming exams, streak points, and quick daily tasks at a glance.',
    preferredPlacement: 'right'
  },
  {
    id: 'capture-live',
    targetSelector: '[data-tour="capture-live"]',
    title: 'Capture Live Lectures',
    description: 'Record live audio in your classroom or upload audio/video files. NoteIT automatically generates structured notes, transcripts, quizzes & flashcards!',
    preferredPlacement: 'right'
  },
  {
    id: 'knowledge-studio',
    targetSelector: '[data-tour="knowledge-studio"]',
    pageId: 'knowledge-studio',
    title: 'Subject Map & Knowledge Graph',
    description: 'Visualize your entire subject curriculum in 3D concept maps and mind nodes for deep learning synthesis.',
    preferredPlacement: 'right'
  },
  {
    id: 'add-subject',
    targetSelector: '[data-tour="add-subject"]',
    pageId: 'academic-library',
    title: 'How to Make Subjects',
    description: 'Click "+ CREATE NEW SUBJECT" to organize your courses (e.g. Physics, Data Structures). All lectures and materials attach to their respective subject.',
    preferredPlacement: 'bottom'
  },
  {
    id: 'academic-library',
    targetSelector: '[data-tour="academic-library"]',
    pageId: 'academic-library',
    title: 'Academic Library',
    description: 'Store, search, and review all your textbooks, PDFs, lecture slides, and reference notes in one organized digital library.',
    preferredPlacement: 'right'
  },
  {
    id: 'quiz-mode',
    targetSelector: '[data-tour="quiz-mode"]',
    pageId: 'quiz-mode',
    title: 'Quiz Mode & Active Recall',
    description: 'Test your knowledge with AI-generated interactive quizzes, practice exams, and smart weak-topic revision drills.',
    preferredPlacement: 'right'
  },
  {
    id: 'ask-doubt',
    targetSelector: '[data-tour="ask-doubt"]',
    title: 'Ask Doubt AI Assistant',
    description: 'Stuck on a tricky formula or complex topic? Click here anytime to ask AI questions with instant step-by-step explanations.',
    preferredPlacement: 'right'
  },
  {
    id: 'rewards',
    targetSelector: '[data-tour="rewards"]',
    pageId: 'rewards',
    title: 'Rewards & XP System',
    description: 'Earn XP points by completing lectures, maintaining daily study streaks, and passing quizzes. Level up and redeem rewards!',
    preferredPlacement: 'right'
  }
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  steps?: TourStep[];
  theme?: 'light' | 'dark';
}

interface PositionState {
  popoverStyle: React.CSSProperties;
  targetRect: DOMRect | null;
  arrowPlacement: 'top' | 'bottom' | 'left' | 'right';
}

export default function GuidedTour({
  isOpen,
  onClose,
  activePage,
  setActivePage,
  steps = DEFAULT_TOUR_STEPS,
  theme = 'light'
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [posState, setPosState] = useState<PositionState>({
    popoverStyle: { opacity: 0, pointerEvents: 'none' },
    targetRect: null,
    arrowPlacement: 'bottom'
  });
  const [targetFound, setTargetFound] = useState(true);

  const currentStep = steps[currentStepIndex];

  // Auto-switch page if current step specifies a required page
  useEffect(() => {
    if (!isOpen || !currentStep) return;
    if (currentStep.pageId && activePage !== currentStep.pageId) {
      setActivePage(currentStep.pageId);
    }
  }, [isOpen, currentStepIndex, currentStep, activePage, setActivePage]);

  // Measure target DOM element and calculate popover position
  const calculatePosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const targetEl = document.querySelector(currentStep.targetSelector);
    if (!targetEl) {
      setTargetFound(false);
      // Fallback center position if element is temporarily missing
      setPosState({
        popoverStyle: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999
        },
        targetRect: null,
        arrowPlacement: 'bottom'
      });
      return;
    }

    setTargetFound(true);
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    const rect = targetEl.getBoundingClientRect();
    const popoverWidth = 320;
    const popoverHeight = 200; // estimated max height
    const margin = 14;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let arrowPlacement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

    const preferred = currentStep.preferredPlacement || 'auto';

    // Decide placement based on space & preference
    if (preferred === 'right' && rect.right + popoverWidth + margin < viewportWidth) {
      left = rect.right + margin;
      top = rect.top + rect.height / 2 - popoverHeight / 2;
      arrowPlacement = 'left';
    } else if (preferred === 'left' && rect.left - popoverWidth - margin > 0) {
      left = rect.left - popoverWidth - margin;
      top = rect.top + rect.height / 2 - popoverHeight / 2;
      arrowPlacement = 'right';
    } else if (rect.top > popoverHeight + margin) {
      top = rect.top - popoverHeight - margin;
      left = rect.left + rect.width / 2 - popoverWidth / 2;
      arrowPlacement = 'bottom';
    } else {
      top = rect.bottom + margin;
      left = rect.left + rect.width / 2 - popoverWidth / 2;
      arrowPlacement = 'top';
    }

    // Boundary containment checks
    left = Math.max(16, Math.min(viewportWidth - popoverWidth - 16, left));
    top = Math.max(16, Math.min(viewportHeight - popoverHeight - 16, top));

    setPosState({
      popoverStyle: {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 9999
      },
      targetRect: rect,
      arrowPlacement
    });
  }, [isOpen, currentStep]);

  // Recalculate position on resize, scroll, or step change
  useEffect(() => {
    if (!isOpen) return;

    // Initial calculation with slight delay for dynamic page updates
    const timer = setTimeout(calculatePosition, 100);
    const interval = setInterval(calculatePosition, 500);

    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isOpen, currentStepIndex, calculatePosition]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('noteit_guided_tour_completed', 'true');
    onClose();
  };

  const handleFinish = () => {
    localStorage.setItem('noteit_guided_tour_completed', 'true');
    onClose();
  };

  if (!isOpen || !currentStep) return null;

  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <>
      {/* 1. DIMMED SPOTLIGHT OVERLAY */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-[9990] transition-opacity duration-300 pointer-events-auto"
        onClick={handleSkip}
      />

      {/* 2. TARGET ELEMENT SPOTLIGHT HIGHLIGHT FRAME */}
      {posState.targetRect && (
        <div
          className="fixed pointer-events-none rounded-xl ring-4 ring-[#2F6BFF] ring-offset-2 border-2 border-blue-400 z-[9995] shadow-[0_0_30px_rgba(47,107,255,0.7)] transition-all duration-300 ease-out animate-pulse"
          style={{
            top: `${posState.targetRect.top - 4}px`,
            left: `${posState.targetRect.left - 4}px`,
            width: `${posState.targetRect.width + 8}px`,
            height: `${posState.targetRect.height + 8}px`
          }}
        />
      )}

      {/* 3. STUDYTAB-INSPIRED GUIDING POPOVER CARD */}
      <div
        style={posState.popoverStyle}
        className="select-none animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="relative bg-white dark:bg-[#1C2128] text-gray-900 dark:text-white rounded-2xl p-5 shadow-2xl border border-gray-100 dark:border-gray-800">
          
          {/* Top Header: Step Indicator Dots (StudyTab Style) */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {steps.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                return (
                  <span
                    key={step.id}
                    className={`transition-all duration-300 ${
                      isActive
                        ? 'h-1.5 w-6 rounded-full bg-[#2F6BFF]'
                        : 'h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                );
              })}
            </div>

            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
              title="Close Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5 mb-5">
            <h3 className="font-heading font-extrabold text-base md:text-lg text-gray-900 dark:text-white tracking-tight leading-snug">
              {currentStep.title}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-1 py-1"
            >
              Skip
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="bg-[#2F6BFF] hover:bg-[#255CD9] text-white rounded-full px-5 py-1.5 text-xs md:text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>{isLastStep ? 'Finish' : 'Next'}</span>
                {!isLastStep && <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
