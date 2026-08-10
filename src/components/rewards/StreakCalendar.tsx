/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, Flame, AlertTriangle, Lock } from 'lucide-react';
import { getDailyXpForStreakDay } from '../../config/streakConfig';

interface StreakCalendarProps {
  currentStreak: number;
}

export default function StreakCalendar({ currentStreak }: StreakCalendarProps) {
  // Generate 90 day cell objects (1..90)
  const daysArray = Array.from({ length: 90 }, (_, index) => {
    const dayNumber = index + 1;
    let state: 'completed' | 'current' | 'upcoming' = 'upcoming';

    if (dayNumber < currentStreak) {
      state = 'completed';
    } else if (dayNumber === currentStreak) {
      state = 'current';
    } else {
      state = 'upcoming';
    }

    return {
      dayNumber,
      dayLabel: String(dayNumber).padStart(2, '0'),
      xp: getDailyXpForStreakDay(dayNumber),
      state
    };
  });

  return (
    <div className="rounded-[8px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 md:p-8 shadow-paper-md space-y-6 text-[var(--text-primary)]">
      
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[var(--border-main)] pb-4">
        <div>
          <h3 className="font-heading font-extrabold text-xl uppercase tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Flame className="h-5 w-5 text-[#FF4D4D] fill-[#FF4D4D]" />
            90-DAY STREAK CALENDAR
          </h3>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
            Track your 90-day learning habit milestone progression cell by cell.
          </p>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-3 font-mono text-[10px] font-bold flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[2px] bg-[#FFC400] border border-[#111111]" />
            <span>COMPLETED</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[2px] bg-[#111111] border border-[#FFC400]" />
            <span>CURRENT</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[2px] bg-[var(--panel-bg)] border border-[var(--border-main)]" />
            <span>UPCOMING</span>
          </div>
        </div>
      </div>

      {/* Responsive 90-Day Square Grid (Requirement 11) */}
      <div className="grid grid-cols-5 sm:grid-cols-9 md:grid-cols-10 lg:grid-cols-15 gap-2 pt-2">
        {daysArray.map((day) => {
          let cellStyle = 'bg-[var(--panel-bg)] text-[var(--text-secondary)] border-[var(--border-main)]';
          
          if (day.state === 'completed') {
            cellStyle = 'bg-[#FFC400] text-[#111111] border-[#111111] font-extrabold shadow-paper-xs';
          } else if (day.state === 'current') {
            cellStyle = 'bg-[#111111] text-[#FFC400] border-[#FFC400] ring-2 ring-[#FFC400] font-extrabold shadow-paper-sm';
          }

          return (
            <div
              key={day.dayNumber}
              className={`h-11 rounded-[4px] border-2 flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer relative group ${cellStyle}`}
              title={`Day ${day.dayNumber}: +${day.xp} XP`}
            >
              <span className="font-mono text-xs leading-none">
                {day.dayLabel}
              </span>
              <span className="text-[8px] font-mono opacity-80 mt-0.5">
                +{day.xp}
              </span>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 px-2 py-1 bg-[#111111] text-white font-mono text-[9px] rounded border border-[var(--border-main)] whitespace-nowrap pointer-events-none shadow-paper-sm">
                DAY {day.dayNumber} • +{day.xp} XP
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
