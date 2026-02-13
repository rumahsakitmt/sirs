import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getReports,
  getUserRooms,
  getTemplates,
  getRooms,
} from "@/lib/actions";
import { FileText, Building2, ClipboardList, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  // Get stats
  const [reports, userRooms, templates, rooms] = await Promise.all([
    getReports(session.user.id, isAdmin),
    isAdmin ? Promise.resolve([]) : getUserRooms(session.user.id),
    isAdmin ? getTemplates() : Promise.resolve([]),
    isAdmin ? getRooms() : Promise.resolve([]),
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
                <Link href="/reports/new">
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
                <Link href="/reports/new">
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
                <Link href="/templates/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Template
                  </Button>
                </Link>
                <Link href="/rooms">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    Manage Rooms
                  </Button>
                </Link>
                <Link href="/users">
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
                      <Link href="/reports/new">
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
