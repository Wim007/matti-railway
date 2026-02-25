import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { routines, pushSubscriptions } from "../drizzle/schema-postgres";
import { eq, and } from "drizzle-orm";
import webpush from "web-push";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:info@slimmemaatjes.online";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export const routineRouter = router({
  // Get VAPID public key for frontend subscription
  getVapidKey: protectedProcedure.query(() => {
    return { publicKey: VAPID_PUBLIC };
  }),

  // Save push subscription
  savePushSubscription: protectedProcedure
    .input(z.object({
      subscription: z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const userId = ctx.user!.openId;
      // Upsert subscription
      const existing = await db.select().from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId)).limit(1);
      if (existing.length > 0) {
        await db.update(pushSubscriptions)
          .set({ subscription: JSON.stringify(input.subscription), updatedAt: new Date() })
          .where(eq(pushSubscriptions.userId, userId));
      } else {
        await db.insert(pushSubscriptions).values({
          userId,
          subscription: JSON.stringify(input.subscription),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      return { success: true };
    }),

  // Get routine settings for current user
  getRoutine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const userId = ctx.user!.openId;
    const result = await db.select().from(routines)
      .where(eq(routines.userId, userId)).limit(1);
    return result[0] || null;
  }),

  // Save/update routine settings
  saveRoutine: protectedProcedure
    .input(z.object({
      sleepEnabled: z.boolean(),
      bedtime: z.string(), // "22:30"
      wakeTime: z.string(), // "07:00"
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const userId = ctx.user!.openId;
      const existing = await db.select().from(routines)
        .where(eq(routines.userId, userId)).limit(1);
      if (existing.length > 0) {
        await db.update(routines)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(routines.userId, userId));
      } else {
        await db.insert(routines).values({
          userId,
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      return { success: true };
    }),

  // Record routine response (ja/nee)
  respondToRoutine: protectedProcedure
    .input(z.object({
      type: z.enum(["bedtime", "wakeup"]),
      response: z.enum(["yes", "no"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Just return the appropriate follow-up content
      if (input.response === "yes") {
        const messages = {
          bedtime: {
            message: "Super! Op tijd naar bed gaan zorgt dat je morgen uitgerust bent. Anderen merken het ook als jij energiek en fris bent — dat geeft respect.",
            tip: null,
          },
          wakeup: {
            message: "Goed gedaan! Op tijd opstaan geeft je een rustige start. Je voelt je sterker en meer in controle van je dag.",
            tip: null,
          },
        };
        return messages[input.type];
      } else {
        const messages = {
          bedtime: {
            message: "Wat ging mis vanavond?",
            tip: "Tip: Leg je telefoon 30 minuten voor bedtijd weg. Lees een boek of luister naar rustige muziek. Je hersenen hebben rust nodig om in slaap te vallen.",
            empathy: "Hoe voelt het als jij moet wachten op iemand die steeds te laat is? Anderen ervaren hetzelfde als jij onuitgerust bent.",
          },
          wakeup: {
            message: "Wat ging mis vanochtend?",
            tip: "Tip: Zet je wekker aan de andere kant van de kamer. Zo moet je opstaan om hem uit te zetten. Begin klein — één dag op tijd is al een overwinning.",
            empathy: "Hoe voelt het als jij op iemand moet wachten? Anderen merken het als jij te laat komt.",
          },
        };
        return messages[input.type];
      }
    }),
});
