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
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import BruteLoader from './BruteLoader';
import { API_BASE_URL } from '../config';

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
  setActiveLectureId?: (id: string | null) => void;
}

const COMPILATION_STEPS = [
  { label: "Uploading Audio", description: "Saving raw audio bytes to Azure Blob Storage." },
  { label: "Deciphering Speech", description: "Converting acoustic frequencies into clean text transcription via Gemini 2.5." },
  { label: "Cleaning Transcript", description: "Removing stutters, filler words, and converting to professional academic prose." },
  { label: "Detecting Chapters", description: "Segmenting lecture sections and milestones." },
  { label: "Saving Results", description: "Persisting the completed academic workspace directly to Firestore." }
];

const DOCUMENT_COMPILATION_STEPS = [
  { label: "Uploading Document", description: "Uploading document file payload to Azure Storage." },
  { label: "Extracting Content", description: "Extracting structural text data from file format (PDF/DOCX/PPTX)." },
  { label: "Cleaning Transcript", description: "Formatting text and generating transcript lines." },
  { label: "Detecting Chapters", description: "Segmenting lecture sections and milestones." },
  { label: "Saving Results", description: "Persisting the completed academic workspace directly to Firestore." }
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
  theme,
  setActiveLectureId
}: LectureProcessingViewProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'uploaded' | 'transcribing' | 'generating_notes' | 'saving' | 'completed' | 'failed' | 'extracting' | 'analyzing'>('uploading');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeminiBusy, setIsGeminiBusy] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

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
        if (!userId || !lectureId) return;

        const lectureRef = doc(db, 'users', userId, 'lectures', lectureId);
        const lectureSnap = await getDoc(lectureRef);
        const existingData = lectureSnap.exists() ? lectureSnap.data() : null;

        let audioUrl = existingData?.audioUrl || '';
        let blobPath = existingData?.blobPath || '';

        if (documentFile) {
          if (!uploadLectureDocument) {
            throw new Error("Document upload handler is missing.");
          }
          // --- DOCUMENT WORKFLOW ---
          // 1. UPLOADING DOCUMENT
          let uploadResult = { audioUrl, blobPath };
          if (!audioUrl || !blobPath) {
            setUploadStatus('uploading');
            setCurrentStepIndex(0);
            await updateLecture(lectureId, { 
              status: 'uploading',
              uploadStartedAt: serverTimestamp()
            });

            uploadResult = await uploadLectureDocument(lectureId, documentFile, (progress) => {
              if (isSubscribed) {
                setUploadProgress(Math.round(progress));
              }
            });
            if (!isSubscribed) return;

            await updateLecture(lectureId, {
              uploadFinishedAt: serverTimestamp()
            });
          } else {
            console.log('Skipping document upload, file already exists in Azure:', blobPath);
            setUploadProgress(100);
            setUploadStatus('uploaded');
          }

          // 2. EXTRACTING CONTENT
          setUploadStatus('extracting');
          setCurrentStepIndex(1);
          await updateLecture(lectureId, { 
            status: 'extracting',
            transcriptionStartedAt: serverTimestamp(),
            processingStartedAt: serverTimestamp()
          });

          const { extractTextFromDocument } = await import('../services/azure');
          const extractedText = await extractTextFromDocument(uploadResult.blobPath);
          if (!isSubscribed) return;

          await updateLecture(lectureId, {
            transcriptionFinishedAt: serverTimestamp()
          });

          // 3. AI ANALYSIS & SYNTHESIS
          setUploadStatus('analyzing');
          setCurrentStepIndex(2);
          await updateLecture(lectureId, { 
            status: 'analyzing',
            generationStartedAt: serverTimestamp()
          });

          const startTime = Date.now();
          const { generateLectureContentFromText } = await import('../services/gemini');
          
          const aiData = await generateLectureContentFromText(
            extractedText,
            (isBusy) => {
              if (isSubscribed) {
                setIsGeminiBusy(isBusy);
              }
            },
            'academic',
            (stepNum, msg) => {
              if (isSubscribed) {
                if (stepNum === 1) setCurrentStepIndex(2); // Cleaning Transcript
              }
            }
          );
          if (!isSubscribed) return;

          const processingTimeMs = Date.now() - startTime;

          if (isSubscribed) {
            setCurrentStepIndex(3); // Detecting Chapters
            await new Promise(r => setTimeout(r, 1200));
          }
          if (isSubscribed) {
            setCurrentStepIndex(4); // Saving Results
            setUploadStatus('saving');
            await updateLecture(lectureId, { status: 'saving' });
          }

          // Save transcript, cleanTranscript, sections, timeline, sourceIntelligence directly in the lecture document
          await updateLecture(lectureId, {
            transcript: aiData.transcript || '',
            cleanTranscript: aiData.cleanTranscript || '',
            sections: aiData.sections || [],
            timeline: aiData.timeline || [],
            sourceIntelligence: aiData.sourceIntelligence || null,
            keyConcepts: [], // Initial empty mind map concepts
            geminiModel: 'gemini-2.5-flash',
            processingTimeMs,
            status: 'generated',
            generationFinishedAt: serverTimestamp(),
            processingCompletedAt: serverTimestamp()
          });

          // Call RAG grounding engine
          try {
            const currentUser = auth.currentUser;
            if (currentUser) {
              const idToken = await currentUser.getIdToken(true);
              const requestUrl = `${API_BASE_URL}/api/storage/ground-source`;
              const res = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  sourceId: lectureId,
                  sourceType: 'lecture',
                  text: aiData.cleanTranscript || aiData.transcript || extractedText || ''
                })
              });
              console.log(`[API Diagnostic] Base: ${API_BASE_URL}, Endpoint: ${requestUrl}, Status: ${res.status}`);
              console.log('[RAG] Grounding completed for lecture document');
            }
          } catch (ragErr) {
            console.error('[RAG] Grounding failed for lecture document:', ragErr);
          }

          if (!isSubscribed) return;
          setUploadStatus('completed');
          setCurrentStepIndex(DOCUMENT_COMPILATION_STEPS.length);

          if (setActiveLectureId && lectureId) {
            setActiveLectureId(lectureId);
          }
          setTimeout(() => {
            if (isSubscribed) {
              setActivePage('lecture-capture');
            }
          }, 2000);

        } else {
          // --- AUDIO WORKFLOW ---
          if (!audioUrl || !blobPath) {
            setUploadStatus('uploading');
            setCurrentStepIndex(0);
            await updateLecture(lectureId, { 
              status: 'uploading',
              uploadStartedAt: serverTimestamp()
            });

            await uploadLectureAudio(lectureId, audioBlob!, (progress) => {
              if (isSubscribed) {
                setUploadProgress(Math.round(progress));
              }
            });
            if (!isSubscribed) return;

            await updateLecture(lectureId, {
              uploadFinishedAt: serverTimestamp()
            });
          } else {
            console.log('Skipping audio upload, file already exists in Azure:', blobPath);
            setUploadProgress(100);
            setUploadStatus('uploaded');
          }

          setUploadStatus('transcribing');
          setCurrentStepIndex(1);
          await updateLecture(lectureId, { 
            status: 'transcribing',
            transcriptionStartedAt: serverTimestamp(),
            processingStartedAt: serverTimestamp()
          });

          const base64Audio = await blobToBase64(audioBlob!);
          if (!isSubscribed) return;

          const startTime = Date.now();

          const aiData = await generateLectureContent(
            base64Audio,
            'audio/webm',
            (isBusy) => {
              if (isSubscribed) {
                setIsGeminiBusy(isBusy);
              }
            },
            'academic',
            (stepNum, msg) => {
              if (isSubscribed) {
                if (stepNum === 1) {
                  setCurrentStepIndex(1); // Deciphering Speech
                }
                else if (stepNum === 2) {
                  setCurrentStepIndex(3); // Detecting Chapters
                  updateLecture(lectureId, { transcriptionFinishedAt: serverTimestamp() }).catch(console.error);
                }
              }
            }
          );
          if (!isSubscribed) return;

          const processingTimeMs = Date.now() - startTime;

          if (isSubscribed) {
            setCurrentStepIndex(4); // Saving Results
            setUploadStatus('saving');
            await updateLecture(lectureId, { status: 'saving' });
          }

          await updateLecture(lectureId, {
            transcript: aiData.transcript || '',
            cleanTranscript: aiData.cleanTranscript || '',
            sections: aiData.sections || [],
            timeline: aiData.timeline || [],
            sourceIntelligence: aiData.sourceIntelligence || null,
            keyConcepts: [], // Initial empty mind map concepts
            geminiModel: 'gemini-2.5-flash',
            processingTimeMs,
            status: 'generated',
            generationFinishedAt: serverTimestamp(),
            processingCompletedAt: serverTimestamp()
          });

          // Call RAG grounding engine
          try {
            const currentUser = auth.currentUser;
            if (currentUser) {
              const idToken = await currentUser.getIdToken(true);
              const requestUrl = `${API_BASE_URL}/api/storage/ground-source`;
              const res = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  sourceId: lectureId,
                  sourceType: 'lecture',
                  text: aiData.cleanTranscript || aiData.transcript || ''
                })
              });
              console.log(`[API Diagnostic] Base: ${API_BASE_URL}, Endpoint: ${requestUrl}, Status: ${res.status}`);
              console.log('[RAG] Grounding completed for lecture audio');
            }
          } catch (ragErr) {
            console.error('[RAG] Grounding failed for lecture audio:', ragErr);
          }

          if (!isSubscribed) return;
          setUploadStatus('completed');
          setCurrentStepIndex(COMPILATION_STEPS.length);

          if (setActiveLectureId && lectureId) {
            setActiveLectureId(lectureId);
          }
          setTimeout(() => {
            if (isSubscribed) {
              setActivePage('lecture-capture');
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
  }, [lectureId, audioBlob, documentFile, userId, retryTrigger]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 pt-4 md:pt-8 select-none">
      
      {/* Premium Glassmorphic Header */}
      <div className={`rounded-2xl border p-6.5 relative overflow-hidden shadow-md ${
        theme === 'dark' ? 'bg-[#121318] border-neutral-800' : 'bg-white border-gray-200'
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
                    <Brain className="h-4 w-4 animate-bounce text-indigo-500" />
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
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden">
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
        theme === 'dark' ? 'bg-[#121318] border-neutral-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800/50 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
            Pipeline Compilation Sequence
          </span>
          <span className="text-[10px] font-bold text-indigo-400 font-mono">
            Step {Math.min(steps.length, currentStepIndex + 1)} of {steps.length}
          </span>
        </div>

        {uploadStatus !== 'completed' && uploadStatus !== 'failed' && (
          <div className="py-4 flex justify-center border-b border-gray-100 dark:border-neutral-800/50">
            <BruteLoader size="md" message={`Current Phase: ${steps[currentStepIndex]?.label || 'Processing'}`} />
          </div>
        )}
 
        {errorMsg ? (
          <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/5 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto animate-pulse" />
            <div className="text-sm font-bold text-gray-900 dark:text-neutral-50">Upload & Sync Failed</div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-2.5 max-w-md mx-auto">
              Your lecture recording is safe. Click Continue Processing.
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">{errorMsg}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setUploadStatus('uploading');
                  setRetryTrigger(prev => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold transition-all focus:outline-none cursor-pointer"
              >
                Continue Processing
              </button>
              <button
                onClick={() => setActivePage('academic-library')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all focus:outline-none cursor-pointer"
              >
                <span>Return to Library</span>
              </button>
            </div>
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
                          ? 'border-neutral-800/50 opacity-70 text-neutral-300'
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
                      <div className="h-5 w-5 rounded-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-gray-400 dark:text-neutral-500 font-mono text-[9px] font-bold">
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
          <div className="pt-4 border-t border-gray-100 dark:border-neutral-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <span className="text-[10px] font-bold text-emerald-500 font-mono flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              WORKSPACE GENERATED SUCCESSFULLY! REDIRECTING NOW...
            </span>
            <button
              onClick={() => {
                if (setActiveLectureId && lectureId) {
                  setActiveLectureId(lectureId);
                }
                setActivePage('lecture-capture');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 text-xs font-black hover:opacity-90 active:scale-95 transition-all shadow-md focus:outline-none cursor-pointer"
            >
              <span>Go to Active Review Workspace</span>
              <BookMarked className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
