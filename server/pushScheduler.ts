import webpush from "web-push";
import { getDb } from "./db";
import { routines, pushSubscriptions } from "../drizzle/schema-postgres";
import { eq } from "drizzle-orm";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:info@slimmemaatjes.online";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

function getCurrentTime(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

async function sendRoutineNotifications() {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  const db = await getDb();
  if (!db) return;

  const currentTime = getCurrentTime();

  try {
    const allRoutines = await db.select().from(routines);

    for (const routine of allRoutines) {
      if (!routine.sleepEnabled) continue;

      let notificationType: "bedtime" | "wakeup" | null = null;
      let title = "";
      let body = "";

      if (routine.bedtime === currentTime) {
        notificationType = "bedtime";
        title = "Slaaproutine";
        body = "Ga je op tijd naar bed?";
      } else if (routine.wakeTime === currentTime) {
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
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn("[PushScheduler] VAPID keys niet ingesteld — push notifications uitgeschakeld");
    return;
  }
  console.log("[PushScheduler] Gestart — controleert elke minuut");
  // Check every minute
  setInterval(sendRoutineNotifications, 60 * 1000);
  // Also check immediately on start
  sendRoutineNotifications();
}
