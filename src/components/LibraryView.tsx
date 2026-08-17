/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ChevronLeft,
  ChevronDown,
  X,
  MapPin,
  Lock,
  Layers,
  Award,
  HelpCircle,
  Check,
  Mic,
  Compass,
  ArrowRight,
  Timer,
  Share2,
  Send,
  UserCheck,
  GripVertical
} from 'lucide-react';
import { PageId, Lecture, Folder, Subject } from '../types';
import { generateResourcesFromTranscript } from '../services/gemini';
import { useFolders } from '../hooks/useFolders';
import { useSubjects } from '../hooks/useSubjects';
import { auth } from '../firebaseConfig';
import { shareLectureWithEmail } from '../services/shareService';

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
  
  // High-level navigation state: SUBJECT MAP vs ACADEMIC SAVED
  const [libraryTab, setLibraryTab] = useState<'map' | 'saved'>('map');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Firestore subjects hook
  const { subjects, addSubject, updateSubject, deleteSubject } = useSubjects(auth.currentUser?.uid);

  // Auto-select first subject if none selected initially
  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Subject Dropdown State & Click-Outside Ref
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSubjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Subject Creation Modal
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubProf, setNewSubProf] = useState('');
  const [subjectError, setSubjectError] = useState<string | null>(null);

  // Lecture Creation Modal inside Subject Map
  const [showCreateLectureModal, setShowCreateLectureModal] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Selected Node Detail Slide-Over Drawer
  const [selectedLectureDetail, setSelectedLectureDetail] = useState<Lecture | null>(null);

  // Academic Saved Tab States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newType, setNewType] = useState<'recording' | 'pdf' | 'ppt' | 'text'>('pdf');

  // Folder Organization
  const { 
    folders, 
    addFolder, 
    deleteFolder
  } = useFolders(auth.currentUser?.uid);

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Peer-to-Peer Share Modal States
  const [shareModalLecture, setShareModalLecture] = useState<Lecture | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);
  const [shareErrorMsg, setShareErrorMsg] = useState<string | null>(null);

  // Drag and drop reordering state
  const [draggedLectureId, setDraggedLectureId] = useState<string | null>(null);

  // Active Subject Object
  const currentSubject = useMemo(() => {
    if (!selectedSubjectId && subjects.length > 0) return subjects[0];
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0] || null;
  }, [selectedSubjectId, subjects]);

  // Active Subject Lectures List (Sorted by lectureNumber)
  const currentSubjectLectures = useMemo(() => {
    if (!currentSubject) return [];
    
    const matched = lectures.filter(l => {
      if (l.subjectId) return l.subjectId === currentSubject.id;
      if (l.subject) {
        return l.subject.toLowerCase() === currentSubject.name.toLowerCase() ||
               (currentSubject.code && l.subject.toLowerCase().includes(currentSubject.code.toLowerCase()));
      }
      return false;
    });

    return matched
      .map((l, index) => ({
        ...l,
        lectureNumber: l.lectureNumber || (index + 1),
        reviewed: l.reviewed || l.status === 'completed' || l.status === 'generated'
      }))
      .sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));
  }, [currentSubject, lectures]);

  // Handle Drag & Drop reordering along the Subject Map path
  const handleDropReorder = async (targetIndex: number) => {
    if (!draggedLectureId) return;
    const items = [...currentSubjectLectures];
    const sourceIndex = items.findIndex(l => l.id === draggedLectureId);
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      setDraggedLectureId(null);
      return;
    }

    // Reorder items in array
    const [draggedItem] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    // Save updated sequence in Firestore for each lecture
    for (let i = 0; i < items.length; i++) {
      const lec = items[i];
      const newSeq = i + 1;
      if (onUpdateLecture) {
        await onUpdateLecture(lec.id, { lectureNumber: newSeq, mapOrder: newSeq });
      }
    }
    setDraggedLectureId(null);
  };

  // Handle Lecture Share submit
  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareModalLecture || !shareEmail.trim()) return;
    setIsSharing(true);
    setShareSuccessMsg(null);
    setShareErrorMsg(null);

    try {
      const res = await shareLectureWithEmail(shareModalLecture, shareEmail);
      if (res.recipientFound) {
        setShareSuccessMsg(`Notes shared with ${shareEmail} successfully!`);
      } else {
        setShareSuccessMsg(`Lecture shared! A claim invitation has been staged for ${shareEmail}.`);
      }
      setShareEmail('');
      setTimeout(() => {
        setShareModalLecture(null);
        setShareSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setShareErrorMsg(err?.message || 'Failed to share notes.');
    } finally {
      setIsSharing(false);
    }
  };

  // Calculate subject progress
  const subjectProgress = useMemo(() => {
    if (!currentSubjectLectures.length) return 0;
    const reviewed = currentSubjectLectures.filter(l => l.reviewed || l.status === 'completed').length;
    return Math.round((reviewed / currentSubjectLectures.length) * 100);
  }, [currentSubjectLectures]);

  // Handle Subject Creation
  const handleCreateSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectError(null);
    if (!newSubName.trim()) {
      setSubjectError('Subject name is required.');
      return;
    }
    if (subjects.length >= 5) {
      setSubjectError('Maximum limit of 5 active subjects reached.');
      return;
    }

    try {
      const colors = ['#FFC107', '#10B981', '#8B5CF6', '#3B82F6', '#EF4444'];
      const chosenColor = colors[subjects.length % colors.length];
      const newId = await addSubject({
        name: newSubName.trim(),
        code: newSubCode.trim().toUpperCase(),
        professor: newSubProf.trim(),
        color: chosenColor
      });
      setNewSubName('');
      setNewSubCode('');
      setNewSubProf('');
      setShowCreateSubjectModal(false);
      if (newId) {
        setSelectedSubjectId(newId);
      }
    } catch (err: any) {
      setSubjectError(err.message || 'Failed to create subject.');
    }
  };

  // Handle New Lecture Creation inside Subject Map
  const handleCreateLectureInSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject || !newLectureTitle.trim()) return;

    const nextNum = currentSubjectLectures.length + 1;
    const title = newLectureTitle.trim();

    const newLectureObj: any = {
      id: `lec-map-${Date.now()}`,
      title,
      subject: currentSubject.name,
      subjectId: currentSubject.id,
      subjectCode: currentSubject.code || '',
      lectureNumber: nextNum,
      mapOrder: nextNum,
      type: 'recording',
      status: 'recording',
      addedAt: 'Just now',
      reviewed: false,
      duration: '00:00:00'
    };

    onAddLecture(newLectureObj);
    if (setActiveLectureId) {
      setActiveLectureId(newLectureObj.id);
    }
    
    setNewLectureTitle('');
    setShowCreateLectureModal(false);
    setActivePage('lecture-capture');
  };

  // Saved tab file upload handler
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

    const created: Lecture = {
      id: `lec-${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject,
      folderId: activeFolderId || undefined,
      type: newType,
      status: 'generated',
      addedAt: 'Just now',
      duration: newType === 'recording' ? '45 min' : undefined,
      pages: newType === 'pdf' ? 12 : undefined,
    };

    onAddLecture(created);
    setNewTitle('');
    setSelectedFile(null);
    setShowSyncModal(false);
  };

  // Filtered lectures for ACADEMIC SAVED tab
  const filteredSavedLectures = useMemo(() => {
    return lectures.filter((lecture) => {
      const matchesSearch = 
        lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lecture.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSubject = activeSubjectFilter === 'All' || lecture.subject.toLowerCase() === activeSubjectFilter.toLowerCase();
      const matchesFolder = activeFolderId ? lecture.folderId === activeFolderId : true;

      return matchesSearch && matchesSubject && matchesFolder;
    });
  }, [lectures, searchQuery, activeSubjectFilter, activeFolderId]);

  return (
    <div className="min-h-screen bg-[#F4F1EA] dark:bg-[#0E1117] text-[#000000] dark:text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-[#FFC107] selection:text-black">

      {/* Dynamic Path CSS Animation Keyframes */}
      <style>{`
        .brutal-border { 
          border: 4px solid #000000; 
          box-shadow: 4px 4px 0px #000000; 
        }
        .brutal-border:hover { 
          box-shadow: 6px 6px 0px #000000; 
          transform: translate(-2px, -2px); 
        }
        .brutal-border:active { 
          box-shadow: 0px 0px 0px #000000; 
          transform: translate(4px, 4px); 
        }
        .path-line-bauhaus {
          stroke-dasharray: 20;
          animation: dash-bauhaus 10s linear infinite;
        }
        @keyframes dash-bauhaus {
          to { stroke-dashoffset: -100; }
        }
      `}</style>

      {/* TOP BAUHAUS HEADER BAR */}
      <header className="bg-white dark:bg-[#161B22] border-b-4 border-black px-8 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 relative z-30">
        
        {/* Left: Breadcrumbs & Subject Selector Dropdown */}
        <div className="flex items-center gap-4 font-bold uppercase tracking-wide">
          <span className="text-black dark:text-white text-sm font-black">Library</span>
          <ChevronRight className="w-5 h-5 text-black dark:text-white stroke-[3]" />
          
          <div className="relative z-50" ref={dropdownRef}>
            <button 
              onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
              className="flex items-center gap-2 bg-[#FFC107] text-black px-4 py-2 brutal-border font-black text-base hover:bg-[#FFD54F] transition-colors"
            >
              <span>{currentSubject ? currentSubject.name.toUpperCase() : 'SELECT SUBJECT'}</span>
              <ChevronDown className="w-5 h-5 stroke-[3]" />
            </button>

            {/* Subject Selector Dropdown with Outside Click Auto-Close */}
            {showSubjectDropdown && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#161B22] border-4 border-black shadow-[8px_8px_0px_#000] z-[999] p-2 flex flex-col gap-1">
                <div className="text-[10px] font-black uppercase text-black/70 dark:text-white/70 px-2 py-1">
                  Active Subjects ({subjects.length}/5)
                </div>
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubjectId(sub.id);
                      setShowSubjectDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-black uppercase flex items-center justify-between border-2 transition-all ${
                      selectedSubjectId === sub.id
                        ? 'bg-[#FFC107] text-black border-black shadow-[2px_2px_0px_#000]'
                        : 'border-transparent text-black dark:text-white hover:border-black hover:bg-[#F4F1EA] dark:hover:bg-[#21262D]'
                    }`}
                  >
                    <span>{sub.name}</span>
                    {sub.code && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black text-white">{sub.code}</span>}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setShowSubjectDropdown(false);
                    if (subjects.length >= 5) {
                      alert('Maximum limit of 5 active subjects reached. Please delete an existing subject first.');
                    } else {
                      setShowCreateSubjectModal(true);
                    }
                  }}
                  className="w-full text-center py-2 mt-1 bg-black text-white hover:bg-[#FFC107] hover:text-black font-black text-xs uppercase transition-colors border-2 border-black"
                >
                  + CREATE NEW SUBJECT
                </button>
              </div>
            )}
          </div>

          {/* DUAL TAB SWITCHER */}
          <div className="flex items-center gap-1 border-2 border-black p-1 bg-black">
            <button
              onClick={() => setLibraryTab('map')}
              className={`px-3 py-1.5 font-black text-xs uppercase transition-all ${
                libraryTab === 'map'
                  ? 'bg-[#FFC107] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-black hover:bg-[#FFC107] hover:text-black border-2 border-black'
              }`}
            >
              SUBJECT MAP
            </button>
            <button
              onClick={() => setLibraryTab('saved')}
              className={`px-3 py-1.5 font-black text-xs uppercase transition-all ${
                libraryTab === 'saved'
                  ? 'bg-[#FFC107] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-black hover:bg-[#FFC107] hover:text-black border-2 border-black'
              }`}
            >
              ACADEMIC SAVED
            </button>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex items-center flex-1 max-w-md w-full">
          <div className="relative w-full">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-black dark:text-white font-black stroke-[3]" />
            <input
              type="text"
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              placeholder="SEARCH LECTURES, NOTES, TOPICS..."
              className="w-full bg-white dark:bg-[#161B22] border-4 border-black py-2.5 pl-12 pr-4 text-xs font-bold uppercase text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-4 focus:ring-[#FFC107] shadow-[3px_3px_0px_#000]"
            />
          </div>
        </div>

        {/* Right Progress Bar & Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-3 bg-white dark:bg-[#161B22] px-4 py-2 brutal-border text-black dark:text-white">
            <span className="text-xs font-black uppercase tracking-widest">Progress</span>
            <div className="w-24 h-4 bg-[#F4F1EA] dark:bg-[#21262D] border-2 border-black relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#FFC107] border-r-2 border-black transition-all duration-500"
                style={{ width: `${subjectProgress}%` }}
              />
            </div>
            <span className="text-sm font-black">{subjectProgress}%</span>
          </div>

          <button
            onClick={() => setShowCreateLectureModal(true)}
            className="bg-[#FFC107] text-black font-black uppercase text-xs px-5 py-3 brutal-border flex items-center gap-2 hover:bg-[#FFD54F] transition-transform"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            + NEW LECTURE
          </button>
        </div>
      </header>

      {/* MAIN FULL-WIDTH CONTAINER */}
      <main className="flex-1 flex overflow-hidden relative">

        {/* TAB 1: BAUHAUS SUBJECT MAP CANVAS VIEW (Full Width 100%) */}
        {libraryTab === 'map' && (
          <div className="flex-1 flex overflow-hidden relative w-full">
            
            {/* MAP AREA CANVAS (Full Width) */}
            <div className="flex-1 relative overflow-y-auto overflow-x-hidden w-full bg-[#F4F1EA] dark:bg-[#0D1117]">
              
              {/* Grid Background Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.08)_2px,transparent_2px),linear-gradient(90deg,rgba(0,0,0,0.08)_2px,transparent_2px)] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.05)_2px,transparent_2px)] bg-[size:40px_40px] pointer-events-none" />

              {/* Path Container */}
              <div className="relative min-h-[1400px] w-full flex flex-col items-center py-16 pb-40">

                {currentSubjectLectures.length === 0 ? (
                  /* EMPTY STATE ON SQUARE GRID MAP PAGE */
                  <div className="relative z-20 flex flex-col items-center justify-center my-auto py-24 text-center px-4">
                    <div className="bg-white dark:bg-[#161B22] brutal-border p-8 max-w-md w-full flex flex-col items-center space-y-4 shadow-[8px_8px_0px_#000]">
                      <div className="w-16 h-16 bg-[#FFC107] border-2 border-black flex items-center justify-center rounded-full shadow-[3px_3px_0px_#000]">
                        <BookOpen className="w-8 h-8 text-black stroke-[3]" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase text-black dark:text-white">
                          EMPTY SUBJECT MAP
                        </h3>
                        <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
                          No lectures added for {currentSubject?.name || 'this subject'} yet. Record or upload a course material to populate your map!
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCreateLectureModal(true)}
                        className="bg-[#FFC107] text-black font-black uppercase text-xs px-6 py-3 brutal-border flex items-center gap-2 hover:bg-[#FFD54F] transition-transform cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        + ADD YOUR FIRST LECTURE
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* SVG Animated Connection Line */}
                    <svg className="absolute top-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none" viewBox="0 0 1000 1800">
                      <path 
                        className="path-line-bauhaus" 
                        d="M 500,1800 L 400,1400 L 600,1000 L 400,600 L 600,200 L 500,0" 
                        fill="none" 
                        stroke="#000000" 
                        strokeWidth="8"
                      />
                    </svg>

                    {/* Lecture Nodes Container */}
                    <div className="relative w-full max-w-4xl flex flex-col items-center gap-16 sm:gap-28 z-10 my-auto px-4">

                      {currentSubjectLectures.map((lec, idx) => {
                        const isSelected = selectedLectureDetail?.id === lec.id;
                        const isCompleted = lec.reviewed || lec.status === 'completed' || lec.status === 'generated';
                        const isRecording = lec.status === 'recording' || lec.status === 'transcribing';

                        // Responsive Node Offset positioning (Centered on mobile, offset on desktop)
                        const alignments = ['sm:ml-[-220px] ml-0', 'sm:mr-[-280px] mr-0', 'sm:ml-[-120px] ml-0', 'sm:mr-[-180px] mr-0'];
                        const alignmentClass = alignments[idx % alignments.length];

                        return (
                          <div
                            key={lec.id}
                            onClick={() => setSelectedLectureDetail(lec)}
                            className={`relative group cursor-pointer ${alignmentClass} ${isSelected ? 'z-30 scale-105' : 'z-10'}`}
                          >
                            {/* Node Status Badge Indicator */}
                            {isCompleted ? (
                              <div className="absolute -left-4 -top-4 sm:-left-6 sm:-top-6 w-10 h-10 sm:w-12 sm:h-12 bg-[#FFC107] text-black brutal-border flex items-center justify-center z-20">
                                <Check className="w-5 h-5 sm:w-7 sm:h-7 stroke-[4]" />
                              </div>
                            ) : isRecording ? (
                              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[#FFC107] brutal-border rounded-full flex items-center justify-center animate-pulse z-20">
                                <div className="w-4 h-4 sm:w-6 sm:h-6 bg-black rounded-full" />
                              </div>
                            ) : (
                              <div className="absolute -left-4 -top-4 sm:-left-6 sm:-top-6 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-[#21262D] text-black dark:text-white brutal-border flex items-center justify-center z-20">
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                              </div>
                            )}

                            {/* Lecture Node Card (Parrot Green for Shared Notes, White/Dark for Regular) */}
                            <div
                              draggable={true}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                setDraggedLectureId(lec.id);
                                e.dataTransfer.setData('text/plain', lec.id);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDropReorder(idx);
                              }}
                              className={`brutal-border p-4 sm:p-6 w-64 sm:w-72 max-w-[85vw] transition-transform select-none cursor-grab active:cursor-grabbing ${
                                lec.isShared
                                  ? 'bg-[#10B981] text-black border-black shadow-[10px_10px_0px_#000]'
                                  : isSelected
                                    ? 'shadow-[12px_12px_0px_#000] rotate-0 bg-[#FFC107]/20 border-black bg-white dark:bg-[#161B22]'
                                    : idx % 2 === 0
                                      ? 'bg-white dark:bg-[#161B22] transform -rotate-2 hover:rotate-0'
                                      : 'bg-white dark:bg-[#161B22] transform rotate-2 hover:rotate-0'
                              }`}
                            >
                              {/* Shared Note Badge Header */}
                              {lec.isShared && (
                                <div className="mb-2.5 px-2 py-0.5 bg-black text-[#10B981] text-[9px] font-mono font-black uppercase tracking-wider border border-black flex items-center justify-between gap-1 shadow-paper-xs">
                                  <span className="truncate">📥 SHARED BY: {lec.sharedByName || lec.sharedByEmail || 'Peer'}</span>
                                </div>
                              )}

                              <div className="flex justify-between items-center mb-3 border-b-4 border-black pb-2">
                                <p className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 border-2 border-black ${
                                  lec.isShared ? 'bg-black text-[#10B981]' : 'bg-[#FFC107] text-black'
                                }`}>
                                  LECTURE {lec.lectureNumber < 10 ? `0${lec.lectureNumber}` : lec.lectureNumber}
                                </p>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-extrabold flex items-center gap-1 border-2 border-black px-2 py-0.5 bg-black text-white dark:bg-[#FFC107] dark:text-black">
                                    <Timer className="w-3.5 h-3.5" /> {lec.duration || '45m'}
                                  </span>
                                  
                                  {/* Share Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShareModalLecture(lec);
                                    }}
                                    title="Share Lecture with Classmate"
                                    className="p-1 bg-[#2563EB] text-white border-2 border-black hover:bg-blue-700 transition-colors"
                                  >
                                    <Share2 className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Are you sure you want to delete lecture "${lec.title}"?`)) {
                                        onDeleteLecture(lec.id);
                                        if (selectedLectureDetail?.id === lec.id) {
                                          setSelectedLectureDetail(null);
                                        }
                                      }
                                    }}
                                    title="Delete Lecture"
                                    className="p-1 bg-[#EF4444] text-white border-2 border-black hover:bg-red-700 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>
                                </div>
                              </div>

                              <h3 className={`text-base font-black uppercase leading-tight mb-4 ${
                                lec.isShared ? 'text-black font-black' : 'text-black dark:text-white'
                              }`}>
                                {lec.title}
                              </h3>

                              {lec.isShared ? (
                                <div className="inline-flex items-center gap-1.5 bg-black text-[#10B981] border-2 border-black px-2.5 py-1 font-mono font-extrabold text-[10px] uppercase shadow-[2px_2px_0px_#000]">
                                  <span>From: {lec.sharedByEmail}</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 bg-[#FFC107] text-black border-2 border-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_#000]">
                                  <Sparkles className="w-3.5 h-3.5 text-black" />
                                  <span>{isCompleted ? 'Synthesized' : isRecording ? 'Processing...' : 'Not Started'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* End Node with Mascot Avatar & Add Button */}
                      <div className="relative mt-16 flex flex-col items-center z-20">
                        <div 
                          onClick={() => setShowCreateLectureModal(true)}
                          className="w-20 h-20 bg-white dark:bg-[#161B22] brutal-border rounded-full flex items-center justify-center mb-4 hover:bg-[#FFC107] transition-colors cursor-pointer group"
                        >
                          <Plus className="w-8 h-8 text-black dark:text-white group-hover:text-black stroke-[4] group-hover:scale-125 transition-transform" />
                        </div>

                        <div className="p-2 bg-[#FFC107] brutal-border transform rotate-6 flex items-center gap-3">
                          <img 
                            src="/mascots/mascot-owl.jpg" 
                            alt="Mascot" 
                            className="w-20 h-20 object-cover border-2 border-black grayscale contrast-125"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                          <div className="text-black pr-2">
                            <div className="text-xs font-black uppercase">Scholar Owl</div>
                            <div className="text-[10px] font-bold">"Click + to add Lecture {currentSubjectLectures.length + 1}!"</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </>
                )}

              </div>
            </div>

            {/* SLIDE-OVER INSPECTION DRAWER (Triggered when node is clicked) */}
            {selectedLectureDetail && (
              <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                {/* Backdrop Overlay */}
                <div 
                  onClick={() => setSelectedLectureDetail(null)} 
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                />
                
                {/* Slide-over Drawer Panel */}
                <aside className="relative w-full sm:w-96 max-w-full bg-white dark:bg-[#161B22] border-l-4 border-black flex flex-col shadow-2xl z-50 h-full overflow-y-auto animate-in slide-in-from-right duration-300">
                  
                  {/* Panel Header */}
                  <div className="p-6 border-b-4 border-black bg-white dark:bg-[#161B22] relative">
                    <button
                      onClick={() => setSelectedLectureDetail(null)}
                      className="absolute top-4 right-4 p-1.5 bg-black text-white hover:bg-[#FFC107] hover:text-black border-2 border-black font-black transition-colors"
                      title="Close Drawer"
                    >
                      <X className="w-5 h-5 stroke-[3]" />
                    </button>

                    <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-widest mb-3 border-2 border-black">
                      <Play className="w-3.5 h-3.5 text-[#FFC107] fill-[#FFC107]" />
                      LECTURE {selectedLectureDetail.lectureNumber < 10 ? `0${selectedLectureDetail.lectureNumber}` : selectedLectureDetail.lectureNumber}
                    </div>

                    <h2 className="text-2xl font-black uppercase leading-none mb-4 text-black dark:text-white pr-8">
                      {selectedLectureDetail.title}
                    </h2>

                    <p className="text-xs font-semibold leading-relaxed mb-6 border-l-4 border-black pl-3 text-[#1E293B] dark:text-[#E2E8F0]">
                      {selectedLectureDetail.transcript || "Exploration of tree data structures, search algorithms, and cognitive notes generation."}
                    </p>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          if (setActiveLectureId) setActiveLectureId(selectedLectureDetail.id);
                          setSelectedLectureDetail(null);
                          setActivePage('lecture-capture');
                        }}
                        className="w-full bg-[#FFC107] text-black font-black uppercase text-sm py-3.5 brutal-border flex items-center justify-center gap-2 hover:bg-[#FFD54F] transition-transform cursor-pointer"
                      >
                        <BookOpen className="w-5 h-5 stroke-[3]" />
                        OPEN LECTURE NOTES
                      </button>

                      <button
                        onClick={() => {
                          setShareModalLecture(selectedLectureDetail);
                        }}
                        className="w-full bg-[#2563EB] text-white font-black uppercase text-xs py-3 brutal-border flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 stroke-[3]" />
                        SHARE LECTURE WITH CLASSMATE
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${selectedLectureDetail.title}" completely?`)) {
                            onDeleteLecture(selectedLectureDetail.id);
                            setSelectedLectureDetail(null);
                          }
                        }}
                        className="w-full bg-[#EF4444] text-white font-black uppercase text-xs py-2.5 brutal-border flex items-center justify-center gap-2 hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 stroke-[3]" />
                        DELETE LECTURE FULLY
                      </button>
                    </div>
                  </div>

                  {/* Panel Body Resources */}
                  <div className="flex-1 p-6 bg-[#F4F1EA] dark:bg-[#0D1117] flex flex-col gap-4">
                    <h3 className="text-xs font-black uppercase tracking-widest border-b-4 border-black pb-1 inline-block text-black dark:text-white">
                      RESOURCES & AI ASSETS
                    </h3>

                    {/* Resource 1: Structured Notes */}
                    <button
                      onClick={() => {
                        if (setActiveLectureId) setActiveLectureId(selectedLectureDetail.id);
                        setSelectedLectureDetail(null);
                        setActivePage('lecture-capture');
                      }}
                      className="w-full flex items-center p-3.5 bg-white dark:bg-[#161B22] brutal-border hover:bg-[#FFC107] hover:text-black transition-colors group text-left"
                    >
                      <div className="w-10 h-10 bg-[#F4F1EA] dark:bg-[#21262D] border-2 border-black flex items-center justify-center mr-3 text-black dark:text-white group-hover:bg-white transition-colors">
                        <FileText className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase text-black dark:text-white group-hover:text-black">Structured Notes</h4>
                        <p className="text-[11px] font-extrabold text-[#475569] dark:text-[#F1F5F9] group-hover:text-black">Definitions & algorithms</p>
                      </div>
                      <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Resource 2: Executive Summary */}
                    <button
                      onClick={() => {
                        if (setActiveLectureId) setActiveLectureId(selectedLectureDetail.id);
                        setSelectedLectureDetail(null);
                        setActivePage('lecture-capture');
                      }}
                      className="w-full flex items-center p-3.5 bg-white dark:bg-[#161B22] brutal-border hover:bg-[#FFC107] hover:text-black transition-colors group text-left"
                    >
                      <div className="w-10 h-10 bg-[#F4F1EA] dark:bg-[#21262D] border-2 border-black flex items-center justify-center mr-3 text-black dark:text-white group-hover:bg-white transition-colors">
                        <Sparkles className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase text-black dark:text-white group-hover:text-black">Executive Summary</h4>
                        <p className="text-[11px] font-extrabold text-[#475569] dark:text-[#F1F5F9] group-hover:text-black">2-minute revision read</p>
                      </div>
                      <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Resource 3: Flashcards */}
                    <button
                      onClick={() => {
                        if (setActiveLectureId) setActiveLectureId(selectedLectureDetail.id);
                        setSelectedLectureDetail(null);
                        setActivePage('quiz-mode');
                      }}
                      className="w-full flex items-center p-3.5 bg-white dark:bg-[#161B22] brutal-border hover:bg-[#FFC107] hover:text-black transition-colors group text-left"
                    >
                      <div className="w-10 h-10 bg-[#F4F1EA] dark:bg-[#21262D] border-2 border-black flex items-center justify-center mr-3 text-black dark:text-white group-hover:bg-white transition-colors">
                        <Brain className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase text-black dark:text-white group-hover:text-black">Flashcards Deck</h4>
                        <p className="text-[11px] font-extrabold text-[#475569] dark:text-[#F1F5F9] group-hover:text-black">24 cards generated</p>
                      </div>
                      <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Resource 4: Practice Quiz */}
                    <button
                      onClick={() => {
                        if (setActiveLectureId) setActiveLectureId(selectedLectureDetail.id);
                        setSelectedLectureDetail(null);
                        setActivePage('quiz-mode');
                      }}
                      className="w-full flex items-center p-3.5 bg-white dark:bg-[#161B22] brutal-border hover:bg-[#FFC107] hover:text-black transition-colors group text-left"
                    >
                      <div className="w-10 h-10 bg-[#F4F1EA] dark:bg-[#21262D] border-2 border-black flex items-center justify-center mr-3 text-black dark:text-white group-hover:bg-white transition-colors">
                        <Award className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase text-black dark:text-white group-hover:text-black">Practice Quiz</h4>
                        <p className="text-[11px] font-extrabold text-[#475569] dark:text-[#F1F5F9] group-hover:text-black">10 questions</p>
                      </div>
                      <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                </aside>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: ACADEMIC SAVED SECTION */}
        {libraryTab === 'saved' && (
          <div className="flex-1 p-8 overflow-y-auto bg-[#F4F1EA] dark:bg-[#0D1117] flex flex-col gap-6 w-full">
            
            {/* Folder Bar */}
            <div className="bg-white dark:bg-[#161B22] p-4 brutal-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveFolderId(null)}
                  className={`px-3.5 py-1.5 font-black text-xs uppercase transition-all ${
                    activeFolderId === null
                      ? 'bg-[#FFC107] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                      : 'bg-[#F4F1EA] dark:bg-[#21262D] text-black dark:text-white border-2 border-black'
                  }`}
                >
                  All Materials ({lectures.length})
                </button>

                {folders.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFolderId(f.id)}
                    className={`px-3.5 py-1.5 font-black text-xs uppercase transition-all ${
                      activeFolderId === f.id
                        ? 'bg-[#FFC107] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                        : 'bg-[#F4F1EA] dark:bg-[#21262D] text-black dark:text-white border-2 border-black'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowFolderModal(true)}
                className="px-3.5 py-1.5 bg-[#FFC107] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000]"
              >
                + NEW FOLDER
              </button>
            </div>

            {/* Saved Lectures Grid (Parrot Green for Shared Notes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSavedLectures.map((lec) => (
                <div 
                  key={lec.id} 
                  className={`brutal-border p-6 flex flex-col justify-between ${
                    lec.isShared 
                      ? 'bg-[#10B981] text-black border-black shadow-[8px_8px_0px_#000]' 
                      : 'bg-white dark:bg-[#161B22]'
                  }`}
                >
                  <div>
                    {lec.isShared && (
                      <div className="mb-2 px-2 py-0.5 bg-black text-[#10B981] text-[9px] font-mono font-black uppercase tracking-wider border border-black flex items-center justify-between">
                        <span>📥 SHARED BY: {lec.sharedByName || lec.sharedByEmail || 'Peer'}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 border border-black ${
                        lec.isShared ? 'bg-black text-[#10B981]' : 'bg-[#FFC107] text-black'
                      }`}>
                        {lec.subject || 'GENERAL'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShareModalLecture(lec)}
                          className="p-1 text-black hover:text-[#2563EB] transition-colors"
                          title="Share Lecture with Classmate"
                        >
                          <Share2 className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${lec.title}" completely?`)) {
                              onDeleteLecture(lec.id);
                            }
                          }} 
                          className="p-1 text-black/70 dark:text-white/70 hover:text-[#EF4444] hover:bg-red-500/10 rounded transition-colors"
                          title="Delete Lecture"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                    <h4 className={`text-sm font-black uppercase mb-2 ${lec.isShared ? 'text-black font-black' : 'text-black dark:text-white'}`}>
                      {lec.title}
                    </h4>
                    <p className={`text-xs font-bold line-clamp-3 mb-4 ${lec.isShared ? 'text-black/80' : 'text-[#334155] dark:text-[#CBD5E1]'}`}>
                      {lec.transcript || 'No transcript text available.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t-2 border-black">
                    <span className={`text-[10px] font-bold uppercase ${lec.isShared ? 'text-black/80' : 'text-black/70 dark:text-white/70'}`}>
                      {lec.addedAt}
                    </span>
                    <button
                      onClick={() => {
                        if (setActiveLectureId) setActiveLectureId(lec.id);
                        setActivePage('lecture-capture');
                      }}
                      className={`text-xs font-black uppercase hover:text-[#FFC107] flex items-center gap-1 ${
                        lec.isShared ? 'text-black' : 'text-black dark:text-white'
                      }`}
                    >
                      OPEN LECTURE NOTES <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* MODAL: CREATE SUBJECT */}
      {showCreateSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B22] brutal-border max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b-4 border-black pb-2">
              <h3 className="text-base font-black uppercase text-black dark:text-white">CREATE NEW SUBJECT MAP</h3>
              <button onClick={() => setShowCreateSubjectModal(false)}><X className="w-5 h-5 stroke-[3]" /></button>
            </div>

            {subjectError && <div className="mb-3 text-xs font-bold text-[#EF4444] bg-[#EF4444]/10 p-2 border border-[#EF4444]">{subjectError}</div>}

            <form onSubmit={handleCreateSubjectSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-black uppercase block mb-1 text-black dark:text-white">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. DATA STRUCTURES & ALGORITHMS"
                  className="w-full bg-[#F4F1EA] dark:bg-[#0D1117] border-2 border-black p-2.5 text-xs font-bold uppercase text-black dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase block mb-1 text-black dark:text-white">Subject Code (Optional)</label>
                <input
                  type="text"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  placeholder="e.g. CS201"
                  className="w-full bg-[#F4F1EA] dark:bg-[#0D1117] border-2 border-black p-2.5 text-xs font-bold uppercase text-black dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-3 border-t-2 border-black">
                <button type="button" onClick={() => setShowCreateSubjectModal(false)} className="px-4 py-2 bg-[#F4F1EA] dark:bg-[#21262D] text-black dark:text-white border-2 border-black font-black text-xs uppercase">
                  CANCEL
                </button>
                <button type="submit" className="px-5 py-2 bg-[#FFC107] text-black font-black text-xs uppercase brutal-border">
                  CREATE SUBJECT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW LECTURE */}
      {showCreateLectureModal && currentSubject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B22] brutal-border max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b-4 border-black pb-2">
              <h3 className="text-base font-black uppercase text-black dark:text-white">CREATE NEW LECTURE</h3>
              <button onClick={() => setShowCreateLectureModal(false)}><X className="w-5 h-5 stroke-[3]" /></button>
            </div>

            <form onSubmit={handleCreateLectureInSubject} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-black uppercase block mb-1 text-black dark:text-white">Lecture Topic / Title *</label>
                <input
                  type="text"
                  required
                  value={newLectureTitle}
                  onChange={(e) => setNewLectureTitle(e.target.value)}
                  placeholder="e.g. BINARY SEARCH TREES — PART 1"
                  className="w-full bg-[#F4F1EA] dark:bg-[#0D1117] border-2 border-black p-2.5 text-xs font-bold uppercase text-black dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-3 border-t-2 border-black">
                <button type="button" onClick={() => setShowCreateLectureModal(false)} className="px-4 py-2 bg-[#F4F1EA] dark:bg-[#21262D] text-black dark:text-white border-2 border-black font-black text-xs uppercase">
                  CANCEL
                </button>
                <button type="submit" className="px-5 py-2 bg-[#FFC107] text-black font-black text-xs uppercase brutal-border flex items-center gap-2">
                  <Mic className="w-4 h-4 stroke-[3]" />
                  START RECORDING
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SHARE LECTURE WITH CLASSMATE */}
      {shareModalLecture && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B22] brutal-border max-w-md w-full p-6 relative shadow-[10px_10px_0px_#000]">
            <div className="flex items-center justify-between mb-4 border-b-4 border-black pb-2">
              <h3 className="text-base font-black uppercase text-black dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#2563EB]" />
                <span>SHARE LECTURE NOTES</span>
              </h3>
              <button 
                onClick={() => {
                  setShareModalLecture(null);
                  setShareSuccessMsg(null);
                  setShareErrorMsg(null);
                }}
                className="text-black dark:text-white hover:text-red-500"
              >
                <X className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            {shareSuccessMsg ? (
              <div className="p-4 bg-[#10B981]/20 border-2 border-black text-[#047857] dark:text-[#10B981] font-mono text-xs font-bold rounded space-y-2 text-center">
                <CheckCircle className="w-8 h-8 mx-auto text-[#10B981]" />
                <p className="font-extrabold uppercase">{shareSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleShareSubmit} className="flex flex-col gap-4">
                <div className="p-3 bg-amber-500/10 border-2 border-black rounded text-xs font-mono font-bold text-black dark:text-white">
                  Sharing: <strong className="uppercase">{shareModalLecture.title}</strong> ({shareModalLecture.subject || 'General'})
                </div>

                {shareErrorMsg && (
                  <div className="text-xs font-bold text-red-500 bg-red-500/10 p-2 border border-red-500">
                    {shareErrorMsg}
                  </div>
                )}

                <div>
                  <label className="text-xs font-black uppercase block mb-1 text-black dark:text-white">
                    Classmate / Student Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full brutal-border p-3 text-xs font-bold font-mono bg-white dark:bg-[#0D1117] text-black dark:text-white outline-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShareModalLecture(null)}
                    className="px-4 py-2 font-black text-xs uppercase brutal-border bg-gray-200 dark:bg-[#21262D] text-black dark:text-white hover:bg-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSharing}
                    className="px-5 py-2 font-black text-xs uppercase brutal-border bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {isSharing ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Share Notes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
