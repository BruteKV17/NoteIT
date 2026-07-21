/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Cpu, 
  Sparkles, 
  Bookmark, 
  FileText, 
  CheckCircle, 
  TrendingUp,
  Brain,
  ListRestart,
  ArrowRight,
  Download,
  ArrowLeft,
  Trash2,
  Map,
  X,
  Award,
  HelpCircle,
  Sliders,
  Globe,
  HardDrive
} from 'lucide-react';
import BruteLoader from './BruteLoader';
import { PageId } from '../types';
import PresentationWorkspace from './PresentationWorkspace';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { saveRecordingChunks, getRecordingChunks, deleteRecordingBackup, getAllBackupKeys } from '../services/dbBackup';

interface LectureCaptureViewProps {
  onSaveCapture: (title: string, subject: string, duration: string, audioBlob: Blob, existingLectureId?: string) => Promise<void>;
  onStartCapture?: (title: string, subject: string) => Promise<string>;
  setActivePage: (page: PageId) => void;
  theme: 'light' | 'dark';
  lectures?: any[];
  activeLectureId: string | null;
  setActiveLectureId: (id: string | null) => void;
  notes?: any[];
}

interface StructuredSummary {
  overview: string;
  keyConcepts: string;
  importantDefinitions: string;
  examples: string;
  applications: string;
  commonMistakes: string;
  revisionNotes: string;
  examQuestions: string;
  keyTakeaways: string;
  oneMinuteRevision: string;
}

export default function LectureCaptureView({
  onSaveCapture,
  onStartCapture,
  setActivePage,
  theme,
  lectures = [],
  activeLectureId,
  setActiveLectureId,
  notes = []
}: LectureCaptureViewProps) {
  
  // Lecture Metadata inputs
  const [lectureTitle, setLectureTitle] = useState('Deep Neural Optimization - Captured Live');
  const [lectureSubject, setLectureSubject] = useState('Computer Science');

  // Capturing state machines
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [aiStatus, setAiStatus] = useState<'idle' | 'recording_transcription' | 'synthesizing' | 'completed'>('idle');
  const [micError, setMicError] = useState<string | null>(null);

  // Real-time live transcript state
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
  const liveTranscriptRef = useRef('');

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);
  
  // Refs for audio capturing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Refs for visualizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const visualizerRef = useRef<HTMLDivElement | null>(null);

  // Refs for tracking timer without closures
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const secondsRef = useRef<number>(0);

  // Refs and states for IndexedDB backup and recovery
  const lectureIdRef = useRef<string | null>(null);
  const [recoverableLecture, setRecoverableLecture] = useState<{ id: string; title: string; subject: string; duration: string } | null>(null);

  // Split pane resizing states
  const [transcriptWidth, setTranscriptWidth] = useState(30); // default to 30% to shrink transcript and enlarge output studio
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'transcript' | 'tools'>('tools');

  // Active review workspace states
  const [activeOutputTab, setActiveOutputTab] = useState<'notes' | 'summary' | 'flashcards' | 'quiz' | 'mindmap' | 'timeline' | 'slides' | 'chat'>('notes');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  
  // Format / Mode selectors
  const [selectedNotesMode, setSelectedNotesMode] = useState<'quick' | 'detailed' | 'academic' | 'exam' | 'bhailang'>('quick');
  const [selectedSummaryMode, setSelectedSummaryMode] = useState<'quick_revision' | 'detailed_notes' | 'executive_summary' | 'beginner_friendly' | 'academic_format' | 'bhailang'>('quick_revision');
  const [flashcardsFormat, setFlashcardsFormat] = useState<'basic' | 'advanced'>('basic');
  const [selectedFlashcardCategory, setSelectedFlashcardCategory] = useState<'All' | 'Basic Recall' | 'Concept Understanding' | 'Application Based'>('All');
  const [selectedQuizDifficulty, setSelectedQuizDifficulty] = useState<'easy' | 'medium' | 'hard' | 'scenario' | 'application'>('easy');
  const [quizFormat, setQuizFormat] = useState<'mcq' | 'subjective' | 'case'>('mcq');

  // Lazy loaders
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  
  // Quiz gameplay state
  const [activeQuizQuestionIdx, setActiveQuizQuestionIdx] = useState(0);
  const [selectedQuizAnswerIdx, setSelectedQuizAnswerIdx] = useState<number | null>(null);
  const [isQuizRevealed, setIsQuizRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Mindmap Interactive Drawer
  const [selectedMindmapNode, setSelectedMindmapNode] = useState<any | null>(null);

  // PDF Export Modal & Settings
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfExportData, setPdfExportData] = useState<{ title: string; data: any } | null>(null);
  const [selectedPdfTheme, setSelectedPdfTheme] = useState<'academic' | 'modern' | 'corporate' | 'dark'>('academic');

  // Past captures list (sliced to the first 3 lectures from Firestore)
  const pastLectures = lectures.slice(0, 3).map((l: any) => ({
    id: l.id,
    title: l.title,
    date: l.addedAt,
    duration: l.duration || '00:00:00',
    subject: l.subject
  }));

  // Handle timer ticker and transcript emission
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
      setAiStatus('recording_transcription');
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, isPaused]);

  // Clean up audio visualizer on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Check for recoverable crashed recordings on mount
  useEffect(() => {
    const checkRecoverable = async () => {
      try {
        const keys = await getAllBackupKeys();
        if (keys.length > 0) {
          const recoverableId = keys[0];
          const match = lectures.find((l: any) => l.id === recoverableId);
          if (match) {
            setRecoverableLecture({
              id: match.id,
              title: match.title,
              subject: match.subject,
              duration: match.duration || '00:00:00'
            });
          } else {
            setRecoverableLecture({
              id: recoverableId,
              title: 'Crashed Recording Session',
              subject: 'General Review',
              duration: '00:00:00'
            });
          }
        }
      } catch (err) {
        console.error('Failed to check for recoverable recordings:', err);
      }
    };
    checkRecoverable();
  }, [lectures]);

  // Split pane resizing logic
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('split-pane-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const newWidth = Math.max(20, Math.min(80, (relativeX / rect.width) * 100));
      setTranscriptWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const cleanupAudio = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  };

  const resetWaveform = () => {
    if (visualizerRef.current) {
      const bars = visualizerRef.current.querySelectorAll('.waveform-bar');
      bars.forEach((bar) => {
        (bar as HTMLElement).style.height = '8px';
      });
    }
  };

  const startVisualizer = (stream: MediaStream) => {
    try {
      cleanupAudio();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; 
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        if (visualizerRef.current) {
          const bars = visualizerRef.current.querySelectorAll('.waveform-bar');
          bars.forEach((bar, index) => {
            const dataIndex = Math.floor((index / 25) * bufferLength);
            const value = dataArray[dataIndex] || 0;
            const heightPercent = Math.max(8, Math.min(100, (value / 255) * 100));
            (bar as HTMLElement).style.height = `${heightPercent}%`;
          });
        }
        animationFrameIdRef.current = requestAnimationFrame(updateWaveform);
      };
      
      animationFrameIdRef.current = requestAnimationFrame(updateWaveform);
    } catch (err) {
      console.error('Failed to initialize audio visualizer:', err);
    }
  };

  // Auto-scroll the transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveTranscript]);

  const startSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentSessionTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentSessionTranscript += event.results[i][0].transcript + ' ';
        }
        
        const base = accumulatedTranscriptRef.current;
        setLiveTranscript((base + ' ' + currentSessionTranscript).trim());
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (isRecordingRef.current && !isPausedRef.current && recognitionRef.current === recognition) {
          accumulatedTranscriptRef.current = liveTranscriptRef.current;
          try {
            recognition.start();
          } catch (err) {
            console.error('Failed to restart speech recognition:', err);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
    }
  };

  const handleStartCapture = async () => {
    setMicError(null);
    chunksRef.current = [];
    lectureIdRef.current = null;
    setLiveTranscript('');
    accumulatedTranscriptRef.current = '';
    liveTranscriptRef.current = '';
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = recorder;

      if (onStartCapture) {
        onStartCapture(lectureTitle, lectureSubject)
          .then((id) => {
            lectureIdRef.current = id;
            console.log('Lecture document pre-created in Firestore:', id);
          })
          .catch((err) => {
            console.error('Failed to pre-create lecture in Firestore:', err);
          });
      }

      recorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          if (lectureIdRef.current) {
            try {
              await saveRecordingChunks(lectureIdRef.current, chunksRef.current);
            } catch (err) {
              console.error('Failed to backup recording chunks:', err);
            }
          }
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const durationStr = formatTime(secondsRef.current);
        setAiStatus('synthesizing');

        let finalId = lectureIdRef.current;
        if (!finalId && onStartCapture) {
          for (let i = 0; i < 30; i++) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            finalId = lectureIdRef.current;
            if (finalId) break;
          }
        }

        try {
          await onSaveCapture(lectureTitle, lectureSubject, durationStr, audioBlob, finalId || undefined);
          if (finalId) {
            await deleteRecordingBackup(finalId);
          }
          lectureIdRef.current = null;
        } catch (err) {
          console.error('Failed to save capture:', err);
          setAiStatus('idle');
        }
      };
      
      recorder.start(1000);
      startVisualizer(stream);
      setIsRecording(true);
      setIsPaused(false);
      secondsRef.current = 0;
      setSeconds(0);
      startSpeechRecognition();
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setMicError('Microphone permission denied. Please enable mic access to capture lectures.');
    }
  };

  const handlePauseCapture = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      if (streamRef.current) {
        startVisualizer(streamRef.current);
      }
      setIsPaused(false);
      startSpeechRecognition();
    } else {
      mediaRecorderRef.current.pause();
      cleanupAudio();
      resetWaveform();
      setIsPaused(true);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      accumulatedTranscriptRef.current = liveTranscriptRef.current;
    }
  };

  const handleStopCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanupAudio();
    resetWaveform();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper helpers
  const cleanMarkdownText = (text: string): string => {
    if (!text) return '';
    return text.replace(/[*#`_~]/g, '').trim();
  };

  const renderTextWithCitations = (text: string) => {
    if (!text) return '';
    const regex = /(\[Source:\s*[^\]]+\])/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (regex.test(part)) {
        const timeMatch = part.match(/(\d{1,2}:\d{2})/);
        const timestamp = timeMatch ? timeMatch[1] : null;
        
        const handleClick = () => {
          if (timestamp) {
            handleTimelineTimestampClick(timestamp);
          } else {
            const cleanText = part.replace(/[\[\]]/g, '').replace('Source:', '').trim();
            alert(`Citation Detail: "${cleanText}"`);
          }
        };

        return (
          <span 
            key={index} 
            onClick={handleClick}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 cursor-pointer hover:bg-indigo-600 hover:text-white transition-all ml-1 select-none"
            title="Jump to source in transcript"
          >
            🔖 {part}
          </span>
        );
      }
      return part;
    });
  };

  const parseSummaryIntoSections = (summaryText: string): StructuredSummary => {
    const clean = (txt: string) => txt.replace(/[*#`_~]/g, '').trim();
    const sections: StructuredSummary = {
      overview: '',
      keyConcepts: '',
      importantDefinitions: '',
      examples: '',
      applications: '',
      commonMistakes: '',
      revisionNotes: '',
      examQuestions: '',
      keyTakeaways: '',
      oneMinuteRevision: ''
    };

    if (!summaryText) return sections;

    const patterns = {
      overview: /overview|introduction/i,
      keyConcepts: /key\s+concepts/i,
      importantDefinitions: /important\s+definitions|definitions/i,
      examples: /examples/i,
      applications: /applications/i,
      commonMistakes: /common\s+mistakes/i,
      revisionNotes: /revision\s+notes/i,
      examQuestions: /exam\s+questions/i,
      keyTakeaways: /key\s+takeaways/i,
      oneMinuteRevision: /one\s+minute\s+revision|minute\s+revision/i
    };

    const lines = summaryText.split('\n');
    let currentKey: keyof StructuredSummary | null = null;

    lines.forEach(line => {
      const lineCleaned = line.trim().replace(/[*#]/g, '').trim();
      let matched = false;
      for (const [key, regex] of Object.entries(patterns)) {
        if (regex.test(lineCleaned) && lineCleaned.length < 50) {
          currentKey = key as keyof StructuredSummary;
          matched = true;
          break;
        }
      }

      if (!matched) {
        if (currentKey) {
          sections[currentKey] += (sections[currentKey] ? '\n' : '') + line;
        } else {
          sections.overview += (sections.overview ? '\n' : '') + line;
        }
      }
    });

    const keys = Object.keys(sections) as (keyof StructuredSummary)[];
    const filledCount = keys.filter(k => sections[k].trim().length > 0).length;

    if (filledCount < 4) {
      const words = summaryText.split(/\s+/);
      const chunkSize = Math.ceil(words.length / 10);
      for (let i = 0; i < 10; i++) {
        const partWords = words.slice(i * chunkSize, (i + 1) * chunkSize);
        sections[keys[i]] = partWords.join(' ');
      }
    }

    for (const key of keys) {
      sections[key] = clean(sections[key]);
    }

    return sections;
  };

  const handleTimestampClick = (timeVal: string) => {
    console.log("Timestamp clicked inside transcript:", timeVal);
  };

  const handleTimelineTimestampClick = (timeVal: string) => {
    const cleanTimeId = timeVal.replace(':', '_');
    const element = document.getElementById(`transcript-time-${cleanTimeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-indigo-600', 'text-white', 'scale-110');
      setTimeout(() => {
        element.classList.remove('bg-indigo-600', 'text-white', 'scale-110');
      }, 1500);
    }
  };

  const renderTranscriptContent = (text: string) => {
    if (!text) return <p className="text-neutral-500 italic">No transcript content available.</p>;
    const timestampRegex = /(\[\d{1,2}:\d{2}\])/g;
    const parts = text.split(timestampRegex);
    return parts.map((part, index) => {
      if (timestampRegex.test(part)) {
        const timeVal = part.replace(/[\[\]]/g, '');
        const cleanTimeId = timeVal.replace(':', '_');
        return (
          <span
            key={index}
            id={`transcript-time-${cleanTimeId}`}
            onClick={() => handleTimestampClick(timeVal)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 cursor-pointer hover:bg-indigo-600 hover:text-white transition-all mr-1"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getNodeColor = (node: any, isSelected: boolean) => {
    if (isSelected) return '#10b981';
    if (node.id === 'root') return '#4f46e5';
    const grp = (node.group || '').toLowerCase();
    if (grp.includes('math') || grp.includes('formula')) return '#f97316';
    if (grp.includes('application') || grp.includes('usecase')) return '#ec4899';
    if (grp.includes('concept') || grp.includes('theory')) return '#06b6d4';
    if (grp.includes('exam') || grp.includes('mistake')) return '#ef4444';
    return '#818cf8';
  };

  // PDF Export
  const exportPDFFile = (title: string, rawData: any, pdfTheme: 'academic' | 'modern' | 'corporate' | 'dark' = 'academic') => {
    let contentHtml = '';
    
    if (typeof rawData === 'string') {
      const sections = parseSummaryIntoSections(rawData);
      contentHtml = `
        <div class="pdf-section">
          <h2>1. Overview</h2>
          <p>${(sections.overview || '').replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>2. Key Concepts</h2>
          <p>${(sections.keyConcepts || '').replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>3. Important Definitions</h2>
          <p>${(sections.importantDefinitions || '').replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>4. Examples</h2>
          <p>${(sections.examples || '').replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>5. Applications</h2>
          <p>${(sections.applications || '').replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>6. Common Mistakes</h2>
          <p>${(sections.commonMistakes || '').replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>7. Revision Notes</h2>
          <p>${(sections.revisionNotes || '').replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>8. Exam Questions</h2>
          <p>${(sections.examQuestions || '').replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>9. Key Takeaways</h2>
          <p>${(sections.keyTakeaways || '').replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>10. One Minute Revision</h2>
          <p>${(sections.oneMinuteRevision || '').replace(/\n/g, '<br/>')}</p>
        </div>
      `;
    } else if (Array.isArray(rawData)) {
      contentHtml = rawData.map((item, idx) => `
        <div class="pdf-section">
          <h2>${idx + 1}. ${item.title || item.q || ('Section ' + (idx + 1))}</h2>
          <p>${(item.content || item.a || item.question || '').replace(/\n/g, '<br/>')}</p>
          ${item.options ? `<ul class="pdf-options">${item.options.map((opt: string) => `<li>${opt}</li>`).join('')}</ul>` : ''}
          ${item.explanation ? `<p class="pdf-explanation"><strong>Explanation:</strong> ${item.explanation}</p>` : ''}
        </div>
      `).join('');
    }

    const themeStyles = {
      academic: `
        body { font-family: 'Playfair Display', 'Georgia', serif; background-color: #fdfbf7; color: #1e293b; padding: 50px; line-height: 1.8; }
        .cover-page { height: 95vh; display: flex; flex-direction: column; justify-content: center; border: 3px double #b5885c; padding: 40px; margin-bottom: 50px; background: #faf8f5; box-sizing: border-box; }
        .cover-title { font-size: 34px; color: #1e3a8a; font-family: 'Playfair Display', serif; text-align: center; margin-top: 120px; }
        .cover-subtitle { font-size: 15px; text-transform: uppercase; letter-spacing: 2px; color: #b5885c; text-align: center; margin-top: 20px; }
        .cover-meta { font-size: 13px; font-family: 'Inter', sans-serif; color: #64748b; text-align: center; margin-top: auto; margin-bottom: 80px; }
        h1, h2 { color: #1e3a8a; font-family: 'Playfair Display', serif; }
        h2 { font-size: 19px; border-bottom: 1px solid #b5885c; padding-bottom: 6px; margin-top: 35px; page-break-before: always; }
        p { font-size: 13.5px; text-align: justify; }
        .pdf-section { margin-bottom: 25px; }
      `,
      modern: `
        body { font-family: 'Outfit', 'Inter', sans-serif; background-color: #ffffff; color: #0f172a; padding: 40px; line-height: 1.6; }
        .cover-page { height: 95vh; display: flex; flex-direction: column; justify-content: space-between; border-left: 8px solid #4f46e5; padding: 60px; margin-bottom: 50px; box-sizing: border-box; }
        .cover-title { font-size: 40px; font-weight: 800; color: #0f172a; margin-top: 100px; }
        .cover-subtitle { font-size: 17px; font-weight: 500; color: #4f46e5; margin-top: 10px; }
        .cover-meta { font-size: 13px; color: #64748b; margin-bottom: 50px; }
        h2 { font-size: 21px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 40px; page-break-before: always; }
        p { font-size: 13.5px; color: #334155; }
        .pdf-section { margin-bottom: 30px; }
      `,
      corporate: `
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #1e293b; padding: 45px; line-height: 1.7; }
        .cover-page { height: 95vh; display: flex; flex-direction: column; justify-content: center; padding: 80px; border: 1px solid #cbd5e1; background: #ffffff; margin-bottom: 50px; box-sizing: border-box; }
        .cover-title { font-size: 30px; font-weight: 700; color: #0f172a; border-bottom: 4px solid #3b82f6; padding-bottom: 20px; }
        .cover-subtitle { font-size: 14px; color: #64748b; margin-top: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .cover-meta { font-size: 12px; color: #94a3b8; margin-top: auto; }
        h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 35px; border-left: 4px solid #3b82f6; padding-left: 12px; page-break-before: always; }
        p { font-size: 13px; color: #334155; }
        .pdf-section { margin-bottom: 25px; }
      `,
      dark: `
        body { font-family: 'Outfit', 'Inter', sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 40px; line-height: 1.6; }
        .cover-page { height: 95vh; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px solid #1e293b; background: #070a13; margin-bottom: 50px; box-sizing: border-box; }
        .cover-title { font-size: 38px; font-weight: 800; color: #ffffff; text-align: center; text-shadow: 0 0 10px rgba(99, 102, 241, 0.4); }
        .cover-subtitle { font-size: 15px; color: #6366f1; text-align: center; margin-top: 15px; text-transform: uppercase; letter-spacing: 2px; }
        .cover-meta { font-size: 12px; color: #64748b; margin-top: auto; margin-bottom: 80px; }
        h2 { font-size: 19px; font-weight: 700; color: #ffffff; border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-top: 40px; text-shadow: 0 0 8px rgba(99, 102, 241, 0.2); page-break-before: always; }
        p { font-size: 13px; color: #9ca3af; }
        .pdf-section { margin-bottom: 30px; }
      `
    };

    let tocHtml = '';
    if (typeof rawData === 'string') {
      tocHtml = `
        <div class="toc-page" style="page-break-after: always; padding: 50px; font-family: sans-serif;">
          <h2 style="page-break-before: avoid; border: none; padding: 0;">Table of Contents</h2>
          <ul style="list-style-type: none; padding-left: 0; margin-top: 30px; font-size: 14px;">
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;"><span>1. Introduction</span><span>................................................................</span><span>Page 3</span></li>
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;"><span>2. Key Concepts</span><span>................................................................</span><span>Page 4</span></li>
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;"><span>3. Important Topics</span><span>................................................................</span><span>Page 5</span></li>
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;"><span>4. Examples</span><span>................................................................</span><span>Page 6</span></li>
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;"><span>5. Formulas</span><span>................................................................</span><span>Page 7</span></li>
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;"><span>6. Key Takeaways</span><span>................................................................</span><span>Page 8</span></li>
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;"><span>7. Revision Notes</span><span>................................................................</span><span>Page 9</span></li>
          </ul>
        </div>
      `;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=Outfit:wght@400;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
          <style>
            ${themeStyles[pdfTheme]}
            @media print {
              body { margin: 0; padding: 20px; }
              .cover-page { height: 90vh; }
            }
            .pdf-options { padding-left: 20px; font-size: 13px; margin: 10px 0; }
            .pdf-explanation { font-style: italic; color: #4b5563; font-size: 12px; background: rgba(0,0,0,0.02); padding: 10px; border-radius: 6px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="cover-page">
            <div class="cover-title">${title}</div>
            <div class="cover-subtitle">Lecture Report & Workspace Synthesis</div>
            <div class="cover-meta">
              Generated by <strong>Note-IT AI Smart Review Workspace</strong><br/>
              Date: ${new Date().toLocaleDateString()}<br/>
              Theme Style: ${pdfTheme.charAt(0).toUpperCase() + pdfTheme.slice(1)} Mode
            </div>
          </div>
          ${tocHtml}
          <div class="pdf-content">
            ${contentHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Dynamic On-Demand Asset Generators
  const triggerGenerateNotes = async (mode: 'quick' | 'detailed' | 'academic' | 'exam' | 'bhailang') => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture || isGeneratingNotes) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const textContent = activeLecture.transcript || activeLecture.cleanTranscript || '';
    if (!textContent.trim()) {
      alert("No transcript content available to generate notes.");
      return;
    }

    setIsGeneratingNotes(true);
    try {
      const { generateNotes: callGenerateNotes } = await import('../services/gemini');
      const generated = await callGenerateNotes(textContent, mode, import.meta.env.VITE_GEMINI_API_KEY || '');
      
      const docRef = doc(db, 'users', uid, 'lectures', activeLecture.id);
      await updateDoc(docRef, {
        [`notes.${mode}`]: generated
      });
    } catch (err: any) {
      console.error("Notes generation failed:", err);
      alert(`Failed to generate notes: ${err.message || err}`);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const triggerGenerateSummary = async (mode: 'quick_revision' | 'detailed_notes' | 'executive_summary' | 'beginner_friendly' | 'academic_format' | 'bhailang') => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture || isGeneratingSummary) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const textContent = activeLecture.transcript || activeLecture.cleanTranscript || '';
    if (!textContent.trim()) {
      alert("No transcript content available to generate summary.");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const { generateSummary: callGenerateSummary } = await import('../services/gemini');
      const generated = await callGenerateSummary(textContent, mode, import.meta.env.VITE_GEMINI_API_KEY || '');

      const docRef = doc(db, 'users', uid, 'lectures', activeLecture.id);
      await updateDoc(docRef, {
        [`summaries.${mode}`]: generated
      });
    } catch (err: any) {
      console.error("Summary generation failed:", err);
      alert(`Failed to generate summary: ${err.message || err}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const triggerGenerateFlashcards = async () => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture || isGeneratingFlashcards) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const textContent = activeLecture.transcript || activeLecture.cleanTranscript || '';
    if (!textContent.trim()) {
      alert("No transcript content available to generate flashcards.");
      return;
    }

    setIsGeneratingFlashcards(true);
    try {
      const { generateFlashcards: callGenerateFlashcards } = await import('../services/gemini');
      
      // Flashcard count based on lecture size
      const textLen = textContent.length;
      const count = textLen < 3000 ? 15 : textLen < 10000 ? 30 : 50;

      const generated = await callGenerateFlashcards(textContent, count, [], import.meta.env.VITE_GEMINI_API_KEY || '');
      
      const docRef = doc(db, 'users', uid, 'lectures', activeLecture.id);
      await updateDoc(docRef, {
        flashcards: generated
      });
    } catch (err: any) {
      console.error("Flashcards generation failed:", err);
      alert(`Failed to generate flashcards: ${err.message || err}`);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const triggerGenerateMoreFlashcards = async () => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture || isGeneratingFlashcards) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const textContent = activeLecture.transcript || activeLecture.cleanTranscript || '';
    if (!textContent.trim()) {
      alert("No transcript content available to generate flashcards.");
      return;
    }

    setIsGeneratingFlashcards(true);
    try {
      const { generateFlashcards: callGenerateFlashcards } = await import('../services/gemini');
      const existing = activeLecture.flashcards || [];

      const generated = await callGenerateFlashcards(textContent, 10, existing, import.meta.env.VITE_GEMINI_API_KEY || '');
      
      const docRef = doc(db, 'users', uid, 'lectures', activeLecture.id);
      await updateDoc(docRef, {
        flashcards: [...existing, ...generated]
      });
    } catch (err: any) {
      console.error("Generating more flashcards failed:", err);
      alert(`Failed to generate more flashcards: ${err.message || err}`);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const triggerGenerateQuiz = async () => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture || isGeneratingQuiz) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const textContent = activeLecture.transcript || activeLecture.cleanTranscript || '';
    if (!textContent.trim()) {
      alert("No transcript content available to generate quiz.");
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const { generateQuiz: callGenerateQuiz } = await import('../services/gemini');
      
      const generated = await callGenerateQuiz(textContent, import.meta.env.VITE_GEMINI_API_KEY || '');
      
      const docRef = doc(db, 'users', uid, 'lectures', activeLecture.id);
      await updateDoc(docRef, {
        quiz: generated
      });
    } catch (err: any) {
      console.error("Quiz generation failed:", err);
      alert(`Failed to generate quiz: ${err.message || err}`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const triggerGenerateMoreQuiz = async () => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture || isGeneratingQuiz) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const textContent = activeLecture.transcript || activeLecture.cleanTranscript || '';
    if (!textContent.trim()) {
      alert("No transcript content available to generate quiz.");
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const { generateMoreQuestions: callGenerateMoreQuiz } = await import('../services/gemini');
      const existing = activeLecture.quiz || [];
      const difficultyQuestions = existing.filter((q: any) => q.difficulty === selectedQuizDifficulty);
      const questionTexts = difficultyQuestions.map((q: any) => q.question);

      const generated = await callGenerateMoreQuiz(textContent, selectedQuizDifficulty, questionTexts, import.meta.env.VITE_GEMINI_API_KEY || '');
      
      const docRef = doc(db, 'users', uid, 'lectures', activeLecture.id);
      await updateDoc(docRef, {
        quiz: [...existing, ...generated]
      });
    } catch (err: any) {
      console.error("Generating more quiz questions failed:", err);
      alert(`Failed to generate more questions: ${err.message || err}`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const triggerGenerateMindmap = async () => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture || isGeneratingMindmap) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const textContent = activeLecture.transcript || activeLecture.cleanTranscript || '';
    if (!textContent.trim()) {
      alert("No transcript content available to generate mind map.");
      return;
    }

    setIsGeneratingMindmap(true);
    try {
      const { generateMindmap: callGenerateMindmap } = await import('../services/gemini');
      const sections = activeLecture.sections || [];

      const generated = await callGenerateMindmap(textContent, sections, import.meta.env.VITE_GEMINI_API_KEY || '');
      
      const docRef = doc(db, 'users', uid, 'lectures', activeLecture.id);
      await updateDoc(docRef, {
        keyConcepts: generated
      });
    } catch (err: any) {
      console.error("Mindmap generation failed:", err);
      alert(`Failed to generate mind map: ${err.message || err}`);
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  // Automatic on-demand assets generation and caching
  useEffect(() => {
    if (!activeLectureId) return;
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) return;

    const hasTranscript = !!(activeLecture.transcript?.trim() || activeLecture.cleanTranscript?.trim());
    if (!hasTranscript) return;

    if (activeOutputTab === 'notes') {
      if (!activeLecture.notes?.[selectedNotesMode] && !isGeneratingNotes) {
        triggerGenerateNotes(selectedNotesMode);
      }
    } else if (activeOutputTab === 'summary') {
      if (!activeLecture.summaries?.[selectedSummaryMode] && !isGeneratingSummary) {
        triggerGenerateSummary(selectedSummaryMode);
      }
    } else if (activeOutputTab === 'flashcards') {
      const isLegacyCards = activeLecture.flashcards && activeLecture.flashcards.length > 0 && !activeLecture.flashcards.some((c: any) => c.category);
      if ((!activeLecture.flashcards || activeLecture.flashcards.length === 0 || isLegacyCards) && !isGeneratingFlashcards) {
        triggerGenerateFlashcards();
      }
    } else if (activeOutputTab === 'quiz') {
      const isLegacyQuiz = activeLecture.quiz && activeLecture.quiz.length > 0 && !activeLecture.quiz.some((q: any) => q.difficulty);
      if ((!activeLecture.quiz || activeLecture.quiz.length === 0 || isLegacyQuiz) && !isGeneratingQuiz) {
        triggerGenerateQuiz();
      }
    } else if (activeOutputTab === 'mindmap') {
      if ((!activeLecture.keyConcepts || activeLecture.keyConcepts.length === 0) && !isGeneratingMindmap) {
        triggerGenerateMindmap();
      }
    }
  }, [activeOutputTab, activeLectureId, selectedNotesMode, selectedSummaryMode, lectures, isGeneratingNotes, isGeneratingSummary, isGeneratingFlashcards, isGeneratingQuiz, isGeneratingMindmap]);

  const sendMessageText = async (text: string) => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!text.trim() || !activeLecture || isChatLoading) return;
    
    const userMsg = text.trim();
    setIsChatLoading(true);

    try {
      const { askLectureAI } = await import('../services/gemini');
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("User not authenticated.");

      const activeHistory = activeLecture.chatHistory || [];
      const updatedHistoryBefore = [...activeHistory, { sender: 'user', text: userMsg }];
      
      await updateDoc(doc(db, 'users', uid, 'lectures', activeLecture.id), {
        chatHistory: updatedHistoryBefore
      });

      const response = await askLectureAI(uid, activeLecture.id, 'lecture', userMsg, activeHistory);

      const finalHistory = [...updatedHistoryBefore, { sender: 'ai', text: response.answer, citations: response.citations }];
      await updateDoc(doc(db, 'users', uid, 'lectures', activeLecture.id), {
        chatHistory: finalHistory
      });
    } catch (err: any) {
      console.error("Chat message send failed:", err);
      alert(`Chat error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    await sendMessageText(msg);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeLectureId, isChatLoading]);
  // ----------------------------------------------------
  // MAIN ROUTING
  // ----------------------------------------------------
  if (activeLectureId) {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture) {
      return (
        <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
          <Brain className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-neutral-400">Lecture workspace not found.</h3>
          <button 
            onClick={() => setActiveLectureId(null)}
            className="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-bold text-white cursor-pointer"
          >
            Go back to Dashboard
          </button>
        </div>
      );
    }

    const filteredNotes = notes.filter((n: any) => n.lectureId === activeLectureId);
    
    return (
      <div className={`flex flex-col h-full rounded-2xl overflow-hidden border transition-all select-none ${
        theme === 'dark' ? 'bg-[#0a0b0e] border-neutral-900 text-white' : 'bg-[#FAF9F5] border-gray-200 text-gray-900'
      }`}>
        
        {/* ACTIVE WORKSPACE HEADER BAR */}
        <div className={`p-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#0d0e12] border-neutral-900' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveLectureId(null)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                theme === 'dark' ? 'border-neutral-800 bg-neutral-950/70 hover:bg-neutral-900 text-neutral-400 hover:text-white' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
              title="Back to Standby Capture"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 text-[8.5px] font-bold text-indigo-400 font-mono">
                  {activeLecture.subject.toUpperCase()}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {activeLecture.duration || '00:00:00'} Duration
                </span>
              </div>
              <h1 className="text-sm font-black tracking-tight font-sans mt-0.5 truncate max-w-[200px] sm:max-w-md">
                {activeLecture.title.toUpperCase()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500 font-mono">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WORKSPACE RESOLVED</span>
              <span className="inline sm:hidden">READY</span>
            </span>
          </div>
        </div>

        {/* Mobile Workspace Toggle Header */}
        {isMobile && (
          <div className={`flex border-b text-xs font-bold font-sans ${
            theme === 'dark' ? 'bg-[#0d0e12] border-neutral-900 text-neutral-400' : 'bg-white border-gray-200 text-gray-500'
          }`}>
            <button
              onClick={() => setMobileWorkspaceTab('transcript')}
              className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                mobileWorkspaceTab === 'transcript'
                  ? theme === 'dark'
                    ? 'border-indigo-500 text-white font-black'
                    : 'border-black text-black font-black'
                  : 'border-transparent'
              }`}
            >
              Lecture Transcript
            </button>
            <button
              onClick={() => setMobileWorkspaceTab('tools')}
              className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                mobileWorkspaceTab === 'tools'
                  ? theme === 'dark'
                    ? 'border-indigo-500 text-white font-black'
                    : 'border-black text-black font-black'
                  : 'border-transparent'
              }`}
            >
              Workspace Tools
            </button>
          </div>
        )}

        {/* SPLIT PANE CONTENT CONTAINER */}
        <div id="split-pane-container" className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* PANE 1: LEFT - TRANSCRIPT COLUMN */}
          <div 
            className={`w-full md:flex-shrink-0 flex flex-col border-r overflow-hidden ${
              theme === 'dark' ? 'bg-[#08090c] border-neutral-900' : 'bg-gray-50/50 border-gray-200'
            } ${isMobile && mobileWorkspaceTab !== 'transcript' ? 'hidden' : 'flex'}`}
            style={!isMobile ? { width: `${transcriptWidth}%` } : {}}
          >
            <div className="p-4 border-b border-neutral-900/10 dark:border-neutral-900/50">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">Lecture Transcript</h2>
              <p className="text-[10px] text-neutral-400 mt-0.5">Click timestamps to sync milestone highlights.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs leading-relaxed select-text">
              {renderTranscriptContent(activeLecture.cleanTranscript || activeLecture.transcript || '')}
            </div>
          </div>

          {/* Drag Handle Divider */}
          <div 
            onMouseDown={startResizing}
            className={`hidden md:block w-1.5 hover:w-2 transition-all cursor-col-resize self-stretch flex-shrink-0 relative group ${
              isResizing 
                ? 'bg-indigo-600' 
                : theme === 'dark' ? 'bg-neutral-900 hover:bg-indigo-500/50' : 'bg-gray-200 hover:bg-indigo-500/50'
            }`}
          >
            <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] transition-colors ${
              isResizing ? 'bg-indigo-400' : 'bg-transparent group-hover:bg-indigo-400'
            }`} />
          </div>

          {/* PANE 2: RIGHT - STUDY TABS COLUMN */}
          <div 
            className={`flex-grow flex-1 flex flex-col overflow-hidden p-4 space-y-4 ${
              isMobile && mobileWorkspaceTab !== 'tools' ? 'hidden' : 'flex'
            }`}
            style={!isMobile ? { width: `${100 - transcriptWidth}%` } : {}}
          >
            
            {/* MINI TAB ROW SELECTOR */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap bg-neutral-950/20 p-1 rounded-xl border border-neutral-900/10 dark:border-neutral-900/40">
              {(['notes', 'summary', 'flashcards', 'quiz', 'mindmap', 'timeline', 'slides', 'chat'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveOutputTab(tab);
                    setSelectedMindmapNode(null);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black capitalize transition-all cursor-pointer ${
                    activeOutputTab === tab 
                      ? theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-white text-black shadow-xs' 
                      : theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {tab === 'mindmap' ? 'Mind Map' : tab === 'chat' ? 'Ask Lecture AI' : tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS SCROLLABLE FRAME */}
            <div className="flex-grow overflow-y-auto pr-1">
              
              {/* 1. NOTES TAB */}
              {activeOutputTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {([
                        { mode: 'quick', label: 'Quick Notes' },
                        { mode: 'detailed', label: 'Detailed Notes' },
                        { mode: 'academic', label: 'Academic Notes' },
                        { mode: 'exam', label: 'Exam Notes' },
                        { mode: 'bhailang', label: 'BhaiLang' }
                      ] as const).map(nOpt => (
                        <button
                          key={nOpt.mode}
                          onClick={() => setSelectedNotesMode(nOpt.mode)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                            selectedNotesMode === nOpt.mode ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-400'
                          }`}
                        >
                          {nOpt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setPdfExportData({ 
                          title: `${activeLecture.title} - ${selectedNotesMode} Notes`, 
                          data: activeLecture.notes?.[selectedNotesMode] || '' 
                        });
                        setShowPdfModal(true);
                      }}
                      disabled={!activeLecture.notes?.[selectedNotesMode]}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeLecture.notes?.[selectedNotesMode] ? (
                      <div className={`p-4 rounded-xl border font-sans leading-relaxed whitespace-pre-wrap text-[11.5px] ${
                        theme === 'dark' ? 'bg-[#121318] border-neutral-900 text-neutral-300' : 'bg-white border-gray-200 text-gray-700'
                      }`}>
                        {renderTextWithCitations(cleanMarkdownText(activeLecture.notes[selectedNotesMode]))}
                      </div>
                    ) : isGeneratingNotes ? (
                      <div className="py-16 flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5">
                        <BruteLoader size="md" message={`Generating ${selectedNotesMode} notes...`} />
                      </div>
                    ) : (
                      <div className="text-center py-16 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5 p-6 space-y-4">
                        <FileText className="h-10 w-10 text-neutral-600 mx-auto animate-pulse" />
                        <h4 className="text-xs font-bold text-neutral-400">Notes for this mode have not been generated yet.</h4>
                        <button
                          onClick={() => triggerGenerateNotes(selectedNotesMode)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          Generate {selectedNotesMode} Notes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. SUMMARY TAB */}
              {activeOutputTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none max-w-full">
                      {([
                        { mode: 'quick_revision', label: 'Quick Revision' },
                        { mode: 'detailed_notes', label: 'Detailed Notes' },
                        { mode: 'executive_summary', label: 'Executive Summary' },
                        { mode: 'beginner_friendly', label: 'Beginner Friendly' },
                        { mode: 'academic_format', label: 'Academic Format' },
                        { mode: 'bhailang', label: 'BhaiLang' }
                      ] as const).map(sf => (
                        <button
                          key={sf.mode}
                          onClick={() => setSelectedSummaryMode(sf.mode)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase whitespace-nowrap ${
                            selectedSummaryMode === sf.mode ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-400'
                          }`}
                        >
                          {sf.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setPdfExportData({ 
                          title: `${activeLecture.title} - Summary (${selectedSummaryMode})`, 
                          data: activeLecture.summaries?.[selectedSummaryMode] || '' 
                        });
                        setShowPdfModal(true);
                      }}
                      disabled={!activeLecture.summaries?.[selectedSummaryMode]}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {activeLecture.summaries?.[selectedSummaryMode] ? (
                      <div className="space-y-4 animate-fade-in">
                        {(() => {
                          const sections = parseSummaryIntoSections(activeLecture.summaries[selectedSummaryMode]);
                          
                          const allSections = [
                            { key: 'overview', label: 'Overview', content: sections.overview },
                            { key: 'keyConcepts', label: 'Key Concepts', content: sections.keyConcepts },
                            { key: 'importantDefinitions', label: 'Important Definitions', content: sections.importantDefinitions },
                            { key: 'examples', label: 'Examples', content: sections.examples },
                            { key: 'applications', label: 'Applications', content: sections.applications },
                            { key: 'commonMistakes', label: 'Common Mistakes', content: sections.commonMistakes },
                            { key: 'revisionNotes', label: 'Revision Notes', content: sections.revisionNotes },
                            { key: 'examQuestions', label: 'Exam Questions', content: sections.examQuestions },
                            { key: 'keyTakeaways', label: 'Key Takeaways', content: sections.keyTakeaways },
                            { key: 'oneMinuteRevision', label: 'One Minute Revision', content: sections.oneMinuteRevision }
                          ];

                          const filteredSections = allSections.filter(sec => {
                            if (!sec.content || sec.content.trim().length === 0) return false;
                            
                            if (selectedSummaryMode === 'quick_revision') {
                              return ['revisionNotes', 'commonMistakes', 'keyTakeaways', 'oneMinuteRevision'].includes(sec.key);
                            } else if (selectedSummaryMode === 'detailed_notes') {
                              return ['overview', 'keyConcepts', 'examples', 'applications', 'importantDefinitions'].includes(sec.key);
                            } else if (selectedSummaryMode === 'executive_summary') {
                              return ['overview', 'applications', 'keyTakeaways'].includes(sec.key);
                            } else if (selectedSummaryMode === 'beginner_friendly') {
                              return ['keyConcepts', 'examples', 'oneMinuteRevision'].includes(sec.key);
                            } else if (selectedSummaryMode === 'academic_format') {
                              return ['overview', 'keyConcepts', 'importantDefinitions', 'applications'].includes(sec.key);
                            }
                            return true;
                          });

                          return filteredSections.map((sec, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${
                              theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
                            }`}>
                              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">{sec.label}</h4>
                              <p className="text-[11.5px] mt-2 text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                {renderTextWithCitations(cleanMarkdownText(sec.content))}
                              </p>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : isGeneratingSummary ? (
                      <div className="py-16 flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5">
                        <BruteLoader size="md" message={`Generating ${selectedSummaryMode.replace('_', ' ')} summary...`} />
                      </div>
                    ) : (
                      <div className="text-center py-16 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5 p-6 space-y-4">
                        <FileText className="h-10 w-10 text-neutral-600 mx-auto animate-pulse" />
                        <h4 className="text-xs font-bold text-neutral-400">Summary for this mode has not been generated yet.</h4>
                        <button
                          onClick={() => triggerGenerateSummary(selectedSummaryMode)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          Generate Summary
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. FLASHCARDS TAB */}
              {activeOutputTab === 'flashcards' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none max-w-full">
                      {(['All', 'Basic Recall', 'Concept Understanding', 'Application Based'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedFlashcardCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase whitespace-nowrap ${
                            selectedFlashcardCategory === cat ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-400'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setPdfExportData({ title: `${activeLecture.title} - Flashcards`, data: activeLecture.flashcards || [] });
                        setShowPdfModal(true);
                      }}
                      disabled={!activeLecture.flashcards || activeLecture.flashcards.length === 0 || !activeLecture.flashcards.some((c: any) => c.category)}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeLecture.flashcards && activeLecture.flashcards.length > 0 && activeLecture.flashcards.some((c: any) => c.category) ? (
                      <>
                        {(() => {
                          const filteredCards = activeLecture.flashcards.filter(
                            (c: any) => selectedFlashcardCategory === 'All' || c.category === selectedFlashcardCategory
                          );

                          if (filteredCards.length === 0) {
                            return (
                              <div className="text-center py-12 text-neutral-500 font-mono text-[11px] border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl p-6 bg-gray-50/10 dark:bg-neutral-900/5">
                                No flashcards in category: {selectedFlashcardCategory}
                              </div>
                            );
                          }

                          return filteredCards.map((f: any, i: number) => (
                            <div key={i} className={`p-4.5 rounded-xl border font-sans space-y-2 ${
                              theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between text-[10px] font-bold font-mono">
                                <span className="text-indigo-400">Q. CARD {i + 1}</span>
                                <span className="text-neutral-500 uppercase tracking-widest">{f.category || 'Concept'}</span>
                              </div>
                              <div className="text-xs font-black">{renderTextWithCitations(cleanMarkdownText(f.q))}</div>
                              <div className={`text-[11.5px] pt-2 border-t border-neutral-900/20 ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                {renderTextWithCitations(cleanMarkdownText(f.a))}
                              </div>
                            </div>
                          ));
                        })()}

                        {/* Generate More Button */}
                        <div className="pt-4 flex justify-center">
                          {isGeneratingFlashcards ? (
                            <BruteLoader size="sm" message="Generating 10 more flashcards..." />
                          ) : (
                            <button
                              onClick={triggerGenerateMoreFlashcards}
                              className="px-5 py-2.5 rounded-lg border border-indigo-500/25 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-bold transition-all focus:outline-none cursor-pointer"
                            >
                              Generate 10 More Flashcards
                            </button>
                          )}
                        </div>
                      </>
                    ) : isGeneratingFlashcards ? (
                      <div className="py-16 flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5">
                        <BruteLoader size="md" message="Generating comprehensive flashcard deck..." />
                      </div>
                    ) : (
                      <div className="text-center py-16 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5 p-6 space-y-4">
                        <Brain className="h-10 w-10 text-neutral-600 mx-auto animate-pulse" />
                        <h4 className="text-xs font-bold text-neutral-400">Flashcards have not been generated yet.</h4>
                        <button
                          onClick={triggerGenerateFlashcards}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          Generate Flashcard Deck
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. QUIZ TAB */}
              {activeOutputTab === 'quiz' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none max-w-full">
                      {([
                        { difficulty: 'easy', label: 'Easy' },
                        { difficulty: 'medium', label: 'Medium' },
                        { difficulty: 'hard', label: 'Hard' },
                        { difficulty: 'scenario', label: 'Scenario' },
                        { difficulty: 'application', label: 'Application' }
                      ] as const).map(dOpt => (
                        <button
                          key={dOpt.difficulty}
                          onClick={() => {
                            setSelectedQuizDifficulty(dOpt.difficulty);
                            setActiveQuizQuestionIdx(0);
                            setSelectedQuizAnswerIdx(null);
                            setIsQuizRevealed(false);
                            setQuizScore(0);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase whitespace-nowrap ${
                            selectedQuizDifficulty === dOpt.difficulty ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-400'
                          }`}
                        >
                          {dOpt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setPdfExportData({ title: `${activeLecture.title} - Quiz`, data: activeLecture.quiz || [] });
                        setShowPdfModal(true);
                      }}
                      disabled={!activeLecture.quiz || activeLecture.quiz.length === 0 || !activeLecture.quiz.some((q: any) => q.difficulty)}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  {activeLecture.quiz && activeLecture.quiz.length > 0 && activeLecture.quiz.some((q: any) => q.difficulty) ? (
                    <div className="space-y-4">
                      {(() => {
                        const filteredQuestions = activeLecture.quiz.filter((q: any) => q.difficulty === selectedQuizDifficulty);

                        if (filteredQuestions.length === 0) {
                          return (
                            <div className="text-center py-16 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5 p-6 space-y-4">
                              <HelpCircle className="h-10 w-10 text-neutral-600 mx-auto animate-pulse" />
                              <h4 className="text-xs font-bold text-neutral-400">No questions of this type generated yet.</h4>
                              <button
                                onClick={triggerGenerateMoreQuiz}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                              >
                                Generate Questions
                              </button>
                            </div>
                          );
                        }

                        const activeQuestion = filteredQuestions[activeQuizQuestionIdx];

                        return (
                          <div className="space-y-4 animate-fade-in">
                            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'}`}>
                              <div className="text-[10px] font-black text-indigo-400 font-mono uppercase">
                                QUESTION {activeQuizQuestionIdx + 1} of {filteredQuestions.length} ({selectedQuizDifficulty})
                              </div>
                              <h4 className="text-xs font-bold font-sans mt-2 leading-relaxed">
                                {renderTextWithCitations(cleanMarkdownText(activeQuestion.question))}
                              </h4>
                              
                              <div className="grid grid-cols-1 gap-2 mt-4">
                                {activeQuestion.options.map((opt: string, optIdx: number) => {
                                  const isSelected = selectedQuizAnswerIdx === optIdx;
                                  const isCorrect = optIdx === activeQuestion.correctAnswer;
                                  
                                  let btnClass = "";
                                  if (isQuizRevealed) {
                                      if (isCorrect) {
                                        btnClass = theme === 'dark' 
                                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" 
                                          : "border-green-500 bg-green-50 text-green-700";
                                      } else if (isSelected) {
                                        btnClass = theme === 'dark' 
                                          ? "border-red-500 bg-red-500/10 text-red-400" 
                                          : "border-red-400 bg-red-50 text-red-700";
                                      } else {
                                        btnClass = theme === 'dark' 
                                          ? "border-neutral-900 bg-neutral-950/20 text-neutral-500" 
                                          : "border-gray-200 bg-gray-50 text-gray-400";
                                      }
                                  } else {
                                      if (isSelected) {
                                        btnClass = theme === 'dark' 
                                          ? "border-indigo-500 bg-indigo-500/10 text-white" 
                                          : "border-indigo-600 bg-indigo-50 text-indigo-700";
                                      } else {
                                        btnClass = theme === 'dark' 
                                          ? "border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:bg-neutral-900 hover:text-white" 
                                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900";
                                      }
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => !isQuizRevealed && setSelectedQuizAnswerIdx(optIdx)}
                                      className={`rounded-lg py-2.5 px-3.5 text-left text-xs font-semibold border outline-none transition-all cursor-pointer ${btnClass}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {isQuizRevealed && (
                                <div className="mt-4 pt-3 border-t border-dashed border-neutral-900 text-[11px] text-neutral-400">
                                  <span className="font-mono text-[9px] font-bold text-indigo-400 block mb-1">COGNITIVE ANALYSIS:</span>
                                  {renderTextWithCitations(cleanMarkdownText(activeQuestion.explanation))}
                                  {activeQuestion.sourceCitation && (
                                    <div className="mt-2 text-[10px] font-bold text-indigo-300 font-mono">
                                      Citation: {activeQuestion.sourceCitation}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex justify-between items-center mt-5 pt-3 border-t border-neutral-900/30">
                                {!isQuizRevealed ? (
                                  <button
                                    disabled={selectedQuizAnswerIdx === null}
                                    onClick={() => setIsQuizRevealed(true)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold disabled:opacity-30 cursor-pointer"
                                  >
                                    Verify Choice
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setIsQuizRevealed(false);
                                      setSelectedQuizAnswerIdx(null);
                                      setActiveQuizQuestionIdx(prev => (prev + 1) % filteredQuestions.length);
                                    }}
                                    className="px-4 py-2 bg-white text-black hover:bg-neutral-100 rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    Next question
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Generate More Questions Button */}
                            <div className="flex justify-center pt-2">
                              {isGeneratingQuiz ? (
                                <BruteLoader size="sm" message={`Generating 10 more ${selectedQuizDifficulty} questions...`} />
                              ) : (
                                <button
                                  onClick={triggerGenerateMoreQuiz}
                                  className="px-5 py-2.5 rounded-lg border border-indigo-500/25 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-bold transition-all focus:outline-none cursor-pointer"
                                >
                                  Generate 10 More {selectedQuizDifficulty} Questions
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : isGeneratingQuiz ? (
                    <div className="py-16 flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5">
                      <BruteLoader size="md" message="Generating comprehensive 40-question quiz..." />
                    </div>
                  ) : (
                    <div className="text-center py-16 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5 p-6 space-y-4">
                      <HelpCircle className="h-10 w-10 text-neutral-600 mx-auto animate-pulse" />
                      <h4 className="text-xs font-bold text-neutral-400">Quiz has not been generated yet.</h4>
                      <button
                        onClick={triggerGenerateQuiz}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Generate 40-Question Quiz
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 5. MIND MAP TAB */}
              {activeOutputTab === 'mindmap' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase">Interactive Concept Net</span>
                    <button
                      onClick={() => {
                        setPdfExportData({ title: `${activeLecture.title} - Concept Map`, data: activeLecture.keyConcepts });
                        setShowPdfModal(true);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  <div className={`h-64 rounded-xl border overflow-hidden relative ${
                    theme === 'dark' ? 'bg-[#0d0e12] border-neutral-900' : 'bg-white border-gray-200'
                  }`}>
                    {activeLecture.keyConcepts && activeLecture.keyConcepts.length > 0 ? (
                      <>
                        <svg className="w-full h-full">
                          <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                              <path d="M 0 0 L 10 5 L 0 10 z" fill={theme === 'dark' ? '#818cf8' : '#4f46e5'} />
                            </marker>
                          </defs>

                          {activeLecture.keyConcepts.map((node: any, idx: number) => {
                            if (node.parent) {
                              const parentNode = activeLecture.keyConcepts.find((n: any) => n.id === node.parent);
                              if (parentNode) {
                                const x1 = parseFloat(parentNode.x);
                                const y1 = parseFloat(parentNode.y);
                                const x2 = parseFloat(node.x);
                                const y2 = parseFloat(node.y);
                                const midX = (x1 + x2) / 2;
                                const midY = (y1 + y2) / 2;
                                
                                const getRelationshipType = (n: any) => {
                                  if (n.parent === 'root') return 'hierarchy';
                                  if (n.group === 'math' || n.formula) return 'dependency';
                                  if (n.group === 'applications' || n.label.toLowerCase().includes('effect') || n.label.toLowerCase().includes('result')) return 'cause_effect';
                                  if (n.group === 'concepts') return 'comparison';
                                  return 'workflow';
                                };
                                const rel = getRelationshipType(node);

                                return (
                                  <g key={idx}>
                                    <line
                                      x1={`${parentNode.x}%`}
                                      y1={`${parentNode.y}%`}
                                      x2={`${node.x}%`}
                                      y2={`${node.y}%`}
                                      stroke={theme === 'dark' ? '#4f46e5' : '#818cf8'}
                                      strokeWidth="1.5"
                                      markerEnd="url(#arrow)"
                                    />
                                    <text
                                      x={`${midX}%`}
                                      y={`${midY}%`}
                                      fill="#818cf8"
                                      fontSize="7px"
                                      textAnchor="middle"
                                      className="font-mono bg-[#0d0e12] select-none"
                                    >
                                      {rel.toUpperCase()}
                                    </text>
                                  </g>
                                );
                              }
                            }
                            return null;
                          })}

                          {activeLecture.keyConcepts.map((node: any, idx: number) => (
                            <g key={idx} onClick={() => setSelectedMindmapNode(node)} className="cursor-pointer group">
                              <circle
                                cx={`${node.x}%`}
                                cy={`${node.y}%`}
                                r={node.id === 'root' ? 14 : 9}
                                fill={getNodeColor(node, selectedMindmapNode?.id === node.id)}
                                className="transition-all hover:scale-115"
                              />
                              <text
                                x={`${node.x}%`}
                                y={`${node.y - 4}%`}
                                textAnchor="middle"
                                fill={theme === 'dark' ? '#d1d5db' : '#1e293b'}
                                fontSize="9px"
                                fontWeight="bold"
                                className="font-mono select-none"
                              >
                                {node.label}
                              </text>
                            </g>
                          ))}
                        </svg>
                        <div className="absolute bottom-2 left-2 text-[8px] font-mono text-neutral-500 bg-neutral-950/45 p-1 rounded">
                          Click nodes to view detail drawers.
                        </div>
                      </>
                    ) : isGeneratingMindmap ? (
                      <div className="h-full min-h-[160px] flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50/10 dark:bg-neutral-900/5">
                        <BruteLoader size="md" message="Synthesizing Concept Mind Map..." />
                      </div>
                    ) : (
                      <div className="h-full min-h-[160px] flex items-center justify-center text-[11px] text-neutral-500 font-mono border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl p-6 bg-gray-50/10 dark:bg-neutral-900/5">
                        Concept Map has not been generated yet.
                      </div>
                    )}
                  </div>

                  {selectedMindmapNode && (
                    <div className={`p-4 rounded-xl border text-left space-y-3.5 animate-fade-in ${
                      theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">
                          {selectedMindmapNode.label}
                        </h4>
                        <button 
                          onClick={() => setSelectedMindmapNode(null)}
                          className={`text-xs font-bold cursor-pointer ${
                            theme === 'dark' ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-900'
                          }`}
                        >
                          &times;
                        </button>
                      </div>
                      
                      <div className={`text-[11.5px] leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        <strong className="text-indigo-400 block text-[9.5px] uppercase font-mono tracking-wider">Definition & Explanation</strong>
                        {renderTextWithCitations(cleanMarkdownText(selectedMindmapNode.desc || selectedMindmapNode.explanation || 'Provides logical synthesis for this section.'))}
                      </div>
                      
                      {selectedMindmapNode.examples && (
                        <div className={`text-[11.5px] leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          <strong className="text-indigo-400 block text-[9.5px] uppercase font-mono tracking-wider">Examples & Analogies</strong>
                          {renderTextWithCitations(cleanMarkdownText(selectedMindmapNode.examples))}
                        </div>
                      )}

                      {selectedMindmapNode.formula && (
                        <div className={`text-[11.5px] leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          <strong className="text-indigo-400 block text-[9.5px] uppercase font-mono tracking-wider">Equations or Theories</strong>
                          <code className={`block p-2 rounded text-[10px] font-mono mt-1 text-orange-400 border ${
                            theme === 'dark' ? 'bg-neutral-950/50 border-neutral-900' : 'bg-gray-50 border-gray-200'
                          }`}>
                            {selectedMindmapNode.formula}
                          </code>
                        </div>
                      )}

                      {selectedMindmapNode.applications && (
                        <div className={`text-[11.5px] leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          <strong className="text-indigo-400 block text-[9.5px] uppercase font-mono tracking-wider">Applications & Use Cases</strong>
                          {renderTextWithCitations(cleanMarkdownText(selectedMindmapNode.applications))}
                        </div>
                      )}

                      {selectedMindmapNode.examImportance && (
                        <div className={`text-[11.5px] leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          <strong className="text-indigo-400 block text-[9.5px] uppercase font-mono tracking-wider">Exam Importance</strong>
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold mt-1 ${
                            selectedMindmapNode.examImportance.toLowerCase().includes('high')
                              ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                              : selectedMindmapNode.examImportance.toLowerCase().includes('medium')
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            🎯 {selectedMindmapNode.examImportance}
                          </span>
                        </div>
                      )}

                      <div className="text-[9px] font-mono text-neutral-500 pt-1.5 border-t border-neutral-900/30">
                        Reference: {selectedMindmapNode.sourceCitation || `[Source: ${activeLecture.title}, Concept Net]`}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. TIMELINE TAB */}
              {activeOutputTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase">Chronological milestones</span>
                    <button
                      onClick={() => {
                        setPdfExportData({ title: `${activeLecture.title} - Timeline`, data: activeLecture.timeline });
                        setShowPdfModal(true);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {activeLecture.timeline && activeLecture.timeline.length > 0 ? (
                      <div className={`relative ml-4 py-2 space-y-5 border-l ${
                        theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'
                      }`}>
                        {activeLecture.timeline.map((event: any, idx: number) => (
                          <div key={idx} className="relative pl-6">
                            <span 
                              onClick={() => handleTimelineTimestampClick(event.time)}
                              className={`absolute -left-2.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 border-2 text-[8.5px] font-mono font-bold text-indigo-300 cursor-pointer hover:bg-indigo-500 hover:text-white transition-all shadow-md ${
                                theme === 'dark' ? 'border-[#0a0b0e]' : 'border-[#FAF9F5]'
                              }`}
                            >
                              {event.time}
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-indigo-400">{event.title}</h4>
                              <p className={`text-[11px] leading-relaxed ${
                                theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'
                              }`}>{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-neutral-500 font-mono text-[10.5px]">No timeline segments parsed.</div>
                    )}
                  </div>
                </div>
              )}

              {/* 7. SLIDES TAB */}
              {activeOutputTab === 'slides' && (
                <PresentationWorkspace
                  theme={theme}
                  apiKey={import.meta.env.VITE_GEMINI_API_KEY || ''}
                  contentSourceText={activeLecture.transcript || activeLecture.summary || ''}
                  initialBlueprint={activeLecture.presentationBlueprint}
                  title={activeLecture.title}
                  onUpdateSlides={async (updatedBlueprint) => {
                    const uid = auth.currentUser?.uid;
                    if (!uid) return;
                    const docRef = doc(db, 'users', uid, 'lectures', activeLecture.id);
                    await updateDoc(docRef, { presentationBlueprint: updatedBlueprint });
                  }}
                />
              )}

              {/* 8. LECTURE CHAT TAB */}
              {activeOutputTab === 'chat' && (
                <div className="flex flex-col h-[520px] border border-neutral-900 rounded-xl overflow-hidden bg-neutral-950/30 animate-fade-in">
                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {(!activeLecture.chatHistory || activeLecture.chatHistory.length === 0) ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 select-none">
                        <Brain className="h-8 w-8 text-indigo-500 animate-pulse" />
                        <h4 className="text-xs font-bold text-neutral-300">Ask Lecture AI</h4>
                        <p className="text-[10px] text-neutral-500 max-w-xs leading-relaxed font-semibold">
                          Query the cognitive grounding engine about the details of this lecture. Ask questions, clarify concepts, or request summary bullets.
                        </p>
                      </div>
                    ) : (
                      activeLecture.chatHistory.map((msg: any, idx: number) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed shadow-sm ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : theme === 'dark'
                                ? 'bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-bl-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                          }`}>
                            <div className="text-[9px] font-bold font-mono text-indigo-400 mb-1">
                              {msg.sender === 'user' ? 'STUDENT' : 'PROFESSOR AI'}
                            </div>
                            <div className="whitespace-pre-wrap">
                              {renderTextWithCitations(msg.text)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className={`rounded-xl p-3 text-xs shadow-sm flex items-center gap-2 ${
                          theme === 'dark' ? 'bg-neutral-950 border border-neutral-800' : 'bg-white border border-gray-200'
                        }`}>
                          <Cpu className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                          <span className="text-neutral-500 font-mono text-[9px] animate-pulse">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Preset prompts for Ask Lecture AI */}
                  <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-none pt-2 border-t border-neutral-900/40">
                    {[
                      { label: 'Explain Chapter 2', prompt: 'Explain chapter 2' },
                      { label: 'What formula was discussed?', prompt: 'What formula was discussed?' },
                      { label: 'Give Revision Notes', prompt: 'Give revision notes' },
                      { label: 'Create 5 Difficult Questions', prompt: 'Create 5 difficult questions' },
                      { label: 'Translate in Hindi', prompt: 'Translate in Hindi' }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessageText(p.prompt)}
                        disabled={isChatLoading}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all whitespace-nowrap cursor-pointer ${
                          theme === 'dark'
                            ? 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-neutral-900 bg-neutral-950/70 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a question about this lecture..."
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                      disabled={isChatLoading}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* PDF CUSTOMIZATION MODAL */}
        {showPdfModal && pdfExportData && (
          <div className="fixed inset-0 bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
            <div className={`rounded-2xl max-w-md w-full border p-6 space-y-4 shadow-2xl relative ${
              theme === 'dark' ? 'bg-[#0d0e12] border-neutral-800 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900/40">
                <h3 className="font-sans font-black text-sm flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span>Configure PDF Document Theme</span>
                </h3>
                <button 
                  onClick={() => { setShowPdfModal(false); setPdfExportData(null); }}
                  className="text-neutral-500 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase font-mono">Select Document Theme</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(['academic', 'modern', 'corporate', 'dark'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedPdfTheme(t)}
                        className={`py-2 px-3 text-xs font-bold border rounded-lg cursor-pointer capitalize transition-all ${
                          selectedPdfTheme === t 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : theme === 'dark' ? 'border-neutral-800 text-neutral-400 hover:border-neutral-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {t} Style
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => { setShowPdfModal(false); setPdfExportData(null); }}
                    className="rounded-lg px-4 py-2 text-xs font-bold border border-neutral-800 text-neutral-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportPDFFile(pdfExportData.title, pdfExportData.data, selectedPdfTheme);
                      setShowPdfModal(false);
                      setPdfExportData(null);
                    }}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 text-xs font-bold cursor-pointer"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    );
  }

  // ----------------------------------------------------
  // STANDBY RECORDING DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-16">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/60 dark:border-neutral-800/65 pb-5">
        <div>
          <h1 className="font-sans font-extrabold text-2xl md:text-3.5xl tracking-tight text-gray-900 dark:text-neutral-50 flex items-center gap-2">
            <Mic className="h-7 w-7 text-indigo-500" />
            <span>Smart Lecture Capture</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-neutral-400 mt-1">
            Unpack and index speech models effortlessly using Google's High-Intensity Synthesis Engine.
          </p>
        </div>

        {/* Sync AI Status indicator */}
        <div className="flex items-center gap-2">
          {aiStatus === 'idle' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-neutral-800/50 px-3 py-1.5 text-xs font-semibold text-gray-500 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              SYSTEM SLEEP
            </span>
          )}
          {aiStatus === 'recording_transcription' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 dark:bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 font-mono animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              LIVE DECODING
            </span>
          )}
          {aiStatus === 'synthesizing' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-500 font-mono">
              <Cpu className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              ALIGNING RESEARCH GRAPH...
            </span>
          )}
          {aiStatus === 'completed' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500 font-mono">
              <CheckCircle className="h-3.5 w-3.5" />
              WORKSPACE RESOLVED!
            </span>
          )}
        </div>
      </div>

      {micError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2">
          <MicOff className="h-4 w-4" />
          <span>{micError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6.5">
        
        {/* LEFT COLUMN: Large animated Mic & Control panels */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`rounded-2xl border p-6.5 text-center flex flex-col justify-center items-center min-h-[460px] relative overflow-hidden shadow-md ${
            theme === 'dark' ? 'bg-[#121318] border-neutral-800' : 'bg-white border-gray-200'
          }`}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />

            <div className="space-y-6 relative z-10 w-full flex flex-col items-center">
              {recoverableLecture && (
                <div className={`w-full rounded-xl border p-4 text-left space-y-3 relative z-25 ${
                  theme === 'dark'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                      ⚠️ Crashed Session Discovered
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await deleteRecordingBackup(recoverableLecture.id);
                          setRecoverableLecture(null);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs focus:outline-none cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold leading-normal">
                    We saved your previous draft of <strong>"{recoverableLecture.title}"</strong>. Click Recover to process it now.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const chunks = await getRecordingChunks(recoverableLecture.id);
                          if (chunks && chunks.length > 0) {
                            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                            setAiStatus('synthesizing');
                            await onSaveCapture(
                              recoverableLecture.title,
                              recoverableLecture.subject,
                              recoverableLecture.duration,
                              audioBlob,
                              recoverableLecture.id
                            );
                            await deleteRecordingBackup(recoverableLecture.id);
                            setRecoverableLecture(null);
                          } else {
                            alert("No backup recording chunks found in database.");
                            await deleteRecordingBackup(recoverableLecture.id);
                            setRecoverableLecture(null);
                          }
                        } catch (err) {
                          console.error('Failed to recover recording:', err);
                          setAiStatus('idle');
                        }
                      }}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all text-center focus:outline-none cursor-pointer"
                    >
                      Recover Recording
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteRecordingBackup(recoverableLecture.id);
                          setRecoverableLecture(null);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center focus:outline-none cursor-pointer ${
                        theme === 'dark'
                          ? 'border-neutral-800 text-neutral-400 hover:bg-neutral-900/40'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
              
              {/* Lecture Title & Subject Settings Inputs */}
              <div className="w-full space-y-3 mb-2 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-mono">
                    Lecture Title
                  </label>
                  <input
                    type="text"
                    disabled={isRecording}
                    value={lectureTitle}
                    onChange={(e) => setLectureTitle(e.target.value)}
                    placeholder="Enter lecture title..."
                    className={`w-full rounded-xl border text-xs font-semibold p-3 focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-neutral-900/40 border-neutral-800 text-neutral-200 focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-black'
                    } ${isRecording ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-mono">
                    Subject Field
                  </label>
                  <select
                    disabled={isRecording}
                    value={lectureSubject}
                    onChange={(e) => setLectureSubject(e.target.value)}
                    className={`w-full rounded-xl border text-xs font-semibold p-3 focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-neutral-900/40 border-neutral-800 text-neutral-200 focus:border-indigo-500'
                        : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-black'
                    } ${isRecording ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="Economics">Economics</option>
                    <option value="General Science">General Science</option>
                  </select>
                </div>
              </div>

              {/* Dynamic glowing rotating microphone container */}
              <div className="relative">
                {isRecording && !isPaused && (
                  <>
                    <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-md animate-ping" />
                    <div className="absolute -inset-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 scale-102 animate-pulse" />
                  </>
                )}
                <button
                  disabled={aiStatus === 'synthesizing'}
                  onClick={isRecording ? handleStopCapture : handleStartCapture}
                  className={`h-24 w-24 rounded-full flex items-center justify-center transition-all shadow-xl focus:outline-none cursor-pointer ${
                    isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-black text-white dark:bg-white dark:text-black hover:scale-102'
                  }`}
                >
                  {isRecording ? <Mic className="h-10 w-10 animate-bounce" /> : <Mic className="h-10 w-10 text-current" />}
                </button>
              </div>

              {/* Status and Clock time ticker */}
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
                  {isRecording ? (isPaused ? 'Capture Paused' : 'Active Transmission') : 'Standby mode'}
                </div>
                <div className="text-4xl font-extrabold font-mono tracking-tight text-gray-900 dark:text-white flex items-center gap-1 justify-center">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span>{formatTime(seconds)}</span>
                </div>
              </div>

              {/* Action buttons controls Row */}
              <div className="flex gap-3 justify-center w-full">
                {!isRecording ? (
                  <button
                    onClick={handleStartCapture}
                    className="flex items-center gap-2 bg-indigo-500 text-white rounded-xl py-3 px-6 text-xs font-black hover:bg-indigo-600 transition-all shadow-md focus:outline-none cursor-pointer w-full justify-center"
                  >
                    <Play className="h-4 w-4" />
                    <span>START CAPTURING COURSE</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handlePauseCapture}
                      className="flex-1 py-3 px-4 rounded-lg bg-gray-100 font-sans text-xs font-bold text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                    <button
                      onClick={handleStopCapture}
                      className="flex-1 py-3 px-4 rounded-lg bg-red-500 font-sans text-xs font-bold text-white hover:bg-red-600 transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>Stop & Sync</span>
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* Past captured sessions list panel */}
          <div className={`rounded-2xl border p-5 space-y-4 ${
            theme === 'dark' ? 'bg-[#121318]/40 border-neutral-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                Capture Session history
              </span>
              <span className="text-[9px] font-bold text-indigo-400">
                {pastLectures.length} total sessions
              </span>
            </div>

            <div className="space-y-3 max-h-[190px] overflow-y-auto">
              {pastLectures.map((lec) => (
                <div 
                  key={lec.id} 
                  className={`flex items-center justify-between p-2.5 rounded-xl border border-dashed transition-all hover:bg-gray-50/5 cursor-pointer ${
                    theme === 'dark' ? 'border-neutral-800 text-neutral-300' : 'border-gray-200 text-gray-700'
                  }`}
                  onClick={() => setActiveLectureId && setActiveLectureId(lec.id)}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-400 mt-0.5">
                      <Bookmark className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-sans font-black truncate">{lec.title}</h4>
                      <p className="text-[9px] text-gray-500 mt-0.5">{lec.date} • {lec.duration}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-500" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMNS: Live Speech Decipher + AI Real-time Notes columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-[560px]">
            
            {/* Audio Input Monitor */}
            <div className={`rounded-2xl border p-5.5 flex flex-col justify-between h-full relative ${
              theme === 'dark' ? 'bg-[#121318] border-neutral-800' : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-4 flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRecording && !isPaused ? 'bg-indigo-400' : 'bg-gray-400'}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isRecording && !isPaused ? 'bg-indigo-500' : 'bg-gray-400'}`} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                      Audio Input Monitor
                    </span>
                  </div>
                  
                  {isRecording && !isPaused && (
                    <div className="flex items-center gap-1 font-mono text-[9px] text-indigo-400 animate-pulse">
                      <ListRestart className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                      <span>CAPTURING LIVE...</span>
                    </div>
                  )}
                </div>

                {/* Real-time Audio Visualizer container */}
                <div 
                  ref={visualizerRef}
                  className="h-10 flex items-center justify-center gap-1.5 px-3 border-y border-gray-100 dark:border-neutral-800/50 my-1"
                >
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      style={{ height: '8px' }}
                      className={`waveform-bar w-[3px] rounded-full transition-all duration-75 ${
                        isRecording && !isPaused
                          ? 'bg-gradient-to-t from-indigo-500 via-indigo-400 to-purple-400'
                          : 'bg-gray-200 dark:bg-neutral-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Live Input message box */}
                <div 
                  className="flex-1 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-neutral-900/40 p-3"
                >
                  {!isRecording ? (
                    <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 font-sans">
                      <MicOff className="h-8 w-8 mb-2 opacity-50 text-gray-400 dark:text-neutral-500" />
                      <p className="text-[11px] font-bold text-gray-700 dark:text-neutral-300">Microphone Standby</p>
                      <p className="text-[10px] text-gray-400 dark:text-neutral-500 max-w-[180px] leading-normal font-semibold mt-1">
                        Press 'Start Capturing' to begin capturing your lecture.
                      </p>
                    </div>
                  ) : isPaused ? (
                    <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 font-sans space-y-2 animate-fade-in">
                      <Pause className="h-8 w-8 text-amber-500 animate-pulse" />
                      <div>
                        <p className="text-[11px] font-bold text-amber-500">Capture Suspended</p>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 max-w-[180px] leading-normal font-semibold mt-1">
                          Audio input is paused. Press 'Resume' to continue capturing.
                        </p>
                      </div>
                    </div>
                  ) : aiStatus === 'synthesizing' ? (
                    <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 font-sans space-y-2">
                      <Cpu className="h-8 w-8 text-purple-400 animate-spin" />
                      <div>
                        <p className="text-[11px] font-bold text-purple-400 font-mono">Syncing Workspace...</p>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 max-w-[180px] leading-normal font-semibold mt-1">
                          Uploading raw capture payload to Azure storage nodes.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 font-sans space-y-3 animate-fade-in w-full h-full overflow-hidden">
                      {liveTranscript ? (
                        <div className="flex flex-col h-full w-full justify-between items-stretch text-left overflow-hidden">
                          {/* Live Transcript Header */}
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-neutral-800/40 shrink-0">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
                              Live Transcription (Decoded Real-time)
                            </span>
                          </div>
                          
                          {/* Scrollable transcript area */}
                          <div className="flex-1 overflow-y-auto pr-1 text-[13px] leading-relaxed font-sans text-neutral-700 dark:text-neutral-300 scrollbar-thin">
                            <p className="whitespace-pre-wrap">{liveTranscript}</p>
                            <div ref={transcriptEndRef} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="relative flex items-center justify-center">
                            <div className="absolute -inset-3 rounded-full bg-indigo-500/10 animate-ping" />
                            <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <Mic className="h-5 w-5 animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-indigo-400 animate-pulse font-mono uppercase tracking-wider">Listening...</p>
                            <p className="text-[10px] text-gray-400 dark:text-neutral-400 leading-normal font-semibold max-w-[200px]">
                              Waiting for audio input. Speak to see real-time transcription...
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Info wrapper */}
              <div className="border-t border-neutral-800/10 dark:border-neutral-800/40 pt-4 mt-4 space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block font-mono">
                  Audio Stream parameters
                </span>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono font-semibold">
                  <span className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${isRecording && !isPaused ? 'bg-indigo-400' : 'bg-gray-500'}`} />
                    Codec: webm/audio
                  </span>
                  <span>
                    Sample Rate: 48kHz
                  </span>
                </div>
              </div>

            </div>

            {/* Cognitive Workspace Outline */}
            <div className={`rounded-2xl border p-5.5 flex flex-col justify-between h-full overflow-hidden ${
              theme === 'dark' ? 'bg-[#121318] border-neutral-800' : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-4 flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                    Cognitive Workspace Outline
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-left mt-2">
                  <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                    Once synced, NoteIT AI will automatically construct your course workspace using the complete audio recording:
                  </p>
                  
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5">
                      <div className="h-4.5 w-4.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold flex-shrink-0 mt-0.5">1</div>
                      <div className="min-w-0">
                        <h5 className="text-[10px] font-bold text-gray-700 dark:text-neutral-300">Detailed Lecture Transcript</h5>
                        <p className="text-[9px] text-gray-400 leading-normal font-semibold">Complete text translation with precise timeline bookmarking.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-4.5 w-4.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold flex-shrink-0 mt-0.5">2</div>
                      <div className="min-w-0">
                        <h5 className="text-[10px] font-bold text-gray-700 dark:text-neutral-300">Structured Study Notes</h5>
                        <p className="text-[9px] text-gray-400 leading-normal font-semibold">Definitions, key topics, equations, and explanatory analogies.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-4.5 w-4.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold flex-shrink-0 mt-0.5">3</div>
                      <div className="min-w-0">
                        <h5 className="text-[10px] font-bold text-gray-700 dark:text-neutral-300">Active Recall Flashcards</h5>
                        <p className="text-[9px] text-gray-400 leading-normal font-semibold">Self-testing card decks automatically generated from topics.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-4.5 w-4.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold flex-shrink-0 mt-0.5">4</div>
                      <div className="min-w-0">
                        <h5 className="text-[10px] font-bold text-gray-700 dark:text-neutral-300">MCQ Practice Quizzes</h5>
                        <p className="text-[9px] text-gray-400 leading-normal font-semibold">Conceptual testing quizzes with in-depth explanations.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-4.5 w-4.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold flex-shrink-0 mt-0.5">5</div>
                      <div className="min-w-0">
                        <h5 className="text-[10px] font-bold text-gray-700 dark:text-neutral-300">Dynamic Relationship Mind Map</h5>
                        <p className="text-[9px] text-gray-400 leading-normal font-semibold">A 2D graphical representation of topics and relationships.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Synthesis status box */}
              <div className="border-t border-neutral-800/10 dark:border-neutral-800/40 pt-4 mt-4 space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block font-mono">
                  Synthesis Gateway Status
                </span>
                <div className="text-[10px] text-gray-400 font-serif leading-relaxed bg-[#f9fafc]/40 dark:bg-neutral-950/20 p-3 rounded-xl flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                  <span className="font-sans font-semibold">
                    {isRecording ? "Queueing audio payload for high-intensity compilation..." : "Waiting for active audio feed capture to sync."}
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
