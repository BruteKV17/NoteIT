/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Award, 
  HelpCircle, 
  Clock, 
  ArrowLeft, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  GraduationCap
} from 'lucide-react';
import { Quiz, QuizQuestion } from '../types';
import { generateAdditionalQuizQuestions } from '../services/gemini';
import BruteLoader from './BruteLoader';
import { Button, Card, Badge, SectionHeader } from './bauhaus';

interface QuizViewProps {
  quizzes: Quiz[];
  selectedQuizId: string | null;
  setSelectedQuizId: (id: string | null) => void;
  onUpdateQuizScore: (id: string, score: number, scores?: { easy?: number; medium?: number; hard?: number }) => void;
  onAddQuestions?: (quizId: string, difficulty: 'easy' | 'medium' | 'hard', newQuestions: QuizQuestion[]) => void;
  theme?: 'light' | 'dark';
}

export default function QuizView({
  quizzes,
  selectedQuizId,
  setSelectedQuizId,
  onUpdateQuizScore,
  onAddQuestions,
  theme = 'light'
}: QuizViewProps) {
  
  // Game states
  const [activeDifficulty, setActiveDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // New detailed states
  const [attemptedQuestionIds, setAttemptedQuestionIds] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [difficultyCompleted, setDifficultyCompleted] = useState<'easy' | 'medium' | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [sessionScores, setSessionScores] = useState<Record<'easy' | 'medium' | 'hard', { attempted: number; correct: number }>>({
    easy: { attempted: 0, correct: 0 },
    medium: { attempted: 0, correct: 0 },
    hard: { attempted: 0, correct: 0 }
  });

  // Find active quiz
  const activeQuiz = quizzes.find(q => q.id === selectedQuizId);

  // Fallback splitting logic if easy/medium/hard lists are missing
  let easyQ = activeQuiz?.easyQuestions || [];
  let mediumQ = activeQuiz?.mediumQuestions || [];
  let hardQ = activeQuiz?.hardQuestions || [];

  if (activeQuiz && activeQuiz.questions.length > 0) {
    if (easyQ.length === 0) {
      easyQ = activeQuiz.questions;
    }
    if (mediumQ.length === 0) {
      mediumQ = activeQuiz.questions.map((q, idx) => ({
        ...q,
        id: `${q.id}-medium-${idx}`,
        question: `[Medium] ${q.question}`,
        explanation: q.explanation || 'Medium difficulty conceptual application review.',
        sourceCitation: q.sourceCitation || `[Source: ${activeQuiz.title}, Chapter 2]`
      }));
    }
    if (hardQ.length === 0) {
      hardQ = activeQuiz.questions.map((q, idx) => ({
        ...q,
        id: `${q.id}-hard-${idx}`,
        question: `[Hard] ${q.question}`,
        explanation: q.explanation || 'Hard difficulty advanced derivation check.',
        sourceCitation: q.sourceCitation || `[Source: ${activeQuiz.title}, Appendix A]`
      }));
    }
  }

  const questionsList = activeDifficulty === 'easy' 
    ? easyQ 
    : (activeDifficulty === 'medium' ? mediumQ : hardQ);

  const activeQuestions = questionsList.filter(q => !attemptedQuestionIds.includes(q.id));
  const currentQuestion = activeQuestions[0];

  const startQuizGameplay = (id: string, difficulty: 'easy' | 'medium' | 'hard' = 'easy') => {
    setSelectedQuizId(id);
    setActiveDifficulty(difficulty);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerRevealed(false);
    setIsQuizFinished(false);
    setAttemptedQuestionIds([]);
    setUserAnswers({});
    setDifficultyCompleted(null);
    setShowReview(false);
    setSessionScores({
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 }
    });
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerRevealed) return;
    setSelectedAnswerIndex(index);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswerIndex === null || !currentQuestion || !activeQuiz) return;
    setIsAnswerRevealed(true);

    const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswerIndex;

    setSessionScores(prev => ({
      ...prev,
      [activeDifficulty]: {
        attempted: prev[activeDifficulty].attempted + 1,
        correct: prev[activeDifficulty].correct + (isCorrect ? 1 : 0)
      }
    }));

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) return;

    setAttemptedQuestionIds(prev => [...prev, currentQuestion.id]);
    setSelectedAnswerIndex(null);
    setIsAnswerRevealed(false);

    const remaining = activeQuestions.slice(1);
    if (remaining.length === 0) {
      if (activeDifficulty === 'easy' && mediumQ.length > 0) {
        setDifficultyCompleted('easy');
      } else if (activeDifficulty === 'medium' && hardQ.length > 0) {
        setDifficultyCompleted('medium');
      } else {
        setIsQuizFinished(true);
        if (activeQuiz) {
          const score = Math.round((sessionScores.easy.correct + sessionScores.medium.correct + sessionScores.hard.correct) / Math.max(1, (sessionScores.easy.attempted + sessionScores.medium.attempted + sessionScores.hard.attempted)) * 100);
          onUpdateQuizScore(activeQuiz.id, score);
        }
      }
    }
  };

  const resetQuizUniverse = () => {
    setSelectedQuizId(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerRevealed(false);
    setIsQuizFinished(false);
    setAttemptedQuestionIds([]);
    setUserAnswers({});
    setDifficultyCompleted(null);
    setShowReview(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* Loader Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-[#111111]/70 backdrop-blur-[2px] flex items-center justify-center z-50">
          <BruteLoader size="lg" message={`Generating additional ${activeDifficulty} questions via Gemini...`} />
        </div>
      )}

      {/* Mode A: Available Quizzes selection list */}
      {!selectedQuizId || !activeQuiz ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-[6px] border-2 border-[#111111] bg-white p-6 shadow-paper-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="section-label text-[10px] font-bold text-[#666666] uppercase tracking-[3px] block">
                ACTIVE RETRIEVAL SYSTEM
              </span>
              <h1 className="font-heading font-extrabold text-2xl md:text-4xl text-[#111111] uppercase tracking-tight mt-1">
                INTERACTIVE QUIZ MODE
              </h1>
              <p className="text-xs font-mono text-[#666666] mt-1 border-l-4 border-[#FFC400] pl-3 py-1">
                Reinforce semantic core concepts mapped by AI from your uploaded files. Complete quizzes to raise your Topic Mastery scores.
              </p>
            </div>

            {/* Difficulty Tabs */}
            <div className="flex gap-1 p-1 bg-[#F6F2EA] rounded-[6px] border-2 border-[#111111] shrink-0">
              {(['easy', 'medium', 'hard'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setActiveDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-[4px] border-2 font-mono text-xs font-bold uppercase transition-all ${
                    activeDifficulty === diff
                      ? 'bg-[#FFC400] text-[#111111] border-[#111111] shadow-paper-sm font-extrabold'
                      : 'bg-white text-[#111111] border-transparent hover:bg-[#FFF8D6]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card shadow="sm" className="p-4 bg-white border-2 border-[#111111] flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#FFC400] border-2 border-[#111111] shadow-paper-sm flex items-center justify-center text-[#111111]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="section-label text-[10px] font-bold text-[#666666] block">AVERAGE MASTERY</span>
                <span className="font-mono text-lg font-bold text-[#111111]">84.5%</span>
              </div>
            </Card>

            <Card shadow="sm" className="p-4 bg-white border-2 border-[#111111] flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#19B56B] border-2 border-[#111111] shadow-paper-sm flex items-center justify-center text-white">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <span className="section-label text-[10px] font-bold text-[#666666] block">COMPLETED</span>
                <span className="font-mono text-lg font-bold text-[#111111]">4 / 7</span>
              </div>
            </Card>

            <Card shadow="sm" className="p-4 bg-white border-2 border-[#111111] flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#2F6BFF] border-2 border-[#111111] shadow-paper-sm flex items-center justify-center text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="section-label text-[10px] font-bold text-[#666666] block">REVIEW TIME</span>
                <span className="font-mono text-lg font-bold text-[#111111]">38 mins</span>
              </div>
            </Card>
          </div>

          {/* Quiz Cards */}
          <div className="space-y-3">
            <h3 className="section-label text-xs font-bold uppercase tracking-[3px] text-[#666666]">
              ACTIVE ACADEMIC QUIZZES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q) => (
                <Card
                  key={q.id}
                  shadow="md"
                  className="p-5 bg-white border-2 border-[#111111] flex flex-col justify-between h-full"
                >
                  <div className="space-y-3">
                    <Badge variant="blue" size="sm">
                      {q.topic || 'ACADEMIC'}
                    </Badge>
                    <h3 className="font-heading text-base font-bold text-[#111111] uppercase tracking-tight leading-snug">
                      {q.title}
                    </h3>
                    <p className="text-xs font-mono text-[#666666]">
                      {q.questions.length} questions available • {activeDifficulty.toUpperCase()} level
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t-2 border-[#111111] flex items-center justify-between">
                    <span className="font-mono text-xs text-[#666666] font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 10 mins
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startQuizGameplay(q.id, activeDifficulty)}
                    >
                      Start Quiz
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Mode B: Active Quiz Gameplay */
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="rounded-[6px] border-2 border-[#111111] bg-white p-4 shadow-paper-md flex items-center justify-between">
            <Button
              variant="tertiary"
              size="sm"
              onClick={resetQuizUniverse}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Exit Quiz
            </Button>
            <span className="font-heading text-sm font-bold uppercase tracking-tight text-[#111111]">
              {activeQuiz.title}
            </span>
            <Badge variant="yellow" size="sm">
              {activeDifficulty.toUpperCase()}
            </Badge>
          </div>

          {isQuizFinished ? (
            /* Quiz Completed Screen */
            (() => {
              const totalAttempted = sessionScores.easy.attempted + sessionScores.medium.attempted + sessionScores.hard.attempted;
              const totalCorrect = sessionScores.easy.correct + sessionScores.medium.correct + sessionScores.hard.correct;
              const totalAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
              return (
                <Card shadow="lg" className="p-8 bg-white border-2 border-[#111111] text-center space-y-6">
                  <div className="w-16 h-16 rounded-[6px] bg-[#FFC400] border-2 border-[#111111] shadow-paper-md flex items-center justify-center text-[#111111] mx-auto">
                    <GraduationCap className="w-8 h-8" />
                  </div>

                  <div>
                    <h2 className="font-heading text-2xl font-extrabold uppercase text-[#111111]">
                      QUIZ SESSION COMPLETE!
                    </h2>
                    <p className="text-xs font-mono text-[#666666] mt-1">
                      Concept retention score: <strong className="text-[#19B56B]">{totalAccuracy}%</strong>
                    </p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button variant="secondary" size="md" onClick={resetQuizUniverse}>
                      Back to Quiz List
                    </Button>
                  </div>
                </Card>
              );
            })()
          ) : currentQuestion ? (
            /* Active Question Card */
            /* Active Question Card */
            <Card shadow="lg" className="p-6 md:p-8 bg-white border-2 border-[#111111] space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-[#666666] border-b-2 border-[#111111] pb-2">
                  <span>QUESTION {attemptedQuestionIds.length + 1} OF {questionsList.length}</span>
                  <span className="bg-[#FFC400] text-[#111111] px-2 py-0.5 rounded-[3px] border border-[#111111]">
                    {activeDifficulty.toUpperCase()}
                  </span>
                </div>

                <h2 className="font-heading text-lg md:text-xl font-bold text-[#111111] uppercase leading-snug">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedAnswerIndex === idx;
                  const isCorrect = currentQuestion.correctAnswerIndex === idx;

                  let optionStyle = 'bg-white border-[#111111] hover:bg-[#FFF8D6]';
                  if (isSelected && !isAnswerRevealed) {
                    optionStyle = 'bg-[#FFC400] border-[#111111] font-bold shadow-paper-sm';
                  } else if (isAnswerRevealed) {
                    if (isCorrect) {
                      optionStyle = 'bg-[#19B56B]/20 border-[#19B56B] font-bold';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'bg-[#FF4D4D]/20 border-[#FF4D4D] font-bold';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerRevealed}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-[6px] border-2 text-xs md:text-sm font-medium transition-all text-left ${optionStyle}`}
                    >
                      <span className="w-6 h-6 rounded-[4px] bg-[#111111] text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        {letter}
                      </span>
                      <span className="text-[#111111] flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Reveal & Next buttons */}
              <div className="pt-4 border-t-2 border-[#111111] flex justify-between items-center">
                {!isAnswerRevealed ? (
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={selectedAnswerIndex === null}
                    onClick={handleCheckAnswer}
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNextQuestion}
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    Next Question
                  </Button>
                )}
              </div>

              {/* Explanation Box on Reveal */}
              {isAnswerRevealed && currentQuestion.explanation && (
                <div className="p-4 bg-[#FFF8D6] rounded-[6px] border-2 border-[#111111] text-xs font-mono text-[#111111] space-y-1">
                  <span className="font-bold block uppercase text-[#111111]">EXPLANATION:</span>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}
            </Card>
          ) : (
            <Card shadow="md" className="p-8 bg-white border-2 border-[#111111] text-center">
              <p className="text-xs font-mono text-[#666666]">All questions completed for this difficulty level.</p>
              <Button variant="secondary" size="md" onClick={resetQuizUniverse} className="mt-4">
                Back to Quiz List
              </Button>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}
