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
import { Plus, FileText, Edit, Eye, Printer } from "lucide-react";

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
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            View and manage your submitted reports
          </p>
        </div>
        {(isAdmin || userRooms.length > 0) && (
          <Link href="/reports/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            {reports.length} report{reports.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Template</TableHead>
                {isAdmin && <TableHead>Created By</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      {report.status === "submitted" ? "Submitted" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.submittedAt
                      ? new Date(report.submittedAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/reports/${report.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {report.status === "draft" && (
                        <Link href={`/reports/${report.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/reports/${report.id}/print`}>
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
              <p>No reports found.</p>
              {isAdmin || userRooms.length > 0 ? (
                <Link href="/reports/new">
                  <Button variant="outline" className="mt-4">
                    Create your first report
                  </Button>
                </Link>
              ) : (
                <p className="text-sm mt-2">
                  You need to be assigned to a room to create reports.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
