"use server";

import { db } from "@/lib/db";
import { room, reportTemplate, report, userRoom, user } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
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
