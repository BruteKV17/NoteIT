/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  List, 
  Search, 
  Filter, 
  Volume2, 
  FileText, 
  Edit,
  Trash2, 
  Sparkles, 
  Clock, 
  ArrowUpRight,
  ExternalLink,
  CheckCircle,
  Plus,
  Play,
  RotateCw,
  Upload
} from 'lucide-react';
import { PageId, Lecture } from '../types';

interface LibraryViewProps {
  lectures: Lecture[];
  onAddLecture: (lecture: Lecture) => void;
  onDeleteLecture: (id: string) => void;
  onSaveDocument?: (title: string, subject: string, file: File) => Promise<void>;
  setActivePage: (page: PageId) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme?: 'light' | 'dark';
  onUpdateLecture?: (id: string, data: any) => Promise<void>;
}

export default function LibraryView({
  lectures,
  onAddLecture,
  onDeleteLecture,
  onSaveDocument,
  setActivePage,
  searchQuery,
  setSearchQuery,
  theme = 'dark',
  onUpdateLecture
}: LibraryViewProps) {
  
  // Renaming lecture states
  const [renamingLectureId, setRenamingLectureId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Stable stars generation for the premium space background
  const spaceStars = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 1.5 + 0.8,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 3,
    }));
  }, []);
  
  // States
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newType, setNewType] = useState<'recording' | 'pdf' | 'ppt' | 'text'>('pdf');

  // Subjects derived
  const subjectsList = ['All', 'Physics', 'Economics', 'Computer Science', 'Philosophy', 'Chemistry', 'Mathematics'];

  // Handle addition
  const handleAddNewLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (selectedFile && onSaveDocument) {
      onSaveDocument(newTitle.trim(), newSubject, selectedFile);
      setNewTitle('');
      setSelectedFile(null);
      setShowSyncModal(false);
      return;
    }

    const added: Lecture = {
      id: Math.random().toString(),
      title: newTitle,
      subject: newSubject,
      addedAt: 'Just now',
      status: 'transcribing',
      type: newType,
      duration: newType === 'recording' ? '12 mins' : undefined,
      pages: newType === 'pdf' ? 8 : undefined
    };

    onAddLecture(added);

    setNewTitle('');
    setShowSyncModal(false);
  };

  // Filter lectures
  const filteredLectures = lectures.filter(lec => {
    const matchesSearch = lec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lec.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = activeSubject === 'All' || lec.subject === activeSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="search-anchor-point">
      {/* Search Header and Action Row */}
      <div className={`relative rounded-3xl overflow-hidden border p-8 transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#0d0e12] border-neutral-800/80 shadow-2xl' 
          : 'bg-white border-gray-200 shadow-xs'
      }`}>
        {/* Animated Premium Space Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {theme === 'dark' ? (
            <>
              {/* Deep space cosmic gradient */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-[#0a0a0c] opacity-90" />
              <div className="absolute inset-0 bg-[#0d0e12] opacity-30 mix-blend-color-dodge" />
              
              {/* Twinkling stars */}
              {spaceStars.map((star) => (
                <div
                  key={star.id}
                  className="absolute bg-white rounded-full animate-pulse opacity-70"
                  style={{
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.duration}s`,
                  }}
                />
              ))}
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-50/50 to-white opacity-50" />
          )}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className={`font-sans font-black text-2xl md:text-3.5xl tracking-tight leading-none ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Academic Library
            </h2>
            <p className={`text-xs font-semibold mt-1.5 ${
              theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
            }`}>
              Central hub for outlines, text references, and recorded audio.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Dedicated Lecture Search Input */}
            <div className="relative">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${
                theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lectures..."
                className={`pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold outline-none border transition-all w-52 sm:w-64 ${
                  theme === 'dark' 
                    ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-indigo-500/50' 
                    : 'bg-[#F9FAFB] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black'
                }`}
              />
            </div>

            {/* List/Grid View toggles */}
            <div className={`flex items-center gap-1 p-1 rounded-xl ${
              theme === 'dark' ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-gray-200'
            }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`h-7.5 w-7.5 flex items-center justify-center rounded-lg cursor-pointer transition-all ${
                  viewMode === 'grid' 
                    ? theme === 'dark' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-black shadow-xs'
                    : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`h-7.5 w-7.5 flex items-center justify-center rounded-lg cursor-pointer transition-all ${
                  viewMode === 'list' 
                    ? theme === 'dark' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-black shadow-xs'
                    : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setActivePage('knowledge-studio')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black shadow-lg cursor-pointer transition-all active:scale-95 ${
                theme === 'dark' ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Sync New Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Subject */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap select-none">
        {subjectsList.map((subject) => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            className={`px-3.5 py-1.5 rounded-lg font-sans text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              activeSubject === subject
                ? theme === 'dark' ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400' : 'bg-black text-white'
                : theme === 'dark' 
                  ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Grid or List list output */}
      {filteredLectures.length === 0 ? (
        <div className={`rounded-2xl border p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl ${
          theme === 'dark' ? 'bg-[#0d0e12] border-neutral-900' : 'bg-white border-gray-200'
        }`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full mx-auto border border-dashed border-indigo-500/20 bg-indigo-500/5">
            <Filter className="h-5 w-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h4 className={`font-sans font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>No items found</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              We couldn't find matches for "{searchQuery || activeSubject}". Try resetting filters or recording a new lecture.
            </p>
          </div>
          <button
            onClick={() => { setSearchQuery(''); setActiveSubject('All'); }}
            className={`rounded-xl border px-3.5 py-1.8 text-xs font-bold cursor-pointer transition-all ${
              theme === 'dark' ? 'border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLectures.map((lec) => {
            const isRecording = lec.type === 'recording';
            const isTranscribing = lec.status === 'transcribing';
            return (
              <div 
                key={lec.id}
                className={`rounded-2xl border p-5 hover:scale-101 hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[195px] relative group overflow-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#0d0e12]/60 border-neutral-900 hover:border-indigo-500/20 shadow-2xl' 
                    : 'bg-white border-gray-200 hover:border-black/30 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Category and icon indicator */}
                  <div className="flex items-center justify-between">
                    <span className={`rounded px-2.5 py-0.5 text-[9.5px] font-black tracking-wide uppercase ${
                      theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {lec.subject}
                    </span>
                    <div className={`p-2 rounded-xl border ${
                      isRecording 
                        ? theme === 'dark' ? 'bg-orange-500/10 border-orange-500/10 text-orange-400' : 'bg-orange-50/70 border-orange-100 text-orange-600'
                        : theme === 'dark' ? 'bg-blue-500/10 border-blue-500/10 text-blue-400' : 'bg-blue-50/70 border-blue-100 text-blue-600'
                    }`}>
                      {isRecording ? <Volume2 className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
                    </div>
                  </div>

                  {/* Title or Rename Input */}
                  {renamingLectureId === lec.id ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!renamingTitle.trim()) return;
                        try {
                          if (onUpdateLecture) {
                            await onUpdateLecture(lec.id, { title: renamingTitle.trim() });
                          }
                          setRenamingLectureId(null);
                        } catch (err) {
                          console.error("Failed to rename lecture:", err);
                        }
                      }}
                      className="flex items-center gap-1.5 mt-4"
                    >
                      <input
                        type="text"
                        value={renamingTitle}
                        onChange={(e) => setRenamingTitle(e.target.value)}
                        className={`rounded-lg text-xs font-semibold px-2 py-1.5 focus:border-indigo-500 outline-none w-full ${
                          theme === 'dark' ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-[#F9FAFB] border border-gray-200 text-gray-900'
                        }`}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans text-[10px] font-bold cursor-pointer hover:bg-emerald-500/20 transition-all focus:outline-none"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingLectureId(null)}
                        className="px-2 py-1 rounded bg-neutral-900/65 border border-neutral-800 text-neutral-400 font-sans text-[10px] font-bold cursor-pointer hover:bg-neutral-800 transition-all focus:outline-none"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <h3 className={`font-sans font-black text-sm mt-4 leading-normal line-clamp-2 pr-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {lec.title}
                    </h3>
                  )}

                  <div className="flex items-center gap-4.5 text-[11px] font-medium text-gray-400 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-400/50" />
                      {lec.addedAt}
                    </span>
                    {lec.pages && <span>{lec.pages} pages</span>}
                    {lec.duration && <span>{lec.duration}</span>}
                  </div>
                </div>

                {/* Sub Action panel container */}
                <div className={`mt-6 pt-3.5 border-t flex items-center justify-between ${
                  theme === 'dark' ? 'border-neutral-900' : 'border-gray-100'
                }`}>
                  {isTranscribing ? (
                    <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[11px] animate-pulse">
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      <span>TRANSCRIBING AUDIO...</span>
                    </div>
                  ) : lec.status === 'uploading' ? (
                    <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-[11px] animate-pulse">
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      <span>UPLOADING DOCUMENT...</span>
                    </div>
                  ) : lec.status === 'extracting' ? (
                    <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px] animate-pulse">
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      <span>EXTRACTING TEXT...</span>
                    </div>
                  ) : lec.status === 'analyzing' ? (
                    <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[11px] animate-pulse">
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      <span>AI ANALYZING...</span>
                    </div>
                  ) : lec.status === 'generating_notes' ? (
                    <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[11px] animate-pulse">
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      <span>GENERATING NOTES...</span>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1.5 font-bold text-[11px] ${
                      theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                    }`}>
                      <CheckCircle className="h-3.5 w-3.5 fill-emerald-500/15" />
                      <span>SYNTHESIZED READY</span>
                    </div>
                  )}

                  {!isTranscribing && (
                    <button
                      onClick={() => setActivePage('research-hub')}
                      className={`group flex items-center gap-1 text-xs font-black transition-all focus:outline-none cursor-pointer ${
                        theme === 'dark' ? 'text-white hover:text-indigo-400' : 'text-black hover:opacity-75'
                      }`}
                    >
                      <span>Analyze Workspace</span>
                      <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  )}
                </div>

                {/* Inline Action Overlays: Rename/Delete */}
                <div className="absolute top-4 right-14 flex items-center gap-1">
                  <button
                    onClick={() => {
                      setRenamingLectureId(lec.id);
                      setRenamingTitle(lec.title);
                    }}
                    className={`h-7 w-7 rounded-lg items-center justify-center hidden group-hover:flex focus:outline-none cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-indigo-500/10 text-neutral-500 hover:text-indigo-400' : 'hover:bg-indigo-50 text-gray-400 hover:text-indigo-600'
                    }`}
                    title="Rename Lecture"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this lecture?")) {
                        onDeleteLecture(lec.id);
                      }
                    }}
                    className={`h-7 w-7 rounded-lg items-center justify-center hidden group-hover:flex focus:outline-none cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-red-500/10 text-neutral-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                    }`}
                    title="Delete Lecture"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List layout mode */
        <div className={`rounded-2xl border overflow-hidden shadow-2xl transition-all ${
          theme === 'dark' ? 'bg-[#0d0e12]/60 border-neutral-900' : 'bg-white border-gray-200'
        }`}>
          {/* Mobile Stacked List View */}
          <div className="block md:hidden divide-y divide-gray-100 dark:divide-neutral-900">
            {filteredLectures.map((lec) => {
              const isRecording = lec.type === 'recording';
              const isTranscribing = lec.status === 'transcribing';
              return (
                <div key={lec.id} className="p-4 space-y-3 font-sans relative">
                  <div className="flex items-center justify-between">
                    <span className={`rounded px-2.5 py-0.5 text-[8.5px] font-black tracking-wide uppercase ${
                      theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {lec.subject}
                    </span>
                    <div className={`p-1.5 rounded-lg border ${
                      isRecording 
                        ? theme === 'dark' ? 'bg-orange-500/10 border-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'
                        : theme === 'dark' ? 'bg-blue-500/10 border-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {isRecording ? <Volume2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  <div>
                    {renamingLectureId === lec.id ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!renamingTitle.trim()) return;
                          try {
                            if (onUpdateLecture) {
                              await onUpdateLecture(lec.id, { title: renamingTitle.trim() });
                            }
                            setRenamingLectureId(null);
                          } catch (err) {
                            console.error("Failed to rename lecture:", err);
                          }
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={renamingTitle}
                          onChange={(e) => setRenamingTitle(e.target.value)}
                          className={`rounded-lg text-xs font-semibold px-2 py-1.5 focus:border-indigo-500 outline-none w-full ${
                            theme === 'dark' ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-[#F9FAFB] border border-gray-200 text-gray-900'
                          }`}
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans text-[10px] font-bold cursor-pointer hover:bg-emerald-500/20 focus:outline-none"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingLectureId(null)}
                          className="px-2 py-1 rounded bg-neutral-900/65 border border-neutral-800 text-neutral-400 font-sans text-[10px] font-bold cursor-pointer hover:bg-neutral-800 focus:outline-none"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <span className={`text-xs font-bold block ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {lec.title}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-400/50" />
                      {lec.addedAt}
                    </span>
                    {lec.pages && <span>{lec.pages} pages</span>}
                    {lec.duration && <span>{lec.duration}</span>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-900/10 dark:border-neutral-900/40">
                    <div>
                      {isTranscribing ? (
                        <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-[10px] animate-pulse">
                          <RotateCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Transcribing...</span>
                        </span>
                      ) : lec.status === 'uploading' ? (
                        <span className="inline-flex items-center gap-1 text-indigo-500 font-bold text-[10px] animate-pulse">
                          <RotateCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] ${
                          theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          <CheckCircle className="h-3 w-3 fill-emerald-500/10" />
                          <span>Synthesized</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isTranscribing && (
                        <button
                          onClick={() => setActivePage('research-hub')}
                          className={`rounded px-2.5 py-1 text-[10px] font-black transition-all cursor-pointer ${
                            theme === 'dark' ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-800'
                          }`}
                        >
                          Workspace
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setRenamingLectureId(lec.id);
                          setRenamingTitle(lec.title);
                        }}
                        className={`rounded p-1 hover:bg-indigo-500/10 cursor-pointer ${
                          theme === 'dark' ? 'text-neutral-400 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-600'
                        }`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this lecture?")) {
                            onDeleteLecture(lec.id);
                          }
                        }}
                        className={`rounded p-1 hover:bg-red-500/10 cursor-pointer ${
                          theme === 'dark' ? 'text-neutral-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table List View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse select-text">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'bg-neutral-950/60 border-neutral-900' : 'bg-gray-50/60 border-gray-200'}`}>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Document Title</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest font-sans">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Added At</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-neutral-900' : 'divide-gray-100'}`}>
                {filteredLectures.map((lec) => {
                  const isRecording = lec.type === 'recording';
                  const isTranscribing = lec.status === 'transcribing';
                  return (
                    <tr key={lec.id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-neutral-950/30' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-6 py-4 select-none">
                        <div className={`p-2 rounded-lg border inline-block ${
                          isRecording 
                            ? theme === 'dark' ? 'bg-orange-500/10 border-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'
                            : theme === 'dark' ? 'bg-blue-500/10 border-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {isRecording ? <Volume2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renamingLectureId === lec.id ? (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!renamingTitle.trim()) return;
                              try {
                                if (onUpdateLecture) {
                                  await onUpdateLecture(lec.id, { title: renamingTitle.trim() });
                                }
                                setRenamingLectureId(null);
                              } catch (err) {
                                console.error("Failed to rename lecture:", err);
                              }
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <input
                              type="text"
                              value={renamingTitle}
                              onChange={(e) => setRenamingTitle(e.target.value)}
                              className={`rounded-lg text-xs font-semibold px-2 py-1.5 focus:border-indigo-500 outline-none w-56 sm:w-64 ${
                                theme === 'dark' ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-[#F9FAFB] border border-gray-200 text-gray-900'
                              }`}
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans text-[10px] font-bold cursor-pointer hover:bg-emerald-500/20 transition-all focus:outline-none"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingLectureId(null)}
                              className="px-2 py-1 rounded bg-neutral-900/65 border border-neutral-800 text-neutral-400 font-sans text-[10px] font-bold cursor-pointer hover:bg-neutral-800 transition-all focus:outline-none"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <span className={`text-sm font-bold block ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {lec.title}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 select-none">
                        <span className={`rounded px-2.5 py-0.5 text-[9px] font-black tracking-wide uppercase ${
                          theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {lec.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-500 font-mono">
                        {lec.pages && <span>{lec.pages} pages</span>}
                        {lec.duration && <span>{lec.duration}</span>}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-400 font-mono">{lec.addedAt}</td>
                      <td className="px-6 py-4">
                        {isTranscribing ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-xs animate-pulse">
                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Transcribing...</span>
                          </span>
                        ) : lec.status === 'uploading' ? (
                          <span className="inline-flex items-center gap-1.5 text-indigo-500 font-bold text-xs animate-pulse">
                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </span>
                        ) : lec.status === 'extracting' ? (
                          <span className="inline-flex items-center gap-1.5 text-indigo-400 font-bold text-xs animate-pulse">
                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Extracting...</span>
                          </span>
                        ) : lec.status === 'analyzing' ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-xs animate-pulse">
                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Analyzing...</span>
                          </span>
                        ) : lec.status === 'generating_notes' ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-xs animate-pulse">
                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Generating notes...</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                            theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                          }`}>
                            <CheckCircle className="h-3.5 w-3.5 fill-emerald-500/10" />
                            <span>Synthesized</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right select-none">
                        <div className="flex items-center justify-end gap-2">
                          {!isTranscribing && (
                            <button
                              onClick={() => setActivePage('research-hub')}
                              className={`rounded px-2.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                                theme === 'dark' ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-800'
                              }`}
                            >
                              Workspace
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setRenamingLectureId(lec.id);
                              setRenamingTitle(lec.title);
                            }}
                            className={`rounded p-1.5 hover:bg-indigo-500/10 cursor-pointer ${
                              theme === 'dark' ? 'text-neutral-500 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-600'
                            }`}
                            title="Rename"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this lecture?")) {
                                onDeleteLecture(lec.id);
                              }
                            }}
                            className={`rounded p-1.5 hover:bg-red-500/10 cursor-pointer ${
                              theme === 'dark' ? 'text-neutral-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                            }`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className={`rounded-2xl max-w-md w-full border p-6 space-y-4 shadow-2xl relative ${
            theme === 'dark' ? 'bg-[#0d0e12] border-neutral-900 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              theme === 'dark' ? 'border-neutral-900' : 'border-gray-100'
            }`}>
              <h3 className="font-sans font-black text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Upload & Sync Lecture Materials</span>
              </h3>
              <button 
                onClick={() => setShowSyncModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddNewLecture} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase font-mono">LECTURE TITLE</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cognitive Neurology and Motor Synapses"
                  className={`w-full rounded-xl text-xs font-semibold outline-none p-3.5 transition-all mt-1 ${
                    theme === 'dark' 
                      ? 'bg-neutral-950 border border-neutral-900 text-white placeholder-neutral-600 focus:border-indigo-500' 
                      : 'bg-[#F9FAFB] border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-black focus:bg-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase font-mono">SUBJECT FIELD</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className={`w-full rounded-xl text-xs font-semibold outline-none p-3 mt-1 cursor-pointer ${
                      theme === 'dark' ? 'bg-neutral-950 border border-neutral-900 text-white' : 'bg-[#F9FAFB] border border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="Economics">Economics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase font-mono">MATERIAL FORMAT</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className={`w-full rounded-xl text-xs font-semibold outline-none p-3 mt-1 cursor-pointer ${
                      theme === 'dark' ? 'bg-neutral-950 border border-neutral-900 text-white' : 'bg-[#F9FAFB] border border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="pdf">Academic PDF Paper</option>
                    <option value="recording">WAV / MP3 Audio Lecture</option>
                    <option value="ppt">Slides Presentation (PPT)</option>
                    <option value="text">Formatted Text Note</option>
                  </select>
                </div>
              </div>

              {/* Usability Guidelines: Drag and Drop block */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-2xl p-5 text-center cursor-pointer hover:border-indigo-500/50 transition-all ${
                  theme === 'dark' ? 'bg-neutral-950/45 border-neutral-900' : 'bg-gray-50/50 border-gray-300'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.docx,.pptx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!newTitle.trim()) {
                        setNewTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                      }
                    }
                  }}
                />
                {selectedFile ? (
                  <div className="space-y-1">
                    <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto" />
                    <div className="text-xs font-bold text-emerald-400 truncate max-w-xs mx-auto">{selectedFile.name}</div>
                    <div className="text-[10px] text-neutral-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-neutral-500 mx-auto" />
                    <div className="text-xs font-bold text-neutral-300 mt-2">Drag and drop file here</div>
                    <div className="text-[10px] text-neutral-500 mt-1">Accepts up to 150MB of PDFs, DOCX, or PPTX.</div>
                  </>
                )}
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${
                theme === 'dark' ? 'border-neutral-900' : 'border-gray-100'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-black cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-4.5 py-2.5 text-xs font-black shadow-lg cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-900'
                  }`}
                >
                  Sync Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
