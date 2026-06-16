/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AILogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export default function AILogo({ 
  className = '', 
  size = 40,
  showText = false,
  theme = 'dark'
}: AILogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        style={{ width: size, height: size }} 
        className="relative flex-shrink-0 select-none cursor-pointer group active:scale-95 transition-transform"
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm group-hover:brightness-110 transition-all duration-300"
        >
          {/* Brand Squircle Background */}
          <rect width="100" height="100" rx="28" fill="#0c0e17" />
          
          {/* Underlay backing board (creates depth seen in logo) */}
          <rect x="38" y="32" width="31" height="35" rx="5" fill="#242834" />
          
          {/* Slanted page spine / Folder Back cover flap with real shadow depth */}
          <path d="M30 29.5 L38 34 V 66 L30 70.5 Z" fill="#FFFFFF" />
          <path d="M38 34 L38 66" stroke="#2c303f" strokeWidth="0.8" />
          
          {/* Spine Gap (Separates flap from book pages) */}
          <rect x="38" y="34" width="4" height="32" fill="#1d202b" />
          
          {/* Main White sheet of notebook with rounded right edges */}
          <rect x="42" y="34" width="22" height="32" rx="3.5" fill="#FFFFFF" />
          
          {/* 3 Horizontal lines representing written notes */}
          <rect x="46" y="42" width="10" height="2" rx="1" fill="#a4abb6" />
          <rect x="46" y="48" width="12" height="2" rx="1" fill="#a4abb6" />
          <rect x="46" y="54" width="8" height="2" rx="1" fill="#a4abb6" />
          
          {/* Overlay Add Button (+) styled exactly in beautiful blue-indigo */}
          <circle cx="71" cy="33.5" r="9.5" fill="#5F6DF8" stroke="#0c0e17" strokeWidth="2" />
          
          {/* Solid White Plus Symbol with rounded caps */}
          <path 
            d="M71 29 V38 M66.5 33.5 H75.5" 
            stroke="#FFFFFF" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col select-none">
          <span className={`font-sans font-black tracking-tight text-base leading-none ${
            theme === 'dark' ? 'text-white' : 'text-gray-950'
          }`}>
            NoteIT
          </span>
          <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-500 mt-1 block">
            Scholar AI
          </span>
        </div>
      )}
    </div>
  );
}
