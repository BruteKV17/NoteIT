/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Flame, Trophy, X, ArrowRight, BookOpen } from 'lucide-react';

export interface XPAwardDetail {
  xpAmount: number;
  reason: string;
  taskId: string;
  newTotalXp: number;
}

export interface SmartNotificationDetail {
  id?: string;
  type: 'streak_warning' | 'weekend_reminder' | 'resource_generated' | 'resource_failed' | 'xp_awarded' | 'weekend_completed';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  mascotPose?: string;
  autoDismissMs?: number;
}

export function XPToastNotification() {
  const [xpToast, setXpToast] = useState<XPAwardDetail | null>(null);
  const [smartToast, setSmartToast] = useState<SmartNotificationDetail | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Handle XP Awarded Event
    const handleXPAwarded = (event: Event) => {
      const customEvt = event as CustomEvent<XPAwardDetail>;
      if (customEvt.detail) {
        setXpToast(customEvt.detail);
        setSmartToast(null);
        setIsVisible(true);

        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 4500);
        return () => clearTimeout(timer);
      }
    };

    // 2. Handle Smart Notifications (Streak warnings, resource ready, weekend reminders)
    const handleSmartNotification = (event: Event) => {
      const customEvt = event as CustomEvent<SmartNotificationDetail>;
      if (customEvt.detail) {
        setSmartToast(customEvt.detail);
        setXpToast(null);
        setIsVisible(true);

        const dismissTime = customEvt.detail.autoDismissMs || 6000;
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, dismissTime);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('noteit_xp_awarded', handleXPAwarded);
    window.addEventListener('noteit_notification', handleSmartNotification);
    return () => {
      window.removeEventListener('noteit_xp_awarded', handleXPAwarded);
      window.removeEventListener('noteit_notification', handleSmartNotification);
    };
  }, []);

  if (!isVisible) return null;

  // Render XP Toast
  if (xpToast) {
    return (
      <div className="fixed bottom-6 right-6 z-[99999] pointer-events-auto select-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
        <div className="relative w-80 sm:w-96 rounded-[12px] border-2 border-[#FFC400] bg-[#111111] text-white p-5 shadow-[0_16px_40px_rgba(255,196,0,0.4)] overflow-visible">
          
          <div className="absolute -top-16 -right-3 w-28 h-28 pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] animate-bounce">
            <img
              src="/mascots/broot-celebrating-confetti.png"
              alt="Broot Mascot"
              className="w-full h-full object-contain"
            />
          </div>

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

          <div className="space-y-2 pr-12">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-[#FFC400] tracking-tight">
                +{xpToast.xpAmount} XP
              </span>
              <Sparkles className="h-5 w-5 text-[#FFC400] animate-spin" />
            </div>

            <p className="text-xs font-mono font-bold text-neutral-200 leading-snug">
              {xpToast.reason}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-dashed border-neutral-800 flex items-center justify-between text-[11px] font-mono font-bold text-neutral-400">
            <span>TOTAL BALANCE</span>
            <span className="text-[#FFC400] font-black text-xs">
              {xpToast.newTotalXp ? xpToast.newTotalXp.toLocaleString() : '---'} XP
            </span>
          </div>

        </div>
      </div>
    );
  }

  // Render Smart Toast (Streak warnings, Resource ready, Weekend reminders)
  if (smartToast) {
    const isWarning = smartToast.type === 'streak_warning' || smartToast.type === 'weekend_reminder';
    const isError = smartToast.type === 'resource_failed';

    const borderColor = isError ? 'border-[#FF4D4D]' : (isWarning ? 'border-[#FFC400]' : 'border-[#19B56B]');
    const mascotImg = smartToast.mascotPose || (isWarning ? '/mascots/broot-thinking.png' : '/mascots/broot-peace-wink.png');

    return (
      <div className="fixed bottom-6 right-6 z-[99999] pointer-events-auto select-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
        <div className={`relative w-80 sm:w-96 rounded-[12px] border-3 ${borderColor} bg-[#0A101D] text-white p-5 shadow-2xl overflow-visible`}>
          
          {/* Mascot Pose Graphic */}
          <div className="absolute -top-14 -right-2 w-24 h-24 pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] animate-bounce">
            <img
              src={mascotImg}
              alt="Broot Mascot"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Header row */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3 pr-16">
            <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold text-[#FFC400]">
              {isWarning ? <Flame className="h-4 w-4 fill-[#FF4D4D] text-[#FF4D4D]" /> : (isError ? <AlertTriangle className="h-4 w-4 text-[#FF4D4D]" /> : <CheckCircle2 className="h-4 w-4 text-[#19B56B]" />)}
              <span className="uppercase tracking-wider">{smartToast.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="space-y-3 pr-12">
            <p className="text-xs font-mono font-medium text-slate-200 leading-relaxed">
              {smartToast.message}
            </p>

            {smartToast.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  setIsVisible(false);
                  if (smartToast.onAction) smartToast.onAction();
                }}
                className="px-4 py-1.5 rounded-[6px] bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold uppercase hover:bg-[#ffe066] transition-colors border border-[#111111] shadow-paper-xs flex items-center gap-1 cursor-pointer"
              >
                <span>{smartToast.actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  return null;
}
