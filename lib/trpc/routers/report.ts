import { z } from "zod/v4";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/lib/db";
import { report, room, reportTemplate, user } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const reportRouter = createTRPCRouter({
  // Reports with template schema included (used by dashboard home page)
  listWithSchema: protectedProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.user.role === "admin";
    const baseSelect = {
      id: report.id,
      templateId: report.templateId,
      roomId: report.roomId,
      periodYear: report.periodYear,
      periodMonth: report.periodMonth,
      periodDay: report.periodDay,
      data: report.data,
      status: report.status,
      createdAt: report.createdAt,
      submittedAt: report.submittedAt,
      room: {
        id: room.id,
        name: room.name,
      },
      template: {
        id: reportTemplate.id,
        name: reportTemplate.name,
        schema: reportTemplate.schema,
        periodType: reportTemplate.periodType,
      },
      user: {
        id: user.id,
        name: user.name,
      },
    };

    if (isAdmin) {
      return await db
        .select(baseSelect)
        .from(report)
        .leftJoin(room, eq(report.roomId, room.id))
        .leftJoin(reportTemplate, eq(report.templateId, reportTemplate.id))
        .leftJoin(user, eq(report.userId, user.id))
        .orderBy(desc(report.createdAt));
    } else {
      return await db
        .select(baseSelect)
        .from(report)
        .leftJoin(room, eq(report.roomId, room.id))
        .leftJoin(reportTemplate, eq(report.templateId, reportTemplate.id))
        .leftJoin(user, eq(report.userId, user.id))
        .where(eq(report.userId, ctx.user.id))
        .orderBy(desc(report.createdAt));
    }
  }),

  list: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      })
    )
    .query(async ({ input }) => {
      const baseSelect = {
        id: report.id,
        periodYear: report.periodYear,
        periodMonth: report.periodMonth,
        periodDay: report.periodDay,
        status: report.status,
        createdAt: report.createdAt,
        submittedAt: report.submittedAt,
        room: {
          id: room.id,
          name: room.name,
        },
        template: {
          id: reportTemplate.id,
          name: reportTemplate.name,
        },
        user: {
          id: user.id,
          name: user.name,
        },
      };

      if (input.isAdmin) {
        return await db
          .select(baseSelect)
          .from(report)
          .leftJoin(room, eq(report.roomId, room.id))
          .leftJoin(reportTemplate, eq(report.templateId, reportTemplate.id))
          .leftJoin(user, eq(report.userId, user.id))
          .orderBy(desc(report.createdAt));
      } else {
        return await db
          .select(baseSelect)
          .from(report)
          .leftJoin(room, eq(report.roomId, room.id))
          .leftJoin(reportTemplate, eq(report.templateId, reportTemplate.id))
          .leftJoin(user, eq(report.userId, user.id))
          .where(eq(report.userId, input.userId))
          .orderBy(desc(report.createdAt));
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const reports = await db
        .select()
        .from(report)
        .where(eq(report.id, input.id))
        .leftJoin(room, eq(report.roomId, room.id))
        .leftJoin(reportTemplate, eq(report.templateId, reportTemplate.id))
        .leftJoin(user, eq(report.userId, user.id))
        .limit(1);

      return reports[0] || null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        roomId: z.string(),
        periodYear: z.number(),
        periodMonth: z.number(),
        periodDay: z.number().nullable(),
        data: z.record(z.string(), z.unknown()),
        status: z.enum(["draft", "submitted"]).default("draft"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = nanoid();
      await db.insert(report).values({
        id,
        templateId: input.templateId,
        roomId: input.roomId,
        userId: ctx.user.id,
        periodYear: input.periodYear,
        periodMonth: input.periodMonth,
        periodDay: input.periodDay,
        data: input.data,
        status: input.status,
        submittedAt: input.status === "submitted" ? new Date() : null,
      });
      return id;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.record(z.string(), z.unknown()),
        status: z.enum(["draft", "submitted"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(report)
        .set({
          data: input.data,
          updatedAt: new Date(),
          ...(input.status === "submitted" && {
            status: "submitted" as const,
            submittedAt: new Date(),
          }),
        })
        .where(eq(report.id, input.id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(report).where(eq(report.id, input.id));
    }),

  // Report viewer - get reports filtered for a template
  getForViewer: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        year: z.number().optional(),
        month: z.number().optional(),
        startDay: z.number().optional(),
        endDay: z.number().optional(),
        roomId: z.string().optional(),
        status: z.enum(["draft", "submitted"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(report.templateId, input.templateId)];

      if (input.year) {
        conditions.push(eq(report.periodYear, input.year));
      }
      if (input.month) {
        conditions.push(eq(report.periodMonth, input.month));
      }
      if (input.roomId) {
        conditions.push(eq(report.roomId, input.roomId));
      }
      if (input.status) {
        conditions.push(eq(report.status, input.status));
      }

      const reports = await db
        .select({
          id: report.id,
          periodYear: report.periodYear,
          periodMonth: report.periodMonth,
          periodDay: report.periodDay,
          data: report.data,
          status: report.status,
          createdAt: report.createdAt,
          submittedAt: report.submittedAt,
          room: {
            id: room.id,
            name: room.name,
          },
          user: {
            id: user.id,
            name: user.name,
          },
        })
        .from(report)
        .leftJoin(room, eq(report.roomId, room.id))
        .leftJoin(user, eq(report.userId, user.id))
        .where(and(...conditions))
        .orderBy(
          desc(report.periodYear),
          desc(report.periodMonth),
          desc(report.periodDay)
        );

      // Filter by day range if daily reports
      if (input.startDay !== undefined || input.endDay !== undefined) {
        return reports.filter((r) => {
          if (r.periodDay === null) return true;
          if (input.startDay !== undefined && r.periodDay < input.startDay)
            return false;
          if (input.endDay !== undefined && r.periodDay > input.endDay)
            return false;
          return true;
        });
      }

      return reports;
    }),

  // Room submission status
  getRoomSubmissionStatus: protectedProcedure
    .input(
      z.object({
        date: z.string().optional(), // ISO date string
      })
    )
    .query(async ({ input }) => {
      const date = input.date ? new Date(input.date) : new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Get all rooms
      const allRooms = await db.select().from(room).orderBy(room.name);

      // Get all active templates
      const allTemplates = await db
        .select({
          id: reportTemplate.id,
          name: reportTemplate.name,
          roomId: reportTemplate.roomId,
          periodType: reportTemplate.periodType,
          isActive: reportTemplate.isActive,
        })
        .from(reportTemplate)
        .where(eq(reportTemplate.isActive, true));

      // Get submitted reports for this period
      const submittedReports = await db
        .select({
          id: report.id,
          templateId: report.templateId,
          roomId: report.roomId,
          periodYear: report.periodYear,
          periodMonth: report.periodMonth,
          periodDay: report.periodDay,
          status: report.status,
          submittedAt: report.submittedAt,
          userName: user.name,
        })
        .from(report)
        .leftJoin(user, eq(report.userId, user.id))
        .where(
          and(
            eq(report.periodYear, year),
            eq(report.periodMonth, month),
            eq(report.status, "submitted")
          )
        );

      // Build room submission status
      const roomStatuses = allRooms.map((r) => {
        const roomTemplates = allTemplates.filter(
          (t) => t.roomId === r.id || t.roomId === null
        );

        const templateStatuses = roomTemplates.map((t) => {
          const matchingReport = submittedReports.find((rep) => {
            const matchesTemplate = rep.templateId === t.id;
            const matchesRoom = rep.roomId === r.id;

            if (t.periodType === "daily") {
              return matchesTemplate && matchesRoom && rep.periodDay === day;
            }
            return matchesTemplate && matchesRoom;
          });

          return {
            id: t.id,
            name: t.name,
            periodType: t.periodType,
            submitted: !!matchingReport,
            reportId: matchingReport?.id,
            submittedAt: matchingReport?.submittedAt,
            submittedBy: matchingReport?.userName,
          };
        });

        const submittedCount = templateStatuses.filter(
          (t) => t.submitted
        ).length;

        return {
          room: { id: r.id, name: r.name },
          templates: templateStatuses,
          hasAllSubmitted:
            submittedCount === templateStatuses.length &&
            templateStatuses.length > 0,
          submittedCount,
          totalTemplates: templateStatuses.length,
        };
      });

      return roomStatuses;
    }),

  // Today's submission summary
  getSubmissionSummary: protectedProcedure
    .input(
      z.object({
        date: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const date = input.date ? new Date(input.date) : new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Get all rooms
      const allRooms = await db.select().from(room).orderBy(room.name);

      // Get all active templates
      const allTemplates = await db
        .select({
          id: reportTemplate.id,
          name: reportTemplate.name,
          roomId: reportTemplate.roomId,
          periodType: reportTemplate.periodType,
          isActive: reportTemplate.isActive,
        })
        .from(reportTemplate)
        .where(eq(reportTemplate.isActive, true));

      // Get submitted reports
      const submittedReports = await db
        .select({
          id: report.id,
          templateId: report.templateId,
          roomId: report.roomId,
          periodYear: report.periodYear,
          periodMonth: report.periodMonth,
          periodDay: report.periodDay,
          status: report.status,
          submittedAt: report.submittedAt,
          userName: user.name,
        })
        .from(report)
        .leftJoin(user, eq(report.userId, user.id))
        .where(
          and(
            eq(report.periodYear, year),
            eq(report.periodMonth, month),
            eq(report.status, "submitted")
          )
        );

      const statuses = allRooms.map((r) => {
        const roomTemplates = allTemplates.filter(
          (t) => t.roomId === r.id || t.roomId === null
        );

        const templateStatuses = roomTemplates.map((t) => {
          const matchingReport = submittedReports.find((rep) => {
            const matchesTemplate = rep.templateId === t.id;
            const matchesRoom = rep.roomId === r.id;
            if (t.periodType === "daily") {
              return matchesTemplate && matchesRoom && rep.periodDay === day;
            }
            return matchesTemplate && matchesRoom;
          });

          return {
            id: t.id,
            name: t.name,
            periodType: t.periodType,
            submitted: !!matchingReport,
            reportId: matchingReport?.id,
            submittedAt: matchingReport?.submittedAt,
            submittedBy: matchingReport?.userName,
          };
        });

        const submittedCount = templateStatuses.filter(
          (t) => t.submitted
        ).length;

        return {
          room: { id: r.id, name: r.name },
          templates: templateStatuses,
          hasAllSubmitted:
            submittedCount === templateStatuses.length &&
            templateStatuses.length > 0,
          submittedCount,
          totalTemplates: templateStatuses.length,
        };
      });

      const totalRooms = statuses.length;
      const roomsWithTemplates = statuses.filter(
        (s) => s.totalTemplates > 0
      ).length;
      const roomsFullySubmitted = statuses.filter(
        (s) => s.hasAllSubmitted
      ).length;
      const roomsPartiallySubmitted = statuses.filter(
        (s) => s.submittedCount > 0 && !s.hasAllSubmitted
      ).length;
      const roomsNotSubmitted = statuses.filter(
        (s) => s.submittedCount === 0 && s.totalTemplates > 0
      ).length;

      const dailyStatuses = statuses.map((s) => ({
        ...s,
        templates: s.templates.filter((t) => t.periodType === "daily"),
      }));

      const dailySubmittedCount = dailyStatuses.reduce(
        (sum, s) => sum + s.templates.filter((t) => t.submitted).length,
        0
      );
      const dailyTotalCount = dailyStatuses.reduce(
        (sum, s) => sum + s.templates.length,
        0
      );

      return {
        date: date.toISOString(),
        totalRooms,
        roomsWithTemplates,
        roomsFullySubmitted,
        roomsPartiallySubmitted,
        roomsNotSubmitted,
        dailySubmittedCount,
        dailyTotalCount,
        roomStatuses: statuses,
      };
    }),
});
