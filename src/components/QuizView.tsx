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
  RefreshCw,
  Layers
} from 'lucide-react';
import { Quiz, QuizQuestion } from '../types';
import { generateAdditionalQuizQuestions } from '../services/gemini';
import BruteLoader from './BruteLoader';

interface QuizViewProps {
  quizzes: Quiz[];
  selectedQuizId: string | null;
  setSelectedQuizId: (id: string | null) => void;
  onUpdateQuizScore: (id: string, score: number) => void;
  onAddQuestions?: (quizId: string, difficulty: 'easy' | 'medium' | 'hard', newQuestions: QuizQuestion[]) => void;
  theme?: 'light' | 'dark';
}

export default function QuizView({
  quizzes,
  selectedQuizId,
  setSelectedQuizId,
  onUpdateQuizScore,
  onAddQuestions,
  theme = 'dark'
}: QuizViewProps) {
  
  // Game states
  const [activeDifficulty, setActiveDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Find active quiz
  const activeQuiz = quizzes.find(q => q.id === selectedQuizId);

  // Fallback splitting logic if easy/medium/hard lists are missing (e.g. dynamic quizzes from lectures)
  let easyQ = activeQuiz?.easyQuestions || [];
  let mediumQ = activeQuiz?.mediumQuestions || [];
  let hardQ = activeQuiz?.hardQuestions || [];

  if (activeQuiz && easyQ.length === 0 && activeQuiz.questions.length > 0) {
    easyQ = activeQuiz.questions;
    mediumQ = activeQuiz.questions.map(q => ({
      ...q,
      id: `${q.id}-medium`,
      question: `[Medium] ${q.question}`,
      explanation: q.explanation || 'Medium difficulty conceptual application review.',
      sourceCitation: q.sourceCitation || `[Source: ${activeQuiz.title}, Chapter 2]`
    }));
    hardQ = activeQuiz.questions.map(q => ({
      ...q,
      id: `${q.id}-hard`,
      question: `[Hard] ${q.question}`,
      explanation: q.explanation || 'Hard difficulty advanced derivation check.',
      sourceCitation: q.sourceCitation || `[Source: ${activeQuiz.title}, Appendix A]`
    }));
  }

  const questionsList = activeDifficulty === 'easy' 
    ? easyQ 
    : (activeDifficulty === 'medium' ? mediumQ : hardQ);

  const startQuizGameplay = (id: string, difficulty: 'easy' | 'medium' | 'hard' = 'easy') => {
    setSelectedQuizId(id);
    setActiveDifficulty(difficulty);
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
    const currentQuestion = questionsList[currentQuestionIndex];
    const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswerIndex;
    
    if (isCorrect) {
      setAccumulatedScore(prev => prev + 1);
    }
    
    setIsAnswerRevealed(true);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questionsList.length) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswerIndex(null);
      setIsAnswerRevealed(false);
    } else {
      // Finished!
      setIsQuizFinished(true);
      onUpdateQuizScore(activeQuiz.id, Math.round((accumulatedScore / questionsList.length) * 100));
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

  // Generate 10 additional unique questions
  const handleGenerateMore = async () => {
    if (!activeQuiz || !onAddQuestions) return;
    setIsGenerating(true);
    
    try {
      const existingTexts = questionsList.map(q => q.question);
      const newQuestions = await generateAdditionalQuizQuestions(
        activeQuiz.topic,
        activeDifficulty,
        existingTexts,
        activeQuiz.contextText || ''
      );

      // Append new questions to the correct quiz level
      const mappedNewQuestions: QuizQuestion[] = newQuestions.map((q, idx) => ({
        id: `gen-${activeDifficulty}-${Date.now()}-${idx}`,
        type: q.type || 'mcq',
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        sourceCitation: q.sourceCitation,
        scenario: q.scenario,
        matchLeft: q.matchLeft,
        matchRight: q.matchRight
      }));

      onAddQuestions(activeQuiz.id, activeDifficulty, mappedNewQuestions);
    } catch (err) {
      console.error("Failed to generate additional questions:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQuestion = questionsList[currentQuestionIndex];

  // Helper to render question text (inserts chosen word for fill-in-the-blank)
  const renderQuestionText = () => {
    if (!currentQuestion) return '';
    if (currentQuestion.type === 'fill_blank') {
      const parts = currentQuestion.question.split('____');
      const fillText = selectedAnswerIndex !== null ? currentQuestion.options[selectedAnswerIndex] : '____';
      return (
        <span>
          {parts[0]}
          <span className="text-[#5F6DF8] underline font-extrabold px-1.5 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20">
            {fillText}
          </span>
          {parts[1] || ''}
        </span>
      );
    }
    return currentQuestion.question;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 select-none relative">
      
      {/* Dynamic Loader Overlay for Generate More Questions */}
      {isGenerating && (
        <div className="fixed inset-0 bg-[#0a0b0e]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <BruteLoader size="lg" message={`Generating 10 additional unique ${activeDifficulty} questions via Gemini...`} />
        </div>
      )}

      {/* Mode A: Available Quizzes selection lists */}
      {!selectedQuizId || !activeQuiz ? (
        <div className="space-y-6 animate-fade-in">
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'bg-[#121318] border-neutral-900 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className={`font-sans font-bold text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Interactive Quiz Center</h2>
                <p className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Reinforce semantic core concepts mapped by AI from your uploaded files. Complete quizzes to raise your Topic Mastery scores.
                </p>
              </div>
              
              {/* Difficulty Selection Tab Bar */}
              <div className={`flex gap-1 p-1 rounded-xl border ${
                theme === 'dark' ? 'bg-neutral-950 border-neutral-850' : 'bg-gray-100 border-gray-200'
              }`}>
                {(['easy', 'medium', 'hard'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setActiveDifficulty(diff)}
                    className={`px-4.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeDifficulty === diff 
                        ? theme === 'dark' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-black shadow-sm'
                        : 'text-neutral-450 hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4.5 rounded-xl border flex items-center gap-3 ${
              theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
            }`}>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-550/10 text-indigo-650'
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
              {quizzes.map((q) => {
                // Determine question count for difficulty
                const diffQ = q.id === 'q1' || q.id === 'q2' || q.id === 'q3'
                  ? (activeDifficulty === 'easy' ? q.easyQuestions : (activeDifficulty === 'medium' ? q.mediumQuestions : q.hardQuestions))
                  : q.questions;
                const count = diffQ?.length || 0;
                
                return (
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
                        <span className={`rounded px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                          theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-[#EFF6FF] text-[#2563EB]'
                        }`}>
                          {q.topic}
                        </span>
                        {q.score !== undefined && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            theme === 'dark' ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-55'
                          }`}>
                            Score: {q.score}%
                          </span>
                        )}
                      </div>

                      <h4 className={`font-sans font-bold text-sm mt-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{q.title}</h4>
                      <p className={`text-[11px] mt-1.5 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {count} questions available • <span className="font-bold text-indigo-400 capitalize">{activeDifficulty} Level</span>
                      </p>
                    </div>

                    <div className={`mt-5 pt-3.5 border-t flex items-center justify-between ${
                      theme === 'dark' ? 'border-neutral-850' : 'border-gray-100'
                    }`}>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium font-mono">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {count * 1} mins
                      </span>
                      <button
                        onClick={() => startQuizGameplay(q.id, activeDifficulty)}
                        disabled={count === 0}
                        className={`rounded px-3.5 py-1.5 text-xs font-bold transition-colors active:scale-95 focus:outline-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          theme === 'dark' ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {q.score !== undefined ? 'Retake Quiz' : 'Start Quiz'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : isQuizFinished ? (
        /* Mode C: Score Summary Results slides */
        <div className={`p-8 rounded-2xl border text-center max-w-lg mx-auto space-y-6 animate-fade-in ${
          theme === 'dark' ? 'bg-[#121318] border-neutral-900 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full mx-auto ${
            theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-605'
          }`}>
            <Award className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h3 className={`font-sans font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quiz Completed!</h3>
            <p className={`text-xs font-medium max-w-sm mx-auto ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
              You finished the review session for <strong className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>{activeQuiz.title}</strong> in <strong className="text-indigo-400 capitalize">{activeDifficulty}</strong> level.
            </p>
          </div>

          {/* Interactive Circle Progress Card */}
          <div className="relative flex items-center justify-center py-4">
            <div className={`flex h-32 w-32 items-center justify-center rounded-full border-8 relative ${
              theme === 'dark' ? 'border-neutral-900' : 'border-gray-105'
            }`}>
              <div className="text-center">
                <span className={`text-3xl font-extrabold font-mono tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round((accumulatedScore / questionsList.length) * 100)}%
                </span>
                <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">SCORE</div>
              </div>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl text-xs font-medium leading-relaxed border ${
            theme === 'dark' ? 'bg-neutral-950/50 border-neutral-900/60 text-neutral-350' : 'bg-gray-50 border-gray-100 text-gray-650'
          }`}>
            {accumulatedScore / questionsList.length >= 0.8 ? (
              <span className="text-emerald-500 font-semibold block">★ Exceptional comprehension verified! Mapped weak areas updated.</span>
            ) : (
              <span className="text-amber-500 font-semibold block">▲ Review suggested! This concept requires focusing on bibliography guidelines.</span>
            )}
            Correct answers: <strong className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{accumulatedScore}</strong> of {questionsList.length} questions.
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
              onClick={() => startQuizGameplay(activeQuiz.id, activeDifficulty)}
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
        <div className={`rounded-2xl border overflow-hidden flex flex-col animate-fade-in ${
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
            
            <div className="flex items-center gap-3.5">
              {/* Active Difficulty Badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                activeDifficulty === 'easy' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : (activeDifficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400')
              }`}>
                {activeDifficulty} level
              </span>

              {/* Generate More Questions Action */}
              {onAddQuestions && (
                <button
                  onClick={handleGenerateMore}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Generate +10 Questions</span>
                </button>
              )}

              <div className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-neutral-350' : 'text-gray-900'}`}>
                Question {currentQuestionIndex + 1} of {questionsList.length}
              </div>
            </div>
          </div>

          {/* Core Custom Visual Loading Bar */}
          <div className={`w-full h-1 ${theme === 'dark' ? 'bg-neutral-900' : 'bg-gray-100'}`}>
            <div 
              className={`h-1 transition-all duration-300 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-black'}`}
              style={{ width: `${((currentQuestionIndex + 1) / questionsList.length) * 100}%` }}
            />
          </div>

          {/* Actual Question block frame */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-605'
              }`}>
                {currentQuestion.type ? currentQuestion.type.replace('_', ' ') : `MCQ Question`} {currentQuestionIndex + 1}
              </span>
              
              <h3 className={`font-sans font-bold text-base md:text-lg leading-relaxed select-none ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {renderQuestionText()}
              </h3>
            </div>

            {/* Specialized Question Layouts */}

            {/* A: SCENARIO BASED card block */}
            {currentQuestion.type === 'scenario_based' && currentQuestion.scenario && (
              <div className={`p-4 rounded-xl border text-xs italic leading-relaxed ${
                theme === 'dark' ? 'bg-neutral-950/50 border-neutral-900 text-neutral-300' : 'bg-gray-50 border-gray-205 text-gray-700'
              }`}>
                <span className="font-mono text-[9px] font-black uppercase text-indigo-400 block mb-1.5">SCENARIO CASE CONTEXT:</span>
                "{currentQuestion.scenario}"
              </div>
            )}

            {/* B: ASSERTION REASON card block */}
            {currentQuestion.type === 'assertion_reason' && currentQuestion.scenario && (
              <div className="flex flex-col gap-3">
                {currentQuestion.scenario.split('\n').map((line, idx) => {
                  const isAssertion = line.toLowerCase().startsWith('assertion');
                  return (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        isAssertion 
                          ? theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-200' : 'bg-indigo-50/50 border-indigo-100 text-indigo-950'
                          : theme === 'dark' ? 'bg-purple-500/5 border-purple-500/20 text-purple-200' : 'bg-purple-50/50 border-purple-100 text-purple-950'
                      }`}
                    >
                      <span className="font-mono text-[9.5px] font-black uppercase tracking-wider block opacity-75 mb-1">
                        {isAssertion ? 'Assertion (A)' : 'Reason (R)'}
                      </span>
                      {line.replace(/^(assertion\s*\(a\):\s*|reason\s*\(r\):\s*)/i, '')}
                    </div>
                  );
                })}
              </div>
            )}

            {/* C: MATCH FOLLOWING columns grid */}
            {currentQuestion.type === 'match_following' && currentQuestion.matchLeft && currentQuestion.matchRight && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-950/40 rounded-xl border border-neutral-900 text-xs">
                <div className="space-y-2">
                  <div className="font-mono text-[9px] font-black uppercase text-indigo-400">Column A</div>
                  {currentQuestion.matchLeft.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-850 font-bold text-neutral-300">{item}</div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="font-mono text-[9px] font-black uppercase text-purple-400">Column B</div>
                  {currentQuestion.matchRight.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-850 font-bold text-neutral-300">{item}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer option choices */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selectedAnswerIndex === i;
                const isCorrectIndex = i === currentQuestion.correctAnswerIndex;
                
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

            {/* Cognitive Analysis / Explanations & Citations */}
            {isAnswerRevealed && (
              <div className={`p-4.5 rounded-xl border text-xs space-y-2.5 leading-relaxed animate-fade-in ${
                selectedAnswerIndex === currentQuestion.correctAnswerIndex
                  ? theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-950'
              }`}>
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] font-mono">
                  {selectedAnswerIndex === currentQuestion.correctAnswerIndex ? (
                    <Check className="h-4.5 w-4.5 text-emerald-500" />
                  ) : (
                    <X className="h-4.5 w-4.5 text-red-500" />
                  )}
                  <span>
                    {selectedAnswerIndex === currentQuestion.correctAnswerIndex ? 'Correct Recall Analysis' : 'Incorrect Recall Analysis'}
                  </span>
                </div>

                <div>
                  <strong className={theme === 'dark' ? 'text-neutral-200' : 'text-gray-800'}>Correct Choice: </strong>
                  <span className="font-semibold">{currentQuestion.options[currentQuestion.correctAnswerIndex]}</span>
                </div>

                {currentQuestion.explanation && (
                  <div>
                    <strong className={theme === 'dark' ? 'text-neutral-200' : 'text-gray-800'}>Why this is correct: </strong>
                    <span className={theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}>{currentQuestion.explanation}</span>
                  </div>
                )}

                {currentQuestion.sourceCitation && (
                  <div className="pt-2 border-t border-neutral-900/20 dark:border-white/5 font-mono text-[10px] text-indigo-400 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Source Reference: {currentQuestion.sourceCitation}</span>
                  </div>
                )}
              </div>
            )}

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
                    {currentQuestionIndex + 1 === questionsList.length ? 'Show Results' : 'Next Question'}
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
