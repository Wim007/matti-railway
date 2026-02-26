import { z } from "zod";
import { router } from "./_core/trpc";
import { mattiProcedure } from "./_core/mattiProcedure";
import { getDb } from "./db";
import { goals, actions, followUps } from "../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { ENV } from "./_core/env";

/**
 * Goals Router
 *
 * Manages the Goals layer above Actions.
 * Goal lifecycle: draft → active → completed
 * Actions within a goal are activated sequentially (one at a time).
 */

const goalTypeEnum = z.enum([
  "sleep",
  "procrastination",
  "planning",
  "confidence",
  "bullying",
  "mental_rest",
  "custom",
]);

// Intelligent follow-up intervals for goal actions (Day 2, 4)
// Max 2 reminders per active step
const GOAL_FOLLOW_UP_INTERVALS = [2, 4];

/**
 * Call OpenAI to generate a goal plan (JSON)
 */
async function generateGoalPlan(
  goalTitle: string,
  goalType: string,
  clarificationContext: string
): Promise<{ intro: string; steps: Array<{ sequence: number; actionText: string }> }> {
  const prompt = `Je bent Matti, een coachende AI voor jongeren (12-21 jaar).

Een jongere heeft het volgende doel gekozen: "${goalTitle}" (type: ${goalType}).

Verhelderingscontext uit het gesprek:
${clarificationContext}

Genereer een concreet stappenplan als JSON. Regels:
- 5 tot 8 stappen
- Elke stap is één concrete actie
- Begin elke actie met een werkwoord (bijv. "Schrijf", "Praat", "Oefen")
- Max 100 tekens per actie
- Geen lange uitleg, alleen de actie zelf
- Intro: max 2 bemoedigende zinnen

Geef ALLEEN geldige JSON terug, geen markdown, geen uitleg:
{
  "intro": "...",
  "steps": [
    { "sequence": 1, "actionText": "..." },
    { "sequence": 2, "actionText": "..." }
  ]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content ?? "";

  // Strip markdown code blocks if present
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

/**
 * Schedule follow-ups for a newly activated goal action
 */
async function scheduleGoalActionFollowUps(db: any, actionId: number): Promise<void> {
  const now = new Date();
  for (const intervalDays of GOAL_FOLLOW_UP_INTERVALS) {
    const scheduledFor = new Date(now);
    // Schedule at 18:00 local time (server UTC — acceptable for MVP)
    scheduledFor.setDate(scheduledFor.getDate() + intervalDays);
    scheduledFor.setHours(18, 0, 0, 0);
    await db.insert(followUps).values({
      actionId,
      scheduledFor,
      status: "pending",
    });
  }
}

export const goalsRouter = router({
  /**
   * Start a new goal in draft status.
   * Called when user selects a goal type from the UI.
   * Does NOT create actions yet — that happens in finalizeGoalWithPlan.
   */
  startDraftGoal: mattiProcedure
    .input(
      z.object({
        goalType: goalTypeEnum,
        customText: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user.id;
      const { goalType, customText } = input;

      // Map goalType to a readable title
      const titleMap: Record<string, string> = {
        sleep: "Beter slapen",
        procrastination: "Minder uitstellen",
        planning: "Beter plannen",
        confidence: "Meer zelfvertrouwen",
        bullying: "Omgaan met pesten",
        mental_rest: "Meer rust in mijn hoofd",
        custom: customText ?? "Eigen doel",
      };

      const title = titleMap[goalType] ?? customText ?? "Eigen doel";

      const inserted = await db
        .insert(goals)
        .values({
          userId,
          title,
          description: customText ?? null,
          status: "draft",
          goalType,
        })
        .returning({ id: goals.id });

      const goalId = inserted[0]?.id;
      if (!goalId) throw new Error("Failed to create goal");

      console.log(`[Goals] Draft goal created: #${goalId} (${goalType}) for user ${userId}`);
      return { success: true, goalId, title, goalType };
    }),

  /**
   * Finalize a draft goal: generate AI plan, create actions, activate first step.
   * Called after AI clarification phase is complete.
   */
  finalizeGoalWithPlan: mattiProcedure
    .input(
      z.object({
        goalId: z.number(),
        clarificationContext: z.string(), // Summary of clarification Q&A
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = ctx.user.id;
      const { goalId, clarificationContext } = input;

      // Verify ownership and draft status
      const goalResult = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .limit(1);

      if (goalResult.length === 0) throw new Error("Goal not found or unauthorized");
      const goal = goalResult[0];
      if (goal.status !== "draft") throw new Error("Goal is not in draft status");

      // Generate plan via AI
      const plan = await generateGoalPlan(goal.title, goal.goalType, clarificationContext);

      if (!plan.steps || plan.steps.length < 2) {
        throw new Error("AI returned insufficient steps");
      }

      // Create all actions — only first step is active
      const createdActionIds: number[] = [];
      for (const step of plan.steps) {
        const isFirst = step.sequence === Math.min(...plan.steps.map((s) => s.sequence));
        const inserted = await db
          .insert(actions)
          .values({
            userId,
            themeId: "general", // Goals use general theme by default
            actionText: step.actionText,
            status: "pending",
            goalId,
            sequence: step.sequence,
            isActiveStep: isFirst,
            followUpIntervals: GOAL_FOLLOW_UP_INTERVALS,
          })
          .returning({ id: actions.id });

        const actionId = inserted[0]?.id;
        if (!actionId) throw new Error(`Failed to create action for step ${step.sequence}`);
        createdActionIds.push(actionId);

        // Schedule follow-ups only for the active (first) step
        if (isFirst) {
          await scheduleGoalActionFollowUps(db, actionId);
        }
      }

      // Activate goal
      await db
        .update(goals)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(goals.id, goalId));

      console.log(
        `[Goals] Goal #${goalId} finalized with ${plan.steps.length} steps. Active: step 1.`
      );

      return {
        success: true,
        goalId,
        intro: plan.intro,
        stepCount: plan.steps.length,
        actionIds: createdActionIds,
      };
    }),

  /**
   * Get all active goals for the current user, including current active action and progress.
   */
  getActiveGoals: mattiProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userId = ctx.user.id;

    const activeGoals = await db
      .select()
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.status, "active")));

    const result = await Promise.all(
      activeGoals.map(async (goal) => {
        const goalActions = await db
          .select()
          .from(actions)
          .where(eq(actions.goalId, goal.id))
          .orderBy(asc(actions.sequence));

        const total = goalActions.length;
        const completed = goalActions.filter((a) => a.status === "completed").length;
        const activeAction = goalActions.find((a) => a.isActiveStep === true) ?? null;

        return {
          ...goal,
          activeAction,
          progress: { completed, total },
        };
      })
    );

    return result;
  }),
});

export type GoalsRouter = typeof goalsRouter;
