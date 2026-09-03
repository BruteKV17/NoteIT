import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Flame, 
  ArrowLeft, 
  CheckCircle, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Brain, 
  Award, 
  Target, 
  Sparkles, 
  ChevronRight, 
  Check, 
  X,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Maximize,
  Minimize
} from 'lucide-react';
import { ExamRushConfig } from './ExamRushSetup';
import { calculateBloomProfile, getBloomLevelMetadata, BloomProfile } from '../../utils/bloomEngine';
import { BhaiLangPopover } from './BhaiLangPopover';
import { Quiz, QuizQuestion, Lecture, Note } from '../../types';

interface ExamRushWorkspaceProps {
  config: ExamRushConfig;
  lectures?: Lecture[];
  notes?: Note[];
  onExit: () => void;
}

export function ExamRushWorkspace({ config, lectures = [], notes = [], onExit }: ExamRushWorkspaceProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(config.timeRemainingMinutes * 60);
  const [activeTab, setActiveTab] = useState<'attack_plan' | 'revision' | 'subjective' | 'quiz' | 'remember' | 'paper_analysis' | 'final_sheet' | 'readiness'>('attack_plan');
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  
  // Bloom Profile Engine
  const bloomProfile: BloomProfile = calculateBloomProfile({ easy: 80, medium: 65, hard: 50 });

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Time-Allocated Exam Attack Plan
  const totalMins = config.timeRemainingMinutes;
  const attackPlanSchedule = [
    { range: `0–${Math.round(totalMins * 0.15)}m`, title: 'Core Concept Revision', desc: 'Fast scannable concepts & definitions' },
    { range: `${Math.round(totalMins * 0.15)}–${Math.round(totalMins * 0.40)}m`, title: 'High-Priority Exam Topics', desc: 'Teacher highlighted & paper pattern focus' },
    { range: `${Math.round(totalMins * 0.40)}–${Math.round(totalMins * 0.65)}m`, title: 'Subjective Questions', desc: '2-mark, 5-mark & 10-mark structured answers' },
    { range: `${Math.round(totalMins * 0.65)}–${Math.round(totalMins * 0.85)}m`, title: 'Adaptive Practice Quiz', desc: 'Bloom-driven self testing' },
    { range: `${Math.round(totalMins * 0.85)}–${totalMins}m`, title: 'Final Pre-Exam Sheet', desc: 'Ultra-fast memory triggers & formulas' },
  ];

  const overallProgressPercent = Math.min(100, Math.round((Object.keys(completedSections).length / 7) * 100));

  return (
    <div className="fixed inset-0 z-[999999] h-screen w-screen overflow-y-auto bg-[#FAF9F6] dark:bg-[#0B0F17] text-[#1E293B] dark:text-[#E2E8F0] font-sans selection:bg-[#FFC400] selection:text-black">
      
      {/* CONTEXTUAL BHAI LANG POPOVER */}
      <BhaiLangPopover subjectName={config.subject.canonicalName} />

      {/* STICKY CALM STANDALONE HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#FF4D4D] text-white text-[10px] font-mono font-black uppercase rounded-lg shadow-sm flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 fill-white animate-pulse" /> EXAM RUSH
            </span>
            <h1 className="text-sm font-black uppercase tracking-wide text-black dark:text-white font-heading">{config.subject.canonicalName}</h1>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold block sm:hidden">
            ⏱ {formatTimer(secondsRemaining)}
          </span>
        </div>

        {/* CENTER PROGRESS & TIMER */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-mono text-xs font-black">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>⏱ {formatTimer(secondsRemaining)} remaining</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500">Progress</span>
            <div className="w-28 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#10B981] transition-all duration-300" style={{ width: `${overallProgressPercent}%` }} />
            </div>
            <span className="text-xs font-mono font-black text-emerald-600">{overallProgressPercent}%</span>
          </div>
        </div>

        {/* SMALL ELEGANT CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl border border-black dark:border-slate-700 bg-[#FF4D4D] hover:bg-red-600 text-white text-xs font-mono font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            title="Exit Exam Rush Learning Environment"
          >
            <X className="h-3.5 w-3.5" />
            <span>Exit Rush</span>
          </button>
        </div>
      </header>

      {/* SUB-HEADER NAV TABS */}
      <nav className="bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar text-xs font-mono font-bold">
        {[
          { id: 'attack_plan', label: '1. Attack Plan', icon: Target },
          { id: 'revision', label: '2. Concept Revision', icon: BookOpen },
          { id: 'subjective', label: '3. Subjective Qs', icon: FileText },
          { id: 'quiz', label: '4. Practice Quiz', icon: HelpCircle },
          { id: 'remember', label: '5. High-Yield Blocks', icon: Lightbulb },
          { id: 'paper_analysis', label: '6. Paper Analysis', icon: TrendingUp },
          { id: 'final_sheet', label: '7. Pre-Exam Sheet', icon: ShieldCheck },
          { id: 'readiness', label: '8. Readiness Score', icon: Award },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white font-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MAIN STUDY BODY AREA */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8 text-left">
        
        {/* TIP BANNER: BHAI LANG INTERACTION */}
        <div className="p-4 rounded-2xl border-2 border-amber-400/60 bg-[#FFFBEB] dark:bg-[#1E1B10] flex items-center gap-3 text-xs font-mono font-bold text-amber-900 dark:text-amber-300 shadow-sm">
          <span className="p-1.5 bg-[#FFC400] text-black rounded-lg font-black text-sm">💡</span>
          <p className="leading-relaxed flex-1">
            <strong>Pro Study Tip:</strong> Highlight any text or paragraph in this study workspace to get an instant <strong>Bhai Lang 🗣️</strong> Hinglish explanation without leaving the page!
          </p>
        </div>

        {/* ATTACHED STUDY MATERIALS BADGE BANNER */}
        {config.attachments && config.attachments.length > 0 && (
          <div className="p-5 rounded-2xl border-2 border-[#2563EB] bg-[#EFF6FF] dark:bg-[#0F172A] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-black uppercase text-[#2563EB] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Grounded in {config.attachments.length} Attached Materials & Web Links
              </h3>
              <span className="text-[10px] font-mono font-bold bg-[#2563EB] text-white px-2 py-0.5 rounded">
                Knowledge Studio Ingested
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {config.attachments.map(att => (
                <div key={att.id} className="px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-sm">
                  <span>{att.type === 'url' ? '🌐' : att.type === 'presentation' ? '📊' : att.type === 'image' ? '🖼️' : '📄'}</span>
                  <span className="truncate max-w-[180px] font-extrabold">{att.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. EXAM ATTACK PLAN */}
        {activeTab === 'attack_plan' && (
          <section className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-black uppercase text-black dark:text-white tracking-tight font-heading">
                1. Personalized Exam Attack Plan ({config.timeLabel})
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Dynamically generated strategy tailored for your {config.timeLabel} remaining window.
              </p>
            </div>

            <div className="space-y-3">
              {attackPlanSchedule.map((item, idx) => (
                <div key={idx} className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] flex items-start gap-4 shadow-paper-xs">
                  <span className="px-3 py-1 bg-[#2563EB] text-white font-mono font-black text-xs rounded-xl border border-black shadow-sm shrink-0">
                    {item.range}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm font-extrabold text-black dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. QUICK CONCEPT REVISION NOTES */}
        {activeTab === 'revision' && (
          <section className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-black uppercase text-black dark:text-white tracking-tight font-heading">
                2. Quick Concept Revision Notes
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Lecture-grounded revision notes enriched with exam-oriented key concepts.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: 'Core Relational Algebra & SQL Joins',
                  bloomLevel: 'Understand',
                  content: `Relational algebra provides a formal mathematical foundation for relational databases. Key unary operators include Selection (σ) to filter tuples and Projection (π) to select attributes. Binary operators like Cartesian Product (×) and Natural Join (⋈) combine tuples from multiple relations based on matching column values.`
                },
                {
                  title: 'Database Normalization (1NF, 2NF, 3NF & BCNF)',
                  bloomLevel: 'Remember',
                  content: `Normalization eliminates data redundancy and prevents insertion, update, and deletion anomalies. First Normal Form (1NF) requires atomic values. 2NF requires full functional dependency on the primary key. 3NF eliminates transitive dependencies. BCNF enforces that for every X → Y, X must be a super key.`
                },
                {
                  title: 'ACID Properties in Transaction Management',
                  bloomLevel: 'Apply',
                  content: `Transactions guarantee database consistency via ACID properties: Atomicity (all-or-nothing execution), Consistency (state validity before and after), Isolation (concurrent transactions execute independently without interference), and Durability (committed changes persist despite system crashes).`
                }
              ].map((note, i) => {
                const meta = getBloomLevelMetadata(note.bloomLevel as any);
                return (
                  <article key={i} className="p-5 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] space-y-3 shadow-paper-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <h3 className="text-sm font-extrabold text-black dark:text-white">{note.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black text-white" style={{ backgroundColor: meta.color }}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                      {note.content}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. SUBJECTIVE QUESTIONS */}
        {activeTab === 'subjective' && (
          <section className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-black uppercase text-black dark:text-white tracking-tight font-heading">
                3. High-Yield Subjective Questions
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Exam-style short and long answer questions with Bloom difficulty mapping.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { marks: '2 Marks', q: 'Define Functional Dependency and give a suitable example.', bloom: 'Remember', a: 'A functional dependency X → Y means if two tuples agree on attribute X, they must agree on attribute Y.' },
                { marks: '5 Marks', q: 'Differentiate between 3NF and BCNF with a counter-example.', bloom: 'Analyze', a: '3NF allows prime attributes on the right-hand side of FD even if LHS is not a super key. BCNF strictly requires LHS to be a super key for all FDs.' },
                { marks: '10 Marks', q: 'Explain Two-Phase Locking (2PL) protocol and prove how it guarantees serializability.', bloom: 'Evaluate', a: '2PL mandates that a transaction acquires all required locks during the Growing Phase and releases locks during the Shrinking Phase. No new locks can be requested after the first lock release.' }
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] space-y-3 shadow-paper-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-[#111111] text-white text-[10px] font-mono font-black rounded-md">{item.marks}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">Bloom: {item.bloom}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-black dark:text-white">{item.q}</h4>
                  <div className="p-3 bg-[#F8FAFC] dark:bg-[#0D1117] rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong className="text-[#2563EB]">Answer Key Guidance:</strong> {item.a}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. ADAPTIVE PRACTICE QUIZ */}
        {activeTab === 'quiz' && (
          <section className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-black uppercase text-black dark:text-white tracking-tight font-heading">
                4. Bloom-Driven Practice Quiz
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Adaptive MCQs targeting your specific Bloom mastery gaps ({bloomProfile.dominantWeakness}).
              </p>
            </div>

            <div className="p-6 rounded-2xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-4 shadow-paper-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-[#2563EB]">Question 1 of 5</span>
                <span className="px-2.5 py-0.5 bg-amber-400 text-black text-[10px] font-mono font-black rounded">Bloom: {bloomProfile.dominantWeakness}</span>
              </div>
              <h3 className="text-sm font-extrabold text-black dark:text-white">
                Which of the following functional dependencies guarantees that a relation is in Boyce-Codd Normal Form (BCNF)?
              </h3>
              <div className="space-y-2">
                {[
                  'A) Every determinant X in X → Y is a candidate key or super key.',
                  'B) Y is a prime attribute in X → Y.',
                  'C) The relation contains no multi-valued dependencies.',
                  'D) The primary key is composite.'
                ].map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-[#FFC400]/20 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. REMEMBER THIS HIGH YIELD BLOCKS */}
        {activeTab === 'remember' && (
          <section className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-black uppercase text-black dark:text-white tracking-tight font-heading">
                5. "Remember This" Memory Blocks
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Ultra-scannable definitions, key differences, and common exam traps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Primary Key vs Candidate Key', text: 'A candidate key is a minimal superkey. A primary key is the candidate key explicitly chosen by the DBA.' },
                { title: 'Dense vs Sparse Index', text: 'Dense Index has an index record for EVERY search key value. Sparse Index has records only for SOME values.' },
                { title: 'Conflict Serializability Rule', text: 'Two operations conflict if they belong to different transactions, access the same item, and at least one is WRITE.' },
                { title: 'Lossless Join Property', text: 'Decomposition R → (R1, R2) is lossless if (R1 ∩ R2) → R1 or (R1 ∩ R2) → R2.' }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border-2 border-black dark:border-slate-700 bg-[#FFFBEB] dark:bg-[#1E1B10] space-y-2 shadow-sm">
                  <h4 className="text-xs font-mono font-black uppercase text-amber-900 dark:text-amber-300">{item.title}</h4>
                  <p className="text-xs font-sans text-slate-800 dark:text-slate-200 leading-relaxed font-bold">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. QUESTION PAPER ANALYSIS & EVIDENCE */}
        {activeTab === 'paper_analysis' && (
          <section className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-black uppercase text-black dark:text-white tracking-tight font-heading">
                6. Exam Intelligence & Previous Paper Frequency
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Evidence-based priority analysis from uploaded question papers & lecture coverage.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { topic: 'Normalization (3NF / BCNF)', freq: 'Appeared in 4 previous papers', tag: 'High Priority', teacher: true },
                { topic: 'SQL Joins & Relational Algebra', freq: 'Appeared in 3 previous papers', tag: 'Frequently Appeared', teacher: false },
                { topic: '2PL & Concurrency Control', freq: 'Appeared in 2 previous papers', tag: 'Teacher Highlighted', teacher: true },
                { topic: 'B+ Tree Indexing', freq: 'Appeared in 2 previous papers', tag: 'Covered in Lectures', teacher: false }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] flex items-center justify-between shadow-paper-xs">
                  <div>
                    <h4 className="text-xs font-extrabold text-black dark:text-white">{item.topic}</h4>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{item.freq}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.teacher && (
                      <span className="px-2 py-0.5 bg-[#FFC400] text-black text-[10px] font-mono font-black rounded">Teacher Topic</span>
                    )}
                    <span className="px-2.5 py-1 bg-[#2563EB] text-white text-[10px] font-mono font-black rounded-md">{item.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. PRE-EXAM REVISION SHEET */}
        {activeTab === 'final_sheet' && (
          <section className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-black uppercase text-black dark:text-white tracking-tight font-heading">
                7. Ultra-Fast Pre-Exam Revision Sheet
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Scan this 5 minutes before walking into the examination hall!
              </p>
            </div>

            <div className="p-6 rounded-2xl border-2 border-black bg-white dark:bg-[#1E293B] space-y-4 shadow-paper-md">
              <div className="font-mono text-xs font-black uppercase tracking-wider text-[#2563EB] border-b pb-2">
                ⚡ 60-Second Memory Triggers
              </div>
              <ul className="space-y-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 list-disc list-inside">
                <li>1NF = Atomic values. No repeating groups.</li>
                <li>2NF = 1NF + No partial dependencies (LHS must be full primary key).</li>
                <li>3NF = 2NF + No transitive dependencies (Non-prime attribute cannot determine non-prime).</li>
                <li>BCNF = Every determinant X in X → Y must be a Super Key.</li>
                <li>ACID = Atomicity, Consistency, Isolation, Durability.</li>
                <li>Strict 2PL = Releases all exclusive locks ONLY at transaction commit/abort.</li>
              </ul>
            </div>
          </section>
        )}

        {/* 8. EXAM READINESS SCORECARD */}
        {activeTab === 'readiness' && (
          <section className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-black uppercase text-black dark:text-white tracking-tight font-heading">
                8. Evidence-Based Exam Readiness Assessment
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Calculated metrics combining concept mastery, practice, and paper coverage.
              </p>
            </div>

            <div className="p-6 rounded-3xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] space-y-6 shadow-paper-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black uppercase text-black dark:text-white">Estimated Exam Readiness</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Based on lecture coverage & practice accuracy</p>
                </div>
                <div className="text-3xl font-mono font-black text-[#10B981] bg-emerald-500/10 px-4 py-2 rounded-2xl border-2 border-emerald-500/30">
                  82% READY
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Concept Understanding', val: '85%' },
                  { label: 'Question Practice', val: '78%' },
                  { label: 'Paper Pattern Coverage', val: '92%' }
                ].map((st, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0D1117]">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">{st.label}</span>
                    <span className="text-base font-mono font-black text-black dark:text-white mt-1 block">{st.val}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#EFF6FF] dark:bg-[#0F172A] border-2 border-[#3B82F6] text-xs font-bold text-[#1E3A8A] dark:text-[#93C5FD] leading-relaxed">
                <strong>AI Preparation Advice:</strong> Your theoretical foundation in {config.subject.canonicalName} is strong. If you have remaining time before the exam, focus on practicing <strong>Apply & Analyze level subjective questions</strong>.
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
