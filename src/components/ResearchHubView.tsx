/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit,
  FileText,
  Volume2, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Bookmark, 
  ChevronRight, 
  ChevronLeft,
  BookOpen, 
  Upload, 
  Brain,
  Layout,
  Download,
  Award,
  Info,
  Network,
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  Flame,
  ArrowLeft,
  ShieldAlert,
  Search,
  BookMarked
} from 'lucide-react';
import { Source, Note, Lecture, PageId } from '../types';

interface ResearchHubViewProps {
  sources: Source[];
  onAddSource: (source: Source) => void;
  onDeleteSource: (id: string) => void;
  searchQuery: string;
  notes: Note[];
  notesLoading: boolean;
  addNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, data: { title?: string; content?: string }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  lectures?: Lecture[];
  updateLecture?: (id: string, data: any) => Promise<void>;
  deleteLecture?: (id: string) => Promise<void>;
  setActivePage?: (page: PageId) => void;
}

export default function ResearchHubView({
  sources,
  onAddSource,
  onDeleteSource,
  searchQuery,
  notes = [],
  notesLoading = false,
  addNote,
  updateNote,
  deleteNote,
  lectures = [],
  updateLecture,
  deleteLecture,
  setActivePage
}: ResearchHubViewProps) {
  // Use only real lectures
  const availableLectures = lectures;

  // Choose Active Source Lecture
  const [selectedLecture, setSelectedLecture] = useState<any>(availableLectures.length > 0 ? availableLectures[0] : null);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Console logging for activeTab transitions
  useEffect(() => {
    console.log(`[ResearchHubView] activeTab transitioned to: ${activeTab}`);
  }, [activeTab]);

  // Sync selectedLecture when lectures array changes
  useEffect(() => {
    if (availableLectures.length > 0) {
      const exists = availableLectures.some(l => l.id === selectedLecture?.id);
      if (exists) {
        const updated = availableLectures.find(l => l.id === selectedLecture.id);
        setSelectedLecture(updated);
      } else {
        setSelectedLecture(availableLectures[0]);
      }
    } else {
      setSelectedLecture(null);
    }
  }, [lectures]);

  // Notes UI active/expanded note states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    try {
      await addNote(noteTitle.trim(), noteContent.trim());
      setNoteTitle('');
      setNoteContent('');
      setIsCreatingNote(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateNote = async (id: string) => {
    try {
      await updateNote(id, { title: noteTitle.trim(), content: noteContent.trim() });
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsCreatingNote(false);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setIsCreatingNote(false);
    setNoteTitle('');
    setNoteContent('');
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(noteSearchQuery.toLowerCase());
    
    // Check if the selected lecture is a database lecture (not mock)
    const isRealLecture = lectures.some(l => l.id === selectedLecture.id);
    if (isRealLecture) {
      return matchesSearch && n.lectureId === selectedLecture.id;
    }
    return matchesSearch;
  });
  
  // Synthesis Loader Engine states
  const [generatingState, setGeneratingState] = useState<'idle' | 'loading' | 'completed'>('idle');
  const [generationStep, setGenerationStep] = useState(0);
  const [targetProduct, setTargetProduct] = useState<string | null>(null);

  // General feedback status triggers
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Interactive knowledge modules state
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [flashcardMastery, setFlashcardMastery] = useState<Record<number, 'mastered' | 'review' | null>>({});

  // Quiz state
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showQuizExplains, setShowQuizExplains] = useState<Record<number, boolean>>({});
  const [revealConfetti, setRevealConfetti] = useState(false);

  // Mind map state
  const [selectedMindNode, setSelectedMindNode] = useState<string>('root');
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({});

  // Slide Deck state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Real lecture audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [realAudioPlaying, setRealAudioPlaying] = useState(false);
  const [realAudioTime, setRealAudioTime] = useState(0);
  const [realAudioDuration, setRealAudioDuration] = useState(0);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string>('');

  // Lecture renaming states
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempTitle, setTempTitle] = useState(selectedLecture?.title || '');

  useEffect(() => {
    if (selectedLecture) {
      setTempTitle(selectedLecture.title);
      setRealAudioPlaying(false);
      setRealAudioTime(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      const resolveUrl = async () => {
        if (selectedLecture.audioUrl) {
          if (selectedLecture.storageProvider === 'azure' && selectedLecture.blobPath) {
            try {
              const { getAzureReadSasUrl } = await import('../services/azure');
              const sasUrl = await getAzureReadSasUrl(selectedLecture.blobPath);
              setResolvedAudioUrl(sasUrl);
            } catch (err) {
              console.error("Failed to fetch read SAS URL, falling back to original:", err);
              setResolvedAudioUrl(selectedLecture.audioUrl);
            }
          } else {
            setResolvedAudioUrl(selectedLecture.audioUrl);
          }
        } else {
          setResolvedAudioUrl('');
        }
      };

      resolveUrl();
    }
  }, [selectedLecture]);

  // Audio/Video player state
  const [podcastPlaying, setPodcastPlaying] = useState(false);
  const [podcastSpeed, setPodcastSpeed] = useState<'1.0x' | '1.2x' | '1.5x'>('1.0x');
  const [podcastVoice, setPodcastVoice] = useState<'academic_male' | 'conversational_female'>('conversational_female');
  const [podcastProgress, setPodcastProgress] = useState(30); // percentages
  const [waveformBars, setWaveformBars] = useState<number[]>(
    Array.from({ length: 32 }, () => Math.floor(Math.random() * 40) + 10)
  );

  // Study Guide milestones list
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({
    'intro-reading': true,
    'formula-derivations': false,
    'practice-test': false,
    'bibliography-review': false
  });
  const [activeGuideChapter, setActiveGuideChapter] = useState('chap-1');

  // Multi-step Loading Typewriter logs
  const generationLogs = [
    "Establishing high-speed contextual pipelines...",
    "Decoding acoustic frequencies & PDF character arrays...",
    "Co-indexing core scientific nodes & mathematical proofs...",
    "Resolving vector matrix hierarchies in neural memory...",
    "Stitching final knowledge modules..."
  ];

  // Simulated content definitions
  useEffect(() => {
    let logTimer: NodeJS.Timeout;
    if (generatingState === 'loading') {
      if (generationStep < generationLogs.length - 1) {
        logTimer = setTimeout(() => {
          setGenerationStep(prev => prev + 1);
        }, 650);
      } else {
        logTimer = setTimeout(() => {
          setGeneratingState('completed');
          setActiveTab(targetProduct);
        }, 700);
      }
    }
    return () => clearTimeout(logTimer);
  }, [generatingState, generationStep, targetProduct]);

  // Sync Equalizer dancing bar updates
  useEffect(() => {
    let animationFrame: number;
    if (podcastPlaying) {
      const updateWave = () => {
        setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 55) + 5));
        animationFrame = requestAnimationFrame(updateWave);
      };
      animationFrame = requestAnimationFrame(updateWave);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [podcastPlaying]);

  // Action methods
  const triggerGeneration = (productKey: string) => {
    setTargetProduct(productKey);
    setGenerationStep(0);
    setGeneratingState('loading');
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`Copied ${label} to clipboard!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setQuizScore(null);
    setShowQuizExplains({});
    setRevealConfetti(false);
  };

  const handleAnswerSelect = (qIdx: number, oIdx: number) => {
    if (quizScore !== null) return; // quiz completed
    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: oIdx
    }));
  };

  const submitQuiz = (questionsCount: number, questions: any[]) => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });
    setQuizScore(score);
    if (score === questionsCount) {
      setRevealConfetti(true);
    }
  };

  const toggleGuideCheckpoint = (id: string) => {
    setCompletedMilestones(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // KNOWLEDGE DATA CORRELATION MODELS
  const FLASHCARDS_DECK = selectedLecture?.flashcards && selectedLecture.flashcards.length > 0
    ? selectedLecture.flashcards
    : [
        {
          q: "No Flashcards Available",
          a: "Please process a real lecture with Gemini to generate study cards."
        }
      ];

  const QUIZ_QUESTIONS = selectedLecture?.quiz && selectedLecture.quiz.length > 0
    ? selectedLecture.quiz
    : [];

  const MIND_MAP_DATA = {
    title: selectedLecture?.title || "",
    nodes: selectedLecture?.keyConcepts && selectedLecture.keyConcepts.length > 0
      ? selectedLecture.keyConcepts
      : [
          { id: 'root', label: "Concept Map", desc: "No concept nodes have been generated.", x: 50, y: 50, group: 'center' }
        ]
  };

  const SLIDES_DECK = selectedLecture?.notes && selectedLecture.notes.length > 0
    ? selectedLecture.notes.map((note: any, idx: number) => {
        // Parse markdown list items as bullets
        const lines = note.content.split('\n');
        const bullets = lines
          .filter((l: string) => l.trim().startsWith('-') || l.trim().startsWith('*'))
          .map((l: string) => l.replace(/^[-\*]\s*/, '').trim());
        
        return {
          title: note.title,
          tag: `Slide ${idx + 1} of ${selectedLecture.notes.length} • Notes Summary`,
          bulletPoints: bullets.length > 0 ? bullets : [note.content.substring(0, 150) + '...'],
          takeaway: note.title
        };
      })
    : [
        {
          title: "Lecture Overview",
          tag: "Slide 1 of 1 • Overview",
          bulletPoints: [selectedLecture?.summary || "No slide content available."],
          takeaway: "Course Review"
        }
      ];

  const formatAudioTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (timeStr: string) => {
    if (!audioRef.current) return;
    const parts = timeStr.split(':');
    const seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    audioRef.current.currentTime = seconds;
    audioRef.current.play();
    setRealAudioPlaying(true);
  };

  const renderTranscriptWithTimestamps = (transcriptText: string) => {
    if (!transcriptText) return null;
    const lines = transcriptText.split('\n');
    return lines.map((line, idx) => {
      const tsMatch = line.match(/^\[(\d{2}):(\d{2})\]/);
      if (tsMatch) {
        const timeStr = `${tsMatch[1]}:${tsMatch[2]}`;
        const content = line.replace(/^\[\d{2}:\d{2}\]\s*/, '');
        return (
          <div key={idx} className="flex gap-4 items-start py-2 border-b border-neutral-900/20 group">
            <button
              onClick={() => handleSeek(timeStr)}
              className="flex-shrink-0 flex items-center gap-1 rounded-lg bg-pink-500/10 px-2 py-1 text-[10px] font-bold text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-all cursor-pointer focus:outline-none"
              title="Seek audio to this point"
            >
              <Play className="h-2.5 w-2.5 fill-current" />
              <span>{timeStr}</span>
            </button>
            <p className="text-xs md:text-sm text-neutral-350 leading-relaxed font-sans select-text">
              {content}
            </p>
          </div>
        );
      }
      return (
        <p key={idx} className="text-xs md:text-sm text-neutral-350 leading-relaxed font-sans py-1.5 select-text">
          {line}
        </p>
      );
    });
  };

  if (!selectedLecture) {
    return (
      <div className="min-h-screen text-slate-100 bg-[#07080c] relative flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="absolute top-10 left-10 w-[450px] h-[450px] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
        
        <div className="space-y-4 max-w-md">
          <BookMarked className="h-16 w-16 text-indigo-400 mx-auto animate-pulse" />
          <h2 className="font-sans font-black text-2xl tracking-tight text-white">No Lecture Materials</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Your Research Hub is currently empty. Please go to the **Academic Library** or **Smart Lecture Capture** to upload or record your first lecture!
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => setActivePage && setActivePage('academic-library')}
              className="rounded-xl bg-white text-black px-4 py-2.5 text-xs font-black hover:bg-neutral-100 transition-all cursor-pointer focus:outline-none"
            >
              Academic Library
            </button>
            <button
              onClick={() => setActivePage && setActivePage('lecture-capture')}
              className="rounded-xl bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 px-4 py-2.5 text-xs font-black text-white transition-all cursor-pointer focus:outline-none"
            >
              Record Lecture
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 bg-[#07080c] relative overflow-x-hidden pb-16">
      
      {/* GLOWING AMBIENT INTELLECTUAL BACKGROUNDS */}
      <div className="absolute top-10 left-10 w-[450px] h-[450px] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[400px] h-[400px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-cyan-950/10 blur-[140px] pointer-events-none" />
      
      {/* COGNITIVE STAR SYSTEM: NOISE PATTERNS */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />

      {/* TOAST SYSTEM */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#0c0d12]/95 border border-indigo-500/20 shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-slide-in backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
          <p className="text-xs font-black font-sans tracking-wide">{toastMessage}</p>
        </div>
      )}

      {/* ======================= STATE 1: GENERATION LOADER ENGINE ======================= */}
      {generatingState === 'loading' && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-6 relative z-10 animate-fade-in">
          
          {/* NotebookLM style concentric scanning rings */}
          <div className="relative h-44 w-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-dashed border-indigo-500/15 animate-spin [animation-duration:24s]" />
            <div className="absolute inset-4 rounded-full border border-indigo-500/10 animate-spin [animation-duration:12s] [animation-direction:reverse]" />
            <div className="absolute inset-8 rounded-full border border-indigo-400/20 animate-spin [animation-duration:6s]" />
            
            <div className="relative h-24 w-24 rounded-full bg-[#0c0e14] border border-indigo-500/30 flex flex-col items-center justify-center shadow-2xl shadow-indigo-500/10">
              <Sparkles className="h-10 w-10 text-indigo-450 animate-pulse" />
              <div className="absolute -bottom-1 text-[9px] font-black tracking-widest text-indigo-450 font-mono">
                {Math.floor((generationStep / generationLogs.length) * 100)}%
              </div>
            </div>
            
            {/* Spinning decorative glyph dots */}
            <div className="absolute top-0 left-1/2 -ml-1.5 h-3 w-3 rounded-full bg-indigo-500 blur-xs animate-ping" />
          </div>

          <div className="mt-10 mr-auto ml-auto max-w-md text-center space-y-4">
            <h3 className="font-sans font-black text-lg text-indigo-400 tracking-wider uppercase font-mono">
              Generating {targetProduct}
            </h3>
            
            <p className="text-xs text-neutral-400 font-medium font-serif leading-relaxed h-12 italic select-none">
              "{generationLogs[generationStep]}"
            </p>

            {/* Stepped progress dots indicator bar */}
            <div className="flex justify-center gap-2 items-center pt-2">
              {generationLogs.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 px-3 rounded-full transition-all duration-300 ${
                    idx <= generationStep 
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-100 shadow-md shadow-indigo-900/40' 
                      : 'bg-neutral-800 opacity-20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= STATE 2: ACTIVE OUTPUT DOCUMENT PREVIEW ======================= */}
      {activeTab && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 pb-16 relative z-10 animate-fade-in space-y-8">
          
          {/* Breadcrumbs Action bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-5 border-b border-neutral-900/60">
            <button
              onClick={() => {
                setActiveTab(null);
              }}
              className="group flex items-center gap-2 bg-neutral-900 hover:bg-neutral-850 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-neutral-850/60 focus:outline-none"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-indigo-400 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Output Studio</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono block">Active Course Spec</span>
                <span className="text-xs font-bold text-neutral-300 truncate max-w-[280px] block">{selectedLecture.title}</span>
              </div>
              <div className="h-7 w-px bg-neutral-800" />
              <button 
                onClick={() => handleCopyText(JSON.stringify({ selectedLecture, activeOutput: activeTab }), 'Course Payload')}
                className="flex items-center gap-1.5 py-2 px-3 bg-indigo-500/15 border border-indigo-500/10 rounded-lg text-[11px] font-bold text-indigo-400 hover:bg-indigo-550/20 active:scale-95 transition-all focus:outline-none"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Module</span>
              </button>
            </div>
          </div>

          {/* Workspace Tabs Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-4 border-b border-neutral-900/40 scrollbar-none select-none">
            {[
              { id: null, label: 'Studio', icon: BookMarked },
              { id: 'Summary', label: 'Summary', icon: FileText },
              { id: 'Transcript', label: 'Transcript', icon: Volume2 },
              { id: 'Flashcards', label: 'Flashcards', icon: Bookmark },
              { id: 'Quiz', label: 'Quiz', icon: GraduationCap },
              { id: 'Mind Map', label: 'Mind Map', icon: Brain },
              { id: 'Slide Deck', label: 'Slide Deck', icon: Layout }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.label}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'Flashcards') setFlashcardIndex(0);
                    if (tab.id === 'Slide Deck') setCurrentSlide(0);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer focus:outline-none ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400 shadow-lg shadow-indigo-550/5'
                      : 'bg-[#0c0d12]/60 border-neutral-900/60 text-neutral-450 hover:text-neutral-200 hover:bg-[#121318]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-neutral-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC TEMPLATE DISPATCHER */}
          {activeTab === 'Summary' && (
            <div className="bg-[#0b0c10]/90 border border-neutral-900/80 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 select-text animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-neutral-900 pb-6">
                <div className="space-y-2">
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-black text-indigo-400 font-mono tracking-widest uppercase">
                    SYSTEM SYNTHESIS SUMMARY
                  </span>
                  <h2 className="font-sans font-black text-2xl md:text-3xl tracking-tight text-white">
                    {selectedLecture.title}
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">Academic Synthesis: Outline & Key Insights</p>
                </div>
                {selectedLecture.summary && (
                  <button
                    onClick={() => handleCopyText(selectedLecture.summary || '', 'Detailed Summary')}
                    className="self-start flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-850 py-2.5 px-4 rounded-xl border border-neutral-850 text-xs font-semibold focus:outline-none"
                  >
                    <Copy className="h-4 w-4 text-neutral-400" />
                    <span>Copy Summary</span>
                  </button>
                )}
              </div>

              {selectedLecture.summary ? (
                <div className="text-xs md:text-sm text-neutral-350 leading-relaxed font-serif whitespace-pre-wrap p-5 bg-neutral-950/45 rounded-2xl border border-neutral-900/60 max-h-[500px] overflow-y-auto">
                  {selectedLecture.summary}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500 font-sans border border-dashed border-neutral-900/40 rounded-2xl bg-[#0c0d12]/50">
                  <FileText className="h-10 w-10 mx-auto opacity-35 mb-3 text-indigo-405" />
                  <p className="font-bold text-xs text-neutral-350">No Summary Available</p>
                  <p className="text-[10px] text-neutral-500 mt-1 max-w-xs mx-auto">
                    A summary has not been generated for this lecture. Please process this lecture with Gemini.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Transcript' && (
            <div className="bg-[#0b0c10]/90 border border-neutral-900/80 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 select-text animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-neutral-900 pb-6">
                <div className="space-y-2">
                  <span className="rounded-full bg-pink-500/10 px-3 py-1 text-[10px] font-black text-pink-400 font-mono tracking-widest uppercase">
                    LECTURE TRANSCRIPTION
                  </span>
                  <h2 className="font-sans font-black text-2xl md:text-3xl tracking-tight text-white">
                    {selectedLecture.title}
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">Word-for-Word Audio Decipher</p>
                </div>
                <button
                  onClick={() => handleCopyText(selectedLecture.transcript || '', 'Transcript')}
                  className="self-start flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-850 py-2.5 px-4 rounded-xl border border-neutral-850 text-xs font-semibold focus:outline-none"
                >
                  <Copy className="h-4 w-4 text-neutral-400" />
                  <span>Copy Full Transcript</span>
                </button>
              </div>

              {/* Real Lecture Audio Player */}
              {selectedLecture.audioUrl && (
                <div className="mb-6 bg-neutral-950/70 border border-neutral-900 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
                  <audio
                    ref={audioRef}
                    src={resolvedAudioUrl}
                    onTimeUpdate={() => {
                      if (audioRef.current) {
                        setRealAudioTime(audioRef.current.currentTime);
                      }
                    }}
                    onDurationChange={() => {
                      if (audioRef.current) {
                        setRealAudioDuration(audioRef.current.duration);
                      }
                    }}
                    onEnded={() => setRealAudioPlaying(false)}
                  />
                  
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => {
                        if (!audioRef.current) return;
                        if (realAudioPlaying) {
                          audioRef.current.pause();
                        } else {
                          audioRef.current.play();
                        }
                        setRealAudioPlaying(!realAudioPlaying);
                      }}
                      className="h-10 w-10 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center cursor-pointer hover:bg-pink-500/20 transition-all focus:outline-none"
                    >
                      {realAudioPlaying ? <Pause className="h-4 w-4 fill-current text-pink-400" /> : <Play className="h-4 w-4 fill-current text-pink-400 ml-0.5" />}
                    </button>
                    
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 font-mono block">Lecture Audio</span>
                      <span className="text-xs font-bold text-neutral-300 font-mono">
                        {formatAudioTime(realAudioTime)} / {formatAudioTime(realAudioDuration || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Slider */}
                  <div className="flex-1 w-full flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={realAudioDuration || 100}
                      value={realAudioTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        setRealAudioTime(time);
                        if (audioRef.current) {
                          audioRef.current.currentTime = time;
                        }
                      }}
                      className="w-full accent-pink-500 bg-neutral-900 h-1 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Speed Controls */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-neutral-500 font-mono uppercase">Speed:</span>
                    {['1.0x', '1.25x', '1.5x', '2.0x'].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.playbackRate = parseFloat(spd);
                          }
                        }}
                        className="px-2 py-1 rounded bg-neutral-900 border border-neutral-850 hover:border-pink-500/30 text-[10px] font-mono font-bold text-neutral-400 hover:text-white transition-all focus:outline-none cursor-pointer"
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 font-serif text-xs md:text-sm text-neutral-350 leading-relaxed whitespace-pre-wrap p-4 bg-neutral-950/45 rounded-2xl border border-neutral-900/60 max-h-[500px] overflow-y-auto">
                {selectedLecture.transcript ? (
                  renderTranscriptWithTimestamps(selectedLecture.transcript)
                ) : (
                  <div className="text-center py-12 text-neutral-550 font-sans">
                    <Volume2 className="h-10 w-10 mx-auto opacity-35 mb-3 text-indigo-450" />
                    <p className="font-bold text-xs">No Transcript Available</p>
                    <p className="text-[10px] text-neutral-500 mt-1 max-w-xs mx-auto">
                      This is a mock lecture without a real audio source. Try recording a real lecture to view its transcript!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Flashcards' && (
            <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-black text-orange-400 font-mono tracking-widest uppercase inline-block">
                  ACTIVE RECALL CAROUSEL
                </span>
                <h2 className="font-sans font-black text-2xl md:text-3.5xl tracking-tight">Conceptual Flashcards</h2>
                <p className="text-xs text-neutral-400">Click card body to rotate and view correct answers.</p>
              </div>

              {/* Flashcard Frame Wrapper */}
              <div className="relative h-[290px] w-full [perspective:1000px]">
                <div 
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  style={{ transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transformStyle: 'preserve-3d' }}
                  className="h-full w-full rounded-3xl bg-[#0c0d12] border border-neutral-900 cursor-pointer shadow-2xl transition-all duration-600 relative select-none ease-in-out hover:border-orange-500/30"
                >
                  {/* FRONT SIDE (rotateY 0) */}
                  <div 
                    style={{ backfaceVisibility: 'hidden' }}
                    className="absolute inset-0 p-8 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black font-mono tracking-widest uppercase text-orange-400">CONCEPT QUESTION</span>
                      <span className="text-xs font-bold text-neutral-500 font-mono">
                        Card {flashcardIndex + 1} of {FLASHCARDS_DECK.length}
                      </span>
                    </div>

                    <p className="text-sm md:text-base font-serif font-semibold text-center text-white leading-relaxed px-2">
                      "{FLASHCARDS_DECK[flashcardIndex].q}"
                    </p>

                    <div className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
                      [ CLICK TO REVEAL KEY ANSWER ]
                    </div>
                  </div>

                  {/* BACK SIDE (rotateY 180) */}
                  <div 
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    className="absolute inset-0 p-8 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black font-mono tracking-widest uppercase text-teal-400">AI COGNITIVE RESOLUTION</span>
                      <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[9px] font-bold text-teal-400 font-mono">ANSWERS VERIFIED</span>
                    </div>

                    <div className="overflow-y-auto max-h-[140px] text-xs md:text-sm text-neutral-300 leading-relaxed font-sans px-2 text-center select-text">
                      {FLASHCARDS_DECK[flashcardIndex].a}
                    </div>

                    <div className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
                      [ CLICK TO RETURN BACK ]
                    </div>
                  </div>
                </div>
              </div>

              {/* Under-Controls: Ratings and indexes */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-neutral-900 pt-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFlashcardMastery(prev => ({ ...prev, [flashcardIndex]: 'mastered' }));
                      handleCopyText(FLASHCARDS_DECK[flashcardIndex].q, "Flashcard Question");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                      flashcardMastery[flashcardIndex] === 'mastered'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-850 border border-neutral-850'
                    }`}
                  >
                    Mark Mastered ✓
                  </button>
                  <button
                    onClick={() => setFlashcardMastery(prev => ({ ...prev, [flashcardIndex]: 'review' }))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                      flashcardMastery[flashcardIndex] === 'review'
                        ? 'bg-amber-500 text-white'
                        : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-850 border border-neutral-850'
                    }`}
                  >
                    Flag For Review ⚠
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={flashcardIndex === 0}
                    onClick={() => {
                      setIsCardFlipped(false);
                      setFlashcardIndex(prev => prev - 1);
                    }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-white disabled:opacity-30 disabled:pointer-events-none focus:outline-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-black text-neutral-400 font-mono px-2">
                    {flashcardIndex + 1} / {FLASHCARDS_DECK.length}
                  </span>
                  <button
                    disabled={flashcardIndex === FLASHCARDS_DECK.length - 1}
                    onClick={() => {
                      setIsCardFlipped(false);
                      setFlashcardIndex(prev => prev + 1);
                    }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-white disabled:opacity-30 disabled:pointer-events-none focus:outline-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Quiz' && (
            <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-fade-in relative">
              
              {/* Confetti sparkling rewards popup */}
              {revealConfetti && (
                <div className="absolute inset-x-0 -top-8 bg-gradient-to-r from-emerald-500 to-indigo-500 p-6 rounded-3xl text-center shadow-3xl text-white space-y-2 z-20 animate-bounce">
                  <Award className="h-10 w-10 mx-auto text-amber-300 animate-pulse" />
                  <h3 className="font-sans font-black text-lg">100% Retentive Mastery Achieved!</h3>
                  <p className="text-xs text-white/90">All questions answered correctly. Knowledge patterns stitched perfectly in long-term memory tracks!</p>
                </div>
              )}

              <div className="text-center space-y-2">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-400 font-mono tracking-widest uppercase inline-block">
                  KNOWLEDGE EVALUATION EXAM
                </span>
                <h2 className="font-sans font-black text-2xl md:text-3.5xl tracking-tight">Lecture Assessment</h2>
                <p className="text-xs text-neutral-400">Complete the questions below to test your actual operational understanding.</p>
              </div>

              <div className="space-y-6">
                {QUIZ_QUESTIONS.map((q, qIdx) => {
                  const hasSelection = selectedAnswers[qIdx] !== undefined;
                  const isSubmitted = quizScore !== null;
                  
                  return (
                    <div 
                      key={qIdx} 
                      className={`rounded-2xl border p-5.5 space-y-4 transition-all ${
                        isSubmitted
                          ? selectedAnswers[qIdx] === q.correctAnswer
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                          : 'bg-[#0c0d12] border-neutral-900'
                      }`}
                    >
                      <h4 className="text-xs font-mono font-bold text-neutral-400">PROBLEM {qIdx + 1}</h4>
                      <p className="text-xs md:text-sm font-sans font-extrabold text-white leading-normal">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 gap-2.5">
                        {q.options.map((option, oIdx) => {
                          const isSelected = selectedAnswers[qIdx] === oIdx;
                          const showCorrect = isSubmitted && oIdx === q.correctAnswer;
                          const showWrong = isSubmitted && isSelected && oIdx !== q.correctAnswer;

                          return (
                            <button
                              key={oIdx}
                              disabled={isSubmitted}
                              onClick={() => handleAnswerSelect(qIdx, oIdx)}
                              className={`w-full rounded-xl py-3 px-4 text-xs font-semibold text-left select-none outline-none transition-all ${
                                showCorrect
                                  ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-black'
                                  : showWrong
                                    ? 'bg-red-500/20 border border-red-500 text-red-300 font-black'
                                    : isSelected
                                      ? 'bg-indigo-600 border border-indigo-400 text-white font-black'
                                      : 'bg-neutral-950/60 border border-neutral-900 text-neutral-200 hover:text-white hover:bg-[#12131a]'
                              } ${isSubmitted ? 'cursor-default' : 'cursor-pointer active:scale-99'}`}
                            >
                              <div className="flex justify-between items-center">
                                <span>{option}</span>
                                {showCorrect && <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">[Correct]</span>}
                                {showWrong && <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 font-mono">[Incorrect]</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explicit Explainer Section */}
                      {(showQuizExplains[qIdx] || isSubmitted) && (
                        <div className="rounded-xl bg-neutral-950 p-4 border border-dashed border-neutral-900 text-xs text-neutral-450 leading-relaxed font-sans mt-3">
                          <span className="font-bold text-indigo-400 uppercase tracking-widest block font-mono text-[9px] mb-1">COGNITIVE RATIO CONCEPTUAL EXPLAINER</span>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action buttons controls Quiz row */}
              <div className="border-t border-neutral-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                {quizScore === null ? (
                  <button
                    disabled={Object.keys(selectedAnswers).length < QUIZ_QUESTIONS.length}
                    onClick={() => submitQuiz(QUIZ_QUESTIONS.length, QUIZ_QUESTIONS)}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-550 text-white font-bold rounded-xl py-3 px-6 text-xs shadow-md transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus:outline-none"
                  >
                    SUBMIT KNOWLEDGE ASSESSMENT
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-between">
                    <div className="text-center sm:text-left">
                      <span className="text-xs text-neutral-400 block font-sans font-semibold">FINAL COMPLIANCE SCORE:</span>
                      <span className="text-lg font-mono font-extrabold text-white">
                        {quizScore} out of {QUIZ_QUESTIONS.length} Correct ({Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)}%)
                      </span>
                    </div>

                    <button
                      onClick={resetQuiz}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-850 px-5 py-3 rounded-xl border border-neutral-850 text-xs font-bold text-white cursor-pointer focus:outline-none"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>RETRY EXAM STEPS</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Mind Map' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black text-cyan-400 font-mono tracking-widest uppercase inline-block">
                  GRAPHICAL CORRELATIONS CANVAS
                </span>
                <h2 className="font-sans font-black text-2xl md:text-3.5xl tracking-tight">Structured Concept Mapping</h2>
                <p className="text-xs text-neutral-400">Click mapping nodes on left to read interactive AI explanations underneath.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Visual coordinate canvas */}
                <div className="lg:col-span-3 rounded-3xl bg-[#0b0c10] border border-neutral-900 p-6 min-h-[380px] relative overflow-hidden flex flex-col justify-between shadow-inner">
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1.5px,transparent_1.5px)] bg-[size:16px_16px] opacity-40" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-950 px-2.5 py-1 text-[9px] font-bold text-cyan-400 font-mono border border-neutral-900">
                      <Network className="h-3 w-3" />
                      COGNITIVE ORBIT MAP
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono uppercase">Interactive coordinates active</span>
                  </div>

                  {/* Nodes grid placement container */}
                  <div className="relative flex-1 min-h-[290px] flex items-center justify-center">
                    
                    {/* Floating map visual elements */}
                    {MIND_MAP_DATA.nodes.map((node) => {
                      const isActive = selectedMindNode === node.id;
                      const hasParent = !!node.parent;
                      
                      return (
                        <button
                          key={node.id}
                          onClick={() => setSelectedMindNode(node.id)}
                          style={{
                            position: 'absolute',
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          className={`z-10 rounded-xl px-3 py-2 text-[10.5px] font-extrabold shadow-lg transition-all duration-300 select-none outline-none focus:outline-none flex flex-col items-start gap-0.5 border ${
                            isActive
                              ? 'bg-cyan-500/20 border-cyan-400 text-white scale-105 shadow-cyan-950/20'
                              : 'bg-neutral-950/70 border-neutral-850 text-neutral-400 hover:text-white hover:border-cyan-400/30'
                          }`}
                        >
                          <span className="truncate max-w-[130px] font-sans text-left">{node.label}</span>
                          <span className="text-[8px] font-mono text-neutral-500 capitalize leading-none">{node.group}</span>
                        </button>
                      );
                    })}

                    {/* SVG Dotted pathway drawing representation */}
                    <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-20">
                      <path d="M 50 150 L 25 75" stroke="#00F0FF" strokeWidth="1" strokeDasharray="4,4" fill="none" />
                      <path d="M 50 150 L 75 75" stroke="#00F0FF" strokeWidth="1" strokeDasharray="4,4" fill="none" />
                      <path d="M 25 75 L 15 45" stroke="#818CF8" strokeWidth="1" strokeDasharray="4,4" fill="none" />
                      <path d="M 25 75 L 35 45" stroke="#818CF8" strokeWidth="1" strokeDasharray="4,4" fill="none" />
                      <path d="M 75 75 L 70 36" stroke="#C084FC" strokeWidth="1" strokeDasharray="4,4" fill="none" />
                      <path d="M 75 75 L 85 114" stroke="#C084FC" strokeWidth="1" strokeDasharray="4,4" fill="none" />
                    </svg>

                  </div>

                  <div className="bg-[#07080a]/60 p-2.5 rounded-xl border border-neutral-900 text-[10px] text-neutral-500 font-semibold flex items-center justify-between">
                    <span>* Try clicking individual coordinates above</span>
                    <button 
                      onClick={() => setSelectedMindNode('root')}
                      className="text-cyan-400 hover:underline hover:text-cyan-300 font-bold uppercase tracking-wide focus:outline-none"
                    >
                      Reset Focus Center
                    </button>
                  </div>
                </div>

                {/* Conceptual Detail Slide Card */}
                <div className="lg:col-span-2 flex flex-col h-full justify-between">
                  {(() => {
                    const activeNode = MIND_MAP_DATA.nodes.find(n => n.id === selectedMindNode) || MIND_MAP_DATA.nodes[0];
                    return (
                      <div className="bg-[#0c0d12] border border-neutral-900 rounded-3xl p-6.5 flex flex-col justify-between h-full space-y-6 shadow-xl relative min-h-[300px]">
                        <div className="space-y-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] dark:text-cyan-400 font-mono block">Node Metadata Resolution</span>
                          <h3 className="font-sans font-black text-lg text-white leading-tight">
                            {activeNode.label}
                          </h3>
                          <p className="text-xs text-neutral-400 font-semibold font-mono uppercase">
                            Group Classify: <span className="text-indigo-400">{activeNode.group}</span>
                          </p>
                          <div className="h-px bg-neutral-900" />
                          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed font-serif select-text">
                            "{activeNode.desc}. Stitching additional analytical elements demonstrates that integrating this specific node with surrounding course pathways boosts retention metrics."
                          </p>
                        </div>

                        <div className="bg-neutral-950 p-4.5 rounded-2xl border border-neutral-900 space-y-2.5">
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block font-mono">Normalized Equation reference</span>
                          <span className="font-mono text-xs font-semibold text-neutral-300 leading-relaxed truncate block">
                            {selectedLecture.coreFormula}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Slide Deck' && (
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-black text-rose-400 font-mono tracking-widest uppercase inline-block font-sans">
                  CONCISE PRESENTATION STEPS
                </span>
                <h2 className="font-sans font-black text-2xl md:text-3.5xl tracking-tight">Structured Presentation Slides</h2>
                <p className="text-xs text-neutral-400">Review core lecture slides customized for quick revision sprints.</p>
              </div>

              {/* 16:9 Presentation Frame */}
              <div className="aspect-video w-full rounded-3xl bg-neutral-950/90 border border-neutral-900 p-8 md:p-12 shadow-2xl flex flex-col justify-between relative overflow-hidden select-none">
                {/* Horizontal slide transition glowing effect */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-rose-450 to-indigo-550 opacity-80" />
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black font-mono tracking-widest uppercase text-rose-400">
                    {SLIDES_DECK[currentSlide].tag}
                  </span>
                  <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-400 font-mono">
                    WIDESCREEN 16:9 MOCKUP
                  </span>
                </div>

                {/* Center Content Slide */}
                <div className="space-y-4 max-w-2xl">
                  <h3 className="font-sans font-extrabold text-lg md:text-2.5xl tracking-tight text-white leading-none">
                    {SLIDES_DECK[currentSlide].title}
                  </h3>
                  
                  <ul className="space-y-2 pt-2">
                    {SLIDES_DECK[currentSlide].bulletPoints.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-300">
                        <span className="text-rose-400 font-bold select-none mt-0.5">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Insight bar */}
                <div className="pt-4 border-t border-neutral-900/60 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 block font-mono">Slide Executive Takeaway</span>
                    <span className="text-xs text-neutral-400 font-serif leading-none truncate max-w-[420px] block font-medium">
                      "{SLIDES_DECK[currentSlide].takeaway}"
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-black text-neutral-500">
                    {currentSlide + 1} / {SLIDES_DECK.length}
                  </span>
                </div>
              </div>

              {/* Bottom Carousel Controls row */}
              <div className="flex justify-between items-center select-none">
                <button
                  disabled={currentSlide === 0}
                  onClick={() => setCurrentSlide(prev => prev - 1)}
                  className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-850 px-4 py-2.5 rounded-xl border border-neutral-850 text-xs font-bold text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus:outline-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous Slide</span>
                </button>

                {/* Progress Indicators */}
                <div className="flex gap-1.5">
                  {SLIDES_DECK.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2.5 w-2.5 rounded-full outline-none transition-all ${
                        idx === currentSlide ? 'bg-rose-500 scale-102' : 'bg-neutral-800 hover:bg-neutral-700'
                      }`}
                    />
                  ))}
                </div>

                <button
                  disabled={currentSlide === SLIDES_DECK.length - 1}
                  onClick={() => setCurrentSlide(prev => prev + 1)}
                  className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-850 px-4 py-2.5 rounded-xl border border-neutral-850 text-xs font-bold text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus:outline-none"
                >
                  <span>Next Slide</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Video Overview' && (
            <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-black text-blue-400 font-mono tracking-widest uppercase inline-block">
                  MULTIMODAL SYNTHESIZED PLAYBACK
                </span>
                <h2 className="font-sans font-black text-2xl md:text-3.5xl tracking-tight">Audio / Video Podcasts</h2>
                <p className="text-xs text-neutral-400">Generate high-fidelity AI narrated discussion summaries automatically.</p>
              </div>

              <div className="rounded-3xl bg-[#0c0d12] border border-neutral-900 p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-8">
                
                {/* Audio waves visual container */}
                <div className="h-44 rounded-2xl bg-neutral-950/70 border border-neutral-900/60 relative flex flex-col justify-center items-center overflow-hidden">
                  
                  {/* Glowing core orb */}
                  <div className={`absolute h-20 w-20 rounded-full blur-2xl transition-all duration-500 ${
                    podcastPlaying ? 'bg-indigo-500/15 animate-pulse' : 'bg-blue-500/5'
                  }`} />

                  {/* Equalizer Wave bars row */}
                  <div className="flex items-end gap-1.5 h-20 relative z-10 select-none">
                    {waveformBars.map((bHeight, idx) => (
                      <div
                        key={idx}
                        style={{ height: `${bHeight}%`, transition: 'height 0.15s ease-in-out' }}
                        className={`w-1 rounded-full ${
                          podcastPlaying
                            ? 'bg-gradient-to-t from-blue-600 via-indigo-500 to-purple-400'
                            : 'bg-neutral-800 h-2'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Absolute Ticker timestamps */}
                  <span className="absolute bottom-2 font-mono text-[9px] text-neutral-500 tracking-wider">
                    {podcastPlaying ? 'CONVERSATIONAL TRANSMISSION STREAMING' : 'AUDIO OUT SYSTEMS STANDBY'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                  {/* Left option selection: Profile */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block font-mono">Narrator AI Voice Signature</label>
                    <select
                      value={podcastVoice}
                      onChange={(e) => setPodcastVoice(e.target.value as any)}
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-900 py-2 px-3 text-xs font-semibold text-neutral-300 outline-none cursor-pointer focus:border-blue-500"
                    >
                      <option value="conversational_female">Jane Sterling (Conversational Female Voice)</option>
                      <option value="academic_male">Marcus Julian (Analytical Male Academic Voice)</option>
                    </select>
                  </div>

                  {/* Right option selection: Speed */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block font-mono">Transmission Velocity</label>
                    <div className="flex gap-1.5">
                      {(['1.0x', '1.2x', '1.5x'] as const).map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setPodcastSpeed(speed)}
                          className={`flex-1 py-1.8 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                            podcastSpeed === speed
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/10'
                              : 'bg-neutral-950 hover:bg-neutral-900 text-neutral-400 border border-neutral-900'
                          }`}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress Timeline bar */}
                <div className="space-y-2 select-none">
                  <div className="flex justify-between text-[10px] font-mono text-neutral-550">
                    <span>{podcastPlaying ? '0:22' : '0:00'}</span>
                    <span>1:45 mins</span>
                  </div>
                  <div 
                    onClick={(e) => {
                      if (!podcastPlaying) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      setPodcastProgress(Math.min(100, Math.max(0, Math.round((clickX / rect.width) * 100))));
                    }} 
                    className="h-1.5 w-full bg-neutral-900 rounded-full cursor-pointer relative"
                  >
                    <div 
                      style={{ width: `${podcastPlaying ? podcastProgress : 0}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 relative"
                    >
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-xl scale-95 border border-indigo-400 block" />
                    </div>
                  </div>
                </div>

                {/* Primary Button Play controls */}
                <div className="flex justify-center select-none pt-2">
                  <button
                    onClick={() => {
                      setPodcastPlaying(!podcastPlaying);
                      if (!podcastPlaying) {
                        setPodcastProgress(30);
                      }
                    }}
                    className={`h-16 w-16 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-97 hover:scale-103 focus:outline-none shadow-xl ${
                      podcastPlaying 
                        ? 'bg-white text-black' 
                        : 'bg-blue-600 text-white shadow-blue-950/25'
                    }`}
                  >
                    {podcastPlaying ? <Pause className="h-6 w-6 fill-current text-black" /> : <Play className="h-6 w-6 fill-current text-white ml-1" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Study Guide' && (
            <div className="bg-[#0b0c10] border border-neutral-900/65 rounded-3xl overflow-hidden shadow-2xl animate-fade-in grid grid-cols-1 lg:grid-cols-4 min-h-[460px]">
              
              {/* Left Column Guide Syllabus Chapters Index */}
              <div className="lg:col-span-1 border-r border-[#15161d] p-5.5 space-y-5 select-none bg-neutral-950/40">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#2563EB] dark:text-purple-400 font-mono block">Course Chapters</span>
                
                <div className="space-y-1.5">
                  {[
                    { id: 'chap-1', label: "I. Introduction & Space Manifolds" },
                    { id: 'chap-2', label: "II. Derivative Chain Systems" },
                    { id: 'chap-3', label: "III. High Dimension Plateaus" },
                    { id: 'chap-4', label: "IV. Course Exam Strategies" }
                  ].map((chap) => (
                    <button
                      key={chap.id}
                      onClick={() => setActiveGuideChapter(chap.id)}
                      className={`w-full text-left rounded-xl py-2.5 px-3.5 text-xs font-semibold transition-all focus:outline-none cursor-pointer truncate ${
                        activeGuideChapter === chap.id
                          ? 'bg-purple-500/10 border-l-2 border-purple-400 text-white'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      {chap.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#15161d] pt-4 mt-4 space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 font-mono block">Milestones Completeness</span>
                  
                  <div className="space-y-2.5">
                    {[
                      { id: 'intro-reading', label: "Review theoretical indices" },
                      { id: 'formula-derivations', label: `Master standard derivation: ${selectedLecture.coreFormula}` },
                      { id: 'practice-test', label: "Solve interactive quiz sweeps" },
                      { id: 'bibliography-review', label: "Review associated PDF papers" }
                    ].map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={milestone.id}
                          checked={!!completedMilestones[milestone.id]}
                          onChange={() => toggleGuideCheckpoint(milestone.id)}
                          className="rounded border-neutral-800 text-purple-500 focus:ring-purple-500 h-3.5 w-3.5 cursor-pointer bg-neutral-900"
                        />
                        <label 
                          htmlFor={milestone.id} 
                          className={`text-[10.5px] leading-tight font-medium cursor-pointer select-none truncate max-w-[170px] ${
                            completedMilestones[milestone.id] ? 'line-through text-neutral-550' : 'text-neutral-400'
                          }`}
                        >
                          {milestone.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column Guide Read Textbook panel */}
              <div className="lg:col-span-3 p-6 md:p-9 space-y-6 select-text overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-[#121318]">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold uppercase text-neutral-450">Syllabus Handbook</span>
                    <h3 className="font-sans font-black text-lg text-white">
                      {activeGuideChapter === 'chap-1' && "Chapter 1: Multi-Dimensional Spaces and Systems Constraints"}
                      {activeGuideChapter === 'chap-2' && "Chapter 2: Derivative Gradients Transformations Matrix Laws"}
                      {activeGuideChapter === 'chap-3' && "Chapter 3: Traversing saddle static surface plateaus"}
                      {activeGuideChapter === 'chap-4' && "Chapter 4: Final Practical midterm review preparation guides"}
                    </h3>
                  </div>
                  <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-400 font-mono">verified syllabus</span>
                </div>

                <div className="text-xs md:text-sm text-neutral-300 font-serif leading-relaxed space-y-4">
                  <p>
                    This handbook outlines key concepts compiled from your active lectures context. Retaining the definitions below guarantees thorough conceptual readiness.
                  </p>
                  
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 select-text">
                    <h4 className="font-sans text-xs font-extrabold text-purple-400 block pb-1">Essential Mathematical Definition:</h4>
                    <p className="font-serif italic text-neutral-350">
                      "In general, functions are bounded inside state-space coordinates. Under dynamic derivations, changes represent gradients vector chains. Formulas converges precisely when inputs scale as configured."
                    </p>
                  </div>

                  <p>
                    Students are strongly advised to perform handwritten manual derivatives proofs matching: <span className="font-mono text-xs text-purple-300">{selectedLecture.coreFormula}</span>. This eliminates calculation blindspots and optimizes long-term retention.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ======================= STATE 3: YOUR LECTURE IS READY MAIN STUDIO ======================= */}
      {!activeTab && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 relative z-10 space-y-12 animate-fade-in">
          
          {/* NotebookLM Layout Header with Active Lecture Selection Pill */}
          <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-neutral-900">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-widest text-indigo-400 font-mono uppercase">
                <Brain className="h-3.5 w-3.5" />
                Active Knowledge Source
              </span>
              <h1 className="font-sans font-black text-2xl tracking-tight text-white flex items-center gap-3">
                {isRenaming ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!tempTitle.trim()) return;
                      try {
                        if (updateLecture && selectedLecture) {
                          await updateLecture(selectedLecture.id, { title: tempTitle.trim() });
                          setSelectedLecture((prev: any) => prev ? { ...prev, title: tempTitle.trim() } : null);
                        }
                        setIsRenaming(false);
                      } catch (err) {
                        console.error("Failed to rename lecture:", err);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      className="rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-bold text-white px-3 py-1.5 focus:border-indigo-500 outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans text-[10px] font-bold focus:outline-none cursor-pointer hover:bg-emerald-500/20 transition-all"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRenaming(false);
                        setTempTitle(selectedLecture.title);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-850 text-neutral-400 font-sans text-[10px] font-bold focus:outline-none cursor-pointer hover:bg-neutral-850 transition-all"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span>{selectedLecture.title}</span>
                    <button
                      onClick={() => setIsRenaming(true)}
                      className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all focus:outline-none cursor-pointer"
                      title="Rename Lecture"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    {deleteLecture && (
                      <button
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to delete this lecture? This will also remove it from the library.")) {
                            try {
                              await deleteLecture(selectedLecture.id);
                              if (setActivePage) setActivePage('academic-library');
                            } catch (err) {
                              console.error("Failed to delete lecture:", err);
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-neutral-400 hover:text-red-400 hover:bg-red-500/20 transition-all focus:outline-none cursor-pointer"
                        title="Delete Lecture"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                )}
              </h1>
              <p className="text-xs text-neutral-500 font-medium font-mono uppercase">{selectedLecture.addedAt} • {selectedLecture.wordCount !== undefined ? selectedLecture.wordCount : (selectedLecture.transcript?.split(/\s+/).filter(Boolean).length || 0)} words synchronized</p>
            </div>

            {/* Select alternative lectures dropdown pill */}
            <div className="flex items-center gap-2.5 self-start md:self-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider font-mono">Shift Source:</span>
              <select
                value={selectedLecture.id}
                onChange={(e) => {
                  const lec = availableLectures.find(l => l.id === e.target.value);
                  if (lec) setSelectedLecture(lec);
                }}
                className="rounded-xl bg-[#0c0e14] border border-neutral-900/80 hover:border-indigo-440 text-xs font-semibold py-2.5 px-4 outline-none cursor-pointer text-neutral-300 focus:border-indigo-500/50"
              >
                {availableLectures.map(lec => (
                  <option key={lec.id} value={lec.id}>{lec.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Workspace Tabs Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-4 border-b border-neutral-900/40 scrollbar-none select-none">
            {[
              { id: null, label: 'Studio', icon: BookMarked },
              { id: 'Summary', label: 'Summary', icon: FileText },
              { id: 'Transcript', label: 'Transcript', icon: Volume2 },
              { id: 'Flashcards', label: 'Flashcards', icon: Bookmark },
              { id: 'Quiz', label: 'Quiz', icon: GraduationCap },
              { id: 'Mind Map', label: 'Mind Map', icon: Brain },
              { id: 'Slide Deck', label: 'Slide Deck', icon: Layout }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.label}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'Flashcards') setFlashcardIndex(0);
                    if (tab.id === 'Slide Deck') setCurrentSlide(0);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer focus:outline-none ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400 shadow-lg shadow-indigo-550/5'
                      : 'bg-[#0c0d12]/60 border-neutral-900/60 text-neutral-450 hover:text-neutral-200 hover:bg-[#121318]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-neutral-550'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Two-Column Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Bento Grid for AI Tools (takes 2 cols on lg) */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Premium Core Headline block */}
              <div className="text-center max-w-2xl mx-auto space-y-3 pt-6 pb-2">
                <div className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                </div>
                <h2 className="font-sans font-black text-3.5xl sm:text-5xl text-white tracking-tight leading-none">
                  Your Lecture Is Ready
                </h2>
                <p className="text-sm md:text-base font-medium text-neutral-450 leading-relaxed max-w-lg mx-auto">
                  Choose how you want AI to transform your lecture. Convert speech structures into customized academic products.
                </p>
              </div>

              {/* Bento-grid of Knowledge transform cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                
                {/* Card 1: Summary */}
                <div 
                  onClick={() => setActiveTab('Summary')}
                  className="xl:col-span-3 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c0d12] via-[#0c0d12]/95 to-[#12131c] border border-neutral-900/70 p-6 flex flex-col justify-between h-[230px] cursor-pointer shadow-xl transition-all duration-300 select-none hover:border-indigo-500/20 hover:scale-101 hover:-translate-y-1 transform"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-indigo-500 to-transparent w-24 h-24 rounded-bl-full" />
                  
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <FileText className="h-5.5 w-5.5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-lg text-white group-hover:text-indigo-400 transition-colors">Detailed Summary</h3>
                    <p className="text-xs text-neutral-400 leading-normal max-w-[240px]">
                      Creates a core structured academic brief, indexing primary themes and derivations.
                    </p>
                  </div>

                  <span className="text-[9.5px] font-black font-mono tracking-widest text-indigo-400 flex items-center gap-1 uppercase">
                    <span>View Summary</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Card 2: Transcript */}
                <div 
                  onClick={() => setActiveTab('Transcript')}
                  className="xl:col-span-3 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c0d12] via-[#0c0d12]/95 to-[#1c0c1b] border border-neutral-900/70 p-6 flex flex-col justify-between h-[230px] cursor-pointer shadow-xl transition-all duration-300 select-none hover:border-pink-500/20 hover:scale-101 hover:-translate-y-1 transform"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-pink-500 to-transparent w-24 h-24 rounded-bl-full" />
                  
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 group-hover:bg-pink-600 group-hover:text-white transition-all">
                    <Volume2 className="h-5.5 w-5.5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-lg text-white group-hover:text-pink-400 transition-colors">Lecture Transcript</h3>
                    <p className="text-xs text-neutral-400 leading-normal max-w-[240px]">
                      View the complete word-for-word text transcription generated from the audio recording.
                    </p>
                  </div>

                  <span className="text-[9.5px] font-black font-mono tracking-widest text-pink-400 flex items-center gap-1 uppercase">
                    <span>Open Transcript</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Card 3: Flashcards */}
                <div 
                  onClick={() => setActiveTab('Flashcards')}
                  className="xl:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c0d12] via-[#0c0d12]/95 to-[#1c140c] border border-neutral-900/70 p-6 flex flex-col justify-between h-[230px] cursor-pointer shadow-xl transition-all duration-300 select-none hover:border-orange-500/20 hover:scale-101 hover:-translate-y-1 transform"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-orange-500 to-transparent w-24 h-24 rounded-bl-full" />

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                    <Bookmark className="h-5.5 w-5.5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-lg text-white group-hover:text-orange-400 transition-colors">Study Flashcards</h3>
                    <p className="text-xs text-neutral-400 leading-normal">
                      Generates an interactive active recall card deck.
                    </p>
                  </div>

                  <span className="text-[9.5px] font-black font-mono tracking-widest text-orange-400 flex items-center gap-1 uppercase">
                    <span>Practice Deck</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Card 4: Quiz */}
                <div 
                  onClick={() => setActiveTab('Quiz')}
                  className="xl:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c0d12] via-[#0c0d12]/95 to-[#0c1c14] border border-neutral-900/70 p-6 flex flex-col justify-between h-[230px] cursor-pointer shadow-xl transition-all duration-300 select-none hover:border-emerald-500/20 hover:scale-101 hover:-translate-y-1 transform"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-emerald-500 to-transparent w-24 h-24 rounded-bl-full" />

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <GraduationCap className="h-5.5 w-5.5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-lg text-white group-hover:text-emerald-400 transition-colors">Interactive Quiz</h3>
                    <p className="text-xs text-neutral-400 leading-normal">
                      Stitches problem sets with correct explainers.
                    </p>
                  </div>

                  <span className="text-[9.5px] font-black font-mono tracking-widest text-emerald-400 flex items-center gap-1 uppercase">
                    <span>Test Recall</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Card 5: Mind Map */}
                <div 
                  onClick={() => setActiveTab('Mind Map')}
                  className="xl:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c0d12] via-[#0c0d12]/95 to-[#0c181c] border border-neutral-900/70 p-6 flex flex-col justify-between h-[230px] cursor-pointer shadow-xl transition-all duration-300 select-none hover:border-cyan-500/20 hover:scale-101 hover:-translate-y-1 transform"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-cyan-500 to-transparent w-24 h-24 rounded-bl-full" />

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                    <Brain className="h-5.5 w-5.5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-lg text-white group-hover:text-cyan-400 transition-colors">Concept Mind Map</h3>
                    <p className="text-xs text-neutral-400 leading-normal">
                      Plots a beautiful relational map tree with branches.
                    </p>
                  </div>

                  <span className="text-[9.5px] font-black font-mono tracking-widest text-cyan-400 flex items-center gap-1 uppercase">
                    <span>View Graph</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Card 6: Slide Deck */}
                <div 
                  onClick={() => setActiveTab('Slide Deck')}
                  className="xl:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c0d12] via-[#0c0d12]/95 to-[#1e1014] border border-neutral-900/70 p-6 flex flex-col justify-between h-[230px] cursor-pointer shadow-xl transition-all duration-300 select-none hover:border-rose-500/20 hover:scale-101 hover:-translate-y-1 transform"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-rose-500 to-transparent w-24 h-24 rounded-bl-full" />

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all">
                    <Layout className="h-5.5 w-5.5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-lg text-white group-hover:text-rose-400 transition-colors">Presentation Slides</h3>
                    <p className="text-xs text-neutral-400 leading-normal">
                      Reduces materials into widescreen slides.
                    </p>
                  </div>

                  <span className="text-[9.5px] font-black font-mono tracking-widest text-rose-400 flex items-center gap-1 uppercase">
                    <span>Launch Slide Carousel</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Card 7: Video Overview */}
                <div 
                  onClick={() => setActiveTab('Video Overview')}
                  className="xl:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c0d12] via-[#0c0d12]/95 to-[#10141c] border border-neutral-900/70 p-6 flex flex-col justify-between h-[230px] cursor-pointer shadow-xl transition-all duration-300 select-none hover:border-blue-500/20 hover:scale-101 hover:-translate-y-1 transform"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-blue-500 to-transparent w-24 h-24 rounded-bl-full" />

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Volume2 className="h-5.5 w-5.5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-lg text-white group-hover:text-blue-400 transition-colors">Podcast Video Overview</h3>
                    <p className="text-xs text-neutral-400 leading-normal">
                      Generates conversational podcast summaries.
                    </p>
                  </div>

                  <span className="text-[9.5px] font-black font-mono tracking-widest text-blue-400 flex items-center gap-1 uppercase">
                    <span>Listen Live</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Card 8: Study Guide */}
                <div 
                  onClick={() => setActiveTab('Study Guide')}
                  className="xl:col-span-2 group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c0d12] via-[#0c0d12]/95 to-[#140c1a] border border-neutral-900/70 p-6 flex flex-col justify-between h-[230px] cursor-pointer shadow-xl transition-all duration-300 select-none hover:border-purple-500/20 hover:scale-101 hover:-translate-y-1 transform"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-purple-500 to-transparent w-24 h-24 rounded-bl-full" />

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <BookOpen className="h-5.5 w-5.5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-lg text-white group-hover:text-purple-400 transition-colors">Study Guide</h3>
                    <p className="text-xs text-neutral-400 leading-normal max-w-[200px]">
                      Detailed textbook syllabus index mapping.
                    </p>
                  </div>

                  <span className="text-[9.5px] font-black font-mono tracking-widest text-purple-400 flex items-center gap-1.5 uppercase">
                    <span>Unlock Syllabus</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                  </span>
                </div>

              </div>

              {/* Quick Sandbox Warning info row */}
              <div className="bg-[#0b0c10]/40 rounded-2xl p-4 border border-neutral-900/60 flex items-center gap-3 select-none">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
                <p className="text-[11px] text-neutral-500 leading-normal font-sans font-semibold">
                  The Note-IT AI Engine is fully synced to your specific academic sandboxes. Syntheses products are generated locally, preserving privacy. For relational databases or external backups, consult settings.
                </p>
              </div>

            </div>

            {/* Right Column: Premium Notes Workspace (takes 1 col on lg) */}
            <div className="lg:col-span-1 flex flex-col h-full bg-[#0c0d12]/60 border border-neutral-900 rounded-3xl p-6.5 relative backdrop-blur-md shadow-2xl min-h-[500px]">
              
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-900/60">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] dark:text-indigo-400 font-mono block">Notes Workspace</span>
                  <h3 className="text-sm font-sans font-black text-white flex items-center gap-1.5">
                    <span>Active Notes</span>
                    <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 font-mono">
                      {notes.length}
                    </span>
                  </h3>
                </div>

                {!isCreatingNote && !editingNoteId && (
                  <button
                    onClick={() => {
                      setIsCreatingNote(true);
                      setNoteTitle('');
                      setNoteContent('');
                    }}
                    className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-[11px] font-black px-3.5 py-2 text-white transition-all active:scale-95 shadow-lg focus:outline-none cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>NEW NOTE</span>
                  </button>
                )}
              </div>

              {/* Note Create/Edit Panel or Notes List */}
              {isCreatingNote || editingNoteId ? (
                <form 
                  onSubmit={isCreatingNote ? handleCreateNote : (e) => { e.preventDefault(); handleUpdateNote(editingNoteId!); }}
                  className="space-y-4 pt-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
                      {isCreatingNote ? 'Create Note Document' : 'Edit Note Document'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[10px] font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-550 uppercase font-mono">NOTE TITLE</label>
                    <input
                      type="text"
                      required
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="e.g. Backpropagation Formulas"
                      className="w-full rounded-xl border border-neutral-900 bg-neutral-950 text-xs font-semibold text-white placeholder-neutral-600 outline-none p-3.5 transition-all focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-550 uppercase font-mono">NOTE CONTENT</label>
                    <textarea
                      required
                      rows={6}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Write your research notes, insights, or lecture concepts here..."
                      className="w-full rounded-xl border border-neutral-900 bg-neutral-950 text-xs font-medium text-neutral-300 placeholder-neutral-600 outline-none p-3.5 transition-all focus:border-indigo-500 resize-none font-serif leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-sans text-xs font-black tracking-wide text-center bg-indigo-600 hover:bg-indigo-550 text-white transition-all focus:outline-none cursor-pointer"
                  >
                    {isCreatingNote ? 'SAVE NOTE TO FIRESTORE' : 'UPDATE NOTE IN FIRESTORE'}
                  </button>
                </form>
              ) : (
                <div className="flex-1 flex flex-col pt-4 overflow-hidden min-h-[380px]">
                  
                  {/* Search Notes widget */}
                  {notes.length > 0 && (
                    <div className="relative w-full mb-4.5">
                      <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        value={noteSearchQuery}
                        onChange={(e) => setNoteSearchQuery(e.target.value)}
                        placeholder="Search active notes..."
                        className="w-full rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-semibold bg-[#121318] text-white border border-neutral-900/60 placeholder-neutral-600 outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Real-time Loading Shimmer State */}
                  {notesLoading ? (
                    <div className="space-y-3.5 py-4 opacity-40">
                      <div className="h-16 bg-[#121318] rounded-xl animate-pulse" />
                      <div className="h-16 bg-[#121318] rounded-xl animate-pulse" />
                      <div className="h-16 bg-[#121318] rounded-xl animate-pulse" />
                    </div>
                  ) : filteredNotes.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500 p-6">
                      <FileText className="h-9 w-9 mb-2 opacity-30 text-indigo-450" />
                      <p className="text-xs font-black font-sans">No Notes Found</p>
                      <p className="text-[10px] text-neutral-500 leading-normal font-medium mt-1.5 max-w-[200px]">
                        {noteSearchQuery ? 'Try matching alternative terms.' : 'Create notes to store core concepts from this lecture.'}
                      </p>
                      {!noteSearchQuery && (
                        <button
                          onClick={() => setIsCreatingNote(true)}
                          className="mt-4 px-4 py-2 rounded-xl border border-dashed border-indigo-500/30 hover:border-indigo-500 text-indigo-400 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Create Note
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 select-text scrollbar-thin max-h-[420px]">
                      {filteredNotes.map((note) => (
                        <div 
                          key={note.id}
                          className="group p-4 rounded-2xl bg-[#121318]/60 border border-neutral-900/80 hover:border-indigo-500/20 hover:bg-[#0c0d12]/45 transition-all flex flex-col justify-between space-y-3 relative"
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="text-xs font-black text-white truncate max-w-[150px] group-hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => handleStartEditNote(note)}>
                                {note.title}
                              </h4>
                              
                              {/* Edit / Trash Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleStartEditNote(note)}
                                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white focus:outline-none cursor-pointer"
                                  title="Edit Note"
                                >
                                  <Sparkles className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="p-1 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-500 focus:outline-none cursor-pointer"
                                  title="Delete Note"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-neutral-400 font-serif leading-relaxed line-clamp-3 leading-tighter">
                              {note.content}
                            </p>
                          </div>

                          <div className="text-[9px] text-neutral-500 font-mono font-medium flex items-center justify-between border-t border-neutral-900/50 pt-2">
                            <span>Firestore Synced</span>
                            <span>
                              {note.updatedAt?.seconds 
                                ? new Date(note.updatedAt.seconds * 1000).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Just now'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>

        </div>
      )}


    </div>
  );
}
