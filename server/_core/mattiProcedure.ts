import { TRPCError } from "@trpc/server";
import { publicProcedure } from "./trpc";

/**
 * Matti Procedure
 * 
 * Custom procedure that uses localStorage profile ID instead of Manus OAuth
 * Extracts userId from X-Matti-User-Id header sent by frontend
 */
export const mattiProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // Extract userId from header
  const userId = ctx.req.headers["x-matti-user-id"] as string | undefined;
  
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No Matti user ID provided. Please complete onboarding first.",
    });
  }
  
  // Create a mock user object compatible with existing code
  const mattiUser = {
    id: userId,
    name: ctx.req.headers["x-matti-user-name"] as string || "Gebruiker",
    age: parseInt(ctx.req.headers["x-matti-user-age"] as string || "0") || undefined,
    gender: ctx.req.headers["x-matti-user-gender"] as "boy" | "girl" | "other" | "prefer_not_to_say" | "none" || "none",
  };
  
  return next({
    ctx: {
      ...ctx,
      user: mattiUser,
    },
  });
});
