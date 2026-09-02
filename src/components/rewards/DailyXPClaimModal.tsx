/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Flame, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Trophy, 
  Sparkles, 
  ArrowRight,
  X 
} from 'lucide-react';
import { getNextMilestone } from '../../config/streakConfig';

interface DailyXPClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => Promise<void>;
  isClaiming: boolean;
  claimSuccess: boolean;
  claimError: string | null;
  currentStreak: number;
  projectedStreak: number;
  projectedXp: number;
  totalXp: number;
  wasReset: boolean;
}

export default function DailyXPClaimModal({
  isOpen,
  onClose,
  onClaim,
  isClaiming,
  claimSuccess,
  claimError,
  currentStreak,
  projectedStreak,
  projectedXp,
  totalXp,
  wasReset
}: DailyXPClaimModalProps) {
  if (!isOpen) return null;

  const streakDay = claimSuccess ? currentStreak : projectedStreak;
  const progressPercent = Math.min(100, Math.round((streakDay / 90) * 100));
  const milestone = getNextMilestone(streakDay);
  const daysToMilestone = Math.max(0, milestone.day - streakDay);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in select-none">
      
      {/* Bauhaus High-Contrast Container (#F6F2EA, 2px border, 4px paper shadow) */}
      <div className="w-full max-w-md rounded-[8px] border-2 border-[var(--border-main)] bg-[#F6F2EA] text-[#111111] p-6 shadow-paper-lg space-y-6 relative overflow-hidden">
        
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#FFC400]" />

        {/* Header Section */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[4px] bg-[#FFC400] text-[#111111] border-2 border-[var(--border-main)] shadow-paper-sm">
              <Zap className="h-4 w-4 fill-[#111111]" />
            </span>
            <span className="font-heading font-extrabold text-sm uppercase tracking-wider">
              DAILY XP AVAILABLE
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-[4px] border-2 border-[var(--border-main)] bg-white hover:bg-[#FF4D4D] hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Streak Reset Alert Banner (Requirement 4) */}
        {wasReset && !claimSuccess && (
          <div className="p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FF4D4D]/15 text-[#111111] space-y-0.5">
            <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-[#FF4D4D]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>STREAK RESET</span>
            </div>
            <p className="text-[11px] font-mono font-bold leading-tight text-[var(--text-secondary)]">
              You missed yesterday. Your new streak starts today! Keep going!
            </p>
          </div>
        )}

        {/* 90-Day Milestone Celebration Banner (Requirement 5) */}
        {streakDay >= 90 && (
          <div className="p-3.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] space-y-1 shadow-paper-sm">
            <div className="flex items-center gap-2 font-heading font-extrabold text-sm uppercase tracking-tight">
              <Trophy className="h-5 w-5 fill-[#111111]" />
              <span>🏆 90 DAY STREAK COMPLETE!</span>
            </div>
            <p className="text-xs font-mono font-bold">
              YOU'VE UNLOCKED THE CELESTIAL STREAK MILESTONE!
            </p>
          </div>
        )}

        {/* Main Streak Counter & XP Award Pill */}
        <div className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-white space-y-4 text-center shadow-paper-sm">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold uppercase shadow-paper-sm">
            <Flame className="h-4 w-4 fill-[#FF4D4D] text-[#FF4D4D]" />
            <span>🔥 {streakDay} DAY STREAK</span>
          </div>

          <div>
            <div className="text-[11px] font-mono font-bold uppercase text-gray-600">
              TODAY'S REWARD
            </div>
            <div className="font-mono text-4xl font-extrabold text-[#111111] mt-1 flex items-center justify-center gap-1.5">
              <span className="text-[#FFC400]">+</span>
              <span>{projectedXp} XP</span>
            </div>
          </div>

          {/* 90-Day Progress Bar (Requirement 3) */}
          <div className="space-y-1.5 pt-1 text-left">
            <div className="flex items-center justify-between font-mono text-xs font-extrabold">
              <span>DAY {streakDay} / 90</span>
              <span className="text-[#19B56B]">{progressPercent}%</span>
            </div>
            <div className="h-3.5 w-full rounded-[4px] border-2 border-[var(--border-main)] bg-gray-100 overflow-hidden relative">
              <div 
                className="h-full bg-[#FFC400] transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {daysToMilestone > 0 && (
              <div className="text-[10px] font-mono font-bold text-gray-600 text-right">
                {daysToMilestone} DAYS TO DAY {milestone.day} ({milestone.xp} XP/DAY)
              </div>
            )}
          </div>
        </div>

        {/* Total XP Summary Pill */}
        <div className="flex items-center justify-between p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-white font-mono text-xs font-bold">
          <span className="text-gray-600 uppercase">TOTAL ACCUMULATED XP</span>
          <span className="font-extrabold text-[#111111] text-sm">{(totalXp || 0).toLocaleString()} XP</span>
        </div>

        {/* Error message */}
        {claimError && (
          <div className="p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FF4D4D]/15 text-[#FF4D4D] font-mono text-xs font-bold">
            {claimError}
          </div>
        )}

        {/* Primary Action Button */}
        <div>
          {!claimSuccess ? (
            <button
              onClick={onClaim}
              disabled={isClaiming}
              className="w-full py-3.5 px-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] font-mono text-sm font-extrabold uppercase hover:bg-[#ffe066] active:translate-y-0.5 transition-all shadow-paper-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isClaiming ? (
                <span>CLAIMING XP...</span>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-[#111111]" />
                  <span>CLAIM +{projectedXp} XP</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[#19B56B] text-white text-center font-mono text-xs font-extrabold flex items-center justify-center gap-2 shadow-paper-sm">
                <CheckCircle className="h-5 w-5" />
                <span>✓ DAILY XP CLAIMED (+{projectedXp} XP, 🔥 {streakDay} DAY STREAK)</span>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[#111111] text-white font-mono text-xs font-extrabold uppercase hover:bg-gray-800 transition-all shadow-paper-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>CONTINUE TO DASHBOARD</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
