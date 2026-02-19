import { z } from "zod";
import { router } from "./_core/trpc";
import { mattiProcedure } from "./_core/mattiProcedure";
import { getDb } from "./db";
import { conversations, actions } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { getRecentConversationContext, generateContextPrompt } from "@shared/follow-up-context";
import type { ThemeId } from "@shared/matti-types";

/**
 * Follow-up Context Router
 * 
 * Provides compact conversation context for welcome messages
 */

export const followUpContextRouter = router({
  /**
   * Get recent conversation context for follow-up
   * Returns compact context if user has recent conversation that needs follow-up
   */
  getRecentContext: mattiProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const userId = ctx.user.id;

    // Get most recent conversation (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentConversations = await db
      .select({
        themeId: conversations.themeId,
        summary: conversations.summary,
        updatedAt: conversations.updatedAt,
        bullyingDetected: conversations.bullyingDetected,
        bullyingSeverity: conversations.bullyingSeverity,
        initialProblem: conversations.initialProblem,
        outcome: conversations.outcome,
      })
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt))
      .limit(1);

    if (recentConversations.length === 0) {
      return null;
    }

    const recentConversation = recentConversations[0];

    // Get pending actions for this theme
    const pendingActions = await db
      .select({
        actionText: actions.actionText,
        status: actions.status,
      })
      .from(actions)
      .where(
        and(
          eq(actions.userId, userId),
          eq(actions.themeId, recentConversation.themeId as ThemeId),
          eq(actions.status, "pending")
        )
      )
      .orderBy(desc(actions.createdAt))
      .limit(5); // Max 5 pending actions

    // Generate context
    const context = getRecentConversationContext(
      {
        themeId: recentConversation.themeId as ThemeId,
        summary: recentConversation.summary,
        updatedAt: recentConversation.updatedAt,
        bullyingDetected: recentConversation.bullyingDetected,
        bullyingSeverity: recentConversation.bullyingSeverity,
        initialProblem: recentConversation.initialProblem,
        outcome: recentConversation.outcome,
      },
      pendingActions.map((a) => ({
        actionText: a.actionText,
        status: a.status as "pending" | "completed" | "cancelled",
      }))
    );

    if (!context) {
      return null;
    }

    // Generate compact prompt for Matti
    const contextPrompt = generateContextPrompt(context);

    return {
      context,
      contextPrompt,
    };
  }),
});
