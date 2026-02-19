import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { actionRouter } from "./actionRouter";
import { analyticsRouter } from "./analyticsRouter";
import { assistantRouter } from "./assistantRouter";
import { chatRouter } from "./chatRouter";
import { followUpContextRouter } from "./followUpContextRouter";
import { feedbackRouter } from "./feedbackRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  assistant: assistantRouter,
  chat: chatRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  action: actionRouter,
  analytics: analyticsRouter,
  followUpContext: followUpContextRouter,
  feedback: feedbackRouter,
});

export type AppRouter = typeof appRouter;
