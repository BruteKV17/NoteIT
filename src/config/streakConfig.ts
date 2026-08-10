/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StreakTier {
  minDay: number;
  maxDay: number;
  xp: number;
  label: string;
}

// Configurable 90-Day XP Streak Tiers (Requirement 2)
export const STREAK_REWARD_TIERS: StreakTier[] = [
  { minDay: 1, maxDay: 6, xp: 10, label: 'Days 1–6 (10 XP/day)' },
  { minDay: 7, maxDay: 13, xp: 20, label: 'Days 7–13 (20 XP/day)' },
  { minDay: 14, maxDay: 29, xp: 30, label: 'Days 14–29 (30 XP/day)' },
  { minDay: 30, maxDay: 59, xp: 40, label: 'Days 30–59 (40 XP/day)' },
  { minDay: 60, maxDay: 89, xp: 50, label: 'Days 60–89 (50 XP/day)' },
  { minDay: 90, maxDay: 90, xp: 100, label: 'Day 90 Celestial Bonus (100 XP)' }
];

/**
 * Returns the daily XP amount awarded for a given streak day index
 */
export function getDailyXpForStreakDay(day: number): number {
  const normalizedDay = Math.max(1, day);
  const tier = STREAK_REWARD_TIERS.find(t => normalizedDay >= t.minDay && normalizedDay <= t.maxDay);
  if (tier) return tier.xp;
  // If day exceeds 90 in continuous cycle, cap at 100 XP
  return 100;
}

/**
 * Returns the next streak milestone day and target XP
 */
export function getNextMilestone(currentDay: number): { day: number; xp: number } {
  if (currentDay < 7) return { day: 7, xp: 20 };
  if (currentDay < 14) return { day: 14, xp: 30 };
  if (currentDay < 30) return { day: 30, xp: 40 };
  if (currentDay < 60) return { day: 60, xp: 50 };
  if (currentDay < 90) return { day: 90, xp: 100 };
  return { day: 90, xp: 100 };
}
