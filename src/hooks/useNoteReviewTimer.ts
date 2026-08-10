/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { awardXP, processActivityEvent } from '../services/activityTracker';

export function useNoteReviewTimer(noteId: string | undefined, userId: string | undefined) {
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isTabActive, setIsTabActive] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!noteId || !userId || isCompleted) return;

    // Visibility change handler (tab switch / window minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabActive(false);
      } else {
        setIsTabActive(true);
      }
    };

    // Window focus/blur handlers
    const handleBlur = () => setIsTabActive(false);
    const handleFocus = () => setIsTabActive(true);

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Active review tick interval
    timerRef.current = setInterval(() => {
      if (!document.hidden && document.hasFocus()) {
        setActiveSeconds((prev) => {
          const next = prev + 1;
          // When 3 minutes (180s) reached, trigger Task 05 automatic +20 XP award (Section 4)
          if (next >= 180 && !isCompleted) {
            setIsCompleted(true);
            awardXP({
              userId,
              taskId: 'task_05',
              xpAmount: 20,
              resourceId: noteId,
              reason: 'Reviewed pinned note for 3 minutes continuously'
            }).catch(console.error);
          }
          return next;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [noteId, userId, isCompleted]);

  const progressPercent = Math.min(100, Math.round((activeSeconds / 180) * 100));
  const minutes = Math.floor(activeSeconds / 60);
  const seconds = String(activeSeconds % 60).padStart(2, '0');
  const formattedTime = `${String(minutes).padStart(2, '0')}:${seconds}`;

  return {
    activeSeconds,
    progressPercent,
    formattedTime,
    isCompleted,
    isTabActive
  };
}
