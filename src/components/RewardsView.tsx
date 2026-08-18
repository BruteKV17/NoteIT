/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Zap, 
  Sparkles, 
  Lock, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Info,
  ChevronRight,
  Gift,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { PageId, RewardItem, UserRewardsState } from '../types';
import { INITIAL_REWARDS, INITIAL_USER_REWARDS_STATE } from '../data/rewards';
import { TASK_DEFINITIONS } from '../config/taskConfig';
import { fetchTaskProgressStates, TaskState } from '../services/activityTracker';
import { auth } from '../firebaseConfig';
import { Button, Card, Badge, Modal } from './bauhaus';
import StreakProgress from './rewards/StreakProgress';

interface RewardsViewProps {
  setActivePage: (page: PageId) => void;
  userRewards?: UserRewardsState;
  rewardsCatalog?: RewardItem[];
  theme?: 'light' | 'dark';
  currentStreak?: number;
  longestStreak?: number;
  todayClaimed?: boolean;
  onOpenClaimModal?: () => void;
  onRedeemReward?: (rewardId: string, xpCost: number) => Promise<any>;
}

export default function RewardsView({
  setActivePage,
  userRewards = INITIAL_USER_REWARDS_STATE,
  rewardsCatalog = INITIAL_REWARDS,
  theme = 'dark',
  currentStreak = 0,
  longestStreak = 0,
  todayClaimed = false,
  onOpenClaimModal,
  onRedeemReward
}: RewardsViewProps) {
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redemptionNotice, setRedemptionNotice] = useState<string | null>(null);
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});

  useEffect(() => {
    const loadStates = () => {
      const uid = auth.currentUser?.uid || '';
      fetchTaskProgressStates(uid).then(setTaskStates).catch(console.error);
    };

    loadStates();
    window.addEventListener('noteit_xp_awarded', loadStates);
    return () => {
      window.removeEventListener('noteit_xp_awarded', loadStates);
    };
  }, []);

  const xpProgress = Math.min(100, Math.round((userRewards.xp / userRewards.nextLevelXp) * 100));
  const xpNeeded = Math.max(0, userRewards.nextLevelXp - userRewards.xp);

  const handleOpenRedeemModal = (reward: RewardItem) => {
    setSelectedReward(reward);
    setRedemptionNotice(null);
    setShowRedeemModal(true);
  };

  const handleConfirmRedemption = () => {
    // Backend redemption is coming soon, per specifications.
    setRedemptionNotice("Reward redemption is coming soon.");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 bg-grid-paper p-4 md:p-8 select-none text-[var(--text-primary)]">
      
      {/* 1. BACK TO SETTINGS BREADCRUMB & HEADER */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--text-secondary)]">
          <button 
            onClick={() => setActivePage('settings')}
            className="hover:text-[#FFC400] flex items-center gap-1 cursor-pointer transition-colors uppercase"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Settings</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="bg-[#FFC400] text-[#111111] px-2 py-0.5 rounded-[3px] border border-[var(--border-main)] font-extrabold uppercase">
            REWARDS & XP
          </span>
        </div>

        <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 md:p-8 shadow-paper-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Decorative Bauhaus Accent */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#FFC400] opacity-15 rotate-12 -translate-y-6 translate-x-6 border-2 border-[var(--border-main)] pointer-events-none" />

          <div className="space-y-2 relative z-10 max-w-2xl">
            <Badge variant="yellow" size="md" icon={<Trophy className="h-3.5 w-3.5" />}>
              REWARDS HUB
            </Badge>

            <h1 className="font-heading font-extrabold text-3xl md:text-5xl uppercase tracking-tight text-[var(--text-primary)] leading-none">
              LEARN MORE. EARN MORE. <br />
              <span className="bg-[#FFC400] text-[#111111] px-2 py-0.5 border-2 border-[var(--border-main)] shadow-paper-sm inline-block mt-1">
                UNLOCK MORE.
              </span>
            </h1>

            <p className="text-xs md:text-sm font-mono font-medium text-[var(--text-secondary)] leading-relaxed pt-1">
              Turn your daily learning activities, lecture transcriptions, and quiz mastery into XP. Redeem XP for exclusive study rewards and vouchers.
            </p>
          </div>

          <div className="shrink-0 relative z-10">
            <button
              onClick={() => setActivePage('settings')}
              className="px-4 py-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] text-[var(--text-primary)] font-mono text-xs font-extrabold uppercase hover:bg-[#FFC400] hover:text-[#111111] transition-all shadow-paper-sm cursor-pointer"
            >
              ← Back to Settings Overview
            </button>
          </div>
        </div>
      </div>

      {/* 2. 90-DAY STREAK PROGRESS & METRICS */}
      <StreakProgress
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        totalXp={userRewards.xp}
        todayClaimed={todayClaimed}
        onOpenClaimModal={onOpenClaimModal}
      />

      {/* 2. BAUHAUS XP BALANCE & LEVEL STATUS CARD (Requirement 10) */}
      <Card shadow="lg" className="p-6 md:p-8 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-[var(--border-main)] pb-6">
          
          {/* XP Display Block */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-extrabold text-[var(--text-secondary)] uppercase tracking-[3px]">
              YOUR CURRENT XP BALANCE
            </span>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-4xl sm:text-6xl font-extrabold text-[#FFC400] tracking-tight drop-shadow-[2px_2px_0px_#111111]">
                {userRewards.xp.toLocaleString()} XP
              </span>
              <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
                (Lifetime: {userRewards.lifetimeXp.toLocaleString()} XP)
              </span>
            </div>
          </div>

          {/* Level Badge */}
          <div className="flex items-center gap-3 bg-[var(--panel-bg)] p-4 rounded-[6px] border-2 border-[var(--border-main)] shadow-paper-sm">
            <div className="w-12 h-12 rounded-[4px] bg-[#FFC400] border-2 border-[var(--border-main)] flex items-center justify-center font-mono font-extrabold text-xl text-[#111111] shadow-paper-sm shrink-0">
              0{userRewards.level}
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                CURRENT LEVEL 0{userRewards.level}
              </div>
              <div className="font-heading font-extrabold text-base md:text-lg text-[var(--text-primary)] uppercase tracking-tight">
                {userRewards.levelTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress Bar & Telemetry */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-bold">
            <span className="text-[var(--text-primary)] uppercase flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#FFC400] fill-[#FFC400]" />
              Level 0{userRewards.level} Progress
            </span>
            <span className="text-[#FFC400] font-extrabold">
              {userRewards.xp.toLocaleString()} / {userRewards.nextLevelXp.toLocaleString()} XP ({xpProgress}%)
            </span>
          </div>

          {/* Heavy Industrial Progress Bar */}
          <div className="w-full bg-[var(--panel-bg)] h-5 rounded-[4px] border-2 border-[var(--border-main)] overflow-hidden p-0.5 shadow-paper-sm">
            <div 
              style={{ width: `${xpProgress}%` }}
              className="h-full bg-[#FFC400] rounded-[2px] transition-all duration-500 border-r-2 border-[var(--border-main)]"
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono text-[var(--text-secondary)] font-bold pt-1">
            <span>{xpNeeded > 0 ? `${xpNeeded.toLocaleString()} XP TO LEVEL 0${userRewards.level + 1}` : 'LEVEL MAX REACHED'}</span>
            <span className="uppercase text-[#19B56B]">Status: Active Learner</span>
          </div>
        </div>
      </Card>

      {/* 3. REWARD CATALOG MARKETPLACE (Requirement 5, 6, 7, 8, 9) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[var(--border-main)] pb-3">
          <div>
            <span className="section-label text-xs font-extrabold uppercase tracking-[3px] text-[#38BDF8]">
              FEATURED REWARDS MARKETPLACE
            </span>
            <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-tight mt-0.5">
              AVAILABLE REDEMPTION VOUCHERS
            </h2>
          </div>
          
          <span className="px-3 py-1 rounded-[4px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] text-xs font-mono font-bold text-[var(--text-secondary)] uppercase shadow-paper-sm w-fit">
            5 REWARDS LISTED
          </span>
        </div>

        {/* Responsive Grid: 3-column / 4-column desktop, 2-column tablet, 1-column mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rewardsCatalog.map((reward) => {
            const canAfford = userRewards.xp >= reward.xpCost;

            return (
              <Card 
                key={reward.id} 
                shadow="md" 
                className="p-5 bg-[var(--card-bg)] border-2 border-[var(--border-main)] flex flex-col justify-between space-y-4 interactive-hover relative group overflow-hidden"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-[4px] border border-[var(--border-main)] bg-[#FFC400] text-[#111111] text-[9px] font-mono font-extrabold uppercase shadow-paper-sm">
                    {reward.provider}
                  </span>
                  
                  <span className="px-2.5 py-0.5 rounded-[4px] border border-[var(--border-main)] bg-[#2F6BFF] text-white text-[9px] font-mono font-extrabold uppercase shadow-paper-sm">
                    COMING SOON
                  </span>
                </div>

                {/* Prominent Voucher Brand Image (Fully Visible & Uncropped) */}
                <div className="w-full h-44 rounded-[8px] overflow-hidden flex items-center justify-center relative shadow-paper-sm bg-[#FFFFFF] p-3">
                  <img 
                    src={reward.image} 
                    alt={reward.name}
                    className="w-full h-full object-contain rounded-[6px] transition-transform duration-300 group-hover:scale-105" 
                  />
                </div>

                {/* Reward Information */}
                <div className="space-y-2 flex-1">
                  <h3 className="font-heading font-extrabold text-base text-[var(--text-primary)] uppercase tracking-tight leading-snug">
                    {reward.name}
                  </h3>

                  <p className="text-xs font-mono text-[var(--text-secondary)] leading-normal line-clamp-2">
                    {reward.description}
                  </p>
                </div>

                {/* Cost & Action Footer */}
                <div className="space-y-3 pt-3 border-t-2 border-[var(--border-main)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase">
                      REQUIRED XP
                    </span>
                    <span className="font-mono text-base font-extrabold text-[#FFC400] bg-[var(--panel-bg)] px-2 py-0.5 rounded-[3px] border border-[var(--border-main)]">
                      {reward.xpCost.toLocaleString()} XP
                    </span>
                  </div>

                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => handleOpenRedeemModal(reward)}
                    className="bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm uppercase text-xs cursor-pointer"
                  >
                    REDEEM REWARD
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. HOW TO EARN XP SECTION (Requirement 11, 12, 15, 16) */}
      <Card shadow="md" className="p-6 md:p-8 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-6">
        <div className="space-y-1 border-b-2 border-[var(--border-main)] pb-4">
          <span className="section-label text-xs font-extrabold uppercase tracking-[3px] text-[#19B56B]">
            VERIFIED XP TASKS & ELIGIBILITY
          </span>
          <h2 className="font-heading font-extrabold text-2xl uppercase text-[var(--text-primary)] tracking-tight">
            HOW TO EARN XP IN NOTEIT
          </h2>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            XP is awarded automatically upon verified completion of learning activity criteria.
          </p>
        </div>

        {/* Dynamic Task Cards */}
        <div className="space-y-3">
          {Object.keys(TASK_DEFINITIONS).map((taskId) => {
            const def = TASK_DEFINITIONS[taskId];
            const state: TaskState = taskStates[taskId] || {
              taskId,
              status: 'locked',
              progressCurrent: 0,
              progressTarget: def.minThreshold,
              progressLabel: `0 / ${def.thresholdLabel}`,
              xpAwarded: def.xp
            };

            const isCompleted = state.status === 'completed';
            const isInProgress = state.status === 'in_progress';

            return (
              <div 
                key={taskId}
                className={`p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] flex flex-col space-y-3 transition-all ${
                  isCompleted ? 'border-[#19B56B]/60 bg-[#19B56B]/5' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold bg-[#FFC400] text-[#111111] px-2.5 py-1 rounded-[4px] border border-[var(--border-main)] shadow-paper-sm shrink-0">
                      {def.step}
                    </span>
                    <div>
                      <div className="font-heading font-bold text-sm text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                        <span>{def.activity}</span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-[#19B56B] text-white font-mono text-[10px] font-extrabold uppercase">
                            <CheckCircle className="h-3 w-3" />
                            COMPLETED
                          </span>
                        )}
                        {isInProgress && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-[#FFC400] text-[#111111] font-mono text-[10px] font-extrabold uppercase">
                            IN PROGRESS
                          </span>
                        )}
                        {!isCompleted && !isInProgress && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border-main)] font-mono text-[10px] font-bold uppercase">
                            LOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                        {def.desc}
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-extrabold text-[#19B56B] bg-[var(--card-bg)] px-3 py-1.5 rounded-[4px] border border-[var(--border-main)] shadow-paper-sm w-fit self-start sm:self-auto shrink-0">
                    {def.xpText}
                  </span>
                </div>

                {/* Measurable Progress Bar (Requirements 11 & 12) */}
                <div className="pt-1 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-[var(--text-secondary)] font-bold">
                    <span>STATUS & PROGRESS:</span>
                    <span className={isCompleted ? 'text-[#19B56B] font-extrabold' : 'text-[var(--text-primary)] font-extrabold'}>
                      {state.progressLabel}
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="w-full bg-[var(--card-bg)] h-2.5 rounded-[3px] border border-[var(--border-main)] overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${isCompleted ? 'bg-[#19B56B]' : 'bg-[#FFC400]'}`}
                      style={{ 
                        width: `${Math.min(100, Math.round((state.progressCurrent / Math.max(1, state.progressTarget)) * 100))}%` 
                      }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </Card>

      {/* 5. REDEMPTION CONFIRMATION MODAL (Requirement 15) */}
      {showRedeemModal && selectedReward && (
        <Modal
          isOpen={showRedeemModal}
          onClose={() => {
            setShowRedeemModal(false);
            setRedemptionNotice(null);
          }}
          title={`REDEEM REWARD: ${selectedReward.name}`}
          size="md"
        >
          <div className="space-y-6 text-left text-[var(--text-primary)]">
            
            {/* Voucher Banner */}
            <div className="w-full h-44 rounded-[6px] border-2 border-[var(--border-main)] bg-[#111111] overflow-hidden flex items-center justify-center p-3 shadow-paper-sm">
              <img 
                src={selectedReward.image} 
                alt={selectedReward.name} 
                className="w-full h-full object-contain" 
              />
            </div>

            {/* Redemption Cost Breakdown Table */}
            <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-main)]">
                <span className="text-[var(--text-secondary)] font-bold">REWARD NAME:</span>
                <span className="font-extrabold text-[var(--text-primary)]">{selectedReward.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-main)]">
                <span className="text-[var(--text-secondary)] font-bold">XP COST:</span>
                <span className="font-extrabold text-[#FFC400]">{selectedReward.xpCost.toLocaleString()} XP</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-main)]">
                <span className="text-[var(--text-secondary)] font-bold">YOUR BALANCE:</span>
                <span className="font-extrabold text-[var(--text-primary)]">{userRewards.xp.toLocaleString()} XP</span>
              </div>

              <div className="flex justify-between items-center font-bold">
                <span className="text-[var(--text-secondary)]">AFTER REDEMPTION:</span>
                <span className="font-extrabold text-[#38BDF8]">
                  {Math.max(0, userRewards.xp - selectedReward.xpCost).toLocaleString()} XP REMAINING
                </span>
              </div>
            </div>

            {/* Coming Soon Alert Notice */}
            {redemptionNotice ? (
              <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold flex items-center gap-2 shadow-paper-sm">
                <Info className="h-5 w-5 shrink-0" />
                <span>{redemptionNotice}</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] font-mono text-[11px] text-[var(--text-secondary)] leading-relaxed">
                ℹ️ <strong className="text-[var(--text-primary)]">Product Strategy Notice:</strong> Full automated redemption backend integration is coming soon. No XP will be deducted during preview mode.
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-[var(--border-main)]">
              <Button
                variant="tertiary"
                size="md"
                onClick={() => {
                  setShowRedeemModal(false);
                  setRedemptionNotice(null);
                }}
                className="border-2 border-[var(--border-main)] uppercase"
              >
                CANCEL
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleConfirmRedemption}
                className="bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm uppercase"
              >
                CONFIRM REDEMPTION
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
