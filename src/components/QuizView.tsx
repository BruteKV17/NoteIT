/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Award, 
  BookOpen, 
  HelpCircle, 
  Clock, 
  ArrowLeft, 
  Check, 
  X, 
  Sparkles, 
  PieChart, 
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Quiz, QuizQuestion } from '../types';

interface QuizViewProps {
  quizzes: Quiz[];
  selectedQuizId: string | null;
  setSelectedQuizId: (id: string | null) => void;
  onUpdateQuizScore: (id: string, score: number) => void;
  theme?: 'light' | 'dark';
}

export default function QuizView({
  quizzes,
  selectedQuizId,
  setSelectedQuizId,
  onUpdateQuizScore,
  theme = 'dark'
}: QuizViewProps) {
  
  // Game states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  // Find active quiz
  const activeQuiz = quizzes.find(q => q.id === selectedQuizId);

  const startQuizGameplay = (id: string) => {
    setSelectedQuizId(id);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerRevealed(false);
    setAccumulatedScore(0);
    setIsQuizFinished(false);
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerRevealed) return;
    setSelectedAnswerIndex(index);
  };

  const handleRevealAnswer = () => {
    if (selectedAnswerIndex === null || !activeQuiz) return;
    
    // Check correctness
    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswerIndex;
    
    if (isCorrect) {
      setAccumulatedScore(prev => prev + 1);
    }
    
    setIsAnswerRevealed(true);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < activeQuiz.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswerIndex(null);
      setIsAnswerRevealed(false);
    } else {
      // Finished!
      setIsQuizFinished(true);
      onUpdateQuizScore(activeQuiz.id, Math.round((accumulatedScore / activeQuiz.questions.length) * 100));
    }
  };

  const resetQuizUniverse = () => {
    setSelectedQuizId(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerRevealed(false);
    setAccumulatedScore(0);
    setIsQuizFinished(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Mode A: Available Quizzes selection lists */}
      {!selectedQuizId || !activeQuiz ? (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'bg-[#121318] border-neutral-900 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <h2 className={`font-sans font-bold text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Interactive Quiz Center</h2>
            <p className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
              Reinforce semantic core concepts mapped by AI from your uploaded files. Complete quizzes to raise your Topic Mastery scores.
            </p>
          </div>

          {/* Quick Metrics Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4.5 rounded-xl border flex items-center gap-3 ${
              theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
            }`}>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Average Mastery Score</div>
                <div className={`text-lg font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>84.5%</div>
              </div>
            </div>

            <div className={`p-4.5 rounded-xl border flex items-center gap-3 ${
              theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
            }`}>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-green-50 text-green-600'
              }`}>
                <Check className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Quizzes Completed</div>
                <div className={`text-lg font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>4 / 7</div>
              </div>
            </div>

            <div className={`p-4.5 rounded-xl border flex items-center gap-3 ${
              theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
            }`}>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
              }`}>
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Total Review Minutes</div>
                <div className={`text-lg font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>38 mins</div>
              </div>
            </div>
          </div>

          {/* Quizzes List Cards */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Academic Quizzes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q) => (
                <div 
                  key={q.id}
                  className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
                    theme === 'dark' 
                      ? 'bg-[#121318] border-neutral-900 hover:border-indigo-500/35' 
                      : 'bg-white border-gray-200 hover:shadow-xs hover:border-black/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                        theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-[#EFF6FF] text-[#2563EB]'
                      }`}>
                        {q.topic}
                      </span>
                      {q.score !== undefined && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          theme === 'dark' ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50'
                        }`}>
                          Score: {q.score}%
                        </span>
                      )}
                    </div>

                    <h4 className={`font-sans font-bold text-sm mt-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{q.title}</h4>
                    <p className={`text-[11px] mt-1.5 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{q.questionsCount} Multiple Choice Questions</p>
                  </div>

                  <div className={`mt-5 pt-3.5 border-t flex items-center justify-between ${
                    theme === 'dark' ? 'border-neutral-850' : 'border-gray-100'
                  }`}>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium font-mono">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {q.estimatedTime}
                    </span>
                    <button
                      onClick={() => startQuizGameplay(q.id)}
                      className={`rounded px-3.5 py-1.5 text-xs font-bold transition-colors active:scale-95 focus:outline-none cursor-pointer ${
                        theme === 'dark' ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {q.score !== undefined ? 'Retake Quiz' : 'Start Quiz'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : isQuizFinished ? (
        /* Mode C: Score Summary Results slides */
        <div className={`p-8 rounded-2xl border text-center max-w-lg mx-auto space-y-6 ${
          theme === 'dark' ? 'bg-[#121318] border-neutral-900 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full mx-auto ${
            theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
          }`}>
            <Award className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h3 className={`font-sans font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quiz Completed!</h3>
            <p className={`text-xs font-medium max-w-sm mx-auto ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
              You finished the review session for <strong className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>{activeQuiz.title}</strong>. Mapped diagnostics are generated.
            </p>
          </div>

          {/* Interactive Circle Progress Card */}
          <div className="relative flex items-center justify-center py-4">
            <div className={`flex h-32 w-32 items-center justify-center rounded-full border-8 relative ${
              theme === 'dark' ? 'border-neutral-900' : 'border-gray-100'
            }`}>
              <div className="text-center">
                <span className={`text-3xl font-extrabold font-mono tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round((accumulatedScore / activeQuiz.questions.length) * 100)}%
                </span>
                <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">SCORE</div>
              </div>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl text-xs font-medium leading-relaxed border ${
            theme === 'dark' ? 'bg-neutral-950/50 border-neutral-900/60 text-neutral-350' : 'bg-gray-50 border-gray-100 text-gray-600'
          }`}>
            {accumulatedScore / activeQuiz.questions.length >= 0.8 ? (
              <span className="text-emerald-500 font-semibold block">★ Exceptional comprehension verified! Mapped weak areas updated.</span>
            ) : (
              <span className="text-amber-500 font-semibold block">▲ Review suggested! This concept requires focusing on bibliography guidelines.</span>
            )}
            Correct answers: <strong className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{accumulatedScore}</strong> of {activeQuiz.questions.length} questions.
          </div>

          <div className="flex items-center gap-3 justify-center pt-2">
            <button
              onClick={resetQuizUniverse}
              className={`rounded-lg border px-4 py-2.5 text-xs font-bold cursor-pointer ${
                theme === 'dark' ? 'border-neutral-855 bg-neutral-900 text-white hover:bg-neutral-850' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Back to Center
            </button>
            <button
              onClick={() => startQuizGameplay(activeQuiz.id)}
              className={`rounded-lg px-4.5 py-2.5 text-xs font-bold cursor-pointer transition-colors ${
                theme === 'dark' ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Retake Quiz
            </button>
          </div>
        </div>
      ) : (
        /* Mode B: Active Quiz Gameplay Screen */
        <div className={`rounded-2xl border overflow-hidden flex flex-col ${
          theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
        }`}>
          
          {/* Header Progress indicator */}
          <div className={`p-5 border-b flex items-center justify-between ${
            theme === 'dark' ? 'bg-[#0d0e12]/60 border-neutral-900' : 'bg-gray-50/50 border-gray-100'
          }`}>
            <button 
              onClick={resetQuizUniverse}
              className={`flex items-center gap-1 text-xs font-bold focus:outline-none cursor-pointer ${
                theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-black'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quit Quiz</span>
            </button>
            
            <div className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-neutral-350' : 'text-gray-900'}`}>
              Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
            </div>
          </div>

          {/* Core Custom Visual Loading Bar */}
          <div className={`w-full h-1 ${theme === 'dark' ? 'bg-neutral-900' : 'bg-gray-100'}`}>
            <div 
              className={`h-1 transition-all duration-300 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-black'}`}
              style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
            />
          </div>

          {/* Actual Question block frame */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
              }`}>
                CONCEPT {currentQuestionIndex + 1}
              </span>
              <h3 className={`font-sans font-bold text-base md:text-lg leading-relaxed select-none ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {activeQuiz.questions[currentQuestionIndex].question}
              </h3>
            </div>

            {/* Answer option choices */}
            <div className="space-y-3">
              {activeQuiz.questions[currentQuestionIndex].options.map((opt, i) => {
                const isSelected = selectedAnswerIndex === i;
                const isCorrectIndex = i === activeQuiz.questions[currentQuestionIndex].correctAnswerIndex;
                
                let cardClass = "";
                let badgeClass = "";
                let textClass = "";
                let checkIcon = null;

                if (theme === 'dark') {
                  if (isAnswerRevealed) {
                    if (isCorrectIndex) {
                      cardClass = "border-emerald-500 bg-emerald-500/10";
                      badgeClass = "bg-emerald-500 text-white border-emerald-500";
                      textClass = "text-emerald-400 font-bold";
                      checkIcon = <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
                    } else if (isSelected) {
                      cardClass = "border-red-500 bg-red-500/10";
                      badgeClass = "bg-red-550 text-white border-red-500";
                      textClass = "text-red-400 font-bold";
                      checkIcon = <X className="h-4 w-4 text-red-400 flex-shrink-0" />;
                    } else {
                      cardClass = "border-neutral-800 bg-neutral-950/20";
                      badgeClass = "border-neutral-800 text-neutral-500";
                      textClass = "text-neutral-500";
                    }
                  } else if (isSelected) {
                    cardClass = "border-indigo-500 bg-indigo-500/10";
                    badgeClass = "bg-indigo-500 text-white border-indigo-500";
                    textClass = "text-white font-bold";
                  } else {
                    cardClass = "border-neutral-800 bg-[#121318] hover:border-indigo-550 hover:bg-[#171821]";
                    badgeClass = "border-neutral-700 text-neutral-350 group-hover:text-white";
                    textClass = "text-neutral-250 group-hover:text-white";
                  }
                } else {
                  // Light Theme
                  if (isAnswerRevealed) {
                    if (isCorrectIndex) {
                      cardClass = "border-emerald-650 bg-emerald-50";
                      badgeClass = "bg-emerald-600 text-white border-emerald-600";
                      textClass = "text-emerald-950 font-bold";
                      checkIcon = <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />;
                    } else if (isSelected) {
                      cardClass = "border-red-500 bg-red-50";
                      badgeClass = "bg-red-600 text-white border-red-600";
                      textClass = "text-red-950 font-bold";
                      checkIcon = <X className="h-4 w-4 text-red-600 flex-shrink-0" />;
                    } else {
                      cardClass = "border-gray-200 bg-gray-50/50";
                      badgeClass = "border-gray-300 text-gray-400";
                      textClass = "text-gray-500";
                    }
                  } else if (isSelected) {
                    cardClass = "border-black bg-gray-50";
                    badgeClass = "bg-black text-white border-black";
                    textClass = "text-black font-bold";
                  } else {
                    cardClass = "border-gray-300 hover:border-gray-600 bg-white";
                    badgeClass = "border-gray-400 text-gray-700 group-hover:text-black";
                    textClass = "text-gray-800 font-medium group-hover:text-black";
                  }
                }

                return (
                  <div 
                    key={i}
                    onClick={() => handleSelectOption(i)}
                    className={`group flex items-start gap-3 rounded-xl border p-4.5 cursor-pointer transition-all ${cardClass}`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold mt-0.5 flex-shrink-0 ${badgeClass}`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className={`flex-1 text-[13px] leading-relaxed select-none ${textClass}`}>
                      {opt}
                    </span>
                    {checkIcon}
                  </div>
                );
              })}
            </div>

            {/* Next buttons footer */}
            <div className={`pt-4 border-t flex items-center justify-end gap-2.5 ${
              theme === 'dark' ? 'border-neutral-900' : 'border-gray-100'
            }`}>
              {!isAnswerRevealed ? (
                <button
                  type="button"
                  onClick={handleRevealAnswer}
                  disabled={selectedAnswerIndex === null}
                  className={`rounded-lg px-5 py-2.5 text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-neutral-100 disabled:opacity-30 disabled:bg-neutral-750 disabled:text-neutral-500'
                      : 'bg-black text-white hover:bg-gray-800 disabled:opacity-40'
                  }`}
                >
                  Verify Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-neutral-100'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <span>
                    {currentQuestionIndex + 1 === activeQuiz.questions.length ? 'Show Results' : 'Next Question'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
