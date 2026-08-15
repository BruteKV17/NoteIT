/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, X } from 'lucide-react';

export interface XPAwardDetail {
  xpAmount: number;
  reason: string;
  taskId: string;
  newTotalXp: number;
}

export function XPToastNotification() {
  const [toast, setToast] = useState<XPAwardDetail | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleXPAwarded = (event: Event) => {
      const customEvt = event as CustomEvent<XPAwardDetail>;
      if (customEvt.detail) {
        setToast(customEvt.detail);
        setIsVisible(true);

        // Auto dismiss after 4.5 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 4500);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('noteit_xp_awarded', handleXPAwarded);
    return () => {
      window.removeEventListener('noteit_xp_awarded', handleXPAwarded);
    };
  }, []);

  if (!isVisible || !toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[99999] pointer-events-auto select-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="relative w-80 sm:w-96 rounded-[12px] border-2 border-[#FFC400] bg-[#111111] text-white p-5 shadow-[0_16px_40px_rgba(255,196,0,0.4)] overflow-visible">
        
        {/* CELEBRATING BLUE MASCOT POPPING UP */}
        <div className="absolute -top-16 -right-3 w-28 h-28 pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] animate-bounce">
          <img
            src="/mascots/mascot-celebrate.png"
            alt="Celebrating Blue Mascot"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3 pr-20">
          <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold text-[#19B56B]">
            <CheckCircle2 className="h-4 w-4" />
            <span>XP EARNED!</span>
          </div>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="space-y-2 pr-12">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-[#FFC400] tracking-tight">
              +{toast.xpAmount} XP
            </span>
            <Sparkles className="h-5 w-5 text-[#FFC400] animate-spin" />
          </div>

          <p className="text-xs font-mono font-bold text-neutral-200 leading-snug">
            {toast.reason}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-2 border-t border-dashed border-neutral-800 flex items-center justify-between text-[11px] font-mono font-bold text-neutral-400">
          <span>TOTAL BALANCE</span>
          <span className="text-[#FFC400] font-black text-xs">
            {toast.newTotalXp ? toast.newTotalXp.toLocaleString() : '---'} XP
          </span>
        </div>

      </div>
    </div>
  );
}
