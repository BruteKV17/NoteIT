/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Maximize2, GripVertical, Mic } from 'lucide-react';

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
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  // Keep widget inside screen viewport on resize
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

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking on header/drag handle or widget background (not buttons)
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
      {/* Top row: Drag Grip, Live Pulse, Time Ticker, Maximize Button */}
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

        {/* Right: Compact Action Buttons (Pause/Play, Stop, Open) */}
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
