/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Trophy, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button, Badge, Card } from '../bauhaus';

interface WeekendChallengeCardProps {
  onStartChallenge: () => void;
  isCompleted?: boolean;
  score?: number;
  dayLabel?: 'Saturday' | 'Sunday' | string;
  theme?: 'light' | 'dark';
}

export default function WeekendChallengeCard({
  onStartChallenge,
  isCompleted = false,
  score = 0,
  dayLabel = 'Saturday',
  theme = 'dark'
}: WeekendChallengeCardProps) {
  return (
    <Card shadow="lg" className="relative p-6 md:p-8 border-3 border-[#FFC400] bg-[var(--card-bg)] text-[var(--text-primary)] rounded-[12px] overflow-hidden shadow-paper-yellow transition-all">
      {/* Background Decorative Accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFC400]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left Copy & Badges */}
        <div className="space-y-3 max-w-2xl text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="yellow" size="md" icon={<Flame className="h-3.5 w-3.5 fill-[#111111]" />}>
              🔥 {dayLabel.toUpperCase()} STREAK PROTECTION
            </Badge>
            <Badge variant="green" size="sm" icon={<Trophy className="h-3.5 w-3.5" />}>
              +50 BONUS XP
            </Badge>
          </div>

          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-[var(--text-primary)] leading-tight">
            WEEKEND REVISION CHALLENGE
          </h2>

          <p className="text-xs sm:text-sm font-mono text-[var(--text-secondary)] font-medium leading-relaxed border-l-3 border-[#FFC400] pl-3">
            No lecture today? Protect your streak and review concepts across all your learned subjects in 10 mixed questions.
          </p>

          <div className="flex items-center gap-4 text-xs font-mono font-bold text-[var(--text-primary)] pt-1">
            <span>• 10 Questions</span>
            <span>• Mixed Subjects</span>
            <span>• Easy, Medium & Hard</span>
          </div>
        </div>

        {/* Right Mascot & Action CTA */}
        <div className="flex flex-col items-center justify-center shrink-0 space-y-3 w-full md:w-auto">
          <div className="relative group">
            <img
              src="/mascots/broot-celebrating-confetti.png"
              alt="Broot Celebrating Weekend Challenge"
              className="w-28 h-28 sm:w-36 sm:h-36 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] animate-bounce"
            />
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={onStartChallenge}
            className="w-full md:w-auto bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] font-extrabold border-2 border-[var(--border-main)] shadow-paper-md px-6 cursor-pointer"
            icon={isCompleted ? <CheckCircle2 className="h-4.5 w-4.5 text-[#111111]" /> : <ArrowRight className="h-4.5 w-4.5 text-[#111111]" />}
          >
            {isCompleted ? `REVIEW CHALLENGE (${score}/10 ✓)` : 'START CHALLENGE →'}
          </Button>
        </div>

      </div>
    </Card>
  );
}
