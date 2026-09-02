/**
 * Firebase Messaging Service Worker for NoteIT AI
 * Handles background push notifications, NoteIT logo branding, and click navigation.
 */

// Import Firebase compat libraries inside service worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase App in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyC4hEF45wNTjCyLiqAuD8cop7w8_bpIMdI",
  authDomain: "noteit-ai-fd7eb.firebaseapp.com",
  projectId: "noteit-ai-fd7eb",
  storageBucket: "noteit-ai-fd7eb.firebasestorage.app",
  messagingSenderId: "875264975258",
  appId: "1:875264975258:web:51c2d690fb1dd3c510da23"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const title = payload.notification?.title || payload.data?.title || 'NoteIT AI';
  const body = payload.notification?.body || payload.data?.body || '';
  const icon = payload.notification?.icon || payload.data?.icon || '/favicon.svg';
  const badge = payload.data?.badge || '/favicon.svg';
  const route = payload.data?.route || payload.data?.url || '/';
  const tag = payload.data?.tag || `noteit-${Date.now()}`;

  const notificationOptions = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      route,
      url: route,
      ...payload.data
    }
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Native push listener fallback for raw Web Push payloads
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    if (payload && (payload.notification || payload.data)) {
      const title = payload.notification?.title || payload.data?.title || 'NoteIT AI';
      const body = payload.notification?.body || payload.data?.body || '';
      const icon = payload.notification?.icon || payload.data?.icon || '/favicon.svg';
      const badge = payload.data?.badge || '/favicon.svg';
      const route = payload.data?.route || payload.data?.url || '/';

      const options = {
        body,
        icon,
        badge,
        renotify: true,
        vibrate: [200, 100, 200],
        data: {
          route,
          url: route,
          ...payload.data
        }
      };

      event.waitUntil(self.registration.showNotification(title, options));
    }
  } catch (e) {
    // Non-JSON push payload
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('NoteIT AI', {
        body: text,
        icon: '/favicon.svg',
        data: { route: '/' }
      })
    );
  }
});

// Handle notification click action
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  event.notification.close();

  const targetRoute = event.notification.data?.route || event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Look for an existing open NoteIT window
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTEIT_NOTIFICATION_NAVIGATE',
            route: targetRoute
          });
          return;
        }
      }
      // If no window open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetRoute);
      }
    })
  );
});
