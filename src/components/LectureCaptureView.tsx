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
  ArrowRight
} from 'lucide-react';
import { PageId } from '../types';

interface LectureCaptureViewProps {
  onSaveCapture: (title: string, subject: string, duration: string, audioBlob: Blob) => Promise<void>;
  setActivePage: (page: PageId) => void;
  theme: 'light' | 'dark';
  lectures?: any[];
}



export default function LectureCaptureView({
  onSaveCapture,
  setActivePage,
  theme,
  lectures = []
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
      // Begin Tick
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



  // Clean up all audio components on component unmount
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
            // Map value (0-255) to a scale height (8% to 100%)
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
      
      // Initialize MediaRecorder
      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for browsers that don't support audio/webm natively (e.g. Safari)
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
      
      recorder.start(1000); // chunk every 1 second
      
      // Start visualizer and state updates
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
      // Resume
      mediaRecorderRef.current.resume();
      if (streamRef.current) {
        startVisualizer(streamRef.current);
      }
      setIsPaused(false);
    } else {
      // Pause
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
            {/* Elegant Linear backdrop grid overlay */}
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
                    theme === 'dark' ? 'border-neutral-800 text-neutral-300' : 'border-gray-200 text-gray-700'
                  }`}
                  onClick={() => setActivePage('academic-library')}
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

        </div>        {/* RIGHT COLUMNS: Live Speech Decipher + AI Real-time Notes columns */}
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
                        <div className="absolute -inset-3 rounded-full bg-indigo-500/10 animate-ping" />
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
