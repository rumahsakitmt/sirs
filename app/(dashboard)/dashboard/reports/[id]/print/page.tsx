import { getReportById } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ReportPrintView } from "@/components/report-form/report-print-view";

export default async function PrintReportPage({
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

  const report = await getReportById(id);

  if (!report || !report.report_template) {
    notFound();
  }

  // Check permissions
  const isAdmin = (session.user as any).role === "admin";
  if (!isAdmin && report.report.userId !== session.user.id) {
    redirect("/reports");
  }

  const periodLabel = report.report.periodDay
    ? `${String(report.report.periodDay).padStart(2, '0')}/${String(report.report.periodMonth).padStart(2, '0')}/${report.report.periodYear}`
    : `${String(report.report.periodMonth).padStart(2, '0')}/${report.report.periodYear}`;

  return (
    <ReportPrintView
      schema={report.report_template.schema as any}
      data={report.report.data as any}
      periodLabel={periodLabel}
      roomName={report.room?.name || "Unknown Room"}
    />
  );
}
