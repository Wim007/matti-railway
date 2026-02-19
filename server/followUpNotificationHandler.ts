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
import { actions, followUps, users } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

const { Pool } = pg;

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

        const success = await notifyOwner({
          title: notificationTitle,
          content: notificationContent,
        });

        if (success) {
          await db
            .update(followUps)
            .set({
              status: "sent",
              notificationSent: new Date(),
            })
            .where(eq(followUps.id, followUp.id));

          console.log(`[FollowUpHandler] ✓ Sent notification for follow-up #${followUp.id}`);
        } else {
          console.error(`[FollowUpHandler] ✗ Failed to send notification for follow-up #${followUp.id}`);
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
