import { getReportById } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import type { TemplateSchema } from "@/lib/template-types";

interface ReportData {
  report: {
    id: string;
    periodYear: number;
    periodMonth: number;
    periodDay: number | null;
    data: Record<string, Record<string, string>>;
    status: string;
    submittedAt: string | null;
    userId: string;
  };
  report_template: {
    id: string;
    name: string;
    schema: TemplateSchema;
  } | null;
  room: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string;
  } | null;
}

export default async function ViewReportPage({
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
    redirect("/dashboard/reports");
  }

  const { report: reportData, report_template: template, room, user: reportUser } = report;
  const schema = template.schema;
  
  const periodLabel = reportData.periodDay
    ? `${String(reportData.periodDay).padStart(2, '0')}/${String(reportData.periodMonth).padStart(2, '0')}/${reportData.periodYear}`
    : `${String(reportData.periodMonth).padStart(2, '0')}/${reportData.periodYear}`;

  // Helper function to render simple list data
  const renderSimpleList = () => {
    if (schema.type !== "simple_list") return null;
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-muted">
              <th className="border p-3 text-left w-16">No</th>
              <th className="border p-3 text-left">Item</th>
              {schema.valueColumns.map((col: any) => (
                <th key={col.id} className="border p-3 text-center">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schema.rows.map((row: any, index: number) => (
              <tr key={row.id} className="border-b hover:bg-muted/50">
                <td className="border p-3 text-center">{index + 1}</td>
                <td className="border p-3">{row.label}</td>
                {schema.valueColumns.map((col: any) => (
                  <td key={col.id} className="border p-3 text-center">
                    {reportData.data[row.id]?.[col.id] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper function to render matrix data
  const renderMatrix = () => {
    if (schema.type !== "matrix") return null;
    
    const getLeafColumns = (cols: any[]): any[] => {
      const leaves: any[] = [];
      for (const col of cols) {
        if (col.type === "field") {
          leaves.push(col);
        } else if (col.children) {
          leaves.push(...getLeafColumns(col.children));
        }
      }
      return leaves;
    };
    
    const leafColumns = getLeafColumns(schema.columns);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-muted">
              <th className="border p-3 text-left w-16">No</th>
              <th className="border p-3 text-left min-w-[200px]">Item</th>
              {schema.columns.map((col: any) => {
                if (col.type === "field") {
                  return (
                    <th key={col.id} className="border p-3 text-center">
                      {col.label}
                    </th>
                  );
                } else {
                  const childCols = getLeafColumns(col.children);
                  return (
                    <th 
                      key={col.id} 
                      className="border p-3 text-center" 
                      colSpan={childCols.length}
                    >
                      {col.label}
                    </th>
                  );
                }
              })}
            </tr>
            {schema.columns.some((col: any) => col.type === "group") && (
              <tr className="bg-muted/50">
                <th className="border p-3"></th>
                <th className="border p-3"></th>
                {leafColumns.map((col: any) => (
                  <th key={col.id} className="border p-3 text-center text-sm">
                    {col.label}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {schema.rows.map((row: any, index: number) => (
              <tr key={row.id} className="border-b hover:bg-muted/50">
                <td className="border p-3 text-center">{index + 1}</td>
                <td className="border p-3">{row.label}</td>
                {leafColumns.map((col: any) => (
                  <td key={col.id} className="border p-3 text-center">
                    {reportData.data[row.id]?.[col.id] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{template.name}</h1>
          <p className="text-muted-foreground mt-1">
            {room?.name || "Unknown Room"} • {periodLabel}
          </p>
        </div>
        <div className="flex gap-2">
          {reportData.status === "draft" && (
            <Link href={`/dashboard/reports/${id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          <Link href={`/dashboard/reports/${id}/print`}>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>
                Created by {reportUser?.name || "Unknown"} • Status: {" "}
                <Badge variant={reportData.status === "submitted" ? "default" : "secondary"}>
                  {reportData.status === "submitted" ? "Submitted" : "Draft"}
                </Badge>
              </CardDescription>
            </div>
            {reportData.submittedAt && (
              <p className="text-sm text-muted-foreground">
                Submitted on {new Date(reportData.submittedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schema.type === "simple_list" ? renderSimpleList() : renderMatrix()}
        </CardContent>
      </Card>
    </div>
  );
}
