import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Flame, 
  Search, 
  Check, 
  Target, 
  ArrowRight, 
  FileText,
  Brain
} from 'lucide-react';
import { searchCanonicalSubjects, CanonicalSubject, resolveCanonicalSubject } from '../../utils/subjectCanonicalizer';

export interface ExamRushConfig {
  subject: CanonicalSubject;
  timeRemainingMinutes: number;
  timeLabel: string;
  teacherTopics: string[];
  intensity: 'quick_survival' | 'balanced' | 'deep_preparation';
}

interface ExamRushSetupProps {
  onStartExamRush: (config: ExamRushConfig) => void;
  theme?: 'light' | 'dark';
}

const DURATION_OPTIONS = [
  { label: '30 Minutes', minutes: 30 },
  { label: '1 Hour', minutes: 60 },
  { label: '2 Hours', minutes: 120 },
  { label: '4 Hours', minutes: 240 },
  { label: '8 Hours', minutes: 480 },
  { label: '1 Day', minutes: 1440 },
  { label: '2 Days', minutes: 2880 },
  { label: '3+ Days', minutes: 4320 },
];

export function ExamRushSetup({ onStartExamRush, theme = 'light' }: ExamRushSetupProps) {
  const [subjectQuery, setSubjectQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<CanonicalSubject | null>(null);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  
  const [selectedDuration, setSelectedDuration] = useState<{ label: string; minutes: number }>(DURATION_OPTIONS[2]); // Default 2 Hours
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  
  const [teacherTopicsInput, setTeacherTopicsInput] = useState('');
  const [intensity, setIntensity] = useState<'quick_survival' | 'balanced' | 'deep_preparation'>('balanced');

  const subjectResults = searchCanonicalSubjects(subjectQuery);

  const handleSelectSubject = (subj: CanonicalSubject) => {
    setSelectedSubject(subj);
    setSubjectQuery(subj.canonicalName);
    setIsSubjectDropdownOpen(false);
  };

  const handleStart = () => {
    const finalSubject = selectedSubject || resolveCanonicalSubject(subjectQuery || 'Database Management Systems');
    const finalMinutes = useCustomTime && customMinutes ? Math.max(10, parseInt(customMinutes, 10)) : selectedDuration.minutes;
    const finalLabel = useCustomTime && customMinutes ? `${customMinutes} Minutes` : selectedDuration.label;

    const teacherTopics = teacherTopicsInput
      .split(/[\n,]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onStartExamRush({
      subject: finalSubject,
      timeRemainingMinutes: finalMinutes,
      timeLabel: finalLabel,
      teacherTopics,
      intensity
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left animate-fade-in">
      
      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl border-2 border-black dark:border-slate-700 bg-gradient-to-r from-[#111111] via-[#1E293B] to-[#0F172A] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF4D4D] text-white border border-black rounded-lg text-xs font-mono font-black uppercase tracking-wider shadow-sm">
            <Flame className="h-4 w-4 fill-white" />
            <span>EXAM RUSH MODE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-heading">
            Targeted Exam Survival & Rapid Mastery
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-bold max-w-2xl leading-relaxed">
            Tell NoteIT your subject and remaining time. Our adaptive AI will construct a time-bound study ecosystem, high-priority revision sheet, previous paper analysis, and readiness score.
          </p>
        </div>
      </div>

      {/* SETUP CARD FORM */}
      <div className="p-6 sm:p-8 rounded-3xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] shadow-paper-lg space-y-6">
        
        {/* 1. CANONICAL SUBJECT AUTOCOMPLETE */}
        <div className="space-y-2 relative">
          <label className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-slate-200 flex items-center justify-between">
            <span>1. Select Canonical Subject *</span>
            {selectedSubject && (
              <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold">ID: {selectedSubject.subjectId}</span>
            )}
          </label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={subjectQuery}
                onFocus={() => setIsSubjectDropdownOpen(true)}
                onChange={(e) => {
                  setSubjectQuery(e.target.value);
                  setSelectedSubject(null);
                  setIsSubjectDropdownOpen(true);
                }}
                placeholder="Type subject (e.g. Database Management Systems, DBMS, Data Structures...)"
                className="w-full rounded-2xl border-2 border-black dark:border-slate-600 bg-[#F8FAFC] dark:bg-[#0D1117] pl-11 pr-4 py-3.5 text-xs font-extrabold text-black dark:text-white placeholder-slate-400 outline-none focus:border-[#2563EB] shadow-sm transition-all"
              />
            </div>

            {isSubjectDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-2xl border-2 border-black bg-white dark:bg-[#0D1117] shadow-2xl p-2.5 space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                {subjectResults.map((subj) => (
                  <button
                    key={subj.subjectId}
                    type="button"
                    onClick={() => handleSelectSubject(subj)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-[#FFC400]/20 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <span className="font-extrabold text-black dark:text-white block">{subj.canonicalName}</span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">Aliases: {subj.aliases.slice(0, 3).join(', ')}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-bold rounded border border-slate-300 dark:border-slate-700">
                      {subj.subjectId}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. TIME REMAINING SELECTOR */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-slate-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#2563EB]" />
            <span>2. How Much Time Is Left Before Exam? *</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = !useCustomTime && selectedDuration.minutes === opt.minutes;
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => {
                    setUseCustomTime(false);
                    setSelectedDuration(opt);
                  }}
                  className={`py-3 px-3 rounded-2xl border-2 text-xs font-mono font-black transition-all cursor-pointer shadow-paper-xs ${
                    isSelected
                      ? 'border-black bg-[#2563EB] text-white shadow-paper'
                      : 'border-black dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0D1117] text-black dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setUseCustomTime(!useCustomTime)}
              className={`text-xs font-mono font-bold underline cursor-pointer ${useCustomTime ? 'text-[#2563EB]' : 'text-slate-500'}`}
            >
              {useCustomTime ? 'Use preset time options' : 'Enter custom time (in minutes)'}
            </button>
            {useCustomTime && (
              <input
                type="number"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="e.g. 45"
                className="w-32 rounded-xl border-2 border-black bg-[#F8FAFC] dark:bg-[#0D1117] px-3 py-1.5 text-xs font-mono font-bold text-black dark:text-white outline-none"
              />
            )}
          </div>
        </div>

        {/* 3. TEACHER KEY TOPICS (OPTIONAL) */}
        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-slate-200 flex items-center justify-between">
            <span>3. Teacher Key Topics (Optional)</span>
            <span className="text-[10px] text-slate-400 font-bold">Priority Boost</span>
          </label>
          <textarea
            value={teacherTopicsInput}
            onChange={(e) => setTeacherTopicsInput(e.target.value)}
            placeholder="Type key topics highlighted by teacher (e.g. Trees, AVL, Graphs, BFS, DFS, Normalization...)"
            rows={2}
            className="w-full rounded-2xl border-2 border-black dark:border-slate-600 bg-[#F8FAFC] dark:bg-[#0D1117] p-3.5 text-xs font-mono font-bold text-black dark:text-white placeholder-slate-400 outline-none focus:border-[#2563EB] custom-scrollbar"
          />
        </div>

        {/* 4. PREPARATION STYLE */}
        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-slate-200 block">
            4. Preparation Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'quick_survival', label: '⚡ Quick Survival', desc: 'Focus strictly on high-probability concepts & core formulas' },
              { id: 'balanced', label: '🎯 Balanced', desc: 'Optimal mix of theory, subjective questions, and practice quiz' },
              { id: 'deep_preparation', label: '🔬 Deep Preparation', desc: 'Comprehensive coverage including analytical trade-offs & edge cases' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIntensity(item.id as any)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  intensity === item.id
                    ? 'border-black bg-[#FFC400]/20 dark:bg-amber-400/10 border-2 border-black dark:border-amber-400 shadow-paper-xs'
                    : 'border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0D1117]'
                }`}
              >
                <div className="text-xs font-extrabold text-black dark:text-white block">{item.label}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-1 leading-normal">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* START CTA BUTTON */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-4 px-6 rounded-2xl border-2 border-black bg-[#FF4D4D] hover:bg-red-600 text-white font-heading text-sm font-black uppercase tracking-wider shadow-paper hover:shadow-paper-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Flame className="h-5 w-5 fill-white" />
            <span>START EXAM RUSH ENVIRONMENT</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
