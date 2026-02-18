import { getTemplates, getRooms, getReportsForViewer } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReportViewerWrapper } from "@/components/report-viewer/report-viewer-wrapper";

export default async function ReportViewerPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const [templates, rooms] = await Promise.all([
    getTemplates(),
    getRooms(),
  ]);

  // Filter active templates with valid schemas
  const activeTemplates = templates
    .filter((t) => t.isActive && t.schema)
    .map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      periodType: t.periodType,
      schema: t.schema as any,
      room: t.room,
    }));

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lihat Laporan</h1>
        <p className="text-muted-foreground">
          Lihat dan analisis data laporan di berbagai periode
        </p>
      </div>

      <ReportViewerWrapper templates={activeTemplates} rooms={rooms} />
    </div>
  );
}
