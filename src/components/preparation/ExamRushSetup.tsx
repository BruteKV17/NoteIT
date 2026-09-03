import React, { useState, useEffect, useRef } from 'react';
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
  Brain,
  Plus,
  Upload,
  Globe,
  FileSpreadsheet,
  FileDigit,
  X,
  Loader2,
  CheckCircle2,
  Trash2,
  Paperclip
} from 'lucide-react';
import { searchCanonicalSubjects, CanonicalSubject, resolveCanonicalSubject } from '../../utils/subjectCanonicalizer';
import { extractTextFromUrl } from '../../services/azure';

export interface ExamRushAttachment {
  id: string;
  name: string;
  type: 'document' | 'presentation' | 'image' | 'url';
  url?: string;
  textContent: string;
  sizeLabel?: string;
  rawFile?: File;
  isProcessed?: boolean;
}

export interface ExamRushConfig {
  subject: CanonicalSubject;
  timeRemainingMinutes: number;
  timeLabel: string;
  teacherTopics: string[];
  attachments?: ExamRushAttachment[];
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<CanonicalSubject | null>(null);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  
  const [selectedDuration, setSelectedDuration] = useState<{ label: string; minutes: number }>(DURATION_OPTIONS[2]); // Default 2 Hours
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  
  const [teacherTopicsInput, setTeacherTopicsInput] = useState('');
  const [intensity, setIntensity] = useState<'quick_survival' | 'balanced' | 'deep_preparation'>('balanced');

  // Attachments and Web Link Extraction State
  const [attachments, setAttachments] = useState<ExamRushAttachment[]>([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStep, setLaunchStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Recent Exam Rush Session State
  const [recentSession, setRecentSession] = useState<{
    id: string;
    subjectName: string;
    timestamp: string;
    timeLabel: string;
    progressPercent: number;
    config: ExamRushConfig;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('noteit_recent_exam_rush_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.config && parsed.subjectName) {
          setRecentSession(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load recent session', e);
    }
  }, []);

  const subjectResults = searchCanonicalSubjects(subjectQuery, selectedCategory);

  const BRANCH_CATEGORIES = [
    { id: 'ALL', label: 'All Branches (115)' },
    { id: 'Computer Science & IT', label: '💻 B.Tech CSE/IT' },
    { id: 'Electronics & Electrical', label: '⚡ ECE & EEE' },
    { id: 'Mechanical & Civil', label: '⚙️ Mechanical & Civil' },
    { id: 'Biotechnology & Chemical', label: '🧬 Biotech & Chem' },
    { id: 'BBA & Management', label: '📊 BBA & Management' },
    { id: 'BCA & Applications', label: '📱 BCA & Applications' },
    { id: 'B.Sc Sciences', label: '🔬 B.Sc Sciences' },
    { id: 'Mathematics & Statistics', label: '📐 Maths & Stats' }
  ];

  const handleSelectSubject = (subj: CanonicalSubject) => {
    setSelectedSubject(subj);
    setSubjectQuery(subj.canonicalName);
    setIsSubjectDropdownOpen(false);
  };

  // Read uploaded file content (PPT, PDF, Word, Images, TXT)
  const readFileContent = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (['txt', 'csv', 'json', 'md', 'html', 'js', 'ts'].includes(extension || '')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    try {
      const { getAzureUploadSasUrl, uploadBlobToAzure, extractTextFromDocument } = await import('../../services/azure');
      const sas = await getAzureUploadSasUrl(file.name);
      await uploadBlobToAzure(sas.uploadUrl, file, () => {});
      const extractedText = await extractTextFromDocument(sas.blobPath);
      if (extractedText && extractedText.trim()) return extractedText;
    } catch (err) {
      console.warn('[File Extraction] Azure extraction unavailable, using fallback text parsing:', err);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = decoder.decode(buffer);
        const cleaned = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
        resolve(cleaned.slice(0, 15000) || `Uploaded file context from ${file.name}`);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // INSTANT FILE ATTACHMENT - DEFERRED PARSING TILL START
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: ExamRushAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: 'document' | 'presentation' | 'image' | 'url' = 'document';
      if (['ppt', 'pptx'].includes(ext)) type = 'presentation';
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) type = 'image';

      newAttachments.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: file.name,
        type,
        textContent: '',
        sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        rawFile: file,
        isProcessed: false
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const extractUrlAndAttach = async (urlToFetch: string) => {
    if (!urlToFetch || !urlToFetch.trim()) return;
    const cleanUrl = urlToFetch.trim();
    setIsExtractingUrl(true);

    try {
      const type = (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) ? 'youtube' : 'website';
      const result = await extractTextFromUrl(cleanUrl, type);
      
      const newAtt: ExamRushAttachment = {
        id: `url-${Date.now()}`,
        name: result.title || cleanUrl,
        type: 'url',
        url: cleanUrl,
        textContent: result.text || `Content extracted from ${cleanUrl}`,
        sizeLabel: `${(result.text || '').length} chars`,
        isProcessed: true
      };

      setAttachments(prev => {
        if (prev.some(a => a.url === cleanUrl)) return prev;
        return [...prev, newAtt];
      });
    } catch (err) {
      console.error('[URL Extraction Error]', err);
    } finally {
      setIsExtractingUrl(false);
    }
  };

  // Automatic URL detection on typing/pasting into teacherTopicsInput
  const handleTeacherTopicsChange = (val: string) => {
    setTeacherTopicsInput(val);
    const urlMatches = val.match(/(https?:\/\/[^\s]+)/gi);
    if (urlMatches && urlMatches.length > 0) {
      urlMatches.forEach(matchedUrl => {
        if (!attachments.some(a => a.url === matchedUrl)) {
          extractUrlAndAttach(matchedUrl);
        }
      });
    }
  };

  const handleManualUrlSubmit = async () => {
    if (!customUrlInput.trim()) return;
    await extractUrlAndAttach(customUrlInput.trim());
    setCustomUrlInput('');
    setShowUrlDialog(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // PROCESS ATTACHMENTS & LAUNCH WITH PROGRESS OVERLAY
  const handleStart = async () => {
    setIsLaunching(true);
    setLaunchStep('Initializing Exam Workspace...');

    const processedAttachments: ExamRushAttachment[] = [];
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (!att.isProcessed && att.rawFile) {
        setLaunchStep(`Extracting document content from ${att.name}...`);
        const text = await readFileContent(att.rawFile);
        let imgUrl = att.url;
        if (att.type === 'image' && !imgUrl && att.rawFile) {
          imgUrl = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = (ev) => res((ev.target?.result as string) || '');
            reader.readAsDataURL(att.rawFile!);
          });
        }
        processedAttachments.push({
          ...att,
          url: imgUrl,
          textContent: text,
          isProcessed: true
        });
      } else {
        processedAttachments.push(att);
      }
    }

    setLaunchStep('Generating personalized Exam Attack Plan & Study Workspace...');
    await new Promise(r => setTimeout(r, 400));

    const finalSubject = selectedSubject || resolveCanonicalSubject(subjectQuery || 'Database Management Systems');
    const finalMinutes = useCustomTime && customMinutes ? Math.max(10, parseInt(customMinutes, 10)) : selectedDuration.minutes;
    const finalLabel = useCustomTime && customMinutes ? `${customMinutes} Minutes` : selectedDuration.label;

    const teacherTopics = teacherTopicsInput
      .split(/[\n,]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const config: ExamRushConfig = {
      subject: finalSubject,
      timeRemainingMinutes: finalMinutes,
      timeLabel: finalLabel,
      teacherTopics,
      attachments: processedAttachments,
      intensity
    };

    // Save recent session to localStorage
    try {
      const initialSession = {
        id: `rush-${finalSubject.subjectId || Date.now()}`,
        subjectName: finalSubject.canonicalName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeLabel: finalLabel,
        progressPercent: 15,
        config
      };
      localStorage.setItem('noteit_recent_exam_rush_session', JSON.stringify(initialSession));
      sessionStorage.setItem('noteit_exam_rush_active_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save exam rush config to storage', e);
    }

    // Attempt native browser fullscreen request
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    // Open a new tab in fullscreen mode
    const fullscreenUrl = `${window.location.origin}${window.location.pathname}?mode=exam-rush-fullscreen`;
    const newTab = window.open(fullscreenUrl, '_blank');
    if (newTab) {
      newTab.focus();
    }

    // Trigger local state handler as well
    onStartExamRush(config);
    setIsLaunching(false);
  };

  return (
    <div className="max-w-[1150px] mx-auto space-y-6 text-left animate-fade-in font-sans">
      
      {/* HEADER BANNER - CALM ACADEMIC DEEP RED */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#8F1D2C]/30 bg-gradient-to-r from-[#651522] via-[#8F1D2C] to-[#2D0B10] text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8F1D2C] text-white border border-red-400/30 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm">
              <Flame className="h-4 w-4 fill-white" />
              <span>EXAM RUSH MODE</span>
            </div>
            <span className="px-3 py-1 bg-[#F8EDEF] text-[#8F1D2C] rounded-lg text-xs font-semibold">
              115 College Subjects Available
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            Targeted Exam Survival & Rapid Mastery
          </h2>
          <p className="text-sm text-red-100/90 font-medium max-w-2xl leading-relaxed">
            Select from 115+ official university subjects across B.Tech, BBA, BCA, and B.Sc branches. NoteIT will launch a full-screen, calm academic study environment tailored to your timeline.
          </p>
        </div>
      </div>

      {/* RECENT EXAM RUSH SESSION BANNER CARD */}
      {recentSession && (
        <div className="p-6 sm:p-7 rounded-3xl border border-[#8F1D2C]/40 bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#191416] dark:text-[#FAF7F5] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#8F1D2C] text-white text-[11px] font-bold rounded-md uppercase tracking-wide">
                Recent Environment
              </span>
              <span className="text-xs font-semibold text-[#71676A]">
                Last active {recentSession.timestamp}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-[#191416] dark:text-[#FAF7F5]">
              {recentSession.subjectName}
            </h3>
            <div className="flex items-center gap-4 text-xs font-medium text-[#71676A] pt-1">
              <span>⏱ Timeline: <strong className="text-[#191416] dark:text-[#FAF7F5]">{recentSession.timeLabel}</strong></span>
              <span>•</span>
              <div className="flex items-center gap-2">
                <span>Progress Rate:</span>
                <div className="w-28 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-[#8F1D2C] transition-all duration-300" style={{ width: `${recentSession.progressPercent}%` }} />
                </div>
                <span className="font-bold text-[#8F1D2C] text-sm">{recentSession.progressPercent}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onStartExamRush(recentSession.config)}
              className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-[#8F1D2C] hover:bg-[#651522] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>RESUME RUSH ENVIRONMENT →</span>
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('noteit_recent_exam_rush_session');
                setRecentSession(null);
              }}
              className="p-3.5 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] text-[#71676A] hover:text-red-600 cursor-pointer shadow-xs"
              title="Clear Saved Recent Session"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* SETUP CARD FORM */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] shadow-sm space-y-6">
        
        {/* 1. CANONICAL SUBJECT AUTOCOMPLETE & BRANCH FILTER */}
        <div className="space-y-3 relative">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#191416] dark:text-[#FAF7F5]">
              1. Select Subject (115 Available across B.Tech, BBA, BCA, B.Sc) *
            </label>
            {selectedSubject && (
              <span className="text-xs text-[#8F1D2C] dark:text-[#B83245] font-semibold">
                ID: {selectedSubject.subjectId} ({selectedSubject.category})
              </span>
            )}
          </div>

          {/* BRANCH CATEGORY PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
            {BRANCH_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setIsSubjectDropdownOpen(true);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-[#8F1D2C] text-white border-[#8F1D2C] shadow-sm font-bold'
                    : 'bg-[#FAF7F5] dark:bg-[#231B1E] text-[#71676A] dark:text-[#A3989B] border-[#E5D7D9] dark:border-[#3D282C] hover:bg-[#F8EDEF]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71676A]" />
              <input
                type="text"
                value={subjectQuery}
                onFocus={() => setIsSubjectDropdownOpen(true)}
                onChange={(e) => {
                  setSubjectQuery(e.target.value);
                  setSelectedSubject(null);
                  setIsSubjectDropdownOpen(true);
                }}
                placeholder="Search 115+ subjects (e.g. DBMS, Thermodynamics, Financial Accounting, Organic Chemistry...)"
                className="w-full rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] pl-11 pr-4 py-3.5 text-sm font-medium text-[#191416] dark:text-[#FAF7F5] placeholder-[#71676A] outline-none focus:border-[#8F1D2C] shadow-sm transition-all"
              />
            </div>

            {isSubjectDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#231B1E] shadow-xl p-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                {subjectResults.length > 0 ? (
                  subjectResults.map((subj) => (
                    <button
                      key={subj.subjectId}
                      type="button"
                      onClick={() => handleSelectSubject(subj)}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-[#F8EDEF] dark:hover:bg-[#3D282C] transition-colors"
                    >
                      <div>
                        <span className="font-bold text-[#191416] dark:text-[#FAF7F5] block text-sm">{subj.canonicalName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[#71676A] font-medium">Aliases: {subj.aliases.slice(0, 3).join(', ')}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#F8EDEF] text-[#8F1D2C] font-semibold rounded">
                            {subj.category}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-bold rounded border border-slate-300 dark:border-slate-700 shrink-0">
                        {subj.subjectId}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#71676A] font-medium">
                    No matching subject found. Type to use custom subject name!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. TIME REMAINING SELECTOR */}
        <div className="space-y-3 pt-4 border-t border-[#E5D7D9] dark:border-[#3D282C]">
          <label className="text-sm font-bold text-[#191416] dark:text-[#FAF7F5] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#8F1D2C]" />
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
                  className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'border-[#8F1D2C] bg-[#8F1D2C] text-white shadow-md'
                      : 'border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] text-[#191416] dark:text-[#FAF7F5] hover:bg-[#F8EDEF]'
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
              className={`text-xs font-semibold underline cursor-pointer ${useCustomTime ? 'text-[#8F1D2C]' : 'text-[#71676A]'}`}
            >
              {useCustomTime ? 'Use preset time options' : 'Enter custom time (in minutes)'}
            </button>
            {useCustomTime && (
              <input
                type="number"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="e.g. 45"
                className="w-32 rounded-xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] px-3 py-1.5 text-xs font-bold text-[#191416] dark:text-[#FAF7F5] outline-none focus:border-[#8F1D2C]"
              />
            )}
          </div>
        </div>

        {/* 3. TEACHER KEY TOPICS & EXAM MATERIALS (OPTIONAL) */}
        <div className="space-y-3 pt-4 border-t border-[#E5D7D9] dark:border-[#3D282C]">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#191416] dark:text-[#FAF7F5] flex items-center gap-2">
              <span>3. Teacher Key Topics & Materials (Optional)</span>
              <span className="text-xs text-[#8F1D2C] dark:text-[#B83245] font-semibold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Priority Boost
              </span>
            </label>

            {/* PLUS (+) ATTACHMENT MENU BUTTON */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                className="px-3 py-1.5 rounded-xl border border-[#8F1D2C] bg-[#8F1D2C] hover:bg-[#651522] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Upload PPT, PDF, Word, Image or Add Web Link"
              >
                <Plus className="h-4 w-4" />
                <span>Attach Material</span>
              </button>

              {/* DROPDOWN ATTACHMENT OPTIONS */}
              {isAttachMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#231B1E] shadow-xl p-2 space-y-1 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsAttachMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-[#191416] dark:text-[#FAF7F5] hover:bg-[#F8EDEF] dark:hover:bg-[#3D282C] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4 text-[#8F1D2C]" />
                    <div>
                      <div className="font-bold">Upload File</div>
                      <div className="text-[10px] text-[#71676A]">PPT, PDF, Word (.docx), Image, TXT</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlDialog(true);
                      setIsAttachMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-[#191416] dark:text-[#FAF7F5] hover:bg-[#F8EDEF] dark:hover:bg-[#3D282C] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Globe className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="font-bold">Add Web / YouTube Link</div>
                      <div className="text-[10px] text-[#71676A]">Extracts content from web URL</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* HIDDEN FILE INPUT FOR PPT, PDF, WORD, IMAGES */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* TEXTAREA WITH AUTOMATIC LINK DETECTION */}
          <div className="relative">
            <textarea
              value={teacherTopicsInput}
              onChange={(e) => handleTeacherTopicsChange(e.target.value)}
              placeholder="Type key topics (e.g. Trees, AVL, Normalization...) or paste any web/YouTube link..."
              rows={2}
              className="w-full rounded-2xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] p-3.5 text-sm font-medium text-[#191416] dark:text-[#FAF7F5] placeholder-[#71676A] outline-none focus:border-[#8F1D2C] custom-scrollbar"
            />
            {isExtractingUrl && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-[#8F1D2C] text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 animate-pulse shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Extracting link info...</span>
              </div>
            )}
          </div>

          {/* MANUAL URL INPUT DIALOG */}
          {showUrlDialog && (
            <div className="p-4 rounded-2xl border border-[#8F1D2C]/30 bg-[#F8EDEF] dark:bg-[#2A171B] space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8F1D2C] dark:text-[#B83245] flex items-center gap-1.5">
                  <Globe className="h-4 w-4" /> Import Knowledge from Web or YouTube URL
                </span>
                <button type="button" onClick={() => setShowUrlDialog(false)} className="text-[#71676A] hover:text-[#191416]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="Paste URL (e.g. https://wikipedia.org/... or YouTube video link)"
                  className="flex-1 rounded-xl border border-[#E5D7D9] dark:border-[#3D282C] bg-white dark:bg-[#191416] px-3 py-2 text-xs font-medium text-[#191416] dark:text-[#FAF7F5] outline-none focus:border-[#8F1D2C]"
                />
                <button
                  type="button"
                  onClick={handleManualUrlSubmit}
                  disabled={isExtractingUrl || !customUrlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#8F1D2C] hover:bg-[#651522] text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isExtractingUrl ? 'Extracting...' : 'Gather Info'}
                </button>
              </div>
            </div>
          )}

          {/* ATTACHED MATERIALS BADGES LIST */}
          {attachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-bold uppercase text-[#71676A] flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5 text-[#8F1D2C]" /> Attached Study Materials & Links ({attachments.length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="px-3 py-1.5 rounded-xl border border-[#E5D7D9] dark:border-[#3D282C] bg-[#F8EDEF] dark:bg-[#2D1B20] text-xs font-medium text-[#191416] dark:text-[#FAF7F5] flex items-center gap-2 shadow-sm"
                  >
                    {att.type === 'presentation' && <FileSpreadsheet className="h-3.5 w-3.5 text-amber-600" />}
                    {att.type === 'document' && <FileText className="h-3.5 w-3.5 text-blue-600" />}
                    {att.type === 'image' && <FileDigit className="h-3.5 w-3.5 text-purple-600" />}
                    {att.type === 'url' && <Globe className="h-3.5 w-3.5 text-emerald-600" />}
                    
                    <div className="max-w-[200px] truncate">
                      <span className="truncate block font-bold">{att.name}</span>
                      <span className="text-[10px] text-[#71676A] block">
                        {att.type === 'url' ? 'Web Ingested' : att.sizeLabel || `${Math.round(att.textContent.length)} chars`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 hover:bg-red-500/20 rounded-md text-[#8F1D2C] transition-colors cursor-pointer"
                      title="Remove material"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. PREPARATION STYLE */}
        <div className="space-y-2 pt-4 border-t border-[#E5D7D9] dark:border-[#3D282C]">
          <label className="text-sm font-bold text-[#191416] dark:text-[#FAF7F5] block">
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
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  intensity === item.id
                    ? 'border-[#8F1D2C] bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#191416] dark:text-[#FAF7F5] shadow-sm font-bold'
                    : 'border-[#E5D7D9] dark:border-[#3D282C] bg-[#FAF7F5] dark:bg-[#231B1E] hover:bg-[#F8EDEF]'
                }`}
              >
                <div className="text-sm font-bold text-[#191416] dark:text-[#FAF7F5] block">{item.label}</div>
                <div className="text-xs text-[#71676A] font-medium mt-1 leading-relaxed">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* START CTA BUTTON */}
        <div className="pt-4 border-t border-[#E5D7D9] dark:border-[#3D282C]">
          <button
            type="button"
            onClick={handleStart}
            disabled={isLaunching}
            className="w-full py-4 px-6 rounded-2xl bg-[#8F1D2C] hover:bg-[#651522] text-white font-sans text-base font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLaunching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>PROCESSING MATERIALS & PREPARING...</span>
              </>
            ) : (
              <>
                <Flame className="h-5 w-5 fill-white" />
                <span>START EXAM RUSH ENVIRONMENT</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* LAUNCHING / PROCESSING PROGRESS OVERLAY */}
      {isLaunching && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#191416] border border-[#8F1D2C]/40 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F8EDEF] dark:bg-[#2D1B20] text-[#8F1D2C] flex items-center justify-center border border-[#8F1D2C]/30 shadow-sm">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#191416] dark:text-[#FAF7F5]">
                Preparing Exam Workspace
              </h3>
              <p className="text-xs text-[#71676A] dark:text-[#A3989B] font-medium leading-relaxed">
                {launchStep}
              </p>
            </div>
            <div className="w-full bg-[#FAF7F5] dark:bg-[#231B1E] h-2.5 rounded-full overflow-hidden border border-[#E5D7D9] dark:border-[#3D282C]">
              <div className="h-full bg-[#8F1D2C] animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
