import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle, 
  AlertCircle,
  BookMarked,
  CloudLightning,
  Brain
} from 'lucide-react';
import { PageId } from '../types';
import { blobToBase64, generateLectureContent } from '../services/gemini';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import BruteLoader from './BruteLoader';

interface LectureProcessingViewProps {
  userId: string | undefined;
  lectureId: string | null;
  audioBlob: Blob | null;
  documentFile?: File | null;
  uploadLectureAudio: (lectureId: string, audioBlob: Blob, onProgress: (progress: number) => void) => Promise<string>;
  uploadLectureDocument?: (lectureId: string, file: File, onProgress: (progress: number) => void) => Promise<{ audioUrl: string; blobPath: string }>;
  updateLecture: (id: string, data: any) => Promise<void>;
  setActivePage: (page: PageId) => void;
  theme: 'light' | 'dark';
}

const COMPILATION_STEPS = [
  { label: "Uploading Audio", description: "Transmitting recorded audio file payload to Azure Blob Storage." },
  { label: "Transcribing Lecture", description: "Converting acoustic frequencies into clean text transcription via Gemini 2.5." },
  { label: "Generating Notes", description: "Structuring content, proofs, and synthesizing core academic notes." },
  { label: "Saving Results", description: "Persisting the transcript, summary, and linked notes to the Firestore database." }
];

const DOCUMENT_COMPILATION_STEPS = [
  { label: "Uploading Document", description: "Uploading document file payload to Azure Storage." },
  { label: "Extracting Content", description: "Extracting structural text data from file format (PDF/DOCX/PPTX)." },
  { label: "AI Analysis & Synthesis", description: "Analyzing text via Gemini and synthesizing study material." },
  { label: "Saving Results", description: "Persisting the summary, notes, flashcards, quiz, and concept nodes." }
];

export default function LectureProcessingView({
  userId,
  lectureId,
  audioBlob,
  documentFile,
  uploadLectureAudio,
  uploadLectureDocument,
  updateLecture,
  setActivePage,
  theme
}: LectureProcessingViewProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'uploaded' | 'transcribing' | 'generating_notes' | 'saving' | 'completed' | 'failed' | 'extracting' | 'analyzing'>('uploading');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeminiBusy, setIsGeminiBusy] = useState<boolean>(false);

  const steps = documentFile ? DOCUMENT_COMPILATION_STEPS : COMPILATION_STEPS;

  useEffect(() => {
    if (!lectureId || (!audioBlob && !documentFile)) {
      setErrorMsg("Missing lecture reference or file payload. Please try again.");
      setUploadStatus('failed');
      return;
    }

    let isSubscribed = true;

    const startProcessing = async () => {
      try {
        if (documentFile) {
          if (!uploadLectureDocument) {
            throw new Error("Document upload handler is missing.");
          }
          // --- DOCUMENT WORKFLOW ---
          // 1. UPLOADING DOCUMENT
          setUploadStatus('uploading');
          setCurrentStepIndex(0);
          await updateLecture(lectureId, { status: 'uploading' });

          const uploadResult = await uploadLectureDocument(lectureId, documentFile, (progress) => {
            if (isSubscribed) {
              setUploadProgress(Math.round(progress));
            }
          });
          if (!isSubscribed) return;

          setUploadStatus('uploaded');

          // 2. EXTRACTING CONTENT
          setUploadStatus('extracting');
          setCurrentStepIndex(1);
          await updateLecture(lectureId, { 
            status: 'extracting',
            processingStartedAt: serverTimestamp()
          });

          const { extractTextFromDocument } = await import('../services/azure');
          const extractedText = await extractTextFromDocument(uploadResult.blobPath);
          if (!isSubscribed) return;

          // 3. AI ANALYSIS & SYNTHESIS
          setUploadStatus('analyzing');
          setCurrentStepIndex(2);
          await updateLecture(lectureId, { status: 'analyzing' });

          const startTime = Date.now();
          const { generateLectureContentFromText } = await import('../services/gemini');
          const aiData = await generateLectureContentFromText(extractedText, (isBusy) => {
            if (isSubscribed) {
              setIsGeminiBusy(isBusy);
            }
          });
          if (!isSubscribed) return;
          const processingTimeMs = Date.now() - startTime;

          // 4. SAVING RESULTS
          setUploadStatus('saving');
          setCurrentStepIndex(3);
          await updateLecture(lectureId, { status: 'saving' });

          // Save transcript, summary, flashcards, quiz, and keyConcepts directly in the lecture document
          await updateLecture(lectureId, {
            transcript: aiData.transcript || '',
            summary: aiData.summary || '',
            flashcards: aiData.flashcards || [],
            quiz: aiData.quiz || [],
            keyConcepts: aiData.keyConcepts || [],
            geminiModel: 'gemini-2.5-flash',
            processingTimeMs,
            status: 'generated',
            processingCompletedAt: serverTimestamp()
          });

          // Save notes to general users/{uid}/notes
          if (userId && aiData.notes && Array.isArray(aiData.notes)) {
            const { collection, addDoc, serverTimestamp: firestoreServerTimestamp } = await import('firebase/firestore');
            const notesRef = collection(db, 'users', userId, 'notes');
            for (const note of aiData.notes) {
              await addDoc(notesRef, {
                title: note.title || 'Lecture Note',
                content: note.content || '',
                lectureId: lectureId,
                createdAt: firestoreServerTimestamp(),
                updatedAt: firestoreServerTimestamp()
              });
            }
          }

          // Save weak topics to users/{uid}/weakTopics
          if (userId && aiData.weakTopics && Array.isArray(aiData.weakTopics)) {
            const { collection, addDoc, serverTimestamp: firestoreServerTimestamp } = await import('firebase/firestore');
            const weakTopicsRef = collection(db, 'users', userId, 'weakTopics');
            for (const wt of aiData.weakTopics) {
              await addDoc(weakTopicsRef, {
                topicName: wt.topicName || 'Unknown Topic',
                subject: wt.subject || 'General',
                masteryScore: Math.floor(Math.random() * 21) + 20, // baseline 20-40%
                lastAttempt: 'Just now',
                aiDiagnosis: wt.aiDiagnosis || 'Needs review.',
                actionPlan: wt.actionPlan || [],
                createdAt: firestoreServerTimestamp()
              });
            }
          }

          if (!isSubscribed) return;
          setUploadStatus('completed');
          setCurrentStepIndex(DOCUMENT_COMPILATION_STEPS.length);

          setTimeout(() => {
            if (isSubscribed) {
              setActivePage('academic-library');
            }
          }, 2000);

        } else {
          // --- AUDIO WORKFLOW (Original) ---
          setUploadStatus('uploading');
          setCurrentStepIndex(0);
          await updateLecture(lectureId, { status: 'uploading' });

          await uploadLectureAudio(lectureId, audioBlob!, (progress) => {
            if (isSubscribed) {
              setUploadProgress(Math.round(progress));
            }
          });

          if (!isSubscribed) return;

          setUploadStatus('uploaded');

          setUploadStatus('transcribing');
          setCurrentStepIndex(1);
          await updateLecture(lectureId, { 
            status: 'transcribing',
            processingStartedAt: serverTimestamp()
          });

          const base64Audio = await blobToBase64(audioBlob!);
          if (!isSubscribed) return;

          const startTime = Date.now();

          const aiData = await generateLectureContent(base64Audio, 'audio/webm', (isBusy) => {
            if (isSubscribed) {
              setIsGeminiBusy(isBusy);
            }
          });
          if (!isSubscribed) return;

          const processingTimeMs = Date.now() - startTime;

          setUploadStatus('generating_notes');
          setCurrentStepIndex(2);

          await updateLecture(lectureId, { status: 'generating_notes' });
          if (!isSubscribed) return;

          setUploadStatus('saving');
          setCurrentStepIndex(3);

          await updateLecture(lectureId, {
            transcript: aiData.transcript || '',
            summary: aiData.summary || '',
            flashcards: aiData.flashcards || [],
            quiz: aiData.quiz || [],
            keyConcepts: aiData.keyConcepts || [],
            geminiModel: 'gemini-2.5-flash',
            processingTimeMs,
            status: 'generated',
            processingCompletedAt: serverTimestamp()
          });

          if (userId && aiData.notes && Array.isArray(aiData.notes)) {
            const notesRef = collection(db, 'users', userId, 'notes');
            for (const note of aiData.notes) {
              await addDoc(notesRef, {
                title: note.title || 'Lecture Note',
                content: note.content || '',
                lectureId: lectureId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          }

          if (userId && aiData.weakTopics && Array.isArray(aiData.weakTopics)) {
            const weakTopicsRef = collection(db, 'users', userId, 'weakTopics');
            for (const wt of aiData.weakTopics) {
              await addDoc(weakTopicsRef, {
                topicName: wt.topicName || 'Unknown Topic',
                subject: wt.subject || 'General',
                masteryScore: Math.floor(Math.random() * 21) + 20,
                lastAttempt: 'Just now',
                aiDiagnosis: wt.aiDiagnosis || 'Needs review.',
                actionPlan: wt.actionPlan || [],
                createdAt: serverTimestamp()
              });
            }
          }

          if (!isSubscribed) return;
          setUploadStatus('completed');
          setCurrentStepIndex(COMPILATION_STEPS.length);

          setTimeout(() => {
            if (isSubscribed) {
              setActivePage('academic-library');
            }
          }, 2000);
        }
      } catch (err: any) {
        console.error("Lecture compilation pipeline failed:", err);
        if (isSubscribed) {
          setErrorMsg(err.message || "An unexpected error occurred during synthesis.");
          setUploadStatus('failed');
          updateLecture(lectureId, { status: 'failed' }).catch(console.error);
        }
      }
    };

    startProcessing();

    return () => {
      isSubscribed = false;
    };
  }, [lectureId, audioBlob, documentFile, userId]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 pt-4 md:pt-8 select-none">
      
      {/* Premium Glassmorphic Header */}
      <div className={`rounded-2xl border p-6.5 relative overflow-hidden shadow-md ${
        theme === 'dark' ? 'bg-[#121318] border-neutral-850' : 'bg-white border-gray-200'
      }`}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] opacity-15" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-400 font-sans inline-flex items-center gap-1">
              <CloudLightning className="h-3 w-3 animate-pulse" />
              <span>COGNITIVE SYNTHESIS GATEWAY</span>
            </span>
            <h2 className="font-sans font-black text-xl md:text-2xl text-gray-900 dark:text-neutral-50 tracking-tight">
              Compiling Lecture Workspace
            </h2>
            <p className="text-xs font-semibold text-gray-400">
              Please keep this page open while NoteIT AI translates, indexes, and publishes your course materials.
            </p>
          </div>

          <div className="flex-shrink-0">
            {uploadStatus === 'failed' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-500 font-mono">
                <AlertCircle className="h-4 w-4" />
                PIPELINE ABORTED
              </span>
            )}
            {uploadStatus === 'uploading' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-400 font-mono animate-pulse">
                <Cpu className="h-4 w-4 animate-spin text-indigo-500" />
                UPLOADING ({uploadProgress}%)
              </span>
            )}
            {uploadStatus === 'uploaded' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3.5 py-2 text-xs font-bold text-indigo-400 font-mono animate-pulse">
                <CheckCircle className="h-4 w-4 text-indigo-500" />
                UPLOADED
              </span>
            )}
            {uploadStatus === 'transcribing' && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold font-mono animate-pulse ${
                isGeminiBusy 
                  ? 'bg-amber-500/10 text-amber-500' 
                  : 'bg-blue-500/10 text-blue-400'
              }`}>
                {isGeminiBusy ? (
                  <>
                    <Brain className="h-4 w-4 animate-bounce text-amber-500" />
                    RETRYING SYNTHESIS...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 animate-bounce text-blue-500" />
                    TRANSCRIBING LECTURE
                  </>
                )}
              </span>
            )}
            {uploadStatus === 'extracting' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-400 font-mono animate-pulse">
                <Cpu className="h-4 w-4 animate-spin text-indigo-500" />
                EXTRACTING TEXT
              </span>
            )}
            {uploadStatus === 'analyzing' && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold font-mono animate-pulse ${
                isGeminiBusy 
                  ? 'bg-amber-500/10 text-amber-500' 
                  : 'bg-indigo-500/10 text-indigo-400'
              }`}>
                {isGeminiBusy ? (
                  <>
                    <Brain className="h-4 w-4 animate-bounce text-amber-500" />
                    RETRYING SYNTHESIS...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 animate-bounce text-indigo-505" />
                    AI ANALYZING
                  </>
                )}
              </span>
            )}
            {uploadStatus === 'generating_notes' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-500 font-mono animate-pulse">
                <Cpu className="h-4 w-4 animate-spin text-amber-500" />
                GENERATING NOTES
              </span>
            )}
            {uploadStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-400 font-mono animate-pulse">
                <Cpu className="h-4 w-4 animate-spin text-purple-500" />
                SAVING RESULTS
              </span>
            )}
            {uploadStatus === 'completed' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-500 font-mono">
                <CheckCircle className="h-4 w-4" />
                COMPILED & RESOLVED
              </span>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6.5 relative">
          <div className="h-2 w-full rounded-full bg-gray-150 dark:bg-neutral-800 overflow-hidden">
            <div 
              style={{ 
                width: uploadStatus === 'completed' 
                  ? '100%' 
                  : uploadStatus === 'failed'
                    ? '0%'
                    : `${Math.max(5, (currentStepIndex / steps.length) * 100)}%` 
              }}
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                uploadStatus === 'failed' 
                  ? 'bg-red-500' 
                  : uploadStatus === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-400'
              }`}
            />
          </div>
        </div>
      </div>
 
      {/* Main Process Checklist Card */}
      <div className={`rounded-2xl border p-6.5 space-y-6 ${
        theme === 'dark' ? 'bg-[#121318] border-neutral-850' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-850/50 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
            Pipeline Compilation Sequence
          </span>
          <span className="text-[10px] font-bold text-indigo-400 font-mono">
            Step {Math.min(steps.length, currentStepIndex + 1)} of {steps.length}
          </span>
        </div>

        {uploadStatus !== 'completed' && uploadStatus !== 'failed' && (
          <div className="py-4 flex justify-center border-b border-gray-100 dark:border-neutral-850/50">
            <BruteLoader size="md" message={`Current Phase: ${steps[currentStepIndex]?.label || 'Processing'}`} />
          </div>
        )}
 
        {errorMsg ? (
          <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/5 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <div className="text-sm font-bold text-gray-900 dark:text-neutral-50">Upload & Sync Failed</div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">{errorMsg}</p>
            <button
              onClick={() => setActivePage('academic-library')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 text-xs font-bold hover:opacity-90 transition-all focus:outline-none"
            >
              <span>Return to Library</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isPending = idx > currentStepIndex;
              const isActive = idx === currentStepIndex && uploadStatus !== 'completed';
              const isFinished = idx < currentStepIndex || uploadStatus === 'completed';
 
              return (
                <div 
                  key={idx}
                  className={`flex items-start gap-4 p-3 rounded-xl border transition-all duration-300 ${
                    isActive 
                      ? theme === 'dark' 
                        ? 'border-indigo-500/30 bg-indigo-500/5 text-white' 
                        : 'border-indigo-100 bg-indigo-50/20 text-gray-900'
                      : isFinished
                        ? theme === 'dark'
                          ? 'border-neutral-850/50 opacity-70 text-neutral-300'
                          : 'border-gray-100 opacity-70 text-gray-700'
                        : theme === 'dark'
                          ? 'border-transparent opacity-35 text-neutral-500'
                          : 'border-transparent opacity-35 text-gray-400'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isFinished && (
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </div>
                    )}
                    {isActive && (
                      <div className="h-5 w-5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                        <Cpu className="h-3.5 w-3.5 animate-spin" />
                      </div>
                    )}
                    {isPending && (
                      <div className="h-5 w-5 rounded-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-750 flex items-center justify-center text-gray-400 dark:text-neutral-500 font-mono text-[9px] font-bold">
                        {idx + 1}
                      </div>
                    )}
                  </div>
 
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>{step.label}</span>
                      {isActive && idx === 0 && (
                        <span className="font-mono text-[9px] text-indigo-400">({uploadProgress}%)</span>
                      )}
                      {isActive && idx === 2 && isGeminiBusy && (
                        <span className="font-mono text-[9px] text-amber-500 animate-pulse">(Gemini is busy. Retrying...)</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">
                      {isActive && idx === 2 && isGeminiBusy 
                        ? "Gemini is busy. Retrying AI synthesis..." 
                        : step.description}
                    </p>
                  </div>
                </div>
              );
            })}
            {isGeminiBusy && (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center flex items-center justify-center gap-3 animate-pulse mt-2">
                <Brain className="h-5 w-5 text-amber-500 animate-bounce" />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Gemini is busy. Retrying AI synthesis...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sync completed CTA overlay panel */}
        {uploadStatus === 'completed' && (
          <div className="pt-4 border-t border-gray-100 dark:border-neutral-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <span className="text-[10px] font-bold text-emerald-500 font-mono flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              WORKSPACE GENERATED SUCCESSFULLY! REDIRECTING NOW...
            </span>
            <button
              onClick={() => setActivePage('academic-library')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 text-xs font-black hover:opacity-90 active:scale-95 transition-all shadow-md focus:outline-none cursor-pointer"
            >
              <span>Go to Academic Library</span>
              <BookMarked className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
