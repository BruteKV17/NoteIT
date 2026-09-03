import React, { useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: 'document' | 'presentation' | 'image' | 'url' = 'document';
      if (['ppt', 'pptx'].includes(ext)) type = 'presentation';
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) type = 'image';

      const content = await readFileContent(file);
      const newAtt: ExamRushAttachment = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: file.name,
        type,
        textContent: content,
        sizeLabel: `${(file.size / 1024).toFixed(1)} KB`
      };

      setAttachments(prev => [...prev, newAtt]);
    }

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
        sizeLabel: `${(result.text || '').length} chars`
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

  const handleStart = () => {
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
      attachments,
      intensity
    };

    // Save config to sessionStorage so a newly opened tab can read it
    try {
      sessionStorage.setItem('noteit_exam_rush_active_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save exam rush config to sessionStorage', e);
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
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left animate-fade-in">
      
      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl border-2 border-black dark:border-slate-700 bg-gradient-to-r from-[#111111] via-[#1E293B] to-[#0F172A] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF4D4D] text-white border border-black rounded-lg text-xs font-mono font-black uppercase tracking-wider shadow-sm">
              <Flame className="h-4 w-4 fill-white" />
              <span>EXAM RUSH MODE</span>
            </div>
            <span className="px-2.5 py-1 bg-amber-400 text-black rounded-lg text-[10px] font-mono font-black uppercase">
              115 College Subjects Available
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-heading">
            Targeted Exam Survival & Rapid Mastery
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-bold max-w-2xl leading-relaxed">
            Select from 115+ official university subjects across B.Tech, BBA, BCA, and B.Sc branches. NoteIT will launch a full-screen, distraction-free study environment tailored to your exam timeline.
          </p>
        </div>
      </div>

      {/* SETUP CARD FORM */}
      <div className="p-6 sm:p-8 rounded-3xl border-2 border-black dark:border-slate-700 bg-white dark:bg-[#1E293B] shadow-paper-lg space-y-6">
        
        {/* 1. CANONICAL SUBJECT AUTOCOMPLETE & BRANCH FILTER */}
        <div className="space-y-3 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-slate-200">
              1. Select Subject (115 Available for B.Tech, BBA, BCA, B.Sc) *
            </label>
            {selectedSubject && (
              <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold">ID: {selectedSubject.subjectId} ({selectedSubject.category})</span>
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
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold shrink-0 transition-all cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-[#2563EB] text-white border-black shadow-sm font-black'
                    : 'bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

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
                placeholder="Type or search 115+ subjects (e.g. DBMS, Thermodynamics, Financial Accounting, Organic Chemistry...)"
                className="w-full rounded-2xl border-2 border-black dark:border-slate-600 bg-[#F8FAFC] dark:bg-[#0D1117] pl-11 pr-4 py-3.5 text-xs font-extrabold text-black dark:text-white placeholder-slate-400 outline-none focus:border-[#2563EB] shadow-sm transition-all"
              />
            </div>

            {isSubjectDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-2xl border-2 border-black bg-white dark:bg-[#0D1117] shadow-2xl p-2.5 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                {subjectResults.length > 0 ? (
                  subjectResults.map((subj) => (
                    <button
                      key={subj.subjectId}
                      type="button"
                      onClick={() => handleSelectSubject(subj)}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-[#FFC400]/20 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <span className="font-extrabold text-black dark:text-white block">{subj.canonicalName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-mono font-bold">Aliases: {subj.aliases.slice(0, 3).join(', ')}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold rounded">
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
                  <div className="p-4 text-center text-xs text-slate-500 font-mono font-bold">
                    No matching subject found. Type to use custom subject name!
                  </div>
                )}
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

        {/* 3. TEACHER KEY TOPICS & EXAM MATERIALS (OPTIONAL) */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-slate-200 flex items-center gap-2">
              <span>3. Teacher Key Topics & Materials (Optional)</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Priority Boost
              </span>
            </label>

            {/* PLUS (+) ATTACHMENT MENU BUTTON */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                className="px-2.5 py-1.5 rounded-xl border-2 border-black dark:border-slate-600 bg-[#FFC400] hover:bg-amber-400 text-black text-xs font-mono font-black flex items-center gap-1.5 shadow-paper-xs transition-all cursor-pointer"
                title="Upload PPT, PDF, Word, Image or Add Web Link"
              >
                <Plus className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase">Attach Material</span>
              </button>

              {/* DROPDOWN ATTACHMENT OPTIONS */}
              {isAttachMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border-2 border-black bg-white dark:bg-[#0D1117] shadow-2xl p-2 space-y-1 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsAttachMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4 text-[#2563EB]" />
                    <div>
                      <div className="font-extrabold text-black dark:text-white">Upload File</div>
                      <div className="text-[9px] text-slate-500 font-bold">PPT, PDF, Word (.docx), Image, TXT</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlDialog(true);
                      setIsAttachMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Globe className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="font-extrabold text-black dark:text-white">Add Web / YouTube Link</div>
                      <div className="text-[9px] text-slate-500 font-bold">Extracts content from web URL</div>
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
              className="w-full rounded-2xl border-2 border-black dark:border-slate-600 bg-[#F8FAFC] dark:bg-[#0D1117] p-3.5 text-xs font-mono font-bold text-black dark:text-white placeholder-slate-400 outline-none focus:border-[#2563EB] custom-scrollbar"
            />
            {isExtractingUrl && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-[#2563EB] text-white text-[10px] font-mono font-bold rounded-lg flex items-center gap-1.5 animate-pulse shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Extracting link info...</span>
              </div>
            )}
          </div>

          {/* MANUAL URL INPUT DIALOG */}
          {showUrlDialog && (
            <div className="p-4 rounded-2xl border-2 border-black bg-blue-50 dark:bg-slate-800 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black uppercase text-[#2563EB] flex items-center gap-1.5">
                  <Globe className="h-4 w-4" /> Import Knowledge from Web or YouTube URL
                </span>
                <button type="button" onClick={() => setShowUrlDialog(false)} className="text-slate-500 hover:text-black">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="Paste URL (e.g. https://wikipedia.org/... or YouTube video link)"
                  className="flex-1 rounded-xl border-2 border-black dark:border-slate-600 bg-white dark:bg-[#0D1117] px-3 py-2 text-xs font-mono font-bold text-black dark:text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleManualUrlSubmit}
                  disabled={isExtractingUrl || !customUrlInput.trim()}
                  className="px-4 py-2 rounded-xl border-2 border-black bg-[#2563EB] hover:bg-blue-700 text-white font-mono text-xs font-black uppercase disabled:opacity-50 cursor-pointer shadow-paper-xs"
                >
                  {isExtractingUrl ? 'Extracting...' : 'Gather Info'}
                </button>
              </div>
            </div>
          )}

          {/* ATTACHED MATERIALS BADGES LIST */}
          {attachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1">
                <Paperclip className="h-3 w-3" /> Attached Study Materials & Links ({attachments.length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="px-3 py-1.5 rounded-xl border-2 border-black dark:border-slate-700 bg-amber-400/20 dark:bg-amber-400/10 text-xs font-mono font-bold text-black dark:text-white flex items-center gap-2 shadow-paper-xs"
                  >
                    {att.type === 'presentation' && <FileSpreadsheet className="h-3.5 w-3.5 text-amber-600" />}
                    {att.type === 'document' && <FileText className="h-3.5 w-3.5 text-blue-600" />}
                    {att.type === 'image' && <FileDigit className="h-3.5 w-3.5 text-purple-600" />}
                    {att.type === 'url' && <Globe className="h-3.5 w-3.5 text-emerald-600" />}
                    
                    <div className="max-w-[200px] truncate">
                      <span className="truncate block font-extrabold">{att.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold block">
                        {att.type === 'url' ? 'Web Ingested' : att.sizeLabel || `${Math.round(att.textContent.length)} chars`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 hover:bg-red-500/20 rounded-md text-red-600 transition-colors cursor-pointer"
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
            <span>START EXAM RUSH ENVIRONMENT (FULLSCREEN NEW TAB)</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
