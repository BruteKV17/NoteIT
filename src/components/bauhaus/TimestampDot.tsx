/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

/**
 * Quantizes any timestamp string (e.g. "00:29", "01:45", "03:12") to fixed 2-minute interval ("00:00", "02:00", "04:00", etc.)
 */
export function quantizeToTwoMinInterval(timeStr: string): string {
  if (!timeStr) return '00:00';
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return '00:00';
  const mins = parseInt(parts[0], 10) || 0;
  const secs = parseInt(parts[1], 10) || 0;
  const totalSecs = mins * 60 + secs;

  // Quantize to 2-minute (120 seconds) bucket
  const bucketSecs = Math.floor(totalSecs / 120) * 120;
  const bucketMins = Math.floor(bucketSecs / 60);

  return `${String(bucketMins).padStart(2, '0')}:00`;
}

interface TimestampDotProps {
  timeVal: string;
  onSeek?: (timeVal: string) => void;
}

export function TimestampDot({ timeVal, onSeek }: TimestampDotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const formattedTime = quantizeToTwoMinInterval(timeVal);

  return (
    <span className="relative inline-flex items-center mx-1.5 align-middle group select-none">
      {/* Bold Yellow Dot Indicator (Requirement) */}
      <span
        onClick={() => onSeek?.(formattedTime)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-3.5 h-3.5 rounded-full bg-[#FFC400] border-2 border-[#111111] shadow-paper-xs cursor-pointer hover:scale-125 hover:bg-[#FFE066] transition-all inline-block shrink-0"
        title={`Timestamp: [${formattedTime}]`}
      />

      {/* Mouse Cursor Hover Tooltip */}
      {isHovered && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#111111] text-[#FFC400] font-mono text-[11px] font-black border-2 border-[#FFC400] shadow-paper-md whitespace-nowrap z-50 pointer-events-none animate-fade-in">
          <span>⏱️</span>
          <span>[{formattedTime}]</span>
        </span>
      )}
    </span>
  );
}

/**
 * Renders transcript text by replacing inline timestamp text with fixed 2-minute interval bold yellow dots
 * displaying timestamps on mouse cursor hover.
 */
export function renderTranscriptWithDots(text: string, onSeek?: (timeVal: string) => void) {
  if (!text) return <p className="text-[var(--text-secondary)] font-mono text-xs italic">No transcript content available.</p>;

  // Regex matching bracketed timestamps like [00:00], [00:29], [01:15], etc.
  const timestampRegex = /(\[\d{1,2}:\d{2}\])/g;
  const parts = text.split(timestampRegex);
  const renderedBuckets = new Set<string>();

  return parts.map((part, index) => {
    if (timestampRegex.test(part)) {
      const rawTime = part.replace(/[\[\]]/g, '');
      const quantizedTime = quantizeToTwoMinInterval(rawTime);

      // Deduplicate so only 1 dot appears per 2-minute interval block
      if (renderedBuckets.has(quantizedTime)) {
        return null;
      }
      renderedBuckets.add(quantizedTime);

      return (
        <TimestampDot key={index} timeVal={quantizedTime} onSeek={onSeek} />
      );
    }
    return <span key={index} className="text-[var(--text-primary)] font-medium leading-relaxed">{part}</span>;
  });
}
