/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const WEEKEND_QUIZ_BONUS_XP = 50;

/**
 * Returns user's local date string in YYYY-MM-DD format using actual user timezone
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSaturday(date: Date = new Date()): boolean {
  return date.getDay() === 6;
}

export function isSunday(date: Date = new Date()): boolean {
  return date.getDay() === 0;
}

export function isWeekend(date: Date = new Date()): boolean {
  return isSaturday(date) || isSunday(date);
}

export function getWeekendDayLabel(date: Date = new Date()): 'Saturday' | 'Sunday' | null {
  if (isSaturday(date)) return 'Saturday';
  if (isSunday(date)) return 'Sunday';
  return null;
}
