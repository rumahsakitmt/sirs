import { getReports, getUserRooms } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { Plus, FileText, Edit, Eye, Printer, BarChart3 } from "lucide-react";

export default async function ReportsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";
  const [reports, userRooms] = await Promise.all([
    getReports(session.user.id, isAdmin),
    isAdmin ? [] : getUserRooms(session.user.id),
  ]);

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
          {(isAdmin || userRooms.length > 0) && (
            <Link href="/dashboard/reports/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Laporan Baru
              </Button>
            </Link>
          )}
        </div>
      </div>

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
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/reports/${report.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {report.status === "draft" && (
                        <Link href={`/dashboard/reports/${report.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/dashboard/reports/${report.id}/print`}>
                        <Button variant="ghost" size="icon">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {reports.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada laporan ditemukan.</p>
              {isAdmin || userRooms.length > 0 ? (
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
