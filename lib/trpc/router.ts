import { createTRPCRouter } from "./init";
import { roomRouter } from "./routers/room";
import { templateRouter } from "./routers/template";
import { reportRouter } from "./routers/report";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
  room: roomRouter,
  template: templateRouter,
  report: reportRouter,
  user: userRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
