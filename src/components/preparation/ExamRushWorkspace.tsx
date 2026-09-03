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
  Minimize,
  MessageSquare,
  Star,
  Bot,
  MessageCircle,
  PenTool,
  RotateCcw,
  RotateCw,
  Trash2,
  Image as ImageIcon,
  Plus,
  Edit3,
  Copy,
  Layers,
  GitCommit,
  Table,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ExamRushConfig } from './ExamRushSetup';
import { calculateBloomProfile, getBloomLevelMetadata, BloomProfile } from '../../utils/bloomEngine';
import { explainInBhaiLang } from '../../services/bhaiLangService';
import MascotFloatingAnimation from '../MascotFloatingAnimation';
import { Quiz, QuizQuestion, Lecture, Note } from '../../types';

interface ExamRushWorkspaceProps {
  config: ExamRushConfig;
  lectures?: Lecture[];
  notes?: Note[];
  onExit: () => void;
}

interface ReviewItem {
  id: string;
  text: string;
  section: string;
  timestamp: string;
}

interface CommentItem {
  id: string;
  targetText: string;
  commentText: string;
  timestamp: string;
}

interface InsertedImage {
  id: string;
  url: string;
  caption: string;
}

export function ExamRushWorkspace({ config, lectures = [], notes = [], onExit }: ExamRushWorkspaceProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(config.timeRemainingMinutes * 60);
  const [activeTab, setActiveTab] = useState<'attack_plan' | 'revision' | 'subjective' | 'quiz' | 'remember' | 'paper_analysis' | 'final_sheet' | 'readiness'>('attack_plan');
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  
  // Interactive Text Selection & Actions State
  const [selectionToolbarPos, setSelectionToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  
  // Inline Bhai Lang Panel State
  const [bhaiLangText, setBhaiLangText] = useState<string | null>(null);
  const [bhaiLangExplanation, setBhaiLangExplanation] = useState<string | null>(null);
  const [isBhaiLangLoading, setIsBhaiLangLoading] = useState(false);

  // Ask AI Panel State
  const [showAskAiPanel, setShowAskAiPanel] = useState(false);
  const [askAiQuery, setAskAiQuery] = useState('');

  // Review Drawer & Saved Items State
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [reviewToast, setReviewToast] = useState<string | null>(null);

  // Comments State
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  // Digital Notebook Canvas / Doodle Mode State
  const [isDoodleActive, setIsDoodleActive] = useState(false);
  const [doodleTool, setDoodleTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [doodleColor, setDoodleColor] = useState('#8F1D2C');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Custom Image Insertion State
  const [insertedImages, setInsertedImages] = useState<InsertedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Editable Notes Content State
  const [editableNotes, setEditableNotes] = useState<string[]>([
    `Relational algebra provides a formal mathematical foundation for relational databases. Key unary operators include Selection (σ) to filter tuples based on predicates and Projection (π) to isolate specific attributes. Binary operators like Cartesian Product (×) and Natural Join (⋈) combine tuples from multiple relations matching column domain keys.`,
    `Normalization eliminates data redundancy and prevents insertion, update, and deletion anomalies across schemas. First Normal Form (1NF) requires atomic values. 2NF requires full functional dependency on the primary candidate key. 3NF eliminates transitive dependencies. BCNF enforces that for every non-trivial functional dependency X → Y, X must be a strict super key.`,
    `Transactions guarantee database consistency via ACID properties: Atomicity (all-or-nothing execution), Consistency (state validity before and after execution), Isolation (concurrent transactions execute independently without interference), and Durability (committed changes persist permanently despite hardware failure).`
  ]);

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

  // Text Selection Detection Listener (MouseUp & selectionchange)
  const handleCheckTextSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      return;
    }

    const text = sel.toString().trim();
    if (text.length > 3) {
      setSelectedText(text);
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionToolbarPos({
        x: Math.max(20, Math.min(window.innerWidth - 320, rect.left + rect.width / 2 - 140)),
        y: Math.max(10, rect.top - 60 + window.scrollY)
      });
    }
  };

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setTimeout(() => {
          const currentSel = window.getSelection();
          if (!currentSel || currentSel.isCollapsed) {
            setSelectionToolbarPos(null);
          }
        }, 300);
      } else {
        handleCheckTextSelection();
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  // Canvas Drawing Handlers for Doodle Mode
  useEffect(() => {
    if (!isDoodleActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions matching parent container
    const parent = canvas.parentElement;
    canvas.width = parent ? parent.clientWidth : window.innerWidth;
    canvas.height = parent ? parent.clientHeight : 1400;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      const pos = getPos(e);
      if (doodleTool === 'eraser') {
        ctx.clearRect(pos.x - 15, pos.y - 15, 30, 30);
      } else {
        ctx.strokeStyle = doodleTool === 'highlighter' ? `${doodleColor}40` : doodleColor;
        ctx.lineWidth = doodleTool === 'highlighter' ? 20 : 3.5;
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    };

    const stopDrawing = () => {
      isDrawingRef.current = false;
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
    };
  }, [isDoodleActive, doodleTool, doodleColor]);

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

  // Actions for Selection Bar & Direct Card Bhai Lang Trigger
  const handleTriggerBhaiLang = async (textToExplain?: string) => {
    const text = textToExplain || selectedText;
    if (!text) return;
    setBhaiLangText(text);
    setSelectionToolbarPos(null);
    setIsBhaiLangLoading(true);
    setBhaiLangExplanation(null);
    try {
      const res = await explainInBhaiLang(text, config.subject.canonicalName);
      setBhaiLangExplanation(res);
    } catch (e) {
      setBhaiLangExplanation("Bhai lagta hai network issue hai. Dobara click karke try karo!");
    } finally {
      setIsBhaiLangLoading(false);
    }
  };

  const handleKeepForReview = () => {
    if (!selectedText) return;
    const newItem: ReviewItem = {
      id: `rev-${Date.now()}`,
      text: selectedText,
      section: activeTab,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setReviewItems(prev => [newItem, ...prev]);
    setSelectionToolbarPos(null);
    setReviewToast('Saved to Review ✓');
    setTimeout(() => setReviewToast(null), 3000);
  };

  const handleOpenAskAi = () => {
    setShowAskAiPanel(true);
    setSelectionToolbarPos(null);
    setAskAiQuery(`Explain this concept simply: "${selectedText}"`);
  };

  const handleOpenCommentDialog = () => {
    setShowCommentDialog(true);
    setSelectionToolbarPos(null);
  };

  const handleAddCommentSubmit = () => {
    if (!commentInput.trim() || !selectedText) return;
    const newComment: CommentItem = {
      id: `cmt-${Date.now()}`,
      targetText: selectedText,
      commentText: commentInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setComments(prev => [...prev, newComment]);
    setCommentInput('');
    setShowCommentDialog(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newImg: InsertedImage = {
        id: `img-${Date.now()}`,
        url: (ev.target?.result as string) || '',
        caption: file.name
      };
      setInsertedImages(prev => [...prev, newImg]);
    };
    reader.readAsDataURL(file);
  };

  // Time-Allocated Exam Attack Plan
  const totalMins = config.timeRemainingMinutes;
  const attackPlanSchedule = [
    { range: `0–${Math.round(totalMins * 0.15)}m`, title: 'Core Concept Revision', desc: 'Fast scannable concepts, SVG diagrams & comparison tables' },
    { range: `${Math.round(totalMins * 0.15)}–${Math.round(totalMins * 0.40)}m`, title: 'High-Priority Exam Topics', desc: 'Teacher highlighted & paper pattern focus' },
    { range: `${Math.round(totalMins * 0.40)}–${Math.round(totalMins * 0.65)}m`, title: 'Subjective Questions', desc: '2-mark, 5-mark & 10-mark structured answers' },
    { range: `${Math.round(totalMins * 0.65)}–${Math.round(totalMins * 0.85)}m`, title: 'Adaptive Practice Quiz', desc: 'Bloom-driven self testing' },
    { range: `${Math.round(totalMins * 0.85)}–${totalMins}m`, title: 'Final Pre-Exam Sheet', desc: 'Ultra-fast memory triggers & formulas' },
  ];

  const overallProgressPercent = Math.min(100, Math.round((Object.keys(completedSections).length / 7) * 100));

  return (
    <div className="fixed inset-0 z-[999999] h-screen w-screen overflow-y-auto bg-[#FAF7F5] dark:bg-[#120F10] text-[#191416] dark:text-[#FAF7F5] font-sans selection:bg-[#F8EDEF] selection:text-[#8F1D2C]">
      
      {/* MASCOT COMPANION - RANDOM CORNER ENTRANCE */}
      <MascotFloatingAnimation />

      {/* FLOATING TEXT SELECTION TOOLBAR (Z-50) */}
      {selectionToolbarPos && (
        <div 
          style={{ top: `${selectionToolbarPos.y}px`, left: `${selectionToolbarPos.x}px` }}
          className="absolute z-50 animate-fade-in flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#651522] text-white shadow-2xl border border-red-400/40"
        >
          <button
            type="button"
            onClick={() => handleTriggerBhaiLang()}
            className="px-3 py-1.5 rounded-xl bg-[#8F1D2C] hover:bg-[#B83245] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🗣️ Bhai Lang</span>
          </button>
          <button
            type="button"
            onClick={handleKeepForReview}
            className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
            <span>Review</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAskAi}
            className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bot className="h-3.5 w-3.5 text-emerald-300" />
            <span>Ask AI</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCommentDialog}
            className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5 text-rose-300" />
            <span>Comment</span>
          </button>
        </div>
      )}

      {/* TOAST NOTIFICATION FOR KEEP FOR REVIEW */}
      {reviewToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#8F1D2C] text-white font-sans text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
          <span>{reviewToast}</span>
        </div>
      )}

      {/* STICKY CALM ACADEMIC HEADER BAR (Z-50) */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#191416]/95 backdrop-blur-md border-b border-[#E5D7D9] dark:border-[#3D282C] px-6 sm:px-10 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-[#8F1D2C] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5">
              <Flame className="h-4 w-4 fill-white" /> EXAM RUSH
            </span>
            <h1 className="text-base font-bold text-[#191416] dark:text-[#FAF7F5]">
              {config.subject.canonicalName}
            </h1>
          </div>
          <span className="text-xs text-[#71676A] font-medium block sm:hidden">
            ⏱ {formatTimer(secondsRemaining)}
          </span>
        </div>

        {/* CENTER TIMER & PROGRESS */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border border-[#8F1D2C]/30 bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] dark:text-[#B83245] font-mono text-xs font-bold">
            <Clock className="h-4 w-4" />
            <span>{formatTimer(secondsRemaining)} remaining</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-[#71676A]">Progress</span>
            <div className="w-32 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#8F1D2C] transition-all duration-300" style={{ width: `${overallProgressPercent}%` }} />
            </div>
            <span className="text-xs font-bold text-[#8F1D2C]">{overallProgressPercent}%</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          {reviewItems.length > 0 && (
            <button
              type="button"
              onClick={() => setShowReviewDrawer(!showReviewDrawer)}
              className="px-3 py-1.5 rounded-xl bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] text-xs font-bold border border-[#8F1D2C]/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Star className="h-3.5 w-3.5 fill-[#8F1D2C]" />
              <span>Saved Review ({reviewItems.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] text-[#191416] dark:text-[#FAF7F5] text-xs font-medium hover:bg-[#F8EDEF] transition-all cursor-pointer flex items-center gap-1"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onExit}
            className="px-3.5 py-1.5 rounded-xl border border-[#651522] bg-[#651522] hover:bg-[#4A121A] text-white text-xs font-bold tracking-wide shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            title="Exit Exam Rush Learning Environment"
          >
            <X className="h-4 w-4" />
            <span>Exit Rush</span>
          </button>
        </div>
      </header>

      {/* TOP ACADEMIC NAVIGATION BAR (Z-50) */}
      <nav className="sticky top-[57px] z-50 bg-white dark:bg-[#191416] border-b border-[#E5D7D9] dark:border-[#3D282C] px-6 sm:px-10 py-2.5 flex items-center gap-2 overflow-x-auto custom-scrollbar text-sm font-sans shadow-sm">
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
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#8F1D2C] text-white font-semibold shadow-sm'
                  : 'text-[#71676A] dark:text-[#A3989B] hover:bg-[#F8EDEF] dark:hover:bg-[#2D1B20] hover:text-[#191416] font-medium'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* SAVED REVIEW DRAWER OVERLAY */}
      {showReviewDrawer && (
        <aside className="fixed right-0 top-24 bottom-0 z-50 w-80 sm:w-96 bg-white dark:bg-[#191416] border-l border-[#E5D7D9] dark:border-[#3D282C] shadow-2xl p-6 overflow-y-auto space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
            <h3 className="text-base font-bold text-[#8F1D2C] flex items-center gap-2">
              <Star className="h-4 w-4 fill-[#8F1D2C]" /> Saved for Review ({reviewItems.length})
            </h3>
            <button type="button" onClick={() => setShowReviewDrawer(false)} className="p-1 text-[#71676A] hover:text-[#191416]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {reviewItems.map(item => (
              <div key={item.id} className="p-4 rounded-xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-[#71676A]">
                  <span className="font-semibold uppercase">{item.section}</span>
                  <span>{item.timestamp}</span>
                </div>
                <p className="text-xs font-sans text-[#191416] dark:text-[#FAF7F5] leading-relaxed italic">
                  "{item.text}"
                </p>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* MAIN COMFORTABLE READING WORKSPACE */}
      <main className="max-w-[1150px] mx-auto px-6 sm:px-12 py-10 space-y-10 text-left relative min-h-[900px]">
        
        {/* DOODLE CANVAS OVERLAY (Z-20 to sit below controls) */}
        {isDoodleActive && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-20 cursor-crosshair touch-none"
          />
        )}

        {/* ATTACHED MATERIALS BANNER */}
        {config.attachments && config.attachments.length > 0 && (
          <div className="p-6 rounded-3xl border border-[#8F1D2C]/30 bg-[#F8EDEF] dark:bg-[#2D1B20] space-y-3 shadow-sm relative z-30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#8F1D2C] flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Grounded in {config.attachments.length} Attached Materials & Extracted Web Links
              </h3>
              <span className="text-xs font-semibold bg-[#8F1D2C] text-white px-2.5 py-1 rounded-lg">
                Knowledge Studio Ingested
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {config.attachments.map(att => (
                <div key={att.id} className="px-3.5 py-1.5 bg-white dark:bg-[#191416] rounded-xl border border-[#E5D7D9] dark:border-[#3D282C] text-xs font-semibold text-[#191416] dark:text-[#FAF7F5] flex items-center gap-2 shadow-sm">
                  <span>{att.type === 'url' ? '🌐' : att.type === 'presentation' ? '📊' : att.type === 'image' ? '🖼️' : '📄'}</span>
                  <span className="truncate max-w-[200px] font-bold">{att.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INLINE BHAI LANG EXPLANATION CONTAINER */}
        {(bhaiLangExplanation || isBhaiLangLoading) && (
          <div className="p-6 rounded-3xl border border-[#8F1D2C]/40 bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#191416] dark:text-[#FAF7F5] space-y-3 shadow-md animate-fade-in relative z-30">
            <div className="flex items-center justify-between border-b border-[#8F1D2C]/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#8F1D2C] text-white rounded-lg text-xs">🗣️</span>
                <h3 className="text-sm font-bold text-[#8F1D2C] dark:text-[#B83245]">Bhai Lang Hinglish Explanation</h3>
              </div>
              <button type="button" onClick={() => { setBhaiLangExplanation(null); setIsBhaiLangLoading(false); }} className="text-[#71676A] hover:text-[#191416]">
                <X className="h-4 w-4" />
              </button>
            </div>
            {isBhaiLangLoading ? (
              <div className="py-6 text-center text-xs font-semibold text-[#8F1D2C] animate-pulse">
                Bhai soch raha hai (simplifying in simple Hinglish)...
              </div>
            ) : (
              <p className="text-sm font-sans leading-relaxed whitespace-pre-line bg-white/90 dark:bg-[#191416]/90 p-5 rounded-2xl border border-[#8F1D2C]/20 font-medium">
                {bhaiLangExplanation}
              </p>
            )}
          </div>
        )}

        {/* 1. EXAM ATTACK PLAN */}
        {activeTab === 'attack_plan' && (
          <section className="space-y-8 animate-fade-in relative z-30">
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                1. Personalized Exam Attack Plan ({config.timeLabel})
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Structured preparation timeline calculated specifically for your {config.timeLabel} exam window.
              </p>
            </div>

            <div className="space-y-4">
              {attackPlanSchedule.map((item, idx) => (
                <div key={idx} className="p-6 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] flex items-center justify-between gap-6 shadow-sm hover:border-[#8F1D2C]/40 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="px-3.5 py-1.5 bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] dark:text-[#B83245] font-mono font-bold text-xs rounded-xl border border-[#8F1D2C]/20 shrink-0">
                      {item.range}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#191416] dark:text-[#FAF7F5]">{item.title}</h3>
                      <p className="text-xs text-[#71676A] font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const tabMap: Record<number, any> = { 0: 'revision', 1: 'remember', 2: 'subjective', 3: 'quiz', 4: 'final_sheet' };
                      setActiveTab(tabMap[idx] || 'revision');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#8F1D2C] hover:bg-[#651522] text-white text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>START →</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. QUICK CONCEPT REVISION NOTES */}
        {activeTab === 'revision' && (
          <section className="space-y-8 animate-fade-in relative z-30" onMouseUp={handleCheckTextSelection}>
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4 flex items-center justify-between relative z-40">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                  2. Quick Concept Revision Notes
                </h2>
                <p className="text-sm text-[#71676A] font-medium mt-1">
                  Lecture & material grounded revision notes with interactive diagrams, comparison matrices & Bhai Lang conversion.
                </p>
              </div>

              {/* TOOLBAR FOR DOODLE & IMAGE INSERTION (Z-50) */}
              <div className="flex items-center gap-2 relative z-50">
                <button
                  type="button"
                  onClick={() => setIsDoodleActive(!isDoodleActive)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isDoodleActive
                      ? 'bg-[#8F1D2C] text-white border-[#8F1D2C] ring-2 ring-red-400'
                      : 'bg-[#FAF7F5] dark:bg-[#231B1E] text-[#191416] dark:text-[#FAF7F5] border-[#E5D7D9] hover:bg-[#F8EDEF]'
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                  <span>{isDoodleActive ? '✕ Close Doodle' : '✏️ Notebook Doodle'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] text-[#191416] dark:text-[#FAF7F5] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#F8EDEF]"
                >
                  <ImageIcon className="h-4 w-4 text-[#8F1D2C]" />
                  <span>Insert Image</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
            </div>

            {/* DOODLE TOOLBAR WHEN ACTIVE (Z-50) */}
            {isDoodleActive && (
              <div className="p-3 rounded-2xl bg-[#F8EDEF] dark:bg-[#2D1B20] border border-[#8F1D2C]/40 flex items-center gap-3 text-xs font-bold relative z-50 shadow-md">
                <span className="text-[#8F1D2C]">Drawing Tools:</span>
                <button type="button" onClick={() => setDoodleTool('pen')} className={`px-3 py-1 rounded-lg cursor-pointer ${doodleTool === 'pen' ? 'bg-[#8F1D2C] text-white' : 'bg-white text-black'}`}>Pen</button>
                <button type="button" onClick={() => setDoodleTool('highlighter')} className={`px-3 py-1 rounded-lg cursor-pointer ${doodleTool === 'highlighter' ? 'bg-[#8F1D2C] text-white' : 'bg-white text-black'}`}>Highlighter</button>
                <button type="button" onClick={() => setDoodleTool('eraser')} className={`px-3 py-1 rounded-lg cursor-pointer ${doodleTool === 'eraser' ? 'bg-[#8F1D2C] text-white' : 'bg-white text-black'}`}>Eraser</button>
                
                <div className="flex items-center gap-1.5 ml-auto">
                  {['#8F1D2C', '#D97706', '#059669', '#191416'].map(c => (
                    <button key={c} type="button" onClick={() => setDoodleColor(c)} className="w-5 h-5 rounded-full border border-white cursor-pointer" style={{ backgroundColor: c }} />
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsDoodleActive(false)}
                    className="ml-2 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-red-700"
                  >
                    ✕ Exit Doodle
                  </button>
                </div>
              </div>
            )}

            {/* INSERTED CUSTOM IMAGES */}
            {insertedImages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-30">
                {insertedImages.map(img => (
                  <div key={img.id} className="p-3 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] relative group shadow-sm">
                    <img src={img.url} alt={img.caption} className="w-full h-48 object-cover rounded-xl" />
                    <span className="text-xs font-medium text-[#71676A] mt-2 block">{img.caption}</span>
                    <button
                      type="button"
                      onClick={() => setInsertedImages(prev => prev.filter(i => i.id !== img.id))}
                      className="absolute top-4 right-4 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* REVISION CONCEPT CARDS WITH DIAGRAMS & TABLES */}
            <div className="space-y-8 relative z-30">

              {/* CONCEPT CARD 1: RELATIONAL ALGEBRA & QUERY ENGINE */}
              <article className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
                  <h3 className="text-xl font-bold text-[#191416] dark:text-[#FAF7F5]">
                    1. Core Relational Algebra & SQL Query Execution Pipeline
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerBhaiLang(editableNotes[0])}
                      className="px-3 py-1 bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] border border-[#8F1D2C]/30 rounded-lg text-xs font-bold hover:bg-[#8F1D2C] hover:text-white transition-colors cursor-pointer"
                    >
                      🗣️ Explain in Bhai Lang
                    </button>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white">
                      Understand
                    </span>
                  </div>
                </div>

                <p className="text-[19px] font-sans text-[#191416] dark:text-[#FAF7F5] leading-[1.75] tracking-normal">
                  {editableNotes[0]}
                </p>

                {/* SVG ARCHITECTURE DIAGRAM: QUERY EXECUTION ENGINE */}
                <div className="p-6 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] space-y-3">
                  <div className="text-xs font-bold text-[#8F1D2C] uppercase flex items-center gap-1.5">
                    <GitCommit className="h-4 w-4" /> Architecture Diagram: Relational Query Optimization Pipeline
                  </div>
                  <div className="overflow-x-auto py-2">
                    <svg viewBox="0 0 800 160" className="w-full h-auto min-w-[600px] text-xs font-sans font-semibold">
                      {/* Box 1: SQL Query */}
                      <rect x="20" y="45" width="140" height="70" rx="12" fill="#8F1D2C" />
                      <text x="90" y="75" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">SQL Query Input</text>
                      <text x="90" y="95" fill="#F8EDEF" textAnchor="middle" fontSize="10">SELECT * FROM R</text>

                      <path d="M 160 80 L 210 80" stroke="#8F1D2C" strokeWidth="3" markerEnd="url(#arrow)" />

                      {/* Box 2: Parser & RA Tree */}
                      <rect x="210" y="45" width="160" height="70" rx="12" fill="#FFFFFF" stroke="#8F1D2C" strokeWidth="2" />
                      <text x="290" y="75" fill="#191416" textAnchor="middle" fontWeight="bold">Parser & RA Tree</text>
                      <text x="290" y="95" fill="#71676A" textAnchor="middle" fontSize="10">Selection (σ), Projection (π)</text>

                      <path d="M 370 80 L 420 80" stroke="#8F1D2C" strokeWidth="3" />

                      {/* Box 3: Query Optimizer */}
                      <rect x="420" y="45" width="160" height="70" rx="12" fill="#FFFFFF" stroke="#8F1D2C" strokeWidth="2" />
                      <text x="500" y="75" fill="#191416" textAnchor="middle" fontWeight="bold">Cost Optimizer</text>
                      <text x="500" y="95" fill="#71676A" textAnchor="middle" fontSize="10">Index vs Sequential Scan</text>

                      <path d="M 580 80 L 630 80" stroke="#8F1D2C" strokeWidth="3" />

                      {/* Box 4: Execution Result */}
                      <rect x="630" y="45" width="150" height="70" rx="12" fill="#059669" />
                      <text x="705" y="75" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Execution Result</text>
                      <text x="705" y="95" fill="#ECFDF5" textAnchor="middle" fontSize="10">Filtered Tuples (σ_p)</text>
                    </svg>
                  </div>
                </div>

                {/* COMPARISON MATRIX TABLE: SQL JOIN TYPES */}
                <div className="p-6 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] space-y-3">
                  <div className="text-xs font-bold text-[#8F1D2C] uppercase flex items-center gap-1.5">
                    <Table className="h-4 w-4" /> Comparison Table: SQL Join Operators & Output Matching Behavior
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-sans text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#8F1D2C] bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] dark:text-[#B83245]">
                          <th className="p-3 font-bold">Join Type</th>
                          <th className="p-3 font-bold">Relational Notation</th>
                          <th className="p-3 font-bold">Matching Condition</th>
                          <th className="p-3 font-bold">Unmatched Tuples Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5D7D9] dark:divide-[#3D282C]">
                        <tr>
                          <td className="p-3 font-bold text-[#191416] dark:text-[#FAF7F5]">Inner Join</td>
                          <td className="p-3 font-mono text-[#8F1D2C]">R ⋈_θ S</td>
                          <td className="p-3">Matches keys on both R and S</td>
                          <td className="p-3 text-[#71676A]">Discarded</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#191416] dark:text-[#FAF7F5]">Left Outer Join</td>
                          <td className="p-3 font-mono text-[#8F1D2C]">R ⟕ S</td>
                          <td className="p-3">All R tuples + matching S tuples</td>
                          <td className="p-3 text-[#71676A]">Padded with NULL for missing S</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#191416] dark:text-[#FAF7F5]">Full Outer Join</td>
                          <td className="p-3 font-mono text-[#8F1D2C]">R ⟗ S</td>
                          <td className="p-3">All tuples from both R and S</td>
                          <td className="p-3 text-[#71676A]">NULL padded on both sides</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>

              {/* CONCEPT CARD 2: DATABASE NORMALIZATION */}
              <article className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
                  <h3 className="text-xl font-bold text-[#191416] dark:text-[#FAF7F5]">
                    2. Database Normalization (1NF, 2NF, 3NF & BCNF)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerBhaiLang(editableNotes[1])}
                      className="px-3 py-1 bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] border border-[#8F1D2C]/30 rounded-lg text-xs font-bold hover:bg-[#8F1D2C] hover:text-white transition-colors cursor-pointer"
                    >
                      🗣️ Explain in Bhai Lang
                    </button>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white">
                      Remember
                    </span>
                  </div>
                </div>

                <p className="text-[19px] font-sans text-[#191416] dark:text-[#FAF7F5] leading-[1.75] tracking-normal">
                  {editableNotes[1]}
                </p>

                {/* GRAPH DIAGRAM: FUNCTIONAL DEPENDENCY HIERARCHY TREE */}
                <div className="p-6 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] space-y-3">
                  <div className="text-xs font-bold text-[#8F1D2C] uppercase flex items-center gap-1.5">
                    <Layers className="h-4 w-4" /> Normalization Hierarchy Graph & Strictness Tree
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs font-bold">
                    <div className="p-4 rounded-xl border border-slate-300 bg-white dark:bg-[#191416] space-y-1">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px]">Level 1</span>
                      <h4 className="text-sm font-extrabold text-[#191416] dark:text-[#FAF7F5]">1NF</h4>
                      <p className="text-[11px] text-[#71676A] font-normal">Atomic attributes (No multi-valued arrays)</p>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 space-y-1">
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px]">Level 2</span>
                      <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-300">2NF</h4>
                      <p className="text-[11px] text-[#71676A] font-normal">No partial dependency on candidate key</p>
                    </div>
                    <div className="p-4 rounded-xl border border-blue-300 bg-blue-50 dark:bg-blue-950/30 space-y-1">
                      <span className="px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-[10px]">Level 3</span>
                      <h4 className="text-sm font-extrabold text-blue-900 dark:text-blue-300">3NF</h4>
                      <p className="text-[11px] text-[#71676A] font-normal">No transitive non-prime dependency</p>
                    </div>
                    <div className="p-4 rounded-xl border border-[#8F1D2C] bg-[#F8EDEF] dark:bg-[#2D1B20] space-y-1">
                      <span className="px-2 py-0.5 bg-[#8F1D2C] text-white rounded text-[10px]">Strict Level</span>
                      <h4 className="text-sm font-extrabold text-[#8F1D2C]">BCNF</h4>
                      <p className="text-[11px] text-[#71676A] font-normal">For ALL X → Y, X MUST be a Super Key</p>
                    </div>
                  </div>
                </div>

                {/* DETAILED NORMALIZATION COMPARISON TABLE */}
                <div className="p-6 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] space-y-3">
                  <div className="text-xs font-bold text-[#8F1D2C] uppercase flex items-center gap-1.5">
                    <Table className="h-4 w-4" /> Comprehensive Normal Form Matrix
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-sans text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#8F1D2C] bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] dark:text-[#B83245]">
                          <th className="p-3 font-bold">Normal Form</th>
                          <th className="p-3 font-bold">Disallowed Dependency</th>
                          <th className="p-3 font-bold">Lossless Join Guaranteed?</th>
                          <th className="p-3 font-bold">Dependency Preservation Guaranteed?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5D7D9] dark:divide-[#3D282C]">
                        <tr>
                          <td className="p-3 font-bold text-[#191416] dark:text-[#FAF7F5]">1NF</td>
                          <td className="p-3">Multi-valued & Composite attributes</td>
                          <td className="p-3 text-emerald-600 font-bold">Yes ✓</td>
                          <td className="p-3 text-emerald-600 font-bold">Yes ✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#191416] dark:text-[#FAF7F5]">2NF</td>
                          <td className="p-3">Partial dependencies (Non-prime on part of PK)</td>
                          <td className="p-3 text-emerald-600 font-bold">Yes ✓</td>
                          <td className="p-3 text-emerald-600 font-bold">Yes ✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#191416] dark:text-[#FAF7F5]">3NF</td>
                          <td className="p-3">Transitive dependencies (Non-prime → Non-prime)</td>
                          <td className="p-3 text-emerald-600 font-bold">Yes ✓</td>
                          <td className="p-3 text-emerald-600 font-bold">Yes ✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#8F1D2C]">BCNF</td>
                          <td className="p-3">Any FD X → Y where X is NOT a super key</td>
                          <td className="p-3 text-emerald-600 font-bold">Yes ✓</td>
                          <td className="p-3 text-rose-600 font-bold">No ✕ (May require 3NF fallback)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>

              {/* CONCEPT CARD 3: TRANSACTION ACID & CONCURRENCY CONTROL */}
              <article className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
                  <h3 className="text-xl font-bold text-[#191416] dark:text-[#FAF7F5]">
                    3. ACID Properties & 2-Phase Locking (2PL) Protocol
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerBhaiLang(editableNotes[2])}
                      className="px-3 py-1 bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] border border-[#8F1D2C]/30 rounded-lg text-xs font-bold hover:bg-[#8F1D2C] hover:text-white transition-colors cursor-pointer"
                    >
                      🗣️ Explain in Bhai Lang
                    </button>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white">
                      Apply
                    </span>
                  </div>
                </div>

                <p className="text-[19px] font-sans text-[#191416] dark:text-[#FAF7F5] leading-[1.75] tracking-normal">
                  {editableNotes[2]}
                </p>

                {/* DIAGRAM: 2-PHASE LOCKING (2PL) STATE TRANSITION */}
                <div className="p-6 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] space-y-3">
                  <div className="text-xs font-bold text-[#8F1D2C] uppercase flex items-center gap-1.5">
                    <GitCommit className="h-4 w-4" /> Protocol Lifecycle: 2-Phase Locking (2PL) Lock Phases
                  </div>
                  <div className="overflow-x-auto py-2">
                    <svg viewBox="0 0 800 140" className="w-full h-auto min-w-[600px] text-xs font-sans font-semibold">
                      <rect x="30" y="35" width="200" height="60" rx="10" fill="#2563EB" />
                      <text x="130" y="62" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Growing Phase</text>
                      <text x="130" y="78" fill="#DBEAFE" textAnchor="middle" fontSize="10">Locks Acquired (Shared / Exclusive)</text>

                      <path d="M 230 65 L 300 65" stroke="#8F1D2C" strokeWidth="3" />

                      <rect x="300" y="35" width="180" height="60" rx="10" fill="#8F1D2C" />
                      <text x="390" y="62" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Lock Point</text>
                      <text x="390" y="78" fill="#F8EDEF" textAnchor="middle" fontSize="10">Max locks obtained</text>

                      <path d="M 480 65 L 550 65" stroke="#8F1D2C" strokeWidth="3" />

                      <rect x="550" y="35" width="200" height="60" rx="10" fill="#059669" />
                      <text x="650" y="62" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Shrinking Phase</text>
                      <text x="650" y="78" fill="#ECFDF5" textAnchor="middle" fontSize="10">Locks Released (No new locks)</text>
                    </svg>
                  </div>
                </div>

                {/* LOCK COMPATIBILITY MATRIX TABLE */}
                <div className="p-6 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] space-y-3">
                  <div className="text-xs font-bold text-[#8F1D2C] uppercase flex items-center gap-1.5">
                    <Table className="h-4 w-4" /> Lock Compatibility Matrix (Shared S vs Exclusive X)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-sans text-center border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#8F1D2C] bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] dark:text-[#B83245]">
                          <th className="p-3 font-bold text-left">Requested Lock Mode</th>
                          <th className="p-3 font-bold">Shared Lock (S)</th>
                          <th className="p-3 font-bold">Exclusive Lock (X)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5D7D9] dark:divide-[#3D282C]">
                        <tr>
                          <td className="p-3 font-bold text-left text-[#191416] dark:text-[#FAF7F5]">Shared Lock (S) Held</td>
                          <td className="p-3 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20">Granted (Compatible) ✓</td>
                          <td className="p-3 text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/20">Blocked (Conflict) ✕</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-left text-[#191416] dark:text-[#FAF7F5]">Exclusive Lock (X) Held</td>
                          <td className="p-3 text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/20">Blocked (Conflict) ✕</td>
                          <td className="p-3 text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/20">Blocked (Conflict) ✕</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </article>

            </div>
          </section>
        )}

        {/* 3. SUBJECTIVE QUESTIONS */}
        {activeTab === 'subjective' && (
          <section className="space-y-8 animate-fade-in relative z-30">
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                3. Subjective Exam Questions & Answer Blueprints
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Structured 2-mark, 5-mark, and 10-mark questions with exact scoring keywords.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { marks: '2 Marks', q: 'Define Functional Dependency. State any two Armstrong axioms.', ans: 'A functional dependency X → Y means attribute X uniquely determines attribute Y. Armstrong axioms include Reflexivity (if Y ⊆ X, X → Y) and Augmentation (if X → Y, XZ → YZ).' },
                { marks: '5 Marks', q: 'Compare 3NF and BCNF with a suitable relational schema example.', ans: '3NF allows prime attributes on the right-hand side of non-superkey dependencies. BCNF strictly enforces that for any non-trivial dependency X → Y, X MUST be a super key. Example schema R(A,B,C) where AB → C and C → B demonstrates 3NF that violates BCNF.' },
                { marks: '10 Marks', q: 'Explain Transaction ACID properties and how 2-Phase Locking (2PL) guarantees serializability.', ans: 'Detail Atomicity (Write-Ahead Logging), Consistency, Isolation (Locking protocols), and Durability. Explain Growing Phase (acquiring locks) and Shrinking Phase (releasing locks) in Strict 2PL.' }
              ].map((item, idx) => (
                <div key={idx} className="p-7 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
                    <span className="px-3 py-1 bg-[#8F1D2C] text-white font-bold text-xs rounded-lg">
                      {item.marks} Question
                    </span>
                    <span className="text-xs text-[#71676A] font-medium">Exam Weightage: High</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#191416] dark:text-[#FAF7F5]">{item.q}</h3>
                  <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#231B1E] border border-[#E5D7D9] dark:border-[#3D282C] space-y-1">
                    <span className="text-xs font-bold text-[#8F1D2C] uppercase block">Scoring Keyword Blueprint:</span>
                    <p className="text-base text-[#191416] dark:text-[#FAF7F5] leading-relaxed">{item.ans}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. PRACTICE QUIZ */}
        {activeTab === 'quiz' && (
          <section className="space-y-8 animate-fade-in relative z-30">
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                4. Adaptive Practice Quiz
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Bloom-driven questions to test your exam readiness under time constraint.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
                <span className="text-xs font-bold text-[#8F1D2C] uppercase">Question 1 of 5</span>
                <span className="px-3 py-1 bg-[#F8EDEF] text-[#8F1D2C] text-xs font-bold rounded-lg">Apply Level</span>
              </div>
              <h3 className="text-lg font-bold text-[#191416] dark:text-[#FAF7F5]">
                Which of the following normal forms guarantees lossless join decomposition and preserves functional dependencies simultaneously?
              </h3>
              <div className="space-y-3">
                {['First Normal Form (1NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)', 'Fourth Normal Form (4NF)'].map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left p-4 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] text-sm font-medium text-[#191416] dark:text-[#FAF7F5] hover:border-[#8F1D2C] hover:bg-[#F8EDEF] transition-all cursor-pointer"
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. HIGH-YIELD BLOCKS */}
        {activeTab === 'remember' && (
          <section className="space-y-8 animate-fade-in relative z-30">
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                5. High-Yield Memory Blocks
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Must-remember formulas, theorems, and definitions for instant pre-exam recall.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'BCNF Condition', text: 'For every functional dependency X → Y in R, X must be a super key for relation R.' },
                { title: 'Strict 2-Phase Locking', text: 'Shared and Exclusive locks held by a transaction are released ONLY after the transaction commits or aborts.' },
                { title: 'Relational Algebra Division', text: 'R ÷ S returns tuples in R that are associated with EVERY tuple in S.' },
                { title: 'Conflict Serializability', text: 'A schedule is conflict serializable if its precedence graph contains NO directed cycles.' }
              ].map((blk, idx) => (
                <div key={idx} className="p-7 rounded-3xl border-l-4 border-[#8F1D2C] bg-[#F8EDEF] dark:bg-[#2D1B20] space-y-2 shadow-sm">
                  <h3 className="text-base font-bold text-[#8F1D2C] dark:text-[#B83245]">{blk.title}</h3>
                  <p className="text-base font-sans text-[#191416] dark:text-[#FAF7F5] leading-relaxed">{blk.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. PAPER ANALYSIS */}
        {activeTab === 'paper_analysis' && (
          <section className="space-y-8 animate-fade-in relative z-30">
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                6. Previous Paper & Teacher Highlight Analysis
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Evidence-based topic distribution derived from past university exams and lecture notes.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { topic: 'Normalization & Functional Dependencies', count: 'Appeared in 4 previous papers', tag: 'High Priority' },
                { topic: 'Transaction Concurrency & 2PL', count: 'Teacher Highlighted', tag: 'Frequent' },
                { topic: 'B+ Tree Indexing & Hash Indexing', count: 'Covered in Lectures', tag: 'Core Concept' }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h3 className="text-base font-bold text-[#191416] dark:text-[#FAF7F5]">{item.topic}</h3>
                    <span className="text-xs text-[#71676A] font-medium mt-1 block">{item.count}</span>
                  </div>
                  <span className="px-3.5 py-1 bg-[#F8EDEF] text-[#8F1D2C] font-bold text-xs rounded-xl border border-[#8F1D2C]/20">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. PRE-EXAM SHEET */}
        {activeTab === 'final_sheet' && (
          <section className="space-y-8 animate-fade-in relative z-30">
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                7. Ultra-Fast Pre-Exam Revision Sheet
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Scannable 5-minute pre-exam cheat sheet for rapid memory reinforcement.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-7 rounded-3xl border border-[#8F1D2C]/30 bg-[#F8EDEF] dark:bg-[#2D1B20] space-y-3">
                <h3 className="text-base font-bold text-[#8F1D2C] uppercase flex items-center gap-2">
                  <Flame className="h-4 w-4" /> MUST REMEMBER
                </h3>
                <ul className="list-disc list-inside text-base text-[#191416] dark:text-[#FAF7F5] space-y-2 leading-relaxed">
                  <li>3NF allows prime attributes on RHS; BCNF strictly requires LHS to be a super key.</li>
                  <li>Serializability is guaranteed by 2PL protocol (Growing phase → Shrinking phase).</li>
                  <li>ACID guarantees: Atomicity (WAL), Consistency, Isolation (Locks), Durability (Commit).</li>
                </ul>
              </div>

              <div className="p-7 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-3">
                <h3 className="text-base font-bold text-[#191416] dark:text-[#FAF7F5] uppercase flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> COMMON EXAM MISTAKES TO AVOID
                </h3>
                <ul className="list-disc list-inside text-base text-[#71676A] dark:text-[#A3989B] space-y-2 leading-relaxed">
                  <li>Don't confuse candidate key with super key (super key can have extraneous attributes).</li>
                  <li>Don't forget that 2PL prevents conflict un-serializability, but strict 2PL prevents cascading rollbacks.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 8. READINESS SCORE */}
        {activeTab === 'readiness' && (
          <section className="space-y-8 animate-fade-in relative z-30">
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                8. Calm Academic Exam Readiness Score
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Objective skill breakdown evaluated across Bloom cognitive mastery levels.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#71676A]">Estimated Exam Readiness</span>
                  <div className="text-4xl font-extrabold text-[#8F1D2C] mt-1">76%</div>
                </div>
                <span className="px-4 py-2 bg-[#F8EDEF] text-[#8F1D2C] font-bold text-sm rounded-2xl border border-[#8F1D2C]/20">
                  Targeted Revision Recommended
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Concept Understanding', score: 82 },
                  { label: 'Application & Problem Solving', score: 61 },
                  { label: 'Analytical Trade-offs', score: 48 },
                  { label: 'Question Practice', score: 74 },
                  { label: 'Previous Paper Coverage', score: 89 }
                ].map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-[#191416] dark:text-[#FAF7F5]">
                      <span>{item.label}</span>
                      <span className="font-bold">{item.score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#FAF7F5] dark:bg-[#231B1E] rounded-full overflow-hidden border border-[#E5D7D9] dark:border-[#3D282C]">
                      <div className="h-full bg-[#8F1D2C] transition-all duration-500" style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-[#F8EDEF] dark:bg-[#2D1B20] text-xs text-[#8F1D2C] dark:text-[#B83245] font-medium leading-relaxed">
                <strong>Academic Assessment Summary:</strong> Your strongest area is Normalization & Relational Algebra (82%). Your primary focus before entering the exam hall should be Analytical Trade-offs in Transaction Isolation levels.
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
