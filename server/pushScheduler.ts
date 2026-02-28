import webpush from "web-push";
import { getDb } from "./db";
import { routines, pushSubscriptions } from "../drizzle/schema-postgres";
import { eq } from "drizzle-orm";

// Strip whitespace/newlines from keys (Railway kan regelafbrekingen toevoegen)
const VAPID_PUBLIC = (process.env.VAPID_PUBLIC_KEY || "").replace(/\s/g, "");
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || "").replace(/\s/g, "");
const VAPID_EMAIL = (process.env.VAPID_EMAIL || "mailto:info@slimmemaatjes.online").trim();

let vapidConfigured = false;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
    vapidConfigured = true;
  } catch (err: any) {
    console.warn("[PushScheduler] Ongeldige VAPID keys — push notifications uitgeschakeld:", err.message);
  }
}

// Controleer of een tijdstip (HH:MM) binnen het huidige 5-minuten venster valt
function isWithinWindow(targetTime: string): boolean {
  const now = new Date();
  const [targetH, targetM] = targetTime.split(":").map(Number);
  const targetMinutes = targetH * 60 + targetM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const diff = Math.abs(nowMinutes - targetMinutes);
  return diff < 5;
}
}

async function sendRoutineNotifications() {
  if (!vapidConfigured) return;
  const db = await getDb();
  if (!db) return;

  
  try {
    const allRoutines = await db.select().from(routines);

    for (const routine of allRoutines) {
      if (!routine.sleepEnabled) continue;

      let notificationType: "bedtime" | "wakeup" | null = null;
      let title = "";
      let body = "";

              if (routine.bedtime && isWithinWindow(routine.bedtime)) {
        notificationType = "bedtime";
        title = "Slaaproutine";
        body = "Ga je op tijd naar bed?";
              } else if (routine.wakeTime && isWithinWindow(routine.wakeTime)) {
        notificationType = "wakeup";
        title = "Slaaproutine";
        body = "Ben je op tijd opgestaan?";
      }

      if (!notificationType) continue;

      // Get push subscription for this user
      const subResult = await db.select().from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, routine.userId)).limit(1);

      if (subResult.length === 0) continue;

      const subscription = JSON.parse(subResult[0].subscription);

      const payload = JSON.stringify({
        title,
        body,
        type: notificationType,
        url: `/chat?routine=${notificationType}`,
      });

      try {
        await webpush.sendNotification(subscription, payload);
        console.log(`[PushScheduler] Notificatie verstuurd aan ${routine.userId}: ${notificationType}`);
      } catch (err: any) {
        console.error(`[PushScheduler] Fout bij versturen aan ${routine.userId}:`, err.message);
        // If subscription is invalid (410 Gone), remove it
        if (err.statusCode === 410) {
          await db.delete(pushSubscriptions)
            .where(eq(pushSubscriptions.userId, routine.userId));
        }
      }
    }
  } catch (err) {
    console.error("[PushScheduler] Fout:", err);
  }
}

export function startPushScheduler() {
  if (!vapidConfigured) {
    console.warn("[PushScheduler] VAPID keys niet ingesteld of ongeldig — push notifications uitgeschakeld");
    return;
  }
    console.log("[PushScheduler] Gestart — controleert elke 5 minuten");
    // Check every 5 minutes
    setInterval(sendRoutineNotifications, 5 * 60 * 1000);
  // Also check immediately on start
  sendRoutineNotifications();
}
