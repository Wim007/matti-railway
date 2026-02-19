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

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, lte } from "drizzle-orm";
import { followUps, actions, users } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

async function sendFollowUpNotifications() {
  console.log("[FollowUpHandler] Starting follow-up notification check...");

  // Connect to database
  const db = drizzle(process.env.DATABASE_URL!);

  try {
    // Find all pending follow-ups that are due
    const now = new Date();
    const dueFollowUps = await db
      .select({
        followUp: followUps,
        action: actions,
        user: users,
      })
      .from(followUps)
      .innerJoin(actions, eq(followUps.actionId, actions.id))
      .innerJoin(users, eq(actions.userId, users.id))
      .where(
        and(
          eq(followUps.status, "pending"),
          lte(followUps.scheduledFor, now)
        )
      );

    console.log(`[FollowUpHandler] Found ${dueFollowUps.length} due follow-ups`);

    for (const { followUp, action, user } of dueFollowUps) {
      try {
        // Send notification to user (via Manus Notification API)
        // For now, we'll notify the owner (stakeholder) about pending follow-ups
        const notificationTitle = `Follow-up: ${user.name || "User"}`;
        const notificationContent = `
**Actie:** ${action.actionText}
**Gebruiker:** ${user.name || "Onbekend"} (${user.email || "geen email"})
**Geplande datum:** ${followUp.scheduledFor.toLocaleDateString("nl-NL")}
**Status:** Wacht op check-in

Deze gebruiker heeft een actie gepland en het is tijd voor een follow-up check-in.
        `.trim();

        const success = await notifyOwner({
          title: notificationTitle,
          content: notificationContent,
        });

        if (success) {
          // Mark follow-up as sent
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
  }
}

// Run if executed directly
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
