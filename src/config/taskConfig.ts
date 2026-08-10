/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TaskDefinition {
  id: string;
  step: string;
  activity: string;
  desc: string;
  xp: number;
  xpText: string;
  minThreshold: number; // e.g. 600s, 500 words, 300 words, 70%, 180s, 3 days, 3 activities
  thresholdUnit: 'seconds' | 'words' | 'percent' | 'days' | 'count';
  thresholdLabel: string;
  cooldownDays?: number;
}

// Configurable Task Criteria & Limits (Requirements 1, 13, 15)
export const TASK_DEFINITIONS: Record<string, TaskDefinition> = {
  task_01: {
    id: 'task_01',
    step: '01',
    activity: 'CAPTURE LIVE LECTURE',
    desc: 'Record a lecture for at least 10 minutes',
    xp: 50,
    xpText: '+50 XP',
    minThreshold: 600, // 10 minutes continuous recording
    thresholdUnit: 'seconds',
    thresholdLabel: '10 minutes'
  },
  task_02: {
    id: 'task_02',
    step: '02',
    activity: 'COMPLETE TRANSCRIPTION',
    desc: 'Generate a meaningful transcript from a recorded lecture',
    xp: 40,
    xpText: '+40 XP',
    minThreshold: 500, // 500 words
    thresholdUnit: 'words',
    thresholdLabel: '500 words'
  },
  task_03: {
    id: 'task_03',
    step: '03',
    activity: 'GENERATE STUDY NOTES',
    desc: 'Generate and save structured AI study notes',
    xp: 30,
    xpText: '+30 XP',
    minThreshold: 300, // 300 words
    thresholdUnit: 'words',
    thresholdLabel: '300 words'
  },
  task_04: {
    id: 'task_04',
    step: '04',
    activity: 'COMPLETE QUIZ MODE',
    desc: 'Complete 10 questions with at least 70% accuracy',
    xp: 30,
    xpText: '+30 XP',
    minThreshold: 70, // 70% accuracy (minimum 10 questions)
    thresholdUnit: 'percent',
    thresholdLabel: '10 Qs + 70% score'
  },
  task_05: {
    id: 'task_05',
    step: '05',
    activity: 'REVIEW PINNED NOTES',
    desc: 'Actively review a saved note for at least 3 minutes',
    xp: 20,
    xpText: '+20 XP',
    minThreshold: 180, // 3 minutes active viewing
    thresholdUnit: 'seconds',
    thresholdLabel: '3 minutes active review',
    cooldownDays: 7 // 1x per note per 7 days
  },
  task_06: {
    id: 'task_06',
    step: '06',
    activity: 'MAINTAIN LEARNING STREAK',
    desc: 'Complete one meaningful learning activity for 3 consecutive days',
    xp: 25,
    xpText: '+25 XP',
    minThreshold: 3, // 3 consecutive days
    thresholdUnit: 'days',
    thresholdLabel: '3 active days'
  },
  task_07: {
    id: 'task_07',
    step: '07',
    activity: 'DAILY LEARNING GOALS',
    desc: 'Complete 3 unique learning activities in one day',
    xp: 50,
    xpText: '+50 XP',
    minThreshold: 3, // 3 unique activity types in 1 calendar day
    thresholdUnit: 'count',
    thresholdLabel: '3 unique activities'
  }
};
