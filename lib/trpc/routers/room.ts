import { z } from "zod/v4";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../init";
import { db } from "@/lib/db";
import { room, userRoom } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const roomRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return await db.select().from(room).orderBy(room.name);
  }),

  // Returns rooms for the current user: all rooms for admins, assigned rooms for staff
  listForCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "admin") {
      return await db
        .select({ id: room.id, name: room.name })
        .from(room)
        .orderBy(room.name);
    }

    const userRooms = await db
      .select({
        id: room.id,
        name: room.name,
      })
      .from(userRoom)
      .innerJoin(room, eq(userRoom.roomId, room.id))
      .where(eq(userRoom.userId, ctx.user.id));

    return userRooms;
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Room name is required"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(room).values({
        id,
        name: input.name,
        description: input.description || null,
      });
      return { id, name: input.name, description: input.description };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Room name is required"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(room)
        .set({
          name: input.name,
          description: input.description || null,
          updatedAt: new Date(),
        })
        .where(eq(room.id, input.id));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(room).where(eq(room.id, input.id));
    }),
});
