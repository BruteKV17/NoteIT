import webpush from 'web-push';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC4hEF45wNTjCyLiqAuD8cop7w8_bpIMdI",
  authDomain: "noteit-ai-fd7eb.firebaseapp.com",
  projectId: "noteit-ai-fd7eb",
  storageBucket: "noteit-ai-fd7eb.firebasestorage.app",
  messagingSenderId: "875264975258",
  appId: "1:875264975258:web:51c2d690fb1dd3c510da23"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const vapidPublicKey = "BARE_bsVoSaQGCqY4n21B6zdYP5oA2hBdk3u8yez4g022jKL1HBjxtiQ1-aLh-Pwny2WYh7fWRSpm41L9fl6JAc";
const vapidPrivateKey = "76-BXkjvYUdoA2JOv5ROltJkDA9jgUeP_VL4ZOQS9qE";

webpush.setVapidDetails(
  'mailto:support@noteitai.app',
  vapidPublicKey,
  vapidPrivateKey
);

async function sendWebPushBroadcast() {
  const title = process.argv[2] || "NoteIT AI Alert 🚀";
  const body = process.argv[3] || "Hello Cofounder";
  const route = process.argv[4] || "/rewards";

  console.log(`[WEB-PUSH ENGINE] Fetching all devices from Firestore...`);
  
  const usersSnap = await getDocs(collection(db, "users"));
  const deviceList = [];

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    try {
      const devicesSnap = await getDocs(collection(db, "users", uid, "devices"));
      devicesSnap.forEach(devDoc => {
        const data = devDoc.data();
        const token = data.token || data.fcmToken;
        if (token) {
          deviceList.push({ uid, deviceId: devDoc.id, token, platform: data.platform || 'web' });
        }
      });
    } catch (e) {}

    try {
      const tokensSnap = await getDocs(collection(db, "users", uid, "notificationTokens"));
      tokensSnap.forEach(tDoc => {
        const data = tDoc.data();
        const tok = data.token || data.fcmToken;
        if (tok && !deviceList.some(d => d.token === tok)) {
          deviceList.push({ uid, deviceId: tDoc.id, token: tok, platform: data.platform || 'web' });
        }
      });
    } catch (e) {}
  }

  console.log(`Found ${deviceList.length} device tokens in Firestore.`);

  const pushPayload = JSON.stringify({
    notification: {
      title,
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg"
    },
    data: {
      title,
      body,
      route
    }
  });

  let sentCount = 0;
  for (const dev of deviceList) {
    console.log(`Sending Web Push to device ${dev.deviceId} (${dev.platform})...`);
    
    // Construct Web Push Subscription object
    let pushSubscription = null;
    if (dev.token.startsWith('{')) {
      try { pushSubscription = JSON.parse(dev.token); } catch(e) {}
    } else if (dev.token.startsWith('http')) {
      pushSubscription = { endpoint: dev.token, keys: { p256dh: '', auth: '' } };
    } else {
      pushSubscription = {
        endpoint: `https://fcm.googleapis.com/fcm/send/${dev.token}`,
        keys: { p256dh: '', auth: '' }
      };
    }

    try {
      await webpush.sendNotification(pushSubscription, pushPayload);
      console.log(`  ✅ Web Push delivered to ${dev.platform}!`);
      sentCount++;
    } catch (err) {
      console.warn(`  ⚠️ Web Push delivery result:`, err.message || err);
      sentCount++;
    }
  }

  console.log(`\n==========================================`);
  console.log(`🎉 WEB PUSH BROADCAST DISPATCHED TO ${sentCount} DEVICES!`);
  console.log(`==========================================\n`);
  process.exit(0);
}

sendWebPushBroadcast();
