/**
 * Follow-up Notification Handler
 *
 * This script checks for pending follow-ups and sends notifications to users.
 * Should be run as a scheduled task (e.g., daily cron job).
 *
 * Usage:
 * - Via cron: `0 9 * * * cd /home/ubuntu/matti-webapp && node dist/followUpNotificationHandler.js`
 * - Manual: `tsx server/followUpNotificationHandler.ts`
 */

import { and, eq, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import webpush from "web-push";
import { actions, followUps, pushSubscriptions, users } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

const { Pool } = pg;

const VAPID_PUBLIC = (process.env.VAPID_PUBLIC_KEY || "").replace(/\s/g, "");
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || "").replace(/\s/g, "");
const VAPID_EMAIL = (process.env.VAPID_EMAIL || "mailto:info@slimmemaatjes.online").trim();

let vapidConfigured = false;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
    vapidConfigured = true;
  } catch (err: any) {
    console.warn("[FollowUpHandler] Ongeldige VAPID keys — user push notifications uitgeschakeld:", err.message);
  }
}

async function sendUserFollowUpPush(
  db: any,
  input: {
    userId: string;
    followUpId: number;
    actionId: number;
    actionText: string;
    conversationId: number | null;
  }
): Promise<boolean> {
  if (!vapidConfigured) {
    return false;
  }

  const subResult = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, input.userId))
    .limit(1);

  if (subResult.length === 0) {
    return false;
  }

  const subscription = JSON.parse(subResult[0].subscription);
  const payload = JSON.stringify({
    title: "Hoe is het gegaan?",
    body: `Even inchecken: \"${input.actionText}\".`,
    type: "action_follow_up",
    followUpId: input.followUpId,
    actionId: input.actionId,
    url: input.conversationId ? `/chat?conversationId=${input.conversationId}` : "/chat",
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (err: any) {
    console.error(`[FollowUpHandler] Fout bij user-push voor ${input.userId}:`, err.message);
    if (err.statusCode === 410) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, input.userId));
    }
    return false;
  }
}

async function sendFollowUpNotifications() {
  console.log("[FollowUpHandler] Starting follow-up notification check...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
  const db = drizzle(pool);

  try {
    const now = new Date();
    const dueFollowUps = await db
      .select({
        followUp: followUps,
        action: actions,
        user: users,
      })
      .from(followUps)
      .innerJoin(actions, eq(followUps.actionId, actions.id))
      .innerJoin(users, eq(actions.userId, users.openId))
      .where(and(eq(followUps.status, "pending"), lte(followUps.scheduledFor, now)));

    console.log(`[FollowUpHandler] Found ${dueFollowUps.length} due follow-ups`);

    for (const { followUp, action, user } of dueFollowUps) {
      try {
        const notificationTitle = "🔔 Follow-up check-in nodig";
        const notificationContent = `
Gebruiker: ${user.name || user.openId}
Actie: ${action.actionText}
Gepland voor: ${new Date(followUp.scheduledFor).toLocaleDateString("nl-NL")}

Deze gebruiker heeft een actie gepland en het is tijd voor een follow-up check-in.
        `.trim();

        const ownerNotified = await notifyOwner({
          title: notificationTitle,
          content: notificationContent,
        });

        const pushSent = await sendUserFollowUpPush(db, {
          userId: user.openId,
          followUpId: followUp.id,
          actionId: action.id,
          actionText: action.actionText,
          conversationId: action.conversationId,
        });

        if (ownerNotified || pushSent) {
          await db
            .update(followUps)
            .set({
              status: "sent",
              notificationSent: new Date(),
            })
            .where(eq(followUps.id, followUp.id));

          console.log(
            `[FollowUpHandler] ✓ Follow-up #${followUp.id} verwerkt (owner: ${ownerNotified}, user push: ${pushSent})`
          );
        } else {
          console.error(`[FollowUpHandler] ✗ Geen notificatie verstuurd voor follow-up #${followUp.id}`);
        }
      } catch (error) {
        console.error(`[FollowUpHandler] Error processing follow-up #${followUp.id}:`, error);
      }
    }

    console.log("[FollowUpHandler] Follow-up notification check completed");
  } catch (error) {
    console.error("[FollowUpHandler] Fatal error:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  sendFollowUpNotifications()
    .then(() => {
      console.log("[FollowUpHandler] Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[FollowUpHandler] Script failed:", error);
      process.exit(1);
    });
}

export { sendFollowUpNotifications };
