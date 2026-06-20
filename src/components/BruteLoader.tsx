/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import AILogo from './AILogo';

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
    xs: { sizePx: 24, stroke: 1.5, logoSize: 12, mt: 'mt-1' },
    sm: { sizePx: 50, stroke: 2, logoSize: 24, mt: 'mt-2' },
    md: { sizePx: 80, stroke: 2.5, logoSize: 40, mt: 'mt-3.5' },
    lg: { sizePx: 120, stroke: 3.5, logoSize: 60, mt: 'mt-5' },
    xl: { sizePx: 160, stroke: 4.5, logoSize: 80, mt: 'mt-6' }
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Loading Spinner Wrapper */}
      <div 
        style={{ width: dims.sizePx, height: dims.sizePx }}
        className="relative flex items-center justify-center select-none"
      >
        {/* Minimalist Indigo Rotating SVG */}
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-[0_0_8px_rgba(95,109,248,0.25)] animate-spin"
        >
          {/* Definitions for gradient */}
          <defs>
            <linearGradient id="indigoSpinnerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5F6DF8" />
              <stop offset="60%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Minimalist Rotating Arc */}
          <circle 
            cx="50" 
            cy="50" 
            r="42" 
            stroke="url(#indigoSpinnerGlow)" 
            strokeWidth={dims.stroke} 
            strokeLinecap="round"
            strokeDasharray="180 100"
          />
        </svg>

        {/* Central pulsing branding logo */}
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <AILogo size={dims.logoSize} showText={false} />
        </div>
      </div>

      {/* Loading message */}
      {message && (
        <span 
          className={`text-[10px] font-sans font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 animate-pulse text-center max-w-[280px] ${dims.mt}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}

