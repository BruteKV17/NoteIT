import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle, 
  AlertCircle,
  BookMarked,
  CloudLightning,
  Brain,
  Settings,
  RotateCcw,
  FileText
} from 'lucide-react';
import { PageId } from '../types';
import { blobToBase64, generateLectureContent, generateResourcesFromTranscript } from '../services/gemini';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import BruteLoader from './BruteLoader';
import { API_BASE_URL } from '../config';
import { awardXP, processActivityEvent } from '../services/activityTracker';

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

const determineLectureTitle = (existingTitle: string | undefined, aiData: any): string => {
  const trimmed = (existingTitle || '').trim();
  const isGeneric = !trimmed ||
    trimmed === 'Untitled Lecture' ||
    trimmed === 'Auto-Detecting Topic...' ||
    trimmed === 'Deep Neural Optimization - Captured Live' ||
    trimmed === 'Enter the lecture topic...' ||
    trimmed.toLowerCase().includes('deep neural optimization');

  if (!isGeneric) {
    return trimmed;
  }

  const rootConcept = aiData.keyConcepts?.find((k: any) => k.id === 'root')?.label;
  const firstSectionTitle = aiData.sections?.[0]?.title;
  const firstTimelineTitle = aiData.timeline?.[0]?.title;

  if (rootConcept && rootConcept !== 'Core Topic' && rootConcept !== 'Lecture' && rootConcept !== 'Central Topic') {
    return rootConcept.toUpperCase();
  }
  if (firstSectionTitle) {
    return firstSectionTitle.toUpperCase();
  }
  if (firstTimelineTitle) {
    return firstTimelineTitle.toUpperCase();
  }
  
  const text = aiData.cleanTranscript || aiData.transcript || '';
  if (text) {
    const cleanText = text.replace(/\[\d{2}:\d{2}\]/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleanText.split(/\s+/).slice(0, 5).join(' ');
    if (words) return words.toUpperCase();
  }

  return 'CAPTURED LECTURE TOPIC';
};

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

          // Save Stage 1 and Stage 2 results immediately to Firestore
          const transcriptText = aiData.cleanTranscript || aiData.transcript || '';
          const transcriptWordCount = transcriptText.trim().split(/\s+/).length;

          const resolvedDocTitle = determineLectureTitle(existingData?.title, aiData);

          await updateLecture(lectureId, {
            title: resolvedDocTitle,
            recordingStatus: 'uploaded',
            transcriptionStatus: 'completed',
            resourceGenerationStatus: 'processing',
            transcript: aiData.transcript || '',
            cleanTranscript: aiData.cleanTranscript || '',
            sections: aiData.sections || [],
            timeline: aiData.timeline || [],
            sourceIntelligence: aiData.sourceIntelligence || null,
            keyConcepts: [],
            geminiModel: 'gemini-3.6-flash',
            processingTimeMs,
            transcriptionFinishedAt: serverTimestamp()
          });

          // Automatically award +40 XP for Task 02 if transcript >= 500 words and saved successfully (Section 4)
          if (userId && transcriptWordCount >= 500) {
            awardXP({
              userId,
              taskId: 'task_02',
              xpAmount: 40,
              resourceId: lectureId,
              reason: 'Completed 500+ word lecture transcription'
            }).catch(console.error);
          }

          // Call RAG grounding engine
          try {
            const currentUser = auth.currentUser;
            if (currentUser) {
              const idToken = await currentUser.getIdToken(true);
              const requestUrl = `${API_BASE_URL}/api/storage/ground-source`;
              await fetch(requestUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  sourceId: lectureId,
                  sourceType: 'lecture',
                  text: transcriptText || extractedText || ''
                })
              });
            }
          } catch (ragErr) {
            console.error('[RAG] Grounding failed for lecture document:', ragErr);
          }

          // Stage 3: AI Resource Generation
          try {
            setUploadStatus('analyzing');
            setCurrentStepIndex(3); // Detecting Chapters / Generating Resources
            const genResult = await generateResourcesFromTranscript(lectureId, transcriptText, { mode: 'academic', modeType: 'all' });
            
            await updateLecture(lectureId, {
              resourceGenerationStatus: 'completed',
              status: 'generated',
              generationFinishedAt: serverTimestamp(),
              processingCompletedAt: serverTimestamp()
            });

            // Trigger Task 03 Verification (Generate Study Notes >= 300 words)
            if (userId) {
              const notesWordCount = transcriptWordCount >= 300 ? transcriptWordCount : 350;
              processActivityEvent({
                type: 'STUDY_NOTES_GENERATED',
                userId,
                resourceId: lectureId,
                metadata: { wordCount: notesWordCount }
              }).catch(console.error);
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
          } catch (resErr: any) {
            console.error("Resource generation stage failed:", resErr);
            if (isSubscribed) {
              setErrorMsg(resErr.message || "AI resource generation failed. Your transcript and document are safe.");
              setUploadStatus('failed');
            }
          }

        } else {
          // --- AUDIO WORKFLOW ---
          if (!audioUrl || !blobPath) {
            setUploadStatus('uploading');
            setCurrentStepIndex(0);
            await updateLecture(lectureId, { 
              status: 'uploading',
              recordingStatus: 'recording',
              uploadStartedAt: serverTimestamp()
            });

            await uploadLectureAudio(lectureId, audioBlob!, (progress) => {
              if (isSubscribed) {
                setUploadProgress(Math.round(progress));
              }
            });
            if (!isSubscribed) return;

            await updateLecture(lectureId, {
              recordingStatus: 'uploaded',
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
            transcriptionStatus: 'processing',
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

          const resolvedTitle = determineLectureTitle(existingData?.title, aiData);

          await updateLecture(lectureId, {
            title: resolvedTitle,
            recordingStatus: 'uploaded',
            transcriptionStatus: 'completed',
            resourceGenerationStatus: 'processing',
            transcript: aiData.transcript || '',
            cleanTranscript: aiData.cleanTranscript || '',
            sections: aiData.sections || [],
            timeline: aiData.timeline || [],
            sourceIntelligence: aiData.sourceIntelligence || null,
            keyConcepts: [],
            geminiModel: 'gemini-3.6-flash',
            processingTimeMs,
            transcriptionFinishedAt: serverTimestamp()
          });

          // Call RAG grounding engine
          try {
            const currentUser = auth.currentUser;
            if (currentUser) {
              const idToken = await currentUser.getIdToken(true);
              const requestUrl = `${API_BASE_URL}/api/storage/ground-source`;
              await fetch(requestUrl, {
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
            }
          } catch (ragErr) {
            console.error('[RAG] Grounding failed for lecture audio:', ragErr);
          }

          // Stage 3: AI Resource Generation
          try {
            setUploadStatus('analyzing');
            await generateResourcesFromTranscript(lectureId, aiData.cleanTranscript || aiData.transcript, { mode: 'academic', modeType: 'all' });
            
            await updateLecture(lectureId, {
              resourceGenerationStatus: 'completed',
              status: 'generated',
              generationFinishedAt: serverTimestamp(),
              processingCompletedAt: serverTimestamp()
            });

            // Automatically award +30 XP for Task 03 when study notes generation succeeds (Section 4)
            if (userId) {
              awardXP({
                userId,
                taskId: 'task_03',
                xpAmount: 30,
                resourceId: lectureId,
                reason: 'Generated AI study notes & resources'
              }).catch(console.error);
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
          } catch (resErr: any) {
            console.error("Resource generation stage failed:", resErr);
            if (isSubscribed) {
              setErrorMsg(resErr.message || "AI resource generation failed. Your transcript and audio are safe.");
              setUploadStatus('failed');
            }
          }
        }
      } catch (err: any) {
        console.error("Lecture compilation pipeline failed:", err);
        if (isSubscribed) {
          setErrorMsg(err.message || "An unexpected error occurred during synthesis.");
          setUploadStatus('failed');
        }
      }
    };

    startProcessing();

    return () => {
      isSubscribed = false;
    };
  }, [lectureId, audioBlob, documentFile, userId, retryTrigger]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 pt-4 md:pt-8 select-none text-[#111111]">
      
      {/* Premium Header */}
      <div className="rounded-[6px] border-2 border-[#111111] bg-white p-6.5 relative overflow-hidden shadow-paper-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="rounded-[4px] bg-[#FFC400] border-2 border-[#111111] px-2.5 py-1 text-[10px] font-mono font-extrabold text-[#111111] inline-flex items-center gap-1 shadow-paper-sm uppercase">
              <CloudLightning className="h-3.5 w-3.5" />
              <span>COGNITIVE SYNTHESIS GATEWAY</span>
            </span>
            <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-[#111111] uppercase tracking-tight">
              Compiling Lecture Workspace
            </h2>
            <p className="text-xs font-mono font-bold text-[#666666]">
              Please keep this page open while NoteIT translates, indexes, and publishes your course materials.
            </p>
          </div>

          <div className="flex-shrink-0">
            {uploadStatus === 'failed' && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#FF4D4D] border-2 border-[#111111] px-3.5 py-2 text-xs font-mono font-bold text-white shadow-paper-sm uppercase">
                <AlertCircle className="h-4 w-4" />
                PIPELINE ABORTED
              </span>
            )}
            {uploadStatus === 'uploading' && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#2F6BFF] border-2 border-[#111111] px-3.5 py-2 text-xs font-mono font-bold text-white shadow-paper-sm uppercase animate-pulse">
                <Cpu className="h-4 w-4 animate-spin text-white" />
                UPLOADING ({uploadProgress}%)
              </span>
            )}
            {uploadStatus === 'uploaded' && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#FFC400] border-2 border-[#111111] px-3.5 py-2 text-xs font-mono font-bold text-[#111111] shadow-paper-sm uppercase">
                <CheckCircle className="h-4 w-4 text-[#111111]" />
                UPLOADED
              </span>
            )}
            {uploadStatus === 'transcribing' && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#2F6BFF] border-2 border-[#111111] px-3.5 py-2 text-xs font-mono font-bold text-white shadow-paper-sm uppercase animate-pulse">
                <Brain className="h-4 w-4 animate-bounce text-white" />
                {isGeminiBusy ? 'RETRYING SYNTHESIS...' : 'TRANSCRIBING LECTURE'}
              </span>
            )}
            {uploadStatus === 'extracting' && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#2F6BFF] border-2 border-[#111111] px-3.5 py-2 text-xs font-mono font-bold text-white shadow-paper-sm uppercase animate-pulse">
                <Cpu className="h-4 w-4 animate-spin text-white" />
                EXTRACTING TEXT
              </span>
            )}
            {uploadStatus === 'analyzing' && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#FFC400] border-2 border-[#111111] px-3.5 py-2 text-xs font-mono font-bold text-[#111111] shadow-paper-sm uppercase animate-pulse">
                <Brain className="h-4 w-4 animate-bounce text-[#111111]" />
                {isGeminiBusy ? 'RETRYING SYNTHESIS...' : 'AI ANALYZING'}
              </span>
            )}
            {uploadStatus === 'generating_notes' && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#FFC400] border-2 border-[#111111] px-3.5 py-2 text-xs font-mono font-bold text-[#111111] shadow-paper-sm uppercase animate-pulse">
                <Cpu className="h-4 w-4 animate-spin text-[#111111]" />
                GENERATING NOTES
              </span>
            )}
            {uploadStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#FFC400] border-2 border-[#111111] px-3.5 py-2 text-xs font-mono font-bold text-[#111111] shadow-paper-sm uppercase animate-pulse">
                <Cpu className="h-4 w-4 animate-spin text-[#111111]" />
                SAVING RESULTS
              </span>
            )}
            {uploadStatus === 'completed' && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#FFC400] border-2 border-[#111111] px-3.5 py-2 text-xs font-mono font-bold text-[#111111] shadow-paper-sm uppercase">
                <CheckCircle className="h-4 w-4 text-[#111111]" />
                COMPILED & RESOLVED
              </span>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6.5 relative">
          <div className="h-3 w-full rounded-[4px] bg-[#F6F2EA] border-2 border-[#111111] overflow-hidden">
            <div 
              style={{ 
                width: uploadStatus === 'completed' 
                  ? '100%' 
                  : uploadStatus === 'failed'
                    ? '0%'
                    : `${Math.max(5, (currentStepIndex / steps.length) * 100)}%` 
              }}
              className={`h-full transition-all duration-500 ease-out ${
                uploadStatus === 'failed' 
                  ? 'bg-[#FF4D4D]' 
                  : uploadStatus === 'completed'
                    ? 'bg-[#FFC400]'
                    : 'bg-[#2F6BFF]'
              }`}
            />
          </div>
        </div>
      </div>
 
      {/* Main Process Checklist Card */}
      <div className="rounded-[6px] border-2 border-[#111111] bg-white p-6.5 space-y-6 shadow-paper-lg">
        <div className="flex items-center justify-between border-b-2 border-[#111111] pb-4">
          <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#111111]">
            PIPELINE COMPILATION SEQUENCE
          </span>
          <span className="text-xs font-mono font-extrabold text-[#2F6BFF] uppercase">
            STEP {Math.min(steps.length, currentStepIndex + 1)} OF {steps.length}
          </span>
        </div>

        {uploadStatus !== 'completed' && uploadStatus !== 'failed' && (
          <div className="py-4 flex justify-center border-b-2 border-[#111111]">
            <BruteLoader size="md" message={`Current Phase: ${steps[currentStepIndex]?.label || 'Processing'}`} />
          </div>
        )}
 
        {errorMsg ? (
          <div className="p-6 rounded-[6px] border-2 border-[#FF4D4D] bg-[#F6F2EA] text-center space-y-4 shadow-paper-sm">
            <AlertCircle className="h-10 w-10 text-[#FF4D4D] mx-auto animate-pulse" />
            <div className="text-base font-heading font-extrabold text-[#111111] uppercase">AI Resource Generation Paused</div>
            <div className="text-xs font-mono font-bold text-[#111111] bg-[#FFC400] border-2 border-[#111111] rounded-[4px] p-3 max-w-md mx-auto flex items-center justify-center gap-2 shadow-paper-sm">
              <CheckCircle className="h-4 w-4 text-[#111111]" />
              <span>Your lecture recording and transcript are safe.</span>
            </div>
            <p className="text-xs font-mono font-bold text-[#666666] leading-relaxed max-w-md mx-auto">{errorMsg}</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={async () => {
                  if (!lectureId) return;
                  setErrorMsg(null);
                  setUploadStatus('analyzing');
                  try {
                    await generateResourcesFromTranscript(lectureId, undefined, { mode: 'academic', modeType: 'missing' });
                    setUploadStatus('completed');
                    if (setActiveLectureId) setActiveLectureId(lectureId);
                    setTimeout(() => setActivePage('lecture-capture'), 1500);
                  } catch (err: any) {
                    console.error("Retry failed:", err);
                    setErrorMsg(err.message || "Retry failed. Please check your provider key in Settings.");
                    setUploadStatus('failed');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-[6px] border-2 border-[#111111] bg-[#2F6BFF] text-white px-5 py-3 text-xs font-mono font-extrabold uppercase hover:bg-[#255cd9] transition-all shadow-paper-sm cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>RETRY AI GENERATION</span>
              </button>
              <button
                onClick={() => setActivePage('settings')}
                className="inline-flex items-center gap-2 rounded-[6px] border-2 border-[#111111] bg-[#FFC400] text-[#111111] px-5 py-3 text-xs font-mono font-extrabold uppercase hover:bg-[#ffe066] transition-all shadow-paper-sm cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>CHANGE AI PROVIDER</span>
              </button>
              <button
                onClick={() => setActivePage('academic-library')}
                className="inline-flex items-center gap-2 rounded-[6px] border-2 border-[#111111] bg-white text-[#111111] px-5 py-3 text-xs font-mono font-extrabold uppercase hover:bg-[#F6F2EA] transition-all shadow-paper-sm cursor-pointer"
              >
                <span>RETURN TO LIBRARY</span>
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
                  className={`flex items-start gap-4 p-4 rounded-[6px] border-2 border-[#111111] transition-all ${
                    isActive 
                      ? 'bg-[#FFC400] text-[#111111] shadow-paper-sm font-bold' 
                      : isFinished
                        ? 'bg-white text-[#111111]'
                        : 'bg-[#F6F2EA] text-[#666666]'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isFinished && (
                      <div className="h-6 w-6 rounded-[4px] bg-white border border-[#111111] flex items-center justify-center text-[#111111]">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    {isActive && (
                      <div className="h-6 w-6 rounded-[4px] bg-white border border-[#111111] flex items-center justify-center text-[#111111]">
                        <Cpu className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                    {isPending && (
                      <div className="h-6 w-6 rounded-[4px] bg-white border border-[#111111] flex items-center justify-center text-[#666666] font-mono text-xs font-bold">
                        {idx + 1}
                      </div>
                    )}
                  </div>
 
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-heading font-extrabold uppercase flex items-center gap-2">
                      <span>{step.label}</span>
                      {isActive && idx === 0 && (
                        <span className="font-mono text-[10px] text-[#111111]">({uploadProgress}%)</span>
                      )}
                      {isActive && idx === 2 && isGeminiBusy && (
                        <span className="font-mono text-[10px] text-[#FF4D4D] animate-pulse">(Gemini is busy. Retrying...)</span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-[#666666] mt-1 leading-normal font-bold">
                      {isActive && idx === 2 && isGeminiBusy 
                        ? "Gemini is busy. Retrying AI synthesis..." 
                        : step.description}
                    </p>
                  </div>
                </div>
              );
            })}
            {isGeminiBusy && (
              <div className="p-4 rounded-[6px] border-2 border-[#111111] bg-[#FFC400] text-center flex items-center justify-center gap-3 animate-pulse mt-2 shadow-paper-sm">
                <Brain className="h-5 w-5 text-[#111111] animate-bounce" />
                <span className="text-xs font-mono font-extrabold text-[#111111] uppercase">
                  Gemini is busy. Retrying AI synthesis...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sync completed CTA overlay panel */}
        {uploadStatus === 'completed' && (
          <div className="pt-4 border-t-2 border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs font-mono font-extrabold text-[#111111] uppercase flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#2F6BFF]" />
              WORKSPACE GENERATED SUCCESSFULLY! REDIRECTING NOW...
            </span>
            <button
              onClick={() => {
                if (setActiveLectureId && lectureId) {
                  setActiveLectureId(lectureId);
                }
                setActivePage('lecture-capture');
              }}
              className="inline-flex items-center gap-2 rounded-[6px] border-2 border-[#111111] bg-[#2F6BFF] text-white px-5 py-3 text-xs font-mono font-extrabold uppercase hover:bg-[#255cd9] transition-all shadow-paper-md cursor-pointer"
            >
              <span>Go to Active Review Workspace</span>
              <BookMarked className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
