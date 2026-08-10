/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';

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

        // Hide after 4 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 4000);

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
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
      <div className="w-80 rounded-[8px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-4 shadow-paper-lg transition-all transform duration-300">
        <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold text-[#19B56B]">
            <CheckCircle2 className="h-4 w-4" />
            <span>✓ XP EARNED</span>
          </div>
          <span className="font-mono text-[10px] font-bold text-[var(--text-secondary)] uppercase">
            AUTOMATIC REWARD
          </span>
        </div>

        <div className="flex items-center gap-3 my-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#FFC400] text-[#111111] font-extrabold text-sm border-2 border-[var(--border-main)] shadow-paper-sm animate-pulse">
            <Zap className="h-5 w-5 fill-[#111111]" />
          </div>

          <div>
            <div className="font-mono text-lg font-black text-[#FFC400] leading-none">
              +{toast.xpAmount} XP
            </div>
            <div className="text-xs font-mono font-bold text-[var(--text-primary)] mt-1 leading-snug">
              {toast.reason}
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-dashed border-[var(--border-main)] flex items-center justify-between text-[11px] font-mono font-bold text-[var(--text-secondary)]">
          <span>TOTAL BALANCE</span>
          <span className="text-[#FFC400] font-black">{toast.newTotalXp.toLocaleString()} XP</span>
        </div>
      </div>
    </div>
  );
}
