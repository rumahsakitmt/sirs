import { getReports, getUserRooms, getRooms, getTemplates } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReportActions } from "@/components/reports/report-actions";
import { ReportListFilters } from "@/components/report-list-filters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, BarChart3 } from "lucide-react";

export default async function ReportsPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  const roomIdFilter = searchParams?.room as string | undefined;
  const templateFilter = searchParams?.template as string | undefined;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  const [allRooms, allTemplates, userRoomsData] = await Promise.all([
    isAdmin ? getRooms() : Promise.resolve([]),
    getTemplates(),
    isAdmin ? Promise.resolve([]) : getUserRooms(session.user.id),
  ]);

  const rooms = isAdmin
    ? allRooms.map((r) => ({ id: r.id, name: r.name }))
    : userRoomsData
      .map((ur) => ur.room)
      .filter((r): r is { id: string; name: string } => r !== null);

  const filterTemplates = allTemplates.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  // Find all template IDs that match the templateName filter
  let templateIdsFilter: string[] | undefined = undefined;
  if (templateFilter) {
    templateIdsFilter = allTemplates
      .filter((t) => t.name === templateFilter)
      .map((t) => t.id);
  }

  const reports = await getReports(session.user.id, isAdmin, {
    roomId: roomIdFilter,
    templateId: templateIdsFilter,
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground">
            Lihat dan kelola laporan yang telah dikirim
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/reports/viewer">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Lihat Laporan
            </Button>
          </Link>
          {(isAdmin || userRoomsData.length > 0) && (
            <Link href="/dashboard/reports/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Laporan Baru
              </Button>
            </Link>
          )}
        </div>
      </div>

      <ReportListFilters rooms={rooms} templates={filterTemplates} />

      <Card>
        <CardHeader>
          <CardTitle>Semua Laporan</CardTitle>
          <CardDescription>
            {reports.length} laporan ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Ruangan</TableHead>
                <TableHead>Template</TableHead>
                {isAdmin && <TableHead>Dibuat Oleh</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Terkirim</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {report.periodDay
                      ? `${String(report.periodDay).padStart(2, "0")}/${String(report.periodMonth).padStart(2, "0")}/${report.periodYear}`
                      : `${String(report.periodMonth).padStart(2, "0")}/${report.periodYear}`}
                  </TableCell>
                  <TableCell>{report.room?.name || "-"}</TableCell>
                  <TableCell>{report.template?.name || "-"}</TableCell>
                  {isAdmin && <TableCell>{report.user?.name || "-"}</TableCell>}
                  <TableCell>
                    <Badge
                      variant={
                        report.status === "submitted" ? "default" : "secondary"
                      }
                    >
                      {report.status === "submitted" ? "Terkirim" : "Draf"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.submittedAt
                      ? new Date(report.submittedAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <ReportActions
                      reportId={report.id}
                      status={report.status}
                      periodLabel={
                        report.periodDay
                          ? `${String(report.periodDay).padStart(2, "0")}/${String(report.periodMonth).padStart(2, "0")}/${report.periodYear}`
                          : `${String(report.periodMonth).padStart(2, "0")}/${report.periodYear}`
                      }
                      roomName={report.room?.name || "-"}
                      templateName={report.template?.name || "-"}
                      canDelete={
                        isAdmin || report.user?.id === session.user.id
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {reports.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada laporan ditemukan.</p>
              {isAdmin || userRoomsData.length > 0 ? (
                <Link href="/dashboard/reports/new">
                  <Button variant="outline" className="mt-4">
                    Buat laporan pertama
                  </Button>
                </Link>
              ) : (
                <p className="text-sm mt-2">
                  Anda perlu ditugaskan ke ruangan untuk membuat laporan.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
