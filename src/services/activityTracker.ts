/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TASK_DEFINITIONS, TaskDefinition } from '../config/taskConfig';
import { getTodayDateString, getYesterdayDateString } from '../utils/dateUtils';
import { fetchUserStreakState } from './streakService';

export type ActivityType =
  | 'LECTURE_CAPTURE_COMPLETED'
  | 'TRANSCRIPTION_COMPLETED'
  | 'STUDY_NOTES_GENERATED'
  | 'QUIZ_COMPLETED'
  | 'NOTE_REVIEW_COMPLETED'
  | 'DAILY_GOAL_COMPLETED'
  | 'STREAK_MILESTONE_COMPLETED';

export interface ActivityEvent {
  type: ActivityType;
  userId: string;
  resourceId: string; // lectureId, noteId, quizId, etc.
  timestamp?: string;
  metadata?: {
    duration?: number; // duration in seconds
    wordCount?: number;
    questionCount?: number;
    scorePercent?: number;
    activeDuration?: number; // active review duration in seconds
  };
}

export interface TaskState {
  taskId: string;
  status: 'locked' | 'in_progress' | 'completed';
  progressCurrent: number;
  progressTarget: number;
  progressLabel: string;
  xpAwarded: number;
  completedAt?: string;
  message?: string;
}

export interface TrackActivityResult {
  success: boolean;
  xpAwarded: number;
  taskCompleted: boolean;
  message: string;
  newTotalXp?: number;
}

export interface AwardXPParams {
  userId: string;
  taskId: string;
  xpAmount: number;
  resourceId?: string;
  reason: string;
}

/**
 * Centralized Automatic XP Award & Transaction Function (Section 2 & 8)
 * Verifies user, verifies duplicate lock, creates XP transaction log,
 * atomically updates total XP, and dispatches real-time UI notification event.
 */
export async function awardXP({
  userId,
  taskId,
  xpAmount,
  resourceId = 'default',
  reason
}: AwardXPParams): Promise<{ success: boolean; xpAwarded: number; newTotalXp: number; message: string }> {
  if (!userId) return { success: false, xpAwarded: 0, newTotalXp: 0, message: 'User not authenticated' };

  // 1. Lock key check (userId + taskId + resourceId) - Section 3
  const lockKey = `${userId}_${taskId}_${resourceId}`;
  const localTasksJson = localStorage.getItem(`noteit_tasks_${userId}`);
  let localTasks: Record<string, any> = localTasksJson ? JSON.parse(localTasksJson) : {};

  if (localTasks[lockKey] || (resourceId === 'default' && localTasks[taskId])) {
    const savedData = localStorage.getItem(`noteit_streak_data_${userId}`);
    const currentStreakData = savedData ? JSON.parse(savedData) : { totalXp: 0 };
    return {
      success: false,
      xpAwarded: 0,
      newTotalXp: currentStreakData.totalXp || 0,
      message: `XP reward for this activity has already been earned.`
    };
  }

  // 2. Mark local lock
  localTasks[lockKey] = { completedAt: new Date().toISOString(), resourceId };
  localTasks[taskId] = { completedAt: new Date().toISOString() };
  localStorage.setItem(`noteit_tasks_${userId}`, JSON.stringify(localTasks));

  // 3. Atomically update total XP balance
  const savedStreak = localStorage.getItem(`noteit_streak_data_${userId}`);
  let currentStreakData = savedStreak ? JSON.parse(savedStreak) : { totalXp: 0 };
  const newTotalXp = (currentStreakData.totalXp || 0) + xpAmount;
  currentStreakData.totalXp = newTotalXp;
  currentStreakData.updatedAt = new Date().toISOString();
  localStorage.setItem(`noteit_streak_data_${userId}`, JSON.stringify(currentStreakData));

  // 4. Record XP transaction document in Firestore (Section 8)
  try {
    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const txDocRef = doc(db, 'users', userId, 'xp_transactions', txId);
    const summaryRef = doc(db, 'users', userId, 'rewards', 'summary');
    const compRef = doc(db, 'users', userId, 'rewards', 'task_completions');

    await runTransaction(db, async (transaction) => {
      transaction.set(txDocRef, {
        userId,
        taskId,
        resourceId,
        xp: xpAmount,
        reason,
        createdAt: serverTimestamp()
      });
      transaction.set(summaryRef, { totalXp: newTotalXp, updatedAt: serverTimestamp() }, { merge: true });
      transaction.set(compRef, { [lockKey]: { completedAt: serverTimestamp() }, [taskId]: { completedAt: serverTimestamp() } }, { merge: true });
    });
  } catch (err) {
    console.warn('Firestore transaction log warning (handled via local state):', err);
  }

  // 5. Dispatch global event for instant UI update & Toast notification (Section 5 & 6)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('noteit_xp_awarded', {
        detail: {
          xpAmount,
          reason,
          taskId,
          newTotalXp
        }
      })
    );
  }

  return {
    success: true,
    xpAwarded: xpAmount,
    newTotalXp,
    message: `✓ XP EARNED! +${xpAmount} XP`
  };
}

/**
 * Loads current task completion and progress states for all 7 tasks
 */
export async function fetchTaskProgressStates(userId: string): Promise<Record<string, TaskState>> {
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const states: Record<string, TaskState> = {};

  // Default initial states
  Object.keys(TASK_DEFINITIONS).forEach((taskId) => {
    const def = TASK_DEFINITIONS[taskId];
    states[taskId] = {
      taskId,
      status: 'locked',
      progressCurrent: 0,
      progressTarget: def.minThreshold,
      progressLabel: `0 / ${def.thresholdLabel}`,
      xpAwarded: def.xp
    };
  });

  if (!userId) return states;

  try {
    const localTasksJson = localStorage.getItem(`noteit_tasks_${userId}`);
    let localTasks: Record<string, any> = localTasksJson ? JSON.parse(localTasksJson) : {};

    // Check Firestore user task completions
    const completionsDocRef = doc(db, 'users', userId, 'rewards', 'task_completions');
    const compSnap = await getDoc(completionsDocRef).catch(() => null);

    if (compSnap && compSnap.exists()) {
      const data = compSnap.data();
      localTasks = { ...localTasks, ...data };
    }

    // Populate Task 01 - Capture
    if (localTasks['task_01']) {
      states['task_01'].status = 'completed';
      states['task_01'].progressCurrent = 600;
      states['task_01'].progressLabel = '10:00 / 10:00 min';
      states['task_01'].completedAt = localTasks['task_01'].completedAt;
    } else if (localTasks['task_01_progress']) {
      const p = localTasks['task_01_progress'];
      states['task_01'].status = 'in_progress';
      states['task_01'].progressCurrent = p;
      const mins = Math.floor(p / 60);
      const secs = String(p % 60).padStart(2, '0');
      states['task_01'].progressLabel = `${String(mins).padStart(2, '0')}:${secs} / 10:00 min`;
    }

    // Populate Task 02 - Transcription
    if (localTasks['task_02']) {
      states['task_02'].status = 'completed';
      states['task_02'].progressCurrent = 500;
      states['task_02'].progressLabel = '500+ words verified';
      states['task_02'].completedAt = localTasks['task_02'].completedAt;
    }

    // Populate Task 03 - Study Notes
    if (localTasks['task_03']) {
      states['task_03'].status = 'completed';
      states['task_03'].progressCurrent = 300;
      states['task_03'].progressLabel = '300+ words verified';
      states['task_03'].completedAt = localTasks['task_03'].completedAt;
    }

    // Populate Task 04 - Quiz
    if (localTasks['task_04']) {
      states['task_04'].status = 'completed';
      states['task_04'].progressCurrent = 70;
      states['task_04'].progressLabel = '10 Qs • 70%+ score';
      states['task_04'].completedAt = localTasks['task_04'].completedAt;
    } else if (localTasks['task_04_last_score']) {
      const score = localTasks['task_04_last_score'];
      states['task_04'].status = 'in_progress';
      states['task_04'].progressCurrent = score;
      states['task_04'].progressLabel = `Score: ${score}% (Required: 70%)`;
    }

    // Populate Task 05 - Review Pinned Notes
    if (localTasks['task_05']) {
      states['task_05'].status = 'completed';
      states['task_05'].progressCurrent = 180;
      states['task_05'].progressLabel = '03:00 / 03:00 min active review';
      states['task_05'].completedAt = localTasks['task_05'].completedAt;
    } else if (localTasks['task_05_progress']) {
      const p = localTasks['task_05_progress'];
      states['task_05'].status = 'in_progress';
      states['task_05'].progressCurrent = p;
      const mins = Math.floor(p / 60);
      const secs = String(p % 60).padStart(2, '0');
      states['task_05'].progressLabel = `${String(mins).padStart(2, '0')}:${secs} / 03:00 min active review`;
    }

    // Populate Task 06 - Streak (3 days)
    const streakState = await fetchUserStreakState(userId);
    const activeDays = Math.min(3, streakState.streakData.currentStreak);
    states['task_06'].progressCurrent = activeDays;
    states['task_06'].progressLabel = `${activeDays} / 3 ACTIVE DAYS`;
    if (activeDays >= 3 || localTasks['task_06']) {
      states['task_06'].status = 'completed';
      states['task_06'].completedAt = localTasks['task_06']?.completedAt;
    } else if (activeDays > 0) {
      states['task_06'].status = 'in_progress';
    }

    // Populate Task 07 - Daily Goals (3 activities today)
    const todayActivities: string[] = localTasks[`today_activities_${todayStr}`] || [];
    const uniqueCount = todayActivities.length;
    states['task_07'].progressCurrent = uniqueCount;
    states['task_07'].progressLabel = `${uniqueCount} / 3 ACTIVITIES TODAY`;
    if (uniqueCount >= 3 || localTasks['task_07']) {
      states['task_07'].status = 'completed';
      states['task_07'].completedAt = localTasks['task_07']?.completedAt;
    } else if (uniqueCount > 0) {
      states['task_07'].status = 'in_progress';
    }

    return states;
  } catch (err) {
    console.warn('Error fetching task progress states:', err);
    return states;
  }
}

/**
 * Validates and processes a learning activity event (Requirements 8, 9, 10)
 */
export async function processActivityEvent(event: ActivityEvent): Promise<TrackActivityResult> {
  const { type, userId, resourceId, metadata = {} } = event;
  if (!userId) return { success: false, xpAwarded: 0, taskCompleted: false, message: 'User not authenticated' };

  const todayStr = getTodayDateString();
  const localTasksJson = localStorage.getItem(`noteit_tasks_${userId}`);
  let localTasks: Record<string, any> = localTasksJson ? JSON.parse(localTasksJson) : {};

  // Track activity type performed today for Task 07 (Daily Goals)
  const todayActivitiesKey = `today_activities_${todayStr}`;
  const todayActivities: string[] = localTasks[todayActivitiesKey] || [];
  if (!todayActivities.includes(type)) {
    todayActivities.push(type);
    localTasks[todayActivitiesKey] = todayActivities;
  }

  let taskId = '';
  let isEligible = false;
  let notCompletedReason = '';
  let progressCurrent = 0;

  switch (type) {
    case 'LECTURE_CAPTURE_COMPLETED': {
      taskId = 'task_01';
      const duration = metadata.duration || 0;
      progressCurrent = duration;
      localTasks['task_01_progress'] = Math.max(localTasks['task_01_progress'] || 0, duration);

      if (duration >= 600) { // 10 minutes
        isEligible = true;
      } else {
        const mins = Math.floor(duration / 60);
        const secs = String(duration % 60).padStart(2, '0');
        notCompletedReason = `NOT COMPLETED. Required: 10 minutes. Recorded: ${String(mins).padStart(2, '0')}:${secs}. Continue recording to qualify.`;
      }
      break;
    }

    case 'TRANSCRIPTION_COMPLETED': {
      taskId = 'task_02';
      const words = metadata.wordCount || 0;
      if (words >= 500) {
        isEligible = true;
      } else {
        notCompletedReason = `NOT COMPLETED. Required: 500 words. Generated: ${words} words.`;
      }
      break;
    }

    case 'STUDY_NOTES_GENERATED': {
      taskId = 'task_03';
      const words = metadata.wordCount || 0;
      if (words >= 300) {
        isEligible = true;
      } else {
        notCompletedReason = `NOT COMPLETED. Required: 300 words. Generated: ${words} words.`;
      }
      break;
    }

    case 'QUIZ_COMPLETED': {
      taskId = 'task_04';
      const questions = metadata.questionCount || 0;
      const score = metadata.scorePercent || 0;
      localTasks['task_04_last_score'] = score;

      if (questions >= 10 && score >= 70) {
        isEligible = true;
      } else if (questions < 10) {
        notCompletedReason = `NOT COMPLETED. Required: 10 questions. Completed: ${questions} questions.`;
      } else {
        notCompletedReason = `NOT COMPLETED. Required: 70% accuracy. Your score: ${score}%. Try again!`;
      }
      break;
    }

    case 'NOTE_REVIEW_COMPLETED': {
      taskId = 'task_05';
      const activeDuration = metadata.activeDuration || 0;
      localTasks['task_05_progress'] = Math.max(localTasks['task_05_progress'] || 0, activeDuration);

      if (activeDuration >= 180) { // 3 minutes active review
        // Check 7-day cooldown per note (Requirement 5 & 13)
        const lastReviewKey = `note_review_${userId}_${resourceId}`;
        const lastReviewTimestamp = localTasks[lastReviewKey];
        if (lastReviewTimestamp) {
          const daysDiff = (Date.now() - Number(lastReviewTimestamp)) / (1000 * 60 * 60 * 24);
          if (daysDiff < 7) {
            return {
              success: false,
              xpAwarded: 0,
              taskCompleted: false,
              message: `Task 05 reward already claimed for this note within the last 7 days.`
            };
          }
        }
        localTasks[lastReviewKey] = Date.now();
        isEligible = true;
      } else {
        const mins = Math.floor(activeDuration / 60);
        const secs = String(activeDuration % 60).padStart(2, '0');
        notCompletedReason = `NOT COMPLETED. Required: 3 minutes active review. Reviewed: ${String(mins).padStart(2, '0')}:${secs}.`;
      }
      break;
    }
  }

  // Check if task criteria was not met
  if (!isEligible) {
    localStorage.setItem(`noteit_tasks_${userId}`, JSON.stringify(localTasks));
    return {
      success: false,
      xpAwarded: 0,
      taskCompleted: false,
      message: notCompletedReason
    };
  }

  // Duplicate Check: Check if this specific resource already earned XP for this task (Requirement 10)
  const taskResourceKey = `${taskId}_${resourceId || 'default'}`;
  if (localTasks[taskResourceKey] || localTasks[taskId]) {
    return {
      success: false,
      xpAwarded: 0,
      taskCompleted: false,
      message: `XP reward for ${TASK_DEFINITIONS[taskId]?.activity || 'this task'} has already been claimed for this lecture/note.`
    };
  }

  // Award XP & mark completed!
  const def = TASK_DEFINITIONS[taskId];
  const xpAwarded = def.xp;

  localTasks[taskResourceKey] = { completedAt: new Date().toISOString(), resourceId };
  localTasks[taskId] = { completedAt: new Date().toISOString() };
  localStorage.setItem(`noteit_tasks_${userId}`, JSON.stringify(localTasks));

  // Add XP to total user balance
  const localSavedStreak = localStorage.getItem(`noteit_streak_data_${userId}`);
  let currentStreakData = localSavedStreak ? JSON.parse(localSavedStreak) : { totalXp: 0 };
  const newTotalXp = (currentStreakData.totalXp || 0) + xpAwarded;

  currentStreakData.totalXp = newTotalXp;
  currentStreakData.updatedAt = new Date().toISOString();
  localStorage.setItem(`noteit_streak_data_${userId}`, JSON.stringify(currentStreakData));

  // Sync to Firestore
  try {
    const summaryRef = doc(db, 'users', userId, 'rewards', 'summary');
    const compRef = doc(db, 'users', userId, 'rewards', 'task_completions');

    await runTransaction(db, async (transaction) => {
      transaction.set(summaryRef, { totalXp: newTotalXp, updatedAt: serverTimestamp() }, { merge: true });
      transaction.set(compRef, { [taskResourceKey]: { completedAt: serverTimestamp() }, [taskId]: { completedAt: serverTimestamp() } }, { merge: true });
    });
  } catch (err) {
    console.warn('Firestore activity sync warning (handled gracefully via local state):', err);
  }

  // Check Task 07 (Daily Goals) progress
  if (todayActivities.length >= 3 && !localTasks['task_07']) {
    localTasks['task_07'] = { completedAt: new Date().toISOString() };
    localStorage.setItem(`noteit_tasks_${userId}`, JSON.stringify(localTasks));
    // Auto process Task 07 XP (+50 XP)
    const goalXp = 50;
    currentStreakData.totalXp = (currentStreakData.totalXp || 0) + goalXp;
    localStorage.setItem(`noteit_streak_data_${userId}`, JSON.stringify(currentStreakData));
  }

  return {
    success: true,
    xpAwarded,
    taskCompleted: true,
    message: `✓ TASK COMPLETED! Earned +${xpAwarded} XP`,
    newTotalXp: currentStreakData.totalXp
  };
}
