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
  AlertCircle,
  Plus,
  Play,
  RotateCw,
  Upload,
  Settings,
  Brain,
  RefreshCw,
  MoreVertical,
  BookOpen,
  Folder as FolderIcon,
  FolderPlus,
  FolderOpen,
  FolderCheck,
  MoveRight,
  ChevronRight,
  X
} from 'lucide-react';
import { PageId, Lecture, Folder } from '../types';
import { generateResourcesFromTranscript } from '../services/gemini';
import { useFolders } from '../hooks/useFolders';
import { auth } from '../firebaseConfig';

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
  setActiveLectureId?: (id: string | null) => void;
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
  onUpdateLecture,
  setActiveLectureId
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

  // Resource Generation States
  const [generatingLectureId, setGeneratingLectureId] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [generationError, setGenerationError] = useState<{ message: string; code?: string; provider?: string } | null>(null);
  const [confirmRegenerateLectureId, setConfirmRegenerateLectureId] = useState<string | null>(null);

  const handleRetryOrGenerateResources = async (lectureId: string, modeType: 'missing' | 'all' = 'missing') => {
    setGeneratingLectureId(lectureId);
    setGenerationStep(1);
    setGenerationError(null);

    try {
      setGenerationStep(1); // Reading transcript
      await new Promise(r => setTimeout(r, 400));
      
      setGenerationStep(2); // Generating summary & notes
      await generateResourcesFromTranscript(lectureId, undefined, { mode: 'academic', modeType });

      setGenerationStep(5); // Complete
      await new Promise(r => setTimeout(r, 600));
      setGeneratingLectureId(null);
    } catch (err: any) {
      console.error("Resource generation failed:", err);
      setGenerationError({
        message: err.message || "Failed to generate AI resources. Your transcript is safe.",
        code: err.code,
        provider: err.provider
      });
    }
  };

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
      setDestinationFolderForUpload('');
      setShowSyncModal(false);
      return;
    }

    const added: Lecture = {
      id: Math.random().toString(),
      title: newTitle,
      subject: newSubject,
      folderId: destinationFolderForUpload || undefined,
      addedAt: 'Just now',
      status: 'transcribing',
      type: newType,
      duration: newType === 'recording' ? '12 mins' : undefined,
      pages: newType === 'pdf' ? 8 : undefined
    };

    onAddLecture(added);

    setNewTitle('');
    setDestinationFolderForUpload('');
    setShowSyncModal(false);
  };

  // Folder Hook & States
  const { folders, addFolder, deleteFolder, renameFolder } = useFolders(auth.currentUser?.uid);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderColor, setNewFolderColor] = useState<string>('#2F6BFF');
  const [movingLectureId, setMovingLectureId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>('');
  const [destinationFolderForUpload, setDestinationFolderForUpload] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || isCreatingFolder) return;
    
    setIsCreatingFolder(true);
    try {
      const createdId = await addFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName('');
      setShowCreateFolderModal(false);
      if (createdId) {
        setSelectedFolderId(createdId);
      }
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleMoveLecture = async (lectureId: string, folderId: string) => {
    try {
      if (onUpdateLecture) {
        await onUpdateLecture(lectureId, { folderId: folderId || undefined });
      }
      setMovingLectureId(null);
    } catch (err) {
      console.error('Failed to move lecture to folder:', err);
    }
  };

  // Filter lectures by search and folder
  const filteredLectures = lectures.filter(lec => {
    const matchesSearch = lec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lec.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFolder = true;
    if (selectedFolderId === 'unorganized') {
      matchesFolder = !lec.folderId;
    } else if (selectedFolderId !== 'all') {
      matchesFolder = lec.folderId === selectedFolderId;
    }

    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* 1. ACADEMIC LIBRARY BAUHAUS HERO BANNER */}
      <div className="hero-banner relative rounded-[6px] border-2 border-[var(--border-main)] p-6 md:p-8 shadow-paper-lg flex flex-col justify-between overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-[4px] bg-[#FFC400] text-[#111111] font-mono text-[10px] font-extrabold uppercase border border-[#FFC400] shadow-paper-sm">
                NOTEIT COGNITIVE HUB
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-3xl md:text-5xl tracking-tight text-[var(--text-primary)] uppercase leading-tight">
              ACADEMIC LIBRARY
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] font-mono font-bold border-l-4 border-[#FFC400] pl-3 py-1">
              CENTRAL HUB FOR SYNTHESIZED OUTLINES, TEXT REFERENCES, AND PROCESSED AUDIO NODES.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setActivePage('knowledge-studio')}
              className="px-4 py-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] font-extrabold uppercase text-xs shadow-paper-sm hover:bg-[#ffe066] transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="h-4 w-4 text-[#111111] stroke-[3]" />
              <span>Sync Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ACADEMIC FOLDERS SECTION */}
      <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-5 shadow-paper-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[var(--border-main)] pb-3">
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-[#FFC400]" />
            <h2 className="font-heading font-extrabold text-sm md:text-base uppercase tracking-tight text-[var(--text-primary)]">
              MY FOLDERS & COLLECTIONS
            </h2>
            <span className="px-2 py-0.5 rounded-[4px] bg-[#FFC400] text-[#111111] text-[10px] font-mono font-extrabold border border-[#111111]">
              {folders.length} FOLDERS
            </span>
          </div>

          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="px-3.5 py-1.5 rounded-[4px] border-2 border-[var(--border-main)] bg-[#2F6BFF] text-white text-xs font-mono font-extrabold uppercase shadow-paper-sm hover:bg-[#255cd9] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <FolderPlus className="h-4 w-4 text-white" />
            <span>+ Create Folder</span>
          </button>
        </div>

        {/* Folders List Carousel / Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          
          {/* ALL FILES FOLDER */}
          <div
            onClick={() => setSelectedFolderId('all')}
            className={`rounded-[6px] border-2 p-3 flex flex-col justify-between cursor-pointer transition-all ${
              selectedFolderId === 'all'
                ? 'bg-[#FFC400] border-[#111111] text-[#111111] shadow-paper-md font-black'
                : 'bg-[var(--panel-bg)] border-[var(--border-main)] text-[var(--text-primary)] hover:border-[#FFC400]'
            }`}
          >
            <div className="flex items-center justify-between">
              <FolderOpen className="h-5 w-5" />
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/10">
                {lectures.length}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs font-mono font-extrabold block truncate uppercase">All Files</span>
              <span className="text-[9px] font-mono opacity-70 block">Root Library</span>
            </div>
          </div>

          {/* UNORGANIZED FOLDER */}
          <div
            onClick={() => setSelectedFolderId('unorganized')}
            className={`rounded-[6px] border-2 p-3 flex flex-col justify-between cursor-pointer transition-all ${
              selectedFolderId === 'unorganized'
                ? 'bg-[#FFC400] border-[#111111] text-[#111111] shadow-paper-md font-black'
                : 'bg-[var(--panel-bg)] border-[var(--border-main)] text-[var(--text-primary)] hover:border-[#FFC400]'
            }`}
          >
            <div className="flex items-center justify-between">
              <FolderIcon className="h-5 w-5 text-gray-400" />
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/10">
                {lectures.filter(l => !l.folderId).length}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs font-mono font-extrabold block truncate uppercase">Unorganized</span>
              <span className="text-[9px] font-mono opacity-70 block">No Folder</span>
            </div>
          </div>

          {/* CUSTOM USER FOLDERS */}
          {folders.map(folder => {
            const count = lectures.filter(l => l.folderId === folder.id).length;
            const isSelected = selectedFolderId === folder.id;

            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`rounded-[6px] border-2 p-3 flex flex-col justify-between cursor-pointer transition-all relative group ${
                  isSelected
                    ? 'bg-[#FFC400] border-[#111111] text-[#111111] shadow-paper-md font-black'
                    : 'bg-[var(--panel-bg)] border-[var(--border-main)] text-[var(--text-primary)] hover:border-[#FFC400]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="h-3 w-3 rounded-full border border-black/20" 
                      style={{ backgroundColor: folder.color || '#2F6BFF' }} 
                    />
                    <FolderIcon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/10">
                      {count}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete folder "${folder.name}"? Files inside will move to Unorganized.`)) {
                          deleteFolder(folder.id);
                          if (selectedFolderId === folder.id) setSelectedFolderId('all');
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20 text-red-500"
                      title="Delete Folder"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  {editingFolderId === folder.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editingFolderName.trim()) {
                          renameFolder(folder.id, editingFolderName.trim());
                        }
                        setEditingFolderId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="text"
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        className="w-full text-[10px] font-bold p-1 rounded bg-white text-black border outline-none"
                        autoFocus
                      />
                      <button type="submit" className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-mono font-bold">OK</button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold block truncate uppercase">{folder.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 rounded"
                        title="Rename Folder"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </div>



      {/* Grid or List list output */}
      {filteredLectures.length === 0 ? (
        <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-12 text-center max-w-xl mx-auto space-y-4 shadow-paper-lg text-[var(--text-primary)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-[6px] mx-auto border-2 border-[#111111] bg-[#FFC400] text-[#111111] shadow-paper-sm">
            <Filter className="h-6 w-6 text-[#111111]" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base text-[#111111] uppercase">No items found</h4>
            <p className="text-xs text-[#666666] font-mono mt-1 max-w-xs mx-auto">
              We couldn't find matches for "{searchQuery || activeSubject}". Try resetting filters or recording a new lecture.
            </p>
          </div>
          <button
            onClick={() => { setSearchQuery(''); setActiveSubject('All'); }}
            className="rounded-[6px] border-2 border-[#111111] bg-[#FFC400] px-4 py-2 text-xs font-mono font-bold text-[#111111] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLectures.map((lec) => {
            const isRecording = lec.type === 'recording';
            const isTranscribing = lec.status === 'transcribing';
            return (
              <div 
                key={lec.id}
                className="rounded-[6px] border-2 border-[#111111] bg-white p-5 hover:shadow-paper-lg transition-all flex flex-col justify-between min-h-[210px] relative group shadow-paper-md text-[#111111]"
              >
                <div>
                  {/* Category badge header */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-[4px] px-2.5 py-1 text-[10px] font-mono font-extrabold tracking-wide uppercase bg-[#FFC400] text-[#111111] border border-[#111111] shadow-paper-sm">
                      {lec.subject}
                    </span>
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
                        className="rounded-[4px] text-xs font-mono font-bold p-2 border-2 border-[#111111] bg-white text-[#111111] outline-none w-full"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-[4px] bg-[#19B56B] text-white border-2 border-[#111111] font-mono text-[10px] font-bold uppercase cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingLectureId(null)}
                        className="px-3 py-2 rounded-[4px] bg-white text-[#111111] border-2 border-[#111111] font-mono text-[10px] font-bold uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <h3 className="font-heading font-extrabold text-base text-[#111111] mt-4 uppercase leading-snug line-clamp-2 pr-2 tracking-tight">
                      {lec.title}
                    </h3>
                  )}

                  <div className="flex items-center gap-4 text-xs font-mono text-[#666666] font-bold mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#111111]" />
                      {lec.addedAt}
                    </span>
                    {lec.pages && <span>{lec.pages} pages</span>}
                    {lec.duration && <span>{lec.duration}</span>}
                  </div>

                  {/* Stage Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 select-none">
                    {(lec.transcript || lec.cleanTranscript || lec.transcriptionStatus === 'completed') && (
                      <span className="rounded-[4px] px-2 py-0.5 text-[9.5px] font-mono font-bold bg-[#2F6BFF]/15 text-[#111111] border border-[#111111] inline-flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-[#2F6BFF]" />
                        Transcript Ready
                      </span>
                    )}

                    {lec.resourceGenerationStatus === 'failed' || lec.status === 'failed' || lec.resourceGenerationError ? (
                      <span className="rounded-[4px] px-2 py-0.5 text-[9.5px] font-mono font-bold bg-[#FF4D4D]/20 text-[#111111] border border-[#111111] inline-flex items-center gap-1" title={lec.resourceGenerationError?.message}>
                        <AlertCircle className="h-3 w-3 text-[#FF4D4D] animate-pulse" />
                        AI Resources Failed
                      </span>
                    ) : lec.summary && lec.notes ? (
                      <span className="rounded-[4px] px-2 py-0.5 text-[9.5px] font-mono font-bold bg-[#19B56B]/20 text-[#111111] border border-[#111111] inline-flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-[#19B56B]" />
                        AI Resources Ready
                      </span>
                    ) : (lec.transcript || lec.cleanTranscript) ? (
                      <span className="rounded-[4px] px-2 py-0.5 text-[9.5px] font-mono font-bold bg-[#FFC400] text-[#111111] border border-[#111111] inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-[#111111]" />
                        Resources Missing
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Sub Action panel container */}
                <div className="mt-5 pt-3.5 border-t-2 border-[#111111]">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (setActiveLectureId) setActiveLectureId(lec.id);
                        setActivePage('research-hub');
                      }}
                      className="group flex items-center gap-1 text-xs font-mono font-extrabold uppercase text-[#111111] hover:underline cursor-pointer"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>View Transcript</span>
                      <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    {lec.resourceGenerationStatus === 'failed' || lec.status === 'failed' || lec.resourceGenerationError ? (
                      <button
                        onClick={() => handleRetryOrGenerateResources(lec.id, 'missing')}
                        className="px-3 py-1.5 rounded-[4px] bg-[#FF4D4D] text-white border-2 border-[#111111] text-xs font-mono font-bold uppercase hover:bg-[#ff3333] transition-colors cursor-pointer flex items-center gap-1 shadow-paper-sm"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>Retry Generation</span>
                      </button>
                    ) : (!lec.summary || !lec.notes) && (lec.transcript || lec.cleanTranscript) ? (
                      <button
                        onClick={() => handleRetryOrGenerateResources(lec.id, 'missing')}
                        className="px-3 py-1.5 rounded-[4px] bg-[#2F6BFF] text-white border-2 border-[#111111] text-xs font-mono font-bold uppercase hover:bg-[#1a57ee] transition-colors cursor-pointer flex items-center gap-1 shadow-paper-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Generate Resources</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmRegenerateLectureId(lec.id)}
                        className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-[#666666] hover:text-[#111111] transition-colors cursor-pointer flex items-center gap-1"
                        title="Regenerate All Resources"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Regenerate All</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Action Overlays: Rename/Delete */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setRenamingLectureId(lec.id);
                      setRenamingTitle(lec.title);
                    }}
                    className="h-7 w-7 rounded-[4px] items-center justify-center hidden group-hover:flex border-2 border-[#111111] bg-white text-[#111111] shadow-paper-sm hover:bg-[#FFC400] cursor-pointer"
                    title="Rename Lecture"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this lecture?")) {
                        onDeleteLecture(lec.id);
                      }
                    }}
                    className="h-7 w-7 rounded-[4px] items-center justify-center hidden group-hover:flex border-2 border-[#111111] bg-[#FF4D4D] text-white shadow-paper-sm hover:bg-[#ff3333] cursor-pointer"
                    title="Delete Lecture"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
                          <FileText className="h-4 w-4" />
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

              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase font-mono mb-1">SAVE TO FOLDER (OPTIONAL)</label>
                <select
                  value={destinationFolderForUpload}
                  onChange={(e) => setDestinationFolderForUpload(e.target.value)}
                  className={`w-full rounded-xl text-xs font-semibold outline-none p-3 cursor-pointer ${
                    theme === 'dark' ? 'bg-neutral-950 border border-neutral-900 text-white' : 'bg-[#F9FAFB] border border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="">📂 Unorganized / Root Library</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>📁 {f.name}</option>
                  ))}
                </select>
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

      {/* Generation Progress Modal */}
      {generatingLectureId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className={`rounded-3xl border p-7 max-w-md w-full space-y-6 shadow-2xl ${
            theme === 'dark' ? 'bg-[#0d0e12] border-neutral-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Brain className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-sans font-black text-lg">Generating Study Resources</h3>
                <p className="text-xs font-semibold text-gray-400">Processing transcript through active AI provider...</p>
              </div>
            </div>

            <div className="space-y-3 font-sans">
              <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                generationStep >= 1 ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-neutral-800/50 text-gray-500'
              }`}>
                {generationStep > 1 ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <RotateCw className="h-4 w-4 animate-spin text-indigo-400" />}
                <span className="text-xs font-bold">1. Reading transcript</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                generationStep >= 2 ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : generationStep === 2 ? 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400' : 'border-neutral-800/50 text-gray-500'
              }`}>
                {generationStep > 2 ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : generationStep === 2 ? <RotateCw className="h-4 w-4 animate-spin text-indigo-400" /> : <Clock className="h-4 w-4" />}
                <span className="text-xs font-bold">2. Creating summary</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                generationStep >= 3 ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : generationStep === 2 ? 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400' : 'border-neutral-800/50 text-gray-500'
              }`}>
                {generationStep > 3 ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : generationStep === 2 ? <RotateCw className="h-4 w-4 animate-spin text-indigo-400" /> : <Clock className="h-4 w-4" />}
                <span className="text-xs font-bold">3. Creating academic notes</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                generationStep >= 4 ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-neutral-800/50 text-gray-500'
              }`}>
                {generationStep >= 4 ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Clock className="h-4 w-4" />}
                <span className="text-xs font-bold">4. Creating flashcards & quiz</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                generationStep >= 5 ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-neutral-800/50 text-gray-500'
              }`}>
                {generationStep >= 5 ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Clock className="h-4 w-4" />}
                <span className="text-xs font-bold">5. Creating mind map & saving workspace</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generation Error Modal */}
      {generationError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`rounded-3xl border p-7 max-w-md w-full space-y-5 shadow-2xl text-center ${
            theme === 'dark' ? 'bg-[#0d0e12] border-neutral-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
            <div>
              <h3 className="font-sans font-black text-lg">AI Resource Generation Failed</h3>
              <div className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-lg p-2.5 flex items-center justify-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                <span>Your lecture recording and transcript are safe.</span>
              </div>
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">{generationError.message}</p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  const targetId = generatingLectureId;
                  setGenerationError(null);
                  if (targetId) handleRetryOrGenerateResources(targetId, 'missing');
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <RotateCw className="h-4 w-4" />
                <span>Retry Generation</span>
              </button>
              <button
                onClick={() => {
                  setGenerationError(null);
                  setGeneratingLectureId(null);
                  setActivePage('settings');
                }}
                className="w-full py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Settings className="h-4 w-4" />
                <span>Change AI Provider in Settings</span>
              </button>
              <button
                onClick={() => {
                  setGenerationError(null);
                  setGeneratingLectureId(null);
                }}
                className="w-full py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Regenerate All Modal */}
      {confirmRegenerateLectureId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`rounded-3xl border p-7 max-w-md w-full space-y-5 shadow-2xl ${
            theme === 'dark' ? 'bg-[#0d0e12] border-neutral-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-sans font-black text-lg">Regenerate All Resources?</h3>
                <p className="text-xs font-semibold text-gray-400">Overwrites existing generated study content.</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              This action will re-process the existing transcript to generate a fresh Summary, Notes, Flashcards, Quiz, Mind Map, and Weak Topics. Existing generated content will be overwritten.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmRegenerateLectureId(null)}
                className="px-4 py-2.5 rounded-xl border border-neutral-800 text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetId = confirmRegenerateLectureId;
                  setConfirmRegenerateLectureId(null);
                  handleRetryOrGenerateResources(targetId, 'all');
                }}
                className="px-4.5 py-2.5 rounded-xl bg-amber-500 text-black hover:bg-amber-400 text-xs font-black transition-all cursor-pointer shadow-md"
              >
                Regenerate All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW FOLDER MODAL */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[6px] border-2 border-[#111111] bg-white p-6 max-w-md w-full space-y-5 shadow-paper-lg text-[#111111]">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-[#2F6BFF]" />
                <h3 className="font-heading font-extrabold text-sm uppercase">Create New Academic Folder</h3>
              </div>
              <button 
                onClick={() => setShowCreateFolderModal(false)}
                className="p-1 rounded border border-[#111111] hover:bg-[#FFC400] text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-extrabold uppercase mb-1">Folder Title</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Operating Systems - Unit 1"
                  className="w-full rounded-[6px] border-2 border-[#111111] p-3 text-xs font-mono font-bold outline-none bg-white text-[#111111]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-extrabold uppercase mb-1">Color Theme Badge</label>
                <div className="flex gap-2 pt-1">
                  {['#2F6BFF', '#FFC400', '#19B56B', '#FF4D4D', '#9333EA', '#FF8800'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFolderColor(color)}
                      className={`h-7 w-7 rounded-full border-2 border-[#111111] transition-transform cursor-pointer ${
                        newFolderColor === color ? 'scale-125 shadow-paper-sm border-black' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#111111]">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-4 py-2 rounded-[4px] border-2 border-[#111111] bg-white text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-5 py-2 rounded-[4px] border-2 border-[#111111] bg-[#FFC400] text-xs font-mono font-extrabold uppercase shadow-paper-sm hover:bg-[#ffe066] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isCreatingFolder ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Folder</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE FILE TO FOLDER MODAL */}
      {movingLectureId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[6px] border-2 border-[#111111] bg-white p-6 max-w-md w-full space-y-4 shadow-paper-lg text-[#111111]">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-3">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-5 w-5 text-[#FFC400]" />
                <h3 className="font-heading font-extrabold text-sm uppercase">Move Document to Folder</h3>
              </div>
              <button 
                onClick={() => setMovingLectureId(null)}
                className="p-1 rounded border border-[#111111] hover:bg-[#FFC400] text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs font-mono font-bold text-[#666666]">
              Select a target folder to organize this academic document:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => handleMoveLecture(movingLectureId, '')}
                className="w-full text-left p-3 rounded-[6px] border-2 border-[#111111] bg-[#F6F2EA] hover:bg-[#FFC400] transition-colors font-mono text-xs font-bold flex items-center justify-between cursor-pointer"
              >
                <span>📂 Unorganized (Remove from folder)</span>
                <MoveRight className="h-4 w-4" />
              </button>

              {folders.map(folder => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleMoveLecture(movingLectureId, folder.id)}
                  className="w-full text-left p-3 rounded-[6px] border-2 border-[#111111] bg-white hover:bg-[#FFC400] transition-colors font-mono text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: folder.color || '#2F6BFF' }} />
                    <span>{folder.name}</span>
                  </span>
                  <MoveRight className="h-4 w-4" />
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#111111]">
              <button
                type="button"
                onClick={() => setMovingLectureId(null)}
                className="px-4 py-2 rounded-[4px] border-2 border-[#111111] bg-white text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
