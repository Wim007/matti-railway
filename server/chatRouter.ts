import { z } from "zod";
import { router } from "./_core/trpc";
import { mattiProcedure } from "./_core/mattiProcedure";
import { getDb } from "./db";
import { conversations } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { ThemeId } from "@shared/matti-types";
import { ENV } from "./_core/env";

/**
 * Genereer een beknopte samenvatting van een gesprek via OpenAI
 */
async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  if (!ENV.openaiApiKey || messages.length === 0) return null;
  try {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "Gebruiker" : "Matti"}: ${m.content}`)
      .join("\n");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Vat dit gesprek samen in 2-3 zinnen in het Nederlands. Beschrijf het onderwerp en de kern van het gesprek. Wees beknopt.",
          },
          { role: "user", content: transcript },
        ],
        max_tokens: 200,
        temperature: 0.5,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (e) {
    console.warn("[Archive] Summary generation failed:", e);
    return null;
  }
}

/**
 * Chat Router
 * 
 * Manages conversations, messages, and thread persistence
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

export const chatRouter = router({
  /**
   * Get or create conversation for a theme
   */
  getConversation: mattiProcedure
    .input(z.object({
      themeId: themeIdEnum,
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userId = ctx.user.id;
      const { themeId } = input;

      // Find existing ACTIVE (non-archived) conversation
      // COALESCE handles databases where isArchived column may not exist yet
      const existing = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.themeId, themeId as ThemeId),
            sql`COALESCE(${conversations.isArchived}, false) = false`
          )
        )
        .orderBy(desc(conversations.updatedAt))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      // Create new conversation
      await db.insert(conversations).values({
        userId,
        themeId: themeId as ThemeId,
        messages: [],
      });

      // Fetch the newly created conversation
      const newConversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.themeId, themeId as ThemeId)
          )
        )
        .orderBy(conversations.createdAt)
        .limit(1);

       return newConversation[0];
    }),
  /**
   * Get a specific conversation by ID (for history "Verder praten")
   */
  getConversationById: mattiProcedure
    .input(z.object({
      conversationId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user.id;
      const { conversationId } = input;
      const existing = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.id, conversationId)
          )
        )
        .limit(1);
      if (existing.length === 0) throw new Error("Conversation not found");
      return existing[0];
    }),
  /**
   * Save message to conversation
   */
  saveMessage: mattiProcedure
    .input(z.object({
      conversationId: z.number(),
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      threadId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userId = ctx.user.id;
      const { conversationId, role, content, threadId } = input;

      // Get existing conversation by ID (ensures stability across theme changes)
      const existing = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.id, conversationId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Conversation not found");
      }

      const conversation = existing[0];
      const newMessage = {
        role,
        content,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [
        ...(conversation.messages as Array<{ role: "user" | "assistant"; content: string; timestamp: string }>),
        newMessage,
      ];

      // Update conversation with new message and threadId
      const updateData: {
        messages: typeof updatedMessages;
        threadId?: string;
        updatedAt: Date;
      } = {
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      if (threadId) {
        updateData.threadId = threadId;
      }

      await db
        .update(conversations)
        .set(updateData)
        .where(eq(conversations.id, conversation.id));

      return {
        success: true,
        messageCount: updatedMessages.length,
      };
    }),

  /**
   * Get all conversations for current user
   */
  getAllConversations: mattiProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }
      const userId = ctx.user.id;
      // Haal de laatste 10 gesprekken op, inclusief volledige berichten voor teruglezen
      const convos = await db
        .select({
          id: conversations.id,
          themeId: conversations.themeId,
          summary: conversations.summary,
          messages: conversations.messages,
          updatedAt: conversations.updatedAt,
          createdAt: conversations.createdAt,
        })
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt))
        .limit(10);
      const withCounts = convos.map((convo) => {
        const msgs = (convo.messages as Array<{ role: string; content: string; timestamp: string }>) || [];
        const userMessages = msgs.filter((m) => m.role === "user");
        return {
          id: convo.id,
          themeId: convo.themeId,
          messages: msgs,
          updatedAt: convo.updatedAt,
          createdAt: convo.createdAt,
          isArchived: false, // Default false; column added via migration
          archivedAt: null,
          messageCount: msgs.length,
          userMessageCount: userMessages.length,
          // Eerste gebruikersbericht als preview-titel
          previewText: userMessages[0]?.content?.slice(0, 80) ?? null,
        };
      });
      return withCounts;
    }),

  /**
   * Update conversation summary
   */
  updateSummary: mattiProcedure
    .input(z.object({
      themeId: themeIdEnum,
      summary: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userId = ctx.user.id;
      const { themeId, summary } = input;

      await db
        .update(conversations)
        .set({
          summary,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.themeId, themeId as ThemeId)
          )
        );

      return { success: true };
    }),

  /**
   * Schedule bullying follow-up (3 days after detection)
   */
  scheduleBullyingFollowUp: mattiProcedure
    .input(z.object({
      conversationId: z.number(),
      severity: z.enum(["low", "medium", "high"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { conversationId, severity } = input;

      // Update conversation with bullying metadata
      await db
        .update(conversations)
        .set({
          bullyingDetected: true,
          bullyingSeverity: severity,
          bullyingFollowUpScheduled: true,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));

      // TODO: Implement actual follow-up scheduling (push notification after 3 days)
      // This will be implemented in the next phase with push notification system

      return { success: true, followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) };
    }),

  /**
   * Update conversation outcome (when problem is resolved)
   */
  updateOutcome: mattiProcedure
    .input(z.object({
      conversationId: z.number(),
      outcome: z.enum(["unresolved", "in_progress", "resolved", "escalated"]),
      resolution: z.string().optional(),
      actionCompletionRate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { conversationId, outcome, resolution, actionCompletionRate } = input;

      const updateData: any = {
        outcome,
        updatedAt: new Date(),
      };

      if (resolution) {
        updateData.resolution = resolution;
      }

      if (actionCompletionRate !== undefined) {
        updateData.actionCompletionRate = actionCompletionRate;
      }

      if (outcome === "resolved") {
        updateData.interventionEndDate = new Date();
      }

      await db
        .update(conversations)
        .set(updateData)
        .where(eq(conversations.id, conversationId));

      return { success: true };
    }),

  /**
   * Initialize intervention (when problem is first detected)
   */
  initializeIntervention: mattiProcedure
    .input(z.object({
      conversationId: z.number(),
      initialProblem: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { conversationId, initialProblem } = input;

      await db
        .update(conversations)
        .set({
          initialProblem,
          interventionStartDate: new Date(),
          outcome: "in_progress",
          conversationCount: 1,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));

      return { success: true };
    }),

  /**
   * Increment conversation count (for follow-ups)
   */
  incrementConversationCount: mattiProcedure
    .input(z.object({
      conversationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { conversationId } = input;

      await db
        .update(conversations)
        .set({
          conversationCount: sql`${conversations.conversationCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));

      return { success: true };
    }),

  /**
   * Sluit het actieve gesprek af en maak een nieuw aan (bij 30 min inactiviteit)
   * Genereert automatisch een samenvatting voor caching.
   */
  closeAndStartNew: mattiProcedure
    .input(z.object({
      themeId: themeIdEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user.id;
      const { themeId } = input;

      // Haal het actieve gesprek op
      const existing = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.themeId, themeId as ThemeId),
            sql`COALESCE(${conversations.isArchived}, false) = false`
          )
        )
        .orderBy(desc(conversations.updatedAt))
        .limit(1);

      if (existing.length > 0) {
        const convo = existing[0];
        const msgs = (convo.messages as Array<{ role: string; content: string }>) || [];
        const userMessages = msgs.filter((m) => m.role === "user");

        if (userMessages.length > 0) {
          // Genereer samenvatting voor caching als die er nog niet is
          let finalSummary = convo.summary;
          if (!finalSummary) {
            finalSummary = await generateConversationSummary(msgs);
          }
          await db
            .update(conversations)
            .set({
              isArchived: true,
              archivedAt: new Date(),
              ...(finalSummary ? { summary: finalSummary } : {}),
              updatedAt: new Date(),
            })
            .where(eq(conversations.id, convo.id));

          // Verwijder oudste gesprekken als er meer dan 10 zijn
          const allConvos = await db
            .select({ id: conversations.id })
            .from(conversations)
            .where(eq(conversations.userId, userId))
            .orderBy(desc(conversations.updatedAt));
          if (allConvos.length > 10) {
            const toDelete = allConvos.slice(10).map((c) => c.id);
            for (const id of toDelete) {
              await db.delete(conversations).where(eq(conversations.id, id));
            }
          }
        } else {
          // Leeg gesprek: gewoon verwijderen, niet archiveren
          await db.delete(conversations).where(eq(conversations.id, convo.id));
        }
      }

      // Maak nieuw gesprek aan
      await db.insert(conversations).values({
        userId,
        themeId: themeId as ThemeId,
        messages: [],
      });

      return { success: true };
    }),

  /**
   * Archive conversation with summary (bij inactiviteits-reset)
   */
  archiveConversation: mattiProcedure
    .input(z.object({
      themeId: themeIdEnum,
      summary: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user.id;
      const { themeId, summary } = input;

      // Haal het actieve gesprek op
      const existing = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.themeId, themeId as ThemeId),
            sql`COALESCE(${conversations.isArchived}, false) = false`
          )
        )
        .orderBy(desc(conversations.updatedAt))
        .limit(1);
      if (existing.length === 0) return { success: true }; // Niets te archiverenn

      const convo = existing[0];
      const messages = (convo.messages as Array<{ role: string; content: string }>) || [];

      // Sla alleen op als er echte berichten zijn (niet alleen de welkomstboodschap)
      const userMessages = messages.filter((m) => m.role === "user");
      if (userMessages.length === 0) return { success: true };

      // Genereer samenvatting als die er nog niet is
      let finalSummary = summary || convo.summary;
      if (!finalSummary) {
        finalSummary = await generateConversationSummary(messages);
      }

      await db
        .update(conversations)
        .set({
          isArchived: true,
          archivedAt: new Date(),
          ...(finalSummary ? { summary: finalSummary } : {}),
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, convo.id));

      return { success: true };
    }),

  /**
   * Delete conversation (for "Nieuw Gesprek" - creates fresh start)
   */
  deleteConversation: mattiProcedure
    .input(z.object({
      themeId: themeIdEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userId = ctx.user.id;
      const { themeId } = input;

      await db
        .delete(conversations)
        .where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.themeId, themeId as ThemeId)
          )
        );

      return { success: true };
    }),
});

export type ChatRouter = typeof chatRouter;
