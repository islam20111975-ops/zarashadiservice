// Firebase Cloud Messaging support for Zara Nikah Service PWA.
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBaQOHGPC8u0bcKSA91x87QQnludZ0TP1U",
  authDomain: "zara-shadi-service.firebaseapp.com",
  projectId: "zara-shadi-service",
  storageBucket: "zara-shadi-service.firebasestorage.app",
  messagingSenderId: "369935194560",
  appId: "1:369935194560:web:99beaadf702ffa1e0b5025"
});

const messaging = firebase.messaging();

// Notification payloads are displayed automatically by the browser/FCM.
// Keep showNotification as a fallback for data-only messages.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const data = payload.data || {};
  const title = data.title || "Zara Nikah Service";
  const options = {
    body: data.body || "Aapke liye nayi update hai.",
    icon: "/api/pwa-icon?size=192",
    badge: "/api/pwa-icon?size=96",
    data: { url: data.url || "/notifications" },
    tag: "zara-nikah-update"
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener("install", (event) => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/notifications", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        client.navigate(target);
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  }));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname === "/api/app-splash") {
    event.respondWith(fetch(event.request, { cache: "no-store" }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
