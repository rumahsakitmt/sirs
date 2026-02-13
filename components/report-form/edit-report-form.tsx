"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicReportForm } from "@/components/report-form/dynamic-report-form";
import { updateReport } from "@/lib/actions";
import type { TemplateSchema } from "@/lib/template-types";
import { ArrowLeft } from "lucide-react";

interface Template {
  id: string;
  name: string;
  schema: TemplateSchema;
  periodType: string;
}

interface Room {
  id: string;
  name: string;
}

interface InitialData {
  data: Record<string, Record<string, string>>;
  periodYear: number;
  periodMonth: number;
  periodDay: number | null;
}

interface EditReportFormProps {
  reportId: string;
  template: Template;
  room: Room;
  initialData: InitialData;
}

export function EditReportForm({
  reportId,
  template,
  room,
  initialData,
}: EditReportFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const periodLabel = initialData.periodDay
    ? `${String(initialData.periodDay).padStart(2, "0")}/${String(initialData.periodMonth).padStart(2, "0")}/${initialData.periodYear}`
    : `${String(initialData.periodMonth).padStart(2, "0")}/${initialData.periodYear}`;

  const handleSave = useCallback(
    async (data: Record<string, any>, status: "draft" | "submitted") => {
      setSaving(true);
      try {
        await updateReport(reportId, data, status);

        if (status === "submitted") {
          router.push("/reports");
        } else {
          router.push(`/reports/${reportId}`);
        }
      } catch (error) {
        console.error("Failed to save report:", error);
        alert("Failed to save report. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [reportId, router]
  );

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/reports/${reportId}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Report</h1>
          <p className="text-muted-foreground">
            {template.name} • {room.name} • {periodLabel}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Form</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicReportForm
            schema={template.schema}
            roomId={room.id}
            templateId={template.id}
            periodYear={initialData.periodYear}
            periodMonth={initialData.periodMonth}
            periodDay={initialData.periodDay || undefined}
            initialData={initialData.data}
            onSave={handleSave}
            saving={saving}
          />
        </CardContent>
      </Card>
    </div>
  );
}
