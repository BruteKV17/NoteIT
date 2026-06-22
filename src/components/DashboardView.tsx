/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Sparkles, 
  Plus, 
  Volume2, 
  FileText, 
  ArrowRight,
  TrendingUp,
  Brain,
  MessageSquare,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Mic,
  Star,
  Play,
  RotateCw,
  Columns
} from 'lucide-react';
import { PageId, Lecture, WeakTopic, Note } from '../types';

interface DashboardViewProps {
  setActivePage: (page: PageId) => void;
  setSelectedQuizId: (quizId: string) => void;
  lectures: Lecture[];
  weakTopics: WeakTopic[];
  onNewAnalysis: () => void;
  onOpenLecture: (lectureId: string) => void;
  theme: 'light' | 'dark';
  notes?: Note[];
}

export default function DashboardView({
  setActivePage,
  setSelectedQuizId,
  lectures,
  weakTopics,
  onNewAnalysis,
  onOpenLecture,
  theme,
  notes = []
}: DashboardViewProps) {
  
  // Stable stars generation for the premium space background
  const spaceStars = React.useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 1.5 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 3,
    }));
  }, []);

  const spaceFloatStars = React.useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.5 + 1.5,
      delay: Math.random() * 6,
      duration: Math.random() * 10 + 10,
    }));
  }, []);

  // Quick navigation helpers
  const handleStartRecording = () => {
    setActivePage('lecture-capture');
  };

  const handleOpenLibrary = () => {
    setActivePage('academic-library');
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-16 animate-fade-in">
      
      {/* 1. PREMIUM VENTURE-BACKED HERO SECTION */}
      <div className={`relative rounded-3xl overflow-hidden border p-8 md:p-12 transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#0d0e12] border-neutral-800/80 shadow-2xl shadow-indigo-950/10' 
          : 'bg-[#FAF9F5] border-gray-200 shadow-md'
      }`}>
        
        {/* Animated Premium Space Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {theme === 'dark' ? (
            <>
              {/* Deep space cosmic gradient */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-[#0a0a0c] opacity-90" />
              <div className="absolute inset-0 bg-[#0d0e12] opacity-30 mix-blend-color-dodge" />
              
              {/* Floating Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

              {/* Glowing space nebulas */}
              <div className="absolute top-[-30%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[110px] animate-space-drift-slow" />
              <div className="absolute bottom-[-20%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-600/15 blur-[90px] animate-space-drift-medium" />
              <div className="absolute top-[20%] left-[35%] w-[320px] h-[320px] rounded-full bg-cyan-600/8 blur-[100px] animate-space-drift-fast" />

              {/* Twinkling Stars */}
              {spaceStars.map((star) => (
                <div
                  key={star.id}
                  style={{
                    position: 'absolute',
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.duration}s`,
                  }}
                  className="rounded-full bg-white animate-space-twinkle opacity-30 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                />
              ))}

              {/* Drifting Space Particles */}
              {spaceFloatStars.map((star) => (
                <div
                  key={star.id}
                  style={{
                    position: 'absolute',
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.duration}s`,
                  }}
                  className="rounded-full bg-indigo-300/40 animate-star-drift shadow-[0_0_6px_rgba(165,180,252,0.4)]"
                />
              ))}

              {/* Shooting Stars */}
              <div className="absolute top-[10%] right-[10%] w-[100px] h-[1.5px] bg-gradient-to-l from-white/75 via-white/30 to-transparent animate-shooting-star pointer-events-none" />
              <div className="absolute top-[40%] right-[30%] w-[120px] h-[1.5px] bg-gradient-to-l from-indigo-300/75 via-indigo-300/30 to-transparent animate-shooting-star pointer-events-none" style={{ animationDelay: '3.5s' }} />
              <div className="absolute top-[20%] right-[50%] w-[90px] h-[1.5px] bg-gradient-to-l from-white/60 via-white/20 to-transparent animate-shooting-star pointer-events-none" style={{ animationDelay: '5.2s' }} />
            </>
          ) : (
            <>
              {/* Light celestial background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-sky-50/20 to-[#FAF9F5] opacity-95" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.008)_1px,transparent_1px)] bg-[size:32px_32px] opacity-15 pointer-events-none" />

              {/* Soft pastel nebulas */}
              <div className="absolute top-[-30%] right-[-10%] w-[380px] h-[380px] rounded-full bg-indigo-100/50 blur-[100px] animate-space-drift-slow" />
              <div className="absolute bottom-[-20%] left-[10%] w-[280px] h-[280px] rounded-full bg-pink-100/40 blur-[80px] animate-space-drift-medium" />

              {/* Twinkling sky stars */}
              {spaceStars.slice(0, 25).map((star) => (
                <div
                  key={star.id}
                  style={{
                    position: 'absolute',
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.duration}s`,
                  }}
                  className="rounded-full bg-amber-400 animate-space-twinkle opacity-50"
                />
              ))}

              {/* Drifting golden sky stars in light mode */}
              {spaceFloatStars.slice(0, 8).map((star) => (
                <div
                  key={star.id}
                  style={{
                    position: 'absolute',
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.duration}s`,
                  }}
                  className="rounded-full bg-amber-500/20 animate-star-drift"
                />
              ))}
            </>
          )}
        </div>


        <div className="relative z-10 max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 px-3 py-1.5 text-xs font-black text-indigo-400 font-mono tracking-widest uppercase">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>Note-IT AI Suite • Core</span>
          </span>

          <h1 className="font-sans font-black text-3.5xl sm:text-5.5xl tracking-tight leading-tighter">
            AI That Thinks <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent p-0.5 inline-block">
              While You Learn.
            </span>
          </h1>

          <p className="text-sm md:text-base font-semibold leading-relaxed text-gray-500 dark:text-neutral-400">
            Record classroom lectures and instantly generate notes, summaries, quizzes, flashcards and personalized revision plans.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
            <button
              onClick={handleStartRecording}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-xs font-black shadow-lg transition-all active:scale-[0.98] cursor-pointer focus:outline-none ${
                theme === 'dark' 
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/40 text-white' 
                  : 'bg-black hover:bg-neutral-800 text-white'
              }`}
            >
              <Mic className="h-4.5 w-4.5 text-indigo-300 animate-pulse" />
              <span>START RECORDING LECTURE</span>
            </button>
            
            <button
              onClick={handleOpenLibrary}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border px-6 py-4 text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                theme === 'dark' 
                  ? 'border-neutral-800 hover:bg-[#1a1b24] text-neutral-300 bg-[#121318]/50' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700 bg-white'
              }`}
            >
              <BookOpen className="h-4 w-4 text-gray-400" />
              <span>Open Academic Library</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE WORKFLOW VISUAL MAP BADGES */}
      <div className="space-y-3.5">
        <div className="px-1 text-[11px] font-black uppercase tracking-widest text-[#2563EB] dark:text-indigo-400 font-mono">
          Learning Pipeline Stages
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { tag: "Record Lecture", desc: "Sync voice arrays", step: "01", active: true },
            { tag: "AI Understands", desc: "Speech into context", step: "02" },
            { tag: "Generate Notes", desc: "Markdown outline", step: "03" },
            { tag: "Core Summary", desc: "Bullet citations", step: "04" },
            { tag: "Dynamic Quizzes", desc: "Active retrieval", step: "05" },
            { tag: "Weak Tracker", desc: "Close cognitive gaps", step: "06" }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`rounded-xl border p-3.5 flex flex-col justify-between h-[85px] transition-all relative ${
                item.active 
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                  : 'bg-gray-50 dark:bg-[#121318]/45 border-neutral-700/5 dark:border-neutral-900/40 text-gray-400'
              }`}
            >
              <span className="text-[10px] font-bold font-mono text-neutral-500 block">{item.step}</span>
              <div className="space-y-0.5">
                <h4 className="text-[11.5px] font-black font-sans text-gray-900 dark:text-neutral-200">{item.tag}</h4>
                <p className="text-[9px] font-medium text-gray-400 mt-0.5 leading-none">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. COGNITIVE RECENT LECTURES DASHBOARD MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD A: Today's Lectures */}
        <div className={`rounded-2xl border p-5.5 space-y-4 flex flex-col h-[280px] justify-between ${
          theme === 'dark' ? 'bg-[#121318]/40 border-neutral-800' : 'bg-white border-gray-200'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">
              Today's Lectures
            </span>
            <div className="flex items-center justify-between pt-1">
              <h3 className="text-sm font-sans font-black">AI & Neural Optimizations</h3>
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-500 animate-pulse font-mono block">
                LIVE NOW
              </span>
            </div>
          </div>

          <div className="bg-[#121318]/2 bg-gray-50 dark:bg-neutral-900/30 p-3 rounded-xl border border-neutral-800/10 dark:border-neutral-800/40 space-y-1 select-text">
            <h4 className="text-[11px] font-bold text-indigo-400">Advanced Computer Science</h4>
            <p className="text-[10.5px] text-gray-400 font-serif leading-relaxed line-clamp-3 leading-tighter">
              Currently talking about Adaptive Momementum (Adam) algorithms, analyzing matrix derivations and vector saddle points.
            </p>
          </div>

          <button
            onClick={() => setActivePage('lecture-capture')}
            className={`w-full py-2.5 px-4 rounded-xl font-sans text-[11px] font-black tracking-wide text-center flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
              theme === 'dark' ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            <span>JOIN ACTIVE SYNC FEED</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* CARD B: Recent Recordings */}
        <div className={`rounded-2xl border p-5.5 space-y-4 flex flex-col h-[280px] justify-between ${
          theme === 'dark' ? 'bg-[#121318]/40 border-neutral-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">
              Recent Recordings
            </span>
            <h3 className="text-sm font-sans font-black pt-1">BioGenetics Lecture L04</h3>
            <p className="text-[10px] text-gray-400 font-medium">Synced: 2 hours ago • 42 mins</p>
          </div>

          {/* Miniature Audio Waves visualization */}
          <div className="h-11 flex items-center gap-1 justify-center bg-gray-100/50 dark:bg-neutral-950/20 rounded-xl px-4 border border-neutral-800/5 dark:border-neutral-950/30">
            {Array.from({ length: 15 }).map((_, i) => {
              const bHeights = ['24px', '12px', '32px', '16px', '8px', '36px', '14px', '28px', '10px', '34px', '12px', '24px', '18px', '32px', '14px'];
              return (
                <div
                  key={i}
                  style={{ height: bHeights[i % bHeights.length] }}
                  className="w-[3px] rounded-full bg-indigo-500/40"
                />
              );
            })}
          </div>

          <button
            onClick={() => setActivePage('academic-library')}
            className={`w-full py-2.5 px-4 rounded-xl font-sans text-[11px] font-black tracking-wide text-center flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
              theme === 'dark' ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>PLAY SYNCHRONIZED AUDIO</span>
          </button>
        </div>

        {/* CARD C: Continue Session */}
        <div className={`rounded-2xl border p-5.5 space-y-4 flex flex-col h-[280px] justify-between ${
          theme === 'dark' ? 'bg-[#121318]/40 border-neutral-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">
              Continue Session
            </span>
            <h3 className="text-sm font-sans font-black pt-1">Quantum mechanics post-midterm</h3>
            <p className="text-[10px] text-gray-400 font-medium">Weak Topic focus: Wavefunctions</p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] font-semibold text-gray-500 flex gap-2 items-center">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
            <span>Improve Wavefunction score to 75% inside Study Mode.</span>
          </div>

          <button
            onClick={() => setActivePage('quiz-mode')}
            className={`w-full py-2.5 px-4 rounded-xl font-sans text-[11px] font-black tracking-wide text-center flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
              theme === 'dark' ? 'bg-[#2563EB] text-white hover:bg-indigo-500 shadow-md shadow-indigo-950/20' : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>CONTINUE STUDY MODE</span>
          </button>
        </div>

        {/* CARD D: Pinned Notes */}
        <div className={`rounded-2xl border p-5.5 space-y-4 flex flex-col h-[280px] justify-between ${
          theme === 'dark' ? 'bg-[#121318]/40 border-neutral-800' : 'bg-white border-gray-200'
        }`}>
          {notes.length > 0 ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                    Pinned Notes
                  </span>
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
                </div>
                <h3 className="text-sm font-sans font-black pt-1 truncate">{notes[0].title}</h3>
                <p className="text-[10px] text-gray-500 font-mono">
                  Synced: {notes[0].updatedAt?.seconds 
                    ? new Date(notes[0].updatedAt.seconds * 1000).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Just now'}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-neutral-900/35 p-2.5 rounded-xl text-[10.5px] font-serif leading-relaxed line-clamp-2 text-gray-400">
                "{notes[0].content}"
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                    Pinned Notes
                  </span>
                  <Star className="h-4 w-4 text-gray-300 dark:text-neutral-700" />
                </div>
                <h3 className="text-sm font-sans font-black pt-1">No Pinned Notes</h3>
                <p className="text-[10px] text-gray-500">Workspace is empty</p>
              </div>

              <div className="bg-gray-50 dark:bg-neutral-900/35 p-2.5 rounded-xl text-[10.5px] font-serif leading-relaxed text-gray-400 italic">
                "Take notes on active lectures inside the Research Hub. Notes sync to Firestore automatically."
              </div>
            </>
          )}

          <button
            onClick={() => setActivePage('research-hub')}
            className={`w-full py-2.5 px-4 rounded-xl font-sans text-[11px] font-black tracking-wide text-center flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
              theme === 'dark' ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{notes.length > 0 ? 'READ SYNCHRONIZED NOTES' : 'CREATE NEW NOTE'}</span>
          </button>
        </div>


      </div>

    </div>
  );
}
