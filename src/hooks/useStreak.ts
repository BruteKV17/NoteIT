/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchUserStreakState, 
  claimDailyXPAtomic, 
  redeemRewardAtomic, 
  UserStreakData, 
  INITIAL_STREAK_DATA 
} from '../services/streakService';

export function useStreak(userId?: string) {
  const [streakData, setStreakData] = useState<UserStreakData>(INITIAL_STREAK_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todayClaimed, setTodayClaimed] = useState<boolean>(false);
  const [projectedStreak, setProjectedStreak] = useState<number>(1);
  const [projectedXp, setProjectedXp] = useState<number>(10);
  const [wasReset, setWasReset] = useState<boolean>(false);
  
  // Daily Claim Modal visibility state
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load streak state on mount or user change
  const refreshStreak = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const state = await fetchUserStreakState(userId);
      setStreakData(state.streakData);
      setTodayClaimed(state.todayClaimed);
      setProjectedStreak(state.projectedStreak);
      setProjectedXp(state.projectedXp);
      setWasReset(state.wasReset);

      // Auto-claim daily XP in background if NOT claimed today (Zero manual claim rule - Requirement Section 4 & CORE RULE)
      if (!state.todayClaimed) {
        claimDailyXPAtomic(userId).then(updated => {
          setStreakData(updated);
          setTodayClaimed(true);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('noteit_xp_awarded', {
                detail: {
                  xpAmount: state.projectedXp || 10,
                  reason: `${updated.currentStreak} Day Learning Streak`,
                  taskId: 'task_06',
                  newTotalXp: updated.totalXp
                }
              })
            );
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error in useStreak:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  // Claim Daily XP Action
  const claimDailyXP = async () => {
    if (!userId || isClaiming || todayClaimed) return;
    setIsClaiming(true);
    setClaimError(null);

    try {
      const updated = await claimDailyXPAtomic(userId);
      setStreakData(updated);
      setTodayClaimed(true);
      setClaimSuccess(true);
      setToastMessage(`✓ DAILY XP CLAIMED! +${projectedXp} XP (${updated.currentStreak} Day Streak)`);

      // Clear toast after 4s
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to claim daily XP:', err);
      setClaimError(err.message || 'Unable to claim XP. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Redeem Reward Action
  const redeemReward = async (rewardId: string, xpCost: number) => {
    if (!userId) throw new Error('Please sign in to redeem rewards.');
    const result = await redeemRewardAtomic(userId, rewardId, xpCost);
    setStreakData(prev => ({
      ...prev,
      totalXp: result.newTotalXp
    }));
    return result;
  };

  const closeClaimModal = () => {
    setShowClaimModal(false);
  };

  return {
    streakData,
    isLoading,
    todayClaimed,
    projectedStreak,
    projectedXp,
    wasReset,
    showClaimModal,
    isClaiming,
    claimSuccess,
    claimError,
    toastMessage,
    claimDailyXP,
    closeClaimModal,
    redeemReward,
    refreshStreak
  };
}
