import { z } from "zod/v4";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../init";
import { db } from "@/lib/db";
import { reportTemplate, room } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { TemplateSchema } from "@/lib/template-types";

// Zod schema matching TemplateSchema union type.
// Uses z.custom for the complex recursive ColumnDefinition structure.
const templateSchemaValidator = z.custom<TemplateSchema>(
  (val) => typeof val === "object" && val !== null && "type" in val
);

export const templateRouter = createTRPCRouter({
  // Active templates with fields needed by dashboard report form
  listActive: protectedProcedure.query(async () => {
    return await db
      .select({
        id: reportTemplate.id,
        name: reportTemplate.name,
        roomId: reportTemplate.roomId,
        periodType: reportTemplate.periodType,
        schema: reportTemplate.schema,
      })
      .from(reportTemplate)
      .where(eq(reportTemplate.isActive, true));
  }),

  list: protectedProcedure.query(async () => {
    return await db
      .select({
        id: reportTemplate.id,
        name: reportTemplate.name,
        description: reportTemplate.description,
        type: reportTemplate.type,
        periodType: reportTemplate.periodType,
        schema: reportTemplate.schema,
        isActive: reportTemplate.isActive,
        createdAt: reportTemplate.createdAt,
        room: {
          id: room.id,
          name: room.name,
        },
      })
      .from(reportTemplate)
      .leftJoin(room, eq(reportTemplate.roomId, room.id))
      .orderBy(desc(reportTemplate.createdAt));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const templates = await db
        .select()
        .from(reportTemplate)
        .where(eq(reportTemplate.id, input.id))
        .leftJoin(room, eq(reportTemplate.roomId, room.id))
        .limit(1);

      return templates[0] || null;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Template name is required"),
        roomIds: z.array(z.string()).min(1, "At least one room is required"),
        type: z.enum(["simple_list", "matrix"]),
        periodType: z.enum(["daily", "monthly", "yearly"]),
        schema: templateSchemaValidator,
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ids: string[] = [];
      
      // Create a template for each selected room
      for (const roomId of input.roomIds) {
        const id = nanoid();
        await db.insert(reportTemplate).values({
          id,
          roomId,
          name: input.name,
          description: input.description || null,
          type: input.type,
          periodType: input.periodType,
          schema: input.schema,
          createdBy: ctx.user.id,
        });
        ids.push(id);
      }
      
      return ids;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        schema: templateSchemaValidator.optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await db
        .update(reportTemplate)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(reportTemplate.id, id));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(reportTemplate).where(eq(reportTemplate.id, input.id));
    }),
});
