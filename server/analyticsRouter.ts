import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { analytics } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Dashboard API configuration
const ANALYTICS_CONFIG = {
  apiKey: 'ak_zy2wNbIDSOt9ahf4Huk1lfvie12eRn8WT7hD9VEbCgXWTnI8',
  endpoint: 'https://analdash-gktrmfew.manus.space/api/analytics/event'
};

/**
 * Event types that can be sent to Dashboard
 */
const EventType = z.enum(["SESSION_START", "MESSAGE_SENT", "RISK_DETECTED", "SESSION_END", "INTERVENTION_OUTCOME"]);

/**
 * Risk levels for RISK_DETECTED events
 */
const RiskLevel = z.enum(["low", "medium", "high", "critical"]);

/**
 * Risk types for RISK_DETECTED events
 */
const RiskType = z.enum(["suicidality", "self_harm", "abuse", "other"]);

/**
 * Send event to Dashboard API
 */
/**
 * Convert Matti event data to Dashboard's expected format
 */
function convertToDashboardFormat(eventType: string, eventData: any) {
  // Dashboard expects this exact structure:
  // { appName, postalCodeArea, ageGroup, userType, themes, sessionDuration, messageCount, isHighRisk, safetySignal, satisfactionScore, selfReportedImprovement, referralType }
  
  const baseEvent = {
    appName: "matti",
    postalCodeArea: eventData.gemeente || "0000",
    ageGroup: eventData.leeftijdsgroep || "13-15",
    userType: "jongere",
    familyType: null,
    themes: eventData.theme ? [eventData.theme] : ["general"],
    sessionDuration: Math.floor((eventData.duration_seconds || 0) / 60), // convert to minutes
    messageCount: eventData.total_messages || eventData.messageCount || 0,
    isHighRisk: eventData.riskLevel === "high" || eventData.riskLevel === "critical",
    safetySignal: eventData.riskType === "suicidality" || eventData.riskType === "self_harm",
    satisfactionScore: eventData.satisfaction_score || null,
    selfReportedImprovement: eventData.outcome === "resolved" ? true : null,
    referralType: null,
  };

  return baseEvent;
}

async function sendEventToDashboard(eventType: string, eventData: any) {
  try {
    const dashboardEvent = convertToDashboardFormat(eventType, eventData);
    
    const response = await fetch(ANALYTICS_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ANALYTICS_CONFIG.apiKey,
      },
      body: JSON.stringify(dashboardEvent),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Analytics] Dashboard API error: ${response.status} ${response.statusText}`, errorText);
      return false;
    }

    console.log(`[Analytics] Event sent to Dashboard: ${eventType}`, dashboardEvent);
    return true;
  } catch (error) {
    console.error(`[Analytics] Failed to send event to Dashboard:`, error);
    return false;
  }
}

export const analyticsRouter = router({
  /**
   * Track SESSION_START event
   * Triggered when user starts a new chat session
   */
  trackSessionStart: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        themeId: z.string(),
        isNewUser: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { conversationId, themeId, isNewUser } = input;

      // Calculate age group from age
      let ageGroup = "12-21";
      if (user.age) {
        if (user.age >= 12 && user.age <= 13) ageGroup = "12-13";
        else if (user.age >= 14 && user.age <= 15) ageGroup = "14-15";
        else if (user.age >= 16 && user.age <= 17) ageGroup = "16-17";
        else if (user.age >= 18 && user.age <= 21) ageGroup = "18-21";
      }

      // Extract gemeente from postal code (first 4 digits)
      const gemeente = user.postalCode ? user.postalCode.substring(0, 4) : null;

      const eventData = {
        userId: user.id,
        sessionId: conversationId,
        leeftijd: user.age,
        leeftijdsgroep: ageGroup,
        gemeente,
        is_new_user: isNewUser,
        theme: themeId,
      };

      // Send to Dashboard
      await sendEventToDashboard("SESSION_START", eventData);

      // Store in local analytics table
      try {
        const db = await getDb();
        if (!db) return { success: true };
        await db.insert(analytics).values({
          userId: user.id,
          conversationId,
          themeId: themeId as any,
          messageCount: 0,
          durationMinutes: 0,
          rewardsEarned: 0,
        });
      } catch (error) {
        console.error("[Analytics] Failed to insert session start:", error);
      }

      return { success: true };
    }),

  /**
   * Track MESSAGE_SENT event
   * Triggered every time user sends a message
   */
  trackMessageSent: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        themeId: z.string(),
        messageCount: z.number(),
        sentiment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { conversationId, themeId, messageCount, sentiment } = input;

      const eventData = {
        userId: user.id,
        sessionId: conversationId,
        theme: themeId,
        messageCount,
        sentiment,
      };

      // Send to Dashboard
      await sendEventToDashboard("MESSAGE_SENT", eventData);

      // Update message count in analytics table
      try {
        const db = await getDb();
        if (!db) return { success: true };
        const existing = await db
          .select()
          .from(analytics)
          .where(
            and(
              eq(analytics.userId, user.id),
              eq(analytics.conversationId, conversationId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(analytics)
            .set({ messageCount })
            .where(eq(analytics.id, existing[0].id));
        }
      } catch (error) {
        console.error("[Analytics] Failed to update message count:", error);
      }

      return { success: true };
    }),

  /**
   * Track RISK_DETECTED event
   * Triggered when AI detects crisis signals
   */
  trackRiskDetected: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        riskLevel: RiskLevel,
        riskType: RiskType,
        actionTaken: z.string(),
        detectedText: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { conversationId, riskLevel, riskType, actionTaken, detectedText } = input;

      const eventData = {
        userId: user.id,
        sessionId: conversationId,
        riskLevel,
        riskType,
        action_taken: actionTaken,
        detected_text: detectedText,
      };

      // Send to Dashboard
      await sendEventToDashboard("RISK_DETECTED", eventData);

      console.log(`[Analytics] RISK_DETECTED: ${riskLevel} - ${riskType} for user ${user.id}`);

      return { success: true };
    }),

  /**
   * Track SESSION_END event
   * Triggered when user closes chat or session times out
   */
  trackSessionEnd: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        durationSeconds: z.number(),
        totalMessages: z.number(),
        satisfactionScore: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { conversationId, durationSeconds, totalMessages, satisfactionScore } = input;

      const eventData = {
        userId: user.id,
        sessionId: conversationId,
        duration_seconds: durationSeconds,
        total_messages: totalMessages,
        satisfaction_score: satisfactionScore,
      };

      // Send to Dashboard
      await sendEventToDashboard("SESSION_END", eventData);

      // Update analytics table with final stats
      try {
        const db = await getDb();
        if (!db) return { success: true };
        const existing = await db
          .select()
          .from(analytics)
          .where(
            and(
              eq(analytics.userId, user.id),
              eq(analytics.conversationId, conversationId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(analytics)
            .set({
              messageCount: totalMessages,
              durationMinutes: Math.floor(durationSeconds / 60),
            })
            .where(eq(analytics.id, existing[0].id));
        }
      } catch (error) {
        console.error("[Analytics] Failed to update session end:", error);
      }

      return { success: true };
    }),

  /**
   * Track INTERVENTION_OUTCOME event
   * Triggered when a problem intervention is resolved
   */
  trackInterventionOutcome: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        initialProblem: z.string(),
        conversationCount: z.number(),
        durationDays: z.number(),
        outcome: z.enum(["unresolved", "in_progress", "resolved", "escalated"]),
        resolution: z.string().optional(),
        actionCompletionRate: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const {
        conversationId,
        initialProblem,
        conversationCount,
        durationDays,
        outcome,
        resolution,
        actionCompletionRate,
      } = input;

      const eventData = {
        userId: user.id,
        sessionId: conversationId,
        initial_problem: initialProblem,
        conversation_count: conversationCount,
        duration_days: durationDays,
        outcome,
        resolution: resolution || "",
        action_completion_rate: actionCompletionRate,
      };

      // Send to Dashboard
      await sendEventToDashboard("INTERVENTION_OUTCOME", eventData);

      console.log(`[Analytics] INTERVENTION_OUTCOME: ${initialProblem} - ${outcome} for user ${user.id}`);

      return { success: true };
    }),
});
