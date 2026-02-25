import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { revokeRefreshToken, rotateRefreshToken } from "./_core/auth";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { actionRouter } from "./actionRouter";
import { analyticsRouter } from "./analyticsRouter";
import { assistantRouter } from "./assistantRouter";
import { chatRouter } from "./chatRouter";
import { followUpContextRouter } from "./followUpContextRouter";
import { feedbackRouter } from "./feedbackRouter";
import { routineRouter } from "./routineRouter";

export const appRouter = router({
  system: systemRouter,
  assistant: assistantRouter,
  chat: chatRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    refresh: publicProcedure.mutation(async ({ ctx }) => {
      const success = await rotateRefreshToken(ctx.req, ctx.res);
      return { success } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      revokeRefreshToken(ctx.user?.openId);
      ctx.res.clearCookie(ACCESS_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  action: actionRouter,
  analytics: analyticsRouter,
  followUpContext: followUpContextRouter,
  feedback: feedbackRouter,
  routine: routineRouter,
});

export type AppRouter = typeof appRouter;
