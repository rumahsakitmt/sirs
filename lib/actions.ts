"use server";

import { db } from "@/lib/db";
import { room, reportTemplate, report, userRoom, user } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import type { TemplateSchema } from "@/lib/template-types";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { cache } from "react";

// ============================================
// Cached Data Fetching Functions (use React.cache for deduplication)
// ============================================

export const getRooms = cache(async () => {
  return await db.select().from(room).orderBy(room.name);
});

export const getTemplates = cache(async () => {
  return await db.select({
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
});

export const getTemplateById = cache(async (id: string) => {
  const templates = await db.select()
    .from(reportTemplate)
    .where(eq(reportTemplate.id, id))
    .leftJoin(room, eq(reportTemplate.roomId, room.id))
    .limit(1);
  
  return templates[0] || null;
});

export const getUserRooms = cache(async (userId: string) => {
  return await db.select({
    roomId: userRoom.roomId,
    assignedAt: userRoom.assignedAt,
    room: {
      id: room.id,
      name: room.name,
    },
  })
  .from(userRoom)
  .leftJoin(room, eq(userRoom.roomId, room.id))
  .where(eq(userRoom.userId, userId));
});

export const getUsers = cache(async () => {
  return await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  })
  .from(user)
  .orderBy(user.name);
});

export const getReportById = cache(async (id: string) => {
  const reports = await db.select()
    .from(report)
    .where(eq(report.id, id))
    .leftJoin(room, eq(report.roomId, room.id))
    .leftJoin(reportTemplate, eq(report.templateId, reportTemplate.id))
    .leftJoin(user, eq(report.userId, user.id))
    .limit(1);
  
  return reports[0] || null;
});

// ============================================
// Room Actions
// ============================================

export async function createRoom(name: string, description?: string) {
  const id = nanoid();
  await db.insert(room).values({
    id,
    name,
    description: description || null,
  });
  revalidatePath("/rooms");
  revalidatePath("/reports/new");
  return { id, name, description };
}

export async function updateRoom(id: string, name: string, description?: string) {
  await db.update(room)
    .set({ name, description: description || null, updatedAt: new Date() })
    .where(eq(room.id, id));
  revalidatePath("/rooms");
  revalidatePath("/reports/new");
}

export async function deleteRoom(id: string) {
  await db.delete(room).where(eq(room.id, id));
  revalidatePath("/rooms");
  revalidatePath("/reports/new");
}

// ============================================
// Template Actions
// ============================================

export async function createTemplate(
  name: string,
  roomId: string,
  type: "simple_list" | "matrix",
  periodType: "daily" | "monthly",
  schema: TemplateSchema,
  createdBy: string,
  description?: string
) {
  const id = nanoid();
  await db.insert(reportTemplate).values({
    id,
    roomId,
    name,
    description: description || null,
    type,
    periodType,
    schema: schema as any,
    createdBy,
  });
  revalidatePath("/templates");
  revalidatePath("/reports/new");
  return id;
}

export async function updateTemplate(
  id: string,
  updates: {
    name?: string;
    description?: string;
    schema?: TemplateSchema;
    isActive?: boolean;
  }
) {
  await db.update(reportTemplate)
    .set({
      ...updates,
      schema: updates.schema as any,
      updatedAt: new Date(),
    })
    .where(eq(reportTemplate.id, id));
  revalidatePath("/templates");
  revalidatePath("/reports/new");
}

export async function deleteTemplate(id: string) {
  await db.delete(reportTemplate).where(eq(reportTemplate.id, id));
  revalidatePath("/templates");
  revalidatePath("/reports/new");
}

// ============================================
// Report Actions
// ============================================

export async function getReports(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return await db.select({
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
    })
    .from(report)
    .leftJoin(room, eq(report.roomId, room.id))
    .leftJoin(reportTemplate, eq(report.templateId, reportTemplate.id))
    .leftJoin(user, eq(report.userId, user.id))
    .orderBy(desc(report.createdAt));
  } else {
    return await db.select({
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
    })
    .from(report)
    .leftJoin(room, eq(report.roomId, room.id))
    .leftJoin(reportTemplate, eq(report.templateId, reportTemplate.id))
    .leftJoin(user, eq(report.userId, user.id))
    .where(eq(report.userId, userId))
    .orderBy(desc(report.createdAt));
  }
}

export async function createReport(
  templateId: string,
  roomId: string,
  userId: string,
  periodYear: number,
  periodMonth: number,
  periodDay: number | null,
  data: Record<string, any>,
  status: "draft" | "submitted" = "draft"
) {
  const id = nanoid();
  await db.insert(report).values({
    id,
    templateId,
    roomId,
    userId,
    periodYear,
    periodMonth,
    periodDay,
    data: data as any,
    status,
    submittedAt: status === "submitted" ? new Date() : null,
  });
  revalidatePath("/reports");
  revalidatePath("/");
  return id;
}

export async function updateReport(
  id: string,
  data: Record<string, any>,
  status?: "draft" | "submitted"
) {
  const updates: any = {
    data: data as any,
    updatedAt: new Date(),
  };
  
  if (status === "submitted") {
    updates.status = "submitted";
    updates.submittedAt = new Date();
  }
  
  await db.update(report)
    .set(updates)
    .where(eq(report.id, id));
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function deleteReport(id: string) {
  await db.delete(report).where(eq(report.id, id));
  revalidatePath("/reports");
  revalidatePath("/");
}

// ============================================
// User Room Assignment Actions
// ============================================

export async function assignUserToRoom(userId: string, roomId: string) {
  await db.insert(userRoom)
    .values({ userId, roomId })
    .onConflictDoNothing();
  revalidatePath("/users");
  revalidatePath("/reports/new");
}

export async function removeUserFromRoom(userId: string, roomId: string) {
  await db.delete(userRoom)
    .where(and(
      eq(userRoom.userId, userId),
      eq(userRoom.roomId, roomId)
    ));
  revalidatePath("/users");
  revalidatePath("/reports/new");
}

// ============================================
// User Actions (Admin only)
// ============================================

export async function updateUserRole(userId: string, role: "admin" | "staff") {
  await db.update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/users");
}

export async function deleteUser(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
  revalidatePath("/users");
}

// ============================================
// Report Viewer Actions
// ============================================

export async function getReportsForViewer(
  templateId: string,
  filters?: {
    year?: number;
    month?: number;
    startDay?: number;
    endDay?: number;
    roomId?: string;
    status?: "draft" | "submitted";
  }
) {
  const conditions = [eq(report.templateId, templateId)];

  if (filters?.year) {
    conditions.push(eq(report.periodYear, filters.year));
  }

  if (filters?.month) {
    conditions.push(eq(report.periodMonth, filters.month));
  }

  if (filters?.roomId) {
    conditions.push(eq(report.roomId, filters.roomId));
  }

  if (filters?.status) {
    conditions.push(eq(report.status, filters.status));
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
  if (filters?.startDay !== undefined || filters?.endDay !== undefined) {
    return reports.filter((r) => {
      if (r.periodDay === null) return true;
      if (filters?.startDay !== undefined && r.periodDay < filters.startDay)
        return false;
      if (filters?.endDay !== undefined && r.periodDay > filters.endDay)
        return false;
      return true;
    });
  }

  return reports;
}

// ============================================
// Room Submission Status Actions
// ============================================

export interface RoomSubmissionStatus {
  room: {
    id: string;
    name: string;
  };
  templates: {
    id: string;
    name: string;
    periodType: string;
    submitted: boolean;
    reportId?: string;
    submittedAt?: Date | null;
    submittedBy?: string | null;
  }[];
  hasAllSubmitted: boolean;
  submittedCount: number;
  totalTemplates: number;
}

export async function getRoomSubmissionStatus(
  date: Date = new Date()
): Promise<RoomSubmissionStatus[]> {
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

  // Get today's/this month's submitted reports
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
  const roomStatuses: RoomSubmissionStatus[] = allRooms.map((r) => {
    // Get templates for this room (or global templates with no room)
    const roomTemplates = allTemplates.filter(
      (t) => t.roomId === r.id || t.roomId === null
    );

    const templateStatuses = roomTemplates.map((t) => {
      // Find matching submitted report
      const matchingReport = submittedReports.find((rep) => {
        const matchesTemplate = rep.templateId === t.id;
        const matchesRoom = rep.roomId === r.id;
        
        // For daily templates, check the day matches
        if (t.periodType === "daily") {
          return matchesTemplate && matchesRoom && rep.periodDay === day;
        }
        // For monthly templates, just check month/year
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

    const submittedCount = templateStatuses.filter((t) => t.submitted).length;

    return {
      room: {
        id: r.id,
        name: r.name,
      },
      templates: templateStatuses,
      hasAllSubmitted: submittedCount === templateStatuses.length && templateStatuses.length > 0,
      submittedCount,
      totalTemplates: templateStatuses.length,
    };
  });

  return roomStatuses;
}

export async function getTodaySubmissionSummary(date: Date = new Date()) {
  const statuses = await getRoomSubmissionStatus(date);
  
  const totalRooms = statuses.length;
  const roomsWithTemplates = statuses.filter((s) => s.totalTemplates > 0).length;
  const roomsFullySubmitted = statuses.filter((s) => s.hasAllSubmitted).length;
  const roomsPartiallySubmitted = statuses.filter(
    (s) => s.submittedCount > 0 && !s.hasAllSubmitted
  ).length;
  const roomsNotSubmitted = statuses.filter(
    (s) => s.submittedCount === 0 && s.totalTemplates > 0
  ).length;

  // Daily templates summary
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
    date,
    totalRooms,
    roomsWithTemplates,
    roomsFullySubmitted,
    roomsPartiallySubmitted,
    roomsNotSubmitted,
    dailySubmittedCount,
    dailyTotalCount,
    roomStatuses: statuses,
  };
}
