"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

const VAPID_PUBLIC_KEY = "BNLuXHsA6GCWIFARTYdGVKLFne4kMoY-YyjXFmXBQUZneQAKHzpZTYPQXKTdvC6kIKWNtVGuIUI0irQAsOoM9io";

export default function PushTokenSync() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function savePushToken(currentUser) {
    if (!currentUser || typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted" || !("serviceWorker" in navigator)) return;
    const messagingModule = await import("firebase/messaging");
    if (!await messagingModule.isSupported()) return;
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const messaging = messagingModule.getMessaging();
    const token = await messagingModule.getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration
    });
    if (!token) throw new Error("Notification token nahi mila.");
    const tokenId = encodeURIComponent(token).replaceAll("%", "_");
    await setDoc(doc(db, "pushTokens", tokenId), {
      uid: currentUser.uid,
      token,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  useEffect(() => onAuthStateChanged(auth, currentUser => setUser(currentUser)), []);

  useEffect(() => {
    if (user && permission === "granted") {
      savePushToken(user).catch(error => console.warn("Zara push token sync failed:", error));
    }
  }, [user, permission]);

  async function enableNotifications() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setPermission("unsupported");
        return;
      }
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        if (user) await savePushToken(user);
      } else if (result === "denied") {
        setMessage("ब्राउज़र की Site Settings में जाकर Notifications को Allow करें।");
      }
    } catch (error) {
      console.warn("Zara notification enable failed:", error);
      setMessage("नोटिफिकेशन चालू नहीं हो पाया। दोबारा कोशिश करें।");
    } finally {
      setBusy(false);
    }
  }

  if (pathname !== "/" || permission !== "default" || permission === "unsupported") return null;

  return (
    <div style={{ position: "fixed", zIndex: 9999, right: 16, bottom: "max(20px, env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      {message && <span style={{ maxWidth: 260, padding: "9px 12px", borderRadius: 12, background: "#241334", color: "#fff", fontSize: 12, boxShadow: "0 4px 12px #0005" }}>{message}</span>}
      <button type="button" onClick={enableNotifications} disabled={busy} style={{ border: "1px solid #ffe69a", borderRadius: 999, padding: "13px 19px", background: "linear-gradient(145deg,#fff3a6 0%,#ffc928 45%,#e58a00 100%)", color: "#421d00", fontSize: 14, fontWeight: 900, letterSpacing: ".2px", cursor: "pointer", boxShadow: "0 7px 0 #9a5200, 0 11px 22px rgba(0,0,0,.32), inset 0 2px 3px rgba(255,255,255,.9)", textShadow: "0 1px 0 rgba(255,255,255,.5)", transform: busy ? "translateY(3px)" : "translateY(0)", marginBottom: busy ? 4 : 7 }}>
        {busy ? "कृपया रुकें..." : "🔔 NOTIFICATION ON करें"}
      </button>
    </div>
  );
}
