/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Maximize2, GripVertical, ExternalLink } from 'lucide-react';

interface FloatingRecordingWidgetProps {
  isRecording: boolean;
  isPaused: boolean;
  seconds: number;
  onPauseToggle: () => void;
  onStop: () => void;
  onOpenCapture: () => void;
}

export default function FloatingRecordingWidget({
  isRecording,
  isPaused,
  seconds,
  onPauseToggle,
  onStop,
  onOpenCapture
}: FloatingRecordingWidgetProps) {
  // Initial size: 4cm x 1.5cm (approx 152px x 56px in web display)
  const [size, setSize] = useState({ width: 152, height: 56 });
  const [position, setPosition] = useState({ x: window.innerWidth - 176, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);

  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  // Keep widget inside screen viewport on window resize
  useEffect(() => {
    const handleWindowResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - size.width - 10),
        y: Math.min(prev.y, window.innerHeight - size.height - 10)
      }));
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [size]);

  // Drag handlers for in-app floating widget
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - size.width - 10, dragRef.current.initialX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - size.height - 10, dragRef.current.initialY + dy))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, size]);

  // Format time (HH:MM:SS or MM:SS)
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const hrs = Math.floor(mins / 60);
    const displayMins = mins % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${displayMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${displayMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Document Picture-in-Picture (OS Level Desktop Floating Window) ---
  const updatePipDOM = () => {
    if (!pipWindowRef.current) return;
    const doc = pipWindowRef.current.document;
    doc.body.innerHTML = `
      <div style="display:flex; align-items:center; justify-between; padding:6px 10px; height:100%; box-sizing:border-box; background:#111111; border:2px solid #FFC400; border-radius:6px; font-family:monospace; user-select:none;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${isPaused ? '#FFC400' : '#FF4D4D'};"></span>
          <span style="font-size:13px; font-weight:bold; color:#FFFFFF;">${formatTime(seconds)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:5px;">
          <button id="pip-pause" title="${isPaused ? 'Resume' : 'Pause'}" style="background:#222222; border:1px solid #555555; color:${isPaused ? '#FFC400' : '#FFFFFF'}; border-radius:4px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:11px; font-weight:bold;">
            ${isPaused ? '▶' : '⏸'}
          </button>
          <button id="pip-stop" title="Stop & Save" style="background:#331111; border:1px solid #FF4D4D; color:#FF4D4D; border-radius:4px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:11px; font-weight:bold;">
            ⏹
          </button>
        </div>
      </div>
    `;

    const pauseBtn = doc.getElementById('pip-pause');
    if (pauseBtn) {
      pauseBtn.onclick = () => onPauseToggle();
    }
    const stopBtn = doc.getElementById('pip-stop');
    if (stopBtn) {
      stopBtn.onclick = () => {
        onStop();
        if (pipWindowRef.current) {
          pipWindowRef.current.close();
          pipWindowRef.current = null;
        }
      };
    }
  };

  const openDesktopPipWindow = async () => {
    if ('documentPictureInPicture' in (window as any)) {
      try {
        if (pipWindowRef.current) return;
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width: 170,
          height: 65
        });
        pipWindowRef.current = pipWin;

        pipWin.document.body.style.margin = '0';
        pipWin.document.body.style.padding = '0';
        pipWin.document.body.style.backgroundColor = '#111111';
        pipWin.document.body.style.color = '#ffffff';

        pipWin.addEventListener('pagehide', () => {
          pipWindowRef.current = null;
        });

        updatePipDOM();
      } catch (err) {
        console.warn("Desktop PIP window opening skipped:", err);
      }
    }
  };

  // Sync PIP window contents when recording state changes
  useEffect(() => {
    if (pipWindowRef.current) {
      updatePipDOM();
    }
  }, [seconds, isPaused, isRecording]);

  // Auto-trigger PIP popout window when user switches software / hides browser tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isRecording && !pipWindowRef.current) {
        openDesktopPipWindow();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRecording]);

  // Close PIP window when recording stops
  useEffect(() => {
    if (!isRecording && pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        minWidth: '140px',
        minHeight: '48px',
        maxWidth: '360px',
        maxHeight: '180px',
        resize: 'both',
        overflow: 'hidden'
      }}
      onMouseDown={handleMouseDown}
      className={`fixed z-[9999] rounded-[8px] border-2 border-[#FFC400] bg-[#111111] text-white shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-1.5 flex flex-col justify-between select-none transition-shadow ${
        isDragging ? 'cursor-grabbing shadow-[0_12px_32px_rgba(255,196,0,0.4)] ring-2 ring-[#FFC400]' : 'cursor-grab'
      }`}
    >
      {/* Top row: Drag Grip, Live Pulse, Time Ticker, Actions */}
      <div className="flex items-center justify-between gap-1 w-full flex-1">
        {/* Left: Drag Handle & Live Mic Pulse */}
        <div className="flex items-center gap-1 min-w-0">
          <GripVertical className="h-3.5 w-3.5 text-neutral-400 shrink-0 cursor-grab" />
          <div className="relative flex items-center justify-center shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${isPaused ? 'bg-[#FFC400]' : 'bg-[#FF4D4D] animate-ping'}`} />
            <span className={`absolute h-2 w-2 rounded-full ${isPaused ? 'bg-[#FFC400]' : 'bg-[#FF4D4D]'}`} />
          </div>
          <span className="font-mono text-xs font-extrabold text-white tracking-wider truncate">
            {formatTime(seconds)}
          </span>
        </div>

        {/* Right: Action Buttons (Pause, Stop, Float to Desktop, Maximize) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPauseToggle();
            }}
            title={isPaused ? "Resume Recording" : "Pause Recording"}
            className="h-6 w-6 rounded-[4px] border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center transition-all cursor-pointer"
          >
            {isPaused ? (
              <Play className="h-3 w-3 fill-current text-[#FFC400]" />
            ) : (
              <Pause className="h-3 w-3 fill-current text-white" />
            )}
          </button>

          {/* Stop Recording Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            title="Stop & Process Recording"
            className="h-6 w-6 rounded-[4px] border border-red-500/50 bg-red-950/60 hover:bg-red-900 flex items-center justify-center transition-all cursor-pointer"
          >
            <Square className="h-3 w-3 fill-current text-[#FF4D4D]" />
          </button>

          {/* Float Window on Desktop (Always-on-top OS Window for PowerPoint/Word/Zoom) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDesktopPipWindow();
            }}
            title="Float Window on Desktop (Stays on top of PowerPoint / Word / Software)"
            className="h-6 w-6 rounded-[4px] border border-[#38BDF8]/60 bg-[#38BDF8]/20 hover:bg-[#38BDF8]/40 text-[#38BDF8] flex items-center justify-center transition-all cursor-pointer"
          >
            <ExternalLink className="h-3 w-3" />
          </button>

          {/* Open Full Capture View */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCapture();
            }}
            title="Expand to Lecture Capture View"
            className="h-6 w-6 rounded-[4px] border border-[#FFC400]/60 bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] flex items-center justify-center transition-all cursor-pointer"
          >
            <Maximize2 className="h-3 w-3 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
