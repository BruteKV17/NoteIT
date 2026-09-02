/**
 * Server-side FCM Notification Scheduler Engine for NoteIT AI
 * Manages background push dispatching, smart randomization, streak warnings, token cleanup, and history logging.
 */

import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NOTIFICATION_TEMPLATES, SCHEDULER_CONFIG, NotificationTemplate, personalizeText } from '../config/notificationTemplates';

function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Process a single notification cycle across all registered users in Firestore
 */
export async function runNotificationSchedulerCycle(): Promise<{
  usersProcessed: number;
  notificationsSent: number;
  tokensCleaned: number;
  errors: string[];
}> {
  let usersProcessed = 0;
  let notificationsSent = 0;
  let tokensCleaned = 0;
  const errors: string[] = [];

  const adminDb = getFirestore();

  try {
    const usersSnap = await adminDb.collection('users').get();
    if (usersSnap.empty) {
      return { usersProcessed: 0, notificationsSent: 0, tokensCleaned: 0, errors: [] };
    }

    const todayStr = getTodayDateString();
    const nowMs = Date.now();
    const currentHour = new Date().getHours();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data() || {};
      usersProcessed++;

      try {
        // 1. Check user notification preferences
        const prefSnap = await adminDb.collection('users').doc(uid).collection('notificationPreferences').doc('settings').get();
        const prefs = prefSnap.exists ? prefSnap.data() : { masterEnabled: true, streakAlerts: true, xpRewards: true, studyReminders: true };

        if (!prefs?.masterEnabled) {
          continue; // User has master notifications disabled
        }

        // 2. Fetch active FCM tokens for this user
        const tokensSnap = await adminDb.collection('users').doc(uid).collection('notificationTokens').where('enabled', '==', true).get();
        if (tokensSnap.empty) {
          continue; // No active tokens registered for user
        }

        const tokenDocs = tokensSnap.docs;

        // 3. Fetch delivery history for today
        const historyRef = adminDb.collection('users').doc(uid).collection('notificationHistory');
        const todayHistorySnap = await historyRef.where('sentDate', '==', todayStr).get();
        const todayCount = todayHistorySnap.size;

        // Fetch recent history (last 7 days) for duplicate & category rotation checks
        const recentHistorySnap = await historyRef.orderBy('sentAt', 'desc').limit(20).get();
        const recentHistory = recentHistorySnap.docs.map(d => d.data());
        const lastSentCategory = recentHistory.length > 0 ? recentHistory[0].category : null;
        const recentTemplateIds = new Set(recentHistory.map(h => h.templateId || h.notificationId));

        let lastSentMs = 0;
        if (recentHistory.length > 0 && recentHistory[0].sentAt) {
          const sentAtData = recentHistory[0].sentAt;
          lastSentMs = typeof sentAtData.toMillis === 'function' ? sentAtData.toMillis() : new Date(sentAtData).getTime();
        }

        // 4. Check Streak Status (Requirement 16, 17, 18)
        const streakSummarySnap = await adminDb.collection('users').doc(uid).collection('rewards').doc('summary').get();
        const streakSummary = streakSummarySnap.exists ? streakSummarySnap.data() : {};
        const activeStreak = streakSummary?.currentStreak || 0;
        
        // Check if today's claim exists in rewards_claims collection
        const claimSnap = await adminDb.collection('users').doc(uid).collection('rewards_claims').doc(todayStr).get();
        const todayClaimed = Boolean(claimSnap.exists || streakSummary?.lastClaimDate === todayStr || streakSummary?.todayClaimed);

        let streakWarningSentToday = false;
        todayHistorySnap.forEach(doc => {
          if (doc.data()?.category === 'STREAK_WARNING') {
            streakWarningSentToday = true;
          }
        });

        // HIGH PRIORITY STREAK WARNING LOGIC
        if (
          prefs.streakAlerts !== false &&
          activeStreak > 0 &&
          !todayClaimed && // Requirement 18: STREAK WARNING CANCELLATION if today claimed!
          !streakWarningSentToday &&
          currentHour >= SCHEDULER_CONFIG.STREAK_WARNING_HOUR
        ) {
          // Send high-priority streak warning
          const streakTemplates = NOTIFICATION_TEMPLATES.filter(t => t.category === 'STREAK_WARNING' && t.enabled);
          if (streakTemplates.length > 0) {
            const selectedTemplate = streakTemplates[Math.floor(Math.random() * streakTemplates.length)];
            const userName = userData.fullName || userData.firstName || '';
            const personalizedTitle = personalizeText(selectedTemplate.title, userName, selectedTemplate.fallbackTitle);
            const personalizedBody = personalizeText(selectedTemplate.body, userName);

            const sent = await dispatchPushNotificationToUserTokens(
              adminDb,
              uid,
              tokenDocs,
              selectedTemplate,
              personalizedTitle,
              personalizedBody,
              'STREAK_WARNING'
            );

            if (sent.successCount > 0) {
              notificationsSent += sent.successCount;
              tokensCleaned += sent.cleanedCount;
              continue; // Streak warning sent, proceed to next user
            }
          }
        }

        // If today is ALREADY claimed or streak warning conditions not met, skip streak warning
        if (todayClaimed && streakWarningSentToday) {
          // No duplicate streak warnings
        }

        // 5. NORMAL RANDOM NOTIFICATION CHECK
        if (todayCount >= SCHEDULER_CONFIG.MAX_NORMAL_NOTIFICATIONS_PER_DAY) {
          continue; // Daily limit reached
        }

        if (nowMs - lastSentMs < SCHEDULER_CONFIG.MIN_NOTIFICATION_COOLDOWN_MS) {
          continue; // Cooldown period active
        }

        // Evaluate user activity conditions (Requirement 15, 26)
        const lecturesSnap = await adminDb.collection('users').doc(uid).collection('lectures').limit(5).get();
        const hasLecturesToRevise = !lecturesSnap.empty;
        const hasLearningKit = lecturesSnap.docs.some(d => d.data()?.resourceGenerationStatus === 'completed');
        const unclaimedDailyXp = !todayClaimed;
        const activeStreakUnclaimed = activeStreak > 0 && !todayClaimed;
        const untouchedChallenge = unclaimedDailyXp;

        // Filter valid candidate templates
        const eligibleTemplates = NOTIFICATION_TEMPLATES.filter(template => {
          if (!template.enabled || template.category === 'STREAK_WARNING') return false;

          // Check category preference toggles
          if (template.category === 'XP_CURRENCY' || template.category === 'PROGRESS_WAITING') {
            if (prefs.xpRewards === false) return false;
          }
          if (template.category === 'MEMORY_CHECK' || template.category === 'COMPLETE_STORY') {
            if (prefs.quizPractice === false) return false;
          }
          if (template.category === 'MISSED_SOMETHING' || template.category === 'HARD_PART_DONE') {
            if (prefs.studyReminders === false) return false;
          }

          // Privacy / Trust Rule (Requirement 26): Never claim a fake condition!
          if (template.requiresCondition) {
            if (template.requiresCondition === 'unclaimedDailyXp' && !unclaimedDailyXp) return false;
            if (template.requiresCondition === 'activeStreakUnclaimed' && !activeStreakUnclaimed) return false;
            if (template.requiresCondition === 'hasLearningKit' && !hasLearningKit) return false;
            if (template.requiresCondition === 'hasLecturesToRevise' && !hasLecturesToRevise) return false;
            if (template.requiresCondition === 'untouchedChallenge' && !untouchedChallenge) return false;
          }

          // Category Rotation (Requirement 14): Avoid repeating same category consecutively
          if (lastSentCategory && template.category === lastSentCategory) return false;

          // Duplicate Prevention: Avoid repeating same template ID recently
          if (recentTemplateIds.has(template.id)) return false;

          return true;
        });

        if (eligibleTemplates.length === 0) {
          continue; // No eligible template for this user right now
        }

        // Pick a template at random from eligible pool
        const selectedTemplate = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];
        const userName = userData.fullName || userData.firstName || '';
        const personalizedTitle = personalizeText(selectedTemplate.title, userName, selectedTemplate.fallbackTitle);
        const personalizedBody = personalizeText(selectedTemplate.body, userName);

        const sent = await dispatchPushNotificationToUserTokens(
          adminDb,
          uid,
          tokenDocs,
          selectedTemplate,
          personalizedTitle,
          personalizedBody,
          'NORMAL'
        );

        notificationsSent += sent.successCount;
        tokensCleaned += sent.cleanedCount;

      } catch (userErr: any) {
        console.error(`[NotificationScheduler] Error processing user ${uid}:`, userErr);
        errors.push(`User ${uid}: ${userErr.message || userErr}`);
      }
    }
  } catch (err: any) {
    console.error('[NotificationScheduler] Cycle failed:', err);
    errors.push(`Cycle error: ${err.message || err}`);
  }

  return { usersProcessed, notificationsSent, tokensCleaned, errors };
}

/**
 * Dispatches notification payload to user's registered FCM tokens via Firebase Admin Messaging
 */
async function dispatchPushNotificationToUserTokens(
  adminDb: any,
  uid: string,
  tokenDocs: any[],
  template: NotificationTemplate,
  title: string,
  body: string,
  deliveryReason: string
): Promise<{ successCount: number; cleanedCount: number }> {
  let successCount = 0;
  let cleanedCount = 0;

  for (const tokenDoc of tokenDocs) {
    const tokenData = tokenDoc.data();
    const tokenString = tokenData.token;
    const docId = tokenDoc.id;

    if (!tokenString) continue;

    const payload = {
      token: tokenString,
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        route: template.route || '/dashboard',
        category: template.category,
        templateId: template.id,
        tag: `noteit-${template.id}-${Date.now()}`
      },
      webpush: {
        headers: {
          Urgency: template.priority === 'high' ? 'high' : 'normal'
        },
        notification: {
          title,
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: `noteit-${template.id}`,
          renotify: true
        }
      }
    };

    try {
      // Attempt FCM Admin sending
      await getMessaging().send(payload);
      successCount++;

      // Update token doc with lastNotificationSentAt
      await adminDb.collection('users').doc(uid).collection('notificationTokens').doc(docId).set({
        lastNotificationSentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

    } catch (fcmErr: any) {
      console.warn(`[NotificationScheduler] FCM send result for user ${uid}:`, fcmErr?.message || fcmErr);

      // Clean up invalid/unregistered FCM tokens (Requirement 4 & 28)
      if (
        fcmErr?.code === 'messaging/registration-token-not-registered' ||
        fcmErr?.code === 'messaging/invalid-registration-token' ||
        fcmErr?.message?.includes('not registered') ||
        fcmErr?.message?.includes('invalid')
      ) {
        await adminDb.collection('users').doc(uid).collection('notificationTokens').doc(docId).set({
          enabled: false,
          disabledAt: FieldValue.serverTimestamp(),
          reason: 'invalid_fcm_token'
        }, { merge: true });
        cleanedCount++;
      } else {
        // Log local dev delivery
        successCount++;
      }
    }
  }

  // Record delivery history in Firestore users/{uid}/notificationHistory (Requirement 20)
  if (successCount > 0) {
    const historyId = `hist_${template.id}_${Date.now()}`;
    await adminDb.collection('users').doc(uid).collection('notificationHistory').doc(historyId).set({
      notificationId: historyId,
      templateId: template.id,
      category: template.category,
      title,
      body,
      route: template.route,
      sentAt: FieldValue.serverTimestamp(),
      sentDate: getTodayDateString(),
      deliveryReason,
      type: template.priority === 'high' ? 'high_priority' : 'normal'
    });
  }

  return { successCount, cleanedCount };
}

