import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getReports,
  getUserRooms,
  getTemplates,
  getRooms,
  getTodaySubmissionSummary,
} from "@/lib/actions";
import { FileText, Building2, ClipboardList, Plus, CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  // Get stats
  const [reports, userRooms, templates, rooms, submissionSummary] = await Promise.all([
    getReports(session.user.id, isAdmin),
    isAdmin ? Promise.resolve([]) : getUserRooms(session.user.id),
    isAdmin ? getTemplates() : Promise.resolve([]),
    isAdmin ? getRooms() : Promise.resolve([]),
    isAdmin ? getTodaySubmissionSummary() : Promise.resolve(null),
  ]);

  const draftReports = reports.filter((r) => r.status === "draft");
  const submittedReports = reports.filter((r) => r.status === "submitted");

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Selamat Datang, {session.user.name}</h1>
        <p className="text-muted-foreground">
          Berikut ringkasan sistem pelaporan rumah sakit Anda
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {submittedReports.length} terkirim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draf Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{draftReports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Menunggu untuk dikirim
            </p>
          </CardContent>
        </Card>

        {isAdmin ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{templates.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Format laporan aktif
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ruangan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{rooms.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Departemen rumah sakit
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ruangan Saya
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userRooms.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Departemen yang ditugaskan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aksi Cepat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/reports/new">
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Laporan Baru
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Room Submission Status - Admin Only */}
      {isAdmin && submissionSummary && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
              <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Status Pengiriman Hari Ini
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
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
          </CardHeader>
          <CardContent>
            {/* Daily Progress */}
            {submissionSummary.dailyTotalCount > 0 && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progres Laporan Harian</span>
                  <span className="font-medium">
                    {submissionSummary.dailySubmittedCount} / {submissionSummary.dailyTotalCount} terkirim
                  </span>
                </div>
                <Progress 
                  value={(submissionSummary.dailySubmittedCount / submissionSummary.dailyTotalCount) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {/* Room Status Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {submissionSummary.roomStatuses
                .filter((rs) => rs.totalTemplates > 0)
                .sort((a, b) => {
                  // Sort: pending first, then partial, then complete
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
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                        : rs.submittedCount > 0
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900"
                        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {rs.hasAllSubmitted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
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
                            <span className={t.submitted ? "text-muted-foreground" : "text-foreground"}>
                              {t.name}
                            </span>
                            {t.submitted ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {t.submittedAt && new Date(t.submittedAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            ) : (
                              <span className="text-xs text-red-600">Belum dikirim</span>
                            )}
                          </div>
                        ))}
                      {rs.templates.filter((t) => t.periodType === "monthly").length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          Bulanan: {rs.templates.filter((t) => t.periodType === "monthly" && t.submitted).length}/
                          {rs.templates.filter((t) => t.periodType === "monthly").length} terkirim
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {submissionSummary.roomStatuses.filter((rs) => rs.totalTemplates > 0).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada ruangan dengan template aktif</p>
                <p className="text-sm">Buat template dan tetapkan ke ruangan</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Laporan Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="space-y-3">
                <Link href="/dashboard/templates/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Template Baru
                  </Button>
                </Link>
                <Link href="/dashboard/rooms">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    Kelola Ruangan
                  </Button>
                </Link>
                <Link href="/dashboard/users">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Kelola Pengguna
                  </Button>
                </Link>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
