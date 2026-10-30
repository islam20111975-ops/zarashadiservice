"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

const VAPID_PUBLIC_KEY = "BNLuXHsA6GCWIFARTYdGVKLFne4kMoY-YyjXFmXBQUZneQAKHzpZTYPQXKTdvC6kIKWNtVGuIUI0irQAsOoM9io";

export default function PushTokenSync() {
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

  useEffect(() => {
    return onAuthStateChanged(auth, currentUser => setUser(currentUser));
  }, []);

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
        setMessage("इस ब्राउज़र में नोटिफिकेशन उपलब्ध नहीं हैं।");
        return;
      }
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        if (user) await savePushToken(user);
        setMessage("नोटिफिकेशन चालू हो गया है।");
      } else if (result === "denied") {
        setMessage("अनुमति ब्लॉक है। मोबाइल/ब्राउज़र की Site Settings में Notifications को Allow करें।");
      } else {
        setMessage("अनुमति अभी नहीं मिली।");
      }
    } catch (error) {
      console.warn("Zara notification enable failed:", error);
      setMessage("नोटिफिकेशन चालू नहीं हो पाया: " + (error?.message || "दोबारा कोशिश करें"));
    } finally {
      setBusy(false);
    }
  }

  if (permission !== "default" && !message) return null;
  if (permission === "unsupported") return null;

  return (
    <aside style={{ position: "fixed", zIndex: 9999, left: 12, right: 12, bottom: "max(12px, env(safe-area-inset-bottom))", maxWidth: 560, margin: "0 auto", padding: "13px 15px", borderRadius: 16, background: "#241334", color: "#fff", boxShadow: "0 8px 30px rgba(0,0,0,.28)", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: 14 }}>🔔 Zara Nikah की नई सूचनाएँ पाएँ</strong>
        <span style={{ display: "block", fontSize: 12, opacity: .9, marginTop: 4 }}>{message || "नई प्रोफाइल और जरूरी अपडेट की सूचना फोन पर पाने के लिए Allow करें।"}</span>
      </div>
      {permission === "default" && <button type="button" onClick={enableNotifications} disabled={busy} style={{ border: 0, borderRadius: 10, padding: "10px 13px", background: "#f5c542", color: "#241334", fontWeight: 800, whiteSpace: "nowrap", cursor: "pointer" }}>{busy ? "जाँच..." : "ON करें"}</button>}
    </aside>
  );
}
