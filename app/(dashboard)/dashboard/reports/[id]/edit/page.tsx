import { getReportById } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { EditReportForm } from "@/components/report-form/edit-report-form";
import type { TemplateSchema } from "@/lib/template-types";

interface ReportData {
  report: {
    id: string;
    templateId: string;
    roomId: string;
    userId: string;
    periodYear: number;
    periodMonth: number;
    periodDay: number | null;
    data: Record<string, Record<string, string>>;
    status: string;
  };
  report_template: {
    id: string;
    name: string;
    schema: TemplateSchema;
    periodType: string;
  } | null;
  room: {
    id: string;
    name: string;
  } | null;
}

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const report = await getReportById(id) as ReportData | null;

  if (!report || !report.report_template) {
    notFound();
  }

  // Check permissions
  const isAdmin = (session.user as any).role === "admin";
  if (!isAdmin && report.report.userId !== session.user.id) {
    redirect("/reports");
  }

  // Only allow editing if report is in draft status
  if (report.report.status !== "draft") {
    redirect(`/reports/${id}`);
  }

  return (
    <EditReportForm
      reportId={id}
      template={{
        id: report.report_template.id,
        name: report.report_template.name,
        schema: report.report_template.schema,
        periodType: report.report_template.periodType,
      }}
      room={{
        id: report.room?.id || "",
        name: report.room?.name || "Unknown Room",
      }}
      initialData={{
        data: report.report.data,
        periodYear: report.report.periodYear,
        periodMonth: report.report.periodMonth,
        periodDay: report.report.periodDay,
      }}
    />
  );
}
