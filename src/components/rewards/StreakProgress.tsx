/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Zap, Trophy, Award, Clock } from 'lucide-react';
import { getNextMilestone, getDailyXpForStreakDay } from '../../config/streakConfig';

interface StreakProgressProps {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  todayClaimed: boolean;
  onOpenClaimModal?: () => void;
}

export default function StreakProgress({
  currentStreak,
  longestStreak,
  totalXp,
  todayClaimed,
  onOpenClaimModal
}: StreakProgressProps) {
  const progressPercent = Math.min(100, Math.round((currentStreak / 90) * 100));
  const milestone = getNextMilestone(currentStreak);
  const daysRemaining = Math.max(0, 90 - currentStreak);
  const currentDailyXp = getDailyXpForStreakDay(currentStreak > 0 ? currentStreak : 1);

  return (
    <div className="rounded-[8px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 md:p-8 shadow-paper-md space-y-6 text-[var(--text-primary)]">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[var(--border-main)] pb-5">
        <div>
          <span className="text-[10px] font-mono font-extrabold text-[#19B56B] uppercase tracking-[3px] block">
            GAMIFIED DAILY HABIT
          </span>
          <h2 className="font-heading font-extrabold text-2xl md:text-3xl uppercase text-[var(--text-primary)] tracking-tight mt-0.5">
            🔥 90-DAY XP STREAK
          </h2>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-1 max-w-xl">
            Log in every day to claim XP and level up your reward tier from 10 XP/day to 100 XP/day.
          </p>
        </div>

        {!todayClaimed && onOpenClaimModal && (
          <button
            onClick={onOpenClaimModal}
            className="px-5 py-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold uppercase hover:bg-[#ffe066] transition-all shadow-paper-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Zap className="h-4 w-4 fill-[#111111]" />
            <span>CLAIM TODAY'S XP</span>
          </button>
        )}
      </div>

      {/* Grid Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        {/* Current Streak */}
        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] shadow-paper-sm">
          <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">CURRENT STREAK</div>
          <div className="text-2xl font-extrabold text-[#FF4D4D] mt-1 flex items-center gap-1.5">
            <Flame className="h-6 w-6 fill-[#FF4D4D]" />
            <span>{currentStreak} DAYS</span>
          </div>
          <div className="text-[11px] font-bold text-[#19B56B] mt-1">
            +{currentDailyXp} XP TODAY
          </div>
        </div>

        {/* Longest Streak */}
        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] shadow-paper-sm">
          <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">LONGEST STREAK</div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
            <Award className="h-6 w-6 text-[#FFC400]" />
            <span>{longestStreak} DAYS</span>
          </div>
          <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-1">
            PERSONAL RECORD
          </div>
        </div>

        {/* Total XP */}
        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] shadow-paper-sm">
          <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">TOTAL ACCUMULATED XP</div>
          <div className="text-2xl font-extrabold text-[#FFC400] mt-1 flex items-center gap-1.5">
            <Zap className="h-6 w-6 fill-[#FFC400]" />
            <span>{(totalXp || 0).toLocaleString()} XP</span>
          </div>
          <div className="text-[11px] font-bold text-[#38BDF8] mt-1">
            LIFETIME BALANCE
          </div>
        </div>

        {/* Milestone Target */}
        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] shadow-paper-sm">
          <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">90-DAY MILESTONE</div>
          <div className="text-2xl font-extrabold text-[#38BDF8] mt-1 flex items-center gap-1.5">
            <Trophy className="h-6 w-6 text-[#38BDF8]" />
            <span>{daysRemaining} DAYS</span>
          </div>
          <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-1">
            {currentStreak >= 90 ? 'MILESTONE ACHIEVED!' : `${daysRemaining} DAYS TO DAY 90`}
          </div>
        </div>

      </div>

      {/* 90-Day Visual Progress Bar (Requirement 3) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between font-mono text-xs font-extrabold">
          <span className="uppercase text-[var(--text-primary)]">DAY {currentStreak} / 90 PROGRESS</span>
          <span className="text-[#19B56B]">{progressPercent}% COMPLETE</span>
        </div>
        <div className="h-4 w-full rounded-[4px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] overflow-hidden relative shadow-paper-sm">
          <div 
            className="h-full bg-[#FFC400] transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

    </div>
  );
}
