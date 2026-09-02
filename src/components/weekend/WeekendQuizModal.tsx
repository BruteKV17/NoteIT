/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Trophy, 
  Flame, 
  RotateCcw 
} from 'lucide-react';
import { WeekendQuizQuestion } from '../../services/weekendQuizService';
import { Button, Badge, Card } from '../bauhaus';

interface WeekendQuizModalProps {
  questions: WeekendQuizQuestion[];
  onComplete: (score: number) => Promise<void>;
  onClose: () => void;
  dayLabel?: 'Saturday' | 'Sunday' | string;
  isAlreadyCompleted?: boolean;
  previousScore?: number;
  currentStreak?: number;
  theme?: 'light' | 'dark';
}

export default function WeekendQuizModal({
  questions,
  onComplete,
  onClose,
  dayLabel = 'Saturday',
  isAlreadyCompleted = false,
  previousScore = 0,
  currentStreak = 6,
  theme = 'dark'
}: WeekendQuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(isAlreadyCompleted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewMistakes, setShowReviewMistakes] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (idx: number) => {
    if (isAnswerRevealed || isFinished) return;
    setSelectedOption(idx);
    setIsAnswerRevealed(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setUserAnswers(prev => [...prev, idx]);
  };

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      // Quiz finished
      setIsSubmitting(true);
      try {
        await onComplete(score + (selectedOption === currentQ.correctIndex ? 1 : 0));
      } catch (err) {
        console.warn('Error completing weekend quiz:', err);
      } finally {
        setIsSubmitting(false);
        setIsFinished(true);
      }
    }
  };

  const finalScore = isAlreadyCompleted ? previousScore : score;

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-[4px] animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[var(--card-bg)] border-3 border-[var(--border-main)] rounded-[16px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-[var(--text-primary)] overflow-visible">
        
        {/* Floating Top Broot Mascot */}
        <div className="absolute -top-12 -right-4 z-20 pointer-events-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
          <img
            src={isFinished ? '/mascots/broot-celebrating-confetti.png' : '/mascots/broot-peace-wink.png'}
            alt="Broot Mascot"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain animate-bounce"
          />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Badge variant="yellow" size="sm" icon={<Flame className="h-3.5 w-3.5 fill-[#111111]" />}>
              🔥 WEEKEND CHALLENGE
            </Badge>
            <span className="font-mono text-xs font-bold text-[var(--text-secondary)] uppercase">
              {dayLabel} REVISION
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-[4px] border border-[var(--border-main)] hover:bg-[#FF4D4D] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isFinished ? (
          /* Active Question Flow */
          <div className="space-y-6">
            
            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs font-extrabold text-[var(--text-primary)] uppercase">
                <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
                <span className="text-[#FFC400] font-black">{currentQ.subject}</span>
              </div>

              <div className="w-full h-3 rounded-[4px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] p-[2px] overflow-hidden">
                <div
                  className="h-full rounded-[2px] bg-[#FFC400] transition-all duration-300 shadow-[0_0_10px_rgba(255,196,0,0.5)]"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="p-4 rounded-[8px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-secondary)]">
                  {currentQ.difficulty.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border border-[var(--border-main)] bg-[var(--card-bg)] text-[#FFC400]">
                  {currentQ.type.toUpperCase()}
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[var(--text-primary)] leading-snug uppercase">
                {currentQ.question}
              </h3>
            </div>

            {/* Option Choices */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = 'border-2 border-[var(--border-main)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:border-[#FFC400]';
                if (isAnswerRevealed) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = 'border-3 border-[#19B56B] bg-[#19B56B]/15 text-[var(--text-primary)] font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'border-3 border-[#FF4D4D] bg-[#FF4D4D]/15 text-[var(--text-primary)]';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerRevealed}
                    className={`w-full p-3.5 rounded-[8px] font-mono text-xs text-left font-bold transition-all flex items-center justify-between cursor-pointer select-none ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-[var(--border-main)] flex items-center justify-center font-extrabold text-[11px] bg-[var(--panel-bg)] shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswerRevealed && idx === currentQ.correctIndex && (
                      <CheckCircle2 className="h-5 w-5 text-[#19B56B] shrink-0" />
                    )}
                    {isAnswerRevealed && idx === selectedOption && idx !== currentQ.correctIndex && (
                      <XCircle className="h-5 w-5 text-[#FF4D4D] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation Box */}
            {isAnswerRevealed && (
              <div className="p-3.5 rounded-[8px] border-2 border-[var(--border-main)] bg-[#101F38] text-white font-mono text-xs space-y-1 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-extrabold text-[#FFC400]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>EXPLANATION</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Next Action Button */}
            {isAnswerRevealed && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm px-6"
                  icon={<ArrowRight className="h-4 w-4 text-[#111111]" />}
                >
                  {currentIndex === questions.length - 1 ? 'FINISH CHALLENGE 🎉' : 'NEXT QUESTION →'}
                </Button>
              </div>
            )}

          </div>
        ) : (
          /* Completion Screen */
          <div className="space-y-6 text-center py-4">
            
            <div className="space-y-2">
              <Badge variant="yellow" size="md" icon={<Sparkles className="h-4 w-4" />}>
                CHALLENGE COMPLETED
              </Badge>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl uppercase text-[var(--text-primary)]">
                WEEKEND CHALLENGE COMPLETE! 🎉
              </h2>
              <p className="font-mono text-xs text-[var(--text-secondary)]">
                Your streak is protected for {dayLabel}! Great job revising your lecture topics.
              </p>
            </div>

            {/* Score & XP Rewards Summary */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-[12px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)]">
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase">FINAL SCORE</div>
                <div className="font-heading font-extrabold text-2xl text-[var(--text-primary)]">{finalScore} / {questions.length}</div>
              </div>

              <div className="space-y-1 border-x-2 border-[var(--border-main)]">
                <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase">BONUS EARNED</div>
                <div className="font-heading font-extrabold text-2xl text-[#FFC400]">+50 XP</div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase">STREAK PROTECTED</div>
                <div className="font-heading font-extrabold text-2xl text-[#FF4D4D] flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5 fill-[#FF4D4D]" />
                  <span>{currentStreak} DAYS</span>
                </div>
              </div>
            </div>

            {/* Mistakes Review Accordion */}
            {showReviewMistakes && (
              <div className="max-h-60 overflow-y-auto space-y-3 text-left p-3 rounded-[8px] border-2 border-[var(--border-main)] bg-[var(--card-bg)]">
                <h4 className="font-heading font-bold text-xs uppercase text-[var(--text-primary)]">REVIEW ALL QUESTIONS</h4>
                {questions.map((q, idx) => (
                  <div key={idx} className="p-2.5 rounded border border-[var(--border-main)] bg-[var(--panel-bg)] font-mono text-xs space-y-1">
                    <div className="font-bold text-[var(--text-primary)]">{idx + 1}. {q.question}</div>
                    <div className="text-[#19B56B] font-semibold">✓ Correct: {q.options[q.correctIndex]}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{q.explanation}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="tertiary"
                size="md"
                onClick={() => setShowReviewMistakes(!showReviewMistakes)}
                className="border-2 border-[var(--border-main)] font-bold text-xs uppercase"
              >
                {showReviewMistakes ? 'Hide Review' : 'Review Mistakes'}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                className="bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm px-8 uppercase"
              >
                CONTINUE →
              </Button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
