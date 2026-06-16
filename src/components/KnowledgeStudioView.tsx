/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Globe,
  FileText,
  Music,
  Youtube,
  HardDrive,
  Search,
  Award,
  Sparkles,
  RotateCcw,
  ArrowLeft,
  Play,
  Pause,
  Download,
  BookOpen,
  HelpCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Share2,
  FileAudio,
  Map,
  Sliders,
  FileSpreadsheet,
  Check,
  X,
  FileDigit,
  Volume2,
  Info
} from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { generateLectureContentFromText } from '../services/gemini';
import { getAzureUploadSasUrl, uploadBlobToAzure, extractTextFromDocument, extractTextFromUrl } from '../services/azure';
import pptxgen from 'pptxgenjs';
import BruteLoader from './BruteLoader';

interface KnowledgeStudioViewProps {
  userId: string | undefined;
  theme: 'light' | 'dark';
  setActivePage: (page: string) => void;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

interface GoogleDriveMockFile {
  name: string;
  type: string;
  size: string;
  content: string;
}

const GOOGLE_DRIVE_MOCK_FILES: GoogleDriveMockFile[] = [
  {
    name: "Ethics_and_Existentialism.docx",
    type: "docx",
    size: "42 KB",
    content: `Title: Ethics and Existentialism in Modern Philosophy
Abstract: This research paper details the core concepts of Existentialism, focusing on the works of Jean-Paul Sartre, Albert Camus, and Immanuel Kant. 
Existentialism asserts that 'existence precedes essence'—humans are not born with a predefined purpose; instead, they define their own purpose through choice and action. Sartre described this as being 'condemned to be free,' meaning we bear full responsibility for our choices.
Kant's Deontological Ethics provides a contrast, focusing on duty and categorical imperatives. The paper synthesizes how existential choice aligns or conflicts with universal moral duties.`
  },
  {
    name: "Limits_and_Derivatives_Calculus_III.pptx",
    type: "pptx",
    size: "1.2 MB",
    content: `Calculus III: Limits and Derivatives
Slide 1: Concept of Limits.
Limits describe the behavior of a function near a specific point, rather than at that point. Mathematically represented as lim_{x -> c} f(x) = L.
Slide 2: Derivatives & Instantaneous Velocity.
The derivative measures the instantaneous rate of change of a function. It is defined as the limit of the difference quotient: f'(x) = lim_{h -> 0} [f(x+h) - f(x)] / h.
Slide 3: Real World Applications.
Derivatives are used in physics to compute acceleration and velocity, and in economics to calculate marginal cost and revenue.`
  },
  {
    name: "Esters_Synthesis_Lab_Report.pdf",
    type: "pdf",
    size: "820 KB",
    content: `Organic Chemistry Lab: Synthesis of Ethyl Acetate
Introduction: This experiment details the Fischer esterification process, synthesizing ethyl acetate from ethanol and acetic acid.
Reaction Equation: CH3COOH + CH3CH2OH <=H2SO4=> CH3COOCH2CH3 + H2O
Methodology: Acetic acid and ethanol are mixed with a catalytic amount of concentrated sulfuric acid. The mixture is refluxed, then washed with sodium bicarbonate to remove excess acid, and distilled to purify the ester.
Results: Ratios of products indicate a 72% yield. Nuclear Magnetic Resonance (NMR) spectra confirm the ester linkage group at 4.1 ppm.`
  },
  {
    name: "Q1_Global_Market_Share_Tracker.xlsx",
    type: "xlsx",
    size: "95 KB",
    content: `Sheet: Market Share Tracking
Product,Q1 Share %,Q2 Share %,Revenue Growth %,Region
Widget Alpha,34.2,36.5,12.5,North America
Widget Beta,22.1,20.8,-3.2,Europe
Widget Gamma,43.7,42.7,8.4,Asia-Pacific
Notes: Revenue decline in Europe is attributed to supply chain disruptions.`
  }
];

export default function KnowledgeStudioView({ userId, theme, setActivePage }: KnowledgeStudioViewProps) {
  // Sources state
  const [sources, setSources] = useState<any[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Chat/Search state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Output Studio state
  const [activeOutputTab, setActiveOutputTab] = useState<'notes' | 'summary' | 'flashcards' | 'quiz' | 'mindmap' | 'slides' | 'podcast' | 'infographics'>('notes');
  const [notesFormat, setNotesFormat] = useState<'academic' | 'executive' | 'revision'>('academic');
  const [summaryFormat, setSummaryFormat] = useState<'short' | 'detailed' | 'revision-sheet'>('detailed');
  const [flashcardsFormat, setFlashcardsFormat] = useState<'basic' | 'advanced' | 'exam'>('basic');
  const [quizFormat, setQuizFormat] = useState<'mcq' | 'subjective' | 'case'>('mcq');
  
  // Multi-language Output Selector
  const [outputLanguage, setOutputLanguage] = useState<string>('English');

  // PDF Export Modal & Settings
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfExportData, setPdfExportData] = useState<{ title: string; data: any } | null>(null);
  const [selectedPdfTheme, setSelectedPdfTheme] = useState<'academic' | 'modern' | 'corporate' | 'dark'>('academic');

  // PPTX Export Modal & Settings
  const [showPptModal, setShowPptModal] = useState(false);
  const [pptTheme, setPptTheme] = useState<'academic' | 'corporate' | 'startup' | 'cyber' | 'minimal' | 'glass'>('academic');
  const [pptLength, setPptLength] = useState<5 | 10 | 15>(10);
  const [pptDetailedMode, setPptDetailedMode] = useState<boolean>(false);

  // Mindmap Interactive Drawer
  const [selectedMindmapNode, setSelectedMindmapNode] = useState<any | null>(null);
  
  // Quiz gameplay state
  const [activeQuizQuestionIdx, setActiveQuizQuestionIdx] = useState(0);
  const [selectedQuizAnswerIdx, setSelectedQuizAnswerIdx] = useState<number | null>(null);
  const [isQuizRevealed, setIsQuizRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Modals / Dropdowns
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState<'youtube' | 'website'>('website');
  
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isDriveConnecting, setIsDriveConnecting] = useState(false);

  // Audio / Podcast Playback state
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [podcastLog, setPodcastLog] = useState<string[]>([]);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechIdxRef = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch sources
  useEffect(() => {
    if (!userId) return;
    const loadSources = async () => {
      try {
        const q = query(collection(db, 'users', userId, 'sources'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const list: any[] = [];
        querySnapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setSources(list);
        if (list.length > 0 && !activeSourceId) {
          setActiveSourceId(list[0].id);
          setSelectedSourceIds([list[0].id]);
        }
      } catch (err) {
        console.error("Failed to load sources from Firestore:", err);
      }
    };
    loadSources();
  }, [userId]);

  // Synchronize notesFormat with activeSource's selectedMode
  useEffect(() => {
    if (activeSource) {
      const mode = activeSource.selectedMode || 'academic';
      setNotesFormat(mode);
    }
  }, [activeSourceId, sources]);

  const activeSource = sources.find(s => s.id === activeSourceId);

  // Helper to get Source Type Icon
  const getSourceIcon = (srcType: string) => {
    switch (srcType) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-400" />;
      case 'docx': return <FileText className="h-4 w-4 text-blue-400" />;
      case 'pptx': return <Sliders className="h-4 w-4 text-orange-400" />;
      case 'xlsx': return <FileSpreadsheet className="h-4 w-4 text-green-400" />;
      case 'youtube': return <Youtube className="h-4 w-4 text-red-500" />;
      case 'website': return <Globe className="h-4 w-4 text-teal-400" />;
      case 'mp3':
      case 'wav': return <Music className="h-4 w-4 text-pink-400" />;
      default: return <FileText className="h-4 w-4 text-neutral-400" />;
    }
  };

  // 1. FILE UPLOAD HANDLER
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return;
    const file = e.target.files[0];
    const name = file.name;
    const extension = name.split('.').pop()?.toLowerCase() || '';
    
    setIsUploading(true);
    setUploadProgress(10);
    setProcessingStatus('Uploading...');

    try {
      // Create firestore document initial state
      const docRef = await addDoc(collection(db, 'users', userId, 'sources'), {
        title: name,
        type: 'document',
        sourceType: extension,
        status: 'processing',
        createdAt: serverTimestamp(),
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      });

      // Local upload or Azure upload
      const sasRes = await getAzureUploadSasUrl(name);
      setUploadProgress(40);
      await uploadBlobToAzure(sasRes.uploadUrl, file, (progress) => {
        setUploadProgress(40 + Math.round(progress * 0.3));
      });

      setUploadProgress(80);
      setProcessingStatus('Extracting content...');
      
      const extractedText = await extractTextFromDocument(sasRes.blobPath);
      setUploadProgress(90);
      setProcessingStatus('AI Ingestion...');
      const aiData = await generateLectureContentFromText(extractedText, undefined, notesFormat);
      
      // Build slide deck structures
      const presentationSlides = aiData.notes?.map((n: any, idx: number) => ({
        title: n.title,
        bulletPoints: n.content.split('\n').filter((l: string) => l.trim().startsWith('-')).map((l: string) => l.replace(/^-\s*/, '')),
        speakerNotes: `Presenter remarks for slide ${idx + 1}: covers key themes in ${n.title}`,
        visualSuggestions: `A neat graphical flow mapping core definitions in ${n.title}`,
        keyTakeaways: n.title,
        references: name
      })) || [];

      // Generate Podcast script
      const script = `Professor: Welcome back, class. Today we are exploring some key insights from our source, ${name}.\nStudent: That's right! Specifically looking at the central mechanics and how they interact.\nProfessor: Let's start with the key terms. We have some essential concepts we must define first.`;

      // Save everything to Firestore
      await updateDoc(doc(db, 'users', userId, 'sources', docRef.id), {
        status: 'ready',
        selectedMode: notesFormat,
        content: extractedText,
        summary: aiData.summary || 'Summary placeholder text.',
        notes: aiData.notes || [],
        flashcards: aiData.flashcards || [],
        quiz: aiData.quiz || [],
        keyConcepts: aiData.keyConcepts || [],
        slides: presentationSlides,
        podcastScript: script
      });

      // Reload
      const updatedSnapshot = await getDocs(query(collection(db, 'users', userId, 'sources'), orderBy('createdAt', 'desc')));
      const updatedList: any[] = [];
      updatedSnapshot.forEach(docSnap => {
        updatedList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSources(updatedList);
      setActiveSourceId(docRef.id);
      setSelectedSourceIds([docRef.id]);

      setIsUploading(false);
      setProcessingStatus(null);
    } catch (err) {
      console.error("Upload process failed:", err);
      setIsUploading(false);
      setProcessingStatus("Failed");
    }
  };

  // 2. URL IMPORT HANDLER
  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput || !userId) return;
    
    setImportError(null);
    setShowUrlModal(false);
    setIsUploading(true);
    setUploadProgress(20);
    setProcessingStatus('Fetching URL data...');

    let docRef: any = null;
    try {
      docRef = await addDoc(collection(db, 'users', userId, 'sources'), {
        title: urlInput,
        type: 'online',
        sourceType: urlType,
        status: 'processing',
        createdAt: serverTimestamp(),
        url: urlInput
      });

      const { text, title } = await extractTextFromUrl(urlInput, urlType);
      
      if (urlType === 'youtube' && !text) {
        throw new Error('No transcript returned for the video.');
      }

      setUploadProgress(60);
      setProcessingStatus('AI Synthesizing...');

      if (urlType === 'youtube') {
        console.log('[YOUTUBE] Content stored:', text.length);
        const promptApproxLength = 1500;
        const payloadSize = text.length + promptApproxLength;
        console.log('[YOUTUBE] Gemini request payload size:', payloadSize);
      }

      const aiData = await generateLectureContentFromText(text, undefined, notesFormat);

      const presentationSlides = aiData.notes?.map((n: any, idx: number) => ({
        title: n.title,
        bulletPoints: n.content.split('\n').filter((l: string) => l.trim().startsWith('-')).map((l: string) => l.replace(/^-\s*/, '')),
        speakerNotes: `Key review for slides on ${n.title}`,
        visualSuggestions: `Concept map for ${n.title}`,
        keyTakeaways: n.title,
        references: title
      })) || [];

      const script = `Professor: Hello everyone. Let's study the imported web resource, ${title}.\nStudent: It details fascinating parameters about this subject.\nProfessor: Indeed, let's dissect the core findings.`;

      const updatePayload: any = {
        title: title,
        content: text,
        selectedMode: notesFormat,
        summary: aiData.summary || 'Summary of url content.',
        notes: aiData.notes || [],
        flashcards: aiData.flashcards || [],
        quiz: aiData.quiz || [],
        keyConcepts: aiData.keyConcepts || [],
        slides: presentationSlides,
        podcastScript: script
      };

      if (urlType === 'youtube') {
        updatePayload.sourceType = 'youtube';
        updatePayload.transcript = text;
        updatePayload.status = 'indexed';
      } else {
        updatePayload.status = 'ready';
      }

      await updateDoc(doc(db, 'users', userId, 'sources', docRef.id), updatePayload);

      // Reload list
      const updatedSnapshot = await getDocs(query(collection(db, 'users', userId, 'sources'), orderBy('createdAt', 'desc')));
      const updatedList: any[] = [];
      updatedSnapshot.forEach(docSnap => {
        updatedList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSources(updatedList);
      setActiveSourceId(docRef.id);
      setSelectedSourceIds([docRef.id]);
      
      setUrlInput('');
      setIsUploading(false);
      setProcessingStatus(null);
    } catch (err: any) {
      console.error("URL Import failed:", err);
      setIsUploading(false);
      setProcessingStatus("Failed");
      setImportError(`YouTube Ingestion Failed: ${err.message}`);

      if (docRef && docRef.id) {
        try {
          await updateDoc(doc(db, 'users', userId, 'sources', docRef.id), {
            status: 'failed',
            error: err.message || 'Import failed.'
          });
        } catch (dbErr) {
          console.error("Failed to update firestore source status on failure:", dbErr);
        }
      }
    }
  };

  const handleFormatChange = async (newFormat: 'academic' | 'executive' | 'revision') => {
    setNotesFormat(newFormat);
    if (!activeSourceId || !userId || !activeSource) return;

    if (activeSource.selectedMode === newFormat) return;

    setIsUploading(true);
    setUploadProgress(30);
    setProcessingStatus(`Re-synthesizing for ${newFormat.toUpperCase()} Mode...`);

    try {
      const aiData = await generateLectureContentFromText(activeSource.content, undefined, newFormat);
      setUploadProgress(70);

      const presentationSlides = aiData.notes?.map((n: any, idx: number) => ({
        title: n.title,
        bulletPoints: n.content.split('\n').filter((l: string) => l.trim().startsWith('-')).map((l: string) => l.replace(/^-\s*/, '')),
        speakerNotes: `Key review for slides on ${n.title}`,
        visualSuggestions: `Concept map for ${n.title}`,
        keyTakeaways: n.title,
        references: activeSource.title
      })) || [];

      const script = `Professor: Hello everyone. Let's study the imported resource, ${activeSource.title}.\nStudent: It details fascinating parameters about this subject.\nProfessor: Indeed, let's dissect the core findings.`;

      const updatePayload: any = {
        selectedMode: newFormat,
        summary: aiData.summary || 'Summary of content.',
        notes: aiData.notes || [],
        flashcards: aiData.flashcards || [],
        quiz: aiData.quiz || [],
        keyConcepts: aiData.keyConcepts || [],
        slides: presentationSlides,
        podcastScript: script
      };

      await updateDoc(doc(db, 'users', userId, 'sources', activeSourceId), updatePayload);

      // Reload list
      const updatedSnapshot = await getDocs(query(collection(db, 'users', userId, 'sources'), orderBy('createdAt', 'desc')));
      const updatedList: any[] = [];
      updatedSnapshot.forEach(docSnap => {
        updatedList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSources(updatedList);
      
      const updatedSource = updatedList.find(s => s.id === activeSourceId);
      if (updatedSource) {
        setActiveSourceId(activeSourceId);
      }

      setIsUploading(false);
      setProcessingStatus(null);
    } catch (err: any) {
      console.error("Re-synthesis failed:", err);
      setIsUploading(false);
      setProcessingStatus("Failed");
      setImportError(`Re-synthesis Failed: ${err.message}`);
    }
  };

  // 3. GOOGLE DRIVE IMPORT SIMULATOR
  const handleConnectDrive = () => {
    setIsDriveConnecting(true);
    setTimeout(() => {
      setIsDriveConnecting(false);
      setIsDriveConnected(true);
    }, 1200);
  };

  const handleImportDriveFile = async (driveFile: GoogleDriveMockFile) => {
    if (!userId) return;
    setShowDriveModal(false);
    setIsUploading(true);
    setUploadProgress(30);
    setProcessingStatus('Syncing from Drive...');

    try {
      const docRef = await addDoc(collection(db, 'users', userId, 'sources'), {
        title: driveFile.name,
        type: 'online',
        sourceType: driveFile.type,
        status: 'processing',
        createdAt: serverTimestamp(),
        size: driveFile.size
      });

      setUploadProgress(70);
      setProcessingStatus('Ingesting in Gemini...');

      const aiData = await generateLectureContentFromText(driveFile.content, undefined, notesFormat);

      const presentationSlides = aiData.notes?.map((n: any, idx: number) => ({
        title: n.title,
        bulletPoints: n.content.split('\n').filter((l: string) => l.trim().startsWith('-')).map((l: string) => l.replace(/^-\s*/, '')),
        speakerNotes: `Slide details covering: ${n.title}`,
        visualSuggestions: `Interactive diagram for: ${n.title}`,
        keyTakeaways: n.title,
        references: driveFile.name
      })) || [];

      const script = `Professor: Good morning. Let's do a briefing on ${driveFile.name}.\nStudent: The structure outlined here is direct.\nProfessor: Absolutely. Let's go over the key elements.`;

      await updateDoc(doc(db, 'users', userId, 'sources', docRef.id), {
        status: 'ready',
        selectedMode: notesFormat,
        content: driveFile.content,
        summary: aiData.summary || 'Summary of drive file.',
        notes: aiData.notes || [],
        flashcards: aiData.flashcards || [],
        quiz: aiData.quiz || [],
        keyConcepts: aiData.keyConcepts || [],
        slides: presentationSlides,
        podcastScript: script
      });

      // Reload list
      const updatedSnapshot = await getDocs(query(collection(db, 'users', userId, 'sources'), orderBy('createdAt', 'desc')));
      const updatedList: any[] = [];
      updatedSnapshot.forEach(docSnap => {
        updatedList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSources(updatedList);
      setActiveSourceId(docRef.id);
      setSelectedSourceIds([docRef.id]);

      setIsUploading(false);
      setProcessingStatus(null);
    } catch (err) {
      console.error("Drive import failed:", err);
      setIsUploading(false);
      setProcessingStatus("Failed");
    }
  };

  // 4. SOURCE DELETE HANDLER
  const handleDeleteSource = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'sources', id));
      const updatedList = sources.filter(s => s.id !== id);
      setSources(updatedList);
      if (activeSourceId === id) {
        if (updatedList.length > 0) {
          setActiveSourceId(updatedList[0].id);
          setSelectedSourceIds([updatedList[0].id]);
        } else {
          setActiveSourceId(null);
          setSelectedSourceIds([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete source:", err);
    }
  };

  // Toggle Source Selection for Multi-source intelligence
  const handleToggleSourceSelect = (id: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // AI workspace ask/search handles
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const queryText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Gather context from selected sources
      const selectedDocs = sources.filter(s => selectedSourceIds.includes(s.id));
      let context = '';
      if (selectedDocs.length > 0) {
        context = selectedDocs.map(d => `Source [${d.title}]:\n${d.content}`).join('\n\n');
      } else {
        context = 'No source selected. Answer generally.';
      }

      const prompt = `You are a helpful AI study assistant. Respond to the student's question based on the provided context. Keep it highly detailed, academic, and formatted in clean markdown.

Context:
${context}

Question:
${queryText}`;

      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to synthesize a response. Please check details.";
      
      setChatMessages(prev => [...prev, { sender: 'ai', text: answer }]);
    } catch (err) {
      console.error("Chat failed:", err);
      setChatMessages(prev => [...prev, { sender: 'ai', text: "Error connecting to AI. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  // Helper to strip markdown symbols
  const cleanMarkdownText = (text: string): string => {
    if (!text) return '';
    return text.replace(/[*#`_~]/g, '').trim();
  };

  // Helper to render text with citation tags
  const renderTextWithCitations = (text: string) => {
    if (!text) return '';
    const regex = /(\[Source:\s*[^\]]+\])/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span 
            key={index} 
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Structured sections summary parser
  interface StructuredSummary {
    introduction: string;
    keyConcepts: string;
    importantTopics: string;
    examples: string;
    formulas: string;
    keyTakeaways: string;
    revisionNotes: string;
  }

  const parseSummaryIntoSections = (summaryText: string): StructuredSummary => {
    const clean = (txt: string) => txt.replace(/[*#`_~]/g, '').trim();
    const sections: StructuredSummary = {
      introduction: '',
      keyConcepts: '',
      importantTopics: '',
      examples: '',
      formulas: '',
      keyTakeaways: '',
      revisionNotes: ''
    };

    if (!summaryText) return sections;

    const patterns = {
      introduction: /introduction/i,
      keyConcepts: /key\s+concepts/i,
      importantTopics: /important\s+topics/i,
      examples: /examples/i,
      formulas: /formulas/i,
      keyTakeaways: /key\s+takeaways/i,
      revisionNotes: /revision\s+notes/i
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
          sections.introduction += (sections.introduction ? '\n' : '') + line;
        }
      }
    });

    const keys = Object.keys(sections) as (keyof StructuredSummary)[];
    const filledCount = keys.filter(k => sections[k].trim().length > 0).length;

    if (filledCount < 3) {
      const words = summaryText.split(/\s+/);
      const chunkSize = Math.ceil(words.length / 7);
      for (let i = 0; i < 7; i++) {
        const partWords = words.slice(i * chunkSize, (i + 1) * chunkSize);
        sections[keys[i]] = partWords.join(' ');
      }
    }

    for (const key of keys) {
      sections[key] = clean(sections[key]);
    }

    return sections;
  };

  const extractJsonObject = (rawText: string): string => {
    let cleaned = rawText.trim();
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = cleaned.match(jsonBlockRegex);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    return cleaned;
  };

  // Multi-language translation handler
  const handleLanguageChange = async (lang: string) => {
    setOutputLanguage(lang);
    if (!activeSourceId || !userId || !activeSource) return;

    setIsUploading(true);
    setUploadProgress(15);
    setProcessingStatus(`Translating Workspace to ${lang}...`);

    try {
      const prompt = `
        You are a highly professional academic translator. Translate the following study materials into the requested language: "${lang}".
        If Hinglish is selected, translate the text into Hindi language, but spell it phonetically using Roman/English alphabet letters.
        Strictly retain the JSON format and structure. Do not change any keys. Only translate the string values.
        
        JSON to translate:
        ${JSON.stringify({
          summary: activeSource.summary || '',
          notes: activeSource.notes || [],
          flashcards: activeSource.flashcards || [],
          quiz: activeSource.quiz || [],
          keyConcepts: activeSource.keyConcepts || []
        })}
      `;

      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
                summary: { type: 'STRING' },
                notes: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: { title: { type: 'STRING' }, content: { type: 'STRING' } },
                    required: ['title', 'content']
                  }
                },
                flashcards: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: { q: { type: 'STRING' }, a: { type: 'STRING' } },
                    required: ['q', 'a']
                  }
                },
                quiz: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      question: { type: 'STRING' },
                      options: { type: 'ARRAY', items: { type: 'STRING' } },
                      correctAnswer: { type: 'INTEGER' },
                      explanation: { type: 'STRING' }
                    },
                    required: ['question', 'options', 'correctAnswer', 'explanation']
                  }
                },
                keyConcepts: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      id: { type: 'STRING' },
                      label: { type: 'STRING' },
                      desc: { type: 'STRING' },
                      parent: { type: 'STRING' },
                      x: { type: 'INTEGER' },
                      y: { type: 'INTEGER' },
                      group: { type: 'STRING' }
                    },
                    required: ['id', 'label', 'desc', 'x', 'y', 'group']
                  }
                }
              },
              required: ['summary', 'notes', 'flashcards', 'quiz', 'keyConcepts']
            }
          }
        })
      });

      setUploadProgress(70);
      if (!res.ok) throw new Error(`Translation API error: ${res.status}`);
      
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanedText = extractJsonObject(text);
      const translated = JSON.parse(cleanedText);

      setUploadProgress(90);
      await updateDoc(doc(db, 'users', userId, 'sources', activeSourceId), {
        summary: translated.summary || activeSource.summary,
        notes: translated.notes || activeSource.notes,
        flashcards: translated.flashcards || activeSource.flashcards,
        quiz: translated.quiz || activeSource.quiz,
        keyConcepts: translated.keyConcepts || activeSource.keyConcepts
      });

      const updatedSnapshot = await getDocs(query(collection(db, 'users', userId, 'sources'), orderBy('createdAt', 'desc')));
      const updatedList: any[] = [];
      updatedSnapshot.forEach(docSnap => {
        updatedList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSources(updatedList);

      setIsUploading(false);
      setProcessingStatus(null);
    } catch (err) {
      console.error("Multi-language translation failed, retaining content:", err);
      setIsUploading(false);
      setProcessingStatus("Failed");
    }
  };

  // PDF Export
  const exportPDFFile = (title: string, rawData: any, pdfTheme: 'academic' | 'modern' | 'corporate' | 'dark' = 'academic') => {
    let contentHtml = '';
    
    if (typeof rawData === 'string') {
      const sections = parseSummaryIntoSections(rawData);
      contentHtml = `
        <div class="pdf-section">
          <h2>1. Introduction</h2>
          <p>${sections.introduction.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>2. Key Concepts</h2>
          <p>${sections.keyConcepts.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>3. Important Topics</h2>
          <p>${sections.importantTopics.replace(/\n/g, '<br/>')}</p>
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
          <h2>6. Key Takeaways</h2>
          <p>${sections.keyTakeaways.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="pdf-section">
          <h2>7. Revision Notes</h2>
          <p>${sections.revisionNotes.replace(/\n/g, '<br/>')}</p>
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
            <div class="cover-subtitle">Knowledge Report & Synthesis</div>
            <div class="cover-meta">
              Generated by <strong>Note-IT AI V2 Output Studio</strong><br/>
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

  // PPTX builder with 6 custom templates
  const buildAndDownloadPPTX = async (
    slides: any[],
    deckTitle: string,
    themeName: 'academic' | 'corporate' | 'startup' | 'cyber' | 'minimal' | 'glass',
    isDetailed: boolean
  ) => {
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

    slides.forEach((s, idx) => {
      const slide = pptx.addSlide();
      slide.background = { fill: colors.bg };

      // Slide layout templates
      if (s.layout === 'title_slide' || idx === 0) {
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.15, fill: { color: colors.accent } });
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

        slide.addShape(pptx.ShapeType.roundRect, {
          x: 5.3, y: 1.0, w: 4.2, h: 3.8,
          fill: { color: colors.cardBg }, line: { color: colors.accent, width: 1.5 }
        });
        slide.addText(`Visual Representation Placeholder\n\nAI Prompt:\n"${s.imagePrompt}"`, {
          x: 5.5, y: 1.3, w: 3.8, h: 3.2,
          fontSize: 11, fontFace: "Courier New",
          color: colors.primary, italic: true, align: "center"
        });
      } else if (s.layout === 'timeline') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });
        slide.addShape(pptx.ShapeType.line, {
          x: 1.0, y: 2.6, w: 8.0, h: 0,
          line: { color: colors.accent, width: 2 }
        });
        const steps = s.content.slice(0, 4);
        const stepWidth = 8.0 / steps.length;
        steps.forEach((stepText: string, stepIdx: number) => {
          const xPos = 1.0 + (stepIdx * stepWidth);
          slide.addShape(pptx.ShapeType.ellipse, {
            x: xPos + (stepWidth / 2) - 0.2, y: 2.4, w: 0.4, h: 0.4,
            fill: { color: colors.accent }
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
      } else if (s.layout === 'key_metrics') {
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
          const statNum = `0${mIdx + 1}`;
          slide.addText(statNum, {
            x: xPos + 0.2, y: 1.5, w: cardWidth - 0.4, h: 1.0,
            fontSize: 44, color: colors.accent, bold: true, align: "center"
          });
          slide.addText(m, {
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
      } else if (s.layout === 'bold_quote') {
        slide.addText(s.title, {
          x: 0.5, y: 0.4, w: 9.0, h: 0.6,
          fontSize: 20, fontFace: "Helvetica",
          color: colors.accent, bold: true
        });
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 1.2, y: 1.3, w: 7.6, h: 3.2,
          fill: { color: colors.cardBg }, line: { color: colors.accent, width: 2 }
        });
        slide.addText(`"${s.content.join(' ')}"`, {
          x: 1.5, y: 1.6, w: 7.0, h: 2.2,
          fontSize: 18, fontFace: "Helvetica",
          color: colors.text, italic: true, align: "center", bold: true
        });
        slide.addText(`Visual Suggestion: ${s.imagePrompt}`, {
          x: 1.5, y: 3.9, w: 7.0, h: 0.4,
          fontSize: 9, fontFace: "Courier New",
          color: colors.primary, italic: true, align: "center"
        });
      }

      if (s.keyTakeaway) {
        slide.addText(`Takeaway: ${s.keyTakeaway}`, {
          x: 0.5, y: 5.2, w: 9.0, h: 0.4,
          fontSize: 10.5, fontFace: "Helvetica",
          color: colors.accent, italic: true
        });
      }
      slide.addText(`Slide ${idx + 1} of ${slides.length}`, {
        x: 8.5, y: 5.2, w: 1.5, h: 0.4,
        fontSize: 9, fontFace: "Helvetica",
        color: colors.primary, align: "right"
      });
    });

    pptx.writeFile({ fileName: `${deckTitle.replace(/\s+/g, "_")}.pptx` });
  };

  // Custom presentation generator modal triggers
  const generateCustomPresentationDeck = async () => {
    if (!activeSource || !userId) return;
    setIsUploading(true);
    setUploadProgress(10);
    setProcessingStatus("Generating slide content...");

    try {
      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const prompt = `
        Create a structured PowerPoint presentation deck based on the following material.
        
        Document Title: "${activeSource.title}"
        Material Content:
        ${activeSource.content ? activeSource.content.substring(0, 8000) : activeSource.summary}
        
        Configuration Requirements:
        - Theme style: ${pptTheme}
        - Slide count: Exactly ${pptLength} slides
        - Text limit: ${pptDetailedMode ? 'detailed explanations' : 'strictly under 40 words total per slide (short bullet points)'}
        
        For each slide, you must define:
        1. "title": A short title for the slide
        2. "layout": One of ['title_slide', 'split_column', 'timeline', 'key_metrics', 'grid_quadrant', 'bold_quote']
        3. "content": An array of bullet points (each 6-12 words max). If not Detailed Mode, make sure the entire text of the slide is very brief (less than 40 words total).
        4. "imagePrompt": A detailed descriptive text prompt to generate an AI image illustrating the slide content.
        5. "keyTakeaway": A short 1-sentence takeaway displayed at the bottom of the slide.
        
        Return the response strictly as a JSON object with a "slides" array.
      `;

      setUploadProgress(30);
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
                      imagePrompt: { type: 'STRING' },
                      keyTakeaway: { type: 'STRING' }
                    },
                    required: ['title', 'layout', 'content', 'imagePrompt', 'keyTakeaway']
                  }
                }
              },
              required: ['slides']
            }
          }
        })
      });

      setUploadProgress(75);
      let slides = [];
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedText = extractJsonObject(text);
        const parsed = JSON.parse(cleanedText);
        slides = parsed.slides || [];
      } else {
        throw new Error("Failed to generate slides via Gemini API");
      }

      setUploadProgress(90);
      setProcessingStatus("Building PowerPoint file...");
      await buildAndDownloadPPTX(slides, activeSource.title, pptTheme, pptDetailedMode);

      setIsUploading(false);
      setProcessingStatus(null);
      setShowPptModal(false);
    } catch (err) {
      console.error("Custom slide generation failed, using local fallback...", err);
      const notes = activeSource.notes || [];
      const slides = [];
      const layouts = ['split_column', 'timeline', 'key_metrics', 'grid_quadrant', 'bold_quote'];

      slides.push({
        title: activeSource.title,
        layout: 'title_slide',
        content: ['Comprehensive Study Deck', 'Powered by Note-IT AI Studio'],
        imagePrompt: `An academic library, classical style, warm lighting`,
        keyTakeaway: `Initial review baseline`
      });

      for (let i = 0; i < pptLength - 1; i++) {
        const note = notes[i % notes.length] || { title: `Topic Section ${i + 1}`, content: `Details for section ${i + 1} content.` };
        const layout = layouts[i % layouts.length];
        const textLines = note.content.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 4);
        const cleanLines = textLines.map((l: string) => l.replace(/[*#-]/g, '').trim());

        slides.push({
          title: note.title,
          layout,
          content: cleanLines.slice(0, 3),
          imagePrompt: `Professional presentation graphic representing ${note.title}, vector art style`,
          keyTakeaway: `Key understanding of ${note.title}`
        });
      }

      await buildAndDownloadPPTX(slides, activeSource.title, pptTheme, pptDetailedMode);
      setIsUploading(false);
      setProcessingStatus(null);
      setShowPptModal(false);
    }
  };

  const exportPPTXFile = (slides: any[], title: string) => {
    // Intercept with the custom generation modal
    setShowPptModal(true);
  };

  // TTS Podcast script player
  const startPodcastAudio = () => {
    if (!activeSource || !activeSource.podcastScript) return;
    window.speechSynthesis.cancel();
    setIsPodcastPlaying(true);
    setPodcastLog([]);

    const lines = activeSource.podcastScript.split('\n').filter((l: string) => l.trim().includes(':'));
    speechIdxRef.current = 0;

    const speakNextLine = () => {
      if (speechIdxRef.current >= lines.length) {
        setIsPodcastPlaying(false);
        return;
      }

      const currentLine = lines[speechIdxRef.current];
      const speaker = currentLine.split(':')[0].trim();
      const text = currentLine.split(':').slice(1).join(':').trim();

      setPodcastLog(prev => [...prev, `${speaker}: ${text}`]);

      const utterance = new SpeechSynthesisUtterance(text);
      speechUtteranceRef.current = utterance;

      const voices = window.speechSynthesis.getVoices();
      if (speaker.toLowerCase().includes('professor')) {
        // Find male voice
        const maleVoice = voices.find(v => v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('google us english') || v.lang.startsWith('en-US'));
        if (maleVoice) utterance.voice = maleVoice;
        utterance.pitch = 0.85;
      } else {
        // Find female voice
        const femaleVoice = voices.find(v => v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('microsoft') || v.name.toLowerCase().includes('female') || v.lang.startsWith('en-GB'));
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.pitch = 1.15;
      }

      utterance.onend = () => {
        speechIdxRef.current += 1;
        speakNextLine();
      };

      utterance.onerror = () => {
        setIsPodcastPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextLine();
  };

  const stopPodcastAudio = () => {
    window.speechSynthesis.cancel();
    setIsPodcastPlaying(false);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className={`flex flex-col h-full rounded-2xl overflow-hidden border transition-all select-none ${
      theme === 'dark' ? 'bg-[#0a0b0e] border-neutral-900 text-white' : 'bg-[#FAF9F5] border-gray-200 text-gray-900'
    }`}>
      
      {/* HEADER BANNER */}
      <div className={`p-4 border-b flex items-center justify-between ${
        theme === 'dark' ? 'bg-[#0d0e12] border-neutral-900' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
          <div>
            <h1 className="text-sm font-black tracking-tight font-sans">KNOWLEDGE STUDIO</h1>
            <p className="text-[10px] text-neutral-400 font-medium">NotebookLM Ingestions • Premium Cyber Workspace</p>
          </div>
        </div>

        {/* Global loader overlay */}
        {isUploading && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
            <BruteLoader size="xs" message="" />
            <span>{processingStatus || 'Processing...'} ({uploadProgress}%)</span>
          </div>
        )}
      </div>

      {/* 3 PANEL WORKSPACE */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* PANEL 1: LEFT - SOURCE HUB (Knowledge Sources) */}
        <div className={`w-full md:w-80 flex-shrink-0 flex flex-col border-r overflow-y-auto p-4 space-y-4 ${
          theme === 'dark' ? 'bg-[#08090c] border-neutral-900' : 'bg-gray-50/50 border-gray-200'
        }`}>
          <div>
            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">Knowledge Sources</h2>
            <p className="text-[10px] text-neutral-400 mt-0.5">Attach documents, URLs, or Drive files to start.</p>
          </div>

          {importError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 flex items-start gap-2.5">
              <div className="text-xs text-red-500 font-semibold flex-1 leading-normal">{importError}</div>
              <button 
                type="button"
                onClick={() => setImportError(null)} 
                className="text-red-450 hover:text-red-600 text-sm font-bold focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* Action Grid Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-extrabold transition-all hover:scale-98 cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-900 hover:border-neutral-700 text-white' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Upload className="h-3.5 w-3.5 text-indigo-450" />
              <span>Upload File</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.docx,.txt,.md,.pptx,.xlsx,.csv"
            />

            <button
              onClick={() => { setUrlType('website'); setShowUrlModal(true); }}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-extrabold transition-all hover:scale-98 cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-900 hover:border-neutral-700 text-white' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-teal-400" />
              <span>Add URL</span>
            </button>

            <button
              onClick={() => setShowDriveModal(true)}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-extrabold transition-all hover:scale-98 cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-900 hover:border-neutral-700 text-white' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5 text-blue-450" />
              <span>Google Drive</span>
            </button>

            <button
              onClick={() => { setUrlType('youtube'); setShowUrlModal(true); }}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-extrabold transition-all hover:scale-98 cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-900 hover:border-neutral-700 text-white' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Youtube className="h-3.5 w-3.5 text-red-500" />
              <span>Import YT</span>
            </button>
          </div>

          {/* Sources List Cards */}
          <div className="space-y-2.5 flex-1">
            {sources.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-neutral-800 rounded-xl">
                <Info className="h-6 w-6 text-neutral-600 mx-auto" />
                <p className="text-[10px] text-neutral-400 mt-2 font-mono">No sources indexed.</p>
              </div>
            ) : (
              sources.map((src) => {
                const isSelected = selectedSourceIds.includes(src.id);
                const isActive = activeSourceId === src.id;
                
                return (
                  <div
                    key={src.id}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all group ${
                      isActive 
                        ? theme === 'dark' 
                          ? 'border-indigo-500 bg-indigo-500/5' 
                          : 'border-black bg-gray-50' 
                        : theme === 'dark' 
                          ? 'border-neutral-900 bg-neutral-950/40 hover:border-neutral-800' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSourceSelect(src.id)}
                        className="mt-1 accent-indigo-500 cursor-pointer h-3.5 w-3.5"
                      />
                      <div className="flex-1 min-w-0" onClick={() => setActiveSourceId(src.id)}>
                        <div className="flex items-center gap-1.5">
                          {getSourceIcon(src.sourceType)}
                          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
                            {src.sourceType}
                          </span>
                        </div>
                        <h4 className="text-[11.5px] font-extrabold truncate mt-1 leading-snug cursor-pointer hover:underline">
                          {src.title}
                        </h4>
                        <span className="text-[9.5px] text-neutral-400 font-mono mt-0.5 block">
                          {src.size || 'Web Stream'} • {src.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-neutral-450 hover:text-red-500 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL 2: CENTER - AI WORKSPACE */}
        <div className={`flex-1 flex flex-col overflow-hidden p-4 space-y-4 ${
          theme === 'dark' ? 'bg-[#050608]' : 'bg-[#FAF9F5]'
        }`}>
          <div>
            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">AI Workspace</h2>
            <p className="text-[10px] text-neutral-400 mt-0.5">Synthesize outlines, check contradictions, or query sources.</p>
          </div>

          {/* Quick Prompts Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
            {[
              "Summarize selected sources",
              "Compare all sources",
              "Find contradictions in documents",
              "Explain difficult formulas/methods",
              "Generate interview checklist"
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold transition-all hover:scale-98 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-350 hover:bg-neutral-850 hover:border-neutral-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className={`flex-1 rounded-2xl border p-4 overflow-y-auto space-y-4 font-sans ${
            theme === 'dark' ? 'bg-[#090b0e]/75 border-neutral-900/60' : 'bg-white border-gray-200'
          }`}>
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Sparkles className="h-8 w-8 text-indigo-500 animate-pulse" />
                <h3 className="text-xs font-bold text-neutral-400">Search Workspace Active</h3>
                <p className="text-[10px] text-neutral-500 max-w-xs leading-relaxed">
                  Enter a query below. AI will reference all selected sources ({selectedSourceIds.length} active) to answer.
                </p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed select-text ${
                    msg.sender === 'user'
                      ? theme === 'dark' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-black text-white'
                      : theme === 'dark'
                        ? 'bg-[#121318] border border-neutral-850 text-neutral-200'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    <span className="font-mono text-[9px] font-black uppercase tracking-wider block opacity-60 mb-1">
                      {msg.sender === 'user' ? 'Student query' : 'NoteIT Intelligence'}
                    </span>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-3 border flex items-center gap-3 ${theme === 'dark' ? 'bg-[#121318] border-neutral-850 text-neutral-400' : 'bg-gray-100 border-gray-250 text-gray-500'}`}>
                  <BruteLoader size="xs" message="" />
                  <span className="text-xs font-mono font-bold tracking-wider animate-pulse">Synthesizing logical layers...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              required
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about your selected sources..."
              className={`flex-grow rounded-xl text-xs font-semibold outline-none p-3.5 transition-all ${
                theme === 'dark' 
                  ? 'bg-neutral-950 border border-neutral-850 text-white placeholder-neutral-600 focus:border-indigo-500' 
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black'
              }`}
            />
            <button
              type="submit"
              disabled={isChatLoading || selectedSourceIds.length === 0}
              className={`rounded-xl px-5 py-3.5 text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
                theme === 'dark' ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Ask
            </button>
          </form>
        </div>

        {/* PANEL 3: RIGHT - OUTPUT STUDIO */}
        <div className={`w-full md:w-[420px] flex-shrink-0 flex flex-col border-l overflow-y-auto p-4 space-y-4 ${
          theme === 'dark' ? 'bg-[#08090c] border-neutral-900' : 'bg-gray-50/50 border-gray-200'
        }`}>
          <div>
            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">Output Studio</h2>
            <p className="text-[10px] text-neutral-400 mt-0.5">Generate, display, and export materials.</p>
          </div>

          {/* Multi-language selector */}
          {activeSourceId && (
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
              theme === 'dark' ? 'bg-neutral-950/70 border-neutral-900/60' : 'bg-gray-50 border-gray-200'
            }`}>
              <span className="text-[10px] font-black uppercase text-neutral-450 tracking-wider">Output Language</span>
              <select
                value={outputLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`rounded px-2.5 py-1 text-xs font-bold border outline-none cursor-pointer ${
                  theme === 'dark' ? 'bg-neutral-900 border-neutral-850 text-white' : 'bg-white border-gray-300 text-black'
                }`}
              >
                {['English', 'Hindi', 'Hinglish', 'Marathi', 'Tamil', 'Gujarati', 'Bengali'].map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          )}

          {/* Mini-Tab Selector */}
          <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl ${theme === 'dark' ? 'bg-neutral-950' : 'bg-gray-150'}`}>
            {(['notes', 'summary', 'flashcards', 'quiz'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveOutputTab(tab);
                  setSelectedMindmapNode(null);
                }}
                className={`py-1.5 rounded-lg text-[10px] font-black capitalize transition-all cursor-pointer ${
                  activeOutputTab === tab 
                    ? theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-white text-black shadow-xs' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl ${theme === 'dark' ? 'bg-neutral-950' : 'bg-gray-150'}`}>
            {(['mindmap', 'slides', 'podcast', 'infographics'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveOutputTab(tab);
                  setSelectedMindmapNode(null);
                }}
                className={`py-1.5 rounded-lg text-[10px] font-black capitalize transition-all cursor-pointer ${
                  activeOutputTab === tab 
                    ? theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-white text-black shadow-xs' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab === 'mindmap' ? 'Mind Map' : tab === 'slides' ? 'Slides' : tab === 'podcast' ? 'Podcast' : 'Infographics'}
              </button>
            ))}
          </div>

          {/* Tab contents block */}
          <div className="flex-1 overflow-y-auto">
            {!activeSourceId ? (
              <div className="text-center py-16 text-neutral-500 font-mono text-[10.5px]">
                Please select/index a source to view outputs.
              </div>
            ) : !activeSource ? (
              <div className="text-center py-16 text-neutral-500 font-mono text-[10.5px]">
                Loading source details...
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. NOTES TAB */}
                {activeOutputTab === 'notes' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {(['academic', 'executive', 'revision'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => handleFormatChange(f)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                              notesFormat === f ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-455'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setPdfExportData({ title: `${activeSource.title} - Notes`, data: activeSource.notes });
                          setShowPdfModal(true);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Export PDF</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeSource.notes && activeSource.notes.map((n: any, i: number) => (
                        <div key={i} className={`p-4 rounded-xl border font-sans ${theme === 'dark' ? 'bg-[#121318] border-neutral-905' : 'bg-white border-gray-200'}`}>
                          <h4 className="text-xs font-black text-indigo-400">{n.title}</h4>
                          <p className="text-[11.5px] mt-2 text-neutral-300 leading-relaxed whitespace-pre-wrap">
                            {renderTextWithCitations(cleanMarkdownText(n.content))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. SUMMARY TAB */}
                {activeOutputTab === 'summary' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {(['short', 'detailed', 'revision-sheet'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setSummaryFormat(f)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                              summaryFormat === f ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-455'
                            }`}
                          >
                            {f.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setPdfExportData({ title: `${activeSource.title} - Summary`, data: activeSource.summary });
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
                        const sections = parseSummaryIntoSections(activeSource.summary);
                        const sectionConfig = [
                          { label: 'Introduction', content: sections.introduction },
                          { label: 'Key Concepts', content: sections.keyConcepts },
                          { label: 'Important Topics', content: sections.importantTopics },
                          { label: 'Examples', content: sections.examples },
                          { label: 'Formulas', content: sections.formulas },
                          { label: 'Key Takeaways', content: sections.keyTakeaways },
                          { label: 'Revision Notes', content: sections.revisionNotes }
                        ];

                        return sectionConfig.map((sec, idx) => (
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {(['basic', 'advanced', 'exam'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setFlashcardsFormat(f)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                              flashcardsFormat === f ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-455'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setPdfExportData({ title: `${activeSource.title} - Flashcards`, data: activeSource.flashcards });
                          setShowPdfModal(true);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Export PDF</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeSource.flashcards && activeSource.flashcards.map((f: any, i: number) => (
                        <div key={i} className={`p-4.5 rounded-xl border font-sans space-y-2 ${
                          theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
                        }`}>
                          <div className="text-[10px] font-bold text-indigo-400 font-mono">Q. CARD {i + 1}</div>
                          <div className="text-xs font-black">{renderTextWithCitations(cleanMarkdownText(f.q))}</div>
                          <div className="text-[11.5px] text-neutral-350 pt-2 border-t border-neutral-900/20">
                            {renderTextWithCitations(cleanMarkdownText(f.a))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. QUIZ TAB */}
                {activeOutputTab === 'quiz' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {(['mcq', 'subjective', 'case'] as const).map(f => (
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
                          setPdfExportData({ title: `${activeSource.title} - Quiz`, data: activeSource.quiz });
                          setShowPdfModal(true);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Export PDF</span>
                      </button>
                    </div>

                    {activeSource.quiz && activeSource.quiz.length > 0 ? (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'}`}>
                          <div className="text-[10px] font-black text-indigo-400 font-mono">QUESTION {activeQuizQuestionIdx + 1} of {activeSource.quiz.length}</div>
                          <h4 className="text-xs font-bold font-sans mt-2 leading-relaxed">
                            {renderTextWithCitations(cleanMarkdownText(activeSource.quiz[activeQuizQuestionIdx].question))}
                          </h4>
                          
                          <div className="grid grid-cols-1 gap-2 mt-4">
                            {activeSource.quiz[activeQuizQuestionIdx].options.map((opt: string, optIdx: number) => {
                              const isSelected = selectedQuizAnswerIdx === optIdx;
                              const isCorrect = optIdx === activeSource.quiz[activeQuizQuestionIdx].correctAnswer;
                              
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
                              {renderTextWithCitations(cleanMarkdownText(activeSource.quiz[activeQuizQuestionIdx].explanation))}
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
                                  setActiveQuizQuestionIdx(prev => (prev + 1) % activeSource.quiz.length);
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
                  <div className="space-y-3 text-center">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase">Interactive Concept Net</span>
                      <button
                        onClick={() => {
                          setPdfExportData({ title: `${activeSource.title} - Concept Map`, data: activeSource.keyConcepts });
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
                      <svg className="w-full h-full">
                        {/* Lines linking nodes */}
                        {activeSource.keyConcepts && activeSource.keyConcepts.map((node: any, idx: number) => {
                          if (node.parent) {
                            const parentNode = activeSource.keyConcepts.find((n: any) => n.id === node.parent);
                            if (parentNode) {
                              return (
                                <line
                                  key={idx}
                                  x1={`${parentNode.x}%`}
                                  y1={`${parentNode.y}%`}
                                  x2={`${node.x}%`}
                                  y2={`${node.y}%`}
                                  stroke={theme === 'dark' ? '#312e81' : '#e2e8f0'}
                                  strokeWidth="1.5"
                                  strokeDasharray="4"
                                />
                              );
                            }
                          }
                          return null;
                        })}

                        {/* Renders interactive nodes */}
                        {activeSource.keyConcepts && activeSource.keyConcepts.map((node: any, idx: number) => (
                          <g key={idx} onClick={() => setSelectedMindmapNode(node)} className="cursor-pointer group">
                            <circle
                              cx={`${node.x}%`}
                              cy={`${node.y}%`}
                              r={node.id === 'root' ? 14 : 9}
                              fill={selectedMindmapNode?.id === node.id ? '#10b981' : (node.id === 'root' ? '#4f46e5' : '#818cf8')}
                              className="transition-all hover:scale-110"
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
                        Click on nodes to show conceptual details drawer.
                      </div>
                    </div>

                    {/* Interactive Node Side Panel Details Drawer */}
                    {selectedMindmapNode && (
                      <div className={`p-4 rounded-xl border text-left space-y-2.5 animate-fade-in ${
                        theme === 'dark' ? 'bg-[#121318] border-neutral-900' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
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
                          <strong className="text-indigo-400 block text-[10px] uppercase font-mono">Definition & Explanation</strong>
                          {renderTextWithCitations(cleanMarkdownText(selectedMindmapNode.desc || selectedMindmapNode.explanation || 'Provides logical synthesis for this section.'))}
                        </div>
                        {selectedMindmapNode.examples && (
                          <div className="text-[11.5px] leading-relaxed text-neutral-350">
                            <strong className="text-indigo-400 block text-[10px] uppercase font-mono">Examples & Analogies</strong>
                            {renderTextWithCitations(cleanMarkdownText(selectedMindmapNode.examples))}
                          </div>
                        )}
                        <div className="text-[9.5px] font-mono text-indigo-455 pt-1.5 border-t border-neutral-900/30">
                          Reference Citation: {selectedMindmapNode.sourceCitation || `[Source: ${activeSource.title}, Node indexing]`}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. SLIDE DECK TAB */}
                {activeOutputTab === 'slides' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase">AI Presentation Architect</span>
                      <button
                        onClick={() => exportPPTXFile(activeSource.slides || [], activeSource.title)}
                        className="flex items-center gap-1.5 text-[10.5px] font-bold text-indigo-400 hover:underline cursor-pointer bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/15"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export PPTX</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeSource.slides && activeSource.slides.map((s: any, idx: number) => (
                        <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between ${
                          theme === 'dark' ? 'bg-neutral-950/65 border-neutral-900' : 'bg-white border-gray-200'
                        }`}>
                          <div>
                            <span className="text-[8px] font-bold text-indigo-400 font-mono uppercase">Slide {idx + 1} of {activeSource.slides.length}</span>
                            <h4 className="text-xs font-black text-white mt-1">{s.title}</h4>
                            <ul className="list-disc pl-4 mt-2.5 space-y-1.5">
                              {s.bulletPoints.map((bp: string, bidx: number) => (
                                <li key={bidx} className="text-[11.5px] text-neutral-350 leading-relaxed">{bp}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="mt-4 pt-2.5 border-t border-neutral-900/30 flex flex-col gap-1.5 text-[9.5px] text-neutral-500">
                            <div><strong className="text-indigo-400">Speaker Notes:</strong> {s.speakerNotes}</div>
                            <div><strong className="text-indigo-400">Visual Suggestions:</strong> {s.visualSuggestions}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. PODCAST / AUDIO OVERVIEW */}
                {activeOutputTab === 'podcast' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase">Dialogue Overview Creator</span>
                      <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[8.5px] font-bold text-indigo-400 font-mono">
                        Gemini TTS
                      </span>
                    </div>

                    <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#0d0e12] border-neutral-900' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between pb-3.5 border-b border-neutral-900/20">
                        <div>
                          <h4 className="text-[11.5px] font-black">Synthesize Study Podcast</h4>
                          <p className="text-[9.5px] text-neutral-400 mt-0.5">Professor & Student dynamic audio conversation</p>
                        </div>
                        
                        {!isPodcastPlaying ? (
                          <button
                            onClick={startPodcastAudio}
                            className="h-8.5 w-8.5 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-transform active:scale-95 cursor-pointer"
                          >
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                          </button>
                        ) : (
                          <button
                            onClick={stopPodcastAudio}
                            className="h-8.5 w-8.5 flex items-center justify-center bg-red-650 hover:bg-red-600 text-white rounded-full transition-transform active:scale-95 cursor-pointer"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Speaking subtitles log */}
                      <div className="h-44 overflow-y-auto mt-4 p-2 bg-neutral-950/45 rounded-lg space-y-2">
                        {podcastLog.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-[10px] text-neutral-500 font-mono">
                            Click Play to stream conversation.
                          </div>
                        ) : (
                          podcastLog.map((logLine, lidx) => (
                            <div key={lidx} className="text-[10.5px] font-sans leading-relaxed">
                              <strong className="text-indigo-400 uppercase tracking-widest text-[9px] block">
                                {logLine.split(':')[0]}
                              </strong>
                              <span className="text-neutral-250">{logLine.split(':').slice(1).join(':')}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. INFOGRAPHICS TAB */}
                {activeOutputTab === 'infographics' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase">Flowcharts & Timelines</span>
                      <button
                        onClick={() => exportPDFFile(`${activeSource.title} - Infographics`, 'Visual charts details.')}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Export PDF</span>
                      </button>
                    </div>

                    <div className={`p-4 rounded-xl border space-y-4 font-sans ${theme === 'dark' ? 'bg-[#0d0e12] border-neutral-900' : 'bg-white border-gray-200'}`}>
                      <div>
                        <span className="text-[9px] font-bold text-indigo-400 font-mono uppercase block">Project Timeline</span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-black text-white">1</div>
                          <div className="flex-1 text-[11px] text-neutral-300 font-extrabold truncate">Step 1: Core concepts and indexing rules</div>
                        </div>
                        <div className="w-0.5 h-4 bg-indigo-500/25 ml-3" />
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-black text-white">2</div>
                          <div className="flex-1 text-[11px] text-neutral-300 font-extrabold truncate">Step 2: Method validation & sample analysis</div>
                        </div>
                        <div className="w-0.5 h-4 bg-indigo-500/25 ml-3" />
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-black text-white">3</div>
                          <div className="flex-1 text-[11px] text-neutral-300 font-extrabold truncate">Step 3: Synthesis and comparative outputs</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>

      {/* URL IMPORT MODAL */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className={`rounded-2xl max-w-md w-full border p-6 space-y-4 shadow-2xl relative ${
            theme === 'dark' ? 'bg-[#0d0e12] border-neutral-850 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900/40">
              <h3 className="font-sans font-black text-sm flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-indigo-400" />
                <span>Import Online Resource</span>
              </h3>
              <button 
                onClick={() => setShowUrlModal(false)}
                className="text-neutral-500 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUrlImport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase font-mono">Resource Type</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setUrlType('website')}
                    className={`flex-1 py-2 px-3 text-xs font-bold border rounded-lg cursor-pointer ${
                      urlType === 'website' ? 'bg-indigo-650 border-indigo-500 text-white' : 'border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Website URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlType('youtube')}
                    className={`flex-1 py-2 px-3 text-xs font-bold border rounded-lg cursor-pointer ${
                      urlType === 'youtube' ? 'bg-indigo-650 border-indigo-500 text-white' : 'border-neutral-800 text-neutral-400'
                    }`}
                  >
                    YouTube Link
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase font-mono">Resource URL</label>
                <input
                  type="url"
                  required
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className={`w-full rounded-xl text-xs font-semibold outline-none p-3 mt-1.5 ${
                    theme === 'dark' ? 'bg-neutral-950 border border-neutral-850 text-white' : 'bg-gray-100 border border-gray-300 text-black'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-bold border border-neutral-800 text-neutral-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 text-xs font-bold cursor-pointer"
                >
                  Import Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOOGLE DRIVE MOCK MODAL */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className={`rounded-2xl max-w-lg w-full border p-6 space-y-4 shadow-2xl relative ${
            theme === 'dark' ? 'bg-[#0d0e12] border-neutral-850 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900/40">
              <h3 className="font-sans font-black text-sm flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-blue-450" />
                <span>Import Google Drive Materials</span>
              </h3>
              <button 
                onClick={() => setShowDriveModal(false)}
                className="text-neutral-500 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            {!isDriveConnected ? (
              <div className="text-center py-10 space-y-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mx-auto">
                  <HardDrive className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black">Authorize Google Account Connection</h4>
                  <p className="text-[10px] text-neutral-450 max-w-xs mx-auto leading-relaxed">
                    Connect your Academic Drive folders to sync docs, notes, and spreadsheet assets.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConnectDrive}
                  disabled={isDriveConnecting}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {isDriveConnecting ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Requesting OAuth Token...</span>
                    </>
                  ) : (
                    <span>Authorize Google Drive</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 px-3.5 py-2 rounded-xl">
                  <span className="text-[10.5px] text-green-400 font-bold">✓ Connected: scholar.session@google.edu</span>
                  <button 
                    onClick={() => setIsDriveConnected(false)} 
                    className="text-[9.5px] text-neutral-400 hover:text-white hover:underline cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {GOOGLE_DRIVE_MOCK_FILES.map((file, fIdx) => (
                    <div
                      key={fIdx}
                      onClick={() => handleImportDriveFile(file)}
                      className={`rounded-xl border p-3 flex justify-between items-center transition-all hover:border-blue-500 cursor-pointer ${
                        theme === 'dark' ? 'border-neutral-900 bg-neutral-950/40' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getSourceIcon(file.type)}
                        <div className="truncate">
                          <h4 className="text-[11.5px] font-black truncate">{file.name}</h4>
                          <span className="text-[9px] text-neutral-500 font-mono">{file.size}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest font-mono group-hover:underline">
                        Import
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                          : theme === 'dark' ? 'border-neutral-800 text-neutral-400 hover:border-neutral-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
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
                          : theme === 'dark' ? 'border-neutral-800 text-neutral-400' : 'border-gray-200 text-gray-700'
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
                  <span className="text-[9.5px] text-neutral-450">Overrides the standard 40-word limit per slide for longer text descriptions.</span>
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
