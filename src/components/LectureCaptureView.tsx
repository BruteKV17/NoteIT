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
import pptxgen from 'pptxgenjs';
import BruteLoader from './BruteLoader';
import { PageId } from '../types';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

interface LectureCaptureViewProps {
  onSaveCapture: (title: string, subject: string, duration: string, audioBlob: Blob) => Promise<void>;
  setActivePage: (page: PageId) => void;
  theme: 'light' | 'dark';
  lectures?: any[];
  activeLectureId: string | null;
  setActiveLectureId: (id: string | null) => void;
  notes?: any[];
}

interface StructuredSummary {
  executiveOverview: string;
  keyConcepts: string;
  detailedExplanation: string;
  examples: string;
  formulas: string;
  commonMistakes: string;
  revisionNotes: string;
  examQuestions: string;
  realWorldApplications: string;
  quickRecap: string;
}

export default function LectureCaptureView({
  onSaveCapture,
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

  // Active review workspace states
  const [activeOutputTab, setActiveOutputTab] = useState<'notes' | 'summary' | 'flashcards' | 'quiz' | 'mindmap' | 'timeline' | 'slides' | 'chat'>('notes');
  const [localSlides, setLocalSlides] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [notesFormat, setNotesFormat] = useState<'academic' | 'executive' | 'revision'>('academic');
  const [summaryFormat, setSummaryFormat] = useState<'academic' | 'revision' | 'executive' | 'beginner'>('academic');
  const [flashcardsFormat, setFlashcardsFormat] = useState<'basic' | 'advanced'>('basic');
  const [quizFormat, setQuizFormat] = useState<'mcq' | 'subjective' | 'case'>('mcq');
  
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

  // PPTX Export Modal & Settings
  const [showPptModal, setShowPptModal] = useState(false);
  const [pptTheme, setPptTheme] = useState<'academic' | 'corporate' | 'startup' | 'cyber' | 'minimal' | 'glass'>('academic');
  const [pptLength, setPptLength] = useState<5 | 10 | 15>(10);
  const [pptDetailedMode, setPptDetailedMode] = useState<boolean>(false);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);

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
    };
  }, []);

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

  const handleStartCapture = async () => {
    setMicError(null);
    chunksRef.current = [];
    
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
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const durationStr = formatTime(secondsRef.current);
        setAiStatus('synthesizing');
        try {
          await onSaveCapture(lectureTitle, lectureSubject, durationStr, audioBlob);
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
    } else {
      mediaRecorderRef.current.pause();
      cleanupAudio();
      resetWaveform();
      setIsPaused(true);
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
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 cursor-pointer hover:bg-indigo-650 hover:text-white transition-all ml-1 select-none"
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
      executiveOverview: '',
      keyConcepts: '',
      detailedExplanation: '',
      examples: '',
      formulas: '',
      commonMistakes: '',
      revisionNotes: '',
      examQuestions: '',
      realWorldApplications: '',
      quickRecap: ''
    };

    if (!summaryText) return sections;

    const patterns = {
      executiveOverview: /executive\s+overview|introduction/i,
      keyConcepts: /key\s+concepts/i,
      detailedExplanation: /detailed\s+explanation|important\s+topics/i,
      examples: /examples/i,
      formulas: /formulas/i,
      commonMistakes: /common\s+mistakes/i,
      revisionNotes: /revision\s+notes/i,
      examQuestions: /exam\s+questions/i,
      realWorldApplications: /real\s+world\s+applications|applications/i,
      quickRecap: /quick\s+recap|key\s+takeaways/i
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
          sections.executiveOverview += (sections.executiveOverview ? '\n' : '') + line;
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
      element.classList.add('bg-indigo-650', 'text-white', 'scale-110');
      setTimeout(() => {
        element.classList.remove('bg-indigo-650', 'text-white', 'scale-110');
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
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 cursor-pointer hover:bg-indigo-650 hover:text-white transition-all mr-1"
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
          <h2>1. Executive Overview</h2>
          <p>${sections.executiveOverview.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>2. Key Concepts</h2>
          <p>${sections.keyConcepts.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>3. Detailed Explanation</h2>
          <p>${sections.detailedExplanation.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>4. Examples</h2>
          <p>${sections.examples.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>5. Formulas</h2>
          <p>${sections.formulas.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>6. Common Mistakes</h2>
          <p>${sections.commonMistakes.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>7. Revision Notes</h2>
          <p>${sections.revisionNotes.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>8. Exam Questions</h2>
          <p>${sections.examQuestions.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>9. Real World Applications</h2>
          <p>${sections.realWorldApplications.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>10. Quick Recap</h2>
          <p>${sections.quickRecap.replace(/\n/g, '<br/>')}</p>
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

  // Active review workspace PPT/Chat logic helpers
  const getThemeColorHex = (theme: string, type: 'accent' | 'primary' | 'bg' | 'cardBg') => {
    const themeColors = {
      academic: { bg: "#0f172a", text: "#ffffff", primary: "#e2e8f0", accent: "#d97706", cardBg: "#1e293b" },
      corporate: { bg: "#1e293b", text: "#ffffff", primary: "#cbd5e1", accent: "#2563eb", cardBg: "#0f172a" },
      startup: { bg: "#09090b", text: "#ffffff", primary: "#f4f4f5", accent: "#8b5cf6", cardBg: "#18181b" },
      cyber: { bg: "#050508", text: "#ffffff", primary: "#39ff14", accent: "#ff007f", cardBg: "#0d0e12" },
      minimal: { bg: "#ffffff", text: "#1e293b", primary: "#0f172a", accent: "#000000", cardBg: "#f8fafc" },
      glass: { bg: "#18181b", text: "#ffffff", primary: "#f4f4f5", accent: "#06b6d4", cardBg: "#27272a" }
    };
    const c = (themeColors as any)[theme] || themeColors.academic;
    return c[type];
  };

  const auditPPTQuality = (slides: any[]) => {
    if (!slides || slides.length === 0) {
      return { score: 0, narrativeFlow: 0, visualDensity: 0, imageRelevance: 0, completeness: 0, redundancy: 0, citations: 0 };
    }

    let flowScore = 70;
    if (slides[0]?.layout === 'title_slide') flowScore += 10;
    let layoutChanges = 0;
    for (let i = 1; i < slides.length; i++) {
      if (slides[i].layout !== slides[i-1].layout) layoutChanges++;
    }
    const transitionRatio = layoutChanges / (slides.length - 1 || 1);
    flowScore += Math.min(20, transitionRatio * 20);

    let densityScore = 100;
    let densityViolations = 0;
    slides.forEach(s => {
      const wordCount = (s.title || "").split(/\s+/).length + (s.content || []).reduce((acc: number, bp: string) => acc + bp.split(/\s+/).length, 0);
      if (wordCount > 50 || wordCount < 10) {
        densityViolations++;
      }
    });
    densityScore -= (densityViolations / slides.length) * 45;

    let imageScore = 80;
    let emptyQueries = 0;
    slides.forEach(s => {
      if (!s.imageSearchQuery && !s.imagePrompt) emptyQueries++;
    });
    imageScore -= (emptyQueries / slides.length) * 35;

    let completenessScore = Math.min(100, slides.length * 9);

    let redundancyScore = 100;
    let duplicateCount = 0;
    for (let i = 0; i < slides.length; i++) {
      for (let j = i + 1; j < slides.length; j++) {
        const getTokens = (str: string) => new Set((str || "").toLowerCase().trim().split(/\s+/).filter(w => w.length > 3));
        const s1 = getTokens(slides[i].title);
        const s2 = getTokens(slides[j].title);
        if (s1.size > 0 && s2.size > 0) {
          const intersection = new Set([...s1].filter(x => s2.has(x)));
          const union = new Set([...s1, ...s2]);
          if (intersection.size / union.size > 0.6) {
            duplicateCount++;
          }
        }
      }
    }
    redundancyScore -= Math.min(50, duplicateCount * 18);

    let citationScore = 55;
    let slidesWithCitations = 0;
    slides.forEach(s => {
      if (s.references || s.keyTakeaway?.includes('[Source') || (s.content && s.content.some((bp: string) => bp.includes('[Source')))) {
        slidesWithCitations++;
      }
    });
    citationScore += (slidesWithCitations / slides.length) * 45;

    const totalScore = Math.round(
      (flowScore + densityScore + imageScore + completenessScore + redundancyScore + citationScore) / 6
    );

    return {
      score: Math.max(10, Math.min(100, totalScore)),
      narrativeFlow: Math.max(10, Math.min(100, Math.round(flowScore))),
      visualDensity: Math.max(10, Math.min(100, Math.round(densityScore))),
      imageRelevance: Math.max(10, Math.min(100, Math.round(imageScore))),
      completeness: Math.max(10, Math.min(100, Math.round(completenessScore))),
      redundancy: Math.max(10, Math.min(100, Math.round(redundancyScore))),
      citations: Math.max(10, Math.min(100, Math.round(citationScore)))
    };
  };

  const generatePreviewBaselineSlides = () => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture) return;
    const lecNotes = notes.filter((n: any) => n.lectureId === activeLectureId);
    const slides = [];
    const layouts = ['split_column', 'timeline', 'key_metrics', 'grid_quadrant', 'bold_quote', 'diagram', 'comparison_table', 'process_flow', 'case_study'];

    slides.push({
      title: activeLecture.title,
      layout: 'title_slide',
      content: ['Comprehensive Study Deck', 'Powered by Note-IT AI Smart Workspace'],
      imagePrompt: `An academic lecture library, classic design`,
      keyTakeaway: `Initial review baseline`
    });

    for (let i = 0; i < pptLength - 1; i++) {
      const note = lecNotes[i % lecNotes.length] || { title: `Topic Section ${i + 1}`, content: `Details for section ${i + 1} content.` };
      const layout = layouts[i % layouts.length];
      const textLines = note.content.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 4);
      const cleanLines = textLines.map((l: string) => l.replace(/[*#-]/g, '').trim());

      let chart = undefined;
      if (layout === 'key_metrics') {
        chart = {
          chartType: 'bar',
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          values: [30, 45, 60, 85]
        };
      }

      slides.push({
        title: note.title,
        layout,
        content: cleanLines.slice(0, 3),
        imageSearchQuery: note.title.split(' ')[0] || 'study',
        imagePrompt: `Professional design representing ${note.title}`,
        keyTakeaway: `Key understanding of ${note.title}`,
        chart
      });
    }
    setLocalSlides(slides);
  };

  const handleUpdatePptLength = (l: 5 | 10 | 15) => {
    setPptLength(l);
  };

  const handleRefreshImages = async () => {
    if (localSlides.length === 0 || !activeLectureId) return;
    setIsGeneratingPresentation(true);
    try {
      const { searchImages } = await import('../services/images');
      const usedImages = new Set<string>();
      const updatedSlides = await Promise.all(localSlides.map(async (s: any) => {
        if (s.imageSearchQuery) {
          try {
            const urls = await searchImages(s.imageSearchQuery);
            if (urls && urls.length > 0) {
              let selectedUrl = urls[Math.floor(Math.random() * urls.length)];
              for (const u of urls) {
                if (!usedImages.has(u)) {
                  selectedUrl = u;
                  break;
                }
              }
              usedImages.add(selectedUrl);
              return { ...s, imageUrl: selectedUrl };
            }
          } catch (err) {
            console.error(err);
          }
        }
        return s;
      }));
      setLocalSlides(updatedSlides);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPresentation(false);
    }
  };

  const handleExportPpt = async () => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (localSlides.length === 0 || !activeLecture) return;
    await buildAndDownloadPPTX(localSlides, activeLecture.title, pptTheme, pptDetailedMode);
  };

  const handleRegenerateDeck = async () => {
    await generateCustomPresentationDeck();
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!chatInput.trim() || !activeLecture || isChatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
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

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeLectureId, isChatLoading]);

  useEffect(() => {
    if (activeLectureId) {
      generatePreviewBaselineSlides();
    }
  }, [activeLectureId, notes, pptLength]);

  const pptReport = auditPPTQuality(localSlides);

  const buildAndDownloadPPTX = async (
    rawSlides: any[],
    deckTitle: string,
    themeName: 'academic' | 'corporate' | 'startup' | 'cyber' | 'minimal' | 'glass',
    isDetailed: boolean
  ) => {
    const calculateJaccardSimilarity = (t1: string, t2: string): number => {
      const getTokens = (str: string) => new Set((str || "").toLowerCase().trim().split(/\s+/).filter(w => w.length > 3));
      const s1 = getTokens(t1);
      const s2 = getTokens(t2);
      if (s1.size === 0 || s2.size === 0) return 0.0;
      
      const intersection = new Set([...s1].filter(x => s2.has(x)));
      const union = new Set([...s1, ...s2]);
      return intersection.size / union.size;
    };

    const deduplicatedSlides: any[] = [];
    rawSlides.forEach(slide => {
      const slideContent = slide.content || slide.bulletPoints || [];
      let isDuplicate = false;
      for (const existing of deduplicatedSlides) {
        const similarity = calculateJaccardSimilarity(slide.title || "", existing.title || "");
        if (similarity > 0.6) {
          const existingContent = existing.content || existing.bulletPoints || [];
          existing.content = Array.from(new Set([...existingContent, ...slideContent]));
          existing.bulletPoints = existing.content;
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        deduplicatedSlides.push({
          ...slide,
          content: slideContent,
          bulletPoints: slideContent
        });
      }
    });

    const processedSlides: any[] = [];
    deduplicatedSlides.forEach(slide => {
      const slideContent = slide.content || [];
      const titleWords = (slide.title || "").split(/\s+/).filter(Boolean).length;
      const contentWords = slideContent.reduce((acc: number, bp: string) => acc + bp.split(/\s+/).filter(Boolean).length, 0);
      const totalWords = titleWords + contentWords;
      
      if (!isDetailed && totalWords > 40 && slideContent.length > 1) {
        const halfIndex = Math.ceil(slideContent.length / 2);
        const contentPart1 = slideContent.slice(0, halfIndex);
        const contentPart2 = slideContent.slice(halfIndex);
        
        processedSlides.push({
          ...slide,
          title: `${slide.title} (Part 1)`,
          content: contentPart1,
          bulletPoints: contentPart1
        });
        processedSlides.push({
          ...slide,
          title: `${slide.title} (Part 2)`,
          content: contentPart2,
          bulletPoints: contentPart2
        });
      } else {
        processedSlides.push(slide);
      }
    });

    const pptx = new pptxgen();
    pptx.title = deckTitle;

    const themeColors = {
      academic: { bg: "0f172a", text: "ffffff", primary: "e2e8f0", accent: "d97706", cardBg: "1e293b" },
      corporate: { bg: "1e293b", text: "ffffff", primary: "cbd5e1", accent: "2563eb", cardBg: "0f172a" },
      startup: { bg: "09090b", text: "ffffff", primary: "f4f4f5", accent: "8b5cf6", cardBg: "18181b" },
      cyber: { bg: "050508", text: "ffffff", primary: "39ff14", accent: "ff007f", cardBg: "0d0e12" },
      minimal: { bg: "ffffff", text: "1e293b", primary: "0f172a", accent: "000000", cardBg: "f8fafc" },
      glass: { bg: "18181b", text: "ffffff", primary: "f4f4f5", accent: "06b6d4", cardBg: "27272a" }
    };

    const colors = themeColors[themeName] || themeColors.academic;

    const getRoyaltyFreeImage = (query: string): string => {
      const clean = (query || "").toLowerCase();
      if (clean.includes("tech") || clean.includes("computer") || clean.includes("software") || clean.includes("code") || clean.includes("digital") || clean.includes("web") || clean.includes("programming") || clean.includes("ai") || clean.includes("artificial")) {
        return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80";
      }
      if (clean.includes("science") || clean.includes("biology") || clean.includes("chemistry") || clean.includes("physics") || clean.includes("lab") || clean.includes("medicine") || clean.includes("dna") || clean.includes("molecular") || clean.includes("cell")) {
        return "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop&q=80";
      }
      if (clean.includes("business") || clean.includes("corporate") || clean.includes("finance") || clean.includes("office") || clean.includes("market") || clean.includes("meeting") || clean.includes("money") || clean.includes("strategy") || clean.includes("leadership")) {
        return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80";
      }
      if (clean.includes("education") || clean.includes("learn") || clean.includes("history") || clean.includes("book") || clean.includes("study") || clean.includes("academic") || clean.includes("student") || clean.includes("class") || clean.includes("philosophy") || clean.includes("ethics")) {
        return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80";
      }
      if (clean.includes("art") || clean.includes("design") || clean.includes("creative") || clean.includes("paint") || clean.includes("draw") || clean.includes("graphic")) {
        return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80";
      }
      if (clean.includes("growth") || clean.includes("success") || clean.includes("startup") || clean.includes("idea") || clean.includes("analytics") || clean.includes("chart") || clean.includes("diagram")) {
        return "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80";
      }
      if (clean.includes("math") || clean.includes("calculus") || clean.includes("algebra") || clean.includes("derivative") || clean.includes("limit") || clean.includes("geometry") || clean.includes("equation")) {
        return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80";
      }
      
      const keywords = clean.split(/\s+/).filter(Boolean);
      const queryParam = keywords.length > 0 ? keywords.slice(0, 2).join(",") : "abstract,academia";
      return `https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80&sig=${Math.abs(queryParam.split('').reduce((a,b)=>(((a<<5)-a)+b.charCodeAt(0))|0,0))%100}`;
    };

    processedSlides.forEach((s, idx) => {
      const slide = pptx.addSlide();
      slide.background = { fill: colors.bg };

      if (s.layout === 'title_slide' || idx === 0) {
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.15, fill: { color: colors.accent } });
        slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 4.5, w: 9.0, h: 0.05, fill: { color: colors.accent } });
        slide.addText(s.title, {
          x: 0.5, y: 1.8, w: 9.0, h: 1.5,
          fontSize: 32, fontFace: "Helvetica",
          color: colors.text, bold: true, align: "center"
        });
        slide.addText(s.content ? s.content.join(' • ') : "Knowledge Deck", {
          x: 0.5, y: 3.5, w: 9.0, h: 0.8,
          fontSize: 14, fontFace: "Helvetica",
          color: colors.primary, align: "center", italic: true
        });
      } else if (s.layout === 'split_column') {
        slide.addText(s.title, {
          x: 0.5, y: 0.5, w: 4.5, h: 0.8,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });
        const bulletLines = s.content.map((bp: string) => ({ text: bp, options: { bullet: true, color: colors.text } }));
        slide.addText(bulletLines, {
          x: 0.5, y: 1.4, w: 4.5, h: 3.8,
          fontSize: 13, fontFace: "Helvetica",
          color: colors.text, lineSpacing: 18
        });

        const query = s.imageSearchQuery || s.imagePrompt || s.title;
        slide.addImage({
          path: s.imageUrl || getRoyaltyFreeImage(query),
          x: 5.3, y: 1.0, w: 4.2, h: 3.8
        });
      } else if (s.layout === 'timeline') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });
        slide.addShape(pptx.ShapeType.line, {
          x: 1.0, y: 2.6, w: 8.0, h: 0,
          line: { color: colors.accent, width: 3, dashType: 'dash' }
        });
        const steps = s.content.slice(0, 4);
        const stepWidth = 8.0 / steps.length;
        steps.forEach((stepText: string, stepIdx: number) => {
          const xPos = 1.0 + (stepIdx * stepWidth);
          slide.addShape(pptx.ShapeType.ellipse, {
            x: xPos + (stepWidth / 2) - 0.25, y: 2.35, w: 0.5, h: 0.5,
            fill: { color: colors.accent }
          });
          slide.addText(`0${stepIdx + 1}`, {
            x: xPos + (stepWidth / 2) - 0.25, y: 2.35, w: 0.5, h: 0.5,
            fontSize: 12, color: colors.text, bold: true, align: "center"
          });
          slide.addShape(pptx.ShapeType.roundRect, {
            x: xPos + 0.1, y: 1.0, w: stepWidth - 0.2, h: 1.2,
            fill: { color: colors.cardBg }
          });
          slide.addText(`Step ${stepIdx + 1}`, {
            x: xPos + 0.1, y: 1.1, w: stepWidth - 0.2, h: 0.3,
            fontSize: 11, color: colors.accent, bold: true, align: "center"
          });
          slide.addText(stepText, {
            x: xPos + 0.1, y: 3.0, w: stepWidth - 0.2, h: 1.8,
            fontSize: 11, color: colors.text, align: "center"
          });
        });
      } else if (s.layout === 'key_metrics' || s.layout === 'metrics') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });
        const metrics = s.content.slice(0, 3);
        const cardWidth = 8.8 / metrics.length;
        metrics.forEach((m: string, mIdx: number) => {
          const xPos = 0.6 + (mIdx * cardWidth);
          slide.addShape(pptx.ShapeType.roundRect, {
            x: xPos + 0.1, y: 1.2, w: cardWidth - 0.2, h: 3.5,
            fill: { color: colors.cardBg }, line: { color: colors.accent, width: 1 }
          });
          const split = m.split(':');
          const numberText = split[0] ? split[0].trim() : `0${mIdx + 1}`;
          const labelText = split[1] ? split.slice(1).join(':').trim() : m;
          
          slide.addText(numberText, {
            x: xPos + 0.2, y: 1.5, w: cardWidth - 0.4, h: 1.0,
            fontSize: 40, color: colors.accent, bold: true, align: "center"
          });
          slide.addText(labelText, {
            x: xPos + 0.2, y: 2.6, w: cardWidth - 0.4, h: 1.8,
            fontSize: 12, color: colors.text, align: "center"
          });
        });
      } else if (s.layout === 'grid_quadrant') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });
        const gridItems = s.content.slice(0, 4);
        const gridPositions = [
          { x: 0.8, y: 1.2 },
          { x: 5.2, y: 1.2 },
          { x: 0.8, y: 3.1 },
          { x: 5.2, y: 3.1 }
        ];
        gridItems.forEach((text: string, gIdx: number) => {
          const pos = gridPositions[gIdx];
          slide.addShape(pptx.ShapeType.roundRect, {
            x: pos.x, y: pos.y, w: 4.0, h: 1.6,
            fill: { color: colors.cardBg }
          });
          slide.addShape(pptx.ShapeType.rect, {
            x: pos.x, y: pos.y, w: 0.1, h: 1.6,
            fill: { color: colors.accent }
          });
          slide.addText(`0${gIdx + 1}.`, {
            x: pos.x + 0.2, y: pos.y + 0.15, w: 3.6, h: 0.3,
            fontSize: 11, color: colors.accent, bold: true
          });
          slide.addText(text, {
            x: pos.x + 0.2, y: pos.y + 0.45, w: 3.6, h: 1.0,
            fontSize: 11, color: colors.text
          });
        });
      } else if (s.layout === 'bold_quote' || s.layout === 'quote') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 1.2, y: 1.3, w: 7.6, h: 3.2,
          fill: { color: colors.cardBg }, line: { color: colors.accent, width: 2 }
        });
        slide.addText("“", {
          x: 1.5, y: 1.5, w: 1.0, h: 0.6,
          fontSize: 48, fontFace: "Georgia", color: colors.accent, bold: true
        });
        slide.addText(`"${s.content.join(' ')}"`, {
          x: 1.5, y: 2.0, w: 7.0, h: 1.8,
          fontSize: 18, fontFace: "Helvetica",
          color: colors.text, italic: true, align: "center", bold: true
        });
      } else if (s.layout === 'diagram') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });

        const diag = s.diagramData || {
          nodes: [
            { id: "n1", label: s.content[0] || "Start" },
            { id: "n2", label: s.content[1] || "Process" },
            { id: "n3", label: s.content[2] || "End" }
          ],
          connections: [
            { from: "n1", to: "n2" },
            { from: "n2", to: "n3" }
          ]
        };

        const nodeMap: { [key: string]: { x: number, y: number, w: number, h: number } } = {};
        const nodeWidth = 2.0;
        const nodeHeight = 1.0;
        
        diag.nodes.forEach((node: any, nidx: number) => {
          const x = 1.2 + (nidx * 2.8);
          const y = 2.2;
          nodeMap[node.id] = { x, y, w: nodeWidth, h: nodeHeight };
          
          slide.addShape(pptx.ShapeType.roundRect, {
            x, y, w: nodeWidth, h: nodeHeight,
            fill: { color: colors.cardBg }, line: { color: colors.accent, width: 2 }
          });
          slide.addText(node.label, {
            x: x + 0.1, y: y + 0.2, w: nodeWidth - 0.2, h: nodeHeight - 0.4,
            fontSize: 11, color: colors.text, bold: true, align: "center", valign: "middle"
          });
        });

        diag.connections.forEach((conn: any) => {
          const fromNode = nodeMap[conn.from];
          const toNode = nodeMap[conn.to];
          if (fromNode && toNode) {
            const startX = fromNode.x + fromNode.w;
            const startY = fromNode.y + (fromNode.h / 2);
            const endX = toNode.x;
            const endY = toNode.y + (toNode.h / 2);
            
            slide.addShape(pptx.ShapeType.line, {
              x: startX, y: startY, w: endX - startX, h: endY - startY,
              line: { color: colors.accent, width: 2.5, endArrowType: 'arrow' }
            });
          }
        });
      } else if (s.layout === 'comparison_table' || s.layout === 'comparison') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });

        const tableData = s.tableData || {
          headers: ["Aspect", "Parameter A", "Parameter B"],
          rows: s.content.map((c: string, cidx: number) => [`Metric ${cidx+1}`, c.substring(0, 25), c.substring(25, 55) || "Aligned Outline"])
        };

        const formattedRows: any[] = [];
        const headerCells = tableData.headers.map((h: string) => ({
          text: h,
          options: {
            fill: { color: colors.accent },
            bold: true,
            color: colors.bg === "ffffff" ? "ffffff" : "000000",
            fontSize: 12,
            align: "center",
            valign: "middle",
            margin: [8, 8, 8, 8]
          }
        }));
        formattedRows.push(headerCells);

        tableData.rows.forEach((row: string[], rIdx: number) => {
          const cells = row.map((cellText: string, cIdx: number) => ({
            text: cellText,
            options: {
              fill: { color: rIdx % 2 === 0 ? colors.cardBg : colors.bg },
              color: colors.text,
              fontSize: 11,
              align: cIdx === 0 ? "left" : "center",
              valign: "middle",
              margin: [8, 8, 8, 8]
            }
          }));
          formattedRows.push(cells);
        });

        slide.addTable(formattedRows, {
          x: 1.0, y: 1.4, w: 8.0, h: 3.0,
          border: { type: "solid", color: colors.accent, pt: 1 }
        });
      } else if (s.layout === 'process_flow' || s.layout === 'process') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });

        const steps = s.processSteps || s.content.slice(0, 3);
        const cardWidth = 2.2;
        const cardHeight = 1.4;
        const totalCards = steps.length;
        const spacing = 8.0 / Math.max(1, totalCards);
        
        steps.forEach((stepText: string, stepIdx: number) => {
          const xPos = 1.0 + (stepIdx * spacing) + (spacing/2 - cardWidth/2);
          const yPos = 2.0;

          slide.addShape(pptx.ShapeType.roundRect, {
            x: xPos, y: yPos, w: cardWidth, h: cardHeight,
            fill: { color: colors.cardBg }, line: { color: colors.accent, width: 2 }
          });
          
          slide.addText(`Stage 0${stepIdx + 1}`, {
            x: xPos + 0.1, y: yPos + 0.1, w: cardWidth - 0.2, h: 0.3,
            fontSize: 10, color: colors.accent, bold: true, align: "center"
          });

          slide.addText(stepText, {
            x: xPos + 0.1, y: yPos + 0.4, w: cardWidth - 0.2, h: 0.9,
            fontSize: 11, color: colors.text, align: "center", valign: "middle"
          });

          if (stepIdx < totalCards - 1) {
            const arrowStartX = xPos + cardWidth;
            const arrowEndX = xPos + spacing;
            const arrowY = yPos + (cardHeight / 2);
            slide.addShape(pptx.ShapeType.line, {
              x: arrowStartX + 0.15, y: arrowY, w: (arrowEndX - arrowStartX) - 0.3, h: 0,
              line: { color: colors.accent, width: 3, endArrowType: 'arrow' }
            });
          }
        });
      } else if (s.layout === 'case_study') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });

        const storyText = s.content.slice(0, 2).join('\n\n');
        slide.addText(storyText, {
          x: 0.5, y: 1.2, w: 5.2, h: 3.6,
          fontSize: 12, fontFace: "Helvetica",
          color: colors.text, lineSpacing: 18
        });

        slide.addShape(pptx.ShapeType.roundRect, {
          x: 6.0, y: 1.2, w: 3.5, h: 3.6,
          fill: { color: colors.cardBg }, line: { color: colors.accent, width: 2 }
        });

        slide.addText("CASE INSIGHT", {
          x: 6.2, y: 1.4, w: 3.1, h: 0.3,
          fontSize: 10, fontFace: "Helvetica", color: colors.accent, bold: true, align: "center"
        });

        const outcomeText = s.content[2] || "Detailed operational outcome, findings, and strategic lessons learned from the subject review.";
        slide.addText(outcomeText, {
          x: 6.2, y: 1.8, w: 3.1, h: 2.8,
          fontSize: 11, fontFace: "Helvetica", color: colors.text, align: "center", valign: "middle"
        });
      }

      if (s.chart) {
        const chartTypeMap = {
          bar: pptx.ChartType.bar,
          line: pptx.ChartType.line,
          pie: pptx.ChartType.pie
        };
        const type = chartTypeMap[s.chart.chartType as 'bar' | 'line' | 'pie'] || pptx.ChartType.bar;
        const chartData = [
          {
            name: s.title || "Metrics",
            labels: s.chart.labels,
            values: s.chart.values
          }
        ];
        slide.addChart(type as any, chartData, {
          x: 5.3, y: 1.2, w: 4.2, h: 3.5,
          showLegend: true,
          legendPos: 'b'
        });
      }

      if (s.keyTakeaway) {
        slide.addText(`Takeaway: ${s.keyTakeaway}`, {
          x: 0.5, y: 5.2, w: 9.0, h: 0.4,
          fontSize: 10.5, fontFace: "Helvetica",
          color: colors.accent, italic: true
        });
      }
      slide.addText(`Slide ${idx + 1} of ${processedSlides.length}`, {
        x: 8.5, y: 5.2, w: 1.5, h: 0.4,
        fontSize: 9, fontFace: "Helvetica",
        color: colors.primary, align: "right"
      });
    });

    pptx.writeFile({ fileName: `${deckTitle.replace(/\s+/g, "_")}.pptx` });
  };

  const generateCustomPresentationDeck = async () => {
    const activeLecture = lectures.find(l => l.id === activeLectureId);
    if (!activeLecture) return;
    setIsGeneratingPresentation(true);

    try {
      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const prompt = `
        Create a structured PowerPoint presentation deck based on the following lecture materials.
        
        Lecture Title: "${activeLecture.title}"
        Lecture Content:
        ${activeLecture.cleanTranscript ? activeLecture.cleanTranscript.substring(0, 8000) : activeLecture.summary}
        
        Configuration Requirements:
        - Theme style: ${pptTheme}
        - Slide count: Exactly ${pptLength} slides
        - Text limit: ${pptDetailedMode ? 'detailed explanations' : 'strictly under 40 words total per slide (short bullet points)'}
        
        For each slide, you must define:
        1. "title": A short title for the slide
        2. "layout": One of ['title_slide', 'split_column', 'timeline', 'key_metrics', 'grid_quadrant', 'bold_quote', 'diagram', 'comparison_table', 'process_flow', 'case_study'].
        3. "content": An array of bullet points (each 6-12 words max).
        4. "imageSearchQuery": A single high-level search keyword (e.g., "molecule" or "office") representing the slide's visual topic.
        5. "imagePrompt": A detailed prompt for illustrating the content.
        6. "keyTakeaway": A short 1-sentence takeaway displayed at the bottom of the slide.
        7. "chart": (Optional) If the slide contains statistics, metrics, or comparisons, include a chart plan:
           - "chartType": one of ['bar', 'line', 'pie']
           - "labels": array of strings (e.g. ["Q1", "Q2", "Q3"])
           - "values": array of numbers (e.g. [45, 67, 89])
        
        Return the response strictly as a JSON object with a "slides" array.
      `;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                slides: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      title: { type: 'STRING' },
                      layout: { type: 'STRING' },
                      content: { type: 'ARRAY', items: { type: 'STRING' } },
                      imageSearchQuery: { type: 'STRING' },
                      imagePrompt: { type: 'STRING' },
                      keyTakeaway: { type: 'STRING' },
                      chart: {
                        type: 'OBJECT',
                        properties: {
                          chartType: { type: 'STRING' },
                          labels: { type: 'ARRAY', items: { type: 'STRING' } },
                          values: { type: 'ARRAY', items: { type: 'INTEGER' } }
                        },
                        required: ['chartType', 'labels', 'values']
                      }
                    },
                    required: ['title', 'layout', 'content', 'imageSearchQuery', 'imagePrompt', 'keyTakeaway']
                  }
                }
              },
              required: ['slides']
            }
          }
        })
      });

      let slides = [];
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        const parsed = JSON.parse(text.substring(startIdx, endIdx + 1));
        slides = parsed.slides || [];
      } else {
        throw new Error("Failed to generate slides via Gemini API");
      }

      // Concurrently fetch images for each slide using the secure image service
      const { searchImages } = await import('../services/images');
      const usedImages = new Set<string>();
      
      const slideImagePromises = slides.map(async (s: any) => {
        if (s.imageSearchQuery) {
          try {
            const urls = await searchImages(s.imageSearchQuery);
            if (urls && urls.length > 0) {
              let selectedUrl = urls[0];
              for (const u of urls) {
                if (!usedImages.has(u)) {
                  selectedUrl = u;
                  break;
                }
              }
              usedImages.add(selectedUrl);
              s.imageUrl = selectedUrl;
            }
          } catch (imgErr) {
            console.error(`Failed to prefetch image for query "${s.imageSearchQuery}":`, imgErr);
          }
        }
      });
      await Promise.all(slideImagePromises);

      setLocalSlides(slides);
      await buildAndDownloadPPTX(slides, activeLecture.title, pptTheme, pptDetailedMode);
      setIsGeneratingPresentation(false);
      setShowPptModal(false);
    } catch (err) {
      console.error("Custom slide generation failed, using local fallback...", err);
      // Fallback slide deck building from notes
      const lecNotes = notes.filter((n: any) => n.lectureId === activeLectureId);
      const slides = [];
      const layouts = ['split_column', 'timeline', 'key_metrics', 'grid_quadrant', 'bold_quote', 'diagram', 'comparison_table', 'process_flow', 'case_study'];

      slides.push({
        title: activeLecture.title,
        layout: 'title_slide',
        content: ['Comprehensive Study Deck', 'Powered by Note-IT AI Smart Workspace'],
        imagePrompt: `An academic lecture library, classic design`,
        keyTakeaway: `Initial review baseline`
      });

      for (let i = 0; i < pptLength - 1; i++) {
        const note = lecNotes[i % lecNotes.length] || { title: `Topic Section ${i + 1}`, content: `Details for section ${i + 1} content.` };
        const layout = layouts[i % layouts.length];
        const textLines = note.content.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 4);
        const cleanLines = textLines.map((l: string) => l.replace(/[*#-]/g, '').trim());

        slides.push({
          title: note.title,
          layout,
          content: cleanLines.slice(0, 3),
          imagePrompt: `Professional design representing ${note.title}`,
          keyTakeaway: `Key understanding of ${note.title}`
        });
      }

      setLocalSlides(slides);
      await buildAndDownloadPPTX(slides, activeLecture.title, pptTheme, pptDetailedMode);
      setIsGeneratingPresentation(false);
      setShowPptModal(false);
    }
  };

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
            className="px-4 py-2 bg-indigo-650 rounded-lg text-xs font-bold text-white cursor-pointer"
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
                theme === 'dark' ? 'border-neutral-805 bg-neutral-950/70 hover:bg-neutral-900 text-neutral-400 hover:text-white' : 'border-gray-205 bg-gray-50 hover:bg-gray-100 text-gray-700'
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
              <h1 className="text-sm font-black tracking-tight font-sans mt-0.5 truncate max-w-md">
                {activeLecture.title.toUpperCase()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500 font-mono">
              <CheckCircle className="h-3.5 w-3.5" />
              WORKSPACE RESOLVED
            </span>
          </div>
        </div>

        {/* SPLIT PANE CONTENT CONTAINER */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* PANE 1: LEFT - TRANSCRIPT COLUMN (40%) */}
          <div className={`w-full md:w-[40%] flex-shrink-0 flex flex-col border-r overflow-hidden ${
            theme === 'dark' ? 'bg-[#08090c] border-neutral-900' : 'bg-gray-50/50 border-gray-200'
          }`}>
            <div className="p-4 border-b border-neutral-900/10 dark:border-neutral-900/50">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">Lecture Transcript</h2>
              <p className="text-[10px] text-neutral-400 mt-0.5">Click timestamps to sync milestone highlights.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs leading-relaxed select-text">
              {renderTranscriptContent(activeLecture.cleanTranscript || activeLecture.transcript || '')}
            </div>
          </div>

          {/* PANE 2: RIGHT - STUDY TABS COLUMN (60%) */}
          <div className="flex-grow flex-1 flex flex-col overflow-hidden p-4 space-y-4">
            
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
                      ? theme === 'dark' ? 'bg-indigo-650 text-white' : 'bg-white text-black shadow-xs' 
                      : 'text-neutral-450 hover:text-white'
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
                      {(['academic', 'executive', 'revision'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setNotesFormat(f)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                            notesFormat === f ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-455'
                          }`}
                        >
                          {f === 'executive' ? 'Quick Outline' : f}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setPdfExportData({ title: `${activeLecture.title} - Notes`, data: filteredNotes });
                        setShowPdfModal(true);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filteredNotes.length === 0 ? (
                      <div className="text-center py-12 text-neutral-500 font-mono text-[10.5px]">No lecture notes processed.</div>
                    ) : (
                      filteredNotes.map((n: any, i: number) => {
                        // Apply simulated local formatting based on notesFormat
                        let displayContent = n.content || '';
                        if (notesFormat === 'executive') {
                          // Quick outline: Filter only key bullets
                          const lines = displayContent.split('\n');
                          const bullets = lines.filter((l: string) => l.trim().startsWith('-') || l.trim().startsWith('*')).slice(0, 5);
                          displayContent = bullets.length > 0 ? bullets.join('\n') : lines.slice(0, 5).join('\n');
                        } else if (notesFormat === 'revision') {
                          // High summary cards
                          displayContent = `[REVISION SUMMARY CARD]\n${displayContent.substring(0, 250)}...`;
                        }

                        return (
                          <div key={i} className={`p-4 rounded-xl border font-sans ${theme === 'dark' ? 'bg-[#121318] border-neutral-905' : 'bg-white border-gray-200'}`}>
                            <h4 className="text-xs font-black text-indigo-400">{n.title}</h4>
                            <p className="text-[11.5px] mt-2 text-neutral-305 leading-relaxed whitespace-pre-wrap">
                              {renderTextWithCitations(cleanMarkdownText(displayContent))}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* 2. SUMMARY TAB */}
              {activeOutputTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {(['academic', 'revision', 'executive', 'beginner'] as const).map(sf => (
                        <button
                          key={sf}
                          onClick={() => setSummaryFormat(sf)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                            summaryFormat === sf ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-455'
                          }`}
                        >
                          {sf} Mode
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setPdfExportData({ title: `${activeLecture.title} - Summary`, data: activeLecture.summary });
                        setShowPdfModal(true);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      const sections = parseSummaryIntoSections(activeLecture.summary || '');
                      
                      // Map local filter summary mode configurations to specific headers
                      const allSections = [
                        { key: 'executiveOverview', label: 'Executive Overview', content: sections.executiveOverview },
                        { key: 'keyConcepts', label: 'Key Concepts', content: sections.keyConcepts },
                        { key: 'detailedExplanation', label: 'Detailed Explanation', content: sections.detailedExplanation },
                        { key: 'examples', label: 'Examples', content: sections.examples },
                        { key: 'formulas', label: 'Formulas', content: sections.formulas },
                        { key: 'commonMistakes', label: 'Common Mistakes', content: sections.commonMistakes },
                        { key: 'revisionNotes', label: 'Revision Notes', content: sections.revisionNotes },
                        { key: 'examQuestions', label: 'Exam Questions', content: sections.examQuestions },
                        { key: 'realWorldApplications', label: 'Real World Applications', content: sections.realWorldApplications },
                        { key: 'quickRecap', label: 'Quick Recap', content: sections.quickRecap }
                      ];

                      // Filter sections displayed locally depending on summaryFormat selection
                      const filteredSections = allSections.filter(sec => {
                        if (summaryFormat === 'academic') {
                          return ['executiveOverview', 'keyConcepts', 'detailedExplanation'].includes(sec.key);
                        } else if (summaryFormat === 'revision') {
                          return ['revisionNotes', 'quickRecap', 'commonMistakes'].includes(sec.key);
                        } else if (summaryFormat === 'executive') {
                          return ['executiveOverview', 'realWorldApplications', 'formulas'].includes(sec.key);
                        } else if (summaryFormat === 'beginner') {
                          return ['keyConcepts', 'examples', 'examQuestions'].includes(sec.key);
                        }
                        return true;
                      });

                      return filteredSections.map((sec, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${
                          theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
                        }`}>
                          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">{sec.label}</h4>
                          <p className="text-[11.5px] mt-2 text-neutral-300 leading-relaxed whitespace-pre-wrap">
                            {renderTextWithCitations(sec.content)}
                          </p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* 3. FLASHCARDS TAB */}
              {activeOutputTab === 'flashcards' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {(['basic', 'advanced'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setFlashcardsFormat(f)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                            flashcardsFormat === f ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-455'
                          }`}
                        >
                          {f} Recall
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setPdfExportData({ title: `${activeLecture.title} - Flashcards`, data: activeLecture.flashcards });
                        setShowPdfModal(true);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeLecture.flashcards && activeLecture.flashcards.length > 0 ? (
                      activeLecture.flashcards.map((f: any, i: number) => {
                        const showDetailed = flashcardsFormat === 'advanced';
                        return (
                          <div key={i} className={`p-4.5 rounded-xl border font-sans space-y-2 ${
                            theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
                          }`}>
                            <div className="text-[10px] font-bold text-indigo-400 font-mono">Q. CARD {i + 1}</div>
                            <div className="text-xs font-black">{renderTextWithCitations(cleanMarkdownText(f.q))}</div>
                            <div className="text-[11.5px] text-neutral-350 pt-2 border-t border-neutral-900/20">
                              {renderTextWithCitations(cleanMarkdownText(f.a))}
                            </div>
                            {showDetailed && (
                              <div className="text-[9.5px] text-indigo-400 pt-1 font-mono italic">
                                Recall telemetry target calibrated for lecture review.
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-neutral-500 font-mono text-[10.5px]">No flashcards indexed.</div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. QUIZ TAB */}
              {activeOutputTab === 'quiz' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {(['mcq', 'subjective'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setQuizFormat(f)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                            quizFormat === f ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-455'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setPdfExportData({ title: `${activeLecture.title} - Quiz`, data: activeLecture.quiz });
                        setShowPdfModal(true);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export PDF</span>
                    </button>
                  </div>

                  {activeLecture.quiz && activeLecture.quiz.length > 0 ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'}`}>
                        <div className="text-[10px] font-black text-indigo-400 font-mono">QUESTION {activeQuizQuestionIdx + 1} of {activeLecture.quiz.length}</div>
                        <h4 className="text-xs font-bold font-sans mt-2 leading-relaxed">
                          {renderTextWithCitations(cleanMarkdownText(activeLecture.quiz[activeQuizQuestionIdx].question))}
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-2 mt-4">
                          {activeLecture.quiz[activeQuizQuestionIdx].options.map((opt: string, optIdx: number) => {
                            const isSelected = selectedQuizAnswerIdx === optIdx;
                            const isCorrect = optIdx === activeLecture.quiz[activeQuizQuestionIdx].correctAnswer;
                            
                            let btnClass = "";
                            if (isQuizRevealed) {
                                if (isCorrect) btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-450";
                                else if (isSelected) btnClass = "border-red-500 bg-red-500/10 text-red-450";
                                else btnClass = "border-neutral-900 bg-neutral-950/20 text-neutral-500";
                            } else {
                                if (isSelected) btnClass = "border-indigo-500 bg-indigo-500/10 text-white";
                                else btnClass = "border-neutral-850 bg-neutral-950/40 text-neutral-350 hover:bg-neutral-900";
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
                          <div className="mt-4 pt-3 border-t border-dashed border-neutral-900 text-[11px] text-neutral-455">
                            <span className="font-mono text-[9px] font-bold text-indigo-400 block mb-1">COGNITIVE ANALYSIS:</span>
                            {renderTextWithCitations(cleanMarkdownText(activeLecture.quiz[activeQuizQuestionIdx].explanation))}
                            {activeLecture.quiz[activeQuizQuestionIdx].sourceCitation && (
                              <div className="mt-2 text-[10px] font-bold text-indigo-350 font-mono">
                                Citation: {activeLecture.quiz[activeQuizQuestionIdx].sourceCitation}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-5 pt-3 border-t border-neutral-900/30">
                          {!isQuizRevealed ? (
                            <button
                              disabled={selectedQuizAnswerIdx === null}
                              onClick={() => setIsQuizRevealed(true)}
                              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-bold disabled:opacity-30 cursor-pointer"
                            >
                              Verify Choice
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setIsQuizRevealed(false);
                                setSelectedQuizAnswerIdx(null);
                                setActiveQuizQuestionIdx(prev => (prev + 1) % activeLecture.quiz.length);
                              }}
                              className="px-4 py-2 bg-white text-black hover:bg-neutral-100 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              Next question
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500 font-mono text-[10px]">No questions loaded.</div>
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
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] text-neutral-500 font-mono">No nodes compiled.</div>
                    )}
                  </div>

                  {selectedMindmapNode && (
                    <div className={`p-4 rounded-xl border text-left space-y-3.5 animate-fade-in ${
                      theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between border-b border-neutral-855 pb-2">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">
                          {selectedMindmapNode.label}
                        </h4>
                        <button 
                          onClick={() => setSelectedMindmapNode(null)}
                          className="text-neutral-550 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                      
                      <div className="text-[11.5px] leading-relaxed text-neutral-350">
                        <strong className="text-indigo-400 block text-[9.5px] uppercase font-mono tracking-wider">Definition & Explanation</strong>
                        {renderTextWithCitations(cleanMarkdownText(selectedMindmapNode.desc || selectedMindmapNode.explanation || 'Provides logical synthesis for this section.'))}
                      </div>
                      
                      {selectedMindmapNode.examples && (
                        <div className="text-[11.5px] leading-relaxed text-neutral-350">
                          <strong className="text-indigo-400 block text-[9.5px] uppercase font-mono tracking-wider">Examples & Analogies</strong>
                          {renderTextWithCitations(cleanMarkdownText(selectedMindmapNode.examples))}
                        </div>
                      )}

                      {selectedMindmapNode.formula && (
                        <div className="text-[11.5px] leading-relaxed text-neutral-350">
                          <strong className="text-indigo-400 block text-[9.5px] uppercase font-mono tracking-wider">Equations or Theories</strong>
                          <code className="block bg-neutral-950/50 p-2 rounded text-[10px] font-mono mt-1 text-orange-450 border border-neutral-900">
                            {selectedMindmapNode.formula}
                          </code>
                        </div>
                      )}

                      {selectedMindmapNode.applications && (
                        <div className="text-[11.5px] leading-relaxed text-neutral-350">
                          <strong className="text-indigo-400 block text-[9.5px] uppercase font-mono tracking-wider">Applications & Use Cases</strong>
                          {renderTextWithCitations(cleanMarkdownText(selectedMindmapNode.applications))}
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
                      <div className="relative border-l border-neutral-800 ml-4 py-2 space-y-5">
                        {activeLecture.timeline.map((event: any, idx: number) => (
                          <div key={idx} className="relative pl-6">
                            <span 
                              onClick={() => handleTimelineTimestampClick(event.time)}
                              className="absolute -left-2.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-650 border-2 border-[#0a0b0e] text-[8.5px] font-mono font-bold text-indigo-300 cursor-pointer hover:bg-indigo-500 hover:text-white transition-all shadow-md"
                            >
                              {event.time}
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-indigo-400">{event.title}</h4>
                              <p className="text-[11px] text-neutral-350 leading-relaxed">{event.description}</p>
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
              {/* 7. SLIDES TAB */}
              {activeOutputTab === 'slides' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  {/* Left 2 columns: Slide Deck Preview list */}
                  <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {localSlides.map((slide: any, idx: number) => {
                      const query = slide.imageSearchQuery || slide.imagePrompt || slide.title;
                      const getRoyaltyFreeImage = (q: string): string => {
                        const clean = q.toLowerCase();
                        if (clean.includes("tech") || clean.includes("computer") || clean.includes("software") || clean.includes("code") || clean.includes("digital") || clean.includes("web") || clean.includes("programming") || clean.includes("ai") || clean.includes("artificial")) {
                          return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80";
                        }
                        if (clean.includes("science") || clean.includes("biology") || clean.includes("chemistry") || clean.includes("physics") || clean.includes("lab") || clean.includes("medicine") || clean.includes("dna") || clean.includes("molecular") || clean.includes("cell")) {
                          return "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop&q=80";
                        }
                        if (clean.includes("business") || clean.includes("corporate") || clean.includes("finance") || clean.includes("office") || clean.includes("market") || clean.includes("meeting") || clean.includes("money") || clean.includes("strategy") || clean.includes("leadership")) {
                          return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80";
                        }
                        if (clean.includes("education") || clean.includes("learn") || clean.includes("history") || clean.includes("book") || clean.includes("study") || clean.includes("academic") || clean.includes("student") || clean.includes("class") || clean.includes("philosophy") || clean.includes("ethics")) {
                          return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80";
                        }
                        if (clean.includes("art") || clean.includes("design") || clean.includes("creative") || clean.includes("paint") || clean.includes("draw") || clean.includes("graphic")) {
                          return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80";
                        }
                        if (clean.includes("growth") || clean.includes("success") || clean.includes("startup") || clean.includes("idea") || clean.includes("analytics") || clean.includes("chart") || clean.includes("diagram")) {
                          return "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80";
                        }
                        if (clean.includes("math") || clean.includes("calculus") || clean.includes("algebra") || clean.includes("derivative") || clean.includes("limit") || clean.includes("geometry") || clean.includes("equation")) {
                          return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80";
                        }
                        return "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80";
                      };

                      const imgUrl = slide.imageUrl || getRoyaltyFreeImage(query);
                      
                      return (
                        <div key={idx} className={`p-5 rounded-xl border flex flex-col justify-between relative overflow-hidden ${
                          theme === 'dark' ? 'bg-neutral-950/65 border-neutral-900 text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}>
                          <div className="h-1 absolute top-0 left-0 right-0" style={{ backgroundColor: getThemeColorHex(pptTheme, 'accent') }} />
                          
                          <div className="flex flex-col md:flex-row gap-4 mt-2">
                            <div className="flex-1 space-y-2">
                              <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 uppercase">
                                Slide {idx + 1}: {slide.layout ? slide.layout.replace('_', ' ') : 'Layout'}
                              </span>
                              <h4 className="text-xs font-black mt-1 leading-tight">{slide.title}</h4>
                              
                              {slide.layout === 'bold_quote' || slide.layout === 'quote' ? (
                                <p className="text-xs italic text-neutral-450 border-l-2 border-indigo-500 pl-3.5 my-3">
                                  "{slide.content ? slide.content.join(' ') : ''}"
                                </p>
                              ) : (
                                <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-400">
                                  {slide.content && slide.content.map((bp: string, bidx: number) => (
                                    <li key={bidx} className="leading-normal">{bp}</li>
                                  ))}
                                </ul>
                              )}
                              
                              {slide.chart && (
                                <div className="mt-3 p-3 bg-neutral-950/45 rounded-lg border border-neutral-900">
                                  <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase block mb-1">
                                    📊 Dynamic AI Chart ({slide.chart.chartType})
                                  </span>
                                  <div className="flex items-end gap-1.5 h-16 pt-2">
                                    {slide.chart.values.map((v: number, vidx: number) => (
                                      <div key={vidx} className="flex-1 flex flex-col items-center gap-1">
                                        <div 
                                          className="w-full bg-indigo-550 rounded-t"
                                          style={{ height: `${Math.max(15, Math.min(100, (v / Math.max(...slide.chart.values)) * 100))}%` }}
                                        />
                                        <span className="text-[7px] font-mono text-neutral-500 truncate w-full text-center">
                                          {slide.chart.labels[vidx]}: {v}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {['split_column', 'title_slide', 'case_study'].includes(slide.layout) && (
                              <div className="w-full md:w-40 h-24 rounded-lg overflow-hidden border border-neutral-905/60 relative flex-shrink-0">
                                <img src={imgUrl} alt={slide.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-1.5">
                                  <span className="text-[7.5px] font-mono font-bold text-white uppercase truncate w-full">
                                    🔍 {query.substring(0, 18)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-2 border-t border-neutral-900/30 flex justify-between items-center text-[9px] font-mono text-neutral-550">
                            <span className="truncate max-w-[70%]">Takeaway: {slide.keyTakeaway || 'Key understanding.'}</span>
                            {slide.references && <span className="text-indigo-400">Ref: {slide.references}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right column: Slide configuration & Quality Score report dashboard */}
                  <div className={`p-4 rounded-xl border space-y-4 flex flex-col justify-between ${
                    theme === 'dark' ? 'bg-neutral-950/65 border-neutral-900 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider">Slide Quality Audit</h4>
                      
                      <div className="flex items-center gap-4 p-3 rounded-lg bg-neutral-950/40 border border-neutral-900">
                        <div className="relative h-12 w-12 flex items-center justify-center rounded-full border border-indigo-500/35">
                          <div className="text-center">
                            <span className="text-xs font-black text-indigo-400">{pptReport.score}</span>
                            <span className="text-[6px] text-neutral-500 block uppercase font-mono leading-none">Score</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <span className="text-[8px] font-bold text-neutral-450 uppercase font-mono">Auditor Grade</span>
                          <div className="text-[11px] font-extrabold text-neutral-200">
                            {pptReport.score >= 85 ? '🌟 PREMIUM DECK' : pptReport.score >= 70 ? '👍 GOOD DESIGN' : '⚠️ TUNING REQUIRED'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          { label: 'Narrative Flow', val: pptReport.narrativeFlow },
                          { label: 'Visual Density', val: pptReport.visualDensity },
                          { label: 'Image Relevance', val: pptReport.imageRelevance },
                          { label: 'Completeness', val: pptReport.completeness },
                          { label: 'Redundancy Check', val: pptReport.redundancy },
                          { label: 'Citations coverage', val: pptReport.citations }
                        ].map((item, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between text-[8px] font-bold font-mono">
                              <span className="text-neutral-500 uppercase">{item.label}</span>
                              <span className="text-indigo-400">{item.val}/100</span>
                            </div>
                            <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-550 rounded-full transition-all duration-500" 
                                style={{ width: `${item.val}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 border-t border-neutral-900/60 pt-3">
                        <div>
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase font-mono">Presentation Length</label>
                          <div className="flex gap-2 mt-1">
                            {([5, 10, 15] as const).map(l => (
                              <button
                                key={l}
                                onClick={() => handleUpdatePptLength(l)}
                                className={`flex-1 py-1 rounded border text-[9px] font-bold cursor-pointer transition-all ${
                                  pptLength === l ? 'bg-indigo-650 text-white border-indigo-500' : 'bg-transparent border-neutral-900 text-neutral-450 hover:border-neutral-800'
                                }`}
                              >
                                {l} Slides
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase font-mono">Select Design Theme Style</label>
                          <div className="grid grid-cols-3 gap-1 mt-1">
                            {(['academic', 'corporate', 'startup', 'cyber', 'minimal', 'glass'] as const).map(t => (
                              <button
                                key={t}
                                onClick={() => setPptTheme(t)}
                                className={`py-1 text-[8px] rounded border font-bold capitalize cursor-pointer transition-all ${
                                  pptTheme === t ? 'bg-indigo-650 text-white border-indigo-500' : 'bg-transparent border-neutral-900 text-neutral-450 hover:border-neutral-800'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded border border-neutral-900 bg-neutral-950/20">
                          <div>
                            <span className="text-[10px] font-bold block">Detailed Bullet Mode</span>
                            <span className="text-[7.5px] text-neutral-550">Overrides 40-word limit.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={pptDetailedMode}
                            onChange={(e) => setPptDetailedMode(e.target.checked)}
                            className="accent-indigo-550 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-neutral-900/60 pt-3">
                      <button
                        onClick={handleRegenerateDeck}
                        className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 active:scale-98 transition-all text-white text-[10px] font-black rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        <span>REGENERATE DECK PREVIEW</span>
                      </button>
                      <button
                        onClick={handleRefreshImages}
                        className="w-full py-2 bg-transparent border border-neutral-900 hover:bg-neutral-950 active:scale-98 transition-all text-neutral-350 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        REFRESH IMAGE VARIETY
                      </button>
                      <button
                        onClick={handleExportPpt}
                        className="w-full py-2 bg-white text-black hover:bg-neutral-100 active:scale-98 transition-all text-[10px] font-black rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5 text-black" />
                        <span>DOWNLOAD PPTX FILE</span>
                      </button>
                    </div>
                  </div>
                </div>
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
                              ? 'bg-indigo-650 text-white rounded-br-none'
                              : theme === 'dark'
                                ? 'bg-neutral-950 border border-neutral-850 text-neutral-200 rounded-bl-none'
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
                          theme === 'dark' ? 'bg-neutral-950 border border-neutral-850' : 'bg-white border border-gray-200'
                        }`}>
                          <Cpu className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                          <span className="text-neutral-550 font-mono text-[9px] animate-pulse">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-neutral-900 bg-neutral-950/70 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a question about this lecture..."
                      className="flex-1 rounded-lg border border-neutral-805 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                      disabled={isChatLoading}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
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
              theme === 'dark' ? 'bg-[#0d0e12] border-neutral-850 text-white' : 'bg-white border-gray-200 text-gray-900'
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
                            ? 'bg-indigo-650 border-indigo-500 text-white' 
                            : theme === 'dark' ? 'border-neutral-800 text-neutral-450 hover:border-neutral-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
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
                    className="rounded-lg px-4 py-2 text-xs font-bold border border-neutral-800 text-neutral-450 cursor-pointer"
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

        {/* PPT PRESENTATION CUSTOMIZATION MODAL */}
        {showPptModal && (
          <div className="fixed inset-0 bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
            <div className={`rounded-2xl max-w-md w-full border p-6 space-y-4 shadow-2xl relative ${
              theme === 'dark' ? 'bg-[#0d0e12] border-neutral-855 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900/40">
                <h3 className="font-sans font-black text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span>AI PowerPoint Presentation Settings</span>
                </h3>
                <button 
                  onClick={() => setShowPptModal(false)}
                  className="text-neutral-500 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                {isGeneratingPresentation && (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <BruteLoader size="sm" message="Generating slides..." />
                    <span className="text-[10px] text-indigo-400 font-mono animate-pulse">Running title similarity audits & stock photo query fetches...</span>
                  </div>
                )}
                
                {!isGeneratingPresentation && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase font-mono">Select Design Theme Style</label>
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        {(['academic', 'corporate', 'startup', 'cyber', 'minimal', 'glass'] as const).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setPptTheme(t)}
                            className={`py-2 px-1 text-[10px] font-bold border rounded-lg cursor-pointer capitalize transition-all ${
                              pptTheme === t 
                                ? 'bg-indigo-650 border-indigo-500 text-white' 
                                : theme === 'dark' ? 'border-neutral-800 text-neutral-450 hover:border-neutral-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {t === 'startup' ? 'Startup' : t === 'cyber' ? 'Cyber Neon' : t === 'glass' ? 'Dark Glass' : t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase font-mono">Presentation Length</label>
                      <div className="flex gap-2 mt-2">
                        {([5, 10, 15] as const).map(l => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setPptLength(l)}
                            className={`flex-1 py-2 text-xs font-bold border rounded-lg cursor-pointer transition-all ${
                              pptLength === l 
                                ? 'bg-indigo-650 border-indigo-500 text-white' 
                                : theme === 'dark' ? 'border-neutral-800 text-neutral-450' : 'border-gray-200 text-gray-700'
                            }`}
                          >
                            {l} Slides
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-850 bg-neutral-950/20">
                      <div>
                        <span className="text-xs font-bold block">Detailed Mode</span>
                        <span className="text-[9.5px] text-neutral-455">Overrides the standard 40-word limit per slide.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={pptDetailedMode}
                        onChange={(e) => setPptDetailedMode(e.target.checked)}
                        className="accent-indigo-500 h-4.5 w-4.5 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowPptModal(false)}
                        className="rounded-lg px-4 py-2 text-xs font-bold border border-neutral-800 text-neutral-400 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={generateCustomPresentationDeck}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 text-xs font-bold cursor-pointer"
                      >
                        Generate Deck
                      </button>
                    </div>
                  </>
                )}
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
            theme === 'dark' ? 'bg-[#121318] border-neutral-850' : 'bg-white border-gray-200'
          }`}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />

            <div className="space-y-6 relative z-10 w-full flex flex-col items-center">
              
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
                        ? 'bg-neutral-900/40 border-neutral-800 text-neutral-150 focus:border-indigo-500'
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
                        ? 'bg-neutral-900/40 border-neutral-800 text-neutral-150 focus:border-indigo-500'
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
                      ? 'bg-red-500 text-white hover:bg-red-650' 
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
                      className="flex-1 py-3 px-4 rounded-lg bg-red-500 font-sans text-xs font-bold text-white hover:bg-red-650 transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
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
            theme === 'dark' ? 'bg-[#121318]/40 border-neutral-850' : 'bg-white border-gray-200'
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
                    theme === 'dark' ? 'border-neutral-800 text-neutral-305' : 'border-gray-200 text-gray-700'
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
              theme === 'dark' ? 'bg-[#121318] border-neutral-850' : 'bg-white border-gray-200'
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
                  className="h-10 flex items-center justify-center gap-1.5 px-3 border-y border-gray-100 dark:border-neutral-850/50 my-1"
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
                      <MicOff className="h-8 w-8 mb-2 opacity-50 text-gray-450 dark:text-neutral-500" />
                      <p className="text-[11px] font-bold text-gray-750 dark:text-neutral-300">Microphone Standby</p>
                      <p className="text-[10px] text-gray-450 dark:text-neutral-550 max-w-[180px] leading-normal font-semibold mt-1">
                        Press 'Start Capturing' to begin capturing your lecture.
                      </p>
                    </div>
                  ) : isPaused ? (
                    <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 font-sans space-y-2 animate-fade-in">
                      <Pause className="h-8 w-8 text-amber-500 animate-pulse" />
                      <div>
                        <p className="text-[11px] font-bold text-amber-500">Capture Suspended</p>
                        <p className="text-[10px] text-gray-455 dark:text-neutral-550 max-w-[180px] leading-normal font-semibold mt-1">
                          Audio input is paused. Press 'Resume' to continue capturing.
                        </p>
                      </div>
                    </div>
                  ) : aiStatus === 'synthesizing' ? (
                    <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 font-sans space-y-2">
                      <Cpu className="h-8 w-8 text-purple-400 animate-spin" />
                      <div>
                        <p className="text-[11px] font-bold text-purple-400 font-mono">Syncing Workspace...</p>
                        <p className="text-[10px] text-gray-455 dark:text-neutral-550 max-w-[180px] leading-normal font-semibold mt-1">
                          Uploading raw capture payload to Azure storage nodes.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 font-sans space-y-3 animate-fade-in">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute -inset-3 rounded-full bg-indigo-505/10 animate-ping" />
                        <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Mic className="h-5 w-5 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-indigo-400 animate-pulse font-mono uppercase tracking-wider">Listening...</p>
                        <p className="text-[10px] text-gray-455 dark:text-neutral-450 leading-normal font-semibold max-w-[200px]">
                          Audio stream is active and recording live input. Press 'Pause' to suspend or 'Stop & Sync' to submit.
                        </p>
                      </div>
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
              theme === 'dark' ? 'bg-[#121318] border-neutral-850' : 'bg-white border-gray-200'
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
