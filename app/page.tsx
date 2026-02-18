import { Header } from "@/components/header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardReportForm } from "@/components/report-form/dashboard-report-form";
import { db } from "@/lib/db";
import { report, room, reportTemplate, user, userRoom } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { cache } from "react";

const getUserRoomsData = cache(async (userId: string) => {
  return await db
    .select({
      roomId: userRoom.roomId,
      room: {
        id: room.id,
        name: room.name,
      },
    })
    .from(userRoom)
    .leftJoin(room, eq(userRoom.roomId, room.id))
    .where(eq(userRoom.userId, userId));
});

const getTemplatesData = cache(async () => {
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
});

async function getReportsWithSchema(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return await db
      .select({
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
    return await db
      .select({
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
        },
        user: {
          id: user.id,
          name: user.name,
        },
      })
      .from(report)
      .where(eq(report.userId, userId))
      .leftJoin(room, eq(report.roomId, room.id))
      .leftJoin(reportTemplate, eq(report.templateId, reportTemplate.id))
      .leftJoin(user, eq(report.userId, user.id))
      .orderBy(desc(report.createdAt));
  }
}

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";
  const userId = session.user.id;

  const [reports, userRoomsData, templatesData] = await Promise.all([
    getReportsWithSchema(userId, isAdmin),
    isAdmin
      ? db.select({ id: room.id, name: room.name }).from(room)
      : getUserRoomsData(userId).then((urs) =>
          urs.map((ur) => ur.room).filter(Boolean),
        ),
    getTemplatesData(),
  ]);

  return (
    <div>
      <Header />
      <DashboardReportForm
        reports={reports}
        rooms={userRoomsData as any}
        templates={templatesData as any}
        userId={userId}
        userName={session.user.name}
      />
    </div>
  );
}
