import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";

const ADMIN_EMAILS = ["ngogrant454@gmail.com", "islam20111975@gmail.com"];

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable missing");
  const serviceAccount = JSON.parse(raw);
  serviceAccount.private_key = serviceAccount.private_key?.replace(/\\n/g, "\n");
  return initializeApp({ credential: cert(serviceAccount) });
}

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!idToken) return NextResponse.json({ error: "Login token missing" }, { status: 401 });

    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(idToken);
    if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email.toLowerCase())) {
      return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
    }

    const body = await request.json();
    const uids = [...new Set((Array.isArray(body.uids) ? body.uids : []).filter(x => typeof x === "string" && x.length > 0))].slice(0, 500);
    const title = String(body.title || "Zara Nikah Service").slice(0, 100);
    const message = String(body.message || "Aapke liye nayi update hai.").slice(0, 240);
    if (!uids.length) return NextResponse.json({ sent: 0, failureCount: 0, recipients: 0, registeredDevices: 0, message: "No recipients" });

    const db = getFirestore(app);
    const tokens = [];
    for (let i = 0; i < uids.length; i += 10) {
      const snapshot = await db.collection("pushTokens").where("uid", "in", uids.slice(i, i + 10)).get();
      snapshot.forEach(doc => {
        const token = doc.data().token;
        if (typeof token === "string" && token.length > 20) tokens.push(token);
      });
    }

    let sent = 0;
    let failureCount = 0;
    const errors = [];
    const notificationTag = `zara-nikah-${Date.now()}`;
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const response = await getMessaging(app).sendEachForMulticast({
        tokens: batch,
        data: { title, body: message, url: "/notifications" },
        webpush: {
          headers: { TTL: "86400", Urgency: "high" },
          notification: {
            title,
            body: message,
            icon: "/api/pwa-icon?size=192",
            badge: "/api/pwa-icon?size=96",
            tag: notificationTag,
            renotify: true,
            requireInteraction: true,
            silent: false,
            vibrate: [200, 100, 200]
          },
          fcmOptions: { link: "https://zarashadiservice.vercel.app/notifications" }
        }
      });
      sent += response.successCount;
      failureCount += response.failureCount;
      response.responses.forEach((item, index) => {
        if (!item.success && errors.length < 5) {
          errors.push({ code: item.error?.code || "unknown", message: item.error?.message || "Push failed" });
        }
      });
    }
    return NextResponse.json({
      sent,
      failureCount,
      recipients: uids.length,
      registeredDevices: tokens.length,
      errors
    });
  } catch (error) {
    console.error("Push send failed:", error);
    return NextResponse.json({ error: error.message || "Push send failed" }, { status: 500 });
  }
}
