import { z } from "zod";
import { router } from "./_core/trpc";
import { mattiProcedure } from "./_core/mattiProcedure";
import { getDb } from "./db";
import { actions, followUps } from "../drizzle/schema";
import { eq, and, desc, lte } from "drizzle-orm";
import type { ThemeId } from "@shared/matti-types";
import { notifyOwner } from "./_core/notification";

/**
 * Action Router
 * 
 * Manages action tracking and follow-up scheduling
 */

const themeIdEnum = z.enum([
  "general",
  "school",
  "friends",
  "home",
  "feelings",
  "love",
  "freetime",
  "future",
  "self",
  "bullying"
]);

const actionStatusEnum = z.enum(["pending", "completed", "cancelled"]);

// Intelligent intervals for youth (faster than parents)
// Day 2, 4, 7, 10, 14, 21
const FOLLOW_UP_INTERVALS = [2, 4, 7, 10, 14, 21];

export const actionRouter = router({
  /**
   * Save a detected action and schedule follow-ups
   */
  saveAction: mattiProcedure
    .input(z.object({
      themeId: themeIdEnum,
      actionText: z.string(),
      conversationId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userId = ctx.user.id;
      const { themeId, actionText, conversationId } = input;

      // Create action
      const inserted = await db
        .insert(actions)
        .values({
          userId,
          themeId: themeId as ThemeId,
          actionText,
          conversationId,
          status: "pending",
          followUpIntervals: FOLLOW_UP_INTERVALS,
        })
        .returning({ id: actions.id });

      const actionId = inserted[0]?.id;

      // Validate actionId before scheduling follow-ups
      if (!actionId || Number.isNaN(actionId)) {
        console.error("[ActionTracking] Invalid actionId:", actionId, "Result:", inserted);
        throw new Error("Failed to create action: invalid actionId");
      }

      // Schedule follow-ups
      const now = new Date();
      for (const intervalDays of FOLLOW_UP_INTERVALS) {
        const scheduledFor = new Date(now);
        scheduledFor.setDate(scheduledFor.getDate() + intervalDays);

        await db.insert(followUps).values({
          actionId,
          scheduledFor,
          status: "pending",
        });
      }

      console.log(`[ActionTracking] Action saved with ${FOLLOW_UP_INTERVALS.length} follow-ups:`, actionId);

      // Notify owner about new action (optional)
      try {
        await notifyOwner({
          title: "Nieuwe actie gedetecteerd",
          content: `Gebruiker ${ctx.user.name || ctx.user.id} heeft een actie: "${actionText}" (thema: ${themeId})`,
        });
      } catch (error) {
        console.error("[ActionTracking] Failed to notify owner:", error);
      }

      return {
        success: true,
        actionId,
        followUpCount: FOLLOW_UP_INTERVALS.length,
      };
    }),

  /**
   * Get all actions for current user
   */
  getActions: mattiProcedure
    .input(z.object({
      status: actionStatusEnum.optional(),
      themeId: themeIdEnum.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userId = ctx.user.id;
      const { status, themeId } = input;

      let query = db.select().from(actions).where(eq(actions.userId, userId));

      // Apply filters
      const conditions = [eq(actions.userId, userId)];
      if (status) {
        conditions.push(eq(actions.status, status));
      }
      if (themeId) {
        conditions.push(eq(actions.themeId, themeId as ThemeId));
      }

      const results = await db
        .select()
        .from(actions)
        .where(and(...conditions))
        .orderBy(desc(actions.createdAt));

      return results;
    }),

  /**
   * Update action status (mark as completed/cancelled)
   */
  updateActionStatus: mattiProcedure
    .input(z.object({
      actionId: z.number(),
      status: actionStatusEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userId = ctx.user.id;
      const { actionId, status } = input;

      // Verify ownership
      const existing = await db
        .select()
        .from(actions)
        .where(and(eq(actions.id, actionId), eq(actions.userId, userId)))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Action not found or unauthorized");
      }

      // Update action
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === "completed") {
        updateData.completedAt = new Date();
      }

      await db
        .update(actions)
        .set(updateData)
        .where(eq(actions.id, actionId));

      // Cancel pending follow-ups if action is completed/cancelled
      if (status === "completed" || status === "cancelled") {
        await db
          .update(followUps)
          .set({ status: "skipped" })
          .where(and(
            eq(followUps.actionId, actionId),
            eq(followUps.status, "pending")
          ));
      }

      console.log(`[ActionTracking] Action ${actionId} status updated to:`, status);

      return { success: true };
    }),

  /**
   * Get action statistics
   */
  getActionStats: mattiProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userId = ctx.user.id;

      const allActions = await db
        .select()
        .from(actions)
        .where(eq(actions.userId, userId));

      const pending = allActions.filter(a => a.status === "pending").length;
      const completed = allActions.filter(a => a.status === "completed").length;
      const cancelled = allActions.filter(a => a.status === "cancelled").length;
      const total = allActions.length;

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        pending,
        completed,
        cancelled,
        completionRate,
      };
    }),

  /**
   * Get pending follow-ups (for notification system)
   */
  getPendingFollowUps: mattiProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userId = ctx.user.id;
      const now = new Date();

      // Get follow-ups that are due and not yet sent
      const results = await db
        .select({
          followUp: followUps,
          action: actions,
        })
        .from(followUps)
        .innerJoin(actions, eq(followUps.actionId, actions.id))
        .where(and(
          eq(actions.userId, userId),
          eq(followUps.status, "pending"),
          lte(followUps.scheduledFor, now)
        ))
        .orderBy(followUps.scheduledFor);

      return results;
    }),
});

export type ActionRouter = typeof actionRouter;
