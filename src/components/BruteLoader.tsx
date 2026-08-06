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
  // Scale mapping for kinetic 96px loader
  const scaleMap = {
    xs: 0.35,
    sm: 0.55,
    md: 0.8,
    lg: 1.1,
    xl: 1.4
  };

  const scale = scaleMap[size] || 0.8;
  const containerHeight = Math.round(96 * scale + 24);

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* 7-Square Kinetic Bauhaus Loader */}
      <div 
        style={{ height: containerHeight }}
        className="flex items-center justify-center p-2"
      >
        <div 
          style={{ transform: `scale(${scale})` }}
          className="bauhaus-loader"
        >
          <div className="bauhaus-loader-square" />
          <div className="bauhaus-loader-square" />
          <div className="bauhaus-loader-square" />
          <div className="bauhaus-loader-square" />
          <div className="bauhaus-loader-square" />
          <div className="bauhaus-loader-square" />
          <div className="bauhaus-loader-square" />
        </div>
      </div>

      {/* Loading message */}
      {message && (
        <span 
          className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#111111] animate-pulse text-center max-w-[320px] mt-2"
        >
          {message}
        </span>
      )}
    </div>
  );
}

