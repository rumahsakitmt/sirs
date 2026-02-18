import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getReports,
  getUserRooms,
  getTodaySubmissionSummary,
} from "@/lib/actions";
import {
  FileText,
  Building2,
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }
  const isAdmin = session.user.role === "admin";

  const [reports, userRooms, submissionSummary] = await Promise.all([
    getReports(session.user.id, isAdmin),
    isAdmin ? Promise.resolve([]) : getUserRooms(session.user.id),
    isAdmin ? getTodaySubmissionSummary() : Promise.resolve(null),
  ]);

  return (
    <div className="container mx-auto py-6">
      {isAdmin && submissionSummary && (
        <div className="p-6 border border-primary bg-card mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Status Pengiriman Laporan Hari Ini
              </h3>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {submissionSummary.roomsFullySubmitted} Lengkap
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {submissionSummary.roomsPartiallySubmitted} Sebagian
              </Badge>
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {submissionSummary.roomsNotSubmitted} Tertunda
              </Badge>
            </div>
          </div>

          {submissionSummary.dailyTotalCount > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  Progres Laporan Harian
                </span>
                <span className="font-medium">
                  {submissionSummary.dailySubmittedCount} /{" "}
                  {submissionSummary.dailyTotalCount} terkirim
                </span>
              </div>
              <Progress
                value={
                  (submissionSummary.dailySubmittedCount /
                    submissionSummary.dailyTotalCount) *
                  100
                }
                className="h-2"
              />
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {submissionSummary.roomStatuses
              .filter((rs) => rs.totalTemplates > 0)
              .sort((a, b) => {
                if (a.hasAllSubmitted !== b.hasAllSubmitted) {
                  return a.hasAllSubmitted ? 1 : -1;
                }
                if (a.submittedCount !== b.submittedCount) {
                  return a.submittedCount - b.submittedCount;
                }
                return a.room.name.localeCompare(b.room.name);
              })
              .map((rs) => (
                <div
                  key={rs.room.id}
                  className={`p-4 rounded-lg border ${
                    rs.hasAllSubmitted
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                      : rs.submittedCount > 0
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900"
                        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {rs.hasAllSubmitted ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      ) : rs.submittedCount > 0 ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">{rs.room.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {rs.submittedCount}/{rs.totalTemplates}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {rs.templates
                      .filter((t) => t.periodType === "daily")
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span
                            className={
                              t.submitted
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }
                          >
                            {t.name}
                          </span>
                          {t.submitted ? (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {t.submittedAt &&
                                new Date(t.submittedAt).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                            </span>
                          ) : (
                            <span className="text-xs text-red-600">
                              Belum dikirim
                            </span>
                          )}
                        </div>
                      ))}
                    {rs.templates.filter((t) => t.periodType === "monthly")
                      .length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        Bulanan:{" "}
                        {
                          rs.templates.filter(
                            (t) => t.periodType === "monthly" && t.submitted,
                          ).length
                        }
                        /
                        {
                          rs.templates.filter((t) => t.periodType === "monthly")
                            .length
                        }{" "}
                        terkirim
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {submissionSummary.roomStatuses.filter((rs) => rs.totalTemplates > 0)
            .length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada ruangan dengan template aktif</p>
              <p className="text-sm">Buat template dan tetapkan ke ruangan</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border border-primary bg-card">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" />
            Laporan Terbaru
          </h3>
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border"
                >
                  <div>
                    <p className="font-medium">{report.template?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.room?.name} • {report.periodMonth}/
                      {report.periodYear}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      report.status === "submitted"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {report.status === "submitted" ? "Terkirim" : "Draf"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada laporan</p>
              <Link href="/dashboard/reports/new">
                <Button variant="outline" className="mt-4">
                  Buat laporan pertama
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="p-6 border border-primary bg-card space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 font-mono">
            {isAdmin ? (
              <>
                <ClipboardList className="h-5 w-5" />
                Aksi Cepat
              </>
            ) : (
              <>
                <Building2 className="h-5 w-5" />
                Ruangan Saya
              </>
            )}
          </h3>
          {isAdmin ? (
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                <Link href="/dashboard/templates/new">Buat Template Baru</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                <Link href="/dashboard/rooms">Kelola Ruangan</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                <Link href="/dashboard/users">Kelola Pengguna</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userRooms.length > 0 ? (
                userRooms.slice(0, 5).map((ur) => (
                  <div
                    key={ur.roomId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{ur.room?.name}</span>
                    </div>
                    <Link href="/dashboard/reports/new">
                      <Button size="sm" variant="ghost">
                        Laporan
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada ruangan yang ditugaskan</p>
                  <p className="text-sm">Hubungi admin untuk akses ruangan</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
