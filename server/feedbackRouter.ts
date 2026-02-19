import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { messageFeedback } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Feedback Router
 * Handles thumbs up/down feedback on AI messages
 */

export const feedbackRouter = router({
  /**
   * Submit feedback for an AI message
   */
  submitFeedback: protectedProcedure
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
        userId: ctx.user.openId,
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
  getFeedback: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const feedback = await db
        .select()
        .from(messageFeedback)
        .where(eq(messageFeedback.conversationId, input.conversationId));

      return feedback;
    }),

  /**
   * Get all feedback with pagination and filters (for dashboard)
   */
  getAllFeedback: protectedProcedure
    .input(
      z.object({
        rating: z.enum(["all", "up", "down"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(messageFeedback);

      // Apply rating filter
      if (input.rating && input.rating !== "all") {
        query = query.where(eq(messageFeedback.rating, input.rating)) as any;
      }

      // Apply ordering and pagination
      const feedback = await query
        .orderBy(desc(messageFeedback.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count for pagination
      const countQuery = input.rating && input.rating !== "all"
        ? db.select().from(messageFeedback).where(eq(messageFeedback.rating, input.rating))
        : db.select().from(messageFeedback);
      
      const totalCount = (await countQuery).length;

      return {
        feedback,
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      };
    }),

  /**
   * Get feedback statistics
   */
  getStatistics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allFeedback = await db.select().from(messageFeedback);
    
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
  getNegativeFeedback: protectedProcedure.query(async ({ ctx }) => {
    // Only allow owner to view all feedback
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const feedback = await db
      .select()
      .from(messageFeedback)
      .where(eq(messageFeedback.rating, "down"))
      .orderBy(desc(messageFeedback.createdAt))
      .limit(100);

    return feedback;
  }),
});
