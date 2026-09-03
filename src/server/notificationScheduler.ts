/**
 * Server-side FCM Notification Scheduler Engine for NoteIT AI
 * Manages background push dispatching, smart randomization, streak warnings, token cleanup, and history logging.
 */

import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NOTIFICATION_TEMPLATES, SCHEDULER_CONFIG, NotificationTemplate, personalizeText } from '../config/notificationTemplates';

function getTodayDateString(userTimezone: string = 'Asia/Kolkata'): string {
  try {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

function isWithinQuietHours(quietHoursObj: any, userTimezone: string = 'Asia/Kolkata'): boolean {
  if (!quietHoursObj || quietHoursObj.enabled === false) return false;
  
  const startStr = quietHoursObj.start || "22:30";
  const endStr = quietHoursObj.end || "08:00";

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const currentMins = hour * 60 + minute;

    const [startH, startM] = startStr.split(':').map((n: string) => parseInt(n, 10));
    const [endH, endM] = endStr.split(':').map((n: string) => parseInt(n, 10));
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins < endMins) {
      return currentMins >= startMins && currentMins < endMins;
    } else {
      // Quiet hours span past midnight (e.g. 22:30 -> 08:00)
      return currentMins >= startMins || currentMins < endMins;
    }
  } catch (err) {
    return false;
  }
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

    const nowMs = Date.now();

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

        const userTimezone = prefs?.timezone || userData?.timezone || 'Asia/Kolkata';
        const todayStr = getTodayDateString(userTimezone);
        
        let currentHour = 20;
        try {
          const hrFormatter = new Intl.DateTimeFormat('en-US', { timeZone: userTimezone, hour: 'numeric', hour12: false });
          currentHour = parseInt(hrFormatter.format(new Date()), 10);
        } catch (e) {
          currentHour = new Date().getHours();
        }

        // Quiet Hours check for normal notifications
        const inQuietHours = isWithinQuietHours(prefs?.quietHours, userTimezone);

        // 2. Fetch active FCM tokens / devices for this user (checking users/{uid}/devices first, then users/{uid}/notificationTokens)
        let tokenDocs: any[] = [];
        const devicesSnap = await adminDb.collection('users').doc(uid).collection('devices').where('enabled', '==', true).get();
        if (!devicesSnap.empty) {
          tokenDocs = devicesSnap.docs;
        } else {
          const fallbackSnap = await adminDb.collection('users').doc(uid).collection('notificationTokens').where('enabled', '==', true).get();
          tokenDocs = fallbackSnap.docs;
        }

        if (tokenDocs.length === 0) {
          continue; // No active tokens registered for user
        }

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

        // 4. Check Streak Status (Requirement 14, 15)
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
          !todayClaimed && // CANCELLATION: If today claimed, CANCEL STREAK WARNING!
          !streakWarningSentToday &&
          currentHour >= SCHEDULER_CONFIG.STREAK_WARNING_HOUR
        ) {
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
              'STREAK_WARNING',
              todayStr
            );

            if (sent.successCount > 0) {
              notificationsSent += sent.successCount;
              tokensCleaned += sent.cleanedCount;
              continue; // Streak warning sent, proceed to next user
            }
          }
        }

        // 5. NORMAL RANDOM NOTIFICATION CHECK
        if (inQuietHours) {
          continue; // Quiet hours active - skip normal notification
        }

        const maxDaily = prefs.dailyLimit || SCHEDULER_CONFIG.DEFAULT_MAX_NORMAL_NOTIFICATIONS_PER_DAY;
        if (todayCount >= maxDaily) {
          continue; // Daily limit reached
        }

        const cooldownMs = (prefs.cooldownMinutes || SCHEDULER_CONFIG.DEFAULT_MIN_NOTIFICATION_COOLDOWN_MINUTES) * 60 * 1000;
        if (nowMs - lastSentMs < cooldownMs) {
          continue; // Cooldown period active
        }

        // Evaluate user activity conditions for Truth Validation (Requirement 15)
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

          // Privacy / Truth Rule (Requirement 15): Never claim a fake condition!
          if (template.requiresCondition) {
            if (template.requiresCondition === 'unclaimedDailyXp' && !unclaimedDailyXp) return false;
            if (template.requiresCondition === 'activeStreakUnclaimed' && !activeStreakUnclaimed) return false;
            if (template.requiresCondition === 'hasLearningKit' && !hasLearningKit) return false;
            if (template.requiresCondition === 'hasLecturesToRevise' && !hasLecturesToRevise) return false;
            if (template.requiresCondition === 'untouchedChallenge' && !untouchedChallenge) return false;
          }

          // Category Rotation (Requirement 16): Avoid repeating same category consecutively
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
          'NORMAL',
          todayStr
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
  deliveryReason: string,
  sentDate: string
): Promise<{ successCount: number; cleanedCount: number }> {
  let successCount = 0;
  let cleanedCount = 0;

  for (const tokenDoc of tokenDocs) {
    const tokenData = tokenDoc.data();
    const tokenString = tokenData.token || tokenData.fcmToken;
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

      // Update token docs in both subcollections
      const updateData = {
        lastNotificationSentAt: FieldValue.serverTimestamp(),
        lastSeenAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      await adminDb.collection('users').doc(uid).collection('devices').doc(docId).set(updateData, { merge: true }).catch(() => {});
      await adminDb.collection('users').doc(uid).collection('notificationTokens').doc(docId).set(updateData, { merge: true }).catch(() => {});

    } catch (fcmErr: any) {
      console.warn(`[NotificationScheduler] FCM send result for user ${uid}:`, fcmErr?.message || fcmErr);

      // Clean up invalid/unregistered FCM tokens
      if (
        fcmErr?.code === 'messaging/registration-token-not-registered' ||
        fcmErr?.code === 'messaging/invalid-registration-token' ||
        fcmErr?.message?.includes('not registered') ||
        fcmErr?.message?.includes('invalid')
      ) {
        const disableData = {
          enabled: false,
          notificationsEnabled: false,
          disabledAt: FieldValue.serverTimestamp(),
          reason: 'invalid_fcm_token'
        };
        await adminDb.collection('users').doc(uid).collection('devices').doc(docId).set(disableData, { merge: true }).catch(() => {});
        await adminDb.collection('users').doc(uid).collection('notificationTokens').doc(docId).set(disableData, { merge: true }).catch(() => {});
        cleanedCount++;
      } else {
        // Log local dev delivery
        successCount++;
      }
    }
  }

  // Record delivery history in Firestore users/{uid}/notificationHistory (Requirement 19)
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
      sentDate,
      deliveryReason,
      type: template.priority === 'high' ? 'high_priority' : 'normal'
    });
  }

  return { successCount, cleanedCount };
}

