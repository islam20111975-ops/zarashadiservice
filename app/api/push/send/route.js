import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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

async function verifyAdmin(request) {
  const authorization = request.headers.get("authorization") || "";
  const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!idToken) throw new Error("Login token missing");
  const app = getAdminApp();
  const decoded = await getAuth(app).verifyIdToken(idToken);
  if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email.toLowerCase())) throw new Error("Admin permission required");
  return { app, decoded };
}

export async function GET(request) {
  try {
    const { app } = await verifyAdmin(request);
    const db = getFirestore(app);
    const [snapshot, userSnapshot] = await Promise.all([
      db.collection("pushSendLogs").orderBy("createdAt", "desc").limit(50).get(),
      db.collection("users").get()
    ]);
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null };
    });
    const recipientUids = userSnapshot.docs
      .map(doc => ({ uid: doc.id, email: String(doc.data().email || "").toLowerCase() }))
      .filter(item => item.uid && !ADMIN_EMAILS.includes(item.email))
      .map(item => item.uid);
    return NextResponse.json({ logs, recipientUids, userCount: recipientUids.length });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Logs load failed" }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    const { app, decoded } = await verifyAdmin(request);

    const body = await request.json();
    const uids = [...new Set((Array.isArray(body.uids) ? body.uids : []).filter(x => typeof x === "string" && x.length > 0))].slice(0, 500);
    const title = String(body.title || "Zara Nikah Service").slice(0, 100);
    const message = String(body.message || "Aapke liye nayi update hai.").slice(0, 240);
    if (!uids.length) return NextResponse.json({ sent: 0, failureCount: 0, recipients: 0, registeredDevices: 0, message: "No recipients" });

    const db = getFirestore(app);
    const tokenRecords = [];
    for (let i = 0; i < uids.length; i += 10) {
      const snapshot = await db.collection("pushTokens").where("uid", "in", uids.slice(i, i + 10)).get();
      snapshot.forEach(doc => {
        const token = doc.data().token;
        if (typeof token === "string" && token.length > 20) tokenRecords.push({ token, ref: doc.ref });
      });
    }
    const uniqueTokenRecords = [...new Map(tokenRecords.map(item => [item.token, item])).values()];

    let sent = 0;
    let failureCount = 0;
    let invalidTokensRemoved = 0;
    const errors = [];
    const notificationTag = `zara-nikah-${Date.now()}`;
    for (let i = 0; i < uniqueTokenRecords.length; i += 500) {
      const batch = uniqueTokenRecords.slice(i, i + 500);
      const response = await getMessaging(app).sendEachForMulticast({
        tokens: batch.map(item => item.token),
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
      const staleTokenRefs = [];
      response.responses.forEach((item, index) => {
        if (!item.success) {
          const code = item.error?.code || "unknown";
          if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") staleTokenRefs.push(batch[index].ref);
          if (errors.length < 5) errors.push({ code, message: item.error?.message || "Push failed" });
        }
      });
      for (let j = 0; j < staleTokenRefs.length; j += 400) {
        const cleanup = db.batch();
        staleTokenRefs.slice(j, j + 400).forEach(ref => cleanup.delete(ref));
        await cleanup.commit();
        invalidTokensRemoved += Math.min(400, staleTokenRefs.length - j);
      }
    }
    const result = { sent, failureCount, recipients: uids.length, registeredDevices: uniqueTokenRecords.length, invalidTokensRemoved, errors };
    await db.collection("pushSendLogs").add({
      adminEmail: decoded.email, title, sent, failureCount,
      recipients: uids.length, registeredDevices: uniqueTokenRecords.length, invalidTokensRemoved, errors,
      createdAt: FieldValue.serverTimestamp()
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Push send failed:", error);
    return NextResponse.json({ error: error.message || "Push send failed" }, { status: 500 });
  }
}
