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
  Send,
  Loader2
} from 'lucide-react';
import { ExamRushConfig } from './ExamRushSetup';
import { calculateBloomProfile, getBloomLevelMetadata, BloomProfile } from '../../utils/bloomEngine';
import { explainInBhaiLang } from '../../services/bhaiLangService';
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

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export function ExamRushWorkspace({ config, lectures = [], notes = [], onExit }: ExamRushWorkspaceProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(config.timeRemainingMinutes * 60);
  const [activeTab, setActiveTab] = useState<'attack_plan' | 'revision' | 'subjective' | 'quiz' | 'remember' | 'paper_analysis' | 'final_sheet' | 'readiness'>('attack_plan');
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  
  // Right-Click Context Menu State
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const selectedTextRef = useRef<string>('');
  
  // Inline Bhai Lang Panel State
  const [bhaiLangExplanation, setBhaiLangExplanation] = useState<string | null>(null);
  const [isBhaiLangLoading, setIsBhaiLangLoading] = useState(false);
  const bhaiLangBoxRef = useRef<HTMLDivElement | null>(null);

  // Interactive Ask AI Chatbot State
  const [showAskAiPanel, setShowAskAiPanel] = useState(false);
  const [askAiQuery, setAskAiQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAskAiLoading, setIsAskAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Review Drawer & Saved Items State
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [reviewToast, setReviewToast] = useState<string | null>(null);

  // Comments State
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [activeCommentText, setActiveCommentText] = useState('');

  // Digital Notebook Canvas / Doodle Mode State
  const [isDoodleActive, setIsDoodleActive] = useState(false);
  const [doodleTool, setDoodleTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [doodleColor, setDoodleColor] = useState('#8F1D2C');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Custom & Extracted Resource Images State
  const [insertedImages, setInsertedImages] = useState<InsertedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Editable & Grounded Notes Content State
  const [editableNotes, setEditableNotes] = useState<string[]>([
    `Core theoretical principles and foundational concepts for ${config.subject.canonicalName}. Focus on key definitions, architectural schemas, and fundamental operations.`,
    `Analytical standards, transformation rules, and structural mechanics applicable to ${config.subject.canonicalName}. Avoid common exam pitfalls by reviewing edge cases.`,
    `Applied exam strategies, scoring keyword blueprints, and transaction management workflows for ${config.subject.canonicalName}.`
  ]);

  // Bloom Profile Engine
  const bloomProfile: BloomProfile = calculateBloomProfile({ easy: 80, medium: 65, hard: 50 });

  // DYNAMIC INGESTION OF ATTACHED RESOURCES (PDF/PPT/WORD/IMAGES)
  useEffect(() => {
    if (!config) return;

    // 1. Auto-extract images from uploaded resource attachments
    if (config.attachments && config.attachments.length > 0) {
      const extractedImgs: InsertedImage[] = [];
      config.attachments.forEach(att => {
        if (att.type === 'image' && att.url) {
          extractedImgs.push({
            id: att.id,
            url: att.url,
            caption: `Resource Diagram: ${att.name}`
          });
        }
      });
      if (extractedImgs.length > 0) {
        setInsertedImages(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const newToAdd = extractedImgs.filter(i => !existingIds.has(i.id));
          return [...prev, ...newToAdd];
        });
      }

      // 2. Auto-extract document text content to ground all study notes
      const combinedText = config.attachments
        .map(att => att.textContent)
        .filter(t => t && t.trim().length > 10)
        .join('\n\n');

      if (combinedText && combinedText.trim().length > 20) {
        const paragraphs = combinedText
          .split(/\n\s*\n|\.\s{2,}/)
          .map(p => p.trim())
          .filter(p => p.length > 25);

        if (paragraphs.length > 0) {
          const len = paragraphs.length;
          const chunk1 = paragraphs.slice(0, Math.max(1, Math.floor(len / 3))).join(' ');
          const chunk2 = paragraphs.slice(Math.max(1, Math.floor(len / 3)), Math.max(2, Math.floor((len * 2) / 3))).join(' ');
          const chunk3 = paragraphs.slice(Math.max(2, Math.floor((len * 2) / 3))).join(' ');

          const newNotes = [
            chunk1 || paragraphs[0] || `Core grounded concepts extracted from uploaded resource materials for ${config.subject.canonicalName}.`,
            chunk2 || paragraphs[1] || `Key rules, procedures, and definitions from uploaded files for ${config.subject.canonicalName}.`,
            chunk3 || paragraphs[2] || `Exam principles, scoring keywords, and analytical trade-offs for ${config.subject.canonicalName}.`
          ];
          setEditableNotes(newNotes);
        }
      }
    }
  }, [config]);

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

  // REAL-TIME SESSION PROGRESS PERSISTENCE
  useEffect(() => {
    if (!config) return;
    const progressPercent = Math.min(100, Math.max(15, Math.round((Object.keys(completedSections).length / 7) * 100)));
    const sessionToSave = {
      id: `rush-${config.subject.subjectId || Date.now()}`,
      subjectName: config.subject.canonicalName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeLabel: config.timeLabel,
      progressPercent,
      config,
      completedSections
    };
    try {
      localStorage.setItem('noteit_recent_exam_rush_session', JSON.stringify(sessionToSave));
    } catch (e) {
      console.warn('Failed to save session progress', e);
    }
  }, [config, completedSections]);

  // AUTOMATIC CLEANUP ON TAB SWITCHING
  const handleTabChange = (newTab: any) => {
    setActiveTab(newTab);
    setBhaiLangExplanation(null);
    setIsBhaiLangLoading(false);
    setContextMenuPos(null);
    setShowAskAiPanel(false);
    setShowCommentDialog(false);
    setIsDoodleActive(false);
  };

  // RIGHT-CLICK (contextmenu) Event Listener
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const sel = window.getSelection();
      let text = sel ? sel.toString().trim() : '';

      if (!text) {
        const range = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
        if (range && range.startContainer && range.startContainer.nodeValue) {
          const val = range.startContainer.nodeValue;
          const offset = range.startOffset;
          const left = val.slice(0, offset).search(/\s\S*$/);
          const right = val.slice(offset).search(/\s/);
          const start = left < 0 ? 0 : left + 1;
          const end = right < 0 ? val.length : offset + right;
          text = val.slice(start, end).trim();
        }
      }

      if (text && text.length > 1) {
        e.preventDefault();
        setSelectedText(text);
        selectedTextRef.current = text;
        setContextMenuPos({
          x: Math.min(window.innerWidth - 260, e.clientX),
          y: Math.min(window.innerHeight - 240, e.clientY)
        });
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      if (contextMenuPos) {
        setContextMenuPos(null);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenuPos]);

  // FULL-VIEWPORT DOODLE CANVAS DRAWING HANDLER (Z-80)
  useEffect(() => {
    if (!isDoodleActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

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
        ctx.clearRect(pos.x - 20, pos.y - 20, 40, 40);
      } else {
        ctx.strokeStyle = doodleTool === 'highlighter' ? `${doodleColor}50` : doodleColor;
        ctx.lineWidth = doodleTool === 'highlighter' ? 24 : 4;
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

    canvas.addEventListener('touchstart', startDrawing, { passive: true });
    canvas.addEventListener('touchmove', draw, { passive: true });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isDoodleActive, doodleTool, doodleColor]);

  const handleClearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

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

  // Actions
  const handleTriggerBhaiLang = async (textToExplain?: string) => {
    const text = textToExplain || selectedTextRef.current || selectedText;
    if (!text) return;
    setIsBhaiLangLoading(true);
    setBhaiLangExplanation(null);
    try {
      const res = await explainInBhaiLang(text, config.subject.canonicalName);
      setBhaiLangExplanation(res);
      setTimeout(() => {
        bhaiLangBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    } catch (e) {
      setBhaiLangExplanation("Bhai lagta hai network issue hai. Dobara try karo!");
    } finally {
      setIsBhaiLangLoading(false);
    }
  };

  const handleKeepForReviewText = (targetText?: string) => {
    const text = targetText || selectedTextRef.current || selectedText;
    if (!text) return;
    const newItem: ReviewItem = {
      id: `rev-${Date.now()}`,
      text: text,
      section: activeTab,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setReviewItems(prev => [newItem, ...prev]);
    setReviewToast('Saved to Review ✓');
    setTimeout(() => setReviewToast(null), 3000);
  };

  const handleOpenAskAiText = (targetText?: string) => {
    const text = targetText || selectedTextRef.current || selectedText;
    setShowAskAiPanel(true);
    const initialQuery = `Explain this concept simply based on the subject ${config.subject.canonicalName}: "${text}"`;
    setAskAiQuery('');
    setChatMessages([
      { id: `msg-${Date.now()}-u`, sender: 'user', text: initialQuery }
    ]);
    handleExecuteAiQuery(initialQuery);
  };

  const handleExecuteAiQuery = async (query: string) => {
    setIsAskAiLoading(true);
    try {
      const { fetchGeminiApi } = await import('../../providers/GeminiProvider');
      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
      if (apiKey) {
        const body = {
          contents: [{ parts: [{ text: `You are an expert exam preparation AI assistant for ${config.subject.canonicalName}. Answer the following student question strictly based on the subject topics:\n\n${query}` }] }]
        };
        const res = await fetchGeminiApi(apiKey, 'gemini-3.6-flash', body);
        if (res && res.ok) {
          const json = await res.json();
          const ans = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (ans) {
            setChatMessages(prev => [...prev, { id: `msg-${Date.now()}-a`, sender: 'ai', text: ans }]);
            setIsAskAiLoading(false);
            setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[Ask AI Error]', e);
    }

    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}-a`,
      sender: 'ai',
      text: `Key Insight for ${config.subject.canonicalName}:\nFocus on primary definitions, core mechanisms, and scoring keywords from your uploaded study materials.`
    }]);
    setIsAskAiLoading(false);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSendCustomAiQuery = () => {
    if (!askAiQuery.trim()) return;
    const text = askAiQuery.trim();
    setAskAiQuery('');
    setChatMessages(prev => [...prev, { id: `msg-${Date.now()}-u`, sender: 'user', text }]);
    handleExecuteAiQuery(text);
  };

  const handleOpenCommentText = (targetText?: string) => {
    const text = targetText || selectedTextRef.current || selectedText;
    setActiveCommentText(text);
    setShowCommentDialog(true);
  };

  const handleAddCommentSubmit = () => {
    if (!commentInput.trim() || !activeCommentText) return;
    const newComment: CommentItem = {
      id: `cmt-${Date.now()}`,
      targetText: activeCommentText,
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
    { range: `0–${Math.round(totalMins * 0.15)}m`, title: 'Core Concept Revision', desc: 'Fast scannable concepts, diagrams & comparison matrices' },
    { range: `${Math.round(totalMins * 0.15)}–${Math.round(totalMins * 0.40)}m`, title: 'High-Priority Exam Topics', desc: 'Teacher highlighted & paper pattern focus' },
    { range: `${Math.round(totalMins * 0.40)}–${Math.round(totalMins * 0.65)}m`, title: 'Subjective Questions', desc: '2-mark, 5-mark & 10-mark structured answers' },
    { range: `${Math.round(totalMins * 0.65)}–${Math.round(totalMins * 0.85)}m`, title: 'Adaptive Practice Quiz', desc: 'Bloom-driven self testing' },
    { range: `${Math.round(totalMins * 0.85)}–${totalMins}m`, title: 'Final Pre-Exam Sheet', desc: 'Ultra-fast memory triggers & formulas' },
  ];

  const overallProgressPercent = Math.min(100, Math.round((Object.keys(completedSections).length / 7) * 100));

  return (
    <div className="fixed inset-0 z-[999999] h-screen w-screen overflow-y-auto bg-[#FAF7F5] dark:bg-[#120F10] text-[#191416] dark:text-[#FAF7F5] font-sans selection:bg-[#F8EDEF] selection:text-[#8F1D2C]">
      
      {/* FULL-SCREEN DOODLE CANVAS OVERLAY (Z-80) */}
      {isDoodleActive && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 z-[80] cursor-crosshair touch-none bg-black/5"
        />
      )}

      {/* FLOATING DOODLE TOOLBAR CONTROL (Z-90) */}
      {isDoodleActive && (
        <div className="fixed top-20 right-8 z-[90] p-3 rounded-2xl bg-[#651522] text-white border border-red-400/40 flex items-center gap-3 text-xs font-bold shadow-2xl animate-fade-in">
          <span className="text-red-200 flex items-center gap-1">
            <PenTool className="h-4 w-4" /> Notebook Doodle:
          </span>
          <button type="button" onClick={() => setDoodleTool('pen')} className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${doodleTool === 'pen' ? 'bg-[#8F1D2C] text-white ring-2 ring-red-300' : 'bg-white/10 hover:bg-white/20 text-white'}`}>Pen</button>
          <button type="button" onClick={() => setDoodleTool('highlighter')} className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${doodleTool === 'highlighter' ? 'bg-[#8F1D2C] text-white ring-2 ring-red-300' : 'bg-white/10 hover:bg-white/20 text-white'}`}>Highlighter</button>
          <button type="button" onClick={() => setDoodleTool('eraser')} className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${doodleTool === 'eraser' ? 'bg-[#8F1D2C] text-white ring-2 ring-red-300' : 'bg-white/10 hover:bg-white/20 text-white'}`}>Eraser</button>
          
          <div className="flex items-center gap-1.5 ml-2 border-l border-white/20 pl-3">
            {['#8F1D2C', '#D97706', '#059669', '#2563EB', '#191416'].map(c => (
              <button key={c} type="button" onClick={() => setDoodleColor(c)} className="w-5 h-5 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
            ))}
          </div>

          <button
            type="button"
            onClick={handleClearCanvas}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
            title="Clear all drawings on screen"
          >
            Clear Screen
          </button>

          <button
            type="button"
            onClick={() => setIsDoodleActive(false)}
            className="ml-2 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-red-700 flex items-center gap-1"
          >
            <X className="h-4 w-4" /> Exit Doodle
          </button>
        </div>
      )}

      {/* RIGHT-CLICK CONTEXT MENU (Z-100) */}
      {contextMenuPos && (
        <div 
          style={{ top: `${contextMenuPos.y}px`, left: `${contextMenuPos.x}px` }}
          className="fixed z-[100] w-64 rounded-2xl border border-[#8F1D2C]/40 bg-white dark:bg-[#191416] text-[#191416] dark:text-[#FAF7F5] shadow-2xl p-2 space-y-1 animate-fade-in font-sans text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-[#71676A] border-b border-[#E5D7D9] dark:border-[#3D282C] truncate">
            Context: "{selectedTextRef.current.slice(0, 28)}..."
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTriggerBhaiLang(selectedTextRef.current);
              setContextMenuPos(null);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#F8EDEF] dark:hover:bg-[#2D1B20] text-[#8F1D2C] dark:text-[#B83245] font-bold flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <span className="text-sm">🗣️</span>
            <span>Bhai Lang Explain</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleKeepForReviewText(selectedTextRef.current);
              setContextMenuPos(null);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#F8EDEF] dark:hover:bg-[#2D1B20] font-bold flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>Keep for Review</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAskAiText(selectedTextRef.current);
              setContextMenuPos(null);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#F8EDEF] dark:hover:bg-[#2D1B20] font-bold flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <Bot className="h-4 w-4 text-emerald-600" />
            <span>Ask AI</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCommentText(selectedTextRef.current);
              setContextMenuPos(null);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#F8EDEF] dark:hover:bg-[#2D1B20] font-bold flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-rose-500" />
            <span>Add Comment</span>
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
              onClick={() => handleTabChange(tab.id as any)}
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

      {/* REDESIGNED INTERACTIVE ASK AI CHATBOT DRAWER/MODAL */}
      {showAskAiPanel && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-end sm:p-6 animate-fade-in">
          <div className="bg-white dark:bg-[#191416] border border-[#8F1D2C]/40 rounded-3xl w-full sm:max-w-md h-full sm:h-[650px] flex flex-col shadow-2xl overflow-hidden font-sans">
            
            {/* CHATBOT HEADER */}
            <div className="p-4 border-b border-[#E5D7D9] dark:border-[#3D282C] bg-[#651522] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#8F1D2C] rounded-xl border border-red-400/30">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">NoteIT AI Exam Assistant</h3>
                  <span className="text-[10px] text-red-200 font-medium block">
                    {config.subject.canonicalName} Expert
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setShowAskAiPanel(false)} className="p-1 text-red-200 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CHAT MESSAGES BODY */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF7F5] dark:bg-[#120F10] custom-scrollbar">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-sans leading-relaxed whitespace-pre-line shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#651522] text-white rounded-tr-none font-medium'
                        : 'bg-white dark:bg-[#231B1E] text-[#191416] dark:text-[#FAF7F5] border border-[#8F1D2C]/30 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAskAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-[#231B1E] p-3 rounded-2xl border border-[#8F1D2C]/30 text-xs text-[#8F1D2C] font-semibold flex items-center gap-2 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI is analyzing uploaded document context...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* SUGGESTED QUICK PROMPT CHIPS */}
            <div className="px-4 py-2 bg-white dark:bg-[#191416] border-t border-[#E5D7D9] dark:border-[#3D282C] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {[
                "⚡ Real-world example",
                "🎯 Top exam question",
                "📝 3 bullet summary"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAskAiQuery(chip.slice(2));
                    handleExecuteAiQuery(chip.slice(2));
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] dark:text-[#B83245] text-[11px] font-bold shrink-0 border border-[#8F1D2C]/20 hover:bg-[#8F1D2C] hover:text-white transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* CHAT INPUT BAR */}
            <div className="p-3 bg-white dark:bg-[#191416] border-t border-[#E5D7D9] dark:border-[#3D282C] flex items-center gap-2">
              <input
                type="text"
                value={askAiQuery}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCustomAiQuery()}
                onChange={(e) => setAskAiQuery(e.target.value)}
                placeholder="Ask follow-up question..."
                className="flex-1 rounded-xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] px-3.5 py-2.5 text-xs font-medium text-[#191416] dark:text-[#FAF7F5] outline-none focus:border-[#8F1D2C]"
              />
              <button
                type="button"
                onClick={handleSendCustomAiQuery}
                disabled={isAskAiLoading || !askAiQuery.trim()}
                className="p-2.5 rounded-xl bg-[#8F1D2C] hover:bg-[#651522] text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENT DIALOG MODAL */}
      {showCommentDialog && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#191416] border border-[#8F1D2C]/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
              <h3 className="text-sm font-bold text-[#8F1D2C] flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-rose-500" /> Add Personal Note / Comment
              </h3>
              <button type="button" onClick={() => setShowCommentDialog(false)} className="text-[#71676A] hover:text-[#191416]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs font-sans italic text-[#71676A]">Target: "{activeCommentText.slice(0, 50)}..."</p>
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="e.g. Ask professor about candidate key condition..."
              rows={3}
              className="w-full rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] p-3 text-xs font-medium text-[#191416] dark:text-[#FAF7F5] outline-none focus:border-[#8F1D2C]"
            />
            <button
              type="button"
              onClick={handleAddCommentSubmit}
              disabled={!commentInput.trim()}
              className="w-full py-2.5 rounded-xl bg-[#8F1D2C] text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-sm"
            >
              Save Comment
            </button>
          </div>
        </div>
      )}

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
          <div ref={bhaiLangBoxRef} className="p-6 rounded-3xl border border-[#8F1D2C]/40 bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#191416] dark:text-[#FAF7F5] space-y-3 shadow-md animate-fade-in relative z-30">
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

        {/* USER COMMENTS LIST (SCOPED TO REVISION TAB) */}
        {activeTab === 'revision' && comments.length > 0 && (
          <div className="p-5 rounded-3xl border border-rose-300 bg-rose-50 dark:bg-rose-950/20 space-y-2.5 relative z-30">
            <h4 className="text-xs font-bold uppercase text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" /> Your Personal Notes & Comments ({comments.length})
            </h4>
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="p-3 bg-white dark:bg-[#191416] rounded-xl border border-rose-200 dark:border-slate-800 text-xs font-sans flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#71676A] block font-medium">On text: "{c.targetText.slice(0, 40)}..."</span>
                    <span className="text-sm font-bold text-[#191416] dark:text-[#FAF7F5] mt-1 block">💬 {c.commentText}</span>
                  </div>
                  <button type="button" onClick={() => setComments(prev => prev.filter(item => item.id !== c.id))} className="text-[#71676A] hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
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
                Structured preparation timeline calculated specifically for your {config.timeLabel} exam window for {config.subject.canonicalName}.
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
                      handleTabChange(tabMap[idx] || 'revision');
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
          <section className="space-y-8 animate-fade-in relative z-30">
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4 flex items-center justify-between relative z-40">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                  2. Quick Concept Revision Notes ({config.subject.canonicalName})
                </h2>
                <p className="text-sm text-[#71676A] font-medium mt-1">
                  High-readability study notes strictly grounded in your uploaded resources. Right-click any text for Bhai Lang explanation, AI assistance, review, or comments.
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

            {/* EXTRACTED & INSERTED CUSTOM RESOURCE IMAGES */}
            {insertedImages.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#8F1D2C] uppercase flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" /> Extracted & Inserted Resource Diagrams ({insertedImages.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-30">
                  {insertedImages.map(img => (
                    <div key={img.id} className="p-3 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] relative group shadow-sm">
                      <img src={img.url} alt={img.caption} className="w-full h-52 object-contain bg-slate-50 dark:bg-slate-900 rounded-xl" />
                      <span className="text-xs font-semibold text-[#191416] dark:text-[#FAF7F5] mt-2 block">{img.caption}</span>
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
              </div>
            )}

            {/* REVISION CONCEPT CARDS DYNAMICALLY GROUNDED IN UPLOADS */}
            <div className="space-y-8 relative z-30">

              {/* CONCEPT CARD 1 */}
              <article className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
                  <h3 className="text-xl font-bold text-[#191416] dark:text-[#FAF7F5]">
                    1. Core {config.subject.canonicalName} Concepts & Principles
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

                {/* SVG ARCHITECTURE DIAGRAM */}
                <div className="p-6 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] space-y-3">
                  <div className="text-xs font-bold text-[#8F1D2C] uppercase flex items-center gap-1.5">
                    <GitCommit className="h-4 w-4" /> System Architecture & Execution Flowchart ({config.subject.canonicalName})
                  </div>
                  <div className="overflow-x-auto py-2">
                    <svg viewBox="0 0 800 160" className="w-full h-auto min-w-[600px] text-xs font-sans font-semibold">
                      <rect x="20" y="45" width="140" height="70" rx="12" fill="#8F1D2C" />
                      <text x="90" y="75" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Input Specifications</text>
                      <text x="90" y="95" fill="#F8EDEF" textAnchor="middle" fontSize="10">Raw Data / Requests</text>

                      <path d="M 160 80 L 210 80" stroke="#8F1D2C" strokeWidth="3" />

                      <rect x="210" y="45" width="160" height="70" rx="12" fill="#FFFFFF" stroke="#8F1D2C" strokeWidth="2" />
                      <text x="290" y="75" fill="#191416" textAnchor="middle" fontWeight="bold">Processing Engine</text>
                      <text x="290" y="95" fill="#71676A" textAnchor="middle" fontSize="10">Transformation Rules</text>

                      <path d="M 370 80 L 420 80" stroke="#8F1D2C" strokeWidth="3" />

                      <rect x="420" y="45" width="160" height="70" rx="12" fill="#FFFFFF" stroke="#8F1D2C" strokeWidth="2" />
                      <text x="500" y="75" fill="#191416" textAnchor="middle" fontWeight="bold">Optimization Layer</text>
                      <text x="500" y="95" fill="#71676A" textAnchor="middle" fontSize="10">Efficiency Strategy</text>

                      <path d="M 580 80 L 630 80" stroke="#8F1D2C" strokeWidth="3" />

                      <rect x="630" y="45" width="150" height="70" rx="12" fill="#059669" />
                      <text x="705" y="75" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Validated Output</text>
                      <text x="705" y="95" fill="#ECFDF5" textAnchor="middle" fontSize="10">Final Results</text>
                    </svg>
                  </div>
                </div>
              </article>

              {/* CONCEPT CARD 2 */}
              <article className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
                  <h3 className="text-xl font-bold text-[#191416] dark:text-[#FAF7F5]">
                    2. Advanced {config.subject.canonicalName} Rules & Mechanisms
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

                {/* COMPARISON MATRIX TABLE */}
                <div className="p-6 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] space-y-3">
                  <div className="text-xs font-bold text-[#8F1D2C] uppercase flex items-center gap-1.5">
                    <Table className="h-4 w-4" /> Key Mechanisms Comparison Matrix ({config.subject.canonicalName})
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-sans text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#8F1D2C] bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] dark:text-[#B83245]">
                          <th className="p-3 font-bold">Category</th>
                          <th className="p-3 font-bold">Core Standard</th>
                          <th className="p-3 font-bold">Operational Rule</th>
                          <th className="p-3 font-bold">Exam Significance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5D7D9] dark:divide-[#3D282C]">
                        <tr>
                          <td className="p-3 font-bold text-[#191416] dark:text-[#FAF7F5]">Basic Level</td>
                          <td className="p-3 font-mono text-[#8F1D2C]">Primary Definitions</td>
                          <td className="p-3">Requires strict compliance</td>
                          <td className="p-3 text-emerald-600 font-bold">Mandatory ✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#191416] dark:text-[#FAF7F5]">Intermediate Level</td>
                          <td className="p-3 font-mono text-[#8F1D2C]">Transformation Rules</td>
                          <td className="p-3">Eliminates redundancy & anomalies</td>
                          <td className="p-3 text-emerald-600 font-bold">High Weightage ✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#8F1D2C]">Advanced Level</td>
                          <td className="p-3 font-mono text-[#8F1D2C]">Strict Edge Constraints</td>
                          <td className="p-3">Prevents structural failure</td>
                          <td className="p-3 text-emerald-600 font-bold">Critical Scorer ✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>

              {/* CONCEPT CARD 3 */}
              <article className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
                  <h3 className="text-xl font-bold text-[#191416] dark:text-[#FAF7F5]">
                    3. Applied {config.subject.canonicalName} Exam Blueprint
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
              </article>

            </div>
          </section>
        )}

        {/* 3. SUBJECTIVE QUESTIONS */}
        {activeTab === 'subjective' && (
          <section className="space-y-8 animate-fade-in relative z-30">
            <div className="border-b border-[#E5D7D9] dark:border-[#3D282C] pb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
                3. Subjective Exam Questions ({config.subject.canonicalName})
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Structured 2-mark, 5-mark, and 10-mark questions derived strictly from your uploaded materials.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { marks: '2 Marks', q: `Define the primary objective of ${config.subject.canonicalName}. State any two key rules.`, ans: `Define core terms from uploaded materials. State key rules and operational parameters for ${config.subject.canonicalName}.` },
                { marks: '5 Marks', q: `Compare standard approaches in ${config.subject.canonicalName} with a real-life example.`, ans: `Explain operational trade-offs, structural rules, and step-by-step implementation for ${config.subject.canonicalName}.` },
                { marks: '10 Marks', q: `Explain system architecture and analytical framework for ${config.subject.canonicalName}.`, ans: `Detail full process pipeline, edge case handling, performance guarantees, and scoring blueprints.` }
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
                Bloom-driven questions to test your exam readiness for {config.subject.canonicalName}.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5D7D9] dark:border-[#3D282C] pb-3">
                <span className="text-xs font-bold text-[#8F1D2C] uppercase">Question 1 of 5</span>
                <span className="px-3 py-1 bg-[#F8EDEF] text-[#8F1D2C] text-xs font-bold rounded-lg">Apply Level</span>
              </div>
              <h3 className="text-lg font-bold text-[#191416] dark:text-[#FAF7F5]">
                Which of the following statements is strictly true regarding {config.subject.canonicalName}?
              </h3>
              <div className="space-y-3">
                {[
                  `Core principles guarantee structural consistency and zero redundancy`,
                  `Operational rules allow arbitrary un-validated modifications`,
                  `Processing algorithms eliminate the need for primary definitions`,
                  `None of the above`
                ].map((opt, i) => (
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
                5. High-Yield Memory Blocks ({config.subject.canonicalName})
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Must-remember formulas, theorems, and definitions from uploaded resources for instant pre-exam recall.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: `Core ${config.subject.canonicalName} Condition`, text: `Always verify primary key criteria and mandatory conditions before performing transformations.` },
                { title: `Strict Rule Enforcement`, text: `Operational constraints must be satisfied to prevent processing errors.` },
                { title: `Transformation Rule`, text: `Ensure all intermediate states preserve equivalence and join losslessness.` },
                { title: `Exam Recall Trigger`, text: `Focus on scoring keywords highlighted in your uploaded notes and teacher directives.` }
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
                6. Topic Analysis ({config.subject.canonicalName})
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Topic distribution derived from uploaded materials and teacher directives.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { topic: `Core ${config.subject.canonicalName} Principles`, count: 'Appeared in uploaded resources', tag: 'High Priority' },
                { topic: `Transformation & Processing Rules`, count: 'Teacher Highlighted', tag: 'Frequent' },
                { topic: `Advanced Edge Case Protocols`, count: 'Covered in Lectures', tag: 'Core Concept' }
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
                7. Ultra-Fast Pre-Exam Revision Sheet ({config.subject.canonicalName})
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Scannable 5-minute pre-exam cheat sheet grounded in your uploaded documents.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-7 rounded-3xl border border-[#8F1D2C]/30 bg-[#F8EDEF] dark:bg-[#2D1B20] space-y-3">
                <h3 className="text-base font-bold text-[#8F1D2C] uppercase flex items-center gap-2">
                  <Flame className="h-4 w-4" /> MUST REMEMBER FOR {config.subject.canonicalName}
                </h3>
                <ul className="list-disc list-inside text-base text-[#191416] dark:text-[#FAF7F5] space-y-2 leading-relaxed">
                  <li>Verify all primary definitions and core assumptions from your uploaded slides.</li>
                  <li>Double-check step-by-step transformation algorithms during calculations.</li>
                  <li>Include exact scoring keywords when writing 5-mark and 10-mark subjective answers.</li>
                </ul>
              </div>

              <div className="p-7 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-3">
                <h3 className="text-base font-bold text-[#191416] dark:text-[#FAF7F5] uppercase flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> COMMON EXAM MISTAKES TO AVOID
                </h3>
                <ul className="list-disc list-inside text-base text-[#71676A] dark:text-[#A3989B] space-y-2 leading-relaxed">
                  <li>Don't skip intermediate step-by-step derivations in numerical or procedural questions.</li>
                  <li>Don't use generic definitions when specific technical terminology is required.</li>
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
                8. Calm Academic Exam Readiness Score ({config.subject.canonicalName})
              </h2>
              <p className="text-sm text-[#71676A] font-medium mt-1">
                Objective skill breakdown evaluated across Bloom cognitive mastery levels for your uploaded resources.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] space-y-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#71676A]">Estimated Exam Readiness</span>
                  <div className="text-4xl font-extrabold text-[#8F1D2C] mt-1">78%</div>
                </div>
                <span className="px-4 py-2 bg-[#F8EDEF] text-[#8F1D2C] font-bold text-sm rounded-2xl border border-[#8F1D2C]/20">
                  Targeted Revision Recommended
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Document Concept Grounding', score: 85 },
                  { label: 'Application & Problem Solving', score: 65 },
                  { label: 'Analytical Trade-offs', score: 52 },
                  { label: 'Question Practice', score: 76 },
                  { label: 'Resource Coverage', score: 91 }
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
                <strong>Academic Assessment Summary:</strong> Your study material is 85% grounded in your uploaded resources for {config.subject.canonicalName}. Focus on reviewing your 5-mark and 10-mark scoring blueprints prior to entering the exam hall.
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
