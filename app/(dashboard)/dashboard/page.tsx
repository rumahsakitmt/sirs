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
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your hospital reporting system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {submittedReports.length} submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{draftReports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting to be submitted
            </p>
          </CardContent>
        </Card>

        {isAdmin ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{templates.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active report formats
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{rooms.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hospital departments
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  My Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userRooms.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Assigned departments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quick Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/reports/new">
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    New Report
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
                  Today&apos;s Submission Status
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString("en-US", {
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
                  {submissionSummary.roomsFullySubmitted} Complete
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {submissionSummary.roomsPartiallySubmitted} Partial
                </Badge>
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {submissionSummary.roomsNotSubmitted} Pending
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Daily Progress */}
            {submissionSummary.dailyTotalCount > 0 && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Daily Reports Progress</span>
                  <span className="font-medium">
                    {submissionSummary.dailySubmittedCount} / {submissionSummary.dailyTotalCount} submitted
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
                              <span className="text-xs text-red-600">Not submitted</span>
                            )}
                          </div>
                        ))}
                      {rs.templates.filter((t) => t.periodType === "monthly").length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          Monthly: {rs.templates.filter((t) => t.periodType === "monthly" && t.submitted).length}/
                          {rs.templates.filter((t) => t.periodType === "monthly").length} submitted
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {submissionSummary.roomStatuses.filter((rs) => rs.totalTemplates > 0).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rooms with active templates</p>
                <p className="text-sm">Create templates and assign them to rooms</p>
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
              Recent Reports
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
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reports yet</p>
                <Link href="/dashboard/reports/new">
                  <Button variant="outline" className="mt-4">
                    Create your first report
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
                  Quick Actions
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5" />
                  My Rooms
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
                    Create New Template
                  </Button>
                </Link>
                <Link href="/dashboard/rooms">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    Manage Rooms
                  </Button>
                </Link>
                <Link href="/dashboard/users">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Users
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
                          Report
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No rooms assigned</p>
                    <p className="text-sm">Contact admin for room access</p>
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
