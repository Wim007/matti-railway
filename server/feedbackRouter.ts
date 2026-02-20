import { z } from "zod";
import { router } from "./_core/trpc";
import { mattiProcedure } from "./_core/mattiProcedure";
import { getDb } from "./db";
import { messageFeedback } from "../drizzle/schema";
import { and, eq, desc } from "drizzle-orm";

/**
 * Feedback Router
 * Handles thumbs up/down feedback on AI messages
 */

export const feedbackRouter = router({
  /**
   * Submit feedback for an AI message
   */
  submitFeedback: mattiProcedure
    .input(
      z.object({
        conversationId: z.number(),
        messageIndex: z.number(),
        rating: z.enum(["up", "down"]),
        feedbackText: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { conversationId, messageIndex, rating, feedbackText } = input;

      // Insert feedback into database
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(messageFeedback).values({
        conversationId,
        userId: ctx.user.id,
        messageIndex,
        rating,
        feedbackText: feedbackText || null,
      });

      console.log(`[Feedback] ${rating} feedback submitted for message ${messageIndex} in conversation ${conversationId}`);

      return { success: true };
    }),

  /**
   * Get all feedback for a conversation (for debugging/admin)
   */
  getFeedback: mattiProcedure
    .input(
      z.object({
        conversationId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const feedback = await db
        .select()
        .from(messageFeedback)
        .where(
          and(
            eq(messageFeedback.conversationId, input.conversationId),
            eq(messageFeedback.userId, ctx.user.id)
          )
        );

      return feedback;
    }),

  /**
   * Get all feedback with pagination and filters (for dashboard)
   */
  getAllFeedback: mattiProcedure
    .input(
      z.object({
        rating: z.enum(["all", "up", "down"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(messageFeedback.userId, ctx.user.id)];

      if (input.rating && input.rating !== "all") {
        conditions.push(eq(messageFeedback.rating, input.rating));
      }

      const feedback = await db
        .select()
        .from(messageFeedback)
        .where(and(...conditions))
        .orderBy(desc(messageFeedback.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const totalCount = (
        await db
          .select()
          .from(messageFeedback)
          .where(and(...conditions))
      ).length;

      return {
        feedback,
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      };
    }),

  /**
   * Get feedback statistics
   */
  getStatistics: mattiProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allFeedback = await db
      .select()
      .from(messageFeedback)
      .where(eq(messageFeedback.userId, ctx.user.id));
    
    const totalCount = allFeedback.length;
    const upCount = allFeedback.filter(f => f.rating === "up").length;
    const downCount = allFeedback.filter(f => f.rating === "down").length;
    const positivePercentage = totalCount > 0 ? Math.round((upCount / totalCount) * 100) : 0;

    return {
      totalCount,
      upCount,
      downCount,
      positivePercentage,
    };
  }),

  /**
   * Get all negative feedback (for owner dashboard)
   */
  getNegativeFeedback: mattiProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const feedback = await db
      .select()
      .from(messageFeedback)
      .where(
        and(
          eq(messageFeedback.rating, "down"),
          eq(messageFeedback.userId, ctx.user.id)
        )
      )
      .orderBy(desc(messageFeedback.createdAt))
      .limit(100);

    return feedback;
  }),
});
