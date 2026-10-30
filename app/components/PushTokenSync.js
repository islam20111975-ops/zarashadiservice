"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

const VAPID_PUBLIC_KEY = "BNLuXHsA6GCWIFARTYdGVKLFne4kMoY-YyjXFmXBQUZneQAKHzpZTYPQXKTdvC6kIKWNtVGuIUI0irQAsOoM9io";

export default function PushTokenSync() {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    async function syncToken(user) {
      if (!user || cancelled || typeof window === "undefined") return;
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      if (!("serviceWorker" in navigator)) return;

      try {
        const messagingModule = await import("firebase/messaging");
        const supported = await messagingModule.isSupported();
        if (!supported || cancelled) return;

        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const messaging = messagingModule.getMessaging();
        const token = await messagingModule.getToken(messaging, {
          vapidKey: VAPID_PUBLIC_KEY,
          serviceWorkerRegistration: registration
        });
        if (!token || cancelled) return;

        const tokenId = encodeURIComponent(token).replaceAll("%", "_");
        await setDoc(doc(db, "pushTokens", tokenId), {
          uid: user.uid,
          token,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.warn("Zara push token sync failed:", error);
      }
    }

    unsubscribe = onAuthStateChanged(auth, user => {
      if (user) syncToken(user);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return null;
}
