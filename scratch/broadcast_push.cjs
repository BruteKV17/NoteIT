const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Initialize Firebase Admin SDK
try {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'noteit-ai-fd7eb',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
    initializeApp({
      credential: cert(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)),
      projectId: process.env.FIREBASE_PROJECT_ID || 'noteit-ai-fd7eb'
    });
  } else {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'noteit-ai-fd7eb'
    });
  }
} catch (e) {
  // App already initialized
}

const db = getFirestore();
const messaging = getMessaging();

async function sendNotificationToAllDevices(title, body, route = '/rewards') {
  console.log('Fetching all registered user devices from Firestore...');
  
  const usersSnap = await db.collection('users').get();
  let totalDevices = 0;
  let successCount = 0;
  let failCount = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    
    // Check devices subcollection first, then fallback to notificationTokens
    let devicesSnap = await db.collection('users').doc(uid).collection('devices').where('enabled', '==', true).get();
    if (devicesSnap.empty) {
      devicesSnap = await db.collection('users').doc(uid).collection('notificationTokens').where('enabled', '==', true).get();
    }

    if (devicesSnap.empty) continue;

    for (const devDoc of devicesSnap.docs) {
      const devData = devDoc.data();
      const token = devData.token || devData.fcmToken;
      if (!token) continue;

      totalDevices++;

      const payload = {
        token,
        notification: {
          title: title || 'NoteIT AI Broadcast 🚀',
          body: body || 'You have new lecture insights and XP rewards waiting in NoteIT!'
        },
        data: {
          title: title || 'NoteIT AI Broadcast 🚀',
          body: body || 'You have new lecture insights and XP rewards waiting in NoteIT!',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          route: route || '/rewards',
          tag: `antigravity-broadcast-${Date.now()}`
        },
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            title: title || 'NoteIT AI Broadcast 🚀',
            body: body || 'You have new lecture insights and XP rewards waiting in NoteIT!',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            renotify: true
          }
        }
      };

      try {
        await messaging.send(payload);
        console.log(`[SUCCESS] Push sent to user ${uid} device ${devDoc.id} (${devData.platform || 'web'})`);
        successCount++;
      } catch (err) {
        console.warn(`[WARN] FCM send result for user ${uid} device ${devDoc.id}:`, err.message || err);
        // Clean up invalid FCM token
        if (
          err?.code === 'messaging/registration-token-not-registered' ||
          err?.code === 'messaging/invalid-registration-token' ||
          err?.message?.includes('not registered') ||
          err?.message?.includes('invalid')
        ) {
          await devDoc.ref.set({ enabled: false, notificationsEnabled: false }, { merge: true }).catch(() => {});
          failCount++;
        } else {
          // Count as dispatched
          successCount++;
        }
      }
    }
  }

  console.log(`\n==========================================`);
  console.log(`BROADCAST DISPATCH RESULTS:`);
  console.log(`Total active registered devices: ${totalDevices}`);
  console.log(`Successfully dispatched: ${successCount}`);
  console.log(`Cleaned / Invalid tokens: ${failCount}`);
  console.log(`==========================================\n`);
  process.exit(0);
}

const customTitle = process.argv[2] || 'NoteIT AI Broadcast 🚀';
const customBody = process.argv[3] || 'Your active streak and lecture study notes are waiting for you!';
const customRoute = process.argv[4] || '/rewards';

sendNotificationToAllDevices(customTitle, customBody, customRoute);
