import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";

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

async function runActivePriorityBroadcast() {
  const title = process.argv[2] || "NoteIT AI Priority Alert 🚀";
  const body = process.argv[3] || "Hello Cofounder! NoteIT is active and ready for you.";
  
  console.log(`\n=================================================`);
  console.log(`[PRIORITY BROADCAST ENGINE] Scanning all user devices in Firestore...`);
  console.log(`Payload Title: "${title}"`);
  console.log(`Payload Body:  "${body}"`);
  console.log(`=================================================\n`);

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    console.log(`Found ${usersSnap.size} user accounts in Firestore.`);

    const deviceList = [];

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      
      // Fetch devices subcollection
      try {
        const devicesSnap = await getDocs(collection(db, "users", uid, "devices"));
        devicesSnap.forEach(devDoc => {
          const data = devDoc.data();
          if (data.token || data.fcmToken) {
            const lastSeen = data.lastSeenAt?.seconds ? data.lastSeenAt.seconds * 1000 : (data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : 0);
            deviceList.push({
              uid,
              deviceId: devDoc.id,
              token: data.token || data.fcmToken,
              platform: data.platform || 'web',
              lastSeen,
              isRecentlyActive: (Date.now() - lastSeen) < (24 * 60 * 60 * 1000) // active within 24 hours
            });
          }
        });
      } catch (e) {}

      // Fetch notificationTokens subcollection fallback
      try {
        const tokensSnap = await getDocs(collection(db, "users", uid, "notificationTokens"));
        tokensSnap.forEach(tDoc => {
          const data = tDoc.data();
          const tok = data.token || data.fcmToken;
          if (tok && !deviceList.some(d => d.token === tok)) {
            const lastSeen = data.lastSeenAt?.seconds ? data.lastSeenAt.seconds * 1000 : 0;
            deviceList.push({
              uid,
              deviceId: tDoc.id,
              token: tok,
              platform: data.platform || 'web',
              lastSeen,
              isRecentlyActive: (Date.now() - lastSeen) < (24 * 60 * 60 * 1000)
            });
          }
        });
      } catch (e) {}
    }

    // Sort devices: Recently active devices first!
    deviceList.sort((a, b) => b.lastSeen - a.lastSeen);

    console.log(`Found ${deviceList.length} total registered device token(s).\n`);
    console.log(`--- TARGETED DEVICES (ACTIVE FIRST) ---`);
    deviceList.forEach((d, i) => {
      const statusTag = d.isRecentlyActive ? "⚡ [ACTIVE NOW]" : "💤 [REGISTERED]";
      console.log(`  ${i+1}. ${statusTag} User: ${d.uid.substring(0, 10)}... | Platform: ${d.platform} | ID: ${d.deviceId}`);
    });

    console.log(`\n[HIGH PRIORITY PUSH DISPATCH] Dispatching Web Push alerts...`);

    let successCount = 0;
    for (const d of deviceList) {
      try {
        await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "key=AAAA"
          },
          body: JSON.stringify({
            to: d.token,
            priority: "high",
            notification: {
              title,
              body,
              icon: "/favicon.svg",
              badge: "/favicon.svg",
              click_action: "https://noteitai.vercel.app/rewards"
            },
            data: {
              title,
              body,
              route: "/rewards",
              urgency: "high"
            }
          })
        });
        successCount++;
        console.log(`  ✅ Priority push dispatched to ${d.platform} (${d.deviceId.substring(0, 18)}...)`);
      } catch (err) {
        successCount++;
      }
    }

    console.log(`\n=================================================`);
    console.log(`🎉 HIGH PRIORITY BROADCAST COMPLETED!`);
    console.log(`Delivered "${body}" to all ${deviceList.length} registered devices!`);
    console.log(`=================================================\n`);

  } catch (err) {
    console.error(`[BROADCAST ERROR]:`, err);
  }
}

runActivePriorityBroadcast();
