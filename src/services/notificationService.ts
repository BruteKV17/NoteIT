/**
 * Client Notification Service for NoteIT AI
 * Manages permission requests, Service Worker registration, FCM tokens, and Firestore sync.
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { app, db, auth } from '../firebaseConfig';
import { SCHEDULER_CONFIG } from '../config/notificationTemplates';

export interface UserNotificationPreferences {
  masterEnabled: boolean;
  studyReminders: boolean;
  xpRewards: boolean;
  streakAlerts: boolean;
  lectureUpdates: boolean;
  quizPractice: boolean;
  facultyDoubtUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // e.g. "22:30"
    end: string;   // e.g. "08:00"
  };
  dailyLimit: number; // e.g. 2, 6
  cooldownMinutes: number; // e.g. 90, 240
  timezone?: string;
  updatedAt?: any;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
  masterEnabled: true,
  studyReminders: true,
  xpRewards: true,
  streakAlerts: true,
  lectureUpdates: true,
  quizPractice: true,
  facultyDoubtUpdates: true,
  quietHours: {
    enabled: true,
    start: "22:30",
    end: "08:00"
  },
  dailyLimit: 2,
  cooldownMinutes: 240,
  timezone: typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata'
};

/**
 * Check if the current browser environment supports Web Push Notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current browser notification permission state ('granted' | 'denied' | 'default')
 */
export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Register Service Worker for FCM Web Push
 */
export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('[NotificationService] Service Worker registered cleanly with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[NotificationService] Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Requests browser notification permission and generates an FCM Web Push token
 */
export async function requestNotificationPermission(uid: string): Promise<{
  success: boolean;
  token?: string;
  permission: NotificationPermission | 'unsupported';
  error?: string;
}> {
  if (!isNotificationSupported()) {
    return { success: false, permission: 'unsupported', error: 'Notifications are not supported in this browser environment.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, permission, error: 'Permission was not granted by user.' };
    }

    const swReg = await registerMessagingServiceWorker();
    const messaging = getMessaging(app);

    let token = '';
    try {
      token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || SCHEDULER_CONFIG.DEFAULT_VAPID_KEY,
        serviceWorkerRegistration: swReg || undefined
      });
    } catch (fcmErr: any) {
      console.warn('[NotificationService] FCM getToken fallback/warning:', fcmErr?.message || fcmErr);
      // Fallback token identifier if VAPID key is unconfigured on localhost dev
      token = `web_token_${uid.substring(0, 8)}_${Date.now()}`;
    }

    if (token) {
      await saveFcmTokenToFirestore(uid, token);
    }

    return { success: true, token, permission: 'granted' };
  } catch (err: any) {
    console.error('[NotificationService] Request permission failed:', err);
    return { success: false, permission: Notification.permission, error: err.message || 'Failed to enable notifications.' };
  }
}

/**
 * Saves FCM Token & Device info to Firestore under users/{uid}/devices/{deviceId} AND users/{uid}/notificationTokens/{deviceId}
 */
export async function saveFcmTokenToFirestore(uid: string, token: string): Promise<void> {
  if (!uid || !token) return;
  try {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    let platform = 'Desktop Web';
    if (userAgent.includes('Android')) platform = 'Android Mobile';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS Safari';
    else if (userAgent.includes('Mac')) platform = 'macOS Web';
    else if (userAgent.includes('Windows')) platform = 'Windows Web';

    let browser = 'Browser';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';

    // Hash token to create unique device doc ID
    const tokenIdSanitized = token.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);

    const devicePayload = {
      deviceId: tokenIdSanitized,
      fcmToken: token,
      token,
      platform,
      browser,
      deviceName: `${platform} (${browser})`,
      userAgent,
      isMobile,
      enabled: true,
      notificationsEnabled: true,
      permissionStatus: Notification.permission,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      lastNotificationSentAt: null
    };

    // Save to users/{uid}/devices/{deviceId}
    const deviceRef = doc(db, 'users', uid, 'devices', tokenIdSanitized);
    await setDoc(deviceRef, devicePayload, { merge: true });

    // Save to users/{uid}/notificationTokens/{deviceId} for backwards compatibility
    const tokenRef = doc(db, 'users', uid, 'notificationTokens', tokenIdSanitized);
    await setDoc(tokenRef, devicePayload, { merge: true });

    console.log('[NotificationService] Device registered cleanly in Firestore users/', uid, '/devices/', tokenIdSanitized);
  } catch (err) {
    console.error('[NotificationService] Failed to save FCM device token to Firestore:', err);
  }
}

/**
 * Triggers a backend test push notification to user's registered devices
 */
export async function sendTestPushNotificationToBackend(title?: string, body?: string, route?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) return { success: false, error: 'User is not authenticated.' };

  try {
    const idToken = await currentUser.getIdToken(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
    
    const response = await fetch(`${backendUrl}/api/notifications/send-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        title: title || 'NoteIT AI Test Notification 🚀',
        body: body || 'This is a live test of your NoteIT background push notification system!',
        route: route || '/rewards'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send test push notification.' };
    }
    return { success: true, message: data.message || 'Test push notification sent successfully!' };
  } catch (err: any) {
    console.error('[NotificationService] Send test push failed:', err);
    return { success: false, error: err.message || 'Network error sending test push notification.' };
  }
}

/**
 * Fetches user notification preferences from users/{uid}/notificationPreferences/settings
 */
export async function getUserNotificationPreferences(uid: string): Promise<UserNotificationPreferences> {
  if (!uid) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const prefRef = doc(db, 'users', uid, 'notificationPreferences', 'settings');
    const snap = await getDoc(prefRef);
    if (snap.exists()) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...snap.data() };
    }
  } catch (err) {
    console.warn('[NotificationService] Error reading notification preferences:', err);
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Saves user notification preferences to users/{uid}/notificationPreferences/settings
 */
export async function saveUserNotificationPreferences(uid: string, preferences: UserNotificationPreferences): Promise<boolean> {
  if (!uid) return false;
  try {
    const prefRef = doc(db, 'users', uid, 'notificationPreferences', 'settings');
    await setDoc(prefRef, {
      ...preferences,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[NotificationService] Error saving notification preferences:', err);
    return false;
  }
}

/**
 * Sets up foreground message listener when NoteIT app is active
 */
export function setupForegroundMessageListener(onNotificationReceived?: (payload: any) => void): () => void {
  if (!isNotificationSupported()) return () => {};
  try {
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[NotificationService] Foreground notification received:', payload);
      if (onNotificationReceived) {
        onNotificationReceived(payload);
      } else if (Notification.permission === 'granted') {
        const title = payload.notification?.title || payload.data?.title || 'NoteIT AI';
        const options = {
          body: payload.notification?.body || payload.data?.body || '',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          data: payload.data || {}
        };
        new Notification(title, options);
      }
    });
    return unsubscribe;
  } catch (err) {
    console.warn('[NotificationService] Foreground listener setup skipped:', err);
    return () => {};
  }
}
