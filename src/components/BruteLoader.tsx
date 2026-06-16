/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BruteLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  message?: string;
}

export default function BruteLoader({
  size = 'md',
  className = '',
  message = 'Initializing neural interface...'
}: BruteLoaderProps) {
  // Size specifications
  const dims = {
    xs: { sizePx: 24, stroke: 1, text: 'text-[4px]', mt: 'mt-0' },
    sm: { sizePx: 50, stroke: 1.5, text: 'text-[8px]', mt: 'mt-1.5' },
    md: { sizePx: 80, stroke: 2, text: 'text-[10px]', mt: 'mt-3' },
    lg: { sizePx: 120, stroke: 2.5, text: 'text-[12px]', mt: 'mt-4' },
    xl: { sizePx: 160, stroke: 3, text: 'text-[14px]', mt: 'mt-5' }
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Loading Spinner Wrapper */}
      <div 
        style={{ width: dims.sizePx, height: dims.sizePx }}
        className="relative flex items-center justify-center select-none"
      >
        {/* Holographic Glowing SVG */}
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-[0_0_12px_rgba(95,109,248,0.4)]"
        >
          {/* Definitions for gradients/glows */}
          <defs>
            <linearGradient id="cyberGlow1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5F6DF8" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="cyberGlow2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>

          {/* Outer Ring - Clockwise Rotation */}
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="url(#cyberGlow1)" 
            strokeWidth={dims.stroke} 
            strokeDasharray="10 12 18 10" 
            strokeLinecap="round"
            className="animate-[spin_4s_linear_infinite]"
          />

          {/* Inner Ring - Counter-Clockwise Rotation */}
          <circle 
            cx="50" 
            cy="50" 
            r="36" 
            stroke="url(#cyberGlow2)" 
            strokeWidth={dims.stroke - 0.5} 
            strokeDasharray="6 8 12 6" 
            strokeLinecap="round"
            className="animate-[spin_3s_linear_infinite_reverse]"
          />

          {/* Center Background Tech Circle */}
          <circle 
            cx="50" 
            cy="50" 
            r="28" 
            fill="#08090d" 
            stroke="#1d202b" 
            strokeWidth="1"
            className="opacity-75"
          />
        </svg>

        {/* Central pulsing branding text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className={`font-mono font-black tracking-widest text-[#5F6DF8] animate-pulse ${dims.text}`}
            style={{ textShadow: '0 0 8px rgba(95,109,248,0.6)' }}
          >
            BRUTE
          </span>
        </div>
      </div>

      {/* Loading message */}
      {message && (
        <span 
          className={`text-[9.5px] font-mono font-bold uppercase tracking-widest text-neutral-450 animate-pulse text-center max-w-[280px] ${dims.mt}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
