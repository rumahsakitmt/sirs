import { z } from "zod/v4";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../init";
import { db } from "@/lib/db";
import { user, userRoom, room } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const userRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    return await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(user.name);
  }),

  getUserRooms: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await db
        .select({
          roomId: userRoom.roomId,
          assignedAt: userRoom.assignedAt,
          room: {
            id: room.id,
            name: room.name,
          },
        })
        .from(userRoom)
        .leftJoin(room, eq(userRoom.roomId, room.id))
        .where(eq(userRoom.userId, input.userId));
    }),

  assignToRoom: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        roomId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .insert(userRoom)
        .values({ userId: input.userId, roomId: input.roomId })
        .onConflictDoNothing();
    }),

  removeFromRoom: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        roomId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .delete(userRoom)
        .where(
          and(
            eq(userRoom.userId, input.userId),
            eq(userRoom.roomId, input.roomId)
          )
        );
    }),

  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["admin", "staff"]),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(user)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(user.id, input.userId));
    }),

  delete: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(user).where(eq(user.id, input.userId));
    }),
});
